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
    const [curr_analysis, set_curr_analysis] = useState(Object.keys(response_data)[0]);


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
            const threshold = response_data['frameCheck'].threshold;
            const frame_chart_data = {
                labels: response_data['frameCheck'].table_idx.map(
                    (val, idx) => {
                        const time = video_duration * (val / last_frame["frameCheck"]);
                        return formatTime(time);
                    }
                ),
                datasets: [

                    {
                        label: "Probablility of real",
                        data: response_data['frameCheck'].table_values.map((val, idx) => {
                            return typeof (val) === "boolean" ? threshold : val
                        }),
                        backgroundColor: response_data['frameCheck'].table_values.map((val, idx) => {
                            if (typeof (val) === 'boolean')
                                return "rgba(100,100,100,0.2)"
                            return val >= threshold ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)"
                        }),
                        // borderColor: response_data['frameCheck'].table_values.map((val, idx) => { return val >= 0 ? "rgba(0,255,0,0.3)" : "rgba(255,0,0,0.3)" }),
                        // borderWidth: 0.75,
                        barPercentage: 1,
                        borderRadius: 100,
                        inflateAmount: 1,
                        base: threshold
                    },
                    {
                        type: 'line',
                        borderColor: "rgba(0,0,100, 0.3)",
                        pointRadius: 0,
                        fill: {
                            target: { value: threshold },
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
            const threshold = response_data['audioAnalysis'].threshold;
            const audio_chart_data = {
                labels: response_data['audioAnalysis'].table_idx.map(
                    (val, idx) => {
                        const time = video_duration * (val / last_frame["audioAnalysis"]);
                        return formatTime(time);
                    }
                ),
                datasets: [
                    {
                        label: "Probablility of real",
                        data: response_data['audioAnalysis'].table_values,
                        backgroundColor: response_data['audioAnalysis'].table_values.map((val, idx) => {
                            return val >= threshold ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)"
                        }),
                        // borderColor: response_data['audioAnalysis'].table_values.map((val, idx) => { return val >= 0 ? "rgba(0,255,0,0.3)" : "rgba(255,0,0,0.3)" }),
                        // borderWidth: 0.5,
                        barPercentage: 1,
                        borderRadius: 100,
                        inflateAmount: 1,
                        base: threshold
                    },
                    {
                        type: 'line',
                        borderColor: "rgba(0,0,100, 0.3)",
                        pointRadius: 0,
                        fill: {
                            target: { value: threshold },
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
    useEffect(() => {

        //RESET THE bboxes and total frames in case frame analysis was added again
        bboxes = response_data?.frameCheck?.bboxes || [];
        set_bbox_idx(0);
        total_frames = response_data?.frameCheck?.table_idx.length || 0;

        // console.log(duration, bboxes.length)

        if (duration !== 0 && bboxes.length !== 0) {
            let new_idx = Math.floor(videoRef.current.currentTime * total_frames / duration)
            // console.log(new_idx);
            set_bbox_idx(new_idx >= total_frames ? total_frames - 1 : new_idx);
        }

        if (response_data.frameCheck) {
            set_curr_analysis("frameCheck");
        }
        else if (response_data.audioAnalysis) {
            set_curr_analysis("audioAnalysis");
        }

        // console.log("video durr", videoRef.current.duration  );
        if (!isNaN(videoRef.current.duration)) {
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
        if (bboxes.length !== 0) {
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
            setTimeout(resolve, 500);
        });

        let temp_curr_analysis = curr_analysis;

        const doc = new jsPDF({ orientation: "p", unit: "in", compress: true });
        doc.addFileToVFS('outfit_normal.ttf', Outfit_normal_font);
        doc.addFileToVFS('outfit_bold.ttf', Outfit_bold_font);

        doc.addFont('outfit_normal.ttf', 'Outfit', 'normal');
        doc.addFont('outfit_bold.ttf', 'Outfit', 'bold');

        doc.setFont("Outfit", "bold");

        const my = 0.6;
        const mx = 0.3;

        let curr_x = mx;
        let curr_y = my;

        let fontSize = 18;
        doc.setFontSize(fontSize);

        // SHOW LOGO AND NAME OF COMPANY
        const logo_img_w = 18 / 72;
        const logo_img_h = 18 / 72

        doc.addImage(logo_base64, 'PNG', curr_x, curr_y - 16 / 72, logo_img_w, logo_img_h);
        curr_x += 16 / 72 + 7 / 72;
        doc.setTextColor(2, 83, 288);
        doc.text('Contrails AI', curr_x, curr_y - 2 / 72);


        curr_x = mx;
        curr_y += fontSize / 72 + 14 / 72; //go down (1. for the above comapny name text, 2. for space b/t the 2 text)

        // PRINT Heading (bold)
        fontSize = 24;
        doc.setFontSize(fontSize);
        doc.setTextColor(0, 0, 0);
        doc.text("Manipulation Detection Report", curr_x, curr_y);
        curr_y += fontSize / 72 + 10 / 72;

        // PRINT FILE DATA
        fontSize = 18;
        doc.setFontSize(fontSize);
        doc.text("File Data", curr_x, curr_y);

        curr_y += fontSize / 72 + 6 / 72;

        fontSize = 12;
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
        curr_y += (fontSize / 72) + (6 / 72);

        if(file_metadata.verifier_comment){
            //FILE DURATION
            doc.setFont("Outfit", "bold");
            doc.text("Expert's Comment: ", curr_x, curr_y);
            curr_x += 120 / 72;
            doc.setFont("Outfit", "normal")
            doc.text(`${file_metadata.verifier_comment}`, curr_x, curr_y);
            
            curr_x = mx;
            curr_y += (2 * fontSize / 72) + (12 / 72);
        }
        else{
            curr_y += (fontSize / 72) + (6 / 72);
        }

        // SHOW VIDEO PREVIEW, RESULT OF BOTH ANALYSIS AND VERDICT
        // const result_element = result_ref.current;
        // let result_canvas = await html2canvas(result_element);
        // const result_imgData = result_canvas.toDataURL('image/png');
        // const res_img_w = 550 / 72;
        // const res_img_h = (result_canvas.height * res_img_w) / result_canvas.width;
        // doc.addImage(result_imgData, 'PNG', curr_x, curr_y, res_img_w, res_img_h, '', 'FAST');

        // doc.setFillColor(2, 83, 288)
        // doc.rect(curr_x, curr_y, 20*16/72, 20*9/72, 'F')
        fontSize = 18;
        doc.setFontSize(fontSize);
        doc.setFont("Outfit", "bold");
        doc.text("Result", curr_x, curr_y);
        doc.setFont("Outfit", "normal");
        curr_y += fontSize / 72 + 6 / 72;
        fontSize = 12;

        if (analysisTypes["audioAnalysis"]) {
            doc.setFontSize(14);
            if (response_data["audioAnalysis"] && response_data["audioAnalysis"]["result"] < response_data["audioAnalysis"]["threshold"]) {
                doc.text(`Manipulation detected in Audio`, curr_x, curr_y);
            }
            else {
                doc.text(`No manipulation detected in Audio`, curr_x, curr_y);
            }
            doc.setFontSize(fontSize);
            curr_y += fontSize / 72 + 4 / 72;
        }
        if (analysisTypes["audioAnalysis"] && analysisTypes["frameCheck"] && response_data["audioAnalysis"] && response_data["frameCheck"]) {
            doc.text('and', curr_x, curr_y);
            curr_y += fontSize / 72 + 6 / 72;
        }
        if (analysisTypes["frameCheck"]) {
            doc.setFontSize(14);
            if (response_data["frameCheck"] && response_data["frameCheck"]["result"] < response_data["frameCheck"]["threshold"]) {
                doc.text(`Manipulation detected in Video`, curr_x, curr_y);
            }
            else {
                doc.text(`No manipulation detected in Video`, curr_x, curr_y);
            }
            doc.setFontSize(fontSize);
            curr_y += fontSize / 72;
            curr_x = mx;
        }
        curr_y += 10 / 72; //gap of 20 px

        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(1 / 72);
        doc.line(curr_x, curr_y, curr_x + 550 / 72, curr_y);

        curr_y += 30 / 72;

        if (response_data["audioAnalysis"] !== undefined) {

            //AUDIO ANALYSIS START
            fontSize = 18;
            doc.setFontSize(fontSize);
            doc.text("Audio Analysis", curr_x, curr_y);

            curr_y += fontSize / 72 + 6 / 72;

            set_curr_analysis("audioAnalysis");
            // Wait for the state update to be applied
            await new Promise(resolve => {
                setTimeout(resolve, 100);
            });

            fontSize = 16;
            doc.setFontSize(fontSize);

            const audio_result = (response_data["audioAnalysis"].result).toFixed(4);
            const threshold = response_data["audioAnalysis"].threshold

            if (audio_result >= threshold) {
                doc.text("The audio analysis detected no manipulation", curr_x, curr_y);
            }
            else {
                doc.text("The audio analysis detected manipulation", curr_x, curr_y);
            }
            curr_y += fontSize / 72 + 8 / 72;

            fontSize = 14;
            doc.setFontSize(fontSize);

            doc.text("Audio result: ", curr_x, curr_y);

            curr_x += 90 / 72;
            doc.setFont("Outfit", "bold");

            audio_result >= threshold ? doc.setTextColor(5, 160, 20) : doc.setTextColor(200, 30, 30);
            doc.text(` ${audio_result >= threshold ? "Real" : "Fake"} `, curr_x, curr_y);

            doc.setTextColor(0, 0, 0);
            doc.setFont("Outfit", "normal");
            curr_x = mx;
            curr_y += fontSize / 72 + 6 / 72;
            doc.text("Real Score: ", curr_x, curr_y);

            curr_x += 90 / 72;
            doc.setFont("Outfit", "bold");
            audio_result >= threshold ? doc.setTextColor(5, 160, 20) : doc.setTextColor(200, 30, 30);
            doc.text(` ${audio_result * 100} %`, curr_x, curr_y);

            curr_x = mx;
            curr_y += fontSize / 72 + 5 / 72;

            fontSize = 9;
            doc.setFontSize(fontSize);
            doc.setTextColor(0, 0, 0);
            doc.setFont("Outfit", "normal");

            doc.text("(confidence of audio being real)", curr_x, curr_y);
            curr_y += 2 * fontSize / 72;

            const audio_result_element = audio_graph_Ref.current;
            let audio_result_canvas = await html2canvas(audio_result_element);
            const audio_result_imgData = audio_result_canvas.toDataURL('image/png');
            const aud_res_img_w = 550 / 72;
            const aud_res_img_h = (audio_result_canvas.height * aud_res_img_w) / audio_result_canvas.width;
            doc.addImage(audio_result_imgData, 'PNG', curr_x, curr_y, aud_res_img_w, aud_res_img_h, '', 'FAST');

            curr_x = mx;
            curr_y += aud_res_img_h + 30 / 72; //gap of 30 px

            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(1 / 72);
            doc.line(curr_x, curr_y, curr_x + 550 / 72, curr_y);

            curr_y += 30 / 72;
        }

        if (response_data["frameCheck"] !== undefined) {

            //FRAME ANALYSIS START
            fontSize = 18;
            doc.setFontSize(fontSize);
            doc.text("Frame Analysis", curr_x, curr_y);

            curr_y += fontSize / 72 + 6 / 72;

            set_curr_analysis("frameCheck");
            // Wait for the state update to be applied
            await new Promise(resolve => {
                setTimeout(resolve, 100);
            });

            fontSize = 16;
            doc.setFontSize(fontSize);

            const frame_result = (response_data["frameCheck"].result).toFixed(4);
            const threshold = response_data["frameCheck"].threshold;

            if (frame_result >= threshold) {
                doc.text("The video frames analysis detected no manipulation", curr_x, curr_y);
            }
            else {
                doc.text("The video frames analysis detected manipulation", curr_x, curr_y);
            }
            curr_y += fontSize / 72 + 8 / 72;

            fontSize = 14;
            doc.setFontSize(fontSize);

            doc.text("Frame result: ", curr_x, curr_y);

            curr_x += 90 / 72;
            doc.setFont("Outfit", "bold");

            frame_result >= threshold ? doc.setTextColor(5, 160, 20) : doc.setTextColor(200, 30, 30);
            doc.text(` ${frame_result >= threshold ? "Real" : "Fake"} `, curr_x, curr_y);

            doc.setTextColor(0, 0, 0);
            doc.setFont("Outfit", "normal");
            curr_x = mx;
            curr_y += fontSize / 72 + 6 / 72;
            doc.text("Real Score: ", curr_x, curr_y);

            curr_x += 90 / 72;
            doc.setFont("Outfit", "bold");
            frame_result >= threshold ? doc.setTextColor(5, 160, 20) : doc.setTextColor(200, 30, 30);
            doc.text(` ${frame_result * 100} %`, curr_x, curr_y);

            curr_x = mx;
            curr_y += fontSize / 72 + 5 / 72;

            fontSize = 9;
            doc.setFontSize(fontSize);
            doc.setTextColor(0, 0, 0);
            doc.setFont("Outfit", "normal");

            doc.text("(confidence of video frames being real)", curr_x, curr_y);
            curr_y += 2 * fontSize / 72;

            const frame_result_element = frame_graph_Ref.current;
            let frame_result_canvas = await html2canvas(frame_result_element);
            const frame_result_imgData = frame_result_canvas.toDataURL('image/png');
            const frm_res_img_w = 550 / 72;
            const frm_res_img_h = (frame_result_canvas.height * frm_res_img_w) / frame_result_canvas.width;
            doc.addImage(frame_result_imgData, 'PNG', curr_x, curr_y, frm_res_img_w, frm_res_img_h, '', 'FAST');

            curr_x = mx;
            curr_y += frm_res_img_h + 30 / 72; //gap of 30 px
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
                    <h2 className="text-3xl font-semibold px-5 pt-3 py-6">Deepfake Investigator</h2>
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
                                            <span className='flex flex-col items-center '>
                                                {
                                                    response_data["frameCheck"].result.toFixed(3) >= response_data["frameCheck"].threshold ?
                                                        (
                                                            <span className='flex gap-1 items-center text-xl '>
                                                                <span className='font-medium bg-green-200 px-3 py-1 rounded-full w-fit'>No manipulation detected</span>
                                                                in <span className='font-medium'>Video</span>
                                                            </span>
                                                        )
                                                        :
                                                        (
                                                            <span className='flex gap-1 items-center text-xl '>
                                                                <span className='font-medium bg-red-200 px-2 py-1 rounded-full w-fit'>Manipulation detected</span>
                                                                in <span className='font-medium'>Video</span>
                                                            </span>
                                                        )
                                                }
                                                <span className=' text-sm py-3'>
                                                    and
                                                </span>
                                                {
                                                    response_data["audioAnalysis"].result.toFixed(3) >= response_data["audioAnalysis"].threshold ?
                                                        (
                                                            <span className='flex gap-1 items-center text-xl '>
                                                                <span className='font-medium bg-green-200 px-3 py-1 rounded-full w-fit'>No manipulation detected</span>
                                                                in <span className='font-medium'>Audio</span>
                                                            </span>
                                                        )
                                                        :
                                                        (
                                                            <span className='flex gap-1 items-center text-xl '>
                                                                <span className='font-medium bg-red-200 px-2 py-1 rounded-full w-fit'>Manipulation detected</span>
                                                                in <span className='font-medium'>Audio</span>
                                                            </span>
                                                        )
                                                }
                                            </span>
                                        </>
                                    )
                                }
                                {/* ONLY VIDEO 2-CASES */}
                                {
                                    response_data["frameCheck"] !== undefined && response_data["audioAnalysis"] === undefined
                                    &&
                                    (
                                        <>
                                            {
                                                response_data["frameCheck"].result.toFixed(3) >= response_data["frameCheck"].threshold ?
                                                    (
                                                        <span className='flex gap-1 items-center text-xl '>
                                                            <span className='font-medium bg-green-200 px-3 py-1 rounded-full w-fit'>No manipulation detected</span>
                                                            in <span className='font-medium'>Video</span>
                                                        </span>
                                                    )
                                                    :
                                                    (
                                                        <span className='flex gap-1 items-center text-xl '>
                                                            <span className='font-medium bg-red-200 px-2 py-1 rounded-full w-fit'>Manipulation detected</span>
                                                            in <span className='font-medium'>Video</span>
                                                        </span>
                                                    )
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
                                            {
                                                response_data["audioAnalysis"].result.toFixed(3) >= response_data["audioAnalysis"].threshold ?
                                                    (
                                                        <span className='flex gap-1 items-center text-xl '>
                                                            <span className='font-medium bg-green-200 px-3 py-1 rounded-full w-fit'>No manipulation detected</span>
                                                            in <span className='font-medium'>Audio</span>
                                                        </span>
                                                    )
                                                    :
                                                    (
                                                        <span className='flex gap-1 items-center text-xl '>
                                                            <span className='font-medium bg-red-200 px-2 py-1 rounded-full w-fit'>Manipulation detected</span>
                                                            in <span className='font-medium'>Audio</span>
                                                        </span>
                                                    )
                                            }
                                        </>
                                    )
                                }
                            </div>
                            <div className="flex flex-col justify-between ">
                                {/* REAL-FAKE INDICATOR */}
                                <>
                                    {/* <div className="relative  w-[340px] ml-5 mb-12 mt-4">
                                    <input
                                        type="range"
                                        className={`result-slider ${prediction["prediction"] ? "green" : "red"} absolute w-[400px] outline-none transition-all duration-300 cursor-default`}
                                        min="0"
                                        max="100"
                                        value={prediction["prediction"] ? prediction["percentage"] : 100 - prediction["percentage"]}
                                    // Note: Use "disabled" instead of "disable"
                                    />
                                    <div className="absolute w-0.5 bg-blue-100/80 h-7 left-[200px] z-10 " >
                                        <span className=' relative top-7  -left-1'>
                                            0
                                        </span>
                                    </div>
                                    <div className="absolute w-0.5 bg-blue-100/80 h-8 left-[100px] z-10" >
                                    <span className=' relative top-7  -left-2'>
                                    50
                                    </span>
                                    </div>
                                    <div className="absolute w-0.5 bg-blue-100/80 h-8 left-[300px] z-10" >
                                    <span className=' relative top-7  -left-2'>
                                    50
                                    </span>
                                    </div>
                                    <div className="absolute -top-6 text-sm left-3 text-red-700 font-semibold ">
                                        Fake
                                    </div>
                                    <div className=" absolute text-sm -top-6 -right-12 text-green-700 font-semibold">
                                        Real
                                    </div>
                                    <div
                                        className="absolute z-50 bg-white text-black flex items-center justify-center rounded-full p-1 transform -translate-y-1/2 border-4"
                                        style={{
                                            left: `${prediction["prediction"] ? prediction["percentage"] : 100 - prediction["percentage"]}%`,
                                            top: '12.5px',
                                            width: '60px',
                                            height: '60px',
                                            borderColor: `${prediction["prediction"] ? 'green' : 'red'}`
                                        }}
                                    >
                                        {prediction["percentage"]}
                                    </div>
                                </div>  */}

                                </>
                                {/* FRAME, AUDIO RESULTS BOXES */}
                                <div className=' flex justify-evenly items-center py-4 w-full gap-4 '>
                                    {
                                        // result of all analysis
                                        Object.keys(response_data).map((val, idx) => {
                                            if (response_data[val] == undefined)
                                                return

                                            let pred = response_data[val].result > response_data[val].threshold;
                                            let perc = (response_data[val].result * 100).toFixed(2);
                                            return (
                                                <div key={idx} className={` w-64 bg-white flex flex-col items-center gap-3 px-5 py-2 rounded-lg shadow ${pred ? " shadow-green-700" : " shadow-red-700"}  `}>
                                                    <span className=' text-xl'>
                                                        {
                                                            val === "frameCheck" &&
                                                            (
                                                                <div className="flex flex-col gap-2">
                                                                    <span className=''>
                                                                        <span className=' pr-4'>
                                                                            Frame Result:
                                                                        </span>
                                                                        <span className={` w-full text-center font-semibold ${pred ? " text-green-700" : "text-red-700"}`}>
                                                                            {pred ? "Real" : "Fake"}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            )
                                                        }
                                                        {
                                                            val === "audioAnalysis" &&
                                                            (

                                                                <div className="flex flex-col gap-2">
                                                                    <span className=''>
                                                                        <span className=' pr-4'>
                                                                            Audio Result:
                                                                        </span>
                                                                        <span className={` w-full text-center font-semibold ${pred ? " text-green-700" : "text-red-700"}`}>
                                                                            {pred ? "Real" : "Fake"}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            )
                                                        }
                                                    </span>
                                                    <div className=' flex  items-center w-full gap-2'>
                                                        <span>
                                                            Score:
                                                        </span>
                                                        <span className={` mx-auto text-2xl px-3 py-1 rounded-full  font-semibold ${pred ? " bg-green-200  text-green-700" : " bg-red-200  text-red-700"}`}>
                                                            {perc} %
                                                        </span>
                                                    </div>
                                                    <div className="relative left-0 top-0 h-3 my-3 ml-16 w-[236px] " >
                                                        <input
                                                            type="range"
                                                            className={`result-seperate-slider absolute w-[168px] outline-none transition-all duration-300 cursor-default`}
                                                            min="0"
                                                            max="100"
                                                            value={perc}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <span className=' text-xs'>
                                                        confidence on real
                                                    </span>

                                                </div>
                                            )
                                        })
                                    }
                                </div>
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
                                        className={` ${taking_ss ? 'hidden' : ''} z-10 absolute border-4 rounded ${response_data["frameCheck"]["table_values"][bbox_idx] >= response_data["frameCheck"]["threshold"] ? " border-green-500 " : "border-red-500"} transition-all duration-75 `}
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

                                    <div className={` ${taking_ss ? 'hidden' : ''}  ${response_data["frameCheck"]["table_values"][bbox_idx] >= response_data["frameCheck"]["threshold"] ? "bg-green-300" : "bg-red-300"} rounded-lg py-1 px-5 `}>
                                        {
                                            response_data["frameCheck"]["table_values"][bbox_idx] >= response_data["frameCheck"]["threshold"] ?
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
                                <div className={`${curr_analysis === "audioAnalysis" ? "" : "hidden"} pl-10 pr-3`} >
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


                <div className=' flex gap-5 pt-4 items-start justify-between '>

                    {/* VERIFIER COMMENT */}
                    {
                        file_metadata.verifier_comment &&
                        (
                            <div className=' bg-slate-100 py-4 px-5 border rounded-lg w-fit min-w-[40vw] flex flex-col gap-4 shadow hover:shadow-primary transition-all duration-300'>
                                <span className=' text-xl'>
                                    Expert&apos;s Note
                                </span>
                                <div className='flex flex-col break-words whitespace-pre-wrap'>
                                        {file_metadata.verifier_comment}
                                </div>
                            </div>
                        )
                    }

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