"use client";

import { useState } from "react";
import { listFormations } from "@/lib/formations";

interface Props {
  name: string;
  defaultValue?: string;
}

export function FormationPicker({ name, defaultValue = "3-3-2" }: Props) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex flex-wrap gap-2">
      {listFormations().map((f) => {
        const selected = value === f.id;
        return (
          <label
            key={f.id}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${
              selected
                ? "bg-pitch-600 text-white"
                : "border border-pitch-100 bg-white text-pitch-900 hover:border-pitch-600"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={f.id}
              checked={selected}
              onChange={() => setValue(f.id)}
              className="sr-only"
            />
            {f.label}
          </label>
        );
      })}
    </div>
  );
}
