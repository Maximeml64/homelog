// app/asset/scan-invoice.tsx

import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ApiError } from '../../src/services/apiClient';
import { scanInvoice } from '../../src/services/invoiceScanService';
import { useScanPrefillStore } from '../../src/stores/scanPrefillStore';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadow,
  spacing,
} from '../../constants/theme';

type Step = 'selecting' | 'ready' | 'scanning';

const MAX_IMAGES = 4;

export default function ScanInvoiceScreen() {
  const [step, setStep] = useState<Step>('selecting');
  const [imageUris, setImageUris] = useState<string[]>([]);

  function addImages(uris: string[]) {
    setImageUris(prev => {
      const next = [...prev, ...uris].slice(0, MAX_IMAGES);
      if (next.length > 0) setStep('ready');
      return next;
    });
  }

  function removeImage(index: number) {
    setImageUris(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setStep('selecting');
      return next;
    });
  }

  async function handleCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la caméra est nécessaire pour scanner une facture.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images' as any,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      addImages([result.assets[0].uri]);
    }
  }

  async function handleGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire.");
      return;
    }
    const remaining = MAX_IMAGES - imageUris.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsMultipleSelection: true,
      selectionLimit: remaining > 0 ? remaining : 1,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      addImages(result.assets.map(a => a.uri));
    }
  }

  async function handleAnalyze() {
    setStep('scanning');
    try {
      const parsed = await scanInvoice(imageUris);
      // Pass data via store — avoids URL param encoding issues with router.replace
      useScanPrefillStore.getState().setPendingPrefill(parsed, imageUris[0]);
      router.replace('/asset/add');
    } catch (e) {
      setStep('ready');
      if (e instanceof ApiError && e.status === 429) {
        Alert.alert('Limite atteinte', 'Limite atteinte (20 scans/jour). Réessaie demain.');
      } else {
        Alert.alert(
          "Erreur d'analyse",
          "Erreur d'analyse, vérifie ta connexion ou réessaie.",
        );
      }
    }
  }

  if (step === 'scanning') {
    return (
      <View style={styles.scanningContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.scanningText}>Analyse en cours, ~5 secondes...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.subtitle}>
        {"Photographiez votre facture pour pré-remplir automatiquement les informations du bien. Jusqu'à "}
        {MAX_IMAGES} pages.
      </Text>

      {/* Thumbnails */}
      {imageUris.length > 0 && (
        <View style={styles.thumbnailsSection}>
          <Text style={styles.sectionLabel}>
            {imageUris.length} page{imageUris.length > 1 ? 's' : ''} sélectionnée{imageUris.length > 1 ? 's' : ''}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.thumbnailsRow}>
              {imageUris.map((uri, idx) => (
                <View key={`${uri}-${idx}`} style={styles.thumbnailWrapper}>
                  <Image source={{ uri }} style={styles.thumbnail} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.thumbnailRemove}
                    onPress={() => removeImage(idx)}
                    accessibilityLabel={`Supprimer la page ${idx + 1}`}
                  >
                    <Text style={styles.thumbnailRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Photo picker buttons */}
      <View style={styles.pickerRow}>
        <TouchableOpacity
          style={[styles.pickerButton, imageUris.length >= MAX_IMAGES && styles.pickerButtonDisabled]}
          onPress={handleCamera}
          disabled={imageUris.length >= MAX_IMAGES}
        >
          <Text style={styles.pickerIcon}>📷</Text>
          <Text style={styles.pickerLabel}>Prendre une photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pickerButton, imageUris.length >= MAX_IMAGES && styles.pickerButtonDisabled]}
          onPress={handleGallery}
          disabled={imageUris.length >= MAX_IMAGES}
        >
          <Text style={styles.pickerIcon}>🖼️</Text>
          <Text style={styles.pickerLabel}>Choisir dans la galerie</Text>
        </TouchableOpacity>
      </View>

      {imageUris.length > 0 && imageUris.length < MAX_IMAGES && (
        <TouchableOpacity style={styles.addPageButton} onPress={handleGallery}>
          <Text style={styles.addPageText}>+ Ajouter une autre page</Text>
        </TouchableOpacity>
      )}

      {imageUris.length >= MAX_IMAGES && (
        <Text style={styles.maxReachedText}>Maximum {MAX_IMAGES} pages atteint.</Text>
      )}

      {step === 'ready' && (
        <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
          <Text style={styles.analyzeText}>Analyser la facture</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 60 },

  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  scanningText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },

  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },

  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  thumbnailsSection: { marginBottom: spacing.md },
  thumbnailsRow: { flexDirection: 'row', gap: spacing.sm },
  thumbnailWrapper: { position: 'relative' },
  thumbnail: {
    width: 100,
    height: 130,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  thumbnailRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailRemoveText: { color: colors.white, fontSize: 11, fontWeight: fontWeight.bold },

  pickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadow.sm,
  },
  pickerButtonDisabled: { opacity: 0.4 },
  pickerIcon: { fontSize: 28 },
  pickerLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },

  addPageButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addPageText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  maxReachedText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  analyzeButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadow.md,
  },
  analyzeText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
});
