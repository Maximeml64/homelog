// app/modal.tsx
// Modal placeholder — non utilisé en production mais conservé pour
// compatibilité avec la route auto-générée par Expo Router.

import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { StyledText } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';

export default function ModalScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        backgroundColor: COLORS.background,
      }}
    >
      <StyledText variant="h3">Homelog</StyledText>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
