'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronRight, ChevronLeft, Volume2, VolumeX, Music, Music2 } from 'lucide-react';
import { StorySlide, StoryChoiceSlide } from '../lib/types';

interface StoryPlayerProps {
  slides: (StorySlide | StoryChoiceSlide)[];
  sessionNumber: number;
  onComplete: () => void;
}

export default function StoryPlayer({ slides, sessionNumber, onComplete }: StoryPlayerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlayingNarration, setIsPlayingNarration] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [choiceFeedback, setChoiceFeedback] = useState('');

  // Audio refs
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentSlide = slides[currentSlideIndex];

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopNarration();
      stopBackgroundMusic();
    };
  }, []);

  // Stop narration on slide change
  useEffect(() => {
    stopNarration();
    setSelectedChoiceIndex(null);
    setChoiceFeedback('');
  }, [currentSlideIndex]);

  // Seek video when slide index is changed manually (button clicks)
  useEffect(() => {
    if ((sessionNumber === 1 || sessionNumber === 4 || sessionNumber === 5) && videoRef.current) {
      const slide = currentSlide as any;
      if (slide && typeof slide.videoStartSecond === 'number') {
        const video = videoRef.current;
        const sStart = slide.videoStartSecond;
        const sEnd = slide.videoEndSecond ?? sStart + 5;

        // Seek to beginning only if current playtime is not inside slide bounds
        if (video.currentTime < sStart || video.currentTime >= sEnd) {
          video.currentTime = sStart;
        }
      }
    }
  }, [currentSlideIndex, sessionNumber, currentSlide]);

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const time = video.currentTime;

    // Find if there is a matching slide for the current time
    const matchingIndex = slides.findIndex((slide) => {
      const s = slide as any;
      return typeof s.videoStartSecond === 'number' &&
        typeof s.videoEndSecond === 'number' &&
        time >= s.videoStartSecond &&
        time < s.videoEndSecond;
    });

    if (matchingIndex !== -1 && matchingIndex !== currentSlideIndex) {
      setCurrentSlideIndex(matchingIndex);
    }
  };

  // --- NARRATION SPEECH SYNTHESIS ---
  const speakNarration = () => {
    if (!synthRef.current || !currentSlide) return;

    stopNarration();

    const textToSpeak = currentSlide.text;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Attempt to set a clear, natural-sounding Filipino/Tagalog voice
    const voices = synthRef.current.getVoices();
    const filipinoVoices = voices.filter(v =>
      v.lang.toLowerCase().includes('tl') ||
      v.lang.toLowerCase().includes('ph') ||
      v.lang.toLowerCase().includes('fil')
    );

    let selectedVoice = null;
    if (filipinoVoices.length > 0) {
      // 1. Prioritize Higa (Microsoft Online Natural Female) or any natural female voice
      selectedVoice = filipinoVoices.find(v =>
        v.name.toLowerCase().includes('higa') && v.name.toLowerCase().includes('natural')
      );

      // 2. Prioritize any Online Natural / Neural voice (which sounds highly human)
      if (!selectedVoice) {
        selectedVoice = filipinoVoices.find(v =>
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('online') ||
          v.name.toLowerCase().includes('neural')
        );
      }

      // 3. Prioritize Google native speech engines
      if (!selectedVoice) {
        selectedVoice = filipinoVoices.find(v => v.name.toLowerCase().includes('google'));
      }

      // 4. Default to the first available Filipino voice
      if (!selectedVoice) {
        selectedVoice = filipinoVoices[0];
      }
    } else {
      // Fallback: look for a clear English/global female voice (preferring natural neural)
      selectedVoice = voices.find(v =>
        v.lang.includes('en') && (
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('neural') ||
          v.name.toLowerCase().includes('online') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('aria')
        )
      ) || voices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Normal, clear human parameters for speech readability
    utterance.rate = 0.9;  // Natural reading speed for stories
    utterance.pitch = 1.0; // Normal human pitch (prevent robotic/high-pitched synthesis)

    utterance.onend = () => {
      setIsPlayingNarration(false);
    };

    utterance.onerror = () => {
      setIsPlayingNarration(false);
    };

    utteranceRef.current = utterance;
    setIsPlayingNarration(true);
    synthRef.current.speak(utterance);
  };

  const stopNarration = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlayingNarration(false);
  };

  const toggleNarration = () => {
    if (isPlayingNarration) {
      stopNarration();
    } else {
      speakNarration();
    }
  };

  // --- PROCEDURAL BACKGROUND MUSIC (WEB AUDIO API) ---
  const startBackgroundMusic = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime); // Soft background volume
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;

      // Base frequencies for chord pad (Calming Major/Minor depending on session)
      let freqs = [110, 165, 220]; // A2, E3, A3
      if (sessionNumber === 2) {
        freqs = [98, 147, 196]; // G2, D3, G3 (Bernardo, heavy)
      } else if (sessionNumber === 4) {
        freqs = [130.81, 196, 261.63]; // C3, G3, C4 (Maria Makiling, healing C-major)
      } else if (sessionNumber === 5) {
        freqs = [146.83, 220, 293.66]; // D3, A3, D4 (Sarimanok, uplifting D-major)
      }

      oscillatorsRef.current = freqs.map((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Add a very slow LFO style pitch modulation (vibrato) for a mystical feel
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        mod.frequency.setValueAtTime(0.2, ctx.currentTime); // 0.2Hz (5 seconds cycle)
        modGain.gain.setValueAtTime(1.5, ctx.currentTime); // Pitch shift amount

        mod.connect(modGain);
        modGain.connect(osc.frequency);

        osc.connect(gainNode);

        mod.start();
        osc.start();

        return osc;
      });

      setIsMusicPlaying(true);
    } catch (e) {
      console.error('Failed to initialize AudioContext:', e);
    }
  };

  const stopBackgroundMusic = () => {
    if (oscillatorsRef.current) {
      oscillatorsRef.current.forEach(osc => {
        try { osc.stop(); } catch (e) { }
      });
      oscillatorsRef.current = [];
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) { }
      audioCtxRef.current = null;
    }
    setIsMusicPlaying(false);
  };

  const toggleBackgroundMusic = () => {
    if (isMusicPlaying) {
      stopBackgroundMusic();
    } else {
      startBackgroundMusic();
    }
  };

  // --- NARRATIVE MOVEMENT ---
  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  // --- STORY DECISIONS ---
  const handleChoiceSelect = (choiceIdx: number, node: any) => {
    setSelectedChoiceIndex(choiceIdx);
    setChoiceFeedback(node.feedback);
  };

  // --- SVG ILLUSTRATION RENDERER ---
  const renderIllustration = (type: string) => {
    // Generate beautiful animated vector shapes matching the mythology character
    let gradientStart = '#1e3a8a';
    let gradientEnd = '#0b132b';
    let innerContent = null;

    if (type === 'malakas') {
      gradientStart = '#0e2f44';
      gradientEnd = '#080f1e';
      innerContent = (
        <>
          {/* Giant Bamboo shoots */}
          <rect x="70" y="80" width="24" height="260" rx="6" fill="#1b4332" opacity="0.8" />
          <rect x="140" y="40" width="30" height="300" rx="8" fill="#2d6a4f" opacity="0.9" />
          <rect x="220" y="100" width="20" height="240" rx="6" fill="#1b4332" opacity="0.7" />
          {/* Splitting crack */}
          <line x1="155" y1="40" x2="155" y2="340" stroke="#f4eae1" strokeWidth="3" strokeDasharray="10 5" className="animate-pulse" />
          {/* Emerging sun light */}
          <circle cx="155" cy="180" r="50" fill="url(#goldGlow)" opacity="0.7" />
          <path d="M120 180 Q155 120 190 180" fill="none" stroke="#ffd700" strokeWidth="4" />
        </>
      );
    } else if (type === 'maganda') {
      gradientStart = '#1b4332';
      gradientEnd = '#080f1e';
      innerContent = (
        <>
          {/* Bamboo split open */}
          <rect x="80" y="40" width="30" height="300" rx="8" fill="#2d6a4f" opacity="0.5" transform="rotate(-10 80 40)" />
          <rect x="220" y="40" width="30" height="300" rx="8" fill="#2d6a4f" opacity="0.5" transform="rotate(10 220 40)" />
          {/* Elegant gold flower / growth motif */}
          <circle cx="155" cy="180" r="60" fill="url(#tealGlow)" opacity="0.8" />
          <path d="M155 110 Q195 180 155 250" fill="none" stroke="#48cae4" strokeWidth="3" />
          <path d="M155 110 Q115 180 155 250" fill="none" stroke="#48cae4" strokeWidth="3" />
          <circle cx="155" cy="180" r="8" fill="#ffd700" className="animate-ping" />
        </>
      );
    } else if (type === 'bernardo') {
      gradientStart = '#1f1610';
      gradientEnd = '#080f1e';
      innerContent = (
        <>
          {/* Colliding stone peaks */}
          <polygon points="20,340 130,100 160,340" fill="#3a3028" />
          <polygon points="310,340 200,80 170,340" fill="#2e251f" />
          {/* Heavy chains */}
          <path d="M50 250 Q155 290 280 230" fill="none" stroke="#6c757d" strokeWidth="8" strokeDasharray="15 5" />
          {/* Glowing cracks */}
          <polygon points="120,340 155,180 180,340" fill="url(#goldGlow)" opacity="0.4" className="animate-pulse" />
        </>
      );
    } else if (type === 'lamang') {
      gradientStart = '#0e1e38';
      gradientEnd = '#080f1e';
      innerContent = (
        <>
          {/* Ocean backdrop and waves */}
          <path d="M0 260 Q80 220 160 260 T320 260 L320 340 L0 340 Z" fill="#023e8a" opacity="0.8" />
          <path d="M0 290 Q80 270 160 300 T320 290 L320 340 L0 340 Z" fill="#0077b6" />
          {/* Giant fish Berkakan silhouette */}
          <path d="M80 160 C120 120 220 120 240 180 C210 220 130 200 80 160 Z" fill="#1d3557" />
          <circle cx="210" cy="160" r="5" fill="#e63946" />
          {/* Golden amulet glowing */}
          <circle cx="155" cy="200" r="15" fill="#ffd700" className="animate-pulse" />
        </>
      );
    } else if (type === 'maria') {
      gradientStart = '#1e2d24';
      gradientEnd = '#080f1e';
      innerContent = (
        <>
          {/* Silhouetted mountain peak (Reclining goddess profile shape) */}
          <path d="M20 340 Q80 180 130 180 T260 260 T320 340" fill="none" stroke="#2d6a4f" strokeWidth="6" />
          <path d="M10 340 C100 220 180 200 310 340 Z" fill="#1b4332" />
          {/* Magical mist and rain elements */}
          <line x1="100" y1="40" x2="80" y2="120" stroke="#4ea8de" opacity="0.3" strokeWidth="2" />
          <line x1="200" y1="30" x2="180" y2="100" stroke="#4ea8de" opacity="0.3" strokeWidth="2" />
          <circle cx="155" cy="120" r="30" fill="url(#tealGlow)" opacity="0.4" className="animate-float" />
        </>
      );
    } else if (type === 'sarimanok') {
      gradientStart = '#3c0919';
      gradientEnd = '#080f1e';
      innerContent = (
        <>
          {/* Mystical sun background */}
          <circle cx="155" cy="140" r="70" fill="url(#goldGlow)" opacity="0.3" />
          {/* Colorful bird feathers abstraction */}
          <path d="M155 80 Q190 140 155 200 Q120 140 155 80" fill="#ffb703" opacity="0.8" className="animate-float" />
          <path d="M140 100 Q200 130 140 210" fill="#e63946" opacity="0.7" />
          <path d="M170 100 Q110 130 170 210" fill="#4ea8de" opacity="0.7" />
          {/* Fish in beak representation */}
          <ellipse cx="155" cy="180" rx="15" ry="7" fill="#48cae4" />
        </>
      );
    }

    return (
      <svg width="100%" height="240" viewBox="0 0 310 340" className="rounded-xl overflow-hidden shadow-2xl">
        <defs>
          <linearGradient id="svgBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </linearGradient>
          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="tealGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#48cae4" stopOpacity="1" />
            <stop offset="100%" stopColor="#48cae4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#svgBg)" />
        {innerContent}
      </svg>
    );
  };

  const isChoiceSlide = (slide: any): slide is StoryChoiceSlide => {
    return !!slide.choices;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-5xl w-full mx-auto my-4 flex flex-col justify-between min-h-[500px]">

      {/* Header controls (narration and music) */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
        <span className="text-xs font-bold text-mythos-gold uppercase tracking-wider">
          Pahina {currentSlideIndex + 1} ng {slides.length}
        </span>
        <div className="flex gap-2">
          {/* Background Music Toggle */}
          <button
            onClick={toggleBackgroundMusic}
            className={`p-2 rounded-full transition-all duration-200 ${isMusicPlaying ? 'bg-mythos-gold text-mythos-deep' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            title="Procedural Ambient Music"
          >
            {isMusicPlaying ? <Music className="w-4 h-4 animate-bounce" /> : <Music2 className="w-4 h-4" />}
          </button>

          {/* Speech Narration Toggle */}
          <button
            onClick={toggleNarration}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${isPlayingNarration ? 'bg-mythos-sky text-mythos-deep' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
          >
            {isPlayingNarration ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isPlayingNarration ? 'I-pausa' : 'Makinig'}
          </button>
        </div>
      </div>

      {/* Center Illustration or Video */}
      <div className="mb-6 flex justify-center w-full">
        {currentSlide.imageType === 'quote' ? (
          <div className="w-full max-w-4xl py-16 px-8 flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
            <p className="text-xl md:text-3xl text-mythos-sky font-serif font-black italic text-center leading-relaxed drop-shadow-md">
              {currentSlide.text.split('\n\n').map((line, idx) => (
                <span key={idx} className="block mb-4">{line}</span>
              ))}
            </p>
          </div>
        ) : sessionNumber === 1 || sessionNumber === 4 || sessionNumber === 5 ? (
          <video
            ref={videoRef}
            onTimeUpdate={handleVideoTimeUpdate}
            src={
              sessionNumber === 1
                ? "/videos/malakas_maganda.mp4"
                : sessionNumber === 4
                  ? "/videos/Ang Alamat ni Maria Makiling Tagalog na may aral with English subtitles __ Philippine legends.mp4"
                  : "/videos/sarimanok.mp4"
            }
            className="w-full max-w-5xl aspect-video rounded-2xl border border-white/20 shadow-[0_0_50px_rgba(72,202,228,0.4)] bg-black"
            controls
          />
        ) : (
          renderIllustration(currentSlide.imageType)
        )}
      </div>

      {/* Main Text Content (Hidden to focus on video/story, unless it's a choice slide text we want to show) */}
      <div className="flex-grow flex flex-col justify-center mb-6">

        {isChoiceSlide(currentSlide) && (
          <p className="text-center text-mythos-sky text-lg font-bold mb-4 drop-shadow-md">
            {currentSlide.text}
          </p>
        )}

        {/* Choice slide options */}
        {isChoiceSlide(currentSlide) && (
          <div className="mt-6 space-y-3">
            {currentSlide.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleChoiceSelect(index, choice)}
                disabled={selectedChoiceIndex !== null}
                className={`w-full p-3 rounded-lg text-left text-sm font-semibold border transition-all duration-200 ${selectedChoiceIndex === index
                  ? 'bg-mythos-gold text-mythos-deep border-mythos-gold'
                  : selectedChoiceIndex !== null
                    ? 'opacity-40 bg-white/5 border-white/5 text-white/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-mythos-sky'
                  }`}
              >
                {choice.text}
              </button>
            ))}

            {choiceFeedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-lg bg-mythos-sky/10 border border-mythos-sky/30 text-xs text-mythos-sky leading-relaxed mt-2"
              >
                <strong>Tugon:</strong> {choiceFeedback}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-auto">
        <button
          onClick={handleBack}
          disabled={currentSlideIndex === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-white/80 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5 transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
          Bumalik
        </button>

        <button
          onClick={handleNext}
          disabled={isChoiceSlide(currentSlide) && selectedChoiceIndex === null}
          className="flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-bold bg-mythos-sky text-mythos-deep hover:bg-mythos-teal disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-mythos-sky/20 transition-all duration-200"
        >
          {currentSlideIndex === slides.length - 1 ? 'Ipagpatuloy' : 'Susunod'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
