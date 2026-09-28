"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getJournalEntries, saveJournalEntry, deleteJournalEntry, StorageError } from "@/lib/db";
import { JournalEntry } from "@/lib/types";
import { isSafeImageSource } from "@/lib/photos";
import { format, isValid, parseISO } from "date-fns";
import {
  ArrowLeft,
  Save,
  Trash2,
} from "lucide-react";
import { Card, Button, Input, Textarea, ErrorBanner } from "@/components/ui";

const MOODS = [1, 2, 3, 4, 5];
const MOOD_EMOJIS: Record<number, string> = { 1: "😢", 2: "😕", 3: "🙂", 4: "😊", 5: "🤩" };

export default function JournalDatePage() {
  const router = useRouter();
  const params = useParams();
  const dateParam = params.date as string;
  const parsedDate = parseISO(dateParam);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(0);
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");

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
    try {
      const existing = entries.find((e) => e.date === dateParam);
      const entry: JournalEntry = {
        id: existing?.id || crypto.randomUUID(),
        date: dateParam,
        title,
        content,
        mood,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        photos: existing?.photos || [],
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveJournalEntry(entry);
      router.push("/journal");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not save entry.");
    }
  };

  const handleDelete = () => {
    const entry = entries.find((e) => e.date === dateParam);
    if (entry && confirm("Delete this entry permanently? This cannot be undone.")) {
      try {
        deleteJournalEntry(entry.id);
        router.push("/journal");
      } catch (e) {
        setError(e instanceof StorageError ? e.message : "Could not delete entry.");
      }
    }
  };

  if (!isValid(parsedDate)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push("/journal")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Entry not found</h1>
        </div>
        <p className="text-muted-foreground">That journal date is invalid.</p>
        <Button variant="outline" onClick={() => router.push("/journal")} className="mt-4">
          Back to Journal
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" aria-label="Back to journal" onClick={() => router.push("/journal")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {format(parsedDate, "EEEE, MMMM d, yyyy")}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave}><Save className="w-4 h-4 inline mr-1" /> Save</Button>
          <Button variant="destructive" title="Delete entry" aria-label="Delete entry" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <ErrorBanner message={error} />
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
                aria-pressed={mood === m}
                aria-label={`Mood ${m} of 5`}
                onClick={() => setMood(m)}
                className={`text-2xl w-11 h-11 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mood === m ? "bg-brand-soft ring-1 ring-brand" : "hover:bg-accent"}`}
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

        {(() => {
          const photos = (entries.find((e) => e.date === dateParam)?.photos || []).filter(isSafeImageSource);
          if (photos.length === 0) return null;
          return (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Photos</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {photos.map((src, i) => (
                  // data-URL previews from localStorage; next/image cannot optimize these
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`Entry photo ${i + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-border"
                  />
                ))}
              </div>
            </div>
          );
        })()}
      </Card>
    </div>
  );
}
