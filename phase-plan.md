## WNA — Phase-wise Build Plan

This document breaks the product into small, shippable chunks. Each phase has clear goals, deliverables, acceptance criteria, and an exit checklist. Build strictly in order; avoid scope creep.

### Phase 0 — Baseline & Metadata
- Goals
  - Ensure WXT project can run, build, and zip for Chrome.
  - Align metadata and permissions to Solscan-only.
- Deliverables
  - Verified `wxt.config.ts` for Chrome dev.
  - Manifest fields (name: "wna"), permissions: `contextMenus`, `storage`, `activeTab`, host: `https://solscan.io/*`.
- Acceptance
  - `pnpm dev` launches extension; no boot-time console errors.
  - Minimal README and `scope.md` present (done).
- Exit check
  - Dev session opens Chrome; extension is installable and enabled.

### Phase 1 — Storage Module & Schema
- Goals
  - Local storage wrapper for mappings and settings with schema validation (lenient), in-memory cache.
- Deliverables
  - Storage functions: get/save/delete mapping, list/search, import/export JSON.
  - Schema validation with warnings (non-blocking on unknown fields).
- Acceptance
  - CRUD works across reloads; timestamps set/updated.
  - Import/export round-trip preserves data.
- Exit check
  - Sample dataset loads and exports without loss.

### Phase 2 — Context Menu & Naming Flow
- Goals
  - Show context menu on Solscan; enabled on valid address, disabled otherwise.
  - Naming UI to create/update name, tags, color with overwrite behavior (last-write-wins).
- Deliverables
  - Context menu registration and click handler.
  - Naming UI (modal/popup) with prefilled address.
- Acceptance
  - Right-click on address opens UI with address filled; save persists and confirms.
  - Re-opening shows prior values; edits save correctly.
- Exit check
  - Menu visible only on Solscan; disabled state when target isn’t a valid base58 address.

### Phase 3 — Content Script (Anchor-first Inline Replacement)
- Goals
  - Detect anchors with `/address/<pubkey>` and replace visible text inline with `<name> (HcUZx...R6ihX1Z)`.
- Deliverables
  - Anchor scanner and annotator; minimal CSS; dedupe via data attributes.
- Acceptance
  - Known addresses render with names on initial load; links remain intact.
  - No noticeable layout breakage on key Solscan pages.
- Exit check
  - Manual test on account, tx, and token pages passes.

### Phase 4 — SPA Support & Fallback Detection
- Goals
  - Handle dynamic content and non-anchor occurrences conservatively.
- Deliverables
  - MutationObserver with debounce and `requestIdleCallback` chunking.
  - Text-node scanner with strict base58 heuristic; context blocklist for noisy regions.
- Acceptance
  - Annotations appear after SPA route changes within acceptable latency on low-end devices.
  - No obvious false positives in typical views.
- Exit check
  - Scroll and navigate through Solscan app views without jank or console errors.

### Phase 5 — Options Page (Management)
- Goals
  - Manage mappings: list, search, single edit/delete; tag/color filters; import/export.
- Deliverables
  - Options UI with table/list, search input, tag/color filters, import/export controls.
- Acceptance
  - CRUD works from options; filters behave as expected.
  - Import/export from UI with validation feedback.
- Exit check
  - Edge cases: empty state, large lists (>500 entries) still responsive.

### Phase 6 — UX Polish & Stability
- Goals
  - Improve clarity and resilience without feature creep.
- Deliverables
  - Tooltips on inline names, clear overwrite messaging, error toasts for failed operations.
  - Performance tuning: batch DOM writes; measure and mitigate layout shifts.
- Acceptance
  - Zero critical console errors across key flows.
  - Subjective performance acceptable on low-end hardware.
- Exit check
  - Dev checklist satisfied; docs updated.

### Phase 7 — Docs, License, and Packaging
- Goals
  - Prepare for store submission and team handoff.
- Deliverables
  - README (updated), scope.md, phase-plan.md, MIT license, privacy note (local-only storage).
  - Build artifacts zipped via `pnpm zip`.
- Acceptance
  - Zip passes basic validation; metadata matches docs.
- Exit check
  - Ready to proceed to distribution when icons/branding are available.

---

## Cross-phase quality bars
- Minimal permissions; Solscan-only host permissions.
- No network calls, no telemetry.
- Inline replacement preserves link targets.
- Debounced and chunked DOM processing to ensure responsiveness.

## Out-of-scope for v1
- Multi-site support, batch ops, per-page toggle, cloud sync, Firefox/Edge distribution.

## Next step
Proceed with Phase 0 verification and Phase 1 storage module implementation planning (no code yet).
