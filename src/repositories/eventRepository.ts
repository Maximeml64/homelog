// src/repositories/eventRepository.ts

import { getDatabase, uuidv4 } from '../db/client';
import { MaintenanceEvent, EventType, Attachment } from '../types';

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
    status: row.status as 'past' | 'upcoming',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToAttachment(row: any): Attachment {
  return {
    id: row.id,
    eventId: row.event_id,
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
    `SELECT * FROM maintenance_event ORDER BY event_date DESC`
  );
  return rows.map(rowToEvent);
}

export async function getUpcomingReminders(): Promise<MaintenanceEvent[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM maintenance_event 
     WHERE reminder_enabled = 1 AND next_due_date IS NOT NULL
     ORDER BY next_due_date ASC`,
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
      reminder_enabled, reminder_notif_id, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

  await db.runAsync(
    `UPDATE maintenance_event SET
      event_type = COALESCE(?, event_type),
      title = COALESCE(?, title),
      event_date = COALESCE(?, event_date),
      cost = ?,
      provider_name = ?,
      notes = ?,
      mileage_at_event = ?,
      next_due_date = ?,
      next_due_mileage = ?,
      reminder_enabled = COALESCE(?, reminder_enabled),
      reminder_notif_id = ?,
      status = COALESCE(?, status),
      updated_at = ?
    WHERE id = ?`,
    [
      data.eventType ?? null,
      data.title ?? null,
      data.eventDate ?? null,
      data.cost ?? null,
      data.providerName ?? null,
      data.notes ?? null,
      data.mileageAtEvent ?? null,
      data.nextDueDate ?? null,
      data.nextDueMileage ?? null,
      data.reminderEnabled !== undefined ? (data.reminderEnabled ? 1 : 0) : null,
      data.reminderNotifId ?? null,
      data.status ?? null,
      now,
      id,
    ]
  );
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

export async function getAttachmentsByEvent(eventId: string): Promise<Attachment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM attachment WHERE event_id = ? ORDER BY created_at ASC`,
    [eventId]
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
    `INSERT INTO attachment (id, event_id, type, uri, file_name, mime_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.eventId, data.type, data.uri, data.fileName ?? null, data.mimeType ?? null, now]
  );

  return { ...data, id, createdAt: now };
}

export async function deleteAttachment(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM attachment WHERE id = ?`, [id]);
}
