// app/event/edit/[id].tsx

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { EVENT_TYPES } from '../../../constants/categories';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../../constants/theme';
import { getEventById } from '../../../src/repositories/eventRepository';
import { cancelReminder, scheduleReminder } from '../../../src/services/notificationService';
import { useAssetStore } from '../../../src/stores/assetStore';
import { useEventStore } from '../../../src/stores/eventStore';
import { EventType, MaintenanceEvent } from '../../../src/types';

const VEHICLE_CATEGORIES = ['car', 'moto', 'bike', 'scooter'];

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function parseLocalDate(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3 || dateStr.length !== 10) return null;
  const [d, m, y] = parts.map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assets } = useAssetStore();
  const { editEvent, fetchEventsByAsset, fetchUpcomingReminders } = useEventStore();

  const [original, setOriginal] = useState<MaintenanceEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [eventType, setEventType] = useState<EventType>('maintenance');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [cost, setCost] = useState('');
  const [providerName, setProviderName] = useState('');
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextDueMileage, setNextDueMileage] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);

  useEffect(() => {
    if (!id) return;
    getEventById(id).then(event => {
      if (!event) { setLoading(false); return; }
      setOriginal(event);
      setEventType(event.eventType);
      setTitle(event.title);
      setEventDate(isoToDisplay(event.eventDate));
      setCost(event.cost !== undefined ? String(event.cost) : '');
      setProviderName(event.providerName ?? '');
      setMileage(event.mileageAtEvent !== undefined ? String(event.mileageAtEvent) : '');
      setNotes(event.notes ?? '');
      setNextDueDate(event.nextDueDate ? isoToDisplay(event.nextDueDate) : '');
      setNextDueMileage(event.nextDueMileage !== undefined ? String(event.nextDueMileage) : '');
      setReminderEnabled(event.reminderEnabled);
      setLoading(false);
    });
  }, [id]);

  const asset = original ? assets.find(a => a.id === original.assetId) : null;
  const isVehicle = asset ? VEHICLE_CATEGORIES.includes(asset.categoryId) : false;

  const parsedDate = parseLocalDate(eventDate);
  const parsedNextDueDate = parseLocalDate(nextDueDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = parsedDate ? parsedDate <= today : true;
  const isUpcoming = !isPast;
  const statusLabel = parsedDate ? (isUpcoming ? 'À venir' : 'Passé') : null;
  const canEnableReminder = !!parsedNextDueDate && parsedNextDueDate > today;

  async function handleSave() {
    if (!original) return;
    if (!title.trim()) {
      Alert.alert('Champ requis', 'Le titre est obligatoire.');
      return;
    }
    if (!parsedDate) {
      Alert.alert('Date invalide', 'Saisis une date au format JJ/MM/AAAA.');
      return;
    }
    if (nextDueDate && !parsedNextDueDate) {
      Alert.alert('Date invalide', 'La date du prochain entretien est invalide.');
      return;
    }

    const eventDateISO = parsedDate.toISOString().split('T')[0];
    const nextDueDateISO = parsedNextDueDate ? parsedNextDueDate.toISOString().split('T')[0] : undefined;

    setSubmitting(true);
    try {
      let reminderNotifId: string | undefined = original.reminderNotifId;

      if (original.reminderNotifId) {
        await cancelReminder(original.reminderNotifId);
        reminderNotifId = undefined;
      }

      if (reminderEnabled && parsedNextDueDate && parsedNextDueDate > today) {
        const reminderDate = new Date(parsedNextDueDate);
        reminderDate.setHours(9, 0, 0, 0);
        const tempId = `${original.assetId}-${Date.now()}`;
        const notifId = await scheduleReminder(
          tempId,
          asset?.name ?? 'Entretien',
          title,
          reminderDate
        );
        reminderNotifId = notifId ?? undefined;
      }

      await editEvent(original.id, {
        eventType,
        title: title.trim(),
        eventDate: eventDateISO,
        cost: cost ? parseFloat(cost.replace(',', '.')) : undefined,
        providerName: providerName.trim() || undefined,
        notes: notes.trim() || undefined,
        mileageAtEvent: mileage ? parseInt(mileage, 10) : undefined,
        nextDueDate: nextDueDateISO,
        nextDueMileage: nextDueMileage ? parseInt(nextDueMileage, 10) : undefined,
        reminderEnabled: reminderEnabled && canEnableReminder,
        reminderNotifId,
        status: isPast ? 'past' : 'upcoming',
      });

      await fetchEventsByAsset(original.assetId);
      await fetchUpcomingReminders();
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? "Impossible de modifier l'événement.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.secondaryText}>Chargement…</Text>
      </View>
    );
  }

  if (!original) {
    return (
      <View style={styles.centered}>
        <Text style={styles.secondaryText}>Événement introuvable</Text>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {asset && (
        <View style={styles.assetBadge}>
          <Text style={styles.assetBadgeText}>{asset.name}</Text>
        </View>
      )}

      <Text style={styles.label}>Type d'événement</Text>
      <View style={styles.typeGrid}>
        {EVENT_TYPES.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.typeChip, eventType === t.id && styles.typeChipActive]}
            onPress={() => setEventType(t.id as EventType)}
          >
            <Text style={styles.typeChipIcon}>{t.icon}</Text>
            <Text style={[styles.typeChipLabel, eventType === t.id && styles.typeChipLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Titre <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Ex : Vidange, Révision 30 000 km…"
        placeholderTextColor={colors.textTertiary}
      />

      <Text style={styles.label}>Date de l'événement <Text style={styles.required}>*</Text></Text>
      <View style={styles.dateRow}>
        <TextInput
          style={[styles.input, styles.dateInput]}
          value={eventDate}
          onChangeText={v => setEventDate(formatDateInput(v))}
          placeholder="JJ/MM/AAAA"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          maxLength={10}
        />
        {statusLabel && (
          <View style={[styles.statusBadge, isUpcoming ? styles.statusBadgeUpcoming : styles.statusBadgePast]}>
            <Text style={[styles.statusBadgeText, isUpcoming ? styles.statusBadgeTextUpcoming : styles.statusBadgeTextPast]}>
              {statusLabel}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.label}>Coût (€)</Text>
      <TextInput
        style={styles.input}
        value={cost}
        onChangeText={setCost}
        placeholder="0.00"
        placeholderTextColor={colors.textTertiary}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Prestataire</Text>
      <TextInput
        style={styles.input}
        value={providerName}
        onChangeText={setProviderName}
        placeholder="Nom du garage, technicien…"
        placeholderTextColor={colors.textTertiary}
      />

      {isVehicle && (
        <>
          <Text style={styles.label}>Kilométrage à l'événement</Text>
          <TextInput
            style={styles.input}
            value={mileage}
            onChangeText={setMileage}
            placeholder="Ex : 45000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </>
      )}

      <Text style={styles.sectionSeparator}>Prochain entretien</Text>

      <Text style={styles.label}>Date du prochain entretien</Text>
      <TextInput
        style={styles.input}
        value={nextDueDate}
        onChangeText={v => setNextDueDate(formatDateInput(v))}
        placeholder="JJ/MM/AAAA"
        placeholderTextColor={colors.textTertiary}
        keyboardType="numeric"
        maxLength={10}
      />

      {isVehicle && (
        <>
          <Text style={styles.label}>Prochain kilométrage</Text>
          <TextInput
            style={styles.input}
            value={nextDueMileage}
            onChangeText={setNextDueMileage}
            placeholder="Ex : 60000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </>
      )}

      <View style={[styles.reminderRow, !canEnableReminder && styles.reminderRowDisabled]}>
        <View style={styles.reminderInfo}>
          <Text style={styles.reminderLabel}>Rappel de notification</Text>
          <Text style={styles.reminderSub}>
            {canEnableReminder
              ? `Notification le ${nextDueDate}`
              : 'Renseigne une date de prochain entretien pour activer'}
          </Text>
        </View>
        <Switch
          value={reminderEnabled && canEnableReminder}
          onValueChange={(val) => {
            if (!canEnableReminder) return;
            setReminderEnabled(val);
          }}
          trackColor={{ false: colors.textTertiary, true: colors.primary }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.textTertiary}
        />
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Observations, pièces remplacées…"
        placeholderTextColor={colors.textTertiary}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSave}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { color: colors.textSecondary, fontSize: fontSize.md },
  assetBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  assetBadgeText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  required: { color: colors.danger },
  sectionSeparator: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.md,
    color: colors.text,
    ...shadow.sm,
  },
  inputMultiline: { height: 100, paddingTop: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateInput: { flex: 1 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full },
  statusBadgePast: { backgroundColor: colors.surfaceAlt },
  statusBadgeUpcoming: { backgroundColor: colors.primaryLight },
  statusBadgeText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  statusBadgeTextPast: { color: colors.textSecondary },
  statusBadgeTextUpcoming: { color: colors.primary },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    width: '23%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    ...shadow.sm,
  },
  typeChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  typeChipIcon: { fontSize: 20 },
  typeChipLabel: { fontSize: 10, color: colors.textSecondary, textAlign: 'center' },
  typeChipLabelActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  reminderRowDisabled: { opacity: 0.5 },
  reminderInfo: { flex: 1 },
  reminderLabel: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  reminderSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
});
