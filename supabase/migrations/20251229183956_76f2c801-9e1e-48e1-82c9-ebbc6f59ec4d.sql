-- Drop and recreate with explicit targeting
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;

-- Create a very simple policy that just checks the created_by matches auth.uid()
CREATE POLICY "Authenticated users can create chat rooms"
ON public.chat_rooms
FOR INSERT
TO public
WITH CHECK (created_by IS NOT NULL AND created_by = auth.uid());