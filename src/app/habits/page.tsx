"use client";

import { useState, useEffect, useMemo } from "react";
import { getHabits, saveHabit, deleteHabit, StorageError } from "@/lib/db";
import { getHabitLogs, logHabit } from "@/lib/db";
import { Habit, HabitLog } from "@/lib/types";
import { format, startOfToday, subDays, eachDayOfInterval } from "date-fns";
import { consecutiveStreak, longestStreak, todayKey } from "@/lib/stats";
import {
  CheckCircle2,
  Plus,
  Trash2,
  Flame,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { Card, Button, Input, Textarea, Select, Badge, ErrorBanner } from "@/components/ui";

const CATEGORIES = ["Health", "Productivity", "Fitness", "Mindfulness", "Learning", "Social", "Creative", "Other"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">("daily");
  const [targetDays, setTargetDays] = useState<string[]>([]);
  const [category, setCategory] = useState("Other");

  const refresh = () => {
    setHabits(getHabits());
    setLogs(getHabitLogs());
  };

  useEffect(() => {
    refresh();
    setIsReady(true);
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingHabit(null);
    setName("");
    setDescription("");
    setFrequency("daily");
    setTargetDays([]);
    setCategory("Other");
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const habit: Habit = {
      id: editingHabit?.id || crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      frequency,
      targetDays,
      category,
      streak: editingHabit?.streak || 0,
      longestStreak: editingHabit?.longestStreak || 0,
      lastChecked: editingHabit?.lastChecked,
      createdAt: editingHabit?.createdAt || new Date().toISOString(),
    };
    try {
      saveHabit(habit);
      resetForm();
      refresh();
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not save habit.");
    }
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setName(habit.name);
    setDescription(habit.description);
    setFrequency(habit.frequency);
    setTargetDays(habit.targetDays);
    setCategory(habit.category);
    setShowForm(true);
  };

  const handleDeleteHabit = (habit: Habit) => {
    if (!confirm(`Delete habit "${habit.name}" and its history?`)) return;
    try {
      deleteHabit(habit.id);
      refresh();
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not delete habit.");
    }
  };

  const toggleDay = (day: string) => {
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleHabit = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const today = todayKey();
    const existing = logs.some((l) => l.habitId === habitId && l.date === today && l.completed);
    try {
      logHabit(habitId, today, !existing);
      const updatedLogs = getHabitLogs().filter((l) => l.habitId === habitId);
      const streak = consecutiveStreak(updatedLogs, today);
      const best = Math.max(habit.longestStreak, longestStreak(updatedLogs));
      saveHabit({ ...habit, streak, longestStreak: best, lastChecked: today });
      refresh();
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not update habit.");
    }
  };

  const getTodayStatus = (habitId: string) => {
    return logs.some((l) => l.habitId === habitId && l.date === todayKey() && l.completed);
  };

  const weekLogs = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(startOfToday(), 6), end: startOfToday() });
    return days.map((d) => ({
      date: format(d, "yyyy-MM-dd"),
      day: DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1],
    }));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
          <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 inline mr-1" /> Add Habit
        </Button>
      </div>

      <ErrorBanner message={error} />

      {showForm && (
        <Card className="p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{editingHabit ? "Edit Habit" : "New Habit"}</h2>
            <Button variant="ghost" size="sm" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <Input placeholder="Habit name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Select value={frequency} onValueChange={(v) => setFrequency(v as "daily" | "weekly" | "custom")}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          {frequency === "weekly" && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Days</label>
              <div className="flex gap-2 mt-2">
                {DAY_NAMES.map((d) => (
                  <button
                    key={d}
                    aria-pressed={targetDays.includes(d)}
                    onClick={() => toggleDay(d)}
                    className={`w-11 h-11 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      targetDays.includes(d) ? "bg-foreground text-background" : "border hover:bg-accent"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Button onClick={handleSave}>{editingHabit ? <Save className="w-4 h-4 inline mr-1" /> : <Plus className="w-4 h-4 inline mr-1" />} Save</Button>
        </Card>
      )}

      <div className="grid gap-4">
        {habits.map((habit) => {
          const todayCompleted = getTodayStatus(habit.id);
          return (
            <Card key={habit.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{habit.name}</h3>
                    <Badge variant="outline">{habit.category}</Badge>
                    {habit.streak > 0 && (
                      <span className="text-sm text-streak flex items-center gap-1">
                        <Flame className="w-3 h-3" aria-hidden="true" /> {habit.streak} day{habit.streak === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  {habit.description && <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>}
                  <div className="flex gap-1 mt-2" role="img" aria-label={`Last 7 days: ${weekLogs.map(({ date }) => (logs.some((l) => l.habitId === habit.id && l.date === date && l.completed) ? "done" : "missed")).join(", ")}`}>
                    {weekLogs.map(({ date, day }) => {
                      const log = logs.find((l) => l.habitId === habit.id && l.date === date);
                      return (
                        <div
                          key={date}
                          className={`w-8 h-8 rounded flex items-center justify-center text-xs ${
                            log?.completed ? "bg-success text-success-foreground" : "bg-muted"
                          }`}
                          title={`${day}: ${log?.completed ? "Done" : "Missed"}`}
                        >
                          {log?.completed ? "✓" : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    title={todayCompleted ? "Uncheck today" : "Check today"}
                    aria-pressed={todayCompleted}
                    onClick={() => toggleHabit(habit.id)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      todayCompleted ? "bg-success text-success-foreground" : "border hover:bg-accent"
                    }`}
                  >
                    {todayCompleted ? "✓" : "+"}
                  </button>
                  <button title="Edit habit" aria-label={`Edit ${habit.name}`} onClick={() => handleEdit(habit)} className="w-11 h-11 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button title="Delete habit" aria-label={`Delete ${habit.name}`} onClick={() => handleDeleteHabit(habit)} className="w-11 h-11 flex items-center justify-center hover:bg-destructive/10 rounded-lg transition-colors text-destructive-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}

        {habits.length === 0 && !showForm && isReady && (
          <Card className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No habits yet. Pick one small thing you want to keep.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
