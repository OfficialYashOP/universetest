-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  is_group BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  university_id UUID NOT NULL REFERENCES public.universities(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create conversation participants table
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id UUID, _conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

-- RLS policies for conversations
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (public.is_conversation_participant(auth.uid(), id));

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- RLS policies for conversation_participants
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT
USING (public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Conversation creator can add participants"
ON public.conversation_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND created_by = auth.uid()
  ) OR user_id = auth.uid()
);

-- RLS policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Users can send messages to their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND 
  public.is_conversation_participant(auth.uid(), conversation_id)
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- Create indexes for performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);