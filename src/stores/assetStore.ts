// src/stores/assetStore.ts

import { create } from 'zustand';
import {
  createAsset,
  deleteAsset,
  getAllAssets,
  getArchivedAssets,
  getAssetById,
  getAssetCount,
  updateAsset,
} from '../repositories/assetRepository';
import {
  getEventsByAsset,
  updateEvent,
} from '../repositories/eventRepository';
import {
  cancelReminder,
  scheduleReminder,
} from '../services/notificationService';
import { Asset } from '../types';

interface AssetStore {
  assets: Asset[];
  archivedAssets: Asset[];
  loading: boolean;
  error: string | null;
  assetCount: number;
  fetchAssets: () => Promise<void>;
  fetchArchivedAssets: () => Promise<void>;
  fetchAssetCount: () => Promise<void>;
  addAsset: (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Asset>;
  editAsset: (id: string, data: Partial<Omit<Asset, 'id' | 'createdAt'>>) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  archiveAsset: (id: string) => Promise<void>;
  unarchiveAsset: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  archivedAssets: [],
  loading: false,
  error: null,
  assetCount: 0,

  fetchAssets: async () => {
    set({ loading: true, error: null });
    try {
      const assets = await getAllAssets();
      set({ assets, loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
    }
  },

  fetchArchivedAssets: async () => {
    try {
      const archivedAssets = await getArchivedAssets();
      set({ archivedAssets });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchAssetCount: async () => {
    const count = await getAssetCount();
    set({ assetCount: count });
  },

  clearError: () => set({ error: null }),

  addAsset: async (data) => {
    const asset = await createAsset(data);
    await get().fetchAssets();
    await get().fetchAssetCount();
    return asset;
  },

  editAsset: async (id, data) => {
    await updateAsset(id, data);
    await get().fetchAssets();
  },

  removeAsset: async (id) => {
    await deleteAsset(id);
    await get().fetchAssets();
    await get().fetchAssetCount();
  },

  archiveAsset: async (id) => {
    const db_events = await getEventsByAsset(id);
    for (const event of db_events) {
      if (event.reminderNotifId) {
        await cancelReminder(event.reminderNotifId);
      }
    }
    await updateAsset(id, { archived: true });
    await get().fetchAssets();
    await get().fetchAssetCount();
  },

  unarchiveAsset: async (id) => {
    await updateAsset(id, { archived: false });

    const asset = await getAssetById(id);
    const db_events = await getEventsByAsset(id);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    for (const event of db_events) {
      if (!event.reminderEnabled || !event.nextDueDate) continue;
      const dueDate = new Date(event.nextDueDate);
      if (Number.isNaN(dueDate.getTime()) || dueDate <= todayMidnight) continue;

      const reminderDate = new Date(dueDate);
      reminderDate.setHours(9, 0, 0, 0);
      const notifId = await scheduleReminder(
        event.id,
        asset?.name ?? 'Entretien',
        event.title,
        reminderDate,
      );
      await updateEvent(event.id, { reminderNotifId: notifId ?? undefined });
    }

    await get().fetchAssets();
    await get().fetchAssetCount();
    await get().fetchArchivedAssets();
  },
}));