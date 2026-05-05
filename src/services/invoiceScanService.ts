// src/services/invoiceScanService.ts
// Compresses images and calls /scan-invoice on the backend.

import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';
import { ApiError, post } from './apiClient';
import { ParsedInvoice } from '../types';

const MAX_DIMENSION = 2000;

function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

async function compressImage(uri: string): Promise<string> {
  const { width, height } = await getImageDimensions(uri);

  const actions: ImageManipulator.Action[] = [];
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    // Constrain the largest dimension to MAX_DIMENSION, keep aspect ratio
    if (width >= height) {
      actions.push({ resize: { width: MAX_DIMENSION } });
    } else {
      actions.push({ resize: { height: MAX_DIMENSION } });
    }
  }

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result.uri;
}

async function readAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function scanInvoice(imageUris: string[]): Promise<ParsedInvoice> {
  if (imageUris.length === 0) throw new Error('Au moins une image est requise.');
  if (imageUris.length > 4) throw new Error('Maximum 4 images par scan.');

  const images: { image_base64: string; media_type: string }[] = [];
  for (const uri of imageUris) {
    const compressed = await compressImage(uri);
    const base64 = await readAsBase64(compressed);
    images.push({ image_base64: base64, media_type: 'image/jpeg' });
  }

  try {
    return await post<ParsedInvoice>('/scan-invoice', { images });
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) {
      throw new ApiError(429, 'Limite atteinte (20 scans/jour). Réessaie demain.', e.retryAfter);
    }
    throw e;
  }
}
