"use client"

import ResultsVideoUI from '@/components/ResultVideoUI_v1';
import ResultsAudioUI from '@/components/ResultAudioUI';
import ResultsImageUI from '@/components/ResultImageUI';
import Result_UI from '@/components/result_ui_v2';
// import Assets_Show from '@/components/Assets_show'
// import { useState, useEffect } from 'react';

const Result_container = ({ res_data, set_res_data }) => {
    const model_responses = typeof (res_data["models_responses"]) === "string" ? JSON.parse(res_data["models_responses"]) : res_data["models_responses"];
    const upload_type = res_data["input_request"]["upload_type"];

    const handle_newCheck = () => {
        set_res_data({ got_result: false });
    }

    let results_data = {
        "results": {},
        "analysis_types": {
            "frameCheck": false,
            "audioAnalysis": false,
            "aigcCheck": false
        }
    };
    // const verifier_metadata = res_data["verifier_metadata"];
    //IMAGE
    if (upload_type === 'image') {
        results_data["analysis_types"]["aigcCheck"] = true;
        results_data["results"]["aigcCheck"] = model_responses["results"]["image"]["models_results"][0];
    }
    // AUDIO
    else if (upload_type === "audio") {
        results_data["analysis_types"]["audioAnalysis"] = true;
        results_data["results"]["audioAnalysis"] = model_responses["results"]["audio"]["models_results"][0];
    }
    // VIDEO
    else if (upload_type === "video") {
        if (res_data["input_request"]["analysis_types"]["audioAnalysis"]) {
            results_data["analysis_types"]["audioAnalysis"] = true;
            results_data["results"]["audioAnalysis"] = model_responses["results"]["audio"]["models_results"][0];
        }
        if (res_data["input_request"]["analysis_types"]["frameCheck"]) {
            results_data["analysis_types"]["frameCheck"] = true;
            results_data["results"]["frameCheck"] = model_responses["results"]["frame"]["models_results"][0];
            results_data["results"]["face_labels"] = [];
        }
    }

    return (<>
        <div className=' pt-16 pb-10 px-12'>

            {
                upload_type === "video" &&
                (
                    model_responses["version"] && Number(model_responses["version"].split(".")[0]) >= 2 ?
                        <>
                            {/* //NEW RESULT HERE */}
                            <Result_UI
                                results={results_data["results"]}
                                analysisTypes={results_data["analysis_types"]}
                                file_metadata={res_data["file_metadata"]}
                                fileUrl={res_data["signedUrl"]}
                                handle_new_analysis={handle_newCheck}
                            />
                        </>
                        :
                        <ResultsVideoUI
                            response_data={results_data["results"]}
                            fileUrl={res_data["signedUrl"]}
                            file_metadata={res_data["file_metadata"]}
                            analysisTypes={results_data["analysis_types"]}
                            handle_newCheck={handle_newCheck}
                        />
                )
            }
            {
                upload_type === "audio" &&

                <ResultsAudioUI
                    response_data={results_data["results"]}
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
                    analysisTypes={results_data["analysis_types"]}
                    handle_newCheck={handle_newCheck}
                />
            }


        </div>
    </>);
}
//
export default Result_container;