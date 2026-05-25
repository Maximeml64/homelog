// src/services/maintenanceSuggestionService.ts
// Creates upcoming events from a category's suggested maintenance plan
// and schedules the corresponding notifications.

import {
  createEvent,
  updateEvent,
} from '../repositories/eventRepository';
import { scheduleReminder } from './notificationService';
import { uuidv4 } from '../db/client';
import type { MaintenanceSuggestion } from '../../constants/maintenanceSuggestions';

interface ApplyArgs {
  assetId: string;
  assetName: string;
  suggestions: MaintenanceSuggestion[];
}

export async function applyMaintenanceSuggestions({
  assetId,
  assetName,
  suggestions,
}: ApplyArgs): Promise<number> {
  let created = 0;
  for (const suggestion of suggestions) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + suggestion.recurrenceMonths);
    const dueIso = dueDate.toISOString().slice(0, 10);

    const event = await createEvent({
      assetId,
      eventType: suggestion.eventType,
      title: suggestion.title,
      eventDate: dueIso,
      nextDueDate: dueIso,
      reminderEnabled: true,
      recurrenceMonths: suggestion.recurrenceMonths,
      status: 'upcoming',
    });

    const reminderDate = new Date(dueDate);
    reminderDate.setHours(9, 0, 0, 0);
    const notifId = await scheduleReminder(
      uuidv4(),
      assetName,
      suggestion.title,
      reminderDate,
    );
    if (notifId) {
      await updateEvent(event.id, { reminderNotifId: notifId });
    }
    created++;
  }
  return created;
}
