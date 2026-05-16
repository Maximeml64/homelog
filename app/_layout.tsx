// app/_layout.tsx
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { getDatabase } from '../src/db/client';
import { requestNotificationPermission } from '../src/services/notificationService';
import { useAppStore } from '../src/stores/appStore';

const RC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';

const isExpoGo =
  (Constants.appOwnership as string) === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

export default function RootLayout() {
  const { loadAppState, initRevenueCat } = useAppStore();
  const [dbReady, setDbReady] = useState(false);

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
    // Initialise la base avant de monter les écrans : évite que plusieurs
    // useFocusEffect ne tentent d'ouvrir la connexion + appliquer les
    // migrations en parallèle au tout premier lancement (ce qui laissait
    // des fetchs précoces dans un état d'erreur silencieuse).
    getDatabase()
      .then(() => setDbReady(true))
      .catch((e) => {
        console.warn('[db] init failed', e);
        setDbReady(true);
      });
  }, []);

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

  if (!dbReady) {
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        <Stack.Screen name="event/scan-invoice" options={{ title: 'Scanner un devis', presentation: 'modal' }} />
        <Stack.Screen name="event/[id]" options={{ title: 'Événement' }} />
        <Stack.Screen name="event/edit/[id]" options={{ title: "Modifier l'événement", presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ title: 'Premium', presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
