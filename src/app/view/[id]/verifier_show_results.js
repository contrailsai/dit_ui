"use client"

import ResultsVideoUI from '@/components/ResultVideoUI_v1';
import ResultsAudioUI from '@/components/ResultAudioUI';
import ResultImageUI from '@/components/ResultImageUI';
import Result_UI from '@/components/result_ui_v2';
import Assets_Upload from '@/components/Assets_Upload';
import { useState, useEffect } from 'react';
import { verify_case } from '@/utils/cases_functions';
import { useParams } from 'next/navigation';
// import { Video, Audio, ImageIcon, PersonCircle } from '@/components/SVGs';
// import { Minus, Plus } from "lucide-react"
// import Image from 'next/image';

import {
    Video, AudioLines as Audio, Image as ImageIcon,
    Minus, Plus, Download, RefreshCcw, CheckCircle2, AlertCircle
} from 'lucide-react'; // Assuming you have lucide-react, or keep your icon imports
import Image from 'next/image';

const SectionHeader = ({ title, sub }) => (
    <div className="mb-4">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h2>
        {sub && <p className="text-sm text-gray-500">{sub}</p>}
    </div>
);

const Verifier_results_container = ({ client_email, res_data, saved_assets }) => {
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

    const model_responses = typeof (res_data["models_responses"]) === "string" ? JSON.parse(res_data["models_responses"]) : res_data["models_responses"];
    const upload_type = res_data["input_request"]["upload_type"];

    const [media_signed_url, set_media_signed_url] = useState(null);

    const [faces, set_faces] = useState({
        "selected": [],
        "removed": []
    })
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
                "ShowCommentToUser": true,
                "face_labels": []
            }
    );
    const [data_resultsUI, setdata_resultsUI] = useState(null);
    //ASSETS UPLOADED BY VERIFIER
    const [assets_uploaded, set_assets_uploaded] = useState([]);

    const handle_newCheck = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/media-checker';
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === "FrameCheckModelUse") {
            // SET THE NEW FACE LABES BASED ON RESULT
            const faces_list = Object.keys(model_responses["results"]["frame"]["models_results"][value]["labels_result"])
            set_faces({
                "selected": faces_list,
                "removed": []
            })
        }

        set_verifier_metadata(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : type === 'radio' ? parseInt(value) : value
        }));
    }

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
        // console.log(model_responses)
        fetchMediaSignedUrl();

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

                if (verifier_metadata["FrameCheckModelUse"] !== null) {
                    results_data["results"]["frameCheck"] = model_responses["results"]["frame"]["models_results"][verifier_metadata["FrameCheckModelUse"]];

                    // WHICH FACES TO SHOW IN RESULT
                    results_data["results"]["face_labels"] = verifier_metadata["face_labels"] !== undefined ? verifier_metadata["face_labels"] : [];
                }
            }
            else
                results_data["results"]["frameCheck"] = undefined;
        }

        if (verifier_metadata["ShowCommentToUser"]) {
            res_data["file_metadata"]["verifier_comment"] = verifier_metadata["verifierComment"];
        }
        else {
            res_data["file_metadata"]["verifier_comment"] = undefzined;
        }

        if (verifier_metadata["showFrameCheck"]) {
            const faces_list = Object.keys(model_responses["results"]["frame"]["models_results"][verifier_metadata["FrameCheckModelUse"]]["labels_result"])
            if (verifier_metadata["face_labels"]) {
                set_faces({
                    "selected": verifier_metadata["face_labels"],
                    "removed": faces_list.filter(val => !verifier_metadata["face_labels"].includes(val))
                })
            }
            else {
                set_faces({
                    "selected": faces_list,
                    "removed": []
                })
            }
        }

        setdata_resultsUI(results_data);

    }, [verifier_metadata])

    const handle_submit = async () => {

        if (assets_uploaded.length !== 0) {
            // creating, uploading assets
            try {
                // create supabase reference elements for assets
                const res = await fetch('/api/create-assets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(
                        {
                            uploaded_assets: assets_uploaded.map((asset) => {
                                return {
                                    "name": asset.name,
                                    "type": asset.type,
                                }
                            }),
                            T_id: id
                        }
                    ),
                });
                if (!res.ok) throw new Error('Failed to get signed URL');
                const assets_response = await res.json();
                // uploading files to their s3 urls
                for (let asset of Object.keys(assets_response)) {
                    const signedUrl = assets_response[asset]["signedUrl"];

                    //find the corresponding asset from uploaded files
                    const required_asset = assets_uploaded.find((obj) => obj.name === assets_response[asset].name && obj.type === assets_response[asset].type);
                    const res_s3 = await fetch(signedUrl, {
                        method: 'PUT',
                        body: required_asset["file"],
                        headers: { 'Content-Type': required_asset["type"] },
                    });
                    if (!res_s3.ok) throw new Error('Failed to upload file to S3');
                    console.log("uploaded a file with id", asset)
                }
            }
            catch (error) {
                console.error('Error uploading file:', error);
                alert('Failed to upload file');
            }
        }
        // assets corresponding to the transaction are ready 

        let prediciton = true; // default to true (real)

        if (data_resultsUI["analysis_types"]["frameCheck"]) {
            let frame_prediciton = data_resultsUI["results"]["frameCheck"]["result"] > data_resultsUI["results"]["frameCheck"]["threshold"];
            prediciton = prediciton && frame_prediciton;
        }
        if (data_resultsUI["analysis_types"]["audioAnalysis"]) {
            let audio_prediciton = data_resultsUI["results"]["audioAnalysis"]["result"] > data_resultsUI["results"]["audioAnalysis"]["threshold"];
            prediciton = prediciton && audio_prediciton;
        }
        if (data_resultsUI["analysis_types"]["aigcCheck"]) {
            let image_prediciton = data_resultsUI["results"]["aigcCheck"]["result"] > data_resultsUI["results"]["aigcCheck"]["threshold"];
            prediciton = prediciton && image_prediciton;
        }

        // verifiying remaining report
        const res_status = await verify_case(id, verifier_metadata, res_data["user_id"], prediciton);
        if (res_status === 0) {
            alert("Case Verified!");
        }
    }

    const handle_rerun_case = async () => {

        const res = await fetch('/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "task_id": id,
                "method": "verification",
            }),
        });
        if (!res.ok)
            alert('Failed to Re-Run the case');
        else
            alert("Sent the case for Re-run")
    }

    const handle_download_media = () => {
        const url = media_signed_url;
        const filename = res_data["file_metadata"]["name"];
        try {
            const encodedUrl = encodeURIComponent(url);
            window.location.href = `/api/download-asset?url=${encodedUrl}&&filename=${filename}`;
        } catch (err) {
            console.error('Download failed:', err);
            setError(err.message);
            setStatus('error');
        }

    }

    // console.log( "SHOW: ", model_responses["results"]["frame"]["models_results"][ verifier_metadata["FrameCheckModelUse"] ]["labels_result"])

    return (
        <div className='min-h-screen bg-gray-50/50 pt-16 pb-20 font-sans text-slate-800'>

            {/* --- NOTIFICATIONS --- */}
            <div className='max-w-7xl mx-auto px-6 mb-6'>
                {res_data["status"] && (
                    <div className='flex items-center gap-3 py-3 px-5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2'>
                        <CheckCircle2 className="size-5" />
                        <div>
                            <span className='font-semibold mr-2'>Note:</span>
                            This case has been verified once
                        </div>
                    </div>
                )}
            </div>

            {/* --- MAIN SETTINGS DASHBOARD --- */}
            <div className='max-w-7xl mx-auto px-6 pb-6 border-b-4 '>
                <div className='bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden'>

                    {/* Header */}
                    <div className='px-8 pt-8 pb-2'>
                        <SectionHeader title="Verifier Settings" sub="Configure models and review analysis parameters." />
                    </div>

                    {/* CONTENT GRID: Models (Left) vs Details (Right) */}
                    <div className='px-8 pb-8 flex flex-col lg:flex-row gap-8'>

                        {/* LEFT COL: MODEL SELECTION */}
                        <div className='flex-1 flex flex-row gap-6'>

                            {/* FRAME MODELS */}
                            {upload_type !== 'image' && upload_type !== 'audio' && (
                                <div className={`transition-all duration-300 ${verifier_metadata["showFrameCheck"] ? "opacity-100" : "opacity-60 grayscale"}`}>
                                    <div className='flex items-center gap-3 mb-3'>
                                        <input
                                            onChange={handleInputChange}
                                            checked={verifier_metadata["showFrameCheck"]}
                                            className='w-5 h-5 accent-primary cursor-pointer'
                                            type="checkbox" id="useframe" name="showFrameCheck"
                                        />
                                        <label htmlFor="useframe" className='text-lg font-medium cursor-pointer select-none'>Frame Models</label>
                                    </div>

                                    <div className='grid gap-3 pl-8'>
                                        {model_responses["metadata"]["frame"]["models_info"].map((val, idx) => (
                                            <div key={idx} className='relative group'>
                                                <input
                                                    onChange={handleInputChange}
                                                    checked={verifier_metadata["FrameCheckModelUse"] === idx}
                                                    disabled={!verifier_metadata["showFrameCheck"]}
                                                    value={idx} type="radio" name='FrameCheckModelUse' id={`FM${idx}`}
                                                    className="peer sr-only"
                                                />
                                                <label
                                                    htmlFor={`FM${idx}`}
                                                    className={`
                                                    block cursor-pointer rounded-xl border p-4 transition-all
                                                    peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary
                                                    hover:border-primary/50 bg-white border-gray-200
                                                `}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-semibold text-sm text-gray-900">{val.model_name}</span>
                                                        {verifier_metadata["FrameCheckModelUse"] === idx && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                    </div>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{val.model_desc}</p>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AUDIO MODELS */}
                            {upload_type !== 'image' && (
                                <div className={`transition-all duration-300 ${verifier_metadata["showAudioCheck"] ? "opacity-100" : "opacity-60 grayscale"}`}>
                                    <div className='flex items-center gap-3 mb-3'>
                                        <input
                                            onChange={handleInputChange}
                                            checked={verifier_metadata["showAudioCheck"]}
                                            className='w-5 h-5 accent-primary cursor-pointer' type="checkbox" id="useaudio" name="showAudioCheck"
                                        />
                                        <label htmlFor="useaudio" className='text-lg font-medium cursor-pointer select-none'>Audio Models</label>
                                    </div>

                                    <div className='grid gap-3 pl-8'>
                                        {model_responses["metadata"]["audio"]["models_info"].map((val, idx) => (
                                            <div key={idx} className='relative'>
                                                <input
                                                    onChange={handleInputChange}
                                                    checked={verifier_metadata["AudioCheckModelUse"] === idx}
                                                    disabled={!verifier_metadata["showAudioCheck"]}
                                                    value={idx} type="radio" name='AudioCheckModelUse' id={`AM${idx}`}
                                                    className="peer sr-only"
                                                />
                                                <label
                                                    htmlFor={`AM${idx}`}
                                                    className={`
                                                    block cursor-pointer rounded-xl border p-4 transition-all
                                                    peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary
                                                    hover:border-primary/50 bg-white border-gray-200
                                                `}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-semibold text-sm text-gray-900">{val.model_name}</span>
                                                        {verifier_metadata["AudioCheckModelUse"] === idx && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                    </div>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{val.model_desc}</p>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* IMAGE MODELS */}
                            {upload_type === 'image' && (
                                <div className={`transition-all duration-300 ${verifier_metadata["showAigcCheck"] ? "opacity-100" : "opacity-60 grayscale"}`}>
                                    <div className='flex items-center gap-3 mb-3'>
                                        <input
                                            onChange={handleInputChange}
                                            checked={verifier_metadata["showAigcCheck"]}
                                            className='w-5 h-5 accent-primary cursor-pointer' type="checkbox" id="useimage" name="showAigcCheck"
                                        />
                                        <label htmlFor="useimage" className='text-lg font-medium cursor-pointer select-none'>Image Models</label>
                                    </div>

                                    <div className='grid gap-3 pl-8'>
                                        {model_responses["metadata"]["image"]["models_info"].map((val, idx) => (
                                            <div key={idx} className='relative'>
                                                <input
                                                    onChange={handleInputChange}
                                                    checked={verifier_metadata["AigcCheckModelUse"] === idx}
                                                    disabled={!verifier_metadata["showAigcCheck"]}
                                                    value={idx} type="radio" name='AigcCheckModelUse' id={`IM${idx}`}
                                                    className="peer sr-only"
                                                />
                                                <label
                                                    htmlFor={`IM${idx}`}
                                                    className={`
                                                    block cursor-pointer rounded-xl border p-4 transition-all
                                                    peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary
                                                    hover:border-primary/50 bg-white border-gray-200
                                                `}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-semibold text-sm text-gray-900">{val.model_name}</span>
                                                        {verifier_metadata["AigcCheckModelUse"] === idx && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                    </div>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{val.model_desc}</p>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COL: CASE DETAILS CARD */}
                        <div className='w-full lg:w-80 flex-shrink-0'>
                            <div className='bg-slate-50 border border-gray-200 rounded-2xl p-5 sticky top-6'>
                                <div className='flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500'>
                                    <div className='w-2 h-2 rounded-full bg-primary'></div>
                                    Case Information
                                </div>

                                <div className='mb-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm'>
                                    <span className='text-xs text-gray-400 block mb-1'>User Email</span>
                                    <span className='text-sm font-medium break-all'>{client_email}</span>
                                </div>

                                <div className='space-y-1 mb-6'>
                                    <div className='text-sm font-medium text-gray-900 px-1 mb-2'>Analysis Request</div>

                                    <div className='flex justify-between items-center p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all'>
                                        <span className='text-xs text-gray-500'>Media Type</span>
                                        <div className='flex items-center gap-2 text-sm font-semibold capitalize text-primary'>
                                            {res_data["input_request"]["upload_type"] === "video" && <Video className="size-4" />}
                                            {res_data["input_request"]["upload_type"] === "audio" && <Audio className="size-4" />}
                                            {res_data["input_request"]["upload_type"] === "image" && <ImageIcon className="size-4" />}
                                            {res_data["input_request"]["upload_type"]}
                                        </div>
                                    </div>
                                    <div className='flex justify-between items-center p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all'>
                                        <span className='text-xs text-gray-500'>Frame Check</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${res_data["input_request"]["analysis_types"]["frameCheck"] ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                                            {res_data["input_request"]["analysis_types"]["frameCheck"] ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <div className='flex justify-between items-center p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all'>
                                        <span className='text-xs text-gray-500'>Audio Check</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${res_data["input_request"]["analysis_types"]["audioAnalysis"] ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                                            {res_data["input_request"]["analysis_types"]["audioAnalysis"] ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <div className='flex justify-between items-center p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all'>
                                        <span className='text-xs text-gray-500'>AIGC Check</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${res_data["input_request"]["analysis_types"]["aigcCheck"] ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                                            {res_data["input_request"]["analysis_types"]["aigcCheck"] ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <button onClick={handle_download_media} className='w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl text-sm font-medium transition-all'>
                                        <Download className="size-4" /> Download Media
                                    </button>
                                    <button onClick={handle_rerun_case} className='w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-medium transition-all'>
                                        <RefreshCcw className="size-4" /> Re-Run Case
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- FACE SELECTION UI --- */}
                    {/* Collapsible Section */}
                    <div className={`border-t border-gray-100 bg-gray-50/50 transition-all duration-300 ease-in-out ${verifier_metadata["showFrameCheck"] ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                        {verifier_metadata["showFrameCheck"] && (
                            <div className='p-8'>
                                <div className='flex justify-between items-end mb-6'>
                                    <div>
                                        <h3 className='text-lg font-semibold text-gray-900'>Face Management</h3>
                                        <p className='text-sm text-gray-500'>Select faces to include or exclude from the report.</p>
                                    </div>

                                    <div className='flex gap-2'>
                                        <button
                                            onClick={() => {
                                                set_verifier_metadata(prevState => ({ ...prevState, ["face_labels"]: faces["selected"] }));
                                            }}
                                            className='px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20'
                                        >
                                            Save for Preview
                                        </button>
                                        <button
                                            onClick={() => {
                                                set_faces(prevState => ({ "selected": [...prevState["selected"], ...prevState["removed"]], "removed": [] }));
                                            }}
                                            className='px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors'
                                        >
                                            Select All
                                        </button>
                                        <button
                                            onClick={() => {
                                                set_faces(prevState => ({ "selected": [], "removed": [...prevState["selected"], ...prevState["removed"]] }));
                                            }}
                                            className='px-4 py-2 bg-white border border-gray-200 text-red-500 text-sm font-medium rounded-full hover:bg-red-50 hover:border-red-100 transition-colors'
                                        >
                                            Remove All
                                        </button>
                                    </div>
                                </div>

                                <div className='flex flex-col md:flex-row gap-6'>
                                    {/* SELECTED FACES */}
                                    <div className='flex-1 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm'>
                                        <div className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-4'>Included Faces</div>
                                        <div className='flex flex-wrap gap-3'>
                                            {Object.entries(model_responses["results"]["frame"]["models_results"][verifier_metadata["FrameCheckModelUse"]]["labels_result"])
                                                .sort((a, b) => (b[1].length - a[1].length))
                                                .filter((val) => faces["selected"].includes(val[0]))
                                                .map((val, idx) => {
                                                    const label_name = val[0];
                                                    const data_pts = val[1].length;
                                                    const img = model_responses["results"]["frame"]["models_results"][verifier_metadata["FrameCheckModelUse"]]["label_faces"]?.[`${label_name}`] || false;

                                                    return (
                                                        <div key={idx} className='relative group w-20 flex flex-col items-center gap-2'>
                                                            <div className='relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-offset-2 ring-emerald-500/30 group-hover:ring-emerald-500 transition-all'>
                                                                {img ? (
                                                                    <Image src={img} fill className='object-cover' alt={`id-${label_name}`} />
                                                                ) : (
                                                                    <div className='w-full h-full bg-slate-100 flex items-center justify-center text-slate-400'>
                                                                        <div className='text-[10px]'>No Img</div>
                                                                    </div>
                                                                )}
                                                                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center'>
                                                                    <button
                                                                        onClick={() => {
                                                                            set_faces(prevState => ({
                                                                                "selected": prevState["selected"].filter((val) => val !== label_name),
                                                                                "removed": [...prevState["removed"], label_name]
                                                                            }));
                                                                        }}
                                                                        className='scale-0 group-hover:scale-100 bg-white text-rose-500 rounded-full p-1 shadow-sm transition-transform'
                                                                    >
                                                                        <Minus className='size-3' strokeWidth={3} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className='text-center'>
                                                                <div className='text-xs font-bold text-slate-700'>ID: {label_name}</div>
                                                                <div className='text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded-md inline-block mt-0.5'>{data_pts} pts</div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </div>

                                    {/* REMOVED FACES */}
                                    <div className='flex-1 bg-slate-50 rounded-2xl p-5 border border-gray-200 border-dashed'>
                                        <div className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-4'>Excluded Faces</div>
                                        <div className='flex flex-wrap gap-3'>
                                            {Object.entries(model_responses["results"]["frame"]["models_results"][verifier_metadata["FrameCheckModelUse"]]["labels_result"])
                                                .sort((a, b) => (b[1].length - a[1].length))
                                                .filter((val) => faces["removed"].includes(val[0]))
                                                .map((val, idx) => {
                                                    const label_name = val[0];
                                                    const data_pts = val[1].length;
                                                    const img = model_responses["results"]["frame"]["models_results"][verifier_metadata["FrameCheckModelUse"]]["label_faces"]?.[`${label_name}`] || false;

                                                    return (
                                                        <div key={idx} className='relative group w-20 flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity'>
                                                            <div className='relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-offset-2 ring-gray-300 group-hover:ring-primary transition-all grayscale group-hover:grayscale-0'>
                                                                {img ? (
                                                                    <Image src={img} fill className='object-cover' alt={`id-${label_name}`} />
                                                                ) : (
                                                                    <div className='w-full h-full bg-slate-200'></div>
                                                                )}
                                                                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center'>
                                                                    <button
                                                                        onClick={() => {
                                                                            set_faces(prevState => ({
                                                                                "selected": [...prevState["selected"], label_name],
                                                                                "removed": prevState["removed"].filter((val) => val !== label_name),
                                                                            }));
                                                                        }}
                                                                        className='scale-0 group-hover:scale-100 bg-primary text-white rounded-full p-1 shadow-sm transition-transform'
                                                                    >
                                                                        <Plus className='size-3' strokeWidth={3} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className='text-center'>
                                                                <div className='text-xs font-bold text-slate-700'>ID: {label_name}</div>
                                                                <div className='text-[10px] text-slate-400'>{data_pts} pts</div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- FOOTER: COMMENTS & ASSETS --- */}
                    <div className='px-8 py-8 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-8'>
                        {/* COMMENTS */}
                        <div className='flex-1 min-w-[300px]'>
                            <div className='relative group'>
                                <label className='block text-sm font-medium text-gray-700 mb-2' htmlFor="verifier-comment">
                                    Verifier Comments
                                </label>
                                <textarea
                                    onChange={handleInputChange}
                                    value={verifier_metadata["verifierComment"]}
                                    id="verifier-comment"
                                    name="verifierComment"
                                    rows={5}
                                    placeholder='Enter your analysis notes here...'
                                    className='w-full p-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-sm text-sm'
                                />
                            </div>

                            <div className='flex items-center justify-between mt-4'>
                                <div className='flex items-center gap-2'>
                                    <input
                                        onChange={handleInputChange}
                                        checked={verifier_metadata["ShowCommentToUser"]}
                                        className='w-4 h-4 accent-primary rounded cursor-pointer'
                                        type="checkbox" id="show-comment-to-user"
                                        name="ShowCommentToUser"
                                    />
                                    <label htmlFor="show-comment-to-user" className='text-sm text-gray-600 select-none cursor-pointer'>Visible to user</label>
                                </div>

                                <button
                                    onClick={handle_submit}
                                    className='bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all'
                                >
                                    Submit Verification
                                </button>
                            </div>
                        </div>

                        {/* ASSETS */}
                        <div className='flex-1'>
                            {/* Passed component logic remains same, just wrapped container style */}
                            <div className="bg-white rounded-xl border border-gray-200 p-1 h-full shadow-sm">
                                <Assets_Upload SavedAssets={saved_assets} CurrAssets={assets_uploaded} SetCurrAssets={set_assets_uploaded} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PREVIEW SECTION --- */}
            {data_resultsUI !== null && (
                <div className='max-w-7xl mx-auto px-6 mt-8'>

                    <div className="mt-6">
                        {upload_type === "video" && (
                            model_responses["version"] && Number(model_responses["version"].split(".")[0]) >= 2 ?
                                <Result_UI
                                    results={data_resultsUI["results"]}
                                    analysisTypes={data_resultsUI["analysis_types"]}
                                    file_metadata={res_data["file_metadata"]}
                                    fileUrl={media_signed_url}
                                />
                                :
                                <ResultsVideoUI
                                    response_data={data_resultsUI["results"]}
                                    fileUrl={media_signed_url}
                                    file_metadata={res_data["file_metadata"]}
                                    analysisTypes={data_resultsUI["analysis_types"]}
                                    handle_newCheck={handle_newCheck}
                                />
                        )}
                        {upload_type === "audio" && (
                            <ResultsAudioUI
                                response_data={data_resultsUI["results"]}
                                fileUrl={media_signed_url}
                                file_metadata={res_data["file_metadata"]}
                                handle_newCheck={handle_newCheck}
                            />
                        )}
                        {upload_type === "image" && (
                            <ResultImageUI
                                response_data={data_resultsUI["results"]}
                                fileUrl={media_signed_url}
                                file_metadata={res_data["file_metadata"]}
                                analysisTypes={data_resultsUI["analysis_types"]}
                                handle_newCheck={handle_newCheck}
                            />
                        )}
                    </div>
                </div>

            )}
        </div>
    );
}
//
export default Verifier_results_container;