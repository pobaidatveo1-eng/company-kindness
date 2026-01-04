import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface ChatRoom {
  id: string;
  company_id: string;
  name: string;
  name_ar: string | null;
  room_type: string;
  department_id: string | null;
  task_id: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  is_urgent: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export const useChatRooms = () => {
  const { profile } = useAuth();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['chat-rooms', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ChatRoom[];
    },
    enabled: !!profile?.company_id,
  });

  return { rooms, isLoading };
};

export const useChatMessages = (roomId: string | null) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey(full_name, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!roomId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({ content, isUrgent = false }: { content: string; isUrgent?: boolean }) => {
      if (!roomId || !profile?.id) throw new Error('Missing room or profile');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: profile.id,
          content,
          is_urgent: isUrgent,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
    },
    onError: (error) => {
      toast({ title: 'خطأ في إرسال الرسالة', description: error.message, variant: 'destructive' });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
  };
};

export const useCreateChatRoom = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, name_ar, room_type }: { name: string; name_ar?: string; room_type: string }) => {
      if (!profile?.company_id || !profile?.id) throw new Error('Missing company or profile');

      // Create the chat room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          name_ar,
          room_type,
          company_id: profile.company_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add the creator as a member of the room
      const { error: memberError } = await supabase
        .from('chat_room_members')
        .insert({
          room_id: room.id,
          user_id: profile.id,
          is_admin: true,
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
        // Don't throw - room was created successfully
      }

      return room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      toast({ title: 'تم إنشاء غرفة الدردشة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في إنشاء غرفة الدردشة', description: error.message, variant: 'destructive' });
    },
  });
};
