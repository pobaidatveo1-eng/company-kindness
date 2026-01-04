import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Building2, Palette, Save, Loader2, Plus, Trash2, Edit, Briefcase, ClipboardList, Users, UserPlus, Shield, User, MoreHorizontal, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyDepartments, useTaskTypes, useJobTitles, CompanyDepartment, TaskType, JobTitle } from '@/hooks/useCompanySettings';
import { Badge } from '@/components/ui/badge';
import { EmployeesTab } from '@/components/settings/EmployeesTab';

const CompanySettings = () => {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isArabic = language === 'ar';

  // Company data
  const { data: company, isLoading } = useQuery({
    queryKey: ['company', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    primary_color: '#f97316',
  });

  React.useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        name_ar: company.name_ar || '',
        primary_color: company.primary_color || '#f97316',
      });
    }
  }, [company]);

  const updateCompany = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!profile?.company_id) throw new Error('No company');
      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          name_ar: data.name_ar,
          primary_color: data.primary_color,
        })
        .eq('id', profile.company_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success(isArabic ? 'تم حفظ الإعدادات' : 'Settings saved');
    },
    onError: () => {
      toast.error(isArabic ? 'حدث خطأ' : 'Error saving settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany.mutate(formData);
  };

  // Departments
  const { departments, createDepartment, updateDepartment, deleteDepartment } = useCompanyDepartments();
  const { taskTypes, createTaskType, updateTaskType, deleteTaskType } = useTaskTypes();
  const { jobTitles, createJobTitle, updateJobTitle, deleteJobTitle } = useJobTitles();

  // Dialogs state
  const [deptDialog, setDeptDialog] = useState(false);
  const [taskTypeDialog, setTaskTypeDialog] = useState(false);
  const [jobTitleDialog, setJobTitleDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // Form states
  const [newDept, setNewDept] = useState({ name: '', name_ar: '', color: '#6366f1' });
  const [newTaskType, setNewTaskType] = useState({ name: '', name_ar: '', color: '#10b981' });
  const [newJobTitle, setNewJobTitle] = useState({ name: '', name_ar: '', department_id: '' });

  const handleSaveDept = () => {
    if (!newDept.name) return;
    if (editItem) {
      updateDepartment.mutate({ id: editItem.id, ...newDept });
    } else {
      createDepartment.mutate(newDept);
    }
    setDeptDialog(false);
    setNewDept({ name: '', name_ar: '', color: '#6366f1' });
    setEditItem(null);
  };

  const handleSaveTaskType = () => {
    if (!newTaskType.name) return;
    if (editItem) {
      updateTaskType.mutate({ id: editItem.id, ...newTaskType });
    } else {
      createTaskType.mutate(newTaskType);
    }
    setTaskTypeDialog(false);
    setNewTaskType({ name: '', name_ar: '', color: '#10b981' });
    setEditItem(null);
  };

  const handleSaveJobTitle = () => {
    if (!newJobTitle.name) return;
    if (editItem) {
      updateJobTitle.mutate({ id: editItem.id, ...newJobTitle });
    } else {
      createJobTitle.mutate(newJobTitle);
    }
    setJobTitleDialog(false);
    setNewJobTitle({ name: '', name_ar: '', department_id: '' });
    setEditItem(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          {isArabic ? 'إعدادات الشركة' : 'Company Settings'}
        </h1>
        <p className="text-muted-foreground">
          {isArabic ? 'إدارة إعدادات الشركة والأقسام والوظائف' : 'Manage company settings, departments and positions'}
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4 me-2" />
            {isArabic ? 'الشركة' : 'Company'}
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 me-2" />
            {isArabic ? 'الموظفين' : 'Employees'}
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="h-4 w-4 me-2" />
            {isArabic ? 'الأقسام' : 'Departments'}
          </TabsTrigger>
          <TabsTrigger value="task-types">
            <ClipboardList className="h-4 w-4 me-2" />
            {isArabic ? 'أنواع المهام' : 'Task Types'}
          </TabsTrigger>
          <TabsTrigger value="job-titles">
            <Briefcase className="h-4 w-4 me-2" />
            {isArabic ? 'الوظائف' : 'Job Titles'}
          </TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {isArabic ? 'معلومات الشركة' : 'Company Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{isArabic ? 'اسم الشركة (English)' : 'Company Name (English)'}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_ar">{isArabic ? 'اسم الشركة (عربي)' : 'Company Name (Arabic)'}</Label>
                    <Input
                      id="name_ar"
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {isArabic ? 'العلامة التجارية' : 'Branding'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="max-w-32"
                  />
                  <div className="w-10 h-10 rounded-lg border" style={{ backgroundColor: formData.primary_color }} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateCompany.isPending}>
                {updateCompany.isPending ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
                {isArabic ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees">
          <EmployeesTab />
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{isArabic ? 'الأقسام' : 'Departments'}</CardTitle>
              <Dialog open={deptDialog} onOpenChange={setDeptDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => { setEditItem(null); setNewDept({ name: '', name_ar: '', color: '#6366f1' }); }}>
                    <Plus className="h-4 w-4 me-2" />
                    {isArabic ? 'إضافة قسم' : 'Add Department'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editItem ? (isArabic ? 'تعديل القسم' : 'Edit Department') : (isArabic ? 'إضافة قسم' : 'Add Department')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{isArabic ? 'الاسم (English)' : 'Name (English)'}</Label>
                      <Input value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isArabic ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                      <Input value={newDept.name_ar} onChange={(e) => setNewDept({ ...newDept, name_ar: e.target.value })} dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label>{isArabic ? 'اللون' : 'Color'}</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={newDept.color} onChange={(e) => setNewDept({ ...newDept, color: e.target.value })} className="w-16" />
                        <Input value={newDept.color} onChange={(e) => setNewDept({ ...newDept, color: e.target.value })} />
                      </div>
                    </div>
                    <Button onClick={handleSaveDept} className="w-full">{isArabic ? 'حفظ' : 'Save'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {departments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{isArabic ? 'لا توجد أقسام' : 'No departments'}</p>
                ) : (
                  departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: dept.color }} />
                        <span>{isArabic ? dept.name_ar || dept.name : dept.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => { setEditItem(dept); setNewDept({ name: dept.name, name_ar: dept.name_ar || '', color: dept.color }); setDeptDialog(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{isArabic ? 'حذف القسم؟' : 'Delete department?'}</AlertDialogTitle>
                              <AlertDialogDescription>{isArabic ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this department?'}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteDepartment.mutate(dept.id)}>{isArabic ? 'حذف' : 'Delete'}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Types Tab */}
        <TabsContent value="task-types">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{isArabic ? 'أنواع المهام' : 'Task Types'}</CardTitle>
              <Dialog open={taskTypeDialog} onOpenChange={setTaskTypeDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => { setEditItem(null); setNewTaskType({ name: '', name_ar: '', color: '#10b981' }); }}>
                    <Plus className="h-4 w-4 me-2" />
                    {isArabic ? 'إضافة نوع' : 'Add Type'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editItem ? (isArabic ? 'تعديل نوع المهمة' : 'Edit Task Type') : (isArabic ? 'إضافة نوع مهمة' : 'Add Task Type')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{isArabic ? 'الاسم (English)' : 'Name (English)'}</Label>
                      <Input value={newTaskType.name} onChange={(e) => setNewTaskType({ ...newTaskType, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isArabic ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                      <Input value={newTaskType.name_ar} onChange={(e) => setNewTaskType({ ...newTaskType, name_ar: e.target.value })} dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label>{isArabic ? 'اللون' : 'Color'}</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={newTaskType.color} onChange={(e) => setNewTaskType({ ...newTaskType, color: e.target.value })} className="w-16" />
                        <Input value={newTaskType.color} onChange={(e) => setNewTaskType({ ...newTaskType, color: e.target.value })} />
                      </div>
                    </div>
                    <Button onClick={handleSaveTaskType} className="w-full">{isArabic ? 'حفظ' : 'Save'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {taskTypes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{isArabic ? 'لا توجد أنواع مهام' : 'No task types'}</p>
                ) : (
                  taskTypes.map((type) => (
                    <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: type.color }} />
                        <span>{isArabic ? type.name_ar || type.name : type.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => { setEditItem(type); setNewTaskType({ name: type.name, name_ar: type.name_ar || '', color: type.color }); setTaskTypeDialog(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{isArabic ? 'حذف نوع المهمة؟' : 'Delete task type?'}</AlertDialogTitle>
                              <AlertDialogDescription>{isArabic ? 'هل أنت متأكد من حذف نوع المهمة هذا؟' : 'Are you sure you want to delete this task type?'}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTaskType.mutate(type.id)}>{isArabic ? 'حذف' : 'Delete'}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Titles Tab */}
        <TabsContent value="job-titles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{isArabic ? 'المسميات الوظيفية' : 'Job Titles'}</CardTitle>
              <Dialog open={jobTitleDialog} onOpenChange={setJobTitleDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => { setEditItem(null); setNewJobTitle({ name: '', name_ar: '', department_id: '' }); }}>
                    <Plus className="h-4 w-4 me-2" />
                    {isArabic ? 'إضافة وظيفة' : 'Add Job Title'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editItem ? (isArabic ? 'تعديل الوظيفة' : 'Edit Job Title') : (isArabic ? 'إضافة وظيفة' : 'Add Job Title')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{isArabic ? 'الاسم (English)' : 'Name (English)'}</Label>
                      <Input value={newJobTitle.name} onChange={(e) => setNewJobTitle({ ...newJobTitle, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isArabic ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                      <Input value={newJobTitle.name_ar} onChange={(e) => setNewJobTitle({ ...newJobTitle, name_ar: e.target.value })} dir="rtl" />
                    </div>
                    <Button onClick={handleSaveJobTitle} className="w-full">{isArabic ? 'حفظ' : 'Save'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {jobTitles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{isArabic ? 'لا توجد وظائف' : 'No job titles'}</p>
                ) : (
                  jobTitles.map((title) => (
                    <div key={title.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span>{isArabic ? title.name_ar || title.name : title.name}</span>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => { setEditItem(title); setNewJobTitle({ name: title.name, name_ar: title.name_ar || '', department_id: title.department_id || '' }); setJobTitleDialog(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{isArabic ? 'حذف الوظيفة؟' : 'Delete job title?'}</AlertDialogTitle>
                              <AlertDialogDescription>{isArabic ? 'هل أنت متأكد من حذف هذه الوظيفة؟' : 'Are you sure you want to delete this job title?'}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteJobTitle.mutate(title.id)}>{isArabic ? 'حذف' : 'Delete'}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanySettings;