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
