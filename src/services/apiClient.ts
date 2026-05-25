// src/services/apiClient.ts
// Centralized fetch wrapper for the Homelog backend.

import { getDeviceId } from '../utils/deviceId';

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_API_URL ?? '').replace(/\/$/, '');
const API_KEY = process.env.EXPO_PUBLIC_BACKEND_API_KEY ?? '';

// 30s couvre largement un scan facture multi-pages chez le backend OCR.
// Au-delà, on suppose backend bloqué ou réseau qui s'effondre.
const DEFAULT_TIMEOUT_MS = 30_000;

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

interface PostOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function post<T>(
  path: string,
  body: unknown,
  options: PostOptions = {},
): Promise<T> {
  if (!API_KEY) {
    throw new Error(
      'Backend API key not configured — set EXPO_PUBLIC_BACKEND_API_KEY in your .env',
    );
  }

  const deviceId = await getDeviceId();

  // Compose un signal qui s'abort sur timeout local ou sur celui du caller.
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  const onCallerAbort = () => controller.abort(options.signal?.reason);
  if (options.signal) {
    if (options.signal.aborted) controller.abort(options.signal.reason);
    else options.signal.addEventListener('abort', onCallerAbort, { once: true });
  }

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
      signal: controller.signal,
    });
  } catch (e: any) {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason;
      if (reason === 'timeout' || e?.name === 'AbortError') {
        throw new ApiError(
          0,
          'Délai dépassé — le serveur met trop de temps à répondre. Réessayez.',
        );
      }
      throw new ApiError(0, 'Requête annulée.');
    }
    throw new ApiError(0, 'Erreur réseau — vérifiez votre connexion internet.');
  } finally {
    clearTimeout(timer);
    if (options.signal) {
      options.signal.removeEventListener('abort', onCallerAbort);
    }
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
