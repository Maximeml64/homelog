// components/DatePickerInput.tsx
// Version sans module natif - compatible Expo Go

import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../constants/theme';

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
  // État interne d'affichage — indépendant de la valeur ISO parent
  const [display, setDisplay] = useState(() => isoToDisplay(value));
  const isInternalChange = useRef(false);

  // Sync depuis le parent uniquement si changement externe (pas depuis notre propre onChange)
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
      onChange(iso); // vide si date invalide, ISO si valide
    } else {
      onChange(''); // date incomplète → on vide l'ISO
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
          placeholderTextColor={colors.textTertiary}
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
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: fontSize.md,
    color: colors.text,
  },
  icon: { fontSize: 16 },
});
