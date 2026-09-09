"use client";

import { useState, useMemo } from "react";
import { getJournalEntries, saveJournalEntry, deleteJournalEntry } from "@/lib/db";
import { JournalEntry } from "@/lib/types";
import { format, startOfToday, subDays, parseISO } from "date-fns";
import {
  PenLine,
  Calendar,
  Trash2,
  Save,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { Card, Button, Input, Textarea } from "@/components/ui";

const MOODS = [1, 2, 3, 4, 5];
const MOOD_EMOJIS: Record<number, string> = { 1: "😢", 2: "😕", 3: "🙂", 4: "😊", 5: "🤩" };

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(startOfToday(), "yyyy-MM-dd"));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(0);
  const [tags, setTags] = useState("");
  const [editing, setEditing] = useState(false);

  useState(() => {
    setEntries(getJournalEntries());
  });

  const loadEntry = (date: string) => {
    setSelectedDate(date);
    const entry = entries.find((e) => e.date === date);
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setMood(entry.mood);
      setTags(entry.tags.join(", "));
      setEditing(true);
    } else {
      setTitle("");
      setContent("");
      setMood(0);
      setTags("");
      setEditing(false);
    }
  };

  const dates = useMemo(() => {
    const arr: string[] = [];
    for (let i = 6; i >= 0; i--) {
      arr.push(format(subDays(startOfToday(), i), "yyyy-MM-dd"));
    }
    return arr;
  }, []);

  const handleSave = () => {
    const entry: JournalEntry = {
      id: entries.find((e) => e.date === selectedDate)?.id || crypto.randomUUID(),
      date: selectedDate,
      title,
      content,
      mood,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      photos: [],
      createdAt: entries.find((e) => e.date === selectedDate)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveJournalEntry(entry);
    setEntries(getJournalEntries());
    setEditing(true);
  };

  const handleDelete = () => {
    const entry = entries.find((e) => e.date === selectedDate);
    if (entry && confirm("Delete this entry?")) {
      deleteJournalEntry(entry.id);
      setEntries(getJournalEntries());
      setEditing(false);
      setTitle("");
      setContent("");
      setMood(0);
      setTags("");
    }
  };

  const handleAddPhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          const entry = entries.find((e) => e.date === selectedDate);
          const photos = entry?.photos || [];
          photos.push(dataUrl);
          setTitle(entry?.title || "");
          setContent(entry?.content || "");
          setMood(entry?.mood || 0);
          setTags((entry?.tags.join(", ") || ""));
          // We need to update the entry with the new photo
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
          <PenLine className="w-6 h-6 text-muted-foreground" />
        </div>
        <Button onClick={handleSave}>{editing ? <Save className="w-4 h-4 inline mr-1" /> : <Plus className="w-4 h-4 inline mr-1" />} Save</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Dates
          </h3>
          <div className="space-y-1">
            {dates.map((d) => (
              <button
                key={d}
                onClick={() => loadEntry(d)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedDate === d
                    ? "bg-foreground text-background"
                    : "hover:bg-accent text-muted-foreground"
                }`}
              >
                {format(parseISO(d), "MMM d, yyyy")}
                {d === format(startOfToday(), "yyyy-MM-dd") && " (Today)"}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <Card className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <Input
                placeholder="What's on your mind?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Mood</label>
              <div className="flex gap-2 mt-2">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`text-2xl px-2 py-1 rounded-lg transition-colors ${
                      mood === m ? "bg-accent" : "hover:bg-accent"
                    }`}
                  >
                    {MOOD_EMOJIS[m]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Content</label>
              <Textarea
                placeholder="Write your journal entry..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1 min-h-[200px] prose-editor"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Tags (comma separated)</label>
              <Input
                placeholder="e.g. work, health, gratitude"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleAddPhoto}>
                <ImageIcon className="w-4 h-4 inline mr-1" /> Add Photos
              </Button>
              {editing && (
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 inline mr-1" /> Delete
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
