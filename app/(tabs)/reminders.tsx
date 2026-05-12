import React, { useCallback, useMemo, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Screen,
  StyledText,
  ReminderRow,
  Card,
} from '../../components/ui';
import type { ReminderUrgency } from '../../components/ui';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';
import { formatEUR } from '../../src/utils/format';
import type { MaintenanceEvent } from '../../src/types';

const MONTHS_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

interface ReminderGroup {
  id: ReminderUrgency;
  label: string;
  color: string;
  mutedColor: string;
  items: MaintenanceEvent[];
}

function formatDueShort(iso: string, now: Date): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === now.getFullYear();
  const base = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  return sameYear ? base : `${base} ${d.getFullYear()}`;
}

function getCountdownText(iso: string, now: Date): string {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return `${Math.abs(days)} j de retard`;
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `Dans ${days} j`;
}

function getUrgency(iso: string, now: Date): ReminderUrgency {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return 'overdue';
  if (days <= 7) return 'soon';
  if (days <= 30) return 'normal';
  return 'later';
}

export default function RemindersScreen() {
  const assets = useAssetStore((s) => s.assets);
  const fetchAssets = useAssetStore((s) => s.fetchAssets);
  const upcomingReminders = useEventStore((s) => s.upcomingReminders);
  const fetchUpcomingReminders = useEventStore((s) => s.fetchUpcomingReminders);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAssets();
      fetchUpcomingReminders();
    }, [fetchAssets, fetchUpcomingReminders]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAssets(), fetchUpcomingReminders()]);
    setRefreshing(false);
  }, [fetchAssets, fetchUpcomingReminders]);

  const groups = useMemo<ReminderGroup[]>(() => {
    const now = new Date();
    const buckets: Record<ReminderUrgency, MaintenanceEvent[]> = {
      overdue: [],
      soon: [],
      normal: [],
      later: [],
    };

    [...upcomingReminders]
      .filter((r) => r.nextDueDate)
      .sort((a, b) =>
        (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''),
      )
      .forEach((r) => {
        const u = getUrgency(r.nextDueDate as string, now);
        buckets[u].push(r);
      });

    const list: ReminderGroup[] = [
      {
        id: 'overdue',
        label: 'EN RETARD',
        color: COLORS.danger,
        mutedColor: COLORS.dangerMuted,
        items: buckets.overdue,
      },
      {
        id: 'soon',
        label: 'CETTE SEMAINE',
        color: COLORS.warning,
        mutedColor: COLORS.warningMuted,
        items: buckets.soon,
      },
      {
        id: 'normal',
        label: 'CE MOIS',
        color: COLORS.primary,
        mutedColor: COLORS.primaryMuted,
        items: buckets.normal,
      },
      {
        id: 'later',
        label: 'PLUS TARD',
        color: COLORS.textSecondary,
        mutedColor: COLORS.surfaceAlt,
        items: buckets.later,
      },
    ];

    return list.filter((g) => g.items.length > 0);
  }, [upcomingReminders]);

  const getAsset = (id: string) => assets.find((a) => a.id === id);
  const now = new Date();
  const totalCount = upcomingReminders.filter((r) => r.nextDueDate).length;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* HEADER */}
      <View
        style={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.lg,
          paddingBottom: SPACING.lg,
        }}
      >
        <StyledText variant="eyebrow">RAPPELS</StyledText>
        <StyledText variant="h2" style={{ marginTop: SPACING.xs }}>
          Vos échéances
        </StyledText>
      </View>

      {/* EMPTY STATE */}
      {totalCount === 0 && (
        <View
          style={{
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.xxxl,
            alignItems: 'center',
          }}
        >
          <StyledText
            variant="h3"
            align="center"
            style={{ marginBottom: SPACING.sm }}
          >
            Aucun rappel
          </StyledText>
          <StyledText variant="body" color={COLORS.textSecondary} align="center">
            Ajoutez un événement avec une date d'échéance future pour voir vos rappels ici.
          </StyledText>
        </View>
      )}

      {/* GROUPS */}
      {groups.map((group) => (
        <View key={group.id} style={{ marginBottom: SPACING.xl }}>
          {/* Section header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.sm,
              paddingHorizontal: SPACING.lg,
              marginBottom: SPACING.sm,
            }}
          >
            <StyledText variant="eyebrow" color={group.color}>
              {group.label}
            </StyledText>
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: RADIUS.full,
                backgroundColor: group.mutedColor,
                minWidth: 22,
                alignItems: 'center',
              }}
            >
              <StyledText
                variant="caption"
                color={group.color}
                style={{ fontSize: 10, fontFamily: FONTS.sansBold }}
              >
                {group.items.length}
              </StyledText>
            </View>
          </View>

          {/* Card with reminders */}
          <Card
            variant="outlined"
            padding="none"
            radius="md"
            style={{ marginHorizontal: SPACING.lg, overflow: 'hidden' }}
          >
            {group.items.map((reminder, idx) => {
              const asset = getAsset(reminder.assetId);
              const dueIso = reminder.nextDueDate as string;
              const countdownLabel = getCountdownText(dueIso, now);
              const dueDateLabel = formatDueShort(dueIso, now);
              const urgency = getUrgency(dueIso, now);
              const costLabel =
                reminder.cost !== undefined && reminder.cost > 0
                  ? formatEUR(reminder.cost)
                  : undefined;

              return (
                <ReminderRow
                  key={reminder.id}
                  title={reminder.title}
                  assetName={asset?.name}
                  categoryId={asset?.categoryId ?? 'other'}
                  countdownLabel={countdownLabel}
                  dueDateLabel={dueDateLabel}
                  costLabel={costLabel}
                  urgency={urgency}
                  onPress={() => router.push(`/event/${reminder.id}`)}
                  isLast={idx === group.items.length - 1}
                />
              );
            })}
          </Card>
        </View>
      ))}
    </Screen>
  );
}
