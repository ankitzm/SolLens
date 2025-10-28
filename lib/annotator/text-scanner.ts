/**
 * Text Node Scanner
 * 
 * Scans text nodes for Solana addresses that aren't in links
 * Conservative approach to avoid false positives
 */

import { isValidSolanaAddress } from "~/lib/utils/address";

/**
 * Represents a found address in plain text
 */
export interface TextAddress {
  node: Text;
  address: string;
  startOffset: number;
  endOffset: number;
}

/**
 * Scans text nodes for Solana addresses
 * Conservative: only matches addresses that are isolated (not part of other text)
 */
export function scanTextNodesForAddresses(container: HTMLElement = document.body): TextAddress[] {
  const addresses: TextAddress[] = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip if inside a link (already handled by link scanner)
        if (node.parentElement?.tagName === 'A') {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip if inside blocklisted elements
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        // Import shouldSkipElement check
        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'pre', 'code'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip if already processed
        if (parent.hasAttribute('data-wna-text-processed')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip JSON/code display elements
        const className = parent.className || '';
        if (typeof className === 'string' && (className.includes('json') || className.includes('code'))) {
          return NodeFilter.FILTER_REJECT;
        }
        
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  let currentNode: Node | null;
  while ((currentNode = walker.nextNode())) {
    const textNode = currentNode as Text;
    const text = textNode.textContent || '';
    
    // Find all potential addresses in this text node
    const foundAddresses = findAddressesInText(text);
    
    for (const found of foundAddresses) {
      addresses.push({
        node: textNode,
        address: found.address,
        startOffset: found.start,
        endOffset: found.end,
      });
    }
  }
  
  return addresses;
}

/**
 * Find addresses in text using conservative pattern matching
 */
function findAddressesInText(text: string): Array<{ address: string; start: number; end: number }> {
  const results: Array<{ address: string; start: number; end: number }> = [];
  
  // Pattern 1: Full addresses (32-44 chars) with word boundaries
  const fullAddressPattern = /\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/g;
  
  let match;
  while ((match = fullAddressPattern.exec(text)) !== null) {
    const potentialAddress = match[1];
    
    // Validate it's a real Solana address
    if (isValidSolanaAddress(potentialAddress)) {
      results.push({
        address: potentialAddress,
        start: match.index,
        end: match.index + potentialAddress.length,
      });
    }
  }
  
  // Pattern 2: Truncated addresses like "7Jsih...YTZz8" (common in UI badges)
  // Format: 5+ chars ... 5+ chars
  const truncatedPattern = /([1-9A-HJ-NP-Za-km-z]{5,})\.\.\.([1-9A-HJ-NP-Za-km-z]{5,})/g;
  
  while ((match = truncatedPattern.exec(text)) !== null) {
    const prefix = match[1];
    const suffix = match[2];
    
    // Try to find matching full address from our known addresses
    // Store this for later matching in the annotation phase
    results.push({
      address: `${prefix}...${suffix}`, // Store as truncated for matching
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  
  return results;
}

/**
 * Annotates text addresses by wrapping them in styled spans
 */
export function annotateTextAddresses(
  textAddresses: TextAddress[],
  mappings: Map<string, any>
): number {
  let annotatedCount = 0;
  
  // Process in reverse order to maintain correct offsets
  const sortedAddresses = [...textAddresses].sort((a, b) => {
    if (a.node !== b.node) {
      return 0; // Different nodes, order doesn't matter
    }
    return b.startOffset - a.startOffset; // Same node, reverse order
  });
  
  // Group by text node
  const byNode = new Map<Text, TextAddress[]>();
  for (const addr of sortedAddresses) {
    if (!byNode.has(addr.node)) {
      byNode.set(addr.node, []);
    }
    byNode.get(addr.node)!.push(addr);
  }
  
  // Process each text node
  for (const [textNode, nodeAddresses] of byNode) {
    try {
      const replaced = replaceTextWithAnnotation(textNode, nodeAddresses, mappings);
      annotatedCount += replaced;
    } catch (error) {
      console.warn('[WNA] Failed to annotate text node:', error);
    }
  }
  
  return annotatedCount;
}

/**
 * Replace addresses in text node with annotated spans
 * Returns the number of addresses actually annotated
 */
function replaceTextWithAnnotation(
  textNode: Text,
  addresses: TextAddress[],
  mappings: Map<string, any>
): number {
  const parent = textNode.parentElement;
  if (!parent) return 0;
  
  const text = textNode.textContent || '';
  const fragment = document.createDocumentFragment();
  
  let lastIndex = 0;
  let annotatedCount = 0;
  
  // Sort addresses by position
  const sorted = [...addresses].sort((a, b) => a.startOffset - b.startOffset);
  
  for (const addr of sorted) {
    let mapping = mappings.get(addr.address);
    
    // If not found directly, try to match truncated addresses
    if (!mapping && addr.address.includes('...')) {
      // This is a truncated address like "7Jsih...YTZz8"
      // Try to find a matching full address in mappings
      const [prefix, suffix] = addr.address.split('...');
      for (const [fullAddr, map] of mappings) {
        if (fullAddr.startsWith(prefix) && fullAddr.endsWith(suffix)) {
          mapping = map;
          // Update address to full address for proper display
          addr.address = fullAddr;
          break;
        }
      }
    }
    
    if (!mapping) continue;
    
    // Add text before address
    if (addr.startOffset > lastIndex) {
      fragment.appendChild(
        document.createTextNode(text.substring(lastIndex, addr.startOffset))
      );
    }
    
    // Create annotated span for address
    const span = document.createElement('span');
    span.className = 'wna-address wna-text-address';
    span.setAttribute('data-wna-text-processed', 'true');
    span.setAttribute('data-wna-address', addr.address);
    span.setAttribute('data-wna-name', mapping.name);
    
    if (mapping.color) {
      span.style.setProperty('--wna-color', mapping.color);
    }
    
    // Format: "Name (HcUZx...R6ihX)"
    const truncated = `${addr.address.slice(0, 5)}...${addr.address.slice(-5)}`;
    span.textContent = `${mapping.name} (${truncated})`;
    
    span.title = `${mapping.name}\n${addr.address}${
      mapping.tags && mapping.tags.length > 0
        ? `\nTags: ${mapping.tags.join(', ')}`
        : ''
    }`;
    
    fragment.appendChild(span);
    
    lastIndex = addr.endOffset;
    annotatedCount++;
  }
  
  // Only replace if we actually annotated something
  if (annotatedCount > 0) {
    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }
    
    // Replace the text node with the fragment
    parent.replaceChild(fragment, textNode);
    parent.setAttribute('data-wna-text-processed', 'true');
  }
  
  return annotatedCount;
}

