// import LineChart from './LineChart';
import React, { useState, useRef, useEffect } from 'react';
// import Image from 'next/image';

import { PlusCircle, DownloadFile, LoadingCircle } from './SVGs';
import jsPDF from "jspdf";
// import html2canvas from 'html2canvas';
import { Outfit_bold_font } from './outfit-bold-font';
import { Outfit_normal_font } from './outfit-normal-font';
import { logo_base64 } from './logo_base64';

const ResultsImageUI = ({ response_data, fileUrl, file_metadata, analysisTypes, handle_newCheck }) => {

    // console.log(response_data, fileUrl, file_metadata, analysisTypes, handle_newCheck)
    const result_ref = useRef(null);
    const [taking_ss, set_taking_ss] = useState(false);

    const handle_pdf_tester = async () => {

        // set_taking_ss(true);
        // Wait for the state update to be applied
        await new Promise(resolve => {
            setTimeout(resolve, 500);
        });

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
        curr_y += fontSize / 72 + 8 / 72;

        if (file_metadata.verifier_comment) {
            fontSize = 12;
            doc.setFontSize(fontSize);
            doc.setFont("Outfit", "bold");
            doc.text("Expert's Comment: ", curr_x, curr_y);
            curr_x = mx;
            curr_y += fontSize / 72 + 6 / 72
            doc.setFont("Outfit", "normal");
            fontSize = 11;
            doc.setFontSize(fontSize);
            const maxWidth = 550 / 72;
            const commentLines = doc.splitTextToSize(file_metadata.verifier_comment, maxWidth);

            doc.text(commentLines, curr_x, curr_y);

            curr_x = mx;
            curr_y += (commentLines.length * fontSize / 72) + (12 / 72);
            // curr_y += (2 * fontSize / 72) + (12 / 72);
        }
        else {
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

        if (response_data["aigcCheck"] !== undefined) {
            doc.setFontSize(14);
            if (response_data["aigcCheck"] && response_data["aigcCheck"]["result"] < response_data["aigcCheck"]["threshold"]) {
                doc.text(`Manipulation detected in Image`, curr_x, curr_y);
            }
            else {
                doc.text(`No manipulation detected in Image`, curr_x, curr_y);
            }
            doc.setFontSize(fontSize);
            curr_y += fontSize / 72 ;
        }
        
        curr_y += 10 / 72; //gap of 20 px

        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(1 / 72);
        doc.line(curr_x, curr_y, curr_x + 550 / 72, curr_y);

        curr_y += 30 / 72;

        if (response_data["aigcCheck"] !== undefined) {

            //AUDIO ANALYSIS START
            fontSize = 18;
            doc.setFontSize(fontSize);
            doc.text("Aigc Check", curr_x, curr_y);

            curr_y += fontSize / 72 + 6 / 72;

            fontSize = 16;
            doc.setFontSize(fontSize);

            const image_result = (response_data["aigcCheck"].result).toFixed(4);
            const threshold = response_data["aigcCheck"].threshold;

            if (image_result >= threshold) {
                doc.text("The Image Check detected no manipulation", curr_x, curr_y);
            }
            else {
                doc.text("The Image check detected manipulation", curr_x, curr_y);
            }
            curr_y += fontSize / 72 + 8 / 72;

            fontSize = 14;
            doc.setFontSize(fontSize);

            doc.text("Image result: ", curr_x, curr_y);

            curr_x += 90 / 72;
            doc.setFont("Outfit", "bold");

            image_result >= threshold ? doc.setTextColor(5, 160, 20) : doc.setTextColor(200, 30, 30);
            doc.text(` ${image_result >= threshold ? "Real" : "Fake"} `, curr_x, curr_y);

            doc.setTextColor(0, 0, 0);
            doc.setFont("Outfit", "normal");
            curr_x = mx;
            curr_y += fontSize / 72 + 6 / 72;
            doc.text("Real Score: ", curr_x, curr_y);

            curr_x += 90 / 72;
            doc.setFont("Outfit", "bold");
            image_result >= threshold ? doc.setTextColor(5, 160, 20) : doc.setTextColor(200, 30, 30);
            doc.text(` ${image_result * 100} %`, curr_x, curr_y);

            curr_x = mx;
            curr_y += fontSize / 72 + 5 / 72;

            fontSize = 9;
            doc.setFontSize(fontSize);
            doc.setTextColor(0, 0, 0);
            doc.setFont("Outfit", "normal");

            doc.text("(confidence of image being real)", curr_x, curr_y);
            curr_y += 2 * fontSize / 72;

            fontSize = 14;
            doc.setFontSize(fontSize);
            doc.setFont("Outfit", "bold");
            doc.text("Image :", curr_x, curr_y);

            curr_y += fontSize / 72;
            // const result_element = result_ref.current;
            // let result_canvas = await html2canvas(result_element);
            // const result_imgData = result_canvas.toDataURL('image/png');
            // const res_img_w = 550 / 72;
            // const res_img_h = (result_canvas.height * res_img_w) / result_canvas.width;
            const res_img_h = 300/72;
            const res_img_w = 300/72;
            doc.addImage(fileUrl, 'PNG', curr_x, curr_y, res_img_w, res_img_h, '', 'FAST');

            curr_x = mx;
            curr_y += res_img_h + 30 / 72; //gap of 30 px

            // doc.setDrawColor(150, 150, 150);
            // doc.setLineWidth(1 / 72);
            // doc.line(curr_x, curr_y, curr_x + 550 / 72, curr_y);

            // curr_y += 30 / 72;
        }

        // set_taking_ss(false);

        doc.save("deepfake_report.pdf");
    }

    // console.log(response_data, analysisTypes)

    if (Object.keys(response_data).length > 0 && response_data["message"] === undefined) {
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
                            <div onClick={handle_newCheck} className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-3xl shadow-primary shadow'>
                                <PlusCircle className='size-6' strokeWidth={1.5} />
                                New Analysis
                            </div>

                            {/* PDF EXPORT */}
                            <div
                                onClick={async () => { await handle_pdf_tester() }}
                                className=' flex items-center gap-2 cursor-pointer text-lg h-fit px-5 py-2 my-6 rounded-3xl shadow-primary shadow '
                            >
                                Export Report
                                <DownloadFile className='size-6' strokeWidth={1.5} />
                            </div>
                        </div>
                    }
                </div>

                {/* ANALYSIS */}
                <div className=" relative w-full flex flex-col lg:gap-3 items-center bg-slate-50 rounded-lg overflow-hidden ">

                    <div className={` ${taking_ss ? '' : 'hidden'} absolute z-20 w-full h-full bg-black/90 backdrop-blur-2xl text-white `}>

                        <div className=' flex flex-col justify-center items-center gap-4 text-2xl my-40 '>
                            <div role="status">
                                <LoadingCircle className="w-8 h-8 text-white/30 animate-spin fill-white"/>
                            </div>
                            CREATING PDF
                        </div>

                    </div>

                    {/*  */}
                    <div ref={result_ref} className=' flex gap-10 justify-between px-8 items-end relative pt-10 w-full '>

                        {/* RESULT TEXT + RESULT BOX  */}
                        <div className=' w-full max-w-[40vw] flex flex-col h-[60vh] gap-10 '>
                            {/* MANIPULATION CHECK STATEMENT */}
                            {
                                response_data["aigcCheck"] !== undefined &&
                                (<>
                                    {
                                        response_data["aigcCheck"].result.toFixed(2) >= response_data["aigcCheck"].threshold ?
                                            (
                                                <div className='flex gap-3 items-center text-2xl w-full justify-center '>
                                                    <span className='font-medium bg-green-200 px-5 py-1 rounded-full w-fit'>No manipulation detected</span>
                                                    in <span className='font-medium'>Image</span>
                                                </div>
                                            )
                                            :
                                            (
                                                <div className='flex gap-3 items-center text-2xl w-full justify-center '>
                                                    <span className='font-medium bg-red-200 px-5 py-1 rounded-full w-fit'>Manipulation detected</span>
                                                    in <span className='font-medium'>Image</span>
                                                </div>
                                            )
                                    }
                                </>)
                            }
                            {/* RESULT BOX */}
                            <div className=' flex justify-evenly items-center py-4 w-full gap-4'>
                                {
                                    // result of all analysis
                                    Object.keys(response_data).map((val, idx) => {
                                        if (response_data[val] == undefined)
                                            return

                                        let pred = response_data[val].result > response_data[val].threshold;
                                        let perc = (response_data[val].result * 100).toFixed(2);
                                        return (
                                            <div key={idx} className={`  bg-white flex flex-col items-center gap-3 py-5 rounded-3xl shadow ${pred ? " shadow-green-700" : " shadow-red-700"}  `}>
                                                <span className=' text-xl flex gap-2'>
                                                    {
                                                        val === "aigcCheck" &&
                                                        (
                                                            <>
                                                                <span className=' '>
                                                                    Result:
                                                                </span>
                                                                <span className={` text-xl px-6 w-full text-center font-semibold ${pred ? " text-green-700" : "text-red-700"}`}>
                                                                    {pred ? "Real" : "Fake"}
                                                                </span>
                                                            </>
                                                        )
                                                    }
                                                </span>
                                                <div className=' text-xl flex items-center justify-center w-full gap-2'>
                                                    <span>
                                                        Score:
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full  font-semibold ${pred ? " bg-green-200  text-green-700" : " bg-red-200  text-red-700"}`}>
                                                        {perc} %
                                                    </span>
                                                </div>
                                                <div className="relative left-0 top-0 h-3 my-3 ml-16 w-[336px] " >
                                                    <input
                                                        type="range"
                                                        className={`result-seperate-slider absolute w-[268px] outline-none transition-all duration-300 cursor-default`}
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

                        {/* Image */}
                        <div className='relative w-full'>
                            <img
                                src={fileUrl}
                                className=" w-fit max-w-3xl h-[60vh] "
                            />
                        </div>
                    </div>

                </div>

                <div className=' flex pt-4 items-start px-8 gap-10'>

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
                <div className='text-xl bg-red-500 px-10 py-2 rounded-full text-red-100' >ERROR OCCURED</div>
                <div className='text-lg bg-red-800 text-white px-10 py-2' >{response_data["message"]}</div>
            </div>
        </>)
    }
}

export default ResultsImageUI;