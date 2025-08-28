import { useEffect, useState, useRef, useCallback } from "react";
import { Play, Pause, RefreshCw, AlertCircle } from "./SVGs";

export const VideoPlayer = ({ videoRef, fileUrl, bbox_data, duration, model_results }) => {

    let frame_index;
    const [isPaused, setIsPaused] = useState(true);
    const [progress, setProgress] = useState(0);
    const [current_bboxes, set_current_bboxes] = useState(); // array of objects -> [{"bbox": [t,r,b,l], "pred": bool}, ..]
    const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
    const [videoError, setVideoError] = useState(null);

    // New states for retry logic and loading
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    const MAX_RETRIES = 5;
    const RETRY_DELAY = 2000; // 2 seconds

    const setup_frame_index = () => {
        let temp_frame_index = null;
        for (let label in model_results["frameCheck"]) {
            if (!model_results["frameCheck"][label]["prediction"] && !isNaN(model_results["frameCheck"][label]["percentage"])) {
                temp_frame_index = label;
                break;
            }
        }
        if (temp_frame_index === null) {
            temp_frame_index = Object.keys(model_results["frameCheck"])[0];
        }
        frame_index = temp_frame_index;
        // set_frame_index(temp_frame_index);
    }
    if (model_results && model_results["frameCheck"] !== undefined) {
        setup_frame_index();
    }

    // Retry function with exponential backoff
    const retryVideoLoad = useCallback(() => {
        if (retryCount < MAX_RETRIES && videoRef.current) {
            setIsRetrying(true);
            setVideoError(null);

            const delay = RETRY_DELAY * Math.pow(2, retryCount);

            setTimeout(() => {
                setRetryCount(prev => prev + 1);
                videoRef.current.load(); // Reload the video
                setIsRetrying(false);
            }, delay);
        }
    }, [retryCount, videoRef]);


    // Safe video operations with error handling
    const safeVideoOperation = useCallback(async (operation) => {
        if (!videoRef.current) return;
        try {
            await operation();
        } catch (error) {
            // Only log real errors, not interruption errors
            if (!error.message.includes('interrupted by a call to pause')) {
                console.error('Video operation failed:', error);
                setVideoError({ message: `Playback failed: ${error.message}` });
            }
        }
    }, [videoRef]);


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
        if (!videoRef.current) return;

        safeVideoOperation(async () => {
            if (progress >= 100) {
                videoRef.current.currentTime = 0;
                setProgress(0);
            }

            if (videoRef.current.paused) {
                await videoRef.current.play(); // Handle promise properly
            } else {
                videoRef.current.pause();
            }
            setIsPaused(videoRef.current.paused);
        });
    };

    // Enhanced error handler with retry logic
    const handleVideoError = useCallback((event) => {
        const error = event.target.error;
        console.error('Video error:', error);

        setIsLoading(false);

        // Categorize errors and decide whether to retry
        const shouldRetry = error && (
            error.code === MediaError.MEDIA_ERR_NETWORK ||
            error.code === MediaError.MEDIA_ERR_DECODE ||
            error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        );

        if (shouldRetry && retryCount < MAX_RETRIES) {
            console.log(`Retrying video load (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            retryVideoLoad();
        } else {
            setVideoError({
                message: error?.message || 'Unknown video error',
                code: error?.code,
                canRetry: retryCount < MAX_RETRIES
            });
        }
    }, [retryCount, retryVideoLoad]);

    // Video event handlers
    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        const currentProgress = (duration === 0)
            ? (video.currentTime / video.duration) * 100
            : (video.currentTime / duration) * 100;

        setProgress(currentProgress);

        if (model_results && model_results["frameCheck"] !== undefined) {
            const frameData = bbox_data[Math.floor(video.currentTime)];
            set_current_bboxes(frameData);
        }
    }, [duration, bbox_data, model_results]);


    const handleVideoLoadedMetadata = useCallback(() => {
        if (!videoRef.current) return;

        const { videoWidth, videoHeight } = videoRef.current;
        setVideoDimensions({ width: videoWidth, height: videoHeight });
        setIsLoading(false);
        setRetryCount(0); // Reset retry count on successful load
    }, []);

    const handleLoadStart = useCallback(() => {
        setIsLoading(true);
        setVideoError(null);
    }, []);

    const handleCanPlay = useCallback(() => {
        setIsLoading(false);
    }, []);

    const handleStalled = useCallback(() => {
        setIsLoading(true);
    }, []);

    const handleWaiting = useCallback(() => {
        setIsLoading(true);
    }, []);

    const handleLoadedData = useCallback(() => {
        setIsLoading(false);
    }, []);


    // Main effect for video event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Add all event listeners
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('error', handleVideoError);
        video.addEventListener('loadedmetadata', handleVideoLoadedMetadata);
        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('stalled', handleStalled);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('loadeddata', handleLoadedData);

        return () => {
            // Clean up ALL event listeners
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('error', handleVideoError);
            video.removeEventListener('loadedmetadata', handleVideoLoadedMetadata);
            video.removeEventListener('loadstart', handleLoadStart);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('stalled', handleStalled);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('loadeddata', handleLoadedData);
        };
    }, [
        handleTimeUpdate,
        handleVideoError,
        handleVideoLoadedMetadata,
        handleLoadStart,
        handleCanPlay,
        handleStalled,
        handleWaiting,
        handleLoadedData
    ]);

    // Handle video end
    useEffect(() => {
        if (progress > 100 && videoRef.current) {
            console.log("video ended");
            videoRef.current.pause();
            setIsPaused(true);
        }
    }, [progress]);

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSliderChange = (e) => {
        if (!videoRef.current || !duration) return;

        const time = (e.target.value * duration) / 100;
        videoRef.current.currentTime = time;
        setProgress(e.target.value);
    };

    const handleManualRetry = () => {
        if (videoRef.current) {
            setRetryCount(0);
            setVideoError(null);
            videoRef.current.load();
        }
    };

    // console.log(model_results)

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
                                                model_results &&
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
                                                            if (model_results[val]["0"] === undefined) {
                                                                perc = "-";
                                                                pred = false;
                                                            }
                                                            else {
                                                                perc = isNaN(model_results[val]["0"]["percentage"]) ? "-" : model_results[val]["0"]["percentage"];
                                                                pred = model_results[val]["0"]["prediction"];
                                                            }
                                                        }
                                                    }

                                                    return (
                                                        <div key={idx} className={` w-64 bg-white flex flex-col items-center gap-3 px-5 py-2 rounded-3xl shadow ${pred ? " shadow-green-700" : " shadow-red-700"}  `}>
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
                                                                    {isNaN(perc) ? "-" : perc} %
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
                    <div className='relative h-fit w-fit'>
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
                                    <div className="text-red-500 h-1/2 w-1/2 p-5 mx-auto flex flex-col items-center gap-4">
                                        <AlertCircle className="size-12" />
                                        <div className="text-center">
                                            <p className="font-semibold">Video Error:</p>
                                            <p className="text-sm">{videoError.message}</p>
                                            {videoError.code && (
                                                <p className="text-xs opacity-75">Error Code: {videoError.code}</p>
                                            )}
                                        </div>
                                        {videoError.canRetry && (
                                            <button
                                                onClick={handleManualRetry}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                            >
                                                <RefreshCw className="size-4" />
                                                Retry
                                            </button>
                                        )}
                                    </div>
                                )
                                :
                                (
                                    <div className="relative">
                                        <video
                                            data-html2canvas-ignore
                                            ref={videoRef}
                                            src={fileUrl}
                                            controls={false}
                                            onError={handleVideoError}
                                            onLoadedMetadata={handleVideoLoadedMetadata}
                                            className="w-fit max-w-3xl h-[50vh]"
                                        />

                                        {/* Loading overlay */}
                                        {(isLoading || isRetrying) && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                <div className="text-white text-center">
                                                    <RefreshCw className="size-8 animate-spin mx-auto mb-2" />
                                                    <p>
                                                        {isRetrying
                                                            ? `Retrying... (${retryCount}/${MAX_RETRIES})`
                                                            : 'Loading video'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                        }
                    </div>
                </div>
            }
            {/* PLAYBACK BOARD / RECTANGLE */}
            <div className=" z-10 flex w-full gap-14 mb-1 py-5 px-5 bg-primary text-white rounded-3xl items-center">
                {/* PLAY BUTTON */}
                <button
                    disabled={videoError}
                    onClick={handlePlayToggle}
                    className={` border-2 rounded-full p-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    {isPaused ? (
                        <Play className="size-8" strokeWidth={1.5} />
                    ) : (
                        <Pause className="size-8" strokeWidth={1.5} />
                    )}
                </button>
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
                    disabled={isLoading || videoError}
                    className="win10-thumb w-full rounded-md outline-none transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />

            </div>
        </>
    )
}