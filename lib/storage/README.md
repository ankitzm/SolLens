# Storage Module

This module provides a type-safe, cached storage layer for WNA using `browser.storage.local` with Zod validation.

## Features

- **Type-safe schemas** with Zod validation
- **In-memory cache** for performance
- **CRUD operations** for address mappings
- **Search and filtering** by name, tag, or color
- **Import/Export** with lenient validation
- **Settings management**

## Usage

### Initialize Storage

```typescript
import { initStorage } from '@/lib/storage';

// Must be called before using other storage functions
await initStorage();
```

### Save a Mapping

```typescript
import { saveMapping } from '@/lib/storage';

await saveMapping(
  'HcUZx9A1234567890R6ihX1Z',
  'Protocol A: Fee Wallet',
  ['protocol-a', 'fee'],
  '#FF7A59'
);
```

### Get a Mapping

```typescript
import { getMapping } from '@/lib/storage';

const mapping = await getMapping('HcUZx9A1234567890R6ihX1Z');
console.log(mapping?.name); // "Protocol A: Fee Wallet"
```

### Search Mappings

```typescript
import { searchMappings } from '@/lib/storage';

const results = await searchMappings('protocol');
// Returns array of { address, mapping } objects
```

### Export Data

```typescript
import { exportDataAsJSON, exportDataAsFile } from '@/lib/storage';

// As JSON string
const json = await exportDataAsJSON();

// Download as file
await exportDataAsFile();
```

### Import Data

```typescript
import { importDataFromJSON } from '@/lib/storage';

const result = await importDataFromJSON(jsonString);

if (result.success) {
  console.log('Import successful');
  if (result.warnings.length > 0) {
    console.warn('Warnings:', result.warnings);
  }
} else {
  console.error('Import failed:', result.errors);
}
```

## Testing

To test the storage module:

1. Build the extension: `pnpm build`
2. Load the extension in Chrome
3. Open the extension's background service worker console
4. Run the test suite:

```javascript
// In the background worker console
const { runStorageTests } = await import('./lib/storage/test-storage.js');
await runStorageTests();
```

## Schema

### AddressMapping

```typescript
{
  name: string;           // Required, min 1 character
  tags: string[];         // Optional, defaults to []
  color: string;          // Optional, hex format #RRGGBB
  created_at: number;     // Timestamp
  updated_at: number;     // Timestamp
}
```

### Settings

```typescript
{
  replace_mode: 'inline' | 'badge';
  domains_enabled: string[];
}
```

## Data Structure

Data is stored in `browser.storage.local` with keys:
- `mappings`: Object mapping addresses to AddressMapping
- `settings`: Settings object

Example:
```json
{
  "mappings": {
    "HcUZx9A...R6ihX1Z": {
      "name": "Protocol A: Fee Wallet",
      "tags": ["protocol-a", "fee"],
      "color": "#FF7A59",
      "created_at": 1690000000000,
      "updated_at": 1690000100000
    }
  },
  "settings": {
    "replace_mode": "inline",
    "domains_enabled": ["solscan.io"]
  }
}
```

## API Reference

See individual files for detailed API documentation:
- `schema.ts` - Type definitions and Zod schemas
- `storage.ts` - CRUD operations and cache
- `import-export.ts` - Import/export functionality

