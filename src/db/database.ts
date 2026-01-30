import Dexie, { type Table } from 'dexie';

// Core Client type for local-first PWA
export interface Client {
  id?: string;
  name: string;
  address: string;
  houseType: string;
  moveInDate: string;
  birthday?: string;
  email: string;
  phone: string;
  avatarPath?: string;      // Profile picture
  imagePath?: string;       // Property image
  notes?: string;
  optInEmail: boolean;
  optInWhatsApp: boolean;
  optInSMS: boolean;
  preferredContactMethod: 'email' | 'whatsapp' | 'sms' | 'phone';
  createdAt: string;
  updatedAt: string;
}

// Reminder/Notification type
export interface Reminder {
  id?: string;
  clientId: string;
  title: string;
  description?: string;
  type: 'anniversary' | 'birthday' | 'follow_up' | 'custom';
  channel: 'email' | 'whatsapp' | 'sms' | 'push' | 'all';
  baseDate: string;          // The reference date (e.g., move-in date, birthday)
  reminderDate: string;      // When to send the reminder
  isRecurring: boolean;
  recurrencePattern?: 'yearly' | 'monthly' | 'weekly';
  recurrenceCount?: number;  // How many times to repeat (undefined = forever)
  completedCount: number;    // How many times this has been sent
  isCompleted: boolean;      // Fully completed (all occurrences done)
  lastSentAt?: string;
  nextDueDate?: string;
  status: 'pending' | 'sent' | 'failed' | 'snoozed';
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
  defaultReminderChannel: 'email' | 'whatsapp' | 'sms' | 'push' | 'all';
  autoCreateAnniversaryReminders: boolean;
}

class KeyKeepDatabase extends Dexie {
  clients!: Table<Client, string>;
  reminders!: Table<Reminder, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('keykeep-pro');
    
    this.version(1).stores({
      clients: '++id, name, address, houseType, moveInDate, email, phone, createdAt',
      settings: 'id',
    });

    // Version 2: Add reminders table and new client fields
    this.version(2).stores({
      clients: '++id, name, address, houseType, moveInDate, birthday, email, phone, createdAt',
      reminders: '++id, clientId, type, channel, reminderDate, isRecurring, status, createdAt',
      settings: 'id',
    }).upgrade(tx => {
      // Migrate existing clients to have new fields
      return tx.table('clients').toCollection().modify(client => {
        client.optInSMS = client.optInSMS ?? false;
        client.preferredContactMethod = client.preferredContactMethod ?? 'email';
      });
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
      defaultReminderChannel: 'email',
      autoCreateAnniversaryReminders: true,
    });
  } else {
    // Ensure new settings fields exist
    if (existing.defaultReminderChannel === undefined) {
      await db.settings.update('app', {
        defaultReminderChannel: 'email',
        autoCreateAnniversaryReminders: true,
      });
    }
  }
}

// Generate UUID for new records
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper to calculate next due date for recurring reminders
export function calculateNextDueDate(
  baseDate: string,
  pattern: 'yearly' | 'monthly' | 'weekly',
  fromDate: Date = new Date()
): Date {
  const base = new Date(baseDate);
  const result = new Date(base);
  
  // Set to the correct year/month/week relative to now
  while (result <= fromDate) {
    if (pattern === 'yearly') {
      result.setFullYear(result.getFullYear() + 1);
    } else if (pattern === 'monthly') {
      result.setMonth(result.getMonth() + 1);
    } else if (pattern === 'weekly') {
      result.setDate(result.getDate() + 7);
    }
  }
  
  return result;
}
