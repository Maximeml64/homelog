import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { StyledText } from './StyledText';
import { CategoryIcon } from './CategoryIcon';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';

export type ReminderUrgency = 'overdue' | 'soon' | 'normal' | 'later';

const URGENCY_COLOR: Record<ReminderUrgency, string> = {
  overdue: COLORS.danger,
  soon: COLORS.warning,
  normal: COLORS.primary,
  later: COLORS.textSecondary,
};

interface ReminderRowProps {
  title: string;
  assetName?: string;
  categoryId: string;
  countdownLabel: string;
  dueDateLabel: string;
  costLabel?: string;
  urgency: ReminderUrgency;
  onPress: () => void;
  isLast?: boolean;
  style?: ViewStyle;
}

export function ReminderRow({
  title,
  assetName,
  categoryId,
  countdownLabel,
  dueDateLabel,
  costLabel,
  urgency,
  onPress,
  isLast = false,
  style,
}: ReminderRowProps) {
  const urgencyColor = URGENCY_COLOR[urgency];
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
      {/* Icône catégorie */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: RADIUS.sm,
          backgroundColor: COLORS.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CategoryIcon
          categoryId={categoryId}
          size={18}
          color={COLORS.textSecondary}
        />
      </View>

      {/* Title + asset + cost inline */}
      <View style={{ flex: 1, gap: 2 }}>
        <StyledText variant="bodyMedium" numberOfLines={1}>
          {title}
        </StyledText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {assetName && (
            <StyledText
              variant="small"
              color={COLORS.textSecondary}
              numberOfLines={1}
              style={{ flexShrink: 1 }}
            >
              {assetName}
            </StyledText>
          )}
          {costLabel && (
            <>
              <StyledText variant="small" color={COLORS.textTertiary}>·</StyledText>
              <StyledText
                variant="small"
                color={COLORS.accentDark}
                style={{
                  fontVariant: ['tabular-nums'],
                  fontFamily: FONTS.sansMedium,
                }}
              >
                {costLabel}
              </StyledText>
            </>
          )}
        </View>
      </View>

      {/* Countdown badge + date */}
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <StyledText
          variant="caption"
          color={urgencyColor}
          style={{
            fontSize: 11,
            fontFamily: FONTS.sansSemiBold,
            letterSpacing: 0.3,
          }}
        >
          {countdownLabel}
        </StyledText>
        <StyledText variant="caption" color={COLORS.textTertiary}>
          {dueDateLabel}
        </StyledText>
      </View>
    </Pressable>
  );
}

export default ReminderRow;
