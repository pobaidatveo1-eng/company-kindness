import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyUsers, useCreateUser, useUpdateUserRole, useToggleUserActive, useDeleteUser, useUpdateUserProfile } from '@/hooks/useUsers';
import { useCompanyDepartments, useJobTitles } from '@/hooks/useCompanySettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, UserPlus, Shield, ShieldCheck, User, Loader2, MoreHorizontal, UserCheck, UserX, Trash2, Settings, Search, Eye, EyeOff, Key, Pencil } from 'lucide-react';
import { PermissionsDialog } from './PermissionsDialog';

const AVAILABLE_PERMISSIONS = [
  { key: 'dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard' },
  { key: 'tasks', labelAr: 'المهام', labelEn: 'Tasks' },
  { key: 'leads', labelAr: 'العملاء المحتملين', labelEn: 'Leads' },
  { key: 'meetings', labelAr: 'الاجتماعات', labelEn: 'Meetings' },
  { key: 'chat', labelAr: 'الدردشة', labelEn: 'Chat' },
  { key: 'clients', labelAr: 'العملاء', labelEn: 'Clients' },
  { key: 'contracts', labelAr: 'العقود', labelEn: 'Contracts' },
  { key: 'ai-insights', labelAr: 'رؤى AI', labelEn: 'AI Insights' },
  { key: 'settings', labelAr: 'الإعدادات', labelEn: 'Settings' },
];

const ROLES = [
  { value: 'employee', labelAr: 'موظف', labelEn: 'Employee' },
  { value: 'department_manager', labelAr: 'مدير قسم', labelEn: 'Department Manager' },
  { value: 'sales_staff', labelAr: 'موظف مبيعات', labelEn: 'Sales Staff' },
  { value: 'admin', labelAr: 'مسؤول', labelEn: 'Admin' },
];

export const EmployeesTab = () => {
  const { language } = useLanguage();
  const { profile, userRole } = useAuth();
  const isArabic = language === 'ar';
  
  const { data: users, isLoading } = useCompanyUsers();
  const { departments } = useCompanyDepartments();
  const { jobTitles } = useJobTitles();
  const createUser = useCreateUser();
  const updateRole = useUpdateUserRole();
  const toggleActive = useToggleUserActive();
  const deleteUser = useDeleteUser();
  const updateProfile = useUpdateUserProfile();

  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    fullNameAr: '',
    role: 'employee' as string,
    department: '',
    phone: '',
  });

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    fullNameAr: '',
    department: '',
    phone: '',
  });

  useEffect(() => {
    if (selectedUser && editDialogOpen) {
      setEditFormData({
        fullName: selectedUser.full_name || '',
        fullNameAr: selectedUser.full_name_ar || '',
        department: selectedUser.department || '',
        phone: selectedUser.phone || '',
      });
    }
  }, [selectedUser, editDialogOpen]);

  const filteredUsers = users?.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(searchLower) ||
      user.full_name_ar?.toLowerCase().includes(searchLower) ||
      user.phone?.includes(searchQuery)
    );
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <ShieldCheck className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'department_manager':
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'department_manager':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    const roleData = ROLES.find(r => r.value === role);
    if (roleData) return isArabic ? roleData.labelAr : roleData.labelEn;
    if (role === 'super_admin') return isArabic ? 'المسؤول الأعلى' : 'Super Admin';
    return role;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createUser.mutateAsync({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      fullNameAr: formData.fullNameAr || undefined,
      role: formData.role as 'admin' | 'employee',
      department: formData.department || undefined,
      phone: formData.phone || undefined,
    });

    setFormData({
      email: '',
      password: '',
      fullName: '',
      fullNameAr: '',
      role: 'employee',
      department: '',
      phone: '',
    });
    setAddDialogOpen(false);
  };

  const handleToggleActive = async (user: any) => {
    await toggleActive.mutateAsync({
      profileId: user.id,
      isActive: !user.is_active,
    });
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    await deleteUser.mutateAsync({
      userId: selectedUser.user_id,
      profileId: selectedUser.id,
    });
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    await updateRole.mutateAsync({
      userId,
      newRole: newRole as 'admin' | 'employee',
    });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    await updateProfile.mutateAsync({
      profileId: selectedUser.id,
      fullName: editFormData.fullName,
      fullNameAr: editFormData.fullNameAr || undefined,
      department: editFormData.department || undefined,
      phone: editFormData.phone || undefined,
    });

    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const isSuperAdmin = userRole?.role === 'super_admin';

  const stats = {
    total: users?.length || 0,
    admins: users?.filter((u) => u.role === 'admin' || u.role === 'super_admin').length || 0,
    employees: users?.filter((u) => u.role === 'employee').length || 0,
    active: users?.filter((u) => u.is_active).length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isArabic ? 'الإجمالي' : 'Total'}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isArabic ? 'المسؤولين' : 'Admins'}</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isArabic ? 'الموظفين' : 'Employees'}</p>
                <p className="text-2xl font-bold">{stats.employees}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isArabic ? 'نشط' : 'Active'}</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isArabic ? 'قائمة الموظفين' : 'Employees List'}
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isArabic ? 'بحث...' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9"
                />
              </div>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 me-2" />
                    {isArabic ? 'إضافة موظف' : 'Add Employee'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{isArabic ? 'إضافة موظف جديد' : 'Add New Employee'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isArabic ? 'الاسم (English)' : 'Full Name (English)'} *</Label>
                        <Input
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{isArabic ? 'الاسم (عربي)' : 'Full Name (Arabic)'}</Label>
                        <Input
                          dir="rtl"
                          value={formData.fullNameAr}
                          onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{isArabic ? 'البريد الإلكتروني' : 'Email'} *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{isArabic ? 'كلمة المرور' : 'Password'} *</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute end-0 top-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isArabic ? 'الدور الوظيفي' : 'Role'} *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {isArabic ? role.labelAr : role.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{isArabic ? 'القسم' : 'Department'}</Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) => setFormData({ ...formData, department: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isArabic ? 'اختر القسم' : 'Select department'} />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.name}>
                                {isArabic ? dept.name_ar || dept.name : dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{isArabic ? 'رقم الهاتف' : 'Phone'}</Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                        {isArabic ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button type="submit" disabled={createUser.isPending}>
                        {createUser.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                        {isArabic ? 'إضافة' : 'Add'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isArabic ? 'الموظف' : 'Employee'}</TableHead>
                <TableHead>{isArabic ? 'الدور' : 'Role'}</TableHead>
                <TableHead>{isArabic ? 'القسم' : 'Department'}</TableHead>
                <TableHead>{isArabic ? 'الهاتف' : 'Phone'}</TableHead>
                <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="text-end">{isArabic ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {isArabic ? 'لا يوجد موظفين' : 'No employees found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          {user.full_name_ar && (
                            <p className="text-sm text-muted-foreground">{user.full_name_ar}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'destructive'}>
                        {user.is_active ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'معطل' : 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      {user.role !== 'super_admin' && user.id !== profile?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isSuperAdmin && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(user.user_id, user.role === 'admin' ? 'employee' : 'admin')}
                                >
                                  <Shield className="h-4 w-4 me-2" />
                                  {user.role === 'admin' 
                                    ? (isArabic ? 'إزالة صلاحيات المسؤول' : 'Remove Admin')
                                    : (isArabic ? 'ترقية لمسؤول' : 'Make Admin')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 me-2" />
                              {isArabic ? 'تعديل البيانات' : 'Edit Details'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setPermissionsDialogOpen(true);
                              }}
                            >
                              <Key className="h-4 w-4 me-2" />
                              {isArabic ? 'الصلاحيات' : 'Permissions'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                              {user.is_active ? (
                                <>
                                  <UserX className="h-4 w-4 me-2" />
                                  {isArabic ? 'تعطيل' : 'Deactivate'}
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 me-2" />
                                  {isArabic ? 'تفعيل' : 'Activate'}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 me-2" />
                              {isArabic ? 'حذف' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArabic ? 'حذف الموظف؟' : 'Delete Employee?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic 
                ? `هل أنت متأكد من حذف ${selectedUser?.full_name}؟ هذا الإجراء لا يمكن التراجع عنه.`
                : `Are you sure you want to delete ${selectedUser?.full_name}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {isArabic ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isArabic ? 'تعديل بيانات الموظف' : 'Edit Employee Details'}</DialogTitle>
            <DialogDescription>
              {isArabic ? 'تعديل معلومات الموظف الأساسية' : 'Edit basic employee information'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isArabic ? 'الاسم (English)' : 'Full Name (English)'} *</Label>
                <Input
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? 'الاسم (عربي)' : 'Full Name (Arabic)'}</Label>
                <Input
                  dir="rtl"
                  value={editFormData.fullNameAr}
                  onChange={(e) => setEditFormData({ ...editFormData, fullNameAr: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isArabic ? 'القسم' : 'Department'}</Label>
              <Select
                value={editFormData.department}
                onValueChange={(value) => setEditFormData({ ...editFormData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isArabic ? 'اختر القسم' : 'Select department'} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {isArabic ? dept.name_ar || dept.name : dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isArabic ? 'رقم الهاتف' : 'Phone'}</Label>
              <Input
                type="tel"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <PermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        user={selectedUser}
      />
    </div>
  );
};
