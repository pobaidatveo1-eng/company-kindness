import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChatRooms, useChatMessages, useCreateChatRoom, ChatRoom } from '@/hooks/useChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Send, MessageSquare, Users, Hash, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const roomTypeIcons: Record<string, React.ReactNode> = {
  department: <Users className="h-4 w-4" />,
  task: <Hash className="h-4 w-4" />,
  private: <MessageSquare className="h-4 w-4" />,
  general: <Users className="h-4 w-4" />,
};

const Chat = () => {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const { rooms, isLoading: roomsLoading } = useChatRooms();
  const createRoom = useCreateChatRoom();
  
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('general');
  
  const { messages, isLoading: messagesLoading, sendMessage, isSending } = useChatMessages(selectedRoom?.id || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessage({ content: messageText, isUrgent });
    setMessageText('');
    setIsUrgent(false);
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    createRoom.mutate(
      { name: newRoomName, room_type: newRoomType },
      {
        onSuccess: (room) => {
          setIsCreateDialogOpen(false);
          setNewRoomName('');
          setNewRoomType('general');
          if (room) setSelectedRoom(room);
        },
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4">
      {/* Rooms List */}
      <Card className="w-full md:w-80 flex-shrink-0">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {language === 'ar' ? 'المحادثات' : 'Chats'}
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {language === 'ar' ? 'إنشاء غرفة جديدة' : 'Create New Room'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{language === 'ar' ? 'اسم الغرفة' : 'Room Name'}</Label>
                    <Input
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder={language === 'ar' ? 'اسم الغرفة' : 'Room name'}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'النوع' : 'Type'}</Label>
                    <Select value={newRoomType} onValueChange={setNewRoomType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{language === 'ar' ? 'عام' : 'General'}</SelectItem>
                        <SelectItem value="department">{language === 'ar' ? 'قسم' : 'Department'}</SelectItem>
                        <SelectItem value="private">{language === 'ar' ? 'خاص' : 'Private'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateRoom} className="w-full" disabled={createRoom.isPending}>
                    {createRoom.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                    {language === 'ar' ? 'إنشاء' : 'Create'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="p-2 space-y-1">
            {rooms.length === 0 ? (
              <p className="text-center text-muted-foreground p-4">
                {language === 'ar' ? 'لا توجد غرف' : 'No rooms'}
              </p>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    selectedRoom?.id === room.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    selectedRoom?.id === room.id 
                      ? 'bg-primary-foreground/20' 
                      : 'bg-primary/10'
                  }`}>
                    {roomTypeIcons[room.room_type] || <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 text-start">
                    <p className="font-medium truncate">
                      {language === 'ar' ? (room.name_ar || room.name) : room.name}
                    </p>
                    <p className={`text-xs ${
                      selectedRoom?.id === room.id 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {language === 'ar' 
                        ? room.room_type === 'general' ? 'عام' : room.room_type === 'department' ? 'قسم' : 'خاص'
                        : room.room_type}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            <CardHeader className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  {roomTypeIcons[selectedRoom.room_type] || <MessageSquare className="h-5 w-5" />}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? (selectedRoom.name_ar || selectedRoom.name) : selectedRoom.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? selectedRoom.room_type === 'general' ? 'غرفة عامة' : selectedRoom.room_type === 'department' ? 'غرفة القسم' : 'محادثة خاصة'
                      : `${selectedRoom.room_type} room`}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-2" />
                  <p>{language === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === profile?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {message.sender?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {message.sender?.full_name || (language === 'ar' ? 'مستخدم' : 'User')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.created_at), 'HH:mm', { locale: language === 'ar' ? ar : undefined })}
                            </span>
                            {message.is_urgent && (
                              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                <AlertTriangle className="h-3 w-3 me-1" />
                                {language === 'ar' ? 'عاجل' : 'Urgent'}
                              </Badge>
                            )}
                          </div>
                          <div
                            className={`rounded-lg p-3 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : message.is_urgent
                                ? 'bg-destructive/10 border border-destructive'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant={isUrgent ? 'destructive' : 'ghost'}
                  size="icon"
                  onClick={() => setIsUrgent(!isUrgent)}
                  title={language === 'ar' ? 'رسالة عاجلة' : 'Urgent message'}
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={isSending || !messageText.trim()}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4" />
            <p className="text-lg">
              {language === 'ar' ? 'اختر محادثة للبدء' : 'Select a chat to start'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Chat;
