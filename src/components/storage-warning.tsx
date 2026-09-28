"use client";

import { useEffect, useState } from "react";
import { getStorageWarning } from "@/lib/db";

export default function StorageWarning() {
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    setWarning(getStorageWarning());
  }, []);

  if (!warning) return null;
  return (
    <div role="alert" className="bg-secondary text-secondary-foreground text-sm px-4 py-2 text-center border-b border-border">
      {warning}
    </div>
  );
}