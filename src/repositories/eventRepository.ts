// src/repositories/eventRepository.ts

import { getDatabase, uuidv4 } from '../db/client';
import { Attachment, EventType, MaintenanceEvent } from '../types';

function rowToEvent(row: any): MaintenanceEvent {
  return {
    id: row.id,
    assetId: row.asset_id,
    eventType: row.event_type as EventType,
    title: row.title,
    eventDate: row.event_date,
    cost: row.cost ?? undefined,
    providerName: row.provider_name ?? undefined,
    notes: row.notes ?? undefined,
    mileageAtEvent: row.mileage_at_event ?? undefined,
    nextDueDate: row.next_due_date ?? undefined,
    nextDueMileage: row.next_due_mileage ?? undefined,
    reminderEnabled: row.reminder_enabled === 1,
    reminderNotifId: row.reminder_notif_id ?? undefined,
    recurrenceMonths: row.recurrence_months ?? undefined,
    status: row.status as 'past' | 'upcoming',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToAttachment(row: any): Attachment {
  return {
    id: row.id,
    eventId: row.event_id ?? undefined,
    assetId: row.asset_id ?? undefined,
    type: row.type,
    uri: row.uri,
    fileName: row.file_name ?? undefined,
    mimeType: row.mime_type ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getEventsByAsset(assetId: string): Promise<MaintenanceEvent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM maintenance_event WHERE asset_id = ? ORDER BY event_date DESC`,
    [assetId]
  );
  return rows.map(rowToEvent);
}

export async function getAllEvents(): Promise<MaintenanceEvent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT me.* FROM maintenance_event me
     INNER JOIN asset a ON me.asset_id = a.id
     WHERE a.archived = 0
     ORDER BY me.event_date DESC`
  );
  return rows.map(rowToEvent);
}

export async function getUpcomingReminders(): Promise<MaintenanceEvent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT me.* FROM maintenance_event me
     INNER JOIN asset a ON me.asset_id = a.id
     WHERE me.reminder_enabled = 1
     AND me.next_due_date IS NOT NULL
     AND a.archived = 0
     ORDER BY me.next_due_date ASC`,
  );
  return rows.map(rowToEvent);
}

export async function getEventById(id: string): Promise<MaintenanceEvent | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM maintenance_event WHERE id = ?`, [id]
  );
  if (!row) return null;
  const event = rowToEvent(row);
  event.attachments = await getAttachmentsByEvent(id);
  return event;
}

export async function createEvent(
  data: Omit<MaintenanceEvent, 'id' | 'createdAt' | 'updatedAt' | 'attachments'>
): Promise<MaintenanceEvent> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO maintenance_event (
      id, asset_id, event_type, title, event_date, cost, provider_name,
      notes, mileage_at_event, next_due_date, next_due_mileage,
      reminder_enabled, reminder_notif_id, recurrence_months, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.assetId,
      data.eventType,
      data.title,
      data.eventDate,
      data.cost ?? null,
      data.providerName ?? null,
      data.notes ?? null,
      data.mileageAtEvent ?? null,
      data.nextDueDate ?? null,
      data.nextDueMileage ?? null,
      data.reminderEnabled ? 1 : 0,
      data.reminderNotifId ?? null,
      data.recurrenceMonths ?? null,
      data.status,
      now,
      now,
    ]
  );

  return { ...data, id, createdAt: now, updatedAt: now };
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<MaintenanceEvent, 'id' | 'createdAt' | 'attachments'>>
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const sets: string[] = [];
  const values: any[] = [];

  if (data.eventType !== undefined) { sets.push('event_type = ?'); values.push(data.eventType); }
  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.eventDate !== undefined) { sets.push('event_date = ?'); values.push(data.eventDate); }
  if (data.cost !== undefined) { sets.push('cost = ?'); values.push(data.cost ?? null); }
  if (data.providerName !== undefined) { sets.push('provider_name = ?'); values.push(data.providerName ?? null); }
  if (data.notes !== undefined) { sets.push('notes = ?'); values.push(data.notes ?? null); }
  if (data.mileageAtEvent !== undefined) { sets.push('mileage_at_event = ?'); values.push(data.mileageAtEvent ?? null); }
  if (data.nextDueDate !== undefined) { sets.push('next_due_date = ?'); values.push(data.nextDueDate ?? null); }
  if (data.nextDueMileage !== undefined) { sets.push('next_due_mileage = ?'); values.push(data.nextDueMileage ?? null); }
  if (data.reminderEnabled !== undefined) { sets.push('reminder_enabled = ?'); values.push(data.reminderEnabled ? 1 : 0); }
  if (data.reminderNotifId !== undefined) { sets.push('reminder_notif_id = ?'); values.push(data.reminderNotifId ?? null); }
  if (data.recurrenceMonths !== undefined) { sets.push('recurrence_months = ?'); values.push(data.recurrenceMonths ?? null); }
  if (data.status !== undefined) { sets.push('status = ?'); values.push(data.status); }

  if (sets.length === 0) return;

  sets.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(`UPDATE maintenance_event SET ${sets.join(', ')} WHERE id = ?`, values);
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM maintenance_event WHERE id = ?`, [id]);
}

export async function getTotalCostByAsset(assetId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(cost), 0) as total FROM maintenance_event WHERE asset_id = ?`,
    [assetId]
  );
  return row?.total ?? 0;
}

export async function getAnnualCost(year: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(cost), 0) as total FROM maintenance_event 
     WHERE strftime('%Y', event_date) = ?`,
    [year.toString()]
  );
  return row?.total ?? 0;
}

export async function getUpcomingCost(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(me.cost), 0) as total
     FROM maintenance_event me
     INNER JOIN asset a ON me.asset_id = a.id
     WHERE me.status = 'upcoming'
     AND a.archived = 0`
  );
  return row?.total ?? 0;
}

// Dépenses par mois sur les 12 derniers mois
export async function getMonthlyCosts(year: number): Promise<{ month: number; total: number }[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ month: string; total: number }>(
    `SELECT strftime('%m', event_date) as month, COALESCE(SUM(cost), 0) as total
     FROM maintenance_event
     WHERE strftime('%Y', event_date) = ?
     AND status = 'past'
     AND cost IS NOT NULL
     GROUP BY strftime('%m', event_date)
     ORDER BY month ASC`,
    [year.toString()]
  );
  // Retourne 12 mois, 0 si pas de données
  const result = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    total: 0,
  }));
  rows.forEach(r => {
    const idx = parseInt(r.month, 10) - 1;
    if (idx >= 0 && idx < 12) result[idx].total = r.total;
  });
  return result;
}

// Dépenses par catégorie de bien sur une année
export async function getCostByCategory(year: number): Promise<{ categoryId: string; total: number }[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ category_id: string; total: number }>(
    `SELECT a.category_id, COALESCE(SUM(me.cost), 0) as total
     FROM maintenance_event me
     INNER JOIN asset a ON me.asset_id = a.id
     WHERE strftime('%Y', me.event_date) = ?
     AND me.status = 'past'
     AND me.cost IS NOT NULL
     AND a.archived = 0
     GROUP BY a.category_id
     ORDER BY total DESC`,
    [year.toString()]
  );
  return rows.map(r => ({ categoryId: r.category_id, total: r.total }));
}

// Valeur totale du patrimoine (prix d'achat des biens)
export async function getTotalPatrimony(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(purchase_price), 0) as total FROM asset WHERE archived = 0`
  );
  return row?.total ?? 0;
}

export async function getAttachmentsByEvent(eventId: string): Promise<Attachment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM attachment WHERE event_id = ? ORDER BY created_at ASC`,
    [eventId]
  );
  return rows.map(rowToAttachment);
}

export async function getAttachmentsByAsset(assetId: string): Promise<Attachment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM attachment WHERE asset_id = ? ORDER BY created_at ASC`,
    [assetId]
  );
  return rows.map(rowToAttachment);
}

export async function createAttachment(
  data: Omit<Attachment, 'id' | 'createdAt'>
): Promise<Attachment> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO attachment (id, event_id, asset_id, type, uri, file_name, mime_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.eventId ?? null, data.assetId ?? null, data.type, data.uri, data.fileName ?? null, data.mimeType ?? null, now]
  );

  return { ...data, id, createdAt: now };
}

export async function deleteAttachment(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM attachment WHERE id = ?`, [id]);
}