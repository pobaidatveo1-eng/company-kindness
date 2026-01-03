import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useManualItems, ManualItem, CreateManualItemData } from '@/hooks/useManualItems';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Plus, FolderOpen, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Loader2 } from 'lucide-react';
import CreateManualItemDialog from '@/components/manual-items/CreateManualItemDialog';
import ManualItemCard from '@/components/manual-items/ManualItemCard';

const ManualItems = () => {
  const { language } = useLanguage();
  const { userRole } = useAuth();
  const isArabic = language === 'ar';
  
  const { manualItems, isLoading, createItem, updateItem, deleteItem, isCreating, isUpdating } = useManualItems();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ManualItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isAdmin = userRole?.role === 'super_admin' || userRole?.role === 'admin';

  const filteredItems = useMemo(() => {
    return manualItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [manualItems, searchQuery, typeFilter, statusFilter]);

  const handleCreate = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: ManualItem) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleSubmit = (data: CreateManualItemData) => {
    if (editItem) {
      updateItem({ id: editItem.id, ...data });
    } else {
      createItem(data);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteItem(deleteId);
      setDeleteId(null);
    }
  };

  const typeOptions = [
    { value: 'all', labelEn: 'All Types', labelAr: 'جميع الأنواع' },
    { value: 'photoshoot', labelEn: 'Photoshoot', labelAr: 'جلسة تصوير' },
    { value: 'meeting', labelEn: 'Meeting', labelAr: 'اجتماع' },
    { value: 'site_visit', labelEn: 'Site Visit', labelAr: 'زيارة موقع' },
    { value: 'document', labelEn: 'Document', labelAr: 'وثيقة' },
    { value: 'note', labelEn: 'Note', labelAr: 'ملاحظة' },
    { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
  ];

  const statusOptions = [
    { value: 'all', labelEn: 'All Statuses', labelAr: 'جميع الحالات' },
    { value: 'pending', labelEn: 'Pending', labelAr: 'معلق' },
    { value: 'in_progress', labelEn: 'In Progress', labelAr: 'قيد التنفيذ' },
    { value: 'completed', labelEn: 'Completed', labelAr: 'مكتمل' },
    { value: 'cancelled', labelEn: 'Cancelled', labelAr: 'ملغي' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
        {isAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 me-2" />
            {isArabic ? 'إضافة بند' : 'Add Item'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isArabic ? 'بحث...' : 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 me-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {isArabic ? opt.labelAr : opt.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {isArabic ? opt.labelAr : opt.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
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
              {isAdmin && (
                <Button className="mt-4" onClick={handleCreate}>
                  <Plus className="h-4 w-4 me-2" />
                  {isArabic ? 'إضافة أول بند' : 'Add First Item'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <ManualItemCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
              canEdit={isAdmin}
              canDelete={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <CreateManualItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
        editItem={editItem}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? 'هل أنت متأكد من حذف هذا البند؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this item? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isArabic ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManualItems;
