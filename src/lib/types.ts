export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: number;
  tags: string[];
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: "daily" | "weekly" | "custom";
  targetDays: string[];
  category: string;
  streak: number;
  longestStreak: number;
  lastChecked?: string;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: "low" | "medium" | "high";
  status: "not_started" | "in_progress" | "completed";
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubTask {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface DashboardStats {
  journalCount: number;
  habitsCompletedToday: number;
  habitsTotal: number;
  goalsCompleted: number;
  goalsTotal: number;
  streakDays: number;
}

export type StorageData = {
  journalEntries: JournalEntry[];
  habits: Habit[];
  habitLogs: HabitLog[];
  goals: Goal[];
  subTasks: SubTask[];
};
