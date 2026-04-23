// app/search.tsx

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ASSET_CATEGORIES, EVENT_TYPES } from '../constants/categories';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../constants/theme';
import { useAssetStore } from '../src/stores/assetStore';
import { useEventStore } from '../src/stores/eventStore';

export default function SearchScreen() {
  const { assets } = useAssetStore();
  const { events } = useEventStore();
  const [query, setQuery] = useState('');

  const q = query.toLowerCase().trim();

  const results = useMemo(() => {
    if (q.length < 2) return { assets: [], events: [] };

    const matchedAssets = assets.filter(a => {
      const data = a.extraData as Record<string, any> | undefined;
      const brand = data?.brand ?? a.brand ?? '';
      const model = data?.model ?? a.model ?? '';
      return (
        a.name.toLowerCase().includes(q) ||
        brand.toLowerCase().includes(q) ||
        model.toLowerCase().includes(q) ||
        (a.location ?? '').toLowerCase().includes(q) ||
        (a.notes ?? '').toLowerCase().includes(q)
      );
    });

    const matchedEvents = events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.providerName ?? '').toLowerCase().includes(q) ||
      (e.notes ?? '').toLowerCase().includes(q)
    );

    return { assets: matchedAssets, events: matchedEvents };
  }, [q, assets, events]);

  function getCategoryIcon(categoryId: string): string {
    return ASSET_CATEGORIES.find(c => c.id === categoryId)?.icon ?? '📦';
  }

  function getCategoryLabel(categoryId: string): string {
    return ASSET_CATEGORIES.find(c => c.id === categoryId)?.label ?? categoryId;
  }

  function getEventIcon(type: string): string {
    return EVENT_TYPES.find(t => t.id === type)?.icon ?? '📝';
  }

  function getEventTypeLabel(type: string): string {
    return EVENT_TYPES.find(t => t.id === type)?.label ?? type;
  }

  function getAssetName(assetId: string): string {
    return assets.find(a => a.id === assetId)?.name ?? '—';
  }

  function formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function highlight(text: string): string {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      text.slice(0, idx) +
      `<mark>${text.slice(idx, idx + q.length)}</mark>` +
      text.slice(idx + q.length)
    );
  }

  const hasResults = results.assets.length > 0 || results.events.length > 0;
  const showEmpty = q.length >= 2 && !hasResults;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un bien, événement, prestataire…"
          placeholderTextColor={colors.textTertiary}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {q.length < 2 && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Saisissez au moins 2 caractères</Text>
        </View>
      )}

      {showEmpty && (
        <View style={styles.hintContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.hintText}>pour « {query} »</Text>
        </View>
      )}

      <ScrollView style={styles.results} contentContainerStyle={styles.resultsContent} keyboardShouldPersistTaps="handled">

        {results.assets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Biens · {results.assets.length}
            </Text>
            {results.assets.map(asset => {
              const data = asset.extraData as Record<string, any> | undefined;
              const brand = data?.brand ?? asset.brand ?? null;
              const model = data?.model ?? asset.model ?? null;
              const brandModel = brand && model ? `${brand} · ${model}` : (brand ?? model ?? null);
              return (
                <TouchableOpacity
                  key={asset.id}
                  style={styles.card}
                  onPress={() => router.push(`/asset/${asset.id}`)}
                >
                  <View style={styles.cardIcon}>
                    <Text style={styles.cardIconText}>{getCategoryIcon(asset.categoryId)}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{asset.name}</Text>
                    <Text style={styles.cardSub}>{getCategoryLabel(asset.categoryId)}</Text>
                    {brandModel && <Text style={styles.cardMeta}>{brandModel}</Text>}
                    {asset.location && <Text style={styles.cardMeta}>📍 {asset.location}</Text>}
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {results.events.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Événements · {results.events.length}
            </Text>
            {results.events.map(event => (
              <TouchableOpacity
                key={event.id}
                style={styles.card}
                onPress={() => router.push(`/event/${event.id}`)}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardIconText}>{getEventIcon(event.eventType)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <Text style={styles.cardSub}>{getAssetName(event.assetId)}</Text>
                  <Text style={styles.cardMeta}>
                    {getEventTypeLabel(event.eventType)} · {formatDate(event.eventDate)}
                    {event.cost !== undefined ? ` · ${event.cost.toFixed(0)} €` : ''}
                  </Text>
                  {event.providerName && (
                    <Text style={styles.cardMeta}>🔧 {event.providerName}</Text>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: fontSize.md,
    color: colors.text,
  },
  hintContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  hintText: { fontSize: fontSize.md, color: colors.textTertiary, textAlign: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: spacing.sm },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  results: { flex: 1 },
  resultsContent: { padding: spacing.md, paddingBottom: 40 },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.sm,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardIconText: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  cardSub: { fontSize: fontSize.sm, color: colors.primary, marginTop: 2 },
  cardMeta: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  chevron: { fontSize: 20, color: colors.textTertiary },
});
