// app/asset/[id].tsx

import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AttachmentsSection from '../../components/AttachmentsSection';
import { ExtraDataDisplay } from '../../components/ExtraDataDisplay';
import { ASSET_CATEGORIES, EVENT_TYPES } from '../../constants/categories';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import { getAttachmentsByAsset } from '../../src/repositories/eventRepository';
import { exportAssetPDF } from '../../src/services/pdfService';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';
import { Attachment } from '../../src/types';

type EventSortKey = 'date_desc' | 'date_asc' | 'cost_desc';

const EVENT_SORT_LABELS: Record<EventSortKey, string> = {
  date_desc: 'Plus récent',
  date_asc: 'Plus ancien',
  cost_desc: 'Coût ↓',
};

function formatDisplayDate(iso: string): string {
  if (iso.includes('-')) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  return iso;
}

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assets, removeAsset, archiveAsset, editAsset } = useAssetStore();
  const { fetchEventsByAsset, events, getTotalCost } = useEventStore();
  const [totalCost, setTotalCost] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [eventSort, setEventSort] = useState<EventSortKey>('date_desc');

  const asset = assets.find(a => a.id === id);

  useEffect(() => {
    if (id) {
      fetchEventsByAsset(id);
      getTotalCost(id).then(setTotalCost);
      getAttachmentsByAsset(id).then(setAttachments);
    }
  }, [id]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (eventSort === 'date_asc') return a.eventDate.localeCompare(b.eventDate);
      if (eventSort === 'cost_desc') return (b.cost ?? 0) - (a.cost ?? 0);
      return b.eventDate.localeCompare(a.eventDate);
    });
  }, [events, eventSort]);

  function cycleEventSort() {
    setEventSort(prev => {
      if (prev === 'date_desc') return 'date_asc';
      if (prev === 'date_asc') return 'cost_desc';
      return 'date_desc';
    });
  }

  if (!asset) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Bien introuvable</Text>
      </View>
    );
  }

  const category = ASSET_CATEGORIES.find(c => c.id === asset.categoryId);
  const nextEvent = events
    .filter(e => e.nextDueDate && e.status === 'upcoming')
    .sort((a, b) => (a.nextDueDate! < b.nextDueDate! ? -1 : 1))[0];

  const mileage = (asset.extraData as any)?.mileage ?? asset.vehicleDetails?.mileageCurrent;

  const brandModel = (() => {
    const data = asset.extraData as Record<string, any> | undefined;
    const brand = data?.brand ?? asset.brand;
    const model = data?.model ?? asset.model;
    if (brand && model) return `${brand} · ${model}`;
    if (brand) return brand;
    if (model) return model;
    return null;
  })();

  function getEventTypeIcon(type: string) {
    return EVENT_TYPES.find(t => t.id === type)?.icon ?? '📝';
  }

  async function handlePickImage() {
    Alert.alert(
      'Photo du bien',
      'Choisir une source',
      [
        {
          text: 'Appareil photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission refusée', "L'accès à la caméra est nécessaire.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) {
              await editAsset(id, { coverImageUri: result.assets[0].uri });
            }
          },
        },
        {
          text: 'Galerie',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire.");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) {
              await editAsset(id, { coverImageUri: result.assets[0].uri });
            }
          },
        },
        {
          text: asset?.coverImageUri ? 'Supprimer la photo' : 'Annuler',
          style: asset?.coverImageUri ? 'destructive' : 'cancel',
          onPress: async () => {
            if (asset?.coverImageUri) {
              await editAsset(id, { coverImageUri: undefined });
            }
          },
        },
      ]
    );
  }

  async function handleExport() {
    try {
      await exportAssetPDF(asset!, events);
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de générer le PDF.');
    }
  }

  function handleDelete() {
    Alert.alert(
      'Supprimer ce bien',
      'Cette action est irréversible. Tous les événements associés seront supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await removeAsset(id);
            router.back();
          },
        },
      ]
    );
  }

  function handleArchive() {
    Alert.alert(
      'Archiver ce bien',
      'Le bien sera masqué de la liste principale.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Archiver',
          onPress: async () => {
            await archiveAsset(id);
            router.back();
          },
        },
      ]
    );
  }

  const hasBasicInfo = asset.location || asset.purchasePrice || asset.serialNumber;

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} onPress={handlePickImage}>
            {asset.coverImageUri ? (
              <Image source={{ uri: asset.coverImageUri }} style={styles.coverImage} />
            ) : (
              <Text style={styles.headerIconText}>{category?.icon ?? '📦'}</Text>
            )}
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{asset.name}</Text>
            <Text style={styles.headerCategory}>{category?.label}</Text>
            {brandModel && (
              <Text style={styles.headerBrand}>{brandModel}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/asset/edit/${id}`)}
          >
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCost.toFixed(0)} €</Text>
            <Text style={styles.statLabel}>Coût total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{events.length}</Text>
            <Text style={styles.statLabel}>Événements</Text>
          </View>
          {mileage ? (
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{mileage.toLocaleString()}</Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
          ) : null}
        </View>

        {/* Next event */}
        {nextEvent && (
          <View style={styles.nextEventCard}>
            <Text style={styles.nextEventLabel}>Prochain entretien</Text>
            <Text style={styles.nextEventTitle}>{nextEvent.title}</Text>
            <Text style={styles.nextEventDate}>{formatDisplayDate(nextEvent.nextDueDate!)}</Text>
          </View>
        )}

        {/* Infos de base */}
        {hasBasicInfo && (
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Général</Text>
            {asset.location && <DetailRow label="Localisation" value={asset.location} />}
            {asset.purchasePrice && <DetailRow label="Prix d'achat" value={`${asset.purchasePrice} €`} />}
            {asset.serialNumber && <DetailRow label="N° de série" value={asset.serialNumber} />}
          </View>
        )}

        {/* Extra data par catégorie */}
        {asset.extraData && (
          <ExtraDataDisplay
            categoryId={asset.categoryId}
            extraData={asset.extraData as Record<string, any>}
          />
        )}

        {/* Events history */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historique</Text>
            <View style={styles.sectionHeaderRight}>
              {events.length > 1 && (
                <TouchableOpacity style={styles.sortChip} onPress={cycleEventSort}>
                  <Text style={styles.sortChipText}>↕ {EVENT_SORT_LABELS[eventSort]}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => router.push({ pathname: '/event/add', params: { assetId: id } })}>
                <Text style={styles.addEventLink}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>

          {sortedEvents.length === 0 ? (
            <View style={styles.emptyEvents}>
              <Text style={styles.emptyEventsText}>Aucun événement enregistré</Text>
              <TouchableOpacity
                style={styles.addEventButton}
                onPress={() => router.push({ pathname: '/event/add', params: { assetId: id } })}
              >
                <Text style={styles.addEventButtonText}>+ Ajouter un événement</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sortedEvents.map(event => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => router.push(`/event/${event.id}`)}
              >
                <View style={styles.eventIcon}>
                  <Text>{getEventTypeIcon(event.eventType)}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>{formatDisplayDate(event.eventDate)}</Text>
                  {event.providerName && (
                    <Text style={styles.eventProvider}>{event.providerName}</Text>
                  )}
                </View>
                <View style={styles.eventRight}>
                  {event.cost !== undefined && (
                    <Text style={styles.eventCost}>{event.cost} €</Text>
                  )}
                  <View style={[
                    styles.eventBadge,
                    event.status === 'upcoming' ? styles.eventBadgeUpcoming : styles.eventBadgePast,
                  ]}>
                    <Text style={[
                      styles.eventBadgeText,
                      event.status === 'upcoming' ? styles.eventBadgeTextUpcoming : styles.eventBadgeTextPast,
                    ]}>
                      {event.status === 'upcoming' ? 'À venir' : 'Passé'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Pièces jointes */}
        <AttachmentsSection
          attachments={attachments}
          assetId={id}
          onChanged={() => getAttachmentsByAsset(id).then(setAttachments)}
        />

        {/* Notes */}
        {asset.notes && (
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{asset.notes}</Text>
          </View>
        )}

      </ScrollView>

      {/* Actions fixes en bas */}
      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Text style={styles.exportButtonText}>📄 PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.archiveButton} onPress={handleArchive}>
          <Text style={styles.archiveButtonText}>Archiver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Supprimer</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.textSecondary, fontSize: fontSize.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  coverImage: { width: 56, height: 56, borderRadius: radius.md },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: { fontSize: 11 },
  headerIconText: { fontSize: 28 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  headerCategory: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  headerBrand: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 2 },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  statValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  nextEventCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  nextEventLabel: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold, marginBottom: 4 },
  nextEventTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  nextEventDate: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: spacing.sm },
  sortChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
  addEventLink: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.medium },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  detailLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  detailValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  emptyEvents: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyEventsText: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md },
  addEventButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  addEventButtonText: { color: colors.white, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.sm,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  eventDate: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  eventProvider: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 2 },
  eventRight: { alignItems: 'flex-end', gap: 4 },
  eventCost: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.accent },
  eventBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  eventBadgePast: { backgroundColor: colors.surfaceAlt },
  eventBadgeUpcoming: { backgroundColor: colors.primaryLight },
  eventBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  eventBadgeTextPast: { color: colors.textSecondary },
  eventBadgeTextUpcoming: { color: colors.primary },
  notesText: { fontSize: fontSize.md, color: colors.text, lineHeight: 22 },
  actionsBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: 32,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exportButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  exportButtonText: { color: colors.primary, fontWeight: fontWeight.medium },
  archiveButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  archiveButtonText: { color: colors.textSecondary, fontWeight: fontWeight.medium },
  deleteButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
  },
  deleteButtonText: { color: colors.danger, fontWeight: fontWeight.medium },
});
