'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ArrowRight, Shield, Award, CheckCircle } from 'lucide-react';

interface DecisionTreeProps {
  onSave: (data: any) => void;
  initialData?: any;
}

export default function DecisionTree({ onSave, initialData }: DecisionTreeProps) {
  const [challenge, setChallenge] = useState(initialData?.challenge || '');
  const [pathA, setPathA] = useState({
    choice: initialData?.pathA?.choice || 'Avoid the challenge and do not try (Avoidance)',
    shortTerm: initialData?.pathA?.shortTerm || 'No anxiety or fear for now, short-term relief.',
    longTerm: initialData?.pathA?.longTerm || 'The problem remains unresolved, confidence decreases, and the situation worsens.'
  });
  const [pathB, setPathB] = useState({
    choice: initialData?.pathB?.choice || 'Face the problem and seek support (Problem Solving)',
    shortTerm: initialData?.pathB?.shortTerm || 'Anxiousness and tiredness at first, feels difficult.',
    longTerm: initialData?.pathB?.longTerm || 'Personal growth, problem resolution, and developing resilience.'
  });
  const [selectedPath, setSelectedPath] = useState<'none' | 'A' | 'B'>(initialData?.selectedPath || 'none');
  const [actionSteps, setActionSteps] = useState(initialData?.actionSteps || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge.trim() || selectedPath === 'none' || !actionSteps.trim()) return;

    onSave({
      challenge,
      pathA,
      pathB,
      selectedPath,
      actionSteps
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-2xl mx-auto my-4">
      <h3 className="text-xl font-bold text-mythos-gold mb-2 flex items-center gap-2">
        <Shield className="w-5 h-5 text-mythos-gold" />
        Biag ni Lam-ang: Hero&apos;s Decision Tree
      </h3>
      <p className="text-sm text-mythos-sand/80 mb-6">
        Like Lam-ang who chose his path and faced the Berkakan of doubt, analyze the options in your life to find the right direction.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Define Challenge */}
        <div>
          <label className="block text-sm font-bold text-mythos-sky mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-mythos-sky" />
            1. What is the &quot;Berkakan&quot; o the big challenge you are facing right now?
          </label>
          <input
            type="text"
            value={challenge}
            onChange={(e) => setChallenge(e.target.value)}
            placeholder="e.g., Failing an exam, conflict with a friend, or excessive worry about the future..."
            className="w-full px-4 py-3 rounded-lg glass-input text-sm"
            required
          />
        </div>

        {/* Step 2: Compare Paths */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Path A */}
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/10 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-red-400 tracking-wider uppercase">Path A (Avoidance / Doubting)</span>
              <p className="text-sm text-mythos-sand mt-2 font-medium">{pathA.choice}</p>

              <div className="mt-4 space-y-2">
                <div>
                  <span className="text-xs text-red-300/70">Short-term Effect:</span>
                  <p className="text-xs text-mythos-sand/90">{pathA.shortTerm}</p>
                </div>
                <div>
                  <span className="text-xs text-red-300/70">Long-term Effect:</span>
                  <p className="text-xs text-red-300/90 font-medium">{pathA.longTerm}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPath('A')}
              className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition-all duration-200 ${selectedPath === 'A'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'border border-red-500/30 text-red-300 hover:bg-red-500/10'
                }`}
            >
              {selectedPath === 'A' ? 'Selected Path A' : 'Select Path A'}
            </button>
          </div>

          {/* Path B */}
          <div className="p-4 rounded-xl border border-mythos-green/20 bg-emerald-950/10 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Path B (Heroic / Striving)</span>
              <p className="text-sm text-mythos-sand mt-2 font-medium">{pathB.choice}</p>

              <div className="mt-4 space-y-2">
                <div>
                  <span className="text-xs text-emerald-300/70">Short-term Effect:</span>
                  <p className="text-xs text-mythos-sand/90">{pathB.shortTerm}</p>
                </div>
                <div>
                  <span className="text-xs text-emerald-300/70">Long-term Effect:</span>
                  <p className="text-xs text-emerald-300/90 font-medium">{pathB.longTerm}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPath('B')}
              className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition-all duration-200 ${selectedPath === 'B'
                  ? 'bg-mythos-green text-white shadow-lg shadow-emerald-500/30'
                  : 'border border-mythos-green/30 text-emerald-300 hover:bg-mythos-green/10'
                }`}
            >
              {selectedPath === 'B' ? 'Selected Path B (Recommended)' : 'Select Path B'}
            </button>
          </div>
        </div>

        {/* Step 3: Action Steps */}
        {selectedPath !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-4 border-t border-white/10"
          >
            <div>
              <label className="block text-sm font-bold text-mythos-gold mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-mythos-gold" />
                3. How will you take the chosen Path? Write down your first 2 action steps.
              </label>
              <textarea
                value={actionSteps}
                onChange={(e) => setActionSteps(e.target.value)}
                placeholder="e.g. 1. Talk to my teacher about my grade tomorrow afternoon. 2. Mediate/review for 1 hour every night..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg glass-input text-sm resize-none"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!challenge.trim() || !actionSteps.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-mythos-gold text-mythos-deep font-bold hover:bg-yellow-500 transition-all duration-200 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {isSaved ? 'Saved!' : 'Save Path'}
              </button>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
