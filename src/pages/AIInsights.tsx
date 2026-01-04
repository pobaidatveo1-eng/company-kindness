import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { useCompanyUsers } from '@/hooks/useUsers';
import { useLeads } from '@/hooks/useLeads';
import { useMeetings } from '@/hooks/useMeetings';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Target,
  Lightbulb,
  BarChart3,
  Scale,
  AlertOctagon,
  Loader2,
  RefreshCw,
  Sparkles,
  FileText,
  Calendar,
  Users
} from 'lucide-react';
import { differenceInDays } from 'date-fns';

type AnalysisType = 'performance' | 'workload' | 'risks' | 'recommendations' | 'executive_summary' | 'daily_priorities';

const AIInsights = () => {
  const { language } = useLanguage();
  const { tasks } = useTasks();
  const { data: companyUsers = [] } = useCompanyUsers();
  const { leads } = useLeads();
  const { meetings } = useMeetings();
  const { analyze, isAnalyzing, results } = useAIAnalysis();
  const isArabic = language === 'ar';
  const [activeTab, setActiveTab] = useState<AnalysisType>('performance');

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

  const runAnalysis = async (type: AnalysisType) => {
    await analyze(type, {
      tasks,
      employees: companyUsers,
      leads,
      meetings,
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

  const tabs: { id: AnalysisType; icon: React.ElementType; label: { ar: string; en: string } }[] = [
    { id: 'performance', icon: BarChart3, label: { ar: 'الأداء', en: 'Performance' } },
    { id: 'workload', icon: Scale, label: { ar: 'الأحمال', en: 'Workload' } },
    { id: 'risks', icon: AlertOctagon, label: { ar: 'المخاطر', en: 'Risks' } },
    { id: 'recommendations', icon: Lightbulb, label: { ar: 'التوصيات', en: 'Recommendations' } },
    { id: 'executive_summary', icon: FileText, label: { ar: 'ملخص تنفيذي', en: 'Executive Summary' } },
    { id: 'daily_priorities', icon: Calendar, label: { ar: 'أولويات اليوم', en: 'Daily Priorities' } },
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

  const getTabTitle = (tab: AnalysisType) => {
    const titles: Record<AnalysisType, { ar: string; en: string }> = {
      performance: { ar: 'تحليل الأداء', en: 'Performance Analysis' },
      workload: { ar: 'تحليل الأحمال', en: 'Workload Analysis' },
      risks: { ar: 'تحليل المخاطر', en: 'Risk Analysis' },
      recommendations: { ar: 'التوصيات الذكية', en: 'Smart Recommendations' },
      executive_summary: { ar: 'الملخص التنفيذي', en: 'Executive Summary' },
      daily_priorities: { ar: 'أولويات اليوم', en: 'Daily Priorities' },
    };
    return isArabic ? titles[tab].ar : titles[tab].en;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            {isArabic ? 'مركز الذكاء الاصطناعي' : 'AI Command Center'}
          </h1>
          <p className="text-muted-foreground">
            {isArabic ? 'تحليل ذكي شامل لأداء فريقك والشركة' : 'Comprehensive AI analysis of your team and company performance'}
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

      {/* Additional Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{leads.length}</p>
                <p className="text-sm text-muted-foreground">{isArabic ? 'عميل محتمل' : 'Leads'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{meetings.filter(m => m.status === 'scheduled').length}</p>
                <p className="text-sm text-muted-foreground">{isArabic ? 'اجتماع قادم' : 'Upcoming Meetings'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{leads.filter(l => l.status === 'closed_won').length}</p>
                <p className="text-sm text-muted-foreground">{isArabic ? 'صفقة ناجحة' : 'Closed Won'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnalysisType)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1 text-xs md:text-sm">
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{isArabic ? tab.label.ar : tab.label.en}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {getTabTitle(tab.id)}
                </CardTitle>
                <Button 
                  onClick={() => runAnalysis(tab.id)}
                  disabled={isAnalyzing || results[tab.id]?.loading}
                  size="sm"
                >
                  {(isAnalyzing || results[tab.id]?.loading) ? (
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 me-2" />
                  )}
                  {isArabic ? 'تحليل بالذكاء الاصطناعي' : 'Analyze with AI'}
                </Button>
              </CardHeader>
              <CardContent>
                {results[tab.id]?.loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">
                      {isArabic ? 'جاري التحليل بالذكاء الاصطناعي...' : 'Analyzing with AI...'}
                    </p>
                  </div>
                ) : results[tab.id]?.content ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {results[tab.id].content}
                    </div>
                  </div>
                ) : results[tab.id]?.error ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertTriangle className="h-16 w-16 text-destructive/30 mb-4" />
                    <h3 className="font-medium text-lg mb-2 text-destructive">
                      {isArabic ? 'حدث خطأ' : 'Error Occurred'}
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      {results[tab.id].error}
                    </p>
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
          <CardTitle>{isArabic ? 'ملخص الأداء العام' : 'Overall Performance Summary'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5 text-center">
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
            <div className="p-4 rounded-lg bg-blue-500/10">
              <p className="text-2xl font-bold text-blue-500">{companyUsers.length}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'الفريق' : 'Team'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;