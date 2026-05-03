// app/_layout.tsx

import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { colors } from '../constants/theme';
import { requestNotificationPermission } from '../src/services/notificationService';
import { useAppStore } from '../src/stores/appStore';

const RC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';

export default function RootLayout() {
  const { loadAppState, initRevenueCat } = useAppStore();

  useEffect(() => {
    try {
      Purchases.configure({ apiKey: RC_API_KEY });
    } catch (e) {
      // Non disponible sur Expo Go
    }

    loadAppState().then(async () => {
      const { onboardingDone } = useAppStore.getState();
      if (!onboardingDone) {
        router.replace('/onboarding');
      } else {
        requestNotificationPermission();
      }
      await initRevenueCat();
    });
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerBackTitle: 'Retour',
        }}
      >
        <Stack.Screen name="search" options={{ title: 'Recherche', presentation: 'modal' }} />
        <Stack.Screen name="archived" options={{ title: 'Biens archivés' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="asset/add" options={{ title: 'Nouveau bien', presentation: 'modal' }} />
        <Stack.Screen name="asset/[id]" options={{ title: '' }} />
        <Stack.Screen name="asset/edit/[id]" options={{ title: 'Modifier', presentation: 'modal' }} />
        <Stack.Screen name="event/add" options={{ title: 'Nouvel événement', presentation: 'modal' }} />
        <Stack.Screen name="event/[id]" options={{ title: 'Événement' }} />
        <Stack.Screen name="event/edit/[id]" options={{ title: "Modifier l'événement", presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ title: 'Premium', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
