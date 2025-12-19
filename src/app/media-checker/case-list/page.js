import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Suspense } from "react";
import { get_user_transactions } from "@/utils/cases_functions"
import CasesListClient from "./CasesListClient";
// import { GRID_CLASS } from "./CaseRow";

// Shared Grid Layout
export const GRID_CLASS = "grid grid-cols-[40px_minmax(200px,3fr)_120px_120px_120px_2fr_100px_80px] gap-4 items-center px-6";

const CASES_LIST = async () => {
    // Initial fetch on the server (SSR)
    // 0 offset, 20 limit
    const { user, t_list } = await get_user_transactions(0, 20);

    return (
        <div className='w-full pt-10 pb-20'>
            <div className='max-w-[1600px] mx-auto'>
                {/* TOP BAR */}
                <div className='flex justify-between items-center px-10 mb-8'>
                    <div>
                        <h1 className='text-3xl font-light text-zinc-900 tracking-tight'>
                            Case History
                        </h1>
                        <p className="text-zinc-400 text-sm mt-1">Manage and view your recent media analysis.</p>
                    </div>

                    {/* NEW ANALYSIS BUTTON */}
                    <Link href={'/media-checker'} className='group flex items-center gap-3 cursor-pointer text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-all pl-5 pr-4 py-2.5 rounded-full shadow-lg shadow-zinc-200'>
                        New Analysis
                        <PlusCircle strokeWidth={1.5} className='size-5 text-zinc-50 group-hover:text-white transition-colors' />
                    </Link>
                </div>

                {/* TABLE CONTAINER */}
                <div className='flex flex-col mx-4 bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden'>

                    {/* TABLE HEADER */}
                    <div className={`${GRID_CLASS} py-4 bg-zinc-50/50 border-b border-zinc-100 text-xs font-medium text-zinc-400 uppercase tracking-wider`}>
                        <span className="text-center">#</span>
                        <span>File Name</span>
                        <span>Type</span>
                        <span>Status</span>
                        <span>Prediction</span>
                        <span>Analysis</span>
                        <span>Date</span>
                        <span className="text-right pr-2">Link</span>
                    </div>

                    {/* DATA LIST (CLIENT COMPONENT) */}
                    <div className='min-h-[200px]'>
                        <Suspense fallback={<Loading_Skeleton />}>
                            <CasesListClient initialData={t_list || []} user={user} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Loading_Skeleton = () => {
    // Helper to generate multiple skeleton rows
    const rows = Array(10).fill(0);

    return (
        <div className='flex flex-col w-full'>
            {rows.map((_, i) => (
                <div key={i} className={`${GRID_CLASS} py-4 border-b border-zinc-50`}>
                    <div className='h-4 bg-zinc-100 rounded-full w-full' />
                    <div className='h-4 bg-zinc-100 rounded-full w-3/4' />
                    <div className='h-4 bg-zinc-100 rounded-full w-16' />
                    <div className='h-4 bg-zinc-100 rounded-full w-20' />
                    <div className='h-4 bg-zinc-100 rounded-full w-20' />
                    <div className='flex gap-2'>
                        <div className='h-4 bg-zinc-100 rounded-full w-16' />
                        <div className='h-4 bg-zinc-100 rounded-full w-10' />
                    </div>
                    <div className='h-4 bg-zinc-100 rounded-full w-20' />
                    <div className='h-4 bg-zinc-100 rounded-full w-8 ml-auto' />
                </div>
            ))}
        </div>
    )
}

export default CASES_LIST;