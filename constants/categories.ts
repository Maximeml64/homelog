// constants/categories.ts

import { AssetCategory } from '../src/types';

export const ASSET_CATEGORIES: AssetCategory[] = [
  { id: 'realestate', label: 'Immobilier', icon: '🏠', isVehicle: false },
  { id: 'car', label: 'Voiture', icon: '🚗', isVehicle: true },
  { id: 'moto', label: 'Moto', icon: '🏍️', isVehicle: true },
  { id: 'bike', label: 'Vélo', icon: '🚲', isVehicle: true },
  { id: 'scooter', label: 'Trottinette', icon: '🛴', isVehicle: true },
  { id: 'boiler', label: 'Chaudière', icon: '🔥', isVehicle: false },
  { id: 'ac', label: 'Climatisation', icon: '❄️', isVehicle: false },
  { id: 'heatpump', label: 'Pompe à chaleur', icon: '♨️', isVehicle: false },
  { id: 'waterheater', label: 'Chauffe-eau', icon: '💧', isVehicle: false },
  { id: 'energy', label: 'Énergie', icon: '⚡', isVehicle: false },
  { id: 'pool', label: 'Piscine', icon: '🏊', isVehicle: false },
  { id: 'appliance', label: 'Électroménager', icon: '🫙', isVehicle: false },
  { id: 'multimedia', label: 'Multimédia', icon: '📺', isVehicle: false },
  { id: 'security', label: 'Sécurité', icon: '🔒', isVehicle: false },
  { id: 'garden', label: 'Jardin', icon: '🌿', isVehicle: false },
  { id: 'pet', label: 'Animal', icon: '🐾', isVehicle: false },
  { id: 'other', label: 'Autre', icon: '📦', isVehicle: false },
];

export const EVENT_TYPES = [
  { id: 'maintenance', label: 'Entretien', icon: '🔧' },
  { id: 'repair', label: 'Réparation', icon: '🛠️' },
  { id: 'inspection', label: 'Contrôle', icon: '✅' },
  { id: 'cleaning', label: 'Nettoyage', icon: '🧹' },
  { id: 'replacement', label: 'Remplacement', icon: '🔄' },
  { id: 'incident', label: 'Incident / Panne', icon: '⚠️' },
  { id: 'warranty', label: 'Garantie / SAV', icon: '📋' },
  { id: 'note', label: 'Note libre', icon: '📝' },
];