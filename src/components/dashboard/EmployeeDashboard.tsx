import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, Task, TaskStatus } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  Calendar, 
  FileText, 
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  ArrowRight,
  Loader2
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { tasks, isLoading, updateTask } = useTasks();
  const navigate = useNavigate();

  // Filter tasks assigned to current user
  const myTasks = tasks.filter(task => task.assigned_to === profile?.id);
  const pendingTasks = myTasks.filter(task => task.status === 'pending');
  const inProgressTasks = myTasks.filter(task => task.status === 'in_progress');
  const completedTasks = myTasks.filter(task => task.status === 'completed');
  const todayTasks = myTasks.filter(task => {
    if (!task.due_date) return false;
    const today = new Date().toDateString();
    return new Date(task.due_date).toDateString() === today;
  });

  const menuItems = [
    {
      title: t('dashboard.myTasks'),
      icon: ClipboardList,
      count: myTasks.length,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'قيد التنفيذ',
      icon: Clock,
      count: inProgressTasks.length,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'منجزة',
      icon: CheckCircle2,
      count: completedTasks.length,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'معلقة',
      icon: AlertTriangle,
      count: pendingTasks.length,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'منجزة';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'cancelled':
        return 'ملغاة';
      default:
        return 'معلقة';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'bg-destructive/10 text-destructive';
      case 'medium':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'عاجل';
      case 'high':
        return 'عالي';
      case 'medium':
        return 'متوسط';
      default:
        return 'منخفض';
    }
  };

  const handleStartTask = (task: Task) => {
    updateTask.mutate({ id: task.id, status: 'in_progress' });
  };

  const handleCompleteTask = (task: Task) => {
    updateTask.mutate({ id: task.id, status: 'completed' });
  };

  if (isLoading) {
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
          مرحباً، {profile?.full_name || 'الموظف'} 👋
        </h2>
        <p className="text-muted-foreground">إليك ملخص مهامك</p>
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

      {/* Tasks requiring action */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            المهام المسندة إليك
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/tasks')}>
            عرض الكل
            <ArrowRight className="h-4 w-4 mr-2" />
          </Button>
        </CardHeader>
        <CardContent>
          {myTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا توجد مهام مسندة إليك حالياً</p>
          ) : (
            <div className="space-y-3">
              {myTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(task.status)}
                    <div className="flex-1">
                      <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                        {task.title_ar || task.title}
                      </span>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground">
                          موعد التسليم: {new Date(task.due_date).toLocaleDateString('ar-SA')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                    <Badge variant="outline">{getStatusLabel(task.status)}</Badge>
                    {task.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleStartTask(task)}>
                        <Play className="h-3 w-3 ml-1" />
                        بدء
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button size="sm" variant="default" onClick={() => handleCompleteTask(task)}>
                        <CheckCircle2 className="h-3 w-3 ml-1" />
                        إنجاز
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              مهام اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-blue-500/5 rounded-lg border-r-4 border-blue-500"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <p className="font-medium">{task.title_ar || task.title}</p>
                      <p className="text-sm text-muted-foreground">{getStatusLabel(task.status)}</p>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(task.priority)}>
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeDashboard;
