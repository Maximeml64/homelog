// app/(tabs)/reminders.tsx

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ASSET_CATEGORIES } from '../../constants/categories';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';
import { MaintenanceEvent } from '../../src/types';

type ReminderGroup = {
  label: string;
  color: string;
  events: MaintenanceEvent[];
};

function groupReminders(events: MaintenanceEvent[]): ReminderGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  const endOfMonth = new Date(today);
  endOfMonth.setDate(today.getDate() + 30);

  const overdue: MaintenanceEvent[] = [];
  const thisWeek: MaintenanceEvent[] = [];
  const thisMonth: MaintenanceEvent[] = [];
  const later: MaintenanceEvent[] = [];

  for (const event of events) {
    if (!event.nextDueDate) continue;
    const [y, m, d] = event.nextDueDate.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    due.setHours(0, 0, 0, 0);

    if (due < today) overdue.push(event);
    else if (due <= endOfWeek) thisWeek.push(event);
    else if (due <= endOfMonth) thisMonth.push(event);
    else later.push(event);
  }

  const groups: ReminderGroup[] = [];
  if (overdue.length) groups.push({ label: '⚠️ En retard', color: colors.danger, events: overdue });
  if (thisWeek.length) groups.push({ label: '📅 Cette semaine', color: colors.warning, events: thisWeek });
  if (thisMonth.length) groups.push({ label: '🗓 Ce mois', color: colors.primary, events: thisMonth });
  if (later.length) groups.push({ label: '⏳ Plus tard', color: colors.textSecondary, events: later });
  return groups;
}

export default function RemindersScreen() {
  const { fetchUpcomingReminders, upcomingReminders } = useEventStore();
  const { assets } = useAssetStore();

  useFocusEffect(
    useCallback(() => {
      fetchUpcomingReminders();
    }, [])
  );

  const groups = useMemo(() => groupReminders(upcomingReminders), [upcomingReminders]);

  function getAsset(assetId: string) {
    return assets.find(a => a.id === assetId);
  }

  function getCategoryIcon(categoryId: string): string {
    return ASSET_CATEGORIES.find(c => c.id === categoryId)?.icon ?? '📦';
  }

  function formatDueDate(isoDate: string): string {
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }

  function getDueDelta(isoDate: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = isoDate.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}j de retard`;
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    return `Dans ${diff}j`;
  }

  function getDeltaColor(isoDate: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = isoDate.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return colors.danger;
    if (diff <= 7) return colors.warning;
    return colors.primary;
  }

  if (groups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔔</Text>
        <Text style={styles.emptyTitle}>Aucun rappel</Text>
        <Text style={styles.emptySubtitle}>
          Les rappels apparaissent ici quand vous ajoutez un événement à venir sur un bien.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {groups.map(group => (
        <View key={group.label} style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={[styles.groupBadge, { backgroundColor: group.color + '20' }]}>
              <Text style={[styles.groupBadgeText, { color: group.color }]}>
                {group.events.length}
              </Text>
            </View>
          </View>

          {group.events.map(event => {
            const asset = getAsset(event.assetId);
            return (
              <TouchableOpacity
                key={event.id}
                style={styles.card}
                onPress={() => router.push(`/event/${event.id}`)}
              >
                {asset && (
                  <View style={styles.cardCategoryIcon}>
                    <Text style={styles.cardCategoryIconText}>
                      {getCategoryIcon(asset.categoryId)}
                    </Text>
                  </View>
                )}
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <Text style={styles.cardAsset}>{asset?.name ?? '—'}</Text>
                  {event.cost !== undefined && event.cost > 0 && (
                    <Text style={styles.cardCost}>Coût estimé : {event.cost.toFixed(0)} €</Text>
                  )}
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.cardDelta, { color: getDeltaColor(event.nextDueDate!) }]}>
                    {getDueDelta(event.nextDueDate!)}
                  </Text>
                  <Text style={styles.cardDate}>{formatDueDate(event.nextDueDate!)}</Text>
                  {event.reminderEnabled && (
                    <Text style={styles.cardNotif}>🔔</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  group: { marginBottom: spacing.lg },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  groupLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  groupBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  groupBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
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
  cardCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cardCategoryIconText: { fontSize: 18 },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  cardAsset: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  cardCost: { fontSize: fontSize.xs, color: colors.accent, marginTop: 2, fontWeight: fontWeight.medium },
  cardRight: { alignItems: 'flex-end', gap: 2, marginLeft: spacing.sm },
  cardDelta: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  cardDate: { fontSize: fontSize.xs, color: colors.textTertiary },
  cardNotif: { fontSize: 12, marginTop: 2 },
});
