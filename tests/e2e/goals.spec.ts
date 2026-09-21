import { test, expect } from "@playwright/test";
import { clearData, STORAGE_KEY } from "./helpers";

test.describe("Goals", () => {
  test.beforeEach(async ({ page }) => {
    await clearData(page);
  });

  test("creates a goal, adds a subtask, completes it", async ({ page }) => {
    await page.goto("/goals");
    await page.getByRole("button", { name: "New Goal" }).click();
    await page.getByPlaceholder("Goal title").fill("Ship v1");
    await page.getByPlaceholder("Description").fill("Release the tracker");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page.getByText("Ship v1")).toBeVisible();

    await page.getByTitle("Expand").click();
    await page.getByPlaceholder("Add sub-task...").fill("Write docs");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Write docs")).toBeVisible();

    const parsed = JSON.parse(
      (await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)) as string
    );
    expect(parsed.goals).toHaveLength(1);
    expect(parsed.subTasks).toHaveLength(1);
    expect(parsed.subTasks[0].title).toBe("Write docs");
  });

  test("subtask add uses its own input (does not clobber goal title)", async ({ page }) => {
    await page.goto("/goals");
    await page.getByRole("button", { name: "New Goal" }).click();
    await page.getByPlaceholder("Goal title").fill("Build app");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await page.getByTitle("Expand").click();
    await page.getByPlaceholder("Add sub-task...").fill("Design UI");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    const parsed = JSON.parse(
      (await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)) as string
    );
    expect(parsed.goals[0].title).toBe("Build app");
    expect(parsed.subTasks[0].title).toBe("Design UI");
    expect(parsed.subTasks[0].title).not.toBe(parsed.goals[0].title);
  });

  test("deletes a goal after confirm", async ({ page }) => {
    await page.goto("/goals");
    await page.getByRole("button", { name: "New Goal" }).click();
    await page.getByPlaceholder("Goal title").fill("Remove me");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    page.once("dialog", (d) => d.accept());
    await page.getByTitle("Delete goal").click();
    await expect(page.getByText("Remove me")).not.toBeVisible();

    const parsed = JSON.parse(
      (await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)) as string
    );
    expect(parsed.goals).toHaveLength(0);
  });
});