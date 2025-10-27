import { AddressMapping, AddressMappingInput, Settings } from "./schema";

/**
 * Storage keys used in chrome.storage.local
 */
const STORAGE_KEYS = {
  MAPPINGS: "wna:mappings",
  SETTINGS: "wna:settings",
} as const;

/**
 * In-memory cache for performance
 * Invalidated on write operations
 */
class StorageCache {
  private mappingsCache: Map<string, AddressMapping> | null = null;
  private settingsCache: Settings | null = null;
  
  getMappings(): Map<string, AddressMapping> | null {
    return this.mappingsCache;
  }
  
  setMappings(mappings: Map<string, AddressMapping>) {
    this.mappingsCache = mappings;
  }
  
  getSettings(): Settings | null {
    return this.settingsCache;
  }
  
  setSettings(settings: Settings) {
    this.settingsCache = settings;
  }
  
  invalidateMappings() {
    this.mappingsCache = null;
  }
  
  invalidateSettings() {
    this.settingsCache = null;
  }
  
  invalidateAll() {
    this.mappingsCache = null;
    this.settingsCache = null;
  }
}

const cache = new StorageCache();

/**
 * Storage operations for address mappings
 */
export const MappingStorage = {
  /**
   * Get a single mapping by address
   */
  async get(address: string): Promise<AddressMapping | null> {
    const mappings = await this.getAll();
    return mappings.get(address) ?? null;
  },

  /**
   * Get all mappings
   * Uses cache if available
   */
  async getAll(): Promise<Map<string, AddressMapping>> {
    const cached = cache.getMappings();
    if (cached) {
      return new Map(cached);
    }

    const data = await storage.getItem<Record<string, AddressMapping>>(
      `local:${STORAGE_KEYS.MAPPINGS}`
    );
    
    const mappings = new Map(Object.entries(data ?? {}));
    cache.setMappings(new Map(mappings));
    return mappings;
  },

  /**
   * Save or update a mapping
   * Automatically manages timestamps (created_at, updated_at)
   * Last-write-wins behavior
   */
  async save(address: string, input: AddressMappingInput): Promise<AddressMapping> {
    const now = Date.now();
    const existing = await this.get(address);
    
    const mapping: AddressMapping = {
      name: input.name,
      tags: input.tags ?? [],
      color: input.color,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };

    const mappings = await this.getAll();
    mappings.set(address, mapping);
    
    await storage.setItem(
      `local:${STORAGE_KEYS.MAPPINGS}`,
      Object.fromEntries(mappings)
    );
    
    cache.invalidateMappings();
    return mapping;
  },

  /**
   * Delete a mapping by address
   * Returns true if deleted, false if not found
   */
  async delete(address: string): Promise<boolean> {
    const mappings = await this.getAll();
    const existed = mappings.has(address);
    
    if (!existed) {
      return false;
    }
    
    mappings.delete(address);
    await storage.setItem(
      `local:${STORAGE_KEYS.MAPPINGS}`,
      Object.fromEntries(mappings)
    );
    
    cache.invalidateMappings();
    return true;
  },

  /**
   * Search mappings by name or tags
   * Case-insensitive partial match
   */
  async search(query: string): Promise<Map<string, AddressMapping>> {
    const allMappings = await this.getAll();
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      return allMappings;
    }
    
    const results = new Map<string, AddressMapping>();
    
    for (const [address, mapping] of allMappings) {
      // Search in name
      if (mapping.name.toLowerCase().includes(lowerQuery)) {
        results.set(address, mapping);
        continue;
      }
      
      // Search in tags
      if (mapping.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        results.set(address, mapping);
        continue;
      }
      
      // Search in address itself
      if (address.toLowerCase().includes(lowerQuery)) {
        results.set(address, mapping);
      }
    }
    
    return results;
  },

  /**
   * Filter mappings by tag or color
   */
  async filter(options: {
    tags?: string[];
    color?: string;
  }): Promise<Map<string, AddressMapping>> {
    const allMappings = await this.getAll();
    const results = new Map<string, AddressMapping>();
    
    for (const [address, mapping] of allMappings) {
      // Filter by tags (any match)
      if (options.tags && options.tags.length > 0) {
        const hasMatchingTag = options.tags.some(tag =>
          mapping.tags?.includes(tag)
        );
        if (!hasMatchingTag) {
          continue;
        }
      }
      
      // Filter by color (exact match)
      if (options.color && mapping.color !== options.color) {
        continue;
      }
      
      results.set(address, mapping);
    }
    
    return results;
  },

  /**
   * Clear all mappings
   * Use with caution!
   */
  async clear(): Promise<void> {
    await storage.setItem(`local:${STORAGE_KEYS.MAPPINGS}`, {});
    cache.invalidateMappings();
  },
};

/**
 * Storage operations for settings
 */
export const SettingsStorage = {
  /**
   * Get current settings
   * Uses cache if available
   */
  async get(): Promise<Settings> {
    const cached = cache.getSettings();
    if (cached) {
      return { ...cached };
    }

    const data = await storage.getItem<Settings>(
      `local:${STORAGE_KEYS.SETTINGS}`
    );
    
    const settings: Settings = data ?? {
      replace_mode: "inline",
      domains_enabled: ["solscan.io"],
    };
    
    cache.setSettings(settings);
    return { ...settings };
  },

  /**
   * Update settings
   * Partial update supported
   */
  async update(updates: Partial<Settings>): Promise<Settings> {
    const current = await this.get();
    const updated: Settings = {
      ...current,
      ...updates,
    };
    
    await storage.setItem(`local:${STORAGE_KEYS.SETTINGS}`, updated);
    cache.invalidateSettings();
    return updated;
  },

  /**
   * Reset settings to defaults
   */
  async reset(): Promise<Settings> {
    const defaults: Settings = {
      replace_mode: "inline",
      domains_enabled: ["solscan.io"],
    };
    
    await storage.setItem(`local:${STORAGE_KEYS.SETTINGS}`, defaults);
    cache.invalidateSettings();
    return defaults;
  },
};

/**
 * Utility to invalidate all caches
 * Use after bulk import operations
 */
export function invalidateCache() {
  cache.invalidateAll();
}

