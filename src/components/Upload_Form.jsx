"use client"

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { update_user_tokens } from "@/utils/user_functions";
import { Clapperboard, AudioLines, FileImage, UploadCloud, Loader2, Trash2 } from "lucide-react"

// import { PhotoVideo, Waveform, ImageSearch, UploadFile, LoadingCircle, RemoveBin, InfoCircle } from '@/components/SVGs';

const Form = ({ user_data, update_user_data, set_res_data }) => {

    const fileInputRef = useRef(null);

    const [tempfileUrl, set_tempFileUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    // FORM DATA
    const [file, setfile] = useState(null);
    const [analysisTypes, setAnalysisTypes] = useState({
        frameCheck: false,
        audioAnalysis: false,
        aigcCheck: false
    });
    const [uploadType, setUploadType] = useState("");

    //convert data to human filesize for metadata
    const humanFileSize = (bytes, si = true, dp = 2) => {
        const thresh = si ? 1000 : 1024;

        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }

        const units = si
            ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
            : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        let u = -1;
        const r = 10 ** dp;

        do {
            bytes /= thresh;
            ++u;
        } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

        return bytes.toFixed(dp) + ' ' + units[u];
    }

    //''' confirm selected analysis are correct to use '''
    const validate_analysis = (media_type) => {
        console.log(media_type);

        let new_analysis = { ...analysisTypes };

        if (media_type.split("/")[0] === "video") {
            setUploadType("video");
            //ensure unrequired are set false
            new_analysis["aigcCheck"] = false;
        }
        else if (media_type.split("/")[0] === "audio") {
            setUploadType("audio");
            //ensure unrequired are set false
            new_analysis["frameCheck"] = false;
            new_analysis["aigcCheck"] = false;
            setAnalysisTypes(new_analysis);
        }
        else if (media_type.split("/")[0] === "image") {
            setUploadType("image");
            //ensure unrequired are set false
            new_analysis["frameCheck"] = false;
            new_analysis["audioAnalysis"] = false;
        }
        setAnalysisTypes(new_analysis);
    }

    const handleAnalysisTypeChange = (val) => {
        let new_analysis = { ...analysisTypes }
        new_analysis[val] = !new_analysis[val]
        setAnalysisTypes(new_analysis);
    };

    // -------------------->>SUBMIT RESULT FUNCTIONS

    const upload_file_s3 = async () => {
        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input_request: {
                    upload_type: uploadType,
                    analysis_types: analysisTypes,
                },
                file_metadata: {
                    name: file.name,
                    size: humanFileSize(file.size),
                    type: file.type,
                },
                method: "verification",
            }),
        });
        if (!res.ok) throw new Error('Failed to get signed URL');

        const { id, signedUrl, media_key } = await res.json();

        const res_s3 = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
        });
        if (!res_s3.ok) throw new Error('Failed to upload file to S3');

        // Images → Contrails detect API; video/audio → SQS
        const isImage = uploadType === "image" || file.type?.startsWith("image/");
        if (isImage) {
            const detectRes = await fetch('/api/detect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_id: id,
                    media_key,
                    detailed_analysis: true,
                }),
            });
            if (!detectRes.ok) {
                const errBody = await detectRes.json().catch(() => ({}));
                throw new Error(errBody.error || 'Failed to run image detection');
            }
            const { envelope } = await detectRes.json();
            return {
                id,
                media_key,
                isImage: true,
                envelope,
                fileUrl: tempfileUrl,
                file_metadata: {
                    name: file.name,
                    size: humanFileSize(file.size),
                    type: file.type,
                },
                input_request: {
                    upload_type: "image",
                    analysis_types: analysisTypes,
                },
            };
        }

        const res_set_to_queue = await fetch('/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task_id: id,
                method: "verification",
            }),
        });
        if (!res_set_to_queue.ok) throw new Error('Failed to send message to queue');

        return { id, isImage: false };
    }

    const get_server_response = async () => {
        try {
            const user_id = user_data.id;
            const new_token_amount = user_data.tokens - 1;

            const uploadResult = await upload_file_s3();

            const db_update_res = await update_user_tokens(user_id, new_token_amount);
            if (db_update_res.success !== true) {
                set_res_data({ message: db_update_res.error });
                setLoading(false);
                return;
            }

            update_user_data({ tokens: new_token_amount });

            if (uploadResult.isImage && uploadResult.envelope) {
                set_res_data({
                    uploaded: true,
                    got_result: true,
                    id: uploadResult.id,
                    media_key: uploadResult.media_key,
                    signedUrl: uploadResult.fileUrl,
                    file_metadata: uploadResult.file_metadata,
                    input_request: uploadResult.input_request,
                    method: "verification",
                    models_responses: uploadResult.envelope,
                    prediction: uploadResult.envelope.prediction,
                });
            } else {
                set_res_data({ uploaded: true, got_result: false, id: uploadResult.id });
            }
        } catch (error) {
            console.error("Error in sending data", error);
            alert(error.message || "Failed to upload file");
            set_res_data({});
        }
        setLoading(false);
    };

    const handle_submit = (e) => {
        e.preventDefault();
        if (file === null)
            alert("File not uploaded");
        else if (analysisTypes['frameCheck'] === false && analysisTypes["audioAnalysis"] === false && analysisTypes['aigcCheck'] === false)
            alert('please choose atleast one analysis')
        else {
            setLoading(true);
            get_server_response();
        }
    }

    // Form functions (upload file, drop file, change file remove file)
    const handleFileChange = (event) => {
        const newfile = event.target.files[0];
        if (newfile === undefined) {
            setUploadType("")
        }
        // Check file size (50MB = 50 * 1024 * 1024 bytes)
        const maxSize = 50 * 1024 * 1024;
        if (newfile.size > maxSize) {
            alert("File size exceeds 50MB. Please choose a smaller file.");
            setUploadType("");
            setfile(null);
            set_tempFileUrl(null);
            return;
        }

        validate_analysis(newfile.type);
        setfile(newfile);
        set_tempFileUrl(URL.createObjectURL(newfile));
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const droppedFile = event.dataTransfer.files[0];

        const maxSize = 50 * 1024 * 1024;
        if (droppedFile && droppedFile.size > maxSize) {
            alert("File size exceeds 50MB. Please choose a smaller file.");
            setUploadType("");
            setfile(null);
            set_tempFileUrl(null);
            return;
        }

        if (droppedFile && (droppedFile.type.startsWith('video/') || droppedFile.type.startsWith('audio/') || droppedFile.type.startsWith('image/'))) {
            setfile(droppedFile);
            set_tempFileUrl(URL.createObjectURL(droppedFile));
            validate_analysis(droppedFile.type)
            console.log(droppedFile);
        } else {
            alert('Please select a valid video/audio/image file.');
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const removeFile = () => {
        setfile(null);
        set_tempFileUrl(null);
        setUploadType("");
        fileInputRef.current.value = '';
    };

    const analysisCardClass = (selected, hidden = false) =>
        `relative flex flex-col justify-evenly items-center text-primary text-lg font-medium cursor-pointer rounded-2xl w-full bg-white border h-64 px-3 py-2 transition-all duration-200 ${
            hidden ? "hidden" : ""
        } ${
            selected
                ? "border-primary shadow-md shadow-primary/20"
                : "border-slate-200 shadow-sm hover:border-primary/40"
        }`;

    return (
        <form onSubmit={handle_submit} className="flex justify-center gap-6 px-5 h-full transition-all">

            <div className="w-3/5 flex flex-col justify-start gap-4">
                <div className="relative bg-white p-5 h-fit w-full flex flex-col justify-center rounded-3xl border border-slate-200 shadow-card overflow-hidden">
                    {!file && (
                        <label className="block relative z-10 text-slate-800 mb-3 pl-1 text-xl font-semibold">
                            Upload File
                        </label>
                    )}

                    {file ? (
                        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-100">
                            <div className="w-full flex justify-center bg-slate-50">
                                {file.type.startsWith("video/") ? (
                                    <video className="w-full max-h-[70vh]" controls src={tempfileUrl} />
                                ) : file.type.startsWith("audio/") ? (
                                    <audio className="w-full border border-slate-200 rounded-full m-4" controls src={tempfileUrl} />
                                ) : file.type.startsWith("image/") ? (
                                    <Image src={tempfileUrl} height={0} width={625} alt="uploaded_image" />
                                ) : (
                                    <div className="text-xl bg-red-100 text-red-700 px-20 py-3 rounded-2xl my-6">
                                        INVALID FILE UPLOADED
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div
                            className="flex flex-col justify-center items-center gap-3 w-full min-h-[40vh] cursor-pointer border-2 border-dashed border-primary/30 rounded-2xl p-8 bg-slate-50 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <div className="rounded-full bg-white border border-slate-200 p-3 shadow-sm">
                                <UploadCloud className="size-8 text-primary" strokeWidth={1.5} />
                            </div>
                            <p className="text-slate-700 font-medium">Drag and drop a file here, or click to select a file</p>
                            <p className="text-slate-400 text-sm">Max file size: 50MB</p>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        id="videoFile"
                        name="videoFile"
                        accept="video/*, audio/*, image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                <div className="w-full p-4 flex flex-col gap-4 justify-center items-center">
                    {user_data.tokens === 0 && (
                        <div className="text-sm text-red-600 text-center rounded-full bg-red-50 border border-red-100 px-4 py-2">
                            Insufficient credits !! <br /> (contact for more credits)
                        </div>
                    )}

                    <div className="flex items-center gap-6">
                        <button
                            disabled={loading || user_data.tokens == 0}
                            type="submit"
                            className="cursor-pointer disabled:cursor-not-allowed disabled:bg-primary/60 outline-none bg-primary hover:bg-primary/90 shadow-sm text-white font-semibold py-3 px-12 rounded-full w-fit text-lg transition-all duration-200"
                        >
                            Submit
                        </button>

                        {loading && (
                            <div className="flex gap-3 items-center text-slate-600">
                                <span className="text-base">Uploading File</span>
                                <Loader2 className="w-7 h-7 text-primary animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-2/5 flex flex-col justify-start gap-4">
                {file && (
                    <div className="relative rounded-3xl px-5 py-4 border border-slate-200 bg-white shadow-card overflow-hidden">
                        <label className="block text-slate-800 mb-3 pl-1 text-xl font-semibold">Uploaded File</label>
                        <div className="flex flex-col gap-4 items-center justify-between py-1">
                            <div className="flex flex-col gap-2 w-full text-sm">
                                <div className="flex gap-2">
                                    <span className="min-w-24 font-medium text-slate-500">File Name:</span>
                                    <span className="break-all text-slate-800">{file.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="min-w-24 font-medium text-slate-500">File Size:</span>
                                    <span className="text-slate-800">{humanFileSize(file.size)}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeFile}
                                className="cursor-pointer flex gap-2 items-center bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-4 py-2 rounded-full transition-all duration-200"
                            >
                                <Trash2 className="size-5" strokeWidth={2} />
                                Remove
                            </button>
                        </div>
                    </div>
                )}

                <div className="relative rounded-3xl p-5 border border-slate-200 bg-white shadow-card flex flex-col min-h-[40vh]">
                    <label className="block text-slate-800 mb-4 pl-1 text-xl font-semibold">Select Analysis Types</label>

                    {!file ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4 py-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                            <p className="text-slate-600 font-medium">Upload a file to choose analysis types</p>
                            <p className="text-sm text-slate-400">Available options depend on video, audio, or image</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 items-center justify-evenly flex-1">
                            <div className={`${uploadType === "image" ? "hidden" : ""} w-full flex flex-row gap-4 items-center justify-evenly`}>
                                <div
                                    onClick={() => handleAnalysisTypeChange("frameCheck")}
                                    className={analysisCardClass(analysisTypes["frameCheck"], uploadType === "audio")}
                                >
                                    <div className="text-base text-center flex items-center w-full justify-between gap-2">
                                        <div className={`size-6 rounded-full border-2 flex items-center justify-center ${analysisTypes["frameCheck"] ? "border-primary bg-primary" : "border-slate-300 bg-white"}`}>
                                            {analysisTypes["frameCheck"] && <div className="size-2 bg-white rounded-full" />}
                                        </div>
                                        <span className="font-semibold w-full text-slate-800">Video Deepfake</span>
                                    </div>
                                    <Clapperboard
                                        className={`h-28 w-28 ${analysisTypes["frameCheck"] ? "stroke-primary" : "stroke-slate-300"} transition-colors duration-300`}
                                        strokeWidth={1.25}
                                    />
                                </div>

                                <div
                                    onClick={() => handleAnalysisTypeChange("audioAnalysis")}
                                    className={analysisCardClass(analysisTypes["audioAnalysis"])}
                                >
                                    <div className="text-base text-center flex items-center w-full justify-between gap-2">
                                        <div className={`size-6 rounded-full border-2 flex items-center justify-center ${analysisTypes["audioAnalysis"] ? "border-primary bg-primary" : "border-slate-300 bg-white"}`}>
                                            {analysisTypes["audioAnalysis"] && <div className="size-2 bg-white rounded-full" />}
                                        </div>
                                        <span className="font-semibold w-full text-slate-800">Audio Spoof</span>
                                    </div>
                                    <AudioLines
                                        className={`h-28 w-28 ${analysisTypes["audioAnalysis"] ? "stroke-primary" : "stroke-slate-300"} transition-colors duration-300`}
                                        strokeWidth={1.25}
                                    />
                                </div>
                            </div>

                            <div
                                className={`${uploadType === "audio" || uploadType === "video" ? "hidden" : ""} ${analysisCardClass(analysisTypes["aigcCheck"])} !h-auto flex-row py-6`}
                                onClick={() => handleAnalysisTypeChange("aigcCheck")}
                            >
                                <div className="flex flex-col w-full gap-4">
                                    <div className={`size-6 rounded-full border-2 flex items-center justify-center ${analysisTypes["aigcCheck"] ? "border-primary bg-primary" : "border-slate-300 bg-white"}`}>
                                        {analysisTypes["aigcCheck"] && <div className="size-2 bg-white rounded-full" />}
                                    </div>
                                    <span className="font-semibold text-slate-800">Image AIGC</span>
                                </div>
                                <FileImage
                                    className={`h-28 w-28 shrink-0 ${analysisTypes["aigcCheck"] ? "stroke-primary" : "stroke-slate-300"} transition-colors duration-300`}
                                    strokeWidth={1.25}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form>
    )
}

export default Form;