import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { db_updates } from "@/utils/data_fetch";

import { PhotoVideo, Waveform, ImageSearch, UploadFile, LoadingCircle, RemoveBin, InfoCircle } from '@/components/SVGs';

const Form = ({ user_data, set_user_data, set_res_data }) => {

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
                        method: "verification"
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
                        method: "verification"
                    }
                ),
            });
            if (!res_set_to_queue.ok) throw new Error('Failed to send message to queue');

            alert('File Uploaded');

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        }
    }

    const get_server_response = async () => {
        //Form Submittion
        try {
            const user_id = user_data.id;
            const new_token_amount = user_data.tokens - 1;

            // 1. create a db element
            // 2. upload file to s3
            // 3. send message to queue
            await upload_file_s3();

            let res_data = { "uploaded": true };

            // update db with new token amount
            const db_update_res = await db_updates({ new_token_amount, user_id });
            if (db_update_res !== null) {
                res_data = { message: db_update_res.error };
                set_res_data(res_data);
                setLoading(false);
                return;
            }

            // setup the data if no issue occured
            set_user_data({ ...user_data, tokens: new_token_amount });
            set_res_data(res_data);
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

    return (
        <form onSubmit={handle_submit} className=" flex justify-center gap-6 px-5 h-full transition-all">

            {/* SUBMIT + DROP/SHOW FILE */}
            <div className=' w-3/5 flex flex-col justify-start gap-4'>

                {/* choose upload file */}
                <div className={` p-5 h-fit w-full flex flex-col justify-center rounded-3xl border border-gray-200 transition-all duration-500 `}>

                    {
                        !file && <label className="block text-gray-800 mb-2 pl-4 text-xl font-semibold ">Upload File</label>
                    }

                    {file ? (
                        <div className={` relative w-full rounded-2xl overflow-hidden`}>
                            {/* VIDEO/AUDIO PREVIEW + file basic data */}

                            <div className=' w-full flex justify-center'>
                                {file.type.startsWith('video/') ? (
                                    <video className=' w-full max-h-[70vh] ' controls src={tempfileUrl}></video>
                                ) : (
                                    file.type.startsWith('audio/') ?
                                        (
                                            <audio className='w-full border border-gray-300 rounded-full' controls src={tempfileUrl}></audio>
                                        ) : (
                                            file.type.startsWith('image/') ?
                                                (
                                                    <Image src={tempfileUrl} height={0} width={625} alt='uploaded_image' />
                                                ) : (
                                                    <div className=' text-xl bg-red-300 px-20 py-3 rounded-xl '>INVALID FILE UPLOADED</div>
                                                )
                                        )
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Drop FILE */}
                            <div
                                className=" flex flex-col justify-center items-center gap-3 w-full h-full min-h-[40vh] cursor-pointer border-2 border-stone-300 border-dashed rounded-2xl p-8 bg-stone-100 "

                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => { fileInputRef.current.click() }}
                            >
                                <UploadFile className="size-8" strokeWidth={1} />
                                <p>Drag and drop a file here, or click to select a file</p>

                                <p className="text-gray-500 text-sm">Max file size: 50MB</p>
                            </div>
                        </>
                    )}

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

                {/* submit */}
                <div className="w-full p-4 flex flex-col gap-4 justify-center items-center">
                    {
                        user_data.tokens === 0 &&
                        <div className=' text-sm text-red-700 text-center '>
                            Insufficient credits !! <br /> (contact for more credits)
                        </div>
                    }

                    {/* SUBMIT AND LOADING */}
                    <div className=' flex items-center gap-10'>
                        <button
                            // aria-disabled={loading || (cost>user_data.tokens)}
                            disabled={(loading || (user_data.tokens == 0))}
                            type="submit"
                            className=" disabled:cursor-no-drop disabled:bg-primary/70 outline-none bg-primary hover:bg-primary/90 hover:shadow-md text-white font-semibold py-3 px-12 rounded-3xl w-fit text-xl transition-all duration-300"
                        >
                            Submit
                        </button>

                        {
                            loading &&
                            (
                                <div className=" flex gap-4">
                                    <div className=" text-lg ">
                                        Uploading File
                                    </div>
                                    <div role="status">
                                        <LoadingCircle className="w-8 h-8 text-primary/60 animate-spin fill-primary" />
                                    </div>

                                </div>
                            )
                        }
                    </div>
                </div>
            </div>

            {/* UPLOAD DETAILS + CHECKBOXES */}
            <div className=' w-2/5 flex flex-col justify-start '>

                {/* SHOW FILES DETAILS WHEN WE HAVE FILES */}
                <div className={` ${file ? "h-50 mb-4" : "h-0"} overflow-hidden transition-all`}>
                    <div className=' border rounded-3xl px-5 py-4'>

                        <label className="block text-gray-800 mb-2 pl-4 text-xl font-semibold ">Uploaded File</label>

                        {
                            file &&
                            <div className=' flex flex-col gap-3 items-center justify-between py-1 overflow-hidden'>
                                {/* FILE BASIC DATA */}
                                <div className='flex  flex-col gap-3'>
                                    <div className='flex gap-1'>
                                        <span className=' min-w-24 text-base font-medium'>File Name:</span>
                                        <span className=' break-all '>
                                            {file.name}
                                        </span>
                                    </div>
                                    <div className='flex gap-1'>
                                        <span className=' min-w-24 text-base font-medium'>File Size:</span>
                                        {humanFileSize(file.size)}
                                    </div>
                                </div>
                                <button onClick={removeFile} className=' relative group flex gap-3 bg-red-200 hover:bg-red-300 px-4 py-2 rounded-full transition-all duration-300'>
                                    <RemoveBin className="size-6" strokeWidth={2} />

                                    {/* <div className=' absolute group-hover:opacity-100 opacity-0 bg-black/70 text-white py-2 w-24 -top-10 left-7 rounded-lg duration-500'>
                                        remove file
                                    </div> */}

                                </button>
                            </div>
                        }
                    </div>
                </div>

                {/* checkboxes */}
                <div className={` ${file ? "h-fit" : "h-0"} h-fit rounded-3xl p-5 border border-gray-200 transition-all duration-500 flex flex-col `}>
                    <label className=" block text-gray-800 mb-2 pl-4 text-xl font-semibold   ">Select Analysis Types</label>

                    <div className='flex flex-col gap-4 items-center justify-evenly'>
                        {/* VIDEO, AUDIO */}
                        <div className={` ${uploadType === 'image' ? "hidden" : ""} w-full flex flex-row gap-4 items-center justify-evenly `}>
                            {/* FRAME ANALYSIS SELECT */}
                            <div
                                onClick={() => { handleAnalysisTypeChange("frameCheck") }}
                                className={` flex flex-col justify-evenly items-center z-10 text-primary text-lg font-medium shadow shadow-primary ${uploadType === 'audio' ? 'hidden' : ''} relative px-3 py-2 cursor-pointer rounded-2xl w-full bg-white h-64 transition-all `}
                            >
                                <div className=' text-xl text-center flex items-center w-full justify-between gap-2'>
                                    {/* SELECT BUTTON */}
                                    <div className=' min-h-6 min-w-6 bg-stone-200 shadow-inner shadow-primary rounded-full'>
                                        {
                                            analysisTypes["frameCheck"] &&
                                            (
                                                <div className='h-4 w-4 bg-primary shadow-md shadow-white rounded-full m-1' />
                                            )
                                        }
                                    </div>

                                    {/* TEXT AND (i) */}
                                    <span className='font-semibold'>
                                    Video Deepfake
                                    </span>
                                    <span className=' relative group text-xs ' >
                                        <InfoCircle className="size-6" strokeWidth={2} />

                                        <div className='w-fit min-w-32 absolute z-50 -transtone-y-1/2 left-4 -top-5 hover:block group-hover:block hidden overflow-hidden p-1 transition-all '>
                                            <div className=' bg-black/70 text-white  px-4 py-2  rounded-xl rounded-bl-none  backdrop-blur-lg'>
                                                Analyze frames in the video
                                            </div>
                                        </div>
                                    </span>
                                </div>

                                <div className={` ${analysisTypes["frameCheck"] ? " text-primary" : " text-primary/40"} select-none transition-all `}>
                                    {/* <FaPhotoVideo className=' h-40 w-40' /> */}
                                    <PhotoVideo className="h-40 w-40" />
                                </div>
                            </div>

                            {/* AUDIO ANALYSIS SELECT */}
                            <div
                                onClick={() => { handleAnalysisTypeChange("audioAnalysis") }}
                                className={` flex flex-col justify-evenly items-center text-primary text-lg font-medium cursor-pointer shadow shadow-primary relative  px-3 py-2  rounded-2xl w-full bg-white h-64 transition-all `}
                            >
                                <div className=' text-xl text-center flex items-center w-full justify-between gap-2'>
                                    {/* SELECT BUTTON */}
                                    <div className=' min-h-6 min-w-6 bg-stone-200 shadow-inner shadow-primary rounded-full'>
                                        {
                                            analysisTypes["audioAnalysis"] &&
                                            (
                                                <div className='h-4 w-4 bg-primary shadow-md shadow-white rounded-full m-1' />
                                            )
                                        }
                                    </div>
                                    {/* TEXT AND (i) */}
                                    <span className='font-semibold'>
                                        Audio Spoof
                                    </span>
                                    <span className=' relative group text-xs ' >
                                        <InfoCircle className="size-6" strokeWidth={2} />
                                        
                                        <div className='w-fit min-w-20 absolute z-50 -transtone-y-1/2 left-4 -top-5 hover:block group-hover:block hidden overflow-hidden p-1 transition-all '>
                                            <div className=' bg-black/70 text-white  px-4 py-2  rounded-xl rounded-bl-none  backdrop-blur-lg'>
                                                Analyze audio in the file
                                            </div>
                                        </div>
                                    </span>
                                </div>

                                <div className={` ${analysisTypes["audioAnalysis"] ? " text-primary" : " text-primary/40"} select-none transition-all `}>
                                    {/* <PiWaveformBold className=' h-40 w-40' /> */}
                                    <Waveform className=' h-40 w-40' />
                                </div>
                            </div>
                        </div>
                        {/* IMAGE ANALYSIS SELECT */}
                        <div
                            className={` w-full ${uploadType === "audio" || uploadType === 'video' ? "hidden" : ""} flex z-10 text-primary text-xl text-center font-medium shadow shadow-primary relative px-3 py-2 cursor-pointer rounded-2xl bg-white transition-all `}
                            onClick={() => { handleAnalysisTypeChange("aigcCheck") }}
                        >
                            {/* TEXT, IMAGE AND (i) */}
                            <div className='flex flex-col w-full py-6 gap-6'>
                                {/* BUTTON */}
                                <div className=' w-full'>
                                    {/* SELECT BUTTON */}
                                    <div className=' min-h-6 min-w-6 bg-stone-200 shadow-inner shadow-primary rounded-full w-fit '>
                                        {
                                            analysisTypes["aigcCheck"] &&
                                            (
                                                <div className='h-4 w-4 bg-primary shadow-md shadow-white rounded-full relative top-1 left-1' />
                                            )
                                        }
                                    </div>
                                </div>
                                <div className=' flex gap-3'>
                                    <span className=' font-semibold'>
                                        Image AIGC
                                    </span>
                                    {/* INFO */}
                                    <span className=' relative group text-xs ' >
                                        <InfoCircle className="size-6" strokeWidth={2} />

                                        <div className=' min-w-24 absolute z-50 -transtone-y-1/2 left-4 -top-5 hover:block group-hover:block hidden overflow-hidden p-1 transition-all '>
                                            <div className=' bg-black/70 text-white  px-4 py-2  rounded-xl rounded-bl-none  backdrop-blur-lg'>
                                                Analyze a image for forgery
                                            </div>
                                        </div>
                                    </span>
                                </div>
                            </div>

                            <div className={` ${analysisTypes["aigcCheck"] ? " text-primary" : " text-primary/40"} w-full select-none transition-all `}>
                                {/* <MdOutlineImageSearch className=' h-40 w-40' /> */}
                                <ImageSearch className=' h-40 w-40' />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </form>
    )
}

export default Form;