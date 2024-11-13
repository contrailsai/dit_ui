import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

const Waveform = ({ videoRef }) => {
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);

    useEffect(() => {
        if (waveformRef.current && videoRef.current) {
            wavesurferRef.current = WaveSurfer.create({
                container: waveformRef.current,
                media: videoRef.current,
                waveColor: '#4f88c8',
                progressColor: '#0253E4',
                height: "auto",
                "barWidth": 2,
                "barGap": 1,
                "barRadius": 100,
                "barHeight": 2,
                dragToSeek: true,
            });

            return () => {
                if (wavesurferRef.current) {
                    wavesurferRef.current.destroy();
                    wavesurferRef.current = null;
                }
            };
        }
    }, [videoRef]);

    return (
        <div ref={waveformRef} className=' w-full pl-10 pr-4 h-16 bg-white rounded-md' />
    );
};

export default Waveform;
