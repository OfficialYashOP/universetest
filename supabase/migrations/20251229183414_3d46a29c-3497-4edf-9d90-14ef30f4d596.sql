-- Drop existing policy
DROP POLICY IF EXISTS "Users can add participants to their rooms" ON public.chat_participants;

-- Create a more permissive policy that allows:
-- 1. Users to add themselves to any room they created
-- 2. Room creators to add other users to their rooms
CREATE POLICY "Users can add participants to their rooms"
ON public.chat_participants
FOR INSERT
WITH CHECK (
  -- Either the user is adding themselves
  (auth.uid() = user_id)
  OR
  -- Or the user created this room (check by room_id -> chat_rooms.created_by)
  (EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE chat_rooms.id = chat_participants.room_id
    AND chat_rooms.created_by = auth.uid()
  ))
);