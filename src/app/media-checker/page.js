"use client"
import Form from "@/components/Upload_Form";
import { useUser } from "@/context/UserContext";
import { useState } from "react";
import { BadgeCheck, FileCheck, PlusCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import ResultV3 from "@/components/results-v3/ResultV3";
import { getV3EnvelopeFromTransaction } from "@/lib/deepfake-api/envelope";

import VideoAnalysisForm from "@/app/media-checker/File_direct";

export default function FactChecker() {
    const { user, updateUser } = useUser();
    const [response_data, set_res_data] = useState({});

    if (user.user_type !== "direct") {
        const v3Envelope = getV3EnvelopeFromTransaction(response_data);

        if (response_data.got_result && v3Envelope) {
            return (
                <div className="pt-6 px-2 pb-16">
                    <ResultV3
                        envelope={v3Envelope}
                        fileUrl={response_data.signedUrl}
                        file_metadata={response_data.file_metadata}
                        handle_newCheck={() => set_res_data({})}
                        newCheckHref="/media-checker"
                    />
                    {response_data.id && (
                        <div className="max-w-5xl mx-auto px-6 -mt-4">
                            <Link
                                href={`/view/${response_data.id}`}
                                className="text-sm text-primary hover:underline"
                            >
                                Open in case view
                            </Link>
                        </div>
                    )}
                </div>
            );
        }

        if (!response_data["uploaded"]) {
            return (
                <div className="pt-12 px-2">
                    <div className="px-6 pb-6">
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                            Deepfake Investigator
                        </h2>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Upload media for expert verification analysis
                        </p>
                    </div>
                    <Form
                        user_data={user}
                        update_user_data={updateUser}
                        set_res_data={set_res_data}
                    />
                </div>
            );
        }

        // Video/audio still async via SQS
        return (
            <div className="pt-20 w-full flex flex-col justify-center items-center gap-10">
                <div className="bg-white px-12 py-10 w-fit flex flex-col gap-4 items-center justify-center rounded-3xl border border-slate-200 shadow-card">
                    <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full p-4">
                        <FileCheck className="size-14" strokeWidth={1.25} />
                    </span>

                    <h3 className="text-2xl flex items-center gap-2.5 font-semibold text-slate-800">
                        Case Uploaded Successfully
                        <BadgeCheck className="size-7 text-emerald-500" strokeWidth={1.5} />
                    </h3>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <p className="text-slate-600">
                        Results will be available in 1–2 hours
                    </p>

                    <div className="flex gap-4 items-center mt-5">
                        <button
                            type="button"
                            onClick={() => set_res_data({})}
                            className="flex items-center gap-2 cursor-pointer text-base font-medium h-fit px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm hover:border-primary/40 hover:text-primary transition-all duration-200"
                        >
                            <PlusCircle className="size-5" strokeWidth={1.5} />
                            New Analysis
                        </button>

                        <Link
                            href="/media-checker/case-list"
                            className="flex items-center gap-2 cursor-pointer text-base font-medium h-fit px-5 py-2.5 rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 transition-all duration-200"
                        >
                            Go to Case List
                            <ExternalLink className="size-5" strokeWidth={1.5} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return <VideoAnalysisForm user={user} />;
}
