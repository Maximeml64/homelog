import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { StyledText } from './StyledText';
import { EventTypeIcon } from './EventTypeIcon';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface EventListItemProps {
  day: string;
  title: string;
  assetName?: string;
  costLabel?: string;
  eventType: string;
  onPress: () => void;
  isLast?: boolean;
  style?: ViewStyle;
}

export function EventListItem({
  day,
  title,
  assetName,
  costLabel,
  eventType,
  onPress,
  isLast = false,
  style,
}: EventListItemProps) {
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
      {/* Day badge */}
      <View style={{ width: 36, alignItems: 'center' }}>
        <StyledText
          variant="h3"
          color={COLORS.text}
          style={{ fontSize: 22, lineHeight: 26 }}
        >
          {day}
        </StyledText>
      </View>

      {/* Icône type événement */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: RADIUS.sm,
          backgroundColor: COLORS.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <EventTypeIcon
          eventType={eventType}
          size={16}
          color={COLORS.textSecondary}
        />
      </View>

      {/* Title + asset */}
      <View style={{ flex: 1, gap: 2 }}>
        <StyledText variant="bodyMedium" numberOfLines={1}>
          {title}
        </StyledText>
        {assetName && (
          <StyledText variant="small" color={COLORS.textSecondary} numberOfLines={1}>
            {assetName}
          </StyledText>
        )}
      </View>

      {/* Cost */}
      {costLabel ? (
        <StyledText variant="numericMedium" color={COLORS.accentDark}>
          {costLabel}
        </StyledText>
      ) : (
        <StyledText variant="small" color={COLORS.textTertiary}>
          —
        </StyledText>
      )}
    </Pressable>
  );
}

export default EventListItem;
