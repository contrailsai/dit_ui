'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    Clock,
    BadgeCheck,
    ExternalLink,
    Video,
    AudioLines,
    Image as ImageIcon,
    Loader2,
    Inbox,
    Search,
    X,
    ArrowDownWideNarrow,
    ArrowUpWideNarrow,
} from "lucide-react";
import { fetchMoreCases } from "./actions";
import { formatShortDate } from "@/utils/format_date";
import Link from "next/link";

const ITEMS_PER_PAGE = 20;

const UPLOAD_TYPES = [
    { value: "all", label: "All" },
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" },
    { value: "image", label: "Image" },
];

const STATUS_OPTIONS = [
    { value: "all", label: "All" },
    { value: "done", label: "Done" },
    { value: "pending", label: "Pending" },
];

const DEFAULT_FILTERS = {
    search: "",
    uploadType: "all",
    status: "all",
    sortAsc: false,
};

const MediaIcon = ({ upload_type }) => {
    if (upload_type === "video") return <Video className="size-4 text-primary" strokeWidth={1.75} />;
    if (upload_type === "audio") return <AudioLines className="size-4 text-primary" strokeWidth={1.75} />;
    if (upload_type === "image") return <ImageIcon className="size-4 text-primary" strokeWidth={1.75} />;
    return null;
};

function ChipGroup({ options, value, onChange, ariaLabel }) {
    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className="inline-flex items-center rounded-full bg-slate-100/80 p-0.5 border border-slate-200/80"
        >
            {options.map((opt) => {
                const active = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                            active
                                ? "bg-primary text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

const inferUploadType = (val) => {
    const fromRequest = val?.input_request?.upload_type;
    if (fromRequest) return fromRequest;
    const mime = val?.file_metadata?.type || val?.input_request?.content_type || "";
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    return null;
};

const CaseRow = ({ val, idx, user }) => {
    const analysis_types = val.input_request?.analysis_types || {};
    const upload_type = inferUploadType(val);
    const { name } = val.file_metadata || {};

    const isDirect = val.method === "direct";
    // Legacy media-checker image runs rewritten by detect still use prediction
    const isUiDetect = val.method === "platform_detect";
    // direct / UI-detect: prediction set means complete; verification: status flag
    const isDone = isDirect || isUiDetect
        ? typeof val.prediction === "boolean"
        : Boolean(val.status);
    const showLink = isDone || user?.verifier;
    const predictionLabel = isDone
        ? (val.prediction ? "Real" : "Fake")
        : "—";

    const dateLabel = formatShortDate(val.created_at);

    const analysisChips = Object.keys(analysis_types).filter((k) => analysis_types[k]);

    return (
        <div className="group border-b border-slate-100 last:border-b-0 pl-5 pr-4 w-full flex gap-3 xl:gap-4 items-center py-3.5 hover:bg-slate-50/80 transition-colors">
            <span className="w-10 shrink-0 text-center text-slate-400 text-xs tabular-nums">
                {idx + 1}
            </span>

            <span className="flex-1 min-w-0 truncate font-medium text-slate-800 text-sm" title={name || undefined}>
                {name || "—"}
            </span>

            <span className="w-[5.5rem] shrink-0 flex items-center gap-1.5 capitalize text-slate-600 text-sm">
                <span className="flex items-center justify-center size-7 rounded-lg bg-primary/10 shrink-0">
                    <MediaIcon upload_type={upload_type} />
                </span>
                {upload_type || "—"}
            </span>

            <span className="w-[6.5rem] shrink-0">
                {isDone ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 text-xs font-medium">
                        <BadgeCheck className="size-3.5" strokeWidth={2} />
                        Done
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 text-xs font-medium">
                        <Clock className="size-3.5" strokeWidth={2} />
                        Pending
                    </span>
                )}
            </span>

            <span className="w-[6.5rem] shrink-0">
                <span
                    className={`inline-flex rounded-full text-xs font-medium px-3 py-0.5 ${
                        isDone
                            ? val.prediction
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-red-50 text-red-700 border border-red-100"
                            : "text-slate-400 bg-slate-50 border border-slate-100"
                    }`}
                >
                    {predictionLabel}
                </span>
            </span>

            <span className="hidden xl:flex w-56 2xl:w-64 shrink-0 flex-wrap gap-1.5">
                {analysisChips.length > 0 ? (
                    analysisChips.map((input_type) => (
                        <span
                            key={input_type}
                            className="bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium rounded-full px-2 py-0.5 w-fit h-fit"
                        >
                            {input_type}
                        </span>
                    ))
                ) : isUiDetect ? (
                    <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium rounded-full px-2 py-0.5 w-fit h-fit">
                        Image detect
                    </span>
                ) : null}
            </span>

            <span className="w-[5.5rem] shrink-0 text-sm text-slate-500 tabular-nums">
                {dateLabel}
            </span>

            <span className="w-[4.5rem] shrink-0">
                {showLink ? (
                    <Link
                        className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium transition-colors opacity-80 group-hover:opacity-100"
                        href={`/view/${val.id}`}
                    >
                        Open
                        <ExternalLink className="size-3.5" strokeWidth={1.5} />
                    </Link>
                ) : (
                    <span className="text-slate-300 text-sm">—</span>
                )}
            </span>
        </div>
    );
};

function FilterBar({
    searchInput,
    onSearchChange,
    uploadType,
    onUploadTypeChange,
    status,
    onStatusChange,
    sortAsc,
    onSortChange,
    hasActiveFilters,
    onClear,
    totalCount,
    isFiltering,
}) {
    return (
        <div className="px-5 py-4 border-b border-slate-100 bg-white">
            <div className="flex flex-wrap items-center gap-3">
                <div className="shrink-0 min-w-[5.5rem] pr-1">
                    {isFiltering ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                            <Loader2 className="size-4 animate-spin text-primary" />
                            Updating…
                        </span>
                    ) : typeof totalCount === "number" ? (
                        <div className="leading-tight">
                            <span className="text-2xl font-bold tabular-nums text-slate-900 tracking-tight">
                                {totalCount}
                            </span>
                            <span className="ml-1.5 text-sm font-semibold text-slate-500">
                                {totalCount === 1 ? "case" : "cases"}
                                {hasActiveFilters ? " matching" : ""}
                            </span>
                        </div>
                    ) : null}
                </div>

                <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" strokeWidth={1.75} />
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search by filename…"
                        className="w-full rounded-full border border-slate-200 bg-slate-50/50 pl-10 pr-9 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={() => onSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            aria-label="Clear search"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                <ChipGroup
                    ariaLabel="File type"
                    options={UPLOAD_TYPES}
                    value={uploadType}
                    onChange={onUploadTypeChange}
                />

                <ChipGroup
                    ariaLabel="Status"
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={onStatusChange}
                />

                <button
                    type="button"
                    onClick={() => onSortChange(!sortAsc)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                    title={sortAsc ? "Oldest first" : "Newest first"}
                >
                    {sortAsc ? (
                        <ArrowUpWideNarrow className="size-3.5" strokeWidth={1.75} />
                    ) : (
                        <ArrowDownWideNarrow className="size-3.5" strokeWidth={1.75} />
                    )}
                    {sortAsc ? "Oldest" : "Newest"}
                </button>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-primary transition-colors"
                    >
                        <X className="size-3.5" />
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}

export default function CasesListClient({ initialData, initialTotalCount, user }) {
    const [cases, setCases] = useState(initialData);
    const [offset, setOffset] = useState(ITEMS_PER_PAGE);
    const [hasMore, setHasMore] = useState(
        (initialData?.length || 0) >= ITEMS_PER_PAGE
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const [totalCount, setTotalCount] = useState(initialTotalCount ?? null);

    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [uploadType, setUploadType] = useState("all");
    const [status, setStatus] = useState("all");
    const [sortAsc, setSortAsc] = useState(false);

    const observerTarget = useRef(null);
    const filtersRef = useRef(DEFAULT_FILTERS);
    const skipInitialFilterEffect = useRef(true);

    const filters = useMemo(
        () => ({
            search: debouncedSearch,
            uploadType,
            status,
            sortAsc,
        }),
        [debouncedSearch, uploadType, status, sortAsc]
    );

    filtersRef.current = filters;

    const hasActiveFilters =
        Boolean(searchInput.trim()) ||
        uploadType !== "all" ||
        status !== "all" ||
        sortAsc;

    // Debounce filename search
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Refetch from page 0 when filters change (skip first mount — SSR data)
    useEffect(() => {
        if (skipInitialFilterEffect.current) {
            skipInitialFilterEffect.current = false;
            return;
        }

        let cancelled = false;

        const run = async () => {
            setIsFiltering(true);
            setHasMore(true);
            try {
                const result = await fetchMoreCases(0, ITEMS_PER_PAGE, filters);
                if (cancelled) return;
                setCases(result.t_list || []);
                setTotalCount(result.total_count ?? 0);
                setOffset(ITEMS_PER_PAGE);
                setHasMore((result.t_list?.length || 0) >= ITEMS_PER_PAGE);
            } catch (error) {
                console.error("Failed to filter cases", error);
            } finally {
                if (!cancelled) setIsFiltering(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [filters]);

    const loadMore = useCallback(async () => {
        if (isLoading || isFiltering || !hasMore) return;

        setIsLoading(true);
        try {
            const result = await fetchMoreCases(offset, ITEMS_PER_PAGE, filtersRef.current);
            const newCases = result.t_list || [];

            if (typeof result.total_count === "number") {
                setTotalCount(result.total_count);
            }

            if (newCases.length < ITEMS_PER_PAGE) {
                setHasMore(false);
            }

            if (newCases.length > 0) {
                setCases((prev) => [...prev, ...newCases]);
                setOffset((prev) => prev + ITEMS_PER_PAGE);
            }
        } catch (error) {
            console.error("Failed to load more cases", error);
        } finally {
            setIsLoading(false);
        }
    }, [offset, hasMore, isLoading, isFiltering]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
        );

        const target = observerTarget.current;
        if (target) observer.observe(target);

        return () => {
            if (target) observer.unobserve(target);
        };
    }, [loadMore]);

    const clearFilters = () => {
        setSearchInput("");
        setDebouncedSearch("");
        setUploadType("all");
        setStatus("all");
        setSortAsc(false);
    };

    const isEmpty = !cases || cases.length === 0;

    return (
        <div>
            <FilterBar
                searchInput={searchInput}
                onSearchChange={setSearchInput}
                uploadType={uploadType}
                onUploadTypeChange={setUploadType}
                status={status}
                onStatusChange={setStatus}
                sortAsc={sortAsc}
                onSortChange={setSortAsc}
                hasActiveFilters={hasActiveFilters}
                onClear={clearFilters}
                totalCount={totalCount}
                isFiltering={isFiltering}
            />

            <div className="hidden sm:flex pl-5 pr-4 w-full gap-3 xl:gap-4 items-center py-2.5 bg-primary text-white text-[11px] font-medium uppercase tracking-wider">
                <span className="w-10 shrink-0 text-center text-white/80">#</span>
                <span className="flex-1 min-w-0">File name</span>
                <span className="w-[5.5rem] shrink-0">Type</span>
                <span className="w-[6.5rem] shrink-0">Status</span>
                <span className="w-[6.5rem] shrink-0">Prediction</span>
                <span className="hidden xl:block w-56 2xl:w-64 shrink-0">Analysis</span>
                <span className="w-[5.5rem] shrink-0">Date</span>
                <span className="w-[4.5rem] shrink-0">Link</span>
            </div>

            {isFiltering && isEmpty ? (
                <div className="flex flex-col w-full justify-center items-center py-24 text-slate-400 gap-2">
                    <Loader2 className="size-6 animate-spin text-primary/60" />
                    <div className="text-sm font-medium text-slate-500">Loading cases…</div>
                </div>
            ) : isEmpty ? (
                <div className="flex flex-col w-full justify-center items-center py-24 text-slate-400 gap-3">
                    <Inbox className="size-11 stroke-1 text-slate-300" />
                    {hasActiveFilters ? (
                        <>
                            <div className="text-lg font-medium text-slate-500">No matching cases</div>
                            <p className="text-sm text-slate-400">Try adjusting or clearing your filters</p>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-1 text-sm text-primary font-medium hover:underline"
                            >
                                Clear filters
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="text-lg font-medium text-slate-500">No cases found</div>
                            <p className="text-sm text-slate-400">Upload a file to start your first analysis</p>
                            <Link
                                href="/media-checker"
                                className="mt-1 text-sm text-primary font-medium hover:underline"
                            >
                                Go to Media Checker
                            </Link>
                        </>
                    )}
                </div>
            ) : (
                <div className={isFiltering ? "opacity-60 pointer-events-none transition-opacity" : "transition-opacity"}>
                    {cases.map((val, idx) => (
                        <CaseRow key={val.id} val={val} idx={idx} user={user} />
                    ))}
                </div>
            )}

            <div
                ref={observerTarget}
                className="w-full flex justify-center p-5 h-16"
            >
                {isLoading && (
                    <div className="flex items-center gap-2 text-primary/70">
                        <Loader2 className="size-4 animate-spin" />
                        <span className="text-sm font-medium">Loading more…</span>
                    </div>
                )}
                {!hasMore && cases.length > 0 && !isLoading && !isFiltering && (
                    <div className="text-slate-400 text-xs">
                        All cases loaded
                    </div>
                )}
            </div>
        </div>
    );
}
