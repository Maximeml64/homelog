// app/event/edit/[id].tsx

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Bell, BellOff, StickyNote } from 'lucide-react-native';
import {
  Card,
  CategoryIcon,
  Chip,
  DateField,
  FormSection,
  Screen,
  SelectGrid,
  SelectGridOption,
  StyledText,
  TextField,
  Toggle,
} from '../../../components/ui';
import { EVENT_TYPE_ICON_MAP } from '../../../components/ui/EventTypeIcon';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../../constants/theme';
import { EVENT_TYPES, RECURRENCE_OPTIONS } from '../../../constants/categories';
import { uuidv4 } from '../../../src/db/client';
import { getEventById } from '../../../src/repositories/eventRepository';
import {
  cancelReminder,
  scheduleReminder,
} from '../../../src/services/notificationService';
import { useAssetStore } from '../../../src/stores/assetStore';
import { useEventStore } from '../../../src/stores/eventStore';
import { formatLongDate, getCategoryLabel } from '../../../src/utils/format';
import type { EventType, MaintenanceEvent } from '../../../src/types';

const VEHICLE_CATEGORIES: ReadonlySet<string> = new Set([
  'car',
  'moto',
  'bike',
  'scooter',
]);

const VALID_EVENT_TYPES: ReadonlySet<string> = new Set([
  'maintenance',
  'repair',
  'inspection',
  'cleaning',
  'replacement',
  'incident',
  'warranty',
  'note',
]);

function isEventType(val: string): val is EventType {
  return VALID_EVENT_TYPES.has(val);
}

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assets } = useAssetStore();
  const { editEvent, fetchEventsByAsset, fetchUpcomingReminders } =
    useEventStore();

  const [original, setOriginal] = useState<MaintenanceEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [eventType, setEventType] = useState<EventType>('maintenance');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState<string | undefined>(undefined);
  const [cost, setCost] = useState('');
  const [providerName, setProviderName] = useState('');
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [nextDueMileage, setNextDueMileage] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [recurrenceMonths, setRecurrenceMonths] = useState<number | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getEventById(id).then((event) => {
      if (!event) {
        setLoading(false);
        return;
      }
      setOriginal(event);
      setEventType(event.eventType);
      setTitle(event.title);
      setEventDate(event.eventDate);
      setCost(event.cost !== undefined ? String(event.cost) : '');
      setProviderName(event.providerName ?? '');
      setMileage(
        event.mileageAtEvent !== undefined ? String(event.mileageAtEvent) : '',
      );
      setNotes(event.notes ?? '');
      setNextDueMileage(
        event.nextDueMileage !== undefined ? String(event.nextDueMileage) : '',
      );
      setReminderEnabled(event.reminderEnabled);
      setRecurrenceMonths(event.recurrenceMonths ?? null);
      setLoading(false);
    });
  }, [id]);

  const asset = original
    ? assets.find((a) => a.id === original.assetId)
    : null;
  const isVehicle = asset ? VEHICLE_CATEGORIES.has(asset.categoryId) : false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedDate = eventDate ? new Date(eventDate) : null;

  const isPast = parsedDate ? parsedDate <= today : true;
  const isUpcoming = !isPast;
  const canEnableReminder = !!parsedDate && parsedDate > today;

  const eventTypeOptions: SelectGridOption[] = useMemo(
    () =>
      EVENT_TYPES.map((t) => ({
        id: t.id,
        label: t.label,
        icon: EVENT_TYPE_ICON_MAP[t.id] ?? StickyNote,
      })),
    [],
  );

  function handleTypeSelect(value: string) {
    if (isEventType(value)) setEventType(value);
  }

  async function handleSave() {
    if (!original) return;
    if (!title.trim()) {
      Alert.alert('Champ requis', 'Le titre est obligatoire.');
      return;
    }
    if (!eventDate) {
      Alert.alert('Champ requis', "La date de l'événement est obligatoire.");
      return;
    }

    setSubmitting(true);
    try {
      let reminderNotifId: string | undefined = original.reminderNotifId;

      const reminderShouldExist =
        reminderEnabled && parsedDate !== null && parsedDate > today;
      const reminderInputsChanged =
        original.eventDate !== eventDate ||
        original.title !== title.trim() ||
        original.reminderEnabled !== reminderEnabled;

      if (reminderInputsChanged) {
        if (original.reminderNotifId) {
          await cancelReminder(original.reminderNotifId);
          reminderNotifId = undefined;
        }
        if (reminderShouldExist && parsedDate) {
          const reminderDate = new Date(parsedDate);
          reminderDate.setHours(9, 0, 0, 0);
          const tempId = uuidv4();
          const notifId = await scheduleReminder(
            tempId,
            asset?.name ?? 'Entretien',
            title.trim(),
            reminderDate,
          );
          reminderNotifId = notifId ?? undefined;
        }
      }

      await editEvent(original.id, {
        eventType,
        title: title.trim(),
        eventDate,
        cost: cost.trim() ? parseFloat(cost.replace(',', '.')) : undefined,
        providerName: providerName.trim() || undefined,
        notes: notes.trim() || undefined,
        mileageAtEvent: mileage.trim() ? parseInt(mileage, 10) : undefined,
        nextDueDate: isUpcoming ? eventDate : undefined,
        nextDueMileage: nextDueMileage.trim()
          ? parseInt(nextDueMileage, 10)
          : undefined,
        reminderEnabled: reminderEnabled && canEnableReminder,
        reminderNotifId,
        recurrenceMonths: recurrenceMonths ?? undefined,
        status: isPast ? 'past' : 'upcoming',
      });

      await fetchEventsByAsset(original.assetId);
      await fetchUpcomingReminders();
      router.back();
    } catch (e: any) {
      Alert.alert(
        'Erreur',
        e?.message ?? "Impossible de modifier l'événement.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!original) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING.lg,
        }}
      >
        <StyledText
          variant="h3"
          align="center"
          style={{ marginBottom: SPACING.sm }}
        >
          Événement introuvable
        </StyledText>
        <StyledText variant="body" color={COLORS.textSecondary} align="center">
          Cet événement n'existe plus.
        </StyledText>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            {
              marginTop: SPACING.lg,
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.sm,
              backgroundColor: COLORS.primary,
              borderRadius: RADIUS.sm,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <StyledText variant="smallMedium" color={COLORS.textInverse}>
            Retour
          </StyledText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Screen
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: 110,
        }}
      >
        {/* HEADER */}
        <View style={{ paddingTop: SPACING.lg, paddingBottom: SPACING.lg }}>
          <StyledText variant="eyebrow">MODIFIER L'ÉVÉNEMENT</StyledText>
          <StyledText variant="h2" style={{ marginTop: SPACING.xs }}>
            Modifier
          </StyledText>
        </View>

        {/* BIEN ASSOCIÉ */}
        {asset && (
          <Card
            variant="outlined"
            padding="base"
            radius="md"
            style={{ marginBottom: SPACING.xl }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.md,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: RADIUS.sm,
                  backgroundColor: COLORS.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CategoryIcon
                  categoryId={asset.categoryId}
                  size={18}
                  color={COLORS.textSecondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <StyledText variant="eyebrow" style={{ fontSize: 10 }}>
                  BIEN ASSOCIÉ
                </StyledText>
                <StyledText variant="bodyMedium" numberOfLines={1}>
                  {asset.name}
                </StyledText>
                <StyledText variant="caption" color={COLORS.textTertiary}>
                  {getCategoryLabel(asset.categoryId)}
                </StyledText>
              </View>
            </View>
          </Card>
        )}

        {/* TYPE */}
        <FormSection>
          <SelectGrid
            label="TYPE"
            required
            options={eventTypeOptions}
            selectedId={eventType}
            onSelect={handleTypeSelect}
            columns={4}
          />
        </FormSection>

        {/* INFORMATIONS */}
        <FormSection title="INFORMATIONS">
          <TextField
            label="TITRE"
            required
            value={title}
            onChangeText={setTitle}
            placeholder="Ex : Vidange, Révision 30 000 km…"
          />
          <DateField
            label="DATE DE L'ÉVÉNEMENT"
            required
            value={eventDate}
            onChange={setEventDate}
          />
          {eventDate && (
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: SPACING.sm,
                paddingVertical: 4,
                borderRadius: RADIUS.full,
                backgroundColor: isUpcoming
                  ? COLORS.accentMuted
                  : COLORS.surfaceAlt,
              }}
            >
              <StyledText
                variant="caption"
                color={isUpcoming ? COLORS.accentDark : COLORS.textSecondary}
                style={{
                  fontFamily: FONTS.sansSemiBold,
                  letterSpacing: 0.8,
                }}
              >
                {isUpcoming ? 'À VENIR' : 'PASSÉ'}
              </StyledText>
            </View>
          )}
          <TextField
            label="COÛT (€)"
            value={cost}
            onChangeText={setCost}
            placeholder="0,00"
            keyboardType="decimal-pad"
          />
          <TextField
            label="PRESTATAIRE"
            value={providerName}
            onChangeText={setProviderName}
            placeholder="Nom du garage, technicien…"
          />
          {isVehicle && (
            <TextField
              label="KILOMÉTRAGE À L'ÉVÉNEMENT"
              value={mileage}
              onChangeText={setMileage}
              placeholder="Ex : 45 000"
              keyboardType="number-pad"
            />
          )}
        </FormSection>

        {/* RAPPEL */}
        <FormSection title="RAPPEL">
          {isVehicle && (
            <TextField
              label="KILOMÉTRAGE PROCHAINE ÉCHÉANCE"
              value={nextDueMileage}
              onChangeText={setNextDueMileage}
              placeholder="Ex : 60 000"
              keyboardType="number-pad"
            />
          )}
          <View
            style={{
              opacity: canEnableReminder ? 1 : 0.5,
              marginTop: SPACING.xs,
            }}
          >
            <Toggle
              label="Rappel de notification"
              description={
                canEnableReminder && eventDate
                  ? `Notification le ${formatLongDate(eventDate)} à 9h`
                  : "Renseigne une date d'événement future pour activer"
              }
              value={reminderEnabled && canEnableReminder}
              onValueChange={(val) => {
                if (!canEnableReminder) {
                  Alert.alert(
                    'Rappel indisponible',
                    "Choisis d'abord une date d'événement future pour activer le rappel.",
                  );
                  return;
                }
                setReminderEnabled(val);
              }}
              isLast
            />
          </View>
          {canEnableReminder && reminderEnabled && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.xs,
                marginTop: SPACING.xs,
              }}
            >
              <Bell size={12} color={COLORS.accentDark} strokeWidth={2} />
              <StyledText variant="caption" color={COLORS.accentDark}>
                Vous recevrez un rappel
              </StyledText>
            </View>
          )}
          {!canEnableReminder && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.xs,
                marginTop: SPACING.xs,
              }}
            >
              <BellOff
                size={12}
                color={COLORS.textTertiary}
                strokeWidth={2}
              />
              <StyledText variant="caption" color={COLORS.textTertiary}>
                Rappel désactivé
              </StyledText>
            </View>
          )}

          <View style={{ marginTop: SPACING.lg }}>
            <StyledText
              variant="eyebrow"
              style={{ marginBottom: SPACING.sm }}
            >
              RÉCURRENCE
            </StyledText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
              {RECURRENCE_OPTIONS.map((opt) => (
                <Chip
                  key={opt.label}
                  label={opt.label}
                  size="sm"
                  selected={recurrenceMonths === opt.months}
                  onPress={() => setRecurrenceMonths(opt.months)}
                />
              ))}
            </View>
            {recurrenceMonths !== null && (
              <StyledText
                variant="caption"
                color={COLORS.textTertiary}
                style={{ marginTop: SPACING.xs }}
              >
                Un nouvel événement sera proposé à la prochaine échéance.
              </StyledText>
            )}
          </View>
        </FormSection>

        {/* NOTES */}
        <FormSection title="NOTES">
          <TextField
            label="NOTES"
            value={notes}
            onChangeText={setNotes}
            placeholder="Observations, pièces remplacées…"
            multiline
            numberOfLines={4}
          />
        </FormSection>
      </Screen>

      {/* STICKY BOTTOM */}
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
          onPress={handleSave}
          disabled={submitting}
          style={({ pressed }) => [
            {
              backgroundColor: COLORS.primary,
              borderRadius: RADIUS.md,
              paddingVertical: SPACING.md,
              alignItems: 'center',
              ...SHADOWS.sm,
            },
            (pressed || submitting) && { opacity: 0.85 },
          ]}
        >
          <StyledText variant="title" color={COLORS.textInverse}>
            {submitting ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}
