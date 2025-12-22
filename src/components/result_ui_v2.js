"use client";
import LineChart from "@/components/LineChart";
import { useRef, useState, useEffect } from "react";
import { VideoPlayer } from "@/components/Video_Player";
import Waveform from "@/components/Waveform";
import { Download, UserCircle2, PlusCircle, ChevronRight, AudioLines } from "lucide-react"
import Image from "next/image";

import { video_pdf } from "./pdf_creation";

export default function Result_UI({ results, analysisTypes, file_metadata, fileUrl, handle_new_analysis = null }) {

    console.log("face labels = ", results["face_labels"])
    const videoRef = useRef(null);
    const audio_graph_Ref = useRef(null);
    const frame_graph_Ref = useRef(null);
    const frame_person_refs = [useRef(null), useRef(null), useRef(null)];

    const [curr_model, set_curr_model] = useState(analysisTypes["frameCheck"] ? "frameCheck" : analysisTypes["audioAnalysis"] ? "audioAnalysis" : "");
    const [toggle_open, set_toggle_open] = useState(null);

    let result_values = null;
    let bboxes_data = null;

    let frame_charts = null;
    let audio_chart = null;
    let fps = results["frameCheck"] ? results["frameCheck"]["video_fps"] : 25;

    useEffect(() => {
        set_curr_model(analysisTypes["frameCheck"] ? "frameCheck" : analysisTypes["audioAnalysis"] ? "audioAnalysis" : "");
    }, [analysisTypes, videoRef])

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

    const handle_pdf_creation = async () => {
        console.log("creating pdf");
        await video_pdf(analysisTypes, results, result_values, file_metadata, audio_graph_Ref, frame_person_refs);
    }

    const get_chart_data = (duration, person_obj_list, threshold = 0.7) => {
        let person_prediction_data = {}
        for (let i = 0; i <= duration; i++)
            person_prediction_data[i] = 0.5;

        if (person_obj_list.length === 0) {
            return { person_prediction_data, mean_prediction_value: 0.5 };
        }

        let used_values = [];

        let count = 0;
        let prediction_sum = 0;
        let curr_processing_time = Math.floor(person_obj_list[0].start_index / fps);

        for (let person_data of person_obj_list) {
            const time = Math.floor(person_data.start_index / fps);
            if (curr_processing_time !== time) {
                if (count > 0) {
                    let prediction_value = prediction_sum / count;
                    prediction_value = normalize_value(prediction_value, threshold);
                    person_prediction_data[curr_processing_time] = prediction_value;
                }

                count = 1;
                prediction_sum = person_data.prediction;
                curr_processing_time = time;
            }
            else {
                prediction_sum += person_data.prediction;
                count += 1;
            }
            used_values.push(person_data.prediction)
        }

        // Final processing for the last accumulated chunk
        if (count > 0) {
            let prediction_value = prediction_sum / count;
            prediction_value = normalize_value(prediction_value, threshold);
            person_prediction_data[curr_processing_time] = prediction_value;
        }

        const mean_result = used_values.length > 0 ? used_values.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / used_values.length : 0.5;
        let mean_prediction_value = normalize_value(mean_result, threshold);

        return { person_prediction_data, mean_prediction_value };
    }

    const update_frame_chart = () => {
        let temp_chart_data = {};
        let temp_frame_values = {};

        const duration = results["frameCheck"]["duration"];
        const threshold_for_graph = 0.5;
        const threshold = results["frameCheck"]["threshold"];

        if (Array.isArray(results["frameCheck"]["labels_result"])) {
            // AIGC detection results on the whole videos
            let aigc_result_values = results["frameCheck"]["labels_result"]
            const { person_prediction_data, mean_prediction_value } = get_chart_data(duration, aigc_result_values, threshold);
            temp_frame_values = {
                "prediction": mean_prediction_value > 0.5,
                "percentage": (mean_prediction_value * 100).toFixed(2),
                "data_points": aigc_result_values.length,
                "per_second_data": person_prediction_data
            };

            // format for charts
            temp_chart_data = {

                labels: Object.keys(person_prediction_data).map(
                    (idx) => { return idx }
                ),
                datasets: [
                    {
                        label: "Probability of real",
                        data: Object.values(person_prediction_data),
                        backgroundColor: Object.values(person_prediction_data).map((pred) => {
                            return pred >= threshold_for_graph ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)" // Emerald/Rose
                        }),
                        barPercentage: 1,
                        borderRadius: 100,
                        inflateAmount: 1,
                        base: threshold_for_graph
                    },
                    {
                        type: 'line',
                        borderColor: "rgba(24, 24, 27, 0.2)", // Zinc-900
                        pointRadius: 0,
                        fill: {
                            target: { value: threshold_for_graph },
                            above: "rgba(16, 185, 129, 0.1)",
                            below: "rgba(244, 63, 94, 0.1)"
                        },
                        lineTension: 0.4,
                        spanGaps: true,
                        data: Object.values(person_prediction_data),
                        borderWidth: 1,
                    },
                ]
            };

        }
        else {
            // deepfake detection results on faces (distinguished by face labels)
            for (let label in results["frameCheck"]["labels_result"]) {
                if (results["face_labels"].length > 0 && !results["face_labels"].includes(label)) {
                    continue;
                }
                const person = results["frameCheck"]["labels_result"][label];
                const { person_prediction_data, mean_prediction_value } = get_chart_data(duration, person, threshold);

                temp_frame_values[label] = {
                    "prediction": mean_prediction_value > 0.5,
                    "percentage": (mean_prediction_value * 100).toFixed(2),
                    "data_points": person.length,
                    "per_second_data": person_prediction_data
                };

                temp_chart_data[label] = {

                    labels: Object.keys(person_prediction_data).map(
                        (idx) => { return idx }
                    ),
                    datasets: [

                        {
                            label: "Probability of real",
                            data: Object.values(person_prediction_data),
                            backgroundColor: Object.values(person_prediction_data).map((pred) => {
                                return pred >= threshold_for_graph ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)" // Emerald/Rose
                            }),
                            barPercentage: 1,
                            borderRadius: 100,
                            inflateAmount: 1,
                            base: threshold_for_graph
                        },
                        {
                            type: 'line',
                            borderColor: "rgba(24, 24, 27, 0.2)", // Zinc-900
                            pointRadius: 0,
                            fill: {
                                target: { value: threshold_for_graph },
                                above: "rgba(16, 185, 129, 0.1)",
                                below: "rgba(244, 63, 94, 0.1)"
                            },
                            lineTension: 0.4,
                            spanGaps: true,
                            data: Object.values(person_prediction_data),
                            borderWidth: 1,
                        },
                    ]
                };
            }
        }
        frame_charts = temp_chart_data;
        return temp_frame_values;
    }

    const update_audio_chart = () => {
        let temp_chart_data = {};
        const threshold_for_graph = 0.5;
        const threshold = results["audioAnalysis"]["threshold"];

        temp_chart_data = {

            labels: results["audioAnalysis"]["table_data"].map(
                (data_pt) => formatTime(data_pt["index"])
            ),
            datasets: [
                {
                    label: "Probability of real",
                    data: results["audioAnalysis"]["table_data"].map((data_pt) => normalize_value(data_pt["prediction"], threshold)),
                    backgroundColor: results["audioAnalysis"]["table_data"].map((data_pt) => {
                        return normalize_value(data_pt["prediction"], threshold) >= threshold_for_graph ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)"
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
                    data: results["audioAnalysis"]["table_data"].map((data_pt) => normalize_value(data_pt["prediction"], threshold)),
                    borderWidth: 1,
                },
            ]
        };
        audio_chart = temp_chart_data;

        const prediction_value = results["audioAnalysis"]["result"];
        const normalized_prediction = normalize_value(prediction_value, threshold);

        return {
            "prediction": normalized_prediction > threshold_for_graph,
            "percentage": (normalized_prediction * 100).toFixed(2)
        }

    }

    const update_bboxes_data = () => {
        let temp_bbox_data = {};

        const duration = results["frameCheck"]["duration"];
        const threshold = results["frameCheck"]["threshold"];

        for (let i = 0; i <= duration; i++) {
            temp_bbox_data[i] = [];
        }
        for (let label in results["frameCheck"]["labels_result"]) {
            if (results["face_labels"].length > 0 && !results["face_labels"].includes(label)) {
                continue;
            }
            const person = results["frameCheck"]["labels_result"][label];

            let label_bboxes = {};

            for (let frame_data of person) {
                const time = Math.floor(frame_data.start_index / fps);
                const pred = frame_data.prediction >= threshold;
                label_bboxes[time] = { "bbox": frame_data.bbox, "pred": pred };
            }
            for (let time in label_bboxes) {
                temp_bbox_data[time].push(label_bboxes[time]);
            }
        }
        bboxes_data = temp_bbox_data;
    }

    if (results["frameCheck"] || results["audioAnalysis"]) {
        console.log("creating graphs, results");

        let temp_result_values = {
            "frameCheck": undefined,
            "audioAnalysis": undefined
        };
        if (results["frameCheck"]) {
            temp_result_values["frameCheck"] = update_frame_chart();
            // make bboxes only in case of deepfake face labels not AIGC
            if (temp_result_values["frameCheck"]["prediction"] === undefined)
                update_bboxes_data();
        }

        if (results["audioAnalysis"])
            temp_result_values["audioAnalysis"] = update_audio_chart();

        result_values = temp_result_values;
    }


    // Hidden container for capturing graphs for PDF
    const PDFGraphContainer = () => (
        <div style={{ position: "fixed", left: "-10000px", top: 0, width: "600px", visibility: "visible", zIndex: -100 }}>
            {/* Audio Chart */}
            {results?.audioAnalysis && audio_chart && (
                <div ref={audio_graph_Ref} style={{ width: "100%", height: "300px", background: "white" }}>
                    <LineChart chartData={audio_chart} />
                </div>
            )}

            {/* Frame Charts */}
            {results?.frameCheck && frame_charts && result_values?.frameCheck && (
                result_values["frameCheck"]["prediction"] === undefined ?
                    (
                        // DEEPFAKE FACE DETECTION RESULT
                        <div>
                            {Object.keys(results["frameCheck"].labels_result)
                                .filter((v) => results["face_labels"].length === 0 || results["face_labels"].includes(v))
                                .sort((a, b) => result_values["frameCheck"][b]["data_points"] - result_values["frameCheck"][a]["data_points"])
                                .slice(0, 3)
                                .map((label, idx) => (
                                    <div key={idx} ref={frame_person_refs[idx]} style={{ width: "100%", height: "300px", background: "white", marginTop: "20px" }}>
                                        <LineChart chartData={frame_charts[label]} />
                                    </div>
                                ))
                            }
                        </div>
                    )
                    :
                    (
                        // AIGC RESULT (frame person ref index is 0 for there is only 1 chart)
                        <div ref={frame_person_refs[0]} style={{ width: "100%", height: "300px", background: "white", marginTop: "20px" }}>
                            <LineChart chartData={frame_charts} />
                        </div>
                    )
            )}
        </div>
    );

    const handle_newCheck = () => {
        if (handle_new_analysis)
            handle_new_analysis();
        else
            window.location.href = "/media-checker"
    }

    return (
        <div className="min-h-screen text-zinc-900 font-sans selection:bg-zinc-200">
            <PDFGraphContainer />
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
                <div className='max-w-[1400px] mx-auto flex w-full justify-between items-center px-6 py-4'>
                    <div className="flex items-center gap-3">
                        {/* <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                        </div> */}
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
                {/* TOP SECTION: VIDEO + SUMMARY CARDS */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* VIDEO CONTAINER */}
                    <div className="lg:col-span-8 space-y-6 h-full flex items-center justify-center">
                        <VideoPlayer
                            videoRef={videoRef}
                            fileUrl={fileUrl}
                            bbox_data={bboxes_data}
                            duration={results[curr_model] ? results[curr_model]["duration"] : 0}
                            model_results={result_values}
                        />
                    </div>

                    {/* SUMMARY CARDS */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 px-2">Analysis Overview</h3>
                        {result_values && Object.keys(result_values).map((val, idx) => {
                            if (result_values[val] === undefined) return null;

                            let pred;
                            let perc;

                            if (val === "audioAnalysis") {
                                pred = result_values[val]["prediction"];
                                perc = result_values[val]["percentage"];
                            } else if (val === "frameCheck") {
                                // find the index for deepfake face detections
                                if (result_values[val]["prediction"] === undefined) {
                                    // Frame check summary logic
                                    const first_label = Object.keys(result_values[val])[0];
                                    if (first_label !== undefined) {
                                        perc = result_values[val][first_label]["percentage"];
                                        pred = result_values[val][first_label]["prediction"];
                                    } else {
                                        perc = 0;
                                        pred = false;
                                    }
                                }
                                else {
                                    pred = result_values[val]["prediction"];
                                    perc = result_values[val]["percentage"];
                                }
                            }

                            const score = Number(pred ? (perc) : (100 - perc)).toFixed(1);

                            return (
                                <div key={idx} className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className='font-bold text-zinc-900'>
                                            {val === "frameCheck" ? "Visual Integrity" : "Audio Integrity"}
                                        </span>
                                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${pred ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                            {pred ? "Authentic" : "Suspicious"}
                                        </span>
                                    </div>

                                    <div className="flex gap-4 h-24 mb-6">
                                        <div className="flex-1 flex flex-col gap-2">
                                            <div className="flex-1 bg-zinc-50 rounded-xl overflow-hidden relative">
                                                <div
                                                    style={{ height: `${100 - perc}%` }}
                                                    className={`absolute bottom-0 w-full transition-all duration-1000 ${pred ? "bg-zinc-200" : "bg-rose-500"}`}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest">Spoof</span>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <div className="flex-1 bg-zinc-50 rounded-xl overflow-hidden relative">
                                                <div
                                                    style={{ height: `${perc}%` }}
                                                    className={`absolute bottom-0 w-full transition-all duration-1000 ${!pred ? "bg-zinc-200" : "bg-emerald-500"}`}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest">Real</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-50 flex items-baseline justify-between">
                                        <span className="text-zinc-500 text-sm font-medium">Confidence</span>
                                        <span className="text-2xl font-light text-zinc-900">{score}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* DETAILED RESULTS SECTION */}
                <section className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-2xl font-semibold tracking-tight text-zinc-800">Technical Breakdown</h3>
                        <div className="bg-zinc-100/80 backdrop-blur-sm p-1 rounded-2xl flex gap-1 w-fit">
                            {Object.keys(analysisTypes).map((analysisType, idx) => {
                                if (!analysisTypes[analysisType]) return null;
                                const isActive = curr_model === analysisType;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => set_curr_model(analysisType)}
                                        className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
                                    >
                                        {analysisType === "frameCheck" ? "Visual Analysis" : analysisType === "audioAnalysis" ? "Audio Analysis" : "Image Analysis"}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {curr_model === "frameCheck" && result_values?.frameCheck && (
                        result_values["frameCheck"]["prediction"] === undefined ?
                            // DEEPFAKE FACE DETECTION RESULT
                            (
                                <div className="grid grid-cols-1 gap-6">
                                    {Object.keys(results["frameCheck"].labels_result)
                                        .filter((v) => results["face_labels"].length === 0 || results["face_labels"].includes(v))
                                        .sort((a, b) => result_values["frameCheck"][b]["data_points"] - result_values["frameCheck"][a]["data_points"])
                                        .slice(0, 3)
                                        .map((label, idx) => {
                                            const perc = result_values?.frameCheck[label]?.percentage || 0;
                                            const pred = result_values?.frameCheck[label]?.prediction || false;
                                            const threshold = results["frameCheck"]["threshold"];

                                            if (isNaN(perc)) return null;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`group bg-white border ${toggle_open === idx ? "border-zinc-300 shadow-md" : "border-zinc-100 shadow-sm hover:border-zinc-300 hover:shadow-md hover:bg-zinc-50/40"} rounded-[2rem] overflow-hidden transition-all duration-500 ease-in-out`}
                                                >
                                                    <div
                                                        onClick={() => set_toggle_open(toggle_open === idx ? null : idx)}
                                                        className="cursor-pointer p-8 flex flex-col md:flex-row items-center gap-10 relative"
                                                    >
                                                        <div className="flex items-center gap-6 min-w-[260px]">
                                                            <div className="relative">
                                                                <div className="w-14 h-14 rounded-2xl overflow-hidden ring-1 ring-zinc-100 group-hover:ring-zinc-200 transition-all duration-500">
                                                                    {results?.frameCheck?.label_faces && results?.frameCheck?.label_faces[label] ? (
                                                                        <Image src={results?.frameCheck?.label_faces[label]} width={56} height={56} alt={`Subject ${idx + 1}`} className="object-cover" />
                                                                    ) : (
                                                                        <UserCircle2 className="size-14 text-zinc-100" strokeWidth={0.5} />
                                                                    )}
                                                                </div>
                                                                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${pred ? "bg-emerald-400" : "bg-rose-400"}`} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.25em] mb-1.5 opacity-80">Subject {idx + 1}</p>
                                                                <div className="flex items-center gap-2.5">
                                                                    <h4 className="text-lg font-medium tracking-tight text-zinc-800">{pred ? "Real" : "Spoof"}</h4>
                                                                    {/* {!pred && <div className="w-1 h-1 rounded-full bg-rose-400 opacity-40" />} */}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-center">
                                                                <ChevronRight className={`size-4 text-zinc-400 group-hover:text-zinc-900 transition-all duration-500 ${toggle_open === idx ? "rotate-90 text-zinc-900" : "group-hover:translate-x-1"}`} />
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 w-full h-8 bg-zinc-100/50 rounded-full overflow-hidden relative transition-colors duration-500">
                                                            {Object.entries(result_values["frameCheck"][label].per_second_data).map(([sec, pred], i) => {
                                                                const total_duration = results["frameCheck"].duration;
                                                                // We use duration + 1 because the chart labels go from 0 to duration (inclusive)
                                                                let width = 100 / (total_duration + 1);
                                                                let start = (100 * parseInt(sec)) / (total_duration + 1);

                                                                // Use the same 0.5 threshold logic as the graph
                                                                if (pred === 0.5) return null;

                                                                const isAuthentic = pred > 0.5;

                                                                return (
                                                                    <div
                                                                        key={i}
                                                                        style={{ width: `${width}%`, left: `${start}%` }}
                                                                        className={`h-full absolute ${isAuthentic ? 'bg-emerald-400' : 'bg-rose-400'} transition-all duration-700`}
                                                                    />
                                                                );
                                                            })}
                                                        </div>

                                                    </div>

                                                    {toggle_open === idx && (
                                                        <div className="px-8 pb-10 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-700">
                                                            <div className="h-[300px] w-full mt-10">
                                                                {frame_charts && <LineChart chartData={frame_charts[label]} />}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            ) :
                            // AIGC DETECTION RESULT
                            (
                                <div className="bg-white border border-zinc-100 rounded-[2rem] overflow-hidden shadow-sm">
                                    <div className="p-8 flex flex-col gap-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                {/* <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${result_values["frameCheck"]["prediction"] ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                                                    <AudioLines className="size-8" />
                                                </div> */}
                                                <div>
                                                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Video Stream</p>
                                                    <h4 className="text-xl font-semibold">{result_values["frameCheck"]["prediction"] ? "Frames Match Source" : "AI Generation Detected"}</h4>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Confidence</p>
                                                <p className="text-3xl font-light">{result_values["frameCheck"]["prediction"] ? (result_values["frameCheck"]["percentage"]).toFixed(2) : (100 - result_values["frameCheck"]["percentage"]).toFixed(2)}%</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="h-[300px]">
                                                <LineChart chartData={frame_charts} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                    )}

                    {curr_model === "audioAnalysis" && result_values?.audioAnalysis && (
                        <div className="bg-white border border-zinc-100 rounded-[2rem] overflow-hidden shadow-sm">
                            <div className="p-8 flex flex-col gap-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${result_values["audioAnalysis"]["prediction"] ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                                            <AudioLines className="size-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Audio Stream</p>
                                            <h4 className="text-xl font-semibold">{result_values["audioAnalysis"]["prediction"] ? "Voice Matches Source" : "AI Generation Detected"}</h4>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Confidence</p>
                                        <p className="text-3xl font-light">{result_values["audioAnalysis"]["prediction"] ? (result_values["audioAnalysis"]["percentage"]).toFixed(2) : (100 - result_values["audioAnalysis"]["percentage"]).toFixed(2)}%</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className=" bg-zinc-50 rounded-2xl overflow-hidden relative">
                                        {videoRef && (
                                            <div className="w-full h-full cursor-pointer" onClick={(e) => {
                                                if (!videoRef.current) return;
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const x = e.clientX - rect.left;
                                                const clickedTime = (x / rect.width) * results["audioAnalysis"]["duration"];
                                                videoRef.current.currentTime = clickedTime;
                                            }}>
                                                <Waveform videoRef={videoRef} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-[300px]">
                                        <LineChart chartData={audio_chart} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* METADATA SECTION */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                    {file_metadata.verifier_comment && (
                        <div className='bg-white border border-zinc-100 p-8 rounded-[2rem] shadow-sm space-y-4'>
                            <h4 className="text-lg font-bold text-black flex items-center gap-2">
                                {/* <span className="w-2 h-2 bg-blue-500 rounded-full" /> */}
                                Expert Analysis
                            </h4>
                            <p className='text-zinc-600 leading-relaxed text-sm whitespace-pre-wrap'>
                                {file_metadata.verifier_comment}
                            </p>
                        </div>
                    )}

                    <div className='bg-white border border-zinc-100 p-8 rounded-[2rem] shadow-sm space-y-6'>
                        <h4 className="text-lg font-bold text-black flex items-center gap-2">
                            {/* <span className="w-2 h-2 bg-zinc-900 rounded-full" /> */}
                            File Metadata
                        </h4>
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