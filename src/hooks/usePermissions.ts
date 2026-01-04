import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Permission categories for better organization
export const PERMISSION_CATEGORIES = {
  management: {
    labelAr: 'الإدارة',
    labelEn: 'Management',
  },
  operations: {
    labelAr: 'العمليات',
    labelEn: 'Operations',
  },
  sales: {
    labelAr: 'المبيعات',
    labelEn: 'Sales',
  },
  communication: {
    labelAr: 'التواصل',
    labelEn: 'Communication',
  },
  settings: {
    labelAr: 'الإعدادات',
    labelEn: 'Settings',
  },
};

export const AVAILABLE_PERMISSIONS = [
  // Management permissions
  { key: 'dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', path: '/dashboard', category: 'management' },
  { key: 'departments', labelAr: 'الأقسام', labelEn: 'Departments', path: '/dashboard/departments', category: 'management' },
  { key: 'employees', labelAr: 'الموظفين', labelEn: 'Employees', path: '/dashboard/employees', category: 'management' },
  { key: 'team-management', labelAr: 'إدارة الفريق', labelEn: 'Team Management', path: '/dashboard/team-management', category: 'management' },
  { key: 'balance', labelAr: 'توازن العمل', labelEn: 'Load Balance', path: '/dashboard/balance', category: 'management' },
  { key: 'delayed', labelAr: 'المهام المتأخرة', labelEn: 'Delayed Tasks', path: '/dashboard/delayed', category: 'management' },
  
  // Operations permissions
  { key: 'tasks', labelAr: 'المهام', labelEn: 'Tasks', path: '/dashboard/tasks', category: 'operations' },
  { key: 'events', labelAr: 'الأحداث', labelEn: 'Events', path: '/dashboard/events', category: 'operations' },
  { key: 'manual', labelAr: 'العناصر اليدوية', labelEn: 'Manual Items', path: '/dashboard/manual', category: 'operations' },
  { key: 'meetings', labelAr: 'الاجتماعات', labelEn: 'Meetings', path: '/dashboard/meetings', category: 'operations' },
  
  // Sales permissions
  { key: 'leads', labelAr: 'العملاء المحتملين', labelEn: 'Leads', path: '/dashboard/leads', category: 'sales' },
  { key: 'clients', labelAr: 'العملاء', labelEn: 'Clients', path: '/dashboard/clients', category: 'sales' },
  { key: 'contracts', labelAr: 'العقود', labelEn: 'Contracts', path: '/dashboard/contracts', category: 'sales' },
  
  // Communication permissions
  { key: 'chat', labelAr: 'الدردشة', labelEn: 'Chat', path: '/dashboard/chat', category: 'communication' },
  
  // Settings & AI permissions
  { key: 'ai-insights', labelAr: 'رؤى AI', labelEn: 'AI Insights', path: '/dashboard/ai-insights', category: 'settings' },
  { key: 'settings', labelAr: 'إعدادات الشركة', labelEn: 'Company Settings', path: '/dashboard/settings', category: 'settings' },
  { key: 'team', labelAr: 'إعدادات الفريق', labelEn: 'Team Settings', path: '/dashboard/team', category: 'settings' },
  { key: 'account', labelAr: 'حسابي', labelEn: 'My Account', path: '/dashboard/account', category: 'settings' },
];

// Role-based default permissions
export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  super_admin: AVAILABLE_PERMISSIONS.map(p => p.key), // All permissions
  admin: AVAILABLE_PERMISSIONS.map(p => p.key), // All permissions
  department_manager: [
    'dashboard', 'tasks', 'meetings', 'chat', 'events', 'manual',
    'employees', 'delayed', 'balance', 'account'
  ],
  sales_staff: [
    'dashboard', 'leads', 'clients', 'contracts', 'meetings', 'chat', 'account'
  ],
  employee: [
    'dashboard', 'tasks', 'meetings', 'chat', 'account'
  ],
};

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
  const role = userRole?.role || 'employee';

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
      
      // If no custom permissions, use role-based default permissions
      if (data.length === 0) {
        return ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.employee;
      }
      
      return data.map(p => p.permission);
    },
    enabled: !!profile?.id,
  });
};

// Get permissions grouped by category
export const getPermissionsByCategory = () => {
  const grouped: Record<string, typeof AVAILABLE_PERMISSIONS> = {};
  
  AVAILABLE_PERMISSIONS.forEach(permission => {
    const category = permission.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(permission);
  });
  
  return grouped;
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
