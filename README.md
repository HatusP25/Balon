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
