import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { db_updates } from "@/utils/data_fetch";

import { FaPhotoVideo } from "react-icons/fa";
import { PiWaveformBold } from "react-icons/pi";
import { MdOutlineImageSearch } from "react-icons/md";
import { PiImageDuotone } from "react-icons/pi";
import { TbPhotoSearch } from "react-icons/tb";

const Form = ({ user_data, set_user_data, response_data, set_res_data, fileUrl, setfileUrl, set_file_metadata, set_chosen_analysis }) => {

    // input (file) ref
    const fileInputRef = useRef(null);

    const [tempfileUrl, set_tempFileUrl] = useState(null);
    //loading for the response data 
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

    const validate_analysis = (media_type)=>{
        //''' confirm selected analysis are correct to use '''
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
        else if (media_type.split("/")[0] === "image"){
            setUploadType("image");
            //ensure unrequired are set false
            new_analysis["frameCheck"] = false;
            new_analysis["audioAnalysis"] = false;
        }
        setAnalysisTypes(new_analysis);
    }

    // FORM RELATED FUNCTIONS
    const handleFileChange = (event) => {

        const newfile = event.target.files[0];
        // Check file size (50MB = 50 * 1024 * 1024 bytes)
        if (newfile === undefined) {
            setUploadType("")
        }
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

    const handleAnalysisTypeChange = (val) => {

        let new_analysis = { ...analysisTypes }
        new_analysis[val] = !new_analysis[val]
        setAnalysisTypes(new_analysis);
    };

    // -------------------->>SUBMIT and GET RESULT

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

            const { signedUrl } = await res.json();

            const res_s3 = await fetch(signedUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });
            alert('File Uploaded')

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        }
    }

    const get_server_response = async () => {
        //Form Submittion
        try {
            // const formData = new FormData();
            // formData.append('file', file);
            // formData.append('analysis_types', JSON.stringify(analysisTypes));
            // formData.append('upload_type', JSON.stringify(uploadType));

            const user_id = user_data.id;
            const new_token_amount = user_data.tokens - 1;

            let res_data = {};

            // STORE MEDIA FILE IN S3
            await upload_file_s3();
            // NEXT STEP -------------> WAIT FOR RESPONSE
            res_data = { "uploaded": true };

            // // REQUEST TO ML MODEL
            // const IP = process.env.NEXT_PUBLIC_SERVER_IP;
            // const token = session?.access_token;
            // //send request to backend
            // try {
            //     //options for the request
            //     const options = {
            //         method: 'POST',
            //         body: formData,
            //         headers: {
            //             'Authorization': `Bearer ${token}`
            //         },
            //     };
            //     const response = await fetch(`${IP}/api/generate-result`, options);
            //     res_data = await response.json();
            // }
            // catch (error) {
            //     res_data = { message: "ML model is currently not available" }
            //     set_res_data(res_data);
            //     set_chosen_analysis(analysisTypes);
            //     setLoading(false);
            //     return;
            // }

            if (res_data.message !== undefined) {
                console.log("ERROR FROM SERVER: ", res_data);
                res_data = { message: "Server had an issue" };
                set_res_data(res_data);
                set_chosen_analysis(analysisTypes);
                setLoading(false);
                return;
            }
            if (res_data.detail !== undefined) {
                console.log("ERROR FROM SERVER: ", res_data);
                res_data = { message: "Server had an issue" };
                set_res_data(res_data);
                set_chosen_analysis(analysisTypes);
                setLoading(false);
                return;
            }

            // UPDATE DB for TOKENS
            const db_update_res = await db_updates({ new_token_amount, user_id });
            if (db_update_res !== null) {
                res_data = { message: db_update_res.error };
                set_res_data(res_data);
                set_chosen_analysis(analysisTypes);
                setLoading(false);
                return;
            }

            // setup the data if no issue occured
            set_user_data({ ...user_data, tokens: new_token_amount });

            set_file_metadata({
                name: file.name,
                size: humanFileSize(file.size),
                type: file.type
            });
            set_res_data(res_data);
            set_chosen_analysis(analysisTypes);
        }
        catch (error) {
            console.error("Error in sending data", error);
        }

        // Create a URL for the uploaded video file
        let new_fileUrl = URL.createObjectURL(file);
        setfileUrl(new_fileUrl);

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
        <form onSubmit={handle_submit} className=" flex justify-center gap-6 px-5  h-full transition-all">
            {/* SUBMIT + DROP/SHOW FILE */}
            <div className=' w-3/5 flex flex-col justify-start gap-4'>

                {/* choose upload file */}
                <div className={` p-5 h-fit w-full flex flex-col justify-center rounded-xl border border-gray-200 transition-all duration-500 `}>

                    {
                        !file && <label className="block text-gray-800 mb-2 text-xl font-semibold ">Upload File</label>
                    }

                    {file ? (
                        <div className={` relative w-full `}>
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
                                className=" flex flex-col justify-center items-center gap-3 w-full h-full min-h-[40vh] cursor-pointer border-2 border-slate-300 border-dashed rounded-md p-8 bg-slate-100 "

                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => { fileInputRef.current.click() }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="size-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                </svg>
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
                            className=" disabled:cursor-no-drop disabled:bg-primary/70 outline-none bg-primary hover:bg-primary/90 hover:shadow-md text-white font-semibold py-3 px-6 rounded-lg w-fit text-xl transition-all duration-300"
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
                                        <svg aria-hidden="true" className="w-8 h-8 text-primary/60 animate-spin fill-primary" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                        </svg>
                                    </div>

                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
            {/* UPLOAD DETAILS + CHECKBOXES */}
            <div className=' w-2/5 flex flex-col justify-start'>

                {/* SHOW FILES DETAILS WHEN WE HAVE FILES */}
                <div className={` ${file ? "h-50 mb-4" : "h-0"} overflow-hidden transition-all`}>
                    <div className=' border rounded-lg px-5 py-4'>

                        <label className="block text-gray-800 mb-2 text-xl font-semibold ">Uploaded File</label>

                        {
                            file &&
                            <div className=' flex flex-col gap-3 items-center justify-between py-1'>
                                {/* FILE BASIC DATA */}
                                <div className='flex  flex-col gap-3'>
                                    <div className='flex gap-1'>
                                        <span className=' min-w-24 font-medium'>File Name:</span>
                                        <span className=' break-all '>
                                            {file.name}
                                        </span>
                                    </div>
                                    <div className='flex gap-1'>
                                        <span className=' min-w-24 font-medium'>File Size:</span>
                                        {humanFileSize(file.size)}
                                    </div>
                                </div>
                                <button onClick={removeFile} className=' relative group flex gap-3 bg-red-100 hover:bg-red-300 px-4 py-2 rounded-full transition-all duration-300'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>

                                    {/* <div className=' absolute group-hover:opacity-100 opacity-0 bg-black/70 text-white py-2 w-24 -top-10 left-7 rounded-lg duration-500'>
                                        remove file
                                    </div> */}

                                </button>
                            </div>
                        }
                    </div>
                </div>

                {/* checkboxes */}
                <div className={` ${file ? "h-fit" : "h-0"} h-fit rounded-xl p-4 border border-gray-200 transition-all duration-500 flex flex-col gap-4 `}>
                    <label className="block text-gray-800 text-xl font-semibold ">Select Analysis Types</label>

                    <div className={` ${uploadType === 'image'? "hidden" : ""} flex flex-row gap-4 items-center justify-evenly `}>
                        {/* FRAME ANALYSIS SELECT */}
                        <div
                            onClick={() => { handleAnalysisTypeChange("frameCheck") }}
                            className={` flex flex-col justify-evenly items-center z-10 text-primary text-lg font-medium shadow shadow-primary ${uploadType === 'audio' ? 'hidden' : ''} relative px-3 py-2 cursor-pointer rounded-lg w-full bg-white h-64 transition-all `}
                        >
                            <div className=' text-xl text-center flex items-center w-full justify-between gap-2'>
                                {/* SELECT BUTTON */}
                                <div className=' min-h-6 min-w-6 bg-slate-200 shadow-inner shadow-primary rounded-full'>
                                    {
                                        analysisTypes["frameCheck"] &&
                                        (
                                            <div className='h-4 w-4 bg-primary shadow-md shadow-white rounded-full m-1' />
                                        )
                                    }
                                </div>

                                {/* TEXT AND (i) */}
                                Video Deepfake
                                <span className=' relative group text-xs ' >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                    </svg>

                                    <div className='w-fit min-w-32 absolute z-50 -translate-y-1/2 left-4 -top-5 hover:block group-hover:block hidden overflow-hidden p-1 transition-all '>
                                        <div className=' bg-black/70 text-white  px-4 py-2  rounded-xl rounded-bl-none  backdrop-blur-lg'>
                                            Analyze frames in the video
                                        </div>
                                    </div>
                                </span>
                            </div>

                            <div className={` ${analysisTypes["frameCheck"] ? " text-primary" : " text-primary/40"} select-none transition-all `}>
                                <FaPhotoVideo className=' h-40 w-40' />
                            </div>
                        </div>

                        {/* AUDIO ANALYSIS SELECT */}
                        <div
                            onClick={() => { handleAnalysisTypeChange("audioAnalysis") }}
                            className={` flex flex-col justify-evenly items-center text-primary text-lg font-medium cursor-pointer shadow shadow-primary relative  px-3 py-2  rounded-lg w-full bg-white h-64 transition-all `}
                        >
                            <div className=' text-xl text-center flex items-center w-full justify-between gap-2'>
                                {/* SELECT BUTTON */}
                                <div className=' min-h-6 min-w-6 bg-slate-200 shadow-inner shadow-primary rounded-full'>
                                    {
                                        analysisTypes["audioAnalysis"] &&
                                        (
                                            <div className='h-4 w-4 bg-primary shadow-md shadow-white rounded-full m-1' />
                                        )
                                    }
                                </div>
                                {/* TEXT AND (i) */}
                                Audio Spoof
                                <span className=' relative group text-xs ' >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                    </svg>

                                    <div className='w-fit min-w-20 absolute z-50 -translate-y-1/2 left-4 -top-5 hover:block group-hover:block hidden overflow-hidden p-1 transition-all '>
                                        <div className=' bg-black/70 text-white  px-4 py-2  rounded-xl rounded-bl-none  backdrop-blur-lg'>
                                            Analyze audio in the file
                                        </div>
                                    </div>
                                </span>
                            </div>

                            <div className={` ${analysisTypes["audioAnalysis"] ? " text-primary" : " text-primary/40"} select-none transition-all `}>
                                <PiWaveformBold className=' h-40 w-40' />
                            </div>
                        </div>
                    </div>

                    {/* IMAGE ANALYSIS SELECT */}
                    <div
                        className={` ${uploadType === "audio" || uploadType === 'video' ? "hidden" : ""} flex z-10 text-primary text-xl text-center font-medium shadow shadow-primary relative px-3 py-2 cursor-pointer rounded-lg bg-white transition-all `}
                        onClick={() => { handleAnalysisTypeChange("aigcCheck") }}
                    >
                        {/* TEXT, IMAGE AND (i) */}
                        <div className='flex flex-col w-full py-6 gap-6'>
                            {/* BUTTON */}
                            <div className=' w-full'>
                                {/* SELECT BUTTON */}
                                <div className=' min-h-6 min-w-6 bg-slate-200 shadow-inner shadow-primary rounded-full w-fit '>
                                    {
                                        analysisTypes["aigcCheck"] &&
                                        (
                                            <div className='h-4 w-4 bg-primary shadow-md shadow-white rounded-full relative top-1 left-1' />
                                        )
                                    }
                                </div>
                            </div>
                            <div className=' flex gap-3'>
                                Image AIGC
                                {/* INFO */}
                                <span className=' relative group text-xs ' >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                    </svg>

                                    <div className=' min-w-24 absolute z-50 -translate-y-1/2 left-4 -top-5 hover:block group-hover:block hidden overflow-hidden p-1 transition-all '>
                                        <div className=' bg-black/70 text-white  px-4 py-2  rounded-xl rounded-bl-none  backdrop-blur-lg'>
                                            Analyze a image for forgery
                                        </div>
                                    </div>
                                </span>
                            </div>
                        </div>

                        <div className={` ${analysisTypes["aigcCheck"] ? " text-primary" : " text-primary/40"} w-full select-none transition-all `}>
                            <MdOutlineImageSearch className=' h-40 w-40' />
                            {/* <PiImageDuotone  className=' h-40 w-40' /> */}
                            {/* <TbPhotoSearch className=' h-40 w-40' /> */}
                        </div>
                    </div>
                </div>

            </div>
        </form>
    )
}

export default Form;