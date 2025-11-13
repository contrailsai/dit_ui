"use client"

import ResultsVideoUI from '@/components/ResultVideoUI_v1';
import ResultsAudioUI from '@/components/ResultAudioUI';
import ResultsImageUI from '@/components/ResultImageUI';
import Result_UI from '@/components/result_ui_v2';
import Assets_Show from '@/components/Assets_show'
import { useState, useEffect } from 'react';

const Result_container = ({ res_data, assets }) => {
    const model_responses = typeof (res_data["models_responses"]) === "string" ? JSON.parse(res_data["models_responses"]) : res_data["models_responses"];
    const upload_type = res_data["input_request"]["upload_type"];

    const handle_newCheck = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/media-checker';
        }
    }

    let results_data = {
        "results": {},
        "analysis_types": {
            "frameCheck": false,
            "audioAnalysis": false,
            "aigcCheck": false
        }
    };

    // console.log( Object.keys(res_data["models_responses"]))

    if (res_data["method"] === "direct") {
        const analysis_types = res_data["input_request"]["analysis_types"];
        results_data["analysis_types"] = analysis_types;

        // IMAGE
        if (analysis_types["aigcCheck"])
            results_data["results"]["aigcCheck"] = model_responses["results"]["image"]["models_results"][0];
        // AUDIO    
        if (analysis_types["audioAnalysis"])
            results_data["results"]["audioAnalysis"] = model_responses["results"]["audio"]["models_results"][0];
        // FRAME
        if (analysis_types["frameCheck"]) {
            results_data["results"]["frameCheck"] = model_responses["results"]["frame"]["models_results"][0];
            results_data["results"]["face_labels"] = [];
        }
    }

    // VERIFIED RESULTS
    else {
        const verifier_metadata = res_data["verifier_metadata"];

        if (upload_type === 'image') {
            //IMAGE
            if (verifier_metadata["showAigcCheck"]) {
                results_data["analysis_types"]["aigcCheck"] = true;

                if (verifier_metadata["AigcCheckModelUse"] !== null)
                    results_data["results"]["aigcCheck"] = model_responses["results"]["image"]["models_results"][verifier_metadata["AigcCheckModelUse"]];
            }
            else
                results_data["results"]["aigcCheck"] = undefined;
        }
        else {
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

                // WHICH FACES TO SHOW IN RESULT (empty for no face)
                results_data["results"]["face_labels"] = verifier_metadata["face_labels"] !== undefined ? verifier_metadata["face_labels"] : [];
            }
            else
                results_data["results"]["frameCheck"] = undefined;
        }
        if (res_data["verifier_metadata"]["ShowCommentToUser"]) {
            res_data["file_metadata"]["verifier_comment"] = res_data["verifier_metadata"]["verifierComment"];
        }
    }

    const [media_signed_url, set_media_signed_url] = useState(null);

    const fetchMediaSignedUrl = async () => {
        try {
            const response = await fetch('/api/media-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ media_key: res_data["media_key"] }),
            });

            if (!response.ok) {
                throw new Error('Failed to get signed URL');
            }

            const data = await response.json();
            set_media_signed_url(data.signed_url);
            // Optional: Automatically trigger the download
            // window.location.href = data.signed_url; 

        } catch (error) {
            console.error('Error:', error);
            // Handle error in UI
        }
    };

    useEffect(() => {
        fetchMediaSignedUrl();
    }, []);


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
                                fileUrl={media_signed_url}
                            />
                        </>
                        :
                        <ResultsVideoUI
                            response_data={results_data["results"]}
                            fileUrl={media_signed_url}
                            file_metadata={res_data["file_metadata"]}
                            analysisTypes={results_data["analysis_types"]}
                            handle_newCheck={handle_newCheck}
                        />
                )
            }
            {
                upload_type === "audio" &&

                <ResultsAudioUI
                    response_data={{
                        "audioAnalysis": model_responses["results"]["audio"]["models_results"][res_data["verifier_metadata"]["AudioCheckModelUse"]],
                    }}
                    fileUrl={media_signed_url}
                    file_metadata={res_data["file_metadata"]}
                    handle_newCheck={handle_newCheck}
                />
            }
            {
                upload_type === "image" &&

                <ResultsImageUI
                    response_data={results_data["results"]}
                    fileUrl={media_signed_url}
                    file_metadata={res_data["file_metadata"]}
                    handle_newCheck={handle_newCheck}
                />
            }

            {
                assets.length !== 0 &&
                <div className=' w-full flex justify-center py-5 '>
                    <Assets_Show CurrAssets={assets} />
                </div>
            }

        </div>
    </>);
}
//
export default Result_container;