// app/(tabs)/index.tsx

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { ASSET_CATEGORIES } from '../../constants/categories';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import { useAppStore } from '../../src/stores/appStore';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function formatDisplayDate(iso: string): string {
  if (iso.includes('-')) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  return iso;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatFullDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

interface MonthlyChartProps {
  data: { month: number; total: number }[];
}

function MonthlyChart({ data }: MonthlyChartProps) {
  const width = 320;
  const height = 120;
  const paddingLeft = 8;
  const paddingRight = 8;
  const paddingTop = 8;
  const paddingBottom = 24;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const barWidth = chartWidth / 12 - 4;
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const currentMonth = new Date().getMonth();

  return (
    <Svg width={width} height={height}>
      {data.map((d, i) => {
        const barHeight = Math.max((d.total / maxVal) * chartHeight, d.total > 0 ? 4 : 0);
        const x = paddingLeft + i * (chartWidth / 12) + 2;
        const y = paddingTop + chartHeight - barHeight;
        const isCurrentMonth = i === currentMonth;
        return (
          <Rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={3}
            fill={isCurrentMonth ? colors.primary : colors.primaryLight}
          />
        );
      })}
      {data.map((d, i) => {
        const x = paddingLeft + i * (chartWidth / 12) + barWidth / 2 + 2;
        return (
          <SvgText
            key={i}
            x={x}
            y={height - 6}
            fontSize={8}
            fill={colors.textTertiary}
            textAnchor="middle"
          >
            {MONTHS_SHORT[i]}
          </SvgText>
        );
      })}
    </Svg>
  );
}

export default function HomeScreen() {
  const { assets, fetchAssets } = useAssetStore();
  const {
    upcomingReminders,
    fetchUpcomingReminders,
    getYearlyCost,
    getUpcomingCost,
    getMonthlyCosts,
    getCostByCategory,
    getTotalPatrimony,
  } = useEventStore();
  const { userName } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [annualCost, setAnnualCost] = useState(0);
  const [upcomingCost, setUpcomingCost] = useState(0);
  const [monthlyCosts, setMonthlyCosts] = useState<{ month: number; total: number }[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ categoryId: string; total: number }[]>([]);
  const [patrimony, setPatrimony] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const year = new Date().getFullYear();
    await fetchAssets();
    await fetchUpcomingReminders();
    const [cost, upcoming, monthly, categories, pat] = await Promise.all([
      getYearlyCost(year),
      getUpcomingCost(),
      getMonthlyCosts(year),
      getCostByCategory(year),
      getTotalPatrimony(),
    ]);
    setAnnualCost(cost);
    setUpcomingCost(upcoming);
    setMonthlyCosts(monthly);
    setCategoryStats(categories.slice(0, 4));
    setPatrimony(pat);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const today = new Date().toISOString().split('T')[0];
  const overdue = upcomingReminders.filter(r => r.nextDueDate && r.nextDueDate < today);
  const upcoming = upcomingReminders.filter(r => r.nextDueDate && r.nextDueDate >= today).slice(0, 3);

  function getCategoryIcon(categoryId: string): string {
    return ASSET_CATEGORIES.find(c => c.id === categoryId)?.icon ?? '📦';
  }

  function getCategoryLabel(categoryId: string): string {
    return ASSET_CATEGORIES.find(c => c.id === categoryId)?.label ?? categoryId;
  }

  const totalCategorySpend = categoryStats.reduce((s, c) => s + c.total, 0);
  const hasChartData = monthlyCosts.some(m => m.total > 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroDate}>{formatFullDate()}</Text>
        <Text style={styles.heroGreeting}>
          {getGreeting()}{userName ? `, ${userName}` : ''}
        </Text>
        <View style={styles.heroDivider} />
        <Text style={styles.heroSub}>
          {assets.length} bien{assets.length > 1 ? 's' : ''} · {upcomingReminders.length} rappel{upcomingReminders.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{annualCost.toFixed(0)} €</Text>
          <Text style={styles.statLabel}>Dépensé en {new Date().getFullYear()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, upcomingCost > 0 && styles.statValueAccent]}>
            {upcomingCost.toFixed(0)} €
          </Text>
          <Text style={styles.statLabel}>À venir</Text>
        </View>
        {patrimony > 0 && (
          <View style={[styles.statCard, styles.statCardFull]}>
            <Text style={styles.statValue}>{patrimony.toFixed(0)} €</Text>
            <Text style={styles.statLabel}>Valeur d'achat totale des biens</Text>
          </View>
        )}
      </View>

      {/* Graphique mensuel */}
      {hasChartData && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Dépenses {new Date().getFullYear()}</Text>
          <MonthlyChart data={monthlyCosts} />
        </View>
      )}

      {/* Répartition par catégorie */}
      {categoryStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Par catégorie</Text>
          <View style={styles.categoryStatsCard}>
            {categoryStats.map((c, i) => {
              const pct = totalCategorySpend > 0 ? (c.total / totalCategorySpend) * 100 : 0;
              return (
                <View key={c.categoryId} style={[styles.categoryStatRow, i > 0 && styles.categoryStatBorder]}>
                  <Text style={styles.categoryStatIcon}>{getCategoryIcon(c.categoryId)}</Text>
                  <View style={styles.categoryStatInfo}>
                    <View style={styles.categoryStatHeader}>
                      <Text style={styles.categoryStatLabel}>{getCategoryLabel(c.categoryId)}</Text>
                      <Text style={styles.categoryStatValue}>{c.total.toFixed(0)} €</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* En retard */}
      {overdue.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ En retard</Text>
          {overdue.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[styles.reminderCard, styles.overdueCard]}
              onPress={() => router.push(`/event/${r.id}`)}
            >
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderTitle}>{r.title}</Text>
                <Text style={styles.reminderDate}>{formatDisplayDate(r.nextDueDate!)}</Text>
              </View>
              <Text style={styles.overdueLabel}>En retard</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Prochains rappels */}
      {upcoming.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Prochains rappels</Text>
          {upcoming.map(r => (
            <TouchableOpacity
              key={r.id}
              style={styles.reminderCard}
              onPress={() => router.push(`/event/${r.id}`)}
            >
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderTitle}>{r.title}</Text>
                <Text style={styles.reminderDate}>{formatDisplayDate(r.nextDueDate!)}</Text>
              </View>
              {r.reminderEnabled && <Text style={styles.notifIcon}>🔔</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Mes biens */}
      {assets.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes biens</Text>
            {assets.length > 3 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/assets')}>
                <Text style={styles.sectionLink}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>
          {assets.slice(0, 3).map(a => (
            <TouchableOpacity
              key={a.id}
              style={styles.assetCard}
              onPress={() => router.push(`/asset/${a.id}`)}
            >
              <Text style={styles.assetIcon}>{getCategoryIcon(a.categoryId)}</Text>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>{a.name}</Text>
                <Text style={styles.assetCategory}>{getCategoryLabel(a.categoryId)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty state */}
      {assets.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={styles.emptyTitle}>Aucun bien enregistré</Text>
          <Text style={styles.emptyText}>Ajoutez votre premier bien pour commencer</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/asset/add')}>
            <Text style={styles.addButtonText}>+ Ajouter un bien</Text>
          </TouchableOpacity>
        </View>
      )}

      {assets.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/asset/add')}>
          <Text style={styles.fabText}>+ Ajouter un bien</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 100 },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  heroDate: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
  },
  heroGreeting: {
    fontSize: 38,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  heroDivider: {
    width: 32,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  heroSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.sm,
  },
  statCardFull: { flexBasis: '100%', flex: 0 },
  statValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  statValueAccent: { color: colors.accent },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  section: { marginBottom: spacing.lg, paddingHorizontal: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionLink: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.medium },
  categoryStatsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  categoryStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  categoryStatBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  categoryStatIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  categoryStatInfo: { flex: 1 },
  categoryStatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  categoryStatLabel: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  categoryStatValue: { fontSize: fontSize.sm, color: colors.accent, fontWeight: fontWeight.semibold },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.sm,
  },
  overdueCard: { borderLeftWidth: 3, borderLeftColor: colors.danger },
  reminderInfo: { flex: 1 },
  reminderTitle: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
  reminderDate: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  overdueLabel: { fontSize: fontSize.xs, color: colors.danger, fontWeight: fontWeight.semibold },
  notifIcon: { fontSize: 14 },
  assetCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.sm,
  },
  assetIcon: { fontSize: 24 },
  assetInfo: { flex: 1 },
  assetName: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
  assetCategory: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  addButtonText: { color: colors.white, fontWeight: fontWeight.semibold, fontSize: fontSize.md },
  fab: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.md,
  },
  fabText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
});
