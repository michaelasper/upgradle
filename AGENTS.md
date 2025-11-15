# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the TypeScript React app. Key modules: `hooks/useGameEngine.ts` (state machine), `config/` (upgrade and generator catalogs), `constants.ts`, `utils/gameMath.ts`, and presentational components in `App.tsx`.
- `src/data/dictionary.json` stores the curated 5–7 letter word lists consumed at runtime; regenerate via `npm run dictionary`.
- Styles live in `src/App.css`; assets go under `public/` when needed.

## Build, Test, and Development Commands
- `npm run dev` – starts the Vite dev server with hot reload.
- `npm run build` – type-checks (`tsc -b`) and builds production bundles.
- `npm run preview` – serves the build output locally.
- `npm run lint` – runs the configured ESLint rules.
- `npm run dictionary` – rebuilds `src/data/dictionary.json` from `word-list-json`.

## Coding Style & Naming Conventions
- TypeScript + React with functional components and hooks; prefer `useGameEngine` for shared logic.
- Use 2-space indentation, semicolons omitted per current files.
- Keep module-specific data (config/constants) out of `App.tsx`; add new utilities under `src/utils/`.
- ESLint (see `eslint.config.js`) enforces language rules—run `npm run lint` before commits.

## Testing Guidelines
- Automated tests are not yet defined. When adding tests, co-locate them near the module (e.g., `src/hooks/__tests__/useGameEngine.test.ts`) and document the command in `package.json`.
- Aim for coverage of reducer logic, upgrade cost math, and keyboard state derivation.

## Commit & Pull Request Guidelines
- Follow present tense, descriptive commits (examples in history: “Add keyboard state handling”). Group related changes instead of multitopic commits.
- Pull requests should include: summary of behavior, steps to verify (`npm run build`, `npm run dictionary` if touched), screenshots/GIFs for UI updates, and references to issues when applicable.
- Ensure CI (build + lint) passes before requesting review.

## Agent-Specific Tips
- When modifying dictionary or config files, rerun `npm run dictionary`/`npm run build` to keep artifacts current.
- Respect the modular layout: extend `config/`, `constants.ts`, or `useGameEngine` rather than injecting logic into UI components.
