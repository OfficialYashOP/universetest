/**
 * E2EE Key Manager
 * Handles key generation, storage, and synchronization with the server
 */

import { supabase } from '@/integrations/supabase/client';
import {
  generateKeyBundle,
  loadIdentityKey,
  saveIdentityKey,
  loadSignedPreKey,
  saveSignedPreKey,
  serializeKeyPair,
  deserializeKeyPair,
  encodeBase64,
  decodeBase64,
  type KeyBundle,
  type SerializedKeyPair,
} from './crypto';

export interface PublicKeyBundle {
  identityKey: string;
  signedPreKey: string;
  signedPreKeySignature: string;
  signedPreKeyId: number;
  oneTimePreKey?: string;
  oneTimePreKeyId?: number;
}

// Initialize or load user's key bundle
export async function initializeKeyBundle(userId: string): Promise<KeyBundle | null> {
  // Check if we already have keys locally
  let identityKey = loadIdentityKey(userId);
  let signedPreKey = loadSignedPreKey(userId);
  
  if (identityKey && signedPreKey) {
    // Keys exist locally, verify they're synced with server
    const { data: serverBundle } = await supabase
      .from('user_key_bundles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (serverBundle && serverBundle.identity_key === identityKey.publicKey) {
      // Keys are synced
      return {
        identityKey,
        signedPreKey: signedPreKey.keyPair,
        signedPreKeySignature: serverBundle.signed_prekey_signature,
        signedPreKeyId: signedPreKey.id,
        oneTimePreKeys: [], // We don't store these locally
      };
    }
  }
  
  // Generate new keys
  const keyBundle = generateKeyBundle();
  
  // Save private keys locally
  saveIdentityKey(userId, keyBundle.identityKey);
  saveSignedPreKey(userId, keyBundle.signedPreKey, keyBundle.signedPreKeyId);
  
  // Upload public keys to server
  const { error: bundleError } = await supabase
    .from('user_key_bundles')
    .upsert({
      user_id: userId,
      identity_key: keyBundle.identityKey.publicKey,
      signed_prekey: keyBundle.signedPreKey.publicKey,
      signed_prekey_signature: keyBundle.signedPreKeySignature,
      signed_prekey_id: keyBundle.signedPreKeyId,
    });
  
  if (bundleError) {
    console.error('Failed to upload key bundle:', bundleError);
    return null;
  }
  
  // Upload one-time pre-keys
  const preKeyInserts = keyBundle.oneTimePreKeys.map(pk => ({
    user_id: userId,
    prekey_id: pk.id,
    prekey: pk.keyPair.publicKey,
  }));
  
  const { error: preKeyError } = await supabase
    .from('user_prekeys')
    .upsert(preKeyInserts);
  
  if (preKeyError) {
    console.error('Failed to upload pre-keys:', preKeyError);
  }
  
  return keyBundle;
}

// Fetch another user's public key bundle for establishing a session
export async function fetchPublicKeyBundle(targetUserId: string): Promise<PublicKeyBundle | null> {
  // Fetch the key bundle
  const { data: bundle, error } = await supabase
    .from('user_key_bundles')
    .select('*')
    .eq('user_id', targetUserId)
    .maybeSingle();
  
  if (error || !bundle) {
    console.error('Failed to fetch key bundle:', error);
    return null;
  }
  
  // Try to claim a one-time pre-key
  const { data: preKeyData } = await supabase
    .rpc('claim_prekey', { target_user_id: targetUserId });
  
  const oneTimePreKey = preKeyData?.[0];
  
  return {
    identityKey: bundle.identity_key,
    signedPreKey: bundle.signed_prekey,
    signedPreKeySignature: bundle.signed_prekey_signature,
    signedPreKeyId: bundle.signed_prekey_id,
    oneTimePreKey: oneTimePreKey?.prekey,
    oneTimePreKeyId: oneTimePreKey?.prekey_id,
  };
}

// Get user's own identity key pair
export function getOwnIdentityKeyPair(userId: string): { publicKey: Uint8Array; secretKey: Uint8Array } | null {
  const serialized = loadIdentityKey(userId);
  if (!serialized) return null;
  return deserializeKeyPair(serialized);
}

// Get user's own signed pre-key pair
export function getOwnSignedPreKeyPair(userId: string): { keyPair: { publicKey: Uint8Array; secretKey: Uint8Array }; id: number } | null {
  const stored = loadSignedPreKey(userId);
  if (!stored) return null;
  return {
    keyPair: deserializeKeyPair(stored.keyPair),
    id: stored.id,
  };
}

// Check if user has keys initialized
export function hasKeysInitialized(userId: string): boolean {
  return loadIdentityKey(userId) !== null;
}

// Regenerate and upload new pre-keys when running low
export async function replenishPreKeys(userId: string, count: number = 10): Promise<boolean> {
  const { data: existingKeys } = await supabase
    .from('user_prekeys')
    .select('prekey_id')
    .eq('user_id', userId)
    .eq('used', false);
  
  const existingCount = existingKeys?.length || 0;
  
  if (existingCount >= count / 2) {
    // Still have enough keys
    return true;
  }
  
  // Find the max prekey_id to continue from
  const { data: maxIdData } = await supabase
    .from('user_prekeys')
    .select('prekey_id')
    .eq('user_id', userId)
    .order('prekey_id', { ascending: false })
    .limit(1);
  
  const startId = (maxIdData?.[0]?.prekey_id || 0) + 1;
  
  // Generate new pre-keys
  const newPreKeys = Array.from({ length: count }, (_, i) => {
    const keyPair = require('./crypto').generateKeyPair();
    const serialized = require('./crypto').serializeKeyPair(keyPair);
    return {
      user_id: userId,
      prekey_id: startId + i,
      prekey: serialized.publicKey,
    };
  });
  
  const { error } = await supabase
    .from('user_prekeys')
    .insert(newPreKeys);
  
  if (error) {
    console.error('Failed to replenish pre-keys:', error);
    return false;
  }
  
  return true;
}

// Get identity key fingerprint for verification
export function getKeyFingerprint(publicKey: string): string {
  const bytes = decodeBase64(publicKey);
  // Create a simple fingerprint by hashing and formatting
  let fingerprint = '';
  for (let i = 0; i < Math.min(8, bytes.length); i++) {
    if (i > 0 && i % 2 === 0) fingerprint += ' ';
    fingerprint += bytes[i].toString(16).padStart(2, '0').toUpperCase();
  }
  return fingerprint;
}
