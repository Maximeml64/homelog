// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomTabBar } from '../../components/ui';
import { COLORS } from '../../constants/theme';

export default function TabLayout() {
  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="assets" />
        <Tabs.Screen name="reminders" />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="settings" />
      </Tabs>
    </SafeAreaView>
  );
}
