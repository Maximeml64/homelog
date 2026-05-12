// app/onboarding.tsx

import React, { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  Bell,
  Camera,
  Home,
  Sparkles,
} from 'lucide-react-native';
import { LucideIcon } from 'lucide-react-native';
import { Separator, StyledText } from '../components/ui';
import {
  COLORS,
  FONTS,
  RADIUS,
  SHADOWS,
  SPACING,
} from '../constants/theme';
import { requestNotificationPermission } from '../src/services/notificationService';
import { useAppStore } from '../src/stores/appStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const SLIDES: Slide[] = [
  {
    eyebrow: 'CARNET DE PATRIMOINE',
    title: 'Votre maison,\nun carnet de bord.',
    description:
      'Centralisez vos biens, vos factures et vos entretiens. 100% privé, 100% local — sans compte ni cloud.',
    icon: Home,
  },
  {
    eyebrow: 'IA INTÉGRÉE',
    title: 'Photographiez\nvos factures.',
    description:
      'Notre IA pré-remplit automatiquement marque, modèle, prix et catégorie. Plus rien à recopier.',
    icon: Camera,
  },
  {
    eyebrow: 'RAPPELS INTELLIGENTS',
    title: 'Ne ratez plus\nun entretien.',
    description:
      'Vidanges, contrôles, garanties — recevez une notification au bon moment, automatiquement.',
    icon: Bell,
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const totalSlides = SLIDES.length + 1;
  const isLastSlide = currentSlide === SLIDES.length;

  function goToSlide(index: number) {
    scrollRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentSlide(index);
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slide !== currentSlide) setCurrentSlide(slide);
  }

  async function handleStart() {
    if (!name.trim()) {
      Alert.alert('Champ requis', 'Entrez votre prénom pour continuer.');
      return;
    }
    setLoading(true);
    try {
      await requestNotificationPermission();
      await completeOnboarding(name.trim());
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Erreur', 'Impossible de continuer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Slides éditoriales */}
        {SLIDES.map((slide, idx) => {
          const Icon = slide.icon;
          return (
            <View
              key={idx}
              style={{
                width: SCREEN_WIDTH,
                paddingHorizontal: SPACING.xl,
                paddingTop: 100,
                paddingBottom: 140,
                justifyContent: 'flex-start',
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: RADIUS.full,
                  backgroundColor: COLORS.accentMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: SPACING.xl,
                }}
              >
                <Icon
                  size={28}
                  color={COLORS.accentDark}
                  strokeWidth={1.5}
                />
              </View>

              <StyledText variant="eyebrow" color={COLORS.accentDark}>
                {slide.eyebrow}
              </StyledText>

              <Separator
                variant="accent"
                width={32}
                style={{ marginTop: SPACING.md, marginBottom: SPACING.lg }}
              />

              <StyledText
                variant="h1"
                style={{ fontSize: 36, lineHeight: 42 }}
              >
                {slide.title}
              </StyledText>

              <StyledText
                variant="body"
                color={COLORS.textSecondary}
                style={{
                  marginTop: SPACING.lg,
                  fontSize: 16,
                  lineHeight: 24,
                }}
              >
                {slide.description}
              </StyledText>
            </View>
          );
        })}

        {/* Slide finale prénom */}
        <KeyboardAvoidingView
          style={{ width: SCREEN_WIDTH }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={{
              flex: 1,
              paddingHorizontal: SPACING.xl,
              paddingTop: 100,
              paddingBottom: 140,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: RADIUS.full,
                backgroundColor: COLORS.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: SPACING.xl,
              }}
            >
              <Sparkles
                size={28}
                color={COLORS.primary}
                strokeWidth={1.5}
              />
            </View>

            <StyledText variant="eyebrow">BIENVENUE</StyledText>

            <Separator
              variant="accent"
              width={32}
              style={{ marginTop: SPACING.md, marginBottom: SPACING.lg }}
            />

            <StyledText variant="h1" style={{ fontSize: 36, lineHeight: 42 }}>
              Comment vous{'\n'}appelez-vous ?
            </StyledText>

            <StyledText
              variant="body"
              color={COLORS.textSecondary}
              style={{
                marginTop: SPACING.lg,
                fontSize: 16,
                lineHeight: 24,
              }}
            >
              Juste votre prénom — pour personnaliser
              vos écrans. Rien n'est envoyé en ligne.
            </StyledText>

            <View style={{ marginTop: SPACING.xxl }}>
              <StyledText
                variant="eyebrow"
                style={{ marginBottom: SPACING.xs }}
              >
                PRÉNOM
              </StyledText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Votre prénom"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleStart}
                style={{
                  fontFamily: FONTS.serifMedium,
                  fontSize: 24,
                  lineHeight: 30,
                  color: COLORS.text,
                  paddingVertical: SPACING.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.borderStrong,
                }}
              />
              <StyledText
                variant="caption"
                color={COLORS.textTertiary}
                style={{ marginTop: SPACING.md }}
              >
                Vos données restent sur votre appareil.
                Aucun compte requis.
              </StyledText>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Footer : pagination + CTA */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: SPACING.xl,
          paddingBottom: SPACING.xxl,
          paddingTop: SPACING.md,
          backgroundColor: COLORS.background,
        }}
      >
        {/* Dots */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: SPACING.xs,
            marginBottom: SPACING.lg,
          }}
        >
          {Array.from({ length: totalSlides }).map((_, i) => (
            <Pressable
              key={i}
              onPress={() => goToSlide(i)}
              hitSlop={8}
            >
              <View
                style={{
                  width: currentSlide === i ? 24 : 8,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    currentSlide === i
                      ? COLORS.primary
                      : COLORS.borderStrong,
                }}
              />
            </Pressable>
          ))}
        </View>

        {/* CTA */}
        {isLastSlide ? (
          <Pressable
            onPress={handleStart}
            disabled={!name.trim() || loading}
            style={({ pressed }) => [
              {
                backgroundColor:
                  !name.trim() || loading
                    ? COLORS.borderStrong
                    : COLORS.primary,
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.md,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: SPACING.sm,
                ...SHADOWS.sm,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <StyledText variant="title" color={COLORS.textInverse}>
              {loading ? 'Démarrage…' : 'Commencer'}
            </StyledText>
            {!loading && (
              <ArrowRight
                size={16}
                color={COLORS.textInverse}
                strokeWidth={2.5}
              />
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={() => goToSlide(currentSlide + 1)}
            style={({ pressed }) => [
              {
                backgroundColor: COLORS.primary,
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.md,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: SPACING.sm,
                ...SHADOWS.sm,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <StyledText variant="title" color={COLORS.textInverse}>
              Continuer
            </StyledText>
            <ArrowRight
              size={16}
              color={COLORS.textInverse}
              strokeWidth={2.5}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
