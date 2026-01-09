-- Fix Security Definer View warning by recreating as SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.profiles_secure;

CREATE VIEW public.profiles_secure 
WITH (security_invoker = true)
AS
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