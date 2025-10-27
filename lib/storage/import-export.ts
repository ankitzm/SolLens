import { ZodError } from "zod";
import {
  StorageSchema,
  StorageData,
  ValidationResult,
} from "./schema";
import { invalidateCache } from "./storage";

/**
 * Validates imported data with lenient mode
 * - Warns on unknown fields but proceeds
 * - Fails only on critical issues (invalid types, missing required fields)
 * - Coerces data where possible
 */
export function validateImportData(data: unknown): ValidationResult<StorageData> {
  const warnings: string[] = [];
  
  // Basic type check
  if (typeof data !== "object" || data === null) {
    return {
      success: false,
      warnings,
      errors: ["Import data must be a JSON object"],
    };
  }

  try {
    // Parse with Zod - it will coerce defaults and validate structure
    const parsed = StorageSchema.parse(data);
    
    // Check for unknown fields at root level
    const knownRootKeys = ["mappings", "settings"];
    const rootKeys = Object.keys(data);
    const unknownRootKeys = rootKeys.filter(key => !knownRootKeys.includes(key));
    
    if (unknownRootKeys.length > 0) {
      warnings.push(
        `Unknown root fields will be ignored: ${unknownRootKeys.join(", ")}`
      );
    }

    // Check for unknown fields in mappings
    const dataObj = data as Record<string, unknown>;
    if (dataObj.mappings && typeof dataObj.mappings === "object") {
      const mappingsObj = dataObj.mappings as Record<string, unknown>;
      
      for (const [address, mapping] of Object.entries(mappingsObj)) {
        if (typeof mapping === "object" && mapping !== null) {
          const knownMappingKeys = ["name", "tags", "color", "created_at", "updated_at"];
          const mappingKeys = Object.keys(mapping);
          const unknownKeys = mappingKeys.filter(key => !knownMappingKeys.includes(key));
          
          if (unknownKeys.length > 0) {
            warnings.push(
              `Mapping "${address}": unknown fields will be ignored: ${unknownKeys.join(", ")}`
            );
          }
        }
      }
    }

    return {
      success: true,
      data: parsed,
      warnings,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map((e) => {
        const path = e.path.join(".");
        return `${path}: ${e.message}`;
      });
      
      return {
        success: false,
        warnings,
        errors,
      };
    }
    
    return {
      success: false,
      warnings,
      errors: ["Validation failed: " + String(error)],
    };
  }
}

/**
 * Export all data to JSON
 * Returns serializable object ready for JSON.stringify
 */
export async function exportData(): Promise<StorageData> {
  const mappingsData = await storage.getItem<StorageData["mappings"]>("local:wna:mappings");
  const settingsData = await storage.getItem<StorageData["settings"]>("local:wna:settings");
  
  const data: StorageData = {
    mappings: mappingsData ?? {},
    settings: settingsData ?? {
      replace_mode: "inline",
      domains_enabled: ["solscan.io"],
    },
  };
  
  return data;
}

/**
 * Import data from JSON
 * Validates, shows warnings, and writes to storage
 * Returns validation result with warnings
 */
export async function importData(
  jsonData: unknown,
  options: {
    overwrite?: boolean; // If true, replaces all data; if false, merges
  } = {}
): Promise<ValidationResult<StorageData>> {
  const { overwrite = true } = options;
  
  // Validate first
  const validation = validateImportData(jsonData);
  
  if (!validation.success || !validation.data) {
    return validation;
  }
  
  const importedData = validation.data;
  
  // Handle mappings
  if (overwrite) {
    // Overwrite mode: replace all
    await storage.setItem("local:wna:mappings", importedData.mappings);
  } else {
    // Merge mode: combine with existing
    const existingMappings = await storage.getItem<Record<string, unknown>>(
      "local:wna:mappings"
    ) ?? {};
    
    const merged = {
      ...existingMappings,
      ...importedData.mappings,
    };
    
    await storage.setItem("local:wna:mappings", merged);
  }
  
  // Always update settings (or use imported if overwrite)
  await storage.setItem("local:wna:settings", importedData.settings);
  
  // Invalidate cache after bulk import
  invalidateCache();
  
  return validation;
}

/**
 * Export data as JSON string
 * Pretty-printed for readability
 */
export async function exportDataAsJSON(): Promise<string> {
  const data = await exportData();
  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON string
 */
export async function importDataFromJSON(
  jsonString: string,
  options: {
    overwrite?: boolean;
  } = {}
): Promise<ValidationResult<StorageData>> {
  try {
    const parsed = JSON.parse(jsonString);
    return await importData(parsed, options);
  } catch (error) {
    return {
      success: false,
      warnings: [],
      errors: ["Invalid JSON: " + String(error)],
    };
  }
}

/**
 * Get all unique tags from mappings
 * Useful for filter UI
 */
export async function getAllTags(): Promise<string[]> {
  const mappingsData = await storage.getItem<Record<string, { tags?: string[] }>>(
    "local:wna:mappings"
  );
  
  if (!mappingsData) {
    return [];
  }
  
  const tagsSet = new Set<string>();
  
  for (const mapping of Object.values(mappingsData)) {
    if (mapping?.tags) {
      mapping.tags.forEach((tag) => tagsSet.add(tag));
    }
  }
  
  return Array.from(tagsSet).sort();
}

/**
 * Get all unique colors from mappings
 * Useful for filter UI
 */
export async function getAllColors(): Promise<string[]> {
  const mappingsData = await storage.getItem<Record<string, { color?: string }>>(
    "local:wna:mappings"
  );
  
  if (!mappingsData) {
    return [];
  }
  
  const colorsSet = new Set<string>();
  
  for (const mapping of Object.values(mappingsData)) {
    if (mapping?.color) {
      colorsSet.add(mapping.color);
    }
  }
  
  return Array.from(colorsSet).sort();
}

