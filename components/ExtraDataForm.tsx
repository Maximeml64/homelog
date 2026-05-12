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
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
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
                      { color: isSelected ? ec.text : COLORS.textSecondary, fontWeight: isSelected ? '700' : '400' },
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
                      { color: isSelected ? dc.text : COLORS.textSecondary, fontWeight: isSelected ? '700' : '400' },
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
      {fields.map(renderField)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  fieldContainer: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: FONTS.sans,
    fontSize: 15,
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  inputWithUnit: {
    marginRight: SPACING.xs,
  },
  unitBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
  },
  unitText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    color: COLORS.textSecondary,
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
    fontFamily: FONTS.sansMedium,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  boolButtonTextSelected: {
    color: COLORS.textInverse,
    fontFamily: FONTS.sansSemiBold,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  optionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: 'transparent',
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  optionChipTextSelected: {
    color: COLORS.textInverse,
    fontFamily: FONTS.sansSemiBold,
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
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
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
    fontFamily: FONTS.sansSemiBold,
    fontSize: 15,
  },
});
