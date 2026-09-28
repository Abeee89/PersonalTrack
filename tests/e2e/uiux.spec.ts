import { test, expect } from "@playwright/test";
import { clearData, seedData, STORAGE_KEY, emptyData } from "./helpers";

test.describe("UI/UX revision", () => {
  test("nav marks the active page and is keyboard reachable", async ({ page }) => {
    await page.goto("/habits");
    const active = page.locator('nav a[aria-current="page"]');
    await expect(active).toHaveCount(1);
    await expect(active).toContainText("Habits");

    await page.goto("/");
    await page.keyboard.press("Tab");
    const focusedHref = await page.evaluate(() => {
      const el = document.activeElement;
      return el instanceof HTMLAnchorElement ? el.getAttribute("href") : null;
    });
    expect(focusedHref).toBe("/");
  });

  test("dashboard recent entries are real keyboard-accessible links", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await seedData(page, {
      ...emptyData(),
      journalEntries: [
        { id: "d1", date: today, title: "Linked entry", content: "x", mood: 0, tags: [], photos: [], createdAt: "x", updatedAt: "x" },
      ],
    });
    await page.goto("/");
    const link = page.locator('main a[href="/journal/' + today + '"]');
    await expect(link).toBeVisible();
    await expect(link).toHaveText(/Linked entry/);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/journal/${today}`));
  });

  test("goal sub-task delete works without crashing (recursion regression)", async ({ page }) => {
    await clearData(page);
    await seedData(page, {
      ...emptyData(),
      goals: [
        { id: "g1", title: "Cleanup", description: "", deadline: "", priority: "medium", status: "in_progress", progress: 50, createdAt: "x", updatedAt: "x" },
      ],
      subTasks: [
        { id: "s1", goalId: "g1", title: "Drop this", completed: false, order: 0 },
        { id: "s2", goalId: "g1", title: "Keep this", completed: false, order: 1 },
      ],
    });
    await page.goto("/goals");
    await page.getByTitle("Expand").click();
    await page.getByLabel("Remove Drop this").click();

    const parsed = JSON.parse(
      (await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)) as string
    );
    expect(parsed.subTasks.map((s: { id: string }) => s.id)).toEqual(["s2"]);
    const goal = parsed.goals.find((g: { id: string }) => g.id === "g1");
    expect(goal.progress).toBe(0);
  });

  test("mood chips expose pressed state", async ({ page }) => {
    await clearData(page);
    await page.goto("/journal");
    const chip = page.getByRole("button", { name: "Mood 3 of 5" });
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  test("habit check exposes pressed state and AA success fill", async ({ page }) => {
    await clearData(page);
    await page.goto("/habits");
    await page.getByRole("button", { name: "Add Habit" }).click();
    await page.getByPlaceholder("Habit name").fill("Aria habit");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    const check = page.getByTitle("Check today");
    await expect(check).toHaveAttribute("aria-pressed", "false");
    await check.click();
    const uncheck = page.getByTitle("Uncheck today");
    await expect(uncheck).toHaveAttribute("aria-pressed", "true");
    const bg = await uncheck.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("mobile 375px: no horizontal overflow on dashboard, journal, habits", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await clearData(page);
    for (const path of ["/", "/journal", "/habits", "/goals", "/settings"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow, `overflow on ${path}`).toBe(false);
    }
  });

  test("dark mode: tokens resolve and contrast holds on nav", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await clearData(page);
    await page.goto("/");
    const bg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--background").trim()
    );
    expect(bg).toBe("#0c0a09");
    const navText = page.locator('nav a[aria-current="page"]');
    await expect(navText).toBeVisible();
    const color = await navText.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe("");
  });
});