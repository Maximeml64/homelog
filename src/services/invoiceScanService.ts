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

export type ScanInput = { uri: string; kind: 'image' | 'pdf' };

// Un PDF n'est pas compressé : on le borne pour rester sous la limite de
// 32 Mo par requête de l'API Claude (le base64 gonfle d'environ 33 %).
const MAX_PDF_BYTES = 15 * 1024 * 1024;

// Erreur de validation côté client (≠ erreur réseau ApiError) : son message
// est affichable tel quel à l'utilisateur.
export class ScanInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScanInputError';
  }
}

export async function scanInvoice(inputs: ScanInput[]): Promise<ParsedInvoice> {
  if (inputs.length === 0) throw new Error('Au moins un document est requis.');
  if (inputs.length > 4) throw new Error('Maximum 4 documents par scan.');

  const images: { image_base64: string; media_type: string }[] = [];
  for (const input of inputs) {
    if (input.kind === 'pdf') {
      // Pas de compression : un PDF est envoyé tel quel au backend.
      const info = await FileSystem.getInfoAsync(input.uri);
      if (info.exists && typeof info.size === 'number' && info.size > MAX_PDF_BYTES) {
        throw new ScanInputError(
          'PDF trop volumineux (max 15 Mo). Réduisez le fichier ou envoyez des photos.',
        );
      }
      const base64 = await readAsBase64(input.uri);
      images.push({ image_base64: base64, media_type: 'application/pdf' });
    } else {
      const compressed = await compressImage(input.uri);
      const base64 = await readAsBase64(compressed);
      images.push({ image_base64: base64, media_type: 'image/jpeg' });
    }
  }

  // L'OCR d'un PDF (rendu page à page) est plus lent qu'une image compressée :
  // on élargit le timeout dans ce cas, sinon on garde le défaut (30 s).
  const hasPdf = inputs.some((i) => i.kind === 'pdf');

  try {
    return await post<ParsedInvoice>(
      '/scan-invoice',
      { images },
      hasPdf ? { timeoutMs: 90_000 } : {},
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) {
      throw new ApiError(429, 'Limite atteinte (20 scans/jour). Réessaie demain.', e.retryAfter);
    }
    throw e;
  }
}
