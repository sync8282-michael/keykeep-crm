export type PropertyType = "house" | "farm" | "apartment" | "plot";

export type ReminderType = "anniversary" | "birthday" | "custom";

export type ReminderChannel = "email" | "sms" | "both";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  notes?: string;
  createdAt: string;
}

export interface Property {
  id: string;
  clientId: string;
  type: PropertyType;
  address: string;
  purchaseDate: string;
  frontImage?: string;
  notes?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  clientId: string;
  propertyId?: string;
  type: ReminderType;
  title: string;
  description?: string;
  baseDate: string;
  reminderDate: string;
  channel: ReminderChannel;
  isRecurring: boolean;
  isCompleted: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalClients: number;
  totalProperties: number;
  upcomingReminders: number;
  todayReminders: number;
}
