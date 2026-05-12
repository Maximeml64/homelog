import React from 'react';
import { ScrollView, View, ViewStyle, ScrollViewProps } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

interface ScreenProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  scroll?: boolean;
  backgroundColor?: string;
  contentContainerStyle?: ViewStyle;
  children: React.ReactNode;
}

export function Screen({
  scroll = true,
  backgroundColor = COLORS.background,
  contentContainerStyle,
  children,
  ...rest
}: ScreenProps) {
  if (!scroll) {
    return <View style={{ flex: 1, backgroundColor }}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={[{ paddingBottom: SPACING.xxl }, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

export default Screen;
