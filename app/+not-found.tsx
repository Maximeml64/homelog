// app/+not-found.tsx

import React from 'react';
import { Pressable, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { StyledText } from '../components/ui';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING.lg,
          backgroundColor: COLORS.background,
        }}
      >
        <StyledText variant="eyebrow" color={COLORS.textTertiary}>
          PAGE 404
        </StyledText>
        <StyledText
          variant="h2"
          align="center"
          style={{ marginTop: SPACING.sm }}
        >
          Cette page n'existe pas.
        </StyledText>
        <StyledText
          variant="body"
          color={COLORS.textSecondary}
          align="center"
          style={{ marginTop: SPACING.sm }}
        >
          Le lien que vous avez suivi est peut-être obsolète.
        </StyledText>

        <Link href="/" asChild>
          <Pressable
            style={({ pressed }) => [
              {
                marginTop: SPACING.lg,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.sm + 2,
                backgroundColor: COLORS.primary,
                borderRadius: RADIUS.md,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <StyledText variant="smallMedium" color={COLORS.textInverse}>
              Retour à l'accueil
            </StyledText>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
