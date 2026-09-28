import { test, expect } from "@playwright/test";
import { clearData, seedData, STORAGE_KEY, emptyData } from "./helpers";

// 1x1 transparent PNG
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const pngBuffer = Buffer.from(PNG_BASE64, "base64");

test.describe("Journal photos", () => {
  test.beforeEach(async ({ page }) => {
    await clearData(page);
  });

  test("adds a photo to a brand-new entry and shows preview", async ({ page }) => {
    await page.goto("/journal");
    await page.getByPlaceholder("What's on your mind?").fill("Photo draft");
    await page.getByPlaceholder("Write your journal entry...").fill("With an image");

    await page.locator('input[type="file"]').setInputFiles({
      name: "shot.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    await expect(async () => {
      const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
      const parsed = JSON.parse(raw as string);
      expect(parsed.journalEntries).toHaveLength(1);
      expect(parsed.journalEntries[0].photos).toHaveLength(1);
      expect(parsed.journalEntries[0].photos[0]).toMatch(/^data:image\/png;base64,/);
    }).toPass({ timeout: 5000 });

    await expect(page.getByAltText("Entry photo 1")).toBeVisible();

    // draft text must survive the photo save (clobber regression)
    await expect(page.getByPlaceholder("What's on your mind?")).toHaveValue("Photo draft");
    await expect(page.getByPlaceholder("Write your journal entry...")).toHaveValue("With an image");
  });

  test("appends a photo to an existing entry", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await seedData(page, {
      ...emptyData(),
      journalEntries: [
        { id: "p1", date: today, title: "Has photo", content: "body", mood: 0, tags: [], photos: [], createdAt: "x", updatedAt: "x" },
      ],
    });
    await page.goto("/journal");
    await page.locator('input[type="file"]').setInputFiles({
      name: "second.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    await expect(async () => {
      const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
      const parsed = JSON.parse(raw as string);
      expect(parsed.journalEntries[0].photos).toHaveLength(1);
      expect(parsed.journalEntries[0].title).toBe("Has photo");
    }).toPass({ timeout: 5000 });

    await expect(page.getByAltText("Entry photo 1")).toBeVisible();
  });

  test("preview renders on the detail page", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await seedData(page, {
      ...emptyData(),
      journalEntries: [
        {
          id: "p2",
          date: today,
          title: "Detail photo",
          content: "",
          mood: 0,
          tags: [],
          photos: [`data:image/png;base64,${PNG_BASE64}`],
          createdAt: "x",
          updatedAt: "x",
        },
      ],
    });
    await page.goto(`/journal/${today}`);
    await expect(page.getByAltText("Entry photo 1")).toBeVisible();
  });

  test("rejects an unsafe file type", async ({ page }) => {
    await page.goto("/journal");
    await page.locator('input[type="file"]').setInputFiles({
      name: "evil.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from('<svg onload="alert(1)"></svg>'),
    });

    await expect(page.getByRole("alert").filter({ hasText: "No valid images selected" })).toBeVisible();

    const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    expect(raw).toBeNull();
  });

  test("real user flow: clicking Add Photos opens the file picker and works", async ({ page }) => {
    await page.goto("/journal");
    await page.getByPlaceholder("What's on your mind?").fill("Picker flow");

    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Add Photos" }).click();
    const chooser = await chooserPromise;
    expect(chooser.isMultiple()).toBe(true);
    await chooser.setFiles({
      name: "from-picker.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    await expect(async () => {
      const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
      const parsed = JSON.parse(raw as string);
      expect(parsed.journalEntries).toHaveLength(1);
      expect(parsed.journalEntries[0].photos).toHaveLength(1);
      expect(parsed.journalEntries[0].title).toBe("Picker flow");
    }).toPass({ timeout: 5000 });

    await expect(page.getByAltText("Entry photo 1")).toBeVisible();
  });
});