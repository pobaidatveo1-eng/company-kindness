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
  Users,
  FileCheck,
  Settings,
  ClipboardList,
  Loader2,
  UserPlus,
  Video,
  MessageSquare,
  Phone,
  Calendar
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLeads } from '@/hooks/useLeads';
import { useMeetings } from '@/hooks/useMeetings';
import SendUrgentCallDialog from '@/components/notifications/SendUrgentCallDialog';

const SuperAdminDashboard = () => {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  const { leads } = useLeads();
  const { meetings } = useMeetings();

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

  const newLeads = leads.filter(l => l.status === 'new').length;
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled').length;

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

    const deptLabels: Record<string, { ar: string; en: string }> = {
      marketing: { ar: 'التسويق', en: 'Marketing' },
      design: { ar: 'التصميم', en: 'Design' },
      content: { ar: 'المحتوى', en: 'Content' },
      video: { ar: 'الفيديو', en: 'Video' },
      social_media: { ar: 'السوشيال ميديا', en: 'Social Media' },
      other: { ar: 'أخرى', en: 'Other' },
    };

    return Object.entries(deptMap).map(([name, stats]) => ({
      name: isArabic ? deptLabels[name]?.ar || name : deptLabels[name]?.en || name,
      load: stats.tasks > 0 ? Math.round((stats.tasks / (stats.employees || 1)) * 10) : 0,
      employees: stats.employees,
      tasks: stats.tasks,
      completed: stats.completed,
    }));
  }, [tasks, teamMembers, isArabic]);

  const quickActions = [
    { 
      title: isArabic ? 'إدارة الفريق' : 'Team Management', 
      icon: Users, 
      path: '/dashboard/team',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      title: isArabic ? 'العملاء المحتملين' : 'Leads', 
      icon: UserPlus, 
      path: '/dashboard/leads',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      badge: newLeads > 0 ? newLeads : undefined
    },
    { 
      title: isArabic ? 'الاجتماعات' : 'Meetings', 
      icon: Video, 
      path: '/dashboard/meetings',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      badge: upcomingMeetings > 0 ? upcomingMeetings : undefined
    },
    { 
      title: isArabic ? 'الدردشة' : 'Chat', 
      icon: MessageSquare, 
      path: '/dashboard/chat',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    },
    { 
      title: isArabic ? 'رؤى AI' : 'AI Insights', 
      icon: Brain, 
      path: '/dashboard/ai-insights',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    { 
      title: isArabic ? 'إعدادات الشركة' : 'Company Settings', 
      icon: Settings, 
      path: '/dashboard/settings',
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10'
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
            {isArabic ? 'مرحباً' : 'Welcome'}, {profile?.full_name || (isArabic ? 'المدير العام' : 'Super Admin')} 👋
          </h2>
          <p className="text-muted-foreground">
            {isArabic ? 'لوحة تحكم المدير العام - إدارة شاملة للشركة' : 'Super Admin Dashboard - Complete Company Management'}
          </p>
        </div>
        <SendUrgentCallDialog />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/team')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{activeEmployees}</p>
            <p className="text-xs text-muted-foreground">{isArabic ? 'الموظفون' : 'Employees'}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/tasks')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <FileCheck className="h-5 w-5 text-green-500" />
              </div>
              <Badge variant="outline" className="text-xs text-green-500">
                {completionRate}%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
            <p className="text-xs text-muted-foreground">{isArabic ? 'مهام مكتملة' : 'Tasks Done'}</p>
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
            <p className="text-xs text-muted-foreground">{isArabic ? 'متأخرة' : 'Overdue'}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/leads')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <UserPlus className="h-5 w-5 text-amber-500" />
              </div>
              {newLeads > 0 && (
                <Badge className="bg-amber-500 text-white text-xs">{newLeads}</Badge>
              )}
            </div>
            <p className="text-2xl font-bold">{leads.length}</p>
            <p className="text-xs text-muted-foreground">{isArabic ? 'عملاء محتملين' : 'Leads'}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/meetings')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{upcomingMeetings}</p>
            <p className="text-xs text-muted-foreground">{isArabic ? 'اجتماع قادم' : 'Upcoming'}</p>
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
            <p className="text-xs text-muted-foreground">{isArabic ? 'قيد التنفيذ' : 'In Progress'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            {isArabic ? 'إجراءات سريعة' : 'Quick Actions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.path}
                variant="outline"
                className="h-auto flex-col gap-2 p-4 relative"
                onClick={() => navigate(action.path)}
              >
                <div className={`p-2 rounded-lg ${action.bgColor}`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <span className="text-xs text-center">{action.title}</span>
                {action.badge && (
                  <Badge className="absolute -top-2 -end-2 h-5 min-w-5 flex items-center justify-center p-0 text-xs">
                    {action.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Leads Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              {isArabic ? 'خط أنابيب المبيعات' : 'Sales Pipeline'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                <span>{isArabic ? 'جديد' : 'New'}</span>
                <Badge variant="secondary">{leads.filter(l => l.status === 'new').length}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                <span>{isArabic ? 'مهتم' : 'Interested'}</span>
                <Badge variant="secondary">{leads.filter(l => l.status === 'interested').length}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                <span>{isArabic ? 'عرض مرسل' : 'Proposal Sent'}</span>
                <Badge variant="secondary">{leads.filter(l => l.status === 'proposal_sent').length}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <span>{isArabic ? 'تم الإغلاق' : 'Closed Won'}</span>
                <Badge className="bg-green-500 text-white">{leads.filter(l => l.status === 'closed_won').length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments Load */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {isArabic ? 'أحمال الأقسام' : 'Department Load'}
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
                      {dept.completed}/{dept.tasks} {isArabic ? 'مهمة' : 'tasks'}
                    </span>
                  </div>
                  <Progress 
                    value={dept.tasks > 0 ? (dept.completed / dept.tasks) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">
                  {isArabic ? 'لا توجد أقسام بعد' : 'No departments yet'}
                </p>
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
            {isArabic ? 'ملخص الشركة' : 'Company Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{teamMembers.length}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'إجمالي الفريق' : 'Total Team'}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-green-500">{completedTasks}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'مهمة مكتملة' : 'Completed'}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-blue-500">{inProgressTasks}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'قيد التنفيذ' : 'In Progress'}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-destructive">{delayedTasks}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'متأخرة' : 'Overdue'}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-amber-500">{leads.length}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'عملاء محتملين' : 'Leads'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
