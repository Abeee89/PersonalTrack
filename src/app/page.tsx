"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getJournalEntries, getHabits, getGoals, getHabitLogs } from "@/lib/db";
import { JournalEntry, Habit, Goal } from "@/lib/types";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  Target,
  FileText,
  ArrowRight,
  Flame,
} from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";

function getMoodEmoji(mood: number): string {
  const emojis = ["", "😢", "😕", "🙂", "😊", "🤩"];
  return emojis[mood] || "";
}

export default function Dashboard() {
  const router = useRouter();
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
        <p className="text-muted-foreground mt-1">Your personal tracking overview</p>
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
            <Button variant="outline" onClick={() => router.push("/journal")}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {recentEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No entries yet. Start journaling!</p>
          ) : (
            <ul className="space-y-3">
              {recentEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-accent/50 rounded px-2 -mx-2 transition-colors"
                  onClick={() => router.push(`/journal/${entry.date}`)}
                >
                  <div>
                    <p className="font-medium text-sm">{entry.title || "Untitled Entry"}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(entry.date), "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.mood > 0 && <span>{getMoodEmoji(entry.mood)}</span>}
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Active Goals</h2>
            <Button variant="outline" onClick={() => router.push("/goals")}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {activeGoals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active goals. Set a goal to get started!</p>
          ) : (
            <ul className="space-y-3">
              {activeGoals.map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-accent/50 rounded px-2 -mx-2 transition-colors"
                  onClick={() => router.push(`/goals/${goal.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{goal.title}</p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div
                        className="bg-foreground h-1.5 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground ml-2">{goal.progress}%</span>
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
          <Button onClick={() => router.push("/journal")} className="h-20 flex-col gap-2">
            <FileText className="w-6 h-6" />
            New Journal Entry
          </Button>
          <Button variant="outline" onClick={() => router.push("/habits")} className="h-20 flex-col gap-2">
            <CheckCircle2 className="w-6 h-6" />
            Add Habit
          </Button>
          <Button variant="outline" onClick={() => router.push("/goals")} className="h-20 flex-col gap-2">
            <Target className="w-6 h-6" />
            New Goal
          </Button>
        </div>
      </Card>
    </div>
  );
}
