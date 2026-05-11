# Balon — Design Spec

**Date:** 2026-05-11
**Status:** Approved
**Author:** Hatus + Claude (brainstorming session)

## 1. What this is

A self-hosted web app for a casual recreational soccer group ("Balon") that plays Monday and Wednesday matches, usually 9v9 but flexible. Replaces ad-hoc use of public lineup builders (e.g. buildlineup.com) with a single tool that adds post-match tracking and persistent stats.

**Audience model:**
- **One admin (the owner).** Plans lineups, manages roster, enters match results.
- **Friends as public viewers.** No accounts; they open a shared link or saved image in WhatsApp on their phones.

**Why now:** The owner already pays for a Railway plan; building a small, opinionated tool replaces three friction points (clunky public builders, lost WhatsApp screenshots of past lineups, no historical stats).

## 2. Goals & non-goals

**Goals**
- Build a planned lineup quickly (formation presets + drag-to-fine-tune), generate a beautiful shareable image for WhatsApp.
- Log match results (score, attendance, goalscorers, assists) with low friction.
- Show meaningful all-time and recent stats per player and across the group.
- Look distinctly more polished than buildlineup.com — "pitch green + sporty" visual identity.

**Non-goals (v1)**
- Modeling the opposing team (only free-text opponent name).
- Match notes, MVP voting, match photos (deferred).
- Multi-user accounts, comments, reactions.
- Tracking opponent goalscorers (just the aggregate `their_score`).
- Mobile-first admin UX (admin work happens on a PC at home; mobile-first is for the public viewer screens only).

## 3. Audience & device priorities

| Audience | Context | Priority |
|---|---|---|
| Admin (owner) | PC at home, before/after matches | Desktop-first; mobile must work but isn't optimized |
| Friends (viewers) | Phones, opening WhatsApp links | Mobile-first; desktop is a polished responsive scale-up |

This split drives layout decisions. Admin screens (`/(admin)/*`) optimize for wider viewports with sidebars and multi-column views. Public screens (`/(public)/*`) optimize for narrow viewports first.

## 4. Visual identity

**Direction: Pitch Green + Sporty.** Classic football aesthetic — pitch-green backgrounds, round white badges with jersey numbers, friendly and recognizably soccer-themed. Warm rather than edgy.

- **Primary green:** deep pitch tones, gradient from `#0d6b4f` to `#0a5a42`
- **Background neutral:** soft off-white `#f5f5f0` on light surfaces
- **Player badge:** white circle, green numeral, dark-green text label below
- **Typography:** clean sans-serif (Inter or similar); jersey numerals are bold and heavy
- **Texture:** subtle pitch-stripe pattern on field surfaces (alternating green bands)

This is the brand. All screens — admin and public — share it.

## 5. Architecture

**Single Next.js 15 app** (App Router) deployed to Railway, with a Postgres database also on Railway. One service, one DB, one domain.

**Route trees:**
- `app/(admin)/*` — protected; lineup builder, match list/entry, roster, settings
- `app/(public)/*` — open; today's lineup, match recaps, leaderboards, player profiles
- `app/login` — single-password form
- `app/api/og/match/[shortSlug]/route.ts` — generates the lineup PNG via `@vercel/og` (public, unguessable slug)

**Auth model — single admin, cookie-based:**
- Environment variables: `ADMIN_PASSWORD`, `SESSION_SECRET`
- Login posts password → server compares (constant-time) → signs a cookie `balon_admin=<HMAC-SHA256 of "admin" using SESSION_SECRET>`
- Cookie: HttpOnly, Secure, SameSite=Lax, Max-Age 90 days
- Middleware (`middleware.ts`) checks the cookie on all `(admin)` routes; missing/invalid → 302 to `/login`
- No user table, no password reset flow, no sessions table. If the admin forgets the password, they redeploy with a new env var.

**File storage:** Railway persistent volume mounted at `/data`.
- `/data/avatars/<player-id>.webp` — uploaded and resized to 256×256
- `/data/lineups/<match-id>.png` — cached lineup images, busted on lineup edit

**Image generation:** `@vercel/og` renders a React component server-side into a 1080×1350 portrait PNG (Instagram/WhatsApp-friendly aspect ratio). Cache key: `lineups/<match-id>-<lineup_version>.png` where `lineup_version` is bumped on any lineup change.

**Styling:** Tailwind CSS + shadcn/ui component primitives. Custom theme tokens for the pitch-green palette.

**ORM:** Drizzle ORM (type-safe, light, Postgres-first).

**Deployment:** Railway Next.js template. Attach Postgres add-on (auto-injects `DATABASE_URL`). Set `ADMIN_PASSWORD` and `SESSION_SECRET`. Push to `main` to deploy.

## 6. Data model

Six tables. Postgres. UUID primary keys. Soft-delete via `is_active` boolean rather than row deletion (preserves stats history).

### `players`
| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()` |
| `nickname` | text | NOT NULL, UNIQUE |
| `jersey_number` | int | nullable |
| `avatar_path` | text | nullable; relative path under `/data/avatars` |
| `preferred_position` | text | nullable; one of `FW`, `MF`, `DF`, `GK` |
| `is_regular` | bool | NOT NULL, default `true` (false = one-off guest) |
| `is_active` | bool | NOT NULL, default `true` |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

### `matches`
| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `short_slug` | text | NOT NULL, UNIQUE, 6-char URL-safe (for public URLs) |
| `played_at` | timestamptz | NOT NULL |
| `opponent_name` | text | nullable |
| `our_score` | int | nullable until result entered |
| `their_score` | int | nullable until result entered |
| `formation` | text | NOT NULL (e.g. `"3-3-2"`, `"custom"`) |
| `status` | text | NOT NULL; one of `planned`, `played` |
| `lineup_version` | int | NOT NULL, default 0; bumped on any lineup edit (for image cache busting) |
| `created_at`, `updated_at` | timestamptz | NOT NULL, default `now()` |

Index: `matches(played_at DESC)`.

### `lineup_slots` (planned positions)
| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `match_id` | uuid | FK `matches(id)` ON DELETE CASCADE |
| `player_id` | uuid | FK `players(id)`, nullable (empty slot allowed) |
| `x` | numeric(5,2) | 0–100, % from left of pitch |
| `y` | numeric(5,2) | 0–100, % from top of pitch |
| `role` | text | NOT NULL; one of `FW`, `MF`, `DF`, `GK` |

Index: `lineup_slots(match_id)`.

### `match_appearances` (who actually played)
| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `match_id` | uuid | FK `matches(id)` ON DELETE CASCADE |
| `player_id` | uuid | FK `players(id)` |
| | | UNIQUE(`match_id`, `player_id`) |

Index: `match_appearances(player_id)`, `match_appearances(match_id)`.

### `goals`
| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `match_id` | uuid | FK `matches(id)` ON DELETE CASCADE |
| `scorer_id` | uuid | FK `players(id)` NOT NULL |
| `assist_id` | uuid | FK `players(id)` nullable |
| `order_index` | int | NOT NULL; ordering within a match |

Index: `goals(scorer_id)`, `goals(assist_id)`, `goals(match_id)`.

### Key design decisions
- **Planned lineup ≠ actual attendance.** `lineup_slots` is what the admin drew on the field; `match_appearances` is the truth. Stats use `match_appearances`.
- **No opponent table.** `matches.opponent_name` is free text. Grouping by opponent name still gives "vs Pirates: 4W-1L-2D" if names are consistent.
- **Goals don't record minutes.** `order_index` gives chronological order without forcing the admin to remember when each one happened.
- **Soft-delete via `is_active`.** Archived players stay linked in past matches and stats; they just disappear from future lineup pickers and roster grid.

## 7. Screens & navigation

### Admin (desktop-first, behind login)
- `/` — dashboard: "Next planned match" card, "Last match result" card, quick actions, "Pending: enter result for match on <date>" nag if applicable
- `/matches` — sortable/filterable list of all matches (planned + played)
- `/matches/new` — create match (date, opponent, formation) → redirects to builder
- `/matches/[id]/lineup` — **the lineup builder.** Field on the left/main area, roster pool on the right
- `/matches/[id]/result` — three-step result entry (score → attendance → goals/assists)
- `/roster` — grid of regulars; add/edit/archive, avatar upload
- `/settings` — change admin password hint, see share URL slug, basic preferences

### Public (mobile-first, no auth)
- `/p` — public home: three vertically-stacked sections (Next match / Last match recap / Top 3 this month)
- `/p/match/[shortSlug]` — single match: lineup visual, result, goalscorers; has "Download Image" button
- `/p/stats` — full leaderboard, sortable; tabs for All-time / This year / Last 30 days
- `/p/player/[id]` — single player profile

### Login
- `/login` — single password input

### Navigation chrome
- Admin: sidebar on desktop (Today / Matches / Roster / Settings); bottom tab bar on mobile (same four).
- Public: top header with logo + 3 tabs (Today / Stats / Players).

## 8. Key flows

### Flow A: Planning a match
1. Admin dashboard → "+ New Match" modal: date, opponent (optional), formation preset (`3-3-2` / `3-2-3` / `4-3-1` / `2-3-3` / `Custom`)
2. Save → redirects to `/matches/[id]/lineup`
3. Builder shows pitch with empty slots in chosen formation; roster pool on the right
4. **Tap an empty slot** → modal with regulars list + "+ Guest" button → pick → slot fills
5. **Drag any filled slot** to fine-tune position (works in all formations, not just Custom)
6. **Long-press a filled slot** → "Swap" / "Remove" / "Change role"
7. Auto-saves on every interaction via server actions; no explicit save button
8. Header has "Share" (copies public URL) and "Download Image" (generates PNG)

**Custom formation specifics:**
- Starts with blank pitch
- Drag a player from the roster pool onto the pitch → creates a slot at the drop point
- OR tap an empty area on the pitch → creates an empty slot → tap to assign
- Long-press → "Remove" deletes the slot entirely
- No fixed player count — add as many as you want (handles 5v5, 9v9, 11v11, anything)

### Flow B: Entering match result
1. Match list → tap a played-but-not-recorded match → "Enter Result"
2. **Step 1: Score.** Two number inputs (us / them). Required.
3. **Step 2: Attendance.** Checkbox list pre-checked with the planned lineup. Uncheck no-shows, check substitutes who weren't planned. "+ Guest" button creates a guest on the fly (saved as `is_regular=false`).
4. **Step 3: Goals.** For each goal: pick scorer from attendance list, optionally pick assist. "+ Add Goal" repeats. Total goals must equal `our_score` (soft validation — warning if mismatched, allow saving anyway).
5. Submit → `matches.status` flips to `played`. Stats queries pick up the new rows immediately (no precomputation in v1).

### Flow C: Friend views a lineup
1. Admin pastes public URL or downloaded PNG into WhatsApp
2. Friend opens link → `/p/match/[shortSlug]` on phone
3. Sees: pitch render with player chips + avatars, formation badge, kickoff time, opponent name, status (planned/played)
4. If played: score banner + goalscorer list below the field
5. Tap any player chip → `/p/player/[id]` (player profile)
6. Top nav tab "Stats" → `/p/stats` (leaderboard)

### Flow D: Roster management
1. `/roster` shows grid of `is_regular=true, is_active=true` players with avatars
2. **"+ Add Player"** → form: nickname (required, unique), jersey number, preferred position, avatar upload
3. **Avatar upload:** drag-and-drop or file picker → client crops to square → POST to server → resized to 256×256 WebP → saved at `/data/avatars/<player-id>.webp` → `players.avatar_path` updated
4. **Tap a player** → edit form, or "Archive" (sets `is_active=false`)
5. **Past guests** section below: read-only list of one-off players, with "Promote to regular" action

## 9. Stats — what's displayed

All stats are queried live (no caching in v1; can add materialized views later if needed).

### Per-player (from `match_appearances` + `goals`)
- **MP:** count of appearances
- **G:** count of `goals.scorer_id = player`
- **A:** count of `goals.assist_id = player`
- **G/M:** goals divided by matches played
- **W%:** matches where player appeared AND `our_score > their_score`, divided by total appearances (draws don't count as wins; nulls excluded)
- **Recent form:** goals in last 5 appearances
- **Personal records:** most goals in single match, longest scoring streak (consecutive matches with ≥1 goal)
- **Position breakdown:** which role they appeared in most often (when known)

### Team-wide (from `matches`)
- All-time W/L/D, total goals for/against, goal differential
- Current streak (last 5 results, visualized as colored dots)
- Best/worst opponents grouped by `opponent_name`
- Monthly trend (line chart of matches per month, goals per month)

### Leaderboards
- Top scorer, top assister, most appearances, best win-rate (min. 5 appearances to qualify)
- Tabs for `All-time` / `This year` / `Last 30 days`
- Toggle "Include guests" (default: regulars only)

## 10. Sharing

Two output formats, both first-class.

### Shareable URL
- Pattern: `<domain>/p/match/<shortSlug>`
- `shortSlug` is a 6-character URL-safe random string (generated on match creation, stored on the match row)
- "Share" button in builder copies URL to clipboard

### Downloadable PNG
- Endpoint: `GET /api/og/match/[shortSlug]` — public (no auth). The slug acts as an unguessable token; if a match exists, its image is shareable. Admin doesn't need a separate "private preview" — once you create the match, you're going to share it.
- Renders a React component server-side via `@vercel/og`, 1080×1350 portrait
- **Contents:** pitch + player chips with avatars + names, formation label, opponent + date header, "balon" wordmark in corner
- **Post-match variant:** same layout with a score banner overlay and goalscorer list at the bottom
- Cached file at `/data/lineups/<match-id>-v<lineup_version>.png`; `lineup_version` bumps on edit, busting cache automatically
- "Download Image" button in the builder header

## 11. Out of scope for v1

Listed explicitly so nothing leaks into implementation:
- Match notes / commentary
- MVP voting
- Match photos / gallery
- User accounts for friends
- Comments / reactions
- Tracking individual opponent goalscorers
- Mobile push notifications
- Match calendar export (.ics)
- Live in-match updates
- Substitution tracking during a match
- Stats charting beyond simple line/dot visualizations

Each of these is a reasonable v2 candidate. Not in v1.

## 12. Tech stack summary

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI primitives | Tailwind CSS + shadcn/ui |
| Database | Postgres (Railway add-on) |
| ORM | Drizzle ORM |
| Auth | Cookie-based, single env-var password |
| File storage | Railway persistent volume at `/data` |
| Image generation | `@vercel/og` |
| Drag-and-drop | `@dnd-kit/core` (React, accessible, mobile-friendly) |
| Image cropping | `react-easy-crop` (client-side, for avatar upload) |
| Hosting | Railway |
| Forms | React Hook Form + Zod validation |

## 13. Risks & open questions

- **Image generation performance.** `@vercel/og` is fast but PNG rendering with custom React layouts can take 200–500ms cold. Acceptable for sharing; cache eliminates repeat cost.
- **Avatar upload UX on mobile.** Square cropping flow needs to be tight on a phone. `react-easy-crop` handles it but the picker layout deserves attention.
- **No precomputed stats.** Live queries are fine at this data scale (hundreds of matches, tens of players); revisit only if leaderboard pages get slow.
- **Single admin auth.** If the owner ever wants to delegate (e.g. "Lucho can log results too"), this needs to be revisited. Not in scope now.
