# Homelog — Design System

Direction : **Carnet de patrimoine maison premium**.
Anthracite (`#1F2937`) + or champagne (`#C9A961`) sur fond papier chaud (`#FAFAF9`).
Typographies : **IBM Plex Serif** pour les titres éditoriaux + **Inter** pour l'UI/body.

---

## Tokens

Tous les tokens sont définis dans [`constants/theme.ts`](constants/theme.ts) et
exportés en **UPPERCASE**.

```ts
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
```

| Token         | Usage                                                    |
| ------------- | -------------------------------------------------------- |
| `COLORS`      | Palette complète + variants muted                        |
| `FONTS`       | Familles serif / sans, 4 graisses chacune                |
| `TYPOGRAPHY`  | Styles texte composés (h1, body, eyebrow, numericLarge…) |
| `SPACING`     | Échelle 4→64 px                                          |
| `RADIUS`      | Échelle xs→full                                          |
| `SHADOWS`     | sm / md / lg / xl (opacity 0.04 → 0.10 max)              |
| `HIT_SLOP`    | Cible tactile standard 8 px                              |

⚠️ **Plus aucun shim lowercase.** Tout nouveau code utilise les tokens UPPERCASE.

---

## Patterns visuels

### Surfaces

| Pattern              | Background          | Border                            | Usage                        |
| -------------------- | ------------------- | --------------------------------- | ---------------------------- |
| **Soft muted**       | `COLORS.primaryMuted` | aucune                          | Tags, badges discrets, hover |
| **Filled primary**   | `COLORS.primary`    | aucune                            | CTA principal, sticky bottom |
| **Filled accent**    | `COLORS.accentDark` | aucune                            | CTA scan facture (or)        |
| **Destructive**      | `COLORS.danger`     | aucune                            | Actions destructives         |
| **Outlined**         | `COLORS.surface`    | 1px `COLORS.border`               | Card par défaut              |
| **Editorial accent** | `COLORS.accentMuted`| 3px gauche `COLORS.accent`        | Bloc "prochain entretien"    |

### Bordures

- Bordures **uniquement sur surface blanche** (`COLORS.surface`).
- Séparateurs internes : `borderBottomWidth: 0.5` + `borderBottomColor: COLORS.border`.
- Bordures latérales 1px : seulement pour `Card variant="outlined"`.

### Shadows

- `SHADOWS.sm` : éléments stickys, cards interactives — `opacity 0.04`.
- `SHADOWS.md` : CTA principal — `opacity 0.06`.
- `SHADOWS.lg/xl` : à utiliser rarement (modales, sheets) — max `opacity 0.10`.

---

## Typographie

### Hiérarchie

```ts
TYPOGRAPHY.display     // 40px serif — patrimoine total accueil
TYPOGRAPHY.h1          // 32px serif — titres écrans, slides
TYPOGRAPHY.h2          // 24px serif — titres sections
TYPOGRAPHY.h3          // 20px serif — sous-titres
TYPOGRAPHY.title       // 17px Inter SemiBold — CTAs, labels forts
TYPOGRAPHY.bodyMedium  // 15px Inter Medium — items de liste
TYPOGRAPHY.body        // 15px Inter — paragraphes
TYPOGRAPHY.smallMedium // 13px Inter Medium — meta
TYPOGRAPHY.small       // 13px Inter — meta secondaire
TYPOGRAPHY.caption     // 11px Inter — texte minimal
TYPOGRAPHY.eyebrow     // 11px Inter SemiBold uppercase tracking 1.5 — sections
TYPOGRAPHY.numericLarge   // 28px Inter SemiBold tabular-nums — montants principaux
TYPOGRAPHY.numericMedium  // 17px Inter Medium tabular-nums — montants secondaires
TYPOGRAPHY.numericSmall   // 13px Inter Medium tabular-nums — meta numérique
```

### Règles

- **Titres éditoriaux (h1, h2, h3, display)** : toujours `FONTS.serif*` (IBM Plex Serif).
- **UI, body, meta** : toujours `FONTS.sans*` (Inter).
- **Montants** : utiliser `TYPOGRAPHY.numeric*` qui inclut `fontVariant: ['tabular-nums']`.
- **Eyebrows (labels de section)** : toujours en CAPS, tracking 1.5, couleur `textSecondary`.
- **Pas d'emojis dans l'UI** — exclusivement Lucide React Native, `strokeWidth: 1.75` par défaut.

---

## Composants

Tous dans [`components/ui/`](components/ui/) — préférer ces composants aux primitives natives.

| Au lieu de…             | Utilisez…                       |
| ----------------------- | ------------------------------- |
| `Text`                  | `StyledText variant="..."`      |
| `View` bordé            | `Card variant="outlined"`       |
| `TouchableOpacity`      | `Pressable`                     |
| `<View style={{... border}}>` | `Card`, `Separator`       |
| Date input              | `DateField`                     |
| Text input form         | `TextField`                     |
| Grille de choix         | `SelectGrid`                    |
| Switch labelé           | `Toggle`                        |
| Sections de form        | `FormSection`                   |
| Header section          | `SectionHeader`                 |
| Label "BIEN: voiture"   | `InfoRow`                       |

---

## Layout

- **Padding standard écran** : `SPACING.lg` (= 20).
- **Sticky bottom CTA** : `position: 'absolute', bottom: 0`, padding top/bottom, `borderTopWidth: 1, borderTopColor: COLORS.border`. Le `Screen` parent doit avoir `paddingBottom: 100-110` pour libérer l'espace.
- **Espacements verticaux entre sections** : `SPACING.xl` (= 24).
- Préférer `gap` sur `flex` plutôt que `marginRight`/`marginBottom`.
- **Pas de `StyleSheet.create`** pour les composants simples — inline style array + spread des SHADOWS.

---

## Helpers obligatoires

| Helper                | Source                          | Usage                              |
| --------------------- | ------------------------------- | ---------------------------------- |
| `formatEUR(n)`        | `src/utils/format.ts`           | Tout montant en €                  |
| `formatLongDate(iso)` | `src/utils/format.ts`           | Date longue (1 mars 2026)          |
| `formatShortDate(iso)`| `src/utils/format.ts`           | Date courte (1 mars)               |
| `formatFullDate()`    | `src/utils/format.ts`           | Date pleine (lundi 1 mars)         |
| `getGreeting(date)`   | `src/utils/format.ts`           | Bonjour / Bonsoir                  |
| `getCountdown(iso)`   | `src/utils/format.ts`           | "Dans 3 jours" / "En retard"       |
| `getCategoryLabel(id)`| `src/utils/format.ts`           | Lookup catégorie                   |
| `logger.{warn,error}` | `src/utils/logger.ts`           | Remplace try/catch silencieux      |

---

## Config

Constantes applicatives partagées : [`constants/config.ts`](constants/config.ts).

- `MAX_FREE_ASSETS` : 3
- `INVOICE_SCAN_RATE_LIMIT_PER_DAY` : 20
- `INVOICE_SCAN_MAX_PAGES` : 4
- `SUPPORT_EMAIL`, `PRIVACY_URL`, `TERMS_URL`, `SUPPORT_URL`
- `APP_VERSION` : lu via `Constants.expoConfig?.version`
- `REVENUECAT_ENTITLEMENT_ID` : `'premium'`

**Plus aucun hardcode** de quota, URL ou email dans les stores/écrans.
