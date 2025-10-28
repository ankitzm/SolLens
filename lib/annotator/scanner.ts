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
  
  console.log(`[WNA Scanner] Found ${anchors.length} total anchor tags`);
  
  let processedCount = 0;
  let invalidCount = 0;
  
  for (const anchor of anchors) {
    // Skip if already processed
    if (anchor.hasAttribute(PROCESSED_ATTR)) {
      processedCount++;
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
    } else if (anchor.href.includes("solscan.io")) {
      // Debug: log Solscan links that didn't match
      invalidCount++;
      if (invalidCount <= 3) {
        console.log(`[WNA Scanner] Solscan link not matched:`, anchor.href);
      }
    }
  }
  
  console.log(`[WNA Scanner] Results: ${links.length} valid, ${processedCount} already processed, ${invalidCount} unmatched Solscan links`);
  
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

/**
 * Clears all processed markers from the page
 * Use before re-scanning to pick up new names
 */
export function clearAllProcessedMarkers(container: HTMLElement = document.body): void {
  const processedElements = container.querySelectorAll(`[${PROCESSED_ATTR}]`);
  console.log(`[WNA Scanner] Clearing ${processedElements.length} processed markers`);
  processedElements.forEach(el => el.removeAttribute(PROCESSED_ATTR));
}

