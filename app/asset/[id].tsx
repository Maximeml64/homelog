// app/asset/[id].tsx

import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Archive,
  Bell,
  Camera,
  ChevronRight,
  FileText,
  Plus,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import AttachmentsSection from '../../components/AttachmentsSection';
import { ExtraDataDisplay } from '../../components/ExtraDataDisplay';
import {
  Screen,
  StyledText,
  Card,
  StatCard,
  InfoRow,
  EventListItem,
  SectionHeader,
  SettingsGroup,
  SettingsItem,
  CategoryIcon,
} from '../../components/ui';
import { COLORS, RADIUS, SPACING, SHADOWS, FONTS } from '../../constants/theme';
import { getAttachmentsByAsset } from '../../src/repositories/eventRepository';
import { exportAssetPDF } from '../../src/services/pdfService';
import { applyMaintenanceSuggestions } from '../../src/services/maintenanceSuggestionService';
import { useAssetStore } from '../../src/stores/assetStore';
import { useEventStore } from '../../src/stores/eventStore';
import { persistAttachment } from '../../src/utils/attachmentStorage';
import { getSuggestionsForCategory } from '../../constants/maintenanceSuggestions';
import {
  formatEUR,
  formatLongDate,
  getCategoryLabel,
} from '../../src/utils/format';
import type { Attachment } from '../../src/types';

type EventSort = 'date_desc' | 'date_asc' | 'cost_desc';

const EVENT_SORT_LABELS: Record<EventSort, string> = {
  date_desc: 'Date (récent)',
  date_asc: 'Date (ancien)',
  cost_desc: 'Coût',
};

function getWarrantyStatus(
  warrantyEndDate: string,
  now: Date,
): { label: string; remaining: string; expired: boolean; soon: boolean } {
  const end = new Date(warrantyEndDate);
  end.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((end.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) {
    return {
      label: 'Garantie expirée',
      remaining: `le ${formatLongDate(warrantyEndDate)}`,
      expired: true,
      soon: false,
    };
  }
  const months = Math.floor(diffDays / 30);
  let remaining: string;
  if (diffDays === 0) remaining = "Expire aujourd'hui";
  else if (diffDays === 1) remaining = 'Expire demain';
  else if (months >= 12)
    remaining = `${Math.floor(months / 12)} an${months >= 24 ? 's' : ''} restant${months >= 24 ? 's' : ''}`;
  else if (months >= 1)
    remaining = `${months} mois restant${months > 1 ? 's' : ''}`;
  else remaining = `${diffDays} jours restants`;
  return {
    label: 'Sous garantie',
    remaining,
    expired: false,
    soon: diffDays <= 60,
  };
}

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const assets = useAssetStore((s) => s.assets);
  const removeAsset = useAssetStore((s) => s.removeAsset);
  const archiveAsset = useAssetStore((s) => s.archiveAsset);
  const editAsset = useAssetStore((s) => s.editAsset);
  const events = useEventStore((s) => s.events);
  const fetchEventsByAsset = useEventStore((s) => s.fetchEventsByAsset);
  const fetchUpcomingReminders = useEventStore(
    (s) => s.fetchUpcomingReminders,
  );
  const getTotalCost = useEventStore((s) => s.getTotalCost);

  const [totalCost, setTotalCost] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [eventSort, setEventSort] = useState<EventSort>('date_desc');
  const [refreshing, setRefreshing] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroScrollRef = useRef<ScrollView>(null);
  const { width: windowWidth } = useWindowDimensions();

  const asset = useMemo(() => assets.find((a) => a.id === id), [assets, id]);
  const assetEvents = useMemo(
    () => events.filter((e) => e.assetId === id),
    [events, id],
  );

  const heroPhotos = useMemo(() => {
    const result: { uri: string; isCover: boolean; attachmentId?: string }[] =
      [];
    const cover = asset?.coverImageUri;
    if (cover) result.push({ uri: cover, isCover: true });
    attachments
      .filter((a) => a.type === 'photo' && a.uri !== cover)
      .forEach((a) =>
        result.push({ uri: a.uri, isCover: false, attachmentId: a.id }),
      );
    return result;
  }, [asset?.coverImageUri, attachments]);

  const handleSetAsCover = useCallback(
    async (uri: string) => {
      if (!id) return;
      await editAsset(id, { coverImageUri: uri });
      heroScrollRef.current?.scrollTo({ x: 0, animated: true });
    },
    [id, editAsset],
  );

  const onHeroScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const slide = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
      if (slide !== heroIndex) setHeroIndex(slide);
    },
    [heroIndex, windowWidth],
  );

  const missingSuggestions = useMemo(() => {
    if (!asset) return [];
    const all = getSuggestionsForCategory(asset.categoryId);
    if (all.length === 0) return [];
    const upcomingTitles = new Set(
      assetEvents
        .filter((e) => e.status === 'upcoming')
        .map((e) => e.title.toLowerCase()),
    );
    return all.filter((s) => !upcomingTitles.has(s.title.toLowerCase()));
  }, [asset, assetEvents]);

  const handleActivateSuggestions = useCallback(() => {
    if (!asset || missingSuggestions.length === 0) return;
    const summary = missingSuggestions
      .map((s) => `• ${s.title} (tous les ${s.recurrenceMonths} mois)`)
      .join('\n');
    Alert.alert(
      'Activer les rappels recommandés ?',
      `${summary}\n\nUn événement sera créé pour chaque rappel avec récurrence automatique.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Activer',
          onPress: async () => {
            try {
              await applyMaintenanceSuggestions({
                assetId: asset.id,
                assetName: asset.name,
                suggestions: missingSuggestions,
              });
              await fetchEventsByAsset(asset.id);
              await fetchUpcomingReminders();
            } catch {
              Alert.alert(
                'Erreur',
                'Certains rappels n’ont pas pu être créés.',
              );
            }
          },
        },
      ],
    );
  }, [asset, missingSuggestions, fetchEventsByAsset, fetchUpcomingReminders]);

  const loadAttachments = useCallback(async () => {
    if (!id) return;
    const list = await getAttachmentsByAsset(id);
    setAttachments(list);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchEventsByAsset(id);
    getTotalCost(id).then(setTotalCost);
    loadAttachments();
  }, [id, fetchEventsByAsset, getTotalCost, loadAttachments]);

  const onRefresh = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    await fetchEventsByAsset(id);
    const c = await getTotalCost(id);
    setTotalCost(c);
    await loadAttachments();
    setRefreshing(false);
  }, [id, fetchEventsByAsset, getTotalCost, loadAttachments]);

  const sortedEvents = useMemo(() => {
    const list = [...assetEvents];
    if (eventSort === 'date_desc') {
      list.sort((a, b) => (b.eventDate ?? '').localeCompare(a.eventDate ?? ''));
    } else if (eventSort === 'date_asc') {
      list.sort((a, b) => (a.eventDate ?? '').localeCompare(b.eventDate ?? ''));
    } else {
      list.sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));
    }
    return list;
  }, [assetEvents, eventSort]);

  const nextEvent = useMemo(() => {
    const todayIso = new Date().toISOString().split('T')[0];
    return assetEvents
      .filter((e) => e.nextDueDate && e.nextDueDate >= todayIso)
      .sort((a, b) =>
        (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''),
      )[0];
  }, [assetEvents]);

  const mileage = useMemo(() => {
    if (!asset) return undefined;
    const veh = asset.vehicleDetails;
    if (veh?.mileageCurrent !== undefined) return veh.mileageCurrent;
    const data = (asset.extraData ?? {}) as Record<string, unknown>;
    const m = data.mileage;
    return typeof m === 'number' ? m : undefined;
  }, [asset]);

  const handleEventSort = () => {
    const options: EventSort[] = ['date_desc', 'date_asc', 'cost_desc'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Trier par',
          options: ['Date (récent)', 'Date (ancien)', 'Coût', 'Annuler'],
          cancelButtonIndex: 3,
        },
        (idx) => {
          if (idx !== undefined && idx >= 0 && idx < 3) {
            setEventSort(options[idx]);
          }
        },
      );
    } else {
      Alert.alert('Trier par', undefined, [
        { text: 'Date (récent)', onPress: () => setEventSort('date_desc') },
        { text: 'Date (ancien)', onPress: () => setEventSort('date_asc') },
        { text: 'Coût', onPress: () => setEventSort('cost_desc') },
        { text: 'Annuler', style: 'cancel' },
      ]);
    }
  };

  const handleChangePhoto = async () => {
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
              mediaTypes: 'images',
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) {
              const persisted = await persistAttachment(result.assets[0].uri);
              await editAsset(id, { coverImageUri: persisted });
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
              mediaTypes: 'images',
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) {
              const persisted = await persistAttachment(result.assets[0].uri);
              await editAsset(id, { coverImageUri: persisted });
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
      ],
    );
  };

  const handleArchive = () => {
    if (!asset) return;
    Alert.alert(
      'Archiver ce bien',
      'Le bien sera masqué de la liste principale.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Archiver',
          onPress: async () => {
            await archiveAsset(asset.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    if (!asset) return;
    Alert.alert(
      'Supprimer ce bien',
      'Cette action est irréversible. Tous les événements associés seront supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await removeAsset(asset.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleExportPDF = async () => {
    if (!asset) return;
    try {
      await exportAssetPDF(asset, events);
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de générer le PDF.');
    }
  };

  if (!asset) {
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
        <StyledText variant="h3" align="center" style={{ marginBottom: SPACING.sm }}>
          Bien introuvable
        </StyledText>
        <StyledText variant="body" color={COLORS.textSecondary} align="center">
          Ce bien n'existe plus.
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

  const categoryLabel = getCategoryLabel(asset.categoryId);

  const brandModel = (() => {
    const data = asset.extraData as Record<string, any> | undefined;
    const brand = data?.brand ?? asset.brand;
    const model = data?.model ?? asset.model;
    if (brand && model) return `${brand} · ${model}`;
    if (brand) return brand;
    if (model) return model;
    return null;
  })();

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
        {/* HERO GALLERY */}
        <View
          style={{
            marginTop: SPACING.md,
            marginBottom: SPACING.xs,
          }}
        >
          {heroPhotos.length === 0 ? (
            <Pressable
              onPress={handleChangePhoto}
              style={({ pressed }) => [
                {
                  marginHorizontal: SPACING.lg,
                  height: 220,
                  borderRadius: RADIUS.lg,
                  overflow: 'hidden',
                  backgroundColor: COLORS.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                pressed && { opacity: 0.92 },
              ]}
            >
              <CategoryIcon
                categoryId={asset.categoryId}
                size={64}
                color={COLORS.textTertiary}
                strokeWidth={1}
              />
              <View
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: RADIUS.full,
                  backgroundColor: 'rgba(17, 24, 39, 0.85)',
                }}
              >
                <Camera size={12} color={COLORS.textInverse} strokeWidth={2} />
                <StyledText
                  variant="caption"
                  color={COLORS.textInverse}
                  style={{ fontFamily: FONTS.sansSemiBold }}
                >
                  Ajouter une photo
                </StyledText>
              </View>
            </Pressable>
          ) : (
            <>
              <ScrollView
                ref={heroScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onHeroScroll}
                style={{ marginHorizontal: SPACING.lg }}
              >
                {heroPhotos.map((photo, idx) => {
                  const slideWidth = windowWidth - SPACING.lg * 2;
                  const isCurrent = idx === heroIndex;
                  const isCover = photo.isCover;
                  return (
                    <Pressable
                      key={photo.uri}
                      onPress={() => {
                        if (isCover) {
                          handleChangePhoto();
                        } else {
                          Alert.alert(
                            'Photo',
                            undefined,
                            [
                              {
                                text: 'Définir comme couverture',
                                onPress: () => handleSetAsCover(photo.uri),
                              },
                              { text: 'Annuler', style: 'cancel' },
                            ],
                          );
                        }
                      }}
                      style={({ pressed }) => [
                        {
                          width: slideWidth,
                          height: 220,
                          borderRadius: RADIUS.lg,
                          overflow: 'hidden',
                          backgroundColor: COLORS.surfaceAlt,
                        },
                        pressed && { opacity: 0.92 },
                      ]}
                    >
                      <Image
                        source={photo.uri}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={150}
                        recyclingKey={photo.uri}
                      />
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 12,
                          right: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: RADIUS.full,
                          backgroundColor: 'rgba(17, 24, 39, 0.85)',
                        }}
                      >
                        <Camera
                          size={12}
                          color={COLORS.textInverse}
                          strokeWidth={2}
                        />
                        <StyledText
                          variant="caption"
                          color={COLORS.textInverse}
                          style={{ fontFamily: FONTS.sansSemiBold }}
                        >
                          {isCover ? 'Modifier' : 'Définir comme couverture'}
                        </StyledText>
                      </View>
                      {isCover && heroPhotos.length > 1 && isCurrent && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: RADIUS.full,
                            backgroundColor: 'rgba(17, 24, 39, 0.85)',
                          }}
                        >
                          <StyledText
                            variant="caption"
                            color={COLORS.textInverse}
                            style={{
                              fontSize: 10,
                              fontFamily: FONTS.sansSemiBold,
                              letterSpacing: 0.5,
                            }}
                          >
                            COUVERTURE
                          </StyledText>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
              {heroPhotos.length > 1 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                    marginTop: SPACING.sm,
                  }}
                >
                  {heroPhotos.map((_, idx) => (
                    <View
                      key={idx}
                      style={{
                        width: idx === heroIndex ? 16 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor:
                          idx === heroIndex
                            ? COLORS.accent
                            : COLORS.borderStrong,
                      }}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* HEADER INFO */}
        <View
          style={{
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.lg,
            paddingBottom: SPACING.md,
          }}
        >
          <StyledText variant="eyebrow" color={COLORS.accentDark}>
            {categoryLabel}
          </StyledText>
          <StyledText
            variant="h1"
            style={{ marginTop: SPACING.xs, fontSize: 28, lineHeight: 34 }}
          >
            {asset.name}
          </StyledText>
          {brandModel && (
            <StyledText variant="small" style={{ marginTop: 2 }}>
              {brandModel}
            </StyledText>
          )}
        </View>

        {/* STATS ROW */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: SPACING.lg,
            gap: SPACING.sm,
            marginBottom: SPACING.xl,
          }}
        >
          <StatCard label="COÛT TOTAL" value={formatEUR(totalCost)} accent />
          <StatCard label="ÉVÉNEMENTS" value={assetEvents.length} />
          {mileage !== undefined && (
            <StatCard
              label="KM"
              value={(mileage as number).toLocaleString('fr-FR')}
            />
          )}
        </View>

        {/* WARRANTY BADGE */}
        {asset.warrantyEndDate && (() => {
          const status = getWarrantyStatus(asset.warrantyEndDate, new Date());
          const accent = status.expired
            ? COLORS.textSecondary
            : status.soon
            ? COLORS.warning
            : COLORS.success;
          const bg = status.expired
            ? COLORS.surfaceAlt
            : status.soon
            ? COLORS.warningMuted
            : COLORS.successMuted;
          const Icon = status.expired ? ShieldOff : ShieldCheck;
          return (
            <View
              style={{
                marginHorizontal: SPACING.lg,
                marginBottom: SPACING.xl,
                padding: SPACING.base,
                borderRadius: RADIUS.md,
                backgroundColor: bg,
                borderLeftWidth: 3,
                borderLeftColor: accent,
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.md,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: RADIUS.sm,
                  backgroundColor: COLORS.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} color={accent} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <StyledText
                  variant="eyebrow"
                  color={accent}
                  style={{ fontFamily: FONTS.sansSemiBold }}
                >
                  {status.label.toUpperCase()}
                </StyledText>
                <StyledText
                  variant="bodyMedium"
                  numberOfLines={1}
                  style={{ marginTop: 2 }}
                >
                  {status.remaining}
                </StyledText>
                {!status.expired && (
                  <StyledText variant="small">
                    Jusqu'au {formatLongDate(asset.warrantyEndDate)}
                  </StyledText>
                )}
              </View>
            </View>
          );
        })()}

        {/* MAINTENANCE SUGGESTIONS */}
        {missingSuggestions.length > 0 && (
          <Pressable
            onPress={handleActivateSuggestions}
            style={({ pressed }) => [
              {
                marginHorizontal: SPACING.lg,
                marginBottom: SPACING.xl,
                padding: SPACING.base,
                borderRadius: RADIUS.md,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.borderStrong,
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.md,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: RADIUS.sm,
                backgroundColor: COLORS.accentMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} color={COLORS.accentDark} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <StyledText
                variant="eyebrow"
                color={COLORS.accentDark}
                style={{ fontFamily: FONTS.sansSemiBold }}
              >
                RAPPELS RECOMMANDÉS
              </StyledText>
              <StyledText
                variant="bodyMedium"
                numberOfLines={1}
                style={{ marginTop: 2 }}
              >
                {missingSuggestions.map((s) => s.title).join(' · ')}
              </StyledText>
              <StyledText variant="small" color={COLORS.textSecondary}>
                Activer en un tap
              </StyledText>
            </View>
            <ChevronRight
              size={16}
              color={COLORS.textTertiary}
              strokeWidth={2}
            />
          </Pressable>
        )}

        {/* NEXT EVENT CARD */}
        {nextEvent && nextEvent.nextDueDate && (
          <Pressable
            onPress={() => router.push(`/event/${nextEvent.id}`)}
            style={({ pressed }) => [
              {
                marginHorizontal: SPACING.lg,
                marginBottom: SPACING.xl,
                padding: SPACING.base,
                borderRadius: RADIUS.md,
                backgroundColor: COLORS.accentMuted,
                borderLeftWidth: 3,
                borderLeftColor: COLORS.accent,
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.md,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: RADIUS.sm,
                backgroundColor: COLORS.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={16} color={COLORS.accentDark} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <StyledText variant="eyebrow" color={COLORS.accentDark}>
                Prochain rappel
              </StyledText>
              <StyledText variant="bodyMedium" numberOfLines={1} style={{ marginTop: 2 }}>
                {nextEvent.title}
              </StyledText>
              <StyledText variant="small">
                {formatLongDate(nextEvent.nextDueDate)}
              </StyledText>
            </View>
            <ChevronRight size={16} color={COLORS.accentDark} strokeWidth={2} />
          </Pressable>
        )}

        {/* INFORMATIONS */}
        {(asset.location ||
          asset.purchasePrice !== undefined ||
          asset.purchaseDate ||
          asset.serialNumber) && (
          <View style={{ marginBottom: SPACING.xl }}>
            <StyledText
              variant="eyebrow"
              style={{ marginBottom: SPACING.sm, paddingHorizontal: SPACING.lg }}
            >
              INFORMATIONS
            </StyledText>
            <Card
              variant="outlined"
              padding="none"
              radius="md"
              style={{ marginHorizontal: SPACING.lg, overflow: 'hidden' }}
            >
              {asset.location && (
                <InfoRow label="Localisation" value={asset.location} />
              )}
              {asset.purchaseDate && (
                <InfoRow
                  label="Date d'achat"
                  value={formatLongDate(asset.purchaseDate)}
                />
              )}
              {asset.purchasePrice !== undefined && (
                <InfoRow
                  label="Prix d'achat"
                  value={formatEUR(asset.purchasePrice)}
                />
              )}
              {asset.serialNumber && (
                <InfoRow
                  label="N° de série"
                  value={asset.serialNumber}
                  isLast
                />
              )}
            </Card>
          </View>
        )}

        {/* EXTRA DATA */}
        {asset.extraData && (
          <View style={{ marginBottom: SPACING.xl }}>
            <StyledText
              variant="eyebrow"
              style={{ marginBottom: SPACING.sm, paddingHorizontal: SPACING.lg }}
            >
              DÉTAILS
            </StyledText>
            <View style={{ paddingHorizontal: SPACING.lg }}>
              <ExtraDataDisplay
                categoryId={asset.categoryId}
                extraData={asset.extraData as Record<string, any>}
              />
            </View>
          </View>
        )}

        {/* HISTORIQUE */}
        <View style={{ marginBottom: SPACING.xl }}>
          <View style={{ paddingHorizontal: SPACING.lg }}>
            <SectionHeader
              eyebrow={`Historique (${assetEvents.length})`}
              actionLabel="+ Ajouter"
              onActionPress={() =>
                router.push({ pathname: '/event/add', params: { assetId: asset.id } })
              }
            />
          </View>

          {assetEvents.length > 0 && (
            <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm }}>
              <Pressable
                onPress={handleEventSort}
                hitSlop={8}
                style={({ pressed }) => [
                  { flexDirection: 'row', alignItems: 'center', gap: 4 },
                  pressed && { opacity: 0.5 },
                ]}
              >
                <StyledText variant="caption" color={COLORS.textSecondary}>
                  Tri : {EVENT_SORT_LABELS[eventSort]}
                </StyledText>
              </Pressable>
            </View>
          )}

          {assetEvents.length === 0 ? (
            <View
              style={{
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.xxl,
                alignItems: 'center',
              }}
            >
              <StyledText variant="body" color={COLORS.textSecondary} align="center">
                Aucun événement enregistré.
              </StyledText>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/event/add',
                    params: { assetId: asset.id },
                  })
                }
                style={({ pressed }) => [
                  {
                    marginTop: SPACING.md,
                    paddingHorizontal: SPACING.lg,
                    paddingVertical: SPACING.sm + 2,
                    backgroundColor: COLORS.primary,
                    borderRadius: RADIUS.sm,
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <StyledText variant="smallMedium" color={COLORS.textInverse}>
                  Ajouter un événement
                </StyledText>
              </Pressable>
            </View>
          ) : (
            <Card
              variant="outlined"
              padding="none"
              radius="md"
              style={{ marginHorizontal: SPACING.lg, overflow: 'hidden' }}
            >
              {sortedEvents.map((event, idx) => {
                const day = event.eventDate.split('-')[2] ?? '';
                const costLabel =
                  event.cost !== undefined && event.cost > 0
                    ? formatEUR(event.cost)
                    : undefined;
                return (
                  <EventListItem
                    key={event.id}
                    day={day}
                    title={event.title}
                    costLabel={costLabel}
                    eventType={event.eventType as unknown as string}
                    onPress={() => router.push(`/event/${event.id}`)}
                    isLast={idx === sortedEvents.length - 1}
                  />
                );
              })}
            </Card>
          )}
        </View>

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
              assetId={id}
              onChanged={loadAttachments}
            />
          </View>
        </View>

        {/* NOTES */}
        {asset.notes && (
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
              <StyledText variant="body">{asset.notes}</StyledText>
            </Card>
          </View>
        )}

        {/* ACTIONS */}
        <SettingsGroup title="ACTIONS">
          <SettingsItem
            icon={FileText}
            label="Exporter en PDF"
            onPress={handleExportPDF}
          />
          <SettingsItem
            icon={Archive}
            label="Archiver le bien"
            onPress={handleArchive}
          />
          <SettingsItem
            icon={Trash2}
            label="Supprimer le bien"
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
          onPress={() => router.push(`/asset/edit/${asset.id}`)}
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
            Modifier le bien
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}
