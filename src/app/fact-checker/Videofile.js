"use client"

import Form from './Form';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DocumentDone, DoneBadgeCircle, PlusCircle, GotoLink, CrossCircle } from '@/components/SVGs';

const VideoAnalysisForm = ({ user }) => {

    const [user_data, set_user_data] = useState(user);

    //DATA BASED ON FETCH
    // const [fileUrl, setfileUrl] = useState(null);
    const [response_data, set_res_data] = useState({});

    return (
        <div className="min-h-screen">

            <Navbar user_data={user_data} />

            {/* ERROR OCCURED IN GETTING USER */}
            {
                user.error !== undefined ?
                    (
                        // ERROR PAGE
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
                    )
                    :
                    (
                        // VIDEO FORM PAGE
                        < div className=" bg-white  px-10 min-h-[94vh] pt-16 pb-10 ">
                            {
                                response_data["uploaded"] ?
                                    // SUCCESS RESPONSE PAGE 
                                        (
                                            <div className=' w-full flex flex-col justify-center items-center gap-16 '>

                                                <div className=' bg-stone-100 px-10 py-6 w-fit flex flex-col gap-4 items-center justify-center rounded-full aspect-square shadow-inner shadow-primary'>

                                                    <span className="">
                                                        <DocumentDone className="size-20" strokeWidth={1} />
                                                    </span>

                                                    <h3 className='text-2xl flex items-center gap-3'>
                                                        Case Uploaded Successfully
                                                        <DoneBadgeCircle className="size-8" strokeWidth={1.5} />
                                                    </h3>
                                                </div>

                                                <div className=' flex flex-col items-center'>
                                                    <p>
                                                        The results will be available in 1-2 Hours
                                                    </p>

                                                    {/* BUTTONS FOR CASE LIST/ NEW ANALYSIS */}
                                                    <div className=' flex gap-7 items-center mr-1 '>
                                                        {/* NEW ANALYSIS */}
                                                        <div onClick={() => { set_res_data({})}} className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-3xl shadow-primary shadow'>
                                                            <PlusCircle className="size-6" strokeWidth={1.5} />
                                                            New Analysis
                                                        </div>

                                                        {/* GOTO CASELIST */}
                                                        <Link
                                                            href={'/user/case-list'}
                                                            className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-3xl shadow-primary shadow '
                                                        >
                                                            Goto CaseList
                                                            <GotoLink className="size-6" strokeWidth={1.5} />
                                                        </Link>
                                                    </div>
                                                </div>

                                            </div>
                                        )
                                    :
                                    (
                                        <>
                                            <h2 className=" w-full text-3xl font-semibold px-6 pt-3 py-6">Deepfake Investigator</h2>
                                            <Form
                                                user_data={user_data}
                                                set_user_data={set_user_data}
                                                set_res_data={set_res_data}
                                            />
                                        </>
                                    )
                            }
                        </div>
                    )
            }

            {/* SHOW ERROR related pop-up messages */}
            {
                response_data.message !== undefined
                &&
                <>
                    {/* MESSAGES (ERRORS) */}
                    <div className=' fixed right-6 bottom-16 z-10 '>

                        <div className=' flex flex-col items-end rounded-lg h-24 w-52 border-2 border-gray-300  bg-white px-3 py-2 '>
                            <div className=' absolute cursor-pointer' onClick={() => { set_res_data({}) }}>
                                <CrossCircle className="size-6" strokeWidth={1.5} />
                            </div>

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

            <Footer />
        </div >
    );
};

export default VideoAnalysisForm;
