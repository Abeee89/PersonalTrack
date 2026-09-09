"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getJournalEntries, saveJournalEntry, deleteJournalEntry } from "@/lib/db";
import { JournalEntry } from "@/lib/types";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Save,
  Trash2,
} from "lucide-react";
import { Card, Button, Input, Textarea } from "@/components/ui";

const MOODS = [1, 2, 3, 4, 5];
const MOOD_EMOJIS: Record<number, string> = { 1: "😢", 2: "😕", 3: "🙂", 4: "😊", 5: "🤩" };

export default function JournalDatePage() {
  const router = useRouter();
  const params = useParams();
  const dateParam = params.date as string;

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(0);
  const [tags, setTags] = useState("");

  useEffect(() => {
    const all = getJournalEntries();
    setEntries(all);
    const entry = all.find((e) => e.date === dateParam);
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setMood(entry.mood);
      setTags(entry.tags.join(", "));
    }
  }, [dateParam]);

  const handleSave = () => {
    const entry: JournalEntry = {
      id: entries.find((e) => e.date === dateParam)?.id || crypto.randomUUID(),
      date: dateParam,
      title,
      content,
      mood,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      photos: entries.find((e) => e.date === dateParam)?.photos || [],
      createdAt: entries.find((e) => e.date === dateParam)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveJournalEntry(entry);
    router.push("/journal");
  };

  const handleDelete = () => {
    const entry = entries.find((e) => e.date === dateParam);
    if (entry && confirm("Delete this entry?")) {
      deleteJournalEntry(entry.id);
      router.push("/journal");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/journal")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {format(parseISO(dateParam), "EEEE, MMMM d, yyyy")}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave}><Save className="w-4 h-4 inline mr-1" /> Save</Button>
          <Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Title</label>
          <Input placeholder="What's on your mind?" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Mood</label>
          <div className="flex gap-2 mt-2">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`text-2xl px-2 py-1 rounded-lg transition-colors ${mood === m ? "bg-accent" : "hover:bg-accent"}`}
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
            className="mt-1 min-h-[300px] prose-editor"
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
      </Card>
    </div>
  );
}
