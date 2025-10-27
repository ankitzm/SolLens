import "~/assets/tailwind.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { NamingModal } from "~/components/NamingModal";
import { MappingStorage } from "~/lib/storage";
import { scanForAddressLinks, annotateAddressLinks } from "~/lib/annotator";

export default defineContentScript({
  matches: ["https://solscan.io/*"],
  
  async main() {
    console.log("[WNA] Content script loaded on Solscan");
    
    // Listen for messages from background script
    browser.runtime.onMessage.addListener(handleMessage);
    
    // Phase 3: Scan and annotate addresses on page load
    await scanAndAnnotate();
    
    console.log("[WNA] Initial annotation complete");
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
      await scanAndAnnotate();
    } else {
      throw new Error(response.error || "Failed to save mapping");
    }
  } catch (error) {
    console.error("[WNA] Failed to save mapping:", error);
    throw error;
  }
}

/**
 * Scan the page and annotate addresses with saved names
 */
async function scanAndAnnotate(): Promise<void> {
  try {
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
    
    // Annotate links with saved names
    annotateAddressLinks(links, mappings as any);
    
    const annotatedCount = links.filter(link => 
      mappings.has(link.address)
    ).length;
    
    console.log(`[WNA] Annotated ${annotatedCount} addresses`);
  } catch (error) {
    console.error("[WNA] Failed to scan and annotate:", error);
  }
}
