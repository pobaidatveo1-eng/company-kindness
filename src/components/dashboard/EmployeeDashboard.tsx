import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ClipboardList, 
  Calendar, 
  FileText, 
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();

  const menuItems = [
    {
      title: t('dashboard.myTasks'),
      icon: ClipboardList,
      count: 5,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: t('dashboard.upcomingEvents'),
      icon: Calendar,
      count: 3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: t('dashboard.manualItems'),
      icon: FileText,
      count: 2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: t('dashboard.notifications'),
      icon: Bell,
      count: 8,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const todayTasks = [
    { id: 1, title: 'تصميم بوستر للعميل ABC', status: 'pending', priority: 'high' },
    { id: 2, title: 'تحديث محتوى Instagram', status: 'in_progress', priority: 'medium' },
    { id: 3, title: 'مراجعة التصاميم النهائية', status: 'completed', priority: 'low' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive';
      case 'medium':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          مرحباً، {profile?.full_name || 'الموظف'} 👋
        </h2>
        <p className="text-muted-foreground">إليك ملخص يومك</p>
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
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">{item.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {t('dashboard.myTasks')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(task.status)}
                  <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                    {task.title}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            {t('dashboard.upcomingEvents')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-lg border-r-4 border-blue-500">
              <div>
                <p className="font-medium">جلسة تصوير منتجات</p>
                <p className="text-sm text-muted-foreground">اليوم - 2:00 م</p>
              </div>
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border-r-4 border-primary">
              <div>
                <p className="font-medium">اجتماع مع العميل XYZ</p>
                <p className="text-sm text-muted-foreground">غداً - 10:00 ص</p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
