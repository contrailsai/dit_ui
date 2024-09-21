import LineChart from './LineChart';
import React, { useState, useRef, useEffect } from 'react';
import Waveform from './Waveform';

import jsPDF from "jspdf";
import html2canvas from 'html2canvas';
import { Outfit_bold_font } from './outfit-bold-font';
import { Outfit_normal_font } from './outfit-normal-font';
import { logo_base64 } from './logo_base64';

const ResultsVideoUI = ({ response_data, fileUrl, file_metadata, analysisTypes, handle_newCheck }) => {

    const text_val = {
        frameCheck: "Frame Check",
        audioAnalysis: "Audio Analysis"
    };

    const videoRef = useRef(null);

    const result_ref = useRef(null);
    const frame_graph_Ref = useRef(null);
    const audio_graph_Ref = useRef(null);

    const [taking_ss, set_taking_ss] = useState(false);

    const [currentTime, setCurrentTime] = useState(0);

    const [bbox_idx, set_bbox_idx] = useState(0);
    const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
    let bboxes = response_data?.frameCheck?.bboxes || [];
    let total_frames = response_data?.frameCheck?.table_idx.length || 0;

    const [duration, setDuration] = useState(0);

    const [playing, setPlaying] = useState(false);

    const [videoError, setVideoError] = useState(null);

    //output results
    const [chartData, setChartData] = useState(null);
    const [curr_analysis, set_curr_analysis] = useState(Object.keys(response_data)[0] );


    const handleVideoLoadedMetadata = () => {

        const video_duration = videoRef.current.duration;
        setDuration(video_duration);
        const { videoWidth, videoHeight } = videoRef.current;
        setVideoDimensions({ width: videoWidth, height: videoHeight });

        let last_frame = {};
        if (response_data["frameCheck"] !== undefined)
            last_frame["frameCheck"] = Math.max(...response_data['frameCheck'].table_idx);
        if (response_data["audioAnalysis"] !== undefined)
            last_frame["audioAnalysis"] = Math.max(...response_data['audioAnalysis'].table_idx);

        let temp_chart_data = {};

        if (response_data["frameCheck"]) {
            const frame_chart_data = {
                labels: response_data['frameCheck'].table_idx.map(
                    (val, idx) => {
                        const time = video_duration * (val / last_frame["frameCheck"]);
                        return formatTime(time);
                    }
                ),
                datasets: [

                    {
                        label: "Probablility of tampering (-ve value deems suspicious)",
                        data: response_data['frameCheck'].table_values.map((val, idx) => {
                            return typeof (val) === "boolean" ? 0.7 : val
                        }),
                        backgroundColor: response_data['frameCheck'].table_values.map((val, idx) => {
                            if (typeof (val) === 'boolean')
                                return "rgba(100,100,100,0.2)"
                            return val >= 0.7 ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)"
                        }),
                        // borderColor: response_data['frameCheck'].table_values.map((val, idx) => { return val >= 0 ? "rgba(0,255,0,0.3)" : "rgba(255,0,0,0.3)" }),
                        // borderWidth: 0.75,
                        barPercentage: 1,
                        borderRadius: 100,
                        inflateAmount: 1,
                        base: 0.7
                    },
                    {
                        type: 'line',
                        borderColor: "rgba(0,0,100, 0.3)",
                        pointRadius: 0,
                        fill: {
                            target: { value: 0.7 },
                            above: "rgba(0,255,0,0.3)",   // Area above the origin
                            below: "rgba(255,0,0,0.3)"    // below the origin
                        },
                        lineTension: 0.4,
                        data: response_data['frameCheck'].table_values.filter((val, idx) => {
                            return typeof (val) !== "boolean"
                        }),
                        borderWidth: 1,

                    },
                ]
            };
            temp_chart_data["frameCheck"] = frame_chart_data;
        }
        if (response_data["audioAnalysis"]) {

            const audio_chart_data = {
                labels: response_data['audioAnalysis'].table_idx.map(
                    (val, idx) => {
                        const time = video_duration * (val / last_frame["audioAnalysis"]);
                        return formatTime(time);
                    }
                ),
                datasets: [
                    {
                        label: "Probablility of tampering (-ve value deems suspicious)",
                        data: response_data['audioAnalysis'].table_values,
                        backgroundColor: response_data['audioAnalysis'].table_values.map((val, idx) => { return val >= 0 ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)" }),
                        // borderColor: response_data['audioAnalysis'].table_values.map((val, idx) => { return val >= 0 ? "rgba(0,255,0,0.3)" : "rgba(255,0,0,0.3)" }),
                        // borderWidth: 0.5,
                        barPercentage: 1,
                        borderRadius: 100,
                        inflateAmount: 1,
                        base: -1.3
                    },
                    {
                        type: 'line',
                        borderColor: "rgba(0,0,100, 0.3)",
                        pointRadius: 0,
                        fill: {
                            target: { value: -1.3 },
                            above: "rgba(0,255,0,0.3)",   // Area above the origin
                            below: "rgba(255,0,0,0.3)"    // below the origin
                        },
                        lineTension: 0.4,
                        data: response_data['audioAnalysis'].table_values,
                        borderWidth: 1,

                    },
                ]
            }
            temp_chart_data["audioAnalysis"] = audio_chart_data
        }
        setChartData(temp_chart_data);
    };

    // console.log(bbox_idx)
    useEffect(()=>{
        
        //RESET THE bboxes and total frames in case frame analysis was added again
        bboxes = response_data?.frameCheck?.bboxes || [];
        set_bbox_idx(0);
        total_frames = response_data?.frameCheck?.table_idx.length || 0;    

        // console.log(duration, bboxes.length)

        if(duration!==0 && bboxes.length!==0){
            let new_idx = Math.floor(videoRef.current.currentTime * total_frames / duration)
            // console.log(new_idx);
            set_bbox_idx(new_idx >= total_frames ? total_frames - 1 : new_idx);
        }
        
        if(response_data.frameCheck){
            set_curr_analysis("frameCheck");
        }
        else if(response_data.audioAnalysis){
            set_curr_analysis("audioAnalysis");
        }

        // console.log("video durr", videoRef.current.duration  );
        if( !isNaN( videoRef.current.duration ) ){
            // create the charts depending on the analysis selected
            handleVideoLoadedMetadata();
        }
    }, [response_data])

    const handleVideoError = (event) => {
        setVideoError(event.target.error);
    };

    const handlePlayPause = () => {
        if (playing) {
            videoRef.current.pause();
            setPlaying(false);
        } else {
            videoRef.current.play();
            setPlaying(true);
        }
    };

    const handleSliderChange = (event) => {
        const newTime = (event.target.value * duration) / 100;
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);

        // let new_idx = Math.floor(newTime * total_frames / duration)
        // we have fixed frames (0-last_frame),
        // set_bbox_idx(new_idx >= total_frames ? total_frames - 1 : new_idx);
    };

    const handleTimeUpdate = () => {
        if (videoRef.current.currentTime >= duration) {
            handlePlayPause();
        }
        // console.log(duration, videoRef.current.currentTime);

        setCurrentTime(videoRef.current.currentTime);
        //bbox update
        //ensure it doesnt exceed total frames
        if(bboxes.length!==0){
            let new_idx = Math.floor(videoRef.current.currentTime * total_frames / duration)
            set_bbox_idx(new_idx >= total_frames ? total_frames - 1 : new_idx);
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handle_pdf_tester = async () => {

        set_taking_ss(true);
        // Wait for the state update to be applied
        await new Promise(resolve => {
            setTimeout(resolve, 200);
        });

        let temp_curr_analysis = curr_analysis;

        const doc = new jsPDF({ orientation: "p", unit: "in", compress: true });
        doc.addFileToVFS('outfit_normal.ttf', Outfit_normal_font);
        doc.addFileToVFS('outfit_bold.ttf', Outfit_bold_font);

        doc.addFont('outfit_normal.ttf', 'Outfit', 'normal');
        doc.addFont('outfit_bold.ttf', 'Outfit', 'bold');

        doc.setFont("Outfit", "bold");

        const my = 0.5;
        const mx = 0.3;

        let curr_x = mx;
        let curr_y = my;

        let fontSize = 16;
        doc.setFontSize(16);

        // SHOW LOGO AND NAME OF COMPANY
        const logo_img_w = 16 / 72;
        const logo_img_h = 16 / 72

        doc.addImage(logo_base64, 'PNG', curr_x, curr_y - 16 / 72, logo_img_w, logo_img_h);
        curr_x += 16 / 72 + 5 / 72;
        doc.setTextColor(2, 83, 288);
        doc.text('Contrails AI', curr_x, curr_y - 2 / 72);


        curr_x = mx;
        curr_y += fontSize / 72 + 10 / 72; //go down (1. for the above comapny name text, 2. for space b/t the 2 text)

        // PRINT Heading (bold)
        fontSize = 18;
        doc.setFontSize(fontSize);
        doc.setTextColor(0, 0, 0);
        doc.text("Manipulation Detection Report", curr_x, curr_y);
        curr_y += fontSize / 72 + 8 / 72;

        // PRINT Audio Analysis
        fontSize = 15;
        doc.setFontSize(fontSize);
        doc.text("File Data", curr_x, curr_y);

        curr_y += fontSize / 72 + 6 / 72;

        fontSize = 10;
        doc.setFontSize(fontSize);

        // FILE NAME
        doc.setFont("Outfit", "bold");
        doc.text("File name: ", curr_x, curr_y);
        curr_x += 70 / 72;
        doc.setFont("Outfit", "normal")
        doc.text(`${file_metadata.name}`, curr_x, curr_y);

        curr_x = mx;
        curr_y += fontSize / 72 + 6 / 72;

        //FILE SIZE
        doc.setFont("Outfit", "bold");
        doc.text("File Size: ", curr_x, curr_y);
        curr_x += 70 / 72;
        doc.setFont("Outfit", "normal")
        doc.text(`${file_metadata.size}`, curr_x, curr_y);

        curr_x = mx;
        curr_y += fontSize / 72 + 6 / 72;

        //FILE DURATION
        doc.setFont("Outfit", "bold");
        doc.text("Duration: ", curr_x, curr_y);
        curr_x += 70 / 72;
        doc.setFont("Outfit", "normal")
        doc.text(`${duration.toFixed(1)} sec`, curr_x, curr_y);

        curr_x = mx;
        curr_y += 2 * fontSize / 72;

        // SHOW VIDEO PREVIEW, RESULT OF BOTH ANALYSIS AND VERDICT
        const result_element = result_ref.current;
        let result_canvas = await html2canvas(result_element);
        const result_imgData = result_canvas.toDataURL('image/png');
        const res_img_w = 550 / 72;
        const res_img_h = (result_canvas.height * res_img_w) / result_canvas.width;
        doc.addImage(result_imgData, 'PNG', curr_x, curr_y, res_img_w, res_img_h, '', 'FAST');

        curr_x = mx;
        curr_y += res_img_h + 20 / 72; //gap of 20 px

        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(1 / 72);
        doc.line(curr_x, curr_y, curr_x + 550 / 72, curr_y);

        curr_y += 30 / 72;

        if (response_data["audioAnalysis"] !== undefined) {

            //AUDIO ANALYSIS START
            fontSize = 16;
            doc.setFontSize(fontSize);
            doc.text("Audio Analysis", curr_x, curr_y);

            curr_y += fontSize / 72 + 6 / 72;

            set_curr_analysis("audioAnalysis");
            // Wait for the state update to be applied
            await new Promise(resolve => {
                setTimeout(resolve, 100);
            });

            fontSize = 12;
            doc.setFontSize(fontSize);

            const audio_result = (response_data["audioAnalysis"].result).toFixed(3);

            if (audio_result >= -1.3) {
                doc.text("The audio analysis detected no manipulation", curr_x, curr_y);
            }
            else {
                doc.text("The audio analysis detected manipulation", curr_x, curr_y);
            }
            curr_y += fontSize / 72 + 6 / 72;

            doc.text("Overall Audio result: ", curr_x, curr_y);

            curr_x += 110 / 72;
            doc.setFont("Outfit", "bold");

            audio_result >= -1.3 ? doc.setTextColor(5, 160, 20) : doc.setTextColor(200, 30, 30);
            doc.text(` ${audio_result} `, curr_x, curr_y);

            curr_x = mx;
            curr_y += fontSize / 72 + 3 / 72;

            fontSize = 9;
            doc.setFontSize(fontSize);
            doc.setTextColor(0, 0, 0);
            doc.setFont("Outfit", "normal");

            doc.text("result value less than -1.3 deems it suspicious of manipulation", curr_x, curr_y);
            curr_y += 2 * fontSize / 72;

            const audio_result_element = audio_graph_Ref.current;
            let audio_result_canvas = await html2canvas(audio_result_element);
            const audio_result_imgData = audio_result_canvas.toDataURL('image/png');
            const aud_res_img_w = 550 / 72;
            const aud_res_img_h = (audio_result_canvas.height * aud_res_img_w) / audio_result_canvas.width;
            doc.addImage(audio_result_imgData, 'PNG', curr_x, curr_y, aud_res_img_w, aud_res_img_h, '', 'FAST');

            curr_x = mx;
            curr_y += aud_res_img_h + 20 / 72; //gap of 20 px

            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(1 / 72);
            doc.line(curr_x, curr_y, curr_x + 550 / 72, curr_y);

            curr_y += 30 / 72;
        }

        if (response_data["frameCheck"] !== undefined) {

            //FRAME ANALYSIS START
            fontSize = 16;
            doc.setFontSize(fontSize);
            doc.text("Frame Analysis", curr_x, curr_y);

            curr_y += fontSize / 72 + 6 / 72;

            set_curr_analysis("frameCheck");
            // Wait for the state update to be applied
            await new Promise(resolve => {
                setTimeout(resolve, 100);
            });

            fontSize = 12;
            doc.setFontSize(fontSize);

            const frame_result = (response_data["frameCheck"].result).toFixed(3);

            if (frame_result >= 0.7) {
                doc.text("The video frames analysis detected no manipulation", curr_x, curr_y);
            }
            else {
                doc.text("The video frames analysis detected manipulation", curr_x, curr_y);
            }
            curr_y += fontSize / 72 + 6 / 72;

            doc.text("Overall Frame Result: ", curr_x, curr_y);

            curr_x += 120 / 72;
            doc.setFont("Outfit", "bold");

            frame_result >= -1.3 ? doc.setTextColor(5, 160, 20) : doc.setTextColor(200, 30, 30);
            doc.text(` ${frame_result} `, curr_x, curr_y);

            curr_x = mx;
            curr_y += fontSize / 72 + 3 / 72;

            fontSize = 9;
            doc.setFontSize(fontSize);
            doc.setTextColor(0, 0, 0);
            doc.setFont("Outfit", "normal");

            doc.text("result value less than 0.7 deems it suspicious of manipulation", curr_x, curr_y);
            curr_y += 2 * fontSize / 72;

            const frame_result_element = frame_graph_Ref.current;
            let frame_result_canvas = await html2canvas(frame_result_element);
            const frame_result_imgData = frame_result_canvas.toDataURL('image/png');
            const frm_res_img_w = 550 / 72;
            const frm_res_img_h = (frame_result_canvas.height * frm_res_img_w) / frame_result_canvas.width;
            doc.addImage(frame_result_imgData, 'PNG', curr_x, curr_y, frm_res_img_w, frm_res_img_h, '', 'FAST');

            curr_x = mx;
            curr_y += frm_res_img_h + 20 / 72; //gap of 20 px
        }

        set_taking_ss(false);
        await new Promise(resolve => {
            setTimeout(resolve, 500);
        });

        doc.save("a4.pdf");
        set_curr_analysis(temp_curr_analysis);

    }

    if (response_data["message"] === undefined) {
        // console.log(response_data);
        return (
            <>
                {/* TITLE */}
                <div className=' flex w-full justify-between items-end'>
                    <h2 className="text-3xl font-semibold px-5 pt-3 py-6">Manipulation Detection</h2>
                    {
                        fileUrl &&
                        <div className=' flex gap-7 items-center mr-1 '>
                            {/* NEW ANALYSIS */}
                            <div onClick={handle_newCheck} className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-lg shadow-primary shadow'>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>

                                New Analysis
                            </div>

                            {/* PDF EXPORT */}
                            <div
                                onClick={async () => { await handle_pdf_tester() }}
                                className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-lg shadow-primary shadow '
                            >
                                Export Report
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                            </div>
                        </div>
                    }
                </div>
                {/* ANALYSIS */}
                <div className=" relative w-full flex flex-col lg:gap-3 items-center bg-slate-50 rounded-lg overflow-hidden ">

                    <div className={` ${taking_ss ? '' : 'hidden'} absolute z-20 w-full h-full bg-black/90 backdrop-blur-2xl text-white `}>

                        <div className=' flex flex-col justify-center items-center gap-4 text-2xl my-40 '>
                            <div role="status">
                                <svg aria-hidden="true" className="w-8 h-8 text-white/30 animate-spin fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                </svg>
                            </div>
                            CREATING PDF
                        </div>

                    </div>

                    {/* VIDEO + VIDEO STUFF */}
                    <div ref={result_ref} className=' flex gap-10 justify-between px-8 items-end relative pt-10 w-full '>

                        {/* RESULT + SIDE TABS + BUTTONS */}
                        <div className=' w-full max-w-[40vw] flex flex-col h-[60vh] justify-between '>
                            {/* RESULT */}
                            <div className=' flex w-full justify-center flex-wrap'>
                                {/* BOTH AUDIO AND VIDEO 4-CASES */}
                                {
                                    response_data["frameCheck"] !== undefined && response_data["audioAnalysis"] !== undefined
                                    &&
                                    (
                                        <>
                                            {/* BOTH OK */}
                                            {
                                                response_data["frameCheck"].result.toFixed(3) >= 0.7 && response_data["audioAnalysis"].result.toFixed(3) >= -1.3 &&
                                                <span className='flex gap-1 items-center'>
                                                    <span className='font-medium bg-green-200 px-2 py-1 rounded-full w-fit'>No manipulation detected</span>
                                                    in both
                                                    <span className='font-medium'>Video and Audio</span>
                                                </span>
                                            }
                                            {/* FRAME OK AUDIO BAD */}
                                            {
                                                response_data["frameCheck"].result.toFixed(3) >= 0.7 && response_data["audioAnalysis"].result.toFixed(3) < -1.3 &&
                                                <span className='flex gap-1 items-center'>

                                                    <span className='font-medium bg-red-200 px-2 py-1 rounded-full w-fit'>Manipulation detected</span>
                                                    in <span className='font-medium'>Audio</span>,
                                                    <br />
                                                    <span className='font-medium bg-green-200 px-2 py-1 rounded-full w-fit'>NO Manipulation detected</span>
                                                    in <span className='font-medium'>Video</span>,
                                                </span>
                                            }

                                            {/* FRAME BAD AUDIO OK */}
                                            {
                                                response_data["frameCheck"].result.toFixed(3) < 0.7 && response_data["audioAnalysis"].result.toFixed(3) >= -1.3 &&
                                                <span className='flex gap-1 items-center'>

                                                    <span className='font-medium bg-red-200 px-2 py-1 rounded-full w-fit'>Manipulation detected</span>
                                                    in <span className='font-medium'>Video</span>,
                                                    <br />
                                                    <span className='font-medium bg-green-200 px-2 py-1 rounded-full w-fit'>NO Manipulation detected</span>
                                                    in <span className='font-medium'>Audio</span>,
                                                </span>
                                            }
                                            {/* BOTH OK */}
                                            {
                                                response_data["frameCheck"].result.toFixed(3) < 0.7 && response_data["audioAnalysis"].result.toFixed(3) < -1.3 &&
                                                <span className='flex gap-1 items-center'>
                                                    <span className='font-medium bg-red-200 px-2 py-1 rounded-full w-fit'>Manipulation detected</span>
                                                    in both
                                                    <span className='font-medium'>Video and Audio</span>
                                                </span>
                                            }
                                        </>
                                    )
                                }
                                {/* ONLY VIDEO 2-CASES */}
                                {
                                    response_data["frameCheck"] !== undefined && response_data["audioAnalysis"] === undefined
                                    &&
                                    (
                                        <>
                                            {/* VIDEO OK */}
                                            {
                                                response_data["frameCheck"].result.toFixed(3) >= 0.7 &&
                                                <span className='flex gap-1 items-center'>
                                                    <span className='font-medium bg-green-200 px-2 py-1 rounded-full w-fit'>No manipulation detected</span>
                                                    in
                                                    <span className='font-medium'>Video</span>
                                                </span>
                                            }
                                            {/* VIDEO BAD */}
                                            {
                                                response_data["frameCheck"].result.toFixed(3) < 0.7 &&
                                                <span className='flex gap-1 items-center'>
                                                    <span className='font-medium bg-red-200 px-2 py-1 rounded-full w-fit'>Manipulation detected</span>
                                                    in
                                                    <span className='font-medium'>Video</span>
                                                </span>
                                            }

                                        </>
                                    )
                                }
                                {/* ONLY AUDIO 2-CASES */}
                                {
                                    response_data["frameCheck"] === undefined && response_data["audioAnalysis"] !== undefined
                                    &&
                                    (
                                        <>
                                            {/* AUDIO OK */}
                                            {
                                                response_data["audioAnalysis"].result.toFixed(3) >= -1.3 &&
                                                <span className='flex gap-1 items-center'>
                                                    <span className='font-medium bg-green-200 px-2 py-1 rounded-full w-fit'>No manipulation detected</span>
                                                    in<span className='font-medium'>Audio</span>
                                                </span>
                                            }
                                            {/* AUDIO OK */}
                                            {
                                                response_data["audioAnalysis"].result.toFixed(3) < -1.3 &&
                                                <span className='flex gap-1 items-center'>
                                                    <span className='font-medium bg-red-200 px-2 py-1 rounded-full w-fit'>Manipulation detected</span>
                                                    in<span className='font-medium'>Audio</span>
                                                </span>
                                            }
                                        </>
                                    )
                                }
                            </div>
                            <div className=' flex flex-col items-center py-4 gap-4 '>
                                {
                                    // result of all analysis
                                    Object.keys(response_data).map((val, idx) => {
                                        if(response_data[val]==undefined)
                                            return
                                        const result = (response_data[val].result).toFixed(3);
                                        let threshold = 0;
                                        if (val === "frameCheck")
                                            threshold = 0.7
                                        else if (val === 'audioAnalysis')
                                            threshold = -1.3
                                        return (
                                            <div key={idx} className={` bg-white flex flex-col w-fit items-center gap-3 min-w-96 px-5 py-2 rounded-lg shadow ${(result) > threshold ? " shadow-green-700" : " shadow-red-700"}  `}>
                                                <span className=' text-xl'>
                                                    {
                                                        val === "frameCheck" &&
                                                        (`Frame Check Result`)
                                                    }
                                                    {
                                                        val === "audioAnalysis" &&
                                                        (`Audio Check Result`)
                                                    }
                                                </span>
                                                <span className={` text-2xl px-6 py-2 rounded-full font-semibold ${(result) > threshold ? " bg-green-200  text-green-700" : " bg-red-200 text-red-700"}`}>
                                                    {result}
                                                </span>
                                                <span className=' text-xs'>
                                                    {
                                                        val === "frameCheck" &&
                                                        (`< 0.7 deems it suspicious of forgery`)
                                                    }
                                                    {
                                                        val === "audioAnalysis" &&
                                                        (`< -1.3 deems it suspicious of forgery`)
                                                    }
                                                </span>
                                            </div>
                                        )
                                    })
                                }
                            </div>

                            {/* SIDE TABS + BUTTONS */}
                            {/* <div className=' w-full flex items-center '> */}
                            {/* SIDE TABS  */}
                            <div className={` ${taking_ss ? 'hidden' : ''} h-fit flex gap-2 relative top-3 -left-4 `}>
                                {
                                    Object.keys(analysisTypes).map((val, idx) => {
                                        if (analysisTypes[val] === true) {
                                            return (
                                                <div
                                                    key={idx}
                                                    className={` ${curr_analysis === val ? "bg-primary hover:shadow-inner shadow-white text-white " : " text-primary border-t border-x border-primary "} font-medium p-3 rounded-t-xl cursor-pointer transition-all`}
                                                    onClick={() => { if (playing) handlePlayPause(); set_curr_analysis(val); }}
                                                >
                                                    {text_val[val]}
                                                </div>
                                            )
                                        }
                                        return (
                                            <div key={idx}>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                            {/* </div> */}
                        </div>

                        {/* VIDEO */}
                        <div className='relative w-full flex flex-col items-center justify-center'>
                            <div className='relative'>
                                {/* BBOX */}
                                {curr_analysis === 'frameCheck' && bboxes.length > 0 && typeof (bboxes[bbox_idx]) !== "boolean" && (
                                    <div
                                        style={{
                                            top: `${(bboxes[bbox_idx][0][1] / videoDimensions.height) * 100}%`,
                                            left: `${(bboxes[bbox_idx][0][0] / videoDimensions.width) * 100}%`,
                                            width: `${((bboxes[bbox_idx][0][2] - bboxes[bbox_idx][0][0]) / videoDimensions.width) * 100}%`,
                                            height: `${((bboxes[bbox_idx][0][3] - bboxes[bbox_idx][0][1]) / videoDimensions.height) * 100}%`,
                                        }}
                                        className={` ${taking_ss ? 'hidden' : ''} z-10 absolute border-4 rounded ${response_data["frameCheck"]["table_values"][bbox_idx] >= 0.7 ? " border-green-500 " : "border-red-500"} transition-all duration-75 `}
                                    />
                                )}
                                <video
                                    ref={videoRef}
                                    src={fileUrl}
                                    controls={false} // Disable inbuilt video player buttons and interactions
                                    onError={handleVideoError}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleVideoLoadedMetadata}
                                    className=" w-fit max-w-3xl h-[60vh] "
                                />
                            </div>

                            {
                                curr_analysis === 'frameCheck' && bboxes.length > 0 && typeof (bboxes[bbox_idx]) !== "boolean" && (

                                    <div className={` ${taking_ss ? 'hidden' : ''}  ${response_data["frameCheck"]["table_values"][bbox_idx] >= 0.7 ? "bg-green-300" : "bg-red-300"} rounded-lg py-1 px-5 `}>
                                        {
                                            response_data["frameCheck"]["table_values"][bbox_idx] >= 0.7 ?
                                                "Current frame seems ok"
                                                :
                                                "Current frame seems suspicious"
                                        }
                                    </div>
                                )
                            }
                        </div>

                    </div>

                    {/* GRAPH AND SLIDER */}
                    <div className=' relative z-10 flex flex-row justify-stretch w-full bg-primary border-gray-300 px-3 pb-4 pt-3 rounded-b '>

                        {/* data chart and slider */}
                        <div className="w-full ">

                            {/* buttons */}
                            <button
                                onClick={handlePlayPause}
                                className=" ml-10 mb-2 border-2 outline-none text-white text-4xl font-bold py-1 px-3 rounded-full transition-all duration-300 "
                            >
                                {playing ?
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="#" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                    </svg>
                                    :
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                    </svg>
                                }
                            </button>

                            {/* slider with buttons */}
                            <div className={`relative pl-10 pr-4 ${curr_analysis === "audioAnalysis" ? 'h-0' : 'h-10'} overflow-hidden duration-500 transition-all`}>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={(currentTime / duration) * 100 || 0}
                                    onChange={handleSliderChange}
                                    className=" win10-thumb  w-full rounded-md outline-none transition-all duration-300 cursor-pointer"
                                />
                            </div>

                            {
                                videoRef !== null &&
                                <div className={`${curr_analysis === "audioAnalysis"? "" : "hidden"}`} >
                                    <Waveform videoRef={videoRef} />
                                </div>
                            }

                            {
                                chartData !== null &&
                                <>
                                    {
                                        chartData["audioAnalysis"] !== undefined &&

                                        <div ref={audio_graph_Ref} className={` ${curr_analysis === 'audioAnalysis' ? '' : 'hidden'} bg-white max-h-64 w-full px-3 mt-2 rounded-md`}>
                                            <LineChart chartData={chartData["audioAnalysis"]} />
                                        </div>
                                    }
                                    {
                                        chartData["frameCheck"] !== undefined &&
                                        <div ref={frame_graph_Ref} className={` ${curr_analysis === 'frameCheck' ? '' : 'hidden'} bg-white max-h-64 w-full px-3 mt-2 rounded-md`}>
                                            <LineChart chartData={chartData["frameCheck"]} />
                                        </div>
                                    }
                                </>
                            }
                        </div>

                    </div>
                    {videoError && (
                        <p className="text-red-500 mt-2">Error playing video: {videoError.message}</p>
                    )}
                </div>


                <div className=' flex gap-5 pt-4 items-end '>

                    {/* VIDEO META DATA */}
                    <div className=' bg-slate-100 py-4 px-5 border rounded-lg w-fit min-w-[40vw] flex flex-col gap-4 shadow hover:shadow-primary transition-all duration-300'>
                        <span className=' text-xl'>
                            Video Metadata
                        </span>
                        <div className='flex flex-col break-words'>
                            {/* <div>
                                <span className=' font-medium pr-2' >Last Modified: </span>
                                <span>{file_metadata.lastModifiedDate.toDateString()}</span>
                            </div> */}
                            <div>
                                <span className=' font-medium pr-2' >FileName: </span>
                                <span>{file_metadata.name}</span>
                            </div>
                            <div>
                                <span className=' font-medium pr-2' > Size: </span>
                                <span>{file_metadata.size}</span>
                            </div>
                            <div>
                                <span className=' font-medium pr-2' >Video type: </span>
                                <span>{file_metadata.type}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </>
        )
    }
    else {
        console.log(response_data);
        return (<>
            <div className='flex flex-col px-24 py-16'>
                <div className='text-xl bg-red-500 px-2' >ERROR OCCURED</div>
                <div className='text-lg bg-red-800 text-white px-2' >{response_data["message"]}</div>
            </div>
        </>)
    }
}

export default ResultsVideoUI;