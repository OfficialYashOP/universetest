-- Fix chat_participants RLS policy to allow room creator to add other participants
DROP POLICY IF EXISTS "Users can add themselves to chats" ON chat_participants;

CREATE POLICY "Users can add participants to their rooms" ON chat_participants
FOR INSERT WITH CHECK (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE chat_rooms.id = chat_participants.room_id 
    AND chat_rooms.created_by = auth.uid()
  ))
);