import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const departmentsList = [
  { id: 'hr', name: 'Human Resources', name_ar: 'الموارد البشرية' },
  { id: 'finance', name: 'Finance', name_ar: 'المالية' },
  { id: 'it', name: 'IT', name_ar: 'تقنية المعلومات' },
  { id: 'operations', name: 'Operations', name_ar: 'العمليات' },
  { id: 'marketing', name: 'Marketing', name_ar: 'التسويق' },
  { id: 'sales', name: 'Sales', name_ar: 'المبيعات' },
  { id: 'legal', name: 'Legal', name_ar: 'الشؤون القانونية' },
  { id: 'executive', name: 'Executive', name_ar: 'الإدارة التنفيذية' },
];

const Departments = () => {
  const { language } = useLanguage();
  const { tasks } = useTasks();
  const isArabic = language === 'ar';

  const getDepartmentStats = (deptId: string) => {
    const deptTasks = tasks.filter(t => t.department === deptId);
    const completed = deptTasks.filter(t => t.status === 'completed').length;
    const inProgress = deptTasks.filter(t => t.status === 'in_progress').length;
    const pending = deptTasks.filter(t => t.status === 'pending').length;
    const overdue = deptTasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length;
    
    const total = deptTasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, inProgress, pending, overdue, completionRate };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isArabic ? 'حمل الأقسام' : 'Department Load'}</h1>
        <p className="text-muted-foreground">
          {isArabic ? 'نظرة عامة على توزيع المهام في الأقسام' : 'Overview of task distribution across departments'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departmentsList.map((dept) => {
          const stats = getDepartmentStats(dept.id);
          
          return (
            <Card key={dept.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {isArabic ? dept.name_ar : dept.name}
                  </CardTitle>
                  {stats.overdue > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.overdue} {isArabic ? 'متأخرة' : 'overdue'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isArabic ? 'نسبة الإنجاز' : 'Completion Rate'}
                  </span>
                  <span className="font-medium">{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
                
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle2 className="h-4 w-4 mx-auto text-success mb-1" />
                    <p className="font-medium">{stats.completed}</p>
                    <p className="text-muted-foreground">{isArabic ? 'مكتملة' : 'Done'}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Clock className="h-4 w-4 mx-auto text-warning mb-1" />
                    <p className="font-medium">{stats.inProgress}</p>
                    <p className="text-muted-foreground">{isArabic ? 'قيد التنفيذ' : 'In Progress'}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <AlertTriangle className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="font-medium">{stats.pending}</p>
                    <p className="text-muted-foreground">{isArabic ? 'معلقة' : 'Pending'}</p>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                  {isArabic ? `${stats.total} مهمة إجمالاً` : `${stats.total} total tasks`}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Departments;
