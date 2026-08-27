# Contrails AI — DIT UI

Next.js front end for **Contrails AI / DIT** (Deepfake Investigator Tool): upload image, video, or audio, run deepfake detection, and review results.

Stack: **Next.js 15** (App Router), **React 18**, **Tailwind CSS**, **Supabase Auth**, **AWS** (S3 / SQS / SNS / CloudFront), **Contrails Platform Detect API**.

---

## Requirements

- Node.js `>= 18`
- npm
- Supabase project (auth + app tables)
- AWS credentials for media storage / messaging
- Contrails Detect API key (`DEEPFAKE_API_KEY`)

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in secrets
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

| Script | Command |
|--------|---------|
| Dev | `npm run dev` |
| Production build | `npm run build` |
| Start prod server | `npm start` |
| Lint | `npm run lint` |

---

## Environment variables

Create `.env.local` (gitignored). **Never commit secrets.**

### Supabase

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser + middleware) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin client (detect persist, privileged writes) |

### Contrails Detect API

| Variable | Purpose |
|----------|---------|
| `DEEPFAKE_API_BASE_URL` | API base (default `https://api.contrails.ai`) |
| `DEEPFAKE_API_KEY` | Bearer key for `/v1/detect` and job polling |

Integration notes: [`deepfake-api.md`](./deepfake-api.md). Client code: `src/lib/deepfake-api/`.

### AWS — S3 (geo buckets)

| Variable | Purpose |
|----------|---------|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AWS_REGION` | Default region |
| `AWS_REGION_US` / `AWS_REGION_ASIA` | Region per bucket |
| `S3_BUCKET_NAME_US` / `S3_BUCKET_NAME_ASIA` | Upload buckets (chosen via `x-vercel-ip-country`) |

### AWS — queues / notify (legacy video-audio pipeline)

| Variable | Purpose |
|----------|---------|
| `SQS_QUEUE_URL` | Production analysis queue |
| `DEV_SQS_QUEUE_URL` | Dev queue when `NEXT_PUBLIC_ENVIRONMENT=development` |
| `SNS_INSTANCE_TOPIC_ARN` | Prod: wake analysis instance |
| `SNS_EMAIL_TOPIC_ARN` | Email on verification events |

### CloudFront (signed media URLs)

| Variable | Purpose |
|----------|---------|
| `CDN_URL` | CDN base URL |
| `CLOUDFRONT_PUBLIC_KEY_ID` | Key pair id |
| `PRIVATE_KEY` | PEM private key for URL signing |

### App

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_ENVIRONMENT` | `development` \| `production` (queue / SNS behavior) |

---

## App routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Redirect → `/media-checker` or `/login` |
| `/login` | Public | Email/password, signup, Google OAuth, forgot password |
| `/auth/callback` | Public | OAuth code exchange + session |
| `/auth/confirm` | Public | Email confirmation |
| `/auth/update-password` | Public | Password reset |
| `/media-checker` | Auth | Primary upload / analysis UI |
| `/media-checker/case-list` | Auth | Past cases (filters, search, pagination) |
| `/media-analyzer` | Verifier | Direct analysis form |
| `/view/[id]` | Auth | Case results (hydrates pending detects when needed) |
| `/demo` | Verifier | Detect API demo |
| `/docs` | Verifier | In-app Detect API docs |
| `/account` | Verifier | Create / revoke platform API keys (`dfk_…`) |
| `/terms-of-service`, `/privacy-policy` | Public | Legal |

Sidebar (auth shell): Media Checker, Case List; verifiers also get Demo, API Docs, API Keys.

---

## API routes (`src/app/api`)

| Route | Purpose |
|-------|---------|
| `POST /api/upload` | Create `Transactions` row + geo S3 presigned PUT |
| `POST /api/detect` | Proxy Contrails `/v1/detect` (poll jobs) → persist v3 envelope |
| `POST /api/send-message` | Enqueue legacy SQS analysis (+ SNS in prod) |
| `POST /api/media-url` | Presigned S3 GET for a `media_key` |
| `POST /api/create-assets` | Insert `Assets` + S3 presigned PUTs |
| `GET /api/download-asset` | Auth proxy download |

`/api/detect` uses `maxDuration = 300` for long video/audio jobs.

---

## Architecture overview

```text
Browser (App Router)
   │
   ├─ Supabase Auth (middleware session refresh)
   │
   ├─ POST /api/upload  → Transactions + S3 presigned PUT
   │
   ├─ Image / platform detect
   │     └─ POST /api/detect → Contrails /v1/detect (+ job poll)
   │           └─ persist v3 envelope on Transactions
   │
   └─ Legacy video/audio workers
         └─ POST /api/send-message → SQS (+ SNS in prod)
```

**Results UI**

- **v3** (`src/components/results-v3/`) — Contrails detect envelope (`version` 3.x or `prediction` + modality `results`)
- **Legacy** — `result_ui_v2.js`, `ResultVideoUI_v1`, `ResultAudioUI`, `ResultImageUI` when no v3 envelope

`/view/[id]` prefers v3 when present; otherwise falls back by modality / method.

**Auth**

- Middleware (`src/middleware.js`) refreshes cookies and protects app routes
- Profile / credits / `verifier` flag from Supabase `Tokens`
- Verifier-only pages redirect non-verifiers to `/media-checker`

**API keys**

- Minted in `/account` (`src/lib/api-keys/`) — plaintext shown once; store hash + prefix
- Table: `VISION_API_KEY`
- RLS migration: `supabase/migrations/20260827130405_vision_api_key_rls.sql` (owner-only SELECT/INSERT/UPDATE; revoke via `revoked_at`)

---

## Project layout

```text
src/
  app/                 # Routes (App Router) + API handlers
  components/          # UI (upload, players, results-v2/v3, shell)
  lib/
    deepfake-api/      # Detect client, envelope, hydrate, normalize
    api-keys/          # Platform key minting
    supabase/          # Browser / server / middleware clients
  utils/               # Cases, S3/SQS/SNS helpers, date formatting
supabase/migrations/   # SQL migrations (apply in Supabase)
deepfake-api.md        # External Detect API integration guide
```

---

## Database

Apply SQL under `supabase/migrations/` in your Supabase project (SQL editor or CLI) when setting up or updating API-key RLS.

Core tables used by the UI (non-exhaustive): `Transactions`, `Tokens`, `Assets`, `VISION_API_KEY`.

---

## Notes

- Dates in the case list / account UI use a fixed `en-US` + UTC formatter (`src/utils/format_date.js`) to avoid SSR hydration mismatches from default locales.
- Local env files matching `.env*.local` / `.env.local.*` are gitignored — keep secrets out of git.
- Deployed on Vercel; dual S3 regions use request country headers when available.
