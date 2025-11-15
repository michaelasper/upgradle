# Upgradle

A forever Wordle economy bootstrap built with Vite, React, and TypeScript. Every guess in the puzzle mints new capital, every solved word feeds your treasury, and the upgrade market mutates the rules with longer words and alternate hint systems like hot/cold readouts. Because the game runs entirely in the browser, the same build works on macOS, Windows, or Linux.

## Getting started

```bash
npm install
npm run dev
```

Visit the printed local URL (defaults to <http://localhost:5173>) to play. Hot module reloading updates the running session as you tweak files in `src/`. The interface mirrors the traditional Wordle layout so it feels familiar on every platform.

## Gameplay loop

- **Guess to mint:** Enter a full word and submit. Every letter earns cash; finishing the word gives a hefty bonus.
- **Unlock longer puzzles:** Spend profits plus banked words on 6- and 7-letter challenges. These tiers demand dozens of completed words (and tier unlocks) before you can even buy them.
- **Mod the hint system:** Buy the Thermal Visor to replace Wordle colors with hot/cold tiles, or overclock the mint for flat bonuses per guess.
- **Build foundry lines:** Purchase idle generators with escalating upgrade paths to mint dollars every second—even while you ponder the next word.
- **Scale forever:** Words refresh endlessly, so you can keep optimizing payouts and experimenting with new mechanics.
- **Keyboard-native play:** Type directly into the grid—letters fill the row, Backspace deletes, and Enter submits your guess.
- **Get lucky streaks:** Green tiles pay double, and every guess has a 1% chance to auto-reveal a random slot.
- **Bank and spend words:** Solved words stockpile in a bank, and higher-tier upgrades actually consume those word tokens when purchased.
- **Go Hard Mode:** Unlock a late-tier upgrade that doubles every minted payout once you're ready for the brutal economy.

## Scripts

| Command           | Description                                   |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR            |
| `npm run build`   | Create a production build in `dist/`          |
| `npm run preview` | Preview the production build locally          |
| `npm run lint`    | Lint the project with the configured ESLint   |
| `npm run dictionary` | Regenerate the 5–7 letter snapshot from `word-list-json` |

## Project structure

- `src/App.tsx` – Upgradle’s reducer, upgrade logic, hint rendering, and UI.
- `src/dictionary.ts` – Filters the english dictionary from `word-list-json` down to 5–7 letter candidates.
- `src/App.css` / `src/index.css` – Theming for the neon factory interface.
- `vite.config.ts` – Vite configuration (kept close to the default).

Use this bootstrap as a starting point: expand the dictionary, wire up persistence, port it into a native shell (Tauri, Capacitor, etc.), or introduce entirely new upgrade paths without rewriting the core gameplay loop.
