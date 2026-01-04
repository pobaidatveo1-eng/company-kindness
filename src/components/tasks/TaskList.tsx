import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, Task, TaskStatus, CreateTaskData, UpdateTaskData } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter } from 'lucide-react';
import TaskCard from './TaskCard';
import CreateTaskDialog from './CreateTaskDialog';
import TaskDetailDialog from './TaskDetailDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const TaskList: React.FC = () => {
  const { language } = useLanguage();
  const { userRole, profile } = useAuth();
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  
  const isArabic = language === 'ar';
  const canManage = userRole?.role === 'super_admin' || userRole?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchLower) ||
        (task.title_ar && task.title_ar.includes(searchQuery)) ||
        (task.description && task.description.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  // Group tasks by status for Kanban-style view
  const tasksByStatus = useMemo(() => {
    return {
      pending: filteredTasks.filter(t => t.status === 'pending'),
      in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
      completed: filteredTasks.filter(t => t.status === 'completed'),
    };
  }, [filteredTasks]);

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateTask.mutate({ id, status });
  };

  const handleReassign = (taskId: string, newAssigneeId: string) => {
    updateTask.mutate({ id: taskId, assigned_to: newAssigneeId });
  };

  const handleEdit = (task: Task) => {
    setEditTask(task);
    setCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTaskId(id);
  };

  const confirmDelete = () => {
    if (deleteTaskId) {
      deleteTask.mutate(deleteTaskId);
      setDeleteTaskId(null);
    }
  };

  const handleSubmit = (data: CreateTaskData | UpdateTaskData) => {
    if ('id' in data) {
      updateTask.mutate(data, {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setEditTask(null);
        },
      });
    } else {
      createTask.mutate(data, {
        onSuccess: () => {
          setCreateDialogOpen(false);
        },
      });
    }
  };

  const statusTabs = [
    { value: 'all', label: isArabic ? 'الكل' : 'All', count: filteredTasks.length },
    { value: 'pending', label: isArabic ? 'معلقة' : 'Pending', count: tasksByStatus.pending.length },
    { value: 'in_progress', label: isArabic ? 'قيد التنفيذ' : 'In Progress', count: tasksByStatus.in_progress.length },
    { value: 'completed', label: isArabic ? 'مكتملة' : 'Completed', count: tasksByStatus.completed.length },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isArabic ? 'المهام' : 'Tasks'}</h1>
          <p className="text-muted-foreground">
            {isArabic ? `${filteredTasks.length} مهمة` : `${filteredTasks.length} tasks`}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 me-2" />
            {isArabic ? 'مهمة جديدة' : 'New Task'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isArabic ? 'بحث في المهام...' : 'Search tasks...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 me-2" />
            <SelectValue placeholder={isArabic ? 'الأولوية' : 'Priority'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isArabic ? 'كل الأولويات' : 'All Priorities'}</SelectItem>
            <SelectItem value="urgent">{isArabic ? 'عاجل' : 'Urgent'}</SelectItem>
            <SelectItem value="high">{isArabic ? 'عالي' : 'High'}</SelectItem>
            <SelectItem value="medium">{isArabic ? 'متوسط' : 'Medium'}</SelectItem>
            <SelectItem value="low">{isArabic ? 'منخفض' : 'Low'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {tab.label}
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {isArabic ? 'لا توجد مهام' : 'No tasks found'}
            </div>
          ) : (
            <div className="grid gap-3">
              {(statusFilter === 'all' ? filteredTasks : filteredTasks.filter(t => t.status === statusFilter))
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={setViewTask}
                    onReassign={handleReassign}
                    canManage={canManage || task.assigned_to === profile?.id}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setEditTask(null);
        }}
        onSubmit={handleSubmit}
        isLoading={createTask.isPending || updateTask.isPending}
        editTask={editTask}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArabic ? 'حذف المهمة' : 'Delete Task'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic 
                ? 'هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this task? This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isArabic ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={viewTask}
        open={!!viewTask}
        onOpenChange={(open) => !open && setViewTask(null)}
      />
    </div>
  );
};

export default TaskList;
