'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function BackgroundMusic() {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio('/mythos-theme.mp3');
        audio.loop = true;
        audio.volume = 0.25;
        audioRef.current = audio;

        const attemptPlay = () => {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                    document.removeEventListener('click', attemptPlay);
                }).catch((e) => {
                    console.log('Browser blocked autoplay. Waiting for interaction...');
                });
            }
        };

        // Try playing immediately
        attemptPlay();

        // Fallback: If blocked, wait for user click
        document.addEventListener('click', attemptPlay);

        return () => {
            document.removeEventListener('click', attemptPlay);
            audio.pause();
        };
    }, []);

    const toggleMute = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    return null;
}
