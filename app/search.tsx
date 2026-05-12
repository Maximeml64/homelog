// app/search.tsx

import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Search as SearchIcon } from 'lucide-react-native';
import {
  AssetListItem,
  Card,
  EventListItem,
  SearchBar,
  Separator,
  StyledText,
} from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAssetStore } from '../src/stores/assetStore';
import { useEventStore } from '../src/stores/eventStore';
import {
  formatEUR,
  formatShortDate,
  getCategoryLabel,
} from '../src/utils/format';

export default function SearchScreen() {
  const { assets } = useAssetStore();
  const { events } = useEventStore();
  const [query, setQuery] = useState('');

  const q = query.toLowerCase().trim();

  const results = useMemo(() => {
    if (q.length < 2) return { assets: [], events: [] };

    const matchedAssets = assets.filter((a) => {
      const data = a.extraData as Record<string, any> | undefined;
      const brand = (data?.brand ?? a.brand ?? '').toLowerCase();
      const model = (data?.model ?? a.model ?? '').toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        brand.includes(q) ||
        model.includes(q) ||
        (a.location ?? '').toLowerCase().includes(q) ||
        (a.notes ?? '').toLowerCase().includes(q)
      );
    });

    const matchedEvents = events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.providerName ?? '').toLowerCase().includes(q) ||
        (e.notes ?? '').toLowerCase().includes(q),
    );

    return { assets: matchedAssets, events: matchedEvents };
  }, [q, assets, events]);

  const hasResults =
    results.assets.length > 0 || results.events.length > 0;
  const showEmpty = q.length >= 2 && !hasResults;
  const showHint = q.length < 2;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md }}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Bien, événement, prestataire…"
        />
      </View>

      {showHint && (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: SPACING.xl,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: COLORS.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: SPACING.md,
            }}
          >
            <SearchIcon
              size={20}
              color={COLORS.textTertiary}
              strokeWidth={1.5}
            />
          </View>
          <StyledText
            variant="body"
            color={COLORS.textSecondary}
            align="center"
          >
            Saisissez au moins 2 caractères{'\n'}pour lancer la recherche.
          </StyledText>
        </View>
      )}

      {showEmpty && (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: SPACING.xl,
          }}
        >
          <StyledText variant="eyebrow" color={COLORS.textTertiary}>
            AUCUN RÉSULTAT
          </StyledText>
          <StyledText
            variant="h3"
            align="center"
            style={{ marginTop: SPACING.sm }}
          >
            Rien trouvé
          </StyledText>
          <StyledText
            variant="body"
            color={COLORS.textSecondary}
            align="center"
            style={{ marginTop: SPACING.xs }}
          >
            pour « {query} »
          </StyledText>
        </View>
      )}

      {hasResults && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: SPACING.xxl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {results.assets.length > 0 && (
            <View style={{ marginTop: SPACING.lg }}>
              <View
                style={{
                  paddingHorizontal: SPACING.lg,
                  marginBottom: SPACING.sm,
                }}
              >
                <StyledText variant="eyebrow">
                  BIENS · {results.assets.length}
                </StyledText>
              </View>
              <Card
                variant="outlined"
                padding="none"
                radius="md"
                style={{ marginHorizontal: SPACING.lg, overflow: 'hidden' }}
              >
                {results.assets.map((asset, idx) => {
                  const data = asset.extraData as
                    | Record<string, any>
                    | undefined;
                  const brand = data?.brand ?? asset.brand ?? null;
                  const model = data?.model ?? asset.model ?? null;
                  const brandModel =
                    brand && model
                      ? `${brand} · ${model}`
                      : brand ?? model ?? undefined;
                  return (
                    <AssetListItem
                      key={asset.id}
                      imageUri={asset.coverImageUri}
                      name={asset.name}
                      category={getCategoryLabel(asset.categoryId)}
                      categoryId={asset.categoryId}
                      brandModel={brandModel ?? undefined}
                      onPress={() => router.push(`/asset/${asset.id}`)}
                      isLast={idx === results.assets.length - 1}
                    />
                  );
                })}
              </Card>
            </View>
          )}

          {results.events.length > 0 && (
            <View style={{ marginTop: SPACING.xl }}>
              <View
                style={{
                  paddingHorizontal: SPACING.lg,
                  marginBottom: SPACING.sm,
                }}
              >
                <StyledText variant="eyebrow">
                  ÉVÉNEMENTS · {results.events.length}
                </StyledText>
              </View>
              <Card
                variant="outlined"
                padding="none"
                radius="md"
                style={{ marginHorizontal: SPACING.lg, overflow: 'hidden' }}
              >
                {results.events.map((event, idx) => {
                  const date = new Date(event.eventDate);
                  const day = String(date.getDate());
                  const assetName = assets.find(
                    (a) => a.id === event.assetId,
                  )?.name;
                  return (
                    <EventListItem
                      key={event.id}
                      day={day}
                      title={event.title}
                      assetName={
                        assetName
                          ? `${assetName} · ${formatShortDate(event.eventDate)}`
                          : formatShortDate(event.eventDate)
                      }
                      costLabel={
                        event.cost !== undefined && event.cost > 0
                          ? formatEUR(event.cost)
                          : undefined
                      }
                      eventType={event.eventType}
                      onPress={() => router.push(`/event/${event.id}`)}
                      isLast={idx === results.events.length - 1}
                    />
                  );
                })}
              </Card>
            </View>
          )}

          <Separator
            style={{
              marginHorizontal: SPACING.lg,
              marginTop: SPACING.xl,
            }}
          />
        </ScrollView>
      )}
    </View>
  );
}
