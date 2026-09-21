"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getHabits, deleteHabit, getHabitLogs } from "@/lib/db";
import { Habit, HabitLog } from "@/lib/types";
import { format, startOfToday, subDays, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import {
  ArrowLeft,
  Flame,
  Trash2,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Card, Button } from "@/components/ui";

export default function HabitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const habitId = params.id as string;
  const [habit, setHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);

  useEffect(() => {
    const h = getHabits().find((h) => h.id === habitId);
    setHabit(h || null);
    setLogs(getHabitLogs().filter((l) => l.habitId === habitId));
  }, [habitId]);

  const thisWeek = useMemo(() => {
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());
    return eachDayOfInterval({ start, end });
  }, []);

  const thisMonth = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: startOfToday(),
    });
    return days;
  }, []);

  const completionRate = useMemo(() => {
    if (logs.length === 0) return 0;
    return Math.round((logs.filter((l) => l.completed).length / logs.length) * 100);
  }, [logs]);

  if (!habit) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Habit not found.</p>
        <Button variant="outline" onClick={() => router.push("/habits")} className="mt-4">
          <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/habits")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{habit.name}</h1>
            {habit.description && <p className="text-sm text-muted-foreground">{habit.description}</p>}
          </div>
        </div>
        <Button variant="destructive" onClick={() => { if (confirm(`Delete habit "${habit.name}" and its history?`)) { deleteHabit(habitId); router.push("/habits"); } }}>
          <Trash2 className="w-4 h-4 inline mr-1" /> Delete
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto" />
          <p className="text-2xl font-bold mt-1">{habit.streak}</p>
          <p className="text-xs text-muted-foreground">Current Streak</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="w-6 h-6 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold mt-1">{habit.longestStreak}</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </Card>
        <Card className="p-4 text-center">
          <Calendar className="w-6 h-6 text-green-500 mx-auto" />
          <p className="text-2xl font-bold mt-1">{completionRate}%</p>
          <p className="text-xs text-muted-foreground">Completion Rate</p>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">This Week</h2>
        <div className="grid grid-cols-7 gap-2">
          {thisWeek.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const done = logs.some((l) => l.date === dateStr && l.completed);
            return (
              <div key={dateStr} className="text-center">
                <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium mt-1 ${done ? "bg-green-500 text-white" : "bg-muted"}`}>
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Last 30 Days</h2>
        <div className="grid grid-cols-10 gap-1">
          {thisMonth.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const done = logs.some((l) => l.date === dateStr && l.completed);
            return (
              <div
                key={dateStr}
                className={`w-6 h-6 rounded ${done ? "bg-green-500" : "bg-muted"}`}
                title={`${format(day, "MMM d")}: ${done ? "Done" : "Missed"}`}
              />
            );
          })}
        </div>
      </Card>
    </div>
  );
}
