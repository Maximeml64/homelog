import React, { useState } from 'react';
import { TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { StyledText } from './StyledText';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  containerStyle?: ViewStyle;
}

export function TextField({
  label,
  helper,
  error,
  required,
  multiline,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? COLORS.danger
    : focused
    ? COLORS.primary
    : COLORS.border;

  return (
    <View style={containerStyle}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
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
      <TextInput
        {...rest}
        multiline={multiline}
        placeholderTextColor={COLORS.textTertiary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={{
          fontFamily: FONTS.sans,
          fontSize: 15,
          color: COLORS.text,
          paddingVertical: multiline ? SPACING.md : 10,
          minHeight: multiline ? 100 : undefined,
          textAlignVertical: multiline ? 'top' : 'auto',
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}
      />
      {(helper || error) && (
        <StyledText
          variant="caption"
          color={error ? COLORS.danger : COLORS.textTertiary}
          style={{ marginTop: 4 }}
        >
          {error ?? helper}
        </StyledText>
      )}
    </View>
  );
}

export default TextField;
