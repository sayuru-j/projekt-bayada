# Bayada API

NestJS backend. Database is **Supabase Postgres** via Prisma.

## Env

See `.env.example`. Required:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase **transaction pooler** (port `6543`, `pgbouncer=true`) |
| `DIRECT_URL` | Supabase **direct/session** connection for `prisma migrate` / seed |
| `JWT_SECRET` | Signs app JWTs after Google login |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3000/auth/google/callback` |
| `FRONTEND_URL` | `http://localhost:5173` |
| `ADMIN_EMAILS` | Optional bootstrap admins |

## Commands

```bash
pnpm prisma migrate dev --name init
pnpm prisma:seed
pnpm start:dev
```
