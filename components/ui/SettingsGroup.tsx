import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Card } from './Card';
import { StyledText } from './StyledText';
import { SPACING } from '../../constants/theme';

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SettingsGroup({ title, children, style }: SettingsGroupProps) {
  return (
    <View style={[{ marginBottom: SPACING.lg }, style]}>
      <StyledText
        variant="eyebrow"
        style={{ marginBottom: SPACING.sm, paddingHorizontal: SPACING.lg }}
      >
        {title}
      </StyledText>
      <Card
        variant="outlined"
        padding="none"
        radius="md"
        style={{ marginHorizontal: SPACING.lg, overflow: 'hidden' }}
      >
        {children}
      </Card>
    </View>
  );
}

export default SettingsGroup;
