"use client"

import ResultsVideoUI from '@/components/ResultVideoUI';
import ResultsAudioUI from '@/components/ResultAudioUI';
import ResultsImageUI from '@/components/ResultImageUI';
import { useState, useEffect } from 'react';

const Result_container = ({ res_data }) => {
    // console.log(res_data);
    const model_responses = JSON.parse(res_data["models_responses"]);
    const upload_type = res_data["input_request"]["upload_type"];

    const handle_newCheck = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/fact-checker';
        }
    }

    let results_data = {
        "results": { },
        "analysis_types": {
            "frameCheck": false,
            "audioAnalysis": false,
            "aigcCheck": false
        }
    };
    const verifier_metadata = res_data["verifier_metadata"];
    if(upload_type === 'image'){
        //IMAGE
        if (verifier_metadata["showAigcCheck"]) {
            results_data["analysis_types"]["aigcCheck"] = true;

            if (verifier_metadata["AigcCheckModelUse"] !== null)
                results_data["results"]["aigcCheck"] = model_responses["results"]["image"]["models_results"][verifier_metadata["AigcCheckModelUse"]];
        }
        else
            results_data["results"]["aigcCheck"] = undefined;
    }
    else{
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
    }

    if(res_data["verifier_metadata"]["ShowCommentToUser"]){
        res_data["file_metadata"]["verifier_comment"] = res_data["verifier_metadata"]["verifierComment"];
    }

    // console.log(results_data);

    return (<>
        <div className=' pt-16 pb-10 px-12'>

            {
                upload_type === "video" &&

                <ResultsVideoUI
                    response_data={results_data["results"]}
                    fileUrl={res_data["signedUrl"]}
                    file_metadata={res_data["file_metadata"]}
                    analysisTypes={results_data["analysis_types"]}
                    handle_newCheck={handle_newCheck}
                />
            }
            {
                upload_type === "audio" &&

                <ResultsAudioUI
                    response_data={{
                        "audioAnalysis": model_responses["results"]["audio"]["models_results"][res_data["verifier_metadata"]["AudioCheckModelUse"]],
                    }}
                    fileUrl={res_data["signedUrl"]}
                    file_metadata={res_data["file_metadata"]}
                    handle_newCheck={handle_newCheck}
                />
            }
            {
                upload_type === "image" &&

                <ResultsImageUI
                    response_data={results_data["results"]}
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