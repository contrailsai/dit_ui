import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { get_user_transactions } from "@/utils/cases_functions"
import CasesListClient from "./CasesListClient";

const CASES_LIST = async () => {
    const result = await get_user_transactions(0, 20);
    const user = result?.user;
    const t_list = result?.t_list;

    return (
        <div className="pt-8 pb-10 min-h-screen">
            <div className="w-full flex justify-between px-10 py-4 items-center">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        {user?.verifier ? "Verify Cases" : "List of Cases"}
                    </h1>
                </div>

                <Link
                    href="/media-checker"
                    className="flex items-center gap-2 cursor-pointer text-base font-medium h-fit px-5 py-2.5 rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 transition-all duration-200"
                >
                    New Analysis
                    <PlusCircle strokeWidth={1.5} className="size-5" />
                </Link>
            </div>

            <div className="px-4 flex flex-col gap-3 mt-2">
                <div className="pl-6 pr-2 w-full flex gap-5 items-center py-3.5 bg-primary text-white rounded-2xl font-medium text-sm tracking-wide shadow-sm">
                    <span className="min-w-14">Sno.</span>
                    <span className="min-w-[300px]">File name</span>
                    <span className="min-w-24">Upload Type</span>
                    <span className="min-w-28">Status</span>
                    <span className="min-w-28">Prediction</span>
                    <span className="min-w-72">Analysis Types</span>
                    <span className="min-w-24">Date</span>
                    <span className="min-w-20">Link</span>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
                    <CasesListClient initialData={t_list || []} user={user} />
                </div>
            </div>
        </div>
    )
}

export default CASES_LIST;
