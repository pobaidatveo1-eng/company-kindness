-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create task priority enum
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department department_type,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks

-- Users can view tasks in their company
CREATE POLICY "Users can view tasks in their company"
ON public.tasks
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Admins and Super Admins can create tasks
CREATE POLICY "Admins can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
);

-- Task creator or admins can update tasks
CREATE POLICY "Creator or admins can update tasks"
ON public.tasks
FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR assigned_to = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin') 
    OR has_role(auth.uid(), 'admin')
  )
);

-- Only admins can delete tasks
CREATE POLICY "Admins can delete tasks"
ON public.tasks
FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
);

-- Add trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;