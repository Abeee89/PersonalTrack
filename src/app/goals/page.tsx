"use client";

import { useState, useEffect } from "react";
import { getGoals, saveGoal, deleteGoal, getSubTasks, saveSubTask, deleteSubTask, StorageError } from "@/lib/db";
import { Goal, SubTask } from "@/lib/types";
import { format, parseISO } from "date-fns";
import {
  Target,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  Pencil,
} from "lucide-react";
import { Card, Button, Input, Textarea, Select, Badge, ErrorBanner } from "@/components/ui";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [subTaskTitle, setSubTaskTitle] = useState("");
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setGoals(getGoals());
  }, []);

  useEffect(() => {
    if (expandedGoal) {
      setSubTasks(getSubTasks().filter((s) => s.goalId === expandedGoal));
    }
  }, [expandedGoal]);

  const resetForm = () => {
    setShowForm(false);
    setEditingGoal(null);
    setTitle("");
    setDescription("");
    setDeadline("");
    setPriority("medium");
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const goal: Goal = {
      id: editingGoal?.id || crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      deadline,
      priority,
      status: editingGoal?.status || "not_started",
      progress: editingGoal?.progress || 0,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      saveGoal(goal);
      resetForm();
      setGoals(getGoals());
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not save goal.");
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description);
    setDeadline(goal.deadline);
    setPriority(goal.priority);
    setShowForm(true);
  };

  const handleDeleteGoal = (goal: Goal) => {
    if (!confirm(`Delete goal "${goal.title}" and its sub-tasks?`)) return;
    try {
      deleteGoal(goal.id);
      setGoals(getGoals());
      if (expandedGoal === goal.id) setExpandedGoal(null);
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not delete goal.");
    }
  };

  const toggleGoalStatus = (goal: Goal) => {
    const next = goal.status === "completed" ? "in_progress" : goal.status === "in_progress" ? "completed" : "in_progress";
    const allForGoal = getSubTasks().filter((s) => s.goalId === goal.id);
    const completed = allForGoal.filter((s) => s.completed).length;
    const subtaskProgress = allForGoal.length > 0 ? Math.round((completed / allForGoal.length) * 100) : 0;
    const progress = next === "completed" ? 100 : next === "in_progress" ? Math.max(goal.progress, subtaskProgress) : 0;
    try {
      saveGoal({ ...goal, status: next, progress });
      setGoals(getGoals());
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not update goal.");
    }
  };

  const refreshGoalProgress = () => {
    if (!expandedGoal) return;
    const allForGoal = getSubTasks().filter((s) => s.goalId === expandedGoal);
    const completed = allForGoal.filter((s) => s.completed).length;
    const progress = allForGoal.length > 0 ? Math.round((completed / allForGoal.length) * 100) : 0;
    const goal = getGoals().find((g) => g.id === expandedGoal);
    if (goal) {
      const nextStatus = goal.status === "not_started" && progress > 0 ? "in_progress" : goal.status;
      saveGoal({ ...goal, progress, status: nextStatus });
      setGoals(getGoals());
    }
  };

  const addSubTask = () => {
    if (!expandedGoal || !subTaskTitle.trim()) return;
    try {
      const allSubTasks = getSubTasks();
      const maxOrder = allSubTasks.filter((s) => s.goalId === expandedGoal).reduce((max, s) => Math.max(max, s.order), -1);
      const subTask: SubTask = {
        id: crypto.randomUUID(),
        goalId: expandedGoal,
        title: subTaskTitle.trim(),
        completed: false,
        order: maxOrder + 1,
      };
      saveSubTask(subTask);
      setSubTasks(getSubTasks().filter((s) => s.goalId === expandedGoal));
      setSubTaskTitle("");
      refreshGoalProgress();
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not add sub-task.");
    }
  };

  const toggleSubTask = (subTaskId: string) => {
    const sub = getSubTasks().find((s) => s.id === subTaskId);
    if (!sub) return;
    try {
      saveSubTask({ ...sub, completed: !sub.completed });
      setSubTasks(getSubTasks().filter((s) => s.goalId === expandedGoal));
      refreshGoalProgress();
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not update sub-task.");
    }
  };

  const handleDeleteSubTask = (id: string) => {
    try {
      deleteSubTask(id);
      setSubTasks(getSubTasks().filter((s) => s.goalId === expandedGoal));
      refreshGoalProgress();
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not delete sub-task.");
    }
  };

  const sortedGoals = [...goals].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <Target className="w-6 h-6 text-muted-foreground" />
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 inline mr-1" /> New Goal
        </Button>
      </div>

      <ErrorBanner message={error} />

      {showForm && (
        <Card className="p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{editingGoal ? "Edit Goal" : "New Goal"}</h2>
            <Button variant="ghost" size="sm" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <Input placeholder="Goal title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "medium" | "high")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <Button onClick={handleSave}>
            {editingGoal ? <Check className="w-4 h-4 inline mr-1" /> : <Plus className="w-4 h-4 inline mr-1" />} Save
          </Button>
        </Card>
      )}

      <div className="grid gap-4">
        {sortedGoals.map((goal) => (
          <Card key={goal.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{goal.title}</h3>
                  <Badge variant={goal.priority === "high" ? "destructive" : "outline"}>
                    {goal.priority}
                  </Badge>
                  <Badge variant="outline">{goal.status.replace("_", " ")}</Badge>
                </div>
                {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-full bg-muted rounded-full h-2 max-w-xs">
                    <div className="bg-brand h-2 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                  {goal.deadline && (
                    <span className="text-xs text-muted-foreground">Due: {format(parseISO(goal.deadline), "MMM d")}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button title="Toggle status" aria-label={`Change status of ${goal.title}`} onClick={() => toggleGoalStatus(goal)} className="w-11 h-11 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {goal.status === "completed" ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4" />}
                </button>
                <button title="Edit goal" aria-label={`Edit ${goal.title}`} onClick={() => handleEdit(goal)} className="w-11 h-11 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Pencil className="w-4 h-4" />
                </button>
                <button title="Expand" aria-expanded={expandedGoal === goal.id} aria-label={`Sub-tasks of ${goal.title}`} onClick={() => {
                  setExpandedGoal(expandedGoal === goal.id ? null : goal.id);
                }} className="w-11 h-11 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <ChevronDown className={`w-4 h-4 ${expandedGoal === goal.id ? "rotate-180" : ""}`} />
                </button>
                <button title="Delete goal" aria-label={`Delete ${goal.title}`} onClick={() => handleDeleteGoal(goal)} className="w-11 h-11 flex items-center justify-center hover:bg-destructive/10 rounded-lg transition-colors text-destructive-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedGoal === goal.id && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <h4 className="font-medium text-sm">Sub-Tasks</h4>
                <div className="flex gap-2">
                  <Input placeholder="Add sub-task..." value={subTaskTitle} onChange={(e) => setSubTaskTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSubTask()} className="flex-1" />
                  <Button size="sm" onClick={addSubTask}>Add</Button>
                </div>
                {subTasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2">
                    <button aria-pressed={sub.completed} aria-label={`Mark ${sub.title} ${sub.completed ? "incomplete" : "complete"}`} onClick={() => toggleSubTask(sub.id)} className={`w-6 h-6 shrink-0 rounded border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${sub.completed ? "bg-success border-success text-success-foreground" : "border-input hover:bg-accent"}`}>
                      {sub.completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`text-sm ${sub.completed ? "line-through text-muted-foreground" : ""}`}>{sub.title}</span>
                    <button title="Remove sub-task" aria-label={`Remove ${sub.title}`} onClick={() => handleDeleteSubTask(sub.id)} className="w-11 h-11 -my-2 flex items-center justify-center text-muted-foreground hover:text-destructive-text rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {subTasks.length === 0 && <p className="text-sm text-muted-foreground">No sub-tasks yet. Break the goal into small steps.</p>}
              </div>
            )}
          </Card>
        ))}

        {goals.length === 0 && !showForm && (
          <Card className="p-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No goals yet. One small, finishable goal beats five grand ones.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
