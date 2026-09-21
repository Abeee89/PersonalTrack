import { StorageData, JournalEntry, Habit, HabitLog, Goal, SubTask } from "./types";
import { capPhotos } from "./photos";

const STORAGE_KEY = "personaltrack_data";

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStr(v: unknown): v is string {
  return typeof v === "string";
}

function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isFreq(v: unknown): v is Habit["frequency"] {
  return v === "daily" || v === "weekly" || v === "custom";
}

function isPriority(v: unknown): v is Goal["priority"] {
  return v === "low" || v === "medium" || v === "high";
}

function isStatus(v: unknown): v is Goal["status"] {
  return v === "not_started" || v === "in_progress" || v === "completed";
}

function sanitizeJournalEntry(e: unknown): JournalEntry | null {
  if (!isRecord(e) || !isStr(e.id) || !isStr(e.date)) return null;
  const tags = Array.isArray(e.tags) ? e.tags.filter(isStr) : [];
  const photos = capPhotos(e.photos);
  return {
    id: e.id,
    date: e.date,
    title: isStr(e.title) ? e.title : "",
    content: isStr(e.content) ? e.content : "",
    mood: isNum(e.mood) ? Math.max(0, Math.min(5, e.mood)) : 0,
    tags,
    photos,
    createdAt: isStr(e.createdAt) ? e.createdAt : e.date,
    updatedAt: isStr(e.updatedAt) ? e.updatedAt : e.date,
  };
}

function sanitizeHabit(h: unknown): Habit | null {
  if (!isRecord(h) || !isStr(h.id) || !isStr(h.name)) return null;
  return {
    id: h.id,
    name: h.name,
    description: isStr(h.description) ? h.description : "",
    frequency: isFreq(h.frequency) ? h.frequency : "daily",
    targetDays: Array.isArray(h.targetDays) ? h.targetDays.filter(isStr) : [],
    category: isStr(h.category) ? h.category : "Other",
    streak: isNum(h.streak) ? h.streak : 0,
    longestStreak: isNum(h.longestStreak) ? h.longestStreak : 0,
    lastChecked: isStr(h.lastChecked) ? h.lastChecked : undefined,
    createdAt: isStr(h.createdAt) ? h.createdAt : new Date().toISOString(),
  };
}

function sanitizeHabitLog(l: unknown): HabitLog | null {
  if (!isRecord(l) || !isStr(l.id) || !isStr(l.habitId) || !isStr(l.date)) return null;
  return {
    id: l.id,
    habitId: l.habitId,
    date: l.date,
    completed: isBool(l.completed) ? l.completed : false,
  };
}

function sanitizeGoal(g: unknown): Goal | null {
  if (!isRecord(g) || !isStr(g.id) || !isStr(g.title)) return null;
  return {
    id: g.id,
    title: g.title,
    description: isStr(g.description) ? g.description : "",
    deadline: isStr(g.deadline) ? g.deadline : "",
    priority: isPriority(g.priority) ? g.priority : "medium",
    status: isStatus(g.status) ? g.status : "not_started",
    progress: isNum(g.progress) ? Math.max(0, Math.min(100, g.progress)) : 0,
    createdAt: isStr(g.createdAt) ? g.createdAt : new Date().toISOString(),
    updatedAt: isStr(g.updatedAt) ? g.updatedAt : (isStr(g.createdAt) ? g.createdAt : new Date().toISOString()),
  };
}

function sanitizeSubTask(s: unknown): SubTask | null {
  if (!isRecord(s) || !isStr(s.id) || !isStr(s.goalId) || !isStr(s.title)) return null;
  return {
    id: s.id,
    goalId: s.goalId,
    title: s.title,
    completed: isBool(s.completed) ? s.completed : false,
    order: isNum(s.order) ? s.order : 0,
  };
}

export function sanitizeStorageData(input: unknown): StorageData {
  if (!isRecord(input)) return getDefaultData();
  const journalEntries: JournalEntry[] = [];
  for (const e of Array.isArray(input.journalEntries) ? input.journalEntries : []) {
    const s = sanitizeJournalEntry(e);
    if (s) journalEntries.push(s);
  }
  const habits: Habit[] = [];
  for (const h of Array.isArray(input.habits) ? input.habits : []) {
    const s = sanitizeHabit(h);
    if (s) habits.push(s);
  }
  const habitLogs: HabitLog[] = [];
  for (const l of Array.isArray(input.habitLogs) ? input.habitLogs : []) {
    const s = sanitizeHabitLog(l);
    if (s) habitLogs.push(s);
  }
  const goals: Goal[] = [];
  for (const g of Array.isArray(input.goals) ? input.goals : []) {
    const s = sanitizeGoal(g);
    if (s) goals.push(s);
  }
  const subTasks: SubTask[] = [];
  for (const s of Array.isArray(input.subTasks) ? input.subTasks : []) {
    const s2 = sanitizeSubTask(s);
    if (s2) subTasks.push(s2);
  }
  return { journalEntries, habits, habitLogs, goals, subTasks };
}

function getDefaultData(): StorageData {
  return {
    journalEntries: [],
    habits: [],
    habitLogs: [],
    goals: [],
    subTasks: [],
  };
}

function readData(): StorageData {
  if (typeof window === "undefined") return getDefaultData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitizeStorageData(JSON.parse(raw));
  } catch {
    // Corrupt storage -> fall back to empty so the app never bricks.
  }
  return getDefaultData();
}

function writeData(data: StorageData) {
  if (typeof window === "undefined") return;
  const sanitized = sanitizeStorageData(data);
  const serialized = JSON.stringify(sanitized);
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    const errName = (err as { name?: string } | null)?.name ?? "";
    const code = (err as { code?: unknown } | null)?.code;
    const hasQuota =
      errName === "QuotaExceededError" || errName === "NS_ERROR_DOM_QUOTA_REACHED" || code === 22;
    throw new StorageError(
      hasQuota
        ? "Storage is full. Free some space (e.g. remove photos or export+clear data) and try again."
        : "Could not save your data. Storage may be blocked (private/incognito or site permissions)."
    );
  }
}

export function getJournalEntries(): JournalEntry[] {
  return readData().journalEntries;
}

export function saveJournalEntry(entry: JournalEntry) {
  const data = readData();
  const idx = data.journalEntries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) data.journalEntries[idx] = entry;
  else data.journalEntries.push(entry);
  writeData(data);
}

export function deleteJournalEntry(id: string) {
  const data = readData();
  data.journalEntries = data.journalEntries.filter((e) => e.id !== id);
  writeData(data);
}

export function getHabits(): Habit[] {
  return readData().habits;
}

export function saveHabit(habit: Habit) {
  const data = readData();
  const idx = data.habits.findIndex((h) => h.id === habit.id);
  if (idx >= 0) data.habits[idx] = habit;
  else data.habits.push(habit);
  writeData(data);
}

export function deleteHabit(id: string) {
  const data = readData();
  data.habits = data.habits.filter((h) => h.id !== id);
  data.habitLogs = data.habitLogs.filter((l) => l.habitId !== id);
  writeData(data);
}

export function getHabitLogs(): HabitLog[] {
  return readData().habitLogs;
}

export function logHabit(habitId: string, date: string, completed: boolean) {
  const data = readData();
  const existing = data.habitLogs.findIndex(
    (l) => l.habitId === habitId && l.date === date
  );
  if (existing >= 0) {
    data.habitLogs[existing] = { ...data.habitLogs[existing], completed };
  } else {
    data.habitLogs.push({ id: crypto.randomUUID(), habitId, date, completed });
  }
  writeData(data);
}

export function getGoals(): Goal[] {
  return readData().goals;
}

export function saveGoal(goal: Goal) {
  const data = readData();
  const idx = data.goals.findIndex((g) => g.id === goal.id);
  if (idx >= 0) data.goals[idx] = goal;
  else data.goals.push(goal);
  writeData(data);
}

export function deleteGoal(id: string) {
  const data = readData();
  data.goals = data.goals.filter((g) => g.id !== id);
  data.subTasks = data.subTasks.filter((s) => s.goalId !== id);
  writeData(data);
}

export function getSubTasks(): SubTask[] {
  return readData().subTasks;
}

export function saveSubTask(subTask: SubTask) {
  const data = readData();
  const idx = data.subTasks.findIndex((s) => s.id === subTask.id);
  if (idx >= 0) data.subTasks[idx] = subTask;
  else data.subTasks.push(subTask);
  writeData(data);
}

export function deleteSubTask(id: string) {
  const data = readData();
  data.subTasks = data.subTasks.filter((s) => s.id !== id);
  writeData(data);
}

export function exportData(): string {
  return JSON.stringify(sanitizeStorageData(readData()), null, 2);
}

export function validateImport(json: string): StorageData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new StorageError("Invalid JSON.");
  }
  if (!isRecord(parsed)) {
    throw new StorageError("Import data does not match the PersonalTrack format.");
  }
  if (
    !Array.isArray(parsed.journalEntries) ||
    !Array.isArray(parsed.habits) ||
    !Array.isArray(parsed.habitLogs) ||
    !Array.isArray(parsed.goals) ||
    !Array.isArray(parsed.subTasks)
  ) {
    throw new StorageError("Import data does not match the PersonalTrack format.");
  }
  const sanitized = sanitizeStorageData(parsed);
  const reconstructed = sanitizeStorageData(JSON.parse(JSON.stringify(sanitized)));
  if (JSON.stringify(reconstructed) !== JSON.stringify(sanitized)) {
    throw new StorageError("Import data does not match the PersonalTrack format.");
  }
  return sanitized;
}

export function importData(json: string): StorageData {
  const data = validateImport(json);
  writeData(data);
  return data;
}

export function clearAllData() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function computeStorageUsage(): {
  usedBytes: number;
  remainingBytes: number;
  usedMb: number;
  remainingMb: number;
} {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return { usedBytes: 0, remainingBytes: 0, usedMb: 0, remainingMb: 0 };
  }
  let usedBytes = 0;
  const qKeyLength = STORAGE_KEY.length;
  for (let i = 0; i < window.localStorage.length; i++) {
    try {
      const k = window.localStorage.key(i) || "";
      const v = window.localStorage.getItem(k) || "";
      usedBytes += k.length + v.length;
    } catch {
      // ignore individual read errors
    }
  }
  usedBytes += qKeyLength;
  const budget = 5 * 1024 * 1024;
  const remainingBytes = Math.max(0, budget - usedBytes);
  return {
    usedBytes,
    remainingBytes,
    usedMb: usedBytes / (1024 * 1024),
    remainingMb: remainingBytes / (1024 * 1024),
  };
}

export function getStorageWarning(): string | null {
  const usage = computeStorageUsage();
  if (usage.remainingBytes === 0) {
    return "Storage is full. New changes may not be saved. Export and clear data, or remove photos.";
  }
  if (usage.usedMb > 3.5) {
    return "Storage is getting full. Consider exporting a backup and removing large photos.";
  }
  return null;
}