import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Target,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { differenceInDays } from 'date-fns';

const AIInsights = () => {
  const { language } = useLanguage();
  const { tasks } = useTasks();
  const isArabic = language === 'ar';

  // Calculate insights
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => 
    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  ).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const urgentPending = tasks.filter(t => 
    t.priority === 'urgent' && t.status !== 'completed'
  ).length;

  const avgCompletionTime = (() => {
    const completedWithDates = tasks.filter(t => 
      t.status === 'completed' && t.created_at && t.completed_at
    );
    if (completedWithDates.length === 0) return 0;
    const totalDays = completedWithDates.reduce((sum, t) => {
      return sum + differenceInDays(new Date(t.completed_at!), new Date(t.created_at));
    }, 0);
    return Math.round(totalDays / completedWithDates.length);
  })();

  const insights = [
    {
      type: completionRate >= 70 ? 'success' : completionRate >= 40 ? 'warning' : 'danger',
      icon: Target,
      title: isArabic ? 'نسبة الإنجاز' : 'Completion Rate',
      value: `${completionRate}%`,
      description: isArabic 
        ? (completionRate >= 70 
            ? 'أداء ممتاز! استمر على هذا المستوى'
            : completionRate >= 40 
              ? 'أداء جيد، يمكن تحسينه'
              : 'يحتاج إلى تحسين كبير')
        : (completionRate >= 70 
            ? 'Excellent performance! Keep it up'
            : completionRate >= 40 
              ? 'Good performance, room for improvement'
              : 'Needs significant improvement'),
    },
    {
      type: overdueTasks === 0 ? 'success' : overdueTasks <= 3 ? 'warning' : 'danger',
      icon: AlertTriangle,
      title: isArabic ? 'المهام المتأخرة' : 'Overdue Tasks',
      value: overdueTasks.toString(),
      description: isArabic
        ? (overdueTasks === 0 
            ? 'ممتاز! لا توجد مهام متأخرة'
            : `${overdueTasks} مهمة تحتاج انتباهك العاجل`)
        : (overdueTasks === 0 
            ? 'Excellent! No overdue tasks'
            : `${overdueTasks} tasks need immediate attention`),
    },
    {
      type: urgentPending === 0 ? 'success' : 'warning',
      icon: Clock,
      title: isArabic ? 'المهام العاجلة المعلقة' : 'Pending Urgent Tasks',
      value: urgentPending.toString(),
      description: isArabic
        ? (urgentPending === 0 
            ? 'جميع المهام العاجلة مكتملة'
            : 'مهام عاجلة تحتاج إنجازها')
        : (urgentPending === 0 
            ? 'All urgent tasks completed'
            : 'Urgent tasks need completion'),
    },
    {
      type: avgCompletionTime <= 3 ? 'success' : avgCompletionTime <= 7 ? 'warning' : 'danger',
      icon: TrendingUp,
      title: isArabic ? 'متوسط وقت الإنجاز' : 'Avg Completion Time',
      value: `${avgCompletionTime} ${isArabic ? 'يوم' : 'days'}`,
      description: isArabic
        ? (avgCompletionTime <= 3 
            ? 'سرعة إنجاز ممتازة'
            : 'يمكن تحسين سرعة الإنجاز')
        : (avgCompletionTime <= 3 
            ? 'Excellent completion speed'
            : 'Completion speed can be improved'),
    },
  ];

  const recommendations = [
    {
      icon: Lightbulb,
      title: isArabic ? 'تحسين التوزيع' : 'Improve Distribution',
      description: isArabic 
        ? 'وزع المهام بشكل متساوي على الفريق لتجنب الضغط'
        : 'Distribute tasks evenly across the team to avoid pressure',
    },
    {
      icon: BarChart3,
      title: isArabic ? 'مراجعة الأولويات' : 'Review Priorities',
      description: isArabic
        ? 'راجع أولويات المهام بشكل دوري لضمان التركيز على الأهم'
        : 'Review task priorities regularly to focus on what matters',
    },
    {
      icon: CheckCircle2,
      title: isArabic ? 'متابعة المتأخرات' : 'Follow Up on Delays',
      description: isArabic
        ? 'تابع المهام المتأخرة بشكل يومي واتخذ إجراءات تصحيحية'
        : 'Follow up on delayed tasks daily and take corrective actions',
    },
  ];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-success/50 bg-success/5';
      case 'warning':
        return 'border-warning/50 bg-warning/5';
      case 'danger':
        return 'border-destructive/50 bg-destructive/5';
      default:
        return '';
    }
  };

  const getIconStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'danger':
        return 'text-destructive';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          {isArabic ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}
        </h1>
        <p className="text-muted-foreground">
          {isArabic ? 'تحليل ذكي لأداء فريقك ومهامك' : 'Smart analysis of your team and task performance'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <Card key={index} className={`${getTypeStyles(insight.type)}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{insight.title}</p>
                    <p className="text-3xl font-bold mt-1">{insight.value}</p>
                    <p className="text-xs text-muted-foreground mt-2">{insight.description}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${getIconStyles(insight.type)}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            {isArabic ? 'توصيات لتحسين الأداء' : 'Performance Recommendations'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.map((rec, index) => {
              const Icon = rec.icon;
              return (
                <div key={index} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <Icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-medium mb-1">{rec.title}</h3>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? 'ملخص الأداء' : 'Performance Summary'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 text-center">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-primary">{totalTasks}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'إجمالي المهام' : 'Total Tasks'}</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10">
              <p className="text-2xl font-bold text-success">{completedTasks}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'مكتملة' : 'Completed'}</p>
            </div>
            <div className="p-4 rounded-lg bg-warning/10">
              <p className="text-2xl font-bold text-warning">
                {tasks.filter(t => t.status === 'in_progress').length}
              </p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'قيد التنفيذ' : 'In Progress'}</p>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10">
              <p className="text-2xl font-bold text-destructive">{overdueTasks}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'متأخرة' : 'Overdue'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;
