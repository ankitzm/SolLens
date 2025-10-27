import { z } from "zod";

/**
 * Schema for a single address mapping
 * Name is required; tags and color are optional
 */
export const AddressMappingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tags: z.array(z.string()).optional().default([]),
  color: z.string().optional(),
  created_at: z.number(),
  updated_at: z.number(),
});

/**
 * Settings schema
 * For v1: minimal settings; extensible for future phases
 */
export const SettingsSchema = z.object({
  replace_mode: z.enum(["inline"]).default("inline"),
  domains_enabled: z.array(z.string()).default(["solscan.io"]),
});

/**
 * Complete storage schema
 * mappings: keyed by full base58 public key (exact match)
 * settings: global extension settings
 */
export const StorageSchema = z.object({
  mappings: z.record(z.string(), AddressMappingSchema).default({}),
  settings: SettingsSchema.default({
    replace_mode: "inline",
    domains_enabled: ["solscan.io"],
  }),
});

// Export TypeScript types
export type AddressMapping = z.infer<typeof AddressMappingSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type StorageData = z.infer<typeof StorageSchema>;

// Input type for creating/updating mappings (without timestamps)
export type AddressMappingInput = Omit<AddressMapping, "created_at" | "updated_at">;

/**
 * Validation result with warnings
 * success: whether the data is safe to use
 * data: validated/coerced data
 * warnings: non-critical issues (unknown fields, etc.)
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  warnings: string[];
  errors?: string[];
}

