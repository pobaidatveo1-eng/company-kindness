import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { sanitizeError } from '@/lib/errorHandler';

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    full_name_ar: string | null;
    avatar_url: string | null;
  };
}

export const useComments = (taskId: string) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          author:profiles!task_comments_author_id_fkey(id, full_name, full_name_ar, avatar_url)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TaskComment[];
    },
    enabled: !!taskId,
  });

  const createComment = useMutation({
    mutationFn: async (content: string) => {
      if (!profile?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          author_id: profile.id,
          content: content.trim(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
    },
    onError: (error) => {
      toast.error(sanitizeError(error));
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
    },
    onError: (error) => {
      toast.error(sanitizeError(error));
    },
  });

  return {
    comments,
    isLoading,
    createComment: createComment.mutate,
    deleteComment: deleteComment.mutate,
    isCreating: createComment.isPending,
  };
};
