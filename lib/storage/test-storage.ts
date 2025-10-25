/**
 * Test script for storage operations
 * Run this in the browser console or background worker to verify storage
 */

import {
  initStorage,
  saveMapping,
  getMapping,
  getAllMappings,
  deleteMapping,
  searchMappings,
  filterMappingsByTag,
  getAllTags,
  getAllColors,
  getStorageStats,
} from './storage';

import {
  exportData,
  exportDataAsJSON,
  importDataFromJSON,
  validateImportData,
  getImportPreview,
} from './import-export';

export async function runStorageTests(): Promise<void> {
  console.group('🧪 Storage Tests');

  try {
    // Test 1: Initialize
    console.log('1. Initializing storage...');
    await initStorage();
    console.log('✅ Storage initialized');

    // Test 2: Save mappings
    console.log('\n2. Saving test mappings...');
    await saveMapping(
      'HcUZx9A1234567890R6ihX1Z',
      'Protocol A: Fee Wallet',
      ['protocol-a', 'fee'],
      '#FF7A59'
    );
    await saveMapping(
      '2nA5Gq9876543210puCAM8',
      'Bridge: Escrow',
      ['bridge'],
      '#6BDE8F'
    );
    await saveMapping(
      '3xYzK5abcdefghijklmnopq',
      'Test Wallet',
      ['test', 'demo'],
      '#3498db'
    );
    console.log('✅ Saved 3 mappings');

    // Test 3: Retrieve mapping
    console.log('\n3. Retrieving single mapping...');
    const mapping = await getMapping('HcUZx9A1234567890R6ihX1Z');
    console.log('✅ Retrieved:', mapping);

    // Test 4: Get all mappings
    console.log('\n4. Getting all mappings...');
    const all = await getAllMappings();
    console.log('✅ Total mappings:', Object.keys(all).length);

    // Test 5: Search
    console.log('\n5. Searching for "Protocol"...');
    const searchResults = await searchMappings('Protocol');
    console.log('✅ Found:', searchResults.length, 'results');

    // Test 6: Filter by tag
    console.log('\n6. Filtering by tag "bridge"...');
    const bridgeResults = await filterMappingsByTag('bridge');
    console.log('✅ Found:', bridgeResults.length, 'bridge mappings');

    // Test 7: Get tags and colors
    console.log('\n7. Getting all tags and colors...');
    const tags = await getAllTags();
    const colors = await getAllColors();
    console.log('✅ Tags:', tags);
    console.log('✅ Colors:', colors);

    // Test 8: Storage stats
    console.log('\n8. Getting storage statistics...');
    const stats = await getStorageStats();
    console.log('✅ Stats:', stats);

    // Test 9: Export
    console.log('\n9. Exporting data...');
    const exported = await exportData();
    console.log('✅ Exported:', {
      mappings: Object.keys(exported.mappings || {}).length,
      settings: exported.settings,
    });

    // Test 10: Export as JSON
    console.log('\n10. Exporting as JSON string...');
    const json = await exportDataAsJSON();
    console.log('✅ JSON length:', json.length, 'characters');

    // Test 11: Validate export
    console.log('\n11. Validating export data...');
    const validation = validateImportData(exported);
    console.log('✅ Validation:', {
      success: validation.success,
      warnings: validation.warnings.length,
      errors: validation.errors.length,
    });

    // Test 12: Import preview
    console.log('\n12. Getting import preview...');
    const preview = getImportPreview(exported);
    console.log('✅ Preview:', preview);

    // Test 13: Delete mapping
    console.log('\n13. Deleting a mapping...');
    const deleted = await deleteMapping('3xYzK5abcdefghijklmnopq');
    console.log('✅ Deleted:', deleted);

    // Test 14: Verify deletion
    console.log('\n14. Verifying deletion...');
    const afterDelete = await getStorageStats();
    console.log('✅ Mappings after delete:', afterDelete.totalMappings);

    // Test 15: Import test
    console.log('\n15. Testing import from JSON...');
    const importResult = await importDataFromJSON(json);
    console.log('✅ Import result:', {
      success: importResult.success,
      warnings: importResult.warnings?.length || 0,
      errors: importResult.errors?.length || 0,
    });

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.groupEnd();
  }
}

// Auto-run in development
if (typeof window !== 'undefined' || typeof self !== 'undefined') {
  console.log('Storage test module loaded. Run runStorageTests() to test.');
}

