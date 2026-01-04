import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, Task, TaskStatus } from '@/hooks/useTasks';
import { useMeetings } from '@/hooks/useMeetings';
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
  Loader2,
  Video,
  MapPin
} from 'lucide-react';
import { format, isToday, isTomorrow, differenceInMinutes } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const EmployeeDashboard = () => {
  const { language, t } = useLanguage();
  const { profile } = useAuth();
  const { tasks, isLoading, updateTask } = useTasks();
  const { meetings } = useMeetings();
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  const dateLocale = isArabic ? ar : enUS;

  // Filter upcoming meetings (scheduled and not completed/cancelled)
  const upcomingMeetings = meetings
    .filter(m => m.status === 'scheduled' && new Date(m.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  const getMeetingTimeLabel = (startTime: string) => {
    const date = new Date(startTime);
    const now = new Date();
    const minutesUntil = differenceInMinutes(date, now);

    if (minutesUntil <= 0) {
      return { label: isArabic ? 'الآن' : 'Now', urgent: true };
    } else if (minutesUntil <= 15) {
      return { label: isArabic ? `خلال ${minutesUntil} دقيقة` : `In ${minutesUntil} min`, urgent: true };
    } else if (minutesUntil <= 60) {
      return { label: isArabic ? `خلال ${minutesUntil} دقيقة` : `In ${minutesUntil} min`, urgent: false };
    } else if (isToday(date)) {
      return { label: `${isArabic ? 'اليوم' : 'Today'} ${format(date, 'h:mm a', { locale: dateLocale })}`, urgent: false };
    } else if (isTomorrow(date)) {
      return { label: `${isArabic ? 'غداً' : 'Tomorrow'} ${format(date, 'h:mm a', { locale: dateLocale })}`, urgent: false };
    } else {
      return { label: format(date, 'dd MMM h:mm a', { locale: dateLocale }), urgent: false };
    }
  };

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
      title: t('tasks.inProgress'),
      icon: Clock,
      count: inProgressTasks.length,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: t('tasks.completed'),
      icon: CheckCircle2,
      count: completedTasks.length,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: t('tasks.pending'),
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
        return t('tasks.completed');
      case 'in_progress':
        return t('tasks.inProgress');
      case 'cancelled':
        return t('tasks.cancelled');
      default:
        return t('tasks.pending');
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
        return t('priority.urgent');
      case 'high':
        return t('priority.high');
      case 'medium':
        return t('priority.medium');
      default:
        return t('priority.low');
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
          {t('dashboard.welcome')}، {profile?.full_name || (isArabic ? 'الموظف' : 'Employee')} 👋
        </h2>
        <p className="text-muted-foreground">
          {isArabic ? 'إليك ملخص مهامك' : 'Here\'s your task summary'}
        </p>
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
            {isArabic ? 'المهام المسندة إليك' : 'Your Assigned Tasks'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/tasks')}>
            {t('common.viewAll')}
            <ArrowRight className="h-4 w-4 mr-2" />
          </Button>
        </CardHeader>
        <CardContent>
          {myTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {isArabic ? 'لا توجد مهام مسندة إليك حالياً' : 'No tasks assigned to you'}
            </p>
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
                        {isArabic ? (task.title_ar || task.title) : task.title}
                      </span>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground">
                          {isArabic ? 'موعد التسليم:' : 'Due:'} {new Date(task.due_date).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
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
                        {isArabic ? 'بدء' : 'Start'}
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button size="sm" variant="default" onClick={() => handleCompleteTask(task)}>
                        <CheckCircle2 className="h-3 w-3 ml-1" />
                        {isArabic ? 'إنجاز' : 'Complete'}
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
              {t('dashboard.todayTasks')}
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
                      <p className="font-medium">{isArabic ? (task.title_ar || task.title) : task.title}</p>
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

      {/* Upcoming Meetings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            {t('dashboard.upcomingMeetings')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/meetings')}>
            {t('common.viewAll')}
            <ArrowRight className="h-4 w-4 mr-2" />
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingMeetings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {isArabic ? 'لا توجد اجتماعات قادمة' : 'No upcoming meetings'}
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => {
                const timeInfo = getMeetingTimeLabel(meeting.start_time);
                return (
                  <div
                    key={meeting.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-r-4 transition-colors ${
                      timeInfo.urgent 
                        ? 'bg-destructive/10 border-destructive animate-pulse' 
                        : 'bg-primary/5 border-primary hover:bg-primary/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${timeInfo.urgent ? 'bg-destructive/20' : 'bg-primary/10'}`}>
                        <Video className={`h-5 w-5 ${timeInfo.urgent ? 'text-destructive' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{isArabic ? (meeting.title_ar || meeting.title) : meeting.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(meeting.start_time), 'h:mm a', { locale: dateLocale })}</span>
                          {meeting.location && (
                            <>
                              <MapPin className="h-3 w-3 mr-2" />
                              <span>{meeting.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={timeInfo.urgent ? 'bg-destructive text-destructive-foreground' : 'bg-primary/10 text-primary'}>
                      {timeInfo.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
