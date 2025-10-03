-- Add new timeline statuses to application_status enum
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'biro_osdma_submitted';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'biro_osdma_review';

-- Update workflows table to support new status values
-- Note: The from_status and to_status columns in workflows table already use application_status enum
-- So they will automatically support the new values once added to the enum