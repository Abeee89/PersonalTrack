"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getJournalEntries, getHabits, getGoals, getHabitLogs } from "@/lib/db";
import { JournalEntry, Habit, Goal } from "@/lib/types";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  Target,
  FileText,
  Flame,
} from "lucide-react";
import { Card, Badge } from "@/components/ui";

function getMoodEmoji(mood: number): string {
  const emojis = ["", "😢", "😕", "🙂", "😊", "🤩"];
  return emojis[mood] || "";
}

export default function Dashboard() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [logs, setLogs] = useState<{ habitId: string; date: string; completed: boolean }[]>([]);

  useEffect(() => {
    setEntries(getJournalEntries());
    setHabits(getHabits());
    setGoals(getGoals());
    setLogs(getHabitLogs());
  }, []);

  const todayEntries = entries.filter((e) => e.date === format(new Date(), "yyyy-MM-dd"));
  const todayHabitsCompleted = habits.filter((h) => {
    const today = format(new Date(), "yyyy-MM-dd");
    return logs.some((l) => l.habitId === h.id && l.date === today && l.completed);
  }).length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const totalHabits = habits.length;
  const totalGoals = goals.length;

  const currentStreak = useMemo(() => {
    let streak = 0;
    let date = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = format(date, "yyyy-MM-dd");
      if (logs.some((l) => l.date === dateStr && l.completed)) {
        streak++;
        date = new Date(date.getTime() - 86400000);
      } else break;
    }
    return streak;
  }, [logs]);

  const recentEntries = entries.slice(0, 5);
  const activeGoals = goals.filter((g) => g.status !== "completed").slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">A small, honest look at your days.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <FileText className="w-4 h-4" /> Journal Entries
          </div>
          <p className="text-2xl font-bold mt-1">{entries.length}</p>
          {todayEntries.length > 0 && (
            <Badge variant="default" className="mt-2">Today: {todayEntries.length}</Badge>
          )}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <CheckCircle2 className="w-4 h-4" /> Habits
          </div>
          <p className="text-2xl font-bold mt-1">{totalHabits}</p>
          <p className="text-sm text-muted-foreground mt-1">{todayHabitsCompleted} done today</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Target className="w-4 h-4" /> Goals
          </div>
          <p className="text-2xl font-bold mt-1">{completedGoals}/{totalGoals}</p>
          {activeGoals.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{activeGoals.length} active</p>
          )}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Flame className="w-4 h-4" /> Streak
          </div>
          <p className="text-2xl font-bold mt-1">{currentStreak}</p>
          <p className="text-sm text-muted-foreground mt-1">days</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Journal</h2>
            <Link
              href="/journal"
              className="inline-flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg border border-input hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              See all entries
            </Link>
          </div>
          {recentEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing written yet. The first line is the hardest part.</p>
          ) : (
            <ul className="space-y-1">
              {recentEntries.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/journal/${entry.date}`}
                    className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  >
                    <span>
                      <span className="block font-medium text-sm">{entry.title || "Untitled entry"}</span>
                      <span className="block text-xs text-muted-foreground">{format(parseISO(entry.date), "MMM d, yyyy")}</span>
                    </span>
                    {entry.mood > 0 && <span aria-hidden="true">{getMoodEmoji(entry.mood)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Active Goals</h2>
            <Link
              href="/goals"
              className="inline-flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg border border-input hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              See all goals
            </Link>
          </div>
          {activeGoals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No goals in motion. Pick one thing you want to finish.</p>
          ) : (
            <ul className="space-y-1">
              {activeGoals.map((goal) => (
                <li key={goal.id}>
                  <Link
                    href={`/goals/${goal.id}`}
                    className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-sm truncate">{goal.title}</span>
                      <span className="block w-full bg-muted rounded-full h-1.5 mt-1">
                        <span
                          className="block bg-brand h-1.5 rounded-full transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">{goal.progress}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Quick Add</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/journal"
            className="inline-flex items-center justify-center gap-2 min-h-20 rounded-lg bg-foreground text-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FileText className="w-6 h-6" />
            Start a journal entry
          </Link>
          <Link
            href="/habits"
            className="inline-flex items-center justify-center gap-2 min-h-20 rounded-lg border border-input text-sm font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CheckCircle2 className="w-6 h-6" />
            Add a habit
          </Link>
          <Link
            href="/goals"
            className="inline-flex items-center justify-center gap-2 min-h-20 rounded-lg border border-input text-sm font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Target className="w-6 h-6" />
            Set a goal
          </Link>
        </div>
      </Card>
    </div>
  );
}
