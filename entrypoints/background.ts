import { isValidSolanaAddress } from "~/lib/utils/address";
import { MappingStorage } from "~/lib/storage";

export default defineBackground({
  main() {
    console.log("[WNA] Background service worker initialized");
    
    // Register context menu on install
    browser.runtime.onInstalled.addListener(() => {
      createContextMenu();
    });
    
    // Create context menu on startup
    createContextMenu();
    
    // Handle context menu clicks
    browser.contextMenus.onClicked.addListener(handleContextMenuClick);
    
    // Handle messages from content script
    browser.runtime.onMessage.addListener(handleMessage);
  },
});

/**
 * Create the context menu item
 */
function createContextMenu() {
  browser.contextMenus.create({
    id: "wna-name-address",
    title: "Name this address",
    contexts: ["selection", "link"],
    documentUrlPatterns: ["https://solscan.io/*"],
  });
  
  console.log("[WNA] Context menu created");
}

/**
 * Handle context menu clicks
 */
async function handleContextMenuClick(
  info: any,
  tab?: any
) {
  console.log("[WNA] Context menu clicked", info);
  
  if (!tab?.id) {
    console.error("[WNA] No tab ID available");
    return;
  }
  
  // Extract address from link or selection
  let address: string | null = null;
  
  // Try link URL first (for /account/<pubkey> or /address/<pubkey> links)
  // Solscan uses /account/ for wallet addresses and /address/ for some other views
  if (info.linkUrl) {
    const match = info.linkUrl.match(/\/(account|address|token)\/([A-Za-z0-9]{32,44})/);
    if (match && match[2] && isValidSolanaAddress(match[2])) {
      address = match[2];
      console.log("[WNA] Extracted address from link URL:", address);
    }
  }
  
  // Fallback to selection text (only if it's a valid full address, not truncated)
  if (!address && info.selectionText) {
    const trimmed = info.selectionText.trim();
    // Check if it's not a truncated address (doesn't contain "...")
    if (!trimmed.includes("...") && isValidSolanaAddress(trimmed)) {
      address = trimmed;
      console.log("[WNA] Extracted address from selection text:", address);
    }
  }
  
  if (!address) {
    console.warn("[WNA] No valid address found in context", {
      linkUrl: info.linkUrl,
      selectionText: info.selectionText,
    });
    return;
  }
  
  console.log("[WNA] Opening naming UI for address:", address);
  
  // Send message to content script to open naming UI
  try {
    await browser.tabs.sendMessage(tab.id, {
      type: "OPEN_NAMING_UI",
      address,
    });
  } catch (error) {
    console.error("[WNA] Failed to send message to content script:", error);
  }
}

/**
 * Handle messages from content script
 */
function handleMessage(
  message: any,
  sender: any,
  sendResponse: (response?: any) => void
) {
  console.log("[WNA] Received message:", message.type);
  
  if (message.type === "SAVE_MAPPING") {
    // Handle async operation
    (async () => {
      try {
        const { address, name, tags, color } = message;
        
        await MappingStorage.save(address, {
          name,
          tags: tags || [],
          color,
        });
        
        console.log("[WNA] Mapping saved:", address);
        
        sendResponse({ success: true, address });
      } catch (error) {
        console.error("[WNA] Failed to save mapping:", error);
        sendResponse({ success: false, error: String(error) });
      }
    })();
    
    return true; // Keep channel open for async response
  }
  
  if (message.type === "GET_MAPPING") {
    // Handle async operation
    (async () => {
      try {
        const { address } = message;
        const mapping = await MappingStorage.get(address);
        
        sendResponse({ success: true, data: mapping });
      } catch (error) {
        console.error("[WNA] Failed to get mapping:", error);
        sendResponse({ success: false, error: String(error) });
      }
    })();
    
    return true; // Keep channel open for async response
  }
  
  if (message.type === "GET_ALL_MAPPINGS") {
    // Handle async operation
    (async () => {
      try {
        const mappings = await MappingStorage.getAll();
        
        // Convert Map to plain object for message passing
        const mappingsObject = Object.fromEntries(mappings);
        
        sendResponse({ success: true, data: mappingsObject });
      } catch (error) {
        console.error("[WNA] Failed to get all mappings:", error);
        sendResponse({ success: false, error: String(error) });
      }
    })();
    
    return true; // Keep channel open for async response
  }
  
  return false;
}

