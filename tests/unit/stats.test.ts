import { describe, it, expect } from "vitest";
import { consecutiveStreak, longestStreak, todayKey } from "@/lib/stats";
import type { HabitLog } from "@/lib/types";

function makeLogs(dates: string[], completed = true): HabitLog[] {
  return dates.map((d, i) => ({
    id: `l${i}`,
    habitId: "h1",
    date: d,
    completed,
  }));
}

describe("consecutiveStreak", () => {
  it("counts today back-to-back", () => {
    const today = todayKey();
    const logs = makeLogs([today]);
    expect(consecutiveStreak(logs, today)).toBe(1);
  });

  it("counts contiguous run ending before today when passed asOf", () => {
    const asOf = "2026-09-10";
    const logs = makeLogs(["2026-09-10", "2026-09-09", "2026-09-08"]);
    expect(consecutiveStreak(logs, asOf)).toBe(3);
  });

  it("breaks on a gap", () => {
    const asOf = "2026-09-10";
    const logs = makeLogs(["2026-09-10", "2026-09-08", "2026-09-07"]);
    expect(consecutiveStreak(logs, asOf)).toBe(1);
  });

  it("returns 0 when today is not completed", () => {
    const today = todayKey();
    const logs = makeLogs([today]);
    expect(consecutiveStreak([], today)).toBe(0);
    expect(consecutiveStreak(logs, "2026-01-01")).toBe(0);
  });
});

describe("longestStreak", () => {
  it("finds the longest run with gaps", () => {
    const logs = makeLogs(["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-10", "2026-09-11"]);
    expect(longestStreak(logs)).toBe(3);
  });

  it("single day is 1", () => {
    expect(longestStreak(makeLogs(["2026-09-01"]))).toBe(1);
  });

  it("empty is 0", () => {
    expect(longestStreak([])).toBe(0);
  });
});