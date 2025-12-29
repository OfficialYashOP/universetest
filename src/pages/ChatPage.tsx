import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2, Lock, Search, Plus, ArrowLeft, Users, Shield, CheckCheck, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { cn } from "@/lib/utils";
import { 
  initializeE2EE, 
  isE2EEReady, 
  encryptChatMessage, 
  decryptChatMessage,
  ensureSession,
  getE2EEStatus,
  repairSession,
  type E2EEChatMessage,
} from "@/lib/e2ee";
import { Badge } from "@/components/ui/badge";
import { SafetyNumberDialog } from "@/components/chat/SafetyNumberDialog";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { EncryptionBadge } from "@/components/chat/EncryptionBadge";

interface ChatRoom {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  participants?: {
    user_id: string;
    profile?: {
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
    };
  }[];
  lastMessage?: {
    content: string;
    created_at: string;
  };
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  encrypted_content: string;
  iv: string;
  created_at: string;
  message_number?: number;
  ephemeral_key?: string;
  encryption_version?: number;
  decrypted?: string;
  decryptError?: string;
}

const ChatPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const roomIdFromUrl = searchParams.get("room");
  
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [followedUsers, setFollowedUsers] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);
  const [showSafetyNumber, setShowSafetyNumber] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // E2EE state
  const [e2eeReady, setE2eeReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [settingUpSession, setSettingUpSession] = useState(false);

  // Get peer ID from selected room
  const peerId = selectedRoom?.participants?.[0]?.user_id;
  const peerName = selectedRoom?.participants?.[0]?.profile?.full_name || "User";

  // Initialize E2EE when user is available
  useEffect(() => {
    if (user?.id) {
      initializeE2EEForUser();
    }
  }, [user?.id]);

  const initializeE2EEForUser = async () => {
    if (!user?.id) return;
    
    console.log('[ChatPage] Initializing E2EE...');
    const success = await initializeE2EE(user.id);
    setE2eeReady(success);
    
    if (!success) {
      toast({
        title: "Encryption setup failed",
        description: "Messages may not be encrypted. Please refresh the page.",
        variant: "destructive"
      });
    } else {
      console.log('[ChatPage] E2EE initialized successfully');
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchRooms();
      fetchFollowedUsers();
    }
  }, [user?.id]);

  // Handle room selection from URL query param
  useEffect(() => {
    if (roomIdFromUrl && rooms.length > 0 && !selectedRoom) {
      const roomFromUrl = rooms.find(r => r.id === roomIdFromUrl);
      if (roomFromUrl) {
        setSelectedRoom(roomFromUrl);
      } else {
        // Room exists but not in the list yet - fetch it
        fetchRoomById(roomIdFromUrl);
      }
    }
  }, [roomIdFromUrl, rooms, selectedRoom]);

  // Setup E2EE session when room and peer are selected
  useEffect(() => {
    if (selectedRoom && peerId && user?.id && e2eeReady) {
      setupSession();
    } else {
      setSessionReady(false);
    }
  }, [selectedRoom?.id, peerId, user?.id, e2eeReady]);

  const setupSession = async () => {
    if (!user?.id || !peerId || !selectedRoom?.id) return;
    
    setSettingUpSession(true);
    console.log('[ChatPage] Setting up E2EE session...');
    
    const success = await ensureSession(user.id, peerId, selectedRoom.id);
    setSessionReady(success);
    setSettingUpSession(false);
    
    if (!success) {
      console.warn('[ChatPage] Failed to establish secure session');
    } else {
      console.log('[ChatPage] E2EE session ready');
    }
  };

  useEffect(() => {
    if (selectedRoom && e2eeReady) {
      fetchMessages(selectedRoom.id);
      const unsubMessages = subscribeToMessages(selectedRoom.id);
      const unsubTyping = subscribeToTyping(selectedRoom.id);
      return () => {
        unsubMessages?.();
        unsubTyping?.();
      };
    }
  }, [selectedRoom?.id, e2eeReady]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchRoomById = async (roomId: string) => {
    if (!user) return;
    
    const { data: roomData } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle();

    if (!roomData) return;

    const { data: participants } = await supabase
      .from("chat_participants")
      .select("user_id")
      .eq("room_id", roomId);

    const otherParticipants = participants?.filter(p => p.user_id !== user.id) || [];
    
    let profiles: any[] = [];
    if (otherParticipants.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", otherParticipants.map(p => p.user_id));
      profiles = data || [];
    }

    const roomWithParticipants = {
      ...roomData,
      participants: otherParticipants.map(p => ({
        user_id: p.user_id,
        profile: profiles.find(pr => pr.id === p.user_id),
      })),
    };

    setRooms(prev => {
      if (prev.find(r => r.id === roomId)) return prev;
      return [roomWithParticipants, ...prev];
    });
    setSelectedRoom(roomWithParticipants);
  };

  const fetchRooms = async () => {
    if (!user) return;
    setLoading(true);

    const { data: participations } = await supabase
      .from("chat_participants")
      .select("room_id")
      .eq("user_id", user.id);

    if (!participations?.length) {
      setLoading(false);
      return;
    }

    const roomIds = participations.map(p => p.room_id);

    const { data: roomsData } = await supabase
      .from("chat_rooms")
      .select("*")
      .in("id", roomIds)
      .order("updated_at", { ascending: false });

    // Fetch participants for each room
    const roomsWithParticipants = await Promise.all(
      (roomsData || []).map(async (room) => {
        const { data: participants } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("room_id", room.id);

        const otherParticipants = participants?.filter(p => p.user_id !== user.id) || [];
        
        let profiles: any[] = [];
        if (otherParticipants.length > 0) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", otherParticipants.map(p => p.user_id));
          profiles = data || [];
        }

        return {
          ...room,
          participants: otherParticipants.map(p => ({
            user_id: p.user_id,
            profile: profiles.find(pr => pr.id === p.user_id),
          })),
        };
      })
    );

    setRooms(roomsWithParticipants);
    setLoading(false);
  };

  const fetchFollowedUsers = async () => {
    if (!user) return;

    // Get users the current user is following
    const { data: followingData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (!followingData?.length) {
      setFollowedUsers([]);
      return;
    }

    const followingIds = followingData.map(f => f.following_id);

    // Get profiles of followed users
    const { data: profiles } = await supabase
      .rpc("get_messaging_profiles", { profile_ids: followingIds });

    setFollowedUsers(profiles || []);
  };

  const decryptMessageContent = async (msg: Message): Promise<Message> => {
    if (!user?.id || !peerId) {
      return { ...msg, decrypted: "[Encryption not ready]" };
    }
    
    // Check if this is a legacy message (v1) or new E2EE message (v2)
    const isLegacy = msg.encryption_version === 1 || 
      (msg.message_number === undefined && !msg.ephemeral_key);
    
    if (isLegacy) {
      // Can't decrypt legacy messages with new E2EE system
      return { ...msg, decrypted: "[Legacy message - cannot decrypt]", decryptError: "legacy" };
    }
    
    const e2eeMessage: E2EEChatMessage = {
      encrypted_content: msg.encrypted_content,
      iv: msg.iv,
      ephemeral_key: msg.ephemeral_key,
      message_number: msg.message_number || 0,
    };
    
    const result = await decryptChatMessage(user.id, peerId, msg.room_id, e2eeMessage);
    
    if (result.text) {
      return { ...msg, decrypted: result.text };
    } else if (result.needsRepair) {
      return { 
        ...msg, 
        decrypted: "[Message can't be decrypted (session changed)]",
        decryptError: "session_mismatch" 
      };
    } else {
      return { 
        ...msg, 
        decrypted: "[Unable to decrypt]",
        decryptError: result.error 
      };
    }
  };

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data && user?.id && peerId) {
      const decryptedMessages = await Promise.all(
        data.map(msg => decryptMessageContent(msg))
      );
      setMessages(decryptedMessages);
    } else if (data) {
      setMessages(data.map(msg => ({ ...msg, decrypted: "[Waiting for encryption...]" })));
    }
  };

  const subscribeToMessages = (roomId: string) => {
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          const decryptedMsg = await decryptMessageContent(newMsg);
          setMessages(prev => [...prev, decryptedMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToTyping = (roomId: string) => {
    if (!user) return;
    
    const channel = supabase
      .channel(`typing-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_typing_status",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const typingData = payload.new as any;
          if (typingData && typingData.user_id !== user.id) {
            setPeerTyping(typingData.is_typing);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateTypingStatus = useCallback(async (typing: boolean) => {
    if (!selectedRoom || !user) return;
    
    await supabase
      .from("chat_typing_status")
      .upsert({
        room_id: selectedRoom.id,
        user_id: user.id,
        is_typing: typing,
        updated_at: new Date().toISOString(),
      });
  }, [selectedRoom?.id, user?.id]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user || !peerId) return;
    
    // Check if session is ready
    if (!sessionReady) {
      toast({
        title: "Setting up secure connection",
        description: "Please wait while encryption is established.",
      });
      return;
    }

    setSendingMessage(true);
    
    // Stop typing indicator
    setIsTyping(false);
    updateTypingStatus(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Encrypt with E2EE
    const encrypted = await encryptChatMessage(user.id, peerId, selectedRoom.id, newMessage.trim());
    
    if (!encrypted) {
      toast({ 
        title: "Failed to encrypt message", 
        description: "Please try again.",
        variant: "destructive" 
      });
      setSendingMessage(false);
      return;
    }

    const { error } = await supabase.from("chat_messages").insert({
      room_id: selectedRoom.id,
      sender_id: user.id,
      encrypted_content: encrypted.encrypted_content,
      iv: encrypted.iv,
      ephemeral_key: encrypted.ephemeral_key,
      message_number: encrypted.message_number,
      encryption_version: 2,
    });

    setSendingMessage(false);

    if (error) {
      toast({ title: "Failed to send message", variant: "destructive" });
    } else {
      setNewMessage("");
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .eq("university_id", profile?.university_id)
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .neq("id", user?.id)
      .limit(10);

    setSearchResults(data || []);
  };

  const handleStartChat = async (otherUserId: string) => {
    if (!user) return;

    try {
      // Use the database function to get or create a chat atomically
      const { data: roomId, error } = await supabase
        .rpc("get_or_create_direct_chat", { other_user_id: otherUserId });

      if (error) {
        console.error("Error creating/getting chat:", error);
        toast({ title: "Failed to start chat", description: error.message, variant: "destructive" });
        return;
      }

      if (!roomId) {
        toast({ title: "Failed to start chat", variant: "destructive" });
        return;
      }

      setShowNewChat(false);
      await fetchRoomById(roomId);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({ title: "Failed to start chat", variant: "destructive" });
    }
  };

  const handleStartChatWithUser = async (otherUserId: string) => {
    if (!user) return;
    setStartingChatWith(otherUserId);

    try {
      // Use the database function to get or create a chat atomically
      const { data: roomId, error } = await supabase
        .rpc("get_or_create_direct_chat", { other_user_id: otherUserId });

      if (error) {
        console.error("Error creating/getting chat:", error);
        toast({ title: "Failed to start chat", description: error.message, variant: "destructive" });
        return;
      }

      if (!roomId) {
        toast({ title: "Failed to start chat", variant: "destructive" });
        return;
      }

      // Fetch and select the room
      await fetchRoomById(roomId);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({ title: "Failed to start chat", variant: "destructive" });
    } finally {
      setStartingChatWith(null);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getChatName = (room: ChatRoom) => {
    if (room.name) return room.name;
    const otherParticipant = room.participants?.[0]?.profile;
    return otherParticipant?.username 
      ? `@${otherParticipant.username}` 
      : otherParticipant?.full_name || "Chat";
  };

  const getChatAvatar = (room: ChatRoom) => {
    return room.participants?.[0]?.profile?.avatar_url || "";
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)] flex">
        {/* Sidebar - Chat List */}
        <div className={cn(
          "w-full md:w-80 border-r border-border flex flex-col",
          selectedRoom && "hidden md:flex"
        )}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Chats
              </h1>
              <Button size="icon" variant="ghost" onClick={() => setShowNewChat(true)}>
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" />
              End-to-end encrypted
              {!e2eeReady && (
                <span className="text-destructive ml-1">(initializing...)</span>
              )}
            </p>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Existing chat rooms */}
                {rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={cn(
                      "w-full p-4 flex items-center gap-3 hover:bg-muted transition-colors",
                      selectedRoom?.id === room.id && "bg-muted"
                    )}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={getChatAvatar(room)} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials(getChatName(room))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold truncate">{getChatName(room)}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {room.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </button>
                ))}

                {/* Followed users without existing chats */}
                {followedUsers.filter(fu => 
                  !rooms.some(r => r.participants?.some(p => p.user_id === fu.id))
                ).length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-border mt-2">
                      <Users className="w-3 h-3 inline mr-1" />
                      Following
                    </div>
                    {followedUsers
                      .filter(fu => !rooms.some(r => r.participants?.some(p => p.user_id === fu.id)))
                      .map(fu => (
                        <button
                          key={fu.id}
                          onClick={() => handleStartChatWithUser(fu.id)}
                          disabled={startingChatWith === fu.id}
                          className="w-full p-4 flex items-center gap-3 hover:bg-muted transition-colors"
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={fu.avatar_url || ""} />
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                              {getInitials(fu.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-semibold truncate">{fu.full_name || "User"}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              Tap to start a chat
                            </p>
                          </div>
                          {startingChatWith === fu.id && (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          )}
                        </button>
                      ))}
                  </>
                )}

                {/* Empty state */}
                {rooms.length === 0 && followedUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No chats yet</p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => setShowNewChat(true)}
                    >
                      Start a conversation
                    </Button>
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        </div>

        {/* Chat View */}
        <div className={cn(
          "flex-1 flex flex-col",
          !selectedRoom && "hidden md:flex"
        )}>
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  onClick={() => setSelectedRoom(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={getChatAvatar(selectedRoom)} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {getInitials(getChatName(selectedRoom))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{getChatName(selectedRoom)}</p>
                  <div className="flex items-center gap-2">
                    <EncryptionBadge variant="small" />
                    {settingUpSession && (
                      <span className="text-xs text-muted-foreground animate-pulse">
                        Setting up secure chat...
                      </span>
                    )}
                    {peerTyping && (
                      <span className="text-xs text-primary animate-pulse">typing...</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSafetyNumber(true)}
                  title="Verify encryption"
                >
                  <Shield className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender_id === user?.id ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          msg.sender_id === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                          msg.decryptError && "opacity-60"
                        )}
                      >
                        <p className="break-words">
                          {msg.decryptError ? (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {msg.decrypted}
                            </span>
                          ) : (
                            msg.decrypted
                          )}
                        </p>
                        <div className={cn(
                          "text-xs mt-1 flex items-center gap-1",
                          msg.sender_id === user?.id
                            ? "text-primary-foreground/70 justify-end"
                            : "text-muted-foreground"
                        )}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          {msg.sender_id === user?.id && !msg.decryptError && (
                            <CheckCheck className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {peerTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border flex gap-2">
                <Input
                  placeholder={sessionReady ? "Type a message..." : "Setting up encryption..."}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                  disabled={!sessionReady}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage || !sessionReady}
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a chat or start a new conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Chat</DialogTitle>
            <DialogDescription>
              Search for a user to start a conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map(searchUser => (
                <button
                  key={searchUser.id}
                  onClick={() => handleStartChat(searchUser.id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={searchUser.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(searchUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-semibold">{searchUser.full_name || "Unknown"}</p>
                    {searchUser.username && (
                      <p className="text-sm text-muted-foreground">@{searchUser.username}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Safety Number Dialog */}
      {user && peerId && (
        <SafetyNumberDialog
          open={showSafetyNumber}
          onOpenChange={setShowSafetyNumber}
          userId={user.id}
          peerId={peerId}
          peerName={peerName}
        />
      )}
    </DashboardLayout>
  );
};

export default ChatPage;
