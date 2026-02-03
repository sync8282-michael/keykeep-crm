import { z } from 'zod';

// Maximum sizes for validation
const MAX_CLIENTS = 10000;
const MAX_REMINDERS = 50000;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Client schema for backup validation
const ClientSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(200),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  birthday: z.string().max(50).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  user_id: z.string().max(100).optional(),
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
  createdAt: z.string().max(50).optional(),
  updatedAt: z.string().max(50).optional(),
  // Additional client fields
  address: z.string().max(500).optional().nullable(),
  moveInDate: z.string().max(50).optional().nullable(),
  optInEmail: z.boolean().optional().nullable(),
  optInSms: z.boolean().optional().nullable(),
  preferredContactMethod: z.string().max(50).optional().nullable(),
  properties: z.array(z.any()).optional(),
  reminders: z.array(z.any()).optional(),
}).passthrough(); // Allow additional unknown fields for backward compatibility

// Reminder schema for backup validation  
const ReminderSchema = z.object({
  id: z.string().max(100),
  user_id: z.string().max(100).optional(),
  client_id: z.string().max(100).optional(),
  clientId: z.string().max(100).optional(),
  property_id: z.string().max(100).optional().nullable(),
  propertyId: z.string().max(100).optional().nullable(),
  type: z.string().max(50),
  title: z.string().max(200),
  description: z.string().max(1000).optional().nullable(),
  base_date: z.string().max(50).optional(),
  baseDate: z.string().max(50).optional(),
  reminder_date: z.string().max(50).optional(),
  reminderDate: z.string().max(50).optional(),
  channel: z.string().max(20).optional(),
  is_recurring: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  is_completed: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
  createdAt: z.string().max(50).optional(),
  updatedAt: z.string().max(50).optional(),
}).passthrough();

// Settings schema for backup validation
const SettingsSchema = z.object({
  id: z.string().optional(),
  darkMode: z.boolean().optional(),
  notifications: z.boolean().optional(),
  lastBackupDate: z.string().optional().nullable(),
  onboardingComplete: z.boolean().optional(),
}).passthrough();

// Full backup schema
const BackupSchema = z.object({
  version: z.union([z.number(), z.string()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ),
  exportedAt: z.string().max(50).optional(),
  clients: z.array(ClientSchema).max(MAX_CLIENTS),
  reminders: z.array(ReminderSchema).max(MAX_REMINDERS).optional(),
  settings: SettingsSchema.optional(),
});

export type ValidatedBackupData = z.infer<typeof BackupSchema>;

export interface ValidationResult {
  success: boolean;
  data?: ValidatedBackupData;
  error?: string;
}

/**
 * Validates a backup file before import
 * @param fileOrData - File object or already parsed JSON data
 * @returns ValidationResult with validated data or error message
 */
export async function validateBackupFile(fileOrData: File | unknown): Promise<ValidationResult> {
  try {
    let data: unknown;

    if (fileOrData instanceof File) {
      // Check file size
      if (fileOrData.size > MAX_FILE_SIZE_BYTES) {
        return {
          success: false,
          error: `Backup file too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
        };
      }

      // Check file type
      if (fileOrData.type && !['application/json', 'text/plain'].includes(fileOrData.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload a JSON backup file.',
        };
      }

      // Parse file content
      const text = await fileOrData.text();
      
      try {
        data = JSON.parse(text);
      } catch {
        return {
          success: false,
          error: 'Invalid JSON format. The backup file appears to be corrupted.',
        };
      }
    } else {
      data = fileOrData;
    }

    // Validate against schema
    const result = BackupSchema.safeParse(data);

    if (!result.success) {
      const firstError = result.error.errors[0];
      const path = firstError.path.join('.');
      return {
        success: false,
        error: `Invalid backup format: ${path ? `${path} - ` : ''}${firstError.message}`,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('[BackupValidation] Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to validate backup file. Please try again.',
    };
  }
}

/**
 * Validates localStorage data
 * @param data - The data retrieved from localStorage
 * @param type - The type of data being validated
 * @returns Validated array or empty array on failure
 */
export function validateLocalStorageData<T>(data: unknown, type: 'clients' | 'properties' | 'reminders'): T[] {
  try {
    if (!Array.isArray(data)) {
      console.warn(`[BackupValidation] ${type} data is not an array, returning empty`);
      return [];
    }

    // Apply basic array length limits
    const maxItems = type === 'reminders' ? MAX_REMINDERS : MAX_CLIENTS;
    let dataArray = data as unknown[];
    if (dataArray.length > maxItems) {
      console.warn(`[BackupValidation] ${type} data exceeds max items (${maxItems}), truncating`);
      dataArray = dataArray.slice(0, maxItems);
    }

    // Validate each item based on type
    const schema = type === 'reminders' ? ReminderSchema : ClientSchema;
    const validItems: T[] = [];

    for (const item of dataArray) {
      const result = schema.safeParse(item);
      if (result.success) {
        validItems.push(result.data as T);
      } else {
        console.warn(`[BackupValidation] Invalid ${type} item skipped:`, result.error.errors[0]);
      }
    }

    return validItems;
  } catch (error) {
    console.error(`[BackupValidation] Error validating ${type}:`, error);
    return [];
  }
}

export { MAX_FILE_SIZE_MB, MAX_CLIENTS, MAX_REMINDERS };