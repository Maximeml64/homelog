import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';

type FABVariant = 'primary' | 'accent';

interface FABProps {
  icon: LucideIcon;
  onPress: () => void;
  variant?: FABVariant;
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function FAB({
  icon: Icon,
  onPress,
  variant = 'primary',
  size = 56,
  style,
  accessibilityLabel,
}: FABProps) {
  const bg = variant === 'accent' ? COLORS.accent : COLORS.primary;
  const iconColor = variant === 'accent' ? COLORS.primaryDark : COLORS.textInverse;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          ...SHADOWS.lg,
        },
        pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] },
        style,
      ]}
    >
      <Icon
        size={size === 56 ? 24 : Math.round(size * 0.43)}
        color={iconColor}
        strokeWidth={2}
      />
    </Pressable>
  );
}

export default FAB;
