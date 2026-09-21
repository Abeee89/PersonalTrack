# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journal.spec.ts >> Journal >> navigates to older dates via prev button
- Location: tests\e2e\journal.spec.ts:61:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.isDisabled: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByTitle('Earlier day')

```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - navigation [ref=f3e2]:
    - generic [ref=f3e3]:
      - generic [ref=f3e4]: PersonalTrack
      - link "Dashboard" [ref=f3e5] [cursor=pointer]:
        - /url: /
      - link "Journal" [ref=f3e12] [cursor=pointer]:
        - /url: /journal
      - link "Habits" [ref=f3e16] [cursor=pointer]:
        - /url: /habits
      - link "Goals" [ref=f3e21] [cursor=pointer]:
        - /url: /goals
      - link "Settings" [ref=f3e27] [cursor=pointer]:
        - /url: /settings
  - main [ref=f3e32]:
    - generic [ref=f3e33]:
      - generic [ref=f3e34]:
        - generic [ref=f3e35]:
          - button [ref=f3e36]
          - heading "Sunday, September 20, 2026" [level=1] [ref=f3e39]
        - generic [ref=f3e40]:
          - button "Save" [ref=f3e41]
          - button "Delete entry" [ref=f3e46]
      - generic [ref=f3e50]:
        - generic [ref=f3e51]:
          - text: Title
          - textbox "What's on your mind?" [ref=f3e52]
        - generic [ref=f3e53]:
          - text: Mood
          - generic [ref=f3e54]:
            - button "😢" [ref=f3e55]
            - button "😕" [ref=f3e56]
            - button "🙂" [ref=f3e57]
            - button "😊" [ref=f3e58]
            - button "🤩" [ref=f3e59]
        - generic [ref=f3e60]:
          - text: Content
          - textbox "Write your journal entry..." [ref=f3e61]
        - generic [ref=f3e62]:
          - text: Tags (comma separated)
          - textbox "e.g. work, health, gratitude" [ref=f3e63]
  - button "Open Next.js Dev Tools" [ref=f3e69] [cursor=pointer]
  - alert [ref=f3e73]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { clearData, seedData, STORAGE_KEY, emptyData } from "./helpers";
  3  | 
  4  | test.describe("Journal", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await clearData(page);
  7  |   });
  8  | 
  9  |   test("creates an entry and persists it", async ({ page }) => {
  10 |     await page.goto("/journal");
  11 |     const titleInput = page.getByPlaceholder("What's on your mind?");
  12 |     await titleInput.fill("My first entry");
  13 |     await page.getByPlaceholder("Write your journal entry...").fill("Content here.");
  14 |     await page.getByPlaceholder("e.g. work, health, gratitude").fill("work, health");
  15 |     await page.getByRole("button", { name: "Save", exact: true }).click();
  16 | 
  17 |     await expect(titleInput).toHaveValue("My first entry");
  18 | 
  19 |     const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
  20 |     const parsed = JSON.parse(raw as string);
  21 |     expect(parsed.journalEntries).toHaveLength(1);
  22 |     expect(parsed.journalEntries[0].title).toBe("My first entry");
  23 |     expect(parsed.journalEntries[0].tags).toEqual(["work", "health"]);
  24 |   });
  25 | 
  26 |   test("edits an existing entry in place without duplicating", async ({ page }) => {
  27 |     await page.goto("/journal");
  28 |     await page.getByPlaceholder("What's on your mind?").fill("First");
  29 |     await page.getByPlaceholder("Write your journal entry...").fill("Body");
  30 |     await page.getByRole("button", { name: "Save", exact: true }).click();
  31 | 
  32 |     await page.getByPlaceholder("What's on your mind?").fill("First (edited)");
  33 |     await page.getByRole("button", { name: "Save", exact: true }).click();
  34 | 
  35 |     const parsed = JSON.parse(
  36 |       (await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)) as string
  37 |     );
  38 |     expect(parsed.journalEntries).toHaveLength(1);
  39 |     expect(parsed.journalEntries[0].title).toBe("First (edited)");
  40 |   });
  41 | 
  42 |   test("deletes entry after confirm", async ({ page }) => {
  43 |     const today = new Date().toISOString().slice(0, 10);
  44 |     await seedData(page, {
  45 |       ...emptyData(),
  46 |       journalEntries: [
  47 |         { id: "j1", date: today, title: "To delete", content: "x", mood: 0, tags: [], photos: [], createdAt: "x", updatedAt: "x" },
  48 |       ],
  49 |     });
  50 |     await page.goto(`/journal/${today}`);
  51 |     page.once("dialog", (d) => d.accept());
  52 |     await page.getByRole("button", { name: "Delete", exact: true }).click();
  53 | 
  54 |     await page.waitForURL("/journal");
  55 |     const parsed = JSON.parse(
  56 |       (await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)) as string
  57 |     );
  58 |     expect(parsed.journalEntries).toHaveLength(0);
  59 |   });
  60 | 
  61 |   test("navigates to older dates via prev button", async ({ page }) => {
  62 |     const today = new Date();
  63 |     const older = new Date(today);
  64 |     older.setDate(older.getDate() - 40);
  65 |     const olderKey = older.toISOString().slice(0, 10);
  66 |     await seedData(page, {
  67 |       ...emptyData(),
  68 |       journalEntries: [
  69 |         { id: "old", date: olderKey, title: "Old entry", content: "x", mood: 2, tags: [], photos: [], createdAt: "x", updatedAt: "x" },
  70 |       ],
  71 |     });
  72 |     await page.goto(`/journal/${today.toISOString().slice(0, 10)}`);
  73 | 
  74 |     const prev = page.getByTitle("Earlier day");
  75 |     for (let i = 0; i < 60; i++) {
> 76 |       if (await prev.isDisabled()) break;
     |                      ^ Error: locator.isDisabled: Test timeout of 60000ms exceeded.
  77 |       await prev.click();
  78 |     }
  79 |     await expect(page.getByText("Old entry")).toBeVisible({ timeout: 5000 });
  80 |   });
  81 | });
```