import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, addDays } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const Events = () => {
  const { language } = useLanguage();
  const { tasks } = useTasks();
  const isArabic = language === 'ar';
  const dateLocale = isArabic ? ar : enUS;

  const upcomingTasks = tasks
    .filter(t => t.due_date && new Date(t.due_date) >= new Date() && t.status !== 'completed')
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  const todayTasks = upcomingTasks.filter(t => isToday(new Date(t.due_date!)));
  const tomorrowTasks = upcomingTasks.filter(t => isTomorrow(new Date(t.due_date!)));
  const thisWeekTasks = upcomingTasks.filter(t => {
    const dueDate = new Date(t.due_date!);
    return isThisWeek(dueDate) && !isToday(dueDate) && !isTomorrow(dueDate);
  });
  const laterTasks = upcomingTasks.filter(t => {
    const dueDate = new Date(t.due_date!);
    return dueDate > addDays(new Date(), 7);
  });

  const TaskGroup = ({ title, tasks, emptyMessage }: { 
    title: string; 
    tasks: typeof upcomingTasks; 
    emptyMessage: string;
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const taskTitle = isArabic ? (task.title_ar || task.title) : task.title;
              return (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{taskTitle}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(task.due_date!), 'dd MMM yyyy', { locale: dateLocale })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {isArabic 
                          ? (task.priority === 'urgent' ? 'عاجل' : task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض')
                          : task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          {isArabic ? 'المواعيد القادمة' : 'Upcoming Events'}
        </h1>
        <p className="text-muted-foreground">
          {isArabic 
            ? `${upcomingTasks.length} مهمة قادمة`
            : `${upcomingTasks.length} upcoming tasks`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TaskGroup 
          title={isArabic ? 'اليوم' : 'Today'} 
          tasks={todayTasks}
          emptyMessage={isArabic ? 'لا توجد مهام لليوم' : 'No tasks for today'}
        />
        <TaskGroup 
          title={isArabic ? 'غداً' : 'Tomorrow'} 
          tasks={tomorrowTasks}
          emptyMessage={isArabic ? 'لا توجد مهام للغد' : 'No tasks for tomorrow'}
        />
        <TaskGroup 
          title={isArabic ? 'هذا الأسبوع' : 'This Week'} 
          tasks={thisWeekTasks}
          emptyMessage={isArabic ? 'لا توجد مهام لهذا الأسبوع' : 'No tasks this week'}
        />
        <TaskGroup 
          title={isArabic ? 'لاحقاً' : 'Later'} 
          tasks={laterTasks}
          emptyMessage={isArabic ? 'لا توجد مهام لاحقة' : 'No upcoming tasks'}
        />
      </div>
    </div>
  );
};

export default Events;
