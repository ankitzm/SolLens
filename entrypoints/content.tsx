import "~/assets/tailwind.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { NamingModal } from "~/components/NamingModal";
import { MappingStorage } from "~/lib/storage";
import { scanForAddressLinks, annotateAddressLinks, clearAllProcessedMarkers } from "~/lib/annotator";

export default defineContentScript({
  matches: ["https://solscan.io/*"],
  
  async main() {
    console.log("[WNA] Content script loaded on Solscan");
    
    // Listen for messages from background script
    browser.runtime.onMessage.addListener(handleMessage);
    
    // Wait for page to be fully loaded
    await waitForPageLoad();
    
    console.log("[WNA] Page loaded, starting annotation");
    
    // Phase 3: Scan and annotate addresses on page load
    await scanAndAnnotate();
    
    console.log("[WNA] Initial annotation complete");
    
    // Watch for dynamic content changes (SPA support)
    startDOMObserver();
  },
});

// State for the naming modal
let modalRoot: ReactDOM.Root | null = null;
let modalContainer: HTMLDivElement | null = null;

/**
 * Handle messages from background script
 */
async function handleMessage(
  message: any,
  sender: any,
  sendResponse: (response?: any) => void
) {
  if (message.type === "OPEN_NAMING_UI") {
    const { address } = message;
    console.log("[WNA] Opening naming UI for:", address);
    
    // Fetch existing mapping if any
    const existingData = await fetchExistingMapping(address);
    
    openNamingModal(address, existingData);
    return true;
  }
  
  return false;
}

/**
 * Fetch existing mapping for an address
 */
async function fetchExistingMapping(address: string): Promise<any> {
  try {
    const response = await browser.runtime.sendMessage({
      type: "GET_MAPPING",
      address,
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error("[WNA] Failed to fetch existing mapping:", error);
    return null;
  }
}

/**
 * Open the naming modal
 */
function openNamingModal(address: string, existingData: any) {
  // Create container if it doesn't exist
  if (!modalContainer) {
    modalContainer = document.createElement("div");
    modalContainer.id = "wna-naming-modal-root";
    document.body.appendChild(modalContainer);
    modalRoot = ReactDOM.createRoot(modalContainer);
  }
  
  // Render the modal
  modalRoot?.render(
    <React.StrictMode>
      <NamingModal
        address={address}
        isOpen={true}
        existingData={existingData}
        onClose={closeNamingModal}
        onSave={async (data) => {
          await saveMapping(address, data);
        }}
      />
    </React.StrictMode>
  );
}

/**
 * Close the naming modal
 */
function closeNamingModal() {
  if (modalRoot && modalContainer) {
    modalRoot.render(
      <React.StrictMode>
        <NamingModal
          address=""
          isOpen={false}
          onClose={() => {}}
          onSave={async () => {}}
        />
      </React.StrictMode>
    );
  }
}

/**
 * Save mapping via background script
 */
async function saveMapping(
  address: string,
  data: { name: string; tags: string[]; color?: string }
): Promise<void> {
  try {
    const response = await browser.runtime.sendMessage({
      type: "SAVE_MAPPING",
      address,
      name: data.name,
      tags: data.tags,
      color: data.color,
    });
    
    if (response.success) {
      console.log("[WNA] Mapping saved successfully");
      // Re-scan to update visible addresses with new name
      // Clear markers to force re-processing
      await scanAndAnnotate(true);
    } else {
      throw new Error(response.error || "Failed to save mapping");
    }
  } catch (error) {
    console.error("[WNA] Failed to save mapping:", error);
    throw error;
  }
}

// Debounce timer for DOM changes
let scanTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Start observing DOM changes for SPA navigation and dynamic content
 */
function startDOMObserver(): void {
  console.log("[WNA] Starting DOM observer for dynamic content");
  
  const observer = new MutationObserver((mutations) => {
    // Check if any mutations added new nodes
    const hasNewNodes = mutations.some(mutation => mutation.addedNodes.length > 0);
    
    if (!hasNewNodes) {
      return;
    }
    
    // Debounce: wait 500ms after last change before scanning
    if (scanTimeout) {
      clearTimeout(scanTimeout);
    }
    
    scanTimeout = setTimeout(async () => {
      console.log("[WNA] DOM changed, re-scanning...");
      await scanAndAnnotate();
    }, 500);
  });
  
  // Observe the entire document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  console.log("[WNA] DOM observer active");
}

/**
 * Wait for the page to be fully loaded
 */
async function waitForPageLoad(): Promise<void> {
  // Wait until page is fully loaded
  if (document.readyState !== "complete") {
    await new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  }
  
  // Wait for browser to be idle (max 1 second)
  await new Promise((resolve) => {
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(resolve, { timeout: 1000 });
    } else {
      setTimeout(resolve, 300);
    }
  });
}

/**
 * Scan the page and annotate addresses with saved names
 * @param clearMarkers - If true, clears all processed markers before scanning (for re-scans)
 */
async function scanAndAnnotate(clearMarkers: boolean = false): Promise<void> {
  try {
    // Clear processed markers if requested (for re-scans after saving)
    if (clearMarkers) {
      clearAllProcessedMarkers(document.body);
    }
    
    // Get all saved mappings from background
    const response = await browser.runtime.sendMessage({
      type: "GET_ALL_MAPPINGS",
    });
    
    if (!response || !response.success) {
      console.warn("[WNA] Failed to get mappings for annotation");
      return;
    }
    
    const mappingsData = response.data || {};
    const mappings = new Map<string, any>(Object.entries(mappingsData));
    
    console.log(`[WNA] Scanning page with ${mappings.size} saved mappings`);
    
    // Scan for address links
    const links = scanForAddressLinks(document.body);
    
    console.log(`[WNA] Found ${links.length} address links on page`);
    
    if (links.length > 0 && mappings.size > 0) {
      // Annotate links with saved names
      annotateAddressLinks(links, mappings as any);
    } else {
      console.log(`[WNA] Nothing to annotate - mappings: ${mappings.size}, links: ${links.length}`);
    }
  } catch (error) {
    console.error("[WNA] Failed to scan and annotate:", error);
  }
}
