-- RLS Policies for leads
CREATE POLICY "Users can view leads in their company" ON public.leads
FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Sales and admins can create leads" ON public.leads
FOR INSERT WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND
  has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'sales_staff']::app_role[])
);

CREATE POLICY "Assigned users and admins can update leads" ON public.leads
FOR UPDATE USING (
  company_id = get_user_company_id(auth.uid()) AND
  (assigned_to = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
   has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::app_role[]))
);

CREATE POLICY "Admins can delete leads" ON public.leads
FOR DELETE USING (
  company_id = get_user_company_id(auth.uid()) AND
  has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::app_role[])
);

-- RLS Policies for lead_activities
CREATE POLICY "Users can view lead activities" ON public.lead_activities
FOR SELECT USING (
  EXISTS (SELECT 1 FROM leads WHERE id = lead_id AND company_id = get_user_company_id(auth.uid()))
);

CREATE POLICY "Users can create lead activities" ON public.lead_activities
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM leads WHERE id = lead_id AND company_id = get_user_company_id(auth.uid()))
);

-- RLS Policies for meetings
CREATE POLICY "Users can view meetings in their company" ON public.meetings
FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Managers and admins can create meetings" ON public.meetings
FOR INSERT WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND
  has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'department_manager']::app_role[])
);

CREATE POLICY "Creator and admins can update meetings" ON public.meetings
FOR UPDATE USING (
  company_id = get_user_company_id(auth.uid()) AND
  (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
   has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::app_role[]))
);

CREATE POLICY "Admins can delete meetings" ON public.meetings
FOR DELETE USING (
  company_id = get_user_company_id(auth.uid()) AND
  has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::app_role[])
);

-- RLS Policies for meeting_participants
CREATE POLICY "Users can view meeting participants" ON public.meeting_participants
FOR SELECT USING (
  EXISTS (SELECT 1 FROM meetings WHERE id = meeting_id AND company_id = get_user_company_id(auth.uid()))
);

CREATE POLICY "Meeting creators can manage participants" ON public.meeting_participants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM meetings m 
    WHERE m.id = meeting_id 
    AND m.company_id = get_user_company_id(auth.uid())
    AND (m.created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
         has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::app_role[]))
  )
);

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view their chat rooms" ON public.chat_rooms
FOR SELECT USING (
  company_id = get_user_company_id(auth.uid()) AND
  (EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = id AND user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())) OR
   has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::app_role[]))
);

CREATE POLICY "Admins can create chat rooms" ON public.chat_rooms
FOR INSERT WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND
  has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'department_manager']::app_role[])
);

-- RLS Policies for chat_room_members
CREATE POLICY "Users can view room members" ON public.chat_room_members
FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND company_id = get_user_company_id(auth.uid()))
);

CREATE POLICY "Room admins can manage members" ON public.chat_room_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chat_rooms cr 
    WHERE cr.id = room_id 
    AND cr.company_id = get_user_company_id(auth.uid())
    AND (cr.created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
         has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::app_role[]))
  )
);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_room_members crm
    JOIN chat_rooms cr ON cr.id = crm.room_id
    WHERE crm.room_id = room_id 
    AND crm.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND cr.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can send messages in their rooms" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_room_members crm
    JOIN chat_rooms cr ON cr.id = crm.room_id
    WHERE crm.room_id = room_id 
    AND crm.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND cr.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can update their own messages" ON public.chat_messages
FOR UPDATE USING (
  sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- RLS Policies for client_intelligence
CREATE POLICY "Users can view client intelligence" ON public.client_intelligence
FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage client intelligence" ON public.client_intelligence
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND
  has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::app_role[])
);

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT USING (
  company_id = get_user_company_id(auth.uid()) AND
  has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::app_role[])
);

CREATE POLICY "System can create audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (true);

-- RLS Policies for decision_logs
CREATE POLICY "Users can view decision logs" ON public.decision_logs
FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage decision logs" ON public.decision_logs
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND
  has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::app_role[])
);