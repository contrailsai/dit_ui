import { MediaCheckerSkeleton } from "@/components/LoadingSkeletons";

export default function Loading() {
    return (
        <div className="pl-40 min-h-screen bg-slate-50">
            <MediaCheckerSkeleton />
        </div>
    );
}
