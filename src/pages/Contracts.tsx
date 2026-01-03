import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useContracts, Contract, CreateContractData } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Plus, Search, FolderOpen, MoreVertical, Edit, Trash2, Calendar, DollarSign, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  title_ar: z.string().optional(),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  client_id: z.string().optional(),
  value: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().default('draft'),
});

type FormValues = z.infer<typeof formSchema>;

const Contracts = () => {
  const { language } = useLanguage();
  const { userRole } = useAuth();
  const isArabic = language === 'ar';
  
  const { contracts, isLoading, createContract, updateContract, deleteContract, isCreating, isUpdating } = useContracts();
  const { clients } = useClients();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContract, setEditContract] = useState<Contract | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = userRole?.role === 'super_admin' || userRole?.role === 'admin';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      title_ar: '',
      description: '',
      description_ar: '',
      client_id: '',
      value: '',
      start_date: '',
      end_date: '',
      status: 'draft',
    },
  });

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        contract.title.toLowerCase().includes(searchLower) ||
        contract.title_ar?.toLowerCase().includes(searchLower) ||
        contract.client?.name.toLowerCase().includes(searchLower)
      );
    });
  }, [contracts, searchQuery]);

  const handleCreate = () => {
    setEditContract(null);
    form.reset({
      title: '',
      title_ar: '',
      description: '',
      description_ar: '',
      client_id: '',
      value: '',
      start_date: '',
      end_date: '',
      status: 'draft',
    });
    setDialogOpen(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditContract(contract);
    form.reset({
      title: contract.title,
      title_ar: contract.title_ar || '',
      description: contract.description || '',
      description_ar: contract.description_ar || '',
      client_id: contract.client_id || '',
      value: contract.value?.toString() || '',
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      status: contract.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (values: FormValues) => {
    const data: CreateContractData = {
      title: values.title,
      title_ar: values.title_ar || undefined,
      description: values.description || undefined,
      description_ar: values.description_ar || undefined,
      client_id: values.client_id || undefined,
      value: values.value ? parseFloat(values.value) : undefined,
      start_date: values.start_date || undefined,
      end_date: values.end_date || undefined,
      status: values.status,
    };

    if (editContract) {
      updateContract({ id: editContract.id, ...data });
    } else {
      createContract(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteContract(deleteId);
      setDeleteId(null);
    }
  };

  const statusOptions = [
    { value: 'draft', labelEn: 'Draft', labelAr: 'مسودة' },
    { value: 'active', labelEn: 'Active', labelAr: 'نشط' },
    { value: 'completed', labelEn: 'Completed', labelAr: 'مكتمل' },
    { value: 'cancelled', labelEn: 'Cancelled', labelAr: 'ملغي' },
  ];

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {isArabic ? 'العقود' : 'Contracts'}
          </h1>
          <p className="text-muted-foreground">
            {isArabic ? 'إدارة العقود والاتفاقيات' : 'Manage contracts and agreements'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 me-2" />
            {isArabic ? 'إضافة عقد' : 'Add Contract'}
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isArabic ? 'بحث عن عقد...' : 'Search contracts...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>

      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {isArabic ? 'لا توجد عقود' : 'No Contracts'}
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {isArabic 
                  ? 'ابدأ بإضافة عقود لتتبع اتفاقياتك مع العملاء'
                  : 'Start adding contracts to track your client agreements'}
              </p>
              {isAdmin && (
                <Button className="mt-4" onClick={handleCreate}>
                  <Plus className="h-4 w-4 me-2" />
                  {isArabic ? 'إضافة أول عقد' : 'Add First Contract'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {isArabic && contract.title_ar ? contract.title_ar : contract.title}
                    </h3>
                    {contract.client && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">
                          {isArabic && contract.client.name_ar ? contract.client.name_ar : contract.client.name}
                        </span>
                      </div>
                    )}
                    {contract.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {isArabic && contract.description_ar ? contract.description_ar : contract.description}
                      </p>
                    )}
                    <div className="mt-3 space-y-1">
                      {contract.value && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{contract.value.toLocaleString()}</span>
                        </div>
                      )}
                      {(contract.start_date || contract.end_date) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {contract.start_date && format(new Date(contract.start_date), 'PP', { locale: isArabic ? ar : undefined })}
                            {contract.start_date && contract.end_date && ' - '}
                            {contract.end_date && format(new Date(contract.end_date), 'PP', { locale: isArabic ? ar : undefined })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <Badge variant="outline" className={statusColors[contract.status]}>
                        {statusOptions.find(s => s.value === contract.status)?.[isArabic ? 'labelAr' : 'labelEn'] || contract.status}
                      </Badge>
                    </div>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(contract)}>
                          <Edit className="h-4 w-4 me-2" />
                          {isArabic ? 'تعديل' : 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteId(contract.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 me-2" />
                          {isArabic ? 'حذف' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editContract
                ? isArabic ? 'تعديل العقد' : 'Edit Contract'
                : isArabic ? 'إضافة عقد جديد' : 'Add New Contract'}
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
                        <Input {...field} />
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
                        <Input {...field} dir="rtl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'العميل' : 'Client'}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isArabic ? 'اختر عميل' : 'Select client'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {isArabic && client.name_ar ? client.name_ar : client.name}
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
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'القيمة' : 'Value'}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'تاريخ البدء' : 'Start Date'}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'تاريخ الانتهاء' : 'End Date'}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {isArabic ? opt.labelAr : opt.labelEn}
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
                      <Textarea {...field} rows={3} />
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
                      <Textarea {...field} rows={3} dir="rtl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating)
                    ? isArabic ? 'جاري الحفظ...' : 'Saving...'
                    : editContract
                      ? isArabic ? 'تحديث' : 'Update'
                      : isArabic ? 'إضافة' : 'Add'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? 'هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this contract? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isArabic ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Contracts;
