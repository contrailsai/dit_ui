"use client";
import React, { useState, useEffect } from 'react';
import { video_pdf } from './pdf_creation';
import { Download, PlusCircle, Image as ImageIcon, ScanEye } from 'lucide-react';

const ResultsImageUI = ({ response_data, fileUrl, file_metadata, analysisTypes, handle_newCheck }) => {

    const [resultValues, setResultValues] = useState(null);

    useEffect(() => {
        if (response_data && response_data["aigcCheck"]) {
            const raw = response_data["aigcCheck"];
            // Threshold logic normalization if needed, similar to normalize_value
            // For now, assuming raw.result is the confidence 0-1.
            // Adjust depending on whether result > threshold means authentic or fake.
            // Usually result > threshold => authentic (real).
            // Let's stick to the previous file logic: 
            // if (result < threshold) => Manipulation Detected (Fake)
            // So result >= threshold => Real.

            const isReal = raw.result >= raw.threshold;
            const percentage = raw.result * 100;

            setResultValues({
                "aigcCheck": {
                    prediction: isReal,
                    percentage: percentage,
                    threshold: raw.threshold
                }
            });
        }
    }, [response_data]);

    const handle_pdf_creation = async () => {
        if (resultValues) {
            await video_pdf(
                analysisTypes,
                response_data,
                resultValues,
                file_metadata,
                { current: null }, // No audio graph
                [], // No frame refs
                fileUrl // Pass image URL
            );
        }
    };

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

                {/* TOP SECTION */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* IMAGE CONTAINER */}
                    <div className="lg:col-span-8 flex items-center justify-center min-h-[500px]">
                        <div className="relative w-full h-full bg-zinc-100 rounded-[2rem] overflow-hidden shadow-sm border border-zinc-200 group">
                            {/* Background Pattern or Blur */}
                            <div className="absolute inset-0 bg-zinc-50 flex items-center justify-center">
                                <ImageIcon className="size-16 text-zinc-200" />
                            </div>

                            <img
                                src={fileUrl}
                                alt="Analysis Target"
                                className="relative z-10 w-full h-full object-contain max-h-[70vh] hover:scale-[1.01] transition-transform duration-500 ease-out"
                            />
                        </div>
                    </div>

                    {/* SUMMARY CARD */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 px-2">Analysis Overview</h3>

                        {resultValues?.aigcCheck && (
                            <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${resultValues.aigcCheck.prediction ? "bg-emerald-100/50" : "bg-rose-100/50"}`}>
                                            <ScanEye className={`size-5 ${resultValues.aigcCheck.prediction ? "text-emerald-600" : "text-rose-600"}`} />
                                        </div>
                                        <span className='font-bold text-zinc-900'>Image Integrity</span>
                                    </div>
                                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${resultValues.aigcCheck.prediction ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                        {resultValues.aigcCheck.prediction ? "Authentic" : "Suspicious"}
                                    </span>
                                </div>

                                <div className="flex gap-4 h-24 mb-6">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="flex-1 bg-zinc-50 rounded-xl overflow-hidden relative">
                                            <div
                                                style={{ height: `${100 - resultValues.aigcCheck.percentage}%` }}
                                                className={`absolute bottom-0 w-full transition-all duration-1000 ${resultValues.aigcCheck.prediction ? "bg-zinc-200" : "bg-rose-500"}`}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest">Spoof</span>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="flex-1 bg-zinc-50 rounded-xl overflow-hidden relative">
                                            <div
                                                style={{ height: `${resultValues.aigcCheck.percentage}%` }}
                                                className={`absolute bottom-0 w-full transition-all duration-1000 ${!resultValues.aigcCheck.prediction ? "bg-zinc-200" : "bg-emerald-500"}`}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest">Real</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-50 flex items-baseline justify-between">
                                    <span className="text-zinc-500 text-sm font-medium">Confidence Score</span>
                                    <span className="text-2xl font-light text-zinc-900">{resultValues.aigcCheck.prediction ? resultValues.aigcCheck.percentage.toFixed(1) : (100 - resultValues.aigcCheck.percentage).toFixed(1)}%</span>
                                </div>
                            </div>
                        )}
                    </div>
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

export default ResultsImageUI;