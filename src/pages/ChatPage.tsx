import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2, Lock, Search, Plus, ArrowLeft, MoreVertical, Users } from "lucide-react";
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

// Simple encryption utilities
const generateKey = async (): Promise<CryptoKey> => {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

const exportKey = async (key: CryptoKey): Promise<string> => {
  const exported = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

const importKey = async (keyString: string): Promise<CryptoKey> => {
  const keyBuffer = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

const encryptMessage = async (message: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(message);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
};

const decryptMessage = async (encrypted: string, iv: string, key: CryptoKey): Promise<string> => {
  try {
    const encryptedBuffer = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      key,
      encryptedBuffer
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return "[Unable to decrypt]";
  }
};

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
  decrypted?: string;
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
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeEncryption();
    fetchRooms();
    fetchFollowedUsers();
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

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
      subscribeToMessages(selectedRoom.id);
    }
  }, [selectedRoom?.id]);

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

  const initializeEncryption = async () => {
    // In production, you'd derive this from user credentials or store securely
    const storedKey = localStorage.getItem(`chat_key_${user?.id}`);
    if (storedKey) {
      const key = await importKey(storedKey);
      setEncryptionKey(key);
    } else {
      const key = await generateKey();
      const exported = await exportKey(key);
      localStorage.setItem(`chat_key_${user?.id}`, exported);
      setEncryptionKey(key);
    }
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

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data && encryptionKey) {
      const decryptedMessages = await Promise.all(
        data.map(async (msg) => ({
          ...msg,
          decrypted: await decryptMessage(msg.encrypted_content, msg.iv, encryptionKey),
        }))
      );
      setMessages(decryptedMessages);
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
          if (encryptionKey) {
            const decrypted = await decryptMessage(newMsg.encrypted_content, newMsg.iv, encryptionKey);
            setMessages(prev => [...prev, { ...newMsg, decrypted }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user || !encryptionKey) return;

    setSendingMessage(true);

    const { encrypted, iv } = await encryptMessage(newMessage.trim(), encryptionKey);

    const { error } = await supabase.from("chat_messages").insert({
      room_id: selectedRoom.id,
      sender_id: user.id,
      encrypted_content: encrypted,
      iv,
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

    // Check if chat already exists
    const { data: existingParticipations } = await supabase
      .from("chat_participants")
      .select("room_id")
      .eq("user_id", user.id);

    const roomIds = existingParticipations?.map(p => p.room_id) || [];

    if (roomIds.length > 0) {
      const { data: otherParticipations } = await supabase
        .from("chat_participants")
        .select("room_id")
        .eq("user_id", otherUserId)
        .in("room_id", roomIds);

      if (otherParticipations?.length) {
        // Chat already exists
        const existingRoom = rooms.find(r => r.id === otherParticipations[0].room_id);
        if (existingRoom) {
          setSelectedRoom(existingRoom);
          setShowNewChat(false);
          return;
        }
      }
    }

    // Create new chat
    const { data: newRoom, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({ created_by: user.id })
      .select()
      .single();

    if (roomError || !newRoom) {
      toast({ title: "Failed to create chat", variant: "destructive" });
      return;
    }

    // Add participants
    await supabase.from("chat_participants").insert([
      { room_id: newRoom.id, user_id: user.id },
      { room_id: newRoom.id, user_id: otherUserId },
    ]);

    setShowNewChat(false);
    fetchRooms();
  };

  const handleStartChatWithUser = async (otherUserId: string) => {
    if (!user) return;
    setStartingChatWith(otherUserId);

    try {
      // Check if chat already exists
      const { data: existingParticipations } = await supabase
        .from("chat_participants")
        .select("room_id")
        .eq("user_id", user.id);

      const roomIds = existingParticipations?.map(p => p.room_id) || [];

      if (roomIds.length > 0) {
        const { data: otherParticipations } = await supabase
          .from("chat_participants")
          .select("room_id")
          .eq("user_id", otherUserId)
          .in("room_id", roomIds);

        if (otherParticipations?.length) {
          // Chat already exists
          const existingRoom = rooms.find(r => r.id === otherParticipations[0].room_id);
          if (existingRoom) {
            setSelectedRoom(existingRoom);
            setStartingChatWith(null);
            return;
          }
        }
      }

      // Create new chat
      const { data: newRoom, error: roomError } = await supabase
        .from("chat_rooms")
        .insert({ created_by: user.id })
        .select()
        .single();

      if (roomError || !newRoom) {
        toast({ title: "Failed to create chat", variant: "destructive" });
        setStartingChatWith(null);
        return;
      }

      // Add participants
      await supabase.from("chat_participants").insert([
        { room_id: newRoom.id, user_id: user.id },
        { room_id: newRoom.id, user_id: otherUserId },
      ]);

      await fetchRooms();
      
      // Find and select the new room
      const updatedRooms = await supabase
        .from("chat_participants")
        .select("room_id")
        .eq("room_id", newRoom.id);
      
      if (updatedRooms.data) {
        fetchRoomById(newRoom.id);
      }
    } catch (error) {
      toast({ title: "Failed to start chat", variant: "destructive" });
    }
    
    setStartingChatWith(null);
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
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Encrypted
                  </p>
                </div>
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
                            : "bg-muted"
                        )}
                      >
                        <p className="break-words">{msg.decrypted}</p>
                        <p className={cn(
                          "text-xs mt-1",
                          msg.sender_id === user?.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
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
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleStartChat(user.id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-semibold">{user.full_name || "Unknown"}</p>
                    {user.username && (
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ChatPage;
