"use client";
import LineChart from "@/components/LineChart";
import { useRef, useState, useEffect } from "react";
import { VideoPlayer } from "@/components/Video_Player";
import Waveform from "@/components/Waveform";
import jsPDF from "jspdf";
import html2canvas from 'html2canvas';
import { Outfit_bold_font } from './outfit-bold-font';
import { Outfit_normal_font } from './outfit-normal-font';
import { logo_base64 } from './logo_base64';
import { DownloadFile, PersonCircle, PlusCircle, RightArrow } from "./SVGs";
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

    // console.log("res = ",results)

    useEffect(() => {
        set_curr_model(analysisTypes["frameCheck"] ? "frameCheck" : analysisTypes["audioAnalysis"] ? "audioAnalysis" : "");
    }, [analysisTypes, videoRef])

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const normalize_value = (prediction_value, threshold) => {
        // NORMALIZE IT TO BE CORRECT   (0 - th) => (0, 0.5) and (th - 1) => (0.5 - 1) use y=mx+c to make the eqs
        if (prediction_value > threshold) {
            prediction_value = (0.5 * (prediction_value + 1) - threshold) / (1 - threshold);
        }
        else {
            prediction_value = (0.5 * prediction_value) / (threshold);
        }
        return prediction_value;
    }

    //-------------------------------------------------
    const get_chart_data = (duration, person_obj_list, threshold = 0.7) => {
        let person_prediction_data = {}
        // default value 0.7 (if no data at that timestamp (frames in 1 sec))
        for (let i = 0; i <= duration; i++)
            person_prediction_data[i] = 0.5;

        if (!person_obj_list || !Array.isArray(person_obj_list)) {
            console.log("person_obj_list is not an array:", person_obj_list);
            return { person_prediction_data, mean_prediction_value: 0.5 };
        }

        let used_values = [];

        let count = 0;
        let prediction_sum = 0;
        let curr_processing_time = 0;
        // iterating through all data points of this person each point contains (start_index, end_index, predisction)
        for (let person_data of person_obj_list) {
            const time = Math.floor(person_data.start_index / fps);
            if (curr_processing_time !== time) {
                // set the value to the average of all values in that second
                let prediciton_value = prediction_sum / count;

                prediciton_value = normalize_value(prediciton_value, threshold);
                person_prediction_data[curr_processing_time] = prediciton_value;
                // reset values with the new time value
                count = 1;
                prediction_sum = 0;
                curr_processing_time = time;
            }
            else {
                prediction_sum += person_data.prediction;
                count += 1;
            }
            used_values.push(person_data.prediction)
        }

        const mean_result = used_values.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / used_values.length;
        let mean_prediction_value = normalize_value(mean_result, threshold);

        return { person_prediction_data, mean_prediction_value };
    }

    // 3 cases
    // using only returned values good looking curves, inconsistent with time frames 
    // USING BOTJH 

    const update_frame_chart = () => {
        let temp_chart_data = {};
        let temp_frame_values = {};

        const duration = results["frameCheck"]["duration"];
        const threshold_for_graph = 0.5; // since we normalize it
        const threshold = results["frameCheck"]["threshold"];

        if (Array.isArray(results["frameCheck"]["labels_result"])) {
            // AIGC detection results on the whole videos (like AIDE model)
            let aigc_result_values = results["frameCheck"]["labels_result"];
            const { person_prediction_data, mean_prediction_value } = get_chart_data(duration, aigc_result_values, threshold);
            temp_frame_values = {
                "prediction": mean_prediction_value > 0.5,
                "percentage": (mean_prediction_value * 100).toFixed(2),
                "data_points": aigc_result_values.length,
                "per_second_data": person_prediction_data
            };

            // format for charts
            temp_chart_data = {
                labels: Object.keys(person_prediction_data).map((idx) => { return idx }),
                datasets: [
                    {
                        label: "Probability of real",
                        data: Object.values(person_prediction_data),
                        backgroundColor: Object.values(person_prediction_data).map((pred) => {
                            return pred >= threshold_for_graph ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)"
                        }),
                        barPercentage: 1,
                        borderRadius: 100,
                        inflateAmount: 1,
                        base: threshold_for_graph
                    },
                    {
                        type: 'line',
                        borderColor: "rgba(0,0,100, 0.3)",
                        pointRadius: 0,
                        fill: {
                            target: { value: threshold_for_graph },
                            above: "rgba(0,255,0,0.3)",
                            below: "rgba(255,0,0,0.3)"
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
            if (!results["frameCheck"]["labels_result"]) return temp_frame_values;

            for (let label in results["frameCheck"]["labels_result"]) {
                if (results["face_labels"] && results["face_labels"].length > 0 && !results["face_labels"].includes(label)) {
                    continue;
                }
                // console.log("frame chart pass: ", label);
                const person = results["frameCheck"]["labels_result"][label];
                const { person_prediction_data, mean_prediction_value } = get_chart_data(duration, person, threshold);

                // console.log("label : ", label);
                // console.log("prediction table : ", person_prediction_data);

                temp_frame_values[label] = {
                    "prediction": mean_prediction_value > 0.5, // threshold after normalization is 0.5
                    "percentage": (mean_prediction_value * 100).toFixed(2),
                    "data_points": person.length,
                    "per_second_data": person_prediction_data
                };

                temp_chart_data[label] = {
                    labels: Object.keys(person_prediction_data).map((idx) => { return idx }),
                    datasets: [
                        {
                            label: "Probability of real",
                            data: Object.values(person_prediction_data),
                            backgroundColor: Object.values(person_prediction_data).map((pred) => {
                                return pred >= threshold_for_graph ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)"
                            }),
                            barPercentage: 1,
                            borderRadius: 100,
                            inflateAmount: 1,
                            base: threshold_for_graph
                        },
                        {
                            type: 'line',
                            borderColor: "rgba(0,0,100, 0.3)",
                            pointRadius: 0,
                            fill: {
                                target: { value: threshold_for_graph },
                                above: "rgba(0,255,0,0.3)",
                                below: "rgba(255,0,0,0.3)"
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
        // console.log("final frame values data = ", temp_frame_values)
        frame_charts = temp_chart_data;
        // setframecharts(temp_chart_data);
        return temp_frame_values;
    }

    const update_audio_chart = () => {
        let temp_chart_data = {};
        // const threshold = results["audioAnalysis"]["threshold"];
        const threshold_for_graph = 0.5; // since we normalize it
        const threshold = results["audioAnalysis"]["threshold"];

        temp_chart_data = {

            labels: results["audioAnalysis"]["table_data"].map(
                (data_pt) => formatTime(data_pt["index"])
            ),
            datasets: [
                {
                    label: "Probablility of real",
                    data: results["audioAnalysis"]["table_data"].map((data_pt) => normalize_value(data_pt["prediction"], threshold)),
                    backgroundColor: results["audioAnalysis"]["table_data"].map((data_pt) => {
                        return normalize_value(data_pt["prediction"], threshold) >= threshold_for_graph ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)"
                    }),
                    // borderColor: person.map((val, idx) => { return val.prediciton >= 0 ? "rgba(0,255,0,0.3)" : "rgba(255,0,0,0.3)" }),
                    // borderWidth: 0.75,
                    barPercentage: 1,
                    borderRadius: 100,
                    inflateAmount: 1,
                    base: threshold_for_graph
                },
                {
                    type: 'line',
                    borderColor: "rgba(0,0,100, 0.3)",
                    pointRadius: 0,
                    fill: {
                        target: { value: threshold_for_graph },
                        above: "rgba(0,255,0,0.3)",   // Area above the origin
                        below: "rgba(255,0,0,0.3)"    // below the origin
                    },
                    lineTension: 0.4,
                    data: results["audioAnalysis"]["table_data"].map((data_pt) => normalize_value(data_pt["prediction"], threshold)),
                    borderWidth: 1,
                },
            ]
        };
        audio_chart = temp_chart_data;
        // setaudiocharts(temp_chart_data);

        // NORMALIZE LIKE IN FRAME
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

        if (Array.isArray(results["frameCheck"]["labels_result"])) {
            // No bounding boxes for AIGC whole-video models
            bboxes_data = temp_bbox_data;
            return;
        }

        for (let label in results["frameCheck"]["labels_result"]) {
            if (results["face_labels"] && results["face_labels"].length > 0 && !results["face_labels"].includes(label)) {
                continue;
            }
            const person = results["frameCheck"]["labels_result"][label];

            if (!person || !Array.isArray(person)) continue;

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
        // set_bboxes_data({ ...temp_bbox_data });
    }

    // LOAD CHART AND RESULTS
    if (results["frameCheck"] || results["audioAnalysis"]) {
        console.log("creating graphs, results");
        // console.log("frameCheck", results["frameCheck"]);

        let temp_result_values = {
            "frameCheck": undefined,
            "audioAnalysis": undefined
        };
        // format frame data for Chart, result UI 
        if (results["frameCheck"]) {
            temp_result_values["frameCheck"] = update_frame_chart();
            // format bboxes by seconds
            update_bboxes_data();
        }

        // format audio data for chart
        if (results["audioAnalysis"])
            temp_result_values["audioAnalysis"] = update_audio_chart();

        // console.log(temp_result_values);
        result_values = temp_result_values;
    }

    const handle_pdf_creation = async () => {
        console.log("creating pdf");
        await video_pdf(analysisTypes, results, result_values, file_metadata, audio_graph_Ref, frame_person_refs);
    }

    const handle_newCheck = () => {
        if (handle_new_analysis)
            handle_new_analysis();
        else
            window.location.href = "/media-checker"
    }

    return (
        <div className="min-h-screen bg-white text-black">
            {/* TITLE */}
            <div className=' flex w-full justify-between items-end'>
                <h2 className="text-3xl font-semibold px-5 pt-3 py-6">Deepfake Investigator</h2>
                {
                    fileUrl &&
                    <div className=' flex gap-7 items-center mr-1 '>
                        {/* NEW ANALYSIS */}
                        <div onClick={handle_newCheck} className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-3xl shadow-primary shadow'>
                            New Analysis
                            <PlusCircle className="size-6" strokeWidth={1.5} />
                        </div>

                        {/* PDF EXPORT */}
                        <div
                            onClick={handle_pdf_creation}
                            className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-3xl shadow-primary shadow '
                        >
                            Export Report
                            <DownloadFile className="size-6" strokeWidth={1.5} />
                        </div>
                    </div>
                }
            </div>

            {/* VIDEO RESULTS + CHARTS */}
            <div className="min-h-[132vh] flex flex-col pt-10 relative">

                <VideoPlayer
                    videoRef={videoRef}
                    fileUrl={fileUrl}
                    bbox_data={bboxes_data}
                    duration={results[curr_model] ? results[curr_model]["duration"] : 0}
                    model_results={result_values}
                // model_results={null}
                />

                {/* TOGGLE CURRENT ANALYSIS */}
                <div className=" relative h-0 w-96 -top-36 flex gap-4 px-6 ">
                    {
                        Object.keys(analysisTypes).map((analysisType, idx) => {
                            // console.log(analysisType, analysisTypes[analysisType]);
                            if (!analysisTypes[analysisType])
                                return;

                            return (
                                <div key={idx} onClick={() => { set_curr_model(analysisType) }} className={` transition-all cursor-pointer flex justify-center border-2 border-primary ${curr_model === analysisType ? "bg-primary text-white" : "bg-white text-primary"} h-20 w-36 px-2 py-4 rounded-3xl`}>
                                    {analysisType === "frameCheck" ? "Frame Check" : analysisType === "audioAnalysis" ? "Audio Check" : "Image Check"}
                                </div>
                            )
                        })
                    }
                </div>

                {
                    result_values && result_values["frameCheck"] &&
                    <>
                        {/* FRAME CHECK */}
                        <div className={`${curr_model === "frameCheck" ? "opacity-100 z-20" : "opacity-0 z-0"} max-w-[83vw] overflow-hidden duration-300 transition-all`}>
                            <div ref={frame_graph_Ref} className={` h-full flex flex-col gap-2 py-5 rounded-3xl overflow-hidden`}>
                                {
                                    result_values["frameCheck"]["prediction"] === undefined ?
                                        (
                                            // DEEPFAKE FACE DETECTION RESULT
                                            Object.keys(results["frameCheck"].labels_result)
                                                .filter((v) => { return !results["face_labels"] || results["face_labels"].length == 0 || results["face_labels"].includes(v) })
                                                .sort((a, b) => result_values["frameCheck"][b]["data_points"] - result_values["frameCheck"][a]["data_points"])
                                                .slice(0, 3)
                                                .map((label, idx) => {

                                                    const perc = result_values && result_values["frameCheck"][label] ? result_values["frameCheck"][label]["percentage"] : 0;
                                                    const pred = result_values && result_values["frameCheck"][label] ? result_values["frameCheck"][label]["prediction"] : false;
                                                    const threshold = results["frameCheck"]["threshold"];
                                                    if (isNaN(perc)) {
                                                        return null;
                                                    }
                                                    return (
                                                        <div key={idx} className=" flex flex-col">
                                                            <div
                                                                className={` group rounded-3xl bg-primary border-8 border-primary flex ${toggle_open === idx ? "h-72" : " "} transition-all overflow-hidden `}
                                                                key={idx}
                                                            >
                                                                {/* PERSON DETAILS */}
                                                                <div
                                                                    onClick={() => { toggle_open === idx ? set_toggle_open(null) : set_toggle_open(idx) }}
                                                                    className=" cursor-pointer text-white flex flex-row items-center px-2 group relative"
                                                                >
                                                                    {/* ARROW */}
                                                                    <div className={` absolute top-5 left-0  h-5 w-5 ${toggle_open === idx ? " rotate-90 group-hover:rotate-[70deg]" : " group-hover:rotate-[20deg]"}  transition-all`}>
                                                                        <RightArrow strokeWidth={1} className=" size-6" />
                                                                    </div>

                                                                    <div className={` flex flex-col justify-between items-center min-w-[169px]  h-full ${toggle_open === idx ? "py-5" : ""} transition-all`}>

                                                                        {/* PERSON IMAGE + LABEL */}
                                                                        <div className={` flex ${toggle_open === idx ? "flex-col" : "flex-row"} justify-evenly items-center w-full gap-2 `}>

                                                                            <div className="rounded-full overflow-hidden flex">
                                                                                {
                                                                                    results?.frameCheck?.label_faces && results?.frameCheck?.label_faces[label] ?
                                                                                        <Image src={results?.frameCheck?.label_faces[label]} width={56} height={56} alt={`P - ${Number(idx) + 1} `} />
                                                                                        :
                                                                                        <PersonCircle className="size-14" strokeWidth={1} />
                                                                                }
                                                                            </div>
                                                                            <div className=" ">
                                                                                P {Number(idx) + 1}
                                                                            </div>
                                                                        </div>
                                                                        {
                                                                            toggle_open === idx &&
                                                                            <div className="flex flex-col gap-3 h-full items-center justify-center">
                                                                                <div className=' flex flex-col items-center w-full gap-2'>
                                                                                    <span>
                                                                                        Result
                                                                                    </span>
                                                                                    <span className={` mx-auto text-lg px-3 py-1 rounded-3xl  font-semibold ${pred ? " bg-green-200  text-green-700" : " bg-red-200  text-red-700"}`}>
                                                                                        {pred ? "Real" : "Fake"}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        }
                                                                    </div>

                                                                </div>

                                                                <div className={`w-full flex flex-col bg-white rounded-2xl overflow-hidden ${toggle_open === idx ? 'ml-0' : 'ml-8'} transition-all `}>

                                                                    {/* PERSON's VIDEO SECTIONS */}
                                                                    < div className={` ${toggle_open === idx ? 'max-h-0' : 'max-h-72'} h-full pr-2 bg-white flex items-center relative rounded-xl overflow-hidden transition-all `}>
                                                                        {/* REFERENCE LINE */}
                                                                        <div className="bg-gray-300 w-full h-[1px]" />
                                                                        {
                                                                            results["frameCheck"].labels_result[label].map((v, i) => {
                                                                                const total_frames = results["frameCheck"].duration * fps
                                                                                let width = 0
                                                                                if (v.end_index === v.start_index)
                                                                                    width = 100 / (results["frameCheck"].labels_result[label].length);
                                                                                else
                                                                                    width = 100 * (v.end_index - v.start_index) / total_frames;
                                                                                let start = 100 * v.start_index / total_frames;
                                                                                // console.log(width, start);
                                                                                return (
                                                                                    <div
                                                                                        key={i}
                                                                                        style={{ width: `${width}%`, left: `${start}%` }}
                                                                                        className={` h-full absolute ${v.prediction > threshold ? 'bg-green-400' : 'bg-red-400'} `}
                                                                                    />
                                                                                );
                                                                            })
                                                                        }
                                                                    </div>

                                                                    {/* PERSON's GRAPH */}
                                                                    <div className={` ${toggle_open === idx ? 'max-h-72' : 'max-h-0'} h-full w-full bg-white rounded-2xl px-2 overflow-hidden transition-all `}>
                                                                        {frame_charts &&
                                                                            idx < 3 ?
                                                                            (
                                                                                <div className="chart-container" ref={frame_person_refs[idx]} >
                                                                                    <LineChart chartData={frame_charts[label]} />
                                                                                </div>
                                                                            )
                                                                            :
                                                                            (
                                                                                <div className="chart-container">
                                                                                    <LineChart chartData={frame_charts[label]} />
                                                                                </div>
                                                                            )
                                                                        }
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                        )
                                        :
                                        (
                                            // AIGC SINGLE CHART RESULT
                                            <div className={` overflow-hidden bg-primary w-full rounded-3xl border-8 border-primary flex my-5 `}>
                                                <div className="w-52  border-8 border-primary rounded-3xl flex flex-col gap-3 items-center justify-center text-white ">
                                                    <div className=' flex flex-col  items-center w-full gap-2'>
                                                        <span>
                                                            Result
                                                        </span>
                                                        <span className={` mx-auto text-lg px-3 py-1 rounded-3xl  font-semibold ${result_values["frameCheck"]["prediction"] ? " bg-green-200  text-green-700" : " bg-red-200  text-red-700"}`}>
                                                            {result_values["frameCheck"]["prediction"] ? "Real" : "Fake"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className=" h-[360px] flex flex-col justify-evenly bg-white rounded-2xl px-2 overflow-hidden transition-all w-full">
                                                    <div ref={frame_person_refs[0]}>
                                                        <LineChart chartData={frame_charts} />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                }
                                <div className="flex flex-row flex-wrap max-w-[80vw] gap-3">
                                    {
                                        result_values["frameCheck"]["prediction"] === undefined &&
                                        Object.keys(results["frameCheck"].labels_result).length > 3 &&
                                        Object.keys(results["frameCheck"].labels_result)
                                            .filter((v) => { return !results["face_labels"] || results["face_labels"].length == 0 || results["face_labels"].includes(v) })
                                            .sort((a, b) => result_values["frameCheck"][b]["data_points"] - result_values["frameCheck"][a]["data_points"])
                                            .slice(4, 10)
                                            .map((label, index) => {

                                                const perc = result_values && result_values["frameCheck"][label] ? result_values["frameCheck"][label]["percentage"] : 0;
                                                const pred = result_values && result_values["frameCheck"][label] ? result_values["frameCheck"][label]["prediction"] : false;
                                                let idx = index + 3; // to make sure the index is unique for each person

                                                if (isNaN(perc)) {
                                                    return null;
                                                }

                                                return (
                                                    <div key={idx} className=" flex flex-col">
                                                        <div
                                                            className={` group relative  bg-primary border-primary rounded-3xl  border-8 flex ${toggle_open === idx ? "h-72 w-[83vw] " : " "} transition-all overflow-hidden `}
                                                            key={idx}
                                                        >
                                                            {/* PERSON DETAILS */}
                                                            <div
                                                                onClick={() => { toggle_open === idx ? set_toggle_open(null) : set_toggle_open(idx) }}
                                                                className=" cursor-pointer text-white flex flex-row items-center group relative"
                                                            >
                                                                {/* ARROW */}
                                                                <div className={` absolute top-5 left-0  h-5 w-5 ${toggle_open === idx ? " rotate-90 group-hover:rotate-[70deg] opacity-100" : " opacity-0 group-hover:rotate-[20deg]"}  transition-all`}>
                                                                    <RightArrow strokeWidth={1} className=" size-6" />
                                                                </div>

                                                                <div className={` flex flex-col justify-between items-center min-w-[169px]  h-full ${toggle_open === idx ? "py-5" : ""} transition-all`}>

                                                                    {/* PERSON IMAGE + LABEL */}
                                                                    <div className={` flex ${toggle_open === idx ? "flex-col" : "flex-row  pr-10"} justify-between items-center w-full gap-2 `}>

                                                                        <div className="rounded-full overflow-hidden flex">
                                                                            {
                                                                                results?.frameCheck?.label_faces && results?.frameCheck?.label_faces[label] ?
                                                                                    <Image src={results?.frameCheck?.label_faces[label]} width={56} height={56} alt={`person - ${Number(idx) + 1} `} />
                                                                                    :
                                                                                    <PersonCircle className="size-14" strokeWidth={1} />
                                                                            }
                                                                        </div>
                                                                        <div className="  ">
                                                                            P {Number(idx) + 1}
                                                                        </div>
                                                                    </div>
                                                                    {
                                                                        toggle_open === idx &&
                                                                        <div className="flex flex-col gap-3 h-full items-center justify-center">
                                                                            <div className=' flex flex-col items-center w-full gap-2'>
                                                                                <span>
                                                                                    Result
                                                                                </span>
                                                                                <span className={` mx-auto text-lg px-3 py-1 rounded-3xl  font-semibold ${pred ? " bg-green-200  text-green-700" : " bg-red-200  text-red-700"}`}>
                                                                                    {pred ? "Real" : "Fake"}
                                                                                </span>
                                                                            </div>
                                                                            {/* <div className=' flex  items-center w-full gap-2'>
                                                                                <span>
                                                                                    Score
                                                                                </span>
                                                                                <span className={` mx-auto text-lg px-3 py-1 rounded-3xl  font-semibold ${pred ? " bg-green-200  text-green-700" : " bg-red-200  text-red-700"}`}>
                                                                                    {perc} %
                                                                                </span>
                                                                            </div> */}
                                                                        </div>
                                                                    }
                                                                </div>

                                                            </div>

                                                            <div className={`w-full absolute left-[186px] rounded-2xl overflow-hidden ${toggle_open === idx ? 'ml-0' : 'ml-8'} transition-all `}>
                                                                {/* PERSON's GRAPH */}
                                                                <div className={` ${toggle_open === idx ? 'max-h-70' : 'max-h-0'} h-full w-[70vw] bg-white rounded-2xl px-2 overflow-hidden transition-all `}>
                                                                    {frame_charts &&
                                                                        idx < 3 ?
                                                                        (
                                                                            <div className="chart-container" ref={frame_person_refs[idx]} >
                                                                                <LineChart chartData={frame_charts[label]} />
                                                                            </div>
                                                                        )
                                                                        :
                                                                        (
                                                                            <div className="chart-container">
                                                                                <LineChart chartData={frame_charts[label]} />
                                                                            </div>
                                                                        )
                                                                    }
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                )
                                            })
                                    }
                                </div>
                            </div>
                        </div>
                    </>
                }
                {
                    result_values && result_values["audioAnalysis"] &&
                    <>
                        {/* AUDIO ANALYSIS */}
                        <div className={`${curr_model === "audioAnalysis" ? "opacity-100 z-20" : "opacity-0 z-0"} absolute top-[77vh] max-w-[83vw]  overflow-hidden duration-300 transition-all`}>
                            <div className={` overflow-hidden bg-primary w-full rounded-3xl border-8 border-primary flex my-5 `}>
                                <div className="w-52  border-8 border-primary rounded-3xl flex flex-col gap-3 items-center justify-center text-white ">
                                    <div className=' flex flex-col  items-center w-full gap-2'>
                                        <span>
                                            Result
                                        </span>
                                        <span className={` mx-auto text-lg px-3 py-1 rounded-3xl  font-semibold ${result_values["audioAnalysis"]["prediction"] ? " bg-green-200  text-green-700" : " bg-red-200  text-red-700"}`}>
                                            {result_values["audioAnalysis"]["prediction"] ? "Real" : "Fake"}
                                        </span>
                                    </div>
                                    {/* <div className=' flex  items-center w-full gap-2'>
                                        <span>
                                            Score
                                        </span>
                                        <span className={` mx-auto text-lg px-3 py-1 rounded-3xl  font-semibold ${result_values["audioAnalysis"]["prediction"] ? " bg-green-200  text-green-700" : " bg-red-200  text-red-700"}`}>
                                            {result_values["audioAnalysis"]["percentage"]} %
                                        </span>
                                    </div> */}
                                </div>
                                <div className=" h-[360px] flex flex-col justify-evenly bg-white rounded-2xl px-2 overflow-hidden transition-all w-full">
                                    <div className=" max-w-[1200px]  overflow-hidden py-3">
                                        {
                                            videoRef.current &&
                                            <div
                                                className="pl-7 cursor-pointer"
                                                style={{ width: (videoRef.current.duration / results["audioAnalysis"]["duration"]) * 1180 + "px" }}
                                            >
                                                <Waveform videoRef={videoRef} />
                                            </div>
                                        }
                                    </div>
                                    <div ref={audio_graph_Ref}>
                                        <LineChart chartData={audio_chart} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                }
            </div>

            {/* METADATA + VERIFIER DATA */}
            <div className=' flex gap-5 pt-4 items-start justify-between '>

                {/* VERIFIER COMMENT */}
                {
                    file_metadata.verifier_comment &&
                    (
                        <div className=' bg-slate-100 py-4 px-5 border rounded-3xl w-fit min-w-[40vw] flex flex-col gap-4 shadow hover:shadow-primary transition-all duration-300'>
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
                <div className=' bg-slate-100 py-4 px-5 border rounded-3xl w-fit min-w-[40vw] flex flex-col gap-4 shadow hover:shadow-primary transition-all duration-300'>
                    <span className=' text-xl'>
                        Video Metadata
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
                            <span className=' font-medium pr-2' >Video type: </span>
                            <span>{file_metadata.type}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
}
