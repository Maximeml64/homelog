// app/(tabs)/settings.tsx

import React, { useCallback, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Activity,
  Archive,
  BellOff,
  Bug,
  CreditCard,
  Database,
  FileSpreadsheet,
  FileText,
  Mail,
  Package,
  RotateCcw,
  ScrollText,
  Shield,
} from 'lucide-react-native';
import {
  Screen,
  StyledText,
  SettingsItem,
  SettingsGroup,
  PremiumHeroCard,
} from '../../components/ui';
import { COLORS, SPACING } from '../../constants/theme';
import {
  APP_VERSION,
  PRIVACY_URL,
  SUPPORT_EMAIL,
  TERMS_URL,
} from '../../constants/config';
import { getAllEvents } from '../../src/repositories/eventRepository';
import { exportBackup } from '../../src/services/backupService';
import { exportCSV } from '../../src/services/csvService';
import { cancelAllReminders } from '../../src/services/notificationService';
import { exportAllPDF } from '../../src/services/pdfService';
import { logger } from '../../src/utils/logger';
import { useAppStore } from '../../src/stores/appStore';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';
import { MaintenanceEvent } from '../../src/types';

export default function SettingsScreen() {
  const { isPremium, restorePurchases, isLoadingPurchase } = useAppStore();
  const { assets, assetCount, fetchAssetCount } = useAssetStore();
  const { events, fetchAllEvents } = useEventStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAssetCount();
      fetchAllEvents();
    }, [fetchAssetCount, fetchAllEvents]),
  );

  async function buildEventsMap(): Promise<Record<string, MaintenanceEvent[]>> {
    const allEvents = await getAllEvents();
    const eventsMap: Record<string, MaintenanceEvent[]> = {};
    for (const asset of assets) {
      eventsMap[asset.id] = [];
    }
    for (const event of allEvents) {
      if (eventsMap[event.assetId]) {
        eventsMap[event.assetId].push(event);
      }
    }
    return eventsMap;
  }

  function handleManageSubscription() {
    Linking.openURL('https://apps.apple.com/account/subscriptions');
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

  async function handleExportPDF() {
    if (assets.length === 0) {
      Alert.alert('Aucun bien', 'Ajoutez des biens avant de générer un rapport.');
      return;
    }
    setIsExporting(true);
    try {
      const eventsMap = await buildEventsMap();
      await exportAllPDF(assets, eventsMap);
    } catch (e) {
      logger.error('settings', 'exportAllPDF failed', e);
      Alert.alert('Erreur', 'Impossible de générer le PDF.');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportCSV() {
    if (assets.length === 0) {
      Alert.alert('Aucun bien', "Ajoutez des biens avant d'exporter.");
      return;
    }
    setIsExporting(true);
    try {
      const eventsMap = await buildEventsMap();
      await exportCSV(assets, eventsMap);
    } catch (e) {
      logger.error('settings', 'exportCSV failed', e);
      Alert.alert('Erreur', 'Impossible de générer le CSV.');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleBackup() {
    if (assets.length === 0) {
      Alert.alert(
        'Aucun bien',
        'Ajoutez au moins un bien avant de créer une sauvegarde.',
      );
      return;
    }
    setIsBackingUp(true);
    try {
      await exportBackup();
    } catch (e: any) {
      logger.error('settings', 'exportBackup failed', e);
      Alert.alert(
        'Erreur',
        e?.message ?? 'Impossible de générer la sauvegarde.',
      );
    } finally {
      setIsBackingUp(false);
    }
  }

  function handleCancelAllReminders() {
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
      ],
    );
  }

  function handleContact() {
    const subject = encodeURIComponent('Homelog - Support');
    const body = encodeURIComponent(`Version : ${APP_VERSION}\n\nDescription du problème :\n`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  }

  function handleReportBug() {
    const subject = encodeURIComponent('Homelog - Bug Report');
    const body = encodeURIComponent(`Version : ${APP_VERSION}\n\nDescription du bug :\n\nÉtapes pour reproduire :\n`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  }

  return (
    <Screen>
      {/* HEADER */}
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.lg }}>
        <StyledText variant="eyebrow">RÉGLAGES</StyledText>
        <StyledText variant="h2" style={{ marginTop: SPACING.xs }}>
          Préférences
        </StyledText>
      </View>

      {/* HERO PREMIUM */}
      <PremiumHeroCard
        isPremium={isPremium}
        onPress={() => router.push('/paywall')}
        style={{ marginBottom: SPACING.xl }}
      />

      {/* ABONNEMENT */}
      <SettingsGroup title="ABONNEMENT">
        {isPremium ? (
          <SettingsItem
            icon={CreditCard}
            label="Gérer mon abonnement"
            onPress={handleManageSubscription}
            isLast
          />
        ) : (
          <SettingsItem
            icon={RotateCcw}
            label={isLoadingPurchase ? 'Restauration…' : 'Restaurer un achat'}
            onPress={handleRestore}
            disabled={isLoadingPurchase}
            isLast
          />
        )}
      </SettingsGroup>

      {/* DONNÉES */}
      <SettingsGroup title="DONNÉES">
        <SettingsItem icon={Package} label="Biens enregistrés" value={assetCount} />
        <SettingsItem icon={Activity} label="Événements" value={events.length} />
        <SettingsItem
          icon={FileText}
          label="Exporter tout en PDF"
          onPress={handleExportPDF}
          disabled={isExporting}
        />
        <SettingsItem
          icon={FileSpreadsheet}
          label="Exporter en CSV (Excel)"
          onPress={handleExportCSV}
          disabled={isExporting}
        />
        <SettingsItem
          icon={Database}
          label={
            isBackingUp ? 'Sauvegarde en cours…' : 'Sauvegarde complète (.zip)'
          }
          onPress={handleBackup}
          disabled={isBackingUp}
        />
        <SettingsItem
          icon={Archive}
          label="Biens archivés"
          onPress={() => router.push('/archived')}
          isLast
        />
      </SettingsGroup>

      {/* NOTIFICATIONS */}
      <SettingsGroup title="NOTIFICATIONS">
        <SettingsItem
          icon={BellOff}
          label="Annuler tous les rappels"
          variant="danger"
          onPress={handleCancelAllReminders}
          isLast
        />
      </SettingsGroup>

      {/* SUPPORT */}
      <SettingsGroup title="SUPPORT">
        <SettingsItem icon={Mail} label="Nous contacter" onPress={handleContact} />
        <SettingsItem icon={Bug} label="Signaler un bug" onPress={handleReportBug} isLast />
      </SettingsGroup>

      {/* LÉGAL */}
      <SettingsGroup title="LÉGAL">
        <SettingsItem
          icon={Shield}
          label="Politique de confidentialité"
          onPress={() => Linking.openURL(PRIVACY_URL)}
        />
        <SettingsItem
          icon={ScrollText}
          label="Conditions d'utilisation"
          onPress={() => Linking.openURL(TERMS_URL)}
          isLast
        />
      </SettingsGroup>

      {/* FOOTER VERSION */}
      <View style={{ alignItems: 'center', marginTop: SPACING.lg, paddingBottom: SPACING.xl }}>
        <StyledText variant="caption" color={COLORS.textTertiary}>
          Homelog · Version {APP_VERSION}
        </StyledText>
      </View>
    </Screen>
  );
}
