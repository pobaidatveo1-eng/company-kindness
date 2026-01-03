import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Scale, 
  Bell,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  ClipboardList,
  UserPlus,
  Settings,
  Loader2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Fetch team members with their task counts
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

  // Fetch all tasks
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['all-tasks', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, title_ar, status, priority, due_date, assigned_to')
        .eq('company_id', profile.company_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const delayedTasks = tasks.filter(t => 
    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  );

  // Calculate team member performance
  const teamPerformance = React.useMemo(() => {
    return teamMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assigned_to === member.id);
      const completedMemberTasks = memberTasks.filter(t => t.status === 'completed');
      return {
        id: member.id,
        name: member.full_name_ar || member.full_name,
        department: member.department,
        totalTasks: memberTasks.length,
        completed: completedMemberTasks.length,
      };
    }).filter(m => m.totalTasks > 0).sort((a, b) => b.totalTasks - a.totalTasks);
  }, [teamMembers, tasks]);

  const menuItems = [
    {
      title: t('dashboard.taskDistribution'),
      icon: LayoutDashboard,
      value: `${completedTasks}/${totalTasks}`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      path: '/dashboard/tasks',
    },
    {
      title: t('dashboard.delayedTasks'),
      icon: AlertTriangle,
      value: delayedTasks.length.toString(),
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      path: '/dashboard/delayed',
    },
    {
      title: t('dashboard.loadBalance'),
      icon: Scale,
      value: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%`,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      path: '/dashboard/balance',
    },
    {
      title: 'الفريق',
      icon: Users,
      value: teamMembers.filter(m => m.is_active).length.toString(),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      path: '/dashboard/team',
    },
  ];

  const quickActions = [
    { 
      title: 'جميع المهام', 
      icon: ClipboardList, 
      path: '/dashboard/tasks',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      title: 'المهام المتأخرة', 
      icon: AlertTriangle, 
      path: '/dashboard/delayed',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    { 
      title: 'إدارة الفريق', 
      icon: Users, 
      path: '/dashboard/team',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      title: 'توازن الأحمال', 
      icon: Scale, 
      path: '/dashboard/balance',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
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
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          مرحباً، {profile?.full_name || 'المدير'} 👋
        </h2>
        <p className="text-muted-foreground">لوحة تحكم المدير - إدارة الفريق والمهام</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {menuItems.map((item) => (
          <Card 
            key={item.title} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(item.path)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              أداء الفريق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamPerformance.length > 0 ? teamPerformance.slice(0, 5).map((member) => (
                <div key={member.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.department ? t(`department.${member.department}`) : 'غير محدد'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{member.completed}/{member.totalTasks}</span>
                    </div>
                  </div>
                  <Progress 
                    value={member.totalTasks > 0 ? (member.completed / member.totalTasks) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">لا توجد مهام موزعة بعد</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delayed Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('dashboard.delayedTasks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {delayedTasks.length > 0 ? delayedTasks.slice(0, 4).map((task) => {
                const assignee = teamMembers.find(m => m.id === task.assigned_to);
                const daysLate = Math.ceil((new Date().getTime() - new Date(task.due_date!).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border-r-4 border-destructive"
                  >
                    <div>
                      <p className="font-medium">{task.title_ar || task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignee?.full_name_ar || assignee?.full_name || 'غير معين'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-destructive">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">{daysLate} أيام</span>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-center text-muted-foreground py-4">لا توجد مهام متأخرة 🎉</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            ملخص حالة المهام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-amber-500/10 rounded-lg">
              <p className="text-3xl font-bold text-amber-500">{pendingTasks}</p>
              <p className="text-sm text-muted-foreground">قيد الانتظار</p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <p className="text-3xl font-bold text-blue-500">{inProgressTasks}</p>
              <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg">
              <p className="text-3xl font-bold text-green-500">{completedTasks}</p>
              <p className="text-sm text-muted-foreground">مكتملة</p>
            </div>
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-3xl font-bold text-destructive">{delayedTasks.length}</p>
              <p className="text-sm text-muted-foreground">متأخرة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
