// src/services/pdfService.ts

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ASSET_CATEGORIES, EVENT_TYPES } from '../../constants/categories';
import { CATEGORY_FIELDS } from '../../constants/categoryFields';
import { Asset, MaintenanceEvent } from '../types';

const ENERGY_CLASS_COLORS: Record<string, { bg: string; text: string }> = {
  'A+++': { bg: '#00A651', text: '#fff' },
  'A++':  { bg: '#2DB24A', text: '#fff' },
  'A+':   { bg: '#57B947', text: '#fff' },
  'A':    { bg: '#A8CE3B', text: '#fff' },
  'B':    { bg: '#FFF200', text: '#333' },
  'C':    { bg: '#FDB913', text: '#333' },
  'D':    { bg: '#F37021', text: '#fff' },
  'E':    { bg: '#EF4023', text: '#fff' },
  'F':    { bg: '#BE1E2D', text: '#fff' },
  'G':    { bg: '#8B0000', text: '#fff' },
};

const DPE_CLASS_COLORS: Record<string, { bg: string; text: string }> = {
  'A': { bg: '#00A651', text: '#fff' },
  'B': { bg: '#57B947', text: '#fff' },
  'C': { bg: '#A8CE3B', text: '#333' },
  'D': { bg: '#FFF200', text: '#333' },
  'E': { bg: '#FDB913', text: '#333' },
  'F': { bg: '#F37021', text: '#fff' },
  'G': { bg: '#EF4023', text: '#fff' },
};

function getCategoryLabel(categoryId: string): string {
  return ASSET_CATEGORIES.find(c => c.id === categoryId)?.label ?? categoryId;
}

function getCategoryIcon(categoryId: string): string {
  return ASSET_CATEGORIES.find(c => c.id === categoryId)?.icon ?? '📦';
}

function getEventTypeLabel(type: string): string {
  return EVENT_TYPES.find(t => t.id === type)?.label ?? type;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  if (iso.includes('-')) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  return iso;
}

function getExtraDataBrandModel(asset: Asset): string | null {
  const data = asset.extraData as Record<string, any> | undefined;
  const brand = data?.brand ?? asset.brand ?? null;
  const model = data?.model ?? asset.model ?? null;
  if (brand && model) return `${brand} · ${model}`;
  if (brand) return brand;
  if (model) return model;
  return null;
}

function generateExtraDataHTML(categoryId: string, extraData: Record<string, any>): string {
  const fields = CATEGORY_FIELDS[categoryId];
  if (!fields || !extraData) return '';

  const filledFields = fields.filter(f => {
    const val = extraData[f.key];
    return val !== undefined && val !== null && val !== '';
  });

  if (filledFields.length === 0) return '';

  const rows = filledFields.map(field => {
    const val = extraData[field.key];
    let displayVal = '';

    if (field.type === 'boolean') {
      displayVal = val === true ? 'Oui' : 'Non';
    } else if (field.type === 'energy_class') {
      const ec = ENERGY_CLASS_COLORS[val] ?? { bg: '#ccc', text: '#333' };
      displayVal = `<span style="background:${ec.bg};color:${ec.text};padding:2px 8px;border-radius:4px;font-weight:700;">${val}</span>`;
    } else if (field.type === 'dpe_class') {
      const dc = DPE_CLASS_COLORS[val] ?? { bg: '#ccc', text: '#333' };
      displayVal = `<span style="background:${dc.bg};color:${dc.text};padding:2px 8px;border-radius:4px;font-weight:700;">${val}</span>`;
    } else if (field.type === 'select') {
      const opt = field.options?.find(o => o.value === val);
      displayVal = opt?.label ?? val;
    } else if (field.type === 'date') {
      displayVal = String(val).includes('-') ? String(val).split('-').reverse().join('/') : String(val);
    } else {
      displayVal = field.unit ? `${val} ${field.unit}` : String(val);
    }

    return `
      <div class="detail-item">
        <span class="detail-label">${field.label}</span>
        <span class="detail-value">${displayVal}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="extra-section">
      <div class="extra-title">Informations détaillées</div>
      <div class="details-grid">${rows}</div>
    </div>
  `;
}

function generateAssetHTML(asset: Asset, events: MaintenanceEvent[]): string {
  const category = getCategoryLabel(asset.categoryId);
  const totalCost = events.reduce((sum, e) => sum + (e.cost ?? 0), 0);
  const pastEvents = events.filter(e => e.status === 'past');
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const brandModel = getExtraDataBrandModel(asset);

  const eventsHTML = events.length === 0
    ? '<p style="color: #A8A49C; font-style: italic;">Aucun événement enregistré</p>'
    : events.map(e => `
        <div class="event-row">
          <div class="event-left">
            <div class="event-title">${e.title}</div>
            <div class="event-meta">
              ${getEventTypeLabel(e.eventType)}
              ${e.providerName ? ` · ${e.providerName}` : ''}
              ${e.mileageAtEvent ? ` · ${e.mileageAtEvent.toLocaleString()} km` : ''}
            </div>
            <div class="event-date">${formatDate(e.eventDate)}</div>
            ${e.nextDueDate ? `<div class="event-next">Prochain : ${formatDate(e.nextDueDate)}${e.nextDueMileage ? ` · ${e.nextDueMileage.toLocaleString()} km` : ''}</div>` : ''}
          </div>
          <div class="event-right">
            ${e.cost !== undefined ? `<div class="event-cost">${e.cost.toFixed(2)} €</div>` : ''}
            <div class="event-badge ${e.status === 'upcoming' ? 'badge-upcoming' : 'badge-past'}">
              ${e.status === 'upcoming' ? 'À venir' : 'Passé'}
            </div>
          </div>
        </div>
      `).join('');

  const extraDataHTML = asset.extraData
    ? generateExtraDataHTML(asset.categoryId, asset.extraData as Record<string, any>)
    : '';

  return `
    <div class="asset-section" id="asset-${asset.id}">
      <div class="asset-header">
        <div class="asset-icon">${getCategoryIcon(asset.categoryId)}</div>
        <div class="asset-info">
          <div class="asset-name">${asset.name}</div>
          <div class="asset-category">${category}</div>
          ${brandModel ? `<div class="asset-brand">${brandModel}</div>` : ''}
        </div>
        <div class="asset-stats">
          <div class="stat">
            <div class="stat-value">${totalCost.toFixed(0)} €</div>
            <div class="stat-label">Coût total</div>
          </div>
          <div class="stat">
            <div class="stat-value">${events.length}</div>
            <div class="stat-label">Événements</div>
          </div>
          ${asset.purchasePrice ? `
          <div class="stat">
            <div class="stat-value">${asset.purchasePrice.toFixed(0)} €</div>
            <div class="stat-label">Prix d'achat</div>
          </div>` : ''}
        </div>
      </div>

      ${asset.location || asset.serialNumber ? `
        <div class="details-grid" style="margin-bottom:16px;">
          ${asset.location ? `<div class="detail-item"><span class="detail-label">Localisation</span><span class="detail-value">${asset.location}</span></div>` : ''}
          ${asset.serialNumber ? `<div class="detail-item"><span class="detail-label">N° de série</span><span class="detail-value">${asset.serialNumber}</span></div>` : ''}
        </div>
      ` : ''}

      ${extraDataHTML}

      <div class="events-section">
        <div class="events-title">
          Historique
          <span class="events-counts">
            ${pastEvents.length} passé${pastEvents.length > 1 ? 's' : ''}
            · ${upcomingEvents.length} à venir
          </span>
        </div>
        ${eventsHTML}
      </div>

      ${asset.notes ? `
        <div class="notes-section">
          <div class="extra-title">Notes</div>
          <p style="font-size:13px;color:#1A1A1A;line-height:1.6;">${asset.notes}</p>
        </div>
      ` : ''}
    </div>
  `;
}

function generateTOC(assets: Asset[], eventsMap: Record<string, MaintenanceEvent[]>): string {
  const rows = assets.map(a => {
    const events = eventsMap[a.id] ?? [];
    const cost = events.reduce((s, e) => s + (e.cost ?? 0), 0);
    const brandModel = getExtraDataBrandModel(a);
    return `
      <tr>
        <td style="padding:6px 8px;">${getCategoryIcon(a.categoryId)} ${a.name}${brandModel ? ` <span style="color:#6B6860;font-size:11px;">— ${brandModel}</span>` : ''}</td>
        <td style="padding:6px 8px;color:#6B6860;">${getCategoryLabel(a.categoryId)}</td>
        <td style="padding:6px 8px;text-align:right;">${events.length}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:600;color:#C17B2F;">${cost.toFixed(0)} €</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="toc-section">
      <div class="toc-title">Sommaire</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="border-bottom:1px solid #E5E2DA;">
            <th style="padding:6px 8px;text-align:left;color:#6B6860;font-weight:600;">Bien</th>
            <th style="padding:6px 8px;text-align:left;color:#6B6860;font-weight:600;">Catégorie</th>
            <th style="padding:6px 8px;text-align:right;color:#6B6860;font-weight:600;">Événements</th>
            <th style="padding:6px 8px;text-align:right;color:#6B6860;font-weight:600;">Coût total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function generateHTML(assets: Asset[], eventsMap: Record<string, MaintenanceEvent[]>, isGlobal: boolean): string {
  const now = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const totalCost = Object.values(eventsMap)
    .flat()
    .reduce((sum, e) => sum + (e.cost ?? 0), 0);

  const totalEvents = Object.values(eventsMap).flat().length;
  const totalPatrimony = assets.reduce((s, a) => s + (a.purchasePrice ?? 0), 0);

  const assetsHTML = assets.map(a => generateAssetHTML(a, eventsMap[a.id] ?? [])).join('<div class="page-break"></div>');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, Helvetica, Arial, sans-serif;
          color: #1A1A1A;
          background: #FAF9F6;
          padding: 40px;
          font-size: 13px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #1A5C4A;
        }
        .header-left h1 { font-size: 32px; font-weight: 700; color: #1A1A1A; letter-spacing: -1px; }
        .header-left p { color: #6B6860; margin-top: 4px; font-size: 13px; }
        .header-right { text-align: right; color: #6B6860; font-size: 12px; }
        .summary { display: flex; gap: 16px; margin-bottom: 32px; }
        .summary-card { flex: 1; background: white; border-radius: 12px; padding: 20px; border: 1px solid #E5E2DA; }
        .summary-value { font-size: 28px; font-weight: 700; color: #1A5C4A; }
        .summary-label { font-size: 12px; color: #6B6860; margin-top: 4px; }
        .toc-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 40px;
          border: 1px solid #E5E2DA;
        }
        .toc-title {
          font-size: 13px;
          font-weight: 600;
          color: #6B6860;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        .asset-section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #E5E2DA; }
        .asset-header { display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #E5E2DA; }
        .asset-icon { font-size: 32px; width: 52px; height: 52px; background: #E8F2EF; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0; }
        .asset-info { flex: 1; }
        .asset-name { font-size: 18px; font-weight: 700; color: #1A1A1A; }
        .asset-category { font-size: 12px; color: #6B6860; margin-top: 2px; }
        .asset-brand { font-size: 12px; color: #A8A49C; margin-top: 2px; }
        .asset-stats { display: flex; gap: 20px; }
        .stat { text-align: center; }
        .stat-value { font-size: 20px; font-weight: 700; color: #1A1A1A; }
        .stat-label { font-size: 11px; color: #6B6860; margin-top: 2px; }
        .details-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .detail-item { background: #F2F0EB; border-radius: 8px; padding: 8px 12px; display: flex; gap: 8px; }
        .detail-label { color: #6B6860; font-size: 12px; }
        .detail-value { color: #1A1A1A; font-size: 12px; font-weight: 600; }
        .extra-section { margin-bottom: 20px; }
        .extra-title { font-size: 12px; font-weight: 600; color: #6B6860; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        .notes-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid #E5E2DA; }
        .events-section { margin-top: 20px; }
        .events-title { font-size: 13px; font-weight: 600; color: #6B6860; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
        .events-counts { font-size: 11px; font-weight: 400; color: #A8A49C; text-transform: none; letter-spacing: 0; }
        .event-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #F2F0EB; }
        .event-row:last-child { border-bottom: none; }
        .event-left { flex: 1; }
        .event-title { font-size: 14px; font-weight: 600; color: #1A1A1A; }
        .event-meta { font-size: 11px; color: #6B6860; margin-top: 2px; }
        .event-date { font-size: 11px; color: #A8A49C; margin-top: 2px; }
        .event-next { font-size: 11px; color: #1A5C4A; margin-top: 3px; font-style: italic; }
        .event-right { text-align: right; margin-left: 16px; }
        .event-cost { font-size: 15px; font-weight: 700; color: #C17B2F; }
        .event-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 99px; margin-top: 4px; display: inline-block; }
        .badge-past { background: #F2F0EB; color: #6B6860; }
        .badge-upcoming { background: #E8F2EF; color: #1A5C4A; }
        .page-break { page-break-after: always; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E5E2DA; text-align: center; color: #A8A49C; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1>Homelog</h1>
          <p>${isGlobal ? 'Rapport complet de tous les biens' : 'Rapport de bien'}</p>
        </div>
        <div class="header-right">Généré le ${now}</div>
      </div>

      ${isGlobal ? `
        <div class="summary">
          <div class="summary-card">
            <div class="summary-value">${assets.length}</div>
            <div class="summary-label">Biens enregistrés</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${totalEvents}</div>
            <div class="summary-label">Événements</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${totalCost.toFixed(0)} €</div>
            <div class="summary-label">Coût total entretiens</div>
          </div>
          ${totalPatrimony > 0 ? `
          <div class="summary-card">
            <div class="summary-value">${totalPatrimony.toFixed(0)} €</div>
            <div class="summary-label">Valeur d'achat totale</div>
          </div>` : ''}
        </div>
        ${generateTOC(assets, eventsMap)}
      ` : ''}

      ${assetsHTML}

      <div class="footer">Homelog · Rapport généré le ${now}</div>
    </body>
    </html>
  `;
}

export async function exportAssetPDF(asset: Asset, events: MaintenanceEvent[]): Promise<void> {
  const html = generateHTML([asset], { [asset.id]: events }, false);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Rapport — ${asset.name}`,
    UTI: 'com.adobe.pdf',
  });
}

export async function exportAllPDF(assets: Asset[], eventsMap: Record<string, MaintenanceEvent[]>): Promise<void> {
  const html = generateHTML(assets, eventsMap, true);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Rapport complet Homelog',
    UTI: 'com.adobe.pdf',
  });
}