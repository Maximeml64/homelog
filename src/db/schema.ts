// src/db/schema.ts

export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS asset (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    purchase_date TEXT,
    service_start_date TEXT,
    purchase_price REAL,
    location TEXT,
    serial_number TEXT,
    notes TEXT,
    cover_image_uri TEXT,
    extra_data TEXT,
    warranty_end_date TEXT,
    archived INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vehicle_details (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL UNIQUE,
    plate_number TEXT,
    mileage_current INTEGER,
    fuel_type TEXT,
    year INTEGER,
    technical_inspection_date TEXT,
    FOREIGN KEY (asset_id) REFERENCES asset(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS maintenance_event (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    cost REAL,
    provider_name TEXT,
    notes TEXT,
    mileage_at_event INTEGER,
    next_due_date TEXT,
    next_due_mileage INTEGER,
    reminder_enabled INTEGER DEFAULT 0,
    reminder_notif_id TEXT,
    recurrence_months INTEGER,
    status TEXT DEFAULT 'past',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES asset(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attachment (
    id TEXT PRIMARY KEY,
    event_id TEXT,
    asset_id TEXT,
    type TEXT NOT NULL,
    uri TEXT NOT NULL,
    file_name TEXT,
    mime_type TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES maintenance_event(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES asset(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

export const SCHEMA_VERSION = 4;

export const MIGRATIONS: Record<number, string[]> = {
  2: [
    `CREATE TABLE IF NOT EXISTS attachment_new (
      id TEXT PRIMARY KEY,
      event_id TEXT,
      asset_id TEXT,
      type TEXT NOT NULL,
      uri TEXT NOT NULL,
      file_name TEXT,
      mime_type TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES maintenance_event(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES asset(id) ON DELETE CASCADE
    )`,
    `INSERT INTO attachment_new (id, event_id, asset_id, type, uri, file_name, mime_type, created_at)
     SELECT id, event_id, NULL, type, uri, file_name, mime_type, created_at FROM attachment`,
    `DROP TABLE attachment`,
    `ALTER TABLE attachment_new RENAME TO attachment`,
  ],
  3: [
    `ALTER TABLE asset ADD COLUMN extra_data TEXT`,
  ],
  4: [
    `ALTER TABLE asset ADD COLUMN warranty_end_date TEXT`,
    `ALTER TABLE maintenance_event ADD COLUMN recurrence_months INTEGER`,
  ],
};