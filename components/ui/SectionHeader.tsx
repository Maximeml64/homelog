import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { StyledText } from './StyledText';
import { COLORS, SPACING, HIT_SLOP } from '../../constants/theme';

interface SectionHeaderProps {
  eyebrow: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({
  eyebrow,
  actionLabel,
  onActionPress,
  style,
}: SectionHeaderProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACING.md,
        },
        style,
      ]}
    >
      <StyledText variant="eyebrow">{eyebrow}</StyledText>
      {actionLabel && onActionPress && (
        <Pressable
          onPress={onActionPress}
          hitSlop={HIT_SLOP}
          style={({ pressed }) => [
            { flexDirection: 'row', alignItems: 'center', gap: 2 },
            pressed && { opacity: 0.6 },
          ]}
        >
          <StyledText variant="smallMedium" color={COLORS.accentDark}>
            {actionLabel}
          </StyledText>
          <ChevronRight size={14} color={COLORS.accentDark} strokeWidth={2.5} />
        </Pressable>
      )}
    </View>
  );
}

export default SectionHeader;
