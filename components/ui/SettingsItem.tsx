import React from 'react';
import { View, Pressable } from 'react-native';
import { LucideIcon, ChevronRight } from 'lucide-react-native';
import { StyledText } from './StyledText';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface SettingsItemProps {
  icon: LucideIcon;
  label: string;
  value?: string | number;
  showChevron?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  isLast?: boolean;
}

export function SettingsItem({
  icon: Icon,
  label,
  value,
  showChevron,
  onPress,
  variant = 'default',
  disabled = false,
  isLast = false,
}: SettingsItemProps) {
  const isPressable = !!onPress && !disabled;
  const labelColor = variant === 'danger' ? COLORS.danger : COLORS.text;
  const iconColor = variant === 'danger' ? COLORS.danger : COLORS.textSecondary;
  const iconBg = variant === 'danger' ? COLORS.dangerMuted : COLORS.surfaceAlt;
  const shouldShowChevron = showChevron ?? isPressable;

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.base,
        gap: SPACING.md,
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: COLORS.border,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: RADIUS.sm,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={iconColor} strokeWidth={1.75} />
      </View>
      <StyledText variant="bodyMedium" color={labelColor} style={{ flex: 1 }}>
        {label}
      </StyledText>
      {value !== undefined && value !== null && (
        <StyledText variant="numericSmall" color={COLORS.textSecondary}>
          {String(value)}
        </StyledText>
      )}
      {shouldShowChevron && (
        <ChevronRight size={16} color={COLORS.textTertiary} strokeWidth={2} />
      )}
    </View>
  );

  if (isPressable) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [pressed && { backgroundColor: COLORS.surfaceAlt }]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

export default SettingsItem;
