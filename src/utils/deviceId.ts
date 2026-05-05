// src/utils/deviceId.ts
// Persistent device identifier stored in SecureStore.
// Used as X-Device-Id header for per-device rate limiting on the backend.

import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'homelog_device_id';
let _cached: string | null = null;

function generateUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceId(): Promise<string> {
  if (_cached) return _cached;

  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUIDv4();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }

  _cached = id;
  return id;
}
