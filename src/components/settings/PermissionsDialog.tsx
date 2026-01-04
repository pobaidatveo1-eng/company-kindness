import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPermissions, useUpdateUserPermissions, AVAILABLE_PERMISSIONS } from '@/hooks/usePermissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Shield


 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    full_name: string;
    role: string;
  } | null;
}

export const PermissionsDialog = ({ open, onOpenChange, user }: PermissionsDialogProps) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  const { data: currentPermissions = [], isLoading } = useUserPermissions(user?.id);
  const updatePermissions = useUpdateUserPermissions();
  
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (currentPermissions.length > 0) {
      setSelectedPermissions(currentPermissions);
    } else if (user) {
      // Default permissions for new users
      setSelectedPermissions(['dashboard', 'chat', 'account']);
    }
  }, [currentPermissions, user]);

  const handleTogglePermission = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions(AVAILABLE_PERMISSIONS.map(p => p.key));
  };

  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  const handleSave = () => {
    if (!user) return;
    updatePermissions.mutate(
      { userId: user.id, permissions: selectedPermissions },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  if (!user) return null;

  // Admins have all permissions automatically
  const isAdmin = user.role === 'super_admin' || user.role === 'admin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {isArabic ? 'صلاحيات الوصول' : 'Access Permissions'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            {isArabic 
              ? `تحديد الصفحات التي يمكن لـ "${user.full_name}" الوصول إليها`
              : `Select pages that "${user.full_name}" can access`}
          </p>

          {isAdmin ? (
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">
                {isArabic ? 'المسؤولون لديهم جميع الصلاحيات تلقائياً' : 'Admins have all permissions automatically'}
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {isArabic ? 'تحديد الكل' : 'Select All'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  {isArabic ? 'إلغاء الكل' : 'Clear All'}
                </Button>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div
                      key={permission.key}
                      className={`flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg border transition-colors ${
                        selectedPermissions.includes(permission.key)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Checkbox
                        id={permission.key}
                        checked={selectedPermissions.includes(permission.key)}
                        onCheckedChange={() => handleTogglePermission(permission.key)}
                      />
                      <Label htmlFor={permission.key} className="cursor-pointer flex-1">
                        {isArabic ? permission.labelAr : permission.labelEn}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          {!isAdmin && (
            <Button onClick={handleSave} disabled={updatePermissions.isPending}>
              {updatePermissions.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {isArabic ? 'حفظ الصلاحيات' : 'Save Permissions'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
