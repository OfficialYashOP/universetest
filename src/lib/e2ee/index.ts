/**
 * E2EE Module - Main Export
 * End-to-End Encryption for secure messaging
 */

export * from './crypto';
export * from './keyManager';
export * from './sessionManager';

// High-level API for chat encryption
import { supabase } from '@/integrations/supabase/client';
import { 
  initializeKeyBundle, 
  hasKeysInitialized, 
  getKeyFingerprint,
  fetchPublicKeyBundle,
  replenishPreKeys,
  loadIdentityKey,
} from './keyManager';
import { 
  encryptForSession, 
  decryptFromSession, 
  establishSession, 
  hasSession,
  clearSession,
} from './sessionManager';

export interface E2EEChatMessage {
  encrypted_content: string;
  iv: string;
  ephemeral_key?: string;
  message_number: number;
}

export interface E2EEStatus {
  ready: boolean;
  hasKeys: boolean;
  sessionEstablished: boolean;
  error?: string;
}

/**
 * Initialize E2EE for a user
 * Call this when user logs in
 */
export async function initializeE2EE(userId: string): Promise<boolean> {
  try {
    console.log('[E2EE] Initializing for user:', userId);
    const bundle = await initializeKeyBundle(userId);
    if (bundle) {
      console.log('[E2EE] Key bundle initialized successfully');
      // Replenish prekeys if running low
      await replenishPreKeys(userId, 10);
      return true;
    }
    console.error('[E2EE] Failed to initialize key bundle');
    return false;
  } catch (error) {
    console.error('[E2EE] Failed to initialize:', error);
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
 * Check complete E2EE status for a chat
 */
export async function getE2EEStatus(
  userId: string,
  peerId: string,
  roomId: string
): Promise<E2EEStatus> {
  const hasKeys = hasKeysInitialized(userId);
  const sessionEstablished = hasSession(userId, peerId, roomId);
  
  if (!hasKeys) {
    return {
      ready: false,
      hasKeys: false,
      sessionEstablished: false,
      error: 'Keys not initialized'
    };
  }
  
  // Check if peer has keys
  const peerBundle = await fetchPublicKeyBundle(peerId);
  if (!peerBundle) {
    return {
      ready: false,
      hasKeys: true,
      sessionEstablished: false,
      error: 'Peer keys not available'
    };
  }
  
  return {
    ready: true,
    hasKeys: true,
    sessionEstablished,
  };
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
    console.log('[E2EE] Encrypting message for room:', roomId);
    const encrypted = await encryptForSession(userId, peerId, roomId, plaintext);
    if (!encrypted) {
      console.error('[E2EE] Encryption returned null');
      return null;
    }
    
    console.log('[E2EE] Message encrypted successfully, msg#:', encrypted.messageNumber);
    return {
      encrypted_content: encrypted.ciphertext,
      iv: encrypted.iv,
      ephemeral_key: encrypted.senderEphemeralKey,
      message_number: encrypted.messageNumber,
    };
  } catch (error) {
    console.error('[E2EE] Encryption failed:', error);
    return null;
  }
}

/**
 * Decrypt a received message with automatic session repair
 */
export async function decryptChatMessage(
  userId: string,
  peerId: string,
  roomId: string,
  message: E2EEChatMessage
): Promise<{ text: string | null; error?: string; needsRepair?: boolean }> {
  try {
    console.log('[E2EE] Decrypting message, msg#:', message.message_number);
    const plaintext = await decryptFromSession(userId, peerId, roomId, {
      ciphertext: message.encrypted_content,
      iv: message.iv,
      senderEphemeralKey: message.ephemeral_key,
      messageNumber: message.message_number,
    });
    
    if (plaintext === null) {
      console.warn('[E2EE] Decryption returned null - session may need repair');
      return { 
        text: null, 
        error: 'Session mismatch',
        needsRepair: true 
      };
    }
    
    console.log('[E2EE] Message decrypted successfully');
    return { text: plaintext };
  } catch (error) {
    console.error('[E2EE] Decryption failed:', error);
    return { 
      text: null, 
      error: 'Decryption failed',
      needsRepair: true 
    };
  }
}

/**
 * Attempt to repair a session by clearing and re-establishing
 */
export async function repairSession(
  userId: string,
  peerId: string,
  roomId: string
): Promise<boolean> {
  try {
    console.log('[E2EE] Attempting session repair...');
    // Clear existing session
    clearSession(userId, peerId, roomId);
    
    // Try to establish new session
    const session = await establishSession(userId, peerId, roomId);
    if (session) {
      console.log('[E2EE] Session repaired successfully');
      return true;
    }
    console.error('[E2EE] Session repair failed');
    return false;
  } catch (error) {
    console.error('[E2EE] Session repair error:', error);
    return false;
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
    console.log('[E2EE] Session already exists');
    return true;
  }
  
  console.log('[E2EE] Establishing new session...');
  const session = await establishSession(userId, peerId, roomId);
  return session !== null;
}

/**
 * Get safety number for verification
 */
export async function getSafetyNumber(
  userId: string,
  peerId: string
): Promise<{ safetyNumber: string | null; error?: string; canRefresh?: boolean }> {
  try {
    console.log('[E2EE] Generating safety number for users:', userId, peerId);
    
    // Get both users' identity keys from server
    const { data: myBundle, error: myError } = await supabase
      .from('user_key_bundles')
      .select('identity_key')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (myError) {
      console.error('[E2EE] Error fetching my bundle:', myError);
    }
    
    const { data: peerBundle, error: peerError } = await supabase
      .from('user_key_bundles')
      .select('identity_key')
      .eq('user_id', peerId)
      .maybeSingle();
    
    if (peerError) {
      console.error('[E2EE] Error fetching peer bundle:', peerError);
    }
    
    if (!myBundle) {
      console.warn('[E2EE] My key bundle not found on server');
      return { 
        safetyNumber: null, 
        error: 'Your encryption keys are not set up',
        canRefresh: true 
      };
    }
    
    if (!peerBundle) {
      console.warn('[E2EE] Peer key bundle not found on server');
      return { 
        safetyNumber: null, 
        error: 'Contact\'s encryption keys are not available',
        canRefresh: false 
      };
    }
    
    // Combine and format fingerprints
    const myFingerprint = getKeyFingerprint(myBundle.identity_key);
    const peerFingerprint = getKeyFingerprint(peerBundle.identity_key);
    
    // Sort for consistency (same result regardless of who generates it)
    const [first, second] = [myFingerprint, peerFingerprint].sort();
    
    console.log('[E2EE] Safety number generated successfully');
    return { safetyNumber: `${first}\n${second}` };
  } catch (error) {
    console.error('[E2EE] Safety number generation error:', error);
    return { 
      safetyNumber: null, 
      error: 'Failed to generate safety number',
      canRefresh: true 
    };
  }
}

/**
 * Refresh/reinitialize user's encryption keys
 */
export async function refreshKeys(userId: string): Promise<boolean> {
  try {
    console.log('[E2EE] Refreshing keys for user:', userId);
    
    // Clear local keys to force regeneration
    localStorage.removeItem(`e2ee_identity_key_${userId}`);
    localStorage.removeItem(`e2ee_signed_prekey_${userId}`);
    
    // Reinitialize
    return await initializeE2EE(userId);
  } catch (error) {
    console.error('[E2EE] Key refresh failed:', error);
    return false;
  }
}
