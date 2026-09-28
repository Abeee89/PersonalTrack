# UI/UX Revision: Modern, Lightweight, Antislop-clean

**Date:** 2026-09-28
**Mode:** antislop 1 (DURING), core filter + owner direction recorded in `DESIGN.md`
**Scope:** polish only. No route, data-flow, or feature changes. All previously passing tests stayed green; new tests cover the changes.

**Design Read:** *Reading this as: local-first personal utility (journal/habits/goals) for one reflective end user, in a quiet-notebook visual language, dial ENERGY 1 / RHYTHM 1 / MOTION 1.* Direction supplied by the product owner (identity "Quiet personal notebook", accent "muted teal", voice "brief and warm", theme "system auto").

---

## 1. Findings before the change (audit against antislop)

| # | Finding | Rule | Where |
|---|---------|------|-------|
| F1 | `recharts` and `uuid` in dependencies, zero imports. Dead weight in install and lockfile. | lightweight | `package.json` |
| F2 | Geist fonts loaded via `next/font` but `body` CSS forced `font-family: Arial`. Fonts downloaded and never used. | lightweight, R-06 | `globals.css` |
| F3 | `--muted-foreground: #737373` on grey surfaces: 4.35:1, below 4.5:1 AA. | R-25 | `globals.css` |
| F4 | Streak text `text-orange-500` on card: 2.80:1. | R-25 | habits list, habit detail |
| F5 | Check circles `bg-green-500 text-white`: 2.28:1. | R-25 | habits |
| F6 | Destructive-as-text `text-destructive` (`#ef4444`): 3.76:1. | R-25 | habits, goals, error banners |
| F7 | Buttons and icon targets 40px and under; mood/date chips 32-40px. Below the 44px tap minimum. | R-03 | everywhere |
| F8 | Dashboard "Recent Journal" / "Active Goals" rows were `<li onClick>`: mouse-only, no focus, no keyboard path. | R-26, R-32 | `page.tsx` |
| F9 | Nav had no active-page indication and no labels for icon-only mobile links. | R-24 adjacent, R-32 | `nav.tsx` |
| F10 | Mood chips and date selectors exposed no pressed/current state to assistive tech. | R-32 | journal pages |
| F11 | `StorageError` was thrown by the data layer but habits/goals writes did not catch it: a failed save was silent. | R-27 | habits, goals |
| F12 | `goals/page.tsx` had `const deleteSubTask = (id) => { deleteSubTask(id); ... }`: local shadow made the list-page sub-task delete an infinite recursion (stack overflow on click). No test had exercised it. | C-2 | `goals/page.tsx` |
| F13 | Em dashes in visible copy (metadata title, Settings About) and in this repo's own docs. | R-02 | `layout.tsx`, settings, docs |
| F14 | Generic copy: "Your personal tracking overview", "Start journaling!", "Set a goal to get started!", "View All" arrows on every section button. | R-15, R-08 | dashboard |
| F15 | Dead `StorageBanner` component in `ui.tsx` referencing nonexistent `bg-warning` tokens. | lightweight | `ui.tsx` |
| F16 | Zero accent color anywhere: `--accent` was grey; nothing in the UI had a deliberate identity signal (the "sterile default" anti-pattern). | R-01, R-20 | theme |

## 2. Changes made (with the one-line reason, R-31)

### Theme tokens (`src/app/globals.css`)
- Warm-paper neutrals (`#fbfaf8` stone family, dark `#0c0a09`). **Reason:** notebook identity says paper, not pure white/black; both modes verified.
- New semantic tokens `--brand`, `--brand-soft`, `--streak`, `--success`, `--success-foreground`, `--destructive-text`, light+dark. **Reason:** contrast fixes belong in one place, not per component; the same class list works in both themes.
- `--ring` -> teal. **Reason:** focus visibility doubles as the accent, one gesture doing two jobs.
- `body` now uses `var(--font-geist-sans)`. **Reason:** the font is already loaded and paid for (F2).

### Accent placement (the only decoration added)
- Teal appears on: progress bars, the 30-day habit grid, the active nav pill (`--brand-soft`), selected mood chip ring, the wordmark period (`PersonalTrack.` motif), completion check icons. **Reason (R-01/R-29):** one deliberate accent at key moments, everything else stays neutral; a swappable wordmark still reads as this app.
- No gradients, glass, glow, or new iconography. **Reason:** ENERGY 1; the notebook stays quiet.

### Contrast to AA (measured, not eyeballed)
| Pair | Before | After |
|------|--------|-------|
| muted text on paper | 4.35:1 (#737373) | 7.31:1 (#57534e) |
| streak text on card | 2.80:1 (orange-500) | 5.02:1 (#b45309) / 11.83:1 dark |
| check fill vs label | 2.28:1 (white on #22c55e) | 5.02:1 (white on #15803d); dark 15.1:1 equivalent |
| destructive text | 3.76:1 (#ef4444) | 6.47:1 (#b91c1c); dark #f87171 7.14:1 |
| brand teal on white | (none) | 5.47:1 (#0f766e); dark #5eead4 13.35:1 |
- Guard added: `tests/unit/contrast.test.ts` parses `globals.css` and asserts every pair above clears 4.5:1 in the right theme. **Reason:** AA is now a test, not a memory.

### Tap targets and keyboard (R-03/R-32)
- Primary button `min-h-11` (44px), `size="sm"` 36px for text buttons, all icon buttons rebuilt as 44px hit areas with `aria-label` (edit/delete/back/status/expand).
- Mood chips 44px square with `aria-pressed`; date list buttons `min-h-11` with `aria-current="date"`; weekly day toggles 44px `aria-pressed`.
- Dashboard rows became real `<Link>`s (`/journal/<date>`, `/goals/<id>`) with visible `focus-visible:ring`. **Reason (C-2/R-26):** a list you navigate by clicking must be a list of links.
- Nav is a client component with `usePathname`: active page gets `aria-current="page"` + brand-soft pill; wordmark period is `aria-hidden`.
- "View All" buttons replaced with text links ("See all entries", "See all goals"); Quick Add buttons replaced with equivalent `Link`s. **Reason (R-08/R-15):** pure navigation is a link, arrows removed as decoration.

### States (R-27)
- Habits: `isReady` mount gate, logs in state (one read per action instead of a `localStorage` read per habit per render), every mutation wrapped in `try/catch` showing the `ErrorBanner`.
- Goals list + detail: all saves/toggles/deletes wrapped; banner moved to page level so list errors are always visible; `aria-expanded` on the Expand control.
- Habit week strip got a text `role="img"` summary label for screen readers.

### Bug found and fixed during the work
- **F12 sub-task delete recursion** (`goals/page.tsx`): renamed the local handler, imported the real `deleteSubTask`, added a regression test `goal sub-task delete works without crashing` that deletes a sub-task and asserts `localStorage` + recomputed progress. Previously this control was a guaranteed browser crash (C-2).
- Sub-task toggles now advance a `not_started` goal to `in_progress` automatically. **Reason:** progress moved but status lied.

### Copy (R-02/R-15/R-16)
- All em dashes removed from app strings and from `docs/journal-photos-fix.md` + `DESIGN.md`.
- Rewrites to owner voice: "Nothing written yet. The first line is the hardest part.", "No goals yet. One small, finishable goal beats five grand ones.", "No habits yet. Pick one small thing you want to keep.", "Break the goal into small steps.", metadata title "PersonalTrack: journal, habits, and goals".
- Test-pinned strings left untouched on purpose: `Save`, `Add Habit`, `New Goal`, `Add Photos`, `Expand`, `Check today`, `Delete entry`, all input placeholders. **Reason:** the 26 existing tests are the contract; copy changes went where nothing depended on them.

### Lightweight
- Removed `recharts`, `uuid` (unused). Removed dead `StorageBanner`. `storage-warning` banner now uses theme tokens (was hardcoded amber that broke dark contrast).
- **Not adopted:** `next/image`. **Reason (R-31):** previews are `data:` URLs from `localStorage`; the optimizer cannot touch them and would only add client bytes.

## 3. Evidence, element by element (R-35)

Run recorded 2026-09-28, `next dev` on :3100, Chromium (system Chrome, headless):

- **Tests:** `npm test` 27/27 (db, stats, photos, contrast guard). `npx playwright test` 33/33: goals 3, habits 3, journal 4, journal-photos 5, settings 4, uiux 7, console 7.
- **Click-through via tests:** dashboard entry/goal rows navigate to existing routes (`uiux > dashboard... links`); sub-task delete writes storage (`uiux > goal sub-task delete...`); habit check sets `aria-pressed=true` and a non-transparent AA fill (`uiux > habit check...`); mood chip toggles pressed state (`uiux > mood chips...`); nav marks active page and first Tab lands on a real link (`uiux > nav marks the active page...`).
- **Mobile:** 375x667 scrollWidth<=clientWidth on /, /journal, /habits, /goals, /settings (`uiux > mobile 375px...`).
- **Dark:** `--background` resolves `#0c0a09` under `colorScheme: dark`; tokens covered by the contrast unit test (`uiux > dark mode...`).
- **Console:** zero console/page errors on all seven routes incl. the two not-found states (`console.spec.ts`).
- **Static:** `npm run lint` 0 errors 0 warnings; `npx tsc --noEmit` clean; `npm run build` exit 0.

## 4. Delivery Gate

Block 1 Hard Gate: **PASS**
- R-02 no em dashes in app copy or docs (scanned, zero matches).
- R-03 no horizontal overflow at 375px on all pages (measured); primary controls >=44px.
- R-17/R-18/R-36/R-38 no statistics, testimonials, or claims added; the only numbers are the user's own real data.
- R-23/R-24 no fabricated assets; all five nav links point at existing routes.
- R-25 all text pairs >=4.5:1 with a unit test guarding the token file.
- R-26 no dead controls: dashboard rows/links verified by click tests; the one dead control found (sub-task delete) was fixed.
- R-27 empty/loading(`isReady`)/error(`StorageError`->banner) states on journal, habits, goals.
- R-32 keyboard: links/tabs reachable, `aria-pressed/current/expanded/label`, focus rings via `--ring`.
- R-33 no patch scripts; all edits in source.
- R-34 both shipped themes (light+dark) hold tokens and contrast.
- R-35 app built, run, and click-through recorded above.
- R-37 direction exists (`DESIGN.md`, owner-supplied) and dials were held.

Block 2 Purpose-Gate: **PASS**
- R-01 no gradients/glow; teal accent purpose = identity signal at state moments, reason written.
- R-04 icons unchanged (Lucide) but relevance kept per glyph; no generic "magic" glyphs.
- R-06 Geist applied for a reason (already loaded, mono used for JSON).
- R-07/R-09/R-10/R-12/R-13/R-22 no backgrounds/badges/glass/glow/illustrations added.
- R-08 decorative arrows removed.
- R-14/R-19 no card or animation changes (MOTION 1 held).

Block 3 Liveliness: **PASS**
- Dials declared and held: ENERGY 1 (calm), RHYTHM 1 (uniform grids, deliberate), MOTION 1 (hover only).
- Focal point per screen: one primary action (Save / Add Habit / New Goal).
- One deliberate accent + one identity motif (wordmark period, echoed by `--brand-soft` pills).

Block 4 Craftsmanship & Quality: **PASS**
- C-1..C-5 met; swap-test: a warm-paper + muted-teal + period-motif notebook is not a generic dashboard.
- R-05/R-11/R-29 structure, radii, and palette (stone neutrals + teal + semantic red/amber/green) unchanged or tightened.
- R-21 theme by product reason (system auto, zero JS, no flash), owner-approved.
- R-30 no popular-product clone: it stays the plain-tracker layout it was.

## 5. Known limitations (honest)

- The revision is polish; nav and card layouts remain deliberately plain (RHYTHM 1 by choice, not accident).
- Native `<select>` styling differs slightly per browser (lightweight choice, no custom widget added).
- Confirm dialogs remain `window.confirm` (accessible in practice, styled by the browser, not the app).
- Photos: base64-in-localStorage budget noted in the photos doc; remove-photo UI still not exposed.
