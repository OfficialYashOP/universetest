/**
 * E2EE Module - Main Export
 * End-to-End Encryption for secure messaging
 */

export * from './crypto';
export * from './keyManager';
export * from './sessionManager';

// High-level API for chat encryption
import { initializeKeyBundle, hasKeysInitialized, getKeyFingerprint } from './keyManager';
import { encryptForSession, decryptFromSession, establishSession, hasSession } from './sessionManager';

export interface E2EEChatMessage {
  encrypted_content: string;
  iv: string;
  ephemeral_key?: string;
  message_number: number;
}

/**
 * Initialize E2EE for a user
 * Call this when user logs in
 */
export async function initializeE2EE(userId: string): Promise<boolean> {
  try {
    const bundle = await initializeKeyBundle(userId);
    return bundle !== null;
  } catch (error) {
    console.error('Failed to initialize E2EE:', error);
    return false;
  }
}

/**
 * Check if E2EE is ready for a user
 */
export function isE2EEReady(userId: string): boolean {
  return hasKeysInitialized(userId);
}

/**
 * Encrypt a message for sending
 */
export async function encryptChatMessage(
  userId: string,
  peerId: string,
  roomId: string,
  plaintext: string
): Promise<E2EEChatMessage | null> {
  try {
    const encrypted = await encryptForSession(userId, peerId, roomId, plaintext);
    if (!encrypted) return null;
    
    return {
      encrypted_content: encrypted.ciphertext,
      iv: encrypted.iv,
      ephemeral_key: encrypted.senderEphemeralKey,
      message_number: encrypted.messageNumber,
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

/**
 * Decrypt a received message
 */
export async function decryptChatMessage(
  userId: string,
  peerId: string,
  roomId: string,
  message: E2EEChatMessage
): Promise<string | null> {
  try {
    return await decryptFromSession(userId, peerId, roomId, {
      ciphertext: message.encrypted_content,
      iv: message.iv,
      senderEphemeralKey: message.ephemeral_key,
      messageNumber: message.message_number,
    });
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

/**
 * Ensure a session exists with a peer
 */
export async function ensureSession(
  userId: string,
  peerId: string,
  roomId: string
): Promise<boolean> {
  if (hasSession(userId, peerId, roomId)) {
    return true;
  }
  
  const session = await establishSession(userId, peerId, roomId);
  return session !== null;
}

/**
 * Get safety number for verification
 */
export async function getSafetyNumber(
  userId: string,
  peerId: string
): Promise<string | null> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Get both users' identity keys
    const { data: myBundle } = await supabase
      .from('user_key_bundles')
      .select('identity_key')
      .eq('user_id', userId)
      .maybeSingle();
    
    const { data: peerBundle } = await supabase
      .from('user_key_bundles')
      .select('identity_key')
      .eq('user_id', peerId)
      .maybeSingle();
    
    if (!myBundle || !peerBundle) return null;
    
    // Combine and format fingerprints
    const myFingerprint = getKeyFingerprint(myBundle.identity_key);
    const peerFingerprint = getKeyFingerprint(peerBundle.identity_key);
    
    // Sort for consistency (same result regardless of who generates it)
    const [first, second] = [myFingerprint, peerFingerprint].sort();
    
    return `${first}\n${second}`;
  } catch {
    return null;
  }
}
