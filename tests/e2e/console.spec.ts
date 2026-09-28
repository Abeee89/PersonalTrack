import { test } from "@playwright/test";

const pages = ["/", "/journal", "/habits", "/goals", "/settings", "/goals/nonexistent", "/journal/not-a-date"];

for (const path of pages) {
  test(`no console errors on ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(String(err)));
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const real = errors.filter((e) => !/favicon/i.test(e));
    if (real.length) throw new Error(`console errors on ${path}: ${real.join(" | ")}`);
  });
}