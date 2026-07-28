import { ViewPageSkeleton } from "@/components/LoadingSkeletons";

export default function Loading() {
    return (
        <>
            <div className="fixed h-screen w-40 bg-white py-5 border-r border-slate-200 shadow-sm">
                <div className="px-3 flex items-center gap-2">
                    <div className="size-7 skeleton-h rounded-md" />
                    <div className="h-5 w-24 skeleton-h rounded-full" />
                </div>
                <div className="flex flex-col gap-3 py-10 px-2">
                    <div className="h-9 w-full skeleton-h rounded-full" />
                    <div className="h-9 w-full skeleton-h rounded-full" />
                </div>
            </div>
            <ViewPageSkeleton />
        </>
    );
}
