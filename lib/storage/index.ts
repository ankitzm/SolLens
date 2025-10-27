/**
 * WNA Storage Module
 * 
 * Public API for managing address mappings and settings
 * 
 * Features:
 * - CRUD operations for address mappings
 * - In-memory cache for performance
 * - Search and filter capabilities
 * - Import/export with lenient validation
 * - Automatic timestamp management
 */

// Export storage operations
export { MappingStorage, SettingsStorage, invalidateCache } from "./storage";

// Export import/export functionality
export {
  exportData,
  exportDataAsJSON,
  importData,
  importDataFromJSON,
  validateImportData,
  getAllTags,
  getAllColors,
} from "./import-export";

// Export types and schemas
export type {
  AddressMapping,
  AddressMappingInput,
  Settings,
  StorageData,
  ValidationResult,
} from "./schema";

export {
  AddressMappingSchema,
  SettingsSchema,
  StorageSchema,
} from "./schema";

