// src/stores/eventStore.ts

import { create } from 'zustand';
import {
  createAttachment,
  createEvent,
  deleteAttachment,
  deleteEvent,
  getAllEvents,
  getAnnualCost,
  getCostByCategory,
  getEventById,
  getEventsByAsset,
  getMonthlyCosts,
  getTotalCostByAsset,
  getTotalPatrimony,
  getUpcomingCost,
  getUpcomingReminders,
  updateEvent,
} from '../repositories/eventRepository';
import { cancelReminder } from '../services/notificationService';
import { Attachment, MaintenanceEvent } from '../types';

interface EventStore {
  events: MaintenanceEvent[];
  upcomingReminders: MaintenanceEvent[];
  loading: boolean;
  error: string | null;
  fetchEventsByAsset: (assetId: string) => Promise<void>;
  fetchAllEvents: () => Promise<void>;
  fetchUpcomingReminders: () => Promise<void>;
  addEvent: (data: Omit<MaintenanceEvent, 'id' | 'createdAt' | 'updatedAt' | 'attachments'>) => Promise<MaintenanceEvent>;
  editEvent: (id: string, data: Partial<Omit<MaintenanceEvent, 'id' | 'createdAt' | 'attachments'>>) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  getTotalCost: (assetId: string) => Promise<number>;
  getYearlyCost: (year: number) => Promise<number>;
  getUpcomingCost: () => Promise<number>;
  getMonthlyCosts: (year: number) => Promise<{ month: number; total: number }[]>;
  getCostByCategory: (year: number) => Promise<{ categoryId: string; total: number }[]>;
  getTotalPatrimony: () => Promise<number>;
  addAttachment: (data: Omit<Attachment, 'id' | 'createdAt'>) => Promise<Attachment>;
  removeAttachment: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  upcomingReminders: [],
  loading: false,
  error: null,

  fetchEventsByAsset: async (assetId) => {
    set({ loading: true, error: null });
    try {
      const events = await getEventsByAsset(assetId);
      set({ events, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchAllEvents: async () => {
    set({ loading: true, error: null });
    try {
      const events = await getAllEvents();
      set({ events, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchUpcomingReminders: async () => {
    try {
      const reminders = await getUpcomingReminders();
      set({ upcomingReminders: reminders });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  addEvent: async (data) => {
    const event = await createEvent(data);
    await get().fetchUpcomingReminders();
    return event;
  },

  editEvent: async (id, data) => {
    await updateEvent(id, data);
    await get().fetchUpcomingReminders();
  },

  removeEvent: async (id) => {
    const existing = await getEventById(id);
    if (existing?.reminderNotifId) {
      await cancelReminder(existing.reminderNotifId);
    }
    await deleteEvent(id);
    await get().fetchUpcomingReminders();
  },

  getTotalCost: async (assetId) => {
    return await getTotalCostByAsset(assetId);
  },

  getYearlyCost: async (year) => {
    return await getAnnualCost(year);
  },

  getUpcomingCost: async () => {
    return await getUpcomingCost();
  },

  getMonthlyCosts: async (year) => {
    return await getMonthlyCosts(year);
  },

  getCostByCategory: async (year) => {
    return await getCostByCategory(year);
  },

  getTotalPatrimony: async () => {
    return await getTotalPatrimony();
  },

  addAttachment: async (data) => {
    return await createAttachment(data);
  },

  removeAttachment: async (id) => {
    await deleteAttachment(id);
  },

  clearError: () => set({ error: null }),
}));