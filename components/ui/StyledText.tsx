import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { TYPOGRAPHY } from '../../constants/theme';

type Variant = keyof typeof TYPOGRAPHY;

interface StyledTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export function StyledText({
  variant = 'body',
  color,
  align,
  style,
  children,
  ...rest
}: StyledTextProps) {
  const variantStyle = TYPOGRAPHY[variant] as TextStyle;
  return (
    <Text
      style={[
        variantStyle,
        color !== undefined && { color },
        align !== undefined && { textAlign: align },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export default StyledText;
