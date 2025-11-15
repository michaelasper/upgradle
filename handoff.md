# Upgradle Handoff

_Last updated: 2024-02-14_

## Current Status
- ✅ Upgradle playable in browser with persistent save (localStorage), tiered upgrades, foundry lines, and heat-map hints.
- ✅ GitHub Pages deployment workflow committed (`.github/workflows/deploy.yml`).
- ✅ Tests in place (`src/hooks/useGameEngine.test.ts` via Vitest) to verify reducer ensures puzzle init and submission rules.
- ✅ Dictionary pruned of simple plurals; regenerate via `npm run dictionary`.

## Active Branch / Deploy
- Main branch: `main`
- Production build: GitHub Pages (actions deploy on push to main).

## Build & Dev Commands
- `npm run dev` – local Vite dev server.
- `npm run build` – type-check + build.
- `npm run test` – Vitest unit suite.
- `npm run dictionary` – regenerate word lists.

## Roadmap / Backlog
1. **Daily Challenge Mode** – “Word contract of the day” with streak rewards.
2. **Encounter Events** – bring back roguelike choices (windfalls vs. penalties).
3. **Advanced Upgrades** – new tier branches (automation, hint tuning, multiplier stacking).
4. **Persistence Enhancements** – optional cloud sync / import-export.
5. **Visual/Aural polish** – tile flip animations, sound cues, color-blind palettes.
6. **Analytics overlay** – show stats (avg guesses, upgrade mix).

## Known Issues / TODOs
- Keyboard highlight colors share heat-map classes; consider separate palette for clarity.
- No automated E2E tests; future agents should consider Playwright or Cypress.
- Deployment currently uses repo name for base path; verify custom domains if added.

## Tips for Next Session
- Modify upgrade/foundry data via `src/config/*.ts`; avoid hardcoding in UI.
- When touching dictionary or config, rerun `npm run dictionary` and `npm run build`.
- Hook logic lives in `useGameEngine`; add tests near reducer logic to avoid regressions.
