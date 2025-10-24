import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useSupabase } from "@/providers/SupabaseProvider";
import { ChatMessage, ChatSession } from "@/types/chat";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface AdminChatViewProps {
  ticketId: string;
  ticketNumber?: string;
  ticketTitle?: string;
  userName?: string;
  onClose?: () => void;
}

export function AdminChatView(props: AdminChatViewProps) {
  const { supabase } = useSupabase();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: session, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("id", props.ticketId)
        .single();

      if (error) {
        toast({
          title: "Error getting session",
          description: error.message,
        });
        return;
      }

      setSession(session);
    };

    getSession();
  }, [props.ticketId, supabase, toast]);

  useEffect(() => {
    const getMessages = async () => {
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", props.ticketId)
        .order("created_at", { ascending: true });

      if (error) {
        toast({
          title: "Error getting messages",
          description: error.message,
        });
        return;
      }

      setMessages(messages);
    };

    getMessages();

    const messageListener = supabase
      .channel("public:chat_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          if (
            payload.new &&
            (payload.new as any).session_id === props.ticketId
          ) {
            setMessages((prevMessages) => [...prevMessages, payload.new as any]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageListener);
    };
  }, [props.ticketId, supabase, toast]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage) return;

    const messageId = uuidv4();

    const { error } = await supabase.from("chat_messages").insert({
      id: messageId,
      session_id: props.ticketId,
      sender: "admin",
      content: newMessage,
    });

    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
      });
      return;
    }

    setNewMessage("");
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-[80%]">
      <CardHeader>
        <CardTitle>
          {props.ticketTitle} - {props.ticketNumber}
        </CardTitle>
        <CardDescription>Chat with {props.userName}</CardDescription>
      </CardHeader>
      <CardContent className="h-[500px] flex flex-col">
        <div className="flex-grow overflow-hidden">
          <ScrollArea className="h-full">
            <div ref={scrollRef} className="space-y-4 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    message.sender === "admin" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.sender === "admin"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {message.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="p-4">
        <div className="flex w-full items-center space-x-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Input
            type="text"
            placeholder="Type your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default AdminChatView;
