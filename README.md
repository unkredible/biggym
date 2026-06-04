# biggym

Gym-management SaaS, built on the **unkredible** platform template.

Two surfaces on two hostnames (one container, host-based routing):

| Host                          | Surface | Access |
|-------------------------------|---------|--------|
| `biggym.unkredible.com`       | Portal  | Public — gyms subscribe (Stripe) |
| `app.biggym.unkredible.com`   | App     | Credential-gated (magic-link, Google, email+password) |

## Flow

1. A gym owner subscribes on the portal → Stripe Checkout (subscription).
2. The Stripe webhook provisions a **Gym** + owner **User** + `gym_admin`
   **Membership**, and emails the owner a sign-in link.
3. Staff sign in at `app.biggym…` and manage clients + workout programs.
   Every query is scoped to the user's `gymId` (app-level multi-tenancy).

## Stack

- Next.js 14 (App Router, standalone) + TypeScript
- Prisma + PostgreSQL (provided by the platform — isolated per project)
- Auth.js v5: Credentials + Nodemailer magic-link + Google (JWT sessions)
- Stripe subscriptions
- Runs as an unkredible "project" (own image, DB, mailbox, storage, SSL)

## Develop

```bash
npm install
cp .env.example .env   # fill DATABASE_URL, AUTH_SECRET, SMTP_*, STRIPE_*, GOOGLE_*
npx prisma generate
npm run dev            # http://localhost:3000
```

Host-based routing keys off the `Host` header (`app.*` → app). Locally,
everything renders as the portal at `/`; visit `/dashboard`, `/login`,
`/clients` directly to see the app surface.

## Deploy (on the unkredible VM)

This repo is the code for the `biggym` project. To update the live app:

```bash
cd /opt/unkredible/template-webapp/projects/project_<id>_biggym/app
git pull
cd .. && cd /opt/unkredible/template-webapp
./rebuild-project.sh biggym
```

Required project env (in the project's `.env`):
- `AUTH_URL=https://app.biggym.unkredible.com`
- `STRIPE_PRICE_ID=price_…` (the subscription price)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (callback on the **app** host)

DNS: `app.biggym.unkredible.com` needs its own A record (the `*` wildcard is
single-level). Project `VIRTUAL_HOST` / `LETSENCRYPT_HOST` must list both
`biggym.unkredible.com,app.biggym.unkredible.com`.

## Roadmap

- F2: workout program builder, exercise library, client detail + events.
- F3: staff invites + roles UI, client portal (client role), branding, billing portal.
- Migrations (currently `prisma db push` on container start).
