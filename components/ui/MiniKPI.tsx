import React from 'react';
import { View, ViewStyle } from 'react-native';
import { StyledText } from './StyledText';
import { COLORS, SPACING } from '../../constants/theme';

interface MiniKPIProps {
  label: string;
  value: string;
  subtitle?: string;
  accent?: boolean;
  style?: ViewStyle;
}

export function MiniKPI({ label, value, subtitle, accent, style }: MiniKPIProps) {
  return (
    <View style={[{ flex: 1, gap: SPACING.xs }, style]}>
      <StyledText variant="eyebrow">{label}</StyledText>
      <StyledText
        variant="numericLarge"
        color={accent ? COLORS.accentDark : COLORS.text}
        style={{ fontSize: 22, lineHeight: 26 }}
      >
        {value}
      </StyledText>
      {subtitle && <StyledText variant="caption">{subtitle}</StyledText>}
    </View>
  );
}

export default MiniKPI;
