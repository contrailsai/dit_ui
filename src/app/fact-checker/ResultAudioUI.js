import LineChart from './LineChart';
import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

import jsPDF from "jspdf";
import html2canvas from 'html2canvas';
import { Outfit_bold_font } from './outfit-bold-font';
import { Outfit_normal_font } from './outfit-normal-font';
import { logo_base64 } from './logo_base64';

const ResultsAudioUI = ({ response_data, fileUrl, file_metadata, handle_newCheck }) => {

    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const audio_graph_ref = useRef(null);

    //output results
    const [chartData, setChartData] = useState(null);

    const [playing, setPlaying] = useState(false);

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    useEffect(() => {
        // create wavesurf
        if (waveformRef.current) {

            wavesurferRef.current = WaveSurfer.create({
                container: waveformRef.current,
                url: fileUrl,
                waveColor: '#4f88c8',
                progressColor: '#0253E4',
                height: "auto",
                barHeight: 1,
                dragToSeek: true,
                barWidth: 2,
                barGap: 1,
                barRadius: 2,
            });

            wavesurferRef.current.on('ready', () => {
                const audio_duration = wavesurferRef.current.getDuration();

                let last_frame = {};
                if (response_data["audioAnalysis"] !== undefined)
                    last_frame["audioAnalysis"] = Math.max(...response_data['audioAnalysis'].table_idx);

                let temp_chart_data = {};

                if (response_data["audioAnalysis"]) {
                    const audio_chart_data = {
                        labels: response_data['audioAnalysis'].table_idx.map(
                            (val, idx) => {
                                const time = audio_duration * (val / last_frame["audioAnalysis"]);
                                return formatTime(time);
                            }
                        ),
                        datasets: [
                            {
                                label: "Probablility of tampering (-ve value deems suspicious)",
                                data: response_data['audioAnalysis'].table_values,
                                backgroundColor: response_data['audioAnalysis'].table_values.map((val, idx) => { return val >= -1.3 ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)" }),
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
                    setChartData(temp_chart_data);
                }
            });
        }

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
        };

    }, [waveformRef, response_data])

    const handlePlayPause = () => {
        if (wavesurferRef.current.isPlaying()) {
            wavesurferRef.current.pause();
            setPlaying(false);
        } else {
            wavesurferRef.current.play();
            setPlaying(true);
        }
    };

    const handle_pdf_creation = async () => {

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

        // PRINT FILE DATA
        fontSize = 16;
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
        doc.text(`${wavesurferRef.current.getDuration().toFixed(1)} sec`, curr_x, curr_y);

        curr_x = mx;
        curr_y += fontSize / 72 + 30 / 72;

        //AUDIO ANALYSIS START
        fontSize = 16;
        doc.setFont("Outfit", "bold");
        doc.setFontSize(fontSize);
        doc.text("Audio Analysis", curr_x, curr_y);

        curr_y += fontSize / 72 + 6 / 72;
        fontSize = 12;
        doc.setFont("Outfit", "normal")
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

        const audio_result_element = audio_graph_ref.current;
        let audio_result_canvas = await html2canvas(audio_result_element);
        const audio_result_imgData = audio_result_canvas.toDataURL('image/png');
        const aud_res_img_w = 550 / 72;
        const aud_res_img_h = (audio_result_canvas.height * aud_res_img_w) / audio_result_canvas.width;
        doc.addImage(audio_result_imgData, 'PNG', curr_x, curr_y, aud_res_img_w, aud_res_img_h, '', 'FAST');

        curr_x = mx;
        curr_y += aud_res_img_h + 20 / 72; //gap of 20 px

        doc.save("a4.pdf");
    }


    if (response_data["message"] === undefined) {

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
                                onClick={async () => { await handle_pdf_creation() }}
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
                <div className=" relative w-full flex flex-col lg:gap-3 items-center rounded-lg overflow-hidden ">

                    {/* VERDICT + BUTTON | RESULT + METADATA */}
                    <div className=' w-full flex items-center justify-between px-8 gap-10 '>

                        {/* Verdict */}
                        <div className=' min-w-80 h-fit w-fit'>
                            {
                                response_data["audioAnalysis"] !== undefined && (
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

                        {/* RESULT */}
                        {
                            Object.keys(response_data).map((val, idx) => {
                                let result;
                                if (response_data[val] !== undefined) {
                                    result = (response_data[val].result).toFixed(3);
                                    return (
                                        <div key={idx} className={` bg-white flex flex-col justify-evenly h-full w-fit items-center gap-3 min-w-96 px-5 py-2 rounded-lg shadow ${(result) > -1.3 ? " shadow-green-700" : " shadow-red-700"}  `}>
                                            <span className=' text-xl'>
                                                {
                                                    val === "audioAnalysis" &&
                                                    (`Audio Check Result`)
                                                }
                                            </span>
                                            <span className={` text-2xl px-6 py-2 rounded-full font-semibold ${(result) > -1.3 ? " bg-green-200  text-green-700" : " bg-red-200 text-red-700"}`}>
                                                {result}
                                            </span>
                                            <span className=' text-xs'>
                                                {
                                                    val === "audioAnalysis" &&
                                                    (` < -1.3 deems it suspicious of manipulation `)
                                                }
                                            </span>
                                        </div>
                                    )
                                }
                            })
                        }

                        {/* AUDIO META DATA */}
                        <div className=' bg-white py-4 px-5 border rounded-lg w-fit min-w-96 flex flex-col gap-4 shadow hover:shadow-primary transition-all duration-300'>
                            <span className=' text-xl'>
                                Audio Metadata
                            </span>
                            <div className='flex flex-col break-words'>
                                <div>
                                    <span className=' font-medium pr-2' >FileName: </span>
                                    <span>{file_metadata.name}</span>
                                </div>
                                <div>
                                    <span className=' font-medium pr-2' > Size: </span>
                                    <span>{file_metadata.size}</span>
                                </div>
                                <div>
                                    <span className=' font-medium pr-2' >Audio type: </span>
                                    <span>{file_metadata.type}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* GRAPH AND waveform slider */}
                    <div className=' relative z-10 flex flex-col gap-2 justify-stretch w-full bg-primary border px-3 pb-4 pt-3 rounded-lg '>
                        {/* data chart and slider */}
                        {/* play button */}
                        <button
                            onClick={handlePlayPause}
                            className=" outline-none border-white border-2 w-fit bg-primary text-white text-4xl font-bold py-2 px-2 rounded-full transition-all duration-300 "
                        >
                            {playing ?
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                </svg>
                                :
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                </svg>

                            }
                        </button>

                        <div ref={audio_graph_ref} className="w-full ">
                            {
                                waveformRef !== null &&
                                <div ref={waveformRef} className=' w-full pl-10 pr-4 h-56 bg-white rounded-md' />
                            }
                            {
                                chartData !== null &&
                                <div className=' bg-white max-h-64 w-full px-3 mt-2 rounded-md'>
                                    <LineChart chartData={chartData["audioAnalysis"]} />
                                </div>
                            }
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

export default ResultsAudioUI