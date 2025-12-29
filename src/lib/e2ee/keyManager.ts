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
  generateKeyPair,
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

// Re-export loadIdentityKey for external use
export { loadIdentityKey };

// Initialize or load user's key bundle
export async function initializeKeyBundle(userId: string): Promise<KeyBundle | null> {
  console.log('[KeyManager] Initializing key bundle for user:', userId);
  
  // Check if we already have keys locally
  let identityKey = loadIdentityKey(userId);
  let signedPreKey = loadSignedPreKey(userId);
  
  if (identityKey && signedPreKey) {
    console.log('[KeyManager] Found local keys, verifying server sync...');
    
    // Keys exist locally, verify they're synced with server
    const { data: serverBundle, error } = await supabase
      .from('user_key_bundles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('[KeyManager] Error checking server bundle:', error);
    }
    
    if (serverBundle && serverBundle.identity_key === identityKey.publicKey) {
      console.log('[KeyManager] Keys are synced with server');
      // Keys are synced
      return {
        identityKey,
        signedPreKey: signedPreKey.keyPair,
        signedPreKeySignature: serverBundle.signed_prekey_signature,
        signedPreKeyId: signedPreKey.id,
        oneTimePreKeys: [], // We don't store these locally
      };
    } else if (serverBundle) {
      console.log('[KeyManager] Server has different keys, checking if local needs update...');
      // Server has different keys - this could mean we're on a new device
      // Keep local keys and re-upload to maintain continuity
    } else {
      console.log('[KeyManager] No server bundle, will upload local keys');
    }
  }
  
  // Either no local keys or need to sync
  if (!identityKey || !signedPreKey) {
    console.log('[KeyManager] Generating new key bundle...');
    // Generate new keys
    const keyBundle = generateKeyBundle();
    
    // Save private keys locally
    saveIdentityKey(userId, keyBundle.identityKey);
    saveSignedPreKey(userId, keyBundle.signedPreKey, keyBundle.signedPreKeyId);
    
    identityKey = keyBundle.identityKey;
    signedPreKey = { keyPair: keyBundle.signedPreKey, id: keyBundle.signedPreKeyId };
    
    // Upload to server
    console.log('[KeyManager] Uploading key bundle to server...');
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
      console.error('[KeyManager] Failed to upload key bundle:', bundleError);
      return null;
    }
    
    // Upload one-time pre-keys
    console.log('[KeyManager] Uploading one-time pre-keys...');
    const preKeyInserts = keyBundle.oneTimePreKeys.map(pk => ({
      user_id: userId,
      prekey_id: pk.id,
      prekey: pk.keyPair.publicKey,
    }));
    
    const { error: preKeyError } = await supabase
      .from('user_prekeys')
      .upsert(preKeyInserts);
    
    if (preKeyError) {
      console.error('[KeyManager] Failed to upload pre-keys:', preKeyError);
    }
    
    console.log('[KeyManager] Key bundle initialized successfully');
    return keyBundle;
  }
  
  // Re-upload existing local keys to server
  console.log('[KeyManager] Re-uploading local keys to server...');
  const { error: bundleError } = await supabase
    .from('user_key_bundles')
    .upsert({
      user_id: userId,
      identity_key: identityKey.publicKey,
      signed_prekey: signedPreKey.keyPair.publicKey,
      signed_prekey_signature: encodeBase64(new Uint8Array(64)), // Placeholder signature
      signed_prekey_id: signedPreKey.id,
    });
  
  if (bundleError) {
    console.error('[KeyManager] Failed to re-upload key bundle:', bundleError);
    return null;
  }
  
  return {
    identityKey,
    signedPreKey: signedPreKey.keyPair,
    signedPreKeySignature: '',
    signedPreKeyId: signedPreKey.id,
    oneTimePreKeys: [],
  };
}

// Fetch another user's public key bundle for establishing a session
export async function fetchPublicKeyBundle(targetUserId: string): Promise<PublicKeyBundle | null> {
  console.log('[KeyManager] Fetching public key bundle for:', targetUserId);
  
  // Fetch the key bundle
  const { data: bundle, error } = await supabase
    .from('user_key_bundles')
    .select('*')
    .eq('user_id', targetUserId)
    .maybeSingle();
  
  if (error) {
    console.error('[KeyManager] Failed to fetch key bundle:', error);
    return null;
  }
  
  if (!bundle) {
    console.warn('[KeyManager] No key bundle found for user:', targetUserId);
    return null;
  }
  
  // Try to claim a one-time pre-key
  let oneTimePreKey: { prekey: string; prekey_id: number } | null = null;
  try {
    const { data: preKeyData, error: preKeyError } = await supabase
      .rpc('claim_prekey', { target_user_id: targetUserId });
    
    if (preKeyError) {
      console.warn('[KeyManager] Failed to claim prekey:', preKeyError);
    } else if (preKeyData && preKeyData.length > 0) {
      oneTimePreKey = preKeyData[0];
      console.log('[KeyManager] Claimed one-time prekey:', oneTimePreKey?.prekey_id);
    }
  } catch (e) {
    console.warn('[KeyManager] Prekey claim error:', e);
  }
  
  console.log('[KeyManager] Fetched key bundle successfully');
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
  if (!serialized) {
    console.warn('[KeyManager] No identity key found for user:', userId);
    return null;
  }
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
  console.log('[KeyManager] Checking if prekeys need replenishment...');
  
  const { data: existingKeys, error: countError } = await supabase
    .from('user_prekeys')
    .select('prekey_id')
    .eq('user_id', userId)
    .eq('used', false);
  
  if (countError) {
    console.error('[KeyManager] Error checking prekey count:', countError);
    return false;
  }
  
  const existingCount = existingKeys?.length || 0;
  console.log('[KeyManager] Available prekeys:', existingCount);
  
  if (existingCount >= count / 2) {
    // Still have enough keys
    return true;
  }
  
  console.log('[KeyManager] Replenishing prekeys...');
  
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
    const keyPair = generateKeyPair();
    const serialized = serializeKeyPair(keyPair);
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
    console.error('[KeyManager] Failed to replenish pre-keys:', error);
    return false;
  }
  
  console.log('[KeyManager] Replenished', count, 'prekeys');
  return true;
}

// Get identity key fingerprint for verification
export function getKeyFingerprint(publicKey: string): string {
  const bytes = decodeBase64(publicKey);
  // Create a fingerprint by formatting bytes as hex
  let fingerprint = '';
  for (let i = 0; i < Math.min(16, bytes.length); i++) {
    if (i > 0 && i % 4 === 0) fingerprint += ' ';
    fingerprint += bytes[i].toString(16).padStart(2, '0').toUpperCase();
  }
  return fingerprint;
}
