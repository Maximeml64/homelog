// components/ExtraDataForm.tsx

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CATEGORY_FIELDS, CategoryField } from '../constants/categoryFields';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { DatePickerInput } from './DatePickerInput';

const ENERGY_CLASS_COLORS: Record<string, { bg: string; text: string }> = {
  'A+++': { bg: '#00A651', text: '#fff' },
  'A++':  { bg: '#2DB24A', text: '#fff' },
  'A+':   { bg: '#57B947', text: '#fff' },
  'A':    { bg: '#A8CE3B', text: '#fff' },
  'B':    { bg: '#FFF200', text: '#333' },
  'C':    { bg: '#FDB913', text: '#333' },
  'D':    { bg: '#F37021', text: '#fff' },
  'E':    { bg: '#EF4023', text: '#fff' },
  'F':    { bg: '#BE1E2D', text: '#fff' },
  'G':    { bg: '#8B0000', text: '#fff' },
};

const DPE_CLASS_COLORS: Record<string, { bg: string; text: string }> = {
  'A': { bg: '#00A651', text: '#fff' },
  'B': { bg: '#57B947', text: '#fff' },
  'C': { bg: '#A8CE3B', text: '#333' },
  'D': { bg: '#FFF200', text: '#333' },
  'E': { bg: '#FDB913', text: '#333' },
  'F': { bg: '#F37021', text: '#fff' },
  'G': { bg: '#EF4023', text: '#fff' },
};

// ExtraData stocke les dates en ISO (YYYY-MM-DD)
// DatePickerInput travaille aussi en ISO — pas de conversion nécessaire

interface Props {
  categoryId: string;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export function ExtraDataForm({ categoryId, values, onChange }: Props) {
  const fields = CATEGORY_FIELDS[categoryId];

  if (!fields || fields.length === 0) return null;

  const renderField = (field: CategoryField) => {
    const value = values[field.key];

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.label}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, field.unit ? styles.inputWithUnit : null]}
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={(text) => {
                  if (field.type === 'number') {
                    const parsed = parseFloat(text);
                    onChange(field.key, isNaN(parsed) ? undefined : parsed);
                  } else {
                    onChange(field.key, text || undefined);
                  }
                }}
                placeholder={field.placeholder ?? ''}
                placeholderTextColor={COLORS.textTertiary}
                keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
              />
              {field.unit && (
                <View style={styles.unitBadge}>
                  <Text style={styles.unitText}>{field.unit}</Text>
                </View>
              )}
            </View>
          </View>
        );

      case 'date':
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <DatePickerInput
              label={field.label}
              value={value ?? ''}
              onChange={(iso) => onChange(field.key, iso || undefined)}
              placeholder="JJ/MM/AAAA"
            />
          </View>
        );

      case 'boolean':
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.label}</Text>
            <View style={styles.boolRow}>
              {[
                { label: 'Oui', val: true },
                { label: 'Non', val: false },
              ].map(({ label, val }) => {
                const isSelected = value === val;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.boolButton, isSelected && styles.boolButtonSelected]}
                    onPress={() => onChange(field.key, isSelected ? undefined : val)}
                  >
                    <Text style={[styles.boolButtonText, isSelected && styles.boolButtonTextSelected]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 'select':
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.label}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsRow}
            >
              {field.options?.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                    onPress={() => onChange(field.key, isSelected ? undefined : opt.value)}
                  >
                    <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        );

      case 'energy_class':
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.label}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsRow}
            >
              {field.options?.map((opt) => {
                const isSelected = value === opt.value;
                const ec = ENERGY_CLASS_COLORS[opt.value] ?? { bg: '#ccc', text: '#333' };
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.energyChip,
                      {
                        backgroundColor: isSelected ? ec.bg : 'transparent',
                        borderColor: isSelected ? ec.bg : COLORS.border,
                      },
                    ]}
                    onPress={() => onChange(field.key, isSelected ? undefined : opt.value)}
                  >
                    <Text style={[
                      styles.energyChipText,
                      { color: isSelected ? ec.text : COLORS.textSecondary },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        );

      case 'dpe_class':
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.label}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsRow}
            >
              {field.options?.map((opt) => {
                const isSelected = value === opt.value;
                const dc = DPE_CLASS_COLORS[opt.value] ?? { bg: '#ccc', text: '#333' };
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.dpeChip,
                      {
                        backgroundColor: isSelected ? dc.bg : 'transparent',
                        borderColor: isSelected ? dc.bg : COLORS.border,
                      },
                    ]}
                    onPress={() => onChange(field.key, isSelected ? undefined : opt.value)}
                  >
                    <Text style={[
                      styles.dpeChipText,
                      { color: isSelected ? dc.text : COLORS.textSecondary },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Informations détaillées</Text>
      {fields.map(renderField)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.eyebrow,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.small,
    marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.surface,
  },
  inputWithUnit: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  unitBadge: {
    height: 44,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopRightRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
  },
  unitText: {
    ...TYPOGRAPHY.small,
  },
  boolRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  boolButton: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  boolButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  boolButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  boolButtonTextSelected: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textInverse,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  optionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    ...TYPOGRAPHY.small,
  },
  optionChipTextSelected: {
    ...TYPOGRAPHY.smallMedium,
    color: COLORS.textInverse,
  },
  energyChip: {
    width: 46,
    height: 36,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyChipText: {
    ...TYPOGRAPHY.caption,
  },
  dpeChip: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpeChipText: {
    ...TYPOGRAPHY.bodyMedium,
  },
});
