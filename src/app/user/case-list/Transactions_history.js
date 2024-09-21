"use client"
import { useEffect, useState } from 'react';

import { get_user_transactions } from "@/utils/data_fetch"
import Link from 'next/link';

const Transactions_history = ({ verifier }) => {

    const [loading, set_loading] = useState(true);
    const [user_case_list, set_user_case_list] = useState([]);

    useEffect(() => {

        const send_req = async () => {
            const data = await get_user_transactions(verifier);
            set_user_case_list(data);
            set_loading(false);
        };
        send_req()
    }, [])

    return (
        <div className='pt-16 h-[95vh]'>
            <div className=' w-full flex justify-between px-10 items-center '>
                <div className=' text-2xl'>
                    List of pending cases
                </div>
                {/* NEW ANALYSIS */}
                <Link href={'/fact-checker'} className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-3 rounded-lg shadow-primary shadow'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>

                    New Analysis
                </Link>
            </div>


            <div className=' px-4 py-2 grid gap-3 '>
                <div className='pl-6 pr-2 grid grid-cols-12 gap-3 py-2  bg-primary text-slate-200 rounded-full  '>
                    <span>
                        Sno.
                    </span>
                    <span className=' col-span-3'>
                        File name
                    </span>
                    <span className=' col-span-2'>
                        Upload Type
                    </span>
                    <span>
                        Status
                    </span>
                    <span>
                        Prediction
                    </span>
                    <span className=' col-span-2'>
                        Analysis Types
                    </span>
                    <span>
                        Date
                    </span>
                    <span>
                        Link
                    </span>
                </div>
                {
                    loading ?
                        (
                            < div className=' flex flex-col gap-3 px-2'>
                                <div className=' py-3 border-b-2 pl-7 pr-2 gap-3 flex flex-col justify-center px-10 skeleton-l rounded-md ' >
                                    <div className=' h-3 w-32 skeleton-h rounded ' />
                                    <div className=' h-5 w-72 skeleton-h rounded ' />
                                </div>
                                <div className=' py-3 border-b-2 pl-7 pr-2 gap-3 flex flex-col justify-center px-10 skeleton-l rounded-md ' >
                                    <div className=' h-3 w-32 skeleton-h rounded ' />
                                    <div className=' h-5 w-72 skeleton-h rounded ' />
                                </div>
                                <div className=' py-3 border-b-2 pl-7 pr-2 gap-3 flex flex-col justify-center px-10 skeleton-l rounded-md ' >
                                    <div className=' h-3 w-32 skeleton-h rounded ' />
                                    <div className=' h-5 w-72 skeleton-h rounded ' />
                                </div>
                                <div className=' py-3 border-b-2 pl-7 pr-2 gap-3 flex flex-col justify-center px-10 skeleton-l rounded-md ' >
                                    <div className=' h-3 w-32 skeleton-h rounded ' />
                                    <div className=' h-5 w-72 skeleton-h rounded ' />
                                </div>
                            </div>
                        )
                        :
                        (

                            user_case_list && user_case_list.length > 0 ?

                                user_case_list.map((val, idx) => {
                                    const time = new Date(val.created_at)
                                    const { analysis_types, upload_type } = val.input_request
                                    const { name } = val.file_metadata
                                    // console.log(analysis_types, uploadType)

                                    return (
                                        <div key={idx} className=' py-3 border-b-2 pl-7 pr-2 gap-3 grid grid-cols-12 '>
                                            <span>
                                                {idx + 1}
                                            </span>
                                            {/* NAME */}
                                            <span className='col-span-3 overflow-x-auto mr-4'>
                                                {name ? name : "---"}
                                            </span>
                                            {/* UPLAOD TYPE */}
                                            <span className='col-span-2 '>
                                                {upload_type}
                                            </span>
                                            {/* STATUS */}
                                            <span className=''>
                                                {(val.status) ? "Done" : "Pending"}
                                            </span>
                                            <span className={`rounded-full ${(val.status || verifier) && (val.prediction!==null) ? (val.prediction ? "bg-green-200" : "bg-red-200") : ""} w-fit h-fit px-4 py-0.5`}>
                                                {(val.status || verifier)&&(val.prediction!==null) ? (val.prediction ? "Real" : "Fake") : "---"}
                                            </span>
                                            <span className=' col-span-2 flex flex-wrap gap-4'>
                                                {Object.keys(analysis_types).map((input_type, input_idx) => {
                                                    if (analysis_types[input_type])
                                                        return (
                                                            <span key={input_idx} className=' bg-primary/20 rounded-full px-3'>
                                                                {input_type}
                                                            </span>
                                                        )
                                                })}
                                            </span>
                                            <span>
                                                {`${time.getDate()}/${time.getMonth()}/${time.getFullYear()}`}
                                            </span>
                                            <span>
                                                {
                                                    val.prediction!==null ?
                                                    (
                                                        <Link className='underline flex items-center gap-1 ' href={'/view/' + val.id} >
                                                            link
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="size-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                            </svg>
                                                        </Link>
                                                    ):
                                                    "---"
                                                }
                                            </span>
                                        </div>
                                    )
                                })

                                :

                                <>

                                    <div className=' w-full text-center text-2xl font-light pt-16 '>
                                        No Cases To Show
                                    </div>
                                    <Link href={'/fact-checker'} className=' mx-auto mt-10 bg-primary w-fit text-slate-200 hover:text-white  rounded-full px-4 py-2 cursor-pointer hover:shadow transition-all '>
                                        Create a new case
                                    </Link>
                                </>
                        )
                }
            </div>
        </div>
    )
}

export default Transactions_history;