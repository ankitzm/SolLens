/**
 * Address Scanner
 * 
 * Scans the DOM for Solana address links and prepares them for annotation
 */

import { isValidSolanaAddress } from "~/lib/utils/address";

/**
 * Data attribute to mark processed anchors
 */
export const PROCESSED_ATTR = "data-wna-processed";

/**
 * Represents a found address link
 */
export interface AddressLink {
  element: HTMLAnchorElement;
  address: string;
  originalText: string;
}

/**
 * Scans for anchor elements containing Solana addresses
 * Looks for patterns like /account/<address>, /address/<address>, /token/<address>
 * 
 * @param container - Root element to scan (default: document.body)
 * @returns Array of found address links
 */
export function scanForAddressLinks(container: HTMLElement = document.body): AddressLink[] {
  const links: AddressLink[] = [];
  
  // Find all anchor tags
  const anchors = container.querySelectorAll<HTMLAnchorElement>('a[href]');
  
  for (const anchor of anchors) {
    // Skip if already processed
    if (anchor.hasAttribute(PROCESSED_ATTR)) {
      continue;
    }
    
    // Extract address from href
    const address = extractAddressFromHref(anchor.href);
    
    if (address && isValidSolanaAddress(address)) {
      links.push({
        element: anchor,
        address,
        originalText: anchor.textContent || "",
      });
    }
  }
  
  return links;
}

/**
 * Extracts Solana address from a URL
 * Matches patterns: /account/<address>, /address/<address>, /token/<address>
 */
export function extractAddressFromHref(href: string): string | null {
  if (!href) {
    return null;
  }
  
  // Match Solscan patterns
  const match = href.match(/\/(account|address|token)\/([A-Za-z0-9]{32,44})(?:[?#/]|$)/);
  
  if (match && match[2]) {
    return match[2];
  }
  
  return null;
}

/**
 * Marks an element as processed to avoid re-processing
 */
export function markAsProcessed(element: HTMLElement): void {
  element.setAttribute(PROCESSED_ATTR, "true");
}

/**
 * Checks if an element has been processed
 */
export function isProcessed(element: HTMLElement): boolean {
  return element.hasAttribute(PROCESSED_ATTR);
}

