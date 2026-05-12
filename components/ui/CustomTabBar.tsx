import React from 'react';
import { View, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  Package,
  Bell,
  History,
  Settings,
  LucideIcon,
} from 'lucide-react-native';
import { StyledText } from './StyledText';
import { COLORS, SPACING, TAB_BAR, FONTS } from '../../constants/theme';
import { useEventStore } from '../../src/stores/eventStore';

const TAB_ICONS: Record<string, LucideIcon> = {
  index: Home,
  assets: Package,
  reminders: Bell,
  history: History,
  settings: Settings,
};

const TAB_LABELS: Record<string, string> = {
  index: 'Accueil',
  assets: 'Mes biens',
  reminders: 'Rappels',
  history: 'Historique',
  settings: 'Réglages',
};

export function CustomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const overdueCount = useEventStore((s) => {
    const today = new Date().toISOString().split('T')[0];
    return (
      s.upcomingReminders?.filter(
        (r) => r.nextDueDate && r.nextDueDate < today,
      ).length ?? 0
    );
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: Math.max(insets.bottom, TAB_BAR.paddingBottom),
        paddingTop: TAB_BAR.paddingTop,
        paddingHorizontal: SPACING.xs,
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const Icon = TAB_ICONS[route.name] ?? Home;
        const label = TAB_LABELS[route.name] ?? route.name;
        const showBadge = route.name === 'reminders' && overdueCount > 0;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel ?? label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [
              { flex: 1, alignItems: 'center', paddingVertical: 4 },
              pressed && { opacity: 0.6 },
            ]}
          >
            {/* Indicateur or champagne */}
            <View
              style={{
                width: 24,
                height: 2,
                borderRadius: 1,
                backgroundColor: isFocused ? COLORS.accent : 'transparent',
                marginBottom: 6,
              }}
            />

            {/* Icône + badge overdue */}
            <View style={{ position: 'relative' }}>
              <Icon
                size={22}
                color={isFocused ? COLORS.primary : COLORS.textTertiary}
                strokeWidth={isFocused ? 2 : 1.75}
              />
              {showBadge && (
                <View
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    paddingHorizontal: 4,
                    borderRadius: 8,
                    backgroundColor: COLORS.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: COLORS.surface,
                  }}
                >
                  <StyledText
                    variant="caption"
                    color={COLORS.textInverse}
                    style={{
                      fontSize: 9,
                      lineHeight: 11,
                      fontFamily: FONTS.sansBold,
                    }}
                  >
                    {overdueCount > 9 ? '9+' : String(overdueCount)}
                  </StyledText>
                </View>
              )}
            </View>

            {/* Label */}
            <StyledText
              variant="caption"
              color={isFocused ? COLORS.primary : COLORS.textTertiary}
              style={{
                fontSize: 10,
                lineHeight: 14,
                marginTop: 4,
                fontFamily: isFocused ? FONTS.sansSemiBold : FONTS.sansMedium,
              }}
              numberOfLines={1}
            >
              {label}
            </StyledText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default CustomTabBar;
