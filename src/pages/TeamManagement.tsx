import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyUsers, useToggleUserActive, useDeleteUser } from '@/hooks/useUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddUserDialog } from '@/components/team/AddUserDialog';
import { UserRoleDialog } from '@/components/team/UserRoleDialog';
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  User,
  Loader2,
  UserX,
  UserCheck,
  Trash2,
  Settings,
} from 'lucide-react';

const TeamManagement = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { data: users, isLoading } = useCompanyUsers();
  const toggleActive = useToggleUserActive();
  const deleteUser = useDeleteUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
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

  const stats = {
    total: users?.length || 0,
    admins: users?.filter((u) => u.role === 'admin').length || 0,
    employees: users?.filter((u) => u.role === 'employee').length || 0,
    active: users?.filter((u) => u.is_active).length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('team.management')}</h1>
          <p className="text-muted-foreground">{t('team.managementDesc')}</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 me-2" />
          {t('team.addUser')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('team.totalMembers')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('team.admins')}</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('team.employees')}</p>
                <p className="text-2xl font-bold">{stats.employees}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('team.activeUsers')}</p>
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
              {t('team.allMembers')}
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('team.name')}</TableHead>
                <TableHead>{t('team.role')}</TableHead>
                <TableHead>{t('team.department')}</TableHead>
                <TableHead>{t('team.phone')}</TableHead>
                <TableHead>{t('team.status')}</TableHead>
                <TableHead className="text-end">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
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
                      {t(`role.${user.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.department ? t(`departments.${user.department}`) : '-'}
                  </TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? t('team.active') : t('team.inactive')}
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
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4 me-2" />
                            {t('team.changeRole')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                            {user.is_active ? (
                              <>
                                <UserX className="h-4 w-4 me-2" />
                                {t('team.deactivate')}
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 me-2" />
                                {t('team.activate')}
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
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddUserDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <UserRoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        user={selectedUser}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('team.deleteUser')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('team.deleteUserConfirm')} {selectedUser?.full_name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamManagement;