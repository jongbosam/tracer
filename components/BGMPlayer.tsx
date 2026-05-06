'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export default function BGMPlayer() {
  const { theme } = useStore();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (theme.bgmEnabled) {
        // Play the audio (might require user interaction first depending on browser policy)
        audioRef.current.play().catch(error => {
           console.log("Audio autoplay failed, waiting for user interaction:", error);
           // If autoplay fails, we can optionally turn the toggle off
           // useStore.getState().setTheme({ bgmEnabled: false }); 
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [theme.bgmEnabled]);

  return (
    <audio 
      ref={audioRef} 
      src="/bgm.mp3" 
      loop 
      preload="auto"
      className="hidden"
    />
  );
}
