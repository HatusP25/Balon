"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ArchiveButton({
  archiveAction,
}: {
  archiveAction: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <form action={archiveAction} className="flex items-center gap-2">
        <Button type="submit" variant="destructive">
          Confirm archive
        </Button>
        <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </form>
    );
  }
  return (
    <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
      Archive player
    </Button>
  );
}
