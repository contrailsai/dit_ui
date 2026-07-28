"use client"

import { useState, useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';
import { get_result_for_id } from '@/utils/cases_functions';

// import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Form from '../media-analyzer/Form';
import Result_container from '../media-analyzer/Result_container';
import Sidebar from '@/components/Sidebar';

const VideoAnalysisForm = ({ user }) => {
    // const [user_data, set_user_data] = useState(user);
    const [response_data, set_res_data] = useState({ got_result: false });
    const [id, set_id] = useState("");

    const get_formatted_result = (data, input) => {

        let formatted_result = {
            "results": {
                "frameCheck": undefined,
                "audioAnalysis": undefined
            },
            "analysis_types": input["analysis_types"]
        }

        formatted_result["results"]["frameCheck"] = data["results"]["frame"]["models_results"][0]
        formatted_result["results"]["audioAnalysis"] = data["results"]["audio"]["models_results"][0]

        return formatted_result;
    }

    useEffect(() => {
        // we have a ID subscribe to its updates for result
        if (id !== '') {
            const supabase = createClient();
            const channel = supabase.channel('schema-db-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'Transactions'
                    },
                    async (payload) => {
                        console.log("an update change in db");
                        console.log("update", payload);

                        let resp = await get_result_for_id(id);
                        let formatted_result = get_formatted_result(JSON.parse(resp.models_responses), resp.input_request);
                        resp.result = formatted_result;
                        resp.got_result = true
                        set_res_data(resp);
                        console.log(await supabase.removeChannel(channel));
                    }
                )
                .subscribe();

            console.log("subscribed to table changes ")

            return () => {
                supabase.removeChannel(channel);
            };
        }

    }, [id])

    const handle_newCheck = () => {
        set_res_data({ got_result: false });
    }

    return (
        <>
            <div className="h-screen">


                {/* ERROR OCCURED IN GETTING USER */}
                {
                    user.error !== undefined &&
                    <div className="min-h-[94vh] flex flex-col mx-20 py-32 items-center">
                        <div className="w-full max-w-2xl text-2xl bg-red-50 text-red-700 border border-red-200 px-5 py-3 rounded-t-3xl font-semibold">
                            ERROR
                        </div>
                        <div className="bg-white w-full max-w-2xl px-5 text-xl pb-5 pt-3 rounded-b-3xl border border-t-0 border-red-200 text-slate-700 shadow-card">
                            {user.error}
                            <br />
                            <div className="text-base pt-3 text-slate-500">
                                Contact support to report this issue
                            </div>
                        </div>
                    </div>
                }
                <div className=' pt-10 pb-10 px-5'>
                    {
                        user.error === undefined &&
                        < div className=" min-h-[95vh] ">
                            {/* SHOW FORM */}
                            {
                                !response_data.got_result &&
                                <>
                                    <div className="px-6 pb-6">
                                        <h2 className="w-full text-3xl font-semibold tracking-tight text-slate-900">
                                            Media Manipulation Detection
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1.5">
                                            Run automated deepfake detection on your media
                                        </p>
                                    </div>
                                    <Form
                                        response_data={response_data}
                                        set_res_data={set_res_data}
                                        set_id={set_id}
                                    />
                                </>
                            }
                            {/* SHOW RESULT */}
                            {
                                response_data.got_result &&
                                <>
                                    <Result_container res_data={response_data} set_res_data={set_res_data} />
                                </>
                            }
                        </div>
                    }
                </div>
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
                <Footer />
            </div >
        </>
    );
};

export default VideoAnalysisForm;
