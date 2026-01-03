-- Update handle_new_user function to create company and assign super_admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
  company_name_value TEXT;
BEGIN
  -- Get company name from metadata
  company_name_value := NEW.raw_user_meta_data ->> 'company_name';
  
  -- Create company if company name is provided
  IF company_name_value IS NOT NULL AND company_name_value != '' THEN
    INSERT INTO public.companies (name, name_ar)
    VALUES (company_name_value, company_name_value)
    RETURNING id INTO new_company_id;
  END IF;
  
  -- Create profile with company_id
  INSERT INTO public.profiles (user_id, full_name, full_name_ar, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'full_name_ar',
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