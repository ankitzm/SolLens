import {
  type AddressMapping,
  type Mappings,
  type Settings,
  type StorageData,
  STORAGE_KEYS,
  AddressMappingSchema,
  SettingsSchema,
  createMapping,
  updateMapping,
} from './schema';

// Storage helper functions using chrome.storage.local
async function storageGet<T>(key: string): Promise<T | null> {
  const result = await browser.storage.local.get(key);
  return result[key] || null;
}

async function storageSet(key: string, value: any): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

async function storageRemove(key: string): Promise<void> {
  await browser.storage.local.remove(key);
}

/**
 * In-memory cache for mappings
 */
class StorageCache {
  private mappingsCache: Mappings | null = null;
  private settingsCache: Settings | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const [mappings, settings] = await Promise.all([
      this.loadMappings(),
      this.loadSettings(),
    ]);

    this.mappingsCache = mappings;
    this.settingsCache = settings;
    this.initialized = true;
  }

  private async loadMappings(): Promise<Mappings> {
    const data = await storageGet<Mappings>(STORAGE_KEYS.MAPPINGS);
    return data || {};
  }

  private async loadSettings(): Promise<Settings> {
    const data = await storageGet<Settings>(STORAGE_KEYS.SETTINGS);
    return data || {
      replace_mode: 'inline',
      domains_enabled: ['solscan.io'],
    };
  }

  getMappings(): Mappings {
    if (!this.initialized) {
      throw new Error('Cache not initialized. Call initialize() first.');
    }
    return this.mappingsCache!;
  }

  getSettings(): Settings {
    if (!this.initialized) {
      throw new Error('Cache not initialized. Call initialize() first.');
    }
    return this.settingsCache!;
  }

  setMappings(mappings: Mappings): void {
    this.mappingsCache = mappings;
  }

  setSettings(settings: Settings): void {
    this.settingsCache = settings;
  }

  clear(): void {
    this.mappingsCache = {};
    this.settingsCache = {
      replace_mode: 'inline',
      domains_enabled: ['solscan.io'],
    };
  }
}

const cache = new StorageCache();

/**
 * Initialize storage (must be called before using other functions)
 */
export async function initStorage(): Promise<void> {
  await cache.initialize();
}

/**
 * Get a single mapping by address
 */
export async function getMapping(address: string): Promise<AddressMapping | null> {
  const mappings = cache.getMappings();
  return mappings[address] || null;
}

/**
 * Get all mappings
 */
export async function getAllMappings(): Promise<Mappings> {
  return cache.getMappings();
}

/**
 * Save or update a mapping
 */
export async function saveMapping(
  address: string,
  name: string,
  tags?: string[],
  color?: string
): Promise<void> {
  const mappings = cache.getMappings();
  const existing = mappings[address];

  const mapping = existing
    ? updateMapping(existing, { name, tags, color })
    : createMapping(name, tags, color);

  const updatedMappings = {
    ...mappings,
    [address]: mapping,
  };

  await storageSet(STORAGE_KEYS.MAPPINGS, updatedMappings);
  cache.setMappings(updatedMappings);
}

/**
 * Update an existing mapping with partial data
 */
export async function updateMappingPartial(
  address: string,
  updates: Partial<Omit<AddressMapping, 'created_at' | 'updated_at'>>
): Promise<void> {
  const mappings = cache.getMappings();
  const existing = mappings[address];

  if (!existing) {
    throw new Error(`Mapping for address ${address} not found`);
  }

  const updated = updateMapping(existing, updates);
  const updatedMappings = {
    ...mappings,
    [address]: updated,
  };

  await storageSet(STORAGE_KEYS.MAPPINGS, updatedMappings);
  cache.setMappings(updatedMappings);
}

/**
 * Delete a mapping
 */
export async function deleteMapping(address: string): Promise<boolean> {
  const mappings = cache.getMappings();

  if (!mappings[address]) {
    return false;
  }

  const { [address]: _, ...remaining } = mappings;

  await storage.setItem(`local:${STORAGE_KEYS.MAPPINGS}`, remaining);
  cache.setMappings(remaining);

  return true;
}

/**
 * Delete multiple mappings
 */
export async function deleteMappings(addresses: string[]): Promise<number> {
  const mappings = cache.getMappings();
  let deletedCount = 0;

  const updatedMappings = { ...mappings };

  for (const address of addresses) {
    if (updatedMappings[address]) {
      delete updatedMappings[address];
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    await storage.setItem(`local:${STORAGE_KEYS.MAPPINGS}`, updatedMappings);
    cache.setMappings(updatedMappings);
  }

  return deletedCount;
}

/**
 * Search mappings by name or tag
 */
export async function searchMappings(query: string): Promise<Array<{ address: string; mapping: AddressMapping }>> {
  const mappings = cache.getMappings();
  const lowerQuery = query.toLowerCase();

  return Object.entries(mappings)
    .filter(([address, mapping]) => {
      return (
        mapping.name.toLowerCase().includes(lowerQuery) ||
        mapping.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        address.toLowerCase().includes(lowerQuery)
      );
    })
    .map(([address, mapping]) => ({ address, mapping }));
}

/**
 * Filter mappings by tag
 */
export async function filterMappingsByTag(tag: string): Promise<Array<{ address: string; mapping: AddressMapping }>> {
  const mappings = cache.getMappings();

  return Object.entries(mappings)
    .filter(([_, mapping]) => mapping.tags.includes(tag))
    .map(([address, mapping]) => ({ address, mapping }));
}

/**
 * Filter mappings by color
 */
export async function filterMappingsByColor(color: string): Promise<Array<{ address: string; mapping: AddressMapping }>> {
  const mappings = cache.getMappings();

  return Object.entries(mappings)
    .filter(([_, mapping]) => mapping.color === color)
    .map(([address, mapping]) => ({ address, mapping }));
}

/**
 * Get all unique tags
 */
export async function getAllTags(): Promise<string[]> {
  const mappings = cache.getMappings();
  const tagsSet = new Set<string>();

  Object.values(mappings).forEach(mapping => {
    mapping.tags.forEach(tag => tagsSet.add(tag));
  });

  return Array.from(tagsSet).sort();
}

/**
 * Get all unique colors
 */
export async function getAllColors(): Promise<string[]> {
  const mappings = cache.getMappings();
  const colorsSet = new Set<string>();

  Object.values(mappings).forEach(mapping => {
    if (mapping.color) {
      colorsSet.add(mapping.color);
    }
  });

  return Array.from(colorsSet).sort();
}

/**
 * Get settings
 */
export async function getSettings(): Promise<Settings> {
  return cache.getSettings();
}

/**
 * Update settings
 */
export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  const current = cache.getSettings();
  const updated = { ...current, ...updates };

  const validated = SettingsSchema.parse(updated);

  await storageSet(STORAGE_KEYS.SETTINGS, validated);
  cache.setSettings(validated);
}

/**
 * Clear all data
 */
export async function clearAllData(): Promise<void> {
  await storageRemove(STORAGE_KEYS.MAPPINGS);
  await storageRemove(STORAGE_KEYS.SETTINGS);
  cache.clear();
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalMappings: number;
  totalTags: number;
  totalColors: number;
}> {
  const mappings = cache.getMappings();
  const tags = await getAllTags();
  const colors = await getAllColors();

  return {
    totalMappings: Object.keys(mappings).length,
    totalTags: tags.length,
    totalColors: colors.length,
  };
}

