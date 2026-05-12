import React from 'react';
import { View, TextInput, Pressable, ViewStyle } from 'react-native';
import { Search, ArrowUpDown, X } from 'lucide-react-native';
import { StyledText } from './StyledText';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSortPress?: () => void;
  sortLabel?: string;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Rechercher…',
  onSortPress,
  sortLabel,
  style,
}: SearchBarProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.sm,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          gap: SPACING.md,
        },
        style,
      ]}
    >
      <Search size={16} color={COLORS.textTertiary} strokeWidth={1.75} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        style={{
          flex: 1,
          fontFamily: FONTS.sans,
          fontSize: 15,
          color: COLORS.text,
          padding: 0,
        }}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          style={({ pressed }) => [pressed && { opacity: 0.5 }]}
        >
          <X size={16} color={COLORS.textTertiary} strokeWidth={2} />
        </Pressable>
      )}
      {onSortPress && (
        <Pressable
          onPress={onSortPress}
          hitSlop={8}
          style={({ pressed }) => [
            { flexDirection: 'row', alignItems: 'center', gap: 4 },
            pressed && { opacity: 0.5 },
          ]}
        >
          <ArrowUpDown size={14} color={COLORS.textSecondary} strokeWidth={2} />
          {sortLabel && (
            <StyledText variant="smallMedium" color={COLORS.textSecondary}>
              {sortLabel}
            </StyledText>
          )}
        </Pressable>
      )}
    </View>
  );
}

export default SearchBar;
