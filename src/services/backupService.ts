// src/services/backupService.ts
// Builds a portable .zip backup of the user's data:
//   - data.json — all DB rows (assets, events, attachments, vehicle_details)
//   - attachments/ — every attachment file + asset cover image, keyed by basename
//
// Restoration is intentionally not implemented yet — it requires a careful
// merge/overwrite UX. For now the backup is read-only and the user is expected
// to keep the .zip in iCloud Drive / Files for safekeeping.

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { getDatabase } from '../db/client';
import { SCHEMA_VERSION } from '../db/schema';

const BACKUP_VERSION = 1;

interface BackupShape {
  backupVersion: number;
  schemaVersion: number;
  exportedAt: string;
  assets: any[];
  vehicleDetails: any[];
  events: any[];
  attachments: any[];
}

async function loadDbSnapshot(): Promise<BackupShape> {
  const db = await getDatabase();
  const [assets, vehicleDetails, events, attachments] = await Promise.all([
    db.getAllAsync<any>(`SELECT * FROM asset`),
    db.getAllAsync<any>(`SELECT * FROM vehicle_details`),
    db.getAllAsync<any>(`SELECT * FROM maintenance_event`),
    db.getAllAsync<any>(`SELECT * FROM attachment`),
  ]);
  return {
    backupVersion: BACKUP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    assets,
    vehicleDetails,
    events,
    attachments,
  };
}

function basename(uri: string): string {
  const noQuery = uri.split('?')[0];
  const idx = noQuery.lastIndexOf('/');
  return idx > -1 ? noQuery.slice(idx + 1) : noQuery;
}

async function readFileAsBase64(uri: string): Promise<string | null> {
  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    return null;
  }
}

export async function exportBackup(): Promise<void> {
  const snapshot = await loadDbSnapshot();
  const zip = new JSZip();
  zip.file('data.json', JSON.stringify(snapshot, null, 2));

  const attachmentsFolder = zip.folder('attachments');
  if (attachmentsFolder) {
    const uniqueUris = new Set<string>();
    snapshot.attachments.forEach((a) => {
      if (a.uri) uniqueUris.add(a.uri);
    });
    snapshot.assets.forEach((a) => {
      if (a.cover_image_uri) uniqueUris.add(a.cover_image_uri);
    });
    for (const uri of uniqueUris) {
      const base64 = await readFileAsBase64(uri);
      if (base64) {
        attachmentsFolder.file(basename(uri), base64, { base64: true });
      }
    }
  }

  const content = await zip.generateAsync({ type: 'base64' });
  const stamp = new Date().toISOString().slice(0, 10);
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) throw new Error('Cache directory unavailable.');
  const destination = `${cacheDir}homelog-backup-${stamp}.zip`;
  await FileSystem.writeAsStringAsync(destination, content, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Le partage n’est pas disponible sur cet appareil.');
  }
  await Sharing.shareAsync(destination, {
    mimeType: 'application/zip',
    dialogTitle: 'Sauvegarde Homelog',
    UTI: 'public.zip-archive',
  });
}
