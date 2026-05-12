import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { StyledText } from './StyledText';
import { COLORS, SPACING } from '../../constants/theme';

interface InfoRowProps {
  label: string;
  value: string;
  onPress?: () => void;
  isLast?: boolean;
  style?: ViewStyle;
}

export function InfoRow({ label, value, onPress, isLast = false, style }: InfoRowProps) {
  const content = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: SPACING.md,
          paddingHorizontal: SPACING.base,
          gap: SPACING.md,
          borderBottomWidth: isLast ? 0 : 0.5,
          borderBottomColor: COLORS.border,
        },
        style,
      ]}
    >
      <StyledText variant="small" color={COLORS.textSecondary}>
        {label}
      </StyledText>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <StyledText variant="bodyMedium" align="right" numberOfLines={2}>
          {value}
        </StyledText>
      </View>
      {onPress && (
        <ChevronRight size={14} color={COLORS.textTertiary} strokeWidth={2} />
      )}
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && { backgroundColor: COLORS.surfaceAlt }]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

export default InfoRow;
