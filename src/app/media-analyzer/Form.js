import React, { useState, useRef } from 'react';
import Image from 'next/image';

import { FileUp, Check, Clapperboard, AudioLines, ImageIcon, X, Loader2 } from "lucide-react";

const Form = ({ response_data, set_res_data, set_id }) => {

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

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    {
                        input_request: {
                            'upload_type': uploadType,
                            'analysis_types': analysisTypes
                        },
                        file_metadata: {
                            name: file.name,
                            size: humanFileSize(file.size),
                            type: file.type
                        },
                        method: "direct"
                    }
                ),
            });
            if (!res.ok) throw new Error('Failed to get signed URL');

            const { id, signedUrl } = await res.json();

            const res_s3 = await fetch(signedUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });
            if (!res_s3.ok) throw new Error('Failed to upload file to S3');


            const res_set_to_queue = await fetch('/api/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    {
                        task_id: id,
                        method: "direct"
                    }
                ),
            });
            if (!res_set_to_queue.ok) throw new Error('Failed to send message to queue');

            alert('File Uploaded');
            return id;

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        }
    }

    const get_server_response = async () => {
        //Form Submittion
        try {

            // 1. create a db element
            // 2. upload file to s3
            // 3. send message to queue
            const supabase_id = await upload_file_s3();

            let res_data = {
                "uploaded": true,
                "got_result": false,
            };

            // update db with new token amount
            // const db_update_res = await db_updates({ new_token_amount, user_id });
            // if (db_update_res !== null) {
            //     res_data = { message: db_update_res.error };
            //     set_res_data(res_data);
            //     setLoading(false);
            //     return;
            // }

            // setup the data if no issue occured
            set_res_data(res_data);
            set_id(supabase_id);
        }
        catch (error) {
            console.error("Error in sending data", error);
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

    const AnalysisCard = ({ active, onClick, icon: Icon, title, desc }) => (
        <div
            onClick={onClick}
            className={`
                group relative flex flex-col justify-between p-5 h-44 rounded-2xl cursor-pointer transition-all duration-300 border
                ${active
                    ? 'border-primary bg-primary/5 shadow-inner'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg hover:-translate-y-1'
                }
            `}
        >
            <div className="flex justify-between items-start w-full z-10">
                <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-400 group-hover:text-primary group-hover:bg-primary/10'}`}>
                    <Icon className="size-6" strokeWidth={active ? 2 : 1.5} />
                </div>
                {active && (
                    <div className="bg-primary text-white rounded-full p-1 animate-in zoom-in duration-300">
                        <Check className="size-3" strokeWidth={3} />
                    </div>
                )}
            </div>

            <div className="z-10 mt-4">
                <h3 className={`text-lg font-semibold ${active ? 'text-primary' : 'text-zinc-700'}`}>{title}</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{desc}</p>
            </div>

            {/* Background Decoration */}
            <div className={`absolute left-40 opacity-[0.07] pointer-events-none transition-all duration-500 ${active ? 'scale-110 opacity-[0.07] text-primary' : 'text-zinc-500'}`}>
                <Icon className="size-32" />
            </div>
        </div>
    );

    return (
        <form onSubmit={handle_submit} className=" flex justify-center gap-6 px-5 h-full transition-all">

            {/* SUBMIT + DROP/SHOW FILE */}
            <div className=' w-3/5 flex flex-col justify-start gap-4'>

                {/* choose upload file */}
                <div className={`
                    p-1 relative w-full flex-grow min-h-[50vh] flex flex-col rounded-3xl overflow-hidden transition-all duration-500 
                    ${!file ? 'bg-zinc-50/50' : 'bg-black'}
                `}>
                    {file ?
                        // FILE PREVIEW STATE
                        (
                            <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
                                {file.type.startsWith('video/') ? (
                                    <video className='w-full max-h-[60vh] object-contain' controls src={tempfileUrl}></video>
                                ) : file.type.startsWith('audio/') ? (
                                    <div className="flex flex-col items-center gap-6 p-10 w-full max-w-md">
                                        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center animate-pulse">
                                            <AudioLines className="size-10 text-zinc-400" />
                                        </div>
                                        <audio className='w-full' controls src={tempfileUrl}></audio>
                                    </div>
                                ) : file.type.startsWith('image/') ? (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={tempfileUrl}
                                            fill
                                            className="object-contain"
                                            alt='uploaded_preview'
                                        />
                                    </div>
                                ) : (
                                    <div className='text-red-400 font-medium bg-red-950/30 px-6 py-3 rounded-full border border-red-900'>Invalid File Type</div>
                                )}

                                {/* Floating Metadata Card */}
                                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                                    <div className="bg-black/40 backdrop-blur-md text-white border border-white/10 rounded-2xl p-4 flex gap-4 items-center max-w-[80%] pointer-events-auto">
                                        <div className="bg-white/10 p-2 rounded-lg">
                                            <FileUp className="size-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-white/60 font-mono mt-0.5">{humanFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={removeFile}
                                        className="pointer-events-auto bg-black/40 backdrop-blur-md hover:bg-red-950/60 hover:text-red-500 text-white/60 border border-white/10 rounded-full p-3 transition-all duration-200"
                                    >
                                        <X className="size-5" strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        ) :
                        // UPLOAD FILE (DRAG DROP) 
                        (
                            <div
                                className=" rounded-3xl border-dashed border-2 border-primary/30 p-10 flex flex-col justify-center items-center w-full h-full cursor-pointer transition-all duration-300"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => { fileInputRef.current.click() }}
                            >
                                <div className="relative">
                                    <div className={`absolute inset-0 bg-primary blur-2xl opacity-20 rounded-full transition-opacity duration-500`} />
                                    <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                                        <FileUp className={`size-10 text-zinc-400`} strokeWidth={1.5} />
                                    </div>
                                </div>

                                <h3 className="mt-8 text-xl font-medium text-zinc-800">Upload Media</h3>
                                <p className="mt-2 text-zinc-500 text-sm">Drag & drop or <span className="text-primary font-medium underline decoration-primary/30 underline-offset-4">browse</span></p>

                                <div className="mt-8 flex gap-4 text-xs text-zinc-400 font-medium uppercase tracking-wider">
                                    <span>Video</span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-300 self-center" />
                                    <span>Audio</span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-300 self-center" />
                                    <span>Image</span>
                                </div>
                            </div>
                        )
                    }

                    {/* HIDDEN ACTUAL INPUT FORM ITEM */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        id="videoFile"
                        name="videoFile"
                        accept={`video/*, audio/*, image/*`}
                        onChange={handleFileChange}
                        // required
                        // className="w-fit py-2 text-gray-700 rounded mx-auto"
                        className='hidden'
                    />

                </div>

                {/* Submit Action Area */}
                <div className="flex justify-end items-end px-2 h-full max-h-20 ">
                    <button
                        disabled={loading || (response_data.uploaded && !response_data.got_result)}
                        type="submit"
                        className={`
                            relative overflow-hidden group bg-primary text-white px-10 py-4 rounded-2xl font-medium text-lg shadow-xl shadow-zinc-200 transition-all duration-300
                            disabled:opacity-70 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-95 w-full sm:w-auto
                        `}
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            {loading || (response_data.uploaded && !response_data.got_result) ? (
                                <>
                                    <span>{response_data.uploaded ? "Analyzing" : "Uploading"}</span>
                                    <Loader2 className="size-5 animate-spin text-white" />
                                </>
                            ) : (
                                "Start Analysis"
                            )}
                        </span>
                    </button>
                </div>
            </div>

            {/* UPLOAD DETAILS + CHECKBOXES */}
            <div className=' w-2/5 flex flex-col justify-start '>

                {/* checkboxes */}
                <div className={` relative ${file ? "h-fit" : "h-0"} h-fit rounded-3xl px-5  transition-all duration-500 flex flex-col gap-2 `}>

                    {/* <div className='absolute h-full w-full bg-[url("/graph-paper.svg")] top-0 left-0 blur-3xl opacity-25' /> */}
                    {/* <div className='absolute h-full w-full bg-[url("/graph-paper.svg")] top-12 left-0 rotate-180 blur-3xl opacity-25  ' /> */}
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-semibold text-zinc-800 tracking-tight">Configuration</h2>
                        <p className="text-zinc-500 text-sm">Select the analysis types to run on your file.</p>
                    </div>

                    <div className='flex flex-col gap-4 items-center justify-evenly pt-5'>
                        <div className={` ${uploadType === 'image' || uploadType === 'audio' ? "hidden" : ""} rounded-2xl w-full `}>
                            {/* FRAME ANALYSIS SELECT */}
                            <AnalysisCard
                                active={analysisTypes["frameCheck"]}
                                onClick={() => handleAnalysisTypeChange("frameCheck")}
                                icon={Clapperboard}
                                title="Video Deepfake"
                                desc={null} //"Frame by frame analysis to detect Synthetic video content."
                            />
                        </div>
                        {/* AUDIO ANALYSIS SELECT */}
                        <div className={` ${uploadType === 'image' ? "hidden" : ""} rounded-2xl w-full `}>
                            <AnalysisCard
                                active={analysisTypes["audioAnalysis"]}
                                onClick={() => handleAnalysisTypeChange("audioAnalysis")}
                                icon={AudioLines}
                                title="Audio Spoof"
                                desc={null} //"Spectral analysis to identify AI-generated voice patterns."
                            />
                        </div>

                        {/* IMAGE ANALYSIS SELECT */}
                        <div className={` ${uploadType === 'video' || uploadType === 'audio' ? "hidden" : ""} rounded-2xl w-full  `}>
                            <AnalysisCard
                                active={analysisTypes["aigcCheck"]}
                                onClick={() => handleAnalysisTypeChange("aigcCheck")}
                                icon={ImageIcon}
                                title="AIGC Image"
                                desc={null} //"Pixel-level inspection to reveal generative AI artifacts."
                            />
                        </div>

                    </div>
                </div>

            </div>

        </form>
    )
}

export default Form;