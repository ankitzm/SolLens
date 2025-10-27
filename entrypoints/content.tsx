import "~/assets/tailwind.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { NamingModal } from "~/components/NamingModal";

export default defineContentScript({
  matches: ["https://solscan.io/*"],
  
  async main() {
    console.log("[WNA] Content script loaded on Solscan");
    
    // Listen for messages from background script
    browser.runtime.onMessage.addListener(handleMessage);
    
    // Phase 3: Address detection and replacement will go here
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
      // Phase 3: Trigger re-scan to update visible addresses
    } else {
      throw new Error(response.error || "Failed to save mapping");
    }
  } catch (error) {
    console.error("[WNA] Failed to save mapping:", error);
    throw error;
  }
}
