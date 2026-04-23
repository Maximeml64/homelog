// app/paywall.tsx

import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../constants/theme';
import { useAppStore } from '../src/stores/appStore';

const FEATURES = [
  { icon: '🏠', label: 'Biens illimités', sub: 'Gratuit : limité à 3 biens' },
  { icon: '📊', label: 'Statistiques avancées', sub: 'Coûts par catégorie, tendances' },
  { icon: '📄', label: 'Export PDF', sub: 'Historique complet exportable' },
  { icon: '🔔', label: 'Rappels illimités', sub: 'Autant de rappels que nécessaire' },
];

export default function PaywallScreen() {
  const { purchasePremium, restorePurchases, isLoadingPurchase, packages } = useAppStore();

  const monthlyPackage = packages[0];
  const priceString = monthlyPackage?.product.priceString ?? '0,99 €';

  async function handlePurchase() {
    const { success, error } = await purchasePremium();
    if (success) {
      router.back();
    } else if (error) {
      Alert.alert('Erreur', error);
    }
  }

  async function handleRestore() {
    const { success, error } = await restorePurchases();
    if (success) {
      Alert.alert('Succès', 'Vos achats ont été restaurés.');
      router.back();
    } else if (error) {
      Alert.alert('Erreur', error);
    } else {
      Alert.alert('Aucun achat', 'Aucun abonnement actif trouvé.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>✨</Text>
        <Text style={styles.heroTitle}>Passez en Premium</Text>
        <Text style={styles.heroSubtitle}>
          Gérez tous vos biens sans limite et gardez un historique complet.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featuresCard}>
        {FEATURES.map((f, i) => (
          <View
            key={f.label}
            style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}
          >
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Text style={styles.featureSub}>{f.sub}</Text>
            </View>
            <Text style={styles.featureCheck}>✓</Text>
          </View>
        ))}
      </View>

      {/* Pricing */}
      <View style={styles.pricingCard}>
        <Text style={styles.pricingPrice}>{priceString}</Text>
        <Text style={styles.pricingPeriod}>par mois</Text>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaButton, isLoadingPurchase && styles.ctaButtonDisabled]}
        onPress={handlePurchase}
        disabled={isLoadingPurchase}
      >
        {isLoadingPurchase ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.ctaButtonText}>S'abonner pour {priceString}/mois</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={isLoadingPurchase}>
        <Text style={styles.restoreButtonText}>Restaurer un achat</Text>
      </TouchableOpacity>

      <Text style={styles.legal}>
        Sans engagement. Annulable à tout moment depuis les réglages de l'App Store.
      </Text>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.skipText}>Continuer sans Premium</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 60, alignItems: 'center' },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  heroIcon: { fontSize: 56, marginBottom: spacing.md },
  heroTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    width: '100%',
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  featureRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  featureIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  featureInfo: { flex: 1 },
  featureLabel: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  featureSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  featureCheck: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.bold },
  pricingCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pricingPrice: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, color: colors.primary },
  pricingPeriod: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: 4 },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadow.md,
  },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  restoreButton: { padding: spacing.sm, marginBottom: spacing.md },
  restoreButtonText: { color: colors.textSecondary, fontSize: fontSize.sm },
  legal: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 16,
  },
  skipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    marginTop: spacing.sm,
  },
});
