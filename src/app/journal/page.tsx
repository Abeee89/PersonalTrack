"use client";

import { useState, useEffect, useRef } from "react";
import { getJournalEntries, saveJournalEntry, deleteJournalEntry, StorageError } from "@/lib/db";
import { JournalEntry } from "@/lib/types";
import { isSafeImageSource, ALLOWED_IMAGE_MIME, MAX_PHOTO_BYTES } from "@/lib/photos";
import { format, parseISO, subDays, addDays, isBefore, isAfter, startOfToday } from "date-fns";
import {
  PenLine,
  Calendar,
  Trash2,
  Save,
  Plus,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, Button, Input, Textarea, ErrorBanner } from "@/components/ui";

const MOODS = [1, 2, 3, 4, 5];
const MOOD_EMOJIS: Record<number, string> = { 1: "😢", 2: "😕", 3: "🙂", 4: "😊", 5: "🤩" };

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(startOfToday(), "yyyy-MM-dd"));
  const [isReady, setIsReady] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(0);
  const [tags, setTags] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = format(startOfToday(), "yyyy-MM-dd");
  const earliest = format(subDays(startOfToday(), 365), "yyyy-MM-dd");

  useEffect(() => {
    const all = getJournalEntries();
    setEntries(all);
    const initial = all.find((e) => e.date === today);
    if (initial) {
      setTitle(initial.title);
      setContent(initial.content);
      setMood(initial.mood);
      setTags(initial.tags.join(", "));
      setEditing(true);
    }
    setIsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const shiftDate = (delta: number) => {
    const next = format(addDays(parseISO(selectedDate), delta), "yyyy-MM-dd");
    if (delta > 0 && isAfter(parseISO(next), startOfToday())) return;
    if (delta < 0 && isBefore(parseISO(next), parseISO(earliest))) return;
    loadEntry(next);
  };

  const goToday = () => loadEntry(today);

  const canGoNext = isBefore(parseISO(selectedDate), startOfToday());
  const canGoPrev = isAfter(parseISO(selectedDate), parseISO(earliest));

  const handleSave = () => {
    try {
      const existing = entries.find((e) => e.date === selectedDate);
      const entry: JournalEntry = {
        id: existing?.id || crypto.randomUUID(),
        date: selectedDate,
        title,
        content,
        mood,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        photos: existing?.photos || [],
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveJournalEntry(entry);
      setEntries(getJournalEntries());
      setEditing(true);
      setError("");
    } catch (e) {
      setError(e instanceof StorageError ? e.message : "Could not save entry.");
    }
  };

  const handleDelete = () => {
    const entry = entries.find((e) => e.date === selectedDate);
    if (entry && confirm("Delete this entry permanently? This cannot be undone.")) {
      try {
        deleteJournalEntry(entry.id);
        setEntries(getJournalEntries());
        setEditing(false);
        setTitle("");
        setContent("");
        setMood(0);
        setTags("");
        setError("");
      } catch (e) {
        setError(e instanceof StorageError ? e.message : "Could not delete entry.");
      }
    }
  };

  const handleAddPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const existing = entries.find((e) => e.date === selectedDate);
    const current = existing?.photos || [];
    const currentCount = current.length;
    const limited: File[] = [];
    Array.from(files).forEach((file) => {
      if (currentCount + limited.length >= 10) return;
      if (!ALLOWED_IMAGE_MIME.includes(file.type)) return;
      if (file.size > MAX_PHOTO_BYTES) return;
      limited.push(file);
    });
    if (limited.length === 0) {
      setError("No valid images selected. Max 2MB per photo, 10 per entry.");
      return;
    }
    let pending = limited.length;
    const nextPhotos = [...current];
    limited.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        nextPhotos.push(dataUrl.replace(/^data:(image\/[^;]+);base64,/, "data:$1;base64,"));
        pending -= 1;
        if (pending === 0) {
          try {
            const entry: JournalEntry = {
              id: existing?.id || crypto.randomUUID(),
              date: selectedDate,
              title,
              content,
              mood,
              tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
              photos: nextPhotos.slice(0, 10),
              createdAt: existing?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            saveJournalEntry(entry);
            setEntries(getJournalEntries());
            setEditing(true);
            setError("");
          } catch (e) {
            setError(e instanceof StorageError ? e.message : "Could not save photos.");
          }
        }
      };
      reader.readAsDataURL(file);
    });
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
          {isReady && (
            <div className="flex items-center gap-1 mb-3">
              <Button variant="outline" size="sm" title="Earlier day" onClick={() => shiftDate(-1)} disabled={!canGoPrev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={selectedDate === today ? "default" : "outline"}
                size="sm"
                className="flex-1 justify-center"
                title="Jump to today"
                onClick={goToday}
              >
                {format(parseISO(selectedDate), "EEE, MMM d")}
              </Button>
              <Button variant="outline" size="sm" title="Later day" onClick={() => shiftDate(1)} disabled={!canGoNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          <div className="space-y-1">
            {(() => {
              const dates: string[] = [];
              for (let i = 6; i >= 0; i--) {
                dates.push(format(addDays(startOfToday(), -i), "yyyy-MM-dd"));
              }
              return dates.map((d) => (
                <button
                  key={d}
                  onClick={() => loadEntry(d)}
                  aria-current={selectedDate === d ? "date" : undefined}
                  className={`w-full min-h-11 text-left px-3 py-2 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selectedDate === d
                      ? "bg-foreground text-background"
                      : "hover:bg-accent text-muted-foreground"
                  }`}
                >
                  {format(parseISO(d), "MMM d, yyyy")}
                  {d === today && " (Today)"}
                </button>
              ));
            })()}
          </div>
        </div>

        <div className="md:col-span-2">
          <ErrorBanner message={error} />
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
                    aria-pressed={mood === m}
                    aria-label={`Mood ${m} of 5`}
                    onClick={() => setMood(m)}
                    className={`text-2xl w-11 h-11 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      mood === m ? "bg-brand-soft ring-1 ring-brand" : "hover:bg-accent"
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

            {(() => {
              const photos = (entries.find((e) => e.date === selectedDate)?.photos || []).filter(isSafeImageSource);
              if (photos.length === 0) return null;
              return (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Photos</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {photos.map((src, i) => (
                      // data-URL previews from localStorage; next/image cannot optimize these
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt={`Entry photo ${i + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-border"
                      />
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleAddPhotos(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-4 h-4 inline mr-1" /> Add Photos
                </Button>
                {editing && (entries.find((e) => e.date === selectedDate)?.photos.length ?? 0) > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {(entries.find((e) => e.date === selectedDate)?.photos.length) ?? 0} photo(s)
                  </span>
                )}
              </div>
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
