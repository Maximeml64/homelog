import React from 'react';
import { View, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

interface SeparatorProps {
  variant?: 'line' | 'accent';
  width?: number;
  style?: ViewStyle;
}

export function Separator({ variant = 'line', width, style }: SeparatorProps) {
  if (variant === 'accent') {
    return (
      <View
        style={[
          {
            height: 2,
            width: width ?? 40,
            backgroundColor: COLORS.accent,
            borderRadius: 1,
            marginVertical: SPACING.md,
          },
          style,
        ]}
      />
    );
  }
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: COLORS.border,
          width: '100%',
        },
        style,
      ]}
    />
  );
}

export default Separator;
