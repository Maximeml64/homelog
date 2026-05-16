// src/repositories/assetRepository.ts

import { getDatabase, uuidv4 } from '../db/client';
import { Asset, AssetCategoryId, VehicleDetails } from '../types';

function rowToAsset(row: any): Asset {
  return {
    id: row.id,
    categoryId: row.category_id as AssetCategoryId,
    name: row.name,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    purchaseDate: row.purchase_date ?? undefined,
    serviceStartDate: row.service_start_date ?? undefined,
    purchasePrice: row.purchase_price ?? undefined,
    location: row.location ?? undefined,
    serialNumber: row.serial_number ?? undefined,
    notes: row.notes ?? undefined,
    coverImageUri: row.cover_image_uri ?? undefined,
    extraData: row.extra_data ? JSON.parse(row.extra_data) : undefined,
    warrantyEndDate: row.warranty_end_date ?? undefined,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToVehicleDetails(row: any): VehicleDetails {
  return {
    id: row.id,
    assetId: row.asset_id,
    plateNumber: row.plate_number ?? undefined,
    mileageCurrent: row.mileage_current ?? undefined,
    fuelType: row.fuel_type ?? undefined,
    year: row.year ?? undefined,
    technicalInspectionDate: row.technical_inspection_date ?? undefined,
  };
}

export async function getAllAssets(): Promise<Asset[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM asset WHERE archived = 0 ORDER BY created_at DESC`
  );
  return rows.map(rowToAsset);
}

export async function getArchivedAssets(): Promise<Asset[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM asset WHERE archived = 1 ORDER BY updated_at DESC`
  );
  return rows.map(rowToAsset);
}

export async function getAssetById(id: string): Promise<Asset | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM asset WHERE id = ?`, [id]
  );
  if (!row) return null;

  const asset = rowToAsset(row);

  const vehicleRow = await db.getFirstAsync<any>(
    `SELECT * FROM vehicle_details WHERE asset_id = ?`, [id]
  );
  if (vehicleRow) {
    asset.vehicleDetails = rowToVehicleDetails(vehicleRow);
  }

  return asset;
}

export async function createAsset(
  data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Asset> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO asset (
      id, category_id, name, brand, model, purchase_date, service_start_date,
      purchase_price, location, serial_number, notes, cover_image_uri,
      extra_data, warranty_end_date, archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.categoryId,
      data.name,
      data.brand ?? null,
      data.model ?? null,
      data.purchaseDate ?? null,
      data.serviceStartDate ?? null,
      data.purchasePrice ?? null,
      data.location ?? null,
      data.serialNumber ?? null,
      data.notes ?? null,
      data.coverImageUri ?? null,
      data.extraData ? JSON.stringify(data.extraData) : null,
      data.warrantyEndDate ?? null,
      data.archived ? 1 : 0,
      now,
      now,
    ]
  );

  if (data.vehicleDetails) {
    await createVehicleDetails(id, data.vehicleDetails);
  }

  return { ...data, id, createdAt: now, updatedAt: now };
}

export async function updateAsset(
  id: string,
  data: Partial<Omit<Asset, 'id' | 'createdAt'>>
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const sets: string[] = [];
  const values: any[] = [];

  if (data.categoryId !== undefined) { sets.push('category_id = ?'); values.push(data.categoryId); }
  if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
  if (data.brand !== undefined) { sets.push('brand = ?'); values.push(data.brand ?? null); }
  if (data.model !== undefined) { sets.push('model = ?'); values.push(data.model ?? null); }
  if (data.purchaseDate !== undefined) { sets.push('purchase_date = ?'); values.push(data.purchaseDate ?? null); }
  if (data.serviceStartDate !== undefined) { sets.push('service_start_date = ?'); values.push(data.serviceStartDate ?? null); }
  if (data.purchasePrice !== undefined) { sets.push('purchase_price = ?'); values.push(data.purchasePrice ?? null); }
  if (data.location !== undefined) { sets.push('location = ?'); values.push(data.location ?? null); }
  if (data.serialNumber !== undefined) { sets.push('serial_number = ?'); values.push(data.serialNumber ?? null); }
  if (data.notes !== undefined) { sets.push('notes = ?'); values.push(data.notes ?? null); }
  if (data.coverImageUri !== undefined) { sets.push('cover_image_uri = ?'); values.push(data.coverImageUri ?? null); }
  if (data.extraData !== undefined) { sets.push('extra_data = ?'); values.push(data.extraData ? JSON.stringify(data.extraData) : null); }
  if (data.warrantyEndDate !== undefined) { sets.push('warranty_end_date = ?'); values.push(data.warrantyEndDate ?? null); }
  if (data.archived !== undefined) { sets.push('archived = ?'); values.push(data.archived ? 1 : 0); }

  if (sets.length > 0) {
    sets.push('updated_at = ?');
    values.push(now);
    values.push(id);
    await db.runAsync(`UPDATE asset SET ${sets.join(', ')} WHERE id = ?`, values);
  }

  if (data.vehicleDetails) {
    await upsertVehicleDetails(id, data.vehicleDetails);
  }
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM asset WHERE id = ?`, [id]);
}

export async function getAssetCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM asset WHERE archived = 0`
  );
  return row?.count ?? 0;
}

async function createVehicleDetails(
  assetId: string,
  data: Partial<VehicleDetails>
): Promise<void> {
  const db = await getDatabase();
  const id = uuidv4();

  await db.runAsync(
    `INSERT INTO vehicle_details (
      id, asset_id, plate_number, mileage_current,
      fuel_type, year, technical_inspection_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      assetId,
      data.plateNumber ?? null,
      data.mileageCurrent ?? null,
      data.fuelType ?? null,
      data.year ?? null,
      data.technicalInspectionDate ?? null,
    ]
  );
}

async function upsertVehicleDetails(
  assetId: string,
  data: Partial<VehicleDetails>
): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<any>(
    `SELECT id FROM vehicle_details WHERE asset_id = ?`, [assetId]
  );

  if (existing) {
    await db.runAsync(
      `UPDATE vehicle_details SET
        plate_number = ?, mileage_current = ?,
        fuel_type = ?, year = ?, technical_inspection_date = ?
      WHERE asset_id = ?`,
      [
        data.plateNumber ?? null,
        data.mileageCurrent ?? null,
        data.fuelType ?? null,
        data.year ?? null,
        data.technicalInspectionDate ?? null,
        assetId,
      ]
    );
  } else {
    await createVehicleDetails(assetId, data);
  }
}