import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompanyUsers } from '@/hooks/useUsers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateManualItemData, ManualItem } from '@/hooks/useManualItems';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  title_ar: z.string().optional(),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  date: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.string().default('pending'),
  priority: z.string().default('medium'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateManualItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateManualItemData) => void;
  isLoading?: boolean;
  editItem?: ManualItem | null;
}

const itemTypes = [
  { value: 'photoshoot', labelEn: 'Photoshoot', labelAr: 'جلسة تصوير' },
  { value: 'meeting', labelEn: 'Meeting', labelAr: 'اجتماع' },
  { value: 'site_visit', labelEn: 'Site Visit', labelAr: 'زيارة موقع' },
  { value: 'document', labelEn: 'Document', labelAr: 'وثيقة' },
  { value: 'note', labelEn: 'Note', labelAr: 'ملاحظة' },
  { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
];

const statusOptions = [
  { value: 'pending', labelEn: 'Pending', labelAr: 'معلق' },
  { value: 'in_progress', labelEn: 'In Progress', labelAr: 'قيد التنفيذ' },
  { value: 'completed', labelEn: 'Completed', labelAr: 'مكتمل' },
  { value: 'cancelled', labelEn: 'Cancelled', labelAr: 'ملغي' },
];

const priorityOptions = [
  { value: 'low', labelEn: 'Low', labelAr: 'منخفض' },
  { value: 'medium', labelEn: 'Medium', labelAr: 'متوسط' },
  { value: 'high', labelEn: 'High', labelAr: 'عالي' },
  { value: 'urgent', labelEn: 'Urgent', labelAr: 'عاجل' },
];

const CreateManualItemDialog: React.FC<CreateManualItemDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  editItem,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const { data: users = [] } = useCompanyUsers();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editItem?.title || '',
      title_ar: editItem?.title_ar || '',
      description: editItem?.description || '',
      description_ar: editItem?.description_ar || '',
      type: editItem?.type || '',
      date: editItem?.date || '',
      assigned_to: editItem?.assigned_to || '',
      status: editItem?.status || 'pending',
      priority: editItem?.priority || 'medium',
    },
  });

  React.useEffect(() => {
    if (editItem) {
      form.reset({
        title: editItem.title,
        title_ar: editItem.title_ar || '',
        description: editItem.description || '',
        description_ar: editItem.description_ar || '',
        type: editItem.type,
        date: editItem.date || '',
        assigned_to: editItem.assigned_to || '',
        status: editItem.status,
        priority: editItem.priority,
      });
    } else {
      form.reset({
        title: '',
        title_ar: '',
        description: '',
        description_ar: '',
        type: '',
        date: '',
        assigned_to: '',
        status: 'pending',
        priority: 'medium',
      });
    }
  }, [editItem, form]);

  const handleSubmit = (values: FormValues) => {
    const data: CreateManualItemData = {
      title: values.title,
      title_ar: values.title_ar || undefined,
      description: values.description || undefined,
      description_ar: values.description_ar || undefined,
      type: values.type,
      date: values.date || undefined,
      assigned_to: values.assigned_to || undefined,
      status: values.status,
      priority: values.priority,
    };
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editItem
              ? isArabic ? 'تعديل البند' : 'Edit Item'
              : isArabic ? 'إضافة بند جديد' : 'Add New Item'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'العنوان (إنجليزي)' : 'Title (English)'}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={isArabic ? 'أدخل العنوان' : 'Enter title'} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'العنوان (عربي)' : 'Title (Arabic)'}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={isArabic ? 'أدخل العنوان بالعربية' : 'Enter Arabic title'} dir="rtl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'النوع' : 'Type'}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isArabic ? 'اختر النوع' : 'Select type'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {itemTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {isArabic ? type.labelAr : type.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'التاريخ' : 'Date'}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'الحالة' : 'Status'}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {isArabic ? status.labelAr : status.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'الأولوية' : 'Priority'}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {isArabic ? priority.labelAr : priority.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'المسؤول' : 'Assigned To'}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isArabic ? 'اختر موظف' : 'Select employee'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {isArabic ? user.full_name_ar || user.full_name : user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'الوصف (إنجليزي)' : 'Description (English)'}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={isArabic ? 'أدخل الوصف' : 'Enter description'} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'الوصف (عربي)' : 'Description (Arabic)'}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={isArabic ? 'أدخل الوصف بالعربية' : 'Enter Arabic description'} rows={3} dir="rtl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? isArabic ? 'جاري الحفظ...' : 'Saving...'
                  : editItem
                    ? isArabic ? 'تحديث' : 'Update'
                    : isArabic ? 'إضافة' : 'Add'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateManualItemDialog;
