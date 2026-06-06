// constants/config.ts
// Constantes applicatives partagées. Sortez les hardcodes ici plutôt que dans
// les stores ou les écrans.

import Constants from 'expo-constants';

// ─── Limites / quotas ─────────────────────────────────────────────────────

export const MAX_FREE_ASSETS = 3;

export const INVOICE_SCAN_RATE_LIMIT_PER_DAY = 20;

export const INVOICE_SCAN_MAX_PAGES = 4;

// ─── Liens / contact ──────────────────────────────────────────────────────

export const SUPPORT_EMAIL = 'contact@mdlnlab.com';

export const PRIVACY_URL =
  'https://momentous-locket-2af.notion.site/POLITIQUE-DE-CONFIDENTIALIT-Homelog-34284071bf3e801b9e04c95523a335f1';

export const TERMS_URL =
  'https://momentous-locket-2af.notion.site/CONDITIONS-G-N-RALES-D-UTILISATION-Homelog-34284071bf3e80278f70c5cff4a24962';

// URL Support (à créer dans Notion — placeholder en attendant)
export const SUPPORT_URL =
  'https://momentous-locket-2af.notion.site/SUPPORT-Homelog';

// ─── App metadata ─────────────────────────────────────────────────────────

export const APP_VERSION: string =
  Constants.expoConfig?.version ?? '1.0.0';

export const APP_NAME = 'Homelog';

// ─── RevenueCat ───────────────────────────────────────────────────────────

export const REVENUECAT_ENTITLEMENT_ID = 'premium';
