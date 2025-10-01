import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  Star,
  X,
  Phone,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  message_text?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  message_type: 'text' | 'file' | 'system';
  created_at: string;
  sender_name?: string;
  is_officer?: boolean;
}

interface ChatSession {
  id: string;
  user_id: string;
  officer_id?: string;
  status: 'waiting' | 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  rating?: number;
  feedback?: string;
}

interface OfficerStatus {
  officer_id: string;
  status: 'online' | 'offline' | 'busy';
  last_seen: string;
  officer_name?: string;
}

interface AutoReply {
  id: string;
  keywords: string[];
  reply_text: string;
  category: string;
}

export const LiveChatInterface = ({ ticketId }: { ticketId?: string | null }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [officers, setOfficers] = useState<OfficerStatus[]>([]);
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial data
  useEffect(() => {
    loadOfficerStatus();
    loadAutoReplies();
    loadExistingSession();
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to officer status changes
    const officerStatusChannel = supabase
      .channel('officer-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'officer_status'
        },
        () => loadOfficerStatus()
      )
      .subscribe();

    // Subscribe to new messages if session exists
    let messagesChannel: any;
    if (currentSession) {
      messagesChannel = supabase
        .channel(`chat-messages-${currentSession.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `session_id=eq.${currentSession.id}`
          },
          (payload) => {
            loadMessages(currentSession.id);
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(officerStatusChannel);
      if (messagesChannel) {
        supabase.removeChannel(messagesChannel);
      }
    };
  }, [user, currentSession]);

  const loadOfficerStatus = async () => {
    const { data, error } = await supabase
      .from('officer_status')
      .select(`
        officer_id,
        status,
        last_seen
      `);

    if (error) {
      console.error('Error loading officer status:', error);
      return;
    }

    const officersWithNames = data?.map(item => ({
      officer_id: item.officer_id,
      status: item.status as 'online' | 'offline' | 'busy',
      last_seen: item.last_seen,
      officer_name: 'Petugas SDM'
    })) || [];

    setOfficers(officersWithNames);
  };

  const loadAutoReplies = async () => {
    const { data, error } = await supabase
      .from('auto_replies')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error loading auto replies:', error);
      return;
    }

    setAutoReplies(data || []);
  };

  const loadExistingSession = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error loading existing session:', error);
      return;
    }

    if (data) {
      const session: ChatSession = {
        ...data,
        status: data.status as 'waiting' | 'active' | 'ended'
      };
      setCurrentSession(session);
      setIsChatStarted(true);
      loadMessages(data.id);
    }
  };

  const loadMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    const messagesWithSenderInfo = data?.map(msg => ({
      ...msg,
      message_type: msg.message_type as 'text' | 'file' | 'system',
      sender_name: 'User',
      is_officer: false
    })) || [];

    setMessages(messagesWithSenderInfo);
  };

  const checkAutoReply = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    
    for (const reply of autoReplies) {
      const hasKeyword = reply.keywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        return reply.reply_text;
      }
    }
    
    return null;
  };

  const startChat = async () => {
    if (!user) return;

    // Check if ticketId is provided (required for starting chat)
    if (!ticketId) {
      toast({
        title: "Ticket diperlukan",
        description: "Anda harus memiliki ticket konsultasi yang disetujui untuk memulai live chat. Silakan buat ticket konsultasi terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if there are online officers
      const onlineOfficers = officers.filter(o => o.status === 'online');
      
      // Create new chat session linked to ticket
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          ticket_id: ticketId,
          status: onlineOfficers.length > 0 ? 'waiting' : 'waiting'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      const chatSession: ChatSession = {
        ...session,
        status: session.status as 'waiting' | 'active' | 'ended'
      };
      setCurrentSession(chatSession);
      setIsChatStarted(true);

      // Send welcome message
      const welcomeText = onlineOfficers.length > 0 
        ? "Halo! Terima kasih telah menghubungi layanan konsultasi SDM. Petugas kami akan segera merespon pertanyaan Anda."
        : "Halo! Saat ini tidak ada petugas yang online. Silakan tinggalkan pesan Anda dan kami akan merespon sesegera mungkin.";

      await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          sender_id: user.id,
          message_text: welcomeText,
          message_type: 'system'
        });

      toast({
        title: "Chat dimulai",
        description: "Anda dapat mulai mengetik pesan Anda",
      });
    } catch (error: any) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memulai chat. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentSession || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Send user message
      await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSession.id,
          sender_id: user.id,
          message_text: messageText,
          message_type: 'text'
        });

      // Check for auto reply
      const autoReplyText = checkAutoReply(messageText);
      if (autoReplyText) {
        // Send auto reply after a short delay
        setTimeout(async () => {
          await supabase
            .from('chat_messages')
            .insert({
              session_id: currentSession.id,
              sender_id: user.id, // System message
              message_text: autoReplyText,
              message_type: 'system'
            });
        }, 1000);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim pesan. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const uploadFile = async (file: File) => {
    if (!currentSession || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSession.id,
          sender_id: user.id,
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
          message_type: 'file'
        });

      toast({
        title: "File berhasil diunggah",
        description: `${file.name} telah dikirim`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Gagal mengunggah file. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const endChat = async () => {
    if (!currentSession) return;

    try {
      await supabase
        .from('chat_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      setShowRating(true);
    } catch (error) {
      console.error('Error ending chat:', error);
      toast({
        title: "Error",
        description: "Gagal mengakhiri chat.",
        variant: "destructive",
      });
    }
  };

  const submitRating = async () => {
    if (!currentSession || !rating) return;

    try {
      await supabase
        .from('chat_sessions')
        .update({ 
          rating,
          feedback: feedback.trim() || null
        })
        .eq('id', currentSession.id);

      toast({
        title: "Terima kasih!",
        description: "Rating dan feedback Anda telah tersimpan",
      });

      // Reset state
      setCurrentSession(null);
      setMessages([]);
      setIsChatStarted(false);
      setShowRating(false);
      setRating(0);
      setFeedback('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan rating.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'busy':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'busy':
        return 'Sibuk';
      default:
        return 'Offline';
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isOwn = message.sender_id === user?.id && message.message_type !== 'system';
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
      <div key={message.id} className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <Avatar className="w-8 h-8 mr-2">
            <AvatarFallback>
              {message.is_officer ? 'P' : message.sender_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className={`px-4 py-2 rounded-lg ${
            isOwn 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}>
            <div className="font-medium text-xs mb-1">
              {message.is_officer ? 'Petugas SDM' : message.sender_name}
            </div>
            
            {message.message_type === 'file' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">{message.file_name}</span>
                </div>
                {message.file_url && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(message.file_url, '_blank')}
                  >
                    Unduh File
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-sm">{message.message_text}</div>
            )}
            
            <div className="text-xs opacity-70 mt-1">
              {formatDistanceToNow(new Date(message.created_at), { 
                addSuffix: true,
                locale: id 
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rating modal
  if (showRating) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Beri Rating Layanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star 
                    className={`w-6 h-6 ${
                      star <= rating 
                        ? 'text-yellow-500 fill-current' 
                        : 'text-gray-300'
                    }`} 
                  />
                </Button>
              ))}
            </div>
            
            <Textarea
              placeholder="Berikan feedback Anda (opsional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowRating(false)}
              className="flex-1"
            >
              Lewati
            </Button>
            <Button 
              onClick={submitRating}
              disabled={!rating}
              className="flex-1"
            >
              Kirim Rating
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isChatStarted) {
    const onlineOfficers = officers.filter(o => o.status === 'online');
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Live Chat dengan Petugas SDM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Officer Status */}
          <div>
            <h4 className="font-medium mb-3">Status Petugas SDM</h4>
            <div className="space-y-2">
              {officers.length > 0 ? (
                officers.map((officer) => (
                  <div key={officer.officer_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {officer.officer_name?.charAt(0) || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{officer.officer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(officer.status)}
                      <Badge variant={officer.status === 'online' ? 'default' : 'secondary'}>
                        {getStatusText(officer.status)}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Tidak ada petugas yang tersedia saat ini
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Start Chat */}
          <div className="text-center space-y-4">
            {!ticketId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 mb-1">Ticket Konsultasi Diperlukan</p>
                    <p className="text-sm text-yellow-700">
                      Untuk mengakses live chat, Anda harus memiliki ticket konsultasi yang telah disetujui oleh admin. 
                      Silakan buat ticket konsultasi terlebih dahulu di tab "Buat Ticket", 
                      lalu tunggu hingga ticket disetujui dan status menjadi "Sedang Diproses".
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {onlineOfficers.length > 0 ? (
              <>
                <div className="text-green-600 font-medium">
                  {onlineOfficers.length} petugas sedang online
                </div>
                <p className="text-muted-foreground">
                  Mulai chat untuk berkonsultasi langsung dengan petugas SDM
                </p>
              </>
            ) : (
              <>
                <div className="text-yellow-600 font-medium">
                  Tidak ada petugas online
                </div>
                <p className="text-muted-foreground">
                  Anda masih dapat mengirim pesan dan petugas akan merespon sesegera mungkin
                </p>
              </>
            )}
            
            <Button 
              onClick={startChat}
              disabled={isLoading || !ticketId}
              className="w-full"
            >
              {isLoading ? 'Memulai...' : 'Mulai Chat'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat dengan Petugas SDM
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant={currentSession?.status === 'active' ? 'default' : 'secondary'}>
              {currentSession?.status === 'active' ? 'Aktif' : 'Menunggu'}
            </Badge>
            <Button size="sm" variant="outline" onClick={endChat}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
            }}
          />
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan Anda..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};