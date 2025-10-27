/**
 * Message Passing Utilities
 * 
 * Type-safe message passing between extension components
 */

/**
 * Message types for extension communication
 */
export type ExtensionMessage =
  | { type: "OPEN_NAMING_UI"; address: string }
  | { type: "SAVE_MAPPING"; address: string; name: string; tags?: string[]; color?: string }
  | { type: "GET_MAPPING"; address: string }
  | { type: "MAPPING_SAVED"; success: boolean; address: string }
  | { type: "MAPPING_DATA"; address: string; data: any };

/**
 * Send a message to the extension runtime
 */
export async function sendMessage<T = any>(message: ExtensionMessage): Promise<T> {
  return browser.runtime.sendMessage(message);
}

/**
 * Send a message to a specific tab
 */
export async function sendMessageToTab<T = any>(
  tabId: number,
  message: ExtensionMessage
): Promise<T> {
  return browser.tabs.sendMessage(tabId, message);
}

/**
 * Type-safe message listener
 */
export function onMessage(
  callback: (
    message: ExtensionMessage,
    sender: any,
    sendResponse: (response?: any) => void
  ) => void | boolean | Promise<any>
) {
  browser.runtime.onMessage.addListener(callback);
}

