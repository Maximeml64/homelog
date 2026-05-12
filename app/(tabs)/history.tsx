import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Screen,
  StyledText,
  Chip,
  StatCard,
  EventListItem,
  Card,
} from '../../components/ui';
import { COLORS, SPACING } from '../../constants/theme';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';
import { formatEUR } from '../../src/utils/format';
import type { MaintenanceEvent } from '../../src/types';

const MONTHS_LONG = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n > 1 ? plural : singular}`;
}

export default function HistoryScreen() {
  const assets = useAssetStore((s) => s.assets);
  const fetchAssets = useAssetStore((s) => s.fetchAssets);
  const events = useEventStore((s) => s.events);
  const fetchAllEvents = useEventStore((s) => s.fetchAllEvents);
  const getYearlyCost = useEventStore((s) => s.getYearlyCost);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [refreshing, setRefreshing] = useState(false);
  const [yearlyCost, setYearlyCost] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchAssets();
      fetchAllEvents();
    }, [fetchAssets, fetchAllEvents]),
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const cost = await getYearlyCost(selectedYear);
      if (active) setYearlyCost(cost);
    })();
    return () => {
      active = false;
    };
  }, [selectedYear, events.length, getYearlyCost]);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    set.add(currentYear);
    events.forEach((e) => {
      if (e.eventDate) {
        const y = parseInt(e.eventDate.split('-')[0], 10);
        if (!Number.isNaN(y)) set.add(y);
      }
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [events, currentYear]);

  const eventsByMonth = useMemo(() => {
    const filtered = events.filter((e) =>
      e.eventDate?.startsWith(String(selectedYear)),
    );
    const grouped: Record<number, MaintenanceEvent[]> = {};
    filtered.forEach((e) => {
      const monthIdx = parseInt(e.eventDate.split('-')[1], 10) - 1;
      if (!grouped[monthIdx]) grouped[monthIdx] = [];
      grouped[monthIdx].push(e);
    });
    Object.keys(grouped).forEach((m) => {
      grouped[Number(m)].sort((a, b) =>
        a.eventDate < b.eventDate ? 1 : -1,
      );
    });
    return Object.entries(grouped)
      .map(([month, evts]) => ({ month: Number(month), events: evts }))
      .sort((a, b) => b.month - a.month);
  }, [events, selectedYear]);

  const totalEvents = useMemo(
    () => eventsByMonth.reduce((s, g) => s + g.events.length, 0),
    [eventsByMonth],
  );

  const activeMonths = eventsByMonth.length;

  const getAssetName = (assetId: string) =>
    assets.find((a) => a.id === assetId)?.name;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAssets(), fetchAllEvents()]);
    const cost = await getYearlyCost(selectedYear);
    setYearlyCost(cost);
    setRefreshing(false);
  }, [fetchAssets, fetchAllEvents, getYearlyCost, selectedYear]);

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
          paddingBottom: SPACING.md,
        }}
      >
        <StyledText variant="eyebrow">HISTORIQUE</StyledText>
        <StyledText variant="h2" style={{ marginTop: SPACING.xs }}>
          Vos événements
        </StyledText>
      </View>

      {/* YEAR FILTER */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm }}
        style={{ marginBottom: SPACING.lg, flexGrow: 0 }}
      >
        {availableYears.map((y) => (
          <Chip
            key={y}
            label={String(y)}
            selected={y === selectedYear}
            onPress={() => setSelectedYear(y)}
          />
        ))}
      </ScrollView>

      {/* 3 STAT CARDS */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: SPACING.lg,
          gap: SPACING.sm,
          marginBottom: SPACING.xl,
        }}
      >
        <StatCard
          label={`DÉPENSÉ ${selectedYear}`}
          value={formatEUR(yearlyCost)}
          accent
        />
        <StatCard label="ÉVÉNEMENTS" value={totalEvents} />
        <StatCard label="MOIS ACTIFS" value={activeMonths} />
      </View>

      {/* TIMELINE */}
      {eventsByMonth.length === 0 ? (
        <View
          style={{
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.xxl,
            alignItems: 'center',
          }}
        >
          <StyledText variant="body" color={COLORS.textSecondary} align="center">
            Aucun événement en {selectedYear}.
          </StyledText>
        </View>
      ) : (
        eventsByMonth.map((monthGroup) => {
          const monthEvents = monthGroup.events;
          const monthTotal = monthEvents.reduce(
            (s, e) => s + (e.cost ?? 0),
            0,
          );
          return (
            <View key={monthGroup.month} style={{ marginBottom: SPACING.xl }}>
              {/* Month header */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingHorizontal: SPACING.lg,
                  marginBottom: SPACING.md,
                }}
              >
                <StyledText variant="h3">
                  {MONTHS_LONG[monthGroup.month]}
                </StyledText>
                <StyledText variant="eyebrow" color={COLORS.textTertiary}>
                  {pluralize(monthEvents.length, 'événement', 'événements')}
                  {monthTotal > 0 ? ` · ${formatEUR(monthTotal)}` : ''}
                </StyledText>
              </View>

              {/* Events list */}
              <Card
                variant="outlined"
                padding="none"
                radius="md"
                style={{ marginHorizontal: SPACING.lg, overflow: 'hidden' }}
              >
                {monthEvents.map((event, idx) => {
                  const day = event.eventDate.split('-')[2] ?? '';
                  const assetName = getAssetName(event.assetId);
                  const costLabel =
                    event.cost !== undefined && event.cost > 0
                      ? formatEUR(event.cost)
                      : undefined;
                  return (
                    <EventListItem
                      key={event.id}
                      day={day}
                      title={event.title}
                      assetName={assetName}
                      costLabel={costLabel}
                      eventType={event.eventType as string}
                      onPress={() => router.push(`/event/${event.id}`)}
                      isLast={idx === monthEvents.length - 1}
                    />
                  );
                })}
              </Card>
            </View>
          );
        })
      )}
    </Screen>
  );
}
