// app/(tabs)/_layout.tsx

import { router, Tabs } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/theme';
import { useEventStore } from '../../src/stores/eventStore';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

function ReminderTabIcon({ focused }: { focused: boolean }) {
  const { upcomingReminders } = useEventStore();
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = upcomingReminders.filter(
    r => r.nextDueDate && r.nextDueDate < today
  ).length;

  return (
    <View style={{ position: 'relative' }}>
      <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
        🔔
      </Text>
      {overdueCount > 0 && (
        <View style={{
          position: 'absolute',
          top: -4,
          right: -6,
          backgroundColor: colors.danger,
          borderRadius: 8,
          minWidth: 16,
          height: 16,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
            {overdueCount > 9 ? '9+' : overdueCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 24,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: '600', color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: 'Mes biens',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/search')}
              style={{ marginRight: 16 }}
            >
              <Text style={{ fontSize: 20 }}>🔍</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Rappels',
          tabBarIcon: ({ focused }) => <ReminderTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Réglages',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
