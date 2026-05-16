// src/utils/attachmentStorage.ts
// Copies picker URIs into a stable directory under documentDirectory.
// Cache URIs and the ImagePicker session paths can be purged by the OS;
// persisting prevents broken attachments after a reboot or app reinstall.

import * as FileSystem from 'expo-file-system/legacy';
import { uuidv4 } from '../db/client';

const ATTACHMENTS_DIR = FileSystem.documentDirectory
  ? FileSystem.documentDirectory + 'attachments/'
  : null;

async function ensureDir(): Promise<string> {
  if (!ATTACHMENTS_DIR) {
    throw new Error('documentDirectory is unavailable on this platform.');
  }
  const info = await FileSystem.getInfoAsync(ATTACHMENTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, {
      intermediates: true,
    });
  }
  return ATTACHMENTS_DIR;
}

function extractExtension(sourceUri: string, fileName?: string): string {
  if (fileName) {
    const dot = fileName.lastIndexOf('.');
    if (dot > -1) return fileName.slice(dot);
  }
  const noQuery = sourceUri.split('?')[0];
  const dot = noQuery.lastIndexOf('.');
  if (dot > -1 && dot > noQuery.lastIndexOf('/')) {
    return noQuery.slice(dot);
  }
  return '';
}

export async function persistAttachment(
  sourceUri: string,
  fileName?: string,
): Promise<string> {
  if (sourceUri.startsWith(ATTACHMENTS_DIR ?? '')) {
    return sourceUri;
  }
  const dir = await ensureDir();
  const destUri = `${dir}${uuidv4()}${extractExtension(sourceUri, fileName)}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

export async function removePersistedAttachment(uri: string): Promise<void> {
  if (!ATTACHMENTS_DIR || !uri.startsWith(ATTACHMENTS_DIR)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore — file may already be gone
  }
}
