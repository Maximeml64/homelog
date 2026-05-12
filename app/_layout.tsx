// app/_layout.tsx
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import Constants from 'expo-constants';
import Purchases from 'react-native-purchases';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  IBMPlexSerif_400Regular,
  IBMPlexSerif_500Medium,
  IBMPlexSerif_600SemiBold,
  IBMPlexSerif_700Bold,
} from '@expo-google-fonts/ibm-plex-serif';
import { COLORS } from '../constants/theme';
import { requestNotificationPermission } from '../src/services/notificationService';
import { useAppStore } from '../src/stores/appStore';

const RC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';

const isExpoGo =
  (Constants.appOwnership as string) === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

export default function RootLayout() {
  const { loadAppState, initRevenueCat } = useAppStore();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    IBMPlexSerif_400Regular,
    IBMPlexSerif_500Medium,
    IBMPlexSerif_600SemiBold,
    IBMPlexSerif_700Bold,
  });

  useEffect(() => {
    if (isExpoGo) {
      console.warn('[RC] Skipping configure in Expo Go (use dev build for RC features)');
    } else {
      try {
        Purchases.configure({ apiKey: RC_API_KEY });
      } catch (e) {
        console.warn('[RC] configure failed:', e);
      }
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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: COLORS.background },
          headerShadowVisible: false,
          headerBackTitle: 'Retour',
        }}
      >
        <Stack.Screen name="search" options={{ title: 'Recherche', presentation: 'modal' }} />
        <Stack.Screen name="archived" options={{ title: 'Biens archivés' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="asset/add" options={{ title: 'Nouveau bien', presentation: 'modal' }} />
        <Stack.Screen name="asset/scan-invoice" options={{ title: 'Scanner une facture', presentation: 'modal' }} />
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
