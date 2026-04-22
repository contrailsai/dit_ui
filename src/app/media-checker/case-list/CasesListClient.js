'use client'

import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, BadgeCheck, ExternalLink, Video, AudioLines, Image as ImageIcon } from "lucide-react";
import { fetchMoreCases } from "./actions";
import Link from "next/link";
import { PlusCircle, Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 20;

const CaseRow = ({ val, idx, user }) => {
    const time = new Date(val.created_at);
    const { analysis_types, upload_type } = val.input_request || {};
    const { name } = val.file_metadata || {};

    const method = val.method;
    const has_result = typeof(val.prediction) === "boolean" ? true : false;
    
    // Fallback if missing
    if(!analysis_types) return null;

    if (method === 'direct') {
        return (
            <div className=' border-b-2 border-b-gray-200 pl-6 pr-2 w-full flex gap-5 items-center py-3 max-h-28'>
                <span className='min-w-14 flex justify-center'>
                    {idx + 1}
                </span>
                {/* NAME */}
                <span className=' w-[300px] truncate'>
                    {name ? name : "---"}
                </span>
                {/* UPLAOD TYPE */}
                <span className=' min-w-24 flex items-center gap-2 '>
                    {upload_type === "video" && <Video className='size-6' strokeWidth={1.5} />}
                    {upload_type === "audio" && <AudioLines className='size-6' strokeWidth={1.5} />}
                    {upload_type === "image" && <ImageIcon className='size-6' strokeWidth={1.5} />}
                    {upload_type}
                </span>
                {/* STATUS */}
                <span className=' min-w-28 flex items-center gap-2 '>
                    {has_result ? (
                        <div className='text-emerald-600 bg-green-200 rounded-full'>
                            <BadgeCheck className='size-6' strokeWidth={2} />
                        </div>
                    ) : (
                        <div className=' text-yellow-600 bg-yellow-200 rounded-full'>
                            <Clock className='size-6' strokeWidth={2} />
                        </div>
                    )}
                    {(has_result) ? "Done" : "Pending"}
                </span>
                <span className=' min-w-28  '>
                    <div className={`rounded-full ${ has_result ? (val.prediction ? "bg-green-200 border border-green-300" : "bg-red-200 border border-red-300") : ""} w-fit px-5 py-0.5`}>
                        {( has_result ? (val.prediction ? "Real" : "Fake"): "---")}
                    </div>
                </span>
                <span className=' w-72 flex flex-wrap gap-4 '>
                    {Object.keys(analysis_types).map((input_type, input_idx) => {
                        if (analysis_types[input_type])
                            return (
                                <span key={input_idx} className=' bg-primary/20 border border-primary/40 rounded-full px-3 w-fit h-fit py-0.5'>
                                    {input_type}
                                </span>
                            )
                    })}
                </span>
                <span className='min-w-24 '>
                    {`${time.getDate()}-${time.getMonth() + 1}-${time.getFullYear()}`}
                </span>
                <span className='min-w-20 '>
                    {
                        (has_result || user.verifier) ?
                            (
                                <Link className='underline flex items-center gap-1 ' href={'/view/' + val.id} >
                                    link
                                    <ExternalLink className='size-4' strokeWidth={1} />
                                </Link>
                            ) :
                            "---"
                    }
                </span>
            </div>
        )
    }
    else {
        return (
            <div className=' border-b-2 border-b-gray-200 pl-6 pr-2 w-full flex gap-5 items-center py-3 max-h-28'>
                <span className='min-w-14 flex justify-center'>
                    {idx + 1}
                </span>
                {/* NAME */}
                <span className=' w-[300px] truncate'>
                    {name ? name : "---"}
                </span>
                {/* UPLAOD TYPE */}
                <span className=' min-w-24 flex items-center gap-2 '>
                    {upload_type === "video" && <Video className='size-6' strokeWidth={1.5} />}
                    {upload_type === "audio" && <AudioLines className='size-6' strokeWidth={1.5} />}
                    {upload_type === "image" && <ImageIcon className='size-6' strokeWidth={1.5} />}
                    {upload_type}
                </span>
                {/* STATUS */}
                <span className=' min-w-28 flex items-center gap-2 '>
                    {val.status ? (
                        <div className='text-emerald-600 bg-green-200 rounded-full'>
                            <BadgeCheck className='size-6' strokeWidth={2} />
                        </div>
                    ) : (
                        <div className=' text-yellow-600 bg-yellow-200 rounded-full'>
                            <Clock className='size-6' strokeWidth={2} />
                        </div>
                    )}
                    {val.status ? "Done" : "Pending"}
                </span>
                <span className=' min-w-28  '>
                    <div className={`rounded-full ${ val.status ? (val.prediction ? "bg-green-200 border border-green-300" : "bg-red-200 border border-red-300") : ""} w-fit px-5 py-0.5`}>
                        {( val.status ? (val.prediction ? "Real" : "Fake"): "---")}
                    </div>
                </span>
                <span className=' w-72 flex flex-wrap gap-4 '>
                    {Object.keys(analysis_types).map((input_type, input_idx) => {
                        if (analysis_types[input_type])
                            return (
                                <span key={input_idx} className=' bg-primary/20 border border-primary/40 rounded-full px-3 w-fit h-fit py-0.5'>
                                    {input_type}
                                </span>
                            )
                    })}
                </span>
                <span className='min-w-24 '>
                    {`${time.getDate()}-${time.getMonth() + 1}-${time.getFullYear()}`}
                </span>
                <span className='min-w-20 '>
                    {
                        (val.status || user.verifier) ?
                            (
                                <Link className='underline flex items-center gap-1 ' href={'/view/' + val.id} >
                                    link
                                    <ExternalLink className='size-4' strokeWidth={1} />
                                </Link>
                            ) :
                            "---"
                    }
                </span>
            </div>
        )
    }
}

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
                setCases(prev => [...prev, ...newCases]);
                setOffset(prev => prev + ITEMS_PER_PAGE);
            }
        } catch (error) {
            console.error("Failed to load more cases", error);
        } finally {
            setIsLoading(false);
        }
    }, [offset, hasMore, isLoading]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
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
                <div className='text-lg font-light'>No cases found</div>
            </div>
        );
    }

    return (
        <div className="">
            {cases.map((val, idx) => (
                <CaseRow key={`${val.id}-${idx}`} val={val} idx={idx} user={user} />
            ))}
            
            <div 
                ref={observerTarget} 
                className="w-full flex justify-center p-6 h-20"
            >
                {isLoading && (
                    <div className="flex items-center gap-2 text-primary/60">
                        <Loader2 className="size-6 animate-spin" />
                        <span className="text-sm font-medium">Loading older cases...</span>
                    </div>
                )}
                {!hasMore && cases.length > 0 && (
                    <div className="text-zinc-400 text-sm italic">
                        All cases loaded
                    </div>
                )}
            </div>
        </div>
    );
}