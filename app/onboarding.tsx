// app/onboarding.tsx

import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../constants/theme';
import { requestNotificationPermission } from '../src/services/notificationService';
import { useAppStore } from '../src/stores/appStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FEATURES = [
  {
    icon: '🏠',
    title: 'Tous vos biens',
    description: 'Voiture, chaudière, électroménager, animaux… centralisez tout en un endroit.',
  },
  {
    icon: '🔔',
    title: 'Rappels intelligents',
    description: 'Ne ratez plus jamais un entretien ou une échéance importante.',
  },
  {
    icon: '📄',
    title: 'Historique & documents',
    description: 'Conservez factures, photos et notes. Exportez en PDF en un tap.',
  },
  {
    icon: '📊',
    title: 'Vue complète',
    description: 'Suivez vos dépenses par bien et par catégorie, sur l\'année.',
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function goToSlide(index: number) {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setCurrentSlide(index);
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentSlide(slide);
  }

  async function handleStart() {
    if (!name.trim()) {
      Alert.alert('Champ requis', 'Entre ton prénom pour continuer.');
      return;
    }
    setLoading(true);
    try {
      await requestNotificationPermission();
      await completeOnboarding(name.trim());
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de continuer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Slide 1 — Hero */}
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <View style={styles.heroContent}>
            <Text style={styles.heroIcon}>🏠</Text>
            <Text style={styles.heroTitle}>Homelog</Text>
            <Text style={styles.heroSubtitle}>
              Le carnet de bord de votre maison.{'\n'}
              Simple, privé, toujours avec vous.
            </Text>
            <View style={styles.heroBadges}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>🔒 Données locales</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>📱 Sans compte</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={() => goToSlide(1)}>
            <Text style={styles.nextButtonText}>Découvrir →</Text>
          </TouchableOpacity>
        </View>

        {/* Slide 2 — Features */}
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <View style={styles.featuresContent}>
            <Text style={styles.featuresTitle}>Tout ce dont vous avez besoin</Text>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIconBox}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.description}</Text>
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={() => goToSlide(2)}>
            <Text style={styles.nextButtonText}>Commencer →</Text>
          </TouchableOpacity>
        </View>

        {/* Slide 3 — Prénom */}
        <KeyboardAvoidingView
          style={{ width: SCREEN_WIDTH }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.slide}>
            <View style={styles.nameContent}>
              <Text style={styles.nameTitle}>Comment vous{'\n'}appelez-vous ?</Text>
              <Text style={styles.nameSubtitle}>
                Pour personnaliser votre expérience
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Votre prénom"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleStart}
              />
              <Text style={styles.legal}>
                Vos données restent sur votre appareil.{'\n'}Aucun compte requis.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.startButton, (!name.trim() || loading) && styles.startButtonDisabled]}
              onPress={handleStart}
              disabled={!name.trim() || loading}
            >
              <Text style={styles.startButtonText}>
                {loading ? 'Chargement…' : 'Démarrer Homelog →'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.dots}>
        {[0, 1, 2].map(i => (
          <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
            <View style={[styles.dot, currentSlide === i && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },

  slide: {
    flex: 1,
    minHeight: '100%',
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    paddingBottom: 100,
    justifyContent: 'space-between',
  },

  // Slide 1
  heroContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { fontSize: 80, marginBottom: spacing.lg },
  heroTitle: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: -1.5,
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    fontSize: fontSize.lg,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xl,
  },
  heroBadges: { flexDirection: 'row', gap: spacing.sm },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroBadgeText: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: fontWeight.medium,
  },

  // Slide 2
  featuresContent: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  featuresTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  featureIcon: { fontSize: 24 },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
  },

  // Slide 3
  nameContent: { flex: 1, justifyContent: 'center' },
  nameTitle: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    lineHeight: 42,
  },
  nameSubtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    fontSize: fontSize.xl,
    color: colors.text,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  legal: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Buttons
  nextButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  nextButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  startButton: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.md,
  },
  startButtonDisabled: { opacity: 0.5 },
  startButtonText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  // Dots
  dots: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 24,
  },
});
