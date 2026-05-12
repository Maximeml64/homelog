import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { StyledText } from './StyledText';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

export interface SelectGridOption {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface SelectGridProps {
  label?: string;
  required?: boolean;
  options: SelectGridOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  columns?: number;
  style?: ViewStyle;
}

export function SelectGrid({
  label,
  required,
  options,
  selectedId,
  onSelect,
  columns = 3,
  style,
}: SelectGridProps) {
  const cellWidth = `${100 / columns - 2}%` as const;

  return (
    <View style={style}>
      {label && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SPACING.sm,
          }}
        >
          <StyledText variant="eyebrow" style={{ fontSize: 10 }}>
            {label}
          </StyledText>
          {required && (
            <StyledText
              variant="caption"
              color={COLORS.danger}
              style={{ marginLeft: 4 }}
            >
              *
            </StyledText>
          )}
        </View>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start' }}>
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = option.id === selectedId;
          return (
            <Pressable
              key={option.id}
              onPress={() => onSelect(option.id)}
              style={({ pressed }) => [
                {
                  width: cellWidth,
                  height: 72,
                  marginRight: '2%',
                  marginBottom: SPACING.sm,
                  backgroundColor: isSelected
                    ? COLORS.primaryMuted
                    : COLORS.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? COLORS.primary : COLORS.border,
                  borderRadius: RADIUS.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: SPACING.xs,
                  gap: 2,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              {Icon && (
                <Icon
                  size={16}
                  color={isSelected ? COLORS.primary : COLORS.textSecondary}
                  strokeWidth={1.75}
                />
              )}
              <StyledText
                variant="caption"
                color={isSelected ? COLORS.primary : COLORS.textSecondary}
                numberOfLines={2}
                align="center"
                style={{
                  fontSize: 10,
                  lineHeight: 12,
                  fontFamily: isSelected ? FONTS.sansSemiBold : FONTS.sansMedium,
                }}
              >
                {option.label}
              </StyledText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default SelectGrid;
