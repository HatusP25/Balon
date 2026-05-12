"use client";

import { useTransition } from "react";
import { listFormations } from "@/lib/formations";

interface Props {
  current: string;
  onChange: (formationId: string) => Promise<void> | void;
}

export function FormationTabs({ current, onChange }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      {listFormations().map((f) => {
        const active = f.id === current;
        return (
          <button
            key={f.id}
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => void onChange(f.id))}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-pitch-600 text-white"
                : "border border-pitch-100 bg-white text-pitch-900 hover:border-pitch-600"
            } ${pending ? "opacity-50" : ""}`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
