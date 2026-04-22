import Link from "next/link";
import { PlusCircle, Clock, BadgeCheck, ExternalLink, Video, AudioLines, Image } from "lucide-react";
import { Suspense } from "react";
import { get_user_transactions } from "@/utils/cases_functions"
import CasesListClient from "./CasesListClient";

const CASES_LIST = async () => {

    const { user, t_list } = await get_user_transactions(0, 20);

    return (
        <div className='pt-10 overflow-hidden '>
            <div className=' w-full flex justify-between px-10 py-3 items-center '>
                <div className=' text-3xl font-semibold'>
                    List of Cases
                </div>

                {/* NEW ANALYSIS */}
                <Link href={'/media-checker'} className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 rounded-3xl shadow-primary shadow'>
                    New Analysis
                    <PlusCircle strokeWidth={1.5} className={'size-6'} />
                </Link>
            </div>

            <div className=' px-4 flex flex-col gap-3 '>
                <div className='pl-6 pr-2 w-full flex gap-5 items-center  py-3 bg-primary text-white rounded-full font-semibold  '>
                    <span className='min-w-14 '>
                        Sno.
                    </span>
                    <span className='min-w-[300px] '>
                        File name
                    </span>
                    <span className=' min-w-24 '>
                        Upload Type
                    </span>
                    <span className=' min-w-28'>
                        Status
                    </span>
                    <span className=' min-w-28 '>
                        Prediction
                    </span>
                    <span className=' min-w-72 '>
                        Analysis Types
                    </span>
                    <span className=' min-w-24 '>
                        Date
                    </span>
                    <span className=' min-w-20 '>
                        Link
                    </span>
                </div>
                <div className=''>
                    <Suspense fallback={<Loading_Skeleton />}>
                        <CasesListClient initialData={t_list || []} user={user} />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}

export default CASES_LIST;

const Loading_Skeleton = () => {
    return (
        < div className=' flex flex-col gap-5 px-2'>
            <div className=' border-b-2 border-b-gray-200 pl-6 pr-2 w-full flex gap-5 items-center py-3 max-h-28  '>
                <span className='min-w-14  h-5 skeleton-h rounded-full' />
                <span className=' w-[300px] h-5 skeleton-h rounded-full' />
                <span className=' min-w-24  h-5 skeleton-h rounded-full' />
                <span className=' min-w-28 h-5 skeleton-h rounded-full' />
                <span className=' min-w-28 h-5 skeleton-h rounded-full' />
                <span className=' w-72  h-5 skeleton-h rounded-full' />
                <span className='min-w-24 h-5 skeleton-h rounded-full' />
                <span className='min-w-20 h-5 skeleton-h rounded-full' />
            </div>
            <div className=' border-b-2 border-b-gray-200 pl-6 pr-2 w-full flex gap-5 items-center py-3 max-h-28  '>
                <span className='min-w-14  h-5 skeleton-h rounded-full' />
                <span className=' w-[300px] h-5 skeleton-h rounded-full' />
                <span className=' min-w-24  h-5 skeleton-h rounded-full' />
                <span className=' min-w-28 h-5 skeleton-h rounded-full' />
                <span className=' min-w-28 h-5 skeleton-h rounded-full ' />
                <span className=' w-72  h-5 skeleton-h rounded-full ' />
                <span className='min-w-24 h-5 skeleton-h rounded-full' />
                <span className='min-w-20 h-5 skeleton-h rounded-full ' />
            </div>
            <div className=' border-b-2 border-b-gray-200 pl-6 pr-2 w-full flex gap-5 items-center py-3 max-h-28  '>
                <span className='min-w-14  h-5 skeleton-h rounded-full' />
                <span className=' w-[300px] h-5 skeleton-h rounded-full' />
                <span className=' min-w-24  h-5 skeleton-h rounded-full' />
                <span className=' min-w-28 h-5 skeleton-h rounded-full' />
                <span className=' min-w-28 h-5 skeleton-h rounded-full ' />
                <span className=' w-72  h-5 skeleton-h rounded-full ' />
                <span className='min-w-24 h-5 skeleton-h rounded-full' />
                <span className='min-w-20 h-5 skeleton-h  rounded-full' />
            </div>
            <div className=' border-b-2 border-b-gray-200 pl-6 pr-2 w-full flex gap-5 items-center py-3 max-h-28  '>
                <span className='min-w-14  h-5 skeleton-h rounded-full' />
                <span className=' w-[300px] h-5 skeleton-h rounded-full' />
                <span className=' min-w-24  h-5 skeleton-h rounded-full' />
                <span className=' min-w-28 h-5 skeleton-h rounded-full' />
                <span className=' min-w-28 h-5 skeleton-h rounded-full ' />
                <span className=' w-72  h-5 skeleton-h rounded-full ' />
                <span className='min-w-24 h-5 skeleton-h rounded-full' />
                <span className='min-w-20 h-5 skeleton-h  rounded-full' />
            </div>
        </div>
    )
}

