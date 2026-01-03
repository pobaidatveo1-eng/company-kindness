import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Building2, Palette, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const CompanySettings = () => {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isArabic = language === 'ar';

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    primary_color: '#f97316',
  });

  React.useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        name_ar: company.name_ar || '',
        primary_color: company.primary_color || '#f97316',
      });
    }
  }, [company]);

  const updateCompany = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!profile?.company_id) throw new Error('No company');
      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          name_ar: data.name_ar,
          primary_color: data.primary_color,
        })
        .eq('id', profile.company_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success(isArabic ? 'تم حفظ الإعدادات' : 'Settings saved');
    },
    onError: () => {
      toast.error(isArabic ? 'حدث خطأ' : 'Error saving settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          {isArabic ? 'إعدادات الشركة' : 'Company Settings'}
        </h1>
        <p className="text-muted-foreground">
          {isArabic ? 'إدارة إعدادات الشركة والعلامة التجارية' : 'Manage company settings and branding'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {isArabic ? 'معلومات الشركة' : 'Company Information'}
            </CardTitle>
            <CardDescription>
              {isArabic ? 'المعلومات الأساسية للشركة' : 'Basic company information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{isArabic ? 'اسم الشركة (English)' : 'Company Name (English)'}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ar">{isArabic ? 'اسم الشركة (عربي)' : 'Company Name (Arabic)'}</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="اسم الشركة"
                  dir="rtl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {isArabic ? 'العلامة التجارية' : 'Branding'}
            </CardTitle>
            <CardDescription>
              {isArabic ? 'تخصيص مظهر التطبيق' : 'Customize the app appearance'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">{isArabic ? 'اللون الرئيسي' : 'Primary Color'}</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="primary_color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  placeholder="#f97316"
                  className="flex-1 max-w-32"
                />
                <div 
                  className="w-10 h-10 rounded-lg border"
                  style={{ backgroundColor: formData.primary_color }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateCompany.isPending}>
            {updateCompany.isPending ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 me-2" />
            )}
            {isArabic ? 'حفظ الإعدادات' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CompanySettings;
