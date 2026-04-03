# SANNATA.me

Next.js portal with localized pages, agent/admin panel, secured internal APIs, and production-ready analytics consent flow.

## Requirements

- Node.js 20+
- npm 10+

## Local Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Use `.env.local` for local development (do not commit it). Use `.env.example` as a template.

### Required in production

- `AGENT_ADMIN_USER`
- `AGENT_ADMIN_PASSWORD`
- `AGENT_SESSION_SECRET`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### Optional

- `NEXT_PUBLIC_INTERNAL_HOSTS` (comma-separated hostnames marked as internal traffic)

## Security Notes

- `/agent` and `/api/agent/*` are protected by session auth.
- `/admin/login` is the entrypoint for admin auth.
- Service routes are excluded from indexing (`robots` + response headers).

## Build and Start

```bash
npm run build
npm run start
```

## Media Checks

```bash
npm run check:media
```
