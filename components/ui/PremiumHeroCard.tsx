import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { Sparkles, Check, ChevronRight } from 'lucide-react-native';
import { StyledText } from './StyledText';
import { COLORS, RADIUS, SPACING, SHADOWS, FONTS } from '../../constants/theme';

interface PremiumHeroCardProps {
  isPremium: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function PremiumHeroCard({ isPremium, onPress, style }: PremiumHeroCardProps) {
  if (isPremium) {
    return (
      <View
        style={[
          {
            marginHorizontal: SPACING.lg,
            backgroundColor: COLORS.surface,
            borderWidth: 1.5,
            borderColor: COLORS.accent,
            borderRadius: RADIUS.md,
            padding: SPACING.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.md,
          },
          style,
        ]}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: RADIUS.sm,
            backgroundColor: COLORS.accentMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={20} color={COLORS.accentDark} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <StyledText variant="title">Premium actif</StyledText>
          <StyledText variant="small" color={COLORS.textSecondary}>
            Toutes les fonctionnalités débloquées
          </StyledText>
        </View>
        <View
          style={{
            backgroundColor: COLORS.accent,
            paddingHorizontal: SPACING.sm,
            paddingVertical: 3,
            borderRadius: RADIUS.xs,
          }}
        >
          <StyledText
            variant="caption"
            color={COLORS.primaryDark}
            style={{ fontFamily: FONTS.sansBold, letterSpacing: 1, fontSize: 10 }}
          >
            PRO
          </StyledText>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          marginHorizontal: SPACING.lg,
          backgroundColor: COLORS.primary,
          borderRadius: RADIUS.md,
          padding: SPACING.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
          ...SHADOWS.md,
        },
        pressed && { opacity: 0.9 },
        style,
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: RADIUS.sm,
          backgroundColor: COLORS.accentMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkles size={20} color={COLORS.accent} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <StyledText variant="title" color={COLORS.textInverse}>
          Passer en Premium
        </StyledText>
        <StyledText variant="small" color={COLORS.textInverse} style={{ opacity: 0.75 }}>
          Biens illimités · exports · stats avancées
        </StyledText>
      </View>
      <ChevronRight size={20} color={COLORS.textInverse} strokeWidth={2} />
    </Pressable>
  );
}

export default PremiumHeroCard;
