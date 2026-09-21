import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  importData,
  validateImport,
  saveJournalEntry,
  getJournalEntries,
  clearAllData,
  StorageError,
} from "@/lib/db";
import { installStorageMock, uninstallStorageMock, MockStorage, STORAGE_KEY } from "./helpers";

let storage: MockStorage;

function makeValidJson(): string {
  return JSON.stringify({
    journalEntries: [
      { id: "j1", date: "2026-09-20", title: "hi", content: "note", mood: 3, tags: [], photos: [], createdAt: "2026-09-20T00:00:00Z", updatedAt: "2026-09-20T00:00:00Z" },
    ],
    habits: [],
    habitLogs: [],
    goals: [],
    subTasks: [],
  });
}

beforeEach(() => {
  storage = installStorageMock();
});

afterEach(() => {
  uninstallStorageMock();
  vi.restoreAllMocks();
});

describe("import validation", () => {
  it("rejects invalid JSON", () => {
    expect(() => importData("not json {")).toThrow(StorageError);
  });

  it("rejects arrays at top level", () => {
    expect(() => importData("[]")).toThrow(StorageError);
  });

  it("rejects unknown top-level shape (missing required arrays)", () => {
    expect(() => importData(JSON.stringify({ hacking: "you", xss: "<script>" }))).toThrow(StorageError);
    expect(() => importData(JSON.stringify({ journalEntries: [], habits: [], habitLogs: [], goals: [] }))).toThrow(StorageError);
  });

  it("drops records missing required keys, keeps valid ones", () => {
    const json = JSON.stringify({
      journalEntries: [
        makeValidJson() && { id: "bad", nonsense: true },
        { id: "good", date: "2026-09-21", title: "ok", content: "", mood: 0, tags: [], photos: [], createdAt: "x", updatedAt: "x" },
      ],
      habits: [],
      habitLogs: [],
      goals: [],
      subTasks: [],
    });
    const data = importData(json);
    expect(data.journalEntries.map((e) => e.id)).toEqual(["good"]);
  });

  it("caps and filters photos to safe data URLs only", () => {
    const tinyPng = `data:image/png;base64,${"A".repeat(10)}`;
    const json = JSON.stringify({
      journalEntries: [
        { id: "j", date: "2026-09-20", title: "", content: "", mood: 0, tags: [], photos: [tinyPng, "javascript:alert(1)", `data:image/svg+xml;base64,${"B".repeat(30)}`], createdAt: "x", updatedAt: "x" },
      ],
      habits: [],
      habitLogs: [],
      goals: [],
      subTasks: [],
    });
    const data = importData(json);
    expect(data.journalEntries[0].photos).toEqual([tinyPng]);
  });

  it("writes sanitized data to storage on valid import", () => {
    importData(makeValidJson());
    const raw = storage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).journalEntries).toHaveLength(1);
  });
});

describe("saveJournalEntry", () => {
  it("persists an entry through sanitize round-trip", () => {
    saveJournalEntry({
      id: "e1",
      date: "2026-09-20",
      title: "T",
      content: "C",
      mood: 4,
      tags: ["a", "b"],
      photos: [],
      createdAt: "2026-09-20T00:00:00Z",
      updatedAt: "2026-09-20T00:00:00Z",
    });
    const entries = getJournalEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe("T");
    expect(entries[0].mood).toBe(4);
  });

  it("throws StorageError when quota exceeded", () => {
    storage._maxBytes = 0;
    expect(() =>
      saveJournalEntry({
        id: "e2",
        date: "2026-09-20",
        title: "T",
        content: "C",
        mood: 0,
        tags: [],
        photos: [],
        createdAt: "x",
        updatedAt: "x",
      })
    ).toThrow(StorageError);
  });
});

describe("clearAllData", () => {
  it("removes stored data", () => {
    importData(makeValidJson());
    expect(storage.getItem(STORAGE_KEY)).toBeTruthy();
    clearAllData();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("validateImport", () => {
  it("rejects absurd top-level primitive", () => {
    expect(() => validateImport("42")).toThrow(StorageError);
  });
});