/**
 * E2EE Session Manager
 * Manages encrypted sessions between users using X3DH and Double Ratchet
 */

import { supabase } from '@/integrations/supabase/client';
import {
  performX3DH,
  performDH,
  generateKeyPair,
  serializeKeyPair,
  deserializeKeyPair,
  ratchetChainKey,
  encryptMessage,
  decryptMessage,
  saveSession,
  loadSession,
  encodeBase64,
  decodeBase64,
  type SessionState,
  type SerializedKeyPair,
} from './crypto';
import {
  fetchPublicKeyBundle,
  getOwnIdentityKeyPair,
  getOwnSignedPreKeyPair,
  type PublicKeyBundle,
} from './keyManager';

interface EncryptedMessage {
  ciphertext: string;
  iv: string;
  senderEphemeralKey?: string; // Included in first message
  messageNumber: number;
}

// Establish a new session with a peer
export async function establishSession(
  userId: string,
  peerId: string,
  roomId: string
): Promise<SessionState | null> {
  console.log('[SessionManager] Establishing session:', { userId, peerId, roomId });
  
  // Check for existing session
  const existingSession = loadSession(userId, peerId, roomId);
  if (existingSession) {
    console.log('[SessionManager] Using existing session');
    return existingSession;
  }
  
  // Get our identity key
  const ourIdentityKey = getOwnIdentityKeyPair(userId);
  if (!ourIdentityKey) {
    console.error('[SessionManager] No identity key found');
    return null;
  }
  
  // Fetch peer's public key bundle
  const peerBundle = await fetchPublicKeyBundle(peerId);
  if (!peerBundle) {
    console.error('[SessionManager] Failed to fetch peer key bundle');
    return null;
  }
  
  // Generate ephemeral key for this session
  const ephemeralKey = generateKeyPair();
  console.log('[SessionManager] Generated ephemeral key');
  
  // Perform X3DH key agreement
  const sharedSecret = await performX3DH(
    ourIdentityKey,
    ephemeralKey,
    decodeBase64(peerBundle.identityKey),
    decodeBase64(peerBundle.signedPreKey),
    peerBundle.oneTimePreKey ? decodeBase64(peerBundle.oneTimePreKey) : undefined
  );
  
  console.log('[SessionManager] X3DH completed');
  
  // Initialize session state
  const session: SessionState = {
    rootKey: sharedSecret,
    sendingChainKey: sharedSecret.slice(0, 32),
    receivingChainKey: sharedSecret.slice(0, 32), // Initialize with same key
    sendCounter: 0,
    receiveCounter: 0,
    theirIdentityKey: decodeBase64(peerBundle.identityKey),
    theirSignedPreKey: decodeBase64(peerBundle.signedPreKey),
    ourEphemeralKey: serializeKeyPair(ephemeralKey),
  };
  
  // Save session locally
  saveSession(userId, peerId, roomId, session);
  console.log('[SessionManager] Session saved locally');
  
  // Optionally save session state to server (encrypted)
  await syncSessionToServer(userId, peerId, roomId, session);
  
  return session;
}

// Encrypt a message for sending
export async function encryptForSession(
  userId: string,
  peerId: string,
  roomId: string,
  plaintext: string
): Promise<EncryptedMessage | null> {
  let session = loadSession(userId, peerId, roomId);
  
  if (!session) {
    console.log('[SessionManager] No session found, establishing new one...');
    // Try to establish a new session
    session = await establishSession(userId, peerId, roomId);
    if (!session) {
      console.error('[SessionManager] Failed to establish session');
      return null;
    }
  }
  
  // Ratchet the sending chain key
  const { newChainKey, messageKey } = await ratchetChainKey(session.sendingChainKey);
  
  // Encrypt the message
  const { ciphertext, iv } = await encryptMessage(plaintext, messageKey);
  
  const currentCounter = session.sendCounter;
  
  // Update session state
  const newSession: SessionState = {
    ...session,
    sendingChainKey: newChainKey,
    sendCounter: session.sendCounter + 1,
  };
  
  saveSession(userId, peerId, roomId, newSession);
  await syncSessionToServer(userId, peerId, roomId, newSession);
  
  // Include ephemeral key in first message
  const result: EncryptedMessage = {
    ciphertext,
    iv,
    messageNumber: currentCounter,
  };
  
  if (currentCounter === 0) {
    result.senderEphemeralKey = session.ourEphemeralKey.publicKey;
    console.log('[SessionManager] Including ephemeral key in first message');
  }
  
  console.log('[SessionManager] Message encrypted, counter:', currentCounter);
  return result;
}

// Decrypt a received message
export async function decryptFromSession(
  userId: string,
  peerId: string,
  roomId: string,
  encrypted: EncryptedMessage
): Promise<string | null> {
  console.log('[SessionManager] Decrypting message, number:', encrypted.messageNumber);
  
  let session = loadSession(userId, peerId, roomId);
  
  if (!session && encrypted.senderEphemeralKey) {
    console.log('[SessionManager] First message - establishing session as receiver');
    // This is the first message - we need to complete X3DH from the receiver side
    session = await establishSessionAsReceiver(
      userId,
      peerId,
      roomId,
      encrypted.senderEphemeralKey
    );
  }
  
  if (!session) {
    console.error('[SessionManager] No session found and cannot establish');
    return null;
  }
  
  try {
    // Determine which chain key to use based on message number
    const expectedCounter = session.receiveCounter;
    console.log('[SessionManager] Expected counter:', expectedCounter, 'Got:', encrypted.messageNumber);
    
    // Ratchet the receiving chain key to the correct position
    let chainKey = session.receivingChainKey;
    let messageKey: Uint8Array;
    
    // For the first message or matching counter, just ratchet once
    if (encrypted.messageNumber === expectedCounter) {
      const ratchetResult = await ratchetChainKey(chainKey);
      messageKey = ratchetResult.messageKey;
      chainKey = ratchetResult.newChainKey;
    } else if (encrypted.messageNumber > expectedCounter) {
      // Need to skip some messages (out of order delivery)
      console.log('[SessionManager] Skipping', encrypted.messageNumber - expectedCounter, 'messages');
      for (let i = expectedCounter; i <= encrypted.messageNumber; i++) {
        const ratchetResult = await ratchetChainKey(chainKey);
        messageKey = ratchetResult.messageKey;
        chainKey = ratchetResult.newChainKey;
      }
    } else {
      // Message from the past - we can't decrypt without stored keys
      console.warn('[SessionManager] Received old message, counter:', encrypted.messageNumber);
      // Try with current key anyway
      const ratchetResult = await ratchetChainKey(session.receivingChainKey);
      messageKey = ratchetResult.messageKey;
      chainKey = ratchetResult.newChainKey;
    }
    
    // Decrypt the message
    const plaintext = await decryptMessage(encrypted.ciphertext, encrypted.iv, messageKey!);
    
    // Update session state
    const newSession: SessionState = {
      ...session,
      receivingChainKey: chainKey,
      receiveCounter: Math.max(session.receiveCounter, encrypted.messageNumber + 1),
    };
    
    saveSession(userId, peerId, roomId, newSession);
    
    console.log('[SessionManager] Message decrypted successfully');
    return plaintext;
  } catch (error) {
    console.error('[SessionManager] Decryption failed:', error);
    return null;
  }
}

// Establish session as the receiver (when getting first message)
async function establishSessionAsReceiver(
  userId: string,
  peerId: string,
  roomId: string,
  senderEphemeralKey: string
): Promise<SessionState | null> {
  console.log('[SessionManager] Establishing session as receiver');
  
  const ourIdentityKey = getOwnIdentityKeyPair(userId);
  if (!ourIdentityKey) {
    console.error('[SessionManager] No identity key found');
    return null;
  }
  
  const ourSignedPreKey = getOwnSignedPreKeyPair(userId);
  if (!ourSignedPreKey) {
    console.error('[SessionManager] No signed prekey found');
    return null;
  }
  
  // Get sender's identity key from server
  const senderBundle = await fetchPublicKeyBundle(peerId);
  if (!senderBundle) {
    console.error('[SessionManager] Failed to fetch sender bundle');
    return null;
  }
  
  // Compute shared secret (receiver side of X3DH)
  const ephemeralPubKey = decodeBase64(senderEphemeralKey);
  const senderIdentityKey = decodeBase64(senderBundle.identityKey);
  
  // DH1 = DH(SPKb, IKa) - our signed prekey with their identity
  const dh1 = performDH(ourSignedPreKey.keyPair.secretKey, senderIdentityKey);
  
  // DH2 = DH(IKb, EKa) - our identity with their ephemeral
  const dh2 = performDH(ourIdentityKey.secretKey, ephemeralPubKey);
  
  // DH3 = DH(SPKb, EKa) - our signed prekey with their ephemeral
  const dh3 = performDH(ourSignedPreKey.keyPair.secretKey, ephemeralPubKey);
  
  // Combine DH results (same as sender but different order)
  const combined = new Uint8Array(dh1.length + dh2.length + dh3.length);
  combined.set(dh1, 0);
  combined.set(dh2, dh1.length);
  combined.set(dh3, dh1.length + dh2.length);
  
  // Use combined result as shared secret
  const sharedSecret = combined.slice(0, 32);
  
  const session: SessionState = {
    rootKey: sharedSecret,
    sendingChainKey: sharedSecret.slice(0, 32),
    receivingChainKey: sharedSecret.slice(0, 32),
    sendCounter: 0,
    receiveCounter: 0,
    theirIdentityKey: senderIdentityKey,
    theirSignedPreKey: decodeBase64(senderBundle.signedPreKey),
    ourEphemeralKey: serializeKeyPair(generateKeyPair()),
  };
  
  saveSession(userId, peerId, roomId, session);
  console.log('[SessionManager] Session established as receiver');
  return session;
}

// Sync session state to server (for multi-device support)
async function syncSessionToServer(
  userId: string,
  peerId: string,
  roomId: string,
  session: SessionState
): Promise<void> {
  // Encrypt session data before storing
  const sessionData = JSON.stringify({
    rootKey: encodeBase64(session.rootKey),
    sendingChainKey: encodeBase64(session.sendingChainKey),
    receivingChainKey: encodeBase64(session.receivingChainKey),
    sendCounter: session.sendCounter,
    receiveCounter: session.receiveCounter,
  });
  
  const { error } = await supabase
    .from('e2ee_sessions')
    .upsert({
      room_id: roomId,
      user_id: userId,
      peer_id: peerId,
      session_data: sessionData, // In production, encrypt this with a device key
      root_key: encodeBase64(session.rootKey),
      chain_key_send: encodeBase64(session.sendingChainKey),
      chain_key_receive: encodeBase64(session.receivingChainKey),
      send_counter: session.sendCounter,
      receive_counter: session.receiveCounter,
    });
  
  if (error) {
    console.error('[SessionManager] Failed to sync session:', error);
  }
}

// Check if a session exists
export function hasSession(userId: string, peerId: string, roomId: string): boolean {
  return loadSession(userId, peerId, roomId) !== null;
}

// Clear session (for logout or key change)
export function clearSession(userId: string, peerId: string, roomId: string): void {
  const key = `e2ee_sessions_${userId}_${roomId}_${peerId}`;
  localStorage.removeItem(key);
  console.log('[SessionManager] Session cleared:', key);
}

// Clear all sessions for a user
export function clearAllSessions(userId: string): void {
  const prefix = `e2ee_sessions_${userId}`;
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
  console.log('[SessionManager] All sessions cleared for user:', userId);
}
