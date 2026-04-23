// src/types/index.ts

export type AssetCategoryId =
  | 'realestate'
  | 'car'
  | 'moto'
  | 'bike'
  | 'scooter'
  | 'boiler'
  | 'ac'
  | 'heatpump'
  | 'waterheater'
  | 'energy'
  | 'pool'
  | 'appliance'
  | 'garden'
  | 'multimedia'
  | 'security'
  | 'pet'
  | 'other';

export type EventType =
  | 'maintenance'
  | 'repair'
  | 'inspection'
  | 'cleaning'
  | 'replacement'
  | 'incident'
  | 'warranty'
  | 'note';

export type AttachmentType = 'photo' | 'pdf' | 'document';

export interface AssetCategory {
  id: AssetCategoryId;
  label: string;
  icon: string;
  isVehicle: boolean;
}

// --- Extra Data Types ---

export type FuelType = 'essence' | 'diesel' | 'hybride' | 'electrique' | 'gpl' | 'hydrogene';
export type GearboxType = 'manuelle' | 'automatique' | 'semi-automatique';
export type EnergyClass = 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export type DPEClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface RealEstateExtraData {
  property_type?: 'maison' | 'appartement' | 'residence-secondaire' | 'terrain' | 'garage' | 'autre';
  surface_m2?: number;
  build_year?: number;
  rooms?: number;
  floor?: number;
  dpe_class?: DPEClass;
  ges_class?: DPEClass;
  has_insurance?: boolean;
  insurer_name?: string;
  land_tax?: number;
  has_syndic?: boolean;
  syndic_name?: string;
}

export interface CarExtraData {
  brand?: string;
  model?: string;
  year?: number;
  plate?: string;
  vin?: string;
  fuel?: FuelType;
  mileage?: number;
  power_cv?: number;
  power_kw?: number;
  gearbox?: GearboxType;
  color?: string;
  technical_control_date?: string;
}

export interface MotoExtraData {
  brand?: string;
  model?: string;
  year?: number;
  plate?: string;
  displacement?: number;
  fuel?: FuelType;
  mileage?: number;
  license?: 'A' | 'A2' | 'A1' | 'AM';
  color?: string;
}

export interface BikeExtraData {
  brand?: string;
  model?: string;
  bike_type?: 'vtt' | 'route' | 'ville' | 'gravel' | 'electrique' | 'cargo' | 'autre';
  serial_number?: string;
  frame_size?: string;
  is_ebike?: boolean;
  motor_brand?: string;
  battery_range?: number;
}

export interface ScooterExtraData {
  brand?: string;
  model?: string;
  scooter_type?: 'electrique' | 'mecanique';
  range_km?: number;
  max_speed?: number;
  serial_number?: string;
}

export interface BoilerExtraData {
  brand?: string;
  model?: string;
  install_year?: number;
  boiler_type?: 'gaz' | 'fioul' | 'electrique' | 'bois' | 'granules';
  power_kw?: number;
  is_condensing?: boolean;
  serial_number?: string;
  has_maintenance_contract?: boolean;
}

export interface ACExtraData {
  brand?: string;
  model?: string;
  install_year?: number;
  ac_type?: 'split' | 'multi-split' | 'gainable' | 'mobile';
  power_kw?: number;
  refrigerant?: string;
  energy_class?: EnergyClass;
  serial_number?: string;
}

export interface HeatPumpExtraData {
  brand?: string;
  model?: string;
  install_year?: number;
  hp_type?: 'air-air' | 'air-eau' | 'geothermique';
  power_kw?: number;
  cop?: number;
  energy_class?: EnergyClass;
  serial_number?: string;
}

export interface WaterHeaterExtraData {
  brand?: string;
  model?: string;
  install_year?: number;
  wh_type?: 'electrique' | 'gaz' | 'thermodynamique' | 'solaire';
  capacity_l?: number;
  power_kw?: number;
  serial_number?: string;
}

export interface EnergyExtraData {
  energy_type?: 'panneau-solaire' | 'batterie-stockage' | 'compteur-elec' | 'compteur-gaz' | 'borne-recharge' | 'autre';
  brand?: string;
  model?: string;
  install_year?: number;
  power_kw?: number;
  capacity_kwh?: number;
  annual_production_kwh?: number;
  provider?: string;
  contract_number?: string;
  serial_number?: string;
}

export interface PoolExtraData {
  pool_type?: 'enterree' | 'semi-enterree' | 'hors-sol';
  length_m?: number;
  width_m?: number;
  depth_m?: number;
  volume_m3?: number;
  material?: 'beton' | 'liner' | 'coque' | 'autre';
  filtration_type?: string;
  has_heating?: boolean;
  heating_type?: string;
  install_year?: number;
}

export type ApplianceSubCategory =
  | 'refrigerateur'
  | 'lave-linge'
  | 'lave-vaisselle'
  | 'four'
  | 'micro-ondes'
  | 'hotte'
  | 'congelateur'
  | 'seche-linge'
  | 'autre';

export interface ApplianceExtraData {
  sub_category?: ApplianceSubCategory;
  brand?: string;
  model?: string;
  purchase_year?: number;
  energy_class?: EnergyClass;
  serial_number?: string;
  capacity?: string;
}

export type GardenSubCategory =
  | 'tondeuse'
  | 'robot-tondeuse'
  | 'taille-haie'
  | 'tronconneuse'
  | 'arrosage'
  | 'autre';

export interface GardenExtraData {
  sub_category?: GardenSubCategory;
  brand?: string;
  model?: string;
  purchase_year?: number;
  motor_type?: 'electrique' | 'thermique' | 'batterie' | 'manuel';
  serial_number?: string;
}

export type MultimediaSubCategory =
  | 'television'
  | 'ordinateur-portable'
  | 'ordinateur-fixe'
  | 'tablette'
  | 'smartphone'
  | 'console'
  | 'enceinte'
  | 'projecteur'
  | 'appareil-photo'
  | 'nas'
  | 'autre';

export interface MultimediaExtraData {
  sub_category?: MultimediaSubCategory;
  brand?: string;
  model?: string;
  purchase_year?: number;
  serial_number?: string;
  os?: 'windows' | 'macos' | 'ios' | 'android' | 'linux' | 'autre';
  storage_gb?: number;
  ram_gb?: number;
  screen_size?: number;
  resolution?: string;
  warranty_end_date?: string;
  has_extended_warranty?: boolean;
}

export interface SecurityExtraData {
  security_type?: 'alarme' | 'camera' | 'interphone' | 'serrure-connectee' | 'coffre-fort' | 'detecteur' | 'autre';
  brand?: string;
  model?: string;
  install_year?: number;
  serial_number?: string;
  has_monitoring_contract?: boolean;
  monitoring_provider?: string;
  zone_code?: string;
}

export type PetSubCategory =
  | 'chien'
  | 'chat'
  | 'oiseau'
  | 'rongeur'
  | 'reptile'
  | 'poisson'
  | 'autre';

export interface PetExtraData {
  sub_category?: PetSubCategory;
  race?: string;
  birth_date?: string;
  sex?: 'male' | 'femelle';
  chip_number?: string;
  is_sterilized?: boolean;
  blood_group?: string;
  vet_name?: string;
  has_insurance?: boolean;
}

export interface OtherExtraData {
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_year?: number;
  notes?: string;
}

export type AssetExtraData =
  | RealEstateExtraData
  | CarExtraData
  | MotoExtraData
  | BikeExtraData
  | ScooterExtraData
  | BoilerExtraData
  | ACExtraData
  | HeatPumpExtraData
  | WaterHeaterExtraData
  | EnergyExtraData
  | PoolExtraData
  | ApplianceExtraData
  | GardenExtraData
  | MultimediaExtraData
  | SecurityExtraData
  | PetExtraData
  | OtherExtraData;

// --- Core Entities ---

export interface Asset {
  id: string;
  categoryId: AssetCategoryId;
  name: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  serviceStartDate?: string;
  purchasePrice?: number;
  location?: string;
  serialNumber?: string;
  notes?: string;
  coverImageUri?: string;
  extraData?: AssetExtraData;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  vehicleDetails?: VehicleDetails;
}

export interface VehicleDetails {
  id: string;
  assetId: string;
  plateNumber?: string;
  mileageCurrent?: number;
  fuelType?: string;
  year?: number;
  technicalInspectionDate?: string;
}

export interface MaintenanceEvent {
  id: string;
  assetId: string;
  eventType: EventType;
  title: string;
  eventDate: string;
  cost?: number;
  providerName?: string;
  notes?: string;
  mileageAtEvent?: number;
  nextDueDate?: string;
  nextDueMileage?: number;
  reminderEnabled: boolean;
  reminderNotifId?: string;
  status: 'past' | 'upcoming';
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  eventId?: string;
  assetId?: string;
  type: AttachmentType;
  uri: string;
  fileName?: string;
  mimeType?: string;
  createdAt: string;
}

export interface SubscriptionState {
  isPremium: boolean;
  expiresAt?: string;
}