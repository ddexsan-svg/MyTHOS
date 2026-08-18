'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Heart } from 'lucide-react';

interface BreathingCircleProps {
  onComplete: () => void;
}

export default function BreathingCircle({ onComplete }: BreathingCircleProps) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cycles, setCycles] = useState(0);

  const REQUIRED_CYCLES = 3;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Transition phase
            if (phase === 'inhale') {
              setPhase('hold');
              return 4;
            } else if (phase === 'hold') {
              setPhase('exhale');
              return 4;
            } else if (phase === 'exhale') {
              const nextCycles = cycles + 1;
              setCycles(nextCycles);
              if (nextCycles >= REQUIRED_CYCLES) {
                setIsActive(false);
                setPhase('idle');
                onComplete();
                return 4;
              }
              setPhase('inhale');
              return 4;
            }
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, phase, cycles, onComplete]);

  const startExercise = () => {
    setIsActive(true);
    setPhase('inhale');
    setSecondsLeft(4);
  };

  const pauseExercise = () => {
    setIsActive(false);
  };

  const resetExercise = () => {
    setIsActive(false);
    setPhase('idle');
    setSecondsLeft(4);
    setCycles(0);
  };

  // Define size variants for the breathing bubble
  const getBubbleScale = () => {
    if (phase === 'inhale') return 1.5;
    if (phase === 'hold') return 1.5;
    if (phase === 'exhale') return 1.0;
    return 1.0;
  };

  const getBubbleColor = () => {
    if (phase === 'inhale') return 'rgba(78, 168, 222, 0.4)'; // Sky blue
    if (phase === 'hold') return 'rgba(212, 175, 55, 0.4)'; // Gold
    if (phase === 'exhale') return 'rgba(72, 202, 228, 0.4)'; // Teal
    return 'rgba(255, 255, 255, 0.1)';
  };

  const getInstruction = () => {
    if (phase === 'inhale') return 'Breathe in deeply (Inhale)...';
    if (phase === 'hold') return 'Hold your breath (Hold)...';
    if (phase === 'exhale') return 'Breathe out slowly (Exhale)...';
    return 'Are you ready? Press Start.';
  };

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center max-w-md mx-auto my-4 text-center">
      <h3 className="text-xl font-bold text-mythos-sky mb-2 flex items-center gap-2">
        <Heart className="w-5 h-5 text-mythos-sky animate-pulse" />
        Maria Makiling Guided Breathing
      </h3>
      <p className="text-sm text-mythos-sand/80 mb-6 max-w-xs">
        Like a gentle rain that calms the storm, let your breath guide and quiet your mind. (Cycle {cycles}/{REQUIRED_CYCLES})
      </p>

      {/* Breathing Bubble */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        <motion.div
          animate={{
            scale: getBubbleScale(),
            backgroundColor: getBubbleColor(),
          }}
          transition={{
            duration: phase === 'hold' ? 0 : 4,
            ease: 'easeInOut',
          }}
          className="absolute rounded-full w-36 h-36 border-2 border-mythos-sky/30 flex items-center justify-center"
        />

        {/* Center label */}
        <div className="z-10 flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-3xl font-extrabold text-white"
            >
              {phase !== 'idle' ? secondsLeft : '🍃'}
            </motion.div>
          </AnimatePresence>
          <span className="text-xs uppercase tracking-widest text-mythos-gold/80 mt-1">
            {phase !== 'idle' ? phase : 'Ready'}
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="h-12 flex items-center justify-center mb-6">
        <p className="text-lg font-medium text-mythos-sand animate-pulse-slow">
          {getInstruction()}
        </p>
      </div>

      {/* Progress indicators */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: REQUIRED_CYCLES }).map((_, idx) => (
          <div
            key={idx}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${idx < cycles
                ? 'bg-mythos-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                : 'bg-white/10'
              }`}
          />
        ))}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4">
        {!isActive ? (
          <button
            onClick={startExercise}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-mythos-sky text-mythos-deep font-bold shadow-lg hover:bg-mythos-teal transition-all duration-200"
          >
            <Play className="w-4 h-4 fill-mythos-deep" />
            {phase === 'idle' ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button
            onClick={pauseExercise}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 text-white font-bold hover:bg-white/30 transition-all duration-200"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        )}
        <button
          onClick={resetExercise}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4" />
          Restart
        </button>
      </div>
    </div>
  );
}
