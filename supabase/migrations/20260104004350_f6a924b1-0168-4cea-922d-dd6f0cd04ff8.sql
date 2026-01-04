-- Create user_permissions table for granular access control
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, permission)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own permissions" ON public.user_permissions
FOR SELECT USING (
  user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage permissions" ON public.user_permissions
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND
  has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::app_role[])
);

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission = _permission
  )
$$;