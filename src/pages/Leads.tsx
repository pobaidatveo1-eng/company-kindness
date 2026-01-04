import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLeads, Lead, LeadStatus, CreateLeadData } from '@/hooks/useLeads';
import { useTeamMembers } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Search, Phone, Mail, User, Calendar, Filter, TrendingUp, Users, Target, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  interested: 'bg-green-500',
  not_interested: 'bg-red-500',
  proposal_sent: 'bg-purple-500',
  meeting_scheduled: 'bg-indigo-500',
  closed_won: 'bg-emerald-600',
  closed_lost: 'bg-gray-500',
};

const statusLabels: Record<LeadStatus, { ar: string; en: string }> = {
  new: { ar: 'جديد', en: 'New' },
  contacted: { ar: 'تم التواصل', en: 'Contacted' },
  interested: { ar: 'مهتم', en: 'Interested' },
  not_interested: { ar: 'غير مهتم', en: 'Not Interested' },
  proposal_sent: { ar: 'عرض مرسل', en: 'Proposal Sent' },
  meeting_scheduled: { ar: 'اجتماع محدد', en: 'Meeting Scheduled' },
  closed_won: { ar: 'مغلق - فوز', en: 'Closed Won' },
  closed_lost: { ar: 'مغلق - خسارة', en: 'Closed Lost' },
};

const Leads = () => {
  const { language } = useLanguage();
  const { leads, isLoading, createLead, updateLead, deleteLead, isCreating } = useLeads();
  const { teamMembers } = useTeamMembers();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [formData, setFormData] = useState<CreateLeadData>({
    name: '',
    email: '',
    phone: '',
    source: '',
    notes: '',
    status: 'new',
  });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    interested: leads.filter(l => l.status === 'interested').length,
    closedWon: leads.filter(l => l.status === 'closed_won').length,
  };

  const handleSubmit = () => {
    if (selectedLead) {
      updateLead({ id: selectedLead.id, ...formData });
    } else {
      createLead(formData);
    }
    setIsCreateDialogOpen(false);
    setSelectedLead(null);
    setFormData({ name: '', email: '', phone: '', source: '', notes: '', status: 'new' });
  };

  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || '',
      notes: lead.notes || '',
      status: lead.status,
      assigned_to: lead.assigned_to || undefined,
    });
    setIsCreateDialogOpen(true);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{language === 'ar' ? 'العملاء المحتملين' : 'Leads'}</h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إدارة ومتابعة العملاء المحتملين' : 'Manage and track potential clients'}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setSelectedLead(null);
            setFormData({ name: '', email: '', phone: '', source: '', notes: '', status: 'new' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {language === 'ar' ? 'إضافة عميل محتمل' : 'Add Lead'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedLead 
                  ? (language === 'ar' ? 'تعديل العميل المحتمل' : 'Edit Lead')
                  : (language === 'ar' ? 'إضافة عميل محتمل جديد' : 'Add New Lead')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'ar' ? 'اسم العميل المحتمل' : 'Lead name'}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'الهاتف' : 'Phone'}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{language === 'ar' ? 'المصدر' : 'Source'}</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر المصدر' : 'Select source'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">{language === 'ar' ? 'الموقع' : 'Website'}</SelectItem>
                    <SelectItem value="referral">{language === 'ar' ? 'إحالة' : 'Referral'}</SelectItem>
                    <SelectItem value="social_media">{language === 'ar' ? 'وسائل التواصل' : 'Social Media'}</SelectItem>
                    <SelectItem value="event">{language === 'ar' ? 'حدث' : 'Event'}</SelectItem>
                    <SelectItem value="cold_call">{language === 'ar' ? 'اتصال بارد' : 'Cold Call'}</SelectItem>
                    <SelectItem value="other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'ar' ? 'الحالة' : 'Status'}</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as LeadStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, labels]) => (
                      <SelectItem key={key} value={key}>
                        {language === 'ar' ? labels.ar : labels.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'ar' ? 'المسؤول' : 'Assigned To'}</Label>
                <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر المسؤول' : 'Select assignee'} />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={isCreating || !formData.name}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                {selectedLead 
                  ? (language === 'ar' ? 'تحديث' : 'Update')
                  : (language === 'ar' ? 'إضافة' : 'Add')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الإجمالي' : 'Total'}</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Target className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'جديد' : 'New'}</p>
              <p className="text-2xl font-bold">{stats.new}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مهتم' : 'Interested'}</p>
              <p className="text-2xl font-bold">{stats.interested}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مغلق فوز' : 'Closed Won'}</p>
              <p className="text-2xl font-bold">{stats.closedWon}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="ps-10"
            placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 me-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</SelectItem>
            {Object.entries(statusLabels).map(([key, labels]) => (
              <SelectItem key={key} value={key}>
                {language === 'ar' ? labels.ar : labels.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads List */}
      <div className="grid gap-4">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {language === 'ar' ? 'لا يوجد عملاء محتملين' : 'No leads found'}
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEditDialog(lead)}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{lead.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {lead.email}
                          </span>
                        )}
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </span>
                        )}
                      </div>
                      {lead.source && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'ar' ? 'المصدر:' : 'Source:'} {lead.source}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusColors[lead.status]} text-white`}>
                      {language === 'ar' ? statusLabels[lead.status].ar : statusLabels[lead.status].en}
                    </Badge>
                    {lead.next_follow_up && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(lead.next_follow_up), 'dd/MM', { locale: language === 'ar' ? ar : undefined })}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Leads;
