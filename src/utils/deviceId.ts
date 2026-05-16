// src/utils/deviceId.ts
// Persistent device identifier stored in SecureStore.
// Used as X-Device-Id header for per-device rate limiting on the backend.

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'homelog_device_id';
let _cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (_cached) return _cached;

  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }

  _cached = id;
  return id;
}
