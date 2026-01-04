import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'not_interested' | 'proposal_sent' | 'meeting_scheduled' | 'closed_won' | 'closed_lost';

export interface Lead {
  id: string;
  company_id: string;
  name: string;
  name_ar: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  assigned_to: string | null;
  client_id: string | null;
  next_follow_up: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadData {
  name: string;
  name_ar?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: LeadStatus;
  notes?: string;
  assigned_to?: string;
  next_follow_up?: string;
}

export interface UpdateLeadData extends Partial<CreateLeadData> {
  id: string;
}

export const useLeads = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['leads', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!profile?.company_id,
  });

  const createLead = useMutation({
    mutationFn: async (leadData: CreateLeadData) => {
      if (!profile?.company_id || !profile?.id) throw new Error('No company or profile');

      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          company_id: profile.company_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'تم إنشاء العميل المحتمل بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في إنشاء العميل المحتمل', description: error.message, variant: 'destructive' });
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...leadData }: UpdateLeadData) => {
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'تم تحديث العميل المحتمل بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في تحديث العميل المحتمل', description: error.message, variant: 'destructive' });
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'تم حذف العميل المحتمل بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في حذف العميل المحتمل', description: error.message, variant: 'destructive' });
    },
  });

  return {
    leads,
    isLoading,
    error,
    createLead: createLead.mutate,
    updateLead: updateLead.mutate,
    deleteLead: deleteLead.mutate,
    isCreating: createLead.isPending,
    isUpdating: updateLead.isPending,
  };
};
