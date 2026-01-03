import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeamMembers } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Mail, Phone, Building2 } from 'lucide-react';

const TeamSettings = () => {
  const { language } = useLanguage();
  const { teamMembers, isLoading } = useTeamMembers();
  const isArabic = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = teamMembers.filter(member => {
    const search = searchQuery.toLowerCase();
    return (
      member.full_name.toLowerCase().includes(search) ||
      (member.full_name_ar && member.full_name_ar.includes(searchQuery))
    );
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDepartmentLabel = (dept: string | null) => {
    if (!dept) return null;
    const deptMap: Record<string, { en: string; ar: string }> = {
      hr: { en: 'Human Resources', ar: 'الموارد البشرية' },
      finance: { en: 'Finance', ar: 'المالية' },
      it: { en: 'IT', ar: 'تقنية المعلومات' },
      operations: { en: 'Operations', ar: 'العمليات' },
      marketing: { en: 'Marketing', ar: 'التسويق' },
      sales: { en: 'Sales', ar: 'المبيعات' },
      legal: { en: 'Legal', ar: 'الشؤون القانونية' },
      executive: { en: 'Executive', ar: 'الإدارة التنفيذية' },
    };
    return isArabic ? deptMap[dept]?.ar || dept : deptMap[dept]?.en || dept;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          {isArabic ? 'إعدادات الفريق' : 'Team Settings'}
        </h1>
        <p className="text-muted-foreground">
          {isArabic ? 'إدارة أعضاء الفريق والصلاحيات' : 'Manage team members and permissions'}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isArabic ? 'بحث عن عضو...' : 'Search member...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{teamMembers.length}</p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'إجمالي الأعضاء' : 'Total Members'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-success">
                {teamMembers.filter(m => m.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'نشط' : 'Active'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-muted-foreground">
                {teamMembers.filter(m => !m.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'غير نشط' : 'Inactive'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? 'أعضاء الفريق' : 'Team Members'}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isArabic ? 'لا يوجد أعضاء' : 'No members found'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => {
                const name = isArabic ? (member.full_name_ar || member.full_name) : member.full_name;
                
                return (
                  <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{name}</span>
                        <Badge variant={member.is_active ? 'default' : 'secondary'}>
                          {member.is_active 
                            ? (isArabic ? 'نشط' : 'Active')
                            : (isArabic ? 'غير نشط' : 'Inactive')}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                        {member.department && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {getDepartmentLabel(member.department)}
                          </span>
                        )}
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
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

export default TeamSettings;
