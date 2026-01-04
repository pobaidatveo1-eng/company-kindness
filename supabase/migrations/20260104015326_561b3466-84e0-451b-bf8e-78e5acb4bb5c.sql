-- Fix chat_rooms SELECT policy - wrong self-reference
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;

CREATE POLICY "Users can view their chat rooms" 
ON public.chat_rooms 
FOR SELECT 
USING (
  (company_id = get_user_company_id(auth.uid())) 
  AND (
    EXISTS (
      SELECT 1 FROM chat_room_members crm
      WHERE crm.room_id = chat_rooms.id 
      AND crm.user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
    )
    OR has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'admin'::app_role])
  )
);

-- Fix chat_messages SELECT policy - wrong self-reference
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;

CREATE POLICY "Users can view messages in their rooms" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM chat_room_members crm
    JOIN chat_rooms cr ON cr.id = crm.room_id
    WHERE crm.room_id = chat_messages.room_id 
    AND crm.user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
    AND cr.company_id = get_user_company_id(auth.uid())
  )
);

-- Fix chat_messages INSERT policy - wrong self-reference  
DROP POLICY IF EXISTS "Users can send messages in their rooms" ON public.chat_messages;

CREATE POLICY "Users can send messages in their rooms" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_room_members crm
    JOIN chat_rooms cr ON cr.id = crm.room_id
    WHERE crm.room_id = chat_messages.room_id 
    AND crm.user_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
    AND cr.company_id = get_user_company_id(auth.uid())
  )
);

-- Add policy for admins to create chat rooms and auto-add themselves as members
-- First ensure admins can also insert room members when creating rooms
DROP POLICY IF EXISTS "Room admins can manage members" ON public.chat_room_members;

CREATE POLICY "Room admins can manage members" 
ON public.chat_room_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms cr
    WHERE cr.id = chat_room_members.room_id 
    AND cr.company_id = get_user_company_id(auth.uid())
    AND (
      cr.created_by = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
      OR has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'admin'::app_role])
    )
  )
);