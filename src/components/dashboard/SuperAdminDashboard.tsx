import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  BarChart3, 
  Brain, 
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Users,
  FileCheck,
  Lightbulb,
  Shield,
  UserPlus,
  Settings,
  ClipboardList,
  Loader2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SuperAdminDashboard = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Fetch team members
  const { data: teamMembers = [], isLoading: loadingTeam } = useQuery({
    queryKey: ['team-members', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, full_name_ar, department, is_active')
        .eq('company_id', profile.company_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // Fetch all user roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ['user-roles', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('company_id', profile.company_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // Fetch tasks statistics
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['all-tasks', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('id, status, priority, due_date, department, assigned_to, completed_at')
        .eq('company_id', profile.company_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  const activeEmployees = teamMembers.filter(m => m.is_active).length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const delayedTasks = tasks.filter(t => 
    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const admins = userRoles.filter(r => r.role === 'admin').length;
  const employees = userRoles.filter(r => r.role === 'employee').length;

  // Group by department
  const departmentStats = React.useMemo(() => {
    const deptMap: Record<string, { tasks: number; completed: number; employees: number }> = {};
    
    tasks.forEach(task => {
      const dept = task.department || 'other';
      if (!deptMap[dept]) {
        deptMap[dept] = { tasks: 0, completed: 0, employees: 0 };
      }
      deptMap[dept].tasks++;
      if (task.status === 'completed') {
        deptMap[dept].completed++;
      }
    });

    teamMembers.forEach(member => {
      const dept = member.department || 'other';
      if (!deptMap[dept]) {
        deptMap[dept] = { tasks: 0, completed: 0, employees: 0 };
      }
      deptMap[dept].employees++;
    });

    return Object.entries(deptMap).map(([name, stats]) => ({
      name: t(`department.${name}`),
      load: stats.tasks > 0 ? Math.round((stats.tasks / (stats.employees || 1)) * 10) : 0,
      employees: stats.employees,
      tasks: stats.tasks,
      completed: stats.completed,
    }));
  }, [tasks, teamMembers, t]);

  const getLoadColor = (load: number) => {
    if (load >= 90) return 'text-destructive';
    if (load >= 75) return 'text-amber-500';
    return 'text-green-500';
  };

  const quickActions = [
    { 
      title: 'إدارة الفريق', 
      icon: Users, 
      path: '/dashboard/team',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      title: 'إعدادات الشركة', 
      icon: Settings, 
      path: '/dashboard/settings',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    { 
      title: 'جميع المهام', 
      icon: ClipboardList, 
      path: '/dashboard/tasks',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      title: 'الأقسام', 
      icon: BarChart3, 
      path: '/dashboard/departments',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
  ];

  if (loadingTeam || loadingTasks) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            مرحباً، {profile?.full_name || 'المدير العام'} 👋
          </h2>
          <p className="text-muted-foreground">لوحة تحكم المدير العام - إدارة شاملة للشركة</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/team')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{activeEmployees}</p>
            <p className="text-xs text-muted-foreground">الموظفون النشطون</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/tasks')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <FileCheck className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex items-center gap-1 text-xs text-green-500">
                <TrendingUp className="h-3 w-3" />
                {completionRate}%
              </div>
            </div>
            <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
            <p className="text-xs text-muted-foreground">المهام المكتملة</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/delayed')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertOctagon className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <p className="text-2xl font-bold">{delayedTasks}</p>
            <p className="text-xs text-muted-foreground">مهام متأخرة</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/balance')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{inProgressTasks}</p>
            <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.path}
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                onClick={() => navigate(action.path)}
              >
                <div className={`p-2 rounded-lg ${action.bgColor}`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <span className="text-sm">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Team Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              نظرة على الفريق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <span>مدراء (Admin)</span>
                </div>
                <span className="font-bold text-purple-500">{admins}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span>موظفون</span>
                </div>
                <span className="font-bold text-blue-500">{employees}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-green-500" />
                  <span>إجمالي الفريق</span>
                </div>
                <span className="font-bold text-green-500">{teamMembers.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments Load */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t('dashboard.departmentLoad')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentStats.length > 0 ? departmentStats.slice(0, 4).map((dept) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dept.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {dept.employees}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {dept.completed}/{dept.tasks} مهمة
                    </span>
                  </div>
                  <Progress 
                    value={dept.tasks > 0 ? (dept.completed / dept.tasks) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">لا توجد أقسام بعد</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            ملخص الشركة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{teamMembers.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي الفريق</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-green-500">{completedTasks}</p>
              <p className="text-sm text-muted-foreground">مهمة مكتملة</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-blue-500">{inProgressTasks}</p>
              <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-destructive">{delayedTasks}</p>
              <p className="text-sm text-muted-foreground">مهام متأخرة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
