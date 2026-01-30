import Dexie, { type Table } from 'dexie';

// Core Client type for local-first PWA
export interface Client {
  id?: string;
  name: string;
  address: string;
  houseType: string;
  moveInDate: string;
  email: string;
  phone: string;
  imagePath?: string;
  notes?: string;
  optInEmail: boolean;
  optInWhatsApp: boolean;
  createdAt: string;
  updatedAt: string;
}

// App settings stored locally
export interface AppSettings {
  id: string;
  googleMapsApiKey?: string;
  resendApiKey?: string;
  googleClientId?: string;
  lastBackupDate?: string;
  theme: 'light' | 'dark' | 'system';
}

class KeyKeepDatabase extends Dexie {
  clients!: Table<Client, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('keykeep-pro');
    
    this.version(1).stores({
      clients: '++id, name, address, houseType, moveInDate, email, phone, createdAt',
      settings: 'id',
    });
  }
}

export const db = new KeyKeepDatabase();

// Initialize default settings if not present
export async function initializeSettings(): Promise<void> {
  const existing = await db.settings.get('app');
  if (!existing) {
    await db.settings.put({
      id: 'app',
      theme: 'system',
    });
  }
}

// Generate UUID for new records
export function generateId(): string {
  return crypto.randomUUID();
}
