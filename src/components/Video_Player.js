import { useEffect, useState, useRef, useCallback } from "react";
import { Play, Pause, RefreshCcw, AlertCircle } from "lucide-react"

export const VideoPlayer = ({ videoRef, fileUrl, bbox_data, duration, model_results }) => {

    let frame_index;
    const [isPaused, setIsPaused] = useState(true);
    const [progress, setProgress] = useState(0);
    const [current_bboxes, set_current_bboxes] = useState();
    const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
    const [videoError, setVideoError] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    const MAX_RETRIES = 5;
    const RETRY_DELAY = 2000;

    const setup_frame_index = () => {
        let temp_frame_index = null;
        let max_points = 0;

        for (let label in model_results["frameCheck"]) {

            if (model_results["frameCheck"][label]["data_points"] > max_points) {
                temp_frame_index = label;
                max_points = model_results["frameCheck"][label]["data_points"];
            }
        }
        if (temp_frame_index === null) {
            temp_frame_index = Object.keys(model_results["frameCheck"])[0];
        }
        frame_index = temp_frame_index;
    }
    if (model_results && model_results["frameCheck"] !== undefined) {
        setup_frame_index();
    }

    const retryVideoLoad = useCallback(() => {
        if (retryCount < MAX_RETRIES && videoRef.current) {
            setIsRetrying(true);
            setVideoError(null);

            const delay = RETRY_DELAY * Math.pow(2, retryCount);

            setTimeout(() => {
                setRetryCount(prev => prev + 1);
                videoRef.current.load();
                setIsRetrying(false);
            }, delay);
        }
    }, [retryCount, videoRef]);

    const safeVideoOperation = useCallback(async (operation) => {
        if (!videoRef.current) return;
        try {
            await operation();
        } catch (error) {
            if (!error.message.includes('interrupted by a call to pause')) {
                console.error('Video operation failed:', error);
                setVideoError({ message: `Playback failed: ${error.message} ` });
            }
        }
    }, [videoRef]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            if (duration === 0)
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
                await videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
            setIsPaused(videoRef.current.paused);
        });
    };

    const handleVideoError = useCallback((event) => {
        const error = event.target.error;
        console.error('Video error:', error);

        setIsLoading(false);

        const shouldRetry = error && (
            error.code === MediaError.MEDIA_ERR_NETWORK ||
            error.code === MediaError.MEDIA_ERR_DECODE ||
            error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        );

        if (shouldRetry && retryCount < MAX_RETRIES) {
            retryVideoLoad();
        } else {
            setVideoError({
                message: error?.message || 'Unknown video error',
                code: error?.code,
                canRetry: retryCount < MAX_RETRIES
            });
        }
    }, [retryCount, retryVideoLoad]);

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
        setRetryCount(0);
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

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('error', handleVideoError);
        video.addEventListener('loadedmetadata', handleVideoLoadedMetadata);
        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('stalled', handleStalled);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('loadeddata', handleLoadedData);

        return () => {
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

    useEffect(() => {
        if (progress > 100 && videoRef.current) {
            videoRef.current.pause();
            setIsPaused(true);
        }
    }, [progress]);

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} `;
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

    return (
        <div className="flex flex-col items-center w-full max-w-5xl mx-auto">
            <div className='relative w-full aspect-video bg-zinc-950 rounded-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] group'>
                {/* BBOX */}
                {current_bboxes !== undefined && current_bboxes.length > 0 && (
                    current_bboxes.map((person, idx) => {
                        const top = (person["bbox"][1] / videoDimensions.height) * 100;
                        const left = (person["bbox"][0] / videoDimensions.width) * 100;
                        const width = ((person["bbox"][2] - person["bbox"][0]) / videoDimensions.width) * 100;
                        const height = ((person["bbox"][3] - person["bbox"][1]) / videoDimensions.height) * 100;

                        return (
                            <div
                                key={idx}
                                style={{
                                    top: `${top}%`,
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    height: `${height}%`,
                                }}
                                className={`z-10 absolute rounded-lg border-2 ${person["pred"] ? "border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.4)]" : "border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.4)]"} transition-all duration-150 ease-out`}
                            />
                        )
                    })
                )}

                {videoError ? (
                    <div className="text-rose-500 h-full w-full flex flex-col items-center justify-center gap-4 bg-zinc-900">
                        <AlertCircle className="size-12 opacity-50" />
                        <div className="text-center">
                            <p className="font-medium text-lg text-zinc-200">Playback Error</p>
                            <p className="text-sm text-zinc-500 mt-1">{videoError.message}</p>
                        </div>
                        {videoError.canRetry && (
                            <button
                                onClick={handleManualRetry}
                                className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-full hover:bg-zinc-200 transition-all font-medium text-sm"
                            >
                                <RefreshCcw className="size-4" />
                                Retry
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <video
                            data-html2canvas-ignore
                            ref={videoRef}
                            src={fileUrl}
                            controls={false}
                            onError={handleVideoError}
                            onLoadedMetadata={handleVideoLoadedMetadata}
                            className="w-full h-full object-contain"
                        />

                        {/* Loading overlay */}
                        {(isLoading || isRetrying) && (
                            <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center z-20 transition-all duration-300">
                                <div className="text-white text-center">
                                    <RefreshCcw className="size-8 animate-spin mx-auto mb-3 opacity-80" />
                                    <p className="font-medium tracking-tight text-xs opacity-60">
                                        {isRetrying
                                            ? `RETRYING... (${retryCount}/${MAX_RETRIES})`
                                            : 'LOADING MEDIA'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* OVERLAY CONTROLS (FADES ON IDLE) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <div className="flex items-center gap-4">
                        <button
                            disabled={videoError}
                            onClick={handlePlayToggle}
                            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                        >
                            {isPaused ? (
                                <Pause className="size-4" fill="currentColor" strokeWidth={0} />
                            ) : (
                                <Play className="size-4" fill="currentColor" strokeWidth={0} />
                            )}
                        </button>

                        <div className="flex-1 flex flex-col gap-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="0.1"
                                value={progress || 0}
                                onChange={handleSliderChange}
                                disabled={isLoading || videoError}
                                className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white hover:h-1.5 transition-all"
                                style={{
                                    background: `linear-gradient(to right, white ${progress}%, rgba(255,255,255,0.2) ${progress}%)`
                                }}
                            />
                            <div className="flex justify-between text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                                <span>{formatTime(videoRef.current?.currentTime || 0)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};