// app/paywall.tsx

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { PurchasesPackage } from 'react-native-purchases';
import {
  BarChart3,
  Bell,
  Check,
  FileDown,
  Infinity as InfinityIcon,
  LucideIcon,
  Sparkles,
} from 'lucide-react-native';
import { Card, Screen, Separator, StyledText } from '../components/ui';
import {
  COLORS,
  FONTS,
  RADIUS,
  SHADOWS,
  SPACING,
} from '../constants/theme';
import { PRIVACY_URL, TERMS_URL } from '../constants/config';
import { useAppStore } from '../src/stores/appStore';

interface Feature {
  label: string;
  description: string;
  icon: LucideIcon;
}

const FEATURES: Feature[] = [
  {
    label: 'Biens illimités',
    description: 'Sans limite — au-delà des 3 biens gratuits',
    icon: InfinityIcon,
  },
  {
    label: 'Statistiques avancées',
    description: 'Coûts par catégorie, tendances annuelles',
    icon: BarChart3,
  },
  {
    label: 'Export PDF & CSV',
    description: 'Rapport complet à l\'export, en un tap',
    icon: FileDown,
  },
  {
    label: 'Rappels illimités',
    description: 'Autant de rappels d\'entretien que nécessaire',
    icon: Bell,
  },
];

function hasFreeTrial(pkg: PurchasesPackage): boolean {
  return (
    pkg.product.introPrice !== null && pkg.product.introPrice?.price === 0
  );
}

function computeSavingsPercent(
  monthly: PurchasesPackage,
  annual: PurchasesPackage,
): number | null {
  const mp = monthly.product.price;
  if (!mp) return null;
  const annualPerMonth = annual.product.price / 12;
  const savings = Math.round((1 - annualPerMonth / mp) * 100);
  return savings > 0 ? savings : null;
}

type TierKind = 'monthly' | 'annual' | 'lifetime';

export default function PaywallScreen() {
  const { purchasePackage, restorePurchases, packages, isLoadingPurchase } =
    useAppStore();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selected, setSelected] = useState<TierKind>('annual');

  const annualPkg = packages.find((p) => p.packageType === 'ANNUAL');
  const monthlyPkg = packages.find((p) => p.packageType === 'MONTHLY');
  const lifetimePkg = packages.find((p) => p.packageType === 'LIFETIME');

  const savingsPercent = useMemo(() => {
    if (!monthlyPkg || !annualPkg) return null;
    return computeSavingsPercent(monthlyPkg, annualPkg);
  }, [monthlyPkg, annualPkg]);

  const trialMonthly = monthlyPkg ? hasFreeTrial(monthlyPkg) : false;

  const selectedPkg =
    selected === 'monthly'
      ? monthlyPkg
      : selected === 'annual'
      ? annualPkg
      : lifetimePkg;

  async function handlePurchase() {
    if (!selectedPkg) return;
    setPurchasing(selectedPkg.identifier);
    const { success, error } = await purchasePackage(selectedPkg);
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

  const noPackages = !annualPkg && !monthlyPkg && !lifetimePkg;
  const ctaLabel = useMemo(() => {
    if (!selectedPkg) return 'Indisponible';
    if (selected === 'lifetime') {
      return `Acheter à vie · ${selectedPkg.product.priceString}`;
    }
    if (selected === 'monthly' && trialMonthly) {
      return "Commencer l'essai gratuit";
    }
    return `S'abonner · ${selectedPkg.product.priceString}`;
  }, [selected, selectedPkg, trialMonthly]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Screen
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: 130,
        }}
      >
        {/* HERO */}
        <View
          style={{
            paddingTop: SPACING.lg,
            paddingBottom: SPACING.xl,
            alignItems: 'flex-start',
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: RADIUS.full,
              backgroundColor: COLORS.accentMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: SPACING.lg,
            }}
          >
            <Sparkles
              size={24}
              color={COLORS.accentDark}
              strokeWidth={1.5}
            />
          </View>
          <StyledText variant="eyebrow" color={COLORS.accentDark}>
            HOMELOG PREMIUM
          </StyledText>
          <Separator
            variant="accent"
            width={32}
            style={{ marginTop: SPACING.sm, marginBottom: SPACING.md }}
          />
          <StyledText
            variant="h1"
            style={{ fontSize: 32, lineHeight: 38 }}
          >
            Débloquez Homelog{'\n'}sans limites.
          </StyledText>
          <StyledText
            variant="body"
            color={COLORS.textSecondary}
            style={{ marginTop: SPACING.md, fontSize: 16, lineHeight: 24 }}
          >
            Gérez tous vos biens, exportez vos données,
            et profitez de l'IA de scan sans restriction.
          </StyledText>
        </View>

        {/* FEATURES */}
        <Card
          variant="outlined"
          padding="none"
          radius="md"
          style={{ marginBottom: SPACING.xl, overflow: 'hidden' }}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const isLast = i === FEATURES.length - 1;
            return (
              <View
                key={f.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: SPACING.md,
                  paddingHorizontal: SPACING.base,
                  gap: SPACING.md,
                  borderBottomWidth: isLast ? 0 : 0.5,
                  borderBottomColor: COLORS.border,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: RADIUS.sm,
                    backgroundColor: COLORS.primaryMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    size={18}
                    color={COLORS.primary}
                    strokeWidth={1.75}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <StyledText variant="bodyMedium">{f.label}</StyledText>
                  <StyledText
                    variant="small"
                    color={COLORS.textSecondary}
                    style={{ marginTop: 2 }}
                  >
                    {f.description}
                  </StyledText>
                </View>
                <Check
                  size={16}
                  color={COLORS.accentDark}
                  strokeWidth={2.5}
                />
              </View>
            );
          })}
        </Card>

        {/* TIERS */}
        {noPackages ? (
          <View
            style={{
              padding: SPACING.xl,
              alignItems: 'center',
              gap: SPACING.md,
            }}
          >
            <ActivityIndicator color={COLORS.primary} />
            <StyledText
              variant="small"
              color={COLORS.textSecondary}
              align="center"
            >
              Chargement des offres…{'\n'}
              Vérifiez votre connexion si elles n'apparaissent pas.
            </StyledText>
          </View>
        ) : (
          <View style={{ gap: SPACING.md, marginBottom: SPACING.xl }}>
            {/* ANNUAL */}
            {annualPkg && (
              <TierCard
                title="Annuel"
                price={annualPkg.product.priceString}
                period="par an"
                badge={
                  savingsPercent != null
                    ? `Économise ${savingsPercent}%`
                    : 'Le plus populaire'
                }
                badgeKind="featured"
                selected={selected === 'annual'}
                onPress={() => setSelected('annual')}
              />
            )}
            {/* MONTHLY */}
            {monthlyPkg && (
              <TierCard
                title="Mensuel"
                price={monthlyPkg.product.priceString}
                period="par mois"
                badge={trialMonthly ? '7 jours gratuits' : undefined}
                badgeKind="neutral"
                selected={selected === 'monthly'}
                onPress={() => setSelected('monthly')}
              />
            )}
            {/* LIFETIME */}
            {lifetimePkg && (
              <TierCard
                title="À vie"
                price={lifetimePkg.product.priceString}
                period="paiement unique"
                badge="Sans renouvellement"
                badgeKind="accent"
                selected={selected === 'lifetime'}
                onPress={() => setSelected('lifetime')}
              />
            )}
          </View>
        )}

        {/* RESTORE */}
        <Pressable
          onPress={handleRestore}
          disabled={isLoadingPurchase}
          hitSlop={8}
          style={({ pressed }) => [
            {
              alignSelf: 'center',
              paddingVertical: SPACING.sm,
              paddingHorizontal: SPACING.md,
            },
            pressed && { opacity: 0.6 },
          ]}
        >
          <StyledText
            variant="smallMedium"
            color={COLORS.textSecondary}
            style={{ textDecorationLine: 'underline' }}
          >
            Restaurer mes achats
          </StyledText>
        </Pressable>

        {/* LEGAL */}
        <StyledText
          variant="caption"
          color={COLORS.textTertiary}
          align="center"
          style={{
            marginTop: SPACING.lg,
            marginHorizontal: SPACING.md,
            lineHeight: 16,
          }}
        >
          Le paiement sera prélevé sur votre compte Apple ID à la
          confirmation de l'achat. L'abonnement se renouvelle automatiquement
          au même tarif sauf annulation au moins 24 heures avant la fin de la
          période en cours. Vous pouvez gérer ou annuler votre abonnement à
          tout moment depuis les réglages de votre compte App Store. L'offre
          à vie est un paiement unique sans renouvellement.
        </StyledText>

        {/* LEGAL LINKS */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: SPACING.md,
            marginTop: SPACING.md,
          }}
        >
          <Pressable
            onPress={() => Linking.openURL(TERMS_URL)}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <StyledText
              variant="caption"
              color={COLORS.textSecondary}
              style={{ textDecorationLine: 'underline' }}
            >
              Conditions d'utilisation
            </StyledText>
          </Pressable>
          <StyledText variant="caption" color={COLORS.textTertiary}>
            ·
          </StyledText>
          <Pressable
            onPress={() => Linking.openURL(PRIVACY_URL)}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <StyledText
              variant="caption"
              color={COLORS.textSecondary}
              style={{ textDecorationLine: 'underline' }}
            >
              Politique de confidentialité
            </StyledText>
          </Pressable>
        </View>
      </Screen>

      {/* STICKY CTA */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          paddingBottom: SPACING.lg,
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }}
      >
        <Pressable
          onPress={handlePurchase}
          disabled={!selectedPkg || purchasing !== null}
          style={({ pressed }) => [
            {
              backgroundColor:
                !selectedPkg || purchasing !== null
                  ? COLORS.borderStrong
                  : COLORS.primary,
              borderRadius: RADIUS.md,
              paddingVertical: SPACING.md,
              alignItems: 'center',
              ...SHADOWS.sm,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          {purchasing !== null ? (
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <StyledText variant="title" color={COLORS.textInverse}>
              {ctaLabel}
            </StyledText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ─── TIER CARD ────────────────────────────────────────────────────────────

interface TierCardProps {
  title: string;
  price: string;
  period: string;
  badge?: string;
  badgeKind: 'featured' | 'accent' | 'neutral';
  selected: boolean;
  onPress: () => void;
}

function TierCard({
  title,
  price,
  period,
  badge,
  badgeKind,
  selected,
  onPress,
}: TierCardProps) {
  const badgeBg =
    badgeKind === 'featured'
      ? COLORS.primary
      : badgeKind === 'accent'
      ? COLORS.accentDark
      : COLORS.surfaceAlt;
  const badgeColor =
    badgeKind === 'neutral' ? COLORS.textSecondary : COLORS.textInverse;
  const borderColor = selected ? COLORS.primary : COLORS.border;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: COLORS.surface,
          borderWidth: 1.5,
          borderColor,
          borderRadius: RADIUS.md,
          padding: SPACING.base,
          ...SHADOWS.sm,
        },
        pressed && { opacity: 0.95 },
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACING.xs,
        }}
      >
        <StyledText variant="title">{title}</StyledText>
        {badge && (
          <View
            style={{
              paddingHorizontal: SPACING.sm,
              paddingVertical: 3,
              borderRadius: RADIUS.full,
              backgroundColor: badgeBg,
            }}
          >
            <StyledText
              variant="caption"
              color={badgeColor}
              style={{
                fontFamily: FONTS.sansSemiBold,
                letterSpacing: 0.5,
              }}
            >
              {badge}
            </StyledText>
          </View>
        )}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: SPACING.xs,
        }}
      >
        <StyledText variant="numericLarge">{price}</StyledText>
        <StyledText variant="small" color={COLORS.textSecondary}>
          {period}
        </StyledText>
      </View>
      {selected && (
        <View
          style={{
            position: 'absolute',
            top: SPACING.sm,
            right: SPACING.sm,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check
            size={12}
            color={COLORS.textInverse}
            strokeWidth={3}
          />
        </View>
      )}
    </Pressable>
  );
}
