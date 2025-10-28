/**
 * Address Annotator Module
 * 
 * Public API for scanning and annotating Solana addresses on web pages
 */

export { scanForAddressLinks, extractAddressFromHref, markAsProcessed, isProcessed, clearAllProcessedMarkers } from "./scanner";
export { annotateAddressLinks, unannotateLink, ANNOTATED_CLASS } from "./annotator";
export { scanTextNodesForAddresses, annotateTextAddresses } from "./text-scanner";
export type { AddressLink } from "./scanner";
export type { TextAddress } from "./text-scanner";

