"use client"

// import outfit_font from "Outfit.ttf"
// import ResultsVideoUI from './ResultVideoUI';
// import ResultsAudioUI from './ResultAudioUI';
// import Image from 'next/image';
import Form from './Form';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { redirect } from "next/navigation";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// import generatePDF from 'react-to-pdf';


const VideoAnalysisForm = ({ user }) => {

    const [user_data, set_user_data] = useState(user);
    // const [show_user_options, set_show_user_options] = useState(false);

    //DATA BASED ON FETCH
    const [fileUrl, setfileUrl] = useState(null);
    const [response_data, set_res_data] = useState({});
    const [file_metadata, set_file_metadata] = useState(null);
    const [chosen_analysis, set_chosen_analysis] = useState({});

    // const handle_newCheck = () => {
    //     URL.revokeObjectURL(fileUrl);
    //     setfileUrl(null);
    //     set_res_data({});
    // }

    const handle_cross_message = () => {
        set_res_data({});
    }

    return (
        <div className="min-h-screen">

            <Navbar user_data={user_data} />

            {/* ERROR OCCURED IN GETTING USER */}
            {
                user.error !== undefined &&
                <div className=" min-h-[94vh] flex flex-col mx-20 py-32 items-center ">
                    <div className=" w-full text-2xl bg-red-400 px-3 rounded-t">
                        ERROR:
                    </div>
                    <div className=" bg-red-300 w-full px-3 text-xl pb-3 pt-2 rounded-b ">
                        {user.error}
                        <br />
                        <div className=" text-base pt-3">
                            contact to report this issue
                        </div>
                    </div>
                </div>
            }

            {
                user.error === undefined &&

                < div className=" bg-white  px-10 min-h-[94vh] pt-16 pb-10 ">
                    {
                        !fileUrl &&
                        <>
                            <h2 className=" w-full text-3xl font-semibold px-6 pt-3 py-6">Deepfake Investigator</h2>
                            <Form
                                user_data={user_data}
                                set_user_data={set_user_data}
                                response_data={response_data}
                                set_res_data={set_res_data}
                                fileUrl={fileUrl}
                                setfileUrl={setfileUrl}
                                set_file_metadata={set_file_metadata}
                                set_chosen_analysis={set_chosen_analysis}
                            />
                        </>
                    }
                    {/* SUCCESS RESPONSE PAGE */}
                    {
                        response_data["uploaded"] &&
                        (
                            <div className=' w-full flex flex-col justify-center items-center gap-16 '>

                                <div className=' bg-slate-100 px-10 py-6 w-fit flex flex-col gap-4 items-center justify-center rounded-full aspect-square shadow-inner shadow-primary'>

                                    <span className="">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="size-20">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
                                        </svg>
                                    </span>

                                    <h3 className='text-2xl flex items-center gap-3'>
                                        Case Uploaded Successfully
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                        </svg>

                                    </h3>
                                </div>

                                <div className=' flex flex-col items-center'>
                                    <p>
                                        The results will be available in 1-2 Hours
                                    </p>

                                    {/* BUTTONS FOR CASE LIST/ NEW ANALYSIS */}
                                    <div className=' flex gap-7 items-center mr-1 '>
                                        {/* NEW ANALYSIS */}
                                        <div onClick={() => { set_res_data({}); setfileUrl(null) }} className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-lg shadow-primary shadow'>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            </svg>

                                            New Analysis
                                        </div>

                                        {/* GOTO CASELIST */}
                                        <Link
                                            href={'/user/case-list'}
                                            className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-lg shadow-primary shadow '
                                        >
                                            Goto CaseList
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                            </svg>

                                        </Link>
                                    </div>
                                </div>

                            </div>
                        )
                    }
                </div>

            }

            {/* SHOW ERROR related pop-up messages */}
            {
                response_data.message !== undefined
                &&
                <>
                    {/* MESSAGES (ERRORS) */}
                    <div className=' fixed right-6 bottom-16 z-10 '>

                        <div className=' flex flex-col items-end rounded-lg h-24 w-52 border-2 border-gray-300  bg-white px-3 py-2 '>

                            <svg onClick={handle_cross_message} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className=" absolute cursor-pointer size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>

                            <div className=' w-full flex flex-col gap-2'>
                                <div className=' underline underline-offset-2'>Message:</div>
                                <div>
                                    {response_data.message}
                                </div>
                            </div>
                        </div>

                    </div>
                </>
            }

            <Footer/>
        </div >
    );
};

export default VideoAnalysisForm;
