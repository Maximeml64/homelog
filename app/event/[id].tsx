// app/event/[id].tsx

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AttachmentsSection from '../../components/AttachmentsSection';
import { ASSET_CATEGORIES, EVENT_TYPES } from '../../constants/categories';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import { getEventById } from '../../src/repositories/eventRepository';
import { cancelReminder } from '../../src/services/notificationService';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';
import { Attachment, MaintenanceEvent } from '../../src/types';

function formatDisplayDate(iso: string): string {
  if (iso.includes('-')) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  return iso;
}

function getDateDelta(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  if (diff > 0) return `Dans ${diff} jours`;
  return `Il y a ${Math.abs(diff)} jours`;
}

function getDueDeltaColor(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return colors.danger;
  if (diff <= 7) return colors.warning;
  return colors.primary;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assets } = useAssetStore();
  const { removeEvent, fetchEventsByAsset } = useEventStore();
  const [event, setEvent] = useState<MaintenanceEvent | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      getEventById(id).then(e => {
        setEvent(e);
        setAttachments(e?.attachments ?? []);
        setLoading(false);
      });
    }, [id])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.secondaryText}>Chargement…</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.secondaryText}>Événement introuvable</Text>
      </View>
    );
  }

  const asset = assets.find(a => a.id === event.assetId);
  const eventTypeMeta = EVENT_TYPES.find(t => t.id === event.eventType);
  const categoryIcon = asset
    ? (ASSET_CATEGORIES.find(c => c.id === asset.categoryId)?.icon ?? '📦')
    : '📦';

  function handleDelete() {
    Alert.alert(
      'Supprimer cet événement',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (event!.reminderNotifId) {
              await cancelReminder(event!.reminderNotifId);
            }
            await removeEvent(event!.id);
            if (event!.assetId) {
              await fetchEventsByAsset(event!.assetId);
            }
            router.back();
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>{eventTypeMeta?.icon ?? '📝'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{event.title}</Text>
          <Text style={styles.headerType}>{eventTypeMeta?.label}</Text>
          {asset && (
            <TouchableOpacity
              style={styles.headerAssetRow}
              onPress={() => router.push(`/asset/${asset.id}`)}
            >
              <Text style={styles.headerAssetIcon}>{categoryIcon}</Text>
              <Text style={styles.headerAsset}>{asset.name}</Text>
              <Text style={styles.headerAssetChevron}>›</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={[
            styles.statusBadge,
            event.status === 'upcoming' ? styles.statusBadgeUpcoming : styles.statusBadgePast,
          ]}>
            <Text style={[
              styles.statusBadgeText,
              event.status === 'upcoming' ? styles.statusBadgeTextUpcoming : styles.statusBadgeTextPast,
            ]}>
              {event.status === 'upcoming' ? 'À venir' : 'Passé'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/event/edit/${event.id}`)}
          >
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Infos clés */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date</Text>
          <View style={styles.infoValueRow}>
            <Text style={styles.infoValue}>{formatDisplayDate(event.eventDate)}</Text>
            <Text style={styles.infoDelta}>{getDateDelta(event.eventDate)}</Text>
          </View>
        </View>
        {event.cost !== undefined && (
          <InfoRow label="Coût" value={`${event.cost.toFixed(2)} €`} highlight />
        )}
        {event.providerName && (
          <InfoRow label="Prestataire" value={event.providerName} />
        )}
        {event.mileageAtEvent !== undefined && (
          <InfoRow label="Kilométrage" value={`${event.mileageAtEvent.toLocaleString()} km`} />
        )}
      </View>

      {/* Prochain entretien */}
      {event.nextDueDate && (
        <View style={styles.nextDueCard}>
          <View style={styles.nextDueHeader}>
            <Text style={styles.nextDueLabel}>Prochain entretien</Text>
            {event.reminderEnabled && (
              <View style={styles.reminderBadge}>
                <Text style={styles.reminderBadgeText}>🔔 Rappel actif</Text>
              </View>
            )}
          </View>
          <Text style={styles.nextDueDate}>{formatDisplayDate(event.nextDueDate)}</Text>
          <Text style={[styles.nextDueDelta, { color: getDueDeltaColor(event.nextDueDate) }]}>
            {getDateDelta(event.nextDueDate)}
          </Text>
          {event.nextDueMileage !== undefined && (
            <Text style={styles.nextDueMileage}>
              ou à {event.nextDueMileage.toLocaleString()} km
            </Text>
          )}
        </View>
      )}

      {/* Notes */}
      {event.notes && (
        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{event.notes}</Text>
        </View>
      )}

      {/* Pièces jointes */}
      <AttachmentsSection
        attachments={attachments}
        eventId={event.id}
        onChanged={() => {
          getEventById(event.id).then(e => {
            setAttachments(e?.attachments ?? []);
          });
        }}
      />

      {/* Supprimer */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Supprimer cet événement</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { color: colors.textSecondary, fontSize: fontSize.md },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerIconText: { fontSize: 24 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  headerType: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  headerAssetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  headerAssetIcon: { fontSize: 13 },
  headerAsset: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.medium },
  headerAssetChevron: { fontSize: fontSize.sm, color: colors.primary },
  headerRight: { alignItems: 'flex-end', gap: spacing.sm },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusBadgePast: { backgroundColor: colors.surfaceAlt },
  statusBadgeUpcoming: { backgroundColor: colors.primaryLight },
  statusBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  statusBadgeTextPast: { color: colors.textSecondary },
  statusBadgeTextUpcoming: { color: colors.primary },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  infoValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  infoValueHighlight: { color: colors.accent, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  infoDelta: { fontSize: fontSize.xs, color: colors.textTertiary },
  nextDueCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  nextDueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  nextDueLabel: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold },
  nextDueDate: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  nextDueDelta: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginTop: 2 },
  nextDueMileage: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  reminderBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  reminderBadgeText: { fontSize: fontSize.xs, color: colors.white },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  notesText: { fontSize: fontSize.md, color: colors.text, lineHeight: 22 },
  deleteButton: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  deleteButtonText: { color: colors.danger, fontWeight: fontWeight.medium },
});
