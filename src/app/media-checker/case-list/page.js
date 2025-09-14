import Link from "next/link";
import { PlusCircle, Clock, BadgeCheck, ExternalLink, Video, AudioLines, Image } from "lucide-react";
import { Suspense } from "react";
import { get_user_transactions } from "@/utils/cases_functions"

const CASES_LIST = async () => {

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
                        <Cases_Table_Data />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}

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

const Cases_Table_Data = async () => {
    const { user, t_list: user_case_list } = await get_user_transactions();
    // console.log(user_case_list)
    return (
        <>
            {
                (user_case_list && user_case_list.length > 0) ?

                    user_case_list.map((val, idx) => {
                        const time = new Date(val.created_at)
                        const { analysis_types, upload_type } = val.input_request
                        const { name } = val.file_metadata
                        const method = val.method
                        const has_result = typeof(val.prediction) === "boolean" ? true : false
                        // console.log(analysis_types, uploadType)

                        if (method === 'direct') {
                            return (
                                <div key={idx} className=' border-b-2 border-b-gray-200 pl-6 pr-2 w-full flex gap-5 items-center py-3 max-h-28'>
                                    <span className='min-w-14 flex justify-center'>
                                        {idx + 1}
                                    </span>
                                    {/* NAME */}
                                    <span className=' w-[300px] truncate'>
                                        {name ? name : "---"}
                                    </span>
                                    {/* UPLAOD TYPE */}
                                    <span className=' min-w-24 flex items-center gap-2 '>
                                        {/* VIDEO */}
                                        {
                                            upload_type === "video" &&
                                            <Video className='size-6' strokeWidth={1.5} />
                                        }
                                        {/* AUDIO */}
                                        {
                                            upload_type === "audio" &&
                                            <AudioLines className='size-6' strokeWidth={1.5} />
                                        }
                                        {/* IMAGE */}
                                        {
                                            upload_type === "image" &&
                                            <Image className='size-6' strokeWidth={1.5} />
                                        }
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
                                            val.prediction !== null ?
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
                                <div key={idx} className=' border-b-2 border-b-gray-200 pl-6 pr-2 w-full flex gap-5 items-center py-3 max-h-28'>
                                    <span className='min-w-14 flex justify-center'>
                                        {idx + 1}
                                    </span>
                                    {/* NAME */}
                                    <span className=' w-[300px] truncate'>
                                        {name ? name : "---"}
                                    </span>
                                    {/* UPLAOD TYPE */}
                                    <span className=' min-w-24 flex items-center gap-2 '>
                                        {/* VIDEO */}
                                        {
                                            upload_type === "video" &&
                                            <Video className='size-6' strokeWidth={1.5} />
                                        }
                                        {/* AUDIO */}
                                        {
                                            upload_type === "audio" &&
                                            <AudioLines className='size-6' strokeWidth={1.5} />
                                        }
                                        {/* IMAGE */}
                                        {
                                            upload_type === "image" &&
                                            <Image className='size-6' strokeWidth={1.5} />
                                        }
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
                                        {(val.status) ? "Done" : "Pending"}
                                    </span>
                                    <span className=' min-w-28  '>
                                        <div className={`rounded-full ${(val.status || user.verifier) && (val.prediction !== null) ? (val.prediction ? "bg-green-200 border border-green-300" : "bg-red-200 border border-red-300") : ""} w-fit px-5 py-0.5`}>
                                            {(val.status || user.verifier) && (val.prediction !== null) ? (val.prediction ? "Real" : "Fake") : "---"}
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
                                            val.prediction !== null ?
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
                    })

                    :

                    <div className='flex flex-col w-full justify-center items-center'>
                        <div className=' w-full text-center text-2xl font-light pt-16 '>
                            No Cases To Show
                        </div>
                        <Link href={'/media-checker'} className=' mx-auto mt-10 bg-primary w-fit text-slate-200 hover:text-white  rounded-full px-4 py-2 cursor-pointer hover:shadow transition-all '>
                            Create a new case
                        </Link>
                    </div>
            }
        </>
    )
}

export default CASES_LIST;