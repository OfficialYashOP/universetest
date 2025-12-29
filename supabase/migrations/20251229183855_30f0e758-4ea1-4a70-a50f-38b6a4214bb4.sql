-- Drop ALL existing policies on chat_rooms and recreate them properly
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Participants can view chat rooms" ON public.chat_rooms;

-- Recreate SELECT policy
CREATE POLICY "Participants can view chat rooms"
ON public.chat_rooms
FOR SELECT
USING (is_chat_participant(auth.uid(), id));

-- Recreate INSERT policy - simpler version
CREATE POLICY "Users can create chat rooms"
ON public.chat_rooms
FOR INSERT
WITH CHECK (created_by = auth.uid());