// app/asset/add.tsx

import { router } from 'expo-router';
import { useState } from 'react';
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
import { colors, fontSize, fontWeight, radius, spacing } from '../../constants/theme';
import { useAppStore } from '../../src/stores/appStore';
import { useAssetStore } from '../../src/stores/assetStore';
import { AssetCategoryId, AssetExtraData } from '../../src/types';

export default function AddAssetScreen() {
  const { addAsset, assetCount } = useAssetStore();
  const { canAddAsset } = useAppStore();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<AssetCategoryId | null>(null);
  const [location, setLocation] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [extraData, setExtraData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  function handleCategoryChange(id: AssetCategoryId) {
    setCategoryId(id);
    setExtraData({});
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
        archived: false,
      });

      router.back();
    } catch (e) {
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
