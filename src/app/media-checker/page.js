"use client"
import Form from "@/components/Upload_Form";
import { useUser } from "@/context/UserContext";
import { useState } from "react";
import { BadgeCheck, FileCheck, PlusCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

import DirectAnalysisForm from "@/app/media-checker/File_direct";

export default function FactChecker() {

    const { user, updateUser, setUser } = useUser();

    console.log(user);

    //RESPONSE INDICATOR FOR WHEN TO CHANGE PAGE
    const [response_data, set_res_data] = useState({});

    if (user.user_type !== "direct") {   // for longer media channel cases
        // SCENARIO 1: USER UPLOADS A FILE
        if (!response_data["uploaded"]) {
            return (
                <div className="pt-16">
                    <h2 className=" w-full text-3xl font-semibold px-6 pb-6">Deepfake Investigator</h2>
                    <Form
                        user_data={user}
                        update_user_data={updateUser}
                        set_res_data={set_res_data}
                    />
                </div>
            );
        }

        // SCENARIO 2: SUCCESSFULL UPLOAD PAGE
        if (response_data["uploaded"]) {
            return (
                <div className='pt-24 w-full flex flex-col justify-center items-center animate-in fade-in slide-in-from-bottom-4 duration-500'>

                    {/* --- SUCCESS INDICATOR --- */}
                    <div className='flex flex-col items-center gap-6 text-center mb-10'>

                        {/* Icon Bubble */}
                        <div className='bg-green-50 p-6 rounded-full ring-8 ring-green-50/50'>
                            <FileCheck className="size-12 text-green-600" strokeWidth={1.5} />
                        </div>

                        {/* Headings */}
                        <div className="space-y-2">
                            <h3 className='text-3xl font-semibold tracking-tight text-zinc-900 flex items-center justify-center gap-3'>
                                Case Uploaded Successfully
                                <BadgeCheck className="size-6 text-green-600" strokeWidth={2} />
                            </h3>
                            <p className="text-zinc-500 text-lg font-light">
                                The results will be available in 1-2 Hours
                            </p>
                        </div>
                    </div>

                    {/* --- ACTION BUTTONS --- */}
                    <div className='flex flex-row items-center gap-4'>

                        {/* NEW ANALYSIS: Primary Button (Solid) */}
                        <div
                            onClick={() => { set_res_data({}) }}
                            className='group cursor-pointer flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary hover:shadow-lg hover:shadow-zinc-900/20 transition-all duration-200'
                        >
                            <PlusCircle className="size-5" strokeWidth={2} />
                            <span>New Analysis</span>
                        </div>

                        {/* GOTO CASELIST: Secondary Button (Outline) */}
                        <Link
                            href={'/media-checker/case-list'}
                            className='group cursor-pointer flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-zinc-200 text-zinc-600 text-sm font-medium hover:border-zinc-400 hover:text-zinc-900 transition-all duration-200'
                        >
                            <span>Goto CaseList</span>
                            <ExternalLink className="size-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" strokeWidth={2} />
                        </Link>
                    </div>

                </div>
            )
        }
    }
    else {
        return ( // for direct demos
            <DirectAnalysisForm user={user} />
        )
    }
}
