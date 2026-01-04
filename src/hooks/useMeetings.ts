import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Meeting {
  id: string;
  company_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  meeting_type: string;
  status: MeetingStatus;
  start_time: string;
  end_time: string | null;
  location: string | null;
  agenda: string | null;
  decisions: string | null;
  follow_up_tasks: string | null;
  lead_id: string | null;
  client_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMeetingData {
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  meeting_type?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  agenda?: string;
  lead_id?: string;
  client_id?: string;
}

export interface UpdateMeetingData extends Partial<CreateMeetingData> {
  id: string;
  status?: MeetingStatus;
  decisions?: string;
  follow_up_tasks?: string;
}

export const useMeetings = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: meetings = [], isLoading, error } = useQuery({
    queryKey: ['meetings', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as Meeting[];
    },
    enabled: !!profile?.company_id,
  });

  const createMeeting = useMutation({
    mutationFn: async (meetingData: CreateMeetingData) => {
      if (!profile?.company_id || !profile?.id) throw new Error('No company or profile');

      const { data, error } = await supabase
        .from('meetings')
        .insert({
          ...meetingData,
          company_id: profile.company_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({ title: 'تم إنشاء الاجتماع بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في إنشاء الاجتماع', description: error.message, variant: 'destructive' });
    },
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, ...meetingData }: UpdateMeetingData) => {
      const { data, error } = await supabase
        .from('meetings')
        .update(meetingData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({ title: 'تم تحديث الاجتماع بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في تحديث الاجتماع', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({ title: 'تم حذف الاجتماع بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في حذف الاجتماع', description: error.message, variant: 'destructive' });
    },
  });

  return {
    meetings,
    isLoading,
    error,
    createMeeting: createMeeting.mutate,
    updateMeeting: updateMeeting.mutate,
    deleteMeeting: deleteMeeting.mutate,
    isCreating: createMeeting.isPending,
  };
};
