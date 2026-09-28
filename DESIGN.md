# DESIGN.md

Authored by the product owner (answers recorded verbatim from the direction interview, 2026-09-28). The agent only transcribed.

## Identity

- **Product:** PersonalTrack. Local-first journal, habits, and goals. Single user, data in the browser, no cloud.
- **What it should feel like:** "Quiet personal notebook." Calm, private, diary-like. Soft, paper feel, forgiving.

## Accent

- **One deliberate accent:** muted teal. Used sparingly at key moments: focal actions, streak and progress highlights, the wordmark period motif.
- No gradients. No glass. No added decoration. The notebook stays quiet.

## Copy voice

- **Tone:** "Brief and warm."
- Empty states and labels speak like a considerate page, not a marketing site.
  - Example target: "Nothing written today. The page is blank, not empty."
- Specific product words over generic UI filler. No hype, no buzzwords, no fake numbers.

## Theme

- System automatic (prefers-color-scheme), no manual toggle. Lightweight, zero JS, no flash. Both modes must pass contrast.

## Dials (antislop Part 3)

- ENERGY 1 / RHYTHM 1 / MOTION 1. Hover states only, predictable grid rhythm. Deliberate for a daily-use utility.

## Typography

- Geist Sans (already loaded via next/font), applied to body text. Geist Mono for the JSON import textarea. The reason: the fonts are already paid for in the bundle; the body must actually use them.

## Constraints that shape every UI change

- Polish only. No route, data-flow, or feature changes.
- Touch targets >= 44px. WCAG AA contrast in both modes. Keyboard paths for all pointer actions.
