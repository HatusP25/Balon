"use client";

import { useState } from "react";

export function DeleteMatchButton({
  deleteAction,
}: {
  deleteAction: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <form action={deleteAction} className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Confirm delete
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sm text-pitch-700 hover:underline"
        >
          Cancel
        </button>
      </form>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm text-red-600 hover:underline"
    >
      Delete match
    </button>
  );
}
