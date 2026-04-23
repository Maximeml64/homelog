// app/(tabs)/settings.tsx

import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import { getEventsByAsset } from '../../src/repositories/eventRepository';
import { exportCSV } from '../../src/services/csvService';
import { cancelAllReminders } from '../../src/services/notificationService';
import { exportAllPDF } from '../../src/services/pdfService';
import { useAppStore } from '../../src/stores/appStore';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';
import { MaintenanceEvent } from '../../src/types';

const SUPPORT_EMAIL = 'm.maurylaribiere@gmail.com';

export default function SettingsScreen() {
  const { assets, assetCount, fetchAssetCount } = useAssetStore();
  const { events, fetchAllEvents } = useEventStore();
  const { isPremium, restorePurchases, isLoadingPurchase } = useAppStore();

  useFocusEffect(
    useCallback(() => {
      fetchAssetCount();
      fetchAllEvents();
    }, [])
  );

  function handleClearNotifications() {
    Alert.alert(
      'Annuler tous les rappels',
      'Toutes les notifications planifiées seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            await cancelAllReminders();
            Alert.alert('Fait', 'Tous les rappels ont été annulés.');
          },
        },
      ]
    );
  }

  async function buildEventsMap(): Promise<Record<string, MaintenanceEvent[]>> {
    const eventsMap: Record<string, MaintenanceEvent[]> = {};
    for (const asset of assets) {
      eventsMap[asset.id] = await getEventsByAsset(asset.id);
    }
    return eventsMap;
  }

  async function handleExportPDF() {
    if (assets.length === 0) {
      Alert.alert('Aucun bien', 'Ajoutez des biens avant de générer un rapport.');
      return;
    }
    try {
      const eventsMap = await buildEventsMap();
      await exportAllPDF(assets, eventsMap);
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de générer le PDF.');
    }
  }

  async function handleExportCSV() {
    if (assets.length === 0) {
      Alert.alert('Aucun bien', "Ajoutez des biens avant d'exporter.");
      return;
    }
    try {
      const eventsMap = await buildEventsMap();
      await exportCSV(assets, eventsMap);
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de générer le CSV.');
    }
  }

  async function handleRestore() {
    const { success, error } = await restorePurchases();
    if (success) {
      Alert.alert('Succès', 'Vos achats ont été restaurés.');
    } else if (error) {
      Alert.alert('Erreur', error);
    } else {
      Alert.alert('Aucun achat', 'Aucun abonnement actif trouvé.');
    }
  }

  function handleManageSubscription() {
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  }

  function handleContactSupport() {
    const subject = encodeURIComponent('Homelog - Support');
    const body = encodeURIComponent('Version : 1.0.0\n\nDescription du problème :\n');
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  }

  function handleReportBug() {
    const subject = encodeURIComponent('Homelog - Bug Report');
    const body = encodeURIComponent('Version : 1.0.0\n\nDescription du bug :\n\nÉtapes pour reproduire :\n');
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Premium banner */}
      {isPremium ? (
        <View style={styles.premiumActiveCard}>
          <View style={styles.premiumLeft}>
            <Text style={styles.premiumActiveTitle}>✨ Premium actif</Text>
            <Text style={styles.premiumActiveSubtitle}>
              Biens illimités · Export PDF · Statistiques avancées
            </Text>
          </View>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PRO</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.premiumCard}
          onPress={() => router.push('/paywall')}
        >
          <View style={styles.premiumLeft}>
            <Text style={styles.premiumTitle}>✨ Passer en Premium</Text>
            <Text style={styles.premiumSubtitle}>
              Biens illimités · Export PDF · Statistiques avancées
            </Text>
          </View>
          <Text style={styles.premiumArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Abonnement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Abonnement</Text>
        <View style={styles.card}>
          {isPremium ? (
            <TouchableOpacity style={styles.actionRow} onPress={handleManageSubscription}>
              <Text style={styles.actionLabel}>Gérer mon abonnement</Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleRestore}
              disabled={isLoadingPurchase}
            >
              <Text style={styles.actionLabel}>
                {isLoadingPurchase ? 'Restauration...' : 'Restaurer un achat'}
              </Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Données */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Données</Text>
        <View style={styles.card}>
          <SettingsRow label="Biens enregistrés" value={String(assetCount)} />
          <SettingsRow label="Événements" value={String(events.length)} />
          <TouchableOpacity style={styles.actionRow} onPress={handleExportPDF}>
            <Text style={[styles.actionLabel, { color: colors.primary }]}>
              📄 Exporter tout en PDF
            </Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={handleExportCSV}>
            <Text style={[styles.actionLabel, { color: colors.primary }]}>
              📊 Exporter en CSV (Excel)
            </Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/archived')}>
            <Text style={styles.actionLabel}>📦 Biens archivés</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleClearNotifications}>
            <Text style={[styles.actionLabel, { color: colors.danger }]}>
              Annuler tous les rappels
            </Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleContactSupport}>
            <Text style={styles.actionLabel}>✉️ Nous contacter</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={handleReportBug}>
            <Text style={styles.actionLabel}>🐛 Signaler un bug</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Légal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Légal</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => Linking.openURL('https://momentous-locket-2af.notion.site/POLITIQUE-DE-CONFIDENTIALIT-Homelog-34284071bf3e801b9e04c95523a335f1')}
          >
            <Text style={styles.actionLabel}>Politique de confidentialité</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => Linking.openURL('https://momentous-locket-2af.notion.site/CONDITIONS-G-N-RALES-D-UTILISATION-Homelog-34284071bf3e80278f70c5cff4a24962')}
          >
            <Text style={styles.actionLabel}>Conditions d'utilisation</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* À propos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <View style={styles.card}>
          <SettingsRow label="Version" value="1.0.0" />
        </View>
      </View>

    </ScrollView>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingsRow}>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  premiumCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  premiumActiveCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadow.sm,
  },
  premiumLeft: { flex: 1 },
  premiumTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.white },
  premiumSubtitle: { fontSize: fontSize.sm, color: colors.primaryLight, marginTop: 4 },
  premiumActiveTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
  premiumActiveSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  premiumArrow: { fontSize: 28, color: colors.white },
  premiumBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  premiumBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.white },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsLabel: { fontSize: fontSize.md, color: colors.text },
  settingsValue: { fontSize: fontSize.md, color: colors.textSecondary },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionLabel: { fontSize: fontSize.md, color: colors.text },
  actionArrow: { fontSize: 20, color: colors.textTertiary },
});
