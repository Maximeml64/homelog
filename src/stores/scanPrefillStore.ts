// src/stores/scanPrefillStore.ts
// In-memory store for passing invoice scan results to the add-asset form.
// Not persisted — survives only within the app session.

import { create } from 'zustand';
import { ParsedInvoice } from '../types';

interface PendingPrefill {
  data: ParsedInvoice;
  imageUri: string;
}

interface ScanPrefillStore {
  pendingPrefill: PendingPrefill | null;
  setPendingPrefill: (data: ParsedInvoice, imageUri: string) => void;
  consumePendingPrefill: () => PendingPrefill | null;
}

export const useScanPrefillStore = create<ScanPrefillStore>((set, get) => ({
  pendingPrefill: null,

  setPendingPrefill: (data, imageUri) => {
    set({ pendingPrefill: { data, imageUri } });
  },

  consumePendingPrefill: () => {
    const { pendingPrefill } = get();
    if (pendingPrefill) {
      set({ pendingPrefill: null });
    }
    return pendingPrefill;
  },
}));
