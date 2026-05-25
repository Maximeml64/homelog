# Homelog — Stack figée

> Standard global : `../CLAUDE.md`. Ce fichier ne liste que les contraintes propres à cette app.

## Stack en prod (NE PAS migrer sans demande explicite)

- **Routing** : expo-router
- **State** : Zustand
- **Persistance** : **expo-sqlite** (DB locale structurée, pas AsyncStorage)
- **Premium** : RevenueCat
- **Backend** : Railway (API custom)
- **Bundle ID** : `com.homelog.app`

## Règles de modification

- **expo-sqlite assumé** : ne pas proposer de migration vers Drizzle ORM ou MMKV sans demande explicite. La couche SQL actuelle fonctionne.
- **Pas de Zod, pas de TanStack Query, pas de react-hook-form** sauf si je le demande explicitement.
- Toute modif de schéma SQLite demande une migration manuelle versionnée (perte de données utilisateur sinon).
- **Build mode** : EAS Dev Build (norme depuis mai 2026). Tests sur iPhone physique via le Dev Build.

## Références canoniques pour les autres apps

- **RevenueCat** : `src/stores/appStore.ts` est la référence canonique du pattern Premium gate.
- **Theme tokens** : `constants/theme.ts` est la référence des couleurs/shadows partagées.
- **Env var RevenueCat** : actuellement nommée `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` (dévie du standard `EXPO_PUBLIC_REVENUECAT_IOS_KEY` des autres apps). **À corriger** quand l'occasion se présente.
