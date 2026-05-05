// app/paywall.tsx

import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../constants/theme';
import { useAppStore } from '../src/stores/appStore';

const FEATURES = [
  { icon: '🏠', label: 'Biens illimités', sub: 'Gratuit : limité à 3 biens' },
  { icon: '📊', label: 'Statistiques avancées', sub: 'Coûts par catégorie, tendances' },
  { icon: '📄', label: 'Export PDF', sub: 'Historique complet exportable' },
  { icon: '🔔', label: 'Rappels illimités', sub: 'Autant de rappels que nécessaire' },
];

function hasFreeTrialMonth(pkg: PurchasesPackage): boolean {
  return pkg.product.introPrice !== null && pkg.product.introPrice?.price === 0;
}

function computeSavingsPercent(
  monthlyPkg: PurchasesPackage,
  annualPkg: PurchasesPackage,
): number | null {
  const mp = monthlyPkg.product.price;
  if (!mp) return null;
  const annualPerMonth = annualPkg.product.price / 12;
  const savings = Math.round((1 - annualPerMonth / mp) * 100);
  return savings > 0 ? savings : null;
}

export default function PaywallScreen() {
  const { purchasePackage, restorePurchases, packages } = useAppStore();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const annualPkg = packages.find(p => p.packageType === 'ANNUAL');
  const monthlyPkg = packages.find(p => p.packageType === 'MONTHLY');
  const lifetimePkg = packages.find(p => p.packageType === 'LIFETIME');

  const savingsPercent =
    monthlyPkg && annualPkg ? computeSavingsPercent(monthlyPkg, annualPkg) : null;
  const trialMonthly = monthlyPkg ? hasFreeTrialMonth(monthlyPkg) : false;

  async function handlePurchase(pkg: PurchasesPackage) {
    setPurchasing(pkg.identifier);
    const { success, error } = await purchasePackage(pkg);
    setPurchasing(null);
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

  const isAnyPurchasing = purchasing !== null;

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

      {/* ── ANNUEL ── */}
      {annualPkg && (
        <View style={[styles.tierCard, styles.tierCardFeatured]}>
          <View style={styles.tierHeader}>
            <Text style={styles.tierTitle}>Annuel</Text>
            <View style={styles.tierBadgeFeatured}>
              <Text style={styles.tierBadgeFeaturedText}>
                {savingsPercent != null ? `Économise ${savingsPercent}%` : 'Le plus populaire'}
              </Text>
            </View>
          </View>
          <Text style={styles.tierPrice}>{annualPkg.product.priceString}</Text>
          <Text style={styles.tierPeriod}>par an</Text>
          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaButtonFeatured, isAnyPurchasing && styles.ctaButtonDisabled]}
            onPress={() => handlePurchase(annualPkg)}
            disabled={isAnyPurchasing}
          >
            {purchasing === annualPkg.identifier ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaButtonText}>
                {"S'abonner · "}{annualPkg.product.priceString}/an
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── MENSUEL ── */}
      {monthlyPkg && (
        <View style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <Text style={styles.tierTitle}>Mensuel</Text>
            {trialMonthly && (
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeText}>7 jours gratuits</Text>
              </View>
            )}
          </View>
          <Text style={styles.tierPrice}>{monthlyPkg.product.priceString}</Text>
          <Text style={styles.tierPeriod}>par mois</Text>
          <TouchableOpacity
            style={[styles.ctaButton, isAnyPurchasing && styles.ctaButtonDisabled]}
            onPress={() => handlePurchase(monthlyPkg)}
            disabled={isAnyPurchasing}
          >
            {purchasing === monthlyPkg.identifier ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaButtonText}>
                {trialMonthly
                  ? "Commencer l'essai gratuit"
                  : `S'abonner · ${monthlyPkg.product.priceString}/mois`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── À VIE ── */}
      {lifetimePkg && (
        <View style={[styles.tierCard, styles.tierCardAccent]}>
          <View style={styles.tierHeader}>
            <Text style={styles.tierTitle}>À vie</Text>
            <View style={styles.tierBadgeAccent}>
              <Text style={styles.tierBadgeAccentText}>Sans renouvellement</Text>
            </View>
          </View>
          <Text style={styles.tierPrice}>{lifetimePkg.product.priceString}</Text>
          <Text style={styles.tierPeriod}>paiement unique</Text>
          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaButtonAccent, isAnyPurchasing && styles.ctaButtonDisabled]}
            onPress={() => handlePurchase(lifetimePkg)}
            disabled={isAnyPurchasing}
          >
            {purchasing === lifetimePkg.identifier ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaButtonText}>
                {'Acheter à vie · '}{lifetimePkg.product.priceString}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Aucun package dispo */}
      {!annualPkg && !monthlyPkg && !lifetimePkg && (
        <View style={styles.unavailableCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.unavailableText}>
            Les offres se chargent…{'\n'}Vérifiez votre connexion si elles n'apparaissent pas.
          </Text>
        </View>
      )}

      {/* Restore */}
      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={isAnyPurchasing}
      >
        <Text style={styles.restoreButtonText}>Restaurer un achat</Text>
      </TouchableOpacity>

      {/* Legal */}
      <Text style={styles.legal}>
        Les abonnements se renouvellent automatiquement. Annulable à tout moment depuis les réglages de l'App Store. Sans renouvellement pour l'offre à vie.
      </Text>

      {/* Skip */}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.skipText}>Continuer sans Premium</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 60, alignItems: 'center' },

  // Hero
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

  // Features
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

  // Tier cards
  tierCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    width: '100%',
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.sm,
  },
  tierCardFeatured: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  tierCardAccent: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  tierTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },

  // Badges
  tierBadgeFeatured: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tierBadgeFeaturedText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  tierBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tierBadgeText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  tierBadgeAccent: {
    backgroundColor: colors.accent + '20',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tierBadgeAccentText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // Pricing within card
  tierPrice: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  tierPeriod: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  // CTA buttons
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  ctaButtonFeatured: {
    backgroundColor: colors.primary,
    ...shadow.md,
  },
  ctaButtonAccent: {
    backgroundColor: colors.accent,
  },
  ctaButtonDisabled: { opacity: 0.5 },
  ctaButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  // Unavailable state
  unavailableCard: {
    width: '100%',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  unavailableText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Footer
  restoreButton: { padding: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.sm },
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
