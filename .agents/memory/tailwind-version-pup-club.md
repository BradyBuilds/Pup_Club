---
name: Tailwind version in pup-club
description: pup-club uses Tailwind v3 (postcss approach), not the workspace catalog v4 — why and how.
---

The pup-club artifact pins `tailwindcss@^3.4.1` in its own `package.json` devDependencies, overriding the workspace catalog which has Tailwind v4.

**Why:** The DPCC v2 theme zip uses `@tailwind base/components/utilities` directives (v3 syntax) and a `tailwind.config.js` file (v3 config format). Tailwind v4 dropped both in favor of `@import "tailwindcss"` CSS syntax and CSS-based theme config.

**How to apply:**
- `artifacts/pup-club` uses `postcss.config.js` (with `tailwindcss` + `autoprefixer`) instead of `@tailwindcss/vite` plugin.
- `vite.config.ts` does NOT import or use `tailwindcss()` from `@tailwindcss/vite`.
- `tailwind.config.js` defines the custom DPCC color palette (gold, bg, surface, etc.) and fonts (Anton, Pacifico, DM Sans, JetBrains Mono).
- If you ever upgrade the theme, keep v3 OR migrate all CSS directives and config to v4 format at the same time.
