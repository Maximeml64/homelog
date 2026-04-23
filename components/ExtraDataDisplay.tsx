// components/ExtraDataDisplay.tsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CATEGORY_FIELDS } from '../constants/categoryFields';
import { colors, fontSize, fontWeight, radius, spacing } from '../constants/theme';

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
  extraData: Record<string, any>;
}

export function ExtraDataDisplay({ categoryId, extraData }: Props) {
  const fields = CATEGORY_FIELDS[categoryId];

  if (!fields || !extraData) return null;

  const filledFields = fields.filter(f => {
    const val = extraData[f.key];
    return val !== undefined && val !== null && val !== '';
  });

  if (filledFields.length === 0) return null;

  function renderValue(field: typeof fields[0]) {
    const val = extraData[field.key];

    if (field.type === 'boolean') {
      return (
        <Text style={styles.detailValue}>
          {val === true ? 'Oui' : 'Non'}
        </Text>
      );
    }

    if (field.type === 'energy_class') {
      const ec = ENERGY_CLASS_COLORS[val] ?? { bg: '#ccc', text: '#333' };
      return (
        <View style={[styles.classBadge, { backgroundColor: ec.bg }]}>
          <Text style={[styles.classBadgeText, { color: ec.text }]}>{val}</Text>
        </View>
      );
    }

    if (field.type === 'dpe_class') {
      const dc = DPE_CLASS_COLORS[val] ?? { bg: '#ccc', text: '#333' };
      return (
        <View style={[styles.classBadge, { backgroundColor: dc.bg }]}>
          <Text style={[styles.classBadgeText, { color: dc.text }]}>{val}</Text>
        </View>
      );
    }

    if (field.type === 'select') {
      const opt = field.options?.find(o => o.value === val);
      return (
        <Text style={styles.detailValue}>{opt?.label ?? val}</Text>
      );
    }

    if (field.type === 'date') {
      const formatted = String(val).includes('-')
        ? String(val).split('-').reverse().join('/')
        : String(val);
      return <Text style={styles.detailValue}>{formatted}</Text>;
    }

    const display = field.unit ? `${val} ${field.unit}` : String(val);
    return <Text style={styles.detailValue}>{display}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Informations détaillées</Text>
      {filledFields.map(field => (
        <View key={field.key} style={styles.row}>
          <Text style={styles.detailLabel}>{field.label}</Text>
          {renderValue(field)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
    textAlign: 'right',
    flex: 1,
  },
  classBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    minWidth: 36,
    alignItems: 'center',
  },
  classBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
