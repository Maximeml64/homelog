import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { StyledText } from './StyledText';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  badge?: number;
  onPress: () => void;
  style?: ViewStyle;
}

export function QuickAction({ icon: Icon, label, badge, onPress, style }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { alignItems: 'center', flex: 1, gap: SPACING.xs },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: RADIUS.md,
          backgroundColor: COLORS.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={22} color={COLORS.textInverse} strokeWidth={1.75} />
        {badge !== undefined && badge > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              paddingHorizontal: 5,
              borderRadius: 9,
              backgroundColor: COLORS.accent,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: COLORS.background,
            }}
          >
            <StyledText
              variant="caption"
              color={COLORS.primaryDark}
              style={{ fontSize: 10, lineHeight: 12, fontWeight: '700' }}
            >
              {badge > 9 ? '9+' : String(badge)}
            </StyledText>
          </View>
        )}
      </View>
      <StyledText
        variant="caption"
        color={COLORS.textSecondary}
        align="center"
        numberOfLines={1}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}

export default QuickAction;
