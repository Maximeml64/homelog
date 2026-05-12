import React from 'react';
import { View, ViewProps, ViewStyle, StyleProp, Pressable, PressableProps } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

type Variant = 'elevated' | 'outlined' | 'flat';
type Padding = keyof typeof SPACING | 'none';

interface CardBaseProps {
  variant?: Variant;
  padding?: Padding;
  radius?: keyof typeof RADIUS;
}

interface CardViewProps extends CardBaseProps, ViewProps {
  onPress?: undefined;
}

interface CardPressableProps extends CardBaseProps, PressableProps {
  onPress: () => void;
}

type CardProps = CardViewProps | CardPressableProps;

function getStyles(variant: Variant, padding: Padding, radius: keyof typeof RADIUS): ViewStyle {
  const paddingValue = padding === 'none' ? 0 : SPACING[padding];
  const base: ViewStyle = {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS[radius],
    padding: paddingValue,
  };
  if (variant === 'elevated') return { ...base, ...SHADOWS.sm };
  if (variant === 'outlined') return { ...base, borderWidth: 1, borderColor: COLORS.border };
  return base;
}

export function Card({
  variant = 'elevated',
  padding = 'base',
  radius = 'md',
  style,
  children,
  ...rest
}: CardProps) {
  const computed = getStyles(variant, padding, radius);
  if ('onPress' in rest && rest.onPress) {
    return (
      <Pressable
        style={({ pressed }) => [computed, pressed && { opacity: 0.85 }, style as ViewStyle]}
        {...(rest as PressableProps)}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[computed, style as StyleProp<ViewStyle>]} {...(rest as ViewProps)}>
      {children as React.ReactNode}
    </View>
  );
}

export default Card;
