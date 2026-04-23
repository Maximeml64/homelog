// src/db/client.ts

import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, SCHEMA_VERSION } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('homelog.db');

  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await initSchema(db);

  return db;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  const versionRow = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = 'schema_version'`
  ).catch(() => null);

  const currentVersion = versionRow ? parseInt(versionRow.value) : 0;

  if (currentVersion < SCHEMA_VERSION) {
    const statements = CREATE_TABLES
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await db.execAsync(statement + ';');
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('schema_version', ?)`,
      [SCHEMA_VERSION.toString()]
    );
  }
}

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}