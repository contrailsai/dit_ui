"use client"
import Form from "@/components/Upload_Form";
import { useUser } from "@/context/UserContext";
import { useState } from "react";
import { BadgeCheck, FileCheck, PlusCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

import VideoAnalysisForm from "@/app/media-analyzer/Videofile";

export default function FactChecker() {
    
    const { user, updateUser, setUser } = useUser();

    console.log(user);

    //RESPONSE INDICATOR FOR WHEN TO CHANGE PAGE
    const [response_data, set_res_data] = useState({});

    if (user.user_type !== "direct"){
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
                <div className=' pt-16 w-full flex flex-col justify-center items-center gap-16 '>
    
                    <div className=' bg-slate-100 px-10 py-6 w-fit flex flex-col gap-4 items-center justify-center rounded-full aspect-square shadow-inner shadow-primary'>
    
                        <span className="">
                            <FileCheck className="size-20" strokeWidth={1} />
                        </span>
    
                        <h3 className='text-2xl flex items-center gap-3'>
                            Case Uploaded Successfully
                            <BadgeCheck className="size-8" strokeWidth={1.5} />
                        </h3>
                    </div>
    
                    <div className=' flex flex-col items-center'>
                        <p>
                            The results will be available in 1-2 Hours
                        </p>
    
                        {/* BUTTONS FOR CASE LIST/ NEW ANALYSIS */}
                        <div className=' flex gap-7 items-center mr-1 '>
                            {/* NEW ANALYSIS */}
                            <div onClick={() => { set_res_data({}) }} className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-3xl shadow-primary shadow'>
                                <PlusCircle className="size-6" strokeWidth={1.5} />
                                New Analysis
                            </div>
    
                            {/* GOTO CASELIST */}
                            <Link
                                href={'/user/case-list'}
                                className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-3xl shadow-primary shadow '
                            >
                                Goto CaseList
                                <ExternalLink className="size-6" strokeWidth={1.5} />
                            </Link>
                        </div>
                    </div>
    
                </div>
            )
        }
    }
    else{
        return (
            <VideoAnalysisForm user={user} />
        )
    }
}
