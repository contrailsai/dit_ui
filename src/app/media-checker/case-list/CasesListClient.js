'use client'

import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, BadgeCheck, ExternalLink, Clapperboard, AudioLines, Image as ImageIcon } from "lucide-react";
// import { CaseRow, GRID_CLASS } from "./CaseRow"; // Import the row and grid class
import { fetchMoreCases } from "./actions"; // Import the server action
import Link from "next/link";
import { PlusCircle, Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 20;


// Shared Grid Layout
export const GRID_CLASS = "grid grid-cols-[40px_minmax(200px,3fr)_120px_120px_120px_2fr_100px_80px] gap-4 items-center px-6";

const CaseRow = ({ val, idx, user }) => {
    const time = new Date(val.created_at);
    const { analysis_types, upload_type } = val.input_request;
    const { name } = val.file_metadata;

    // Logic from original code
    const has_result = typeof (val.prediction) === "boolean";
    const is_done = val.status === true || has_result;

    // Logic for text display
    const prediction_text = (is_done || user.verifier) && (val.prediction !== null)
        ? (val.prediction ? "Real" : "Fake")
        : "---";

    const method = val.method;
    const status = val.status;

    return (
        <div className={`${GRID_CLASS} py-4 border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors group text-sm text-zinc-600 animate-in fade-in slide-in-from-bottom-2 duration-500`}>

            {/* SNO */}
            <span className='font-mono text-zinc-400 text-center'>{idx + 1}</span>

            {/* NAME */}
            <span className='truncate font-medium text-zinc-700 pr-4' title={name}>
                {name || "Untitled File"}
            </span>

            {/* UPLOAD TYPE */}
            <span className='flex items-center gap-2 capitalize text-zinc-500'>
                {upload_type === "video" && <Clapperboard className='size-4' />}
                {upload_type === "audio" && <AudioLines className='size-4' />}
                {upload_type === "image" && <ImageIcon className='size-4' />}
                {upload_type}
            </span>

            {/* STATUS */}
            <div>
                {method === "direct" ? (
                    <div className={`flex items-center w-fit gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${(is_done && has_result)
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                        {(is_done && has_result)
                            ? <BadgeCheck className='size-3.5' />
                            : <Clock className='size-3.5' />
                        }
                        {(is_done && has_result) ? "Complete" : "Pending"}
                        {typeof (val.prediction) === "boolean"}
                    </div>
                ) : (
                    <div className={`flex items-center w-fit gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${(status)
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                        {(status)
                            ? <BadgeCheck className='size-3.5' />
                            : <Clock className='size-3.5' />
                        }
                        {status ? "Complete" : "Pending"}
                    </div>
                )}
            </div>

            {/* PREDICTION */}
            <div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium w-fit border ${prediction_text === "Real"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : prediction_text === "Fake"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-zinc-100 text-zinc-400 border-zinc-200"
                    }`}>
                    {prediction_text}
                </div>
            </div>

            {/* ANALYSIS TAGS */}
            <div className='flex flex-wrap gap-2'>
                {Object.keys(analysis_types).map((input_type, input_idx) => {
                    if (analysis_types[input_type])
                        return (
                            <span key={input_idx} className='text-[10px] uppercase tracking-wide text-zinc-500 bg-white border border-zinc-200 rounded-md px-2 py-0.5'>
                                {input_type}
                            </span>
                        )
                })}
            </div>

            {/* DATE */}
            <span className='text-zinc-400 text-xs'>
                {time.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>

            {/* LINK */}
            <span className="flex justify-end pr-2">
                {val.prediction !== null ? (
                    <Link
                        href={'/view/' + val.id}
                        target="_blank"
                        className='p-2 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-zinc-900 transition-all'
                    >
                        <ExternalLink className='size-4' />
                    </Link>
                ) : (
                    <span className="text-zinc-300 text-center block w-8">---</span>
                )}
            </span>
        </div>
    )
}

export default function CasesListClient({ initialData, user }) {
    const [cases, setCases] = useState(initialData);
    const [offset, setOffset] = useState(ITEMS_PER_PAGE);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Ref for the bottom of the list
    const observerTarget = useRef(null);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            // Call the server action
            const newCases = await fetchMoreCases(offset, ITEMS_PER_PAGE);

            if (newCases.length < ITEMS_PER_PAGE) {
                setHasMore(false);
            }

            if (newCases.length > 0) {
                setCases(prev => [...prev, ...newCases]);
                setOffset(prev => prev + ITEMS_PER_PAGE);
            }
        } catch (error) {
            console.error("Failed to load more cases", error);
        } finally {
            setIsLoading(false);
        }
    }, [offset, hasMore, isLoading]);

    // Intersection Observer to detect scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: "100px" } // Load slightly before reaching bottom
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [loadMore]);

    if (!cases || cases.length === 0) {
        return (
            <div className='flex flex-col w-full justify-center items-center py-24 text-zinc-400'>
                <div className='bg-zinc-50 p-4 rounded-full mb-4'>
                    <PlusCircle className="size-8 text-zinc-300" strokeWidth={1} />
                </div>
                <div className='text-lg font-light'>No cases found</div>
                <Link href={'/media-checker'} className='mt-4 text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 transition-colors'>
                    Start your first analysis
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[300px]">
            {cases.map((val, idx) => (
                <CaseRow key={`${val.id}-${idx}`} val={val} idx={idx} user={user} />
            ))}

            {/* Loading Indicator / Observer Target */}
            <div ref={observerTarget} className="w-full py-8 flex justify-center items-center">
                {isLoading && (
                    <div className="flex items-center gap-2 text-zinc-400 text-sm animate-pulse">
                        <Loader2 className="size-4 animate-spin" />
                        Loading more cases...
                    </div>
                )}
                {!hasMore && cases.length > 0 && (
                    <div className="text-zinc-300 text-xs tracking-widest uppercase">End of list</div>
                )}
            </div>
        </div>
    )
}