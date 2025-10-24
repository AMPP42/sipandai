import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, CheckCircle, Copy, File, FileText, MessageSquare, Send, User, XCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, ChatSession } from '@/types/chat';

interface AdminChatViewProps {
  ticketId: string;
  ticketNumber?: string;
  ticketTitle?: string;
  userName?: string;
  onClose?: () => void;
}

export function AdminChatView(props: AdminChatViewProps) {
  const { ticketId, ticketNumber, ticketTitle, userName, onClose } = props;
  const { user } = useAuth();
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatSession();
    loadChatMessages();
  }, [ticketId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadChatSession = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) {
        console.error('Error loading chat session:', error);
        return;
      }

      if (!data) {
        console.log('Chat session not found');
        return;
      }

      setChatSession(data as ChatSession);
      setIsSessionActive(data.status === 'active');
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  const loadChatMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat messages:', error);
        return;
      }

      setChatMessages((data || []) as ChatMessage[]);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([
          {
            session_id: ticketId,
            sender_id: user?.id,
            message: newMessage,
            message_type: 'text',
          },
        ])
        .select('*')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Gagal mengirim pesan.",
          description: "Silakan coba lagi nanti.",
          variant: "destructive",
        })
        return;
      }

      setChatMessages(prevMessages => [...prevMessages, data as ChatMessage]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Gagal mengirim pesan.",
        description: "Silakan coba lagi nanti.",
        variant: "destructive",
      })
    }
  };

  const handleEndChat = async () => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ status: 'ended' })
        .eq('id', ticketId);

      if (error) {
        console.error('Error ending chat:', error);
        toast({
          title: "Gagal mengakhiri chat.",
          description: "Silakan coba lagi nanti.",
          variant: "destructive",
        })
        return;
      }

      setIsSessionActive(false);
      toast({
        title: "Chat diakhiri.",
        description: "Sesi chat telah diakhiri.",
      })
    } catch (error) {
      console.error('Error ending chat:', error);
      toast({
        title: "Gagal mengakhiri chat.",
        description: "Silakan coba lagi nanti.",
        variant: "destructive",
      })
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          <MessageSquare className="mr-2 h-4 w-4" />
          Chat #{ticketNumber} - {ticketTitle}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onClose}>
          Tutup
        </Button>
      </CardHeader>
      <CardContent className="grow flex flex-col p-4">
        <ScrollArea className="flex-1 mb-2">
          <div className="flex flex-col gap-2">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.sender_id === user?.id ? 'items-end' : 'items-start'
                  }`}
              >
                <div
                  className={`rounded-lg px-3 py-2 text-sm shadow-sm w-fit max-w-[75%] ${message.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                    }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(message.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <Separator />
        <div className="mt-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan disini..."
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-muted-foreground">
              Tekan <kbd className="pointer-events-none relative inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-60">Enter</kbd> untuk mengirim, <kbd className="pointer-events-none relative inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-60">Shift + Enter</kbd> untuk baris baru
            </p>
            <Button onClick={handleSendMessage} size="sm">
              Kirim <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end items-center p-4">
        {isSessionActive ? (
          <Button variant="destructive" size="sm" onClick={handleEndChat}>
            Akhiri Chat
          </Button>
        ) : (
          <Badge variant="outline">Chat Selesai</Badge>
        )}
      </CardFooter>
    </Card>
  );
}

export default AdminChatView;
