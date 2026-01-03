import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Task, TaskStatus, TaskPriority } from '@/hooks/useTasks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle,
  User,
  Calendar,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import TaskComments from './TaskComments';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({ 
  task, 
  open, 
  onOpenChange 
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const dateLocale = isArabic ? ar : enUS;

  if (!task) return null;

  const title = isArabic ? (task.title_ar || task.title) : task.title;
  const description = isArabic ? (task.description_ar || task.description) : task.description;
  const assigneeName = task.assignee 
    ? (isArabic ? (task.assignee.full_name_ar || task.assignee.full_name) : task.assignee.full_name)
    : null;

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return { 
          icon: CheckCircle2, 
          color: 'bg-success/10 text-success border-success/20',
          label: isArabic ? 'مكتملة' : 'Completed'
        };
      case 'in_progress':
        return { 
          icon: Clock, 
          color: 'bg-warning/10 text-warning border-warning/20',
          label: isArabic ? 'قيد التنفيذ' : 'In Progress'
        };
      case 'cancelled':
        return { 
          icon: XCircle, 
          color: 'bg-muted text-muted-foreground border-muted',
          label: isArabic ? 'ملغاة' : 'Cancelled'
        };
      default:
        return { 
          icon: AlertTriangle, 
          color: 'bg-muted text-muted-foreground border-muted',
          label: isArabic ? 'معلقة' : 'Pending'
        };
    }
  };

  const getPriorityConfig = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return { 
          color: 'bg-destructive text-destructive-foreground',
          label: isArabic ? 'عاجل' : 'Urgent'
        };
      case 'high':
        return { 
          color: 'bg-destructive/80 text-destructive-foreground',
          label: isArabic ? 'عالي' : 'High'
        };
      case 'medium':
        return { 
          color: 'bg-warning text-warning-foreground',
          label: isArabic ? 'متوسط' : 'Medium'
        };
      default:
        return { 
          color: 'bg-muted text-muted-foreground',
          label: isArabic ? 'منخفض' : 'Low'
        };
    }
  };

  const statusConfig = getStatusConfig(task.status);
  const priorityConfig = getPriorityConfig(task.priority);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusConfig.color.split(' ')[1]}`} />
            <DialogTitle className="text-start">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={priorityConfig.color}>
              {priorityConfig.label}
            </Badge>
            <Badge variant="outline" className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Description */}
          {description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                {isArabic ? 'الوصف' : 'Description'}
              </h4>
              <p className="text-sm whitespace-pre-wrap">{description}</p>
            </div>
          )}

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {assigneeName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{assigneeName}</span>
              </div>
            )}
            
            {task.due_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(task.due_date), 'dd MMM yyyy', { locale: dateLocale })}</span>
              </div>
            )}

            {task.department && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{task.department}</span>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t pt-4">
            <TaskComments taskId={task.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
