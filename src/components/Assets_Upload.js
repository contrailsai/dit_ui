import { useState, useRef } from "react"
import { UploadFile, PlusCircle, Video, Audio, Image } from "./SVGs";
import { delete_asset_by_id } from "@/utils/cases_functions";
const Assets_Upload = ({ SavedAssets, CurrAssets, SetCurrAssets }) => {

    const [tempSavedAssets, SetTempSavedAssets] = useState(SavedAssets);

    const fileInputRef = useRef(null);
    const carouselRef = useRef(null);

    // Form functions (upload file, drop file, change file remove file)
    const handleFileChange = (event) => {
        const newfiles = event.target.files;
        let tempNewAssets = [];
        for (let newfile of newfiles) {
            console.log(newfile);

            if (newfile === undefined) return;

            // Check file size (50MB = 50 * 1024 * 1024 bytes)
            const maxSize = 50 * 1024 * 1024;
            if (newfile.size > maxSize) {
                alert("File size exceeds 50MB. Please choose a smaller file.");
                return;
            }

            if (newfile && (newfile.type.startsWith('video/') || newfile.type.startsWith('audio/') || newfile.type.startsWith('image/'))) {
                const temp_url = URL.createObjectURL(newfile);
                // SetCurrAssets([...CurrAssets, {
                tempNewAssets.push({
                    "file": newfile,
                    "url": temp_url,
                    "type": newfile.type.split('/')[0],
                    "name": newfile.name,
                }
                );
                // ]);
            }
            else {
                alert('Please select a valid video/audio/image file.');
            }
        }
        SetCurrAssets([...CurrAssets, ...tempNewAssets]);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const droppedFiles = event.dataTransfer.files;
        for (let droppedFile of droppedFiles) {

            if (droppedFile === undefined) return;

            const maxSize = 50 * 1024 * 1024;
            if (droppedFile && droppedFile.size > maxSize) {
                alert("File size exceeds 50MB. Please choose a smaller file.");
                return;
            }

            if (droppedFile && (droppedFile.type.startsWith('video/') || droppedFile.type.startsWith('audio/') || droppedFile.type.startsWith('image/'))) {
                // setfile(droppedFile);
                const temp_url = URL.createObjectURL(droppedFile);
                SetCurrAssets([...CurrAssets, {
                    "file": droppedFile,
                    "url": temp_url,
                    "type": droppedFile.type.split('/')[0],
                    "name": droppedFile.name,
                }
                ]);
            }
            else {
                alert('Please select a valid video/audio/image file.');
            }
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const removeFile = async (asset) => {
        if(asset.id !== undefined){
            console.log("removing saved file.")
            //remove asset from db here
            const resp =  await delete_asset_by_id(asset.id);
            console.log(resp);
            if(resp.success){
                SetTempSavedAssets(tempSavedAssets.filter((a)=> a.id !== asset.id ))
            }
            return;
        }
        //remove asset from client
        SetCurrAssets(CurrAssets.filter((a) => a.url !== asset.url));
    };

    const scrollToItem = (id) => {
        const element = carouselRef.current.querySelector(`#upload-item-${id}`);
        if (element) {
            element.scrollIntoView({
                behavior: "smooth", // Smooth scroll
                block: "nearest",   // Align to nearest edge of the viewport
            });
        }
    };

    return (
        <div className="flex border border-primary p-2 w-full h-full overflow-hidden rounded-3xl bg-white">

            <input
                ref={fileInputRef}
                type="file"
                id="videoFile"
                name="videoFile"
                accept={`video/*, audio/*, image/*`}
                onChange={handleFileChange}
                multiple
                // required
                // className="w-fit py-2 text-gray-700 rounded mx-auto"
                className='hidden'
            />

            {
                tempSavedAssets.length + CurrAssets.length === 0 ?
                    <div className="w-full flex flex-col min-w-96 ">
                        <label htmlFor="uploaded" className=" px-4">UPLOAD ASSETS</label>
                        {/* Drop FILE */}
                        <div
                            className=" flex flex-col justify-center items-center gap-3 h-full w-full cursor-pointer border-2 border-primary border-dashed rounded-2xl p-8 bg-primary/10 "

                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => { fileInputRef.current.click() }}
                        >
                            <UploadFile className="size-8" strokeWidth={1} />
                            <p>Drag and drop a file here, or click to select a file</p>

                            {/* <p className="text-gray-500 text-sm">Max file size: 50MB</p> */}
                        </div>
                    </div>
                    :
                    // {/* UPLOADED */ }
                    < div className="flex gap-2 w-full overflow-hidden ">
                        {/* PREVIEW */}
                        <div className="border bg-slate-200 w-16 rounded-2xl h-full flex flex-col justify-between items-center gap-2 ">
                            <div className="flex flex-col gap-3 py-1 max-h-96 overflow-y-auto scrollbar-hide ">
                                {
                                    [...tempSavedAssets, ...CurrAssets].map(
                                        (asset, index) => (
                                            <div
                                                key={index}
                                                className="h-16 w-14 border hover:border-primary transition-all bg-white rounded-xl flex flex-col justify-center items-center  cursor-pointer"
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
                            <div
                                className="h-14 w-14 rounded-2xl bg-white cursor-pointer"
                                onClick={() => { fileInputRef.current.click() }}
                            >
                                <PlusCircle className="" strokeWidth={1} />
                            </div>
                        </div>
                        {/* CAROUSEL */}
                        <div ref={carouselRef} className="overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth snap-x snap-mandatory bg-white border w-[56vw] flex rounded-2xl ">
                            {
                                [...tempSavedAssets ,...CurrAssets].map(
                                    (asset, index) => (
                                        <div id={`upload-item-${index}`} key={index} className="snap-always snap-center flex justify-between overflow-hidden p-2 min-w-[56vw] max-h-[50vh] ">
                                            <div className=" overflow-y-auto flex justify-center w-full items-center ">
                                                {
                                                    asset.type === 'video' ?
                                                        <video src={asset.signedUrl ? asset.signedUrl : asset.url} controls className=" w-full h-full" />
                                                        :
                                                        asset.type === 'audio' ?
                                                            <audio src={asset.signedUrl ? asset.signedUrl : asset.url} controls className=" w-full min-w-80" />
                                                            :
                                                            <img src={asset.signedUrl ? asset.signedUrl : asset.url} className=" h-full " />
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

                                                <button
                                                    onClick={() => { removeFile(asset) }}
                                                    className="bg-red-400 hover:bg-red-500 h-fit p-2 px-8 text-white rounded-3xl w-fit min-w-20 tranistion-all"
                                                >
                                                    Remove
                                                </button>
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

export default Assets_Upload;