-- Drop and recreate the chat_rooms INSERT policy to be more permissive
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;

-- Allow any authenticated user to create a chat room where they set themselves as creator
CREATE POLICY "Users can create chat rooms"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);