"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGoals, saveGoal, deleteGoal, getSubTasks, saveSubTask, deleteSubTask, StorageError } from "@/lib/db";
import { Goal, SubTask } from "@/lib/types";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Check,
  X,
  Trash2,
  Plus,
  Clock,
} from "lucide-react";
import { Card, Button, Input, Badge, ErrorBanner } from "@/components/ui";

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.id as string;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const g = getGoals().find((g) => g.id === goalId);
    setGoal(g || null);
    setSubTasks(getSubTasks().filter((s) => s.goalId === goalId));
  }, [goalId]);

  const addSubTask = () => {
    if (!newTitle.trim()) return;
    try {
      const all = getSubTasks().filter((s) => s.goalId === goalId);
      const maxOrder = all.reduce((max, s) => Math.max(max, s.order), -1);
      const sub: SubTask = {
        id: crypto.randomUUID(),
        goalId,
        title: newTitle.trim(),
        completed: false,
        order: maxOrder + 1,
      };
      saveSubTask(sub);
      setSubTasks(getSubTasks().filter((s) => s.goalId === goalId));
      setNewTitle("");
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not add sub-task.");
    }
  };

  const toggleSub = (subId: string) => {
    const sub = getSubTasks().find((s) => s.id === subId);
    if (!sub) return;
    try {
      saveSubTask({ ...sub, completed: !sub.completed });
      const updated = getSubTasks().filter((s) => s.goalId === goalId);
      setSubTasks(updated);
      const completed = updated.filter((s) => s.completed).length;
      const progress = updated.length > 0 ? Math.round((completed / updated.length) * 100) : 0;
      if (goal) {
        const nextStatus = goal.status === "not_started" && progress > 0 ? "in_progress" : goal.status;
        saveGoal({ ...goal, progress, status: nextStatus });
        setGoal({ ...goal, progress, status: nextStatus });
      }
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not update sub-task.");
    }
  };

  const handleDeleteSub = (subId: string) => {
    try {
      deleteSubTask(subId);
      setSubTasks(getSubTasks().filter((s) => s.goalId === goalId));
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not delete sub-task.");
    }
  };

  const toggleStatus = () => {
    if (!goal) return;
    const next: Goal["status"] = goal.status === "completed" ? "in_progress" : goal.status === "in_progress" ? "completed" : "in_progress";
    const subs = getSubTasks().filter((s) => s.goalId === goalId);
    const completedSubs = subs.filter((s) => s.completed).length;
    const subtaskProgress = subs.length > 0 ? Math.round((completedSubs / subs.length) * 100) : 0;
    const progress = next === "completed" ? 100 : next === "in_progress" ? Math.max(goal.progress, subtaskProgress) : 0;
    const updated = { ...goal, status: next, progress };
    try {
      saveGoal(updated);
      setGoal(updated);
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not update goal.");
    }
  };

  const handleDelete = () => {
    if (!confirm(`Delete goal "${goal?.title}" and its sub-tasks? This cannot be undone.`)) return;
    try {
      deleteGoal(goalId);
      router.push("/goals");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not delete goal.");
    }
  };

  if (!goal) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Goal not found.</p>
        <Button variant="outline" onClick={() => router.push("/goals")} className="mt-4">
          <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" aria-label="Back to goals" onClick={() => router.push("/goals")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{goal.title}</h1>
            {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={goal.priority === "high" ? "destructive" : "outline"}>{goal.priority}</Badge>
          <Button variant="outline" aria-label={goal.status === "completed" ? "Reopen goal" : "Mark goal complete"} onClick={toggleStatus}>
            {goal.status === "completed" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
          <Button variant="destructive" aria-label="Delete goal" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ErrorBanner message={error} />
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Progress</h2>
          <span className="text-2xl font-bold">{goal.progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div className="bg-brand h-3 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
        </div>
        {goal.deadline && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" /> Due: {format(parseISO(goal.deadline), "MMMM d, yyyy")}
            {formatDistanceToNow(parseISO(goal.deadline), { addSuffix: true })}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Sub-Tasks</h2>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Add a sub-task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSubTask()}
          />
          <Button onClick={addSubTask} aria-label="Add sub-task"><Plus className="w-4 h-4" /></Button>
        </div>

        <div className="space-y-1">
          {subTasks.map((sub) => (
            <div key={sub.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <button
                aria-pressed={sub.completed}
                aria-label={`Mark ${sub.title} ${sub.completed ? "incomplete" : "complete"}`}
                onClick={() => toggleSub(sub.id)}
                className={`w-6 h-6 shrink-0 rounded border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  sub.completed ? "bg-success border-success text-success-foreground" : "border-input hover:bg-accent"
                }`}
              >
                {sub.completed && <Check className="w-3.5 h-3.5" />}
              </button>
              <span className={`flex-1 text-sm ${sub.completed ? "line-through text-muted-foreground" : ""}`}>{sub.title}</span>
              <button
                aria-label={`Remove ${sub.title}`}
                onClick={() => handleDeleteSub(sub.id)}
                className="w-11 h-11 -my-2 flex items-center justify-center text-muted-foreground hover:text-destructive-text rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {subTasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No sub-tasks yet. Break the goal into small steps.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
