# Homelog — CLAUDE.md

> Standard global : `~/.claude/CLAUDE.md` (le `../CLAUDE.md` cité avant n'existe pas). Ce fichier = contraintes propres à l'app.

## Rôle
App mobile Expo iOS « carnet de patrimoine maison » : inventaire de biens, événements d'entretien/maintenance (suggérés automatiquement par catégorie), rappels, **scan de factures/devis par OCR LLM** (backend distant), rapports PDF (badges classe énergie/DPE), export CSV, backup ZIP. 100 % FR. **Soumission App Store en cours** (ascAppId 6762176481 ; version = celle d'app.json, 1.0.1 au 2026-07-12) — prudence sur tout ce qui touche paywall/flux d'achat.

## Stack figée (NE PAS migrer sans demande explicite)
expo-router ~6 (typedRoutes) · Zustand 5 **sans persist** (caches mémoire re-fetchés depuis SQLite) · **expo-sqlite** (pas AsyncStorage — ne pas proposer Drizzle/MMKV) · RevenueCat (`react-native-purchases` 9) · backend Railway **partagé avec Tastebook** · TypeScript ~5.9 strict. Pas de Zod, TanStack Query, react-hook-form, Sentry. **EAS Dev Build est la norme** (`expo-dev-client` installé) — plus Expo Go.

## Commandes
```bash
npm install                 # .npmrc force legacy-peer-deps=true
npm start                   # expo start
npm run ios / android       # expo run:ios / run:android (Dev Build)
npx tsc --noEmit            # SEUL check disponible (aucun script lint/test/build)
eas build --profile development|preview|production --platform ios
```

## Persistance SQLite — règles
- Fichier `homelog2.db` (`src/db/client.ts`), WAL + foreign_keys ON. Tables : `asset`, `vehicle_details`, `maintenance_event`, `attachment`, `app_settings`.
- **Toute modif de schéma = migration versionnée** : bumper `SCHEMA_VERSION` (`src/db/schema.ts`, actuellement 5) + entrée dans `MIGRATIONS` ; version stockée dans `app_settings`. Les migrations sont best-effort (erreurs « duplicate column »/« already exists » tolérées pour converger) — les écrire idempotentes.
- La DB est initialisée AVANT le montage des écrans (`app/_layout.tsx`, gate `dbReady`) — évite les migrations concurrentes au premier boot. `getDatabase()` (`src/db/client.ts`) est un singleton sûr à appeler partout APRÈS ce gate ; ne pas l'appeler avant (le singleton `dbPromise` se reset sur erreur).
- AsyncStorage limité à 2 clés (`onboarding_done`, `user_name` — appStore). Rien d'autre.

## Backend & scan facture
Endpoint unique `POST /scan-invoice` sur `tastebook-backend-production.up.railway.app` (backend de Tastebook réutilisé). Headers `X-API-Key` (`EXPO_PUBLIC_BACKEND_API_KEY`, requise sinon throw) + `X-Device-Id` (UUID persistant SecureStore `homelog_device_id`, sert au rate-limit par device). Timeout 30 s, élargi à 90 s si PDF. Images compressées 2000 px/JPEG 0.8 ; PDF cap 15 Mo (limite 32 Mo API Claude après base64).
⚠️ `INVOICE_SCAN_RATE_LIMIT_PER_DAY` et `INVOICE_SCAN_MAX_PAGES` dans `constants/config.ts` sont des **constantes mortes** (importées nulle part) : la limite 4 documents est en dur dans `invoiceScanService.ts`, le quota 20/jour est appliqué **côté backend** (429). Changer config.ts ne change rien.

## Freemium
`MAX_FREE_ASSETS=3` (config.ts), entitlement RevenueCat `premium`, gate = `appStore.canAddAsset` → redirect `/paywall`. **`canAddAsset` retourne toujours true en Expo Go** (garde isExpoGo). Le paywall affiche « export PDF/CSV » comme feature premium mais **l'export n'est PAS gaté dans le code** : `handleExportPDF`/`handleExportCSV` (settings.tsx) n'ont aucun check `isPremium` (la variable n'y sert qu'au hero card et à la restauration d'achat) — intention produit non implémentée, ne pas la présumer.
Env var : **`EXPO_PUBLIC_REVENUECAT_API_KEY`** (sans « IOS » — dévie du standard des autres apps ; si renommage voulu : `_layout.tsx` + `.env` + `.env.example`).

## Bugs connus (vérifiés au 2026-07-12)
- **Export CSV cassé au runtime** : `csvService.ts` fait `require('expo-file-system')` (API non-legacy) → `writeAsStringAsync` **throw** en SDK 54. Tous les autres fichiers importent correctement `'expo-file-system/legacy'` (convention à suivre). Le bouton Export CSV tombe dans le catch → Alert d'échec.
- **Restauration de backup non implémentée** : `backupService.ts` = écriture seule (zip data.json + attachments via jszip, partage expo-sharing).

## Design & conventions
`DESIGN_SYSTEM.md` (racine) fait foi : « carnet de patrimoine » anthracite `#1F2937` + or champagne `#C9A961`, fond papier `#FAFAF9`, IBM Plex Serif (titres) + Inter (UI). Tokens UPPERCASE dans `constants/theme.ts` (référence des couleurs/shadows **de cette app** — la palette est propre à Homelog, ne pas la copier ailleurs). `userInterfaceStyle: light`, pas de dark mode. Le pattern Premium gate RevenueCat de `src/stores/appStore.ts` sert de modèle pour les autres apps. Pièces jointes : toujours copier les URIs picker vers `documentDirectory/attachments/` via `src/utils/attachmentStorage.ts` (les URIs cache sont purgées par l'OS). Deps supprimées volontairement, ne pas réintroduire : expo-web-browser, react-native-keyboard-aware-scroll-view.

## Repères
Bundle iOS = package Android = `com.homelog.app`. EAS projectId `3765fd54-a667-4225-a08c-ceaa98d845dc` (owner maximeml), `appVersionSource: remote` (la version d'app.json ne pilote pas le buildNumber). `.env`/.env.example : `EXPO_PUBLIC_REVENUECAT_API_KEY`, `EXPO_PUBLIC_BACKEND_API_URL`, `EXPO_PUBLIC_BACKEND_API_KEY`. Support : contact@mdlnlab.com.
