"use client"

import ResultsVideoUI from '@/app/fact-checker/ResultVideoUI';
import ResultsAudioUI from '@/app/fact-checker/ResultAudioUI';
import { useState, useEffect } from 'react';

const Result_container = ({ res_data }) => {
    // console.log(res_data);
    const model_responses = JSON.parse(res_data["models_responses"]);

    const handle_newCheck = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/fact-checker';
        }
    }

    const results_data = {
        "results": {
            ...res_data["results"]
        },
        "analysis_types": {
            "frameCheck": false,
            "audioAnalysis": false
        }
    };
    const verifier_metadata = res_data["verifier_metadata"];
    // AUDIO
    if (verifier_metadata["showAudioCheck"]) {
        results_data["analysis_types"]["audioAnalysis"] = true;

        if (verifier_metadata["AudioCheckModelUse"] !== null)
            results_data["results"]["audioAnalysis"] = model_responses["results"]["audio"]["models_results"][verifier_metadata["AudioCheckModelUse"]];
    }
    else
        results_data["results"]["audioAnalysis"] = undefined;

    // FRAME
    if (verifier_metadata["showFrameCheck"]) {
        results_data["analysis_types"]["frameCheck"] = true;

        if (verifier_metadata["FrameCheckModelUse"] !== null)
            results_data["results"]["frameCheck"] = model_responses["results"]["frame"]["models_results"][verifier_metadata["FrameCheckModelUse"]];
    }
    else
        results_data["results"]["frameCheck"] = undefined;


    // console.log(results_data);

    return (<>
        <div className=' pt-16 pb-10 px-12'>
            {/* VERIFIER COMMENT */}
            {
                res_data["verifier_metadata"]["ShowCommentToUser"] &&
                <div className=' mt-6 py-4 px-3 bg-primary/10 border-2 border-primary/20 rounded-xl'>
                    <span className=' px-3 font-semibold'>
                        Note:
                    </span>
                    {res_data["verifier_metadata"]["verifierComment"]}
                </div>
            }

            {
                res_data["input_request"]["upload_type"] === "video" &&

                <ResultsVideoUI
                    response_data={results_data["results"]}
                    fileUrl={res_data["signedUrl"]}
                    file_metadata={res_data["file_metadata"]}
                    analysisTypes={results_data["analysis_types"]}
                    handle_newCheck={handle_newCheck}
                />
            }
            {
                res_data["input_request"]["upload_type"] === "audio" &&

                <ResultsAudioUI
                    response_data={{
                        "audioAnalysis": model_responses["results"]["audio"][res_data["verifier_metadata"]["AudioCheckModelUse"]],
                    }}
                    fileUrl={res_data["signedUrl"]}
                    file_metadata={res_data["file_metadata"]}
                    handle_newCheck={handle_newCheck}
                />
            }

        </div>
    </>);
}
//
export default Result_container;