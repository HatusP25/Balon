# Balon — Plan 1: Foundation & Roster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deployable foundation of Balon — a Next.js + Postgres app with single-admin auth, a polished admin shell, full roster CRUD with avatar uploads, and live deployment to Railway. By the end of this plan, the owner can log into a real URL and manage the regular roster.

**Architecture:** Next.js 15 App Router single service, Postgres on Railway, single env-var admin password with HMAC-signed cookie session, Drizzle ORM for type-safe SQL, Tailwind + shadcn/ui for the pitch-green visual identity, persistent volume at `/data` for avatar uploads, `sharp` for server-side image resize, `react-easy-crop` for client-side square cropping.

**Tech Stack:**
- Next.js 15 (App Router, TypeScript)
- Postgres 16 + Drizzle ORM + drizzle-kit
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- `sharp` (server-side avatar resize)
- `react-easy-crop` (client-side avatar crop)
- Vitest (unit tests) + Playwright (E2E)
- Railway (hosting + Postgres + persistent volume)

---

## File Structure

```
balon/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json                          # shadcn config
├── drizzle.config.ts
├── middleware.ts                            # auth gate on /(admin)
├── docker-compose.yml                        # local Postgres
├── railway.json                              # Railway service config
├── playwright.config.ts
├── vitest.config.ts
├── data/                                     # gitignored, dev only
│   └── avatars/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css                       # tailwind + theme tokens
│   │   ├── page.tsx                          # root → redirect
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts
│   │   ├── (admin)/
│   │   │   ├── layout.tsx                    # admin shell
│   │   │   ├── page.tsx                      # dashboard stub
│   │   │   └── roster/
│   │   │       ├── page.tsx
│   │   │       ├── new/
│   │   │       │   └── page.tsx
│   │   │       ├── [id]/
│   │   │       │   └── edit/
│   │   │       │       └── page.tsx
│   │   │       └── actions.ts
│   │   ├── (public)/
│   │   │   └── p/
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx                  # public stub
│   │   └── api/
│   │       └── avatars/
│   │           └── [filename]/
│   │               └── route.ts              # serves /data/avatars/* files
│   ├── components/
│   │   ├── ui/                                # shadcn primitives
│   │   ├── admin/
│   │   │   ├── admin-shell.tsx
│   │   │   ├── sidebar-nav.tsx
│   │   │   └── bottom-tabs.tsx
│   │   ├── roster/
│   │   │   ├── player-grid.tsx
│   │   │   ├── player-card.tsx
│   │   │   ├── player-form.tsx
│   │   │   └── avatar-upload.tsx              # client: crop + upload
│   │   └── public/
│   │       └── public-shell.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── client.ts                       # drizzle client singleton
│   │   │   ├── schema.ts                       # all 6 tables
│   │   │   └── queries/
│   │   │       └── players.ts                  # CRUD helpers
│   │   ├── auth/
│   │   │   ├── session.ts                      # sign/verify HMAC cookie
│   │   │   └── constants.ts
│   │   ├── storage/
│   │   │   └── avatars.ts                      # save/read avatar files
│   │   ├── env.ts                               # Zod-validated env
│   │   └── utils.ts                             # shadcn cn() etc.
│   └── types/
│       └── player.ts
└── tests/
    ├── unit/
    │   ├── auth-session.test.ts
    │   ├── storage-avatars.test.ts
    │   └── env.test.ts
    └── e2e/
        ├── login.spec.ts
        └── roster.spec.ts
```

---

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`, `README.md`

- [ ] **Step 1: Scaffold Next.js app**

Run from the project root (Balon directory already exists with `.git`):

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint --import-alias "@/*" --no-turbopack --use-npm
```

When prompted about overwriting existing files, accept. The scaffolder will preserve `.git`.

- [ ] **Step 2: Sanity-check the dev server**

```bash
npm run dev
```

Expected: server starts on http://localhost:3000, default Next.js welcome page renders.
Stop with Ctrl+C.

- [ ] **Step 3: Add `data/` and `.next/` to .gitignore**

Append to `.gitignore`:

```
# local dev data (avatars, etc.)
/data
```

(`.next/` and `node_modules/` are already in the Next.js template's `.gitignore`.)

- [ ] **Step 4: Replace the default homepage with a redirect stub**

Replace `src/app/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/p");
}
```

(`/p` doesn't exist yet — we'll create it in Task 17. That's fine; redirect is wired up.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript and Tailwind"
```

---

### Task 2: Configure pitch-green theme tokens

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add theme tokens to globals.css**

Replace contents of `src/app/globals.css` with:

```css
@import "tailwindcss";

@theme {
  --color-pitch-50: #ecfdf5;
  --color-pitch-100: #d1fae5;
  --color-pitch-500: #10b981;
  --color-pitch-600: #0d6b4f;
  --color-pitch-700: #0a5a42;
  --color-pitch-800: #064e3b;
  --color-pitch-900: #042f24;

  --color-bg-cream: #f5f5f0;
  --color-bg-cream-warm: #faf9f4;

  --font-display: "Inter", system-ui, sans-serif;
}

body {
  background: var(--color-bg-cream);
  color: var(--color-pitch-900);
  font-family: var(--font-display);
}
```

- [ ] **Step 2: Verify Tailwind picks up the theme**

Edit `src/app/layout.tsx` body element to use a pitch class as a smoke test:

```tsx
import "./globals.css";

export const metadata = {
  title: "Balon",
  description: "Lineups and stats for our soccer games",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg-cream text-pitch-900">{children}</body>
    </html>
  );
}
```

Run `npm run dev` and visit http://localhost:3000 — the redirect will fail (no `/p` yet), but the 404 page should be on cream background.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: add pitch-green theme tokens"
```

---

### Task 3: Install shadcn/ui and base components

**Files:**
- Create: `components.json`
- Create: `src/components/ui/*` (button, input, label, card, dialog, sonner)
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Init shadcn**

```bash
npx shadcn@latest init
```

Choose: Style = Default, Base color = Neutral, CSS variables = Yes.
This creates `components.json` and `src/lib/utils.ts`.

- [ ] **Step 2: Install base components**

```bash
npx shadcn@latest add button input label card dialog sonner avatar dropdown-menu
```

Each command creates files under `src/components/ui/`.

- [ ] **Step 3: Verify a component imports cleanly**

Open `src/components/ui/button.tsx` — it should exist and export `Button`. No edits needed here.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: install shadcn/ui base components"
```

---

### Task 4: Set up environment variable validation

**Files:**
- Create: `src/lib/env.ts`
- Create: `tests/unit/env.test.ts`
- Create: `.env.example`
- Create: `vitest.config.ts`
- Modify: `package.json` (add scripts and Vitest)

- [ ] **Step 1: Install Vitest and zod**

```bash
npm install zod
npm install -D vitest @vitest/ui
```

- [ ] **Step 2: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add test scripts to package.json**

Add under `"scripts"`:

```json
"test:unit": "vitest run",
"test:unit:watch": "vitest"
```

- [ ] **Step 4: Write the failing test for env validation**

Create `tests/unit/env.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("env", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = original;
  });

  it("throws when ADMIN_PASSWORD is missing", async () => {
    delete process.env.ADMIN_PASSWORD;
    process.env.SESSION_SECRET = "x".repeat(32);
    process.env.DATABASE_URL = "postgres://localhost/test";
    process.env.DATA_DIR = "/tmp/balon-data";

    await expect(import("@/lib/env?missing-pw")).rejects.toThrow(/ADMIN_PASSWORD/);
  });

  it("throws when SESSION_SECRET is shorter than 32 characters", async () => {
    process.env.ADMIN_PASSWORD = "hunter2";
    process.env.SESSION_SECRET = "short";
    process.env.DATABASE_URL = "postgres://localhost/test";
    process.env.DATA_DIR = "/tmp/balon-data";

    await expect(import("@/lib/env?short-secret")).rejects.toThrow(/SESSION_SECRET/);
  });

  it("returns parsed env when all values are valid", async () => {
    process.env.ADMIN_PASSWORD = "hunter2";
    process.env.SESSION_SECRET = "x".repeat(32);
    process.env.DATABASE_URL = "postgres://localhost/test";
    process.env.DATA_DIR = "/tmp/balon-data";

    const { env } = await import("@/lib/env?ok");
    expect(env.ADMIN_PASSWORD).toBe("hunter2");
    expect(env.SESSION_SECRET.length).toBe(32);
  });
});
```

The `?suffix` cache-buster query strings force a fresh module evaluation per test.

- [ ] **Step 5: Run the test to verify it fails**

```bash
npm run test:unit
```

Expected: 3 failing tests, error `Cannot find module '@/lib/env'`.

- [ ] **Step 6: Implement env.ts**

Create `src/lib/env.ts`:

```ts
import { z } from "zod";

const Schema = z.object({
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),
  DATABASE_URL: z.string().url(),
  DATA_DIR: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = Schema.parse(process.env);
export type Env = z.infer<typeof Schema>;
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npm run test:unit
```

Expected: 3 passing tests.

- [ ] **Step 8: Create .env.example**

```
ADMIN_PASSWORD=changeme
SESSION_SECRET=replace-with-32-or-more-random-chars
DATABASE_URL=postgres://postgres:postgres@localhost:5432/balon
DATA_DIR=./data
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: validated env vars with Zod"
```

---

### Task 5: Set up local Postgres with Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `.env` (local, gitignored)
- Modify: `README.md`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: balon-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: balon
    ports:
      - "5432:5432"
    volumes:
      - balon-postgres-data:/var/lib/postgresql/data

volumes:
  balon-postgres-data:
```

- [ ] **Step 2: Create local .env**

```bash
cp .env.example .env
```

Then open `.env` and set `SESSION_SECRET` to a real 32+ char random string. Example:

```
SESSION_SECRET=dev-secret-do-not-use-in-prod-1234567890
```

- [ ] **Step 3: Start Postgres and verify**

```bash
docker compose up -d
docker compose exec postgres psql -U postgres -d balon -c "select version();"
```

Expected: prints Postgres version string.

- [ ] **Step 4: Add a "Getting Started" section to README.md**

Replace contents of `README.md` with:

```markdown
# Balon

Lineup builder and stats for our soccer group.

## Local development

```bash
docker compose up -d        # start Postgres
cp .env.example .env        # then fill in SESSION_SECRET
npm install
npm run db:push             # apply schema (after Task 8)
npm run dev                 # http://localhost:3000
```

## Stack

Next.js 15 (App Router) · Postgres + Drizzle · Tailwind + shadcn/ui · Railway
```

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml README.md
git commit -m "chore: docker-compose for local Postgres"
```

---

### Task 6: Set up Drizzle ORM and database client

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/lib/db/client.ts`
- Modify: `package.json` (add Drizzle scripts + deps)

- [ ] **Step 1: Install Drizzle + Postgres driver**

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

- [ ] **Step 2: Add db scripts to package.json**

Under `"scripts"`:

```json
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 3: Create drizzle.config.ts**

```ts
import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 4: Install dotenv for drizzle-kit**

```bash
npm install -D dotenv
```

- [ ] **Step 5: Create db/client.ts**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

const queryClient = postgres(env.DATABASE_URL, { max: 10 });
export const db = drizzle(queryClient, { schema });
export type DB = typeof db;
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: install Drizzle ORM and Postgres driver"
```

---

### Task 7: Define the full database schema

Define all six tables from the spec, even though Plan 1 only uses `players`. This avoids revisiting Drizzle setup in Plans 2 and 3.

**Files:**
- Create: `src/lib/db/schema.ts`

- [ ] **Step 1: Create the schema file**

```ts
import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

export const positionEnum = pgEnum("position", ["FW", "MF", "DF", "GK"]);
export const matchStatusEnum = pgEnum("match_status", ["planned", "played"]);

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nickname: text("nickname").notNull(),
    jerseyNumber: integer("jersey_number"),
    avatarPath: text("avatar_path"),
    preferredPosition: positionEnum("preferred_position"),
    isRegular: boolean("is_regular").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nicknameUnique: uniqueIndex("players_nickname_unique").on(t.nickname),
  }),
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shortSlug: text("short_slug").notNull(),
    playedAt: timestamp("played_at", { withTimezone: true }).notNull(),
    opponentName: text("opponent_name"),
    ourScore: integer("our_score"),
    theirScore: integer("their_score"),
    formation: text("formation").notNull(),
    status: matchStatusEnum("status").notNull().default("planned"),
    lineupVersion: integer("lineup_version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    shortSlugUnique: uniqueIndex("matches_short_slug_unique").on(t.shortSlug),
    playedAtIdx: index("matches_played_at_idx").on(t.playedAt),
  }),
);

export const lineupSlots = pgTable(
  "lineup_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: uuid("player_id").references(() => players.id),
    x: numeric("x", { precision: 5, scale: 2 }).notNull(),
    y: numeric("y", { precision: 5, scale: 2 }).notNull(),
    role: positionEnum("role").notNull(),
  },
  (t) => ({
    matchIdx: index("lineup_slots_match_idx").on(t.matchId),
  }),
);

export const matchAppearances = pgTable(
  "match_appearances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
  },
  (t) => ({
    matchPlayerUnique: uniqueIndex("appearances_match_player_unique").on(t.matchId, t.playerId),
    playerIdx: index("appearances_player_idx").on(t.playerId),
  }),
);

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    scorerId: uuid("scorer_id")
      .notNull()
      .references(() => players.id),
    assistId: uuid("assist_id").references(() => players.id),
    orderIndex: integer("order_index").notNull(),
  },
  (t) => ({
    matchIdx: index("goals_match_idx").on(t.matchId),
    scorerIdx: index("goals_scorer_idx").on(t.scorerId),
    assistIdx: index("goals_assist_idx").on(t.assistId),
  }),
);

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
```

- [ ] **Step 2: Generate the initial migration**

```bash
npm run db:generate
```

Expected: creates `drizzle/0000_<name>.sql` and `drizzle/meta/`.

- [ ] **Step 3: Push schema to local Postgres**

```bash
npm run db:push
```

Expected: prints "Changes applied" or similar.

- [ ] **Step 4: Verify tables exist**

```bash
docker compose exec postgres psql -U postgres -d balon -c "\dt"
```

Expected: lists `players`, `matches`, `lineup_slots`, `match_appearances`, `goals`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: define full database schema (6 tables)"
```

---

### Task 8: Implement HMAC session signing and verification

**Files:**
- Create: `src/lib/auth/constants.ts`
- Create: `src/lib/auth/session.ts`
- Create: `tests/unit/auth-session.test.ts`

- [ ] **Step 1: Create the constants file**

```ts
// src/lib/auth/constants.ts
export const SESSION_COOKIE_NAME = "balon_admin";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days
export const SESSION_PAYLOAD = "admin"; // single admin, fixed payload
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/auth-session.test.ts`:

```ts
import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ADMIN_PASSWORD = "test-pw";
  process.env.SESSION_SECRET = "x".repeat(32);
  process.env.DATABASE_URL = "postgres://localhost/test";
  process.env.DATA_DIR = "/tmp/balon-test";
});

describe("session", () => {
  it("signs a session token", async () => {
    const { signSession } = await import("@/lib/auth/session");
    const token = signSession();
    expect(token).toMatch(/^admin\.[a-f0-9]{64}$/);
  });

  it("verifies a valid token", async () => {
    const { signSession, verifySession } = await import("@/lib/auth/session");
    const token = signSession();
    expect(verifySession(token)).toBe(true);
  });

  it("rejects a tampered token", async () => {
    const { signSession, verifySession } = await import("@/lib/auth/session");
    const token = signSession();
    const tampered = token.slice(0, -1) + (token.slice(-1) === "0" ? "1" : "0");
    expect(verifySession(tampered)).toBe(false);
  });

  it("rejects a malformed token", async () => {
    const { verifySession } = await import("@/lib/auth/session");
    expect(verifySession("garbage")).toBe(false);
    expect(verifySession("")).toBe(false);
    expect(verifySession("admin.")).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npm run test:unit
```

Expected: 4 failures, `Cannot find module '@/lib/auth/session'`.

- [ ] **Step 4: Implement session.ts**

```ts
// src/lib/auth/session.ts
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { SESSION_PAYLOAD } from "./constants";

function hmac(payload: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(payload).digest("hex");
}

export function signSession(): string {
  return `${SESSION_PAYLOAD}.${hmac(SESSION_PAYLOAD)}`;
}

export function verifySession(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (payload !== SESSION_PAYLOAD || sig.length !== 64) return false;
  const expected = hmac(payload);
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npm run test:unit
```

Expected: all auth-session tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: HMAC session signing and verification"
```

---

### Task 9: Build login page and server action

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/actions.ts`

- [ ] **Step 1: Create the login server action**

`src/app/login/actions.ts`:

```ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { signSession } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = env.ADMIN_PASSWORD;

  const a = Buffer.from(password.padEnd(expected.length, "\0"));
  const b = Buffer.from(expected.padEnd(password.length, "\0"));
  const ok = a.length === b.length && timingSafeEqual(a, b) && password.length === expected.length;

  if (!ok) {
    return { error: "Wrong password" };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, signSession(), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/");
}
```

- [ ] **Step 2: Create the login page**

`src/app/login/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-cream px-4">
      <form action={action} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-pitch-900">Balon</h1>
          <p className="mt-1 text-sm text-pitch-700">Admin login</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required autoFocus />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full bg-pitch-600 hover:bg-pitch-700">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Smoke-test in the browser**

Start `npm run dev` (after seeding `.env` with a known `ADMIN_PASSWORD`). Visit `/login`. Submit a wrong password → error appears. Submit the right one → redirects to `/` → hits the public stub redirect (which fails for now). That's fine.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: login page and server action"
```

---

### Task 10: Add auth middleware to protect admin routes

**Files:**
- Create: `middleware.ts` (at project root)

- [ ] **Step 1: Create middleware**

`middleware.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const ADMIN_PATHS = ["/", "/roster", "/settings", "/matches"];

function isAdminPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return ADMIN_PATHS.some((p) => p !== "/" && (pathname === p || pathname.startsWith(`${p}/`)));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isAdminPath(pathname)) return NextResponse.next();
  if (pathname === "/login") return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySession(token)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login, /p (public viewer routes), /api/avatars (public), /_next, static files
     */
    "/((?!login|p/|p$|api/avatars|_next/|favicon.ico).*)",
  ],
};
```

- [ ] **Step 2: Verify middleware behavior**

Start dev server. Without a session cookie, visit `/` → expect redirect to `/login`. Log in → redirected to `/` (still fails to render because admin layout isn't built yet, but the redirect chain breaks correctly when next task adds it).

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: auth middleware for admin routes"
```

---

### Task 11: Build the admin shell layout

**Files:**
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/app/(admin)/page.tsx`
- Create: `src/components/admin/admin-shell.tsx`
- Create: `src/components/admin/sidebar-nav.tsx`
- Create: `src/components/admin/bottom-tabs.tsx`

- [ ] **Step 1: Create the sidebar nav component**

`src/components/admin/sidebar-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Today" },
  { href: "/matches", label: "Matches" },
  { href: "/roster", label: "Roster" },
  { href: "/settings", label: "Settings" },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              active ? "bg-pitch-600 text-white" : "text-pitch-900 hover:bg-pitch-100"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Create the bottom tabs (mobile) component**

`src/components/admin/bottom-tabs.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Today" },
  { href: "/matches", label: "Matches" },
  { href: "/roster", label: "Roster" },
  { href: "/settings", label: "Settings" },
];

export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-4 border-t border-pitch-100 bg-white md:hidden">
      {items.map((it) => {
        const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex items-center justify-center py-3 text-xs font-medium ${
              active ? "text-pitch-600" : "text-pitch-900"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Create the admin shell**

`src/components/admin/admin-shell.tsx`:

```tsx
import { SidebarNav } from "./sidebar-nav";
import { BottomTabs } from "./bottom-tabs";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-cream">
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 pb-24 md:pb-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-pitch-900">Balon</h1>
            <p className="text-xs text-pitch-700">Admin</p>
          </div>
          <SidebarNav />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <BottomTabs />
    </div>
  );
}
```

- [ ] **Step 4: Create the admin layout**

`src/app/(admin)/layout.tsx`:

```tsx
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
```

- [ ] **Step 5: Create the dashboard stub**

`src/app/(admin)/page.tsx`:

```tsx
export default function AdminDashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-pitch-900">Today</h2>
      <p className="mt-2 text-pitch-700">Dashboard coming soon. Use the menu to manage your roster.</p>
    </div>
  );
}
```

- [ ] **Step 6: Smoke test**

Log in → redirected to `/` → see admin shell with sidebar on desktop, dashboard heading visible.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: admin shell layout with sidebar and bottom tabs"
```

---

### Task 12: Build the public layout stub

**Files:**
- Create: `src/app/(public)/p/layout.tsx`
- Create: `src/app/(public)/p/page.tsx`
- Create: `src/components/public/public-shell.tsx`

- [ ] **Step 1: Public shell**

`src/components/public/public-shell.tsx`:

```tsx
import Link from "next/link";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-cream">
      <header className="border-b border-pitch-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/p" className="text-lg font-bold text-pitch-900">
            Balon
          </Link>
          <nav className="flex gap-4 text-sm font-medium text-pitch-900">
            <Link href="/p">Today</Link>
            <Link href="/p/stats">Stats</Link>
            <Link href="/p/players">Players</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Public layout**

`src/app/(public)/p/layout.tsx`:

```tsx
import { PublicShell } from "@/components/public/public-shell";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
```

- [ ] **Step 3: Public home stub**

`src/app/(public)/p/page.tsx`:

```tsx
export default function PublicHomePage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-pitch-900">Welcome to Balon</h2>
      <p className="mt-2 text-pitch-700">
        Match lineups, results, and stats will appear here once the admin sets things up.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Visit `/p` (no auth required) → see public shell. Visit `/p` while logged out → still works.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: public layout stub"
```

---

### Task 13: Define player queries (DB layer)

**Files:**
- Create: `src/lib/db/queries/players.ts`
- Create: `src/types/player.ts`

- [ ] **Step 1: Types file**

`src/types/player.ts`:

```ts
import type { Player } from "@/lib/db/schema";
export type { Player };

export type Position = "FW" | "MF" | "DF" | "GK";
```

- [ ] **Step 2: Queries file**

`src/lib/db/queries/players.ts`:

```ts
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { players, type Player, type NewPlayer } from "@/lib/db/schema";

export async function listActiveRegulars(): Promise<Player[]> {
  return db
    .select()
    .from(players)
    .where(and(eq(players.isRegular, true), eq(players.isActive, true)))
    .orderBy(desc(players.createdAt));
}

export async function listArchivedAndGuests(): Promise<Player[]> {
  return db
    .select()
    .from(players)
    .where(and(eq(players.isActive, false)))
    .orderBy(desc(players.createdAt));
}

export async function getPlayerById(id: string): Promise<Player | undefined> {
  const rows = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return rows[0];
}

export async function createPlayer(input: NewPlayer): Promise<Player> {
  const [row] = await db.insert(players).values(input).returning();
  return row;
}

export async function updatePlayer(id: string, patch: Partial<NewPlayer>): Promise<Player> {
  const [row] = await db
    .update(players)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(players.id, id))
    .returning();
  return row;
}

export async function archivePlayer(id: string): Promise<void> {
  await db
    .update(players)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(players.id, id));
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: player DB queries"
```

---

### Task 14: Build roster grid page

**Files:**
- Create: `src/app/(admin)/roster/page.tsx`
- Create: `src/components/roster/player-grid.tsx`
- Create: `src/components/roster/player-card.tsx`

- [ ] **Step 1: PlayerCard component**

`src/components/roster/player-card.tsx`:

```tsx
import Link from "next/link";
import type { Player } from "@/types/player";

export function PlayerCard({ player }: { player: Player }) {
  return (
    <Link
      href={`/roster/${player.id}/edit`}
      className="group flex flex-col items-center rounded-xl border border-pitch-100 bg-white p-4 transition hover:border-pitch-600"
    >
      <div className="relative h-20 w-20 overflow-hidden rounded-full bg-pitch-100">
        {player.avatarPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/avatars/${encodePath(player.avatarPath)}`}
            alt={player.nickname}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-pitch-600">
            {player.nickname[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        {player.jerseyNumber !== null && (
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-pitch-600 text-xs font-bold text-white">
            {player.jerseyNumber}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-pitch-900">{player.nickname}</p>
      {player.preferredPosition && (
        <p className="text-xs text-pitch-700">{player.preferredPosition}</p>
      )}
    </Link>
  );
}

function encodePath(p: string) {
  // avatar_path is stored like "avatars/<id>.webp" — we serve via /api/avatars/<filename>
  return p.split("/").pop() ?? p;
}
```

- [ ] **Step 2: PlayerGrid component**

`src/components/roster/player-grid.tsx`:

```tsx
import type { Player } from "@/types/player";
import { PlayerCard } from "./player-card";

export function PlayerGrid({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-pitch-100 bg-white p-12 text-center">
        <p className="text-pitch-700">No regulars yet. Add your first player to get started.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {players.map((p) => (
        <PlayerCard key={p.id} player={p} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Roster page**

`src/app/(admin)/roster/page.tsx`:

```tsx
import Link from "next/link";
import { listActiveRegulars } from "@/lib/db/queries/players";
import { PlayerGrid } from "@/components/roster/player-grid";
import { Button } from "@/components/ui/button";

export default async function RosterPage() {
  const players = await listActiveRegulars();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pitch-900">Roster</h2>
          <p className="text-sm text-pitch-700">{players.length} active regulars</p>
        </div>
        <Button asChild className="bg-pitch-600 hover:bg-pitch-700">
          <Link href="/roster/new">+ Add Player</Link>
        </Button>
      </div>
      <PlayerGrid players={players} />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Visit `/roster` (logged in) → see empty-state card and "+ Add Player" button.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: roster grid page"
```

---

### Task 15: Build the avatar storage helpers

**Files:**
- Create: `src/lib/storage/avatars.ts`
- Create: `tests/unit/storage-avatars.test.ts`

- [ ] **Step 1: Install sharp**

```bash
npm install sharp
```

- [ ] **Step 2: Write the failing test**

`tests/unit/storage-avatars.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

let tempDir: string;

beforeAll(() => {
  tempDir = mkdtempSync(path.join(tmpdir(), "balon-avatars-"));
  process.env.ADMIN_PASSWORD = "x";
  process.env.SESSION_SECRET = "x".repeat(32);
  process.env.DATABASE_URL = "postgres://localhost/test";
  process.env.DATA_DIR = tempDir;
});

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("avatar storage", () => {
  it("saves an avatar as a 256x256 webp", async () => {
    const { saveAvatar } = await import("@/lib/storage/avatars");

    const png = await sharp({
      create: { width: 800, height: 800, channels: 3, background: { r: 50, g: 100, b: 50 } },
    })
      .png()
      .toBuffer();

    const result = await saveAvatar("player-abc", png);
    expect(result.path).toBe("avatars/player-abc.webp");

    const onDisk = path.join(tempDir, "avatars", "player-abc.webp");
    expect(existsSync(onDisk)).toBe(true);

    const meta = await sharp(readFileSync(onDisk)).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(256);
    expect(meta.height).toBe(256);
  });

  it("reads an avatar back", async () => {
    const { saveAvatar, readAvatar } = await import("@/lib/storage/avatars");
    const png = await sharp({
      create: { width: 400, height: 400, channels: 3, background: { r: 10, g: 10, b: 10 } },
    }).png().toBuffer();
    await saveAvatar("player-xyz", png);
    const buf = await readAvatar("player-xyz.webp");
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf!.length).toBeGreaterThan(100);
  });

  it("returns null when reading a missing avatar", async () => {
    const { readAvatar } = await import("@/lib/storage/avatars");
    const buf = await readAvatar("nonexistent.webp");
    expect(buf).toBeNull();
  });
});
```

- [ ] **Step 3: Run the test (should fail)**

```bash
npm run test:unit
```

Expected: `Cannot find module '@/lib/storage/avatars'`.

- [ ] **Step 4: Implement avatars.ts**

`src/lib/storage/avatars.ts`:

```ts
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "@/lib/env";

const AVATAR_SIZE = 256;

function avatarsDir(): string {
  return path.join(env.DATA_DIR, "avatars");
}

export async function saveAvatar(
  playerId: string,
  input: Buffer,
): Promise<{ path: string }> {
  await mkdir(avatarsDir(), { recursive: true });
  const filename = `${playerId}.webp`;
  const fullPath = path.join(avatarsDir(), filename);

  const processed = await sharp(input)
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toBuffer();

  await writeFile(fullPath, processed);
  return { path: `avatars/${filename}` };
}

export async function readAvatar(filename: string): Promise<Buffer | null> {
  // sanitize: disallow path separators
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return null;
  }
  try {
    return await readFile(path.join(avatarsDir(), filename));
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Run the test (should pass)**

```bash
npm run test:unit
```

Expected: all 3 storage tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: avatar storage helpers (sharp resize to 256x256 webp)"
```

---

### Task 16: Serve avatar files via API route

**Files:**
- Create: `src/app/api/avatars/[filename]/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/avatars/[filename]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readAvatar } from "@/lib/storage/avatars";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const buf = await readAvatar(filename);
  if (!buf) return new NextResponse("not found", { status: 404 });
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
```

- [ ] **Step 2: Smoke-test manually**

Manually create a dummy WebP at `data/avatars/test.webp` (any valid image renamed to .webp will do):

```bash
mkdir -p data/avatars
cp src/app/favicon.ico data/avatars/test.webp
```

Visit `http://localhost:3000/api/avatars/test.webp` → browser downloads or shows the file. (The favicon will not be a valid webp, but the route returns it with the correct headers; that's fine for the smoke test. Remove afterwards: `rm data/avatars/test.webp`.)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: serve avatars via /api/avatars/[filename]"
```

---

### Task 17: Build the avatar upload client component

**Files:**
- Create: `src/components/roster/avatar-upload.tsx`

- [ ] **Step 1: Install react-easy-crop**

```bash
npm install react-easy-crop
```

- [ ] **Step 2: Create the component**

```tsx
// src/components/roster/avatar-upload.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";

interface Props {
  /** Existing avatar URL to show, if any */
  existingUrl?: string | null;
  /** Hidden input name to submit the cropped image (as base64 data URL) */
  name: string;
}

export function AvatarUpload({ existingUrl, name }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(String(reader.result));
    reader.readAsDataURL(file);
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function confirmCrop() {
    if (!src || !croppedAreaPixels) return;
    const img = new Image();
    img.src = src;
    await new Promise((r) => (img.onload = r));

    const canvas = document.createElement("canvas");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCroppedDataUrl(dataUrl);
    setSrc(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-pitch-100">
          {croppedDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={croppedDataUrl} alt="" className="h-full w-full object-cover" />
          ) : existingUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={existingUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-pitch-700">
              No photo
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          {croppedDataUrl || existingUrl ? "Change photo" : "Upload photo"}
        </Button>
      </div>

      <input type="hidden" name={name} value={croppedDataUrl ?? ""} />

      {src && (
        <div className="rounded-lg border bg-white p-4">
          <div className="relative h-64 w-full bg-black/80">
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setSrc(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmCrop} className="bg-pitch-600 hover:bg-pitch-700">
              Use this crop
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: client-side avatar upload with crop"
```

---

### Task 18: Build the player form (shared between New and Edit)

**Files:**
- Create: `src/components/roster/player-form.tsx`

- [ ] **Step 1: Player form component**

```tsx
// src/components/roster/player-form.tsx
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "./avatar-upload";
import type { Player } from "@/types/player";

type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;
type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

interface Props {
  action: Action;
  player?: Player;
  submitLabel: string;
}

export function PlayerForm({ action, player, submitLabel }: Props) {
  const [state, dispatch, pending] = useActionState(action, undefined);

  return (
    <form action={dispatch} className="max-w-md space-y-5 rounded-xl border border-pitch-100 bg-white p-6">
      <div className="space-y-2">
        <Label>Avatar</Label>
        <AvatarUpload
          name="avatarDataUrl"
          existingUrl={player?.avatarPath ? `/api/avatars/${player.avatarPath.split("/").pop()}` : null}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname *</Label>
        <Input
          id="nickname"
          name="nickname"
          required
          defaultValue={player?.nickname}
          maxLength={40}
        />
        {state?.fieldErrors?.nickname && (
          <p className="text-sm text-red-600">{state.fieldErrors.nickname}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="jerseyNumber">Jersey number</Label>
        <Input
          id="jerseyNumber"
          name="jerseyNumber"
          type="number"
          min={0}
          max={999}
          defaultValue={player?.jerseyNumber ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredPosition">Preferred position</Label>
        <select
          id="preferredPosition"
          name="preferredPosition"
          defaultValue={player?.preferredPosition ?? ""}
          className="h-10 w-full rounded-md border border-pitch-100 bg-white px-3 text-sm"
        >
          <option value="">No preference</option>
          <option value="GK">Goalkeeper</option>
          <option value="DF">Defender</option>
          <option value="MF">Midfielder</option>
          <option value="FW">Forward</option>
        </select>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full bg-pitch-600 hover:bg-pitch-700">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: shared player form component"
```

---

### Task 19: Build the new-player page and create action

**Files:**
- Create: `src/app/(admin)/roster/new/page.tsx`
- Create: `src/app/(admin)/roster/actions.ts`

- [ ] **Step 1: Create the server actions file with the create action**

`src/app/(admin)/roster/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createPlayer, updatePlayer, archivePlayer } from "@/lib/db/queries/players";
import { saveAvatar } from "@/lib/storage/avatars";

const PlayerSchema = z.object({
  nickname: z.string().trim().min(1, "Nickname is required").max(40),
  jerseyNumber: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? Number(v) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 999), {
      message: "Must be 0–999",
    }),
  preferredPosition: z.enum(["FW", "MF", "DF", "GK", ""]).transform((v) => (v === "" ? null : v)),
  avatarDataUrl: z.string().optional(),
});

type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

async function dataUrlToBuffer(dataUrl: string | undefined): Promise<Buffer | null> {
  if (!dataUrl) return null;
  const match = /^data:image\/[^;]+;base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return Buffer.from(match[1], "base64");
}

export async function createPlayerAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = {
    nickname: String(fd.get("nickname") ?? ""),
    jerseyNumber: String(fd.get("jerseyNumber") ?? ""),
    preferredPosition: String(fd.get("preferredPosition") ?? "") as "FW" | "MF" | "DF" | "GK" | "",
    avatarDataUrl: String(fd.get("avatarDataUrl") ?? ""),
  };
  const parsed = PlayerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    const player = await createPlayer({
      nickname: parsed.data.nickname,
      jerseyNumber: parsed.data.jerseyNumber,
      preferredPosition: parsed.data.preferredPosition,
    });

    const buf = await dataUrlToBuffer(parsed.data.avatarDataUrl);
    if (buf) {
      const { path } = await saveAvatar(player.id, buf);
      await updatePlayer(player.id, { avatarPath: path });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("players_nickname_unique")) {
      return { fieldErrors: { nickname: "That nickname is already taken" } };
    }
    return { error: "Could not save player. Try again." };
  }

  revalidatePath("/roster");
  redirect("/roster");
}

export async function updatePlayerAction(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const raw = {
    nickname: String(fd.get("nickname") ?? ""),
    jerseyNumber: String(fd.get("jerseyNumber") ?? ""),
    preferredPosition: String(fd.get("preferredPosition") ?? "") as "FW" | "MF" | "DF" | "GK" | "",
    avatarDataUrl: String(fd.get("avatarDataUrl") ?? ""),
  };
  const parsed = PlayerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    await updatePlayer(id, {
      nickname: parsed.data.nickname,
      jerseyNumber: parsed.data.jerseyNumber,
      preferredPosition: parsed.data.preferredPosition,
    });

    const buf = await dataUrlToBuffer(parsed.data.avatarDataUrl);
    if (buf) {
      const { path } = await saveAvatar(id, buf);
      await updatePlayer(id, { avatarPath: path });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("players_nickname_unique")) {
      return { fieldErrors: { nickname: "That nickname is already taken" } };
    }
    return { error: "Could not update player. Try again." };
  }

  revalidatePath("/roster");
  redirect("/roster");
}

export async function archivePlayerAction(id: string): Promise<void> {
  await archivePlayer(id);
  revalidatePath("/roster");
  redirect("/roster");
}
```

- [ ] **Step 2: New-player page**

`src/app/(admin)/roster/new/page.tsx`:

```tsx
import { PlayerForm } from "@/components/roster/player-form";
import { createPlayerAction } from "../actions";

export default function NewPlayerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-pitch-900">Add Player</h2>
        <p className="text-sm text-pitch-700">New regular for the roster.</p>
      </div>
      <PlayerForm action={createPlayerAction} submitLabel="Add Player" />
    </div>
  );
}
```

- [ ] **Step 3: Smoke-test**

Run `npm run dev`. Visit `/roster/new`. Add a player with nickname only → redirects to `/roster`, sees the new player. Add another player without an avatar → still appears with the initial letter. Add an avatar → reload → see the rendered avatar.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: create player flow (form + server action)"
```

---

### Task 20: Build the edit-player page with archive action

**Files:**
- Create: `src/app/(admin)/roster/[id]/edit/page.tsx`
- Create: `src/components/roster/archive-button.tsx`

- [ ] **Step 1: Archive button (client component for confirm dialog)**

`src/components/roster/archive-button.tsx`:

```tsx
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
```

- [ ] **Step 2: Edit page**

`src/app/(admin)/roster/[id]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getPlayerById } from "@/lib/db/queries/players";
import { PlayerForm } from "@/components/roster/player-form";
import { ArchiveButton } from "@/components/roster/archive-button";
import { updatePlayerAction, archivePlayerAction } from "../../actions";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayerById(id);
  if (!player) notFound();

  const update = updatePlayerAction.bind(null, id);
  const archive = archivePlayerAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-pitch-900">Edit Player</h2>
        <p className="text-sm text-pitch-700">Update details for {player.nickname}.</p>
      </div>
      <PlayerForm action={update} player={player} submitLabel="Save Changes" />
      <div className="border-t border-pitch-100 pt-6">
        <ArchiveButton archiveAction={archive} />
        <p className="mt-2 text-xs text-pitch-700">
          Archiving hides the player from future lineups but preserves past matches and stats.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Smoke-test**

Click a player card on `/roster` → edit page loads with their data pre-filled. Change nickname → save → returns to roster, change reflects. Click archive → confirm → player disappears from roster.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: edit and archive player flows"
```

---

### Task 21: E2E test the login flow

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/login.spec.ts`
- Modify: `package.json` (add e2e scripts)

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Playwright config**

`playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Add e2e script**

In `package.json` under `"scripts"`:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 4: Write login spec**

`tests/e2e/login.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("rejects wrong password", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="password"]', "wrong");
  await page.click('button[type="submit"]');
  await expect(page.getByText(/wrong password/i)).toBeVisible();
});

test("accepts correct password and redirects to dashboard", async ({ page }) => {
  await page.goto("/login");
  // ADMIN_PASSWORD must be set in the env used by `npm run dev`
  const pw = process.env.ADMIN_PASSWORD ?? "changeme";
  await page.fill('input[name="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/");
  await expect(page.getByRole("heading", { name: /today/i })).toBeVisible();
});

test("admin route redirects to login when not authenticated", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/roster");
  await page.waitForURL("**/login");
});
```

- [ ] **Step 5: Run E2E**

Ensure Postgres is running (`docker compose up -d`). Then:

```bash
npm run test:e2e
```

Expected: 3 passing tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: e2e for login flow"
```

---

### Task 22: E2E test the roster CRUD flow

**Files:**
- Create: `tests/e2e/roster.spec.ts`

- [ ] **Step 1: Write roster spec**

```ts
// tests/e2e/roster.spec.ts
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  const pw = process.env.ADMIN_PASSWORD ?? "changeme";
  await page.fill('input[name="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/");
});

test("create, edit, archive a player", async ({ page }) => {
  const unique = `E2E_${Date.now()}`;

  await page.goto("/roster");
  await page.click('a[href="/roster/new"]');
  await page.fill('input[name="nickname"]', unique);
  await page.fill('input[name="jerseyNumber"]', "42");
  await page.selectOption('select[name="preferredPosition"]', "FW");
  await page.click('button[type="submit"]');

  await page.waitForURL("**/roster");
  await expect(page.getByText(unique)).toBeVisible();

  await page.getByText(unique).click();
  await page.waitForURL(/\/roster\/.+\/edit$/);
  await page.fill('input[name="nickname"]', `${unique}_x`);
  await page.click('button[type="submit"]');

  await page.waitForURL("**/roster");
  await expect(page.getByText(`${unique}_x`)).toBeVisible();

  await page.getByText(`${unique}_x`).click();
  await page.click('button:has-text("Archive player")');
  await page.click('button:has-text("Confirm archive")');

  await page.waitForURL("**/roster");
  await expect(page.getByText(`${unique}_x`)).toHaveCount(0);
});

test("nickname uniqueness is enforced", async ({ page }) => {
  const unique = `DUP_${Date.now()}`;

  await page.goto("/roster/new");
  await page.fill('input[name="nickname"]', unique);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/roster");

  await page.goto("/roster/new");
  await page.fill('input[name="nickname"]', unique);
  await page.click('button[type="submit"]');
  await expect(page.getByText(/already taken/i)).toBeVisible();
});
```

- [ ] **Step 2: Run the spec**

```bash
npm run test:e2e -- roster.spec.ts
```

Expected: 2 passing tests.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: e2e for roster CRUD"
```

---

### Task 23: Add a logout action

**Files:**
- Modify: `src/components/admin/sidebar-nav.tsx` (add logout link)
- Create: `src/app/logout/route.ts`

- [ ] **Step 1: Logout route**

`src/app/logout/route.ts`:

```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export async function POST() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

export async function GET() {
  // also allow clearing via GET for convenience
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
```

- [ ] **Step 2: Add a Sign-out link to the sidebar**

Append to `src/components/admin/sidebar-nav.tsx`, inside the returned `<nav>` (after the items loop):

```tsx
<form action="/logout" method="post" className="mt-6">
  <button
    type="submit"
    className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-pitch-900 hover:bg-pitch-100"
  >
    Sign out
  </button>
</form>
```

- [ ] **Step 3: Add logout to middleware exclusions**

Update the matcher in `middleware.ts` so `/logout` is not protected. Replace the matcher line:

```ts
"/((?!login|logout|p/|p$|api/avatars|_next/|favicon.ico).*)",
```

- [ ] **Step 4: Smoke-test**

Log in → click "Sign out" → cookie cleared, redirected to `/login`. Try `/roster` → bounces to `/login`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: logout action and middleware exclusion"
```

---

### Task 24: Add a basic dashboard placeholder with roster count

**Files:**
- Modify: `src/app/(admin)/page.tsx`

- [ ] **Step 1: Replace the dashboard page**

```tsx
// src/app/(admin)/page.tsx
import Link from "next/link";
import { listActiveRegulars } from "@/lib/db/queries/players";
import { Card } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const players = await listActiveRegulars();
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
          <Link href="/roster" className="mt-3 inline-block text-sm font-medium text-pitch-600 hover:underline">
            Manage roster →
          </Link>
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-wide text-pitch-700">Next match</p>
          <p className="mt-2 text-sm text-pitch-700">Match creation coming in Plan 2.</p>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Smoke-test**

After logging in, dashboard shows the current roster count.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: dashboard placeholder with roster count"
```

---

### Task 25: Configure Railway deployment

**Files:**
- Create: `railway.json`
- Modify: `next.config.ts` (allow standalone output)
- Modify: `README.md` (deployment section)

- [ ] **Step 1: Update next.config.ts for standalone output**

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 2: Create railway.json**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npm run db:push && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

(`db:push` on build is intentional — runs Drizzle schema sync on each deploy. For early-stage projects this is fine; switch to `db:generate`-then-`db:migrate` flow once you have migrations in production.)

- [ ] **Step 3: Add Railway deployment section to README**

Append to `README.md`:

````markdown
## Deploying to Railway

1. Create a new Railway project; connect this GitHub repo.
2. Add a **Postgres** plugin to the project. Railway will set `DATABASE_URL` automatically.
3. Add a **Volume** to the service, mounted at `/data`. This is where avatars and (later) generated images are stored.
4. Set the following environment variables on the service:
   - `ADMIN_PASSWORD` — your chosen password
   - `SESSION_SECRET` — generate with `openssl rand -hex 32`
   - `DATA_DIR=/data`
   - `NODE_ENV=production`
5. Deploy. Visit your Railway-issued URL — first stop is `/login`.

```bash
# generate a session secret
openssl rand -hex 32
```
````

- [ ] **Step 4: Verify production build runs locally**

```bash
npm run build
```

Expected: build completes without errors, `.next/standalone` is produced.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: Railway deployment config"
```

- [ ] **Step 6: Deploy**

This step requires user action: push to GitHub, connect the Railway project, set env vars, and trigger the first deploy. Verify the live URL renders `/login` and that logging in works.

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

Then on Railway: create project → connect repo → add Postgres → add Volume at `/data` → set env vars → deploy.

- [ ] **Step 7: Smoke-test the deployed app**

- Visit the Railway URL → redirects to `/login`
- Log in with `ADMIN_PASSWORD` → see dashboard
- Add a player with an avatar → upload completes, avatar renders
- Refresh → avatar persists (proves the volume mount)
- Sign out → redirected to login

---

## Self-Review

Final pass checking the plan against the spec.

**Spec coverage (Plan 1 scope):**
- Section 5 (Architecture): single Next.js app, Postgres on Railway, cookie auth, volume at `/data` — Tasks 1, 6, 7, 8, 9, 10, 25 ✓
- Section 6 (Data model): all 6 tables — Task 7 ✓
- Section 7 (Screens) — Plan 1 covers: admin shell (Task 11), login (Task 9), roster (Tasks 14, 19, 20), public stub (Task 12), dashboard stub (Task 24). Other admin/public screens deferred to Plans 2 and 3 ✓
- Section 4 (Visual identity): pitch-green theme tokens, white badges, classic look — Task 2 ✓
- Section 12 (Tech stack): all of Plan 1's dependencies installed (Next 15, Tailwind, shadcn/ui, Drizzle, Postgres, React Hook Form not needed yet, Zod, sharp, react-easy-crop, Vitest, Playwright) ✓

**Deferred to Plans 2 / 3 (correctly out of scope here):**
- Lineup builder (`@dnd-kit`), match creation, public match views — Plan 2
- Result entry, goals, stats, leaderboard, image generation (`@vercel/og`), public player profiles — Plan 3

**No placeholders:** every step has either runnable commands, complete code blocks, or specific verification criteria. Tasks 21–22 (E2E) include full spec code. Task 25 (deploy) requires user action on a hosted service, which is documented as such.

**Type consistency:** `Player` type is exported from `src/lib/db/schema.ts` and re-exported through `src/types/player.ts`. `Position` enum is referenced consistently as `"FW" | "MF" | "DF" | "GK"`. Avatar paths are stored as `avatars/<id>.webp` and served via `/api/avatars/<filename>`; the encode/decode is consistent across `player-card.tsx`, `player-form.tsx`, and `route.ts`.

**Ordering check:**
- Task 1 (scaffold) → Task 2 (theme) → Task 3 (shadcn) provides UI primitives before any UI is built ✓
- Task 4 (env validation) before Task 6 (Drizzle, which imports env) ✓
- Task 7 (schema) before Task 13 (queries) before Task 14 (page) ✓
- Task 8 (session) before Task 9 (login uses session) before Task 10 (middleware uses session) ✓
- Task 15 (storage) before Task 16 (serving route) before Task 17 (client upload) before Task 19 (server action uses storage) ✓
- E2E tests (21, 22) come after everything they test ✓
- Deploy (25) is last ✓

The plan is internally consistent and complete for Plan 1's scope.
