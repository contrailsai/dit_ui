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

export default function Result_UI({ results, analysisTypes, file_metadata, fileUrl, handle_new_analysis = null }) {

    const videoRef = useRef();
    const audio_graph_Ref = useRef();
    const frame_graph_Ref = useRef();
    const frame_person_refs = [useRef(), useRef(), useRef()];

    const [curr_model, set_curr_model] = useState(analysisTypes["frameCheck"] ? "frameCheck" : analysisTypes["audioAnalysis"] ? "audioAnalysis" : "");
    const [toggle_open, set_toggle_open] = useState(null);

    let result_values = null;
    let bboxes_data = null;

    let frame_charts = null;
    let audio_chart = null;
    let fps = results["frameCheck"] ? results["frameCheck"]["video_fps"] : 25;

    console.log(results)

    useEffect(() => {
        set_curr_model(analysisTypes["frameCheck"] ? "frameCheck" : analysisTypes["audioAnalysis"] ? "audioAnalysis" : "");
    }, [analysisTypes, videoRef])

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    //-------------------------------------------------
    const get_chart_data = (duration, person_obj_list, threshold = 0.7) => {
        let person_prediction_data = []
        // default value 0.7 (if no data at that timestamp (frames in 1 sec))
        for (let i = 0; i <= duration; i++)
            person_prediction_data[i] = threshold;

        let used_values = [];

        let count = 0;
        let prediction_sum = 0;
        let curr_processing_time = 0;
        // iterating through all data points of this person each point contains (start_index, end_index, predisction)
        for (let person_data of person_obj_list) {
            const time = Math.floor(person_data.start_index / fps);
            if (curr_processing_time !== time) {
                // set the value to the average of all values in that second
                person_prediction_data[curr_processing_time] = prediction_sum / count;
                // reset values with the new time value
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

        const mean_result = used_values.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / used_values.length;
        return { person_prediction_data, mean_result };
    }

    // 3 cases
    // using only returned values good looking curves, inconsistent with time frames 
    // USING BOTJH 

    const update_frame_chart = () => {
        let temp_chart_data = {};
        let temp_frame_values = {};

        const duration = results["frameCheck"]["duration"];
        const threshold = results["frameCheck"]["threshold"];

        for (let label in results["frameCheck"]["labels_result"]) {

            const person = results["frameCheck"]["labels_result"][label];
            const { person_prediction_data, mean_result } = get_chart_data(duration, person, threshold);

            // console.log("label : ", label);
            // console.log("prediction table : ", person_prediction_data);

            temp_frame_values[label] = {
                "prediction": mean_result > threshold,
                "percentage": (mean_result * 100).toFixed(2),
                "data_points": person.length
            };

            temp_chart_data[label] = {

                labels: Object.keys(person_prediction_data).map(
                    (idx) => { return idx }
                ),
                datasets: [

                    {
                        label: "Probablility of real",
                        data: Object.values(person_prediction_data),
                        backgroundColor: Object.values(person_prediction_data).map((pred) => {
                            return pred >= threshold ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)"
                        }),
                        // borderColor: person.map((val, idx) => { return val.prediciton >= 0 ? "rgba(0,255,0,0.3)" : "rgba(255,0,0,0.3)" }),
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
                        spanGaps: true,
                        data: Object.values(person_prediction_data),
                        borderWidth: 1,
                    },
                ]
            };
        }
        frame_charts = temp_chart_data;
        // setframecharts(temp_chart_data);
        return temp_frame_values;
    }

    const update_audio_chart = () => {
        let temp_chart_data = {};
        const threshold = results["audioAnalysis"]["threshold"];

        temp_chart_data = {

            labels: results["audioAnalysis"]["table_data"].map(
                (data_pt) => formatTime(data_pt["index"])
            ),
            datasets: [
                {
                    label: "Probablility of real",
                    data: results["audioAnalysis"]["table_data"].map((data_pt) => data_pt["prediction"]),
                    backgroundColor: results["audioAnalysis"]["table_data"].map((data_pt) => {
                        return data_pt["prediction"] >= threshold ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)"
                    }),
                    // borderColor: person.map((val, idx) => { return val.prediciton >= 0 ? "rgba(0,255,0,0.3)" : "rgba(255,0,0,0.3)" }),
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
                    data: results["audioAnalysis"]["table_data"].map((data_pt) => data_pt["prediction"]),
                    borderWidth: 1,
                },
            ]
        };
        audio_chart = temp_chart_data;
        // setaudiocharts(temp_chart_data);

        return {
            "prediction": results["audioAnalysis"]["result"] > results["audioAnalysis"]["threshold"],
            "percentage": (results["audioAnalysis"]["result"] * 100).toFixed(2)
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
        // set_bboxes_data({ ...temp_bbox_data });
    }

    // LOAD CHART AND RESULTS
    if (results["frameCheck"] || results["audioAnalysis"]) {
        console.log("creating graphs, results");
        console.log("frameCheck", results["frameCheck"]);

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

        // set_taking_ss(true);
        // // Wait for the state update to be applied
        // await new Promise(resolve => {
        //     setTimeout(resolve, 500);
        // });

        // let temp_curr_analysis = curr_analysis;

        const doc = new jsPDF({ orientation: "p", unit: "in", compress: true });
        doc.addFileToVFS('outfit_normal.ttf', Outfit_normal_font);
        doc.addFileToVFS('outfit_bold.ttf', Outfit_bold_font);

        doc.addFont('outfit_normal.ttf', 'Outfit', 'normal');
        doc.addFont('outfit_bold.ttf', 'Outfit', 'bold');

        doc.setFont("Outfit", "bold");

        const my = 1;
        const mx = 0.4;

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

        curr_y += fontSize / 72 + 12 / 72;

        fontSize = 14;
        doc.setFontSize(fontSize);

        // FILE NAME
        doc.setFont("Outfit", "bold");
        doc.text("File name: ", curr_x, curr_y);
        curr_x += 80 / 72;
        doc.setFont("Outfit", "normal")
        doc.text(`${file_metadata.name}`, curr_x, curr_y);

        curr_x = mx;
        curr_y += fontSize / 72 + 12 / 72;

        //FILE SIZE
        doc.setFont("Outfit", "bold");
        doc.text("File Size: ", curr_x, curr_y);
        curr_x += 80 / 72;
        doc.setFont("Outfit", "normal")
        doc.text(`${file_metadata.size}`, curr_x, curr_y);

        curr_x = mx;
        curr_y += fontSize / 72 + 36 / 72;

        fontSize = 20;
        doc.setFontSize(fontSize);
        doc.setFont("Outfit", "bold");
        doc.text("Result", curr_x, curr_y);
        doc.setFont("Outfit", "normal");

        curr_y += fontSize / 72 + 12 / 72;

        // fontSize = 14;
        // doc.setFontSize(fontSize);

        fontSize = 18;
        doc.setFontSize(fontSize);

        if (analysisTypes["audioAnalysis"]) {
            if (results["audioAnalysis"] && results["audioAnalysis"]["result"] < results["audioAnalysis"]["threshold"]) {
                doc.text(`Manipulation detected in Audio`, curr_x, curr_y);
            }
            else {
                doc.text(`No manipulation detected in Audio`, curr_x, curr_y);
            }
            curr_y += fontSize / 72 + 6 / 72;
        }
        if (analysisTypes["audioAnalysis"] && analysisTypes["frameCheck"] && results["audioAnalysis"] && results["frameCheck"]) {
            doc.text('and', curr_x, curr_y);
            curr_y += fontSize / 72 + 10 / 72;
        }
        if (analysisTypes["frameCheck"]) {
            if (results["frameCheck"] && results["frameCheck"]["result"] < results["frameCheck"]["threshold"]) {
                doc.text(`Manipulation detected in Video`, curr_x, curr_y);
            }
            else {
                doc.text(`No manipulation detected in Video`, curr_x, curr_y);
            }
            curr_y += fontSize / 72;
            curr_x = mx;
        }

        curr_y += 36 / 72; //gap of 20 px

        if (file_metadata.verifier_comment) {
            fontSize = 18;
            doc.setFontSize(fontSize);
            doc.setFont("Outfit", "bold");
            doc.text("Expert's Comment: ", curr_x, curr_y);
            curr_x = mx;
            curr_y += fontSize / 72 + 12 / 72
            doc.setFont("Outfit", "normal");
            fontSize = 14;
            doc.setFontSize(fontSize);
            const maxWidth = 550 / 72;
            const commentLines = doc.splitTextToSize(file_metadata.verifier_comment, maxWidth);

            doc.text(commentLines, curr_x, curr_y);

            curr_x = mx;
            curr_y += (commentLines.length * fontSize / 72) + (12 / 72);
            // curr_y += (2 * fontSize / 72) + (12 / 72);
        }
        else {
            curr_y += (fontSize / 72) + (12 / 72);
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

        // doc.setDrawColor(150, 150, 150);
        // doc.setLineWidth(1 / 72);
        // doc.line(curr_x, curr_y, curr_x + 550 / 72, curr_y);


        // _________________AUDIO ANALYSIS PAGE START_______________________
        if (results["audioAnalysis"] !== undefined) {

            // Create a new Page for audio analysis
            doc.addPage();
            curr_x = mx;
            curr_y = my;

            //AUDIO ANALYSIS START
            fontSize = 24;
            doc.setFontSize(fontSize);
            doc.setFont("Outfit", "bold");
            doc.text("Audio Analysis", curr_x, curr_y);
            doc.setFont("Outfit", "normal");
            curr_y += fontSize / 72 + 24 / 72;

            // set_curr_model("audioAnalysis");
            // Wait for the state update to be applied
            // await new Promise(resolve => {
            //     setTimeout(resolve, 100);
            // });

            fontSize = 20;
            doc.setFontSize(fontSize);

            const audio_result = (results["audioAnalysis"].result).toFixed(4);
            const threshold = results["audioAnalysis"].threshold

            if (audio_result >= threshold) {
                doc.text("The audio analysis detected no manipulation", curr_x, curr_y);
            }
            else {
                doc.text("The audio analysis detected manipulation", curr_x, curr_y);
            }
            curr_y += fontSize / 72 + 20 / 72;

            fontSize = 18;
            doc.setFontSize(fontSize);

            doc.text("Audio result: ", curr_x, curr_y);

            curr_x += 120 / 72;
            doc.setFont("Outfit", "bold");

            audio_result >= threshold ? doc.setTextColor(5, 160, 20) : doc.setTextColor(200, 30, 30);
            doc.text(` ${audio_result >= threshold ? "Real" : "Fake"} `, curr_x, curr_y);

            doc.setTextColor(0, 0, 0);
            doc.setFont("Outfit", "normal");
            curr_x = mx;
            curr_y += fontSize / 72 + 16 / 72;
            doc.text("Real Score: ", curr_x, curr_y);

            curr_x += 120 / 72;
            doc.setFont("Outfit", "bold");
            audio_result >= threshold ? doc.setTextColor(5, 160, 20) : doc.setTextColor(200, 30, 30);
            doc.text(` ${audio_result * 100} %`, curr_x, curr_y);

            curr_x = mx;
            curr_y += fontSize / 72 + 10 / 72;

            fontSize = 11;
            doc.setFontSize(fontSize);
            doc.setTextColor(0, 0, 0);
            doc.setFont("Outfit", "normal");

            doc.text("(confidence of audio being real)", curr_x, curr_y);
            curr_y += fontSize / 72 + 40 / 72;

            fontSize = 18;
            doc.setFontSize(fontSize);
            doc.setFont("Outfit", "bold");
            doc.text("Audio Analysis Graph", curr_x, curr_y);

            doc.setFont("Outfit", "normal");
            curr_y += fontSize / 72 + 12 / 72;

            fontSize = 14;
            doc.setFontSize(fontSize);
            doc.text("the graph shows the prediction score of the audio being real with respect to time.", curr_x, curr_y);

            curr_y += fontSize / 72 + 16 / 72;

            const audio_result_element = audio_graph_Ref.current;
            console.log(audio_result_element);
            let audio_result_canvas = await html2canvas(audio_result_element);
            const audio_result_imgData = audio_result_canvas.toDataURL('image/png');
            const aud_res_img_w = 550 / 72;
            const aud_res_img_h = (audio_result_canvas.height * aud_res_img_w) / audio_result_canvas.width;
            doc.addImage(audio_result_imgData, 'PNG', curr_x, curr_y, aud_res_img_w, aud_res_img_h, '', 'FAST');

            curr_x = mx;
            curr_y += aud_res_img_h + 30 / 72; //gap of 30 px

            // doc.setDrawColor(150, 150, 150);
            // doc.setLineWidth(1 / 72);
            // doc.line(curr_x, curr_y, curr_x + 550 / 72, curr_y);

            curr_y += 30 / 72;
        }


        // _________________FRAME ANALYSIS PAGE START_______________________
        if (results["frameCheck"] !== undefined) {
            doc.addPage();
            curr_x = mx;
            curr_y = my;

            //FRAME ANALYSIS START
            fontSize = 24;
            doc.setFontSize(fontSize);
            doc.setFont("Outfit", "bold");
            doc.text("Frame Analysis", curr_x, curr_y);
            doc.setFont("Outfit", "normal");

            curr_y += fontSize / 72 + 24 / 72;

            // set_curr_model("frameCheck");
            // Wait for the state update to be applied
            // await new Promise(resolve => {
            //     setTimeout(resolve, 100);
            // });

            fontSize = 20;
            doc.setFontSize(fontSize);

            // console.log((result_values["frameCheck"]));
            let sorted_labels = Object.keys(result_values["frameCheck"]).sort((a, b) => result_values["frameCheck"][b]["data_points"] - result_values["frameCheck"][a]["data_points"]);

            // let frame_result = (results["frameCheck"].result).toFixed(4);
            let frame_prediction = 0;
            let frame_result = true;
            let labels_count = 0;
            for (let label of sorted_labels) {
                if (!result_values["frameCheck"][label]["prediction"]) {
                    frame_prediction = Number(result_values["frameCheck"][label]["percentage"]).toFixed(2);
                    frame_result = false;
                    break;
                }
                if (labels_count > 3)
                    break;
                labels_count++;
            }
            if (frame_result) {
                frame_prediction = Number(result_values["frameCheck"][sorted_labels[0]]["percentage"]).toFixed(2);
            }

            const threshold = results["frameCheck"].threshold;

            if (frame_result >= threshold) {
                doc.text("The video frames analysis detected no manipulation", curr_x, curr_y);
            }
            else {
                doc.text("The video frames analysis detected manipulation", curr_x, curr_y);
            }
            curr_y += fontSize / 72 + 20 / 72;

            fontSize = 18;
            doc.setFontSize(fontSize);

            doc.text("Frame result: ", curr_x, curr_y);

            curr_x += 120 / 72;
            doc.setFont("Outfit", "bold");

            frame_result >= threshold ? doc.setTextColor(5, 160, 20) : doc.setTextColor(200, 30, 30);
            doc.text(` ${frame_result >= threshold ? "Real" : "Fake"} `, curr_x, curr_y);

            doc.setTextColor(0, 0, 0);
            doc.setFont("Outfit", "normal");
            curr_x = mx;
            curr_y += fontSize / 72 + 16 / 72;
            doc.text("Real Score: ", curr_x, curr_y);

            curr_x += 120 / 72;
            doc.setFont("Outfit", "bold");
            frame_result >= threshold ? doc.setTextColor(5, 160, 20) : doc.setTextColor(200, 30, 30);
            doc.text(` ${frame_prediction} %`, curr_x, curr_y);

            curr_x = mx;
            curr_y += fontSize / 72 + 10 / 72;

            fontSize = 11;
            doc.setFontSize(fontSize);
            doc.setTextColor(0, 0, 0);
            doc.setFont("Outfit", "normal");

            doc.text("(confidence of video frames being real)", curr_x, curr_y);
            curr_y += fontSize / 72 + 40 / 72;

            fontSize = 18;
            doc.setFontSize(fontSize);
            doc.setFont("Outfit", "bold");
            doc.text("Frames Analysis Chart", curr_x, curr_y);

            doc.setFont("Outfit", "normal");
            curr_y += fontSize / 72 + 12 / 72;

            fontSize = 14;
            doc.setFontSize(fontSize);
            doc.text("the graphs show individual people identified and prediction of their face being fake.", curr_x, curr_y);

            curr_y += fontSize / 72 + 20 / 72;

            for (let i = 0; i < frame_person_refs.length; i++) {
                // check if the person's Ref was even made
                if (frame_person_refs[i].current) {

                    doc.text(`P ${i + 1}'s Graph`, curr_x, curr_y);
                    curr_y += 10 / 72;

                    const frame_result_element = frame_person_refs[i].current;
                    let frame_result_canvas = await html2canvas(frame_result_element);
                    const frame_result_imgData = frame_result_canvas.toDataURL('image/png');
                    const frm_res_img_w = 500 / 72;
                    const frm_res_img_h = (frame_result_canvas.height * frm_res_img_w) / frame_result_canvas.width;
                    doc.addImage(frame_result_imgData, 'PNG', curr_x, curr_y, frm_res_img_w, frm_res_img_h, '', 'FAST');

                    curr_x = mx;
                    curr_y += frm_res_img_h + 30 / 72; //gap of 30 px
                }
            }

            // const frame_result_element = frame_graph_Ref.current;
            // let frame_result_canvas = await html2canvas(frame_result_element);
            // const frame_result_imgData = frame_result_canvas.toDataURL('image/png');
            // const frm_res_img_w = 550 / 72;
            // const frm_res_img_h = (frame_result_canvas.height * frm_res_img_w) / frame_result_canvas.width;
            // doc.addImage(frame_result_imgData, 'PNG', curr_x, curr_y, frm_res_img_w, frm_res_img_h, '', 'FAST');
            // curr_x = mx;
            // curr_y += frm_res_img_h + 30 / 72; //gap of 30 px
        }

        // set_taking_ss(false);
        // await new Promise(resolve => {
        //     setTimeout(resolve, 500);
        // });

        doc.save("Deepfake_Media_Report.pdf");
        // set_curr_analysis(temp_curr_analysis);


    }

    const handle_newCheck = () => {
        if (handle_new_analysis)
            handle_new_analysis();
        else
            window.location.href = "/fact-checker"
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
                            onClick={async () => { await handle_pdf_creation() }}
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
                                    Object.keys(results["frameCheck"].labels_result)
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
                                                                        {/* <div className=' flex  items-center w-full gap-2'>
                                                                            <span>
                                                                                Score
                                                                            </span>
                                                                            <span className={` mx-auto text-lg px-3 py-1 rounded-3xl  font-semibold ${pred ? " bg-green-200  text-green-700" : " bg-red-200  text-red-700"}`}>
                                                                                {isNaN(perc) ? "-" : perc} %
                                                                            </span>
                                                                        </div> */}
                                                                    </div>
                                                                }
                                                            </div>

                                                        </div>

                                                        <div className={`w-full flex flex-col bg-white rounded-2xl overflow-hidden ${toggle_open === idx ? 'ml-0' : 'ml-8'} transition-all `}>

                                                            {/* PERSON's VIDEO SECTIONS */}
                                                            < div className={` ${toggle_open === idx ? 'max-h-0' : 'max-h-72'} h-full w-[75vw] pr-2 bg-white flex items-center relative rounded-xl overflow-hidden transition-all `}>
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
                                                                {/* <div className="h-full w-20 bg-red-500/40 absolute"/> */}
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
                                }
                                <div className="flex flex-row flex-wrap max-w-[80vw] gap-3">
                                    {
                                        Object.keys(results["frameCheck"].labels_result).length > 3 &&
                                        Object.keys(results["frameCheck"].labels_result)
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
