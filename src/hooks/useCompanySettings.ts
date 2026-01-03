import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// Types
export interface CompanyDepartment {
  id: string;
  company_id: string;
  name: string;
  name_ar: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskType {
  id: string;
  company_id: string;
  name: string;
  name_ar: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobTitle {
  id: string;
  company_id: string;
  name: string;
  name_ar: string | null;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Departments Hook
export const useCompanyDepartments = () => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const isArabic = language === 'ar';

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['company-departments', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('company_departments')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');
      if (error) throw error;
      return (data as unknown) as CompanyDepartment[];
    },
    enabled: !!profile?.company_id,
  });

  const createDepartment = useMutation({
    mutationFn: async (dept: Omit<Partial<CompanyDepartment>, 'id' | 'company_id' | 'created_at' | 'updated_at'> & { name: string }) => {
      if (!profile?.company_id) throw new Error('No company');
      const { error } = await supabase
        .from('company_departments')
        .insert({ 
          name: dept.name, 
          name_ar: dept.name_ar,
          color: dept.color,
          icon: dept.icon,
          is_active: dept.is_active,
          company_id: profile.company_id 
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-departments'] });
      toast.success(isArabic ? 'تم إضافة القسم' : 'Department added');
    },
    onError: () => toast.error(isArabic ? 'حدث خطأ' : 'Error occurred'),
  });

  const updateDepartment = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CompanyDepartment> & { id: string }) => {
      const { error } = await supabase
        .from('company_departments')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-departments'] });
      toast.success(isArabic ? 'تم تحديث القسم' : 'Department updated');
    },
    onError: () => toast.error(isArabic ? 'حدث خطأ' : 'Error occurred'),
  });

  const deleteDepartment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_departments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-departments'] });
      toast.success(isArabic ? 'تم حذف القسم' : 'Department deleted');
    },
    onError: () => toast.error(isArabic ? 'حدث خطأ' : 'Error occurred'),
  });

  return { departments, isLoading, createDepartment, updateDepartment, deleteDepartment };
};

// Task Types Hook
export const useTaskTypes = () => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const isArabic = language === 'ar';

  const { data: taskTypes = [], isLoading } = useQuery({
    queryKey: ['task-types', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('task_types')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');
      if (error) throw error;
      return (data as unknown) as TaskType[];
    },
    enabled: !!profile?.company_id,
  });

  const createTaskType = useMutation({
    mutationFn: async (type: Omit<Partial<TaskType>, 'id' | 'company_id' | 'created_at' | 'updated_at'> & { name: string }) => {
      if (!profile?.company_id) throw new Error('No company');
      const { error } = await supabase
        .from('task_types')
        .insert({ 
          name: type.name, 
          name_ar: type.name_ar,
          color: type.color,
          is_active: type.is_active,
          company_id: profile.company_id 
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-types'] });
      toast.success(isArabic ? 'تم إضافة نوع المهمة' : 'Task type added');
    },
    onError: () => toast.error(isArabic ? 'حدث خطأ' : 'Error occurred'),
  });

  const updateTaskType = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TaskType> & { id: string }) => {
      const { error } = await supabase
        .from('task_types')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-types'] });
      toast.success(isArabic ? 'تم تحديث نوع المهمة' : 'Task type updated');
    },
    onError: () => toast.error(isArabic ? 'حدث خطأ' : 'Error occurred'),
  });

  const deleteTaskType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-types'] });
      toast.success(isArabic ? 'تم حذف نوع المهمة' : 'Task type deleted');
    },
    onError: () => toast.error(isArabic ? 'حدث خطأ' : 'Error occurred'),
  });

  return { taskTypes, isLoading, createTaskType, updateTaskType, deleteTaskType };
};

// Job Titles Hook
export const useJobTitles = () => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const isArabic = language === 'ar';

  const { data: jobTitles = [], isLoading } = useQuery({
    queryKey: ['job-titles', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('job_titles')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');
      if (error) throw error;
      return (data as unknown) as JobTitle[];
    },
    enabled: !!profile?.company_id,
  });

  const createJobTitle = useMutation({
    mutationFn: async (title: Omit<Partial<JobTitle>, 'id' | 'company_id' | 'created_at' | 'updated_at'> & { name: string }) => {
      if (!profile?.company_id) throw new Error('No company');
      const { error } = await supabase
        .from('job_titles')
        .insert({ 
          name: title.name, 
          name_ar: title.name_ar,
          department_id: title.department_id,
          is_active: title.is_active,
          company_id: profile.company_id 
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-titles'] });
      toast.success(isArabic ? 'تم إضافة المسمى الوظيفي' : 'Job title added');
    },
    onError: () => toast.error(isArabic ? 'حدث خطأ' : 'Error occurred'),
  });

  const updateJobTitle = useMutation({
    mutationFn: async ({ id, ...data }: Partial<JobTitle> & { id: string }) => {
      const { error } = await supabase
        .from('job_titles')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-titles'] });
      toast.success(isArabic ? 'تم تحديث المسمى الوظيفي' : 'Job title updated');
    },
    onError: () => toast.error(isArabic ? 'حدث خطأ' : 'Error occurred'),
  });

  const deleteJobTitle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_titles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-titles'] });
      toast.success(isArabic ? 'تم حذف المسمى الوظيفي' : 'Job title deleted');
    },
    onError: () => toast.error(isArabic ? 'حدث خطأ' : 'Error occurred'),
  });

  return { jobTitles, isLoading, createJobTitle, updateJobTitle, deleteJobTitle };
};