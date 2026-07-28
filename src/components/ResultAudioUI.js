import LineChart from './LineChart';
import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

import { video_pdf } from "./pdf_creation";
import { Play, Pause, PlusCircle, DownloadFile } from './SVGs';

const ResultsAudioUI = ({ response_data, fileUrl, file_metadata, handle_newCheck }) => {

    // console.log("ResultsAudioUI", response_data);
    const duration = response_data["audioAnalysis"]?.duration || 0;

    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const audio_graph_ref = useRef(null);

    // console.log(wavesurferRef, "waveformRef");
    //output results
    const [chartData, setChartData] = useState(null);

    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

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
        if (chartData && resultValues) {
            await video_pdf(
                { audioAnalysis: true, frameCheck: false },
                response_data,
                resultValues,
                file_metadata,
                audio_graph_ref,
                []
            );
        }
    }

    useEffect(() => {
        const audio = wavesurferRef?.current?.media;

        const handleTimeUpdate = () => {
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        if (audio.error) {
            console.error(audio.error);
            // setAudioError(audio.error);
            return;
        }

        audio.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
        };
    });


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
                            <div onClick={handle_newCheck} className=' flex items-center gap-2 cursor-pointer text-lg font-medium h-fit px-5 py-2.5 my-6 rounded-full bg-white border border-slate-200 shadow-sm hover:border-primary/40 hover:text-primary transition-all'>
                                <PlusCircle className='size-6' strokeWidth={1.5} />
                                New Analysis
                            </div>

                            {/* PDF EXPORT */}
                            <div
                                onClick={handle_pdf_creation}
                                className=' flex items-center gap-2 cursor-pointer text-lg font-medium h-fit px-5 py-2.5 my-6 rounded-full bg-white border border-slate-200 shadow-sm hover:border-primary/40 hover:text-primary transition-all '
                            >
                                <DownloadFile className='size-6' strokeWidth={1.5} />
                                Export Report
                            </div>
                        </div>
                    }
                </div>

                {/* ANALYSIS */}
                <div className=" relative w-full flex flex-col lg:gap-3 items-center rounded-lg overflow-hidden py-2 ">

                    {/* VERDICT + BUTTON | RESULT + METADATA */}
                    <div className=' w-full flex items-end justify-between px-2 gap-10 '>

                        <div className=' flex flex-col gap-5 w-full items-center py-3'>

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
                                            {/* AUDIO NOT OK */}
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
                                        <div key={idx} className={` w-64 bg-white flex flex-col items-center gap-3 px-5 py-2 rounded-3xl shadow ${pred ? " shadow-green-700" : " shadow-red-700"}  `}>
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

                        {/* AUDIO META DATA */}
                        <div className=' bg-white my-2 py-4 px-5 border border-slate-200 rounded-3xl w-fit min-w-96 flex flex-col gap-4 shadow-card transition-all duration-300'>
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
                    <div className=' relative z-10 flex flex-col gap-3 justify-stretch w-full bg-primary border px-3 pb-3 pt-3 rounded-3xl '>
                        {/* data chart and slider */}
                        {/* play button with time */}
                        <div className=' mx-4 flex gap-3 items-center text-white'>
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
                            <div className="text-lg font-semibold flex flex-row divide-x-2 min-w-9 items-center border-2 border-white rounded-3xl py-2 ">
                                <span className='px-2 min-w-16 text-center'>
                                    {formatTime(wavesurferRef.current?.media?.currentTime || 0)}
                                </span>
                                <span className='px-2 min-w-16 text-center'>
                                    {formatTime(wavesurferRef.current?.media?.duration || 0)}
                                </span>
                            </div>
                        </div>


                        <div ref={audio_graph_ref} className="w-full flex flex-col gap-3 ">
                            {
                                waveformRef !== null &&
                                <div ref={waveformRef} className=' w-full pl-10 pr-4 h-56 bg-white rounded-2xl' />
                            }
                            {
                                chartData !== null &&
                                <div className=' bg-white max-h-64 w-full px-3 rounded-2xl'>
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
                        <div className=' bg-white mt-5 py-4 px-5 border border-slate-200 rounded-3xl w-fit min-w-[40vw] flex flex-col gap-4 shadow-card transition-all duration-300'>
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