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
  TrendingDown,
  Users,
  FileCheck,
  Lightbulb,
  Shield
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const SuperAdminDashboard = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();

  const menuItems = [
    {
      title: t('dashboard.companyHealth'),
      icon: Building2,
      value: '92%',
      trend: '+5%',
      trendUp: true,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: t('dashboard.departmentLoad'),
      icon: BarChart3,
      value: '85%',
      trend: '+2%',
      trendUp: true,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: t('dashboard.aiInsights'),
      icon: Brain,
      value: '7',
      trend: 'جديد',
      trendUp: true,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: t('dashboard.risks'),
      icon: AlertOctagon,
      value: '2',
      trend: '-3',
      trendUp: false,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const departments = [
    { name: 'التصميم', load: 85, employees: 5, tasks: 24 },
    { name: 'السوشيال ميديا', load: 72, employees: 4, tasks: 18 },
    { name: 'المحتوى', load: 60, employees: 3, tasks: 12 },
    { name: 'الفيديو', load: 90, employees: 2, tasks: 8 },
  ];

  const aiInsights = [
    { 
      type: 'warning',
      title: 'قسم الفيديو مُحمّل زيادة',
      description: 'نقترح توزيع بعض المهام على قسم التصميم',
      icon: Lightbulb,
    },
    { 
      type: 'info',
      title: 'أحمد محمد يُنجز بسرعة',
      description: 'يمكن تكليفه بمهام إضافية هذا الأسبوع',
      icon: TrendingUp,
    },
    { 
      type: 'danger',
      title: 'عقد العميل ABC ينتهي قريباً',
      description: 'يجب التجديد خلال 7 أيام',
      icon: Shield,
    },
  ];

  const risks = [
    { title: '3 مهام متأخرة لأكثر من يومين', severity: 'high' },
    { title: 'عميل لم يُستجب له منذ 5 أيام', severity: 'medium' },
  ];

  const getLoadColor = (load: number) => {
    if (load >= 90) return 'text-destructive';
    if (load >= 75) return 'text-amber-500';
    return 'text-green-500';
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-500/10 border-amber-500';
      case 'danger':
        return 'bg-destructive/10 border-destructive';
      default:
        return 'bg-blue-500/10 border-blue-500';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          مرحباً، {profile?.full_name || 'المدير العام'} 👋
        </h2>
        <p className="text-muted-foreground">إليك نظرة شاملة على صحة الشركة</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {menuItems.map((item) => (
          <Card 
            key={item.title} 
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs ${item.trendUp ? 'text-green-500' : 'text-destructive'}`}>
                  {item.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {item.trend}
                </div>
              </div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Departments Load */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t('dashboard.departmentLoad')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departments.map((dept) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dept.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {dept.employees}
                      </span>
                    </div>
                    <span className={`font-bold ${getLoadColor(dept.load)}`}>
                      {dept.load}%
                    </span>
                  </div>
                  <Progress 
                    value={dept.load} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              {t('dashboard.aiInsights')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-r-4 ${getInsightBg(insight.type)}`}
                >
                  <div className="flex items-start gap-2">
                    <insight.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{insight.title}</p>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risks & Violations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-amber-500" />
            {t('dashboard.risks')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {risks.map((risk, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  risk.severity === 'high' 
                    ? 'bg-destructive/10 border border-destructive/30' 
                    : 'bg-amber-500/10 border border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertOctagon className={`h-5 w-5 ${risk.severity === 'high' ? 'text-destructive' : 'text-amber-500'}`} />
                  <p className="font-medium">{risk.title}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Company Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-green-500" />
            ملخص الشركة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">14</p>
              <p className="text-sm text-muted-foreground">موظف نشط</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-green-500">62</p>
              <p className="text-sm text-muted-foreground">مهمة مكتملة</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-blue-500">8</p>
              <p className="text-sm text-muted-foreground">عميل نشط</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-purple-500">5</p>
              <p className="text-sm text-muted-foreground">عقد فعّال</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
