# Bayada / HolmanMap

Crowdsourced haunted map of Sri Lanka.

## Structure

```
bayada/
├── frontend/   # React + Vite + MapLibre (HolmanMap UI)
└── backend/    # NestJS + Prisma → Supabase Postgres
```

## Prerequisites

- Node.js 20+
- Supabase project (Postgres database)
- Google Cloud OAuth client (Web application)

## Backend setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Open **Project Settings → Database → Connect → ORMs → Prisma**
3. Copy the **Transaction pooler** URL into `DATABASE_URL` and the **Session / Direct** URL into `DIRECT_URL`

```bash
cd backend
cp .env.example .env
# paste DATABASE_URL + DIRECT_URL, plus Google OAuth + ADMIN_EMAILS
pnpm install
pnpm prisma migrate dev --name init
pnpm prisma:seed
pnpm start:dev
```

API: `http://localhost:3000`

Prisma uses:
- `DATABASE_URL` — pooled connection (runtime queries)
- `DIRECT_URL` — direct/session connection (migrations & seed)

### Google OAuth

1. Create OAuth credentials in Google Cloud Console
2. Authorized redirect URI: `http://localhost:3000/auth/google/callback`
3. Put client ID/secret in `backend/.env`
4. Optional: set `ADMIN_EMAILS=you@gmail.com` so that account becomes admin on first login

### Promote a user manually (Supabase SQL Editor)

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@gmail.com';
```

## Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

## Features

- HolmanMap dark Carto basemap (Sri Lanka bounds)
- Ambient Web Audio drone + mute toggle
- Google sign-in via NestJS
- Submit haunted places (images ≤3×2MB + YouTube)
- GPS “I Survived” check-in within 500m
- Contributor/admin moderation queue
- EN / සිංහල UI strings
- Global survivors leaderboard

## API overview

| Method | Path | Auth |
|--------|------|------|
| GET | `/places` | public |
| GET | `/places/:id` | optional |
| POST | `/places` | user |
| GET | `/places/mine` | user |
| POST | `/places/:id/visit` | user |
| POST | `/uploads/evidence` | user |
| GET | `/admin/places?status=` | contributor+ |
| PATCH | `/admin/places/:id/approve` | contributor+ |
| PATCH | `/admin/places/:id/reject` | contributor+ |
| GET | `/leaderboard` | public |
| GET | `/auth/google` | — |
| GET | `/auth/me` | user |
