import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Department {
  id: string;
  company_id: string;
  name: string;
  name_ar?: string | null;
  head_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  head?: {
    id: string;
    full_name: string;
    full_name_ar?: string | null;
  } | null;
}

export interface CreateDepartmentData {
  name: string;
  name_ar?: string;
  head_id?: string;
  is_active?: boolean;
}

export const useDepartments = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: departments = [], isLoading, error } = useQuery({
    queryKey: ['departments', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      const { data: depts, error: deptsError } = await supabase
        .from('departments' as any)
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name', { ascending: true });

      if (deptsError) throw deptsError;
      if (!depts) return [];

      // Fetch head profiles
      const headIds = depts.map((d: any) => d.head_id).filter(Boolean);
      let headsMap: Record<string, any> = {};
      
      if (headIds.length > 0) {
        const { data: heads } = await supabase
          .from('profiles')
          .select('id, full_name, full_name_ar')
          .in('id', headIds);
        
        if (heads) {
          headsMap = heads.reduce((acc, h) => {
            acc[h.id] = h;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      return depts.map((dept: any) => ({
        ...dept,
        head: dept.head_id ? headsMap[dept.head_id] || null : null,
      })) as Department[];
    },
    enabled: !!profile?.company_id,
  });

  const createMutation = useMutation({
    mutationFn: async (deptData: CreateDepartmentData) => {
      if (!profile?.company_id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('departments' as any)
        .insert({
          ...deptData,
          company_id: profile.company_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: 'Success', description: 'Department created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...deptData }: Partial<Department> & { id: string }) => {
      const { data, error } = await supabase
        .from('departments' as any)
        .update(deptData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: 'Success', description: 'Department updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('departments' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: 'Success', description: 'Department deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    departments,
    isLoading,
    error,
    createDepartment: createMutation.mutate,
    updateDepartment: updateMutation.mutate,
    deleteDepartment: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
