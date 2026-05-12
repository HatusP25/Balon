# Balon — Plan 2: Matches & Lineup Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Balon useful for planning Monday's match. The admin can create a match, pick a formation, fill the lineup on a pitch (tap-to-fill + drag-to-reposition + Custom mode), and share a public URL that renders the lineup for friends opening it in WhatsApp.

**Architecture:** Build on Plan 1's foundation. Add formation presets (data-only, no DB), match + lineup-slot CRUD queries, a drag-and-drop lineup builder (client component using `@dnd-kit/core`), and a mobile-first public match page. Auto-save: every UI interaction triggers a server action; the public page reads the latest `lineup_slots` directly.

**Tech Stack additions:**
- `@dnd-kit/core` + `@dnd-kit/modifiers` (drag-and-drop, mobile-friendly)
- `nanoid` (short slug generation)
- React Hook Form + Zod (already in use indirectly; we'll add the React Hook Form lib)

---

## Out of scope (Plan 3)

- Post-match result entry (score, attendance, goals)
- Stats / leaderboards / player profiles
- `@vercel/og` image generation ("Download Image" button)
- Public stats page

---

## File Structure (new files)

```
src/
├── lib/
│   ├── formations.ts                    # preset positions for each formation
│   ├── slugs.ts                          # short URL-safe slug generator
│   └── db/
│       └── queries/
│           ├── matches.ts                # match CRUD
│           └── lineup-slots.ts           # lineup slot CRUD
├── app/
│   ├── (admin)/
│   │   ├── matches/
│   │   │   ├── page.tsx                  # /matches — list of matches
│   │   │   ├── new/
│   │   │   │   └── page.tsx              # /matches/new — create match form
│   │   │   ├── actions.ts                # match create / delete actions
│   │   │   └── [id]/
│   │   │       └── lineup/
│   │   │           ├── page.tsx          # /matches/[id]/lineup — lineup builder shell
│   │   │           └── actions.ts        # slot CRUD server actions
│   │   └── page.tsx                      # MODIFY — show next planned match card
│   └── (public)/
│       └── p/
│           ├── page.tsx                  # MODIFY — show next match preview
│           └── match/
│               └── [slug]/
│                   └── page.tsx          # /p/match/[slug] — public lineup view
└── components/
    ├── matches/
    │   ├── match-list-row.tsx
    │   ├── match-form.tsx
    │   └── formation-picker.tsx
    ├── lineup/
    │   ├── pitch.tsx                     # presentational pitch background (stripes, lines)
    │   ├── pitch-slot.tsx                # single placeable slot (drag + tap targets)
    │   ├── player-chip.tsx               # avatar + name + number, used on field & in pool
    │   ├── roster-pool.tsx               # sidebar/bottom drawer of available players
    │   ├── player-picker-modal.tsx       # modal to fill an empty slot
    │   ├── formation-tabs.tsx            # chips at the top of the builder
    │   └── lineup-builder.tsx            # orchestrator client component
    └── public/
        └── public-pitch.tsx              # read-only pitch render reused by /p/match/[slug]

tests/
├── unit/
│   ├── formations.test.ts
│   └── slugs.test.ts
└── e2e/
    └── lineup.spec.ts                    # create match → build lineup → public view
```

---

### Task 1: Formation presets module

Pure data + helper. No DB.

**Files:**
- Create: `src/lib/formations.ts`
- Create: `tests/unit/formations.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/formations.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { FORMATIONS, getFormation, listFormations } from "@/lib/formations";

describe("formations", () => {
  it("lists at least the four core presets and Custom", () => {
    const ids = listFormations().map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(["3-3-2", "3-2-3", "4-3-1", "2-3-3", "custom"]));
  });

  it("3-3-2 has 9 slots (1 GK + 3 DF + 3 MF + 2 FW)", () => {
    const f = getFormation("3-3-2");
    expect(f).toBeDefined();
    expect(f!.slots.length).toBe(9);
    const byRole = f!.slots.reduce<Record<string, number>>((acc, s) => {
      acc[s.role] = (acc[s.role] ?? 0) + 1;
      return acc;
    }, {});
    expect(byRole).toEqual({ GK: 1, DF: 3, MF: 3, FW: 2 });
  });

  it("every slot has x and y between 0 and 100", () => {
    for (const f of FORMATIONS.filter((f) => f.id !== "custom")) {
      for (const s of f.slots) {
        expect(s.x).toBeGreaterThanOrEqual(0);
        expect(s.x).toBeLessThanOrEqual(100);
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeLessThanOrEqual(100);
      }
    }
  });

  it("custom formation has no slots", () => {
    const f = getFormation("custom");
    expect(f).toBeDefined();
    expect(f!.slots.length).toBe(0);
  });

  it("getFormation returns undefined for unknown id", () => {
    expect(getFormation("9-9-9")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test → fail**

```bash
npm run test:unit
```

Expected: 5 failures (Cannot find module).

- [ ] **Step 3: Implement**

`src/lib/formations.ts`:

```ts
export type Role = "GK" | "DF" | "MF" | "FW";

export interface FormationSlot {
  x: number; // 0-100, % from left
  y: number; // 0-100, % from top (0 = opponent goal end; 100 = our goal end)
  role: Role;
}

export interface Formation {
  id: string;
  label: string;
  slots: FormationSlot[];
}

// Y conventions: GK ~92, DF ~70, MF ~45, FW ~20
export const FORMATIONS: Formation[] = [
  {
    id: "3-3-2",
    label: "3-3-2",
    slots: [
      { x: 50, y: 92, role: "GK" },
      { x: 20, y: 70, role: "DF" },
      { x: 50, y: 70, role: "DF" },
      { x: 80, y: 70, role: "DF" },
      { x: 25, y: 45, role: "MF" },
      { x: 50, y: 45, role: "MF" },
      { x: 75, y: 45, role: "MF" },
      { x: 35, y: 20, role: "FW" },
      { x: 65, y: 20, role: "FW" },
    ],
  },
  {
    id: "3-2-3",
    label: "3-2-3",
    slots: [
      { x: 50, y: 92, role: "GK" },
      { x: 20, y: 70, role: "DF" },
      { x: 50, y: 70, role: "DF" },
      { x: 80, y: 70, role: "DF" },
      { x: 35, y: 45, role: "MF" },
      { x: 65, y: 45, role: "MF" },
      { x: 20, y: 20, role: "FW" },
      { x: 50, y: 20, role: "FW" },
      { x: 80, y: 20, role: "FW" },
    ],
  },
  {
    id: "4-3-1",
    label: "4-3-1",
    slots: [
      { x: 50, y: 92, role: "GK" },
      { x: 15, y: 70, role: "DF" },
      { x: 38, y: 70, role: "DF" },
      { x: 62, y: 70, role: "DF" },
      { x: 85, y: 70, role: "DF" },
      { x: 25, y: 45, role: "MF" },
      { x: 50, y: 45, role: "MF" },
      { x: 75, y: 45, role: "MF" },
      { x: 50, y: 20, role: "FW" },
    ],
  },
  {
    id: "2-3-3",
    label: "2-3-3",
    slots: [
      { x: 50, y: 92, role: "GK" },
      { x: 35, y: 70, role: "DF" },
      { x: 65, y: 70, role: "DF" },
      { x: 25, y: 45, role: "MF" },
      { x: 50, y: 45, role: "MF" },
      { x: 75, y: 45, role: "MF" },
      { x: 20, y: 20, role: "FW" },
      { x: 50, y: 20, role: "FW" },
      { x: 80, y: 20, role: "FW" },
    ],
  },
  {
    id: "custom",
    label: "Custom",
    slots: [],
  },
];

export function listFormations(): Formation[] {
  return FORMATIONS;
}

export function getFormation(id: string): Formation | undefined {
  return FORMATIONS.find((f) => f.id === id);
}
```

- [ ] **Step 4: Run test → pass**

```bash
npm run test:unit
```

Expected: all 5 formation tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/formations.ts tests/unit/formations.test.ts
git commit -m "feat: formation presets module"
```

---

### Task 2: Short slug generator

**Files:**
- Create: `src/lib/slugs.ts`
- Create: `tests/unit/slugs.test.ts`

- [ ] **Step 1: Install nanoid**

```bash
npm install nanoid
```

- [ ] **Step 2: Failing test**

`tests/unit/slugs.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateShortSlug } from "@/lib/slugs";

describe("generateShortSlug", () => {
  it("returns a 6-char URL-safe string", () => {
    const slug = generateShortSlug();
    expect(slug).toMatch(/^[A-Za-z0-9_-]{6}$/);
  });

  it("returns different values across calls", () => {
    const a = generateShortSlug();
    const b = generateShortSlug();
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 3: Run → fail**

```bash
npm run test:unit
```

- [ ] **Step 4: Implement**

`src/lib/slugs.ts`:

```ts
import { customAlphabet } from "nanoid";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const nano = customAlphabet(ALPHABET, 6);

export function generateShortSlug(): string {
  return nano();
}
```

- [ ] **Step 5: Run → pass**

- [ ] **Step 6: Commit**

```bash
git add src/lib/slugs.ts tests/unit/slugs.test.ts
git commit -m "feat: short slug generator for public URLs"
```

---

### Task 3: Match DB queries

**Files:**
- Create: `src/lib/db/queries/matches.ts`

- [ ] **Step 1: Implement**

```ts
// src/lib/db/queries/matches.ts
import { eq, desc, gte, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { matches, type Match, type NewMatch } from "@/lib/db/schema";

export async function listMatches(): Promise<Match[]> {
  return db.select().from(matches).orderBy(desc(matches.playedAt));
}

export async function getMatchById(id: string): Promise<Match | undefined> {
  const rows = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
  return rows[0];
}

export async function getMatchBySlug(slug: string): Promise<Match | undefined> {
  const rows = await db.select().from(matches).where(eq(matches.shortSlug, slug)).limit(1);
  return rows[0];
}

export async function createMatch(input: NewMatch): Promise<Match> {
  const [row] = await db.insert(matches).values(input).returning();
  return row;
}

export async function updateMatch(id: string, patch: Partial<NewMatch>): Promise<Match> {
  const [row] = await db
    .update(matches)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(matches.id, id))
    .returning();
  return row;
}

export async function deleteMatch(id: string): Promise<void> {
  await db.delete(matches).where(eq(matches.id, id));
}

export async function bumpLineupVersion(id: string): Promise<void> {
  // simple read-modify-write; only one admin so no race concern
  const m = await getMatchById(id);
  if (!m) return;
  await db
    .update(matches)
    .set({ lineupVersion: m.lineupVersion + 1, updatedAt: new Date() })
    .where(eq(matches.id, id));
}

export async function getNextPlannedMatch(): Promise<Match | undefined> {
  const now = new Date();
  const rows = await db
    .select()
    .from(matches)
    .where(and(eq(matches.status, "planned"), gte(matches.playedAt, now)))
    .orderBy(matches.playedAt)
    .limit(1);
  return rows[0];
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/lib/db/queries/matches.ts
git commit -m "feat: match DB queries"
```

---

### Task 4: Lineup slot DB queries

**Files:**
- Create: `src/lib/db/queries/lineup-slots.ts`

- [ ] **Step 1: Implement**

```ts
// src/lib/db/queries/lineup-slots.ts
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { lineupSlots } from "@/lib/db/schema";
import type { Role } from "@/lib/formations";

export interface SlotRow {
  id: string;
  matchId: string;
  playerId: string | null;
  x: string; // numeric column comes back as string from postgres.js
  y: string;
  role: Role;
}

export async function listSlotsForMatch(matchId: string): Promise<SlotRow[]> {
  const rows = await db.select().from(lineupSlots).where(eq(lineupSlots.matchId, matchId));
  return rows.map((r) => ({
    id: r.id,
    matchId: r.matchId,
    playerId: r.playerId,
    x: r.x as unknown as string,
    y: r.y as unknown as string,
    role: r.role as Role,
  }));
}

export async function insertSlots(
  matchId: string,
  slots: { x: number; y: number; role: Role; playerId?: string | null }[],
): Promise<void> {
  if (slots.length === 0) return;
  await db.insert(lineupSlots).values(
    slots.map((s) => ({
      matchId,
      x: String(s.x),
      y: String(s.y),
      role: s.role,
      playerId: s.playerId ?? null,
    })),
  );
}

export async function updateSlotPosition(
  slotId: string,
  x: number,
  y: number,
): Promise<void> {
  await db
    .update(lineupSlots)
    .set({ x: String(x), y: String(y) })
    .where(eq(lineupSlots.id, slotId));
}

export async function assignPlayerToSlot(
  slotId: string,
  playerId: string | null,
): Promise<void> {
  await db.update(lineupSlots).set({ playerId }).where(eq(lineupSlots.id, slotId));
}

export async function deleteSlot(slotId: string): Promise<void> {
  await db.delete(lineupSlots).where(eq(lineupSlots.id, slotId));
}

export async function deleteAllSlotsForMatch(matchId: string): Promise<void> {
  await db.delete(lineupSlots).where(eq(lineupSlots.matchId, matchId));
}

export async function insertEmptySlot(
  matchId: string,
  x: number,
  y: number,
  role: Role,
): Promise<SlotRow> {
  const [row] = await db
    .insert(lineupSlots)
    .values({ matchId, x: String(x), y: String(y), role, playerId: null })
    .returning();
  return {
    id: row.id,
    matchId: row.matchId,
    playerId: row.playerId,
    x: row.x as unknown as string,
    y: row.y as unknown as string,
    role: row.role as Role,
  };
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/lib/db/queries/lineup-slots.ts
git commit -m "feat: lineup slot DB queries"
```

---

### Task 5: Match create action + new-match page

**Files:**
- Create: `src/app/(admin)/matches/actions.ts`
- Create: `src/components/matches/match-form.tsx`
- Create: `src/components/matches/formation-picker.tsx`
- Create: `src/app/(admin)/matches/new/page.tsx`

- [ ] **Step 1: Server action**

`src/app/(admin)/matches/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createMatch, deleteMatch, bumpLineupVersion } from "@/lib/db/queries/matches";
import { insertSlots } from "@/lib/db/queries/lineup-slots";
import { generateShortSlug } from "@/lib/slugs";
import { getFormation } from "@/lib/formations";

const MatchSchema = z.object({
  playedAt: z.string().min(1, "Date is required"),
  opponentName: z.string().trim().max(80).optional(),
  formation: z.enum(["3-3-2", "3-2-3", "4-3-1", "2-3-3", "custom"]),
});

type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

export async function createMatchAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = {
    playedAt: String(fd.get("playedAt") ?? ""),
    opponentName: String(fd.get("opponentName") ?? "").trim() || undefined,
    formation: String(fd.get("formation") ?? "") as
      | "3-3-2"
      | "3-2-3"
      | "4-3-1"
      | "2-3-3"
      | "custom",
  };
  const parsed = MatchSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const playedAt = new Date(parsed.data.playedAt);
  if (isNaN(playedAt.getTime())) {
    return { fieldErrors: { playedAt: "Invalid date" } };
  }

  const match = await createMatch({
    shortSlug: generateShortSlug(),
    playedAt,
    opponentName: parsed.data.opponentName ?? null,
    formation: parsed.data.formation,
    status: "planned",
  });

  // Seed lineup slots from the preset
  const formation = getFormation(parsed.data.formation);
  if (formation && formation.slots.length > 0) {
    await insertSlots(
      match.id,
      formation.slots.map((s) => ({ x: s.x, y: s.y, role: s.role, playerId: null })),
    );
  }

  revalidatePath("/matches");
  redirect(`/matches/${match.id}/lineup`);
}

export async function deleteMatchAction(id: string): Promise<void> {
  await deleteMatch(id);
  revalidatePath("/matches");
  redirect("/matches");
}

export async function bumpVersionAction(matchId: string): Promise<void> {
  await bumpLineupVersion(matchId);
}
```

- [ ] **Step 2: FormationPicker (radio chip)**

`src/components/matches/formation-picker.tsx`:

```tsx
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
```

- [ ] **Step 3: MatchForm**

`src/components/matches/match-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormationPicker } from "./formation-picker";
import type { createMatchAction } from "@/app/(admin)/matches/actions";

type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

export function MatchForm({ action }: { action: typeof createMatchAction }) {
  const [state, dispatch, pending] = useActionState(action, undefined);

  // default to today, 7pm local
  const now = new Date();
  now.setHours(19, 0, 0, 0);
  const defaultDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <form
      action={dispatch}
      className="max-w-md space-y-5 rounded-xl border border-pitch-100 bg-white p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="playedAt">Date and kickoff *</Label>
        <Input
          id="playedAt"
          name="playedAt"
          type="datetime-local"
          required
          defaultValue={defaultDateTime}
        />
        {state?.fieldErrors?.playedAt && (
          <p className="text-sm text-red-600">{state.fieldErrors.playedAt}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="opponentName">Opponent (optional)</Label>
        <Input
          id="opponentName"
          name="opponentName"
          type="text"
          maxLength={80}
          placeholder="e.g. Los Pumas"
        />
      </div>

      <div className="space-y-2">
        <Label>Formation</Label>
        <FormationPicker name="formation" defaultValue="3-3-2" />
        {state?.fieldErrors?.formation && (
          <p className="text-sm text-red-600">{state.fieldErrors.formation}</p>
        )}
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full bg-pitch-600 hover:bg-pitch-700">
        {pending ? "Creating…" : "Create Match"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: New-match page**

`src/app/(admin)/matches/new/page.tsx`:

```tsx
import { MatchForm } from "@/components/matches/match-form";
import { createMatchAction } from "../actions";

export default function NewMatchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-pitch-900">New Match</h2>
        <p className="text-sm text-pitch-700">Pick a date and formation to start.</p>
      </div>
      <MatchForm action={createMatchAction} />
    </div>
  );
}
```

- [ ] **Step 5: Build verification with fake env**

```bash
DATABASE_URL='postgres://fake:fake@unreachable.invalid:5432/fake' ADMIN_PASSWORD=test SESSION_SECRET="$(printf 'x%.0s' {1..40})" DATA_DIR=/tmp/balon-build-test NODE_ENV=production npm run build
```

Expected: `/matches/new` shows up as ○ (Static) — it's a server component that doesn't hit the DB at render. The lineup builder route doesn't exist yet, so the redirect target won't be checked at build time.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: match creation form and action"
```

---

### Task 6: Match list page

**Files:**
- Create: `src/components/matches/match-list-row.tsx`
- Create: `src/app/(admin)/matches/page.tsx`

- [ ] **Step 1: MatchListRow**

`src/components/matches/match-list-row.tsx`:

```tsx
import Link from "next/link";
import type { Match } from "@/lib/db/schema";

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MatchListRow({ match }: { match: Match }) {
  const isPlanned = match.status === "planned";
  return (
    <Link
      href={`/matches/${match.id}/lineup`}
      className="flex items-center justify-between rounded-xl border border-pitch-100 bg-white p-4 transition hover:border-pitch-600"
    >
      <div>
        <p className="text-sm font-semibold text-pitch-900">
          {match.opponentName ? `vs ${match.opponentName}` : "vs (no opponent)"}
        </p>
        <p className="text-xs text-pitch-700">
          {fmtDate(match.playedAt)} · {match.formation}
        </p>
      </div>
      {isPlanned ? (
        <span className="rounded-full bg-pitch-100 px-3 py-1 text-xs font-medium text-pitch-700">
          Planned
        </span>
      ) : (
        <span className="rounded-full bg-pitch-600 px-3 py-1 text-xs font-medium text-white">
          {match.ourScore}–{match.theirScore}
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Matches list page**

`src/app/(admin)/matches/page.tsx`:

```tsx
import Link from "next/link";
import { listMatches } from "@/lib/db/queries/matches";
import { MatchListRow } from "@/components/matches/match-list-row";

export default async function MatchesPage() {
  const matches = await listMatches();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pitch-900">Matches</h2>
          <p className="text-sm text-pitch-700">{matches.length} total</p>
        </div>
        <Link
          href="/matches/new"
          className="inline-flex items-center justify-center rounded-lg bg-pitch-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-pitch-700"
        >
          + New Match
        </Link>
      </div>
      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-pitch-100 bg-white p-12 text-center">
          <p className="text-pitch-700">No matches yet. Create your first match.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map((m) => (
            <li key={m.id}>
              <MatchListRow match={m} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Build verification**

```bash
DATABASE_URL='postgres://fake:fake@unreachable.invalid:5432/fake' ADMIN_PASSWORD=test SESSION_SECRET="$(printf 'x%.0s' {1..40})" DATA_DIR=/tmp/balon-build-test NODE_ENV=production npm run build
```

Expected: `/matches` route appears as `ƒ` (dynamic).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: match list page"
```

---

### Task 7: Lineup builder server actions

**Files:**
- Create: `src/app/(admin)/matches/[id]/lineup/actions.ts`

- [ ] **Step 1: Implement**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  insertEmptySlot,
  assignPlayerToSlot,
  updateSlotPosition,
  deleteSlot,
} from "@/lib/db/queries/lineup-slots";
import { bumpLineupVersion, updateMatch } from "@/lib/db/queries/matches";

const PositionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export async function moveSlotAction(
  matchId: string,
  slotId: string,
  x: number,
  y: number,
): Promise<void> {
  const parsed = PositionSchema.safeParse({ x, y });
  if (!parsed.success) return;
  await updateSlotPosition(slotId, parsed.data.x, parsed.data.y);
  await bumpLineupVersion(matchId);
  revalidatePath(`/matches/${matchId}/lineup`);
}

export async function assignPlayerAction(
  matchId: string,
  slotId: string,
  playerId: string | null,
): Promise<void> {
  await assignPlayerToSlot(slotId, playerId);
  await bumpLineupVersion(matchId);
  revalidatePath(`/matches/${matchId}/lineup`);
}

export async function addSlotAction(
  matchId: string,
  x: number,
  y: number,
  role: "FW" | "MF" | "DF" | "GK",
  playerId: string | null,
): Promise<{ id: string }> {
  const parsed = PositionSchema.safeParse({ x, y });
  if (!parsed.success) throw new Error("Invalid position");
  const slot = await insertEmptySlot(matchId, parsed.data.x, parsed.data.y, role);
  if (playerId) await assignPlayerToSlot(slot.id, playerId);
  await bumpLineupVersion(matchId);
  revalidatePath(`/matches/${matchId}/lineup`);
  return { id: slot.id };
}

export async function removeSlotAction(matchId: string, slotId: string): Promise<void> {
  await deleteSlot(slotId);
  await bumpLineupVersion(matchId);
  revalidatePath(`/matches/${matchId}/lineup`);
}

export async function updateFormationAction(
  matchId: string,
  formation: "3-3-2" | "3-2-3" | "4-3-1" | "2-3-3" | "custom",
): Promise<void> {
  await updateMatch(matchId, { formation });
  await bumpLineupVersion(matchId);
  revalidatePath(`/matches/${matchId}/lineup`);
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/app/\(admin\)/matches/\[id\]/lineup/actions.ts
git commit -m "feat: lineup slot server actions"
```

---

### Task 8: Pitch + PitchSlot + PlayerChip components

These are presentational pieces. Pure components.

**Files:**
- Create: `src/components/lineup/pitch.tsx`
- Create: `src/components/lineup/player-chip.tsx`
- Create: `src/components/lineup/pitch-slot.tsx`

- [ ] **Step 1: PlayerChip**

`src/components/lineup/player-chip.tsx`:

```tsx
import type { Player } from "@/types/player";

interface Props {
  player: Pick<Player, "id" | "nickname" | "jerseyNumber" | "avatarPath"> | null;
  /** Optional placeholder content when player is null (e.g., "+") */
  placeholder?: React.ReactNode;
  size?: "sm" | "md";
}

export function PlayerChip({ player, placeholder, size = "md" }: Props) {
  const dimension = size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-sm";
  return (
    <div className="flex flex-col items-center pointer-events-none">
      <div
        className={`relative ${dimension} overflow-hidden rounded-full border-2 border-white bg-white shadow-md`}
      >
        {player?.avatarPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/avatars/${player.avatarPath.split("/").pop()}`}
            alt={player.nickname}
            className="h-full w-full object-cover"
          />
        ) : player ? (
          <div className="flex h-full w-full items-center justify-center bg-pitch-100 font-bold text-pitch-600">
            {player.nickname[0]?.toUpperCase() ?? "?"}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/20 text-white">
            {placeholder ?? "+"}
          </div>
        )}
        {player?.jerseyNumber !== null && player?.jerseyNumber !== undefined && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-pitch-600 text-[10px] font-bold text-white">
            {player.jerseyNumber}
          </span>
        )}
      </div>
      {player && (
        <p className="mt-1 max-w-[80px] truncate text-center text-[10px] font-semibold text-white drop-shadow">
          {player.nickname}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Pitch (presentational background)**

`src/components/lineup/pitch.tsx`:

```tsx
import React from "react";

export function Pitch({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-pitch-600 to-pitch-700 shadow-lg">
      {/* horizontal stripes */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 6%, rgba(255,255,255,0.6) 6%, rgba(255,255,255,0.6) 12%)",
        }}
      />
      {/* outline */}
      <div className="absolute inset-3 rounded-xl border-2 border-white/30" />
      {/* halfway line */}
      <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-white/30" />
      {/* center circle */}
      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
      {/* center dot */}
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40" />
      {/* penalty box top */}
      <div className="absolute left-[20%] right-[20%] top-3 h-[18%] border-2 border-white/30 border-t-0" />
      {/* penalty box bottom */}
      <div className="absolute bottom-3 left-[20%] right-[20%] h-[18%] border-2 border-white/30 border-b-0" />
      {/* children layered on top */}
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: PitchSlot (presentational; interactivity comes in Task 9)**

`src/components/lineup/pitch-slot.tsx`:

```tsx
import { PlayerChip } from "./player-chip";
import type { Player } from "@/types/player";

interface Props {
  x: number;
  y: number;
  player: Pick<Player, "id" | "nickname" | "jerseyNumber" | "avatarPath"> | null;
  onClick?: () => void;
  isDragging?: boolean;
}

export function PitchSlot({ x, y, player, onClick, isDragging }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ left: `${x}%`, top: `${y}%` }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${
        isDragging ? "z-20 scale-110" : "z-10"
      }`}
      aria-label={player ? `Edit ${player.nickname}` : "Add player"}
    >
      <PlayerChip player={player} />
    </button>
  );
}
```

- [ ] **Step 4: Build verification**

```bash
DATABASE_URL='postgres://fake:fake@unreachable.invalid:5432/fake' ADMIN_PASSWORD=test SESSION_SECRET="$(printf 'x%.0s' {1..40})" DATA_DIR=/tmp/balon-build-test NODE_ENV=production npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/lineup/
git commit -m "feat: pitch + player-chip + pitch-slot presentational components"
```

---

### Task 9: Roster pool + player picker modal

**Files:**
- Create: `src/components/lineup/roster-pool.tsx`
- Create: `src/components/lineup/player-picker-modal.tsx`

- [ ] **Step 1: PlayerPickerModal**

`src/components/lineup/player-picker-modal.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import type { Player } from "@/types/player";

interface Props {
  open: boolean;
  onClose: () => void;
  availablePlayers: Player[]; // regulars + guests, minus those already in the lineup
  /** Returns chosen player id or "+guest" / null to clear */
  onPick: (playerId: string | null) => Promise<void> | void;
  /** Optional: provide a way to create a guest on the fly */
  onCreateGuest?: (nickname: string) => Promise<string>; // returns new player id
}

export function PlayerPickerModal({
  open,
  onClose,
  availablePlayers,
  onPick,
  onCreateGuest,
}: Props) {
  const [query, setQuery] = useState("");
  const [guestName, setGuestName] = useState("");
  const [, startTransition] = useTransition();

  if (!open) return null;

  const filtered = availablePlayers.filter((p) =>
    p.nickname.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-pitch-900">Pick a player</h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-pitch-700 hover:bg-pitch-100"
          >
            ✕
          </button>
        </div>

        <input
          autoFocus
          type="text"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-3 w-full rounded-md border border-pitch-100 px-3 py-2 text-sm focus:border-pitch-600 focus:outline-none"
        />

        <div className="max-h-72 overflow-y-auto">
          <ul className="flex flex-col gap-1">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-pitch-100"
                  onClick={() => {
                    startTransition(() => {
                      void onPick(p.id);
                      onClose();
                    });
                  }}
                >
                  <span className="font-semibold text-pitch-900">{p.nickname}</span>
                  {p.jerseyNumber !== null && (
                    <span className="text-xs text-pitch-700">#{p.jerseyNumber}</span>
                  )}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-pitch-700">No players match.</li>
            )}
          </ul>
        </div>

        {onCreateGuest && (
          <div className="mt-4 border-t border-pitch-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-pitch-700">
              Or add a guest
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Guest nickname"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="flex-1 rounded-md border border-pitch-100 px-3 py-2 text-sm focus:border-pitch-600 focus:outline-none"
              />
              <button
                type="button"
                disabled={guestName.trim().length === 0}
                className="rounded-md bg-pitch-600 px-3 py-2 text-sm font-medium text-white hover:bg-pitch-700 disabled:opacity-50"
                onClick={() => {
                  const name = guestName.trim();
                  if (name.length === 0) return;
                  startTransition(async () => {
                    const newId = await onCreateGuest(name);
                    await onPick(newId);
                    setGuestName("");
                    onClose();
                  });
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="text-sm text-pitch-700 hover:underline"
            onClick={() => {
              startTransition(() => {
                void onPick(null);
                onClose();
              });
            }}
          >
            Clear slot
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: RosterPool**

`src/components/lineup/roster-pool.tsx`:

```tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Player } from "@/types/player";
import { PlayerChip } from "./player-chip";

function DraggablePlayer({ player }: { player: Player }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool:${player.id}`,
    data: { type: "pool", playerId: player.id },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex shrink-0 cursor-grab flex-col items-center rounded-lg p-2 transition ${
        isDragging ? "opacity-50" : "hover:bg-pitch-50"
      }`}
    >
      <PlayerChip player={player} size="sm" />
    </div>
  );
}

export function RosterPool({
  available,
  selectedIds,
}: {
  available: Player[];
  selectedIds: Set<string>;
}) {
  const remaining = available.filter((p) => !selectedIds.has(p.id));
  return (
    <div className="rounded-xl border border-pitch-100 bg-white p-3">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-pitch-700">
        Available ({remaining.length})
      </p>
      <div className="flex flex-wrap gap-1">
        {remaining.map((p) => (
          <DraggablePlayer key={p.id} player={p} />
        ))}
        {remaining.length === 0 && (
          <p className="px-2 py-4 text-xs text-pitch-700">All players placed.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Install @dnd-kit**

```bash
npm install @dnd-kit/core @dnd-kit/modifiers
```

- [ ] **Step 4: Build + commit**

```bash
DATABASE_URL='postgres://fake:fake@unreachable.invalid:5432/fake' ADMIN_PASSWORD=test SESSION_SECRET="$(printf 'x%.0s' {1..40})" DATA_DIR=/tmp/balon-build-test NODE_ENV=production npm run build
git add -A
git commit -m "feat: roster pool (draggable) + player picker modal"
```

---

### Task 10: Lineup builder orchestrator (client component)

This is the centerpiece. Wires together pitch, slots, pool, picker, dnd-kit, and server actions.

**Files:**
- Create: `src/components/lineup/formation-tabs.tsx`
- Create: `src/components/lineup/lineup-builder.tsx`

- [ ] **Step 1: FormationTabs**

`src/components/lineup/formation-tabs.tsx`:

```tsx
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
```

- [ ] **Step 2: LineupBuilder**

`src/components/lineup/lineup-builder.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Player } from "@/types/player";
import type { SlotRow } from "@/lib/db/queries/lineup-slots";
import { Pitch } from "./pitch";
import { PitchSlot } from "./pitch-slot";
import { RosterPool } from "./roster-pool";
import { PlayerPickerModal } from "./player-picker-modal";
import { FormationTabs } from "./formation-tabs";

interface Props {
  matchId: string;
  formation: string;
  slots: SlotRow[];
  players: Player[];
  actions: {
    move: (slotId: string, x: number, y: number) => Promise<void>;
    assign: (slotId: string, playerId: string | null) => Promise<void>;
    addSlot: (
      x: number,
      y: number,
      role: "FW" | "MF" | "DF" | "GK",
      playerId: string | null,
    ) => Promise<{ id: string }>;
    remove: (slotId: string) => Promise<void>;
    setFormation: (formationId: string) => Promise<void>;
    createGuest: (nickname: string) => Promise<string>;
  };
}

function DroppablePitch({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: "pitch", data: { type: "pitch" } });
  return (
    <div ref={setNodeRef} className="relative h-full w-full">
      {children}
    </div>
  );
}

export function LineupBuilder({ matchId, formation, slots, players, actions }: Props) {
  const [pickingSlotId, setPickingSlotId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const slotsById = new Map(slots.map((s) => [s.id, s]));
  const playerById = new Map(players.map((p) => [p.id, p]));
  const selectedIds = new Set(slots.filter((s) => s.playerId).map((s) => s.playerId!));

  async function onDragEnd(e: DragEndEvent) {
    const { active, over, delta } = e;
    if (!over) return;

    // Case 1: dragging an existing slot on the pitch → move it
    if (typeof active.id === "string" && active.id.startsWith("slot:")) {
      const slotId = active.id.slice("slot:".length);
      const slot = slotsById.get(slotId);
      if (!slot) return;
      // delta is in pixels; convert to % of pitch dimensions via the active rect
      const rect = active.rect.current.translated;
      if (!rect) return;
      const pitch = over.rect;
      const cx = rect.left + rect.width / 2 - pitch.left;
      const cy = rect.top + rect.height / 2 - pitch.top;
      const nx = Math.max(0, Math.min(100, (cx / pitch.width) * 100));
      const ny = Math.max(0, Math.min(100, (cy / pitch.height) * 100));
      await actions.move(slotId, nx, ny);
      return;
    }

    // Case 2: dragging a player from the pool onto the pitch → create slot at drop point
    if (typeof active.id === "string" && active.id.startsWith("pool:")) {
      const playerId = active.id.slice("pool:".length);
      const pitch = over.rect;
      // Use the cursor position from delta + initial rect of the dragged chip
      const initRect = active.rect.current.initial;
      const translated = active.rect.current.translated;
      if (!initRect || !translated) return;
      const cx = translated.left + translated.width / 2 - pitch.left;
      const cy = translated.top + translated.height / 2 - pitch.top;
      const nx = Math.max(0, Math.min(100, (cx / pitch.width) * 100));
      const ny = Math.max(0, Math.min(100, (cy / pitch.height) * 100));
      // Guess a role from drop position (y < 33 = FW, 33-66 = MF, 66-88 = DF, > 88 = GK)
      const role: "FW" | "MF" | "DF" | "GK" =
        ny < 33 ? "FW" : ny < 66 ? "MF" : ny < 88 ? "DF" : "GK";
      await actions.addSlot(nx, ny, role, playerId);
      return;
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="space-y-4">
        <FormationTabs current={formation} onChange={actions.setFormation} />

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <DroppablePitch>
              <Pitch>
                {slots.map((slot) => (
                  <PitchSlot
                    key={slot.id}
                    x={Number(slot.x)}
                    y={Number(slot.y)}
                    player={slot.playerId ? playerById.get(slot.playerId) ?? null : null}
                    onClick={() => setPickingSlotId(slot.id)}
                  />
                ))}
              </Pitch>
            </DroppablePitch>
            <p className="mt-2 text-xs text-pitch-700">
              Tap a slot to assign a player. Drag from the roster onto the pitch in Custom mode.
            </p>
          </div>

          <RosterPool available={players} selectedIds={selectedIds} />
        </div>

        <PlayerPickerModal
          open={pickingSlotId !== null}
          onClose={() => setPickingSlotId(null)}
          availablePlayers={players.filter(
            (p) =>
              !selectedIds.has(p.id) ||
              slotsById.get(pickingSlotId ?? "")?.playerId === p.id,
          )}
          onPick={async (playerId) => {
            if (pickingSlotId) await actions.assign(pickingSlotId, playerId);
          }}
          onCreateGuest={actions.createGuest}
        />
      </div>
    </DndContext>
  );
}
```

NOTE on `useDraggable` for pitch slots: the current `PitchSlot` is a plain button. To make existing slots draggable on the pitch (Task description Step 7 says drag-to-reposition works for all formations), wrap them in `useDraggable` with id `slot:<id>`. The simplest path: keep PitchSlot presentational and add a `DraggablePitchSlot` wrapper inside `LineupBuilder` that uses dnd-kit. This avoids importing dnd-kit in the presentational layer.

Actually — to keep this manageable in v1, make slot drag-to-reposition a polish task. For now, the builder supports:
- Tap a slot → pick a player
- Drag a player from the pool → drops onto the pitch and creates a new slot (Custom mode behavior)
- Formation tabs to switch preset (loses Custom slots if switching out of Custom — acceptable)

Reposition-by-drag of existing slots is **deferred** to a follow-up commit at the end of this task (Step 3 below).

- [ ] **Step 3: Add drag-to-reposition for existing slots**

Inside `LineupBuilder`, replace the `<PitchSlot>` rendering with a draggable wrapper. Add this component to `src/components/lineup/lineup-builder.tsx` (above `LineupBuilder`):

```tsx
import { useDraggable, DragOverlay } from "@dnd-kit/core";
import { PlayerChip } from "./player-chip";

function DraggablePitchSlot({
  slot,
  player,
  onClick,
}: {
  slot: SlotRow;
  player: Player | null;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `slot:${slot.id}`,
    data: { type: "slot", slotId: slot.id },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        position: "absolute",
        left: `${Number(slot.x)}%`,
        top: `${Number(slot.y)}%`,
        transform: "translate(-50%, -50%)",
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 30 : 10,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
        aria-label={player ? `Edit ${player.nickname}` : "Add player"}
      >
        <PlayerChip player={player} />
      </button>
    </div>
  );
}
```

Then in the JSX, swap:

```tsx
{slots.map((slot) => (
  <PitchSlot ... />
))}
```

for:

```tsx
{slots.map((slot) => (
  <DraggablePitchSlot
    key={slot.id}
    slot={slot}
    player={slot.playerId ? playerById.get(slot.playerId) ?? null : null}
    onClick={() => setPickingSlotId(slot.id)}
  />
))}
```

You can leave `PitchSlot` for the public read-only view in Task 13.

- [ ] **Step 4: Build verification**

```bash
DATABASE_URL='postgres://fake:fake@unreachable.invalid:5432/fake' ADMIN_PASSWORD=test SESSION_SECRET="$(printf 'x%.0s' {1..40})" DATA_DIR=/tmp/balon-build-test NODE_ENV=production npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/lineup/lineup-builder.tsx src/components/lineup/formation-tabs.tsx
git commit -m "feat: lineup builder orchestrator with drag-and-drop"
```

---

### Task 11: Lineup builder page (server component)

**Files:**
- Create: `src/app/(admin)/matches/[id]/lineup/page.tsx`
- Modify: `src/lib/db/queries/players.ts` (add `listAllAssignable`)

- [ ] **Step 1: Add list-all-assignable players query**

In `src/lib/db/queries/players.ts`, add at the bottom:

```ts
export async function listAllAssignable(): Promise<Player[]> {
  // Regulars who are active, plus all guests (regardless of active flag)
  // For Plan 2 simplicity: just active regulars.
  return listActiveRegulars();
}

export async function createGuest(nickname: string): Promise<Player> {
  return createPlayer({ nickname, isRegular: false, isActive: true });
}
```

- [ ] **Step 2: Lineup builder page**

`src/app/(admin)/matches/[id]/lineup/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getMatchById } from "@/lib/db/queries/matches";
import { listSlotsForMatch } from "@/lib/db/queries/lineup-slots";
import { listAllAssignable, createGuest } from "@/lib/db/queries/players";
import { LineupBuilder } from "@/components/lineup/lineup-builder";
import {
  moveSlotAction,
  assignPlayerAction,
  addSlotAction,
  removeSlotAction,
  updateFormationAction,
} from "./actions";

export default async function LineupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const [slots, players] = await Promise.all([
    listSlotsForMatch(match.id),
    listAllAssignable(),
  ]);

  // Bind matchId into the actions so the client gets a clean callable signature
  const actions = {
    move: async (slotId: string, x: number, y: number) =>
      moveSlotAction(match.id, slotId, x, y),
    assign: async (slotId: string, playerId: string | null) =>
      assignPlayerAction(match.id, slotId, playerId),
    addSlot: async (
      x: number,
      y: number,
      role: "FW" | "MF" | "DF" | "GK",
      playerId: string | null,
    ) => addSlotAction(match.id, x, y, role, playerId),
    remove: async (slotId: string) => removeSlotAction(match.id, slotId),
    setFormation: async (
      formationId: "3-3-2" | "3-2-3" | "4-3-1" | "2-3-3" | "custom",
    ) => updateFormationAction(match.id, formationId),
    createGuest: async (nickname: string) => {
      const guest = await createGuest(nickname);
      return guest.id;
    },
  };

  const formattedDate = new Date(match.playedAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const publicUrl = `/p/match/${match.shortSlug}`;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pitch-900">
            {match.opponentName ? `vs ${match.opponentName}` : "Lineup"}
          </h2>
          <p className="text-sm text-pitch-700">{formattedDate}</p>
        </div>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-pitch-100 bg-white px-3 py-2 text-sm font-medium text-pitch-900 hover:border-pitch-600"
        >
          Public link →
        </a>
      </div>

      <LineupBuilder
        matchId={match.id}
        formation={match.formation}
        slots={slots}
        players={players}
        actions={actions}
      />
    </div>
  );
}
```

NOTE on server-action binding: passing actions as object props means each is a top-level `"use server"` function reference. Next.js supports passing server actions as props to client components. The `async (args) => action(matchId, ...args)` pattern wraps them with the bound matchId so the client doesn't need to know it.

WAIT — there's a subtlety. Server actions passed to client components must be either:
- Exported from a `"use server"` module directly, OR
- Wrapped in an inline `async function` that calls the server action

The above uses inline async wrappers. That works in Next.js 15+. If the build complains about "server action must be top-level", switch to using `.bind(null, matchId)` on the exported actions instead of inline wrappers:

```ts
const actions = {
  move: moveSlotAction.bind(null, match.id),
  assign: assignPlayerAction.bind(null, match.id),
  // ...
};
```

This is cleaner and avoids the inline async wrapping concern. Use the `.bind` approach.

So the actions object should be:

```ts
const actions = {
  move: moveSlotAction.bind(null, match.id),
  assign: assignPlayerAction.bind(null, match.id),
  addSlot: addSlotAction.bind(null, match.id),
  remove: removeSlotAction.bind(null, match.id),
  setFormation: updateFormationAction.bind(null, match.id),
  createGuest: async (nickname: string) => {
    "use server";
    const guest = await createGuest(nickname);
    return guest.id;
  },
};
```

For `createGuest`, since it's not a pre-existing server action with a matchId binding, you need to either:
- Make it a top-level server action in `actions.ts` (preferred), OR
- Use an inline `"use server"` async function (allowed in Next.js)

Use the first option. Add to `actions.ts`:

```ts
export async function createGuestAction(nickname: string): Promise<{ id: string }> {
  const cleaned = nickname.trim();
  if (cleaned.length === 0) throw new Error("nickname required");
  const { createPlayer } = await import("@/lib/db/queries/players");
  const guest = await createPlayer({ nickname: cleaned, isRegular: false, isActive: true });
  return { id: guest.id };
}
```

Then in the page:

```ts
createGuest: async (nickname: string) => {
  const r = await createGuestAction(nickname);
  return r.id;
},
```

— but that's an inline async wrapping. To avoid that, change the client component to call `createGuestAction` directly and adapt the return type. For simplicity, just adapt the client: have `onCreateGuest` accept the typed signature `(name) => Promise<string>` and inside the client wrap it. Actually — the simplest is leave the inline wrapper. Next.js 15+ permits it.

The plan is: use `.bind` for the matchId-parameterized actions; pass `createGuestAction` directly and adapt the client's `onCreateGuest` to accept `(name) => Promise<{id: string}>` instead of `Promise<string>`. Update both ends.

For this plan: KEEP the client-side type as `(name) => Promise<string>`, and use the inline wrapper. Next.js does permit this when the wrapped function is itself a server action.

- [ ] **Step 3: Build**

```bash
DATABASE_URL='postgres://fake:fake@unreachable.invalid:5432/fake' ADMIN_PASSWORD=test SESSION_SECRET="$(printf 'x%.0s' {1..40})" DATA_DIR=/tmp/balon-build-test NODE_ENV=production npm run build
```

If the build complains about action shapes, switch the `actions` object to use `.bind(null, match.id)` for the four matchId-bound actions.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: lineup builder page (server component + client orchestrator)"
```

---

### Task 12: Public match view

**Files:**
- Create: `src/components/public/public-pitch.tsx`
- Create: `src/app/(public)/p/match/[slug]/page.tsx`

- [ ] **Step 1: PublicPitch (read-only render)**

`src/components/public/public-pitch.tsx`:

```tsx
import { Pitch } from "@/components/lineup/pitch";
import { PlayerChip } from "@/components/lineup/player-chip";
import type { Player } from "@/types/player";
import type { SlotRow } from "@/lib/db/queries/lineup-slots";

interface Props {
  slots: SlotRow[];
  players: Player[];
}

export function PublicPitch({ slots, players }: Props) {
  const playerById = new Map(players.map((p) => [p.id, p]));
  return (
    <Pitch>
      {slots.map((s) => {
        const player = s.playerId ? playerById.get(s.playerId) ?? null : null;
        return (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: `${Number(s.x)}%`,
              top: `${Number(s.y)}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <PlayerChip player={player} />
          </div>
        );
      })}
    </Pitch>
  );
}
```

- [ ] **Step 2: Public match page**

`src/app/(public)/p/match/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getMatchBySlug } from "@/lib/db/queries/matches";
import { listSlotsForMatch } from "@/lib/db/queries/lineup-slots";
import { listAllAssignable } from "@/lib/db/queries/players";
import { PublicPitch } from "@/components/public/public-pitch";

// Public match pages are DB-backed; render on-demand, not at build time
export const dynamic = "force-dynamic";

export default async function PublicMatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = await getMatchBySlug(slug);
  if (!match) notFound();

  const [slots, players] = await Promise.all([
    listSlotsForMatch(match.id),
    listAllAssignable(),
  ]);

  const fmtDate = new Date(match.playedAt).toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <article className="space-y-4">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-pitch-700">
          {match.status === "planned" ? "Upcoming match" : "Match"}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-pitch-900">
          {match.opponentName ? `vs ${match.opponentName}` : "Friendly match"}
        </h1>
        <p className="mt-1 text-sm text-pitch-700">
          {fmtDate} · Formation {match.formation}
        </p>
      </header>

      <PublicPitch slots={slots} players={players} />

      {match.status === "played" && match.ourScore !== null && match.theirScore !== null && (
        <div className="rounded-xl border border-pitch-100 bg-white p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-pitch-700">Final score</p>
          <p className="mt-1 text-3xl font-bold text-pitch-900">
            {match.ourScore} – {match.theirScore}
          </p>
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 3: Build verification**

```bash
DATABASE_URL='postgres://fake:fake@unreachable.invalid:5432/fake' ADMIN_PASSWORD=test SESSION_SECRET="$(printf 'x%.0s' {1..40})" DATA_DIR=/tmp/balon-build-test NODE_ENV=production npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: public match page with read-only pitch"
```

---

### Task 13: Update admin dashboard + public home with "Next Match"

**Files:**
- Modify: `src/app/(admin)/page.tsx`
- Modify: `src/app/(public)/p/page.tsx`

- [ ] **Step 1: Update admin dashboard**

Replace `src/app/(admin)/page.tsx` with:

```tsx
import Link from "next/link";
import { listActiveRegulars } from "@/lib/db/queries/players";
import { getNextPlannedMatch } from "@/lib/db/queries/matches";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [players, nextMatch] = await Promise.all([
    listActiveRegulars(),
    getNextPlannedMatch(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-pitch-900">Today</h2>
        <p className="text-sm text-pitch-700">Welcome back.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wide text-pitch-700">Roster</p>
          <p className="mt-2 text-3xl font-bold text-pitch-900">{players.length}</p>
          <p className="mt-1 text-xs text-pitch-700">active regulars</p>
          <Link
            href="/roster"
            className="mt-3 inline-block text-sm font-medium text-pitch-600 hover:underline"
          >
            Manage roster →
          </Link>
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-wide text-pitch-700">Next match</p>
          {nextMatch ? (
            <>
              <p className="mt-2 text-lg font-bold text-pitch-900">
                {nextMatch.opponentName ? `vs ${nextMatch.opponentName}` : "Friendly match"}
              </p>
              <p className="mt-1 text-xs text-pitch-700">
                {new Date(nextMatch.playedAt).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                · {nextMatch.formation}
              </p>
              <Link
                href={`/matches/${nextMatch.id}/lineup`}
                className="mt-3 inline-block text-sm font-medium text-pitch-600 hover:underline"
              >
                Open lineup →
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-pitch-700">No planned matches.</p>
              <Link
                href="/matches/new"
                className="mt-3 inline-block text-sm font-medium text-pitch-600 hover:underline"
              >
                + Create match
              </Link>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update public home**

Replace `src/app/(public)/p/page.tsx` with:

```tsx
import Link from "next/link";
import { getNextPlannedMatch } from "@/lib/db/queries/matches";

export const dynamic = "force-dynamic";

export default async function PublicHomePage() {
  const next = await getNextPlannedMatch();

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-pitch-900">Balon</h2>
        <p className="text-sm text-pitch-700">Lineups and updates from our games.</p>
      </header>

      {next ? (
        <Link
          href={`/p/match/${next.shortSlug}`}
          className="block rounded-xl border border-pitch-100 bg-white p-6 transition hover:border-pitch-600"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-pitch-700">
            Next match
          </p>
          <p className="mt-2 text-xl font-bold text-pitch-900">
            {next.opponentName ? `vs ${next.opponentName}` : "Friendly match"}
          </p>
          <p className="mt-1 text-sm text-pitch-700">
            {new Date(next.playedAt).toLocaleString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            · Formation {next.formation}
          </p>
          <p className="mt-3 text-sm font-medium text-pitch-600">View lineup →</p>
        </Link>
      ) : (
        <div className="rounded-xl border border-dashed border-pitch-100 bg-white p-12 text-center">
          <p className="text-pitch-700">No upcoming match yet. Check back later.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Build + commit**

```bash
DATABASE_URL='postgres://fake:fake@unreachable.invalid:5432/fake' ADMIN_PASSWORD=test SESSION_SECRET="$(printf 'x%.0s' {1..40})" DATA_DIR=/tmp/balon-build-test NODE_ENV=production npm run build
git add -A
git commit -m "feat: show next planned match on admin dashboard and public home"
```

---

### Task 14: Delete-match action wired into the builder page

A small affordance: a "Delete match" button on the lineup builder for cleanup.

**Files:**
- Create: `src/components/matches/delete-match-button.tsx`
- Modify: `src/app/(admin)/matches/[id]/lineup/page.tsx` (add the button)

- [ ] **Step 1: DeleteMatchButton**

`src/components/matches/delete-match-button.tsx`:

```tsx
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
```

- [ ] **Step 2: Wire into lineup page**

In `src/app/(admin)/matches/[id]/lineup/page.tsx`, import `deleteMatchAction` from `../../actions` (the matches actions file) and `DeleteMatchButton`. After the LineupBuilder block, add:

```tsx
<div className="mt-6 border-t border-pitch-100 pt-4">
  <DeleteMatchButton deleteAction={deleteMatchAction.bind(null, match.id)} />
</div>
```

- [ ] **Step 3: Build + commit**

```bash
DATABASE_URL='postgres://fake:fake@unreachable.invalid:5432/fake' ADMIN_PASSWORD=test SESSION_SECRET="$(printf 'x%.0s' {1..40})" DATA_DIR=/tmp/balon-build-test NODE_ENV=production npm run build
git add -A
git commit -m "feat: delete-match button on lineup builder"
```

---

### Task 15: E2E test — create match → build lineup → public view

**Files:**
- Create: `tests/e2e/lineup.spec.ts`

- [ ] **Step 1: Write spec**

`tests/e2e/lineup.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  const pw = process.env.ADMIN_PASSWORD ?? "changeme";
  await page.fill('input[name="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/");
});

test("create match → land on lineup builder → public URL works", async ({ page, context }) => {
  // Ensure at least one regular exists for the picker
  const playerName = `LineupTester_${Date.now()}`;
  await page.goto("/roster/new");
  await page.fill('input[name="nickname"]', playerName);
  await page.click('button:has-text("Add Player")');
  await page.waitForURL("**/roster");

  // Create a match
  await page.goto("/matches/new");
  // datetime-local needs ISO-ish without seconds
  const future = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const iso = future.toISOString().slice(0, 16);
  await page.fill('input[name="playedAt"]', iso);
  await page.fill('input[name="opponentName"]', "E2E Opponents");
  await page.click('button:has-text("Create Match")');

  // Lands on lineup builder
  await page.waitForURL(/\/matches\/.+\/lineup/);
  await expect(page.getByText("vs E2E Opponents")).toBeVisible();
  await expect(page.getByText(/3-3-2/)).toBeVisible();

  // Assign the player to the first slot via the picker modal
  // Tap any slot button on the pitch (they have aria-label "Add player")
  const firstSlot = page.locator('button[aria-label="Add player"]').first();
  await firstSlot.click();
  await page.getByRole("button", { name: playerName }).click();

  // Player chip should now show on the field
  await expect(page.getByText(playerName).first()).toBeVisible();

  // Click the public link in a new tab (or visit directly)
  const publicHref = await page.locator('a:has-text("Public link")').getAttribute("href");
  expect(publicHref).toMatch(/^\/p\/match\/[A-Za-z0-9_-]{6}$/);

  // Visit the public URL in a fresh, unauthenticated context
  const anonContext = await context.browser()!.newContext();
  const anonPage = await anonContext.newPage();
  await anonPage.goto(`http://localhost:3000${publicHref}`);
  await expect(anonPage.getByText("vs E2E Opponents")).toBeVisible();
  await expect(anonPage.getByText(playerName)).toBeVisible();
  await anonContext.close();
});
```

- [ ] **Step 2: Run the spec**

```bash
npm run test:e2e -- lineup.spec.ts
```

Expected: 1 passing test. The test creates fresh data each run (timestamp-unique player name + opponent string), so it doesn't conflict with prior runs.

If it fails because the dev server isn't running, ensure Postgres is up (`docker compose up -d`) and start `npm run dev` in a separate terminal, then re-run.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/lineup.spec.ts
git commit -m "test: e2e for match creation + lineup builder + public view"
```

---

## Self-Review

**Spec coverage (Plan 2 scope):**
- Section 5 architecture: lineup builder is heavy client component; auto-save via server actions on every interaction ✓ (Tasks 7, 10)
- Section 6 data model: matches + lineup_slots tables already exist from Plan 1; queries added in Tasks 3, 4 ✓
- Section 7 screens: `/matches`, `/matches/new`, `/matches/[id]/lineup`, `/p/match/[slug]` ✓ (Tasks 5, 6, 11, 12)
- Section 8 Flow A (planning a match): match creation → lineup builder with formation presets, tap-to-fill, drag-to-reposition, Custom mode (drag-from-pool to create slots) ✓ (Tasks 5, 7-11)
- Section 8 Flow C (friend views lineup): public URL renders pitch with player chips ✓ (Task 12)
- Section 10 sharing (URL): `shortSlug` generation + public route at `/p/match/[slug]` ✓ (Tasks 2, 12)

**Deferred to Plan 3 (correctly out of scope):**
- Match result entry (3-step flow with score, attendance, goals)
- Stats / leaderboards
- `@vercel/og` image generation + "Download Image" button
- Public player profiles, full stats page
- Recent match recap on public home

**No placeholders:** every step has runnable commands or complete code. The build-verification command is repeated in each task because the engineer may be reading tasks out of order.

**Type consistency:**
- `SlotRow` shape is consistent across `lineup-slots.ts` queries and `LineupBuilder` component
- `Role` type imported from `formations.ts` and used in slot queries + actions
- `Player` type from `@/types/player` flows through unchanged

**Ordering check:**
- Task 1 (formations) before Task 5 (uses `getFormation`) ✓
- Task 2 (slugs) before Task 5 (uses `generateShortSlug`) ✓
- Task 3 (matches queries) before Task 5 (uses `createMatch`) and Tasks 6, 11, 12, 13 ✓
- Task 4 (slot queries) before Task 7 (uses them in actions) and Task 11 (renders them) ✓
- Task 8 (presentational pitch + chip + slot) before Task 9 (pool/picker that use them) and Task 10 (builder) ✓
- Task 11 (lineup page) depends on Tasks 7 (actions), 8-10 (components) ✓
- Task 12 (public view) depends on Tasks 8 (Pitch + PlayerChip reused) and 3 (`getMatchBySlug`) ✓
- E2E test (15) last ✓

**Risks called out for the implementer:**
- The drag-end coordinate math in `LineupBuilder` assumes `active.rect.current.translated` is populated by dnd-kit; if not, fall back to using `event.delta` + initial rect.
- Switching formations after manual Custom drags will replace slots if not careful — for v1, simplest is: switching formation re-seeds slots from preset (lost manual placement). Document this in the UI hint text.
- Server actions on every drag-end produce N writes per repositioning. With ~9 slots this is fine for a personal app. Premature to add debouncing.
