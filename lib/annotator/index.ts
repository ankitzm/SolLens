/**
 * Address Annotator Module
 * 
 * Public API for scanning and annotating Solana addresses on web pages
 */

export { scanForAddressLinks, extractAddressFromHref, markAsProcessed, isProcessed, clearAllProcessedMarkers } from "./scanner";
export { annotateAddressLinks, unannotateLink, ANNOTATED_CLASS } from "./annotator";
export type { AddressLink } from "./scanner";

