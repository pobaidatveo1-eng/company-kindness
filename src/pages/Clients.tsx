import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClients, Client, CreateClientData } from '@/hooks/useClients';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Plus, Search, Building2, Mail, Phone, MoreVertical, Edit, Trash2 } from 'lucide-react';
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

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  name_ar: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  address_ar: z.string().optional(),
  contact_person: z.string().optional(),
  contact_person_ar: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default('active'),
});

type FormValues = z.infer<typeof formSchema>;

const Clients = () => {
  const { language } = useLanguage();
  const { userRole } = useAuth();
  const isArabic = language === 'ar';
  
  const { clients, isLoading, createClient, updateClient, deleteClient, isCreating, isUpdating } = useClients();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = userRole?.role === 'super_admin' || userRole?.role === 'admin';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      name_ar: '',
      email: '',
      phone: '',
      address: '',
      address_ar: '',
      contact_person: '',
      contact_person_ar: '',
      notes: '',
      status: 'active',
    },
  });

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        client.name.toLowerCase().includes(searchLower) ||
        client.name_ar?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.contact_person?.toLowerCase().includes(searchLower)
      );
    });
  }, [clients, searchQuery]);

  const handleCreate = () => {
    setEditClient(null);
    form.reset({
      name: '',
      name_ar: '',
      email: '',
      phone: '',
      address: '',
      address_ar: '',
      contact_person: '',
      contact_person_ar: '',
      notes: '',
      status: 'active',
    });
    setDialogOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditClient(client);
    form.reset({
      name: client.name,
      name_ar: client.name_ar || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      address_ar: client.address_ar || '',
      contact_person: client.contact_person || '',
      contact_person_ar: client.contact_person_ar || '',
      notes: client.notes || '',
      status: client.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (values: FormValues) => {
    const data: CreateClientData = {
      name: values.name,
      name_ar: values.name_ar || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      address: values.address || undefined,
      address_ar: values.address_ar || undefined,
      contact_person: values.contact_person || undefined,
      contact_person_ar: values.contact_person_ar || undefined,
      notes: values.notes || undefined,
      status: values.status,
    };

    if (editClient) {
      updateClient({ id: editClient.id, ...data });
    } else {
      createClient(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteClient(deleteId);
      setDeleteId(null);
    }
  };

  const statusOptions = [
    { value: 'active', labelEn: 'Active', labelAr: 'نشط' },
    { value: 'inactive', labelEn: 'Inactive', labelAr: 'غير نشط' },
    { value: 'prospect', labelEn: 'Prospect', labelAr: 'محتمل' },
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
            <Users className="h-6 w-6 text-primary" />
            {isArabic ? 'العملاء' : 'Clients'}
          </h1>
          <p className="text-muted-foreground">
            {isArabic ? 'إدارة بيانات العملاء' : 'Manage client information'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 me-2" />
            {isArabic ? 'إضافة عميل' : 'Add Client'}
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isArabic ? 'بحث عن عميل...' : 'Search clients...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {isArabic ? 'لا يوجد عملاء' : 'No Clients'}
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {isArabic 
                  ? 'ابدأ بإضافة عملاء لإدارة علاقاتك التجارية'
                  : 'Start adding clients to manage your business relationships'}
              </p>
              {isAdmin && (
                <Button className="mt-4" onClick={handleCreate}>
                  <Plus className="h-4 w-4 me-2" />
                  {isArabic ? 'إضافة أول عميل' : 'Add First Client'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {isArabic && client.name_ar ? client.name_ar : client.name}
                    </h3>
                    {client.contact_person && (
                      <p className="text-sm text-muted-foreground truncate">
                        {isArabic && client.contact_person_ar ? client.contact_person_ar : client.contact_person}
                      </p>
                    )}
                    <div className="mt-3 space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {statusOptions.find(s => s.value === client.status)?.[isArabic ? 'labelAr' : 'labelEn'] || client.status}
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
                        <DropdownMenuItem onClick={() => handleEdit(client)}>
                          <Edit className="h-4 w-4 me-2" />
                          {isArabic ? 'تعديل' : 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteId(client.id)} className="text-destructive">
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
              {editClient
                ? isArabic ? 'تعديل العميل' : 'Edit Client'
                : isArabic ? 'إضافة عميل جديد' : 'Add New Client'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'الاسم (إنجليزي)' : 'Name (English)'}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'الاسم (عربي)' : 'Name (Arabic)'}</FormLabel>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'الهاتف' : 'Phone'}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'جهة الاتصال (إنجليزي)' : 'Contact Person'}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_person_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'جهة الاتصال (عربي)' : 'Contact Person (Arabic)'}</FormLabel>
                      <FormControl>
                        <Input {...field} dir="rtl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'ملاحظات' : 'Notes'}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
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
                    : editClient
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
                ? 'هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this client? This action cannot be undone.'}
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

export default Clients;
