import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTasks, useTeamMembers } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Scale, User, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const LoadBalance = () => {
  const { language } = useLanguage();
  const { tasks } = useTasks();
  const { teamMembers } = useTeamMembers();
  const isArabic = language === 'ar';

  const getTeamMemberStats = () => {
    return teamMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assigned_to === member.id);
      const completed = memberTasks.filter(t => t.status === 'completed').length;
      const inProgress = memberTasks.filter(t => t.status === 'in_progress').length;
      const pending = memberTasks.filter(t => t.status === 'pending').length;
      const active = inProgress + pending;
      
      return {
        ...member,
        total: memberTasks.length,
        completed,
        inProgress,
        pending,
        active,
      };
    }).sort((a, b) => b.active - a.active);
  };

  const memberStats = getTeamMemberStats();
  const maxActive = Math.max(...memberStats.map(m => m.active), 1);
  const avgActive = memberStats.length > 0 
    ? memberStats.reduce((sum, m) => sum + m.active, 0) / memberStats.length 
    : 0;

  const getLoadIndicator = (active: number) => {
    if (active > avgActive * 1.5) {
      return { icon: TrendingUp, color: 'text-destructive', label: isArabic ? 'حمل عالي' : 'High Load' };
    }
    if (active < avgActive * 0.5) {
      return { icon: TrendingDown, color: 'text-warning', label: isArabic ? 'حمل منخفض' : 'Low Load' };
    }
    return { icon: Minus, color: 'text-success', label: isArabic ? 'متوازن' : 'Balanced' };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          {isArabic ? 'توازن الأحمال' : 'Load Balance'}
        </h1>
        <p className="text-muted-foreground">
          {isArabic ? 'توزيع المهام على أعضاء الفريق' : 'Task distribution across team members'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{teamMembers.length}</p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'أعضاء الفريق' : 'Team Members'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'المهام النشطة' : 'Active Tasks'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{avgActive.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'متوسط المهام لكل شخص' : 'Avg Tasks/Person'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Load */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? 'توزيع المهام على الفريق' : 'Team Task Distribution'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {memberStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isArabic ? 'لا يوجد أعضاء في الفريق' : 'No team members found'}
            </div>
          ) : (
            memberStats.map((member) => {
              const loadIndicator = getLoadIndicator(member.active);
              const LoadIcon = loadIndicator.icon;
              const name = isArabic ? (member.full_name_ar || member.full_name) : member.full_name;
              
              return (
                <div key={member.id} className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{name}</span>
                        <Badge variant="outline" className="text-xs">
                          <LoadIcon className={`h-3 w-3 me-1 ${loadIndicator.color}`} />
                          {loadIndicator.label}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {member.active} {isArabic ? 'مهمة نشطة' : 'active'}
                      </span>
                    </div>
                    <Progress 
                      value={(member.active / maxActive) * 100} 
                      className="h-2"
                    />
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{member.inProgress} {isArabic ? 'قيد التنفيذ' : 'in progress'}</span>
                      <span>{member.pending} {isArabic ? 'معلقة' : 'pending'}</span>
                      <span>{member.completed} {isArabic ? 'مكتملة' : 'completed'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadBalance;
