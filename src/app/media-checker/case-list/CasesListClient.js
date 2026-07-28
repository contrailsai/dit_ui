'use client'

import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, BadgeCheck, ExternalLink, Video, AudioLines, Image as ImageIcon, Loader2, Inbox } from "lucide-react";
import { fetchMoreCases } from "./actions";
import Link from "next/link";

const ITEMS_PER_PAGE = 20;

const MediaIcon = ({ upload_type }) => {
    if (upload_type === "video") return <Video className="size-5 text-slate-500" strokeWidth={1.5} />;
    if (upload_type === "audio") return <AudioLines className="size-5 text-slate-500" strokeWidth={1.5} />;
    if (upload_type === "image") return <ImageIcon className="size-5 text-slate-500" strokeWidth={1.5} />;
    return null;
};

const CaseRow = ({ val, idx, user }) => {
    const time = new Date(val.created_at);
    const { analysis_types, upload_type } = val.input_request || {};
    const { name } = val.file_metadata || {};

    if (!analysis_types) return null;

    const isDirect = val.method === "direct";
    const isDone = isDirect
        ? typeof val.prediction === "boolean"
        : Boolean(val.status);
    const showLink = isDone || user?.verifier;
    const predictionLabel = isDone
        ? (val.prediction ? "Real" : "Fake")
        : "---";

    return (
        <div className="border-b border-slate-100 last:border-b-0 pl-6 pr-2 w-full flex gap-5 items-center py-3.5 max-h-28 hover:bg-slate-50 transition-colors">
            <span className="min-w-14 flex justify-center text-slate-400 text-sm tabular-nums">
                {idx + 1}
            </span>

            <span className="w-[300px] truncate font-medium text-slate-800" title={name || undefined}>
                {name || "---"}
            </span>

            <span className="min-w-24 flex items-center gap-2 capitalize text-slate-600 text-sm">
                <MediaIcon upload_type={upload_type} />
                {upload_type}
            </span>

            <span className="min-w-28 flex items-center gap-2 text-sm">
                {isDone ? (
                    <div className="text-emerald-600 bg-emerald-100 rounded-full p-0.5">
                        <BadgeCheck className="size-5" strokeWidth={2} />
                    </div>
                ) : (
                    <div className="text-amber-600 bg-amber-100 rounded-full p-0.5">
                        <Clock className="size-5" strokeWidth={2} />
                    </div>
                )}
                <span className={isDone ? "text-emerald-700" : "text-amber-700"}>
                    {isDone ? "Done" : "Pending"}
                </span>
            </span>

            <span className="min-w-28">
                <div
                    className={`rounded-full text-sm font-medium w-fit px-4 py-0.5 ${
                        isDone
                            ? val.prediction
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            : "text-slate-400"
                    }`}
                >
                    {predictionLabel}
                </div>
            </span>

            <span className="w-72 flex flex-wrap gap-2">
                {Object.keys(analysis_types).map((input_type) => {
                    if (!analysis_types[input_type]) return null;
                    return (
                        <span
                            key={input_type}
                            className="bg-primary/10 border border-primary/25 text-primary text-xs font-medium rounded-full px-2.5 py-0.5 w-fit h-fit"
                        >
                            {input_type}
                        </span>
                    );
                })}
            </span>

            <span className="min-w-24 text-sm text-slate-500 tabular-nums">
                {`${time.getDate()}-${time.getMonth() + 1}-${time.getFullYear()}`}
            </span>

            <span className="min-w-20">
                {showLink ? (
                    <Link
                        className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium transition-colors"
                        href={`/view/${val.id}`}
                    >
                        Open
                        <ExternalLink className="size-3.5" strokeWidth={1.5} />
                    </Link>
                ) : (
                    <span className="text-slate-300">---</span>
                )}
            </span>
        </div>
    );
};

export default function CasesListClient({ initialData, user }) {
    const [cases, setCases] = useState(initialData);
    const [offset, setOffset] = useState(ITEMS_PER_PAGE);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const observerTarget = useRef(null);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const newCases = await fetchMoreCases(offset, ITEMS_PER_PAGE);

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
    }, [offset, hasMore, isLoading]);

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

    if (!cases || cases.length === 0) {
        return (
            <div className="flex flex-col w-full justify-center items-center py-28 text-slate-400 gap-3">
                <Inbox className="size-12 stroke-1 text-slate-300" />
                <div className="text-lg font-medium text-slate-500">No cases found</div>
                <p className="text-sm text-slate-400">Upload a file to start your first analysis</p>
                <Link
                    href="/media-checker"
                    className="mt-2 text-sm text-primary font-medium hover:underline"
                >
                    Go to Media Checker
                </Link>
            </div>
        );
    }

    return (
        <div>
            {cases.map((val, idx) => (
                <CaseRow key={val.id} val={val} idx={idx} user={user} />
            ))}

            <div
                ref={observerTarget}
                className="w-full flex justify-center p-6 h-20"
            >
                {isLoading && (
                    <div className="flex items-center gap-2 text-primary/70">
                        <Loader2 className="size-5 animate-spin" />
                        <span className="text-sm font-medium">Loading older cases…</span>
                    </div>
                )}
                {!hasMore && cases.length > 0 && !isLoading && (
                    <div className="text-slate-400 text-sm">
                        All cases loaded
                    </div>
                )}
            </div>
        </div>
    );
}
