import React from 'react';
import { View, Switch, ViewStyle } from 'react-native';
import { StyledText } from './StyledText';
import { COLORS, SPACING } from '../../constants/theme';

interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  description?: string;
  isLast?: boolean;
  style?: ViewStyle;
}

export function Toggle({
  label,
  value,
  onValueChange,
  description,
  isLast = false,
  style,
}: ToggleProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.md,
          gap: SPACING.md,
          borderBottomWidth: isLast ? 0 : 0.5,
          borderBottomColor: COLORS.border,
        },
        style,
      ]}
    >
      <View style={{ flex: 1 }}>
        <StyledText variant="bodyMedium">{label}</StyledText>
        {description && (
          <StyledText
            variant="small"
            color={COLORS.textSecondary}
            style={{ marginTop: 2 }}
          >
            {description}
          </StyledText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.borderStrong, true: COLORS.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={COLORS.borderStrong}
      />
    </View>
  );
}

export default Toggle;
