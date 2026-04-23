// app/(tabs)/history.tsx

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ASSET_CATEGORIES, EVENT_TYPES } from '../../constants/categories';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';

const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function HistoryScreen() {
  const { fetchAllEvents, events, getYearlyCost } = useEventStore();
  const { assets } = useAssetStore();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [yearlyCost, setYearlyCost] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchAllEvents();
    }, [])
  );

  useEffect(() => {
    getYearlyCost(selectedYear).then(setYearlyCost);
  }, [selectedYear, events]);

  const years = useMemo(() => {
    const set = new Set<number>();
    set.add(currentYear);
    for (const e of events) {
      const y = parseInt(e.eventDate.split('-')[0], 10);
      if (!isNaN(y)) set.add(y);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [events]);

  const eventsByMonth = useMemo(() => {
    const filtered = events
      .filter(e => e.eventDate.startsWith(String(selectedYear)))
      .sort((a, b) => (a.eventDate < b.eventDate ? 1 : -1));

    const map = new Map<number, typeof filtered>();
    for (const e of filtered) {
      const month = parseInt(e.eventDate.split('-')[1], 10) - 1;
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [events, selectedYear]);

  const totalEvents = eventsByMonth.reduce((s, [, evts]) => s + evts.length, 0);

  function getAsset(assetId: string) {
    return assets.find(a => a.id === assetId);
  }

  function getEventIcon(type: string): string {
    return EVENT_TYPES.find(t => t.id === type)?.icon ?? '📝';
  }

  function getCategoryIcon(categoryId: string): string {
    return ASSET_CATEGORIES.find(c => c.id === categoryId)?.icon ?? '📦';
  }

  function formatDate(isoDate: string): string {
    const [, , d] = isoDate.split('-');
    return d;
  }

  function monthTotal(evts: typeof events): number {
    return evts.reduce((s, e) => s + (e.cost ?? 0), 0);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Sélecteur d'année */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.yearRow}
      >
        {years.map(year => (
          <TouchableOpacity
            key={year}
            style={[styles.yearChip, selectedYear === year && styles.yearChipActive]}
            onPress={() => setSelectedYear(year)}
          >
            <Text style={[styles.yearChipText, selectedYear === year && styles.yearChipTextActive]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Résumé annuel */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{yearlyCost.toFixed(0)} €</Text>
          <Text style={styles.summaryLabel}>Dépensé en {selectedYear}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalEvents}</Text>
          <Text style={styles.summaryLabel}>Événements</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{eventsByMonth.length}</Text>
          <Text style={styles.summaryLabel}>Mois actifs</Text>
        </View>
      </View>

      {eventsByMonth.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Aucun événement en {selectedYear}</Text>
        </View>
      ) : (
        eventsByMonth.map(([monthIndex, evts]) => {
          const total = monthTotal(evts);
          return (
            <View key={monthIndex} style={styles.monthGroup}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthLabel}>{MONTH_LABELS[monthIndex]}</Text>
                <View style={styles.monthMeta}>
                  <Text style={styles.monthCount}>{evts.length} événement{evts.length > 1 ? 's' : ''}</Text>
                  {total > 0 && (
                    <Text style={styles.monthCost}>{total.toFixed(0)} €</Text>
                  )}
                </View>
              </View>

              {evts.map(event => {
                const asset = getAsset(event.assetId);
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.card}
                    onPress={() => router.push(`/event/${event.id}`)}
                  >
                    <View style={styles.cardDateBox}>
                      <Text style={styles.cardDay}>{formatDate(event.eventDate)}</Text>
                    </View>
                    <View style={styles.cardIcon}>
                      <Text>{getEventIcon(event.eventType)}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{event.title}</Text>
                      <View style={styles.cardAssetRow}>
                        {asset && (
                          <Text style={styles.cardAssetIcon}>
                            {getCategoryIcon(asset.categoryId)}
                          </Text>
                        )}
                        <Text style={styles.cardAsset}>{asset?.name ?? '—'}</Text>
                      </View>
                    </View>
                    {event.cost !== undefined && (
                      <Text style={styles.cardCost}>{event.cost.toFixed(0)} €</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  yearRow: { paddingBottom: spacing.md, gap: spacing.sm },
  yearChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  yearChipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  yearChipTextActive: { color: colors.white },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    ...shadow.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  summaryLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  summaryDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.md },
  monthGroup: { marginBottom: spacing.lg },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  monthMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  monthCount: { fontSize: fontSize.xs, color: colors.textTertiary },
  monthCost: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.accent },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.sm,
  },
  cardDateBox: {
    width: 28,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cardDay: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  cardAssetRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardAssetIcon: { fontSize: 12 },
  cardAsset: { fontSize: fontSize.sm, color: colors.primary },
  cardCost: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.accent, marginLeft: spacing.sm },
});
