-- Fix infinite recursion in chat RLS by using SECURITY DEFINER helper functions

-- Helper: current profile id
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Helper: can the current user access a room?
CREATE OR REPLACE FUNCTION public.can_access_chat_room(_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_rooms cr
    WHERE cr.id = _room_id
      AND cr.company_id = public.get_user_company_id(auth.uid())
      AND (
        public.has_any_role(auth.uid(), ARRAY['super_admin'::public.app_role, 'admin'::public.app_role])
        OR EXISTS (
          SELECT 1
          FROM public.chat_room_members crm
          WHERE crm.room_id = _room_id
            AND crm.user_id = public.get_current_profile_id()
        )
      )
  )
$$;

-- Helper: can the current user manage members of a room?
CREATE OR REPLACE FUNCTION public.can_manage_chat_room(_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_rooms cr
    WHERE cr.id = _room_id
      AND cr.company_id = public.get_user_company_id(auth.uid())
      AND (
        cr.created_by = public.get_current_profile_id()
        OR public.has_any_role(auth.uid(), ARRAY['super_admin'::public.app_role, 'admin'::public.app_role])
      )
  )
$$;

-- chat_rooms: SELECT
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can view their chat rooms"
ON public.chat_rooms
FOR SELECT
USING (public.can_access_chat_room(id));

-- chat_messages: SELECT/INSERT
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages
FOR SELECT
USING (public.can_access_chat_room(room_id));

DROP POLICY IF EXISTS "Users can send messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can send messages in their rooms"
ON public.chat_messages
FOR INSERT
WITH CHECK (public.can_access_chat_room(room_id));

-- chat_room_members: avoid referencing chat_rooms directly in policy expressions
DROP POLICY IF EXISTS "Users can view room members" ON public.chat_room_members;
CREATE POLICY "Users can view room members"
ON public.chat_room_members
FOR SELECT
USING (public.can_access_chat_room(room_id));

-- Replace broad ALL policy with explicit manage policies (USING/WITH CHECK)
DROP POLICY IF EXISTS "Room admins can manage members" ON public.chat_room_members;

CREATE POLICY "Room admins can insert members"
ON public.chat_room_members
FOR INSERT
WITH CHECK (public.can_manage_chat_room(room_id));

CREATE POLICY "Room admins can update members"
ON public.chat_room_members
FOR UPDATE
USING (public.can_manage_chat_room(room_id))
WITH CHECK (public.can_manage_chat_room(room_id));

CREATE POLICY "Room admins can delete members"
ON public.chat_room_members
FOR DELETE
USING (public.can_manage_chat_room(room_id));
