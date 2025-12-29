-- Create a function to get or create a direct chat between two users
-- This uses SECURITY DEFINER to bypass RLS and ensure atomic operation
CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  existing_room_id uuid;
  new_room_id uuid;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot create chat with yourself';
  END IF;

  -- Check if a direct chat already exists between these two users
  SELECT cp1.room_id INTO existing_room_id
  FROM chat_participants cp1
  INNER JOIN chat_participants cp2 ON cp1.room_id = cp2.room_id
  INNER JOIN chat_rooms cr ON cr.id = cp1.room_id
  WHERE cp1.user_id = current_user_id
    AND cp2.user_id = other_user_id
    AND cr.is_group = false
  LIMIT 1;

  -- If chat exists, return it
  IF existing_room_id IS NOT NULL THEN
    RETURN existing_room_id;
  END IF;

  -- Create new chat room
  INSERT INTO chat_rooms (created_by, is_group)
  VALUES (current_user_id, false)
  RETURNING id INTO new_room_id;

  -- Add both participants
  INSERT INTO chat_participants (room_id, user_id)
  VALUES 
    (new_room_id, current_user_id),
    (new_room_id, other_user_id);

  RETURN new_room_id;
END;
$$;