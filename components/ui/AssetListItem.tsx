import React from 'react';
import { View, Pressable, Image, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { StyledText } from './StyledText';
import { CategoryIcon } from './CategoryIcon';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface AssetListItemProps {
  imageUri?: string;
  name: string;
  category: string;
  categoryId: string;
  brandModel?: string;
  onPress: () => void;
  isLast?: boolean;
  style?: ViewStyle;
}

export function AssetListItem({
  imageUri,
  name,
  category,
  categoryId,
  brandModel,
  onPress,
  isLast = false,
  style,
}: AssetListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.md,
          paddingHorizontal: SPACING.base,
          gap: SPACING.md,
          borderBottomWidth: isLast ? 0 : 0.5,
          borderBottomColor: COLORS.border,
        },
        pressed && { backgroundColor: COLORS.surfaceAlt },
        style,
      ]}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: RADIUS.sm,
          backgroundColor: COLORS.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <CategoryIcon
            categoryId={categoryId}
            size={20}
            color={COLORS.textSecondary}
          />
        )}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <StyledText variant="bodyMedium" numberOfLines={1}>
          {name}
        </StyledText>
        <StyledText variant="eyebrow" numberOfLines={1} style={{ fontSize: 10 }}>
          {category}
        </StyledText>
        {brandModel && (
          <StyledText variant="caption" color={COLORS.textTertiary} numberOfLines={1}>
            {brandModel}
          </StyledText>
        )}
      </View>

      <ChevronRight size={16} color={COLORS.textTertiary} strokeWidth={2} />
    </Pressable>
  );
}

export default AssetListItem;
