import { Client, Property, Reminder } from "@/types";

// Demo data for initial state
export const demoClients: Client[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 555-0123",
    birthday: "1985-03-15",
    notes: "Preferred contact: Email",
    createdAt: "2023-01-15",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 555-0456",
    birthday: "1990-07-22",
    notes: "First-time homeowner",
    createdAt: "2023-02-20",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "m.brown@email.com",
    phone: "+1 555-0789",
    birthday: "1978-11-08",
    createdAt: "2023-03-10",
  },
];

export const demoProperties: Property[] = [
  {
    id: "1",
    clientId: "1",
    type: "house",
    address: "123 Oak Street, Springfield",
    purchaseDate: "2023-01-20",
    notes: "3 bedroom, 2 bath",
    createdAt: "2023-01-20",
  },
  {
    id: "2",
    clientId: "2",
    type: "apartment",
    address: "456 Park Avenue, Apt 12B",
    purchaseDate: "2023-02-28",
    notes: "2 bedroom condo",
    createdAt: "2023-02-28",
  },
  {
    id: "3",
    clientId: "3",
    type: "farm",
    address: "789 Country Road, Hillsdale",
    purchaseDate: "2023-03-15",
    notes: "50 acre property with barn",
    createdAt: "2023-03-15",
  },
];

export const demoReminders: Reminder[] = [
  {
    id: "1",
    clientId: "1",
    propertyId: "1",
    type: "anniversary",
    title: "1 Year Home Anniversary - John Smith",
    description: "Congratulate on 1 year of homeownership",
    baseDate: "2023-01-20",
    reminderDate: "2024-01-20",
    channel: "email",
    isRecurring: true,
    isCompleted: false,
    createdAt: "2023-01-20",
  },
  {
    id: "2",
    clientId: "2",
    type: "birthday",
    title: "Sarah Johnson's Birthday",
    description: "Send birthday wishes",
    baseDate: "1990-07-22",
    reminderDate: "2024-07-22",
    channel: "email",
    isRecurring: true,
    isCompleted: false,
    createdAt: "2023-02-20",
  },
  {
    id: "3",
    clientId: "3",
    propertyId: "3",
    type: "anniversary",
    title: "6 Month Farm Anniversary - Michael Brown",
    description: "Check in on the farm purchase",
    baseDate: "2023-03-15",
    reminderDate: "2023-09-15",
    channel: "both",
    isRecurring: false,
    isCompleted: true,
    createdAt: "2023-03-15",
  },
];

// Local storage helpers
const STORAGE_KEYS = {
  clients: "keykeep_clients",
  properties: "keykeep_properties",
  reminders: "keykeep_reminders",
};

export function getClients(): Client[] {
  const stored = localStorage.getItem(STORAGE_KEYS.clients);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(demoClients));
    return demoClients;
  }
  try {
    const parsed = JSON.parse(stored);
    // Basic validation: ensure it's an array
    if (!Array.isArray(parsed)) {
      console.warn('[store] Invalid clients data, resetting to demo');
      localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(demoClients));
      return demoClients;
    }
    return parsed;
  } catch {
    console.warn('[store] Failed to parse clients, resetting to demo');
    localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(demoClients));
    return demoClients;
  }
}

export function saveClients(clients: Client[]): void {
  localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
}

export function getProperties(): Property[] {
  const stored = localStorage.getItem(STORAGE_KEYS.properties);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(demoProperties));
    return demoProperties;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn('[store] Invalid properties data, resetting to demo');
      localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(demoProperties));
      return demoProperties;
    }
    return parsed;
  } catch {
    console.warn('[store] Failed to parse properties, resetting to demo');
    localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(demoProperties));
    return demoProperties;
  }
}

export function saveProperties(properties: Property[]): void {
  localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(properties));
}

export function getReminders(): Reminder[] {
  const stored = localStorage.getItem(STORAGE_KEYS.reminders);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(demoReminders));
    return demoReminders;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn('[store] Invalid reminders data, resetting to demo');
      localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(demoReminders));
      return demoReminders;
    }
    return parsed;
  } catch {
    console.warn('[store] Failed to parse reminders, resetting to demo');
    localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(demoReminders));
    return demoReminders;
  }
}

export function saveReminders(reminders: Reminder[]): void {
  localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(reminders));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
