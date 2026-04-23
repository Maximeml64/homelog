// app/(tabs)/assets.tsx

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ASSET_CATEGORIES } from '../../constants/categories';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import { useAppStore } from '../../src/stores/appStore';
import { useAssetStore } from '../../src/stores/assetStore';
import { Asset } from '../../src/types';

type SortKey = 'name' | 'date' | 'category';

function getExtraDataBrandModel(asset: Asset): string | null {
  if (!asset.extraData) return null;
  const data = asset.extraData as Record<string, any>;
  const brand = data.brand ?? data.race ?? null;
  const model = data.model ?? null;
  if (brand && model) return `${brand} · ${model}`;
  if (brand) return brand;
  if (model) return model;
  return null;
}

export default function AssetsScreen() {
  const { assets, fetchAssets, fetchAssetCount, assetCount } = useAssetStore();
  const { canAddAsset } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchAssetCount();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchAssets();
    setRefreshing(false);
  }

  function handleAdd() {
    if (!canAddAsset(assetCount)) {
      router.push('/paywall');
      return;
    }
    router.push('/asset/add');
  }

  function cycleSortKey() {
    setSortKey(prev => {
      if (prev === 'date') return 'name';
      if (prev === 'name') return 'category';
      return 'date';
    });
  }

  const sortLabel: Record<SortKey, string> = {
    date: 'Date',
    name: 'Nom',
    category: 'Catégorie',
  };

  const filtered = assets
    .filter(a => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory ? a.categoryId === selectedCategory : true;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'fr');
      if (sortKey === 'category') return a.categoryId.localeCompare(b.categoryId);
      return b.createdAt.localeCompare(a.createdAt);
    });

  const getCategoryLabel = (id: string) =>
    ASSET_CATEGORIES.find(c => c.id === id)?.label ?? id;

  const getCategoryIcon = (id: string) =>
    ASSET_CATEGORIES.find(c => c.id === id)?.icon ?? '📦';

  const usedCategories = ASSET_CATEGORIES.filter(cat =>
    assets.some(a => a.categoryId === cat.id)
  );

  return (
    <View style={styles.container}>
      {/* Search + Sort */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un bien..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.sortButton} onPress={cycleSortKey}>
          <Text style={styles.sortButtonText}>↕ {sortLabel[sortKey]}</Text>
        </TouchableOpacity>
      </View>

      {/* Category filters */}
      {usedCategories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>
              Tous ({assets.length})
            </Text>
          </TouchableOpacity>
          {usedCategories.map(cat => {
            const count = assets.filter(a => a.categoryId === cat.id).length;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              >
                <Text style={[styles.filterChipText, selectedCategory === cat.id && styles.filterChipTextActive]}>
                  {cat.icon} {cat.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Compteur résultats */}
      {(search || selectedCategory) && (
        <View style={styles.resultsCount}>
          <Text style={styles.resultsCountText}>
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>
              {search || selectedCategory ? 'Aucun résultat' : 'Aucun bien enregistré'}
            </Text>
            {!search && !selectedCategory && (
              <Text style={styles.emptyText}>Ajoutez votre premier bien pour commencer</Text>
            )}
          </View>
        )}

        {filtered.map(asset => {
          const brandModel = getExtraDataBrandModel(asset);
          return (
            <TouchableOpacity
              key={asset.id}
              style={styles.assetCard}
              onPress={() => router.push(`/asset/${asset.id}`)}
            >
              <View style={styles.assetIconContainer}>
                {asset.coverImageUri ? (
                  <Image
                    source={{ uri: asset.coverImageUri }}
                    style={styles.assetCoverImage}
                  />
                ) : (
                  <Text style={styles.assetIconText}>{getCategoryIcon(asset.categoryId)}</Text>
                )}
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetCategory}>{getCategoryLabel(asset.categoryId)}</Text>
                {brandModel && (
                  <Text style={styles.assetBrand}>{brandModel}</Text>
                )}
              </View>
              <Text style={styles.assetChevron}>›</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  filtersContainer: { maxHeight: 52 },
  filtersContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: fontSize.sm, color: colors.textSecondary },
  filterChipTextActive: { color: colors.white, fontWeight: fontWeight.medium },
  resultsCount: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  resultsCountText: { fontSize: fontSize.sm, color: colors.textTertiary },
  list: { flex: 1 },
  listContent: { padding: spacing.md, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.sm },
  assetCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.sm,
  },
  assetIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  assetCoverImage: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
  },
  assetIconText: { fontSize: 22 },
  assetInfo: { flex: 1 },
  assetName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  assetCategory: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  assetBrand: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 2 },
  assetChevron: { fontSize: 22, color: colors.textTertiary },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.lg,
  },
  fabText: { color: colors.white, fontSize: 28, fontWeight: fontWeight.bold, lineHeight: 32 },
});
