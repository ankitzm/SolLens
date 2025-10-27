# WNA Storage Module

Local storage wrapper for managing wallet address mappings and extension settings.

## Features

- ✅ CRUD operations for address mappings
- ✅ In-memory caching for performance
- ✅ Search by name, tags, or address
- ✅ Filter by tags or color
- ✅ Import/export with lenient validation
- ✅ Automatic timestamp management (created_at, updated_at)
- ✅ Last-write-wins conflict resolution

## Usage

### Basic CRUD Operations

```typescript
import { MappingStorage } from "~/lib/storage";

// Save a mapping
await MappingStorage.save("HcUZx9A...R6ihX1Z", {
  name: "ProtocolA: FeeWallet",
  tags: ["protocol-a", "fee"],
  color: "#FF7A59",
});

// Get a single mapping
const mapping = await MappingStorage.get("HcUZx9A...R6ihX1Z");

// Get all mappings
const allMappings = await MappingStorage.getAll(); // Returns Map<string, AddressMapping>

// Delete a mapping
await MappingStorage.delete("HcUZx9A...R6ihX1Z");
```

### Search and Filter

```typescript
// Search by name, tags, or address
const results = await MappingStorage.search("protocol");

// Filter by tags
const filtered = await MappingStorage.filter({
  tags: ["protocol-a"],
});

// Filter by color
const filtered = await MappingStorage.filter({
  color: "#FF7A59",
});
```

### Import/Export

```typescript
import { exportDataAsJSON, importDataFromJSON } from "~/lib/storage";

// Export all data
const json = await exportDataAsJSON();
console.log(json);

// Import data
const result = await importDataFromJSON(json);

if (result.success) {
  console.log("Import successful!");
  if (result.warnings.length > 0) {
    console.warn("Warnings:", result.warnings);
  }
} else {
  console.error("Import failed:", result.errors);
}
```

### Settings

```typescript
import { SettingsStorage } from "~/lib/storage";

// Get settings
const settings = await SettingsStorage.get();

// Update settings (partial)
await SettingsStorage.update({
  replace_mode: "inline",
});

// Reset to defaults
await SettingsStorage.reset();
```

## Data Model

### AddressMapping

```typescript
{
  name: string;           // Required: display name
  tags?: string[];        // Optional: tags for filtering/organization
  color?: string;         // Optional: color for UI (hex format)
  created_at: number;     // Auto-managed: Unix timestamp
  updated_at: number;     // Auto-managed: Unix timestamp
}
```

### Settings

```typescript
{
  replace_mode: "inline";           // Display mode (v1: inline only)
  domains_enabled: string[];        // Active domains (v1: ["solscan.io"])
}
```

## Validation

Import validation is **lenient**:
- ✅ Unknown fields generate warnings but don't block import
- ✅ Missing optional fields use defaults
- ❌ Invalid types or missing required fields fail validation
- ❌ Malformed JSON fails validation

## Cache Behavior

- Cache is populated on first read
- Cache is invalidated on any write operation
- Manual invalidation: `invalidateCache()`

## Storage Keys

Data is stored in `chrome.storage.local` with keys:
- `wna:mappings` - All address mappings
- `wna:settings` - Extension settings

