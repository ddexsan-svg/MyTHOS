'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';

interface AssessmentFlowProps {
  type: 'pre' | 'post';
  onComplete: (scores: {
    mood_rating: number;
    self_esteem_score: number;
    hope_score: number;
    automatic_thoughts_score: number;
    reflection_score: number;
  }) => void;
}

export default function AssessmentFlow({ type, onComplete }: AssessmentFlowProps) {
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState(5);

  // Self esteem (5 questions, Likert scale: 1 to 4)
  const [selfEsteem, setSelfEsteem] = useState<number[]>([2, 2, 2, 2, 2]);

  // Hope scale (4 questions, Likert scale: 1 to 4)
  const [hope, setHope] = useState<number[]>([2, 2, 2, 2]);

  // Automatic thoughts (4 questions, Likert scale: 1 to 5, where 5 is high frequency of negative thoughts)
  const [automaticThoughts, setAutomaticThoughts] = useState<number[]>([3, 3, 3, 3]);

  // Reflection rating (1 to 10)
  const [reflectionScore, setReflectionScore] = useState(5);

  const handleSelfEsteemChange = (index: number, value: number) => {
    const updated = [...selfEsteem];
    updated[index] = value;
    setSelfEsteem(updated);
  };

  const handleHopeChange = (index: number, value: number) => {
    const updated = [...hope];
    updated[index] = value;
    setHope(updated);
  };

  const handleATChange = (index: number, value: number) => {
    const updated = [...automaticThoughts];
    updated[index] = value;
    setAutomaticThoughts(updated);
  };

  const calculateFinalScores = () => {
    // Self esteem: q0, q2, q3 positive. q1, q4 reversed. (1-4 scale)
    const seScore =
      selfEsteem[0] +
      (5 - selfEsteem[1]) +
      selfEsteem[2] +
      selfEsteem[3] +
      (5 - selfEsteem[4]); // Max: 20, Min: 5

    // Hope score (Snyder): sum of all items (1-4 scale)
    const hopeScore = hope.reduce((a, b) => a + b, 0); // Max: 16, Min: 4

    // Automatic thoughts score: we want to represent positive restructuring, so we reverse it (6 - val)
    // High score means LESS automatic negative thoughts (CBT growth)
    const atScore = automaticThoughts.reduce((a, b) => a + (6 - b), 0); // Max: 20, Min: 4

    onComplete({
      mood_rating: mood,
      self_esteem_score: seScore,
      hope_score: hopeScore,
      automatic_thoughts_score: atScore,
      reflection_score: reflectionScore
    });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-xl mx-auto my-4 text-mythos-sand">
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
        <ClipboardList className="w-6 h-6 text-mythos-gold" />
        <div>
          <h2 className="text-xl font-bold text-mythos-gold">
            {type === 'pre' ? 'Pre-Intervention Assessment (Pre-Test)' : 'Post-Intervention Evaluation (Post-Test)'}
          </h2>
          <p className="text-xs text-white/60">
            Evaluate your current psychological status. Part {step} of 5.
          </p>
        </div>
      </div>

      {/* STEP 1: MOOD CHECK-IN */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h3 className="text-lg font-semibold text-mythos-sky">Part 1: Overall Well-being (Mood Check-in)</h3>
          <p className="text-sm text-mythos-sand/80">
            In general, how would you describe your mood over the past week? (1 = Most Unhappy, 10 = Most Happy)
          </p>

          <div className="flex flex-col items-center py-6">
            <span className="text-5xl font-extrabold text-mythos-gold mb-4">{mood}</span>
            <input
              type="range"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-mythos-gold"
            />
            <div className="flex justify-between w-full text-xs text-white/50 mt-2">
              <span>Low / Sad</span>
              <span>Neutral</span>
              <span>High / Happy</span>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-mythos-sky text-mythos-deep font-bold ml-auto hover:bg-mythos-teal transition-all duration-200"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* STEP 2: SELF ESTEEM SCALE */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h3 className="text-lg font-semibold text-mythos-sky">Part 2: Self-Esteem</h3>
          <p className="text-xs text-white/60 mb-4">
            How strongly do you agree with the following statements?
          </p>

          <div className="space-y-4">
            {[
              'I feel that I have a number of good qualities.',
              'All in all, I am inclined to feel that I am a failure.',
              'I am able to do things as well as most other people.',
              'I take a positive attitude toward myself.',
              'I wish I could have more respect for myself.'
            ].map((q, idx) => (
              <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/5">
                <p className="text-sm font-medium mb-3">{q}</p>
                <div className="grid grid-cols-4 gap-2">
                  {['Disagree', 'Slightly Disagree', 'Slightly Agree', 'Strongly Agree'].map((label, val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelfEsteemChange(idx, val + 1)}
                      className={`py-2 px-1 rounded text-[10px] font-semibold transition-all duration-150 ${selfEsteem[idx] === val + 1
                          ? 'bg-mythos-gold text-mythos-deep'
                          : 'bg-white/5 hover:bg-white/10 text-white/70'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 text-sm"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-mythos-sky text-mythos-deep font-bold hover:bg-mythos-teal transition-all duration-200"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: HOPE SCALE */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h3 className="text-lg font-semibold text-mythos-sky">Part 3: Hope and Aspirations (Hope Scale)</h3>
          <p className="text-xs text-white/60 mb-4">
            Answer based on your general view of the future.
          </p>

          <div className="space-y-4">
            {[
              'I can think of many ways to get out of a jam.',
              'I energetically pursue my goals.',
              'There are many ways to reach my dreams in the future.',
              'My past experiences have prepared me for my future.'
            ].map((q, idx) => (
              <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/5">
                <p className="text-sm font-medium mb-3">{q}</p>
                <div className="grid grid-cols-4 gap-2">
                  {['Definitely False', 'Mostly False', 'Mostly True', 'Definitely True'].map((label, val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleHopeChange(idx, val + 1)}
                      className={`py-2 px-1 rounded text-[10px] font-semibold transition-all duration-150 ${hope[idx] === val + 1
                          ? 'bg-mythos-gold text-mythos-deep'
                          : 'bg-white/5 hover:bg-white/10 text-white/70'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 text-sm"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-mythos-sky text-mythos-deep font-bold hover:bg-mythos-teal transition-all duration-200"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 4: AUTOMATIC THOUGHTS QUESTIONNAIRE */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h3 className="text-lg font-semibold text-mythos-sky">Part 4: Frequency of Negative Thoughts (Automatic Thoughts)</h3>
          <p className="text-xs text-white/60 mb-4">
            How often have you experienced the following thoughts during the past week?
          </p>

          <div className="space-y-4">
            {[
              'I feel like I can\'t do anything right.',
              'I am a failure.',
              'I am not as good as other people.',
              'Something is wrong with me.'
            ].map((q, idx) => (
              <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/5">
                <p className="text-sm font-medium mb-3">{q}</p>
                <div className="grid grid-cols-5 gap-1">
                  {['Never', 'Rarely', 'Sometimes', 'Often', 'Always'].map((label, val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleATChange(idx, val + 1)}
                      className={`py-2 px-0.5 rounded text-[9px] font-semibold transition-all duration-150 ${automaticThoughts[idx] === val + 1
                          ? 'bg-red-500 text-white shadow-md'
                          : 'bg-white/5 hover:bg-white/10 text-white/70'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 text-sm"
            >
              Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-mythos-sky text-mythos-deep font-bold hover:bg-mythos-teal transition-all duration-200"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 5: REFLECTION SCORE & SUBMIT */}
      {step === 5 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h3 className="text-lg font-semibold text-mythos-sky">Part 5: Writing and Reflection</h3>
          <p className="text-sm text-mythos-sand/80">
            How comfortable are you in sharing your emotions and writing in your journal or reflection log? (1 = Extremely Difficult, 10 = Extremely Easy)
          </p>

          <div className="flex flex-col items-center py-6">
            <span className="text-5xl font-extrabold text-mythos-gold mb-4">{reflectionScore}</span>
            <input
              type="range"
              min="1"
              max="10"
              value={reflectionScore}
              onChange={(e) => setReflectionScore(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-mythos-gold"
            />
            <div className="flex justify-between w-full text-xs text-white/50 mt-2">
              <span>Uncomfortable</span>
              <span>Neutral</span>
              <span>Very Comfortable</span>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(4)}
              className="px-5 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 text-sm"
            >
              Back
            </button>
            <button
              onClick={calculateFinalScores}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-mythos-gold text-mythos-deep font-extrabold hover:bg-yellow-500 shadow-lg shadow-mythos-gold/30 transition-all duration-200"
            >
              <CheckCircle2 className="w-4 h-4" />
              Submit Assessment
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
