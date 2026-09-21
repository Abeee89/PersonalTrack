import { test, expect } from "@playwright/test";
import { clearData, seedData, STORAGE_KEY, emptyData } from "./helpers";

test.describe("Settings / Data safety", () => {
  test.beforeEach(async ({ page }) => {
    await clearData(page);
  });

  test("imports rejected for malformed JSON", async ({ page }) => {
    await page.goto("/settings");
    await page.getByRole("button", { name: "Import Data" }).click();
    await page.getByPlaceholder("Paste JSON data here...").fill("this is not json {");
    await page.getByRole("button", { name: "Import", exact: true }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Import failed" })).toContainText("Invalid JSON");
    const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    expect(raw).toBeNull();
  });

  test("valid import round-trips data", async ({ page }) => {
    const data = {
      ...emptyData(),
      journalEntries: [
        { id: "imp1", date: "2026-09-01", title: "Imported", content: "x", mood: 3, tags: ["a"], photos: [], createdAt: "x", updatedAt: "x" },
      ],
    };
    await seedData(page, data);

    const exported = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    await page.evaluate((key) => window.localStorage.removeItem(key), STORAGE_KEY);
    await page.reload();

    await page.goto("/settings");
    await page.getByRole("button", { name: "Import Data" }).click();
    await page.getByPlaceholder("Paste JSON data here...").fill(exported as string);
    await page.getByRole("button", { name: "Import", exact: true }).click();

    await expect(page.getByText("Data imported successfully!")).toBeVisible({ timeout: 5000 });

    const parsed = JSON.parse(
      (await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)) as string
    );
    expect(parsed.journalEntries).toHaveLength(1);
    expect(parsed.journalEntries[0].title).toBe("Imported");
  });

  test("import rejected for clearly-wrong shape (security)", async ({ page }) => {
    await page.goto("/settings");
    await page.getByRole("button", { name: "Import Data" }).click();
    await page.getByPlaceholder("Paste JSON data here...").fill('{"hacking":"you","xss":"<script>alert(1)</script>"}');
    await page.getByRole("button", { name: "Import", exact: true }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Import failed" })).toBeVisible();
    const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    expect(raw).toBeNull();
  });

  test("clears all data after confirm", async ({ page }) => {
    await seedData(page, {
      ...emptyData(),
      journalEntries: [{ id: "x", date: "2026-09-01", title: "T", content: "", mood: 0, tags: [], photos: [], createdAt: "x", updatedAt: "x" }],
    });

    page.once("dialog", (d) => d.accept());
    await page.goto("/settings");
    await page.getByRole("button", { name: "Clear All Data" }).click();
    await page.waitForLoadState("networkidle");

    const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    expect(raw).toBeNull();
  });
});