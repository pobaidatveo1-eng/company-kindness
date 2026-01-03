import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ManualItems = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {isArabic ? 'البنود اليدوية' : 'Manual Items'}
          </h1>
          <p className="text-muted-foreground">
            {isArabic ? 'إدارة البنود والوثائق اليدوية' : 'Manage manual items and documents'}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 me-2" />
          {isArabic ? 'إضافة بند' : 'Add Item'}
        </Button>
      </div>

      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {isArabic ? 'لا توجد بنود يدوية' : 'No Manual Items'}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {isArabic 
                ? 'ابدأ بإضافة بنود يدوية لتتبع الوثائق والملاحظات المهمة'
                : 'Start adding manual items to track important documents and notes'}
            </p>
            <Button className="mt-4">
              <Plus className="h-4 w-4 me-2" />
              {isArabic ? 'إضافة أول بند' : 'Add First Item'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualItems;
