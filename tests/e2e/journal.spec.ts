import { test, expect } from "@playwright/test";
import { clearData, seedData, STORAGE_KEY, emptyData } from "./helpers";

test.describe("Journal", () => {
  test.beforeEach(async ({ page }) => {
    await clearData(page);
  });

  test("creates an entry and persists it", async ({ page }) => {
    await page.goto("/journal");
    const titleInput = page.getByPlaceholder("What's on your mind?");
    await titleInput.fill("My first entry");
    await page.getByPlaceholder("Write your journal entry...").fill("Content here.");
    await page.getByPlaceholder("e.g. work, health, gratitude").fill("work, health");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(titleInput).toHaveValue("My first entry");

    const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    const parsed = JSON.parse(raw as string);
    expect(parsed.journalEntries).toHaveLength(1);
    expect(parsed.journalEntries[0].title).toBe("My first entry");
    expect(parsed.journalEntries[0].tags).toEqual(["work", "health"]);
  });

  test("edits an existing entry in place without duplicating", async ({ page }) => {
    await page.goto("/journal");
    await page.getByPlaceholder("What's on your mind?").fill("First");
    await page.getByPlaceholder("Write your journal entry...").fill("Body");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await page.getByPlaceholder("What's on your mind?").fill("First (edited)");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    const parsed = JSON.parse(
      (await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)) as string
    );
    expect(parsed.journalEntries).toHaveLength(1);
    expect(parsed.journalEntries[0].title).toBe("First (edited)");
  });

  test("deletes entry after confirm", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await seedData(page, {
      ...emptyData(),
      journalEntries: [
        { id: "j1", date: today, title: "To delete", content: "x", mood: 0, tags: [], photos: [], createdAt: "x", updatedAt: "x" },
      ],
    });
    await page.goto(`/journal/${today}`);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete", exact: true }).click();

    await page.waitForURL("/journal");
    const parsed = JSON.parse(
      (await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)) as string
    );
    expect(parsed.journalEntries).toHaveLength(0);
  });

  test("navigates to older dates via prev button", async ({ page }) => {
    const today = new Date();
    const older = new Date(today);
    older.setDate(older.getDate() - 40);
    const olderKey = older.toISOString().slice(0, 10);
    await seedData(page, {
      ...emptyData(),
      journalEntries: [
        { id: "old", date: olderKey, title: "Old entry", content: "x", mood: 2, tags: [], photos: [], createdAt: "x", updatedAt: "x" },
      ],
    });
    await page.goto(`/journal/${today.toISOString().slice(0, 10)}`);

    const prev = page.getByTitle("Earlier day");
    for (let i = 0; i < 60; i++) {
      if (await prev.isDisabled()) break;
      await prev.click();
    }
    await expect(page.getByText("Old entry")).toBeVisible({ timeout: 5000 });
  });
});