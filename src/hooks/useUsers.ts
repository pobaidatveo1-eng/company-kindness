import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  full_name_ar: string | null;
  phone: string | null;
  department: string | null;
  is_active: boolean;
  avatar_url: string | null;
  role: 'super_admin' | 'admin' | 'employee';
}

interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  fullNameAr?: string;
  role: 'admin' | 'employee';
  department?: string;
  phone?: string;
}

export const useCompanyUsers = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['company-users', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      // Get all profiles in company
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id);

      if (profilesError) throw profilesError;

      // Get all roles for these users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('company_id', profile.company_id);

      if (rolesError) throw rolesError;

      // Map roles to profiles
      const usersWithRoles: UserWithRole[] = profiles.map((p) => {
        const userRole = roles.find((r) => r.user_id === p.user_id);
        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          full_name_ar: p.full_name_ar,
          phone: p.phone,
          department: p.department,
          is_active: p.is_active ?? true,
          avatar_url: p.avatar_url,
          role: (userRole?.role as 'super_admin' | 'admin' | 'employee') || 'employee',
        };
      });

      return usersWithRoles;
    },
    enabled: !!profile?.company_id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const { data: result, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          ...data,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast({
        title: t('team.userCreated'),
        description: t('team.userCreatedDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'admin' | 'employee' }) => {
      const { data: result, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'updateRole',
          userId,
          newRole,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast({
        title: t('team.roleUpdated'),
        description: t('team.roleUpdatedDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useToggleUserActive = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ profileId, isActive }: { profileId: string; isActive: boolean }) => {
      const { data: result, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'toggleActive',
          profileId,
          isActive,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast({
        title: t('team.statusUpdated'),
        description: t('team.statusUpdatedDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ userId, profileId }: { userId: string; profileId: string }) => {
      const { data: result, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'delete',
          userId,
          profileId,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast({
        title: t('team.userDeleted'),
        description: t('team.userDeletedDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};