-- Create table for typing indicators
CREATE TABLE public.chat_typing_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create table for message read receipts
CREATE TABLE public.message_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'delivered', -- 'sent', 'delivered', 'read'
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create table to track identity key changes
CREATE TABLE public.identity_key_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  identity_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_key_history ENABLE ROW LEVEL SECURITY;

-- RLS for typing status
CREATE POLICY "Participants can view typing status"
ON public.chat_typing_status FOR SELECT
USING (is_chat_participant(auth.uid(), room_id));

CREATE POLICY "Users can update their own typing status"
ON public.chat_typing_status FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS for message receipts
CREATE POLICY "Participants can view receipts"
ON public.message_receipts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_messages m
    WHERE m.id = message_id
    AND is_chat_participant(auth.uid(), m.room_id)
  )
);

CREATE POLICY "Users can manage their own receipts"
ON public.message_receipts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS for identity key history
CREATE POLICY "Users can view identity key history"
ON public.identity_key_history FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can add their own key history"
ON public.identity_key_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for typing status
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_typing_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_receipts;