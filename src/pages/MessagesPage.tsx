import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Send, 
  Plus,
  Search,
  Loader2,
  Users,
  ArrowLeft,
  BadgeCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  updated_at: string;
  other_participant?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
  last_message?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const newUserId = searchParams.get("new");

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (!participations?.length) {
        setLoading(false);
        return;
      }

      const conversationIds = participations.map(p => p.conversation_id);

      const { data: convos } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      // For each conversation, get the other participant (for 1-to-1 chats)
      const enrichedConvos = await Promise.all(
        (convos || []).map(async (convo) => {
          if (!convo.is_group) {
            const { data: participants } = await supabase
              .from("conversation_participants")
              .select("user_id")
              .eq("conversation_id", convo.id)
              .neq("user_id", user.id)
              .limit(1);

            if (participants?.[0]) {
              const { data: otherUser } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url, is_verified")
                .eq("id", participants[0].user_id)
                .maybeSingle();

              return { ...convo, other_participant: otherUser };
            }
          }
          return convo;
        })
      );

      setConversations(enrichedConvos);
      setLoading(false);
    };

    fetchConversations();
  }, [user]);

  // Handle new conversation from community page
  useEffect(() => {
    const startNewConversation = async () => {
      if (!newUserId || !user || !profile?.university_id) return;

      // Check if conversation already exists
      const existingConvo = conversations.find(
        c => !c.is_group && c.other_participant?.id === newUserId
      );

      if (existingConvo) {
        setSelectedConversation(existingConvo.id);
        setShowMobileChat(true);
        return;
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({
          created_by: user.id,
          university_id: profile.university_id,
          is_group: false,
        })
        .select()
        .single();

      if (error || !newConvo) return;

      // Add both participants
      await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: newConvo.id, user_id: user.id },
          { conversation_id: newConvo.id, user_id: newUserId },
        ]);

      // Fetch the other user's profile
      const { data: otherUser } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, is_verified")
        .eq("id", newUserId)
        .maybeSingle();

      const enrichedConvo = { ...newConvo, other_participant: otherUser };
      setConversations(prev => [enrichedConvo, ...prev]);
      setSelectedConversation(newConvo.id);
      setShowMobileChat(true);
    };

    startNewConversation();
  }, [newUserId, user, profile?.university_id, conversations]);

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation)
        .order("created_at", { ascending: true });

      if (data) {
        // Fetch sender profiles
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", senderIds);

        const profilesMap: Record<string, any> = {};
        profiles?.forEach(p => profilesMap[p.id] = p);

        setMessages(data.map(m => ({ ...m, sender: profilesMap[m.sender_id] })));
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          const { data: sender } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", newMsg.sender_id)
            .maybeSingle();

          setMessages(prev => [...prev, { ...newMsg, sender }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    
    await supabase.from("messages").insert({
      conversation_id: selectedConversation,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    // Update conversation's updated_at
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", selectedConversation);

    setNewMessage("");
    setSending(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const selectedConvo = conversations.find(c => c.id === selectedConversation);

  const filteredConversations = conversations.filter(c => {
    const name = c.is_group ? c.name : c.other_participant?.full_name;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-2rem)] flex">
        {/* Conversations List */}
        <div className={cn(
          "w-full md:w-80 border-r border-border flex flex-col bg-card",
          showMobileChat && "hidden md:flex"
        )}>
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-bold flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              Messages
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start one from the Community page
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredConversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => {
                      setSelectedConversation(convo.id);
                      setShowMobileChat(true);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                      selectedConversation === convo.id
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={convo.is_group ? "" : convo.other_participant?.avatar_url || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-universe-blue to-universe-purple text-white">
                        {convo.is_group ? <Users className="w-4 h-4" /> : getInitials(convo.other_participant?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium truncate">
                          {convo.is_group ? convo.name : convo.other_participant?.full_name || "Unknown"}
                        </span>
                        {!convo.is_group && convo.other_participant?.is_verified && (
                          <BadgeCheck className="w-4 h-4 text-universe-cyan flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(convo.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-background",
          !showMobileChat && "hidden md:flex"
        )}>
          {selectedConvo ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-2 hover:bg-muted rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConvo.is_group ? "" : selectedConvo.other_participant?.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-universe-blue to-universe-purple text-white">
                    {selectedConvo.is_group ? <Users className="w-4 h-4" /> : getInitials(selectedConvo.other_participant?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">
                      {selectedConvo.is_group ? selectedConvo.name : selectedConvo.other_participant?.full_name || "Unknown"}
                    </span>
                    {!selectedConvo.is_group && selectedConvo.other_participant?.is_verified && (
                      <BadgeCheck className="w-4 h-4 text-universe-cyan" />
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex gap-2", isOwn && "flex-row-reverse")}
                      >
                        {!isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.sender?.avatar_url || ""} />
                            <AvatarFallback className="bg-muted text-xs">
                              {getInitials(msg.sender?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2",
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sending}>
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;
