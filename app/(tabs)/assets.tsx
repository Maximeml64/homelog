import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActionSheetIOS,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { router, useFocusEffect } from 'expo-router';
import { Camera, FileText, Plus, Trash2 } from 'lucide-react-native';
import {
  Screen,
  StyledText,
  SearchBar,
  Chip,
  AssetListItem,
  FAB,
  Card,
} from '../../components/ui';
import { COLORS, SPACING } from '../../constants/theme';
import { ASSET_CATEGORIES } from '../../constants/categories';
import { getEventsByAsset } from '../../src/repositories/eventRepository';
import { exportAssetPDF } from '../../src/services/pdfService';
import { useAssetStore } from '../../src/stores/assetStore';
import { useAppStore } from '../../src/stores/appStore';
import { getCategoryLabel } from '../../src/utils/format';
import type { Asset } from '../../src/types';

type SortKey = 'date' | 'name' | 'category';

const SORT_LABELS: Record<SortKey, string> = {
  date: 'Date',
  name: 'Nom',
  category: 'Catégorie',
};

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function getBrandModel(asset: Asset): string | undefined {
  const data = (asset.extraData ?? {}) as Record<string, unknown>;
  const brandOrRace = (data.brand ?? data.race) as string | undefined;
  const model = data.model as string | undefined;
  if (brandOrRace && model) return `${brandOrRace} · ${model}`;
  if (brandOrRace) return brandOrRace;
  if (model) return model;
  return undefined;
}

// ==================== SWIPE-TO-DELETE ROW ====================

interface SwipeableAssetRowProps {
  asset: Asset;
  isLast: boolean;
  onPress: () => void;
  onDelete: () => void;
  onExport: () => void;
}

function SwipeableAssetRow({
  asset,
  isLast,
  onPress,
  onDelete,
  onExport,
}: SwipeableAssetRowProps) {
  const swipeRef = useRef<Swipeable>(null);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Supprimer ce bien',
      `Voulez-vous vraiment supprimer "${asset.name}" ? Cette action est définitive.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => swipeRef.current?.close(),
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            swipeRef.current?.close();
            onDelete();
          },
        },
      ],
    );
  }, [asset.name, onDelete]);

  const triggerExport = useCallback(() => {
    swipeRef.current?.close();
    onExport();
  }, [onExport]);

  const renderRightActions = useCallback(() => (
    <TouchableOpacity
      onPress={confirmDelete}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Supprimer le bien"
      style={{
        width: 84,
        backgroundColor: COLORS.danger,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <Trash2 color="#fff" size={22} strokeWidth={2} />
      <StyledText
        variant="caption"
        color="#fff"
        style={{ fontWeight: '700', letterSpacing: 0.3 }}
      >
        Supprimer
      </StyledText>
    </TouchableOpacity>
  ), [confirmDelete]);

  const renderLeftActions = useCallback(() => (
    <TouchableOpacity
      onPress={triggerExport}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Exporter le bien en PDF"
      style={{
        width: 84,
        backgroundColor: COLORS.accentDark,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <FileText color="#fff" size={22} strokeWidth={2} />
      <StyledText
        variant="caption"
        color="#fff"
        style={{ fontWeight: '700', letterSpacing: 0.3 }}
      >
        Exporter
      </StyledText>
    </TouchableOpacity>
  ), [triggerExport]);

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      rightThreshold={40}
      leftThreshold={40}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
    >
      <View style={{ backgroundColor: COLORS.surface }}>
        <AssetListItem
          imageUri={asset.coverImageUri}
          name={asset.name}
          category={getCategoryLabel(asset.categoryId)}
          categoryId={asset.categoryId}
          brandModel={getBrandModel(asset)}
          onPress={onPress}
          isLast={isLast}
        />
      </View>
    </Swipeable>
  );
}

export default function AssetsScreen() {
  const assets = useAssetStore((s) => s.assets);
  const assetCount = useAssetStore((s) => s.assetCount);
  const fetchAssets = useAssetStore((s) => s.fetchAssets);
  const fetchAssetCount = useAssetStore((s) => s.fetchAssetCount);
  const removeAsset = useAssetStore((s) => s.removeAsset);
  const canAddAsset = useAppStore((s) => s.canAddAsset);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAssets();
      fetchAssetCount();
    }, [fetchAssets, fetchAssetCount]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAssets(), fetchAssetCount()]);
    setRefreshing(false);
  }, [fetchAssets, fetchAssetCount]);

  const usedCategories = useMemo(() => {
    const used = new Set(assets.map((a) => a.categoryId));
    return ASSET_CATEGORIES.filter((c) => used.has(c.id));
  }, [assets]);

  const visibleAssets = useMemo(() => {
    let list = [...assets];
    if (selectedCategory) {
      list = list.filter((a) => a.categoryId === selectedCategory);
    }
    if (search.trim()) {
      const q = normalize(search.trim());
      list = list.filter((a) => normalize(a.name).includes(q));
    }
    list.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'fr');
      if (sortKey === 'category') return a.categoryId.localeCompare(b.categoryId);
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });
    return list;
  }, [assets, selectedCategory, search, sortKey]);

  const isFiltered = search.trim().length > 0 || selectedCategory !== null;

  const handleSortPress = () => {
    const options: SortKey[] = ['date', 'name', 'category'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Trier par',
          options: ['Date', 'Nom', 'Catégorie', 'Annuler'],
          cancelButtonIndex: 3,
        },
        (idx) => {
          if (idx !== undefined && idx >= 0 && idx < 3) {
            setSortKey(options[idx]);
          }
        },
      );
    } else {
      Alert.alert('Trier par', undefined, [
        { text: 'Date', onPress: () => setSortKey('date') },
        { text: 'Nom', onPress: () => setSortKey('name') },
        { text: 'Catégorie', onPress: () => setSortKey('category') },
        { text: 'Annuler', style: 'cancel' },
      ]);
    }
  };

  const handleAdd = () => {
    if (canAddAsset(assetCount)) {
      router.push('/asset/add');
    } else {
      router.push('/paywall');
    }
  };

  const handleScan = () => {
    router.push('/asset/scan-invoice');
  };

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await removeAsset(id);
        await fetchAssetCount();
      } catch {
        Alert.alert('Erreur', "Impossible de supprimer ce bien.");
      }
    },
    [removeAsset, fetchAssetCount],
  );

  const handleExport = useCallback(async (asset: Asset) => {
    try {
      const events = await getEventsByAsset(asset.id);
      await exportAssetPDF(asset, events);
    } catch {
      Alert.alert('Erreur', "L'export PDF a échoué.");
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Screen
        contentContainerStyle={{ paddingBottom: 160 }}
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
          <StyledText variant="eyebrow">MES BIENS</StyledText>
          <StyledText variant="h2" style={{ marginTop: SPACING.xs }}>
            Vos biens
          </StyledText>
          <StyledText variant="small" style={{ marginTop: 2 }}>
            {assets.length === 0
              ? 'Aucun bien'
              : `${assets.length} ${assets.length > 1 ? 'enregistrés' : 'enregistré'}`}
          </StyledText>
        </View>

        {/* SEARCH + SORT */}
        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un bien…"
            onSortPress={handleSortPress}
            sortLabel={SORT_LABELS[sortKey]}
          />
        </View>

        {/* CATEGORY CHIPS */}
        {usedCategories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SPACING.lg,
              gap: SPACING.sm,
            }}
            style={{ marginBottom: SPACING.md, flexGrow: 0 }}
          >
            <Chip
              label={`Tous (${assets.length})`}
              selected={selectedCategory === null}
              onPress={() => setSelectedCategory(null)}
            />
            {usedCategories.map((c) => {
              const count = assets.filter((a) => a.categoryId === c.id).length;
              return (
                <Chip
                  key={c.id}
                  label={`${c.label} (${count})`}
                  selected={selectedCategory === c.id}
                  onPress={() =>
                    setSelectedCategory((prev) => (prev === c.id ? null : c.id))
                  }
                />
              );
            })}
          </ScrollView>
        )}

        {/* RESULT COUNT IF FILTERED */}
        {isFiltered && (
          <View
            style={{
              paddingHorizontal: SPACING.lg,
              marginBottom: SPACING.sm,
            }}
          >
            <StyledText variant="eyebrow" color={COLORS.textTertiary}>
              {visibleAssets.length}{' '}
              {visibleAssets.length > 1 ? 'résultats' : 'résultat'}
            </StyledText>
          </View>
        )}

        {/* LIST OR EMPTY */}
        {visibleAssets.length === 0 ? (
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
              {isFiltered ? 'Aucun résultat' : 'Aucun bien enregistré'}
            </StyledText>
            <StyledText
              variant="body"
              color={COLORS.textSecondary}
              align="center"
            >
              {isFiltered
                ? 'Essayez de modifier votre recherche ou vos filtres.'
                : 'Ajoutez votre premier bien avec le bouton + en bas à droite.'}
            </StyledText>
          </View>
        ) : (
          <Card
            variant="outlined"
            padding="none"
            radius="md"
            style={{ marginHorizontal: SPACING.lg, overflow: 'hidden' }}
          >
            {visibleAssets.map((asset, idx) => (
              <SwipeableAssetRow
                key={asset.id}
                asset={asset}
                isLast={idx === visibleAssets.length - 1}
                onPress={() => router.push(`/asset/${asset.id}`)}
                onDelete={() => handleDelete(asset.id)}
                onExport={() => handleExport(asset)}
              />
            ))}
          </Card>
        )}
      </Screen>

      {/* FABs stack */}
      <View
        style={{
          position: 'absolute',
          right: SPACING.lg,
          bottom: SPACING.lg,
          gap: SPACING.sm,
          alignItems: 'flex-end',
        }}
      >
        <FAB
          icon={Camera}
          onPress={handleScan}
          variant="accent"
          accessibilityLabel="Scanner une facture"
        />
        <FAB
          icon={Plus}
          onPress={handleAdd}
          variant="primary"
          accessibilityLabel="Ajouter un bien"
        />
      </View>
    </View>
  );
}
