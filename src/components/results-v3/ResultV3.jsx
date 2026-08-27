"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { PlusCircle, AlertTriangle, ChevronDown } from "lucide-react";
import { normalizeScore, DISPLAY_THRESHOLD } from "@/lib/deepfake-api/normalize";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Filler,
  Tooltip,
  Legend
);

const FAKE_BAR = "rgba(239, 68, 68, 0.25)";
const REAL_BAR = "rgba(34, 197, 94, 0.25)";
const FAKE_FILL = "rgba(239, 68, 68, 0.3)";
const REAL_FILL = "rgba(34, 197, 94, 0.3)";

function isFakePrediction(prediction) {
  return prediction === true;
}

/** Per-model fake vote (AIGI/AIGV use is_fake; DFA compares result to threshold). */
function modelVotesFake(m) {
  if (!m) return false;
  if (typeof m.is_fake === "boolean") return m.is_fake;
  const name = m.model_name || "";
  if (name === "dfa_v3" || name.startsWith("dfa")) {
    return (m.result ?? 0) > (m.threshold ?? 0.6);
  }
  return false;
}

/**
 * Hero verdict: Fake if the API says so OR any voting model flags fake.
 * API `prediction` is AND across models; showing Real while AIGV is Fake
 * reads as a false negative in the UI.
 */
function deriveHeroPrediction(envelope) {
  if (isFakePrediction(envelope?.prediction)) return true;
  const buckets = [
    envelope?.results?.image,
    envelope?.results?.video,
    envelope?.results?.audio,
  ];
  for (const bucket of buckets) {
    for (const m of bucket?.models_results || []) {
      if (modelVotesFake(m)) return true;
    }
  }
  return false;
}

function modelsDisagree(envelope) {
  const votes = [];
  for (const bucket of [
    envelope?.results?.image,
    envelope?.results?.video,
    envelope?.results?.audio,
  ]) {
    for (const m of bucket?.models_results || []) {
      if (m) votes.push(modelVotesFake(m));
    }
  }
  if (votes.length < 2) return false;
  return votes.some(Boolean) && !votes.every(Boolean);
}

function findModel(modelsResults, name) {
  if (!Array.isArray(modelsResults)) return null;
  return modelsResults.find((m) => m?.model_name === name) || modelsResults[0] || null;
}

function VerdictPill({ fake, size = "md" }) {
  const base =
    size === "lg"
      ? "text-lg px-5 py-1.5"
      : size === "sm"
        ? "text-xs px-2.5 py-0.5"
        : "text-sm px-3 py-1";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${base} ${
        fake ? "bg-red-200 text-red-700" : "bg-green-200 text-green-700"
      }`}
    >
      {fake ? "Fake" : "Real"}
    </span>
  );
}

/**
 * Score progress bar with threshold fixed at 50% after normalizeScore.
 * Accepts raw score + raw threshold; fill is green (real) / red (fake).
 */
function ScoreBar({ score, threshold = 0.5, isFake, label, showLabels = true }) {
  const normalized = normalizeScore(score, threshold);
  const pct = normalized * 100;
  const thrPct = DISPLAY_THRESHOLD * 100;
  const fake =
    typeof isFake === "boolean" ? isFake : normalized > DISPLAY_THRESHOLD;
  const fillClass = fake ? "bg-red-400" : "bg-green-400";

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-700 font-medium truncate">{label}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`tabular-nums font-semibold px-2.5 py-0.5 rounded-full text-xs ${
                fake ? "bg-red-200 text-red-700" : "bg-green-200 text-green-700"
              }`}
            >
              {pct.toFixed(1)}%
            </span>
            <VerdictPill fake={fake} size="sm" />
          </div>
        </div>
      )}
      <div className="relative h-3 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
        {/* Threshold marker — always at 50% after normalization */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-800/70 z-10"
          style={{ left: `calc(${thrPct}% - 1px)` }}
          title="Decision threshold (50%)"
        />
        <div
          className="absolute -top-0.5 h-4 w-0.5 bg-slate-800 z-10"
          style={{ left: `calc(${thrPct}% - 1px)` }}
        />
      </div>
      {showLabels && (
        <div className="relative h-4 text-[10px] text-slate-400 tabular-nums">
          <span className="absolute left-0">0</span>
          <span
            className="absolute -translate-x-1/2 text-slate-500 font-medium"
            style={{ left: `${thrPct}%` }}
          >
            50
          </span>
          <span className="absolute right-0">100</span>
        </div>
      )}
    </div>
  );
}

function buildAigvTimeline(aigv, threshold = 0.5) {
  if (!aigv?.labels_result || !Array.isArray(aigv.labels_result)) return [];
  const fps = Number(aigv.video_fps) || 30;
  const thr = aigv.threshold ?? threshold;
  return aigv.labels_result.map((seg, i) => {
    const start = (Number(seg.start_index) || 0) / fps;
    const end = (Number(seg.end_index) || seg.start_index || 0) / fps;
    const mid = (start + end) / 2;
    const score =
      typeof seg.prediction === "number" ? seg.prediction : Number(seg.prediction) || 0;
    const displayScore = normalizeScore(score, thr);
    const is_fake =
      typeof seg.is_fake === "boolean" ? seg.is_fake : displayScore > DISPLAY_THRESHOLD;
    return {
      index: i,
      start,
      end,
      mid,
      score,
      displayScore,
      is_fake,
      winning_generator: seg.winning_generator,
    };
  });
}

/**
 * Flatten dfa_v3.labels_result (object keyed by face-track id) into timed segments.
 * Each prediction holds until the next prediction on the same track (or video end).
 * bbox is [x, y, w, h]; fake if prediction > threshold.
 */
function buildDfaSegments(dfa) {
  if (!dfa?.labels_result || typeof dfa.labels_result !== "object") {
    return { tracks: [], segments: [], trackIds: [], chartPoints: [] };
  }
  const fps = Number(dfa.video_fps) || 30;
  const thr = Number(dfa.threshold ?? 0.6);
  const duration =
    Number.isFinite(Number(dfa.duration)) && Number(dfa.duration) > 0
      ? Number(dfa.duration)
      : null;
  const trackIds = Object.keys(dfa.labels_result);
  const tracks = [];
  const segments = [];

  trackIds.forEach((trackId, trackIndex) => {
    const rows = dfa.labels_result[trackId];
    if (!Array.isArray(rows)) return;
    const points = rows.map((seg, i) => {
      const start = (Number(seg.start_index) || 0) / fps;
      const frameEnd = (Number(seg.end_index) || seg.start_index || 0) / fps;
      const score =
        typeof seg.prediction === "number" ? seg.prediction : Number(seg.prediction) || 0;
      const displayScore = normalizeScore(score, thr);
      const is_fake = score > thr;
      return {
        trackId,
        trackIndex,
        index: i,
        start,
        end: frameEnd,
        mid: (start + frameEnd) / 2,
        score,
        displayScore,
        is_fake,
        bbox: Array.isArray(seg.bbox) ? seg.bbox : null,
      };
    });

    // Hold each prediction until the next one (or video end)
    points.forEach((p, i) => {
      if (i < points.length - 1) {
        p.end = Math.max(p.end, points[i + 1].start);
      } else if (duration != null) {
        p.end = Math.max(p.end, duration);
      } else {
        p.end = Math.max(p.end, p.start + 0.5);
      }
      p.mid = (p.start + p.end) / 2;
      segments.push(p);
    });

    tracks.push({ trackId, trackIndex, points });
  });

  segments.sort((a, b) => a.start - b.start || a.mid - b.mid);

  // Single bar series for the shared AIGV-style chart: at each unique start,
  // take the highest (most fake-leaning) display score across tracks.
  const byStart = new Map();
  segments.forEach((p) => {
    const key = Number(p.start.toFixed(3));
    const prev = byStart.get(key);
    if (!prev || p.displayScore > prev.displayScore) {
      byStart.set(key, { ...p, index: byStart.size });
    }
  });
  const chartPoints = Array.from(byStart.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, p], i) => ({ ...p, index: i }));

  return { tracks, segments, trackIds, chartPoints, threshold: thr, fps };
}

function activeDfaBoxesAt(segments, currentTime) {
  if (!segments?.length) return [];
  return segments.filter(
    (s) => s.bbox && currentTime >= s.start && currentTime < s.end
  );
}

function AnalysisCard({
  title,
  fake,
  score,
  threshold,
  open,
  onToggle,
  children,
  headerRight,
}) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-colors ${
        fake
          ? "border-red-100 bg-red-50/40"
          : "border-green-100 bg-green-50/40"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full text-left px-4 py-4 space-y-3 hover:bg-white/40 transition-colors"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <ChevronDown
              className={`size-4 shrink-0 text-slate-400 transition-transform duration-300 ease-out ${
                open ? "rotate-0" : "-rotate-90"
              }`}
              strokeWidth={2}
            />
            <p className="text-sm font-medium text-slate-800">{title}</p>
            <VerdictPill fake={!!fake} size="sm" />
          </div>
          {headerRight}
        </div>
        <ScoreBar score={score} threshold={threshold} isFake={!!fake} showLabels />
      </button>
      {children != null && (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`px-4 pb-4 space-y-4 border-t border-black/5 pt-4 transition-opacity duration-300 ease-in-out ${
                open ? "opacity-100" : "opacity-0"
              }`}
            >
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VerdictHero({
  prediction,
  status,
  animate,
  mediaLabel = "media",
  disagree = false,
}) {
  const fake = isFakePrediction(prediction);
  return (
    <div
      className={`transition-all duration-700 ease-out ${
        animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">
            Detection verdict
          </p>
          <div className="flex flex-wrap items-center gap-3 text-2xl">
            <VerdictPill fake={fake} size="lg" />
            <span className="text-slate-600 font-medium">
              {fake ? "Manipulation detected" : "No manipulation detected"}
              <span className="text-slate-400 font-normal"> in {mediaLabel}</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm max-w-lg">
            {fake
              ? disagree
                ? "At least one model flagged AI-generated or manipulated content."
                : "Models agree this media shows AI-generated or manipulated content."
              : "No models flagged this media as fake."}
          </p>
        </div>
        {status && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              status === "succeeded"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : status === "partial"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {status}
          </span>
        )}
      </div>
    </div>
  );
}

function ImagePanel({ envelope }) {
  const imageBucket = envelope?.results?.image;
  const model = findModel(imageBucket?.models_results, "aigi");
  if (!model) {
    return (
      <p className="text-slate-500 text-sm">No image model results in this envelope.</p>
    );
  }

  const generators = Array.isArray(model.generators) ? model.generators : [];
  const modelFake =
    typeof model.is_fake === "boolean"
      ? model.is_fake
      : Number(model.result) > Number(model.threshold ?? 0.5);
  const modelThreshold = model.threshold ?? 0.5;
  const scorePct = (normalizeScore(model.result, modelThreshold) * 100).toFixed(1);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Model</p>
          <p className="text-lg font-medium text-slate-800">{model.model_name || "aigi"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">Result</p>
          <VerdictPill fake={modelFake} />
        </div>
      </div>

      <div
        className={`rounded-2xl border px-4 py-4 space-y-3 ${
          modelFake
            ? "border-red-100 bg-red-50/40 shadow-sm shadow-red-100"
            : "border-green-100 bg-green-50/40 shadow-sm shadow-green-100"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600">Confidence score</span>
          <span
            className={`text-sm font-semibold px-3 py-1 rounded-full ${
              modelFake ? "bg-red-200 text-red-700" : "bg-green-200 text-green-700"
            }`}
          >
            {scorePct}%
          </span>
        </div>
        <ScoreBar
          score={model.result}
          threshold={modelThreshold}
          isFake={modelFake}
          showLabels
        />
      </div>

      {model.winning_generator && (
        <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Likely source</p>
          <p className="text-base font-medium text-slate-800 capitalize">
            {model.winning_generator}
          </p>
        </div>
      )}

      {generators.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-4">Generator breakdown</p>
          <ul className="space-y-4">
            {generators.map((g) => {
              const gThr = g.threshold ?? modelThreshold;
              const gFake =
                typeof g.is_fake === "boolean"
                  ? g.is_fake
                  : Number(g.score) > Number(gThr);
              return (
                <li key={g.generator}>
                  <ScoreBar
                    label={g.generator}
                    score={g.score}
                    threshold={gThr}
                    isFake={gFake}
                    showLabels={false}
                  />
                </li>
              );
            })}
          </ul>
          <p className="text-[11px] text-slate-400 mt-3">
            Scores scaled so the decision threshold sits at 50% · red above (fake), green below (real)
          </p>
        </div>
      )}
    </div>
  );
}

function VideoTimeline({
  points,
  currentTime,
  onSeek,
  durationSec,
  xTitle = "Time (0.5s grid)",
  caption = "Scores scaled so threshold sits at 50% · red above (fake), green below (real) · click to seek · sampling ~0.5s",
  stripPoints,
  showTrendLine = true,
}) {
  const strip = stripPoints?.length ? stripPoints : points;

  const duration = useMemo(() => {
    if (Number.isFinite(durationSec) && durationSec > 0) return durationSec;
    const pool = strip.length ? strip : points;
    if (!pool.length) return 1;
    return Math.max(...pool.map((p) => p.end), pool[pool.length - 1].mid, 1);
  }, [points, strip, durationSec]);

  const chartData = useMemo(() => {
    const barDataset = {
      label: "Score",
      data: points.map((p) => p.displayScore),
      backgroundColor: points.map((p) =>
        p.displayScore >= DISPLAY_THRESHOLD ? FAKE_BAR : REAL_BAR
      ),
      categoryPercentage: 1,
      barPercentage: 1,
      borderRadius: 2,
      borderSkipped: false,
      inflateAmount: 0,
      base: DISPLAY_THRESHOLD,
    };

    const datasets = [barDataset];
    if (showTrendLine) {
      datasets.push({
        type: "line",
        label: "Trend",
        data: points.map((p) => p.displayScore),
        borderColor: "rgba(15, 23, 42, 0.35)",
        borderWidth: 1.5,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: points.map((p) =>
          p.displayScore >= DISPLAY_THRESHOLD ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)"
        ),
        pointBorderColor: "#fff",
        pointBorderWidth: 1,
        fill: {
          target: { value: DISPLAY_THRESHOLD },
          above: FAKE_FILL,
          below: REAL_FILL,
        },
        tension: 0.4,
        spanGaps: true,
      });
    }

    return {
      labels: points.map((p) => `${p.start.toFixed(1)}s`),
      datasets,
    };
  }, [points, showTrendLine]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      onClick: (_evt, elements) => {
        if (!elements?.length || !onSeek) return;
        const idx = elements[0].index;
        if (points[idx]) onSeek(points[idx].start);
      },
      scales: {
        x: {
          title: { display: true, text: xTitle },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
          grid: { offset: false },
        },
        y: {
          min: 0,
          max: 1,
          title: { display: true, text: "Score (threshold at 50%)" },
          ticks: {
            callback: (v) => (v === DISPLAY_THRESHOLD ? "50%" : v),
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: (item) => item.datasetIndex === 0,
          callbacks: {
            label: (ctx) => {
              const p = points[ctx.dataIndex];
              if (!p) return "";
              return `Score: ${(p.displayScore * 100).toFixed(1)}%`;
            },
            afterLabel: (ctx) => {
              const p = points[ctx.dataIndex];
              if (!p) return "";
              const range =
                Number.isFinite(p.end) && p.end > p.start
                  ? `${p.start.toFixed(1)}s–${p.end.toFixed(1)}s`
                  : null;
              return [
                p.is_fake ? "Segment: FAKE" : "Segment: REAL",
                range,
                p.winning_generator ? `Generator: ${p.winning_generator}` : "",
                p.trackId != null ? `Track: ${p.trackId}` : "",
              ].filter(Boolean);
            },
          },
        },
      },
    }),
    [points, onSeek, xTitle]
  );

  const playheadPct =
    points.length > 0 || strip.length > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  return (
    <div className="relative space-y-2">
      <div className="relative h-3 w-full rounded-full bg-slate-100 overflow-hidden">
        {strip.map((p, i) => {
          const left = (p.start / duration) * 100;
          const width = Math.max(((p.end - p.start) / duration) * 100, 0.4);
          return (
            <button
              key={p.trackId != null ? `${p.trackId}-${p.index}-${i}` : p.index}
              type="button"
              title={`${p.is_fake ? "Fake" : "Real"} · ${p.start.toFixed(1)}s`}
              onClick={() => onSeek?.(p.start)}
              className={`absolute inset-y-0 transition-opacity hover:opacity-90 ${
                p.is_fake ? "bg-red-400" : "bg-green-400"
              }`}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-900/60 z-10 pointer-events-none"
          style={{ left: `${playheadPct}%` }}
        />
      </div>

      <div className="h-56 w-full">
        <Bar data={chartData} options={options} />
      </div>

      <div className="h-1 rounded-full bg-slate-100 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary/70 transition-[width] duration-150"
          style={{ width: `${playheadPct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">{caption}</p>
    </div>
  );
}

/**
 * Video stage with live DFA bbox overlays. bbox = [x, y, w, h] in source pixels.
 */
function VideoWithDfaOverlay({ fileUrl, videoRef, dfaSegments, className }) {
  const [activeBoxes, setActiveBoxes] = useState([]);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  const syncBoxes = useCallback(() => {
    const el = videoRef?.current;
    if (!el) return;
    setActiveBoxes(activeDfaBoxesAt(dfaSegments, el.currentTime || 0));
  }, [videoRef, dfaSegments]);

  useEffect(() => {
    const el = videoRef?.current;
    if (!el) return;
    const onMeta = () => {
      setDims({
        width: el.videoWidth || 0,
        height: el.videoHeight || 0,
      });
      syncBoxes();
    };
    const onTime = () => syncBoxes();
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("seeked", onTime);
    if (el.readyState >= 1) onMeta();
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("seeked", onTime);
    };
  }, [videoRef, fileUrl, syncBoxes]);

  const vw = dims.width || 1;
  const vh = dims.height || 1;

  return (
    <div className="relative w-full max-h-[420px] flex items-center justify-center bg-black">
      <div className="relative inline-block max-w-full max-h-[420px]">
        {activeBoxes.map((box, idx) => {
          const [x, y, w, h] = box.bbox;
          return (
            <div
              key={`${box.trackId}-${box.index}-${idx}`}
              className={`absolute z-10 border-[3px] rounded pointer-events-none transition-all duration-75 ${
                box.is_fake ? "border-red-500" : "border-green-500"
              }`}
              style={{
                left: `${(x / vw) * 100}%`,
                top: `${(y / vh) * 100}%`,
                width: `${(w / vw) * 100}%`,
                height: `${(h / vh) * 100}%`,
              }}
              title={`Track ${box.trackId}`}
            >
              <span
                className={`absolute -top-5 left-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  box.is_fake ? "bg-red-500 text-white" : "bg-green-500 text-white"
                }`}
              >
                {box.trackId}
              </span>
            </div>
          );
        })}
        <video
          ref={videoRef}
          src={fileUrl}
          controls
          className={className || "max-w-full max-h-[420px] w-auto h-auto bg-black block"}
        />
      </div>
    </div>
  );
}

function VideoPanel({ envelope, fileUrl, videoRef }) {
  const videoBucket = envelope?.results?.video;
  const models = videoBucket?.models_results || [];
  const aigv =
    models.find((m) => m?.model_name === "aigv") ||
    models.find((m) => Array.isArray(m?.labels_result));
  const dfa = models.find(
    (m) => m?.model_name === "dfa_v3" || m?.model_name?.startsWith("dfa")
  );
  const points = useMemo(
    () => buildAigvTimeline(aigv, aigv?.threshold ?? 0.5),
    [aigv]
  );
  const dfaBuilt = useMemo(() => buildDfaSegments(dfa), [dfa]);
  const [currentTime, setCurrentTime] = useState(0);

  const aigvFake = !!aigv?.is_fake;
  const dfaFake = dfa ? (dfa.result ?? 0) > (dfa.threshold ?? 0.6) : false;

  // Fake-first; if both fake (or both real), AIGV first
  const orderedCards = useMemo(() => {
    const cards = [];
    if (aigv) {
      cards.push({
        id: "aigv",
        title: "AIGV",
        fake: aigvFake,
        priority: 0,
      });
    }
    if (dfa) {
      cards.push({
        id: "face",
        title: "Face analysis",
        fake: dfaFake,
        priority: 1,
      });
    }
    return cards.sort((a, b) => {
      if (a.fake !== b.fake) return a.fake ? -1 : 1;
      return a.priority - b.priority;
    });
  }, [aigv, dfa, aigvFake, dfaFake]);

  const [openIds, setOpenIds] = useState(() => new Set());

  useEffect(() => {
    // Expand the top (fake-first) card by default for each new result
    const cards = [];
    if (aigv) cards.push({ id: "aigv", fake: !!aigv.is_fake, priority: 0 });
    if (dfa) {
      cards.push({
        id: "face",
        fake: (dfa.result ?? 0) > (dfa.threshold ?? 0.6),
        priority: 1,
      });
    }
    cards.sort((a, b) => {
      if (a.fake !== b.fake) return a.fake ? -1 : 1;
      return a.priority - b.priority;
    });
    setOpenIds(cards.length ? new Set([cards[0].id]) : new Set());
  }, [envelope?.job_id, aigv, dfa]);

  const toggleCard = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const el = videoRef?.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime || 0);
    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [videoRef, fileUrl]);

  const seek = (t) => {
    const el = videoRef?.current;
    if (el) {
      el.currentTime = t;
      el.play?.().catch(() => {});
    }
  };

  const durationSec =
    dfa?.duration != null
      ? Number(dfa.duration)
      : aigv?.duration != null
        ? Number(aigv.duration)
        : undefined;

  if (!aigv && !dfa) {
    return (
      <p className="text-slate-500 text-sm">No video model results in this envelope.</p>
    );
  }

  return (
    <div className="space-y-4">
      {orderedCards.map((card) => {
        const open = openIds.has(card.id);

        if (card.id === "aigv") {
          return (
            <AnalysisCard
              key={card.id}
              title={card.title}
              fake={aigvFake}
              score={aigv.result}
              threshold={aigv.threshold ?? 0.5}
              open={open}
              onToggle={() => toggleCard(card.id)}
              headerRight={
                <div className="flex items-center gap-3 text-right">
                  {aigv.duration != null && (
                    <span className="text-sm text-slate-500 tabular-nums">
                      {Number(aigv.duration).toFixed(1)}s
                    </span>
                  )}
                  {envelope?.sampling?.mode && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        Sampling
                      </p>
                      <p className="text-xs text-slate-700">{envelope.sampling.mode}</p>
                    </div>
                  )}
                </div>
              }
            >
              {points.length > 0 && (
                <VideoTimeline
                  points={points}
                  currentTime={currentTime}
                  onSeek={seek}
                  durationSec={
                    aigv?.duration != null ? Number(aigv.duration) : durationSec
                  }
                  showTrendLine={false}
                />
              )}
            </AnalysisCard>
          );
        }

        return (
          <AnalysisCard
            key={card.id}
            title={card.title}
            fake={dfaFake}
            score={dfa.result}
            threshold={dfa.threshold ?? 0.6}
            open={open}
            onToggle={() => toggleCard(card.id)}
            headerRight={
              <p className="text-xs text-slate-400">
                {dfaBuilt.trackIds.length} face track
                {dfaBuilt.trackIds.length === 1 ? "" : "s"}
                {dfaBuilt.segments.length
                  ? ` · ${dfaBuilt.segments.length} predictions`
                  : ""}
              </p>
            }
          >
            {dfaBuilt.chartPoints.length > 0 && (
              <VideoTimeline
                points={dfaBuilt.chartPoints}
                stripPoints={dfaBuilt.segments}
                currentTime={currentTime}
                onSeek={seek}
                durationSec={durationSec}
                xTitle="Time"
                caption="Scores held until the next prediction · red above (fake), green below (real) · click to seek · boxes overlay on the video"
              />
            )}
          </AnalysisCard>
        );
      })}
    </div>
  );
}

/**
 * v3 detection envelope results UI (API-backed runs).
 */
export default function ResultV3({
  envelope,
  fileUrl,
  file_metadata,
  handle_newCheck,
  newCheckHref,
}) {
  const [phase, setPhase] = useState(0);
  const videoRef = useRef(null);

  const dfaSegments = useMemo(() => {
    const models = envelope?.results?.video?.models_results || [];
    const dfa =
      models.find((m) => m?.model_name === "dfa_v3" || m?.model_name?.startsWith("dfa")) ||
      null;
    return buildDfaSegments(dfa).segments;
  }, [envelope]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 280);
    const t3 = setTimeout(() => setPhase(3), 480);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [envelope?.job_id]);

  if (!envelope) {
    return (
      <div className="px-6 py-16 text-center text-slate-500">No result envelope.</div>
    );
  }

  const mime = file_metadata?.type || "";
  const isVideo = mime.startsWith("video/") || !!envelope?.results?.video?.count;
  const isImage =
    mime.startsWith("image/") ||
    (!!envelope?.results?.image?.count && !envelope?.results?.video?.count);

  const errors = envelope.errors || {};
  const onNew = () => {
    if (handle_newCheck) handle_newCheck();
    else if (newCheckHref && typeof window !== "undefined") {
      window.location.href = newCheckHref;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Detection results
          </h1>
          {file_metadata?.name && (
            <p className="text-sm text-slate-500 mt-1">{file_metadata.name}</p>
          )}
        </div>
        {(handle_newCheck || newCheckHref) && (
          <button
            type="button"
            onClick={onNew}
            className="flex items-center gap-2 cursor-pointer text-sm font-medium px-5 py-2.5 rounded-full bg-white border border-slate-200 shadow-sm hover:border-primary/40 hover:text-primary transition-all"
          >
            <PlusCircle className="size-5" strokeWidth={1.5} />
            New Analysis
          </button>
        )}
      </div>

      <VerdictHero
        prediction={deriveHeroPrediction(envelope)}
        status={envelope.status}
        animate={phase >= 1}
        mediaLabel={isVideo ? "Video" : isImage ? "Image" : "media"}
        disagree={modelsDisagree(envelope)}
      />

      {(errors.message || (errors.models_without_results || []).length > 0) && (
        <div className="flex gap-3 items-start rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            {errors.message && <p className="font-medium">{errors.message}</p>}
            {(errors.models_without_results || []).length > 0 && (
              <p className="mt-1 text-amber-800/80">
                Missing models: {errors.models_without_results.join(", ")}
              </p>
            )}
            {(errors.policy_notes || []).length > 0 && (
              <p className="mt-1 text-amber-800/70 text-xs">
                {errors.policy_notes.join(" · ")}
              </p>
            )}
          </div>
        </div>
      )}

      <div
        className={`grid lg:grid-cols-2 gap-8 transition-all duration-700 ${
          phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-card min-h-[240px] flex items-center justify-center bg-slate-900/5">
          {fileUrl && isVideo && (
            <VideoWithDfaOverlay
              fileUrl={fileUrl}
              videoRef={videoRef}
              dfaSegments={dfaSegments}
              className="max-w-full max-h-[420px] w-auto h-auto bg-black block"
            />
          )}
          {fileUrl && isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl}
              alt={file_metadata?.name || "Analyzed media"}
              className="w-full max-h-[420px] object-contain"
            />
          )}
          {!fileUrl && (
            <p className="text-slate-400 text-sm py-20">Media preview unavailable</p>
          )}
        </div>

        <div
          className={`bg-white border border-slate-200 rounded-3xl shadow-card p-6 transition-all duration-700 delay-100 ${
            phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {isImage && <ImagePanel envelope={envelope} />}
          {isVideo && <VideoPanel envelope={envelope} fileUrl={fileUrl} videoRef={videoRef} />}
          {!isImage && !isVideo && (
            <p className="text-slate-500 text-sm">Unsupported media modality in envelope.</p>
          )}
        </div>
      </div>

      {envelope.policy && (
        <p className="text-xs text-slate-400">
          Policy: {envelope.policy}
          {envelope.version ? ` · envelope ${envelope.version}` : ""}
        </p>
      )}
    </div>
  );
}
