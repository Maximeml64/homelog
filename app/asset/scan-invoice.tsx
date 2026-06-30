// app/asset/scan-invoice.tsx

import React, { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  Box,
  Camera,
  FileText,
  ImagePlus,
  Plus,
  ScanLine,
  Sparkles,
  X,
} from 'lucide-react-native';
import {
  Card,
  DateField,
  FormSection,
  Screen,
  SelectGrid,
  SelectGridOption,
  StyledText,
  TextField,
} from '../../components/ui';
import { CATEGORY_ICON_MAP } from '../../components/ui/CategoryIcon';
import { ASSET_CATEGORIES } from '../../constants/categories';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { ApiError } from '../../src/services/apiClient';
import {
  scanInvoice,
  ScanInput,
  ScanInputError,
} from '../../src/services/invoiceScanService';
import { useScanPrefillStore } from '../../src/stores/scanPrefillStore';
import type { AssetCategoryId, ParsedInvoice } from '../../src/types';

const MAX_ITEMS = 4;

type Step = 'selecting' | 'ready' | 'scanning' | 'preview';

const VALID_CATEGORY_IDS = new Set<string>([
  'realestate', 'car', 'moto', 'bike', 'scooter', 'boiler', 'ac',
  'heatpump', 'waterheater', 'energy', 'pool', 'appliance', 'garden',
  'multimedia', 'security', 'pet', 'other',
]);

function isValidCategoryId(
  val: string | null | undefined,
): val is AssetCategoryId {
  return !!val && VALID_CATEGORY_IDS.has(val);
}

interface EditableParse {
  vendor_name: string;
  purchase_date: string;
  item_name: string;
  brand: string;
  model: string;
  serial_number: string;
  total_ttc: string;
  category_suggestion: AssetCategoryId | null;
}

function parsedToEditable(p: ParsedInvoice): EditableParse {
  return {
    vendor_name: p.vendor_name ?? '',
    purchase_date: p.purchase_date ?? '',
    item_name: p.item_name ?? '',
    brand: p.brand ?? '',
    model: p.model ?? '',
    serial_number: p.serial_number ?? '',
    total_ttc: p.total_ttc != null ? String(p.total_ttc) : '',
    category_suggestion: isValidCategoryId(p.category_suggestion)
      ? p.category_suggestion
      : null,
  };
}

function editableToParsed(
  edit: EditableParse,
  original: ParsedInvoice,
): ParsedInvoice {
  const total = parseFloat(edit.total_ttc.replace(',', '.'));
  return {
    ...original,
    vendor_name: edit.vendor_name.trim() || null,
    purchase_date: edit.purchase_date.trim() || null,
    item_name: edit.item_name.trim() || null,
    brand: edit.brand.trim() || null,
    model: edit.model.trim() || null,
    serial_number: edit.serial_number.trim() || null,
    total_ttc: Number.isFinite(total) ? total : null,
    category_suggestion: edit.category_suggestion,
  };
}

export default function ScanInvoiceScreen() {
  const [step, setStep] = useState<Step>('selecting');
  const [items, setItems] = useState<ScanInput[]>([]);
  const [parsed, setParsed] = useState<ParsedInvoice | null>(null);
  const [editable, setEditable] = useState<EditableParse | null>(null);

  const categoryOptions: SelectGridOption[] = useMemo(
    () =>
      ASSET_CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        icon: CATEGORY_ICON_MAP[c.id] ?? Box,
      })),
    [],
  );

  function addItems(newItems: ScanInput[]) {
    setItems((prev) => {
      const next = [...prev, ...newItems].slice(0, MAX_ITEMS);
      if (next.length > 0) setStep('ready');
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setStep('selecting');
      return next;
    });
  }

  async function handleCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        "L'accès à la caméra est nécessaire pour scanner une facture.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      addItems([{ uri: result.assets[0].uri, kind: 'image' }]);
    }
  }

  async function handleGallery() {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire.");
      return;
    }
    const remaining = MAX_ITEMS - items.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: remaining > 0 ? remaining : 1,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      addItems(result.assets.map((a) => ({ uri: a.uri, kind: 'image' })));
    }
  }

  async function handleDocument() {
    if (items.length >= MAX_ITEMS) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      addItems([{ uri: result.assets[0].uri, kind: 'pdf' }]);
    }
  }

  function handleAddPress() {
    if (items.length >= MAX_ITEMS) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            'Annuler',
            'Prendre une photo',
            'Choisir dans la galerie',
            'Choisir un fichier (PDF)',
          ],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) handleCamera();
          if (idx === 2) handleGallery();
          if (idx === 3) handleDocument();
        },
      );
    } else {
      Alert.alert(
        'Ajouter un document',
        'Source ?',
        [
          { text: 'Prendre une photo', onPress: handleCamera },
          { text: 'Galerie', onPress: handleGallery },
          { text: 'Fichier PDF', onPress: handleDocument },
          { text: 'Annuler', style: 'cancel' },
        ],
      );
    }
  }

  async function handleAnalyze() {
    setStep('scanning');
    try {
      const result = await scanInvoice(items);
      setParsed(result);
      setEditable(parsedToEditable(result));
      setStep('preview');
    } catch (e) {
      setStep('ready');
      if (e instanceof ScanInputError) {
        Alert.alert('Fichier trop volumineux', e.message);
      } else if (e instanceof ApiError && e.status === 429) {
        Alert.alert(
          'Limite atteinte',
          'Limite atteinte (20 scans/jour). Réessayez demain.',
        );
      } else if (e instanceof ApiError && e.status === 0) {
        Alert.alert('Connexion impossible', e.message);
      } else {
        Alert.alert(
          "Analyse impossible",
          "Nous n'avons pas pu lire cette facture. Essayez avec une image plus nette ou un PDF.",
        );
      }
    }
  }

  function handleConfirm() {
    if (!parsed || !editable) return;
    const finalParsed = editableToParsed(editable, parsed);
    // La couverture du bien doit être une image, jamais un PDF.
    const coverUri = items.find((it) => it.kind === 'image')?.uri;
    useScanPrefillStore.getState().setPendingPrefill(finalParsed, coverUri);
    router.replace('/asset/add');
  }

  function updateField<K extends keyof EditableParse>(
    key: K,
    value: EditableParse[K],
  ) {
    setEditable((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  // L'aperçu reflète la couverture réelle (une image, jamais un PDF) ;
  // à défaut d'image, on retombe sur le premier document (placeholder PDF).
  const firstItem = items.find((it) => it.kind === 'image') ?? items[0];

  // ─── RENDER : SCANNING (cinematic loading) ───────────────────────────
  if (step === 'scanning') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING.xl,
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: RADIUS.full,
            backgroundColor: COLORS.accentMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.xl,
          }}
        >
          <ScanLine
            size={36}
            color={COLORS.accentDark}
            strokeWidth={1.5}
          />
        </View>
        <StyledText variant="eyebrow" color={COLORS.accentDark}>
          ANALYSE EN COURS
        </StyledText>
        <StyledText
          variant="h2"
          align="center"
          style={{ marginTop: SPACING.sm, maxWidth: 280 }}
        >
          Nous lisons votre facture
        </StyledText>
        <StyledText
          variant="body"
          color={COLORS.textSecondary}
          align="center"
          style={{ marginTop: SPACING.sm, maxWidth: 300 }}
        >
          Quelques secondes — nous extrayons le vendeur, la date,
          le produit et le montant.
        </StyledText>
      </View>
    );
  }

  // ─── RENDER : PREVIEW (champs éditables) ─────────────────────────────
  if (step === 'preview' && editable) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Screen
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingBottom: 110,
          }}
        >
          {/* HEADER */}
          <View style={{ paddingTop: SPACING.lg, paddingBottom: SPACING.md }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.sm,
                marginBottom: SPACING.xs,
              }}
            >
              <Sparkles size={14} color={COLORS.accentDark} strokeWidth={2} />
              <StyledText variant="eyebrow" color={COLORS.accentDark}>
                FACTURE ANALYSÉE
              </StyledText>
            </View>
            <StyledText variant="h2" style={{ marginTop: SPACING.xs }}>
              Vérifiez les informations
            </StyledText>
            <StyledText
              variant="small"
              color={COLORS.textSecondary}
              style={{ marginTop: SPACING.xs }}
            >
              Corrigez si nécessaire avant de créer le bien.
            </StyledText>
          </View>

          {/* PREVIEW DOCUMENT */}
          {firstItem && (
            <View
              style={{
                marginBottom: SPACING.xl,
                borderRadius: RADIUS.md,
                overflow: 'hidden',
                backgroundColor: COLORS.surfaceAlt,
              }}
            >
              {firstItem.kind === 'pdf' ? (
                <View
                  style={{
                    width: '100%',
                    height: 180,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: SPACING.sm,
                  }}
                >
                  <FileText
                    size={40}
                    color={COLORS.textSecondary}
                    strokeWidth={1.5}
                  />
                  <StyledText variant="smallMedium" color={COLORS.textSecondary}>
                    Document PDF
                  </StyledText>
                </View>
              ) : (
                <Image
                  source={firstItem.uri}
                  style={{ width: '100%', height: 180 }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              )}
            </View>
          )}

          {/* IDENTITÉ */}
          <FormSection title="IDENTITÉ DU PRODUIT">
            <TextField
              label="PRODUIT"
              value={editable.item_name}
              onChangeText={(v) => updateField('item_name', v)}
              placeholder="Nom du produit"
            />
            <TextField
              label="MARQUE"
              value={editable.brand}
              onChangeText={(v) => updateField('brand', v)}
              placeholder="Ex : Bosch"
            />
            <TextField
              label="MODÈLE"
              value={editable.model}
              onChangeText={(v) => updateField('model', v)}
              placeholder="Ex : WAU28T40FF"
            />
            <TextField
              label="N° DE SÉRIE"
              value={editable.serial_number}
              onChangeText={(v) => updateField('serial_number', v)}
              placeholder="Optionnel"
            />
          </FormSection>

          {/* FACTURE */}
          <FormSection title="DÉTAILS FACTURE">
            <TextField
              label="VENDEUR"
              value={editable.vendor_name}
              onChangeText={(v) => updateField('vendor_name', v)}
              placeholder="Ex : Darty, Boulanger…"
            />
            <DateField
              label="DATE D'ACHAT"
              value={editable.purchase_date || undefined}
              onChange={(v) => updateField('purchase_date', v ?? '')}
            />
            <TextField
              label="MONTANT TTC (€)"
              value={editable.total_ttc}
              onChangeText={(v) => updateField('total_ttc', v)}
              placeholder="0,00"
              keyboardType="decimal-pad"
            />
          </FormSection>

          {/* CATÉGORIE */}
          <FormSection title="CATÉGORIE">
            <SelectGrid
              options={categoryOptions}
              selectedId={editable.category_suggestion}
              onSelect={(id) =>
                isValidCategoryId(id)
                  ? updateField('category_suggestion', id)
                  : null
              }
              columns={3}
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
            gap: SPACING.sm,
          }}
        >
          <Pressable
            onPress={handleConfirm}
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
              Continuer vers le formulaire
            </StyledText>
          </Pressable>
          <Pressable
            onPress={() => setStep('ready')}
            hitSlop={8}
            style={({ pressed }) => [
              { alignItems: 'center', paddingVertical: SPACING.xs },
              pressed && { opacity: 0.5 },
            ]}
          >
            <StyledText variant="smallMedium" color={COLORS.textSecondary}>
              Reprendre un document
            </StyledText>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── RENDER : SELECTING / READY ──────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Screen
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: step === 'ready' ? 110 : SPACING.xl,
        }}
      >
        {/* HEADER */}
        <View style={{ paddingTop: SPACING.lg, paddingBottom: SPACING.xl }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.sm,
              marginBottom: SPACING.xs,
            }}
          >
            <Sparkles size={14} color={COLORS.accentDark} strokeWidth={2} />
            <StyledText variant="eyebrow" color={COLORS.accentDark}>
              SCAN INTELLIGENT
            </StyledText>
          </View>
          <StyledText variant="h1" style={{ fontSize: 28, lineHeight: 34 }}>
            Importez votre facture
          </StyledText>
          <StyledText
            variant="body"
            color={COLORS.textSecondary}
            style={{ marginTop: SPACING.sm }}
          >
            Photo ou PDF — nous pré-remplissons automatiquement votre bien.
            Jusqu'à {MAX_ITEMS} documents par facture.
          </StyledText>
        </View>

        {/* THUMBNAILS */}
        {items.length > 0 && (
          <View style={{ marginBottom: SPACING.xl }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING.sm,
              }}
            >
              <StyledText variant="eyebrow">
                {items.length} DOCUMENT{items.length > 1 ? 'S' : ''}
              </StyledText>
              <StyledText variant="caption" color={COLORS.textTertiary}>
                {MAX_ITEMS - items.length} restant
                {MAX_ITEMS - items.length > 1 ? 's' : ''}
              </StyledText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: SPACING.sm, paddingRight: SPACING.lg }}
            >
              {items.map((item, idx) => (
                <View
                  key={`${item.uri}-${idx}`}
                  style={{
                    position: 'relative',
                    borderRadius: RADIUS.md,
                    overflow: 'hidden',
                  }}
                >
                  {item.kind === 'pdf' ? (
                    <View
                      style={{
                        width: 96,
                        height: 128,
                        backgroundColor: COLORS.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <FileText
                        size={28}
                        color={COLORS.textSecondary}
                        strokeWidth={1.5}
                      />
                      <StyledText variant="caption" color={COLORS.textSecondary}>
                        PDF
                      </StyledText>
                    </View>
                  ) : (
                    <Image
                      source={item.uri}
                      style={{
                        width: 96,
                        height: 128,
                        backgroundColor: COLORS.surfaceAlt,
                      }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      recyclingKey={item.uri}
                    />
                  )}
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: RADIUS.full,
                      backgroundColor: 'rgba(0,0,0,0.55)',
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
                      P{idx + 1}
                    </StyledText>
                  </View>
                  <Pressable
                    onPress={() => removeItem(idx)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      {
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <X size={12} color={COLORS.textInverse} strokeWidth={2.5} />
                  </Pressable>
                </View>
              ))}
              {items.length < MAX_ITEMS && (
                <Pressable
                  onPress={handleAddPress}
                  style={({ pressed }) => [
                    {
                      width: 96,
                      height: 128,
                      borderRadius: RADIUS.md,
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: COLORS.borderStrong,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Plus
                    size={20}
                    color={COLORS.textSecondary}
                    strokeWidth={1.75}
                  />
                  <StyledText variant="caption" color={COLORS.textSecondary}>
                    Ajouter
                  </StyledText>
                </Pressable>
              )}
            </ScrollView>
          </View>
        )}

        {/* SOURCES (état initial) */}
        {items.length === 0 && (
          <View style={{ gap: SPACING.md }}>
            <Card
              variant="outlined"
              padding="lg"
              radius="md"
              onPress={handleCamera}
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
                    width: 48,
                    height: 48,
                    borderRadius: RADIUS.full,
                    backgroundColor: COLORS.accentMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Camera
                    size={22}
                    color={COLORS.accentDark}
                    strokeWidth={1.75}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <StyledText variant="title">Prendre une photo</StyledText>
                  <StyledText
                    variant="small"
                    color={COLORS.textSecondary}
                    style={{ marginTop: 2 }}
                  >
                    Photographiez la facture directement.
                  </StyledText>
                </View>
              </View>
            </Card>
            <Card
              variant="outlined"
              padding="lg"
              radius="md"
              onPress={handleGallery}
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
                    width: 48,
                    height: 48,
                    borderRadius: RADIUS.full,
                    backgroundColor: COLORS.primaryMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImagePlus
                    size={22}
                    color={COLORS.primary}
                    strokeWidth={1.75}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <StyledText variant="title">
                    Choisir dans la galerie
                  </StyledText>
                  <StyledText
                    variant="small"
                    color={COLORS.textSecondary}
                    style={{ marginTop: 2 }}
                  >
                    Jusqu'à {MAX_ITEMS} documents, multi-sélection.
                  </StyledText>
                </View>
              </View>
            </Card>
            <Card
              variant="outlined"
              padding="lg"
              radius="md"
              onPress={handleDocument}
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
                    width: 48,
                    height: 48,
                    borderRadius: RADIUS.full,
                    backgroundColor: COLORS.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText
                    size={22}
                    color={COLORS.textSecondary}
                    strokeWidth={1.75}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <StyledText variant="title">
                    Choisir un fichier PDF
                  </StyledText>
                  <StyledText
                    variant="small"
                    color={COLORS.textSecondary}
                    style={{ marginTop: 2 }}
                  >
                    Importez une facture PDF depuis vos fichiers.
                  </StyledText>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* INFO BOX TIPS */}
        {items.length === 0 && (
          <View
            style={{
              marginTop: SPACING.xxl,
              padding: SPACING.base,
              borderRadius: RADIUS.md,
              backgroundColor: COLORS.surfaceAlt,
            }}
          >
            <StyledText
              variant="eyebrow"
              style={{ marginBottom: SPACING.xs }}
            >
              POUR UN MEILLEUR RÉSULTAT
            </StyledText>
            <StyledText variant="small" color={COLORS.textSecondary}>
              Cadrez la facture entière, sur fond uni, bien éclairée.
              {'\n'}Évitez les reflets et les angles trop prononcés.
            </StyledText>
          </View>
        )}
      </Screen>

      {/* STICKY ANALYZE */}
      {step === 'ready' && (
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
            onPress={handleAnalyze}
            style={({ pressed }) => [
              {
                backgroundColor: COLORS.accentDark,
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.md,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: SPACING.sm,
                ...SHADOWS.md,
              },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Sparkles size={16} color={COLORS.textInverse} strokeWidth={2} />
            <StyledText variant="title" color={COLORS.textInverse}>
              Analyser {items.length === 1 ? 'la facture' : `${items.length} documents`}
            </StyledText>
          </Pressable>
        </View>
      )}
    </View>
  );
}
