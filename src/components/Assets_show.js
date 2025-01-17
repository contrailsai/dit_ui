import { useState, useRef } from "react"
import { PlusCircle, Video, Audio, Image } from "./SVGs";

const Assets_Show = ({ CurrAssets }) => {

    const fileInputRef = useRef(null);
    const carouselRef = useRef(null);

    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);

    const scrollToItem = (id) => {
        const element = carouselRef.current.querySelector(`#upload-item-${id}`);
        if (element) {
            element.scrollIntoView({
                behavior: "smooth", // Smooth scroll
                block: "nearest",   // Align to nearest edge of the viewport
            });
        }
    };

    const handleDownload = async (url, filename) => {
        try {
            setStatus('downloading');
            const encodedUrl = encodeURIComponent(url);
            window.location.href = `/api/download-asset?url=${encodedUrl}&&filename=${filename}`;
            // setError(null);

            // const response = await fetch(url, {
            //     method: 'GET',
            //     mode: 'cors', // Enable CORS
            //     headers: {
            //         'Content-Type': 'application/octet-stream',
            //     },
            // });

            // if (!response.ok) {
            //     throw new Error(`HTTP error! status: ${response.status}`);
            // }

            // // Get the blob from the response
            // const blob = await response.blob();

            // // Create a URL for the blob
            // const downloadUrl = window.URL.createObjectURL(blob);

            // // Create a temporary link element
            // const link = document.createElement('a');
            // link.href = downloadUrl;
            // link.download = filename || 'download'; // Use provided filename or default

            // // Append to document, click, and remove
            // document.body.appendChild(link);
            // link.click();
            // document.body.removeChild(link);

            // // Clean up the URL object
            // window.URL.revokeObjectURL(downloadUrl);

            setStatus('completed');
        } catch (err) {
            console.error('Download failed:', err);
            setError(err.message);
            setStatus('error');
        }
    };

    return (
        <div className="flex flex-col w-fit border bg-slate-100 shadow hover:shadow-primary p-2 h-full overflow-hidden rounded-3xl transition-all duration-300">
            <p className="text-2xl px-5 py-2" >Assets</p>
            {
                CurrAssets.length !== 0 &&
                < div className="flex gap-2 w-full overflow-hidden ">
                    {/* PREVIEW */}
                    <div className="border border-slate-300  overflow-hidden  w-16 rounded-2xl h-full flex flex-col justify-between items-center gap-2 ">
                        <div className="flex flex-col gap-3 py-1 max-h-96 overflow-y-auto scrollbar-hide">
                            {
                                CurrAssets.map(
                                    (asset, index) => (
                                        <div
                                            key={index}
                                            className="h-16 w-14 rounded-xl flex flex-col justify-center items-center bg-white border hover:border-primary cursor-pointer transition-all "
                                            onClick={() => { scrollToItem(index) }}
                                        >
                                            {
                                                asset.type === 'video' ?
                                                    <Video className="size-10" strokeWidth={1.5} />
                                                    :
                                                    asset.type === 'audio' ?
                                                        <Audio className="size-10" strokeWidth={1.5} />
                                                        :
                                                        <Image className="size-10" strokeWidth={1.5} />
                                            }
                                            <span className="text-xs">
                                                {asset.type}
                                            </span>
                                        </div>
                                    )
                                )
                            }
                        </div>
                    </div>
                    {/* CAROUSEL */}
                    <div ref={carouselRef} className="overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth snap-x snap-mandatory bg-white border w-[56vw] flex rounded-2xl ">
                        {
                            CurrAssets.map(
                                (asset, index) => (
                                    <div id={`upload-item-${index}`} key={index} className="snap-always snap-center flex justify-between overflow-hidden p-2 min-w-[56vw] max-h-[50vh] ">
                                        <div className=" overflow-y-auto flex justify-center w-full items-center rounded-sm ">
                                            {
                                                asset.type === 'video' ?
                                                    <video src={asset.signedUrl} controls className=" w-full h-full" />
                                                    :
                                                    asset.type === 'audio' ?
                                                        <audio src={asset.signedUrl} controls className=" w-full min-w-80" />
                                                        :
                                                        <img src={asset.signedUrl} className=" h-full " />
                                            }
                                        </div>
                                        <div className="flex flex-col justify-end gap-8 pl-4 min-w-48 ">
                                            <p className=" flex flex-col">
                                                <span className="font-semibold">File Name:</span>
                                                <span className="text-lg break-all ">{asset.name}</span>
                                            </p>
                                            <p className=" flex flex-col">
                                                <span className="font-semibold">File Type:</span>
                                                <span className="text-lg">{asset.type}</span>
                                            </p>

                                            <div
                                                onClick={() => { handleDownload(asset.signedUrl, asset.name) }}
                                                disabled={status === 'downloading'}

                                                className=" cursor-pointer bg-primary/90 hover:bg-primary h-fit p-2 px-8 text-white rounded-3xl w-fit min-w-20 transition-all"
                                            >
                                                {status === 'downloading' ? 'Downloading...' : 'Download'}
                                            </div>
                                        </div>
                                    </div>
                                )
                            )
                        }
                    </div>
                </div>
            }
        </div >
    )
}

export default Assets_Show;