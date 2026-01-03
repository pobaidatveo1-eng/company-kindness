import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  company_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  created_by: string;
  assigned_to: string | null;
  department: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: { id: string; full_name: string; full_name_ar: string | null };
  assignee?: { id: string; full_name: string; full_name_ar: string | null } | null;
}

export interface CreateTaskData {
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  priority: TaskPriority;
  assigned_to?: string;
  department?: string;
  due_date?: string;
}

export interface UpdateTaskData {
  id: string;
  title?: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string | null;
  department?: string;
  due_date?: string | null;
}

export const useTasks = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          creator:profiles!tasks_created_by_fkey(id, full_name, full_name_ar),
          assignee:profiles!tasks_assigned_to_fkey(id, full_name, full_name_ar)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Task[];
    },
    enabled: !!profile?.company_id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!profile?.company_id) return;

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `company_id=eq.${profile.company_id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks', profile.company_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.company_id, queryClient]);

  const createTask = useMutation({
    mutationFn: async (data: CreateTaskData) => {
      if (!profile?.company_id || !profile?.id) {
        throw new Error('User not authenticated');
      }

      const insertData = {
        title: data.title,
        title_ar: data.title_ar,
        description: data.description,
        description_ar: data.description_ar,
        priority: data.priority,
        assigned_to: data.assigned_to,
        department: data.department as 'design' | 'content' | 'social_media' | 'video' | 'marketing' | 'other' | undefined,
        due_date: data.due_date,
        company_id: profile.company_id,
        created_by: profile.id,
      };

      const { data: task, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'تم إنشاء المهمة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في إنشاء المهمة', description: error.message, variant: 'destructive' });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...data }: UpdateTaskData) => {
      const updateData: {
        title?: string;
        title_ar?: string;
        description?: string;
        description_ar?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        assigned_to?: string | null;
        department?: 'design' | 'content' | 'social_media' | 'video' | 'marketing' | 'other';
        due_date?: string | null;
        completed_at?: string | null;
      } = {};

      if (data.title !== undefined) updateData.title = data.title;
      if (data.title_ar !== undefined) updateData.title_ar = data.title_ar;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.description_ar !== undefined) updateData.description_ar = data.description_ar;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.assigned_to !== undefined) updateData.assigned_to = data.assigned_to;
      if (data.department !== undefined) updateData.department = data.department as 'design' | 'content' | 'social_media' | 'video' | 'marketing' | 'other';
      if (data.due_date !== undefined) updateData.due_date = data.due_date;
      
      // Set completed_at when status changes to completed
      if (data.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (data.status) {
        updateData.completed_at = null;
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'تم تحديث المهمة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في تحديث المهمة', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'تم حذف المهمة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في حذف المهمة', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
  };
};

export const useTeamMembers = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['team-members', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, full_name_ar, department')
        .eq('company_id', profile.company_id)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });
};
