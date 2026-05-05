// src/services/apiClient.ts
// Centralized fetch wrapper for the Homelog backend.

import { getDeviceId } from '../utils/deviceId';

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_API_URL ?? '').replace(/\/$/, '');
const API_KEY = process.env.EXPO_PUBLIC_BACKEND_API_KEY ?? '';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  if (!API_KEY) {
    throw new Error(
      'Backend API key not configured — set EXPO_PUBLIC_BACKEND_API_KEY in your .env',
    );
  }

  const deviceId = await getDeviceId();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-Device-Id': deviceId,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Erreur réseau — vérifiez votre connexion internet.');
  }

  if (response.ok) {
    return response.json() as Promise<T>;
  }

  const retryAfterHeader = response.headers.get('Retry-After');
  const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

  let detail = response.statusText;
  try {
    const json = (await response.json()) as { detail?: string };
    if (json.detail) detail = json.detail;
  } catch {
    // leave detail as statusText
  }

  switch (response.status) {
    case 401:
      throw new ApiError(401, "Clé API invalide ou manquante.");
    case 400:
      throw new ApiError(400, `Requête invalide : ${detail}`);
    case 429:
      throw new ApiError(429, detail, retryAfter);
    default:
      throw new ApiError(
        response.status,
        `Erreur serveur (${response.status}) : ${detail}`,
      );
  }
}
