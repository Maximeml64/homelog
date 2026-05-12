import React from 'react';
import { View, Pressable, Image, ViewStyle } from 'react-native';
import { Plus } from 'lucide-react-native';
import { StyledText } from './StyledText';
import { CategoryIcon } from './CategoryIcon';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface AssetTileProps {
  imageUri?: string;
  name: string;
  category: string;
  categoryId: string;
  onPress: () => void;
  style?: ViewStyle;
}

interface AddTileProps {
  onPress: () => void;
  style?: ViewStyle;
}

const TILE_RATIO = 1; // carré

export function AssetTile({
  imageUri,
  name,
  category,
  categoryId,
  onPress,
  style,
}: AssetTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          backgroundColor: COLORS.surface,
          borderRadius: RADIUS.md,
          overflow: 'hidden',
          ...SHADOWS.sm,
        },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <View
        style={{
          aspectRatio: TILE_RATIO,
          backgroundColor: COLORS.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <CategoryIcon categoryId={categoryId} size={32} color={COLORS.textSecondary} />
        )}
      </View>
      <View style={{ padding: SPACING.md, gap: 2 }}>
        <StyledText variant="title" numberOfLines={1} style={{ fontSize: 14, lineHeight: 18 }}>
          {name}
        </StyledText>
        <StyledText variant="eyebrow" numberOfLines={1} style={{ fontSize: 10, letterSpacing: 1.2 }}>
          {category}
        </StyledText>
      </View>
    </Pressable>
  );
}

export function AddTile({ onPress, style }: AddTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          aspectRatio: 0.72,
          borderRadius: RADIUS.md,
          borderWidth: 1.5,
          borderColor: COLORS.borderStrong,
          borderStyle: 'dashed',
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.sm,
        },
        pressed && { opacity: 0.6 },
        style,
      ]}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: COLORS.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plus size={18} color={COLORS.primary} strokeWidth={2.5} />
      </View>
      <StyledText variant="caption" color={COLORS.textSecondary} align="center">
        Ajouter
      </StyledText>
    </Pressable>
  );
}

export default AssetTile;
