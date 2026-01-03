-- Create dynamic departments table (to replace hardcoded departments)
CREATE TABLE public.company_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'building',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Create task types table
CREATE TABLE public.task_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  color TEXT DEFAULT '#10b981',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Create job titles/positions table
CREATE TABLE public.job_titles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  department_id UUID REFERENCES public.company_departments(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Add job_title_id to profiles
ALTER TABLE public.profiles ADD COLUMN job_title_id UUID REFERENCES public.job_titles(id) ON DELETE SET NULL;

-- Add task_type_id to tasks
ALTER TABLE public.tasks ADD COLUMN task_type_id UUID REFERENCES public.task_types(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.company_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_departments
CREATE POLICY "Users can view departments in their company"
ON public.company_departments FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage departments"
ON public.company_departments FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin')));

-- RLS Policies for task_types
CREATE POLICY "Users can view task types in their company"
ON public.task_types FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage task types"
ON public.task_types FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin')));

-- RLS Policies for job_titles
CREATE POLICY "Users can view job titles in their company"
ON public.job_titles FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage job titles"
ON public.job_titles FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin')));

-- Create triggers for updated_at
CREATE TRIGGER update_company_departments_updated_at
BEFORE UPDATE ON public.company_departments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_types_updated_at
BEFORE UPDATE ON public.task_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_titles_updated_at
BEFORE UPDATE ON public.job_titles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();