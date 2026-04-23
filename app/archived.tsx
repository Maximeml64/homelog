// app/archived.tsx

import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ASSET_CATEGORIES } from '../constants/categories';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../constants/theme';
import { useAssetStore } from '../src/stores/assetStore';

export default function ArchivedScreen() {
  const { archivedAssets, fetchArchivedAssets, unarchiveAsset, removeAsset } = useAssetStore();

  useFocusEffect(
    useCallback(() => {
      fetchArchivedAssets();
    }, [])
  );

  function getCategoryIcon(categoryId: string): string {
    return ASSET_CATEGORIES.find(c => c.id === categoryId)?.icon ?? '📦';
  }

  function getCategoryLabel(categoryId: string): string {
    return ASSET_CATEGORIES.find(c => c.id === categoryId)?.label ?? categoryId;
  }

  function handleUnarchive(id: string, name: string) {
    Alert.alert(
      'Désarchiver',
      `Remettre "${name}" dans la liste principale ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désarchiver',
          onPress: async () => {
            await unarchiveAsset(id);
          },
        },
      ]
    );
  }

  function handleDelete(id: string, name: string) {
    Alert.alert(
      'Supprimer définitivement',
      `Supprimer "${name}" et tous ses événements ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await removeAsset(id);
            await fetchArchivedAssets();
          },
        },
      ]
    );
  }

  function getExtraDataBrandModel(asset: any): string | null {
    if (!asset.extraData) return null;
    const data = asset.extraData as Record<string, any>;
    const brand = data.brand ?? asset.brand ?? null;
    const model = data.model ?? asset.model ?? null;
    if (brand && model) return `${brand} · ${model}`;
    if (brand) return brand;
    if (model) return model;
    return null;
  }

  if (archivedAssets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>Aucun bien archivé</Text>
        <Text style={styles.emptySubtitle}>
          Les biens archivés apparaissent ici. Vous pouvez les désarchiver ou les supprimer définitivement.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>
        {archivedAssets.length} bien{archivedAssets.length > 1 ? 's' : ''} archivé{archivedAssets.length > 1 ? 's' : ''}
      </Text>

      {archivedAssets.map(asset => {
        const brandModel = getExtraDataBrandModel(asset);
        return (
          <View key={asset.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardMain}
              onPress={() => router.push(`/asset/${asset.id}`)}
            >
              <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>{getCategoryIcon(asset.categoryId)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{asset.name}</Text>
                <Text style={styles.cardCategory}>{getCategoryLabel(asset.categoryId)}</Text>
                {brandModel && (
                  <Text style={styles.cardBrand}>{brandModel}</Text>
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.unarchiveButton}
                onPress={() => handleUnarchive(asset.id, asset.name)}
              >
                <Text style={styles.unarchiveButtonText}>Restaurer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(asset.id, asset.name)}
              >
                <Text style={styles.deleteButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
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
  hint: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardIconText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  cardCategory: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  cardBrand: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 2 },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  unarchiveButton: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  unarchiveButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  deleteButton: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: fontWeight.medium,
  },
});
