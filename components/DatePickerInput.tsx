// components/DatePickerInput.tsx
// Version sans module natif - compatible Expo Go

import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface Props {
  value: string; // ISO format YYYY-MM-DD ou vide
  onChange: (iso: string) => void;
  placeholder?: string;
  label?: string;
}

function formatInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isoToDisplay(iso: string): string {
  if (!iso || !iso.includes('-')) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

function displayToIso(display: string): string {
  if (display.length !== 10) return '';
  const parts = display.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  if (!d || !m || !y || y.length !== 4) return '';
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (isNaN(date.getTime())) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function DatePickerInput({ value, onChange, placeholder = 'JJ/MM/AAAA', label }: Props) {
  const [display, setDisplay] = useState(() => isoToDisplay(value));
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (!isInternalChange.current) {
      setDisplay(isoToDisplay(value));
    }
    isInternalChange.current = false;
  }, [value]);

  function handleChange(raw: string) {
    const formatted = formatInput(raw);
    setDisplay(formatted);
    isInternalChange.current = true;

    if (formatted.length === 10) {
      const iso = displayToIso(formatted);
      onChange(iso);
    } else {
      onChange('');
    }
  }

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={display}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          keyboardType="numeric"
          maxLength={10}
        />
        <Text style={styles.icon}>📅</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...TYPOGRAPHY.smallMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    ...TYPOGRAPHY.body,
  },
  icon: { fontSize: 16 },
});
