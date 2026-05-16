import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { StyledText } from './StyledText';
import { COLORS, HIT_SLOP, RADIUS } from '../../constants/theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Chip({ label, selected, onPress, size = 'md', style }: ChipProps) {
  const paddingV = size === 'sm' ? 6 : 8;
  const paddingH = size === 'sm' ? 12 : 16;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      style={({ pressed }) => [
        {
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          borderRadius: RADIUS.full,
          backgroundColor: selected ? COLORS.primary : 'transparent',
          borderWidth: 1,
          borderColor: selected ? COLORS.primary : COLORS.borderStrong,
          alignSelf: 'flex-start',
        },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <StyledText
        variant="smallMedium"
        color={selected ? COLORS.textInverse : COLORS.textSecondary}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}

export default Chip;
