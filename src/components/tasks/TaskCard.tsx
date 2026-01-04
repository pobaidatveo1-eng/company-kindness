import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Task, TaskStatus, TaskPriority, useTeamMembers } from '@/hooks/useTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MoreVertical,
  User,
  Calendar,
  Trash2,
  Edit,
  PlayCircle,
  XCircle,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onView: (task: Task) => void;
  onReassign?: (taskId: string, newAssigneeId: string) => void;
  canManage: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onStatusChange, 
  onEdit, 
  onDelete,
  onView,
  onReassign,
  canManage 
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const dateLocale = isArabic ? ar : enUS;
  const { teamMembers } = useTeamMembers();
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  const title = isArabic ? (task.title_ar || task.title) : task.title;
  const description = isArabic ? (task.description_ar || task.description) : task.description;
  const assigneeName = task.assignee 
    ? (isArabic ? (task.assignee.full_name_ar || task.assignee.full_name) : task.assignee.full_name)
    : null;

  const handleReassign = () => {
    if (onReassign && selectedAssignee) {
      onReassign(task.id, selectedAssignee);
      setReassignDialogOpen(false);
      setSelectedAssignee('');
    }
  };

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

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <Card 
      className={`transition-all hover:shadow-md cursor-pointer ${isOverdue ? 'border-destructive/50' : ''}`}
      onClick={() => onView(task)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon className={`h-5 w-5 flex-shrink-0 ${statusConfig.color.split(' ')[1]}`} />
              <h3 className={`font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                {title}
              </h3>
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {description}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className={priorityConfig.color}>
                {priorityConfig.label}
              </Badge>
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
              
              {assigneeName && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{assigneeName}</span>
                </div>
              )}
              
              {task.due_date && (
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(task.due_date), 'dd MMM', { locale: dateLocale })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {task.status === 'pending' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'in_progress'); }}>
                  <PlayCircle className="h-4 w-4 me-2" />
                  {isArabic ? 'بدء العمل' : 'Start Work'}
                </DropdownMenuItem>
              )}
              {task.status === 'in_progress' && (
                <>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'completed'); }}>
                    <CheckCircle2 className="h-4 w-4 me-2" />
                    {isArabic ? 'إكمال المهمة' : 'Complete Task'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(task); }}>
                    <MessageSquare className="h-4 w-4 me-2" />
                    {isArabic ? 'إضافة تحديث' : 'Add Update'}
                  </DropdownMenuItem>
                </>
              )}
              {task.status !== 'pending' && task.status !== 'cancelled' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'pending'); }}>
                  <AlertTriangle className="h-4 w-4 me-2" />
                  {isArabic ? 'إعادة للمعلق' : 'Move to Pending'}
                </DropdownMenuItem>
              )}
              
              {/* نقل المهمة لموظف آخر */}
              {onReassign && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setReassignDialogOpen(true); }}>
                  <UserPlus className="h-4 w-4 me-2" />
                  {isArabic ? 'نقل لموظف آخر' : 'Reassign'}
                </DropdownMenuItem>
              )}

              {task.status !== 'cancelled' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'cancelled'); }}>
                    <XCircle className="h-4 w-4 me-2" />
                    {isArabic ? 'إلغاء المهمة' : 'Cancel Task'}
                  </DropdownMenuItem>
                </>
              )}

              {canManage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                    <Edit className="h-4 w-4 me-2" />
                    {isArabic ? 'تعديل' : 'Edit'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 me-2" />
                    {isArabic ? 'حذف' : 'Delete'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      {/* Reassign Dialog */}
      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{isArabic ? 'نقل المهمة لموظف آخر' : 'Reassign Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isArabic ? 'اختر الموظف الجديد' : 'Select New Assignee'}</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={isArabic ? 'اختر موظف' : 'Select employee'} />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers
                    .filter(m => m.id !== task.assigned_to)
                    .map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {isArabic ? (member.full_name_ar || member.full_name) : member.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleReassign} className="w-full" disabled={!selectedAssignee}>
              {isArabic ? 'نقل المهمة' : 'Reassign Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TaskCard;
