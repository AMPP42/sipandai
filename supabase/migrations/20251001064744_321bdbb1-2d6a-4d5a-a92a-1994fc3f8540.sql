-- Add ticket_id to chat_sessions to link with consultation tickets
ALTER TABLE public.chat_sessions ADD COLUMN ticket_id uuid REFERENCES public.consultation_tickets(id);

-- Add index for better query performance
CREATE INDEX idx_chat_sessions_ticket_id ON public.chat_sessions(ticket_id);

-- Update RLS policies for chat_sessions to check ticket status
DROP POLICY IF EXISTS "Users can create their own chat sessions" ON public.chat_sessions;

CREATE POLICY "Users can create chat sessions with approved tickets" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.consultation_tickets 
    WHERE id = ticket_id 
    AND user_id = auth.uid() 
    AND status = 'in_progress'
  )
);

CREATE POLICY "Users can view their own chat sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (user_id = auth.uid() OR officer_id = auth.uid());

CREATE POLICY "Admin pusat can view all chat sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (is_admin_pusat());

CREATE POLICY "Officers can update assigned sessions" 
ON public.chat_sessions 
FOR UPDATE 
USING (officer_id = auth.uid() OR is_admin_pusat());

-- Update chat_messages RLS to allow viewing
CREATE POLICY "Users can view messages in their sessions" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE id = session_id 
    AND (user_id = auth.uid() OR officer_id = auth.uid())
  ) OR is_admin_pusat()
);