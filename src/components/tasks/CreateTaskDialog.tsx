import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeamMembers, CreateTaskData, TaskPriority, Task, UpdateTaskData } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  title_ar: z.string().optional(),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to: z.string().optional(),
  department: z.string().optional(),
  due_date: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTaskData | UpdateTaskData) => void;
  isLoading: boolean;
  editTask?: Task | null;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  editTask,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const { teamMembers } = useTeamMembers();

  const departments = [
    { value: 'design', label: isArabic ? 'التصميم' : 'Design' },
    { value: 'content', label: isArabic ? 'المحتوى' : 'Content' },
    { value: 'social_media', label: isArabic ? 'السوشيال ميديا' : 'Social Media' },
    { value: 'video', label: isArabic ? 'الفيديو' : 'Video' },
    { value: 'development', label: isArabic ? 'التطوير' : 'Development' },
    { value: 'marketing', label: isArabic ? 'التسويق' : 'Marketing' },
    { value: 'sales', label: isArabic ? 'المبيعات' : 'Sales' },
    { value: 'hr', label: isArabic ? 'الموارد البشرية' : 'HR' },
  ];

  const priorities: { value: TaskPriority; label: string }[] = [
    { value: 'low', label: isArabic ? 'منخفض' : 'Low' },
    { value: 'medium', label: isArabic ? 'متوسط' : 'Medium' },
    { value: 'high', label: isArabic ? 'عالي' : 'High' },
    { value: 'urgent', label: isArabic ? 'عاجل' : 'Urgent' },
  ];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: editTask ? {
      title: editTask.title,
      title_ar: editTask.title_ar || '',
      description: editTask.description || '',
      description_ar: editTask.description_ar || '',
      priority: editTask.priority,
      assigned_to: editTask.assigned_to || '',
      department: editTask.department || '',
      due_date: editTask.due_date ? editTask.due_date.split('T')[0] : '',
    } : {
      priority: 'medium',
    },
  });

  React.useEffect(() => {
    if (editTask) {
      reset({
        title: editTask.title,
        title_ar: editTask.title_ar || '',
        description: editTask.description || '',
        description_ar: editTask.description_ar || '',
        priority: editTask.priority,
        assigned_to: editTask.assigned_to || '',
        department: editTask.department || '',
        due_date: editTask.due_date ? editTask.due_date.split('T')[0] : '',
      });
    } else {
      reset({ priority: 'medium' });
    }
  }, [editTask, reset]);

  const handleFormSubmit = (data: TaskFormData) => {
    const submitData = {
      ...data,
      assigned_to: data.assigned_to || undefined,
      department: data.department || undefined,
      due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined,
    };

    if (editTask) {
      onSubmit({ id: editTask.id, ...submitData });
    } else {
      onSubmit(submitData as CreateTaskData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editTask 
              ? (isArabic ? 'تعديل المهمة' : 'Edit Task')
              : (isArabic ? 'إنشاء مهمة جديدة' : 'Create New Task')
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>{isArabic ? 'العنوان (إنجليزي)' : 'Title (English)'}</Label>
            <Input
              {...register('title')}
              placeholder={isArabic ? 'أدخل عنوان المهمة' : 'Enter task title'}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{isArabic ? 'العنوان (عربي)' : 'Title (Arabic)'}</Label>
            <Input
              {...register('title_ar')}
              placeholder={isArabic ? 'أدخل العنوان بالعربية' : 'Enter Arabic title'}
              dir="rtl"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{isArabic ? 'الوصف' : 'Description'}</Label>
            <Textarea
              {...register('description')}
              placeholder={isArabic ? 'أدخل وصف المهمة' : 'Enter task description'}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label>{isArabic ? 'الأولوية' : 'Priority'}</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label>{isArabic ? 'القسم' : 'Department'}</Label>
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder={isArabic ? 'اختر القسم' : 'Select department'} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Assigned To */}
            <div className="space-y-2">
              <Label>{isArabic ? 'تعيين إلى' : 'Assign To'}</Label>
              <Controller
                name="assigned_to"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder={isArabic ? 'اختر موظف' : 'Select employee'} />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {isArabic ? (member.full_name_ar || member.full_name) : member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>{isArabic ? 'تاريخ الاستحقاق' : 'Due Date'}</Label>
              <Input
                type="date"
                {...register('due_date')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
                : editTask 
                  ? (isArabic ? 'حفظ التغييرات' : 'Save Changes')
                  : (isArabic ? 'إنشاء المهمة' : 'Create Task')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
