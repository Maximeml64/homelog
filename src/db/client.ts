// src/db/client.ts

import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, MIGRATIONS, SCHEMA_VERSION } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('homelog2.db');

  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await initSchema(db);

  return db;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  // Crée les tables si elles n'existent pas
  const statements = CREATE_TABLES
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    await db.execAsync(statement + ';');
  }

  // Récupère la version actuelle
  const versionRow = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = 'schema_version'`
  ).catch(() => null);

  const currentVersion = versionRow ? parseInt(versionRow.value) : 0;

  // Applique les migrations manquantes
  for (let v = currentVersion + 1; v <= SCHEMA_VERSION; v++) {
    const migration = MIGRATIONS[v];
    if (migration) {
      await db.execAsync('PRAGMA foreign_keys = OFF;');
      for (const sql of migration) {
        await db.execAsync(sql);
      }
      await db.execAsync('PRAGMA foreign_keys = ON;');
    }
  }

  // Met à jour la version
  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('schema_version', ?)`,
    [SCHEMA_VERSION.toString()]
  );
}

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}