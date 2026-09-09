import { StorageData, JournalEntry, Habit, HabitLog, Goal, SubTask } from "./types";

const STORAGE_KEY = "personaltrack_data";

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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StorageData;
  } catch {}
  return getDefaultData();
}

function writeData(data: StorageData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
  return JSON.stringify(readData(), null, 2);
}

export function importData(json: string): StorageData {
  try {
    const data = JSON.parse(json) as StorageData;
    writeData(data);
    return data;
  } catch {
    throw new Error("Invalid data format");
  }
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}
