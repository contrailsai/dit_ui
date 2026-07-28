// import LineChart from './LineChart';
import React, { useState, useRef, useEffect } from 'react';
// import Image from 'next/image';

import { PlusCircle, DownloadFile, LoadingCircle } from './SVGs';
import { video_pdf } from "./pdf_creation";

const ResultsImageUI = ({ response_data, fileUrl, file_metadata, analysisTypes, handle_newCheck }) => {

    // console.log(response_data, fileUrl, file_metadata, analysisTypes, handle_newCheck)
    const result_ref = useRef(null);
    const [taking_ss, set_taking_ss] = useState(false);

    const handle_pdf_creation = async () => {
        if (resultValues) {
            await video_pdf(
                analysisTypes,
                response_data,
                resultValues,
                file_metadata,
                { current: null },
                [],
                fileUrl
            );
        }
    }

    // console.log(response_data, analysisTypes)

    if (Object.keys(response_data).length > 0 && response_data["message"] === undefined) {
        // console.log(response_data);
        return (
            <>
                {/* TITLE */}
                <div className=' flex w-full justify-between items-end'>
                <h2 className="text-3xl font-semibold px-5 pt-3 py-6">Deepfake Investigator</h2>
                {
                        fileUrl &&
                        <div className=' flex gap-7 items-center mr-1 '>
                            {/* NEW ANALYSIS */}
                            <div onClick={handle_newCheck} className=' flex items-center gap-2 cursor-pointer text-lg font-medium h-fit px-5 py-2.5 my-6 rounded-full bg-white border border-slate-200 shadow-sm hover:border-primary/40 hover:text-primary transition-all'>
                                <PlusCircle className='size-6' strokeWidth={1.5} />
                                New Analysis
                            </div>

                            {/* PDF EXPORT */}
                            <div
                                onClick={handle_pdf_creation}
                                className=' flex items-center gap-2 cursor-pointer text-lg font-medium h-fit px-5 py-2.5 my-6 rounded-full bg-white border border-slate-200 shadow-sm hover:border-primary/40 hover:text-primary transition-all '
                            >
                                Export Report
                                <DownloadFile className='size-6' strokeWidth={1.5} />
                            </div>
                        </div>
                    }
                </div>

                {/* ANALYSIS */}
                <div className=" relative w-full flex flex-col lg:gap-3 items-center bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-card ">

                    <div className={` ${taking_ss ? '' : 'hidden'} absolute z-20 w-full h-full bg-slate-900 text-white `}>

                        <div className=' flex flex-col justify-center items-center gap-4 text-2xl my-40 '>
                            <div role="status">
                                <LoadingCircle className="w-8 h-8 text-white/30 animate-spin fill-white"/>
                            </div>
                            CREATING PDF
                        </div>

                    </div>

                    {/*  */}
                    <div ref={result_ref} className=' flex gap-10 justify-between px-8 items-end relative pt-10 w-full '>

                        {/* RESULT TEXT + RESULT BOX  */}
                        <div className=' w-full max-w-[40vw] flex flex-col h-[60vh] gap-10 '>
                            {/* MANIPULATION CHECK STATEMENT */}
                            {
                                response_data["aigcCheck"] !== undefined &&
                                (<>
                                    {
                                        response_data["aigcCheck"].result.toFixed(2) >= response_data["aigcCheck"].threshold ?
                                            (
                                                <div className='flex gap-3 items-center text-2xl w-full justify-center '>
                                                    <span className='font-medium bg-green-200 px-5 py-1 rounded-full w-fit'>No manipulation detected</span>
                                                    in <span className='font-medium'>Image</span>
                                                </div>
                                            )
                                            :
                                            (
                                                <div className='flex gap-3 items-center text-2xl w-full justify-center '>
                                                    <span className='font-medium bg-red-200 px-5 py-1 rounded-full w-fit'>Manipulation detected</span>
                                                    in <span className='font-medium'>Image</span>
                                                </div>
                                            )
                                    }
                                </>)
                            }
                            {/* RESULT BOX */}
                            <div className=' flex justify-evenly items-center py-4 w-full gap-4'>
                                {
                                    // result of all analysis
                                    Object.keys(response_data).map((val, idx) => {
                                        if (response_data[val] == undefined)
                                            return

                                        let pred = response_data[val].result > response_data[val].threshold;
                                        let perc = (response_data[val].result * 100).toFixed(2);
                                        return (
                                            <div key={idx} className={`  bg-white flex flex-col items-center gap-3 py-5 rounded-3xl shadow ${pred ? " shadow-green-700" : " shadow-red-700"}  `}>
                                                <span className=' text-xl flex gap-2'>
                                                    {
                                                        val === "aigcCheck" &&
                                                        (
                                                            <>
                                                                <span className=' '>
                                                                    Result:
                                                                </span>
                                                                <span className={` text-xl px-6 w-full text-center font-semibold ${pred ? " text-green-700" : "text-red-700"}`}>
                                                                    {pred ? "Real" : "Fake"}
                                                                </span>
                                                            </>
                                                        )
                                                    }
                                                </span>
                                                <div className=' text-xl flex items-center justify-center w-full gap-2'>
                                                    <span>
                                                        Score:
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full  font-semibold ${pred ? " bg-green-200  text-green-700" : " bg-red-200  text-red-700"}`}>
                                                        {perc} %
                                                    </span>
                                                </div>
                                                <div className="relative left-0 top-0 h-3 my-3 ml-16 w-[336px] " >
                                                    <input
                                                        type="range"
                                                        className={`result-seperate-slider absolute w-[268px] outline-none transition-all duration-300 cursor-default`}
                                                        min="0"
                                                        max="100"
                                                        value={perc}
                                                        readOnly
                                                    />
                                                </div>
                                                <span className=' text-xs'>
                                                    confidence on real
                                                </span>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>

                        {/* Image */}
                        <div className='relative w-full'>
                            <img
                                src={fileUrl}
                                className=" w-fit max-w-3xl h-[60vh] "
                            />
                        </div>
                    </div>

                </div>

                <div className=' flex pt-4 items-start px-8 gap-10'>

                    {/* VERIFIER COMMENT */}
                    {
                        file_metadata.verifier_comment &&
                        (
                            <div className=' bg-white py-4 px-5 border border-slate-200 rounded-3xl w-fit min-w-[40vw] flex flex-col gap-4 shadow-card transition-all duration-300'>
                                <span className=' text-xl'>
                                    Expert&apos;s Note
                                </span>
                                <div className='flex flex-col break-words whitespace-pre-wrap'>
                                    {file_metadata.verifier_comment}
                                </div>
                            </div>
                        )
                    }

                    {/* VIDEO META DATA */}
                    <div className=' bg-white py-4 px-5 border border-slate-200 rounded-3xl w-fit min-w-[40vw] flex flex-col gap-4 shadow-card transition-all duration-300'>
                        <span className=' text-xl'>
                            Video Metadata
                        </span>
                        <div className='flex flex-col break-words'>
                            {/* <div>
                                <span className=' font-medium pr-2' >Last Modified: </span>
                                <span>{file_metadata.lastModifiedDate.toDateString()}</span>
                            </div> */}
                            <div>
                                <span className=' font-medium pr-2' >FileName: </span>
                                <span>{file_metadata.name}</span>
                            </div>
                            <div>
                                <span className=' font-medium pr-2' > Size: </span>
                                <span>{file_metadata.size}</span>
                            </div>
                            <div>
                                <span className=' font-medium pr-2' >Video type: </span>
                                <span>{file_metadata.type}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </>
        )
    }
    else {
        console.log(response_data);
        return (<>
            <div className='flex flex-col px-24 py-16'>
                <div className='text-xl bg-red-500 px-10 py-2 rounded-full text-red-100' >ERROR OCCURED</div>
                <div className='text-lg bg-red-800 text-white px-10 py-2' >{response_data["message"]}</div>
            </div>
        </>)
    }
}

export default ResultsImageUI;