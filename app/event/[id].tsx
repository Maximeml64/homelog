// app/event/[id].tsx

import React, { useCallback, useState } from 'react';
import { View, Pressable, Alert, RefreshControl } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  ChevronRight,
  Trash2,
  Bell,
  BellOff,
} from 'lucide-react-native';
import AttachmentsSection from '../../components/AttachmentsSection';
import {
  Screen,
  StyledText,
  Card,
  InfoRow,
  SettingsGroup,
  SettingsItem,
  CategoryIcon,
} from '../../components/ui';
import { COLORS, RADIUS, SPACING, SHADOWS, FONTS } from '../../constants/theme';
import { getEventById } from '../../src/repositories/eventRepository';
import { cancelReminder } from '../../src/services/notificationService';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';
import {
  formatEUR,
  formatLongDate,
  getCategoryLabel,
} from '../../src/utils/format';
import type { MaintenanceEvent, Attachment } from '../../src/types';

const EVENT_TYPE_LABELS: Record<string, string> = {
  maintenance: 'Entretien',
  repair: 'Réparation',
  inspection: 'Contrôle',
  cleaning: 'Nettoyage',
  replacement: 'Remplacement',
  incident: 'Incident',
  warranty: 'Garantie',
  note: 'Note',
};

function getCountdown(
  iso: string,
  now: Date,
): { text: string; isOverdue: boolean; isToday: boolean } {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (days < 0)
    return { text: `${Math.abs(days)} j de retard`, isOverdue: true, isToday: false };
  if (days === 0)
    return { text: "Aujourd'hui", isOverdue: false, isToday: true };
  if (days === 1) return { text: 'Demain', isOverdue: false, isToday: false };
  return { text: `Dans ${days} jours`, isOverdue: false, isToday: false };
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const assets = useAssetStore((s) => s.assets);
  const removeEvent = useEventStore((s) => s.removeEvent);
  const fetchEventsByAsset = useEventStore((s) => s.fetchEventsByAsset);

  const [event, setEvent] = useState<MaintenanceEvent | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    const e = await getEventById(id);
    setEvent(e);
    setAttachments(e?.attachments ?? []);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        await loadEvent();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [loadEvent]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvent();
    setRefreshing(false);
  }, [loadEvent]);

  const handleDelete = () => {
    if (!event) return;
    Alert.alert(
      'Supprimer cet événement',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (event.reminderNotifId) {
              await cancelReminder(event.reminderNotifId);
            }
            await removeEvent(event.id);
            if (event.assetId) {
              await fetchEventsByAsset(event.assetId);
            }
            router.back();
          },
        },
      ],
    );
  };

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
        <StyledText variant="body" color={COLORS.textSecondary}>
          Chargement…
        </StyledText>
      </View>
    );
  }

  if (!event) {
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

  const asset = assets.find((a) => a.id === event.assetId);
  const typeLabel = EVENT_TYPE_LABELS[event.eventType as string] ?? 'Note';
  const now = new Date();
  const cd = getCountdown(event.eventDate, now);
  const isUpcoming = event.status === 'upcoming';
  const nextDueCd = event.nextDueDate
    ? getCountdown(event.nextDueDate, now)
    : undefined;
  const nextDueColor = nextDueCd?.isOverdue
    ? COLORS.danger
    : nextDueCd?.isToday
    ? COLORS.warning
    : COLORS.accentDark;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Screen
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* HEADER INFO */}
        <View
          style={{
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.lg,
            paddingBottom: SPACING.md,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.sm,
              marginBottom: SPACING.xs,
            }}
          >
            <StyledText variant="eyebrow" color={COLORS.accentDark}>
              {typeLabel.toUpperCase()}
            </StyledText>
            {isUpcoming && (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: RADIUS.full,
                  backgroundColor: COLORS.accentMuted,
                }}
              >
                <StyledText
                  variant="caption"
                  color={COLORS.accentDark}
                  style={{
                    fontSize: 9,
                    fontFamily: FONTS.sansBold,
                    letterSpacing: 0.8,
                  }}
                >
                  À VENIR
                </StyledText>
              </View>
            )}
          </View>
          <StyledText variant="h1" style={{ fontSize: 28, lineHeight: 34 }}>
            {event.title}
          </StyledText>
        </View>

        {/* ASSET LINK CARD */}
        {asset && (
          <Pressable
            onPress={() => router.push(`/asset/${asset.id}`)}
            style={({ pressed }) => [
              { marginHorizontal: SPACING.lg, marginBottom: SPACING.xl },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Card variant="outlined" padding="base" radius="md">
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
                <ChevronRight
                  size={16}
                  color={COLORS.textTertiary}
                  strokeWidth={2}
                />
              </View>
            </Card>
          </Pressable>
        )}

        {/* DÉTAILS */}
        <View style={{ marginBottom: SPACING.xl }}>
          <StyledText
            variant="eyebrow"
            style={{ marginBottom: SPACING.sm, paddingHorizontal: SPACING.lg }}
          >
            DÉTAILS
          </StyledText>
          <Card
            variant="outlined"
            padding="none"
            radius="md"
            style={{ marginHorizontal: SPACING.lg, overflow: 'hidden' }}
          >
            <InfoRow
              label="Date"
              value={`${formatLongDate(event.eventDate)} · ${cd.text}`}
            />
            {event.cost !== undefined && event.cost > 0 && (
              <InfoRow label="Coût" value={formatEUR(event.cost)} />
            )}
            {event.providerName && (
              <InfoRow label="Prestataire" value={event.providerName} />
            )}
            {event.mileageAtEvent !== undefined && (
              <InfoRow
                label="Kilométrage"
                value={`${event.mileageAtEvent.toLocaleString('fr-FR')} km`}
                isLast
              />
            )}
          </Card>
        </View>

        {/* PROCHAIN ENTRETIEN */}
        {event.nextDueDate && nextDueCd && (
          <View style={{ marginBottom: SPACING.xl }}>
            <StyledText
              variant="eyebrow"
              style={{
                marginBottom: SPACING.sm,
                paddingHorizontal: SPACING.lg,
              }}
            >
              PROCHAIN ENTRETIEN
            </StyledText>
            <View
              style={{
                marginHorizontal: SPACING.lg,
                padding: SPACING.base,
                borderRadius: RADIUS.md,
                backgroundColor: COLORS.accentMuted,
                borderLeftWidth: 3,
                borderLeftColor: COLORS.accent,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  marginBottom: SPACING.xs,
                }}
              >
                {event.reminderEnabled ? (
                  <Bell size={14} color={COLORS.accentDark} strokeWidth={2} />
                ) : (
                  <BellOff size={14} color={COLORS.textTertiary} strokeWidth={2} />
                )}
                <StyledText
                  variant="caption"
                  color={event.reminderEnabled ? COLORS.accentDark : COLORS.textTertiary}
                  style={{ fontFamily: FONTS.sansSemiBold, letterSpacing: 0.5 }}
                >
                  {event.reminderEnabled ? 'RAPPEL ACTIF' : 'RAPPEL DÉSACTIVÉ'}
                </StyledText>
              </View>
              <StyledText variant="title" style={{ marginTop: SPACING.xs }}>
                {formatLongDate(event.nextDueDate)}
              </StyledText>
              <StyledText
                variant="bodyMedium"
                color={nextDueColor}
                style={{ marginTop: 2 }}
              >
                {nextDueCd.text}
              </StyledText>
              {event.nextDueMileage !== undefined && (
                <StyledText variant="small" style={{ marginTop: 4 }}>
                  ou à {event.nextDueMileage.toLocaleString('fr-FR')} km
                </StyledText>
              )}
            </View>
          </View>
        )}

        {/* NOTES */}
        {event.notes && (
          <View style={{ marginBottom: SPACING.xl }}>
            <StyledText
              variant="eyebrow"
              style={{ marginBottom: SPACING.sm, paddingHorizontal: SPACING.lg }}
            >
              NOTES
            </StyledText>
            <Card
              variant="outlined"
              padding="base"
              radius="md"
              style={{ marginHorizontal: SPACING.lg }}
            >
              <StyledText variant="body">{event.notes}</StyledText>
            </Card>
          </View>
        )}

        {/* PIÈCES JOINTES */}
        <View style={{ marginBottom: SPACING.xl }}>
          <StyledText
            variant="eyebrow"
            style={{ marginBottom: SPACING.sm, paddingHorizontal: SPACING.lg }}
          >
            PIÈCES JOINTES
          </StyledText>
          <View style={{ paddingHorizontal: SPACING.lg }}>
            <AttachmentsSection
              attachments={attachments}
              eventId={event.id}
              onChanged={loadEvent}
            />
          </View>
        </View>

        {/* ACTIONS */}
        <SettingsGroup title="ACTIONS">
          <SettingsItem
            icon={Trash2}
            label="Supprimer l'événement"
            variant="danger"
            onPress={handleDelete}
            isLast
          />
        </SettingsGroup>
      </Screen>

      {/* STICKY BOTTOM CTA */}
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
          onPress={() => router.push(`/event/edit/${event.id}`)}
          style={({ pressed }) => [
            {
              backgroundColor: COLORS.primary,
              borderRadius: RADIUS.md,
              paddingVertical: SPACING.md,
              alignItems: 'center',
              ...SHADOWS.sm,
            },
            pressed && { opacity: 0.9 },
          ]}
        >
          <StyledText variant="title" color={COLORS.textInverse}>
            Modifier l'événement
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}
