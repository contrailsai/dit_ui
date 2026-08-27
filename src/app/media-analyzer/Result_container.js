"use client"

import ResultsVideoUI from '@/components/ResultVideoUI_v1';
import ResultsAudioUI from '@/components/ResultAudioUI';
import ResultsImageUI from '@/components/ResultImageUI';
import Result_UI from '@/components/result_ui_v2';
import ResultV3 from '@/components/results-v3/ResultV3';
import { getV3EnvelopeFromTransaction } from '@/lib/deepfake-api/envelope';


const Result_container = ({ res_data, set_res_data }) => {
    const model_responses = typeof (res_data["models_responses"]) === "string" ? JSON.parse(res_data["models_responses"]) : res_data["models_responses"];
    const upload_type = res_data["input_request"]["upload_type"];
    const v3Envelope = getV3EnvelopeFromTransaction(res_data);

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

    if (!v3Envelope && upload_type === 'image') {
        results_data["analysis_types"]["aigcCheck"] = true;
        results_data["results"]["aigcCheck"] = model_responses["results"]["image"]["models_results"][0];
    }
    else if (!v3Envelope && upload_type === "audio") {
        results_data["analysis_types"]["audioAnalysis"] = true;
        results_data["results"]["audioAnalysis"] = model_responses["results"]["audio"]["models_results"][0];
    }
    else if (!v3Envelope && upload_type === "video") {
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

    if (v3Envelope) {
        return (
            <ResultV3
                envelope={v3Envelope}
                fileUrl={res_data["signedUrl"]}
                file_metadata={res_data["file_metadata"]}
                handle_newCheck={handle_newCheck}
            />
        );
    }

    return (<>
        <div className=''>

            {
                upload_type === "video" &&
                (
                    model_responses["version"] && Number(model_responses["version"].split(".")[0]) >= 2 ?
                        <>
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

export default Result_container;
