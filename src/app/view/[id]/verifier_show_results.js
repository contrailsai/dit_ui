"use client"

import ResultsVideoUI from '@/components/ResultVideoUI';
import ResultsAudioUI from '@/components/ResultAudioUI';
import ResultImageUI from '@/components/ResultImageUI';
import { useState, useEffect } from 'react';
import { verify_case } from '@/utils/data_fetch';
import { useParams } from 'next/navigation';

const Verifier_results_container = ({ res_data }) => {

    const { id } = useParams();
    // console.log(res_data);

    /*
        sample model responses
 
        res_data["model_responses"] = {
 
            metadata: {
                frame: {
                    count: 2 //number of models
                    models_info: [
                        {
                            model_name: "FRAME MODEL 1"
                            model_desc: "info about frame model 1 lies here"
                        },
                        {
                            model_name: "FRAME MODEL 2"
                            model_desc: "info about frame model 2 lies here"
                        }
                    ]
                },
                audio: {
                    count: 2 //number of models
                    models_info: [
                        {
                            model_name: "AUDIO MODEL 1"
                            model_desc: "info about frame model 1 lies here"
                        },
                        {
                            model_name: "AUDIO MODEL 2"
                            model_desc: "info about frame model 2 lies here"
                        }
                    ]
                }
            },
            results: {
                frame: {
                    count: 2,
                    models_results: [
                        {
                            model_name: "FRAME MODEL 1",
                            result: 555,
                            table_idx: [],
                            table_val: [],
                            bboxes: [[], []..],
                            empty_idx: []
                        },
                        {
                            model_name: "FRAME MODEL 2",
                            result: 555,
                            table_idx: [],
                            table_val: [],
                            bboxes: [[], []..],
                            empty_idx: []
                        },
                    ]
                },
                audio: {
                    count: 2,
                    models_results: [
                        {
                            model_name: "AUDIO MODEL 1",
                            result: 555,
                            table_idx: [],
                            table_val: []
                        },
                        {
                            model_name: "AUDIO MODEL 2",
                            result: 555,
                            table_idx: [],
                            table_val: []
                        },
                    ]
                }
            }
        }
    */
    const model_responses = JSON.parse(res_data["models_responses"]);
    const upload_type = res_data["input_request"]["upload_type"];
    
    const [verifier_metadata, set_verifier_metadata] = useState(
        res_data["verifier_metadata"] !== null ?
            res_data["verifier_metadata"]
            : {
                "showFrameCheck": false,
                "showAudioCheck": false,
                "showAigcCheck": false,
                "FrameCheckModelUse": 0,
                "AudioCheckModelUse": 0,
                "AigcCheckModelUse": 0,
                "verifierComment": "",
                "ShowCommentToUser": false
            }
    );
    const [data_resultsUI, setdata_resultsUI] = useState(null);

    const handle_newCheck = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/fact-checker';
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        set_verifier_metadata(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : type === 'radio' ? parseInt(value) : value
        }));
    }
    useEffect(() => {
        // console.log(model_responses)

        let results_data = { ...data_resultsUI };
        results_data["results"] = {}
        results_data["analysis_types"] = {
            "frameCheck": false,
            "audioAnalysis": false,
            "aigcCheck": false
        }

        if (upload_type === 'image') {
            if (verifier_metadata["showAigcCheck"]) {
                results_data["analysis_types"]["aigcCheck"] = true;

                if (verifier_metadata["AigcCheckModelUse"] !== null)
                    results_data["results"]["aigcCheck"] = model_responses["results"]["image"]["models_results"][verifier_metadata["AigcCheckModelUse"]];
            }
            else
                results_data["results"]["aigcCheck"] = undefined;
        }
        else {
            // SETUP AUDIO and VIDEO FOR UI
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


        if (verifier_metadata["ShowCommentToUser"]) {
            res_data["file_metadata"]["verifier_comment"] = verifier_metadata["verifierComment"];
        }
        else {
            res_data["file_metadata"]["verifier_comment"] = undefined;
        }

        setdata_resultsUI(results_data);

    }, [verifier_metadata["ShowCommentToUser"], verifier_metadata["AigcCheckModelUse"], verifier_metadata["AudioCheckModelUse"], verifier_metadata["FrameCheckModelUse"], verifier_metadata["showAigcCheck"], verifier_metadata["showAudioCheck"], verifier_metadata["showFrameCheck"],])

    const handle_submit = async () => {
        const res_status = await verify_case(id, verifier_metadata, res_data["user_id"]);
        if (res_status === 0) {
            alert("Case Verified!");
        }
    }

    return (<>
        <div className=' pt-16 pb-10 px-12'>

            {
                res_data["status"] &&
                <div className=' py-4 px-3 bg-primary/10 border-primary/20 border-2 rounded-xl '>
                    <span className=' font-semibold pr-3 text-lg '>
                        Note:
                    </span>
                    This case has been verified once
                </div>
            }

            {/* VERIFIER SETTINGS CHOOSE MODEL */}
            <div className=' pt-6 pb-4 px-4 '>
                <div className='text-3xl pb-4 font-semibold'>
                    Verifier Settings
                </div>
                {/* MODEL CHOOSE OPTIONS HERE */}
                <div className='py-2 flex w-full gap-20 border border-primary rounded-xl '>
                    {/* FRAME MODELS*/}
                    {
                        upload_type !== 'image' && upload_type !== 'audio' && (
                            <>
                                {/* FRAME MODELS */}
                                < div className={`p-4 ${verifier_metadata["showFrameCheck"] ? "" : " opacity-70"}`}>
                                    <div className=' flex items-center gap-3 px-4'>
                                        <input
                                            onChange={handleInputChange}
                                            checked={verifier_metadata["showFrameCheck"]}
                                            className=' size-4' type="checkbox" id="useframe" name="showFrameCheck"
                                        />
                                        <label htmlFor="useframe" className=' text-2xl'>Frame Models</label>
                                    </div>

                                    <div className=' flex flex-col pl-3 gap-2 py-2'>
                                        {
                                            model_responses["metadata"]["frame"]["models_info"].map((val, idx) => {

                                                return (
                                                    <div key={idx} htmlFor={`FM${idx}`} className='bg-primary text-white px-4 py-2 rounded-xl'>
                                                        <div className=' flex items-center '>
                                                            <label className='text-lg font-semibold cursor-pointer pr-3' htmlFor={`FM${idx}`}>{val.model_name}</label>
                                                            <input
                                                                onChange={handleInputChange}
                                                                checked={verifier_metadata["FrameCheckModelUse"] === idx}
                                                                disabled={!verifier_metadata["showFrameCheck"]}
                                                                value={idx} type="radio" name='FrameCheckModelUse' id={`FM${idx}`}
                                                            />
                                                        </div>
                                                        <p className=' font-light'>
                                                            {val.model_desc}
                                                        </p>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                </div>
                            </>
                        )
                    }
                    {/* AUDIO MODELS */}
                    {
                        upload_type !== 'image' && (

                            <div className={`p-4 ${verifier_metadata["showAudioCheck"] ? "" : " opacity-70"}`}>
                                <div className=' flex items-center gap-3 px-4'>
                                    <input
                                        onChange={handleInputChange}
                                        checked={verifier_metadata["showAudioCheck"]}
                                        className=' size-4' type="checkbox" id="useaudio" name="showAudioCheck"
                                    />
                                    <label htmlFor="useaudio" className=' text-2xl'>Audio Models</label>
                                </div>

                                <div className=' flex flex-col pl-3 gap-2 py-2'>
                                    {
                                        model_responses["metadata"]["audio"]["models_info"].map((val, idx) => {

                                            return (
                                                <div key={idx} htmlFor={`AM${idx}`} className='bg-primary text-white px-4 py-2 rounded-xl'>
                                                    <div className=' flex items-center '>
                                                        <label className='text-lg font-semibold cursor-pointer pr-3' htmlFor={`AM${idx}`}>{val.model_name}</label>
                                                        <input
                                                            onChange={handleInputChange}
                                                            checked={verifier_metadata["AudioCheckModelUse"] === idx}
                                                            disabled={!verifier_metadata["showAudioCheck"]}
                                                            value={idx} type="radio" name='AudioCheckModelUse' id={`AM${idx}`}
                                                        />
                                                    </div>
                                                    <p className=' font-light'>
                                                        {val.model_desc}
                                                    </p>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        )
                    }
                    {/* IMAGE MODELS */}
                    {
                        upload_type === 'image' && (
                            <div className={`p-4 ${verifier_metadata["showAigcCheck"] ? "" : " opacity-70"}`}>
                                <div className=' flex items-center gap-3 px-4'>
                                    <input
                                        onChange={handleInputChange}
                                        checked={verifier_metadata["showAigcCheck"]}
                                        className=' size-4' type="checkbox" id="useimage" name="showAigcCheck"
                                    />
                                    <label htmlFor="useaudio" className=' text-2xl'>Image Models</label>
                                </div>

                                <div className=' flex flex-col pl-3 gap-2 py-2'>
                                    {
                                        model_responses["metadata"]["image"]["models_info"].map((val, idx) => {

                                            return (
                                                <div key={idx} htmlFor={`IM${idx}`} className='bg-primary text-white px-4 py-2 rounded-xl'>
                                                    <div className=' flex items-center '>
                                                        <label className='text-lg font-semibold cursor-pointer pr-3' htmlFor={`IM${idx}`}>{val.model_name}</label>
                                                        <input
                                                            onChange={handleInputChange}
                                                            checked={verifier_metadata["AigcCheckModelUse"] === idx}
                                                            disabled={!verifier_metadata["showAigcCheck"]}
                                                            value={idx} type="radio" name='AigcCheckModelUse' id={`IM${idx}`}
                                                        />
                                                    </div>
                                                    <p className=' font-light'>
                                                        {val.model_desc}
                                                    </p>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        )
                    }

                    <div className=' min-w-48 p-4 my-2 ml-auto mr-4 bg-primary h-fit  text-white rounded-2xl'>
                        <div className='text-lg mb-3'>
                            User Input
                        </div>

                        <div className='flex justify-between'>
                            <span className='text-gray-200 font-light'>Media File :</span>
                            {res_data["input_request"]["upload_type"]}
                        </div>

                        <div className='flex justify-between'>
                            <span className='text-gray-200 font-light'>Frame check :</span>
                            {res_data["input_request"]["analysis_types"]["frameCheck"] ? "True" : "False"}
                        </div>
                        <div className='flex justify-between'>
                            <span className='text-gray-200 font-light'>Audio check :</span>
                            {res_data["input_request"]["analysis_types"]["audioAnalysis"] ? "True" : "False"}
                        </div>
                        <div className='flex justify-between'>
                            <span className='text-gray-200 font-light'>Aigc check :</span>
                            {res_data["input_request"]["analysis_types"]["aigcCheck"] ? "True" : "False"}
                        </div>
                    </div>
                </div>
            </div>

            {/* COMMENTS AND SUBMISSION */}
            <div className=' px-4 py-4'>
                <label className=' px-2 ' htmlFor="verifier-comment">Verifier Comments</label>
                <textarea
                    onChange={handleInputChange}
                    value={verifier_metadata["verifierComment"]} id="verifier-comment"
                    name="verifierComment"
                    className=' py-2 px-3 rounded-xl border border-primary/80 outline-1 outline-primary w-full'
                />
                <div className=' flex items-center gap-3 py-4'>
                    <label htmlFor="show-comment-to-user">Show Comment to user </label>
                    <input
                        onChange={handleInputChange}
                        checked={verifier_metadata["ShowCommentToUser"]}
                        className=' size-4' type="checkbox" id="show-comment-to-user"
                        name="ShowCommentToUser"
                    />
                </div>

                <div>
                    <div onClick={() => { handle_submit(); }} className=' cursor-pointer bg-primary px-6 rounded-full text-white py-2 w-fit hover:scale-x-105 transition-all'>
                        Submit verification
                    </div>
                </div>
            </div>

            {
                data_resultsUI !== null &&
                (<>
                    {
                        upload_type === "video" &&

                        <ResultsVideoUI
                            response_data={data_resultsUI["results"]}
                            fileUrl={res_data["signedUrl"]}
                            file_metadata={res_data["file_metadata"]}
                            analysisTypes={data_resultsUI["analysis_types"]}
                            handle_newCheck={handle_newCheck}
                        />
                    }
                    {
                        upload_type === "audio" &&

                        <ResultsAudioUI
                            response_data={data_resultsUI["results"]}
                            fileUrl={res_data["signedUrl"]}
                            file_metadata={res_data["file_metadata"]}
                            handle_newCheck={handle_newCheck}
                        />
                    }
                    {
                        upload_type === "image" &&
                        <ResultImageUI 
                            response_data={data_resultsUI["results"]}
                            fileUrl={res_data["signedUrl"]}
                            file_metadata={res_data["file_metadata"]}
                            analysisTypes={data_resultsUI["analysis_types"]}
                            handle_newCheck={handle_newCheck}
                        />
                    }
                </>)
            }

        </div >
    </>);
}
//
export default Verifier_results_container;