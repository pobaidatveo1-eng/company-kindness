import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications, NotificationPriority } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, Check, CheckCheck, MessageSquare, AlertTriangle, Phone, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const priorityStyles: Record<NotificationPriority, { bg: string; icon: React.ReactNode; badge: string }> = {
  low: { 
    bg: 'bg-muted', 
    icon: <Bell className="h-4 w-4 text-muted-foreground" />,
    badge: 'bg-muted text-muted-foreground'
  },
  normal: { 
    bg: 'bg-accent/50', 
    icon: <Bell className="h-4 w-4 text-primary" />,
    badge: 'bg-primary/20 text-primary'
  },
  high: { 
    bg: 'bg-amber-500/10', 
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    badge: 'bg-amber-500 text-white'
  },
  urgent: { 
    bg: 'bg-destructive/10 animate-pulse', 
    icon: <Phone className="h-4 w-4 text-destructive" />,
    badge: 'bg-destructive text-destructive-foreground'
  },
};

const NotificationBell: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  const dateLocale = isArabic ? ar : enUS;
  
  const { 
    notifications, 
    unreadCount, 
    highPriorityCount,
    urgentNotifications,
    markAsRead, 
    markAllAsRead,
    stopUrgentCall 
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (notification: typeof notifications[0]) => {
    if (notification.is_urgent_call) {
      return <Phone className="h-4 w-4 text-destructive animate-pulse" />;
    }
    
    const priority = notification.priority || 'normal';
    return priorityStyles[priority]?.icon || <Bell className="h-4 w-4 text-muted-foreground" />;
  };

  const getPriorityLabel = (priority: NotificationPriority | null) => {
    const labels: Record<NotificationPriority, { ar: string; en: string }> = {
      low: { ar: 'منخفضة', en: 'Low' },
      normal: { ar: 'عادية', en: 'Normal' },
      high: { ar: 'عالية', en: 'High' },
      urgent: { ar: 'عاجل', en: 'Urgent' },
    };
    if (!priority) return null;
    return isArabic ? labels[priority]?.ar : labels[priority]?.en;
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.is_urgent_call) {
      stopUrgentCall();
    }
    
    if (notification.reference_type === 'task' && notification.reference_id) {
      navigate('/dashboard/tasks');
    } else if (notification.reference_type === 'meeting' && notification.reference_id) {
      navigate('/dashboard/meetings');
    } else if (notification.reference_type === 'lead' && notification.reference_id) {
      navigate('/dashboard/leads');
    }
    
    setIsOpen(false);
  };

  const handleStopUrgent = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopUrgentCall();
    urgentNotifications.forEach(n => markAsRead(n.id));
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative",
            urgentNotifications.length > 0 && "animate-bounce"
          )}
        >
          <Bell className={cn(
            "h-5 w-5",
            urgentNotifications.length > 0 && "text-destructive"
          )} />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -end-1 h-5 w-5 rounded-full text-xs flex items-center justify-center",
              highPriorityCount > 0 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
            )}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">
              {isArabic ? 'الإشعارات' : 'Notifications'}
            </h4>
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {highPriorityCount} {isArabic ? 'عاجل' : 'urgent'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {urgentNotifications.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-auto py-1 px-2 text-xs"
                onClick={handleStopUrgent}
              >
                <VolumeX className="h-3 w-3 me-1" />
                {isArabic ? 'إيقاف' : 'Stop'}
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-xs"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-3 w-3 me-1" />
                {isArabic ? 'قراءة الكل' : 'Mark all read'}
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        
        {/* Urgent Notifications Banner */}
        {urgentNotifications.length > 0 && (
          <div className="bg-destructive/10 border-b border-destructive/20 p-3">
            <div className="flex items-center gap-2 text-destructive">
              <Phone className="h-5 w-5 animate-pulse" />
              <div>
                <p className="font-semibold text-sm">
                  {isArabic ? 'مكالمة عاجلة!' : 'Urgent Call!'}
                </p>
                <p className="text-xs">
                  {isArabic 
                    ? `لديك ${urgentNotifications.length} تنبيه عاجل`
                    : `You have ${urgentNotifications.length} urgent alert(s)`}
                </p>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {isArabic ? 'لا توجد إشعارات' : 'No notifications'}
            </div>
          ) : (
            notifications.map((notification) => {
              const priority = notification.priority || 'normal';
              const styles = priorityStyles[priority];
              
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer border-b border-border/50",
                    !notification.is_read && styles.bg
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {isArabic ? (notification.title_ar || notification.title) : notification.title}
                      </p>
                      {notification.priority && notification.priority !== 'normal' && (
                        <Badge className={cn("text-[10px] px-1.5 py-0", styles.badge)}>
                          {getPriorityLabel(notification.priority)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {isArabic ? (notification.message_ar || notification.message) : notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </p>
                      {notification.is_urgent_call && (
                        <Volume2 className="h-3 w-3 text-destructive animate-pulse" />
                      )}
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className={cn(
                      "h-2 w-2 rounded-full flex-shrink-0 mt-1",
                      notification.priority === 'urgent' || notification.priority === 'high' 
                        ? "bg-destructive" 
                        : "bg-primary"
                    )} />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
