// src/stores/appStore.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { create } from 'zustand';
import { SubscriptionState } from '../types';

const MAX_FREE_ASSETS = 3;
const ENTITLEMENT_ID = 'Homelog Pro';

interface AppStore {
  subscription: SubscriptionState;
  isPremium: boolean;
  maxFreeAssets: number;
  onboardingDone: boolean;
  userName: string;
  packages: PurchasesPackage[];
  isLoadingPurchase: boolean;
  setSubscription: (state: SubscriptionState) => void;
  canAddAsset: (currentCount: number) => boolean;
  completeOnboarding: (name: string) => Promise<void>;
  loadAppState: () => Promise<void>;
  initRevenueCat: () => Promise<void>;
  purchasePremium: () => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
}

function checkPremium(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export const useAppStore = create<AppStore>((set, get) => ({
  subscription: { isPremium: false },
  isPremium: false,
  maxFreeAssets: MAX_FREE_ASSETS,
  onboardingDone: false,
  userName: '',
  packages: [],
  isLoadingPurchase: false,

  setSubscription: (state) => {
    set({ subscription: state, isPremium: state.isPremium });
  },

  canAddAsset: (currentCount) => {
    const { isPremium } = get();
    if (isPremium) return true;
    return currentCount < MAX_FREE_ASSETS;
  },

  completeOnboarding: async (name) => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    await AsyncStorage.setItem('user_name', name.trim());
    set({ onboardingDone: true, userName: name.trim() });
  },

  loadAppState: async () => {
    const done = await AsyncStorage.getItem('onboarding_done');
    const name = await AsyncStorage.getItem('user_name');
    set({
      onboardingDone: done === 'true',
      userName: name ?? '',
    });
  },

  initRevenueCat: async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium = checkPremium(customerInfo);
      set({ isPremium, subscription: { isPremium } });

      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages ?? [];
      set({ packages });
    } catch (e) {
      // Silencieux en dev sandbox
    }
  },

  purchasePremium: async () => {
    const { packages } = get();
    const pkg = packages[0];

    if (!pkg) {
      return { success: false, error: 'Aucun produit disponible' };
    }

    set({ isLoadingPurchase: true });
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPremium = checkPremium(customerInfo);
      set({ isPremium, subscription: { isPremium }, isLoadingPurchase: false });
      return { success: isPremium };
    } catch (e: any) {
      set({ isLoadingPurchase: false });
      if (e?.userCancelled) {
        return { success: false };
      }
      return { success: false, error: e?.message ?? 'Erreur lors de l\'achat' };
    }
  },

  restorePurchases: async () => {
    set({ isLoadingPurchase: true });
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = checkPremium(customerInfo);
      set({ isPremium, subscription: { isPremium }, isLoadingPurchase: false });
      return { success: true };
    } catch (e: any) {
      set({ isLoadingPurchase: false });
      return { success: false, error: e?.message ?? 'Erreur lors de la restauration' };
    }
  },
}));