# Deepfake Platform API — UI Integration Guide

Audience: frontend / UI team building or revamping the detection product UI.

Base URL (local): `https://api.contrails.ai`  
All `/v1/*` responses are `application/json`.  
Auth on every `/v1/*` route: `Authorization: Bearer <API_KEY>`.

---

## 1. Quick mental model

```text
UI / client
   │
   ├─ (optional) create Transactions row in Supabase  → get transaction_id
   ├─ (optional) upload media to S3 via presigned URL → get media_key
   │
   ▼
POST /v1/detect
   │
   ├─ IMAGE  → HTTP 200 + full result envelope (same request)
   └─ VIDEO / AUDIO → HTTP 202 { job_id, status: "queued" }
                              │
                              ▼
                     GET /v1/jobs/{job_id}  (poll until terminal)
                              │
                              ▼
                     { job_id, status, result: { …envelope… } }
```

**Critical UI rule:** for async jobs, the detection envelope lives under `response.result`, not at the top level. For sync image detect, the envelope *is* the response body.

---

## 2. Authentication

```http
Authorization: Bearer <API_KEY>
```

| Status | Body | When |
|--------|------|------|
| `401` | `{ "error": "…" }` | Missing/invalid header or unknown key |
| `503` | `{ "error": "auth store unavailable" }` | DB auth down and no env fallback |
| `500` | `{ "error": "API authentication is not configured" }` | No keys configured on the API |

`GET /health` is public (no auth).

The API key maps to a `user_id` (owner). That owner is used when the worker **inserts** a Transactions row (API-key path). For the UI path with a pre-created transaction, you pass `transaction_id` instead (see §5).

---

## 3. Endpoint catalog

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/health` | No | Liveness |
| `GET` | `/v1/models` | Yes | Active model catalog |
| `GET` | `/v1/policies` | Yes | Policies + flag defaults |
| `POST` | `/v1/detect` | Yes | Submit media for detection |
| `GET` | `/v1/jobs/:id` | Yes | Poll job / fetch result |
| `POST` | `/v1/media/upload-url` | Yes | Presigned S3 **PUT** |
| `GET` / `POST` | `/v1/media/signed-url` | Yes | Presigned S3 **GET** |

No WebSocket / SSE. Progress is poll-only.

---

## 4. How media gets into detect

There are **three ingestion modes**. Pick one per request.

### A. Direct upload (multipart) — “test this file now”

Best for: file picker, drag-and-drop, ad-hoc tests.

```http
POST /v1/detect
Authorization: Bearer <API_KEY>
Content-Type: multipart/form-data
```

| Field | Required | Notes |
|-------|----------|-------|
| `file` | yes* | Binary media |
| `media_key` | yes* | Use instead of `file` if object already in S3 |
| `policy` | no | Default: `default_detect` |
| `detailed_analysis` | no | `"true"` / `"1"` / `"false"` (default true for video) |
| `frame_analysis` | no | `"true"` / `"1"`; **wins over** `detailed_analysis` |
| `models` | no | JSON array string *or* CSV; **bypasses policy** |
| `user_id` | no | Overrides API-key mapped owner |
| `transaction_id` | no | Must be UUID; becomes `job_id` (UI saved-row path) |

\* One media source required: `file` **or** `media_key`.

```bash
curl -sS -H "Authorization: Bearer $KEY" \
  -F "file=@photo.jpg" \
  -F "policy=default_detect" \
  "$API/v1/detect"
```

Max upload size: `MAX_UPLOAD_MB` (default **512 MB**).

---

### B. Saved file in S3 (`media_key`) — “run detect on stored media”

Best for: media already uploaded to the product bucket; re-running analysis; UI that separates upload from detect.

**Step 1 — get a presigned upload URL**

```http
POST /v1/media/upload-url
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

```json
{
  "filename": "clip.mp4",
  "content_type": "video/mp4",
  "prefix": "optional-key-prefix",
  "expires_sec": 900
}
```

Response:

```json
{
  "key": "<user_uuid>/<uuid>.mp4",
  "upload_url": "https://s3…presigned…",
  "method": "PUT",
  "content_type": "video/mp4",
  "expires_sec": 900,
  "bucket": "<bucket>"
}
```

- If `prefix` is omitted, Go uses the API-key’s `user_id`, else `platform-uploads`.
- Default expiry: **15 minutes**.

**Step 2 — PUT bytes directly to S3** (not to our API)

```bash
curl -X PUT \
  -H "Content-Type: video/mp4" \
  --data-binary @clip.mp4 \
  "$UPLOAD_URL"
```

Use the same `Content-Type` you passed when creating the upload URL.

**Step 3 — detect by key**

```json
POST /v1/detect
{
  "media_key": "<key from step 1>",
  "policy": "default_detect",
  "detailed_analysis": true,
  "transaction_id": "<optional UI transaction uuid>"
}
```

Or multipart with `media_key` and no `file`.

**Step 4 (optional) — display media later**

```http
GET /v1/media/signed-url?key=<media_key>&expires_sec=86400
```

or

```json
POST /v1/media/signed-url
{ "key": "<media_key>", "expires_sec": 86400 }
```

Response:

```json
{
  "key": "…",
  "signed_url": "https://…",
  "expires_sec": 86400,
  "bucket": "…"
}
```

Default download URL expiry: **24 hours**.

---

### C. Remote URL (`media_url`) — JSON only

```json
POST /v1/detect
{
  "media_url": "https://example.com/clip.mp4",
  "policy": "default_detect"
}
```

- Scheme must be `http` or `https`.
- Local filesystem paths are **disabled** unless the API is configured with `ALLOW_LOCAL_MEDIA_PATHS=true` (dev only).
- Do **not** send `media_path` — that field is internal to the worker JobSpec, not a public request field.

---

## 5. Direct test vs saved-file / UI transaction test

These are the two product flows the UI must support.

### Flow 1 — Direct test (no pre-created DB row)

| Step | What UI does |
|------|----------------|
| 1 | User picks a file (or pastes a URL) |
| 2 | `POST /v1/detect` **without** `transaction_id` |
| 3 | Go mints a new `job_id` (UUID) |
| 4 | Worker **INSERT**s a Transactions row (`auth = api_insert`) if `user_id` is available from the API key |
| 5 | Image → read envelope from `200` body; video → poll `/v1/jobs/{job_id}` and read `result` |

```bash
# Direct image test
curl -sS -H "Authorization: Bearer $KEY" \
  -F "file=@sample.jpg" \
  "$API/v1/detect"
# → 200 envelope (prediction, results, …)

# Direct video test
curl -sS -H "Authorization: Bearer $KEY" \
  -F "file=@sample.mp4" \
  -F "detailed_analysis=true" \
  "$API/v1/detect"
# → 202 { "job_id": "…", "status": "queued" }

curl -sS -H "Authorization: Bearer $KEY" \
  "$API/v1/jobs/<job_id>"
# → { "job_id", "status", "result": { envelope } }
```

### Flow 2 — Saved file / UI transaction (pre-created row)

| Step | What UI does |
|------|----------------|
| 1 | UI creates a `Transactions` row in Supabase (gets `id`) with product `method` (`direct` / `verification` / `demo`) |
| 2 | UI uploads media to S3 (presigned PUT) **or** sends multipart `file` |
| 3 | `POST /v1/detect` with `transaction_id=<Transactions.id>` |
| 4 | That UUID **is** the `job_id` |
| 5 | Worker **UPDATE**s the existing row: **omits `method`**; shallow-merges `input_request` as `{**existing, **base_input, auth: "ui_update"}` |
| 6 | Poll `/v1/jobs/{transaction_id}` for video; unwrap `result` |

**Persist rules (worker):**

| DB action | `method` | `input_request.auth` |
|-----------|----------|----------------------|
| **INSERT** (no `transaction_id`) | set `platform_detect` | `api_insert` |
| **UPDATE** (with `transaction_id`) | leave unchanged | merge; set `ui_update` |

```bash
curl -sS -H "Authorization: Bearer $KEY" \
  -F "file=@clip.mp4" \
  -F "transaction_id=11111111-1111-1111-1111-111111111111" \
  -F "detailed_analysis=true" \
  "$API/v1/detect"
```

```bash
# Same idea with already-uploaded S3 object
curl -sS -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "media_key": "<user_uuid>/<uuid>.mp4",
    "transaction_id": "11111111-1111-1111-1111-111111111111",
    "policy": "default_detect"
  }' \
  "$API/v1/detect"
```

| | Direct test | Saved / UI transaction |
|--|-------------|-------------------------|
| `transaction_id` | omit | required (= existing row id) |
| `job_id` | Go-generated UUID | = `transaction_id` |
| DB action | INSERT (`method=platform_detect`) | UPDATE (preserve UI `method`) |
| `input_request.auth` | `api_insert` | `ui_update` (merged onto existing fields) |
| Media | multipart / URL / key | usually S3 `media_key` (or multipart) |
| Typical UX | “Try a file” / raw API | Media-checker history, re-run, dashboard row |
| Shown on `/media-checker/case-list` | no | yes (`direct` / `verification`; not `demo`) |

`transaction_id` must be a valid UUID or detect returns `400`.

---

## 6. Sync vs async — how to get results

| Media type | Mode | Detect response | How to get the envelope |
|------------|------|-----------------|-------------------------|
| Image (`image/*`) | **sync** | `200` = full v3 envelope | Use response body as-is |
| Video / audio / other | **async** | `202` `{ job_id, status: "queued" }` | Poll `GET /v1/jobs/{job_id}` |

### Async `202` body (exact shape)

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

There is **no** `poll_url` field — build the poll URL yourself: `/v1/jobs/{job_id}`.

### Polling `GET /v1/jobs/{id}`

**In progress:**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "updated_at": "1722000000",
  "worker_id": "worker-1"
}
```

**Terminal (succeeded / partial / failed):**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "succeeded",
  "updated_at": "1722000000.0",
  "result": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "succeeded",
    "prediction": true,
    "version": "3.0.0",
    "policy": "default_detect",
    "sampling": { "…": "…" },
    "results": { "…": "…" },
    "errors": { "…": "…" }
  }
}
```

#### Recommended client helper

```ts
type JobPollResponse = {
  job_id: string;
  status: string;
  updated_at?: string | number;
  worker_id?: string;
  result?: DetectEnvelope; // present when terminal
};

function unwrapEnvelope(
  detectOrJobResponse: DetectEnvelope | JobPollResponse
): DetectEnvelope {
  if ("result" in detectOrJobResponse && detectOrJobResponse.result?.results) {
    return detectOrJobResponse.result;
  }
  return detectOrJobResponse as DetectEnvelope;
}
```

#### Polling guidance

- Interval: start ~1–1.5s, exponential backoff, cap ~10s.
- Terminal statuses: `succeeded`, `partial`, `failed`.
- Stop on terminal; show `errors` for `partial` / `failed`.
- Job records expire after `JOB_TTL_SECONDS` (default **24h**). After that, `404`.
- Sync image timeout: `504` with `{ job_id, status: "timeout", error }` (not `408`).

---

## 7. Result envelope (v3.0.0) — output format

This is the payload the UI should render. Version field: `"3.0.0"`.

```json
{
  "job_id": "uuid",
  "status": "succeeded",
  "prediction": true,
  "version": "3.0.0",
  "policy": "default_detect",
  "sampling": {
    "mode": "interval_0_5s",
    "detailed_analysis": true,
    "frame_analysis": false,
    "interval_seconds": 0.5
  },
  "results": {
    "image": { "count": 0, "models_results": [] },
    "video": { "count": 1, "models_results": [ /* … */ ] },
    "audio": { "count": 0, "models_results": [] }
  },
  "errors": {
    "models_without_results": [],
    "message": null,
    "policy_notes": ["video + human face → AIGV + DFA (aigv, dfa_v3)"]
  }
}
```

### Top-level fields

| Field | Type | Meaning for UI |
|-------|------|----------------|
| `job_id` | string (UUID) | Correlate with poll / Transactions.id |
| `status` | string | `succeeded` \| `partial` \| `failed` |
| `prediction` | **boolean** | **`true` = FAKE**, **`false` = REAL**. True only if **all** voting models agree fake |
| `version` | string | Envelope schema version |
| `policy` | string \| null | Policy name, or effectively `"explicit"` path when `models[]` bypass used |
| `sampling` | object \| null | How video frames were sampled |
| `results` | object | Per-modality model outputs |
| `errors` | object | Missing models, failure message, policy routing notes |

### Sampling modes

| `sampling.mode` | Meaning |
|-----------------|---------|
| `single_frame` | Images (or non-video) |
| `interval_0_5s` | Video predictions on a **0.5s** grid (`detailed_analysis`, default) |
| `every_frame` | Video every frame (`frame_analysis=true`) |

### How to read `prediction`

1. Prefer top-level `prediction` for the hero REAL / FAKE badge.
2. For detail views, walk `results.{image|video|audio}.models_results[]`.
3. For AIGI/AIGV, each model object includes `is_fake` (authoritative for that model).
4. For DFA, compare `result` to `threshold` (`result > threshold` ⇒ fake vote).
5. Overall `prediction` is **AND** across voting models — one REAL model → overall REAL.

### Status semantics

| Status | UI treatment |
|--------|--------------|
| `succeeded` | Show full results |
| `partial` | Show available models; warn using `errors.models_without_results` |
| `failed` | Error state; show `errors.message` |

`errors.policy_notes` is useful debug/copy (e.g. why AIGV+DFA ran).

---

## 8. Per-model result shapes

Active catalog today: **`aigi`** (image), **`aigv`** (video), **`dfa_v3`** (video faces). Confirm live with `GET /v1/models`.

### AIGI — image (`results.image.models_results[]`)

```json
{
  "model_name": "aigi",
  "threshold": 0.5,
  "result": 0.82,
  "is_fake": true,
  "fusion_rule": "single_fake",
  "winning_generator": "flux",
  "n_fake_generators": 1,
  "generators": [
    { "generator": "flux", "score": 0.82, "threshold": 0.5, "is_fake": true }
  ],
  "n_patches": 16,
  "per_generator_mean_fake": { "flux": 0.82 }
}
```

UI tips:
- Badge from `is_fake`.
- Optional generator breakdown from `generators[]` / `winning_generator`.

### AIGV — video (`results.video.models_results[]`)

```json
{
  "model_name": "aigv",
  "threshold": 0.5,
  "result": 0.71,
  "is_fake": true,
  "labels_result": [
    {
      "prediction": 0.71,
      "is_fake": true,
      "threshold": 0.5,
      "fusion_rule": "multi_fake_max",
      "winning_generator": "…",
      "n_fake_generators": 2,
      "generators": [
        { "generator": "…", "score": 0.71, "threshold": 0.5, "is_fake": true }
      ],
      "start_index": 0,
      "end_index": 15
    }
  ],
  "duration": 8.0,
  "video_fps": 30.0
}
```

UI tips:
- Clip-level: `is_fake` / `result`.
- Timeline: map each `labels_result[]` entry using `start_index` / `end_index` and `video_fps` → seconds = `index / video_fps`.

### DFA (`dfa_v3`) — face tracks (`results.video.models_results[]`)

```json
{
  "model_name": "dfa_v3",
  "threshold": 0.6,
  "result": 0.75,
  "labels_result": {
    "0": [
      {
        "prediction": 0.75,
        "bbox": [x, y, w, h],
        "start_index": 10,
        "end_index": 11
      }
    ]
  },
  "duration": 8.0,
  "video_fps": 30.0,
  "label_faces": {}
}
```

UI tips:
- `labels_result` is an **object keyed by face-track id** → array of timed predictions (not a flat array like AIGV).
- Overlay `bbox` on video frames; time via `start_index` / `end_index` + `video_fps`.
- Clip-level fake if `result > threshold` (no `is_fake` field on DFA).

---

## 9. Default policy routing (what models run)

Unless the client sends explicit `models[]`:

| Input | Models run |
|-------|------------|
| Image | `aigi` |
| Video, no human face | `aigv` |
| Video, human face | `aigv` + `dfa_v3` |

Face detection runs as a prelude before policy selection. If face presence is unknown, policy defaults to the **face-present** path (AIGV+DFA) for safety — see `errors.policy_notes`.

### Analysis flags (video)

| Flag | Default | Effect |
|------|---------|--------|
| `detailed_analysis` | `true` | 0.5s prediction grid |
| `frame_analysis` | `false` | Every frame; **overrides** detailed |

### Explicit models (policy bypass)

```json
{ "media_key": "…", "models": ["aigv", "dfa_v3"] }
```

Use for debug / forced pipelines. Normal product UI should send `policy: "default_detect"` (or omit) and flags only.

---

## 10. Catalog endpoints

### `GET /v1/models`

```json
{
  "models": [
    {
      "name": "dfa_v3",
      "threshold": 0.6,
      "type": "video",
      "steps": ["cut_duration", "get_video_fps", "faces_classification", "prepare_dfa_frames", "get_dfa_v3_results"],
      "result_keys": ["model_name", "threshold", "result", "labels_result", "duration", "video_fps", "label_faces"]
    }
  ],
  "count": 3
}
```

### `GET /v1/policies`

```json
{
  "default_policy": "default_detect",
  "flag_defaults": {
    "detailed_analysis": true,
    "frame_analysis": false
  },
  "policies": [
    {
      "name": "default_detect",
      "description": "Image → AIGI … Video with face → AIGV + DFA …"
    }
  ]
}
```

Use these to drive settings UI defaults rather than hard-coding.

---

## 11. End-to-end UI checklists

### Image detect (direct)

1. `POST /v1/detect` multipart `file=@image.jpg`
2. Expect `200`
3. Render `prediction`, `results.image.models_results[0]` (aigi)

### Video detect (direct upload)

1. `POST /v1/detect` multipart `file=@video.mp4`, `detailed_analysis=true`
2. Expect `202` → save `job_id`
3. Poll `GET /v1/jobs/{job_id}` until `succeeded|partial|failed`
4. `envelope = response.result`
5. Render `prediction`; timeline from AIGV `labels_result`; face overlays from DFA if present

### Video detect (saved S3 + UI transaction)

1. Create Transactions row → `transaction_id`
2. `POST /v1/media/upload-url` → PUT file → keep `key`
3. `POST /v1/detect` JSON `{ media_key, transaction_id, policy }`
4. Poll `/v1/jobs/{transaction_id}`
5. Unwrap `result`; optionally refresh signed URL for playback

---

## 12. Errors

Most errors:

```json
{ "error": "human-readable string" }
```

| Status | Typical cause |
|--------|----------------|
| `400` | Missing media, bad JSON, invalid `transaction_id`, file too large |
| `401` | Auth |
| `404` | Unknown `job_id` / expired job |
| `429` | `{ "error": "queue saturated", "queue_depth": N, "max_depth": M }` |
| `500` | Enqueue / internal |
| `503` | Queue / auth / S3 not configured |
| `504` | Sync image wait timeout `{ job_id, status: "timeout", error }` |

Envelope-level (inside completed jobs):

```json
{
  "errors": {
    "models_without_results": ["dfa_v3"],
    "message": "pipeline execution failed (see worker logs)",
    "policy_notes": ["…"]
  }
}
```

---

## 13. TypeScript shapes (suggested)

```ts
type DetectEnvelope = {
  job_id: string;
  status: "succeeded" | "partial" | "failed" | string;
  prediction: boolean; // true = FAKE
  version: string;
  policy: string | null;
  sampling: {
    mode: "single_frame" | "interval_0_5s" | "every_frame" | string;
    detailed_analysis: boolean;
    frame_analysis: boolean;
    interval_seconds: number | null;
  } | null;
  results: {
    image: ModalityBucket;
    video: ModalityBucket;
    audio: ModalityBucket;
  };
  errors: {
    models_without_results: string[];
    message: string | null;
    policy_notes: string[];
  };
};

type ModalityBucket = {
  count: number;
  models_results: Record<string, unknown>[];
};

type AsyncAccept = {
  job_id: string;
  status: "queued";
};

type JobStatusResponse = {
  job_id: string;
  status: "queued" | "running" | "succeeded" | "partial" | "failed" | string;
  updated_at?: string | number;
  worker_id?: string;
  result?: DetectEnvelope;
};
```

---

## 14. Pseudocode — one client for both paths

```ts
async function runDetect(opts: {
  apiBase: string;
  apiKey: string;
  // Direct file OR saved key OR URL
  file?: File;
  mediaKey?: string;
  mediaUrl?: string;
  transactionId?: string; // UI saved-row path
  policy?: string;
  detailedAnalysis?: boolean;
  frameAnalysis?: boolean;
}): Promise<DetectEnvelope> {
  const headers = { Authorization: `Bearer ${opts.apiKey}` };

  let res: Response;
  if (opts.file) {
    const fd = new FormData();
    fd.append("file", opts.file);
    if (opts.policy) fd.append("policy", opts.policy);
    if (opts.transactionId) fd.append("transaction_id", opts.transactionId);
    if (opts.detailedAnalysis != null)
      fd.append("detailed_analysis", String(opts.detailedAnalysis));
    if (opts.frameAnalysis != null)
      fd.append("frame_analysis", String(opts.frameAnalysis));
    res = await fetch(`${opts.apiBase}/v1/detect`, { method: "POST", headers, body: fd });
  } else {
    res = await fetch(`${opts.apiBase}/v1/detect`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        media_key: opts.mediaKey,
        media_url: opts.mediaUrl,
        policy: opts.policy ?? "default_detect",
        transaction_id: opts.transactionId,
        detailed_analysis: opts.detailedAnalysis,
        frame_analysis: opts.frameAnalysis,
      }),
    });
  }

  if (res.status === 200) {
    return (await res.json()) as DetectEnvelope; // sync image
  }
  if (res.status !== 202) {
    throw new Error(JSON.stringify(await res.json()));
  }

  const { job_id } = (await res.json()) as AsyncAccept;
  // poll…
  for (;;) {
    const job = await fetch(`${opts.apiBase}/v1/jobs/${job_id}`, { headers }).then((r) =>
      r.json()
    );
    if (["succeeded", "partial", "failed"].includes(job.status)) {
      return job.result as DetectEnvelope;
    }
    await sleep(1500);
  }
}
```

---

## 15. Reference client

CLI that already does multipart submit + poll + unwrap `result`:

`python/scripts/detect_cli.py`

Useful as a behavior oracle while building the UI.

---

## 16. Doc corrections vs older snippets

If you see older internal docs that disagree with this guide, **prefer this guide / the Go handlers**:

| Older / wrong | Correct |
|---------------|---------|
| `202` includes `poll_url` | Only `job_id` + `status` |
| Sync timeout `408` | **`504`** |
| Jobs terminal body = flat envelope | Envelope under **`result`** |
| JSON accepts `media_path` | Only **`media_url`** / **`media_key`** |
)
