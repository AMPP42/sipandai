-- ============================================================================
-- FASE 2: LIVE CHAT ENHANCEMENT & NOTIFICATION SYSTEM
-- ============================================================================

-- 1. Enhanced Chat Sessions Table
-- ============================================================================

-- Add new columns to chat_sessions for enhanced features
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS queue_position INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS wait_time_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for queue management
CREATE INDEX IF NOT EXISTS idx_chat_sessions_queue ON public.chat_sessions(status, queue_position, started_at) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_chat_sessions_officer_active ON public.chat_sessions(officer_id, status) WHERE status IN ('active', 'waiting');
CREATE INDEX IF NOT EXISTS idx_chat_sessions_archived ON public.chat_sessions(is_archived, archived_at);

-- 2. Officer Availability & Skills
-- ============================================================================

-- Create table for officer skills/expertise
CREATE TABLE IF NOT EXISTS public.officer_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_category TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(officer_id, skill_category, skill_name)
);

-- Enable RLS
ALTER TABLE public.officer_skills ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Officers can manage their own skills"
ON public.officer_skills FOR ALL
TO authenticated
USING (officer_id = auth.uid() OR public.is_admin_pusat())
WITH CHECK (officer_id = auth.uid() OR public.is_admin_pusat());

CREATE POLICY "Everyone can view officer skills"
ON public.officer_skills FOR SELECT
TO authenticated
USING (true);

-- Update officer_status with additional fields
ALTER TABLE public.officer_status
ADD COLUMN IF NOT EXISTS max_concurrent_chats INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS current_active_chats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_chats_handled INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Create index for officer availability
CREATE INDEX IF NOT EXISTS idx_officer_status_available ON public.officer_status(status, is_available, current_active_chats);

-- 3. Enhanced Notification System
-- ============================================================================

-- Add notification types and channels
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'info' CHECK (notification_type IN ('info', 'success', 'warning', 'error', 'chat', 'application', 'appointment')),
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS channels JSONB DEFAULT '{"app": true, "email": false, "sms": false}'::jsonb,
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS action_label TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type, recipient_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority, created_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_id, read_at) WHERE read_at IS NULL;

-- Create table for notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own preferences"
ON public.notification_preferences FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Chat Queue Management Functions
-- ============================================================================

-- Function to calculate wait time and update queue positions
CREATE OR REPLACE FUNCTION public.update_chat_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update wait times for waiting sessions
  UPDATE public.chat_sessions
  SET wait_time_seconds = EXTRACT(EPOCH FROM (now() - started_at))::INTEGER
  WHERE status = 'waiting';

  -- Update queue positions
  WITH ranked_sessions AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        ORDER BY 
          CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          started_at ASC
      ) as new_position
    FROM public.chat_sessions
    WHERE status = 'waiting'
  )
  UPDATE public.chat_sessions cs
  SET queue_position = rs.new_position
  FROM ranked_sessions rs
  WHERE cs.id = rs.id;
END;
$$;

-- Function to assign chat to available officer
CREATE OR REPLACE FUNCTION public.assign_chat_to_officer(session_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_officer UUID;
  session_topic TEXT;
BEGIN
  -- Get session topic
  SELECT topic INTO session_topic
  FROM public.chat_sessions
  WHERE id = session_id;

  -- Find best available officer based on:
  -- 1. Status = online
  -- 2. Is available
  -- 3. Has capacity (current_active_chats < max_concurrent_chats)
  -- 4. Has relevant skills (if topic is set)
  -- 5. Lowest current workload
  SELECT os.officer_id INTO assigned_officer
  FROM public.officer_status os
  LEFT JOIN public.officer_skills osk ON os.officer_id = osk.officer_id 
    AND osk.skill_category = session_topic
  WHERE os.status = 'online'
    AND os.is_available = true
    AND os.current_active_chats < os.max_concurrent_chats
  ORDER BY 
    -- Prioritize officers with relevant skills
    CASE WHEN osk.officer_id IS NOT NULL THEN 0 ELSE 1 END,
    -- Then by workload
    os.current_active_chats ASC,
    -- Then by average rating
    os.average_rating DESC
  LIMIT 1;

  -- If officer found, assign the session
  IF assigned_officer IS NOT NULL THEN
    UPDATE public.chat_sessions
    SET 
      officer_id = assigned_officer,
      status = 'active',
      assigned_at = now(),
      queue_position = 0
    WHERE id = session_id;

    -- Update officer's active chat count
    UPDATE public.officer_status
    SET 
      current_active_chats = current_active_chats + 1,
      updated_at = now()
    WHERE officer_id = assigned_officer;
  END IF;

  RETURN assigned_officer;
END;
$$;

-- Function to complete chat session
CREATE OR REPLACE FUNCTION public.complete_chat_session(session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  session_officer UUID;
  session_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get session details
  SELECT officer_id, started_at 
  INTO session_officer, session_start
  FROM public.chat_sessions
  WHERE id = session_id;

  -- Update session
  UPDATE public.chat_sessions
  SET 
    status = 'ended',
    ended_at = now(),
    session_duration_seconds = EXTRACT(EPOCH FROM (now() - started_at))::INTEGER
  WHERE id = session_id;

  -- Update officer stats if assigned
  IF session_officer IS NOT NULL THEN
    UPDATE public.officer_status
    SET 
      current_active_chats = GREATEST(0, current_active_chats - 1),
      total_chats_handled = total_chats_handled + 1,
      updated_at = now()
    WHERE officer_id = session_officer;
  END IF;
END;
$$;

-- Function to archive old chat sessions
CREATE OR REPLACE FUNCTION public.archive_old_chat_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Archive chat sessions older than 30 days
  UPDATE public.chat_sessions
  SET 
    is_archived = true,
    archived_at = now()
  WHERE 
    ended_at < (CURRENT_DATE - INTERVAL '30 days')
    AND is_archived = false;
END;
$$;

-- 5. Notification Helper Functions
-- ============================================================================

-- Function to create notification with preferences
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_type TEXT DEFAULT 'info',
  p_priority TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  notification_id UUID;
  user_prefs RECORD;
BEGIN
  -- Get user preferences for this notification type
  SELECT * INTO user_prefs
  FROM public.notification_preferences
  WHERE user_id = p_recipient_id 
    AND notification_type = p_type;

  -- If no preferences found, use defaults
  IF user_prefs IS NULL THEN
    user_prefs.app_enabled := true;
    user_prefs.email_enabled := false;
    user_prefs.sms_enabled := false;
  END IF;

  -- Create notification
  INSERT INTO public.notifications (
    recipient_id,
    title,
    body,
    notification_type,
    priority,
    action_url,
    action_label,
    channels
  ) VALUES (
    p_recipient_id,
    p_title,
    p_body,
    p_type,
    p_priority,
    p_action_url,
    p_action_label,
    jsonb_build_object(
      'app', user_prefs.app_enabled,
      'email', user_prefs.email_enabled,
      'sms', user_prefs.sms_enabled
    )
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- 6. Triggers
-- ============================================================================

-- Trigger to update chat queue on new session
CREATE OR REPLACE FUNCTION public.handle_new_chat_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update queue positions
  PERFORM public.update_chat_queue();
  
  -- Try to assign to officer immediately
  PERFORM public.assign_chat_to_officer(NEW.id);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_new_chat_session ON public.chat_sessions;
CREATE TRIGGER trigger_new_chat_session
  AFTER INSERT ON public.chat_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'waiting')
  EXECUTE FUNCTION public.handle_new_chat_session();

-- Trigger to update officer rating when session is rated
CREATE OR REPLACE FUNCTION public.update_officer_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.rating IS NOT NULL AND NEW.officer_id IS NOT NULL THEN
    -- Recalculate average rating
    UPDATE public.officer_status
    SET average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.chat_sessions
      WHERE officer_id = NEW.officer_id
        AND rating IS NOT NULL
    )
    WHERE officer_id = NEW.officer_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_officer_rating ON public.chat_sessions;
CREATE TRIGGER trigger_update_officer_rating
  AFTER UPDATE OF rating ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_officer_rating();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_officer_skills_officer ON public.officer_skills(officer_id);
CREATE INDEX IF NOT EXISTS idx_officer_skills_category ON public.officer_skills(skill_category);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON public.notification_preferences(user_id);

COMMENT ON FUNCTION public.update_chat_queue() IS 'Updates wait times and queue positions for waiting chat sessions';
COMMENT ON FUNCTION public.assign_chat_to_officer(UUID) IS 'Intelligently assigns a chat session to the best available officer';
COMMENT ON FUNCTION public.complete_chat_session(UUID) IS 'Completes a chat session and updates officer statistics';
COMMENT ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Creates a notification respecting user preferences';