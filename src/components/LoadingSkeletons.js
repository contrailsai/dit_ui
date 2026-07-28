export function CaseListSkeleton({ rows = 6 }) {
    return (
        <div className="flex flex-col gap-0 px-1">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="pl-6 pr-2 w-full flex gap-5 items-center py-4 border-b border-slate-100 last:border-b-0"
                >
                    <span className="min-w-14 h-5 skeleton-h rounded-full" />
                    <span className="w-[300px] h-5 skeleton-h rounded-full" />
                    <span className="min-w-24 h-5 skeleton-h rounded-full" />
                    <span className="min-w-28 h-5 skeleton-h rounded-full" />
                    <span className="min-w-28 h-5 skeleton-h rounded-full" />
                    <span className="w-72 h-5 skeleton-h rounded-full" />
                    <span className="min-w-24 h-5 skeleton-h rounded-full" />
                    <span className="min-w-20 h-5 skeleton-h rounded-full" />
                </div>
            ))}
        </div>
    );
}

export function CaseListPageSkeleton() {
    return (
        <div className="pt-8 pb-10 min-h-screen animate-in">
            <div className="w-full flex justify-between px-10 py-4 items-center">
                <div className="h-9 w-48 skeleton-h rounded-full" />
                <div className="h-11 w-40 skeleton-h rounded-full" />
            </div>

            <div className="px-4 flex flex-col gap-3 mt-2">
                <div className="pl-6 pr-2 w-full h-12 skeleton-h rounded-2xl" />
                <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
                    <CaseListSkeleton rows={8} />
                </div>
            </div>
        </div>
    );
}

export function MediaCheckerSkeleton() {
    return (
        <div className="pt-12 px-6 animate-in">
            <div className="h-9 w-72 skeleton-h rounded-full mb-2" />
            <div className="h-4 w-56 skeleton-l rounded-full mb-8" />
            <div className="flex gap-6 max-w-6xl">
                <div className="flex-1 h-72 skeleton-l rounded-3xl border border-slate-200" />
                <div className="w-2/5 h-72 skeleton-l rounded-3xl border border-slate-200" />
            </div>
            <div className="h-12 w-40 skeleton-h rounded-full mt-6 mx-auto" />
        </div>
    );
}

export function ViewPageSkeleton() {
    return (
        <div className="pl-40 min-h-screen bg-slate-50">
            <div className="pt-12 px-10 animate-in">
                <div className="h-9 w-64 skeleton-h rounded-full mb-8" />
                <div className="flex gap-8">
                    <div className="flex-1 h-[420px] skeleton-l rounded-3xl border border-slate-200 bg-white" />
                    <div className="w-80 flex flex-col gap-4">
                        <div className="h-32 skeleton-l rounded-3xl border border-slate-200 bg-white" />
                        <div className="h-48 skeleton-l rounded-3xl border border-slate-200 bg-white" />
                        <div className="h-24 skeleton-l rounded-3xl border border-slate-200 bg-white" />
                    </div>
                </div>
            </div>
        </div>
    );
}
