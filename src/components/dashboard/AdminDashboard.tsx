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
  CheckCircle2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();

  const menuItems = [
    {
      title: t('dashboard.taskDistribution'),
      icon: LayoutDashboard,
      value: '24/30',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: t('dashboard.delayedTasks'),
      icon: AlertTriangle,
      value: '3',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: t('dashboard.loadBalance'),
      icon: Scale,
      value: '78%',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: t('dashboard.alerts'),
      icon: Bell,
      value: '5',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const teamMembers = [
    { name: 'أحمد محمد', role: 'مصمم', tasks: 8, completed: 5 },
    { name: 'سارة علي', role: 'سوشيال ميديا', tasks: 6, completed: 6 },
    { name: 'خالد أحمد', role: 'محتوى', tasks: 5, completed: 3 },
    { name: 'نورا سعيد', role: 'فيديو', tasks: 4, completed: 2 },
  ];

  const delayedTasks = [
    { title: 'حملة إعلانية للعميل ABC', assignee: 'أحمد محمد', daysLate: 2 },
    { title: 'فيديو موشن جرافيك', assignee: 'نورا سعيد', daysLate: 1 },
    { title: 'تقرير أداء شهري', assignee: 'خالد أحمد', daysLate: 3 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          مرحباً، {profile?.full_name || 'المدير'} 👋
        </h2>
        <p className="text-muted-foreground">إليك ملخص أداء الفريق</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {menuItems.map((item) => (
          <Card 
            key={item.title} 
            className="cursor-pointer hover:shadow-md transition-shadow"
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
              {teamMembers.map((member) => (
                <div key={member.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm">{member.completed}/{member.tasks}</span>
                    </div>
                  </div>
                  <Progress 
                    value={(member.completed / member.tasks) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
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
              {delayedTasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border-r-4 border-destructive"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.assignee}</p>
                  </div>
                  <div className="flex items-center gap-1 text-destructive">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">{task.daysLate} أيام</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Load Balance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            توزيع الأحمال على الفريق
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">رسم بياني للأحمال (قريباً)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
