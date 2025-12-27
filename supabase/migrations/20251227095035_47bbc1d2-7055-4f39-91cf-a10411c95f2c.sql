-- ============================================
-- FOLLOW SYSTEM
-- ============================================
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id AND follower_id != following_id);

CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "Users can view follows" ON public.follows
  FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- ============================================
-- STORIES
-- ============================================
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  university_id UUID NOT NULL REFERENCES public.universities(id),
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own stories" ON public.stories
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND university_id = get_user_university(auth.uid())
    AND is_account_active(auth.uid())
  );

CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view stories from people they follow or their own" ON public.stories
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM follows 
      WHERE follower_id = auth.uid() 
      AND following_id = stories.user_id
    )
  );

-- Story views tracking
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view story views" ON public.story_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can record views" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Story likes
CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can like stories" ON public.story_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike stories" ON public.story_likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view likes" ON public.story_likes
  FOR SELECT USING (true);

-- Story replies
CREATE TABLE public.story_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can reply to stories" ON public.story_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_account_active(auth.uid()));

CREATE POLICY "Story owners can view replies" ON public.story_replies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- ============================================
-- REPORTS/FLAGS
-- ============================================
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_type TEXT NOT NULL, -- 'post', 'comment', 'story', 'user'
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id AND is_account_active(auth.uid()));

CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Staff can view all reports" ON public.reports
  FOR SELECT USING (has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update reports" ON public.reports
  FOR UPDATE USING (has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'admin'));

-- ============================================
-- ENCRYPTED CHAT SYSTEM
-- ============================================
-- Chat rooms (1-on-1 or group)
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  is_group BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Chat participants
CREATE TABLE public.chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  public_key TEXT, -- For E2E encryption key exchange
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Create function to check chat participation
CREATE OR REPLACE FUNCTION public.is_chat_participant(_user_id UUID, _room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE user_id = _user_id AND room_id = _room_id
  )
$$;

CREATE POLICY "Participants can view chat rooms" ON public.chat_rooms
  FOR SELECT USING (is_chat_participant(auth.uid(), id));

CREATE POLICY "Users can create chat rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by AND is_account_active(auth.uid()));

CREATE POLICY "Participants can view other participants" ON public.chat_participants
  FOR SELECT USING (is_chat_participant(auth.uid(), room_id));

CREATE POLICY "Users can add themselves to chats" ON public.chat_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND created_by = auth.uid())
  );

CREATE POLICY "Users can update their own participant record" ON public.chat_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Encrypted messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  encrypted_content TEXT NOT NULL, -- Base64 encoded encrypted message
  iv TEXT NOT NULL, -- Initialization vector for decryption
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages" ON public.chat_messages
  FOR SELECT USING (is_chat_participant(auth.uid(), room_id));

CREATE POLICY "Participants can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id 
    AND is_chat_participant(auth.uid(), room_id)
    AND is_account_active(auth.uid())
  );

-- ============================================
-- POST TAGS (Tagging friends in posts)
-- ============================================
CREATE TABLE public.post_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tagged_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, tagged_user_id)
);

ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post owners can tag users" ON public.post_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid())
  );

CREATE POLICY "Post owners can remove tags" ON public.post_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid())
    OR auth.uid() = tagged_user_id
  );

CREATE POLICY "Users can view tags" ON public.post_tags
  FOR SELECT USING (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;