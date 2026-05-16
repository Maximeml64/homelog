// app/asset/edit/[id].tsx

import React, { useEffect, useMemo, useState } from 'react';
import { View, Alert, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Box } from 'lucide-react-native';
import {
  DateField,
  FormSection,
  Screen,
  SelectGrid,
  StyledText,
  TextField,
} from '../../../components/ui';
import { CATEGORY_ICON_MAP } from '../../../components/ui/CategoryIcon';
import { ExtraDataForm } from '../../../components/ExtraDataForm';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../../constants/theme';
import { ASSET_CATEGORIES } from '../../../constants/categories';
import { useAssetStore } from '../../../src/stores/assetStore';
import type { Asset, AssetCategoryId, AssetExtraData } from '../../../src/types';

export default function EditAssetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assets, editAsset } = useAssetStore();

  const [original, setOriginal] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categoryId, setCategoryId] = useState<AssetCategoryId | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [extraData, setExtraData] = useState<Record<string, any>>({});
  const [coverImageUri, setCoverImageUri] = useState<string | undefined>(undefined);
  const [purchaseDate, setPurchaseDate] = useState<string | undefined>(undefined);
  const [warrantyEndDate, setWarrantyEndDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const asset = assets.find((a) => a.id === id);
    if (asset) {
      setOriginal(asset);
      setCategoryId(asset.categoryId);
      setName(asset.name);
      setLocation(asset.location ?? '');
      setPurchasePrice(
        asset.purchasePrice !== undefined ? String(asset.purchasePrice) : '',
      );
      setNotes(asset.notes ?? '');
      setExtraData((asset.extraData as Record<string, any>) ?? {});
      setCoverImageUri(asset.coverImageUri);
      setPurchaseDate(asset.purchaseDate);
      setWarrantyEndDate(asset.warrantyEndDate);
    }
    setLoading(false);
  }, [id, assets]);

  const handleCategoryChange = (cid: AssetCategoryId) => {
    if (cid === categoryId) return;
    const hasExtraData = Object.keys(extraData).length > 0;
    const apply = () => {
      setCategoryId(cid);
      setExtraData({});
    };
    if (!hasExtraData) {
      apply();
      return;
    }
    Alert.alert(
      'Changer de catégorie ?',
      'Les détails spécifiques (kilométrage, année, n° de série…) seront effacés.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', style: 'destructive', onPress: apply },
      ],
    );
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
    if (!original) return;
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }
    if (!categoryId) {
      Alert.alert('Erreur', 'Choisissez une catégorie');
      return;
    }
    setSaving(true);
    try {
      await editAsset(original.id, {
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
      });
      router.back();
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

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!original) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg }}>
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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Screen contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 100 }}>
        {/* HEADER */}
        <View style={{ paddingTop: SPACING.lg, paddingBottom: SPACING.xl }}>
          <StyledText variant="eyebrow">MODIFIER LE BIEN</StyledText>
          <StyledText variant="h2" style={{ marginTop: SPACING.xs }}>
            Modifier le bien
          </StyledText>
        </View>

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
            label="DATE D'ACHAT"
            value={purchaseDate}
            onChange={setPurchaseDate}
          />
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
