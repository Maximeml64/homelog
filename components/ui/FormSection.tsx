import React from 'react';
import { View, ViewStyle } from 'react-native';
import { StyledText } from './StyledText';
import { COLORS, SPACING } from '../../constants/theme';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function FormSection({
  title,
  description,
  children,
  style,
}: FormSectionProps) {
  return (
    <View style={[{ marginBottom: SPACING.sm }, style]}>
      {title && (
        <StyledText variant="eyebrow" style={{ marginBottom: SPACING.xs }}>
          {title}
        </StyledText>
      )}
      {description && (
        <StyledText
          variant="small"
          color={COLORS.textSecondary}
          style={{ marginBottom: SPACING.md }}
        >
          {description}
        </StyledText>
      )}
      <View style={{ gap: SPACING.sm }}>{children}</View>
    </View>
  );
}

export default FormSection;
