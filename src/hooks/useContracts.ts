import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Contract {
  id: string;
  company_id: string;
  client_id?: string | null;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    name_ar?: string | null;
  } | null;
}

export interface CreateContractData {
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  client_id?: string;
  value?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export const useContracts = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ['contracts', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts' as any)
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;
      if (!contractsData) return [];

      // Fetch client names
      const clientIds = contractsData.map((c: any) => c.client_id).filter(Boolean);
      let clientsMap: Record<string, any> = {};
      
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('clients' as any)
          .select('id, name, name_ar')
          .in('id', clientIds);
        
        if (clients) {
          clientsMap = clients.reduce((acc: any, c: any) => {
            acc[c.id] = c;
            return acc;
          }, {});
        }
      }

      return contractsData.map((contract: any) => ({
        ...contract,
        client: contract.client_id ? clientsMap[contract.client_id] || null : null,
      })) as Contract[];
    },
    enabled: !!profile?.company_id,
  });

  const createMutation = useMutation({
    mutationFn: async (contractData: CreateContractData) => {
      if (!profile?.company_id || !profile?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('contracts' as any)
        .insert({
          ...contractData,
          company_id: profile.company_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Success', description: 'Contract created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...contractData }: Partial<Contract> & { id: string }) => {
      const { data, error } = await supabase
        .from('contracts' as any)
        .update(contractData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Success', description: 'Contract updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contracts' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Success', description: 'Contract deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    contracts,
    isLoading,
    error,
    createContract: createMutation.mutate,
    updateContract: updateMutation.mutate,
    deleteContract: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
