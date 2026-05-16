import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Camera,
  Plus,
  Search,
  History as HistoryIcon,
} from 'lucide-react-native';
import {
  AddTile,
  AssetTile,
  ErrorBanner,
  MiniKPI,
  QuickAction,
  ReminderCard,
  Screen,
  SectionHeader,
  Separator,
  StyledText,
} from '../../components/ui';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { useAppStore } from '../../src/stores/appStore';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';
import {
  formatEUR,
  getGreeting,
  formatFullDate,
  formatShortDate,
  getCountdown,
  getCategoryLabel,
} from '../../src/utils/format';
import type { MaintenanceEvent } from '../../src/types';

const PAD = SPACING.lg;

export default function HomeScreen() {
  const userName = useAppStore((s) => s.userName);
  const assets = useAssetStore((s) => s.assets);
  const fetchAssets = useAssetStore((s) => s.fetchAssets);
  const assetError = useAssetStore((s) => s.error);
  const clearAssetError = useAssetStore((s) => s.clearError);
  const upcomingReminders = useEventStore((s) => s.upcomingReminders);
  const fetchUpcomingReminders = useEventStore((s) => s.fetchUpcomingReminders);
  const eventError = useEventStore((s) => s.error);
  const clearEventError = useEventStore((s) => s.clearError);
  const getTotalPatrimony = useEventStore((s) => s.getTotalPatrimony);
  const getYearlyCost = useEventStore((s) => s.getYearlyCost);
  const getUpcomingCost = useEventStore((s) => s.getUpcomingCost);

  const errorMessage = assetError ?? eventError;

  const [refreshing, setRefreshing] = useState(false);
  const [patrimony, setPatrimony] = useState(0);
  const [yearlyCost, setYearlyCost] = useState(0);
  const [upcomingCost, setUpcomingCost] = useState(0);

  const now = new Date();
  const greeting = getGreeting(now);
  const dateLabel = formatFullDate(now);
  const currentYear = now.getFullYear();

  const loadAggregates = useCallback(async () => {
    const [patri, yearly, upc] = await Promise.all([
      getTotalPatrimony(),
      getYearlyCost(currentYear),
      getUpcomingCost(),
    ]);
    setPatrimony(patri);
    setYearlyCost(yearly);
    setUpcomingCost(upc);
  }, [getTotalPatrimony, getYearlyCost, getUpcomingCost, currentYear]);

  // Premier chargement au montage, avec retry défensif si le store reste vide
  // après la première tentative (cas observé au cold-start sur certains devices).
  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.all([fetchAssets(), fetchUpcomingReminders()]);
      if (!active) return;
      const { assets: a } = useAssetStore.getState();
      const { upcomingReminders: r } = useEventStore.getState();
      if (a.length === 0 && r.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (!active) return;
        await Promise.all([fetchAssets(), fetchUpcomingReminders()]);
      }
      if (active) await loadAggregates();
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh à chaque retour sur l'onglet (après navigation).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await Promise.all([fetchAssets(), fetchUpcomingReminders()]);
        if (active) await loadAggregates();
      })();
      return () => {
        active = false;
      };
    }, [fetchAssets, fetchUpcomingReminders, loadAggregates]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAssets(), fetchUpcomingReminders()]);
    await loadAggregates();
    setRefreshing(false);
  }, [fetchAssets, fetchUpcomingReminders, loadAggregates]);

  // Rappels triés par échéance, top 6
  const sortedReminders: MaintenanceEvent[] = [...upcomingReminders]
    .sort((a, b) => (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''))
    .slice(0, 6);

  const recentAssets = assets.slice(0, 3);
  const showAddTile = recentAssets.length > 0 && recentAssets.length < 3;

  const getAssetName = (assetId: string) =>
    assets.find((a) => a.id === assetId)?.name;

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
      {errorMessage && (
        <View style={{ paddingTop: SPACING.md }}>
          <ErrorBanner
            message={errorMessage}
            onRetry={() => {
              clearAssetError();
              clearEventError();
              onRefresh();
            }}
            onDismiss={() => {
              clearAssetError();
              clearEventError();
            }}
          />
        </View>
      )}

      {/* HEADER ÉDITORIAL */}
      <View style={{ paddingHorizontal: PAD, paddingTop: SPACING.lg, paddingBottom: SPACING.md }}>
        <StyledText variant="eyebrow">{dateLabel.toUpperCase()}</StyledText>
        <View style={{ marginTop: SPACING.sm }}>
          <StyledText variant="h1">{greeting},</StyledText>
          <StyledText variant="h1">
            {userName ? `${userName}.` : 'bienvenue.'}
          </StyledText>
        </View>

        <Separator variant="accent" style={{ marginVertical: SPACING.lg }} />

        <StyledText variant="eyebrow">PATRIMOINE TOTAL</StyledText>
        <StyledText variant="display" style={{ marginTop: SPACING.xs }}>
          {formatEUR(patrimony)}
        </StyledText>
      </View>

      {/* QUICK ACTIONS RIBBON */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: PAD,
          paddingVertical: SPACING.md,
          gap: SPACING.md,
        }}
      >
        <QuickAction
          icon={Camera}
          label="Scanner"
          onPress={() => router.push('/asset/scan-invoice')}
        />
        <QuickAction
          icon={Plus}
          label="Ajouter"
          onPress={() => router.push('/asset/add')}
        />
        <QuickAction
          icon={Search}
          label="Recherche"
          onPress={() => router.push('/search')}
        />
        <QuickAction
          icon={HistoryIcon}
          label="Historique"
          onPress={() => router.push('/history')}
        />
      </View>

      {/* MINI KPIs */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: PAD,
          paddingVertical: SPACING.lg,
          gap: SPACING.xl,
        }}
      >
        <MiniKPI
          label={`DÉPENSES ${currentYear}`}
          value={formatEUR(yearlyCost)}
          subtitle={yearlyCost === 0 ? 'Aucune dépense' : undefined}
        />
        <MiniKPI
          label="À VENIR"
          value={formatEUR(upcomingCost)}
          subtitle={upcomingCost > 0 ? 'sur les prochains mois' : 'Rien de prévu'}
          accent
        />
      </View>

      {/* PROCHAINS RAPPELS */}
      {sortedReminders.length > 0 && (
        <View style={{ marginTop: SPACING.md }}>
          <View style={{ paddingHorizontal: PAD }}>
            <SectionHeader
              eyebrow="Prochains rappels"
              actionLabel={
                upcomingReminders.length > sortedReminders.length ? 'Tout voir' : undefined
              }
              onActionPress={() => router.push('/reminders')}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: PAD }}
          >
            {sortedReminders.map((reminder) => {
              const cd = reminder.nextDueDate
                ? getCountdown(reminder.nextDueDate)
                : { text: 'Sans date', isOverdue: false };
              const due = reminder.nextDueDate
                ? formatShortDate(reminder.nextDueDate)
                : '';
              return (
                <ReminderCard
                  key={reminder.id}
                  title={reminder.title}
                  dueDate={due}
                  countdown={cd.text}
                  assetName={getAssetName(reminder.assetId)}
                  isOverdue={cd.isOverdue}
                  onPress={() => router.push(`/event/${reminder.id}`)}
                />
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* MES BIENS */}
      <View style={{ marginTop: SPACING.xl, paddingHorizontal: PAD }}>
        <SectionHeader
          eyebrow={
            assets.length > 0 ? `Mes biens (${assets.length})` : 'Mes biens'
          }
          actionLabel={assets.length > recentAssets.length ? 'Tout voir' : undefined}
          onActionPress={() => router.push('/assets')}
        />

        {assets.length === 0 ? (
          <View
            style={{
              backgroundColor: COLORS.surfaceAlt,
              padding: SPACING.xl,
              borderRadius: RADIUS.md,
              alignItems: 'center',
              gap: SPACING.md,
            }}
          >
            <StyledText
              variant="body"
              color={COLORS.textSecondary}
              align="center"
            >
              Aucun bien pour l'instant.{'\n'}Ajoutez-en un ou scannez une facture pour commencer.
            </StyledText>
            <Pressable
              onPress={() => router.push('/asset/add')}
              style={({ pressed }) => [
                {
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: SPACING.sm + 2,
                  borderRadius: RADIUS.sm,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <StyledText variant="smallMedium" color={COLORS.textInverse}>
                Ajouter mon premier bien
              </StyledText>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            {recentAssets.map((asset) => (
              <AssetTile
                key={asset.id}
                imageUri={asset.coverImageUri}
                name={asset.name}
                category={getCategoryLabel(asset.categoryId)}
                categoryId={asset.categoryId}
                onPress={() => router.push(`/asset/${asset.id}`)}
              />
            ))}
            {showAddTile && <AddTile onPress={() => router.push('/asset/add')} />}
          </View>
        )}
      </View>
    </Screen>
  );
}
