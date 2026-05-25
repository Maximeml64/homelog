// constants/maintenanceSuggestions.ts
// Suggested recurring maintenance per asset category.
// Used by the "Activer les rappels recommandés" prompt at asset creation.

import type { EventType } from '../src/types';

export interface MaintenanceSuggestion {
  title: string;
  eventType: EventType;
  recurrenceMonths: number;
}

export const MAINTENANCE_SUGGESTIONS: Record<string, MaintenanceSuggestion[]> = {
  car: [
    { title: 'Vidange', eventType: 'maintenance', recurrenceMonths: 12 },
    { title: 'Contrôle technique', eventType: 'inspection', recurrenceMonths: 24 },
  ],
  moto: [
    { title: 'Révision', eventType: 'maintenance', recurrenceMonths: 12 },
    { title: 'Contrôle technique', eventType: 'inspection', recurrenceMonths: 24 },
  ],
  bike: [
    { title: 'Révision annuelle', eventType: 'maintenance', recurrenceMonths: 12 },
  ],
  scooter: [
    { title: 'Révision', eventType: 'maintenance', recurrenceMonths: 12 },
  ],
  boiler: [
    { title: 'Entretien annuel', eventType: 'maintenance', recurrenceMonths: 12 },
  ],
  ac: [
    { title: 'Nettoyage des filtres', eventType: 'cleaning', recurrenceMonths: 12 },
  ],
  heatpump: [
    { title: 'Entretien annuel', eventType: 'maintenance', recurrenceMonths: 12 },
  ],
  waterheater: [
    { title: 'Détartrage', eventType: 'maintenance', recurrenceMonths: 24 },
  ],
  pool: [
    { title: 'Hivernage', eventType: 'maintenance', recurrenceMonths: 12 },
    { title: 'Remise en route', eventType: 'maintenance', recurrenceMonths: 12 },
  ],
  appliance: [
    { title: 'Nettoyage / détartrage', eventType: 'cleaning', recurrenceMonths: 12 },
  ],
};

export function getSuggestionsForCategory(
  categoryId: string,
): MaintenanceSuggestion[] {
  return MAINTENANCE_SUGGESTIONS[categoryId] ?? [];
}
