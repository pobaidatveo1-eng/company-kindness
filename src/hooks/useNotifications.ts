import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef, useCallback } from 'react';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  title_ar: string | null;
  message: string;
  message_ar: string | null;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  priority: NotificationPriority | null;
  sound_enabled: boolean | null;
  is_urgent_call: boolean | null;
  expires_at: string | null;
  created_at: string;
}

// Sound URLs (using Web Audio API for custom sounds)
const NOTIFICATION_SOUNDS = {
  normal: '/sounds/notification.mp3',
  high: '/sounds/notification-high.mp3',
  urgent: '/sounds/urgent-call.mp3',
};

export const useNotifications = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urgentIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!profile?.id,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const urgentNotifications = notifications.filter(n => !n.is_read && n.is_urgent_call);
  const highPriorityCount = notifications.filter(n => !n.is_read && (n.priority === 'high' || n.priority === 'urgent')).length;

  // Play notification sound
  const playSound = useCallback((priority: NotificationPriority = 'normal', isUrgentCall = false) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      let soundUrl = NOTIFICATION_SOUNDS.normal;
      if (isUrgentCall || priority === 'urgent') {
        soundUrl = NOTIFICATION_SOUNDS.urgent;
      } else if (priority === 'high') {
        soundUrl = NOTIFICATION_SOUNDS.high;
      }

      // Create audio context for better control
      const audio = new Audio(soundUrl);
      audio.volume = isUrgentCall ? 1.0 : priority === 'high' ? 0.8 : 0.6;
      audioRef.current = audio;
      
      audio.play().catch(() => {
        // Fallback: use Web Audio API beep
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          oscillator.frequency.value = isUrgentCall ? 800 : priority === 'high' ? 600 : 440;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.3;
          
          oscillator.start();
          setTimeout(() => {
            oscillator.stop();
            ctx.close();
          }, isUrgentCall ? 500 : 200);
        }
      });
    } catch (err) {
      console.error('Error playing notification sound:', err);
    }
  }, []);

  // Handle urgent call - repeating alert
  const startUrgentCall = useCallback(() => {
    if (urgentIntervalRef.current) {
      clearInterval(urgentIntervalRef.current);
    }

    playSound('urgent', true);
    
    urgentIntervalRef.current = setInterval(() => {
      playSound('urgent', true);
    }, 3000);

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('📞 مكالمة عاجلة!', {
        body: 'لديك تنبيه عاجل يتطلب انتباهك فوراً',
        icon: '/favicon.ico',
        requireInteraction: true,
        tag: 'urgent-call',
      });
    }
  }, [playSound]);

  const stopUrgentCall = useCallback(() => {
    if (urgentIntervalRef.current) {
      clearInterval(urgentIntervalRef.current);
      urgentIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', profile?.id] });
      // Stop urgent call if no more urgent notifications
      if (urgentNotifications.length <= 1) {
        stopUrgentCall();
      }
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', profile?.id] });
      stopUrgentCall();
    },
  });

  // Create notification (for sending to others)
  const createNotification = useMutation({
    mutationFn: async (data: {
      user_id: string;
      type: string;
      title: string;
      title_ar?: string;
      message: string;
      message_ar?: string;
      reference_id?: string;
      reference_type?: string;
      priority?: NotificationPriority;
      is_urgent_call?: boolean;
    }) => {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...data,
          sound_enabled: true,
        });

      if (error) throw error;
    },
  });

  // Send urgent call to user
  const sendUrgentCall = useMutation({
    mutationFn: async (data: { user_id: string; message: string; message_ar?: string }) => {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          type: 'urgent_call',
          title: 'مكالمة عاجلة',
          title_ar: 'مكالمة عاجلة',
          message: data.message,
          message_ar: data.message_ar || data.message,
          priority: 'urgent' as NotificationPriority,
          is_urgent_call: true,
          sound_enabled: true,
        });

      if (error) throw error;
    },
  });

  // Realtime subscription with sound
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications', profile?.id] });
          
          const newNotification = payload.new as Notification;
          
          // Play sound based on priority
          if (newNotification.sound_enabled !== false) {
            if (newNotification.is_urgent_call) {
              startUrgentCall();
            } else {
              playSound(newNotification.priority || 'normal');
            }
          }

          // Request notification permission if not granted
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }

          // Show browser notification for high priority
          if ('Notification' in window && 
              Notification.permission === 'granted' && 
              (newNotification.priority === 'high' || newNotification.priority === 'urgent')) {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopUrgentCall();
    };
  }, [profile?.id, queryClient, playSound, startUrgentCall, stopUrgentCall]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopUrgentCall();
    };
  }, [stopUrgentCall]);

  return {
    notifications,
    isLoading,
    unreadCount,
    highPriorityCount,
    urgentNotifications,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    createNotification: createNotification.mutate,
    sendUrgentCall: sendUrgentCall.mutate,
    stopUrgentCall,
    playSound,
  };
};
