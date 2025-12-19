"use client";
import LineChart from './LineChart';
import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

import { video_pdf } from './pdf_creation';
import { Play, Pause, Download, PlusCircle, AudioLines, Music } from 'lucide-react';

const ResultsAudioUI = ({ response_data, fileUrl, file_metadata, handle_newCheck }) => {

    const duration = response_data["audioAnalysis"]?.duration || 0;
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const audio_graph_ref = useRef(null);

    const [chartData, setChartData] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    // Prepare data for PDF and UI
    const [resultValues, setResultValues] = useState(null);

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const normalize_value = (prediction_value, threshold) => {
        if (prediction_value > threshold) {
            prediction_value = (0.5 * (prediction_value + 1) - threshold) / (1 - threshold);
        }
        else {
            prediction_value = (0.5 * prediction_value) / (threshold);
        }
        return prediction_value;
    }

    useEffect(() => {
        let isMounted = true;
        // Create WaveSurfer
        if (waveformRef.current && !wavesurferRef.current) {
            wavesurferRef.current = WaveSurfer.create({
                container: waveformRef.current,
                url: fileUrl,
                waveColor: '#52525b', // Zinc-600
                progressColor: '#fafafa', // Zinc-50
                height: 128, // matching h-32
                barHeight: 1,
                dragToSeek: true,
                barWidth: 3,
                barGap: 2,
                barRadius: 3,
                cursorColor: 'transparent',
            });

            wavesurferRef.current.on('ready', () => {
                const audio_duration = wavesurferRef.current.getDuration();

                if (response_data["audioAnalysis"]) {
                    const threshold = response_data["audioAnalysis"].threshold;
                    const threshold_for_graph = 0.5;

                    // Parse Data for Chart
                    const audio_chart_data = {
                        labels: response_data['audioAnalysis']["table_data"].map(
                            (val) => {
                                // Calculate time based on index/proportion if needed, or just use index
                                // The original code used a complex mapping. 
                                // Assuming table_data corresponds to 1 second chunks roughly? 
                                // Let's trust the original logic's mapping intention but simplify if possible.
                                // Actually, let's stick to the original logic to align with data:
                                return formatTime(val["index"]);
                            }
                        ),
                        datasets: [
                            {
                                label: "Probability of real",
                                data: response_data['audioAnalysis']["table_data"].map((val) => normalize_value(val["prediction"], threshold)),
                                backgroundColor: response_data['audioAnalysis']["table_data"].map((val) => {
                                    return normalize_value(val["prediction"], threshold) >= threshold_for_graph ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)"
                                }),
                                barPercentage: 1,
                                borderRadius: 100,
                                inflateAmount: 1,
                                base: threshold_for_graph
                            },
                            {
                                type: 'line',
                                borderColor: "rgba(24, 24, 27, 0.2)",
                                pointRadius: 0,
                                fill: {
                                    target: { value: threshold_for_graph },
                                    above: "rgba(16, 185, 129, 0.1)",
                                    below: "rgba(244, 63, 94, 0.1)"
                                },
                                lineTension: 0.4,
                                data: response_data['audioAnalysis']["table_data"].map((val) => normalize_value(val["prediction"], threshold)),
                                borderWidth: 1,
                            },
                        ]
                    };

                    if (isMounted) {
                        setChartData({ "audioAnalysis": audio_chart_data });

                        // Construct resultValues for PDF and Summary
                        const rawResult = response_data["audioAnalysis"].result;
                        const normResult = normalize_value(rawResult, threshold);
                        const isReal = normResult >= 0.5; // Or strict > ? Original used >= threshold logic on raw. 
                        // Raw logic: result >= threshold => Real.
                        // Norm logic: norm >= 0.5 => Real. 

                        setResultValues({
                            "audioAnalysis": {
                                prediction: rawResult >= threshold,
                                percentage: (normResult * 100)
                            }
                        });
                    }
                }
            });

            wavesurferRef.current.on('finish', () => {
                setPlaying(false);
            });
        }

        return () => {
            isMounted = false;
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
        };

    }, [fileUrl, response_data]);

    // Handle WaveSurfer Events externally
    useEffect(() => {
        if (!wavesurferRef.current) return;

        const onTimeUpdate = (currentTime) => {
            const duration = wavesurferRef.current.getDuration();
            setProgress((currentTime / duration) * 100);
        };

        // WaveSurfer 'timeupdate' event passes currentTime
        wavesurferRef.current.on('timeupdate', onTimeUpdate);

        return () => {
            if (wavesurferRef.current)
                wavesurferRef.current.un('timeupdate', onTimeUpdate);
        }
    }, [wavesurferRef.current]);


    const handlePlayPause = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
            setPlaying(wavesurferRef.current.isPlaying());
        }
    };

    const handle_pdf_creation = async () => {
        if (chartData && resultValues) {
            await video_pdf(
                { audioAnalysis: true, frameCheck: false }, // analysisTypes
                response_data, // results (raw)
                resultValues, // result_values (formatted)
                file_metadata,
                audio_graph_ref,
                [] // frame_person_refs
            );
        }
    };

    // Error State
    if (response_data["message"] !== undefined) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[50vh] gap-4'>
                <div className='p-4 bg-rose-100 text-rose-700 rounded-xl border border-rose-200'>
                    <p className='font-bold'>Analysis Error</p>
                    <p>{response_data["message"]}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen text-zinc-900 font-sans selection:bg-zinc-200">

            {/* HIDDEN GRAPH CAPTURE */}
            <div style={{ position: "fixed", left: "-10000px", top: 0, width: "600px", visibility: "visible", zIndex: -100 }}>
                {chartData && (
                    <div ref={audio_graph_ref} style={{ width: "100%", height: "300px", background: "white" }}>
                        <LineChart chartData={chartData["audioAnalysis"]} />
                    </div>
                )}
            </div>

            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
                <div className='max-w-[1400px] mx-auto flex w-full justify-between items-center px-6 py-4'>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold tracking-tight text-black">Deepfake Investigator</h2>
                    </div>
                    {fileUrl && (
                        <div className='flex gap-3 items-center'>
                            <button onClick={handle_newCheck} className='flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full text-zinc-600 border border-zinc-300 bg-white hover:border-zinc-400 transition-all'>
                                New Analysis
                                <PlusCircle className="size-4 text-zinc-600" strokeWidth={2} />
                            </button>
                            <button
                                onClick={handle_pdf_creation}
                                className='flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-all shadow-md'
                            >
                                Export Report
                                <Download className="size-4 text-zinc-50" strokeWidth={2} />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-6 py-10 flex flex-col gap-12">

                {/* TOP SECTION: PLAYER + SUMMARY */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* PLAYER CONTAINER */}
                    <div className="lg:col-span-8 flex items-center justify-center">
                        <div className="w-full bg-zinc-950 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                            {/* BG ACCENTS */}
                            <div className='absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none' />
                            <div className='absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none' />

                            <div className='relative z-10 flex flex-col gap-8'>
                                {/* INFO */}
                                <div className='flex items-center gap-4 text-white/50'>
                                    <div className='p-3 bg-white/5 rounded-full'>
                                        <Music className='size-6 text-white/80' />
                                    </div>
                                    <div className='flex flex-col'>
                                        <span className='text-xs font-bold uppercase tracking-widest text-white/40'>Now Playing</span>
                                        <span className='text-white font-medium truncate max-w-[300px]'>{file_metadata.name}</span>
                                    </div>
                                </div>

                                {/* WAVEFORM */}
                                <div className='w-full'>
                                    <div ref={waveformRef} id="waveform" className='w-full' />
                                </div>

                                {/* CONTROLS */}
                                <div className='flex items-center justify-between'>
                                    <button
                                        onClick={handlePlayPause}
                                        className='flex items-center justify-center w-14 h-14 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10'
                                    >
                                        {playing ? <Pause className="size-6 fill-current" /> : <Play className="size-6 fill-current ml-1" />}
                                    </button>

                                    <div className='flex flex-col items-end'>
                                        <span className='text-3xl font-light text-white tabular-nums tracking-tight'>
                                            {formatTime(wavesurferRef.current?.getCurrentTime() || 0)}
                                        </span>
                                        <span className='text-xs font-medium text-white/40 uppercase tracking-widest'>
                                            / {formatTime(duration)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SUMMARY CARD */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 px-2">Analysis Overview</h3>

                        {resultValues?.audioAnalysis && (
                            <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-6">
                                    <span className='font-bold text-zinc-900'>Audio Integrity</span>
                                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${resultValues.audioAnalysis.prediction ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                        {resultValues.audioAnalysis.prediction ? "Authentic" : "Suspicious"}
                                    </span>
                                </div>

                                <div className="flex gap-4 h-24 mb-6">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="flex-1 bg-zinc-50 rounded-xl overflow-hidden relative">
                                            <div
                                                style={{ height: `${100 - resultValues.audioAnalysis.percentage}%` }}
                                                className={`absolute bottom-0 w-full transition-all duration-1000 ${resultValues.audioAnalysis.prediction ? "bg-zinc-200" : "bg-rose-500"}`}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest">Spoof</span>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="flex-1 bg-zinc-50 rounded-xl overflow-hidden relative">
                                            <div
                                                style={{ height: `${resultValues.audioAnalysis.percentage}%` }}
                                                className={`absolute bottom-0 w-full transition-all duration-1000 ${!resultValues.audioAnalysis.prediction ? "bg-zinc-200" : "bg-emerald-500"}`}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest">Real</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-50 flex items-baseline justify-between">
                                    <span className="text-zinc-500 text-sm font-medium">Confidence</span>
                                    <span className="text-2xl font-light text-zinc-900">{resultValues.audioAnalysis.prediction ? resultValues.audioAnalysis.percentage.toFixed(1) : (100 - resultValues.audioAnalysis.percentage).toFixed(1)}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* DETAILED RESULTS SECTION */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-semibold tracking-tight text-zinc-800">Technical Breakdown</h3>
                    </div>

                    {resultValues?.audioAnalysis && chartData?.audioAnalysis && (
                        <div className="bg-white border border-zinc-100 rounded-[2rem] overflow-hidden shadow-sm">
                            <div className="p-8 flex flex-col gap-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${resultValues.audioAnalysis.prediction ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                                            <AudioLines className="size-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Audio Stream</p>
                                            <h4 className="text-xl font-semibold">{resultValues.audioAnalysis.prediction ? "Voice Matches Source" : "AI Generation Detected"}</h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-[300px] w-full">
                                    <LineChart chartData={chartData["audioAnalysis"]} />
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* METADATA SECTION */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                    {file_metadata.verifier_comment && (
                        <div className='bg-white border border-zinc-100 p-8 rounded-[2rem] shadow-sm space-y-4'>
                            <h4 className="text-lg font-bold text-black flex items-center gap-2">Expert Analysis</h4>
                            <p className='text-zinc-600 leading-relaxed text-sm whitespace-pre-wrap'>
                                {file_metadata.verifier_comment}
                            </p>
                        </div>
                    )}

                    <div className='bg-white border border-zinc-100 p-8 rounded-[2rem] shadow-sm space-y-6'>
                        <h4 className="text-lg font-bold text-black flex items-center gap-2">File Metadata</h4>
                        <div className='space-y-4'>
                            {[
                                { label: "Filename", value: file_metadata.name },
                                { label: "Size", value: file_metadata.size },
                                { label: "Type", value: file_metadata.type }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-50 last:border-0">
                                    <span className='text-zinc-400 text-sm font-medium'>{item.label}</span>
                                    <span className="font-semibold text-zinc-900 text-sm truncate max-w-[200px]">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}

export default ResultsAudioUI;