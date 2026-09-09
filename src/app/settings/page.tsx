"use client";

import { useState } from "react";
import { exportData, importData, clearAllData } from "@/lib/db";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import { Download, Upload, Trash2, AlertTriangle, FileJson } from "lucide-react";

export default function SettingsPage() {
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [message, setMessage] = useState("");

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personaltrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Data exported successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleImport = () => {
    try {
      importData(importText);
      setMessage("Data imported successfully! Refresh the page.");
      setImportText("");
      setShowImport(false);
    } catch (e: unknown) {
      setMessage(`Import failed: ${(e as Error).message}`);
    }
    setTimeout(() => setMessage(""), 5000);
  };

  const handleClear = () => {
    if (confirm("Are you sure? This will delete ALL your data permanently.")) {
      clearAllData();
      setMessage("All data cleared!");
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-accent text-accent-foreground text-sm">
          {message}
        </div>
      )}

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Data Backup</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Export your data as a JSON file. Since all data is stored locally, you can
            back it up and restore it anytime.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 inline mr-1" /> Export Data
            </Button>
            <Button variant="outline" onClick={() => setShowImport(!showImport)}>
              <Upload className="w-4 h-4 inline mr-1" /> Import Data
            </Button>
          </div>
        </Card>

        {showImport && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Import Data</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Paste your exported JSON data below to restore it.
            </p>
            <textarea
              className="w-full h-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Paste JSON data here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <Button className="mt-3" onClick={handleImport}>Import</Button>
          </Card>
        )}

        <Card className="p-6 border-destructive/30">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h2 className="text-xl font-semibold">Danger Zone</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            This will permanently delete all your data. This action cannot be undone.
          </p>
          <Button variant="destructive" onClick={handleClear}>
            <Trash2 className="w-4 h-4 inline mr-1" /> Clear All Data
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">PersonalTrack</strong> — Your local-first personal tracking app</p>
            <p>Built with Next.js, TypeScript, and Tailwind CSS</p>
            <p>All data is stored in your browser using localStorage. No server or cloud required.</p>
            <p className="flex items-center gap-1 mt-2">
              <FileJson className="w-4 h-4" /> Data format: JSON
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
