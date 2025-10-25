# WNA — Solscan Wallet Namer

Locally name Solana wallet addresses on `solscan.io` and see names inline on the page. Built with WXT, Chrome MV3.

## Status
Planning and scaffolding in place. See `scope.md` for the phased plan and acceptance criteria.

## Features (v1)
- Inline replacement of visible Solscan addresses with saved names (links preserved)
- Right‑click context menu on Solscan to create/update names (with optional tag/color)
- Local-only storage, JSON import/export (lenient validation)
- Anchor-first detection, conservative text-node fallback
- SPA support via MutationObserver with debounced, chunked processing

## Development
- Requirements: Node 18+, pnpm
- Install: `pnpm install`
- Dev (Chrome): `pnpm dev`
- Build: `pnpm build`
- Zip: `pnpm zip`

The dev server will launch a Chromium-based browser as configured in `wxt.config.ts`.

## Privacy
- Local-only storage by default
- No external network calls, no analytics

## License
MIT
