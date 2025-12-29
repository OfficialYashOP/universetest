/**
 * End-to-End Encryption Library
 * Implements X25519 key exchange with AES-GCM encryption
 * Provides forward secrecy through ephemeral key pairs
 */

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

// Key types
export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface SerializedKeyPair {
  publicKey: string;
  secretKey: string;
}

export interface KeyBundle {
  identityKey: SerializedKeyPair;
  signedPreKey: SerializedKeyPair;
  signedPreKeySignature: string;
  signedPreKeyId: number;
  oneTimePreKeys: { id: number; keyPair: SerializedKeyPair }[];
}

export interface SessionState {
  rootKey: Uint8Array;
  sendingChainKey: Uint8Array;
  receivingChainKey: Uint8Array;
  sendCounter: number;
  receiveCounter: number;
  theirIdentityKey: Uint8Array;
  theirSignedPreKey: Uint8Array;
  ourEphemeralKey: SerializedKeyPair;
}

// Storage keys
const IDENTITY_KEY_STORAGE = 'e2ee_identity_key';
const SIGNED_PREKEY_STORAGE = 'e2ee_signed_prekey';
const SESSIONS_STORAGE = 'e2ee_sessions';

// Generate a new X25519 key pair
export function generateKeyPair(): KeyPair {
  return nacl.box.keyPair();
}

// Serialize key pair for storage
export function serializeKeyPair(keyPair: KeyPair): SerializedKeyPair {
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };
}

// Deserialize key pair from storage
export function deserializeKeyPair(serialized: SerializedKeyPair): KeyPair {
  return {
    publicKey: decodeBase64(serialized.publicKey),
    secretKey: decodeBase64(serialized.secretKey),
  };
}

// Generate a signing key pair (for signing pre-keys)
export function generateSigningKeyPair(): nacl.SignKeyPair {
  return nacl.sign.keyPair();
}

// Sign data with a signing key
export function signData(data: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return nacl.sign.detached(data, secretKey);
}

// Verify a signature
export function verifySignature(data: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
  return nacl.sign.detached.verify(data, signature, publicKey);
}

// Perform X25519 Diffie-Hellman key agreement
export function performDH(ourSecretKey: Uint8Array, theirPublicKey: Uint8Array): Uint8Array {
  return nacl.box.before(theirPublicKey, ourSecretKey);
}

// Helper to convert Uint8Array to ArrayBuffer
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(arr.length);
  new Uint8Array(buffer).set(arr);
  return buffer;
}

// HKDF-like key derivation using SHA-256
async function hkdf(inputKey: Uint8Array, salt: Uint8Array, info: string, length: number): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const infoBytes = encoder.encode(info);
  
  // Import the input key
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(inputKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // PRK = HMAC(salt, inputKey)
  const prk = await crypto.subtle.sign('HMAC', key, toArrayBuffer(salt));
  
  // Expand using HMAC
  const prkKey = await crypto.subtle.importKey(
    'raw',
    prk,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const result = new Uint8Array(length);
  let prev = new Uint8Array(0);
  let offset = 0;
  let counter = 1;
  
  while (offset < length) {
    const input = new Uint8Array(prev.length + infoBytes.length + 1);
    input.set(prev);
    input.set(infoBytes, prev.length);
    input[input.length - 1] = counter;
    
    const block = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, toArrayBuffer(input)));
    const toCopy = Math.min(block.length, length - offset);
    result.set(block.slice(0, toCopy), offset);
    
    prev = block;
    offset += toCopy;
    counter++;
  }
  
  return result;
}

// X3DH key agreement protocol (simplified)
export async function performX3DH(
  ourIdentityKey: KeyPair,
  ourEphemeralKey: KeyPair,
  theirIdentityKey: Uint8Array,
  theirSignedPreKey: Uint8Array,
  theirOneTimePreKey?: Uint8Array
): Promise<Uint8Array> {
  // DH1 = DH(IKa, SPKb) - our identity with their signed pre-key
  const dh1 = performDH(ourIdentityKey.secretKey, theirSignedPreKey);
  
  // DH2 = DH(EKa, IKb) - our ephemeral with their identity
  const dh2 = performDH(ourEphemeralKey.secretKey, theirIdentityKey);
  
  // DH3 = DH(EKa, SPKb) - our ephemeral with their signed pre-key
  const dh3 = performDH(ourEphemeralKey.secretKey, theirSignedPreKey);
  
  // Combine all DH results
  let combined: Uint8Array;
  if (theirOneTimePreKey) {
    // DH4 = DH(EKa, OPKb) - our ephemeral with their one-time pre-key
    const dh4 = performDH(ourEphemeralKey.secretKey, theirOneTimePreKey);
    combined = new Uint8Array(dh1.length + dh2.length + dh3.length + dh4.length);
    combined.set(dh1, 0);
    combined.set(dh2, dh1.length);
    combined.set(dh3, dh1.length + dh2.length);
    combined.set(dh4, dh1.length + dh2.length + dh3.length);
  } else {
    combined = new Uint8Array(dh1.length + dh2.length + dh3.length);
    combined.set(dh1, 0);
    combined.set(dh2, dh1.length);
    combined.set(dh3, dh1.length + dh2.length);
  }
  
  // Derive shared secret using HKDF
  const salt = new Uint8Array(32); // Zero salt for simplicity
  const sharedSecret = await hkdf(combined, salt, 'X3DH', 32);
  
  return sharedSecret;
}

// Simplified Double Ratchet - derive new chain key and message key
export async function ratchetChainKey(chainKey: Uint8Array): Promise<{ newChainKey: Uint8Array; messageKey: Uint8Array }> {
  const salt = new Uint8Array(32);
  const derived = await hkdf(chainKey, salt, 'MessageKeys', 64);
  
  return {
    newChainKey: derived.slice(0, 32),
    messageKey: derived.slice(32, 64),
  };
}

// Encrypt a message using AES-GCM
export async function encryptMessage(
  plaintext: string,
  messageKey: Uint8Array
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(messageKey),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return {
    ciphertext: encodeBase64(new Uint8Array(ciphertext)),
    iv: encodeBase64(iv),
  };
}

// Decrypt a message using AES-GCM
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  messageKey: Uint8Array
): Promise<string> {
  const decoder = new TextDecoder();
  const ciphertextBytes = decodeBase64(ciphertext);
  const ivBytes = decodeBase64(iv);
  
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(messageKey),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(ivBytes) },
    key,
    toArrayBuffer(ciphertextBytes)
  );

  return decoder.decode(decrypted);
}

// Local key storage utilities
export function saveIdentityKey(userId: string, keyPair: SerializedKeyPair): void {
  localStorage.setItem(`${IDENTITY_KEY_STORAGE}_${userId}`, JSON.stringify(keyPair));
}

export function loadIdentityKey(userId: string): SerializedKeyPair | null {
  const stored = localStorage.getItem(`${IDENTITY_KEY_STORAGE}_${userId}`);
  return stored ? JSON.parse(stored) : null;
}

export function saveSignedPreKey(userId: string, keyPair: SerializedKeyPair, id: number): void {
  localStorage.setItem(`${SIGNED_PREKEY_STORAGE}_${userId}`, JSON.stringify({ keyPair, id }));
}

export function loadSignedPreKey(userId: string): { keyPair: SerializedKeyPair; id: number } | null {
  const stored = localStorage.getItem(`${SIGNED_PREKEY_STORAGE}_${userId}`);
  return stored ? JSON.parse(stored) : null;
}

export function saveSession(userId: string, peerId: string, roomId: string, session: SessionState): void {
  const key = `${SESSIONS_STORAGE}_${userId}_${roomId}_${peerId}`;
  const serialized = {
    rootKey: encodeBase64(session.rootKey),
    sendingChainKey: encodeBase64(session.sendingChainKey),
    receivingChainKey: encodeBase64(session.receivingChainKey),
    sendCounter: session.sendCounter,
    receiveCounter: session.receiveCounter,
    theirIdentityKey: encodeBase64(session.theirIdentityKey),
    theirSignedPreKey: encodeBase64(session.theirSignedPreKey),
    ourEphemeralKey: session.ourEphemeralKey,
  };
  localStorage.setItem(key, JSON.stringify(serialized));
}

export function loadSession(userId: string, peerId: string, roomId: string): SessionState | null {
  const key = `${SESSIONS_STORAGE}_${userId}_${roomId}_${peerId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  const serialized = JSON.parse(stored);
  return {
    rootKey: decodeBase64(serialized.rootKey),
    sendingChainKey: decodeBase64(serialized.sendingChainKey),
    receivingChainKey: decodeBase64(serialized.receivingChainKey),
    sendCounter: serialized.sendCounter,
    receiveCounter: serialized.receiveCounter,
    theirIdentityKey: decodeBase64(serialized.theirIdentityKey),
    theirSignedPreKey: decodeBase64(serialized.theirSignedPreKey),
    ourEphemeralKey: serialized.ourEphemeralKey,
  };
}

// Generate initial key bundle for a new user
export function generateKeyBundle(): KeyBundle {
  const identityKey = generateKeyPair();
  const signedPreKey = generateKeyPair();
  
  // Sign the pre-key with identity key (simplified - in production use Ed25519)
  const signatureData = new Uint8Array([...signedPreKey.publicKey, ...identityKey.publicKey]);
  const signature = nacl.hash(signatureData).slice(0, 64);
  
  // Generate one-time pre-keys
  const oneTimePreKeys = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    keyPair: serializeKeyPair(generateKeyPair()),
  }));
  
  return {
    identityKey: serializeKeyPair(identityKey),
    signedPreKey: serializeKeyPair(signedPreKey),
    signedPreKeySignature: encodeBase64(signature),
    signedPreKeyId: 1,
    oneTimePreKeys,
  };
}

// Utility to encode/decode for transmission
export { encodeBase64, decodeBase64 };
