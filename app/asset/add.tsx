// app/asset/add.tsx

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ExtraDataForm } from '../../components/ExtraDataForm';
import { ASSET_CATEGORIES } from '../../constants/categories';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import { useAppStore } from '../../src/stores/appStore';
import { useAssetStore } from '../../src/stores/assetStore';
import { useScanPrefillStore } from '../../src/stores/scanPrefillStore';
import { AssetCategoryId, AssetExtraData, ParsedInvoice } from '../../src/types';

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
  if (prefill.warranty_years) {
    parts.push(`Garantie : ${prefill.warranty_years} an${prefill.warranty_years > 1 ? 's' : ''}`);
  }
  if (prefill.notes) parts.push(prefill.notes);
  return parts.join('\n');
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

function clean(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AddAssetScreen() {
  const { addAsset, assetCount } = useAssetStore();
  const { canAddAsset } = useAppStore();

  const [prefill, setPrefill] = useState<ParsedInvoice | null>(null);
  const [categoryId, setCategoryId] = useState<AssetCategoryId | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [extraData, setExtraData] = useState<Record<string, any>>({});
  const [coverImageUri, setCoverImageUri] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Consume pending prefill from scan-invoice screen on mount
  useEffect(() => {
    const pending = useScanPrefillStore.getState().consumePendingPrefill();
    if (!pending) return;

    const p = pending.data;
    setPrefill(p);
    setCoverImageUri(pending.imageUri);
    setName(p.item_name ?? '');
    if (p.total_ttc != null) setPurchasePrice(String(p.total_ttc));
    setNotes(buildConsolidatedNotes(p));

    const cat = p.category_suggestion;
    if (isValidCategoryId(cat)) {
      setCategoryId(cat);
      setExtraData(buildExtraData(cat, p));
    }
  }, []);

  function handleCategoryChange(id: AssetCategoryId) {
    setCategoryId(id);
    if (prefill) {
      setExtraData(buildExtraData(id, prefill));
    } else {
      setExtraData({});
    }
  }

  function handleExtraDataChange(key: string, value: any) {
    setExtraData(prev => {
      const next = { ...prev };
      if (value === undefined || value === '') {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }

  async function handleSave() {
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

    setLoading(true);
    try {
      await addAsset({
        name: name.trim(),
        categoryId,
        location: location.trim() || undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        notes: notes.trim() || undefined,
        extraData: Object.keys(extraData).length > 0 ? (extraData as AssetExtraData) : undefined,
        coverImageUri,
        archived: false,
      });
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
    >
      {/* Scan banner — hidden once a prefill is active */}
      {!prefill && (
        <TouchableOpacity
          style={styles.scanBanner}
          onPress={() => router.push('/asset/scan-invoice')}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Scanner une facture pour pré-remplir"
        >
          <Text style={styles.scanBannerIcon}>📷</Text>
          <View style={styles.scanBannerBody}>
            <Text style={styles.scanBannerTitle}>
              Scanner une facture pour pré-remplir
            </Text>
            <Text style={styles.scanBannerSub}>Gagne du temps, pré-remplissage automatique</Text>
          </View>
          <Text style={styles.scanBannerChevron}>›</Text>
        </TouchableOpacity>
      )}

      {prefill && (
        <View style={styles.prefillBadge}>
          <Text style={styles.prefillBadgeText}>✅ Pré-rempli depuis la facture scannée</Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>Catégorie *</Text>
      <View style={styles.categoryGrid}>
        {ASSET_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, categoryId === cat.id && styles.categoryChipActive]}
            onPress={() => handleCategoryChange(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryLabel, categoryId === cat.id && styles.categoryLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Nom *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Peugeot 3008, Chaudière salon..."
        placeholderTextColor={colors.textTertiary}
        value={name}
        onChangeText={setName}
      />

      {categoryId && (
        <ExtraDataForm
          categoryId={categoryId}
          values={extraData}
          onChange={handleExtraDataChange}
        />
      )}

      <Text style={styles.sectionLabel}>Localisation</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Garage, Cuisine, Jardin..."
        placeholderTextColor={colors.textTertiary}
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.sectionLabel}>Prix d'achat (€)</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        placeholderTextColor={colors.textTertiary}
        value={purchasePrice}
        onChangeText={setPurchasePrice}
        keyboardType="numeric"
      />

      <Text style={styles.sectionLabel}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Informations complémentaires..."
        placeholderTextColor={colors.textTertiary}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 60 },

  // Scan banner
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadow.sm,
  },
  scanBannerIcon: { fontSize: 26 },
  scanBannerBody: { flex: 1 },
  scanBannerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  scanBannerSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scanBannerChevron: { fontSize: 22, color: colors.primary },

  // Prefill badge
  prefillBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  prefillBadgeText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },

  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryChip: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    width: '23%',
  },
  categoryChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  categoryIcon: { fontSize: 24, marginBottom: 4 },
  categoryLabel: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  categoryLabelActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.md },
});
