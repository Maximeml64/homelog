// components/ErrorBoundary.tsx
// Boundary global : capture les erreurs de render React, affiche un fallback
// utile au lieu d'un écran blanc, et log via le logger central.

import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { StyledText } from './ui/StyledText';
import { logger } from '../src/utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  componentStack?: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('ErrorBoundary', error.message ?? 'unknown render error', {
      stack: error.stack,
      componentStack: info.componentStack,
    });
    this.setState({ componentStack: info.componentStack ?? undefined });
  }

  reset = () => {
    this.setState({ error: null, componentStack: undefined });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          paddingHorizontal: SPACING.xl,
          paddingTop: SPACING.huge,
          paddingBottom: SPACING.xl,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: RADIUS.full,
            backgroundColor: COLORS.dangerMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.lg,
          }}
        >
          <AlertTriangle size={24} color={COLORS.danger} strokeWidth={1.75} />
        </View>

        <StyledText variant="eyebrow" color={COLORS.danger}>
          ERREUR INATTENDUE
        </StyledText>
        <StyledText variant="h2" style={{ marginTop: SPACING.xs }}>
          L'application a rencontré un problème
        </StyledText>
        <StyledText
          variant="body"
          color={COLORS.textSecondary}
          style={{ marginTop: SPACING.sm }}
        >
          Pas de panique — vos données sont en sécurité localement. Essayez
          de relancer l'écran. Si ça persiste, signalez le bug et tuez
          complètement l'app puis rouvrez-la.
        </StyledText>

        <ScrollView
          style={{
            marginTop: SPACING.lg,
            maxHeight: 180,
            backgroundColor: COLORS.surfaceAlt,
            borderRadius: RADIUS.sm,
            padding: SPACING.md,
          }}
        >
          <StyledText
            variant="caption"
            color={COLORS.textSecondary}
            style={{ fontFamily: FONTS.sans }}
          >
            {this.state.error.message}
          </StyledText>
        </ScrollView>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={this.reset}
          style={({ pressed }) => [
            {
              backgroundColor: COLORS.primary,
              paddingVertical: SPACING.md,
              borderRadius: RADIUS.md,
              alignItems: 'center',
              ...SHADOWS.sm,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <StyledText variant="title" color={COLORS.textInverse}>
            Réessayer
          </StyledText>
        </Pressable>
      </View>
    );
  }
}
