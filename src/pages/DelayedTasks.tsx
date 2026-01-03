import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks, Task, TaskStatus } from '@/hooks/useTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, User, Clock, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const DelayedTasks = () => {
  const { language } = useLanguage();
  const { tasks, updateTask } = useTasks();
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  const dateLocale = isArabic ? ar : enUS;

  const delayedTasks = tasks.filter(task => 
    task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== 'completed' &&
    task.status !== 'cancelled'
  ).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  const getDelayDays = (dueDate: string) => {
    return differenceInDays(new Date(), new Date(dueDate));
  };

  const getDelayBadgeColor = (days: number) => {
    if (days > 7) return 'bg-destructive text-destructive-foreground';
    if (days > 3) return 'bg-warning text-warning-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const handleMarkCompleted = (taskId: string) => {
    updateTask.mutate({ id: taskId, status: 'completed' as TaskStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            {isArabic ? 'المهام المتأخرة' : 'Delayed Tasks'}
          </h1>
          <p className="text-muted-foreground">
            {isArabic 
              ? `${delayedTasks.length} مهمة متأخرة تحتاج انتباهك`
              : `${delayedTasks.length} delayed tasks need your attention`}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard/tasks')}>
          {isArabic ? 'عرض كل المهام' : 'View All Tasks'}
          <ArrowRight className="h-4 w-4 ms-2" />
        </Button>
      </div>

      {delayedTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-success mb-4" />
            <h3 className="text-lg font-medium">
              {isArabic ? 'لا توجد مهام متأخرة!' : 'No Delayed Tasks!'}
            </h3>
            <p className="text-muted-foreground mt-2">
              {isArabic ? 'جميع المهام في موعدها' : 'All tasks are on schedule'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {delayedTasks.map((task) => {
            const delayDays = getDelayDays(task.due_date!);
            const title = isArabic ? (task.title_ar || task.title) : task.title;
            const assigneeName = task.assignee 
              ? (isArabic ? (task.assignee.full_name_ar || task.assignee.full_name) : task.assignee.full_name)
              : null;

            return (
              <Card key={task.id} className="border-destructive/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium truncate">{title}</h3>
                        <Badge className={getDelayBadgeColor(delayDays)}>
                          {isArabic 
                            ? `متأخرة ${delayDays} يوم`
                            : `${delayDays} days late`}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {isArabic ? 'الموعد: ' : 'Due: '}
                            {format(new Date(task.due_date!), 'dd MMM yyyy', { locale: dateLocale })}
                          </span>
                        </div>
                        {assigneeName && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{assigneeName}</span>
                          </div>
                        )}
                        {task.department && (
                          <Badge variant="outline">{task.department}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleMarkCompleted(task.id)}
                      disabled={updateTask.isPending}
                    >
                      {isArabic ? 'إكمال' : 'Complete'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DelayedTasks;
