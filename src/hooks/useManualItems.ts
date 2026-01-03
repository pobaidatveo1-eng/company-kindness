import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface ManualItem {
  id: string;
  company_id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  type: string;
  date?: string | null;
  assigned_to?: string | null;
  client_id?: string | null;
  contract_id?: string | null;
  status: string;
  priority: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  assigned_profile?: {
    id: string;
    full_name: string;
    full_name_ar?: string | null;
  } | null;
  creator_profile?: {
    id: string;
    full_name: string;
    full_name_ar?: string | null;
  } | null;
}

export interface CreateManualItemData {
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  type: string;
  date?: string;
  assigned_to?: string;
  client_id?: string;
  contract_id?: string;
  status?: string;
  priority?: string;
}

export const useManualItems = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: manualItems = [], isLoading, error } = useQuery({
    queryKey: ['manual-items', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      // Fetch manual items
      const { data: items, error: itemsError } = await supabase
        .from('manual_items' as any)
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      if (!items) return [];

      // Fetch profiles for assigned_to and created_by
      const assignedIds = items.map((i: any) => i.assigned_to).filter(Boolean);
      const creatorIds = items.map((i: any) => i.created_by).filter(Boolean);
      const allProfileIds = [...new Set([...assignedIds, ...creatorIds])];

      let profilesMap: Record<string, any> = {};
      if (allProfileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, full_name_ar')
          .in('id', allProfileIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      return items.map((item: any) => ({
        ...item,
        assigned_profile: item.assigned_to ? profilesMap[item.assigned_to] || null : null,
        creator_profile: item.created_by ? profilesMap[item.created_by] || null : null,
      })) as ManualItem[];
    },
    enabled: !!profile?.company_id,
  });

  const createMutation = useMutation({
    mutationFn: async (itemData: CreateManualItemData) => {
      if (!profile?.company_id || !profile?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('manual_items' as any)
        .insert({
          ...itemData,
          company_id: profile.company_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-items'] });
      toast({
        title: 'Success',
        description: 'Manual item created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...itemData }: Partial<ManualItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('manual_items' as any)
        .update(itemData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-items'] });
      toast({
        title: 'Success',
        description: 'Manual item updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('manual_items' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-items'] });
      toast({
        title: 'Success',
        description: 'Manual item deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    manualItems,
    isLoading,
    error,
    createItem: createMutation.mutate,
    updateItem: updateMutation.mutate,
    deleteItem: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
