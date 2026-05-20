// app/asset/add.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Box, Camera } from 'lucide-react-native';
import {
  DateField,
  FormSection,
  Screen,
  SelectGrid,
  StyledText,
  TextField,
} from '../../components/ui';
import { CATEGORY_ICON_MAP } from '../../components/ui/CategoryIcon';
import { ExtraDataForm } from '../../components/ExtraDataForm';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { ASSET_CATEGORIES } from '../../constants/categories';
import { getSuggestionsForCategory } from '../../constants/maintenanceSuggestions';
import { applyMaintenanceSuggestions } from '../../src/services/maintenanceSuggestionService';
import { useAssetStore } from '../../src/stores/assetStore';
import { useAppStore } from '../../src/stores/appStore';
import { useEventStore } from '../../src/stores/eventStore';
import { useScanPrefillStore } from '../../src/stores/scanPrefillStore';
import { persistAttachment } from '../../src/utils/attachmentStorage';
import type { AssetCategoryId, AssetExtraData, ParsedInvoice } from '../../src/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_CATEGORY_IDS = new Set<string>([
  'realestate', 'car', 'moto', 'bike', 'scooter', 'boiler', 'ac',
  'heatpump', 'waterheater', 'energy', 'pool', 'appliance', 'garden',
  'multimedia', 'security', 'pet', 'other',
]);

function isValidCategoryId(val: string | null | undefined): val is AssetCategoryId {
  return !!val && VALID_CATEGORY_IDS.has(val);
}

function buildConsolidatedNotes(prefill: ParsedInvoice): string {
  const parts: string[] = [];
  if (prefill.vendor_name) {
    const addr = prefill.vendor_address ? ` (${prefill.vendor_address})` : '';
    parts.push(`Vendeur : ${prefill.vendor_name}${addr}`);
  }
  if (prefill.invoice_number) parts.push(`Facture n°${prefill.invoice_number}`);
  if (prefill.notes) parts.push(prefill.notes);
  return parts.join('\n');
}

function computeWarrantyEnd(
  purchaseDate: string | null,
  warrantyYears: number | null,
): string | undefined {
  if (!purchaseDate || !warrantyYears) return undefined;
  const start = new Date(purchaseDate);
  if (Number.isNaN(start.getTime())) return undefined;
  start.setFullYear(start.getFullYear() + warrantyYears);
  return start.toISOString().slice(0, 10);
}

function clean(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
  );
}

function buildExtraData(
  categoryId: AssetCategoryId,
  prefill: ParsedInvoice,
): Record<string, unknown> {
  const brand = prefill.brand ?? undefined;
  const model = prefill.model ?? undefined;
  const serial = prefill.serial_number ?? undefined;
  const year = prefill.purchase_date
    ? parseInt(prefill.purchase_date.slice(0, 4), 10) || undefined
    : undefined;
  const base = { brand, model, serial_number: serial };

  switch (categoryId) {
    case 'car':
      return clean({ brand, model, year, vin: serial });
    case 'moto':
      return clean({ ...base, year });
    case 'bike':
    case 'scooter':
      return clean(base);
    case 'boiler':
    case 'ac':
    case 'heatpump':
    case 'waterheater':
    case 'security':
      return clean({ ...base, install_year: year });
    case 'energy':
      return clean({ brand, model, serial_number: serial, install_year: year });
    case 'appliance':
    case 'garden':
    case 'multimedia':
    case 'other':
      return clean({ ...base, purchase_year: year });
    case 'pool':
      return clean({ install_year: year });
    case 'realestate':
    case 'pet':
    default:
      return {};
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AddAssetScreen() {
  const { addAsset, assetCount } = useAssetStore();
  const fetchUpcomingReminders = useEventStore(
    (s) => s.fetchUpcomingReminders,
  );
  const canAddAsset = useAppStore((s) => s.canAddAsset);

  const [prefill, setPrefill] = useState<ParsedInvoice | null>(null);
  const [categoryId, setCategoryId] = useState<AssetCategoryId | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [extraData, setExtraData] = useState<Record<string, any>>({});
  const [coverImageUri, setCoverImageUri] = useState<string | undefined>(undefined);
  const [purchaseDate, setPurchaseDate] = useState<string | undefined>(undefined);
  const [warrantyEndDate, setWarrantyEndDate] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const pending = useScanPrefillStore.getState().consumePendingPrefill();
    if (!pending) return;

    const p = pending.data;
    setPrefill(p);
    if (pending.imageUri) {
      persistAttachment(pending.imageUri)
        .then(setCoverImageUri)
        .catch(() => setCoverImageUri(pending.imageUri));
    }
    setName(p.item_name ?? '');
    if (p.total_ttc != null) setPurchasePrice(String(p.total_ttc));
    if (p.purchase_date) setPurchaseDate(p.purchase_date);
    const computed = computeWarrantyEnd(p.purchase_date, p.warranty_years);
    if (computed) setWarrantyEndDate(computed);
    setNotes(buildConsolidatedNotes(p));

    const cat = p.category_suggestion;
    if (isValidCategoryId(cat)) {
      setCategoryId(cat);
      setExtraData(buildExtraData(cat, p));
    }
  }, []);

  const handleCategoryChange = (cid: AssetCategoryId) => {
    if (cid === categoryId) return;
    setCategoryId(cid);
    if (prefill) {
      setExtraData(buildExtraData(cid, prefill));
    } else {
      setExtraData({});
    }
  };

  const handleExtraDataChange = (key: string, value: any) => {
    setExtraData((prev) => {
      const next = { ...prev };
      if (value === undefined || value === null || value === '') {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }
    if (!categoryId) {
      Alert.alert('Erreur', 'Choisissez une catégorie');
      return;
    }
    if (!canAddAsset(assetCount)) {
      router.push('/paywall');
      return;
    }
    setSaving(true);
    try {
      const created = await addAsset({
        name: name.trim(),
        categoryId,
        location: location.trim() || undefined,
        purchasePrice: purchasePrice.trim()
          ? parseFloat(purchasePrice.replace(',', '.'))
          : undefined,
        purchaseDate: purchaseDate || undefined,
        warrantyEndDate: warrantyEndDate || undefined,
        notes: notes.trim() || undefined,
        extraData:
          Object.keys(extraData).length > 0
            ? (extraData as AssetExtraData)
            : undefined,
        coverImageUri,
        archived: false,
      });

      const suggestions = getSuggestionsForCategory(categoryId);
      if (suggestions.length === 0) {
        router.back();
        return;
      }
      const summary = suggestions
        .map((s) => `• ${s.title} (tous les ${s.recurrenceMonths} mois)`)
        .join('\n');
      Alert.alert(
        'Activer les rappels recommandés ?',
        `${summary}\n\nUn événement sera créé pour chaque rappel avec récurrence automatique.`,
        [
          {
            text: 'Ignorer',
            style: 'cancel',
            onPress: () => router.back(),
          },
          {
            text: 'Activer',
            onPress: async () => {
              try {
                await applyMaintenanceSuggestions({
                  assetId: created.id,
                  assetName: created.name,
                  suggestions,
                });
                await fetchUpcomingReminders();
              } catch (e) {
                Alert.alert(
                  'Erreur',
                  'Certains rappels n’ont pas pu être créés.',
                );
              }
              router.back();
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = useMemo(
    () =>
      ASSET_CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        icon: CATEGORY_ICON_MAP[c.id] ?? Box,
      })),
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Screen contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 100 }}>
        {/* HEADER */}
        <View style={{ paddingTop: SPACING.lg, paddingBottom: SPACING.xl }}>
          <StyledText variant="eyebrow">NOUVEAU BIEN</StyledText>
          <StyledText variant="h2" style={{ marginTop: SPACING.xs }}>
            Ajouter un bien
          </StyledText>
        </View>

        {/* SCAN PREFILL BANNER */}
        {prefill && (
          <View
            style={{
              marginBottom: SPACING.xl,
              padding: SPACING.base,
              borderRadius: RADIUS.md,
              backgroundColor: COLORS.accentMuted,
              borderLeftWidth: 3,
              borderLeftColor: COLORS.accent,
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.md,
            }}
          >
            <Camera size={20} color={COLORS.accentDark} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <StyledText variant="eyebrow" color={COLORS.accentDark}>
                PRÉ-REMPLI DEPUIS VOTRE FACTURE
              </StyledText>
              <StyledText variant="small" style={{ marginTop: 2 }}>
                Vérifiez les informations et complétez si besoin.
              </StyledText>
            </View>
          </View>
        )}

        {/* CATÉGORIE */}
        <FormSection>
          <SelectGrid
            label="CATÉGORIE"
            required
            options={categoryOptions}
            selectedId={categoryId}
            onSelect={(id) => handleCategoryChange(id as AssetCategoryId)}
            columns={3}
          />
        </FormSection>

        {/* INFORMATIONS */}
        <FormSection title="INFORMATIONS">
          <TextField
            label="NOM"
            required
            value={name}
            onChangeText={setName}
            placeholder="Ex: Voiture principale"
          />
          <TextField
            label="LOCALISATION"
            value={location}
            onChangeText={setLocation}
            placeholder="Ex: Garage, Cuisine…"
          />
          <DateField
            label="DATE D'ACHAT"
            value={purchaseDate}
            onChange={setPurchaseDate}
          />
          <TextField
            label="PRIX D'ACHAT (€)"
            value={purchasePrice}
            onChangeText={setPurchasePrice}
            placeholder="Ex: 1500"
            keyboardType="decimal-pad"
          />
        </FormSection>

        {/* EXTRA DATA */}
        {categoryId && (
          <FormSection title="DÉTAILS SPÉCIFIQUES">
            <ExtraDataForm
              categoryId={categoryId}
              values={extraData}
              onChange={handleExtraDataChange}
            />
          </FormSection>
        )}

        {/* GARANTIE */}
        <FormSection title="GARANTIE">
          <DateField
            label="FIN DE GARANTIE"
            value={warrantyEndDate}
            onChange={setWarrantyEndDate}
          />
        </FormSection>

        {/* NOTES */}
        <FormSection title="NOTES">
          <TextField
            label="NOTES"
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes libres…"
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
          disabled={saving}
          style={({ pressed }) => [
            {
              backgroundColor: COLORS.primary,
              borderRadius: RADIUS.md,
              paddingVertical: SPACING.md,
              alignItems: 'center',
              ...SHADOWS.sm,
            },
            (pressed || saving) && { opacity: 0.85 },
          ]}
        >
          <StyledText variant="title" color={COLORS.textInverse}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}
