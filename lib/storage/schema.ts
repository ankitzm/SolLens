import { z } from 'zod';

/**
 * Schema for a single wallet address mapping
 */
export const AddressMappingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tags: z.array(z.string()).optional().default([]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  created_at: z.number(),
  updated_at: z.number(),
});

export type AddressMapping = z.infer<typeof AddressMappingSchema>;

/**
 * Schema for the complete mappings object (address -> mapping)
 */
export const MappingsSchema = z.record(z.string(), AddressMappingSchema);

export type Mappings = z.infer<typeof MappingsSchema>;

/**
 * Settings schema
 */
export const SettingsSchema = z.object({
  replace_mode: z.enum(['inline', 'badge']).default('inline'),
  domains_enabled: z.array(z.string()).default(['solscan.io']),
});

export type Settings = z.infer<typeof SettingsSchema>;

/**
 * Complete storage schema
 */
export const StorageDataSchema = z.object({
  mappings: MappingsSchema.default({}),
  settings: SettingsSchema.default({
    replace_mode: 'inline',
    domains_enabled: ['solscan.io'],
  }),
});

export type StorageData = z.infer<typeof StorageDataSchema>;

/**
 * Export/Import schema (lenient validation)
 * Allows unknown fields and provides defaults for missing fields
 */
export const ExportDataSchema = z.object({
  mappings: z.record(z.string(), z.object({
    name: z.string(),
    tags: z.array(z.string()).optional(),
    color: z.string().optional(),
    created_at: z.number().optional(),
    updated_at: z.number().optional(),
  }).passthrough()), // Allow unknown fields
  settings: z.object({
    replace_mode: z.enum(['inline', 'badge']).optional(),
    domains_enabled: z.array(z.string()).optional(),
  }).passthrough().optional(),
  version: z.string().optional(), // Future-proofing
}).passthrough(); // Allow unknown top-level fields

export type ExportData = z.infer<typeof ExportDataSchema>;

/**
 * Validation result for lenient parsing
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  warnings: string[];
  errors: string[];
}

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  MAPPINGS: 'mappings',
  SETTINGS: 'settings',
} as const;

/**
 * Helper to validate address format (basic Solana base58 check)
 */
export function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are base58 encoded, typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Helper to create a new mapping
 */
export function createMapping(name: string, tags?: string[], color?: string): AddressMapping {
  const now = Date.now();
  return {
    name,
    tags: tags || [],
    color,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Helper to update an existing mapping
 */
export function updateMapping(
  existing: AddressMapping,
  updates: Partial<Omit<AddressMapping, 'created_at'>>
): AddressMapping {
  return {
    ...existing,
    ...updates,
    updated_at: Date.now(),
  };
}

