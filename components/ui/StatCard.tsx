import React from 'react';
import { View, ViewStyle } from 'react-native';
import { StyledText } from './StyledText';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: boolean;
  style?: ViewStyle;
}

export function StatCard({ label, value, subtitle, accent, style }: StatCardProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: RADIUS.md,
          padding: SPACING.base,
          gap: 4,
          minHeight: 80,
        },
        style,
      ]}
    >
      <StyledText
        variant="eyebrow"
        numberOfLines={1}
        style={{ fontSize: 10, letterSpacing: 1.2 }}
      >
        {label}
      </StyledText>
      <StyledText
        variant="numericLarge"
        color={accent ? COLORS.accentDark : COLORS.text}
        style={{ fontSize: 20, lineHeight: 24 }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {String(value)}
      </StyledText>
      {subtitle && (
        <StyledText variant="caption" numberOfLines={1}>
          {subtitle}
        </StyledText>
      )}
    </View>
  );
}

export default StatCard;
