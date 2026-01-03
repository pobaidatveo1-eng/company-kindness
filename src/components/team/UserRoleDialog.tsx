import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateUserRole } from '@/hooks/useUsers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    full_name: string;
    role: 'super_admin' | 'admin' | 'employee';
  } | null;
}

export const UserRoleDialog = ({ open, onOpenChange, user }: UserRoleDialogProps) => {
  const { t } = useLanguage();
  const updateRole = useUpdateUserRole();
  const [newRole, setNewRole] = useState<'admin' | 'employee'>('employee');

  React.useEffect(() => {
    if (user && user.role !== 'super_admin') {
      setNewRole(user.role);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    
    await updateRole.mutateAsync({
      userId: user.user_id,
      newRole,
    });

    onOpenChange(false);
  };

  if (!user || user.role === 'super_admin') return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('team.changeRole')}</DialogTitle>
          <DialogDescription>
            {t('team.changeRoleFor')} {user.full_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('team.newRole')}</Label>
            <Select value={newRole} onValueChange={(value: 'admin' | 'employee') => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t('role.admin')}</SelectItem>
                <SelectItem value="employee">{t('role.employee')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={updateRole.isPending || newRole === user.role}>
            {updateRole.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};