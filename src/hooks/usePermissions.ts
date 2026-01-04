import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const AVAILABLE_PERMISSIONS = [
  { key: 'dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', path: '/dashboard' },
  { key: 'tasks', labelAr: 'المهام', labelEn: 'Tasks', path: '/dashboard/tasks' },
  { key: 'leads', labelAr: 'العملاء المحتملين', labelEn: 'Leads', path: '/dashboard/leads' },
  { key: 'meetings', labelAr: 'الاجتماعات', labelEn: 'Meetings', path: '/dashboard/meetings' },
  { key: 'chat', labelAr: 'الدردشة', labelEn: 'Chat', path: '/dashboard/chat' },
  { key: 'clients', labelAr: 'العملاء', labelEn: 'Clients', path: '/dashboard/clients' },
  { key: 'contracts', labelAr: 'العقود', labelEn: 'Contracts', path: '/dashboard/contracts' },
  { key: 'ai-insights', labelAr: 'رؤى AI', labelEn: 'AI Insights', path: '/dashboard/ai-insights' },
  { key: 'settings', labelAr: 'الإعدادات', labelEn: 'Settings', path: '/dashboard/settings' },
  { key: 'events', labelAr: 'الأحداث', labelEn: 'Events', path: '/dashboard/events' },
  { key: 'manual', labelAr: 'العناصر اليدوية', labelEn: 'Manual Items', path: '/dashboard/manual' },
  { key: 'account', labelAr: 'حسابي', labelEn: 'My Account', path: '/dashboard/account' },
];

// Get user's permissions
export const useUserPermissions = (userId?: string) => {
  const { profile } = useAuth();
  const targetUserId = userId || profile?.id;

  return useQuery({
    queryKey: ['user-permissions', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', targetUserId);

      if (error) throw error;
      return data.map(p => p.permission);
    },
    enabled: !!targetUserId,
  });
};

// Get current user's permissions (for navigation filtering)
export const useMyPermissions = () => {
  const { profile, userRole } = useAuth();
  const role = userRole?.role;

  return useQuery({
    queryKey: ['my-permissions', profile?.id, role],
    queryFn: async () => {
      // Super admin and admin have all permissions
      if (role === 'super_admin' || role === 'admin') {
        return AVAILABLE_PERMISSIONS.map(p => p.key);
      }

      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', profile.id);

      if (error) throw error;
      
      // If no custom permissions, give default permissions
      if (data.length === 0) {
        return ['dashboard', 'chat', 'account'];
      }
      
      return data.map(p => p.permission);
    },
    enabled: !!profile?.id,
  });
};

// Update user's permissions
export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      if (!profile?.company_id) throw new Error('No company');

      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', profile.company_id);

      if (deleteError) throw deleteError;

      // Insert new permissions
      if (permissions.length > 0) {
        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(
            permissions.map(permission => ({
              user_id: userId,
              company_id: profile.company_id,
              permission,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
      toast({ title: 'تم تحديث الصلاحيات بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ في تحديث الصلاحيات', description: error.message, variant: 'destructive' });
    },
  });
};

// Check if user has permission
export const useHasPermission = (permission: string) => {
  const { data: permissions = [] } = useMyPermissions();
  return permissions.includes(permission);
};
