import { HabitLog } from "./types";

export function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function uniqueCompletedDates(logs: readonly HabitLog[]): Set<string> {
  const dates = new Set<string>();
  for (const l of logs) {
    if (l.completed && /^\d{4}-\d{2}-\d{2}$/.test(l.date)) dates.add(l.date);
  }
  return dates;
}

export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function consecutiveStreak(
  logs: readonly HabitLog[],
  asOf: string = todayKey()
): number {
  const done = uniqueCompletedDates(logs);
  let streak = 0;
  let cursor = asOf;
  while (done.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(logs: readonly HabitLog[]): number {
  const dates = [...uniqueCompletedDates(logs)].sort();
  if (dates.length === 0) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    if (addDays(dates[i - 1], 1) === dates[i]) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}