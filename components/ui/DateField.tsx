import React, { useState } from 'react';
import { View, Pressable, Platform, ViewStyle } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Calendar, X } from 'lucide-react-native';
import { StyledText } from './StyledText';
import { COLORS, SPACING } from '../../constants/theme';
import { formatLongDate } from '../../src/utils/format';

interface DateFieldProps {
  label: string;
  value?: string; // ISO YYYY-MM-DD
  onChange: (iso: string | undefined) => void;
  required?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  minDate?: Date;
  style?: ViewStyle;
}

export function DateField({
  label,
  value,
  onChange,
  required = false,
  allowClear = true,
  placeholder = 'Sélectionner une date',
  minDate,
  style,
}: DateFieldProps) {
  const [show, setShow] = useState(false);
  const currentDate = value ? new Date(value) : new Date();

  const handleChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
  };

  const handleClear = (e: any) => {
    e.stopPropagation?.();
    onChange(undefined);
  };

  return (
    <View style={style}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <StyledText variant="eyebrow" style={{ fontSize: 10 }}>
          {label}
        </StyledText>
        {required && (
          <StyledText
            variant="caption"
            color={COLORS.danger}
            style={{ marginLeft: 4 }}
          >
            *
          </StyledText>
        )}
      </View>

      <Pressable
        onPress={() => setShow(true)}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
            gap: SPACING.sm,
          },
          pressed && { opacity: 0.6 },
        ]}
      >
        <StyledText
          variant="body"
          color={value ? COLORS.text : COLORS.textTertiary}
          style={{ flex: 1 }}
        >
          {value ? formatLongDate(value) : placeholder}
        </StyledText>
        {value && allowClear && (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.5 }]}
          >
            <X size={14} color={COLORS.textTertiary} strokeWidth={2} />
          </Pressable>
        )}
        <Calendar size={16} color={COLORS.textTertiary} strokeWidth={1.75} />
      </Pressable>

      {show && (
        <View style={{ marginTop: SPACING.sm }}>
          <DateTimePicker
            value={currentDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            minimumDate={minDate}
            locale="fr-FR"
          />
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={() => setShow(false)}
              style={({ pressed }) => [
                {
                  alignSelf: 'flex-end',
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm,
                },
                pressed && { opacity: 0.5 },
              ]}
            >
              <StyledText variant="smallMedium" color={COLORS.primary}>
                Valider
              </StyledText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default DateField;
