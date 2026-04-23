// src/services/csvService.ts

import * as Sharing from 'expo-sharing';
import { ASSET_CATEGORIES, EVENT_TYPES } from '../../constants/categories';
import { Asset, MaintenanceEvent } from '../types';

function escapeCsv(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function getCategoryLabel(categoryId: string): string {
  return ASSET_CATEGORIES.find(c => c.id === categoryId)?.label ?? categoryId;
}

function getEventTypeLabel(type: string): string {
  return EVENT_TYPES.find(t => t.id === type)?.label ?? type;
}

async function writeTempFile(filename: string, content: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FS = require('expo-file-system');
  const dir: string = FS.documentDirectory ?? FS.cacheDirectory ?? '';
  const uri = `${dir}${filename}`;
  await FS.writeAsStringAsync(uri, '\uFEFF' + content);
  return uri;
}

export async function exportCSV(
  assets: Asset[],
  eventsMap: Record<string, MaintenanceEvent[]>
): Promise<void> {
  const now = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');

  // ── Biens ──────────────────────────────────────────────────────────────
  const assetHeaders = [
    'Nom', 'Catégorie', 'Marque', 'Modèle',
    "Date d'achat", 'Prix achat (€)', 'Localisation', 'N° série',
    'Coût entretiens (€)', 'Nb événements', 'Notes',
  ];

  const assetRows = assets.map(a => {
    const data = a.extraData as Record<string, any> | undefined;
    const brand = data?.brand ?? a.brand ?? '';
    const model = data?.model ?? a.model ?? '';
    const events = eventsMap[a.id] ?? [];
    const totalCost = events.reduce((s, e) => s + (e.cost ?? 0), 0);
    return [
      escapeCsv(a.name), escapeCsv(getCategoryLabel(a.categoryId)),
      escapeCsv(brand), escapeCsv(model),
      escapeCsv(formatDate(a.purchaseDate)), escapeCsv(a.purchasePrice),
      escapeCsv(a.location), escapeCsv(a.serialNumber),
      escapeCsv(totalCost.toFixed(2)), escapeCsv(events.length),
      escapeCsv(a.notes),
    ].join(',');
  });

  const assetsCsv = [assetHeaders.join(','), ...assetRows].join('\n');

  // ── Événements ─────────────────────────────────────────────────────────
  const eventHeaders = [
    'Bien', 'Catégorie bien', 'Type', 'Titre', 'Date', 'Coût (€)',
    'Prestataire', 'Kilométrage', 'Prochain entretien', 'Prochain km',
    'Statut', 'Notes',
  ];

  const allEventRows = assets.flatMap(a => {
    const events = eventsMap[a.id] ?? [];
    return events.map(e => [
      escapeCsv(a.name), escapeCsv(getCategoryLabel(a.categoryId)),
      escapeCsv(getEventTypeLabel(e.eventType)), escapeCsv(e.title),
      escapeCsv(formatDate(e.eventDate)), escapeCsv(e.cost?.toFixed(2)),
      escapeCsv(e.providerName), escapeCsv(e.mileageAtEvent),
      escapeCsv(formatDate(e.nextDueDate)), escapeCsv(e.nextDueMileage),
      escapeCsv(e.status === 'past' ? 'Passé' : 'À venir'), escapeCsv(e.notes),
    ].join(','));
  });

  const eventsCsv = [eventHeaders.join(','), ...allEventRows].join('\n');

  // ── Écriture et partage ────────────────────────────────────────────────
  const biensCsvUri = await writeTempFile(`homelog_biens_${now}.csv`, assetsCsv);
  const evenementsCsvUri = await writeTempFile(`homelog_evenements_${now}.csv`, eventsCsv);

  await Sharing.shareAsync(biensCsvUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Exporter biens (CSV)',
    UTI: 'public.comma-separated-values-text',
  });

  await Sharing.shareAsync(evenementsCsvUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Exporter événements (CSV)',
    UTI: 'public.comma-separated-values-text',
  });
}