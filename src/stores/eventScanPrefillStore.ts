// src/stores/eventScanPrefillStore.ts
// In-memory store for passing quote/invoice scan results to the add-event form.
// Not persisted — survives only within the app session.

import { create } from 'zustand';

export interface EventPrefillData {
  title?: string;
  eventDate?: string;
  cost?: string;
  providerName?: string;
  notes?: string;
}

interface PendingEventPrefill {
  data: EventPrefillData;
  imageUri?: string;
}

interface EventScanPrefillStore {
  pendingPrefill: PendingEventPrefill | null;
  setPendingPrefill: (data: EventPrefillData, imageUri?: string) => void;
  consumePendingPrefill: () => PendingEventPrefill | null;
}

export const useEventScanPrefillStore = create<EventScanPrefillStore>((set, get) => ({
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
