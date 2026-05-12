// app/event/add.tsx

import React, { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Bell, BellOff, StickyNote } from 'lucide-react-native';
import {
  Card,
  CategoryIcon,
  DateField,
  FormSection,
  Screen,
  SelectGrid,
  SelectGridOption,
  StyledText,
  TextField,
  Toggle,
} from '../../components/ui';
import { EVENT_TYPE_ICON_MAP } from '../../components/ui/EventTypeIcon';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { EVENT_TYPES } from '../../constants/categories';
import { scheduleReminder } from '../../src/services/notificationService';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';
import { formatLongDate, getCategoryLabel } from '../../src/utils/format';
import type { EventType } from '../../src/types';

const VEHICLE_CATEGORIES: ReadonlySet<string> = new Set([
  'car',
  'moto',
  'bike',
  'scooter',
]);

function isVehicleCategory(categoryId: string): boolean {
  return VEHICLE_CATEGORIES.has(categoryId);
}

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

export default function AddEventScreen() {
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  const { assets } = useAssetStore();
  const { addEvent, fetchEventsByAsset, fetchUpcomingReminders } =
    useEventStore();

  const asset = assets.find((a) => a.id === assetId);
  const isVehicle = asset ? isVehicleCategory(asset.categoryId) : false;

  const [eventType, setEventType] = useState<EventType>('maintenance');
  const [title, setTitle] = useState('Entretien');
  const [titleAutoFilled, setTitleAutoFilled] = useState(true);
  const [eventDate, setEventDate] = useState<string | undefined>(undefined);
  const [cost, setCost] = useState('');
  const [providerName, setProviderName] = useState('');
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [nextDueDate, setNextDueDate] = useState<string | undefined>(undefined);
  const [nextDueMileage, setNextDueMileage] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedDate = eventDate ? new Date(eventDate) : null;
  const parsedNextDueDate = nextDueDate ? new Date(nextDueDate) : null;

  const isPast = parsedDate ? parsedDate <= today : true;
  const isUpcoming = !isPast;
  const canEnableReminder =
    !!parsedNextDueDate && parsedNextDueDate > today;

  const eventTypeOptions: SelectGridOption[] = useMemo(
    () =>
      EVENT_TYPES.map((t) => ({
        id: t.id,
        label: t.label,
        icon: EVENT_TYPE_ICON_MAP[t.id] ?? StickyNote,
      })),
    [],
  );

  function handleTypeSelect(id: string) {
    if (!isEventType(id)) return;
    setEventType(id);
    if (titleAutoFilled) {
      const label = EVENT_TYPES.find((t) => t.id === id)?.label ?? '';
      setTitle(label);
    }
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    setTitleAutoFilled(false);
  }

  async function handleSubmit() {
    if (!assetId) {
      Alert.alert('Erreur', 'Bien non identifié.');
      return;
    }
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
      let reminderNotifId: string | undefined;

      if (reminderEnabled && parsedNextDueDate && parsedNextDueDate > today) {
        const reminderDate = new Date(parsedNextDueDate);
        reminderDate.setHours(9, 0, 0, 0);
        const tempId = `${assetId}-${Date.now()}`;
        const notifId = await scheduleReminder(
          tempId,
          asset?.name ?? 'Entretien',
          title.trim(),
          reminderDate,
        );
        reminderNotifId = notifId ?? undefined;
      }

      await addEvent({
        assetId,
        eventType,
        title: title.trim(),
        eventDate,
        cost: cost.trim() ? parseFloat(cost.replace(',', '.')) : undefined,
        providerName: providerName.trim() || undefined,
        notes: notes.trim() || undefined,
        mileageAtEvent: mileage.trim() ? parseInt(mileage, 10) : undefined,
        nextDueDate: nextDueDate || undefined,
        nextDueMileage: nextDueMileage.trim()
          ? parseInt(nextDueMileage, 10)
          : undefined,
        reminderEnabled: reminderEnabled && canEnableReminder,
        reminderNotifId,
        status: isPast ? 'past' : 'upcoming',
      });

      await fetchEventsByAsset(assetId);
      await fetchUpcomingReminders();
      router.back();
    } catch (e: any) {
      Alert.alert(
        'Erreur',
        e?.message ?? "Impossible de créer l'événement.",
      );
    } finally {
      setSubmitting(false);
    }
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
          <StyledText variant="eyebrow">NOUVEL ÉVÉNEMENT</StyledText>
          <StyledText variant="h2" style={{ marginTop: SPACING.xs }}>
            Ajouter un événement
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
            onChangeText={handleTitleChange}
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

        {/* PROCHAIN ENTRETIEN */}
        <FormSection title="PROCHAIN ENTRETIEN">
          <DateField
            label="DATE PROCHAINE ÉCHÉANCE"
            value={nextDueDate}
            onChange={setNextDueDate}
            minDate={today}
          />
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
                canEnableReminder && nextDueDate
                  ? `Notification le ${formatLongDate(nextDueDate)} à 9h`
                  : 'Renseigne une date future pour activer'
              }
              value={reminderEnabled && canEnableReminder}
              onValueChange={(val) => {
                if (!canEnableReminder) return;
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
          onPress={handleSubmit}
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
            {submitting ? 'Enregistrement…' : "Enregistrer l'événement"}
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}

