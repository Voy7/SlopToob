'use client'

import { useEffect, useRef } from 'react'
// import io from 'socket.io-client'
import Hls from 'hls.js'
import styles from './page.module.css'


export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  useEffect(() => {
    const video = videoRef.current!
    
    if (!Hls.isSupported()) {
      alert('HLS is not supported');
    }

    const videoSrc = '/output.m3u8'

    const hls = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
        // seek to
        video.currentTime = 10
    });
  }, []);

  return (
    <div>
      <video ref={videoRef} width="640" height="360" controls autoPlay>
        Your browser does not support the video tag.
      </video>
    </div>
  );
}