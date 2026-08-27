import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { get_user_transactions } from "@/utils/cases_functions"
import CasesListClient from "./CasesListClient";

const CASES_LIST = async () => {
    const result = await get_user_transactions(0, 20);
    const user = result?.user;
    const t_list = result?.t_list;
    const total_count = result?.total_count;

    return (
        <div className="pt-8 pb-10 min-h-screen">
            <div className="w-full flex justify-between px-10 py-4 items-start gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        {user?.verifier ? "Verify Cases" : "List of Cases"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Search, filter, and open past analyses
                    </p>
                </div>

                <Link
                    href="/media-checker"
                    className="flex items-center gap-2 cursor-pointer text-sm font-medium h-fit px-5 py-2.5 rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 transition-all duration-200 shrink-0"
                >
                    New Analysis
                    <PlusCircle strokeWidth={1.5} className="size-4" />
                </Link>
            </div>

            <div className="px-4 mt-2">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
                    <CasesListClient
                        initialData={t_list || []}
                        initialTotalCount={total_count ?? 0}
                        user={user}
                    />
                </div>
            </div>
        </div>
    )
}

export default CASES_LIST;
