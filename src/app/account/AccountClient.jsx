"use client";

import { useState, useTransition } from "react";
import { revokeApiKey, createApiKey } from "./actions";
import { formatDateTime } from "@/utils/format_date";
import { KeyRound, Trash2, Loader2, Copy, Check } from "lucide-react";

export default function AccountClient({ initialKeys }) {
  const [keys, setKeys] = useState(initialKeys || []);
  const [name, setName] = useState("");
  const [message, setMessage] = useState(null);
  const [plaintext, setPlaintext] = useState(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const onCreate = (e) => {
    e.preventDefault();
    setMessage(null);
    setPlaintext(null);
    startTransition(async () => {
      const res = await createApiKey(name.trim() || "default");
      if (!res.ok) {
        setMessage({ type: "info", text: res.error });
        return;
      }
      setPlaintext(res.key);
      setName("");
      setKeys((prev) => [res.record, ...prev]);
      setMessage({ type: "ok", text: "Key created. Copy it now — it won’t be shown again." });
    });
  };

  const onRevoke = (id) => {
    if (!confirm("Revoke this API key? It will stop working immediately.")) return;
    startTransition(async () => {
      try {
        await revokeApiKey(id);
        setKeys((prev) =>
          prev.map((k) =>
            k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k
          )
        );
      } catch (err) {
        setMessage({ type: "error", text: err.message });
      }
    });
  };

  const copyKey = async () => {
    if (!plaintext) return;
    await navigator.clipboard.writeText(plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-8 pb-20 max-w-3xl space-y-10">
      <form onSubmit={onCreate} className="bg-white border border-slate-200 rounded-3xl shadow-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-medium">
          <KeyRound className="size-5 text-primary" strokeWidth={1.75} />
          Create API key
        </div>
        <p className="text-sm text-slate-500">
          Keys authenticate requests to <code className="text-slate-700">api.contrails.ai</code>.
          The full secret is shown only once after creation — copy it somewhere safe.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Key name (e.g. production)"
            className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2.5 rounded-full bg-primary text-white text-sm font-medium disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-4 animate-spin inline" /> : "Create key"}
          </button>
        </div>
        {message && (
          <div
            className={`text-sm rounded-2xl px-4 py-3 border ${
              message.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : message.type === "ok"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            {message.text}
          </div>
        )}
        {plaintext && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3">
            <code className="flex-1 text-sm break-all text-slate-900">{plaintext}</code>
            <button
              type="button"
              onClick={copyKey}
              className="shrink-0 p-2 rounded-full hover:bg-white border border-transparent hover:border-slate-200"
            >
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            </button>
          </div>
        )}
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Your keys</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-card">
            No API keys yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {keys.map((k) => {
              const revoked = !!k.revoked_at;
              return (
                <li
                  key={k.id}
                  className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {k.name || "Untitled"}
                      {revoked && (
                        <span className="ml-2 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          revoked
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      {k.key_prefix || k.searchable_key || "••••"}…
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Created {formatDateTime(k.created_at)}
                      {" · "}Last used {formatDateTime(k.last_used)}
                    </p>
                  </div>
                  {!revoked && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onRevoke(k.id)}
                      className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                      Revoke
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
