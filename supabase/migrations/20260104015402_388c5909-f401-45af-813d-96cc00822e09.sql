-- Update leads INSERT policy to include department_manager
DROP POLICY IF EXISTS "Sales and admins can create leads" ON public.leads;

CREATE POLICY "Sales and admins can create leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  (company_id = get_user_company_id(auth.uid())) 
  AND has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'admin'::app_role, 'sales_staff'::app_role, 'department_manager'::app_role])
);

-- Also allow department_manager to update leads they're assigned to
DROP POLICY IF EXISTS "Assigned users and admins can update leads" ON public.leads;

CREATE POLICY "Assigned users and admins can update leads" 
ON public.leads 
FOR UPDATE 
USING (
  (company_id = get_user_company_id(auth.uid())) 
  AND (
    (assigned_to = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
    OR has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'admin'::app_role, 'sales_staff'::app_role, 'department_manager'::app_role])
  )
);