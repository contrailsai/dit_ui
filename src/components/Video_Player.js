import { useEffect, useState, useRef } from "react";

export const VideoPlayer = ({ videoRef, fileUrl, bbox_data, duration, model_results }) => {

    let frame_index;
    const [isPaused, setIsPaused] = useState(true);
    const [progress, setProgress] = useState(0);
    const [current_bboxes, set_current_bboxes] = useState(); // array of objects -> [{"bbox": [t,r,b,l], "pred": bool}, ..]
    const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
    const [videoError, setVideoError] = useState(null);

    const setup_frame_index = () => {
        let temp_frame_index = null;
        for (let label in model_results["frameCheck"]) {
            if (!model_results["frameCheck"][label]["prediction"]) {
                temp_frame_index = label;
                break;
            }
        }
        if (temp_frame_index === null) {
            temp_frame_index = "0";
        }
        frame_index = temp_frame_index;
        // set_frame_index(temp_frame_index);
    }
    if( model_results && model_results["frameCheck"] !== undefined){
        setup_frame_index();
    }

    
    useEffect(() => {
        const video = videoRef.current;

        const handleTimeUpdate = () => {
            // console.log("time =", Math.floor(video.currentTime), duration);
            if (duration === 0) //results not loaded but video should be playable
                setProgress((video.currentTime / video.duration) * 100);
            else
                setProgress((video.currentTime / duration) * 100);
    
            if (model_results && model_results["frameCheck"] !== undefined)
                set_current_bboxes(bbox_data[Math.floor(video.currentTime)]);
        };

        if (model_results !== null && video.error) {
            console.error(video.error);
            setVideoError(video.error);
            return;
        }

        video.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [duration, bbox_data]);

    const handlePlayToggle = () => {

        if (progress >= 100) {
            videoRef.current.currentTime = 0;
            setProgress(0);
        }

        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
        setIsPaused(videoRef.current.paused);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSliderChange = (e) => {
        const time = (e.target.value * duration) / 100;
        videoRef.current.currentTime = time;
        setProgress(e.target.value);
    };

    const handleVideoLoadedMetadata = (e) => {
        const { videoWidth, videoHeight } = videoRef.current;
        setVideoDimensions({ width: videoWidth, height: videoHeight });
    }

    useEffect(() => {
        if (progress > 100) {
            console.log("video ended");
            videoRef.current.pause();
            setIsPaused(videoRef.current.paused);
        }
        if(videoDimensions.width === 0)
            handleVideoLoadedMetadata();
        
    }, [progress])

    const handleVideoError = (event) => {
        console.log(event.target.error)
        setVideoError(event.target.error);
    };

    return (
        <>
            {
                <div className=' relative w-full flex flex-row justify-evenly gap-5 '>
                    {
                        model_results ?
                            (
                                <>
                                    {/* RESULT DETAILS */}
                                    <div className=" flex flex-col items-center gap-2 bg-red-30 min-h-[59vh]">
                                        {/* RESULT */}
                                        <div className=' flex w-fit justify-center flex-wrap'>
                                            {/* BOTH AUDIO AND VIDEO 4-CASES */}
                                            {
                                                frame_index !== undefined && model_results["frameCheck"] !== undefined && model_results["audioAnalysis"] !== undefined
                                                &&
                                                (
                                                    <>
                                                        <span className='flex flex-col items-center '>
                                                            {
                                                                model_results["frameCheck"][frame_index]["prediction"] ?
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
                                                                model_results["audioAnalysis"]["prediction"] ?
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
                                                frame_index !== undefined && model_results["frameCheck"] !== undefined && model_results["audioAnalysis"] === undefined
                                                &&
                                                (
                                                    <>
                                                        {
                                                            model_results["frameCheck"][frame_index]["prediction"] ?
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
                                                model_results["frameCheck"] === undefined && model_results["audioAnalysis"] !== undefined
                                                &&
                                                (
                                                    <>
                                                        {
                                                            model_results["audioAnalysis"]["prediction"] ?
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

                                        {/* FRAME, AUDIO RESULTS BOXES */}
                                        <div className=' flex justify-evenly items-center py-4 w-full gap-4 '>
                                            {
                                                // result of all analysis
                                                Object.keys(model_results).map((val, idx) => {
                                                    if (model_results[val] == undefined)
                                                        return

                                                    let pred;
                                                    let perc;

                                                    if (val === "audioAnalysis") {
                                                        pred = model_results[val]["prediction"];
                                                        perc = model_results[val]["percentage"];
                                                    }
                                                    else if (val === "frameCheck") {
                                                        if (frame_index !== undefined) {
                                                            perc = model_results[val][frame_index]["percentage"];
                                                            pred = model_results[val][frame_index]["prediction"];
                                                        }
                                                        else {
                                                            perc = model_results[val]["0"]["percentage"];
                                                            pred = model_results[val]["0"]["prediction"];
                                                        }
                                                    }

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
                                </>
                            )
                            :
                            (
                                <>
                                    {/* SKELETON */}
                                    <div className="flex flex-col justify-between">
                                        <div className="flex flex-col gap-3 items-center ">
                                            <div className="rounded skeleton-h h-8 w-72" />
                                            <div className="rounded skeleton-h h-4 w-36" />
                                            <div className="rounded skeleton-h h-8 w-72" />
                                        </div>
                                        <div className="gap-5 h-full flex items-center">
                                            <div className="rounded skeleton-h h-40 w-72" />
                                            <div className="rounded skeleton-h h-40 w-72" />
                                        </div>
                                    </div>
                                </>
                            )
                    }

                    {/* BBOXES + VIDEO */}
                    <div className='relative'>
                        {/* BBOX */}
                        {current_bboxes !== undefined && current_bboxes.length > 0 && (
                            current_bboxes.map((person, idx) => {
                                const top = (person["bbox"][1] / videoDimensions.height) * 100;
                                const left = (person["bbox"][0] / videoDimensions.width) * 100;
                                const width = ((person["bbox"][2] - person["bbox"][0]) / videoDimensions.width) * 100;
                                const height = ((person["bbox"][3] - person["bbox"][1]) / videoDimensions.height) * 100;
                                // console.log(top, left, width, height);
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            top: `${top}%`,
                                            left: `${left}%`,
                                            width: `${width}%`,
                                            height: `${height}%`,
                                        }}
                                        className={` z-10 absolute border-4 rounded ${person["pred"] ? " border-green-500 " : "border-red-500"} transition-all duration-75 `}
                                    />
                                )
                            })
                        )}
                        {
                            videoError ?
                                (
                                    <div className="text-red-500  h-1/2 w-1/2 p-5 mx-auto flex flex-col ">
                                        <span>
                                            Error Occured:
                                        </span>
                                        <span>
                                            {videoError.message}
                                        </span>
                                    </div>
                                )
                                :
                                <video
                                    data-html2canvas-ignore
                                    ref={videoRef}
                                    src={fileUrl}
                                    controls={false} // Disable inbuilt video player buttons and interactions
                                    onError={handleVideoError}
                                    // onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleVideoLoadedMetadata}
                                    className=" w-fit max-w-3xl h-[60vh] "
                                />
                        }
                    </div>
                </div>
                // )
                // :
                // //SKELETON
                // (
                //     <>
                //         <div className=" w-full flex justify-evenly py-5 gap-2">
                //             <div className="flex flex-col justify-between">
                //                 <div className="flex flex-col gap-3 items-center ">
                //                     <div className="rounded skeleton-h h-8 w-72" />
                //                     <div className="rounded skeleton-h h-4 w-36" />
                //                     <div className="rounded skeleton-h h-8 w-72" />
                //                 </div>
                //                 <div className="gap-5 h-full flex items-center">
                //                     <div className="rounded skeleton-h h-40 w-72" />
                //                     <div className="rounded skeleton-h h-40 w-72" />
                //                 </div>
                //             </div>
                //             <div className="rounded h-[400px] w-[720px] skeleton-h" />
                //         </div>
                //     </>
                // )
            }
            {/* PLAYBACK BOARD / RECTANGLE */}
            <div className=" z-10 flex w-full gap-14 mb-1 py-5 px-5 bg-primary text-white rounded-3xl items-center">
                {/* PLAY BUTTON */}
                <div onClick={handlePlayToggle} className="cursor-pointer border-2 rounded-full p-2 ">
                    {isPaused ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                        </svg>
                    )}
                </div>
                {/* DURATION/PROGRESS */}
                <div className="text-sm flex flex-col divide-y-2 min-w-9 items-center ">
                    <span>
                        {formatTime(videoRef.current?.currentTime || 0)}
                    </span>
                    <span>
                        {formatTime(duration)}
                    </span>
                </div>
                {/* SLIDER */}

                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSliderChange}
                    className=" win10-thumb  w-full rounded-md outline-none transition-all duration-300 cursor-pointer"
                />

            </div>
        </>
    )
}