import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { useCompanyUsers } from '@/hooks/useUsers';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Target,
  Lightbulb,
  BarChart3,
  Scale,
  AlertOctagon,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { differenceInDays } from 'date-fns';

const AIInsights = () => {
  const { language } = useLanguage();
  const { tasks } = useTasks();
  const { data: companyUsers = [] } = useCompanyUsers();
  const { analyze, isAnalyzing, analysis } = useAIAnalysis();
  const isArabic = language === 'ar';
  const [activeTab, setActiveTab] = useState('overview');

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

  const runAnalysis = async (type: 'performance' | 'workload' | 'risks' | 'recommendations') => {
    await analyze(type, {
      tasks,
      employees: companyUsers,
      completionRate,
      delayedTasks: overdueTasks,
    });
  };

  const insights = [
    {
      type: completionRate >= 70 ? 'success' : completionRate >= 40 ? 'warning' : 'danger',
      icon: Target,
      title: isArabic ? 'نسبة الإنجاز' : 'Completion Rate',
      value: `${completionRate}%`,
      description: isArabic 
        ? (completionRate >= 70 ? 'أداء ممتاز!' : completionRate >= 40 ? 'أداء جيد' : 'يحتاج تحسين')
        : (completionRate >= 70 ? 'Excellent!' : completionRate >= 40 ? 'Good' : 'Needs improvement'),
    },
    {
      type: overdueTasks === 0 ? 'success' : overdueTasks <= 3 ? 'warning' : 'danger',
      icon: AlertTriangle,
      title: isArabic ? 'المهام المتأخرة' : 'Overdue Tasks',
      value: overdueTasks.toString(),
      description: isArabic
        ? (overdueTasks === 0 ? 'لا توجد متأخرات' : `${overdueTasks} مهمة متأخرة`)
        : (overdueTasks === 0 ? 'No overdue tasks' : `${overdueTasks} tasks overdue`),
    },
    {
      type: urgentPending === 0 ? 'success' : 'warning',
      icon: Clock,
      title: isArabic ? 'عاجلة معلقة' : 'Urgent Pending',
      value: urgentPending.toString(),
      description: isArabic
        ? (urgentPending === 0 ? 'لا توجد عاجلة' : 'تحتاج انتباه')
        : (urgentPending === 0 ? 'All clear' : 'Needs attention'),
    },
    {
      type: avgCompletionTime <= 3 ? 'success' : avgCompletionTime <= 7 ? 'warning' : 'danger',
      icon: TrendingUp,
      title: isArabic ? 'متوسط الإنجاز' : 'Avg Completion',
      value: `${avgCompletionTime} ${isArabic ? 'يوم' : 'days'}`,
      description: isArabic
        ? (avgCompletionTime <= 3 ? 'سريع جداً' : 'يمكن تحسينه')
        : (avgCompletionTime <= 3 ? 'Very fast' : 'Can improve'),
    },
  ];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500/50 bg-green-500/5';
      case 'warning': return 'border-amber-500/50 bg-amber-500/5';
      case 'danger': return 'border-destructive/50 bg-destructive/5';
      default: return '';
    }
  };

  const getIconStyles = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-amber-500';
      case 'danger': return 'text-destructive';
      default: return 'text-primary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            {isArabic ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}
          </h1>
          <p className="text-muted-foreground">
            {isArabic ? 'تحليل ذكي لأداء فريقك ومهامك' : 'Smart analysis of your team and task performance'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
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

      {/* AI Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {isArabic ? 'الأداء' : 'Performance'}
          </TabsTrigger>
          <TabsTrigger value="workload" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            {isArabic ? 'الأحمال' : 'Workload'}
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4" />
            {isArabic ? 'المخاطر' : 'Risks'}
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            {isArabic ? 'التوصيات' : 'Recommendations'}
          </TabsTrigger>
        </TabsList>

        {['overview', 'workload', 'risks', 'recommendations'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {tab === 'overview' && (isArabic ? 'تحليل الأداء' : 'Performance Analysis')}
                  {tab === 'workload' && (isArabic ? 'تحليل الأحمال' : 'Workload Analysis')}
                  {tab === 'risks' && (isArabic ? 'تحليل المخاطر' : 'Risk Analysis')}
                  {tab === 'recommendations' && (isArabic ? 'التوصيات الذكية' : 'Smart Recommendations')}
                </CardTitle>
                <Button 
                  onClick={() => runAnalysis(tab === 'overview' ? 'performance' : tab as any)}
                  disabled={isAnalyzing}
                  size="sm"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 me-2" />
                  )}
                  {isArabic ? 'تحليل بالذكاء الاصطناعي' : 'Analyze with AI'}
                </Button>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">
                      {isArabic ? 'جاري التحليل بالذكاء الاصطناعي...' : 'Analyzing with AI...'}
                    </p>
                  </div>
                ) : analysis ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {analysis}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Brain className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="font-medium text-lg mb-2">
                      {isArabic ? 'اضغط على زر التحليل' : 'Click Analyze Button'}
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      {isArabic 
                        ? 'سيقوم الذكاء الاصطناعي بتحليل بياناتك وتقديم رؤى وتوصيات مخصصة'
                        : 'AI will analyze your data and provide customized insights and recommendations'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Summary Stats */}
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
            <div className="p-4 rounded-lg bg-green-500/10">
              <p className="text-2xl font-bold text-green-500">{completedTasks}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'مكتملة' : 'Completed'}</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10">
              <p className="text-2xl font-bold text-amber-500">
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