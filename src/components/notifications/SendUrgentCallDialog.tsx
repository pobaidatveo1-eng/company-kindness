import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useTeamMembers } from '@/hooks/useTasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SendUrgentCallDialogProps {
  trigger?: React.ReactNode;
}

const SendUrgentCallDialog: React.FC<SendUrgentCallDialogProps> = ({ trigger }) => {
  const { language } = useLanguage();
  const { sendUrgentCall } = useNotifications();
  const { teamMembers } = useTeamMembers();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const isArabic = language === 'ar';

  const handleSend = async () => {
    if (!selectedUser || !message.trim()) return;

    setIsSending(true);
    try {
      sendUrgentCall({
        user_id: selectedUser,
        message: message,
        message_ar: message,
      });
      
      toast({
        title: isArabic ? 'تم إرسال المكالمة العاجلة' : 'Urgent call sent',
        description: isArabic ? 'سيتم تنبيه الموظف فوراً' : 'The employee will be alerted immediately',
      });
      
      setIsOpen(false);
      setSelectedUser('');
      setMessage('');
    } catch (error) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في إرسال المكالمة' : 'Failed to send call',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Phone className="h-4 w-4 me-2" />
            {isArabic ? 'مكالمة عاجلة' : 'Urgent Call'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-destructive" />
            {isArabic ? 'إرسال مكالمة عاجلة' : 'Send Urgent Call'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isArabic 
              ? 'سيتم تنبيه الموظف بصوت متكرر حتى يستجيب للإشعار'
              : 'The employee will be alerted with a repeating sound until they respond'}
          </p>
          
          <div>
            <Label>{isArabic ? 'الموظف' : 'Employee'}</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder={isArabic ? 'اختر الموظف' : 'Select employee'} />
              </SelectTrigger>
              <SelectContent>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {member.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.full_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>{isArabic ? 'الرسالة' : 'Message'}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isArabic ? 'اكتب سبب المكالمة العاجلة...' : 'Write the reason for the urgent call...'}
              rows={3}
            />
          </div>
          
          <Button 
            onClick={handleSend} 
            className="w-full" 
            variant="destructive"
            disabled={!selectedUser || !message.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Phone className="h-4 w-4 me-2" />
            )}
            {isArabic ? 'إرسال المكالمة العاجلة' : 'Send Urgent Call'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendUrgentCallDialog;
