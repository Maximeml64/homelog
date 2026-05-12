import React from 'react';
import { View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { Card } from './Card';
import { StyledText } from './StyledText';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface ReminderCardProps {
  title: string;
  dueDate: string;       // ex: "24 juillet"
  countdown: string;     // ex: "Dans 75 jours" ou "En retard"
  assetName?: string;    // ex: "Maison"
  isOverdue?: boolean;
  onPress: () => void;
}

export function ReminderCard({
  title,
  dueDate,
  countdown,
  assetName,
  isOverdue,
  onPress,
}: ReminderCardProps) {
  const accentColor = isOverdue ? COLORS.danger : COLORS.accentDark;
  return (
    <Card
      variant="outlined"
      padding="base"
      onPress={onPress}
      style={{ width: 220, marginRight: SPACING.md }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: RADIUS.sm,
            backgroundColor: isOverdue ? COLORS.dangerMuted : COLORS.accentMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell size={14} color={accentColor} strokeWidth={2} />
        </View>
        <StyledText variant="eyebrow" color={accentColor} numberOfLines={1} style={{ flex: 1 }}>
          {countdown}
        </StyledText>
      </View>
      <StyledText variant="h3" numberOfLines={2} style={{ marginBottom: SPACING.xs }}>
        {title}
      </StyledText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
        <StyledText variant="small">{dueDate}</StyledText>
        {assetName && (
          <>
            <StyledText variant="small" color={COLORS.textTertiary}>·</StyledText>
            <StyledText variant="small" numberOfLines={1} style={{ flex: 1 }}>
              {assetName}
            </StyledText>
          </>
        )}
      </View>
    </Card>
  );
}

export default ReminderCard;
