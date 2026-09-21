import { test, expect } from "@playwright/test";
import { clearData, STORAGE_KEY } from "./helpers";

test.describe("Habits", () => {
  test.beforeEach(async ({ page }) => {
    await clearData(page);
  });

  test("creates a habit and checks it", async ({ page }) => {
    await page.goto("/habits");
    await page.getByRole("button", { name: "Add Habit" }).click();
    await page.getByPlaceholder("Habit name").fill("Read 30 min");
    await page.getByPlaceholder("Description (optional)").fill("Evening reading");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page.getByText("Read 30 min")).toBeVisible();

    const check = page.getByTitle("Check today");
    await check.click();
    await expect(page.getByTitle("Uncheck today")).toBeVisible();

    const parsed = JSON.parse(
      (await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)) as string
    );
    expect(parsed.habits).toHaveLength(1);
    expect(parsed.habitLogs).toHaveLength(1);
    expect(parsed.habitLogs[0].completed).toBe(true);
  });

  test("unchecks a checked habit (toggle)", async ({ page }) => {
    await page.goto("/habits");
    await page.getByRole("button", { name: "Add Habit" }).click();
    await page.getByPlaceholder("Habit name").fill("Toggle me");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await page.getByTitle("Check today").click();
    await expect(page.getByTitle("Uncheck today")).toBeVisible();
    await page.getByTitle("Uncheck today").click();
    await expect(page.getByTitle("Check today")).toBeVisible();

    const parsed = JSON.parse(
      (await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)) as string
    );
    expect(parsed.habitLogs[0].completed).toBe(false);
  });

  test("deletes a habit after confirm", async ({ page }) => {
    await page.goto("/habits");
    await page.getByRole("button", { name: "Add Habit" }).click();
    await page.getByPlaceholder("Habit name").fill("Doomed habit");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    page.once("dialog", (d) => d.accept());
    await page.getByTitle("Delete habit").click();
    await expect(page.getByText("Doomed habit")).not.toBeVisible();

    const parsed = JSON.parse(
      (await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)) as string
    );
    expect(parsed.habits).toHaveLength(0);
  });
});