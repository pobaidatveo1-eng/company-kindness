import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMeetings, Meeting, MeetingStatus, CreateMeetingData } from '@/hooks/useMeetings';
import { useTeamMembers } from '@/hooks/useTasks';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Users, Video, CheckCircle, Loader2, Bell, Send } from 'lucide-react';
import { format, isToday, isPast, parse, set } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusColors: Record<MeetingStatus, string> = {
  scheduled: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const statusLabels: Record<MeetingStatus, { ar: string; en: string }> = {
  scheduled: { ar: 'مجدول', en: 'Scheduled' },
  in_progress: { ar: 'جاري', en: 'In Progress' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

const meetingTypeLabels: Record<string, { ar: string; en: string }> = {
  general: { ar: 'عام', en: 'General' },
  client: { ar: 'مع عميل', en: 'Client' },
  internal: { ar: 'داخلي', en: 'Internal' },
  review: { ar: 'مراجعة', en: 'Review' },
};

// Generate time options in 12-hour format
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const period = hour < 12 ? 'AM' : 'PM';
      const periodAr = hour < 12 ? 'ص' : 'م';
      const timeLabel = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
      const timeLabelAr = `${hour12}:${minute.toString().padStart(2, '0')} ${periodAr}`;
      const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      options.push({ value, label: timeLabel, labelAr: timeLabelAr });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

const Meetings = () => {
  const { language } = useLanguage();
  const { meetings, isLoading, createMeeting, updateMeeting, isCreating } = useMeetings();
  const { teamMembers } = useTeamMembers();
  const { createNotification } = useNotifications();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [meetingToInvite, setMeetingToInvite] = useState<Meeting | null>(null);
  const [selectedEmployeesForInvite, setSelectedEmployeesForInvite] = useState<string[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState('general');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [agenda, setAgenda] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const upcomingMeetings = meetings.filter(m => 
    m.status === 'scheduled' && !isPast(new Date(m.start_time))
  );
  
  const todayMeetings = meetings.filter(m => 
    isToday(new Date(m.start_time))
  );
  
  const completedMeetings = meetings.filter(m => 
    m.status === 'completed'
  );

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMeetingType('general');
    setSelectedDate(undefined);
    setSelectedTime('09:00');
    setLocation('');
    setAgenda('');
    setSelectedEmployees([]);
    setSelectedMeeting(null);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !title) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال العنوان والتاريخ' : 'Please enter title and date',
        variant: 'destructive',
      });
      return;
    }

    // Combine date and time
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startDateTime = set(selectedDate, { hours, minutes, seconds: 0 });

    const meetingData: CreateMeetingData = {
      title,
      description,
      meeting_type: meetingType,
      start_time: startDateTime.toISOString(),
      location,
      agenda,
    };

    if (selectedMeeting) {
      updateMeeting({ id: selectedMeeting.id, ...meetingData });
    } else {
      createMeeting(meetingData);
      
      // Send notifications to selected employees
      if (selectedEmployees.length > 0) {
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const period = hours < 12 ? (language === 'ar' ? 'ص' : 'AM') : (language === 'ar' ? 'م' : 'PM');
        const timeStr = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
        const dateStr = format(startDateTime, 'dd/MM/yyyy');

        selectedEmployees.forEach(employeeId => {
          createNotification({
            user_id: employeeId,
            type: 'meeting_invitation',
            title: 'New Meeting Invitation',
            title_ar: 'دعوة لاجتماع جديد',
            message: `You have been invited to: ${title} on ${dateStr} at ${timeStr}`,
            message_ar: `تم دعوتك لحضور اجتماع: ${title} يوم ${dateStr} الساعة ${timeStr}`,
            priority: 'high',
          });
        });

        toast({
          title: language === 'ar' ? 'تم الإنشاء والدعوة' : 'Created & Invited',
          description: language === 'ar' 
            ? `تم إنشاء الاجتماع وإرسال دعوة لـ ${selectedEmployees.length} موظف`
            : `Meeting created and ${selectedEmployees.length} employee(s) invited`,
        });
      }
    }

    setIsCreateDialogOpen(false);
    resetForm();
  };

  const openEditDialog = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setTitle(meeting.title);
    setDescription(meeting.description || '');
    setMeetingType(meeting.meeting_type);
    const meetingDate = new Date(meeting.start_time);
    setSelectedDate(meetingDate);
    setSelectedTime(format(meetingDate, 'HH:mm'));
    setLocation(meeting.location || '');
    setAgenda(meeting.agenda || '');
    setSelectedEmployees([]);
    setIsCreateDialogOpen(true);
  };

  const markAsCompleted = (meeting: Meeting) => {
    updateMeeting({ id: meeting.id, status: 'completed' });
  };

  const openInviteDialog = (meeting: Meeting) => {
    setMeetingToInvite(meeting);
    setSelectedEmployeesForInvite([]);
    setInviteDialogOpen(true);
  };

  const sendMeetingReminder = () => {
    if (!meetingToInvite || selectedEmployeesForInvite.length === 0) return;

    const meetingDate = new Date(meetingToInvite.start_time);
    const hours = meetingDate.getHours();
    const minutes = meetingDate.getMinutes();
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours < 12 ? (language === 'ar' ? 'ص' : 'AM') : (language === 'ar' ? 'م' : 'PM');
    const timeStr = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    const dateStr = format(meetingDate, 'dd/MM/yyyy');

    selectedEmployeesForInvite.forEach(employeeId => {
      createNotification({
        user_id: employeeId,
        type: 'meeting_reminder',
        title: 'Meeting Reminder',
        title_ar: 'تذكير باجتماع',
        message: `Reminder: ${meetingToInvite.title} on ${dateStr} at ${timeStr}`,
        message_ar: `تذكير: ${meetingToInvite.title} يوم ${dateStr} الساعة ${timeStr}`,
        reference_id: meetingToInvite.id,
        reference_type: 'meeting',
        priority: 'high',
      });
    });

    toast({
      title: language === 'ar' ? 'تم إرسال الدعوات' : 'Invitations Sent',
      description: language === 'ar' 
        ? `تم إرسال ${selectedEmployeesForInvite.length} دعوة`
        : `${selectedEmployeesForInvite.length} invitation(s) sent`,
    });

    setInviteDialogOpen(false);
    setMeetingToInvite(null);
    setSelectedEmployeesForInvite([]);
  };

  const formatMeetingTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours < 12 ? (language === 'ar' ? 'ص' : 'AM') : (language === 'ar' ? 'م' : 'PM');
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderMeetingCard = (meeting: Meeting) => (
    <Card key={meeting.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{meeting.title}</h3>
                  <Badge className={`${statusColors[meeting.status]} text-white`}>
                    {language === 'ar' ? statusLabels[meeting.status].ar : statusLabels[meeting.status].en}
                  </Badge>
                  <Badge variant="outline">
                    {language === 'ar' 
                      ? meetingTypeLabels[meeting.meeting_type]?.ar 
                      : meetingTypeLabels[meeting.meeting_type]?.en}
                  </Badge>
                </div>
                {meeting.description && (
                  <p className="text-sm text-muted-foreground mt-1">{meeting.description}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {format(new Date(meeting.start_time), 'dd/MM/yyyy', { locale: language === 'ar' ? ar : undefined })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatMeetingTime(meeting.start_time)}
                    {meeting.end_time && ` - ${formatMeetingTime(meeting.end_time)}`}
                  </span>
                  {meeting.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {meeting.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {meeting.status === 'scheduled' && (
              <>
                <Button size="sm" variant="outline" onClick={() => openInviteDialog(meeting)}>
                  <Bell className="h-4 w-4 me-1" />
                  {language === 'ar' ? 'دعوة' : 'Invite'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => markAsCompleted(meeting)}>
                  <CheckCircle className="h-4 w-4 me-1" />
                  {language === 'ar' ? 'إكمال' : 'Complete'}
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => openEditDialog(meeting)}>
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{language === 'ar' ? 'الاجتماعات' : 'Meetings'}</h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'جدولة وإدارة الاجتماعات' : 'Schedule and manage meetings'}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {language === 'ar' ? 'جدولة اجتماع' : 'Schedule Meeting'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedMeeting 
                  ? (language === 'ar' ? 'تعديل الاجتماع' : 'Edit Meeting')
                  : (language === 'ar' ? 'جدولة اجتماع جديد' : 'Schedule New Meeting')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'العنوان' : 'Title'} *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={language === 'ar' ? 'عنوان الاجتماع' : 'Meeting title'}
                />
              </div>
              
              <div>
                <Label>{language === 'ar' ? 'النوع' : 'Type'}</Label>
                <Select value={meetingType} onValueChange={setMeetingType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(meetingTypeLabels).map(([key, labels]) => (
                      <SelectItem key={key} value={key}>
                        {language === 'ar' ? labels.ar : labels.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'التاريخ' : 'Date'} *</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="me-2 h-4 w-4" />
                        {selectedDate 
                          ? format(selectedDate, 'dd/MM/yyyy')
                          : (language === 'ar' ? 'اختر التاريخ' : 'Pick a date')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setDatePickerOpen(false);
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'الوقت' : 'Time'} *</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {language === 'ar' ? option.labelAr : option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{language === 'ar' ? 'الموقع' : 'Location'}</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={language === 'ar' ? 'الموقع أو رابط الاجتماع' : 'Location or meeting link'}
                />
              </div>

              <div>
                <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label>{language === 'ar' ? 'جدول الأعمال' : 'Agenda'}</Label>
                <Textarea
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  rows={2}
                  placeholder={language === 'ar' ? 'نقاط النقاش...' : 'Discussion points...'}
                />
              </div>

              {/* Employee Selection */}
              {!selectedMeeting && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {language === 'ar' ? 'دعوة موظفين' : 'Invite Employees'}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {language === 'ar' 
                      ? 'سيتم إرسال إشعار للموظفين المختارين'
                      : 'Selected employees will receive a notification'}
                  </p>
                  <div className="border rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                    {teamMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        {language === 'ar' ? 'لا يوجد موظفين' : 'No employees'}
                      </p>
                    ) : (
                      teamMembers.map((member) => (
                        <label 
                          key={member.id} 
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedEmployees.includes(member.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedEmployees([...selectedEmployees, member.id]);
                              } else {
                                setSelectedEmployees(selectedEmployees.filter(id => id !== member.id));
                              }
                            }}
                          />
                          <span className="text-sm">
                            {language === 'ar' ? (member.full_name_ar || member.full_name) : member.full_name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedEmployees.length > 0 && (
                    <p className="text-xs text-primary mt-1">
                      {language === 'ar' 
                        ? `${selectedEmployees.length} موظف محدد`
                        : `${selectedEmployees.length} employee(s) selected`}
                    </p>
                  )}
                </div>
              )}

              <Button 
                onClick={handleSubmit} 
                className="w-full" 
                disabled={isCreating || !title || !selectedDate}
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                {selectedMeeting 
                  ? (language === 'ar' ? 'تحديث' : 'Update')
                  : selectedEmployees.length > 0
                    ? (language === 'ar' ? `جدولة وإرسال ${selectedEmployees.length} دعوة` : `Schedule & Send ${selectedEmployees.length} Invite(s)`)
                    : (language === 'ar' ? 'جدولة' : 'Schedule')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'اليوم' : 'Today'}</p>
              <p className="text-2xl font-bold">{todayMeetings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'القادمة' : 'Upcoming'}</p>
              <p className="text-2xl font-bold">{upcomingMeetings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مكتملة' : 'Completed'}</p>
              <p className="text-2xl font-bold">{completedMeetings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الإجمالي' : 'Total'}</p>
              <p className="text-2xl font-bold">{meetings.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">
            {language === 'ar' ? 'القادمة' : 'Upcoming'}
            {upcomingMeetings.length > 0 && (
              <Badge variant="secondary" className="ms-2">{upcomingMeetings.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="today">
            {language === 'ar' ? 'اليوم' : 'Today'}
            {todayMeetings.length > 0 && (
              <Badge variant="secondary" className="ms-2">{todayMeetings.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            {language === 'ar' ? 'مكتملة' : 'Completed'}
          </TabsTrigger>
          <TabsTrigger value="all">
            {language === 'ar' ? 'الكل' : 'All'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcomingMeetings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {language === 'ar' ? 'لا توجد اجتماعات قادمة' : 'No upcoming meetings'}
              </CardContent>
            </Card>
          ) : (
            upcomingMeetings.map(renderMeetingCard)
          )}
        </TabsContent>

        <TabsContent value="today" className="space-y-4 mt-4">
          {todayMeetings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {language === 'ar' ? 'لا توجد اجتماعات اليوم' : 'No meetings today'}
              </CardContent>
            </Card>
          ) : (
            todayMeetings.map(renderMeetingCard)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedMeetings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {language === 'ar' ? 'لا توجد اجتماعات مكتملة' : 'No completed meetings'}
              </CardContent>
            </Card>
          ) : (
            completedMeetings.map(renderMeetingCard)
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          {meetings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {language === 'ar' ? 'لا توجد اجتماعات' : 'No meetings'}
              </CardContent>
            </Card>
          ) : (
            meetings.map(renderMeetingCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Invite Employees Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'دعوة الموظفين للاجتماع' : 'Invite Employees to Meeting'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {meetingToInvite && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{meetingToInvite.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(meetingToInvite.start_time), 'dd/MM/yyyy')} - {formatMeetingTime(meetingToInvite.start_time)}
                </p>
              </div>
            )}
            <div>
              <Label>{language === 'ar' ? 'اختر الموظفين' : 'Select Employees'}</Label>
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2">
                {teamMembers.map((member) => (
                  <label key={member.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                    <Checkbox
                      checked={selectedEmployeesForInvite.includes(member.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEmployeesForInvite([...selectedEmployeesForInvite, member.id]);
                        } else {
                          setSelectedEmployeesForInvite(selectedEmployeesForInvite.filter(id => id !== member.id));
                        }
                      }}
                    />
                    <span>{language === 'ar' ? (member.full_name_ar || member.full_name) : member.full_name}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button 
              onClick={sendMeetingReminder} 
              className="w-full"
              disabled={selectedEmployeesForInvite.length === 0}
            >
              <Send className="h-4 w-4 me-2" />
              {language === 'ar' 
                ? `إرسال دعوة لـ ${selectedEmployeesForInvite.length} موظف`
                : `Send to ${selectedEmployeesForInvite.length} employee(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Meetings;
