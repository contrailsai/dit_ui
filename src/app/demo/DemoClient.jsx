"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, FileImage, UploadCloud, Loader2, Trash2 } from "lucide-react";
import ResultV3 from "@/components/results-v3/ResultV3";

const humanFileSize = (bytes, si = true, dp = 2) => {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) return bytes + " B";
  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
  return bytes.toFixed(dp) + " " + units[u];
};

export default function DemoClient() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [tempUrl, setTempUrl] = useState(null);
  const [uploadType, setUploadType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const acceptMedia = (newfile) => {
    if (!newfile) return;
    const kind = newfile.type?.split("/")[0];
    if (kind !== "image" && kind !== "video") {
      setError("Please choose an image or video file.");
      return;
    }
    const maxSize = 512 * 1024 * 1024;
    if (newfile.size > maxSize) {
      setError("File is too large (max 512MB).");
      return;
    }
    setError(null);
    setUploadType(kind);
    setFile(newfile);
    setTempUrl(URL.createObjectURL(newfile));
  };

  const clearFile = () => {
    setFile(null);
    setTempUrl(null);
    setUploadType("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runDemo = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Select a file first.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const analysis_types =
        uploadType === "image"
          ? { frameCheck: false, audioAnalysis: false, aigcCheck: true }
          : { frameCheck: true, audioAnalysis: false, aigcCheck: false };

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_request: { upload_type: uploadType, analysis_types },
          file_metadata: {
            name: file.name,
            size: humanFileSize(file.size),
            type: file.type,
          },
          method: "demo",
        }),
      });
      if (!res.ok) throw new Error("Failed to create upload");

      const { id, signedUrl, media_key } = await res.json();

      const s3 = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!s3.ok) throw new Error("Failed to upload to storage");

      const detectRes = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: id,
          media_key,
          detailed_analysis: true,
        }),
      });
      const detectBody = await detectRes.json().catch(() => ({}));
      if (!detectRes.ok) {
        throw new Error(detectBody.error || "Detection failed");
      }

      setResult({
        id,
        envelope: detectBody.envelope,
        fileUrl: tempUrl,
        file_metadata: {
          name: file.name,
          size: humanFileSize(file.size),
          type: file.type,
        },
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (result?.envelope) {
    return (
      <ResultV3
        envelope={result.envelope}
        fileUrl={result.fileUrl}
        file_metadata={result.file_metadata}
        handle_newCheck={() => {
          setResult(null);
          clearFile();
        }}
        newCheckHref="/demo"
      />
    );
  }

  return (
    <div className="px-8 pb-16 max-w-3xl">
      <form onSubmit={runDemo} className="mt-6 space-y-6">
        <div
          className="border-2 border-dashed border-slate-200 rounded-3xl bg-white p-10 text-center hover:border-primary/40 transition-colors cursor-pointer shadow-card"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            acceptMedia(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => acceptMedia(e.target.files?.[0])}
          />
          {!file ? (
            <>
              <UploadCloud className="size-10 text-primary mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-slate-800 font-medium">Drop an image or video</p>
              <p className="text-sm text-slate-500 mt-1">or click to browse</p>
            </>
          ) : (
            <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
              {uploadType === "image" && tempUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tempUrl} alt="preview" className="max-h-56 mx-auto rounded-xl object-contain" />
              )}
              {uploadType === "video" && tempUrl && (
                <video src={tempUrl} controls className="max-h-56 mx-auto rounded-xl" />
              )}
              <div className="flex items-center justify-center gap-3 text-sm text-slate-600">
                {uploadType === "image" ? (
                  <FileImage className="size-4" />
                ) : (
                  <Clapperboard className="size-4" />
                )}
                <span className="truncate max-w-xs">{file.name}</span>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full sm:w-auto px-8 py-3 rounded-full bg-primary text-white font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Analyzing…
            </>
          ) : (
            "Run detection"
          )}
        </button>

        {result?.id && (
          <button
            type="button"
            className="block text-sm text-primary underline-offset-2 hover:underline"
            onClick={() => router.push(`/view/${result.id}`)}
          >
            Open in case view
          </button>
        )}
      </form>
    </div>
  );
}
