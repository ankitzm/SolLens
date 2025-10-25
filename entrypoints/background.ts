export default defineBackground(() => {
  console.log('WNA Background worker started', { id: browser.runtime.id });

  // Initialize storage on extension load
  browser.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed/updated');
    
    // Import storage module dynamically to test
    try {
      const { initStorage } = await import('../lib/storage');
      await initStorage();
      console.log('✅ Storage initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize storage:', error);
    }
  });

  // Message handler for testing
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);

    if (message.type === 'test-storage') {
      (async () => {
        try {
          const { runStorageTests } = await import('../lib/storage/test-storage');
          await runStorageTests();
          sendResponse({ success: true });
        } catch (error) {
          console.error('Test failed:', error);
          sendResponse({ success: false, error: String(error) });
        }
      })();
      return true; // Keep channel open for async response
    }

    return false;
  });
});

