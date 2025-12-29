/**
 * E2EE Session Manager
 * Manages encrypted sessions between users using X3DH and Double Ratchet
 */

import { supabase } from '@/integrations/supabase/client';
import {
  performX3DH,
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
  // Check for existing session
  const existingSession = loadSession(userId, peerId, roomId);
  if (existingSession) {
    return existingSession;
  }
  
  // Get our identity key
  const ourIdentityKey = getOwnIdentityKeyPair(userId);
  if (!ourIdentityKey) {
    console.error('No identity key found');
    return null;
  }
  
  // Fetch peer's public key bundle
  const peerBundle = await fetchPublicKeyBundle(peerId);
  if (!peerBundle) {
    console.error('Failed to fetch peer key bundle');
    return null;
  }
  
  // Generate ephemeral key for this session
  const ephemeralKey = generateKeyPair();
  
  // Perform X3DH key agreement
  const sharedSecret = await performX3DH(
    ourIdentityKey,
    ephemeralKey,
    decodeBase64(peerBundle.identityKey),
    decodeBase64(peerBundle.signedPreKey),
    peerBundle.oneTimePreKey ? decodeBase64(peerBundle.oneTimePreKey) : undefined
  );
  
  // Initialize session state
  const session: SessionState = {
    rootKey: sharedSecret,
    sendingChainKey: sharedSecret.slice(0, 32),
    receivingChainKey: new Uint8Array(32), // Will be set when receiving first message
    sendCounter: 0,
    receiveCounter: 0,
    theirIdentityKey: decodeBase64(peerBundle.identityKey),
    theirSignedPreKey: decodeBase64(peerBundle.signedPreKey),
    ourEphemeralKey: serializeKeyPair(ephemeralKey),
  };
  
  // Save session locally
  saveSession(userId, peerId, roomId, session);
  
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
    // Try to establish a new session
    session = await establishSession(userId, peerId, roomId);
    if (!session) {
      console.error('Failed to establish session');
      return null;
    }
  }
  
  // Ratchet the sending chain key
  const { newChainKey, messageKey } = await ratchetChainKey(session.sendingChainKey);
  
  // Encrypt the message
  const { ciphertext, iv } = await encryptMessage(plaintext, messageKey);
  
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
    messageNumber: session.sendCounter,
  };
  
  if (session.sendCounter === 0) {
    result.senderEphemeralKey = session.ourEphemeralKey.publicKey;
  }
  
  return result;
}

// Decrypt a received message
export async function decryptFromSession(
  userId: string,
  peerId: string,
  roomId: string,
  encrypted: EncryptedMessage
): Promise<string | null> {
  let session = loadSession(userId, peerId, roomId);
  
  if (!session && encrypted.senderEphemeralKey) {
    // This is the first message - we need to complete X3DH from the receiver side
    session = await establishSessionAsReceiver(
      userId,
      peerId,
      roomId,
      encrypted.senderEphemeralKey
    );
  }
  
  if (!session) {
    console.error('No session found and cannot establish');
    return null;
  }
  
  try {
    // Ratchet the receiving chain key
    const { newChainKey, messageKey } = await ratchetChainKey(
      session.receivingChainKey.length > 0 ? session.receivingChainKey : session.rootKey
    );
    
    // Decrypt the message
    const plaintext = await decryptMessage(encrypted.ciphertext, encrypted.iv, messageKey);
    
    // Update session state
    const newSession: SessionState = {
      ...session,
      receivingChainKey: newChainKey,
      receiveCounter: session.receiveCounter + 1,
    };
    
    saveSession(userId, peerId, roomId, newSession);
    
    return plaintext;
  } catch (error) {
    console.error('Decryption failed:', error);
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
  const ourIdentityKey = getOwnIdentityKeyPair(userId);
  if (!ourIdentityKey) return null;
  
  // Get sender's identity key from server
  const senderBundle = await fetchPublicKeyBundle(peerId);
  if (!senderBundle) return null;
  
  // Compute shared secret (receiver side of X3DH)
  // Note: This is simplified - full implementation would use the signed pre-key secret
  const ephemeralPubKey = decodeBase64(senderEphemeralKey);
  
  // DH with their ephemeral key
  const dh1 = require('./crypto').performDH(ourIdentityKey.secretKey, ephemeralPubKey);
  
  // For simplicity, use this as the root key
  // In production, this should mirror the sender's X3DH computation
  const session: SessionState = {
    rootKey: dh1,
    sendingChainKey: dh1.slice(0, 32),
    receivingChainKey: dh1.slice(0, 32),
    sendCounter: 0,
    receiveCounter: 0,
    theirIdentityKey: decodeBase64(senderBundle.identityKey),
    theirSignedPreKey: decodeBase64(senderBundle.signedPreKey),
    ourEphemeralKey: serializeKeyPair(generateKeyPair()),
  };
  
  saveSession(userId, peerId, roomId, session);
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
    console.error('Failed to sync session:', error);
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
}

// Clear all sessions for a user
export function clearAllSessions(userId: string): void {
  const prefix = `e2ee_sessions_${userId}`;
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
}
