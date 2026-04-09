// src/types/index.ts

export type AssetCategoryId =
  | 'car'
  | 'moto'
  | 'bike'
  | 'scooter'
  | 'boiler'
  | 'ac'
  | 'heatpump'
  | 'waterheater'
  | 'pool'
  | 'appliance'
  | 'garden'
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
  eventId: string;
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