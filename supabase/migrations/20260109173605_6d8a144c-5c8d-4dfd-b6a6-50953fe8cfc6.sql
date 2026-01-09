-- =====================================================
-- FIX 1: Protect employee phone numbers from exposure
-- =====================================================

-- Create a secure view that masks phone numbers for non-admin users
CREATE OR REPLACE VIEW public.profiles_secure AS
SELECT 
  id, 
  user_id, 
  company_id, 
  full_name, 
  full_name_ar,
  avatar_url, 
  department, 
  managed_department_id,
  job_title_id,
  is_active, 
  preferred_language,
  CASE 
    WHEN has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'admin'::app_role])
    THEN phone
    ELSE NULL
  END as phone,
  created_at, 
  updated_at
FROM public.profiles
WHERE company_id = get_user_company_id(auth.uid());

-- Grant access to the view
GRANT SELECT ON public.profiles_secure TO authenticated;

-- =====================================================
-- FIX 2: Restrict notification creation to system only
-- =====================================================

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a helper function to check if we're in a trigger/service context
CREATE OR REPLACE FUNCTION public.is_notification_authorized()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Service role (used by edge functions and triggers)
    current_setting('role', true) = 'service_role'
    OR
    -- Local setting set by SECURITY DEFINER functions (like notify_on_comment)
    current_setting('app.notification_authorized', true) = 'true'
  )
$$;

-- Create new restrictive INSERT policy
CREATE POLICY "Only system and triggers can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  public.is_notification_authorized()
);

-- Update notify_on_comment function to set authorization flag
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_record RECORD;
  commenter_name TEXT;
  commenter_name_ar TEXT;
BEGIN
  -- Set authorization flag for this transaction
  PERFORM set_config('app.notification_authorized', 'true', true);

  -- Get task details
  SELECT t.*, p.full_name as creator_name, p.full_name_ar as creator_name_ar
  INTO task_record
  FROM public.tasks t
  JOIN public.profiles p ON p.id = t.created_by
  WHERE t.id = NEW.task_id;

  -- Get commenter name
  SELECT full_name, full_name_ar INTO commenter_name, commenter_name_ar
  FROM public.profiles WHERE id = NEW.author_id;

  -- Notify task creator (if not the commenter)
  IF task_record.created_by != NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, reference_id, reference_type)
    VALUES (
      task_record.created_by,
      'task_comment',
      'New comment on your task',
      'تعليق جديد على مهمتك',
      commenter_name || ' commented on "' || task_record.title || '"',
      COALESCE(commenter_name_ar, commenter_name) || ' علق على "' || COALESCE(task_record.title_ar, task_record.title) || '"',
      NEW.task_id,
      'task'
    );
  END IF;

  -- Notify assignee (if different from creator and commenter)
  IF task_record.assigned_to IS NOT NULL 
     AND task_record.assigned_to != NEW.author_id 
     AND task_record.assigned_to != task_record.created_by THEN
    INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, reference_id, reference_type)
    VALUES (
      task_record.assigned_to,
      'task_comment',
      'New comment on assigned task',
      'تعليق جديد على مهمة مسندة إليك',
      commenter_name || ' commented on "' || task_record.title || '"',
      COALESCE(commenter_name_ar, commenter_name) || ' علق على "' || COALESCE(task_record.title_ar, task_record.title) || '"',
      NEW.task_id,
      'task'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create a SECURITY DEFINER function for sending notifications from edge functions
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_title_ar TEXT DEFAULT NULL,
  p_message_ar TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_priority notification_priority DEFAULT 'normal',
  p_is_urgent_call BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_notification_id UUID;
BEGIN
  -- Set authorization flag
  PERFORM set_config('app.notification_authorized', 'true', true);
  
  INSERT INTO public.notifications (
    user_id, type, title, message, title_ar, message_ar, 
    reference_id, reference_type, priority, is_urgent_call
  )
  VALUES (
    p_user_id, p_type, p_title, p_message, p_title_ar, p_message_ar,
    p_reference_id, p_reference_type, p_priority, p_is_urgent_call
  )
  RETURNING id INTO new_notification_id;
  
  RETURN new_notification_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;