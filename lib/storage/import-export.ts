import { z } from 'zod';
import {
  type ExportData,
  type Mappings,
  type AddressMapping,
  type ValidationResult,
  ExportDataSchema,
  isValidSolanaAddress,
} from './schema';
import { getAllMappings, getSettings, clearAllData, saveMapping, updateSettings } from './storage';

/**
 * Export all data to JSON
 */
export async function exportData(): Promise<ExportData> {
  const mappings = await getAllMappings();
  const settings = await getSettings();

  return {
    version: '1.0',
    mappings,
    settings,
  };
}

/**
 * Export data as JSON string
 */
export async function exportDataAsJSON(pretty = true): Promise<string> {
  const data = await exportData();
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Export data as downloadable file
 */
export async function exportDataAsFile(): Promise<void> {
  const json = await exportDataAsJSON(true);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `wna-export-${timestamp}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate import data with lenient parsing
 */
export function validateImportData(data: unknown): ValidationResult<ExportData> {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // First, check if it's valid JSON object
    if (typeof data !== 'object' || data === null) {
      return {
        success: false,
        errors: ['Invalid data format: expected JSON object'],
        warnings: [],
      };
    }

    // Try to parse with the lenient schema
    const result = ExportDataSchema.safeParse(data);

    if (!result.success) {
      const zodErrors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return {
        success: false,
        errors: zodErrors,
        warnings: [],
      };
    }

    const parsed = result.data;

    // Validate mappings
    if (parsed.mappings) {
      for (const [address, mapping] of Object.entries(parsed.mappings)) {
        // Warn about invalid addresses
        if (!isValidSolanaAddress(address)) {
          warnings.push(`Address "${address}" may not be a valid Solana address`);
        }

        // Warn about missing required fields
        if (!mapping.name || mapping.name.trim() === '') {
          errors.push(`Mapping for address "${address}" has empty or missing name`);
        }

        // Warn about missing timestamps
        if (!mapping.created_at) {
          warnings.push(`Mapping for address "${address}" missing created_at timestamp`);
        }
        if (!mapping.updated_at) {
          warnings.push(`Mapping for address "${address}" missing updated_at timestamp`);
        }

        // Warn about invalid color format
        if (mapping.color && !/^#[0-9A-Fa-f]{6}$/.test(mapping.color)) {
          warnings.push(`Mapping for address "${address}" has invalid color format: ${mapping.color}`);
        }
      }
    }

    // Check if mappings object exists
    if (!parsed.mappings) {
      warnings.push('No mappings found in import data');
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0 ? parsed : undefined,
      warnings,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Unexpected error during validation: ${error instanceof Error ? error.message : String(error)}`],
      warnings: [],
    };
  }
}

/**
 * Import data from JSON string with validation
 */
export async function importDataFromJSON(jsonString: string): Promise<ValidationResult<void>> {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Parse JSON
    const data = JSON.parse(jsonString);

    // Validate
    const validation = validateImportData(data);

    if (!validation.success) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    if (!validation.data) {
      return {
        success: false,
        errors: ['Validation passed but no data returned'],
        warnings: [],
      };
    }

    // Import the data
    const importResult = await importData(validation.data, false);

    return {
      success: true,
      warnings: [...validation.warnings, ...importResult.warnings],
      errors: [],
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        errors: ['Invalid JSON format: ' + error.message],
        warnings: [],
      };
    }

    return {
      success: false,
      errors: [`Import failed: ${error instanceof Error ? error.message : String(error)}`],
      warnings: [],
    };
  }
}

/**
 * Import data (merge or replace)
 */
export async function importData(
  data: ExportData,
  merge = false
): Promise<{ success: boolean; warnings: string[]; errors: string[] }> {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // If not merging, clear existing data
    if (!merge) {
      await clearAllData();
    }

    // Import mappings
    if (data.mappings) {
      const now = Date.now();
      
      for (const [address, mapping] of Object.entries(data.mappings)) {
        try {
          await saveMapping(
            address,
            mapping.name,
            mapping.tags || [],
            mapping.color
          );
        } catch (error) {
          errors.push(`Failed to import mapping for ${address}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Import settings if provided
    if (data.settings) {
      try {
        await updateSettings(data.settings);
      } catch (error) {
        warnings.push(`Failed to import settings: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: errors.length === 0,
      warnings,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Import failed: ${error instanceof Error ? error.message : String(error)}`],
      warnings,
    };
  }
}

/**
 * Import data from file input
 */
export async function importDataFromFile(file: File): Promise<ValidationResult<void>> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result;

        if (typeof content !== 'string') {
          resolve({
            success: false,
            errors: ['Failed to read file content'],
            warnings: [],
          });
          return;
        }

        const result = await importDataFromJSON(content);
        resolve(result);
      } catch (error) {
        resolve({
          success: false,
          errors: [`File read error: ${error instanceof Error ? error.message : String(error)}`],
          warnings: [],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        errors: ['Failed to read file'],
        warnings: [],
      });
    };

    reader.readAsText(file);
  });
}

/**
 * Get import preview (without actually importing)
 */
export function getImportPreview(data: ExportData): {
  mappingsCount: number;
  tags: string[];
  colors: string[];
  hasSettings: boolean;
} {
  const tags = new Set<string>();
  const colors = new Set<string>();

  if (data.mappings) {
    Object.values(data.mappings).forEach(mapping => {
      if (mapping.tags) {
        mapping.tags.forEach(tag => tags.add(tag));
      }
      if (mapping.color) {
        colors.add(mapping.color);
      }
    });
  }

  return {
    mappingsCount: data.mappings ? Object.keys(data.mappings).length : 0,
    tags: Array.from(tags).sort(),
    colors: Array.from(colors).sort(),
    hasSettings: !!data.settings,
  };
}

