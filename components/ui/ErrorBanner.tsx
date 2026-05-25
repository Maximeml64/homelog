// components/ui/ErrorBanner.tsx

import React from 'react';
import { Pressable, View } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { COLORS, HIT_SLOP, RADIUS, SPACING } from '../../constants/theme';
import { StyledText } from './StyledText';

interface Props {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.dangerMuted,
        borderWidth: 1,
        borderColor: COLORS.danger,
      }}
    >
      <AlertTriangle size={14} color={COLORS.danger} strokeWidth={2} />
      <StyledText
        variant="caption"
        color={COLORS.danger}
        style={{ flex: 1 }}
      >
        {message}
      </StyledText>
      {onRetry && (
        <Pressable onPress={onRetry} hitSlop={HIT_SLOP}>
          <StyledText
            variant="caption"
            color={COLORS.danger}
            style={{ textDecorationLine: 'underline' }}
          >
            Réessayer
          </StyledText>
        </Pressable>
      )}
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={HIT_SLOP}>
          <X size={14} color={COLORS.danger} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}
