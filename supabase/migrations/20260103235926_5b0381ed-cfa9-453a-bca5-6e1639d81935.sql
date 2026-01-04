-- Create enums first
DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM (
    'new', 'contacted', 'interested', 'not_interested', 
    'proposal_sent', 'meeting_scheduled', 'closed_won', 'closed_lost'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.meeting_status AS ENUM (
    'scheduled', 'in_progress', 'completed', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_priority AS ENUM (
    'low', 'normal', 'high', 'urgent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;