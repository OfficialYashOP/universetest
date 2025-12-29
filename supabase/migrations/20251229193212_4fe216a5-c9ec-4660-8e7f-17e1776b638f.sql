-- Create table for user key bundles (identity keys and signed pre-keys)
CREATE TABLE public.user_key_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  identity_key TEXT NOT NULL, -- Public identity key (base64 encoded)
  signed_prekey TEXT NOT NULL, -- Signed pre-key (base64 encoded)
  signed_prekey_signature TEXT NOT NULL, -- Signature of signed pre-key
  signed_prekey_id INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for one-time pre-keys
CREATE TABLE public.user_prekeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prekey_id INTEGER NOT NULL,
  prekey TEXT NOT NULL, -- Public pre-key (base64 encoded)
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, prekey_id)
);

-- Create table for E2EE sessions between users
CREATE TABLE public.e2ee_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- The user who owns this session state
  peer_id UUID NOT NULL, -- The other user in the session
  session_data TEXT NOT NULL, -- Encrypted session state (ratchet keys, etc.)
  root_key TEXT, -- Current root key for ratcheting
  chain_key_send TEXT, -- Sending chain key
  chain_key_receive TEXT, -- Receiving chain key
  send_counter INTEGER NOT NULL DEFAULT 0,
  receive_counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id, peer_id)
);

-- Enable RLS
ALTER TABLE public.user_key_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prekeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e2ee_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_key_bundles
-- Users can manage their own key bundle
CREATE POLICY "Users can manage their own key bundle"
ON public.user_key_bundles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Anyone authenticated can view public keys for key exchange
CREATE POLICY "Authenticated users can view public key bundles"
ON public.user_key_bundles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for user_prekeys
-- Users can manage their own pre-keys
CREATE POLICY "Users can manage their own prekeys"
ON public.user_prekeys FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Anyone authenticated can view and claim pre-keys (for key exchange)
CREATE POLICY "Authenticated users can view prekeys"
ON public.user_prekeys FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for e2ee_sessions
-- Users can only access their own sessions
CREATE POLICY "Users can manage their own sessions"
ON public.e2ee_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to claim a one-time pre-key atomically
CREATE OR REPLACE FUNCTION public.claim_prekey(target_user_id UUID)
RETURNS TABLE(prekey_id INTEGER, prekey TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_id INTEGER;
  claimed_key TEXT;
BEGIN
  -- Atomically select and mark a pre-key as used
  UPDATE user_prekeys 
  SET used = true 
  WHERE id = (
    SELECT id FROM user_prekeys 
    WHERE user_id = target_user_id AND used = false 
    ORDER BY prekey_id ASC 
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING user_prekeys.prekey_id, user_prekeys.prekey INTO claimed_id, claimed_key;
  
  RETURN QUERY SELECT claimed_id, claimed_key;
END;
$$;

-- Add trigger to update updated_at
CREATE TRIGGER update_user_key_bundles_updated_at
BEFORE UPDATE ON public.user_key_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_e2ee_sessions_updated_at
BEFORE UPDATE ON public.e2ee_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();