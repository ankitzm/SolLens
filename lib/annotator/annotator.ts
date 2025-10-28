/**
 * Address Annotator
 * 
 * Replaces visible address text with saved names
 */

import { truncateAddress } from "~/lib/utils/address";
import { AddressMapping } from "~/lib/storage";
import { AddressLink, markAsProcessed } from "./scanner";

/**
 * CSS class for annotated addresses
 */
export const ANNOTATED_CLASS = "wna-address";

/**
 * Annotates address links with saved names
 * Format: <Name> (HcUZx...R6ihX)
 * 
 * @param links - Array of address links to annotate
 * @param mappings - Map of address to mapping data
 */
export function annotateAddressLinks(
  links: AddressLink[],
  mappings: Map<string, AddressMapping>
): void {
  let annotatedCount = 0;
  
  for (const link of links) {
    const mapping = mappings.get(link.address);
    
    if (mapping) {
      annotateLink(link, mapping);
      annotatedCount++;
    }
    
    // Mark as processed even if no mapping (to avoid re-scanning)
    markAsProcessed(link.element);
  }
  
  console.log(`[WNA Annotator] Annotated ${annotatedCount} out of ${links.length} links`);
}

/**
 * Annotates a single link with the saved name
 */
function annotateLink(link: AddressLink, mapping: AddressMapping): void {
  const { element, address } = link;
  
  // Create the display text: "Name (HcUZx...R6ihX)"
  const truncated = truncateAddress(address, 5, 5);
  const displayText = `${mapping.name} (${truncated})`;
  
  // Replace the text content
  element.textContent = displayText;
  
  // Add CSS class for styling
  element.classList.add(ANNOTATED_CLASS);
  
  // Add data attribute with full address for tooltip/reference
  element.setAttribute("data-wna-address", address);
  element.setAttribute("data-wna-name", mapping.name);
  
  // Add color if specified
  if (mapping.color) {
    element.style.setProperty("--wna-color", mapping.color);
  }
  
  // Add title for hover tooltip
  element.title = `${mapping.name}\n${address}${
    mapping.tags && mapping.tags.length > 0
      ? `\nTags: ${mapping.tags.join(", ")}`
      : ""
  }`;
}

/**
 * Removes annotation from a link (resets to original state)
 * Useful for updates or removals
 */
export function unannotateLink(element: HTMLAnchorElement): void {
  element.classList.remove(ANNOTATED_CLASS);
  element.removeAttribute("data-wna-address");
  element.removeAttribute("data-wna-name");
  element.removeAttribute("data-wna-processed");
  element.style.removeProperty("--wna-color");
  element.title = "";
}

