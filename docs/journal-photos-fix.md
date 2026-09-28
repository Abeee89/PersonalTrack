# Journal "Add Photos" — Bug Report, Fix & QA Process

**Feature:** Add Photos button in the Journal (`/journal`) and entry detail (`/journal/[date]`) screens.
**Status:** Fixed and verified (unit 24/24, e2e 19/19 incl. real file-picker flow).
**App model:** Local-first — all data in browser `localStorage`; no server.

---

## 1. Symptom

The "Add Photos" button on the Journal screen was **not functional**:

- Clicking it on a day without a saved entry did **nothing** (no file picker).
- When a file *was* attached, the typed-but-unsaved title/content silently disappeared.
- Uploaded photos never appeared anywhere — there was no image preview on either screen.

## 2. Root cause — two layers

### Layer A: the broken implementation (code)

Four defects existed in the photo path:

| # | Defect | Location (broken version) |
|---|--------|---------------------------|
| 1 | File input and "Add Photos" button had `disabled={!editing}` — on a brand-new day (no entry saved yet) `editing` is false, so the click was swallowed and the native file picker never opened. | `src/app/journal/page.tsx` (button + input) |
| 2 | The original `handleAddPhoto` read the `FileList` into data-URLs but **never saved them** to the entry — it only pushed into a local array and re-set unrelated form state. Photos were lost on the spot. | original `journal/page.tsx` photo handler |
| 3 | After the first rewrite, saving a photo rebuilt the entry from **stored** values (`existing?.title` etc.) and ignored the live form state — typing text and then adding a photo **clobbered the draft**. | `handleAddPhotos` pre-fix |
| 4 | Client-side validation used `file.type.startsWith("image/")`, which **accepts SVG** (`image/svg+xml`). SVGs can carry scripts → stored-XSS risk; such files then silently vanished at the render sanitizer. | pre-fix validation |

### Layer B: the fix was never committed (process)

The code fix itself existed only as **uncommitted working-tree changes**:

- `HEAD` (`testing 1/3`) still contained `disabled={!editing}` and had no preview block.
- `tests/e2e/journal-photos.spec.ts` was untracked.

Consequence: any build/deploy made from the committed state shipped the **broken** feature — which is why the button "still" did not work when re-tested.

**Lesson:** a fix is not done until it is committed and verified from the committed state.

## 3. The fix (working tree, now committed)

All changes confined to the photo path — no other module touched.

### `src/app/journal/page.tsx`

1. **Button/input always enabled** — removed `disabled={!editing}` from the hidden file input and the "Add Photos" button (lines ~306-324), so the picker opens on a new entry too.
2. **Draft-preserving save** — `handleAddPhotos` (line 124) now persists the entry using the **current form state** (`title`, `content`, `mood`, parsed `tags` at lines 153-156) merged with existing photos; `id`/`createdAt` are kept from the stored entry when present.
3. **Safe validation** — file type is checked against `ALLOWED_IMAGE_MIME` (`image/png|jpeg|webp|gif`) from `src/lib/photos.ts` (line 132); per-file size cap `MAX_PHOTO_BYTES` = 2 MB (line 133); max 10 photos per entry (line 131). Invalid selections show an inline alert (line 137).
4. **Preview grid** — saved photos render as thumbnails, filtered through `isSafeImageSource` (line 283) so only whitelisted raster data-URLs ever reach an `<img>` tag.
5. **Mount loads today's entry** into the form so appending a photo to an existing day does not wipe its text.

### `src/app/journal/[date]/page.tsx`

6. **Preview grid added** to the detail screen (lines ~153-173), same `isSafeImageSource` gate — photos are now visible from dashboard deep-links too.

### Security notes

- **No new dependency.** `next/image` is intentionally not used: previews are `data:` URLs from `localStorage`, which `next/image` cannot optimize.
- CSP in `next.config.ts` allows `img-src 'self' data: blob:` — required for previews.
- Render path is XSS-safe by construction: `sanitizeStorageData` in `src/lib/db.ts` strips non-whitelisted photos on every read/write, and `isSafeImageSource` filters again at render.
- Quota-aware: saving photos through `writeData` throws a typed `StorageError` surfaced as a visible banner instead of a silent no-op.

## 4. Testing performed

### Unit (`npm test` — Vitest, 24 tests)

| Suite | Relevant coverage |
|-------|-------------------|
| `tests/unit/photos.test.ts` | MIME allowlist, SVG/`javascript:`/oversize rejection, 10-photo cap |
| `tests/unit/db.test.ts` | import sanitizer drops unsafe photos; quota hard-fail (`StorageError`) |
| `tests/unit/stats.test.ts` | streak math (regression guard) |

### E2E (`npx playwright test` — 19 tests, Chromium via system Chrome)

Photo suite: `tests/e2e/journal-photos.spec.ts`

| Test | What it proves |
|------|----------------|
| adds a photo to a brand-new entry + preview | Bug 1 & 4 fix; persists `data:image/png` and renders `<img>` |
| **real user flow: click Add Photos → filechooser event** | The actual user path (button opens native picker; `chooser.setFiles` round-trips) — not just `setInputFiles` injection |
| appends to existing entry | Bug 3 fix; stored title survives the photo save |
| preview renders on detail page | `[date]` screen shows thumbnails |
| rejects unsafe file type (SVG) | allowlist + user-visible alert + nothing persisted |

Full regression: journal (4), habits (3), goals (3), settings (4) all pass; `lint` 0 errors/0 warnings; `tsc --noEmit` clean; `next build` exit 0.

Commands to reproduce:

```bash
npm test                 # vitest units
npx playwright test      # e2e (auto-starts dev server on :3100)
npm run lint && npx tsc --noEmit && npm run build
```

## 5. Before / after

| Action | Before | After |
|--------|--------|-------|
| Click "Add Photos" on a new day | nothing happens | native file picker opens |
| Choose PNG/JPEG/WebP/GIF (≤2 MB) | never persisted | saved to entry, thumbnail preview shown |
| Choose SVG / >2 MB / non-image | silently accepted then hidden | rejected with visible alert, nothing saved |
| Add photo while typing a new title | draft wiped by stale stored values | draft preserved and saved with photo |
| View entry detail (`/journal/[date]`) | no photos ever shown | safe thumbnails rendered |

## 6. Known limitations (accepted, documented)

- Photos live as base64 in `localStorage` (~5 MB browser budget). Caps (2 MB/file, 10/entry) + the global storage-warning banner mitigate; heavy photo use should export backups and clear data.
- No photo delete UI yet (remove-photo = re-save entry with fewer photos; not exposed). Candidate for a follow-up ticket.
