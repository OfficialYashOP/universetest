-- Add missing metadata needed for X3DH + Double Ratchet message setup
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS encryption_version integer NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS message_number integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ephemeral_key text NULL,
ADD COLUMN IF NOT EXISTS used_prekey_id integer NULL,
ADD COLUMN IF NOT EXISTS used_signed_prekey_id integer NULL;

-- Helpful index for first-message / handshake lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created
ON public.chat_messages (room_id, created_at);

-- Mark existing messages as legacy (pre-E2EE metadata)
UPDATE public.chat_messages
SET encryption_version = 1
WHERE encryption_version = 2
  AND (ephemeral_key IS NULL AND message_number = 0 AND used_prekey_id IS NULL AND used_signed_prekey_id IS NULL);
