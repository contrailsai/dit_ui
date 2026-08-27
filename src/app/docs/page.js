import AppShell from "@/components/AppShell";
import Link from "next/link";

export const metadata = {
  title: "DIT | API Docs",
  description: "Contrails Deepfake Platform API documentation",
};

const BASE = "https://api.contrails.ai";

function Code({ children }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-slate-900 text-slate-100 text-sm p-4 leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-8 space-y-3">
      <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h2>
      <div className="text-slate-600 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <AppShell
      requireVerifier
      title="API Documentation"
      description="Detect deepfakes via HTTP — images sync, video async with job polling"
    >
      <div className="px-8 pb-20 max-w-3xl space-y-12">
        <nav className="flex flex-wrap gap-2 text-xs">
          {[
            ["auth", "Auth"],
            ["detect", "Detect"],
            ["jobs", "Jobs"],
            ["media", "Media"],
            ["envelope", "Envelope"],
            ["errors", "Errors"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary"
            >
              {label}
            </a>
          ))}
        </nav>

        <p className="text-sm text-slate-600">
          Base URL: <code className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{BASE}</code>
          . Create a key on the{" "}
          <Link href="/account" className="text-primary hover:underline">
            API Keys
          </Link>{" "}
          page, then send it as a Bearer token on every <code>/v1/*</code> request.
        </p>

        <Section id="auth" title="Authentication">
          <p>All <code>/v1/*</code> routes require:</p>
          <Code>{`Authorization: Bearer <YOUR_API_KEY>`}</Code>
          <p>
            <code>GET /health</code> is public. Invalid keys return <code>401</code>.
          </p>
        </Section>

        <Section id="detect" title="POST /v1/detect">
          <p>
            Submit media for detection. Images return <strong>200</strong> with the full
            result envelope. Video returns <strong>202</strong> with a <code>job_id</code> —
            poll until terminal.
          </p>
          <p>Multipart (file upload):</p>
          <Code>{`curl -sS -H "Authorization: Bearer $KEY" \\
  -F "file=@photo.jpg" \\
  -F "policy=default_detect" \\
  "${BASE}/v1/detect"`}</Code>
          <p>JSON with an existing S3 object:</p>
          <Code>{`curl -sS -H "Authorization: Bearer $KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "media_key": "<user_uuid>/<uuid>.mp4",
    "policy": "default_detect",
    "detailed_analysis": true
  }' \\
  "${BASE}/v1/detect"`}</Code>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <code>detailed_analysis</code> (default true) → ~0.5s video prediction grid
            </li>
            <li>
              <code>frame_analysis</code> → every frame (overrides detailed)
            </li>
            <li>
              <code>transaction_id</code> → optional UUID; becomes job id and updates an
              existing Transactions row
            </li>
          </ul>
        </Section>

        <Section id="jobs" title="GET /v1/jobs/:id">
          <p>Poll async jobs. Terminal statuses: <code>succeeded</code>, <code>partial</code>, <code>failed</code>.</p>
          <Code>{`curl -sS -H "Authorization: Bearer $KEY" \\
  "${BASE}/v1/jobs/<job_id>"`}</Code>
          <p>
            When complete, the detection envelope is under <code>response.result</code> (not
            the top level). Start polling ~1.5s apart with backoff; jobs expire after ~24h.
          </p>
        </Section>

        <Section id="media" title="Media upload URLs">
          <p>
            <code>POST /v1/media/upload-url</code> → presigned S3 PUT. Then call detect with{" "}
            <code>media_key</code>.
          </p>
          <Code>{`curl -sS -H "Authorization: Bearer $KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"filename":"clip.mp4","content_type":"video/mp4"}' \\
  "${BASE}/v1/media/upload-url"`}</Code>
          <p>
            Download later via <code>GET /v1/media/signed-url?key=…</code>.
          </p>
        </Section>

        <Section id="envelope" title="Result envelope (v3)">
          <p>
            <code>prediction: true</code> means <strong>FAKE</strong>; <code>false</code> means{" "}
            <strong>REAL</strong> (all voting models must agree fake).
          </p>
          <Code>{`{
  "job_id": "uuid",
  "status": "succeeded",
  "prediction": true,
  "version": "3.0.0",
  "policy": "default_detect",
  "results": {
    "image": { "count": 1, "models_results": [/* aigi */] },
    "video": { "count": 0, "models_results": [] },
    "audio": { "count": 0, "models_results": [] }
  },
  "errors": { "models_without_results": [], "message": null, "policy_notes": [] }
}`}</Code>
          <p>Default policy: image → <code>aigi</code>; video → <code>aigv</code> (+ <code>dfa_v3</code> if faces).</p>
        </Section>

        <Section id="errors" title="Errors">
          <ul className="list-disc pl-5 space-y-1">
            <li><code>400</code> — bad request / missing media</li>
            <li><code>401</code> — auth</li>
            <li><code>404</code> — unknown or expired job</li>
            <li><code>429</code> — queue saturated</li>
            <li><code>504</code> — sync image timeout</li>
          </ul>
          <p>
            Try the interactive flow on{" "}
            <Link href="/demo" className="text-primary hover:underline">
              Demo
            </Link>
            .
          </p>
        </Section>
      </div>
    </AppShell>
  );
}
