/**
 * Solana Address Utilities
 * 
 * Functions for validating and working with Solana base58 addresses
 */

/**
 * Base58 character set used by Solana
 * Excludes: 0, O, I, l (to avoid confusion)
 */
const BASE58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Checks if a string contains only valid base58 characters
 */
function isBase58(str: string): boolean {
  if (!str || typeof str !== "string") {
    return false;
  }
  
  for (let i = 0; i < str.length; i++) {
    if (!BASE58_CHARS.includes(str[i])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates if a string is a valid Solana address
 * 
 * Criteria:
 * - Base58 encoded
 * - Typically 32-44 characters (public keys are usually 44)
 * - Conservative range: 32-44 characters
 * 
 * @param address - String to validate
 * @returns true if valid Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }
  
  // Trim whitespace
  const trimmed = address.trim();
  
  // Length check: Solana addresses are typically 32-44 chars
  // Most public keys are exactly 44 characters
  if (trimmed.length < 32 || trimmed.length > 44) {
    return false;
  }
  
  // Must be valid base58
  if (!isBase58(trimmed)) {
    return false;
  }
  
  return true;
}

/**
 * Extracts potential Solana addresses from text
 * Uses conservative heuristics to avoid false positives
 * 
 * @param text - Text to search
 * @returns Array of potential addresses found
 */
export function extractAddresses(text: string): string[] {
  if (!text) {
    return [];
  }
  
  const addresses: string[] = [];
  
  // Match sequences of 32-44 base58 characters
  // Word boundaries to avoid partial matches
  const words = text.split(/\s+/);
  
  for (const word of words) {
    // Remove common punctuation from ends
    const cleaned = word.replace(/^[^\w]+|[^\w]+$/g, "");
    
    if (isValidSolanaAddress(cleaned)) {
      addresses.push(cleaned);
    }
  }
  
  return addresses;
}

/**
 * Truncates an address for display
 * Format: HcUZx...R6ihX (first 5 and last 5 chars)
 * 
 * @param address - Full address
 * @param prefixLength - Characters to show at start (default: 5)
 * @param suffixLength - Characters to show at end (default: 5)
 * @returns Truncated address
 */
export function truncateAddress(
  address: string,
  prefixLength: number = 5,
  suffixLength: number = 5
): string {
  if (!address || address.length <= prefixLength + suffixLength) {
    return address;
  }
  
  const prefix = address.slice(0, prefixLength);
  const suffix = address.slice(-suffixLength);
  
  return `${prefix}...${suffix}`;
}

/**
 * Checks if the given text or element contains a Solana address
 * Used for context menu visibility
 */
export function containsSolanaAddress(text: string | null | undefined): boolean {
  if (!text) {
    return false;
  }
  
  return extractAddresses(text).length > 0;
}



