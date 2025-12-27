import { useState, useEffect, useRef } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Heart, Send, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  views_count: number;
  likes_count: number;
  author?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface UserStories {
  user_id: string;
  author: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

export const StoriesBar = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [userStoriesList, setUserStoriesList] = useState<UserStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchStories();
  }, [profile?.university_id]);

  const fetchStories = async () => {
    if (!profile?.university_id || !user) return;

    setLoading(true);

    // Fetch non-expired stories from followed users
    const { data: stories, error } = await supabase
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stories:", error);
      setLoading(false);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(stories?.map(s => s.user_id) || [])];
    
    // Fetch profiles
    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);
      
      profiles?.forEach(p => {
        profilesMap[p.id] = p;
      });
    }

    // Fetch viewed stories
    const { data: viewedStories } = await supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", user.id);
    
    const viewedIds = new Set(viewedStories?.map(v => v.story_id) || []);

    // Group stories by user
    const groupedStories: Record<string, UserStories> = {};
    
    stories?.forEach(story => {
      if (!groupedStories[story.user_id]) {
        groupedStories[story.user_id] = {
          user_id: story.user_id,
          author: profilesMap[story.user_id] || { full_name: "Unknown", username: null, avatar_url: null },
          stories: [],
          hasUnviewed: false,
        };
      }
      groupedStories[story.user_id].stories.push({
        ...story,
        author: profilesMap[story.user_id],
      });
      if (!viewedIds.has(story.id)) {
        groupedStories[story.user_id].hasUnviewed = true;
      }
    });

    // Sort: own stories first, then unviewed, then viewed
    const sortedList = Object.values(groupedStories).sort((a, b) => {
      if (a.user_id === user.id) return -1;
      if (b.user_id === user.id) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    setUserStoriesList(sortedList);
    setLoading(false);
  };

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile?.university_id) return;

    // Only allow images for stories - no video uploads
    if (!file.type.startsWith("image/")) {
      toast({ 
        title: "Images only", 
        description: "Stories only support image uploads. For videos, share a link in FlexU posts.", 
        variant: "destructive" 
      });
      return;
    }

    // 4MB limit for images
    const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_IMAGE_SIZE) {
      toast({ 
        title: "Image too large", 
        description: "Image must be less than 4MB. Please compress or resize your image.", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `stories/${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const { error } = await supabase.from("stories").insert({
      user_id: user.id,
      university_id: profile.university_id,
      media_url: urlData.publicUrl,
      media_type: "image",
    });

    setIsUploading(false);

    if (error) {
      toast({ title: "Failed to create story", variant: "destructive" });
    } else {
      toast({ title: "Story added!" });
      fetchStories();
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const hasOwnStory = userStoriesList.some(us => us.user_id === user?.id);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add Story Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex flex-col items-center gap-1 min-w-[72px]"
        >
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            hasOwnStory 
              ? "bg-gradient-to-tr from-primary to-primary/60 p-0.5"
              : "border-2 border-dashed border-primary"
          )}>
            {hasOwnStory ? (
              <Avatar className="w-full h-full border-2 border-background">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-white">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Plus className="w-6 h-6 text-primary" />
            )}
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[72px]">
            {isUploading ? "Uploading..." : "Your story"}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleCreateStory}
          className="hidden"
        />

        {/* Other Users' Stories */}
        {userStoriesList.filter(us => us.user_id !== user?.id).map((userStories, index) => (
          <button
            key={userStories.user_id}
            onClick={() => {
              const realIndex = userStoriesList.findIndex(us => us.user_id === userStories.user_id);
              setSelectedUserIndex(realIndex);
              setCurrentStoryIndex(0);
            }}
            className="flex flex-col items-center gap-1 min-w-[72px]"
          >
            <div className={cn(
              "w-16 h-16 rounded-full p-0.5",
              userStories.hasUnviewed
                ? "bg-gradient-to-tr from-primary via-pink-500 to-orange-400"
                : "bg-muted"
            )}>
              <Avatar className="w-full h-full border-2 border-background">
                <AvatarImage src={userStories.author.avatar_url || ""} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {getInitials(userStories.author.full_name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs text-foreground truncate max-w-[72px]">
              {userStories.author.username || userStories.author.full_name?.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {selectedUserIndex !== null && userStoriesList[selectedUserIndex] && (
        <StoryViewer
          userStoriesList={userStoriesList}
          initialUserIndex={selectedUserIndex}
          onClose={() => setSelectedUserIndex(null)}
          onStoryViewed={fetchStories}
        />
      )}
    </>
  );
};

interface StoryViewerProps {
  userStoriesList: UserStories[];
  initialUserIndex: number;
  onClose: () => void;
  onStoryViewed: () => void;
}

const StoryViewer = ({ userStoriesList, initialUserIndex, onClose, onStoryViewed }: StoryViewerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [reply, setReply] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserStories = userStoriesList[userIndex];
  const currentStory = currentUserStories?.stories[storyIndex];
  const isVideo = currentStory?.media_type === "video";
  const STORY_DURATION = 5000; // 5 seconds for images

  useEffect(() => {
    if (!currentStory) return;
    recordView();
    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [userIndex, storyIndex]);

  const recordView = async () => {
    if (!user || !currentStory) return;
    
    await supabase
      .from("story_views")
      .upsert({ story_id: currentStory.id, viewer_id: user.id }, { onConflict: "story_id,viewer_id" });
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isVideo) return; // Video handles its own timing

    setProgress(0);
    const interval = 50;
    let elapsed = 0;

    timerRef.current = setInterval(() => {
      if (!isPaused) {
        elapsed += interval;
        setProgress((elapsed / STORY_DURATION) * 100);
        
        if (elapsed >= STORY_DURATION) {
          goToNext();
        }
      }
    }, interval);
  };

  const goToNext = () => {
    if (storyIndex < currentUserStories.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
    } else if (userIndex < userStoriesList.length - 1) {
      setUserIndex(prev => prev + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const goToPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
    } else if (userIndex > 0) {
      setUserIndex(prev => prev - 1);
      setStoryIndex(userStoriesList[userIndex - 1].stories.length - 1);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleVideoEnded = () => {
    goToNext();
  };

  const handleLike = async () => {
    if (!user || !currentStory) return;

    const { error } = await supabase
      .from("story_likes")
      .upsert({ story_id: currentStory.id, user_id: user.id }, { onConflict: "story_id,user_id" });

    if (!error) {
      toast({ title: "❤️" });
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !user || !currentStory) return;

    const { error } = await supabase
      .from("story_replies")
      .insert({
        story_id: currentStory.id,
        user_id: user.id,
        content: reply.trim(),
      });

    if (!error) {
      toast({ title: "Reply sent!" });
      setReply("");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!currentStory) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-black border-0 overflow-hidden max-h-[95vh]">
        <div className="relative h-[85vh] flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
            {currentUserStories.stories.map((_, idx) => (
              <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100"
                  style={{ 
                    width: idx < storyIndex ? "100%" : idx === storyIndex ? `${progress}%` : "0%" 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-6 left-2 right-2 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border border-white">
                <AvatarImage src={currentStory.author?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-white text-xs">
                  {getInitials(currentStory.author?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm font-semibold">
                  {currentStory.author?.username || currentStory.author?.full_name}
                </p>
                <p className="text-white/70 text-xs">
                  {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className="text-white p-1"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              {isVideo && (
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white p-1"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}
              <button onClick={onClose} className="text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Media */}
          <div 
            className="flex-1 flex items-center justify-center"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              if (x < rect.width / 3) goToPrev();
              else if (x > (rect.width * 2) / 3) goToNext();
            }}
          >
            {isVideo ? (
              <video
                ref={videoRef}
                src={currentStory.media_url}
                className="max-h-full max-w-full object-contain"
                autoPlay
                muted={isMuted}
                playsInline
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                onPause={() => setIsPaused(true)}
                onPlay={() => setIsPaused(false)}
              />
            ) : (
              <img
                src={currentStory.media_url}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-20 left-4 right-4 z-20">
              <p className="text-white text-sm bg-black/50 p-2 rounded">
                {currentStory.caption}
              </p>
            </div>
          )}

          {/* Navigation arrows */}
          {userIndex > 0 || storyIndex > 0 ? (
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          ) : null}
          {userIndex < userStoriesList.length - 1 || storyIndex < currentUserStories.stories.length - 1 ? (
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          ) : null}

          {/* Reply bar */}
          {currentStory.user_id !== user?.id && (
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-2">
              <Input
                placeholder="Send a reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
              />
              <button onClick={handleLike} className="text-white p-2">
                <Heart className="w-6 h-6" />
              </button>
              {reply.trim() && (
                <button onClick={handleReply} className="text-white p-2">
                  <Send className="w-6 h-6" />
                </button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
