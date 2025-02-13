import LineChart from './LineChart';
import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

import jsPDF from "jspdf";
import html2canvas from 'html2canvas';
import { Outfit_bold_font } from './outfit-bold-font';
import { Outfit_normal_font } from './outfit-normal-font';
import { logo_base64 } from './logo_base64';
import { Play, Pause, PlusCircle, DownloadFile } from './SVGs';

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
                    last_frame["audioAnalysis"] = Math.max(...response_data['audioAnalysis']["table_data"].map((val) => val["index"]));

                let temp_chart_data = {};

                if (response_data["audioAnalysis"]) {
                    const threshold = response_data["audioAnalysis"].threshold;
                    const audio_chart_data = {
                        labels: response_data['audioAnalysis']["table_data"].map(
                            (val, idx) => {
                                const time = audio_duration * (val["index"] / last_frame["audioAnalysis"]);
                                return formatTime(time);
                            }
                        ),
                        datasets: [
                            {
                                label: "Probablility of real",
                                data: response_data['audioAnalysis']["table_data"].map((val) => val["prediction"]),
                                backgroundColor: response_data['audioAnalysis']["table_data"].map((val, idx) => { return val["prediction"] >= threshold ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)" }),
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
                                data: response_data['audioAnalysis']["table_data"].map((val) => val["prediction"]),
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
        doc.text(`${wavesurferRef.current.getDuration().toFixed(1)} sec`, curr_x, curr_y);

        curr_x = mx;
        curr_y += (2 * fontSize / 72) + (12 / 72) + (30 / 72);

        //AUDIO ANALYSIS START
        fontSize = 18;
        doc.setFontSize(fontSize);

        doc.setFont("Outfit", "bold");
        doc.text("Audio Analysis", curr_x, curr_y);

        curr_y += fontSize / 72 + 6 / 72;

        fontSize = 16;
        doc.setFontSize(fontSize);
        doc.setFont("Outfit", "normal")

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
        doc.text(` ${(audio_result * 100).toFixed(2)} %`, curr_x, curr_y);

        curr_x = mx;
        curr_y += fontSize / 72 + 5 / 72;

        fontSize = 9;
        doc.setFontSize(fontSize);
        doc.setTextColor(0, 0, 0);
        doc.setFont("Outfit", "normal");

        doc.text("( confidence of audio being real )", curr_x, curr_y);
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
                    <h2 className="text-3xl font-semibold px-5 pt-3 py-6">Deepfake Investigator</h2>
                    {
                        fileUrl &&
                        <div className=' flex gap-7 items-center mr-1 '>
                            {/* NEW ANALYSIS */}
                            <div onClick={handle_newCheck} className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-lg shadow-primary shadow'>
                                <PlusCircle className='size-6' strokeWidth={1.5} />
                                New Analysis
                            </div>

                            {/* PDF EXPORT */}
                            <div
                                onClick={async () => { await handle_pdf_creation() }}
                                className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-lg shadow-primary shadow '
                            >
                                <DownloadFile className='size-6' strokeWidth={1.5} />
                                Export Report
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
                                            response_data["audioAnalysis"].result.toFixed(3) >= response_data["audioAnalysis"].threshold &&
                                            <span className='flex gap-1 items-center text-xl'>
                                                <span className='font-medium bg-green-200 px-2 mx-2 py-1 rounded-full w-fit'>No manipulation detected</span>
                                                in<span className='font-medium'>Audio</span>
                                            </span>
                                        }
                                        {/* AUDIO OK */}
                                        {
                                            response_data["audioAnalysis"].result.toFixed(3) < response_data["audioAnalysis"].threshold &&
                                            <span className='flex gap-1 items-center text-xl'>
                                                <span className='font-medium bg-red-200 px-2 mx-2 py-1 rounded-full w-fit'>Manipulation detected</span>
                                                in<span className='font-medium'>Audio</span>
                                            </span>
                                        }
                                    </>
                                )
                            }
                        </div>

                        {/* RESULT */}
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
                                            />
                                        </div>
                                        <span className=' text-xs'>
                                            confidence on real
                                        </span>

                                    </div>
                                )
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
                                <Pause className='size-6' strokeWidth={1.5} />
                                :
                                <Play className='size-6' strokeWidth={1.5} />
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
                {/* VERIFIER COMMENT */}
                {
                    file_metadata.verifier_comment &&
                    (
                        <div className=' bg-stone-100 py-4 px-5 border rounded-lg w-fit min-w-[40vw] flex flex-col gap-4 shadow hover:shadow-primary transition-all duration-300'>
                            <span className=' text-xl'>
                                Expert&apos;s Note
                            </span>
                            <div className='flex flex-col break-words whitespace-pre-wrap'>
                                {file_metadata.verifier_comment}
                            </div>
                        </div>
                    )
                }
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