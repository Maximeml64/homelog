// src/db/client.ts

import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, MIGRATIONS, SCHEMA_VERSION } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('homelog2.db');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await initSchema(db);
      return db;
    })().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
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

  // Applique les migrations manquantes. Chaque statement est best-effort :
  // si la même migration a été partiellement appliquée par un boot précédent
  // (race condition résolue depuis), on tolère les erreurs « duplicate column »
  // ou « already exists » afin de pouvoir converger vers la version cible.
  for (let v = currentVersion + 1; v <= SCHEMA_VERSION; v++) {
    const migration = MIGRATIONS[v];
    if (migration) {
      await db.execAsync('PRAGMA foreign_keys = OFF;');
      for (const sql of migration) {
        try {
          await db.execAsync(sql);
        } catch (e: any) {
          const msg = String(e?.message ?? e).toLowerCase();
          const idempotent =
            msg.includes('duplicate column') ||
            msg.includes('already exists');
          if (!idempotent) throw e;
        }
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
  return Crypto.randomUUID();
}