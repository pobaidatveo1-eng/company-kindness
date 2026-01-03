-- 1. Add DELETE policy for profiles table
CREATE POLICY "Super admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'super_admin')
);

-- 2. Update handle_new_user function with validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
  company_name_value TEXT;
  full_name_value TEXT;
BEGIN
  -- Validate and sanitize company name
  company_name_value := TRIM(NEW.raw_user_meta_data ->> 'company_name');
  
  IF company_name_value IS NOT NULL AND company_name_value != '' THEN
    -- Check length
    IF LENGTH(company_name_value) > 100 THEN
      company_name_value := LEFT(company_name_value, 100);
    END IF;
    
    INSERT INTO public.companies (name, name_ar)
    VALUES (company_name_value, company_name_value)
    RETURNING id INTO new_company_id;
  END IF;
  
  -- Validate full name
  full_name_value := TRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email));
  
  IF LENGTH(full_name_value) > 100 THEN
    full_name_value := LEFT(full_name_value, 100);
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, full_name_ar, company_id)
  VALUES (
    NEW.id,
    full_name_value,
    LEFT(TRIM(NEW.raw_user_meta_data ->> 'full_name_ar'), 100),
    new_company_id
  );
  
  -- Assign super_admin role if company was created
  IF new_company_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (NEW.id, new_company_id, 'super_admin');
  END IF;
  
  RETURN NEW;
END;
$$;