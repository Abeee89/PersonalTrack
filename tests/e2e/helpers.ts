import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export const STORAGE_KEY = "personaltrack_data";

export function emptyData() {
  return {
    journalEntries: [],
    habits: [],
    habitLogs: [],
    goals: [],
    subTasks: [],
  };
}

export async function seedData(page: Page, data: unknown) {
  await page.goto("/");
  await page.evaluate(([key, value]) => {
    window.localStorage.setItem(key, value);
  }, [STORAGE_KEY, JSON.stringify(data) as string] as [string, string]);
  await page.reload();
}

export async function clearData(page: Page) {
  await page.goto("/");
  await page.evaluate((key) => {
    window.localStorage.removeItem(key);
  }, STORAGE_KEY);
}

export function isOnPage(page: Page, href: string) {
  return expect(page).toHaveURL(new RegExp(href.replace("/", "\\/")));
}