-- Create manual_items table for storing various manual entries
CREATE TABLE public.manual_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  type TEXT NOT NULL DEFAULT 'note',
  date DATE,
  assigned_to UUID,
  client_id UUID,
  contract_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manual_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view manual items in their company"
ON public.manual_items
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can create manual items"
ON public.manual_items
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND
  has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'admin'::app_role, 'department_manager'::app_role])
);

CREATE POLICY "Admins can update manual items"
ON public.manual_items
FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid()) AND
  has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'admin'::app_role, 'department_manager'::app_role])
);

CREATE POLICY "Admins can delete manual items"
ON public.manual_items
FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid()) AND
  has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'admin'::app_role])
);

-- Create trigger for updated_at
CREATE TRIGGER update_manual_items_updated_at
BEFORE UPDATE ON public.manual_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();