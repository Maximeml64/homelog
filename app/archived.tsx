// app/archived.tsx

import React, { useCallback } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Archive, RotateCcw, Trash2 } from 'lucide-react-native';
import {
  Card,
  CategoryIcon,
  Screen,
  StyledText,
} from '../components/ui';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAssetStore } from '../src/stores/assetStore';
import { getCategoryLabel } from '../src/utils/format';
import type { Asset } from '../src/types';

function getBrandModel(asset: Asset): string | null {
  const data = asset.extraData as Record<string, any> | undefined;
  const brand = data?.brand ?? asset.brand ?? null;
  const model = data?.model ?? asset.model ?? null;
  if (brand && model) return `${brand} · ${model}`;
  return brand ?? model ?? null;
}

export default function ArchivedScreen() {
  const {
    archivedAssets,
    fetchArchivedAssets,
    unarchiveAsset,
    removeAsset,
  } = useAssetStore();

  useFocusEffect(
    useCallback(() => {
      fetchArchivedAssets();
    }, [fetchArchivedAssets]),
  );

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
      ],
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
      ],
    );
  }

  if (archivedAssets.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: SPACING.xl,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: COLORS.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.lg,
          }}
        >
          <Archive
            size={28}
            color={COLORS.textTertiary}
            strokeWidth={1.5}
          />
        </View>
        <StyledText variant="h3" align="center">
          Aucun bien archivé
        </StyledText>
        <StyledText
          variant="body"
          color={COLORS.textSecondary}
          align="center"
          style={{ marginTop: SPACING.sm, maxWidth: 300 }}
        >
          Les biens archivés apparaissent ici.{'\n'}
          Vous pouvez les restaurer ou les supprimer définitivement.
        </StyledText>
      </View>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingBottom: SPACING.xl }}>
      <View
        style={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.lg,
          paddingBottom: SPACING.md,
        }}
      >
        <StyledText variant="eyebrow">ARCHIVES</StyledText>
        <StyledText variant="h2" style={{ marginTop: SPACING.xs }}>
          {archivedAssets.length} bien
          {archivedAssets.length > 1 ? 's archivés' : ' archivé'}
        </StyledText>
      </View>

      <View
        style={{
          paddingHorizontal: SPACING.lg,
          gap: SPACING.md,
        }}
      >
        {archivedAssets.map((asset) => {
          const brandModel = getBrandModel(asset);
          return (
            <Card
              key={asset.id}
              variant="outlined"
              padding="none"
              radius="md"
              style={{ overflow: 'hidden' }}
            >
              <Pressable
                onPress={() => router.push(`/asset/${asset.id}`)}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: SPACING.base,
                    gap: SPACING.md,
                  },
                  pressed && { backgroundColor: COLORS.surfaceAlt },
                ]}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: RADIUS.sm,
                    backgroundColor: COLORS.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CategoryIcon
                    categoryId={asset.categoryId}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      paddingHorizontal: SPACING.sm,
                      paddingVertical: 2,
                      borderRadius: RADIUS.full,
                      backgroundColor: COLORS.surfaceAlt,
                      marginBottom: 4,
                    }}
                  >
                    <StyledText
                      variant="caption"
                      color={COLORS.textTertiary}
                      style={{
                        fontFamily: FONTS.sansSemiBold,
                        letterSpacing: 0.8,
                      }}
                    >
                      ARCHIVÉ
                    </StyledText>
                  </View>
                  <StyledText variant="bodyMedium" numberOfLines={1}>
                    {asset.name}
                  </StyledText>
                  <StyledText
                    variant="small"
                    color={COLORS.textSecondary}
                    numberOfLines={1}
                  >
                    {getCategoryLabel(asset.categoryId)}
                    {brandModel ? ` · ${brandModel}` : ''}
                  </StyledText>
                </View>
              </Pressable>
              <View
                style={{
                  flexDirection: 'row',
                  borderTopWidth: 0.5,
                  borderTopColor: COLORS.border,
                }}
              >
                <Pressable
                  onPress={() => handleUnarchive(asset.id, asset.name)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: SPACING.xs,
                      paddingVertical: SPACING.sm + 2,
                      borderRightWidth: 0.5,
                      borderRightColor: COLORS.border,
                    },
                    pressed && { opacity: 0.5 },
                  ]}
                >
                  <RotateCcw
                    size={14}
                    color={COLORS.primary}
                    strokeWidth={2}
                  />
                  <StyledText variant="smallMedium" color={COLORS.primary}>
                    Restaurer
                  </StyledText>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(asset.id, asset.name)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: SPACING.xs,
                      paddingVertical: SPACING.sm + 2,
                    },
                    pressed && { opacity: 0.5 },
                  ]}
                >
                  <Trash2
                    size={14}
                    color={COLORS.danger}
                    strokeWidth={2}
                  />
                  <StyledText variant="smallMedium" color={COLORS.danger}>
                    Supprimer
                  </StyledText>
                </Pressable>
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
