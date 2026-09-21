import { vi } from "vitest";

export interface MockStorage extends Storage {
  _data: Map<string, string>;
  _maxBytes: number | null;
}

function makeStorage(seed: Record<string, string> = {}, maxBytes: number | null = null): MockStorage {
  const data = new Map<string, string>(Object.entries(seed));
  return {
    _data: data,
    _maxBytes: maxBytes,
    get length() {
      return data.size;
    },
    key(index: number): string | null {
      return [...data.keys()][index] ?? null;
    },
    getItem(key: string): string | null {
      return data.has(key) ? (data.get(key) as string) : null;
    },
    setItem(key: string, value: string): void {
      const maxBytes = this._maxBytes;
      if (maxBytes != null) {
        let used = 0;
        data.forEach((v) => (used += v.length));
        if (data.has(key)) used -= data.get(key)!.length;
        used += value.length;
        if (used > maxBytes) {
          const err = new Error("Quota exceeded") as Error & { name: string; code: number };
          err.name = "QuotaExceededError";
          err.code = 22;
          throw err;
        }
      }
      data.set(key, value);
    },
    removeItem(key: string): void {
      data.delete(key);
    },
    clear(): void {
      data.clear();
    },
  };
}

let installed: false | MockStorage = false;

export function installStorageMock(
  seed: Record<string, string> = {},
  maxBytes: number | null = null
): MockStorage {
  const storage = makeStorage(seed, maxBytes);
  vi.stubGlobal("window", { localStorage: storage });
  installed = storage;
  return storage;
}

export function uninstallStorageMock(): void {
  if (installed) vi.unstubAllGlobals();
  installed = false;
}

export const STORAGE_KEY = "personaltrack_data";