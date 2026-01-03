import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyUsers, useToggleUserActive } from '@/hooks/useUsers';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddUserDialog } from '@/components/team/AddUserDialog';
import {
  Users,
  UserPlus,
  Search,
  User,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

const Employees = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { data: users, isLoading: usersLoading } = useCompanyUsers();
  const { tasks, isLoading: tasksLoading } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Filter only employees (not admins or super_admins)
  const employees = users?.filter((u) => u.role === 'employee') || [];

  const filteredEmployees = employees.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(searchLower) ||
      user.full_name_ar?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate task stats per employee
  const getEmployeeStats = (userId: string) => {
    const employeeTasks = tasks?.filter((t) => t.assigned_to === userId) || [];
    const completed = employeeTasks.filter((t) => t.status === 'completed').length;
    const inProgress = employeeTasks.filter((t) => t.status === 'in_progress').length;
    const overdue = employeeTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length;

    return {
      total: employeeTasks.length,
      completed,
      inProgress,
      overdue,
      completionRate: employeeTasks.length > 0 ? Math.round((completed / employeeTasks.length) * 100) : 0,
    };
  };

  const isLoading = usersLoading || tasksLoading;

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
          <h1 className="text-2xl font-bold">{t('team.employees')}</h1>
          <p className="text-muted-foreground">{t('team.employeesDesc')}</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 me-2" />
          {t('team.addEmployee')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('team.totalEmployees')}</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('team.activeEmployees')}</p>
                <p className="text-2xl font-bold">{employees.filter((e) => e.is_active).length}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('tasks.completed')}</p>
                <p className="text-2xl font-bold">
                  {tasks?.filter((t) => t.status === 'completed').length || 0}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('tasks.overdue')}</p>
                <p className="text-2xl font-bold">
                  {tasks?.filter(
                    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
                  ).length || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('team.employeesList')}
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
                <TableHead>{t('team.department')}</TableHead>
                <TableHead>{t('tasks.total')}</TableHead>
                <TableHead>{t('tasks.completed')}</TableHead>
                <TableHead>{t('tasks.inProgress')}</TableHead>
                <TableHead>{t('tasks.overdue')}</TableHead>
                <TableHead>{t('team.performance')}</TableHead>
                <TableHead>{t('team.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => {
                const stats = getEmployeeStats(employee.id);
                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          {employee.full_name_ar && (
                            <p className="text-sm text-muted-foreground">{employee.full_name_ar}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {employee.department ? t(`departments.${employee.department}`) : '-'}
                    </TableCell>
                    <TableCell>{stats.total}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {stats.completed}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        {stats.inProgress}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        {stats.overdue}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={stats.completionRate} className="w-20" />
                        <span className="text-sm">{stats.completionRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.is_active ? 'default' : 'destructive'}>
                        {employee.is_active ? t('team.active') : t('team.inactive')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('team.noEmployees')}
            </div>
          )}
        </CardContent>
      </Card>

      <AddUserDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
};

export default Employees;