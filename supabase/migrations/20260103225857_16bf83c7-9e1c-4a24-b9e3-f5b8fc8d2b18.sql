-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  message TEXT NOT NULL,
  message_ar TEXT,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_comments
CREATE POLICY "Users can view comments on tasks in their company"
ON public.task_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
    AND t.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can create comments on tasks in their company"
ON public.task_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
    AND t.company_id = get_user_company_id(auth.uid())
  )
  AND author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own comments"
ON public.task_comments
FOR UPDATE
USING (author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own comments"
ON public.task_comments
FOR DELETE
USING (author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at on comments
CREATE TRIGGER update_task_comments_updated_at
BEFORE UPDATE ON public.task_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notification on new comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_record RECORD;
  commenter_name TEXT;
  commenter_name_ar TEXT;
BEGIN
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

-- Trigger to call notification function
CREATE TRIGGER on_task_comment_created
AFTER INSERT ON public.task_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_comment();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;