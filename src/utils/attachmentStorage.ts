// src/utils/attachmentStorage.ts
// Copies picker URIs into a stable directory under documentDirectory.
// Cache URIs and the ImagePicker session paths can be purged by the OS;
// persisting prevents broken attachments after a reboot or app reinstall.
//
// Pour les images, on cap aussi la résolution à 1600px et on recompresse en
// JPEG 0.8 — une photo iPhone brute fait 4-8 MB, ce qui sature la mémoire à
// l'affichage et gonfle inutilement le backup. Les PDF et autres docs sont
// copiés tels quels.

import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { uuidv4 } from '../db/client';
import { logger } from './logger';

const ATTACHMENTS_DIR = FileSystem.documentDirectory
  ? FileSystem.documentDirectory + 'attachments/'
  : null;

const IMAGE_MAX_DIMENSION = 1600;
const IMAGE_COMPRESS_QUALITY = 0.8;
const IMAGE_EXT_RE = /\.(jpe?g|png|heic|heif|webp)$/i;

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

function isImageUri(sourceUri: string, fileName?: string): boolean {
  return (
    IMAGE_EXT_RE.test(fileName ?? '') ||
    IMAGE_EXT_RE.test(sourceUri.split('?')[0])
  );
}

async function compressImageIfPossible(
  sourceUri: string,
): Promise<{ uri: string; ext: string }> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      sourceUri,
      [{ resize: { width: IMAGE_MAX_DIMENSION } }],
      {
        compress: IMAGE_COMPRESS_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );
    return { uri: result.uri, ext: '.jpg' };
  } catch (e) {
    logger.warn('attachmentStorage', 'image compression failed, copying as-is', e);
    return { uri: sourceUri, ext: '' };
  }
}

export async function persistAttachment(
  sourceUri: string,
  fileName?: string,
): Promise<string> {
  if (sourceUri.startsWith(ATTACHMENTS_DIR ?? '')) {
    return sourceUri;
  }
  const dir = await ensureDir();

  let copyFrom = sourceUri;
  let ext = extractExtension(sourceUri, fileName);

  if (isImageUri(sourceUri, fileName)) {
    const compressed = await compressImageIfPossible(sourceUri);
    copyFrom = compressed.uri;
    if (compressed.ext) ext = compressed.ext;
  }

  const destUri = `${dir}${uuidv4()}${ext}`;
  // Si manipulateAsync a déjà écrit dans le cache, on move plutôt que copy
  // (évite un fichier orphelin dans le cache).
  if (copyFrom !== sourceUri) {
    await FileSystem.moveAsync({ from: copyFrom, to: destUri });
  } else {
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  }
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
