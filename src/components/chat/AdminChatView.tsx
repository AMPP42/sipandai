import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Send, User, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  message_text?: string;
  message_type: 'text' | 'file' | 'system';
  created_at: string;
}

interface ChatSession {
  id: string;
  user_id: string;
  officer_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  ticket_id?: string;
}

interface AdminChatViewProps {
  ticketId: string;
  ticketNumber: string;
  ticketTitle: string;
  userName: string;
  onClose: () => void;
}

export const AdminChatView: React.FC<AdminChatViewProps> = ({
  ticketId,
  ticketNumber,
  ticketTitle,
  userName,
  onClose,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatSession();
  }, [ticketId]);

  useEffect(() => {
    if (session) {
      loadMessages();
      subscribeToMessages();
    }
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatSession = async () => {
    setIsLoading(true);
    try {
      // First, get the user_id from the ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('consultation_tickets')
        .select('user_id')
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;

      // Find the most recent chat session from this user
      // Can be linked to ticket or not
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', ticketData.user_id)
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const sessionData = {
          ...data,
          status: data.status as 'waiting' | 'active' | 'ended',
        };
        
        // If session doesn't have ticket_id, link it to this ticket
        if (!data.ticket_id) {
          await supabase
            .from('chat_sessions')
            .update({ ticket_id: ticketId })
            .eq('id', data.id);
          
          sessionData.ticket_id = ticketId;
        }
        
        setSession(sessionData);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat sesi chat',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        message_type: msg.message_type as 'text' | 'file' | 'system'
      }));
      
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!session) return;

    const channel = supabase
      .channel(`admin-chat-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Update session to active and assign officer (always update when admin replies)
      await supabase
        .from('chat_sessions')
        .update({
          status: 'active',
          officer_id: user.id,
          assigned_at: new Date().toISOString(),
          ticket_id: session.ticket_id || ticketId, // Ensure ticket_id is set
        })
        .eq('id', session.id);

      setSession({
        ...session,
        status: 'active',
        officer_id: user.id,
        ticket_id: session.ticket_id || ticketId,
      });

      await supabase.from('chat_messages').insert({
        session_id: session.id,
        sender_id: user.id,
        message_text: messageText,
        message_type: 'text',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengirim pesan',
        variant: 'destructive',
      });
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isOfficer = message.sender_id === user?.id;
    const isSystem = message.message_type === 'system';

    if (isSystem) {
      return (
        <div key={message.id} className="flex justify-center my-2">
          <div className="bg-muted px-3 py-1 rounded-full text-sm text-muted-foreground">
            {message.message_text}
          </div>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={`flex mb-4 ${isOfficer ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`flex max-w-[70%] ${
            isOfficer ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className={isOfficer ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
              {isOfficer ? 'A' : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className={`mx-2 ${isOfficer ? 'items-end' : 'items-start'} flex flex-col`}>
            <div
              className={`rounded-lg px-4 py-2 ${
                isOfficer
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.message_text}
              </p>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
                locale: id,
              })}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat percakapan...</p>
        </div>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="h-[600px]">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle className="text-lg">Percakapan Chat</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {ticketNumber} - {ticketTitle}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[500px]">
          <div className="text-center text-muted-foreground max-w-md">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">Belum ada sesi chat untuk tiket ini</p>
            <p className="text-sm">
              Tiket sudah ditugaskan ke konselor, tetapi {userName} belum memulai percakapan live chat.
            </p>
            <p className="text-sm mt-2">
              User perlu membuka halaman "Panduan Layanan" → tab "Ticket Saya", lalu klik tombol "Mulai Live Chat" pada tiket ini.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-lg">Percakapan dengan {userName}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {ticketNumber} - {ticketTitle}
          </p>
          <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className="mt-2">
            {session.status === 'active' ? 'Aktif' : session.status === 'waiting' ? 'Menunggu' : 'Selesai'}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ketik pesan Anda..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
