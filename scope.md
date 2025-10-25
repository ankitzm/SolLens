## WNA — Solscan Wallet Namer (Planning & Scope)

### Product overview
WNA is a Chrome extension that lets users locally name Solana wallet addresses on `solscan.io`. It detects addresses on Solscan pages and replaces the visible address text inline with the user-defined name, preserving links and native UX. Names are stored locally; no servers or external calls.

### Goals (v1)
- Replace visible Solscan addresses inline with the saved name while preserving anchor `href` and behaviors.
- Right‑click context menu on Solscan addresses to create/update a name (with optional tag and color).
- Local-only storage using browser storage; import/export JSON with validation (non-blocking).
- Robust detection: anchor-based first, conservative text-node fallback.
- Work reliably on SPA pages; performant on low-end machines.

### Non-goals (v1)
- Non-Solscan sites.
- Cloud sync or encryption.
- Batch operations (single-item edits only).
- Per-page disable toggle.
- Firefox/Edge distribution (consider in later phases).

### Target and compatibility
- Browser: Chrome (Chromium family acceptable during dev; ship for Chrome first).
- Sites: `https://solscan.io/*` (all pages).
- Manifest: MV3 (via WXT tooling).

### Permissions
- Required: `contextMenus`, `storage`, `activeTab`, `scripting` (as required by WXT), `host_permissions`: `https://solscan.io/*`.
- No `<all_urls>`.

### Data model (local storage)
- Keyed by full base58 public key (exact match, no normalization).
- Name is required; tags and color optional (used as filters).

```json
{
  "mappings": {
    "HcUZx9A...R6ihX1Z": {
      "name": "ProtocolA: FeeWallet",
      "tags": ["protocol-a","fee"],
      "color": "#FF7A59",
      "created_at": 1690000000000,
      "updated_at": 1690000100000
    }
  },
  "settings": {
    "replace_mode": "inline",
    "domains_enabled": ["solscan.io"]
  }
}
```

Constraints:
- Last-write-wins when renaming the same address.
- Import/export validates schema (lenient: warns on unknown fields, proceeds when safe).

### UX flows
- Right-click on address (anchor or valid base58 selection on Solscan): open naming UI populated with detected address; allow name, tag(s), color; save.
- On-page: detected addresses are shown as `<name> (HcUZx...R6ihX1Z)` inline or equivalent inline replacement; hover shows full address and mapping details; links remain intact.
- Options/popup: list, search, create/edit/delete single mapping; import/export JSON; basic filters by tag/color.
- Context menu visibility: shown on Solscan pages; disabled state if right-click target is not a valid base58 address.

### Detection strategy
- Whitelist hostnames: `solscan.io` only.
- Preferred: anchors with `href` containing `/address/<pubkey>`.
- Fallback: conservative text-node scan using base58 regex and expected length range; avoid noisy contexts.
- SPA support: `MutationObserver` with debounced scans; chunked processing and `requestIdleCallback` to avoid jank.

### Architecture (high level)
- Background (service worker):
  - Register context menu on install/update.
  - Handle context-menu clicks and open naming UI.
  - Mediate storage access if needed.
- Content script (Solscan only):
  - Initial scan on load; annotate anchors; fallback scan for text nodes (conservative).
  - Observe DOM mutations; dedupe processed nodes via data attributes.
  - Inject minimal CSS for inline styling/badges if needed.
  - Send edit/open messages upon badge click (if implemented).
- UI surfaces:
  - Popup: quick access to recent/edited addresses (optional in v1 if options page suffices).
  - Options page: CRUD, search, filter, import/export.
- Storage module:
  - Wrapper around `chrome.storage.local` with in-memory cache for reads; batched writes; schema validation.

### Performance guidelines
- Debounce mutation handling (≥200–500ms depending on added node count).
- Prefer selector-based anchor queries before text scans.
- Process in chunks with `requestIdleCallback` to keep main thread responsive.
- Avoid reflows by batching DOM writes (DocumentFragment) and marking processed nodes (`data-wna` attribute).

### Security & privacy
- No network calls; no keys/private info.
- Minimal permissions; Solscan host only.
- Clear privacy statement in README/options: local-only by default.

### Accessibility & i18n
- English only in v1.
- Basic focus states and ARIA for options/popup controls.

### Testing strategy
- v1: Manual verification across key Solscan pages (account, tx, token transfer, DeFi views, logs).
- Post‑v1: add unit tests for storage and schema; later add Playwright against saved fixtures.

---

## Phased plan

### Phase 0 — Project setup (WXT baseline hygiene)
- Verify WXT config aligns with Chrome + Solscan host permissions and extension naming.
- Set extension metadata (name: "wna"), privacy notes, and license references.
- Acceptance:
  - Dev build runs; extension loads in Chrome; no console errors at boot.

### Phase 1 — Storage and data schema
- Implement storage wrapper for `chrome.storage.local` with simple cache and schema validation.
- Import/export JSON (lenient validation; warnings surfaced in UI).
- Acceptance:
  - Create, read, update, delete a mapping persistently.
  - Import/export roundtrips a sample JSON without data loss.

### Phase 2 — Context menu and naming UI
- Context menu registered on Solscan; menu enabled on valid address target, disabled otherwise.
- Naming UI flow with prefilled address; supports name, tag(s), color; overwrite existing mapping.
- Acceptance:
  - Right-click on address opens UI; save persists and shows confirmation.
  - Re-open shows existing values and saves updates (last-write-wins).

### Phase 3 — Content script: anchor-first annotation
- Detect anchors with `/address/<pubkey>` and replace visible text inline with `<name> (truncated address)` while preserving links and events.
- Inject lightweight styles for inline presentation; tooltip shows details.
- Acceptance:
  - Known addresses are annotated on initial load across target Solscan pages.
  - Links remain fully functional; no layout breakage.

### Phase 4 — SPA support and fallback detection
- Add `MutationObserver` with debounce and chunked processing using `requestIdleCallback`.
- Add conservative text-node fallback scanning for non-anchor appearances.
- Acceptance:
  - Dynamic content (navigations/loads) is annotated within budget; CPU usage remains low on low-end hardware.
  - False positives are not observed in typical Solscan views.

### Phase 5 — Options page (management)
- List, search, edit, delete single mapping; tag/color used as filters.
- Import/export controls with feedback and schema validation warnings.
- Acceptance:
  - User can manage mappings end-to-end from options.
  - Filters by tag/color work as expected.

### Phase 6 — Polish & readiness
- UX refinements (tooltips, hover states), empty states, error toasts.
- Documentation updates (README, privacy statement), MIT license.
- Acceptance:
  - Zero console errors during typical usage across key Solscan pages.
  - Documentation aligns with actual behavior; build artifacts pass store pre-checks.

---

## Acceptance criteria (v1 overall)
- Addresses with saved names appear as inline replacements across Solscan pages with preserved link targets.
- Right‑click naming works reliably on Solscan addresses and shows disabled state when inappropriate.
- Local-only storage; JSON import/export works with lenient validation.
- SPA updates are handled within acceptable latency without noticeable page lag.
- No network calls; minimal permissions; no link breakage; no significant console warnings.

## Risks & mitigations
- Solscan DOM changes/obfuscation: rely on URL patterns (`/address/<pubkey>`) and selective, conservative text scans.
- Performance on large/SPA pages: debounce, chunked processing, `requestIdleCallback`, processed-node dedupe.
- False positives from text scan: conservative regex, scope to Solscan content regions, avoid code blocks/logs when noisy.
- User confusion if multiple names for same address: last-write-wins + clear overwrite messaging.
- Visual regressions: prefer inline replacements with minimal CSS; avoid layout shifts by measuring before replace.

## Metrics (qualitative for v1)
- Annotate ≥95% of address instances on key Solscan pages without breaking links.
- Zero critical console errors in normal navigation flows.
- Subjective performance acceptable on low-end devices (no noticeable jank during navigation/scroll).
