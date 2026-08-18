'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Award, Flame, Star, Compass, Scroll, Plus, Moon, HelpCircle,
  ChevronRight, Feather, Trophy, ChevronLeft, Heart, Anchor, LayoutGrid, X,
  Activity, ArrowRight, Eye, Edit, Calendar, CheckCircle2, ShieldAlert,
  ArrowLeft, Lock, Unlock, Play, Volume2, Maximize, Brain, Shield, Sun, LogOut,
  Quote, CheckCircle, AlertCircle, CloudLightning, ArrowDown, Clock, Sparkles, Scale
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbClient, Participant, Session, MoodLog, Reflection, User, ResponseData } from '../lib/db';
import { INTERVENTION_SESSIONS, SessionConfig, DISTORTIONS_LIST } from '../lib/types';
import StoryPlayer from './StoryPlayer';
import BreathingCircle from './BreathingCircle';
import DecisionTree from './DecisionTree';
import AssessmentFlow from './AssessmentFlow';
import { getAIInterventionFeedback, AIServiceResponse } from '../lib/ai';

// SVG Helper Functions for Donut Wheel
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", startOuter.x, startOuter.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    "L", endInner.x, endInner.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    "Z"
  ].join(" ");
}

interface ParticipantDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function ParticipantDashboard({ user, onLogout }: ParticipantDashboardProps) {
  // DB States
  const [profile, setProfile] = useState<Participant | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [prePost, setPrePost] = useState<{ pre: any, post: any }>({ pre: null, post: null });

  // UI Flow States
  const [activeSession, setActiveSession] = useState<SessionConfig | null>(null);
  const [sessionStep, setSessionStep] = useState<number>(0); // 0: Intro/Objectives, 1: Story, 2: Interactive, 3: CBT, 4: Reflection, 5: Quiz, 6: Completed
  const [showAssessment, setShowAssessment] = useState<'none' | 'pre' | 'post'>('none');
  const [dashboardTab, setDashboardTab] = useState<'sessions' | 'analytics' | 'journal'>('sessions');
  const [introPage, setIntroPage] = useState<number>(0);
  const [hamonPage, setHamonPage] = useState<number>(0);
  const [vidPage, setVidPage] = useState<number>(0);
  const [actPage, setActPage] = useState<number>(0);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [otherStrengths, setOtherStrengths] = useState('');
  const [strengthReflect1, setStrengthReflect1] = useState('');
  const [strengthReflect2, setStrengthReflect2] = useState('');
  const [strengthReflect3, setStrengthReflect3] = useState('');
  const [processAnswer, setProcessAnswer] = useState('');
  const [selectedAggressions, setSelectedAggressions] = useState<string[]>([]);
  const [isExplanationRevealed, setIsExplanationRevealed] = useState(false);
  const [selectedShadows, setSelectedShadows] = useState<string[]>([]);

  // Shadow Map Interactive States
  const [shadowMapTrigger, setShadowMapTrigger] = useState('');
  const [shadowMapThought, setShadowMapThought] = useState('');
  const [shadowMapFeeling, setShadowMapFeeling] = useState('');
  const [shadowMapReaction, setShadowMapReaction] = useState('');

  // STOP Strategy State
  const [activeStop, setActiveStop] = useState<string>('S');

  // Digital Scenario State
  const [scenarioChoice, setScenarioChoice] = useState<string | null>(null);
  const [scenarioExplanation, setScenarioExplanation] = useState('');

  // Activity 1 State (Session 3)
  const [activity1Choice, setActivity1Choice] = useState<string | null>(null);

  // Activity 1 State (Session 4)
  const [s4EmotionChoice, setS4EmotionChoice] = useState<string | null>(null);
  const [s4EmotionBehind, setS4EmotionBehind] = useState('');

  // SESSION 5 ACTIVITY 3 STATE
  const [s5BeliefBefore, setS5BeliefBefore] = useState('');
  const [s5BehaviorBefore, setS5BehaviorBefore] = useState('');
  const [s5BeliefAfter, setS5BeliefAfter] = useState('');
  const [s5BehaviorAfter, setS5BehaviorAfter] = useState('');
  const [s5NewStory, setS5NewStory] = useState('');

  // SESSION 5 ACTIVITY 5 STATE
  const [s5Commit1, setS5Commit1] = useState('');
  const [s5Commit2, setS5Commit2] = useState('');
  const [s5Commit3, setS5Commit3] = useState('');
  const [s5Commit4, setS5Commit4] = useState('');
  const [s5Commit5, setS5Commit5] = useState('');
  const [s5Commit6, setS5Commit6] = useState('');

  // Post-Video Process Questions (Session 4)
  const [s4Process1, setS4Process1] = useState('');
  const [s4Process2, setS4Process2] = useState('');
  const [innerBattleStep, setInnerBattleStep] = useState(0);
  const [voiceInsideAnswers, setVoiceInsideAnswers] = useState<Record<number, string>>({});
  // Activity 3 State (Session 3)
  const [selectedHeroTraits, setSelectedHeroTraits] = useState<string[]>([]);
  const [isHeroQuoteRevealed, setIsHeroQuoteRevealed] = useState(false);

  // Activity 4 State (Session 3)
  const [cbtChoiceStep, setCbtChoiceStep] = useState(0);

  // Activity 5 State (Session 3)
  const [branchingChoice, setBranchingChoice] = useState<number | null>(null);
  const [branchingFreeText, setBranchingFreeText] = useState('');

  // Wrap-Up State (Session 3)
  const [commitmentWill, setCommitmentWill] = useState('');
  const [commitmentInstead, setCommitmentInstead] = useState('');

  // Input states during session
  const [cbtAnswers, setCbtAnswers] = useState<Record<string, string>>({});
  const [distortionSelected, setDistortionSelected] = useState(DISTORTIONS_LIST[0]);
  const [sessionMood, setSessionMood] = useState(5);

  // Activity 5 State (Session 4)
  const [activeRegulationTimer, setActiveRegulationTimer] = useState<{ id: string, title: string, icon: string, timeLeft: number } | null>(null);
  const [completedRegulations, setCompletedRegulations] = useState<string[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeRegulationTimer && activeRegulationTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setActiveRegulationTimer(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
      }, 1000);
    } else if (activeRegulationTimer?.timeLeft === 0 && !completedRegulations.includes(activeRegulationTimer.id)) {
      setCompletedRegulations(prev => [...prev, activeRegulationTimer.id]);
    }
    return () => clearInterval(interval);
  }, [activeRegulationTimer, completedRegulations]);

  const [digitalCard, setDigitalCard] = useState(['', '', '']);
  const [journalText, setJournalText] = useState('');
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizAnswerChecked, setQuizAnswerChecked] = useState(false);

  // AI reflection feedback states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIServiceResponse | null>(null);

  const [responses, setResponses] = useState<ResponseData[]>([]);

  // Load baseline profile data
  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    const p = await dbClient.getParticipant(user.id);
    if (p) setProfile(p);

    const s = await dbClient.getSessions(user.id);
    setSessions(s);

    const m = await dbClient.getMoodLogs(user.id);
    setMoodLogs(m);

    const r = await dbClient.getReflections(user.id);
    setReflections(r);

    const pp = await dbClient.getPrePostData(user.id);
    setPrePost(pp);

    // Fetch responses for all potential 5 sessions
    const allResp: ResponseData[] = [];
    for (let i = 1; i <= 5; i++) {
      const resp = await dbClient.getResponses(user.id, i);
      allResp.push(...resp);
    }
    setResponses(allResp);
  };

  // Trigger Pre-Test completion
  const handlePreTestComplete = async (scores: any) => {
    await dbClient.savePreTest(user.id, scores);
    setShowAssessment('none');
    await loadData();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  // Trigger Post-Test completion
  const handlePostTestComplete = async (scores: any) => {
    await dbClient.savePostTest(user.id, scores);
    setShowAssessment('none');
    await loadData();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  // Start a session
  const startSessionFlow = (config: SessionConfig) => {
    loadData();
    setActiveSession(config);
    setSessionStep(0);
    setIntroPage(0);
    setHamonPage(0);
    setVidPage(0);
    setActPage(0);
    setSelectedStrengths([]);
    setOtherStrengths('');
    setStrengthReflect1('');
    setStrengthReflect2('');
    setStrengthReflect3('');
    setCbtAnswers({});
    setJournalText('');
    setAiResult(null);
    setQuizScore(0);
    setCurrentQuizQuestionIndex(0);
    setSelectedQuizAnswer(null);
    setQuizAnswerChecked(false);
    setSessionMood(5);
  };

  // Save partial inputs during CBT/Journal in real time
  const handleCbtAnswerChange = (id: string, text: string) => {
    setCbtAnswers(prev => {
      const updated = { ...prev, [id]: text };
      if (activeSession) {
        dbClient.saveResponse(user.id, activeSession.number, 'cbt_questions', updated);
      }
      return updated;
    });
  };

  // Analyze reflection using Heuristics/Gemini API
  const analyzeReflection = async () => {
    if (!journalText.trim() || !activeSession) return;
    setIsAiLoading(true);
    try {
      const feedback = await getAIInterventionFeedback(journalText, activeSession.number);
      setAiResult(feedback);

      // Save reflection in DB
      await dbClient.saveReflection(user.id, activeSession.number, journalText, {
        summary: feedback.summary,
        feedback: feedback.feedback,
        encouragement: feedback.encouragement
      });

      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Move forward in quiz
  const handleQuizAnswer = (optionIdx: number) => {
    if (quizAnswerChecked) return;
    setSelectedQuizAnswer(optionIdx);
  };

  const checkQuizAnswer = () => {
    if (selectedQuizAnswer === null || !activeSession) return;

    const correctIdx = activeSession.quizQuestions[currentQuizQuestionIndex].correctAnswerIndex;
    if (selectedQuizAnswer === correctIdx) {
      setQuizScore(prev => prev + 1);
    }
    setQuizAnswerChecked(true);
  };

  const nextQuizQuestion = () => {
    if (!activeSession) return;
    if (currentQuizQuestionIndex < activeSession.quizQuestions.length - 1) {
      setCurrentQuizQuestionIndex(prev => prev + 1);
      setSelectedQuizAnswer(null);
      setQuizAnswerChecked(false);
    } else {
      // Finished quiz, move to final complete step
      setSessionStep(6);
    }
  };

  // Complete session entirely
  const finishSession = async () => {
    if (!activeSession) return;

    // Log mood logged during session
    await dbClient.logMood(user.id, activeSession.number, sessionMood);

    // Complete session in DB
    await dbClient.completeSession(user.id, activeSession.number, 100);

    // Trigger celebration
    confetti({
      particleCount: 150,
      spread: 80,
      colors: ['#ffd700', '#4ea8de', '#2d6a4f', '#bd5a3c']
    });

    setActiveSession(null);
    await loadData();
  };

  // Certificate code
  const [downloadingCert, setDownloadingCert] = useState(false);
  const handleGenerateCertificate = async () => {
    setDownloadingCert(true);
    await dbClient.issueCertificate(user.id);
    await loadData();

    // Simple PDF simulated print download or open window
    setTimeout(() => {
      setDownloadingCert(false);
      window.print();
    }, 1000);
  };

  // Grow the progress tree according to completed sessions
  const renderProgressTree = () => {
    const completedCount = sessions.filter(s => s.is_completed).length;

    // Colorful leaves representation in SVG
    const leafOpacity = (numRequired: number) => completedCount >= numRequired ? 1 : 0.15;
    const flowerColor = completedCount >= 5 ? '#ffd700' : 'rgba(255,255,255,0.1)';

    return (
      <svg viewBox="0 0 200 220" className="w-[12rem] h-[12rem] md:w-[15rem] md:h-[15rem] mx-auto filter drop-shadow-[0_0_15px_rgba(78,168,222,0.2)] group-hover:drop-shadow-[0_0_30px_rgba(255,215,0,0.6)] group-hover:scale-[1.15] transition-all duration-700">
        {/* Pot / Earth */}
        <path d="M70 190 L130 190 L120 215 L80 215 Z" fill="#b07d62" stroke="#d4af37" strokeWidth="1" />

        {/* Trunk (Grows taller and stronger based on progress) */}
        <path
          d="M100 190 Q98 120 100 80"
          fill="none"
          stroke="#b07d62"
          strokeWidth={completedCount >= 1 ? "10" : "5"}
          strokeLinecap="round"
        />

        {/* Branches */}
        {completedCount >= 2 && (
          <>
            <path d="M100 130 Q70 110 55 95" fill="none" stroke="#b07d62" strokeWidth="6" strokeLinecap="round" />
            <path d="M100 110 Q130 90 145 75" fill="none" stroke="#b07d62" strokeWidth="6" strokeLinecap="round" />
          </>
        )}

        {completedCount >= 3 && (
          <>
            <path d="M99 90 Q80 60 70 45" fill="none" stroke="#b07d62" strokeWidth="4" strokeLinecap="round" />
            <path d="M101 90 Q120 60 130 45" fill="none" stroke="#b07d62" strokeWidth="4" strokeLinecap="round" />
          </>
        )}

        {/* Leaves */}
        {/* Session 1 Leaf */}
        <path d="M55 95 Q40 85 45 75 T55 95" fill="#2d6a4f" opacity={leafOpacity(1)} />
        {/* Session 2 Leaf */}
        <path d="M145 75 Q160 65 155 55 T145 75" fill="#2d6a4f" opacity={leafOpacity(2)} />
        {/* Session 3 Leaf */}
        <path d="M70 45 Q60 30 50 35 T70 45" fill="#2d6a4f" opacity={leafOpacity(3)} />
        {/* Session 4 Leaf */}
        <path d="M130 45 Q140 30 150 35 T130 45" fill="#2d6a4f" opacity={leafOpacity(4)} />

        {/* Sarimanok Flower (Top center bloom) */}
        <circle cx="100" cy="70" r="10" fill={flowerColor} opacity={leafOpacity(5)} />
        <circle cx="100" cy="70" r="15" stroke={flowerColor} strokeWidth="2" strokeDasharray="4" fill="none" opacity={leafOpacity(5)} className="origin-[100px_70px] animate-[spin_6s_linear_infinite]" />
      </svg>
    );
  };

  const isPreTestDone = !!prePost.pre;
  const isAllSessionsDone = sessions.length > 0 && sessions.every(s => s.is_completed);

  // Magic completion sound effect & confetti on session completed
  useEffect(() => {
    if (sessionStep === 6) {
      // Fire confetti immediately on entering completion screen
      confetti({
        particleCount: 150,
        spread: 100,
        colors: ['#FFD700', '#FDB931', '#FF8C00', '#48CAE4', '#10B981'],
        origin: { y: 0.5 }
      });

      // Play majestic sound chime using Web Audio API
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();

        const playTone = (freq: number, type: OscillatorType, time: number, dur: number, vol: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = type;
          osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
          gain.gain.setValueAtTime(0, ctx.currentTime + time);
          gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + time + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);
          osc.start(ctx.currentTime + time);
          osc.stop(ctx.currentTime + time + dur);
        };

        // Majestic ascending chime chord (C Maj)
        playTone(523.25, 'sine', 0, 1.5, 0.3); // C5
        playTone(659.25, 'sine', 0.1, 1.5, 0.2); // E5
        playTone(783.99, 'sine', 0.2, 1.5, 0.2); // G5
        playTone(1046.50, 'triangle', 0.3, 2.0, 0.4); // C6 resolved 

        // Sprinkle magic high notes
        playTone(1318.51, 'sine', 0.45, 1.0, 0.1);
        playTone(1567.98, 'sine', 0.6, 1.0, 0.1);
        playTone(2093.00, 'sine', 0.75, 1.5, 0.1);
      } catch (e) {
        console.warn('AudioContext not supported or blocked');
      }
    }
  }, [sessionStep]);

  // Dynamic Background Engine for Sessions to make it engaging
  const getDynamicBackground = () => {
    if (activeSession?.number === 1) {
      // Session 1: Malakas at Maganda
      switch (sessionStep) {
        case 0: return "url('/images/story/malakas_maganda_bg.png')"; // Simula - creation myth
        case 1: return "url('/images/story/magic_bamboo_grove.png')"; // Kuwento - bamboo grove
        case 2: return "url('/images/story/mythology_emergence.png')"; // Hamon 
        case 3: return "url('/images/story/resilience_reflection.png')"; // Pagsusuri
        case 4: return "url('/images/story/malakas_maganda_bg.png')"; // Journal/Activities
        case 5: return "url('/images/story/malakas_maganda_bg.png')"; // Reflection / Pagsusulit
        case 6: return "url('/images/story/malakas_maganda_bg.png')"; // Wakas 
        default: return "url('/images/story/malakas_maganda_bg.png')";
      }
    } else if (activeSession?.number === 2) {
      // Session 2: Bernardo Carpio (Mountains & Earth Theme with 6 Unique Images)
      switch (sessionStep) {
        case 0: return "url('/images/story/bernardo_intro.png')"; // Simula - Giant standing proud looking at sky
        case 1: return "url('/images/story/bernardo_giant_mountain.png')"; // Kuwento - Giant trapped between mountains
        case 2: return "url('/images/story/bernardo_chains.png')"; // Hamon - Action shot of magical glowing chains
        case 3: return "url('/images/story/bernardo_cavern.png')"; // Pagsusuri - Wide shot of cavern with chains
        case 4: return "url('/images/story/bernardo_hope.png')"; // Journal - Light shining on plant in dark cave
        case 5: return "url('/images/story/bernardo_runes.png')"; // Pagsusulit - Ancient glowing runes on wall
        case 6: return "url('/images/story/bernardo_intro.png')"; // Wakas - Return to giant standing proud
        default: return "url('/images/story/bernardo_giant_mountain.png')";
      }
    } else if (activeSession?.number === 3) {
      // Session 3: Biag ni Lam-ang (Ocean, Heroic, & Epic Theme with 7 Unique Images)
      switch (sessionStep) {
        case 0: return "url('/images/story/lamang_intro.png')"; // Simula - Lam-ang as a young prodigy
        case 1: return "url('/images/story/lamang_journey.png')"; // Kuwento - Journey and adventures
        case 2: return "url('/images/story/lamang_sea.png')"; // Hamon - Diving into the ocean
        case 3: return "url('/images/story/lamang_berkakan.png')"; // Pagsusuri - Giant fish Berkakan
        case 4: return "url('/images/story/lamang_bones.png')"; // Journal - Bones recovered
        case 5: return "url('/images/story/lamang_rebirth.png')"; // Pagsusulit - Rebirth with rooster and dog
        case 6: return "url('/images/story/lamang_hero.png')"; // Wakas - Triumphant hero
        default: return "url('/images/story/lamang_journey.png')";
      }
    }
    return "url('/images/story/landing page for learner.png')"; // Base/default for other screens
  };

  const getDynamicOverlay = () => {
    if (activeSession?.number === 1 && (sessionStep === 1 || sessionStep === 6)) {
      return 'bg-[#0a1c10]/80'; // earthy green for bamboo grove
    } else if (activeSession?.number === 2) {
      return 'bg-[#1a1410]/85'; // rocky, earthy dark brown/grey overlay for Bernardo Carpio's mountains
    } else if (activeSession?.number === 3) {
      return 'bg-[#051937]/85'; // deep ocean/epic blue theme for Biag ni Lam-ang
    }
    return 'bg-[#0e1c36]/80'; // default cosmic blue
  };

  return (
    <div className="min-h-screen text-mythos-sand pb-16 bg-[#080f1e]"
      style={{
        backgroundImage: getDynamicBackground(),
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition:
          activeSession?.number === 3 && sessionStep === 3 ? "bottom center" :
            "top center",
        backgroundAttachment: "fixed",
        transition: "background-image 0.8s ease-in-out"
      }}>

      {/* Dark overlay for readability */}
      <div className={`fixed inset-0 pointer-events-none z-[-1] transition-colors duration-800 ${getDynamicOverlay()}`} />

      {/* 1. Header Banner */}
      <header className="glass-panel sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mythos-gold/10 border border-mythos-gold/30 flex items-center justify-center">
            <Compass className="w-6 h-6 text-mythos-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider">MyTHOS</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">CBT Intervention System</p>
          </div>
        </div>

        {profile && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold">{profile.name}</span>
              <span className="text-xs text-mythos-sky">{profile.course_program}</span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-8">

        {/* 2. Top Profile Bar / Baseline trigger */}


        {isPreTestDone && !prePost.post && isAllSessionsDone && showAssessment === 'none' && (
          <div className="glass-panel p-6 rounded-2xl border border-mythos-sky/30 mb-8 bg-cyan-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-mythos-sky flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Matagumpay mong natapos ang lahat ng Session!
              </h3>
              <p className="text-sm text-mythos-sand/80 mt-1">
                Kailangan mo na lamang sagutin ang huling Post-Test upang ma-evaluate ang iyong pag-unlad at makuha ang Certificate.
              </p>
            </div>
            <button
              onClick={() => setShowAssessment('post')}
              className="px-6 py-3 bg-mythos-sky text-mythos-deep font-extrabold rounded-xl hover:bg-mythos-teal shadow-lg shadow-mythos-sky/20 whitespace-nowrap transition-all duration-200"
            >
              Simulan ang Post-Test
            </button>
          </div>
        )}

        {/* 3. Render Assessment Overlay */}
        {showAssessment !== 'none' && (
          <div className="mb-8">
            <AssessmentFlow
              type={showAssessment}
              onComplete={showAssessment === 'pre' ? handlePreTestComplete : handlePostTestComplete}
            />
          </div>
        )}

        {/* 4. Main Section */}
        {showAssessment === 'none' && !activeSession && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT COLUMN: Gamification & Tree */}
            <div className="lg:col-span-1 space-y-4">

              {/* Enhanced Profile Card */}
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.4 }} className="rounded-[2.5rem] border-[1.5px] border-[#d4af37]/40 bg-gradient-to-b from-[#141f36] via-[#10192b] to-[#0a101d] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('/images/mystic-bg.jpg')] opacity-[0.03] rounded-[2.5rem] pointer-events-none mix-blend-screen" />
                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_60%)] pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity duration-1000" />

                <div className="flex items-center relative z-10">
                  <div className="relative w-[5.5rem] h-[5.5rem] rounded-full border-[3px] border-[#d4af37] p-1 shadow-[0_0_25px_rgba(212,175,55,0.6)] bg-gradient-to-br from-[#1e2a44] to-[#0a1122] flex-shrink-0 overflow-hidden group-hover:shadow-[0_0_35px_rgba(212,175,55,0.8)] transition-shadow duration-500">
                    <div className="absolute inset-0 bg-[#d4af37]/20 animate-pulse opacity-50 z-0" />
                    <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=MythosHero&backgroundColor=1e2a44" alt="Hero Avatar" className="w-full h-full rounded-full object-cover relative z-10 scale-110" />
                  </div>

                  <div className="ml-5 flex flex-col justify-center flex-1 relative min-h-[5rem]">
                    <h2 className="text-2xl lg:text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff5d1] to-[#d4af37] uppercase tracking-widest leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:scale-105 origin-left transition-transform duration-300">{profile?.name || 'JAHZ'}</h2>
                    <span className="text-[#aeb6c4] text-[11px] italic font-semibold mt-1.5 tracking-wider">/ lakbay</span>
                  </div>
                </div>

              </motion.div>

              {/* Progress Tree Display */}
              <div className="relative rounded-[2rem] border border-[#d4af37]/40 bg-gradient-to-r from-[#172545] to-[#0a1122] overflow-hidden p-6 flex flex-row items-center justify-between shadow-[0_15px_30px_rgba(0,0,0,0.6)] min-h-[220px] group cursor-pointer hover:border-[#d4af37]/70 transition-all duration-500">
                <div className="absolute inset-0 bg-[#d4af37] opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full border-[2.5px] border-dashed border-[#d4af37]/20 animate-[spin_12s_linear_infinite] group-hover:animate-[spin_4s_linear_infinite] pointer-events-none z-0" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[190px] h-[190px] rounded-full border-[1.5px] border-dotted border-[#d4af37]/30 animate-[spin_8s_linear_infinite_reverse] group-hover:animate-[spin_2s_linear_infinite_reverse] pointer-events-none z-0" />

                <div className="w-[55%] relative z-10 pl-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_10px_#d4af37] animate-pulse"></div>
                    <h3 className="text-[12px] font-black text-[#f8e5b4] uppercase tracking-widest leading-tight drop-shadow-md">
                      Ang Iyong Puno ng Pag-unlad
                    </h3>
                  </div>
                  <p className="text-[#aeb6c4] text-[10.5px] italic leading-relaxed mt-3 pr-2">
                    Lalago at mamumulaklak ang iyong puno sa bawat session na matapos mo.
                  </p>
                </div>

                <div className="w-[45%] relative z-10 h-full flex items-center justify-center -mr-2 drop-shadow-[0_0_20px_rgba(255,215,0,0.4)] group-hover:drop-shadow-[0_0_30px_rgba(255,215,0,0.7)] group-hover:scale-[1.08] transition-all duration-700">
                  {renderProgressTree()}
                </div>
              </div>

              {/* Badges Panel */}
              <div className="rounded-[2.5rem] border border-[#d4af37]/30 bg-gradient-to-b from-[#162137] to-[#0a1122] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.7)] mb-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-[40px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] pointer-events-none" />

                <div className="flex items-center justify-center gap-3 mb-6 relative z-10">
                  <Trophy size={16} className="text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                  <h3 className="text-[11px] md:text-[13px] font-black text-[#f8e5b4] uppercase tracking-[0.2em] drop-shadow-md">
                    Mga Natanggap Na Badge
                  </h3>
                  <Trophy size={16} className="text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                </div>

                <div className="flex justify-between items-end relative z-10 w-full px-2">
                  {Object.values(INTERVENTION_SESSIONS).map((cfg) => {
                    const isUnlocked = sessions.find(s => s.session_number === cfg.number)?.is_completed;
                    return (
                      <div key={cfg.number} className="flex flex-col items-center gap-2 relative group cursor-pointer w-1/5" title={cfg.badgeDescription}>
                        <div className="relative flex justify-center items-center">
                          <div className={`w-[72px] h-[72px] md:w-[84px] md:h-[84px] rounded-full border-[3px] ${isUnlocked ? 'border-transparent bg-gradient-to-br from-[#1c2b4c] to-[#0a1122] shadow-[0_0_15px_rgba(88,224,160,0.5)]' : 'border-[#d4af37]/20 bg-[#0f172a] grayscale opacity-30'} flex items-center justify-center p-1.5 group-hover:scale-110 transition-transform duration-500 relative z-10`}>
                            <span className="text-[32px] md:text-[38px] drop-shadow-xl leading-none">{cfg.badgeIcon}</span>
                          </div>
                          {isUnlocked && (
                            <div className="absolute inset-[-4px] rounded-full border-[2px] border-dashed border-[#58e0a0]/80 animate-[spin_8s_linear_infinite] group-hover:animate-[spin_4s_linear_infinite] z-0" />
                          )}
                        </div>
                        <span className={`text-[9.5px] md:text-[11px] font-extrabold ${isUnlocked ? 'text-[#b9c6dc]' : 'text-[#b9c6dc]/60'} uppercase tracking-wide text-center leading-[1.1] w-full group-hover:text-white transition-colors h-6 flex items-center justify-center`}>{cfg.badgeName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* RIGHT COLUMN: Sessions & Navigation */}
            <div className="lg:col-span-2 space-y-6">

              {/* Tab Navigation Removed */}

              {/* Tab contents */}
              {dashboardTab === 'sessions' && (
                <div className="space-y-4">
                  {/* Section Title */}
                  <div className="pl-4 pb-2 border-b border-white/5 mb-6">
                    <h4 className="text-lg md:text-xl font-black text-mythos-gold drop-shadow-md tracking-widest uppercase">Mga Sessions</h4>
                  </div>

                  {Object.values(INTERVENTION_SESSIONS).map((cfg) => {
                    const dbSess = sessions.find(s => s.session_number === cfg.number);
                    const isLocked = dbSess ? dbSess.is_locked : true;
                    const isCompleted = dbSess ? dbSess.is_completed : false;

                    return (
                      <motion.div
                        whileHover={!isLocked ? { scale: 1.02, x: 8 } : {}}
                        transition={{ duration: 0.3 }}
                        key={cfg.number}
                        className={`p-5 md:p-6 rounded-[2.5rem] glass-panel flex flex-col md:flex-row justify-between items-center transition-all duration-300 shadow-lg cursor-pointer ${isLocked
                          ? 'opacity-60 border-white/5 bg-white/2'
                          : 'border-white/10 hover:border-mythos-sky/50 bg-white/5 hover:bg-white/10 hover:shadow-[0_0_40px_rgba(78,168,222,0.2)]'
                          }`}
                      >
                        <div className="flex gap-4 md:gap-6 items-center w-full md:w-auto mb-4 md:mb-0">
                          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-shrink-0 items-center justify-center font-black text-xl md:text-2xl shadow-inner ${isCompleted
                            ? 'bg-mythos-green/20 text-emerald-400 border border-emerald-500/40'
                            : isLocked
                              ? 'bg-white/5 text-white/30 border border-white/10'
                              : 'bg-mythos-sky/20 text-mythos-sky border border-mythos-sky/40 shadow-[0_0_15px_rgba(78,168,222,0.3)]'
                            }`}>
                            {cfg.number}
                          </div>
                          <div>
                            <h4 className="font-black text-base md:text-xl text-white flex flex-wrap items-center gap-2 drop-shadow-md">
                              {cfg.title}
                              {isCompleted && (
                                <span className="text-[10px] md:text-xs px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black shadow-sm">TAPOS NA</span>
                              )}
                              {isLocked && <Lock className="w-4 h-4 text-white/30" />}
                            </h4>
                            <p className="text-sm md:text-base text-white/70 mt-1">{cfg.narrativeName}</p>
                            <span className="text-[11px] md:text-xs text-mythos-gold font-bold">{cfg.theme}</span>
                          </div>
                        </div>

                        {!isLocked && (
                          <button
                            onClick={() => {
                              startSessionFlow(cfg);
                            }}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 md:py-4 bg-mythos-sky text-mythos-deep font-extrabold rounded-xl hover:bg-mythos-teal hover:scale-105 hover:shadow-[0_0_20px_rgba(78,168,222,0.6)] transition-all duration-300 text-sm md:text-base cursor-pointer"
                          >
                            Simulan
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {dashboardTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Mood check-in slider */}
                  <div className="glass-panel p-5 rounded-2xl">
                    <h4 className="text-sm font-bold text-mythos-gold mb-2">Mood Check-in</h4>
                    <p className="text-xs text-white/70 mb-4">Kumusta ang iyong pakiramdam sa sandaling ito?</p>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-extrabold text-mythos-sky mb-2">{sessionMood}</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={sessionMood}
                        onChange={(e) => setSessionMood(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-mythos-sky"
                      />
                      <button
                        onClick={async () => {
                          await dbClient.logMood(user.id, null, sessionMood);
                          await loadData();
                          confetti({ particleCount: 40, spread: 40 });
                        }}
                        className="mt-4 px-4 py-2 rounded-lg bg-mythos-sky text-mythos-deep font-bold text-xs hover:bg-mythos-teal transition-all duration-200"
                      >
                        I-save ang Mood
                      </button>
                    </div>
                  </div>

                  {/* Mood History list */}
                  <div className="glass-panel p-5 rounded-2xl">
                    <h4 className="text-sm font-bold text-mythos-gold mb-3">Mood Logs</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {moodLogs.length === 0 ? (
                        <p className="text-xs text-white/40 italic">Wala pang naitatalang mood logs.</p>
                      ) : (
                        moodLogs.slice().reverse().map((log) => (
                          <div key={log.id} className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                            <span className="text-white/60">{new Date(log.logged_at).toLocaleDateString()} {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="font-bold text-mythos-sky bg-mythos-sky/10 px-2 py-0.5 rounded border border-mythos-sky/30">Isksor: {log.rating}/10</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Score Summary pre-post */}
                  <div className="glass-panel p-5 rounded-2xl">
                    <h4 className="text-sm font-bold text-mythos-gold mb-3">Psychological Score Summary</h4>
                    {prePost.pre ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-xs font-bold text-mythos-sky uppercase tracking-wider">Pre-Test (Baseline)</span>
                          <div className="space-y-1.5 mt-2 text-xs">
                            <p>Tiwala sa Sarili: <span className="font-bold">{prePost.pre.self_esteem_score}/20</span></p>
                            <p>Pag-asa (Hope Scale): <span className="font-bold">{prePost.pre.hope_score}/16</span></p>
                            <p>Distortion Score: <span className="font-bold">{prePost.pre.automatic_thoughts_score}/20</span></p>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-xs font-bold text-mythos-gold uppercase tracking-wider">Post-Test (Evaluation)</span>
                          {prePost.post ? (
                            <div className="space-y-1.5 mt-2 text-xs">
                              <p>Tiwala sa Sarili: <span className="font-bold text-emerald-400">{prePost.post.self_esteem_score}/20</span></p>
                              <p>Pag-asa (Hope Scale): <span className="font-bold text-emerald-400">{prePost.post.hope_score}/16</span></p>
                              <p>Distortion Score: <span className="font-bold text-emerald-400">{prePost.post.automatic_thoughts_score}/20</span></p>
                            </div>
                          ) : (
                            <p className="text-xs text-white/40 italic mt-4">Wala pang nakumpletong post-test.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-white/40 italic">Mangyaring sagutin ang Pre-Test upang makita ang statistics.</p>
                    )}
                  </div>
                </div>
              )}

              {dashboardTab === 'journal' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-mythos-gold">Aking Mga Dyurnal</h4>
                  {reflections.length === 0 ? (
                    <p className="text-xs text-white/40 italic">Wala ka pang naisusulat na dyurnal.</p>
                  ) : (
                    reflections.slice().reverse().map((ref) => (
                      <div key={ref.id} className="p-4 rounded-xl glass-panel border border-white/10 space-y-3">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs font-bold text-mythos-sky">Session {ref.session_number} Journal Entry</span>
                          <span className="text-[10px] text-white/40">{new Date(ref.created_at).toLocaleDateString()}</span>
                        </div>

                        <p className="text-sm text-mythos-sand/90 font-medium italic">&quot;{ref.journal_text}&quot;</p>


                        {ref.facilitator_feedback && (
                          <div className="bg-yellow-950/15 p-3 rounded-lg border border-mythos-gold/20 text-xs">
                            <span className="font-bold text-mythos-gold flex items-center gap-1">💬 Counselor Feedback:</span>
                            <p className="mt-1 text-white/85 italic leading-relaxed">{ref.facilitator_feedback}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Active Session Flow */}
        {activeSession && (
          <div className="max-w-6xl w-full mx-auto px-4 lg:px-8">
            {/* Step Indicators */}
            <div className="flex justify-between items-center mb-6 max-w-3xl mx-auto text-[10px] md:text-xs font-bold">
              {(activeSession.number === 1
                ? ['Digital Check-in', 'Entering the Mythos world', 'Digital story telling', 'My story is not my Identity', 'Finding my strengths']
                : activeSession.number === 3
                  ? ['What Would the Hero Do?', 'Biag ni Lam-ang', 'CBT Choice', 'Choose Your Path', 'Wakas']
                  : ['Simula', 'Kuwento', 'Hamon', 'Pagsusuri', 'Journal', 'Wakas']
              ).map((label, idx) => {
                let isActive = false;
                let isPast = false;

                if (activeSession.number === 1) {
                  let currentIdx = -1;
                  if (sessionStep === 1) currentIdx = 0;
                  else if (sessionStep === 2) currentIdx = 1;
                  else if (sessionStep === 3) currentIdx = 2;
                  else if (sessionStep === 4) currentIdx = actPage === 0 ? 3 : 4;
                  else if (sessionStep >= 5) currentIdx = 5; // Beyond the 5 steps

                  isActive = currentIdx === idx;
                  isPast = currentIdx > idx;
                } else if (activeSession.number === 3) {
                  let currentIdx = -1;
                  if (sessionStep === 0) currentIdx = 0;
                  else if (sessionStep === 1) {
                    if (vidPage <= 1) currentIdx = 1;
                    else currentIdx = 2;
                  }
                  else if (sessionStep === 2) currentIdx = 3;
                  else if (sessionStep >= 6) currentIdx = 4;

                  isActive = currentIdx === idx;
                  isPast = currentIdx > idx;
                } else if (activeSession.number === 2) {
                  let currentIdx = 0;
                  if (sessionStep === 1) currentIdx = 1;
                  else if (sessionStep === 2) currentIdx = 2;
                  else if (sessionStep === 3 || sessionStep === 4) currentIdx = 3;
                  else if (sessionStep === 5) currentIdx = 4;
                  else if (sessionStep >= 6) currentIdx = 5;

                  isActive = currentIdx === idx;
                  isPast = currentIdx > idx;
                } else {
                  let visualStep = sessionStep;
                  if (sessionStep === 6) visualStep = 5;
                  if (sessionStep === 5) visualStep = 4;
                  isActive = visualStep === idx;
                  isPast = visualStep > idx;
                }

                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="group flex flex-col items-center gap-2.5 flex-1 max-w-[110px] text-center cursor-default hover:cursor-pointer relative z-10"
                  >
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 font-extrabold text-xs md:text-sm ${isActive
                      ? 'bg-gradient-to-br from-mythos-gold to-yellow-400 text-mythos-deep border-yellow-200 scale-125 shadow-[0_0_20px_rgba(255,215,0,0.6)] z-20'
                      : isPast
                        ? 'bg-gradient-to-br from-emerald-500 to-mythos-green text-white border-emerald-300 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover:border-white'
                        : 'bg-white/10 text-white/40 border-white/20 group-hover:bg-white/20'
                      }`}>
                      {idx + 1}
                    </div>
                    <span className={`text-[10px] md:text-sm font-black tracking-wide leading-tight px-1 transition-all duration-300 ${isActive
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] scale-110'
                      : isPast
                        ? 'text-white/95 drop-shadow-md group-hover:text-emerald-300'
                        : 'text-white/40 group-hover:text-white/70'
                      }`}>
                      {label}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* STEP 0: OBJECTIVES / INTRO */}
            {sessionStep === 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 md:p-14 rounded-[3rem] text-center space-y-8 md:space-y-12 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {introPage === 0 ? (
                  <>
                    <motion.span whileHover={{ scale: 1.05 }} className="inline-block text-xs md:text-sm font-black text-mythos-gold uppercase tracking-[0.2em] px-5 py-2.5 bg-mythos-gold/10 rounded-full border border-mythos-gold/30 shadow-sm cursor-default">
                      Session {activeSession.number} &mdash; {activeSession.title.toUpperCase()}
                    </motion.span>

                    <motion.h2 whileHover={{ scale: 1.02 }} className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-mythos-sand to-white drop-shadow-xl tracking-tight leading-tight cursor-default">
                      Philippine Narrative:<br className="md:hidden" /> {activeSession.narrativeName.split(' (')[0].toUpperCase()}
                    </motion.h2>

                    {activeSession.centralQuote ? (
                      <motion.p whileHover={{ scale: 1.02 }} className="font-medium text-lg md:text-2xl text-mythos-sky italic drop-shadow-md max-w-4xl mx-auto leading-relaxed border-l-4 border-mythos-sky/50 pl-6 text-left md:text-center md:border-l-0 md:pl-0 cursor-default">
                        Central Theme : {activeSession.centralQuote}
                      </motion.p>
                    ) : (
                      <motion.p whileHover={{ scale: 1.05 }} className="font-semibold text-lg md:text-2xl text-mythos-sky drop-shadow-md cursor-default">
                        {activeSession.theme}
                      </motion.p>
                    )}

                    <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-10">
                      <button
                        onClick={() => setActiveSession(null)}
                        className="w-full md:w-auto px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/10 hover:scale-105 transition-all text-sm md:text-base font-bold shadow-lg text-white/80 hover:text-white"
                      >
                        Bumalik sa Dashboard
                      </button>
                      <button
                        onClick={() => setIntroPage(1)}
                        className="w-full md:w-auto px-10 py-5 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-extrabold rounded-2xl shadow-[0_0_30px_rgba(78,168,222,0.4)] hover:shadow-[0_0_50px_rgba(78,168,222,0.7)] text-base md:text-lg hover:scale-105 transition-all duration-300"
                      >
                        Tingnan ang Layunin
                      </button>
                    </div>
                  </>
                ) : introPage === 1 ? (
                  <>
                    <motion.h2 whileHover={{ scale: 1.02 }} className="text-4xl md:text-5xl font-black text-white mb-2 tracking-wide drop-shadow-md cursor-default uppercase">
                      Mga Layunin <span className="text-mythos-gold opacity-80">(Objectives)</span>
                    </motion.h2>
                    <p className="text-base md:text-lg text-mythos-sky/90 mb-10 font-bold italic tracking-wide">
                      Ito ang mga isasagawa natin sa session na ito:
                    </p>

                    <div className="max-w-4xl mx-auto space-y-5">
                      {activeSession.objectives.map((obj, index) => {
                        let english = obj;
                        let filipino = '';

                        // Parse bilingual text format: "English. (Filipino.)"
                        const match = obj.match(/(.*?)\s*\((.*)\)/);
                        if (match) {
                          english = match[1].trim();
                          filipino = match[2].trim();
                        }

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02, x: 10 }}
                            transition={{ type: "spring", stiffness: 300, delay: index * 0.1 }}
                            className="group p-5 md:p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-mythos-gold/50 transition-all duration-300 text-left flex gap-5 cursor-default shadow-xl items-center"
                          >
                            <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-mythos-sky/10 to-mythos-sky/5 border border-mythos-sky/40 text-mythos-sky flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(72,202,228,0.2)] group-hover:scale-110 group-hover:bg-mythos-sky group-hover:text-mythos-deep transition-all duration-300">
                              {index + 1}
                            </div>
                            <div className="flex-grow">
                              <p className="text-lg md:text-2xl font-black text-white/95 leading-snug tracking-wide group-hover:text-mythos-gold transition-colors duration-300">
                                {english}
                              </p>
                              {filipino && (
                                <p className="text-sm md:text-lg text-mythos-sky/90 italic mt-1.5 font-bold">
                                  {filipino}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col-reverse md:flex-row justify-between items-center max-w-4xl mx-auto pt-10 gap-4">
                      <button
                        onClick={() => setIntroPage(0)}
                        className="w-full md:w-auto px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/10 hover:scale-105 transition-all text-sm md:text-base font-bold shadow-lg"
                      >
                        Bumalik
                      </button>
                      <button
                        onClick={() => {
                          if (activeSession.number === 5) {
                            setIntroPage(3);
                          } else if (activeSession.number === 3 || activeSession.number === 4) {
                            setIntroPage(2);
                          } else {
                            setSessionStep(1);
                          }
                        }}
                        className="w-full md:w-auto px-10 py-5 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-extrabold rounded-2xl shadow-[0_0_30px_rgba(78,168,222,0.4)] hover:shadow-[0_0_50px_rgba(78,168,222,0.7)] text-base md:text-lg hover:scale-105 transition-all duration-300"
                      >
                        {activeSession.number === 3 || activeSession.number === 4 || activeSession.number === 5 ? "Ituloy (Next)" : "Simulan ang Kuwento"}
                      </button>
                    </div>
                  </>
                ) : introPage === 2 && activeSession.number === 3 ? (
                  <>
                    <motion.h2 whileHover={{ scale: 1.02 }} className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-sky via-blue-300 to-indigo-500 mb-2 tracking-wide drop-shadow-[0_0_15px_rgba(72,202,228,0.5)] cursor-default uppercase">
                      Activity 1: What Would the Hero Do?
                    </motion.h2>
                    <p className="text-base md:text-lg text-white/80 mb-10 font-bold italic tracking-wide">
                      (Ano ang gagawin ng isang bayani?)
                    </p>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="relative mb-12"
                    >
                      <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/50 via-indigo-500/50 to-blue-600/50 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
                      <div className="relative bg-gradient-to-b from-slate-900/90 to-black/95 border border-blue-400/50 rounded-2xl p-8 md:p-14 text-center shadow-[0_0_50px_rgba(72,202,228,0.25)] backdrop-blur-xl overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
                        <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-serif tracking-wide leading-relaxed relative z-10">
                          "SOMEONE SPREADS A RUMOR ABOUT YOU."
                        </h2>
                        <p className="text-base md:text-xl text-blue-200/80 mt-4 font-bold italic font-serif tracking-wide drop-shadow-md relative z-10">
                          (May nagkalat ng tsismis o maling balita tungkol sa iyo.)
                        </p>
                      </div>
                    </motion.div>

                    <div className="space-y-4 max-w-4xl mx-auto">
                      {([
                        {
                          id: 'A',
                          text: '"You embarrassed me! Let\'s fight."',
                          textFil: '"Pinahiya mo ako! Magsuntukan tayo."',
                          tag: 'Path A: Confront aggressively',
                          tagFil: 'Harapin nang patapang',
                          colorTheme: { border: 'border-red-500', bg: 'bg-red-950/80', ring: 'shadow-[0_0_30px_rgba(239,68,68,0.4)]', text: 'text-red-100', iconBg: 'bg-red-500' }
                        },
                        {
                          id: 'B',
                          text: 'Post something insulting online.',
                          textFil: 'Mag-post ng nakaka-insulto online.',
                          tag: 'Path B: Online retaliation',
                          tagFil: 'Gumanti sa internet',
                          colorTheme: { border: 'border-orange-500', bg: 'bg-orange-950/80', ring: 'shadow-[0_0_30px_rgba(249,115,22,0.4)]', text: 'text-orange-100', iconBg: 'bg-orange-500' }
                        },
                        {
                          id: 'C',
                          text: 'Ask for clarification and seek help if necessary.',
                          textFil: 'Kausapin nang maayos at humingi ng tulong kung kinakailangan.',
                          tag: 'Path C: Hero\'s Response',
                          tagFil: 'Tugon ng Bayani',
                          colorTheme: { border: 'border-emerald-500', bg: 'bg-emerald-950/80', ring: 'shadow-[0_0_30px_rgba(16,185,129,0.4)]', text: 'text-emerald-100', iconBg: 'bg-emerald-500' }
                        },
                        {
                          id: 'D',
                          text: 'Ignore it completely.',
                          textFil: 'Balewalain ito nang tuluyan.',
                          tag: 'Path D: Passive avoidance',
                          tagFil: 'Pag-iwas o Pagkikimkim',
                          colorTheme: { border: 'border-indigo-400', bg: 'bg-indigo-950/80', ring: 'shadow-[0_0_30px_rgba(129,140,248,0.4)]', text: 'text-indigo-100', iconBg: 'bg-indigo-500' }
                        }
                      ] as const).map((choice) => (
                        <motion.button
                          key={choice.id}
                          layout
                          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                          whileHover={activity1Choice !== choice.id ? { scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActivity1Choice(choice.id)}
                          className={`w-full p-5 md:p-6 text-left rounded-2xl border-2 transition-all duration-500 relative overflow-hidden group ${activity1Choice === choice.id
                            ? `${choice.colorTheme.bg} ${choice.colorTheme.border} ${choice.colorTheme.ring} scale-[1.02] z-10`
                            : activity1Choice ? 'opacity-40 hover:opacity-80 bg-black/60 border-white/5' : 'bg-black/40 hover:bg-black/20 border-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                            }`}
                        >
                          {activity1Choice === choice.id && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]"></div>
                          )}
                          <div className="flex items-center gap-4 relative z-10">
                            <span className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-black rounded-full transition-colors duration-500 ${activity1Choice === choice.id ? `${choice.colorTheme.iconBg} text-white shadow-lg` : 'bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white/80'}`}>{choice.id}</span>
                            <div>
                              <p className={`text-[10px] md:text-xs uppercase font-black tracking-widest mb-1 transition-colors ${activity1Choice === choice.id ? 'text-white/80' : 'text-blue-300'}`}>
                                {choice.tag} <span className={activity1Choice === choice.id ? 'opacity-60' : 'text-blue-300/60 opacity-80'}>({choice.tagFil})</span>
                              </p>
                              <p className={`font-black text-lg md:text-2xl transition-colors drop-shadow-sm ${activity1Choice === choice.id ? choice.colorTheme.text : 'text-white group-hover:text-white/95'}`}>
                                {choice.text}
                              </p>
                              <p className={`text-sm md:text-lg italic mt-1 font-medium font-serif tracking-wide transition-colors ${activity1Choice === choice.id ? 'text-white/80' : 'text-white/50'}`}>
                                ({choice.textFil})
                              </p>
                            </div>
                          </div>
                          <AnimatePresence>
                            {activity1Choice === choice.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-5 pt-5 border-t border-white/20 relative z-10"
                              >
                                <div className="text-sm md:text-base text-white/90 space-y-3 font-medium bg-black/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                  {choice.id === 'A' && (
                                    <>
                                      <p><strong className="text-red-400 text-base md:text-lg uppercase tracking-wide mr-2">Consequence:</strong> Fighting leads to disciplinary action, escalating the situation, and burning bridges. It gives away your power to anger.</p>
                                      <p className="italic opacity-80 font-serif leading-relaxed">(Ang pakikipag-away ay magdudulot ng problema sa disiplina at sumisira ng relasyon. Hinahayaan mo ang galit na kontrolin ka.)</p>
                                    </>
                                  )}
                                  {choice.id === 'B' && (
                                    <>
                                      <p><strong className="text-orange-400 text-base md:text-lg uppercase tracking-wide mr-2">Consequence:</strong> Online insults create a permanent digital record that can harm you later, and it fuels more drama without solving the problem.</p>
                                      <p className="italic opacity-80 font-serif leading-relaxed">(Ang pag-insulto online ay nag-iiwan ng permanenteng marka na makakasira sa iyo, at lalo lang itong nagpapalala ng gulo.)</p>
                                    </>
                                  )}
                                  {choice.id === 'C' && (
                                    <>
                                      <p><strong className="text-emerald-400 text-base md:text-lg uppercase tracking-wide mr-2">Consequence:</strong> This path requires courage! Seeking clarification stops rumors at the source, and asking for help provides you with a safe support system. This is a true Hero's Response.</p>
                                      <p className="italic opacity-80 font-serif leading-relaxed">(Nangangailangan ito ng lakas ng loob! Ang maayos na pakikipag-usap ay pumipigil sa tsismis, at nagbibigay ng ligtas na suporta. Ito ang tunay na Tugon ng Bayani.)</p>
                                    </>
                                  )}
                                  {choice.id === 'D' && (
                                    <>
                                      <p><strong className="text-indigo-300 text-base md:text-lg uppercase tracking-wide mr-2">Consequence:</strong> While ignoring might sometimes work, suppressing feelings entirely can build up inner resentment over time. Sometimes action is necessary to protect your boundaries.</p>
                                      <p className="italic opacity-80 font-serif leading-relaxed">(Bagama't minsa'y nakakatulong ang pag-iwas, ang sobrang pagkikimkim ay nagdudulot ng sama ng loob. Minsan, kailangang kumilos para protektahan ang sarili.)</p>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      ))}
                    </div>

                    <div className="flex flex-col-reverse md:flex-row justify-between items-center max-w-4xl mx-auto pt-10 gap-4 mt-8">
                      <button
                        onClick={() => setIntroPage(1)}
                        className="w-full md:w-auto px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/10 hover:scale-105 transition-all text-sm md:text-base font-bold shadow-lg"
                      >
                        Bumalik
                      </button>
                      <button
                        disabled={!activity1Choice}
                        onClick={() => setSessionStep(1)}
                        className="w-full md:w-auto px-10 py-5 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-extrabold rounded-2xl shadow-[0_0_30px_rgba(78,168,222,0.4)] hover:shadow-[0_0_50px_rgba(78,168,222,0.7)] text-base md:text-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                      >
                        Simulan ang Kuwento
                      </button>
                    </div>
                  </>
                ) : introPage === 2 && activeSession.number === 4 ? (
                  <>
                    <motion.h2 whileHover={{ scale: 1.02 }} className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-400 to-blue-500 mb-2 tracking-wide drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] cursor-default uppercase">
                      Activity 1: What's Happening Inside?
                    </motion.h2>
                    <p className="text-base md:text-lg text-white/80 mb-10 font-bold italic tracking-wide">
                      (Anong nangyayari sa loob?)
                    </p>

                    <div className="glass-panel p-6 md:p-12 rounded-[2rem] border border-indigo-500/30 max-w-4xl mx-auto shadow-[0_0_40px_rgba(99,102,241,0.15)] relative overflow-hidden backdrop-blur-md">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                      <h3 className="text-xl md:text-3xl font-black text-white mb-2 relative z-10">
                        What emotion do you experience most strongly when you are in conflict?
                      </h3>
                      <p className="text-sm md:text-lg text-indigo-300 italic font-medium mb-10 relative z-10">
                        (Anong emosyon ang pinakamalakas mong nararamdaman kapag may pinagdadaanang alitan?)
                      </p>

                      <div className="relative w-full max-w-[600px] md:max-w-[700px] aspect-square mx-auto mt-10 mb-16 md:my-16 z-10 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        <svg viewBox="0 0 500 500" className="w-full h-full overflow-visible">
                          {[
                            { id: 'anger', label: 'ANGER', fil: 'Galit', color: '#de6764', icon: '😡' },
                            { id: 'fear', label: 'FEAR', fil: 'Takot', color: '#9d8cb4', icon: '😨' },
                            { id: 'embarrassment', label: 'EMBARRASSMENT', fil: 'Hiya', color: '#f09a7b', icon: '😳' },
                            { id: 'sadness', label: 'SADNESS', fil: 'Lungkot', color: '#6f9aca', icon: '😢' },
                            { id: 'jealousy', label: 'JEALOUSY', fil: 'Selos', color: '#92b575', icon: '😒' },
                            { id: 'rejection', label: 'REJECTION', fil: 'Pagtakwil', color: '#fcd96a', icon: '😔' },
                            { id: 'frustration', label: 'FRUSTRATION', fil: 'Pagkabigo', color: '#65b6a7', icon: '😖' },
                            { id: 'shame', label: 'SHAME', fil: 'Kahihiyan', color: '#e2c4a9', icon: '😞' }
                          ].map((emo, idx) => {
                            const startAngle = idx * 45 - 22.5;
                            const endAngle = idx * 45 + 22.5;
                            const midAngle = idx * 45;
                            const isSelected = s4EmotionChoice === emo.id;

                            const midRadius = 165;
                            const midX = 250 + midRadius * Math.cos((midAngle - 90) * Math.PI / 180);
                            const midY = 250 + midRadius * Math.sin((midAngle - 90) * Math.PI / 180);

                            return (
                              <g
                                key={emo.id}
                                onClick={() => setS4EmotionChoice(emo.id)}
                                className="cursor-pointer transition-all duration-300 hover:opacity-90 outline-none group"
                                style={{
                                  transformOrigin: '250px 250px',
                                  transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                                  filter: isSelected ? 'drop-shadow(0px 0px 12px rgba(255,255,255,0.4))' : 'none'
                                }}
                              >
                                <path
                                  d={describeArc(250, 250, 85, 240, startAngle, endAngle)}
                                  fill={emo.color}
                                  stroke="#fcf8f2"
                                  strokeWidth={isSelected ? 4 : 2}
                                  className="transition-all duration-300"
                                />
                                <foreignObject x={midX - 70} y={midY - 50} width="140" height="100" className="pointer-events-none">
                                  <div className="flex flex-col items-center justify-center w-full h-full text-center p-1">
                                    <span className="text-3xl md:text-5xl mb-1 filter drop-shadow-sm transform transition-transform duration-300 group-hover:scale-110">{emo.icon}</span>
                                    <span style={{ color: '#1f2937' }} className="text-[11px] md:text-[14px] font-black uppercase tracking-tight leading-none mt-1">{emo.label}</span>
                                    <span style={{ color: 'rgba(31,41,55,0.8)' }} className="text-[9px] md:text-[11px] italic font-bold leading-tight mt-0.5">({emo.fil})</span>
                                  </div>
                                </foreignObject>
                              </g>
                            );
                          })}

                          {/* Center Circle */}
                          <g className="pointer-events-none drop-shadow-md">
                            <circle cx="250" cy="250" r="85" fill="#fcf8f2" stroke="#e5e7eb" strokeWidth="2" />
                            <text x="250" y="246" textAnchor="middle" fill="#1f2937" fontSize="22" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">EMOTIONS</text>
                            <text x="250" y="272" textAnchor="middle" fill="#1f2937" fontSize="24">♥</text>
                          </g>
                        </svg>
                      </div>

                      <AnimatePresence>
                        {s4EmotionChoice && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: 20 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            className="mt-12 pt-8 border-t border-indigo-500/30 text-left relative z-10"
                          >
                            <h4 className="text-lg md:text-2xl font-black text-indigo-300 mb-2">
                              What emotion do you think is behind your anger?
                            </h4>
                            <p className="text-sm md:text-base text-indigo-300/70 italic mb-6">
                              (Anong emosyon sa tingin mo ang nasa likod ng iyong galit?)
                            </p>
                            <textarea
                              value={s4EmotionBehind}
                              onChange={(e) => setS4EmotionBehind(e.target.value)}
                              placeholder="I think I'm actually feeling... (Sa tingin ko nararamdaman ko talaga ay...)"
                              className="w-full bg-black/40 border border-indigo-500/40 rounded-xl p-6 text-white placeholder-white/30 focus:outline-none focus:border-mythos-sky focus:ring-1 focus:ring-mythos-sky transition-all resize-none h-32 md:h-40 text-base md:text-lg shadow-inner"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex flex-col-reverse md:flex-row justify-between items-center max-w-4xl mx-auto pt-10 gap-4 mt-8">
                      <button
                        onClick={() => setIntroPage(1)}
                        className="w-full md:w-auto px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/10 hover:scale-105 transition-all text-sm md:text-base font-bold shadow-lg"
                      >
                        Bumalik
                      </button>
                      <button
                        disabled={!s4EmotionChoice || !s4EmotionBehind.trim()}
                        onClick={async () => {
                          await dbClient.saveResponse(user.id, activeSession!.number, 'whats_happening_inside', {
                            emotionChoice: s4EmotionChoice,
                            emotionBehind: s4EmotionBehind
                          });
                          setSessionStep(1);
                        }}
                        className="w-full md:w-auto px-10 py-5 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-extrabold rounded-2xl shadow-[0_0_30px_rgba(78,168,222,0.4)] hover:shadow-[0_0_50px_rgba(78,168,222,0.7)] text-base md:text-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                      >
                        Simulan ang Kuwento
                      </button>
                    </div>
                  </>
                ) : introPage === 3 && activeSession.number === 5 ? (
                  <div className="animate-fade-in relative max-w-5xl mx-auto mt-4 px-4 pb-20">
                    {/* The Sarimanok Video & Quote for introPage 3 */}
                    {vidPage === 0 ? (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 md:p-10 rounded-3xl space-y-6 w-full max-w-5xl mx-auto shadow-2xl relative overflow-hidden backdrop-blur-xl bg-slate-900/70 border border-white/20">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-md text-center">
                          Activity 1: Sarimanok — Hope and Renewal
                        </h2>
                        <p className="text-base md:text-xl text-white/80 italic mb-8 text-center mx-auto max-w-2xl">
                          (Makinig at manood. Hayaan ang iyong bagong kwento na lumipad tulad ng Sarimanok.)
                        </p>
                        <div className="flex justify-center w-full my-8 relative z-10">
                          <video
                            src="/videos/sarimanok.mp4"
                            className="w-full aspect-video rounded-3xl border border-mythos-sky/30 shadow-[0_0_50px_rgba(72,202,228,0.2)] bg-black object-contain focus:outline-none"
                            controls
                            onEnded={() => setVidPage(1)}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-16 pt-8 border-t border-slate-700/50 relative z-10 w-full">
                          <button
                            onClick={() => setIntroPage(1)}
                            className="px-6 py-3 rounded-xl border-2 border-slate-600 text-slate-300 hover:bg-slate-800 transition-all font-bold"
                          >
                            Bumalik
                          </button>
                          <button
                            onClick={() => setVidPage(1)}
                            className="flex items-center gap-2 px-8 py-3 bg-sky-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl hover:scale-105 hover:bg-sky-500 transition-all cursor-pointer"
                          >
                            Ipagpatuloy
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-8 md:p-14 rounded-[3rem] w-full max-w-4xl mx-auto shadow-2xl relative overflow-hidden backdrop-blur-xl text-center bg-slate-900/70 border-t border-mythos-gold/30">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-mythos-gold/10 blur-[100px] rounded-full pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-600/10 blur-[100px] rounded-full pointer-events-none"></div>

                        <Quote className="text-mythos-gold/40 w-16 h-16 mx-auto mb-6 drop-shadow-md" />

                        <h3 className="text-2xl md:text-3xl font-black text-white italic drop-shadow-md leading-relaxed mb-6 relative z-10 max-w-3xl mx-auto">
                          "Ipinapaalala sa atin ng Sarimanok na may mahalagang bagay na maaaring umusbong mula sa isang mahirap na paglalakbay. Ang ating mga nakaraang karanasan ay maaaring mag-iwan ng marka, ngunit hindi nito kailangang tukuyin ang direksyon ng ating kinabukasan."
                        </h3>

                        <p className="text-mythos-gold text-lg md:text-xl font-bold tracking-wide mb-12 drop-shadow-sm relative z-10 max-w-2xl mx-auto">
                          (The Sarimanok reminds us that something valuable can emerge from a difficult journey. Our past experiences may leave marks, but they do not have to determine the direction of our future.)
                        </p>

                        <div className="flex justify-between mt-12 pt-8 border-t border-slate-700/50 relative z-10 w-full">
                          <button
                            onClick={() => setVidPage(0)}
                            className="px-6 py-3 rounded-xl border-2 border-slate-600 text-slate-300 hover:bg-slate-800 transition-all font-bold"
                          >
                            Bumalik
                          </button>
                          <button
                            onClick={() => {
                              setVidPage(0);
                              setIntroPage(4);
                            }}
                            className="flex items-center gap-2 px-8 py-3 bg-sky-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl hover:scale-105 hover:bg-sky-500 transition-all cursor-pointer"
                          >
                            Susunod: Activity 2
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : introPage === 4 && activeSession.number === 5 ? (
                  <div className="animate-fade-in relative max-w-6xl mx-auto mt-4 px-4 pb-20">
                    <div className="flex flex-col rounded-[3rem] p-8 md:p-12 border border-white/20 shadow-2xl relative overflow-hidden group w-full bg-slate-900/70 backdrop-blur-3xl">
                      <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight drop-shadow-md text-center">
                        Activity 2: My Old Thought vs. My New Thought
                      </h2>
                      <p className="text-base md:text-xl text-white/80 italic mb-8 text-center mx-auto max-w-2xl">
                        (Suriin natin kung paano nagbago ang iyong pananaw at reaksyon.)
                      </p>

                      {/* Example Block */}
                      <div className="bg-sky-900/40 border border-sky-500/30 rounded-2xl p-6 mb-10 max-w-4xl mx-auto backdrop-blur-md shadow-inner text-sm md:text-base">
                        <div className="flex items-center gap-2 mb-3 text-sky-300 font-bold uppercase tracking-wider text-xs">
                          <Star size={16} className="text-mythos-gold" />
                          Halimbawa (Example)
                        </div>
                        <div className="space-y-2 text-white/90">
                          <p><span className="font-bold text-sky-200">Old thought:</span> "I always have to fight to protect myself."</p>
                          <p><span className="font-bold text-mythos-gold">New thought:</span> "I can protect myself without becoming aggressive."</p>
                          <p><span className="font-bold text-mythos-gold">New behavior:</span> "I can pause, communicate, leave the situation, or ask for help."</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative items-stretch">
                        {/* Arrow connecting the two columns on wide screens */}
                        <div className="hidden xl:flex absolute inset-0 items-center justify-center pointer-events-none z-10 w-full h-full">
                          <div className="w-16 h-16 rounded-full bg-mythos-sky shadow-[0_0_30px_rgba(72,202,228,0.6)] flex items-center justify-center animate-pulse relative z-30">
                            <ChevronRight className="text-mythos-deep w-10 h-10" />
                          </div>
                        </div>

                        {/* Left Side: Before */}
                        <div className="bg-slate-800 p-8 rounded-3xl border-2 border-slate-600 hover:border-slate-400 transition-all shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group flex flex-col h-full">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CloudLightning size={120} className="text-slate-200" />
                          </div>
                          <h3 className="text-2xl font-bold text-slate-300 mb-8 flex items-center gap-3 relative z-10">
                            <div className="w-4 h-4 rounded-full bg-slate-400 animate-ping" />
                            Before MyTHOS
                          </h3>

                          <div className="space-y-8 relative z-10 flex-grow">
                            <div>
                              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Before MyTHOS:</label>
                              <div className="flex gap-2 items-center w-full">
                                <span className="text-white/60 font-serif italic text-lg md:text-xl whitespace-nowrap">"I am </span>
                                <input
                                  className="flex-auto bg-slate-900/80 border-b-2 border-slate-600 focus:border-mythos-sky text-white px-3 py-2 outline-none font-serif text-lg md:text-xl italic transition-colors placeholder-white/10 min-w-0"
                                  placeholder="always having to fight..."
                                  value={s5BeliefBefore}
                                  onChange={e => setS5BeliefBefore(e.target.value)}
                                />
                                <span className="text-white/60 font-serif italic text-lg md:text-xl">."</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 mt-4">Because of that belief, I usually:</label>
                              <div className="flex gap-2 items-start w-full">
                                <span className="text-white/60 font-serif italic text-lg md:text-xl mt-3">"</span>
                                <textarea
                                  className="flex-auto bg-slate-900/80 border border-slate-600 rounded-xl focus:border-mythos-sky text-white p-4 outline-none font-serif text-lg md:text-xl italic transition-colors placeholder-white/10 resize-none h-28 leading-relaxed min-w-0"
                                  placeholder="get angry easily and protect myself..."
                                  value={s5BehaviorBefore}
                                  onChange={e => setS5BehaviorBefore(e.target.value)}
                                />
                                <span className="text-white/60 font-serif italic text-lg md:text-xl mt-[5.5rem]">."</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: After */}
                        <div className="bg-gradient-to-br from-[#0c2a55] to-[#1a1b41] p-8 rounded-3xl border-2 border-mythos-sky/40 hover:border-mythos-sky/80 shadow-[inset_0_4px_40px_rgba(72,202,228,0.2)] transition-all relative overflow-hidden group flex flex-col h-full">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                            <Sun size={140} className="text-mythos-gold animate-spin-slow" />
                          </div>
                          <h3 className="text-2xl font-bold text-mythos-gold mb-8 flex items-center gap-3 relative z-10">
                            <div className="w-4 h-4 rounded-full bg-mythos-gold animate-pulse shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
                            Now
                          </h3>

                          <div className="space-y-8 relative z-10 flex-grow">
                            <div>
                              <label className="block text-mythos-sky text-xs font-bold uppercase tracking-wider mb-3">Now I can tell myself:</label>
                              <div className="flex gap-2 items-center w-full">
                                <span className="text-white font-serif italic text-lg md:text-xl">"</span>
                                <input
                                  className="flex-auto bg-slate-900/50 border-b-2 border-mythos-sky/30 focus:border-mythos-gold text-white px-3 py-2 outline-none font-serif text-lg md:text-xl italic transition-colors placeholder-white/20 min-w-0"
                                  placeholder="I can protect myself peacefully..."
                                  value={s5BeliefAfter}
                                  onChange={e => setS5BeliefAfter(e.target.value)}
                                />
                                <span className="text-white font-serif italic text-lg md:text-xl">."</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-mythos-sky text-xs font-bold uppercase tracking-wider mb-3 mt-4">Because of this new belief, I can:</label>
                              <div className="flex gap-2 items-start w-full">
                                <span className="text-white font-serif italic text-lg md:text-xl mt-3">"</span>
                                <textarea
                                  className="flex-auto bg-slate-900/50 border border-mythos-sky/30 rounded-xl focus:border-mythos-gold text-white p-4 outline-none font-serif text-lg md:text-xl italic transition-colors placeholder-white/20 resize-none h-28 leading-relaxed min-w-0"
                                  placeholder="communicate, pause, and ask for help."
                                  value={s5BehaviorAfter}
                                  onChange={e => setS5BehaviorAfter(e.target.value)}
                                />
                                <span className="text-white font-serif italic text-lg md:text-xl mt-[5.5rem]">."</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col-reverse md:flex-row justify-between items-center w-full pt-10 gap-4 mt-12 border-t border-white/10 z-20">
                        <button
                          onClick={() => setIntroPage(3)} // Goes back to Video/Quote
                          className="w-full md:w-auto px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/10 hover:scale-105 transition-all text-sm md:text-base font-bold shadow-lg text-white"
                        >
                          Bumalik
                        </button>
                        <button
                          disabled={!s5BeliefBefore.trim() || !s5BehaviorBefore.trim() || !s5BeliefAfter.trim() || !s5BehaviorAfter.trim()}
                          onClick={async () => {
                            const combinedResponse = {
                              oldBelief: s5BeliefBefore,
                              oldBehavior: s5BehaviorBefore,
                              newBelief: s5BeliefAfter,
                              newBehavior: s5BehaviorAfter
                            };
                            await dbClient.saveResponse(user.id, activeSession.number, 'old_and_new_thought', combinedResponse);
                            setIntroPage(5);
                          }}
                          className="w-full md:w-auto px-10 py-5 bg-gradient-to-r from-mythos-gold to-yellow-500 text-slate-900 font-extrabold rounded-2xl shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:shadow-[0_0_50px_rgba(255,215,0,0.7)] text-base md:text-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                        >
                          Susunod: Activity 3
                        </button>
                      </div>
                    </div>
                  </div>
                ) : introPage === 5 && activeSession.number === 5 ? (
                  <div className="animate-fade-in relative max-w-6xl mx-auto mt-6 px-4 pb-20">
                    {/* Notebook Background */}
                    <div className="absolute inset-0 bg-[#fdfbf7] rounded-r-[3rem] rounded-l-md shadow-[20px_20px_60px_rgba(0,0,0,0.5),inset_10px_0_20px_rgba(0,0,0,0.05)] border-r border-[#e5e7eb] transform rotate-[1deg] pointer-events-none" />
                    <div className="absolute inset-0 bg-[#fffdfa] rounded-r-[3rem] rounded-l-md shadow-[10px_10px_30px_rgba(0,0,0,0.3)] border-r border-[#e5e7eb] transform -rotate-[0.5deg] pointer-events-none" />

                    <div className="relative bg-[#fffefc] w-full min-h-[70vh] rounded-r-[3rem] rounded-l-[1rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200">

                      {/* Center Notebook Binder Ring Graphic */}
                      <div className="hidden md:flex absolute inset-y-0 left-1/2 -ml-4 w-8 flex-col justify-evenly py-12 z-20 pointer-events-none">
                        <div className="absolute inset-y-0 left-4 w-[2px] bg-slate-200/60 shadow-sm" />
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="w-12 h-5 -ml-2 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-400 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.2)]" />
                        ))}
                      </div>

                      {/* Left Page: Guidelines */}
                      <div className="w-full md:w-1/2 p-8 md:p-12 bg-slate-50/50 relative border-b md:border-b-0 md:border-r border-slate-200 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.02)]">
                        <div className="max-w-md mx-auto flex flex-col h-full text-left">
                          <div className="flex-grow">
                            <h3 className="text-xl font-bold text-slate-700 mb-4 font-sans uppercase tracking-widest border-b-2 border-mythos-sky pb-2 inline-block">
                              Mga Gabay sa Pagsusulat
                            </h3>
                            <p className="text-sm text-slate-500 italic mb-8">
                              (Para sa One-Page Digital Story: Gumamit ng mga elementong ito bilang balangkas)
                            </p>

                            <ol className="space-y-5 text-slate-600 font-medium pb-8 border-b border-slate-200 mb-8">
                              <li className="flex items-start justify-start gap-4 group">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-sm shrink-0 group-hover:bg-mythos-sky group-hover:text-white transition-colors mt-0.5">1</span>
                                <div className="text-left">
                                  <span className="font-bold text-slate-800 block">My Past</span>
                                  <span className="text-xs text-slate-500 italic">Ang aking nakaraan at pinagdaraanan.</span>
                                </div>
                              </li>
                              <li className="flex items-start justify-start gap-4 group">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-sm shrink-0 group-hover:bg-mythos-sky group-hover:text-white transition-colors mt-0.5">2</span>
                                <div className="text-left">
                                  <span className="font-bold text-slate-800 block">My Strength</span>
                                  <span className="text-xs text-slate-500 italic">Ang aking kalakasan.</span>
                                </div>
                              </li>
                              <li className="flex items-start justify-start gap-4 group">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-sm shrink-0 group-hover:bg-mythos-sky group-hover:text-white transition-colors mt-0.5">3</span>
                                <div className="text-left">
                                  <span className="font-bold text-slate-800 block">My Shadow</span>
                                  <span className="text-xs text-slate-500 italic">Mga aninong patuloy kong nilalabanan.</span>
                                </div>
                              </li>
                              <li className="flex items-start justify-start gap-4 group">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-sm shrink-0 group-hover:bg-mythos-sky group-hover:text-white transition-colors mt-0.5">4</span>
                                <div className="text-left">
                                  <span className="font-bold text-slate-800 block">My Turning Point</span>
                                  <span className="text-xs text-slate-500 italic">Ang sandaling nagbago ang lahat.</span>
                                </div>
                              </li>
                              <li className="flex items-start justify-start gap-4 group">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-sm shrink-0 group-hover:bg-mythos-sky group-hover:text-white transition-colors mt-0.5">5</span>
                                <div className="text-left">
                                  <span className="font-bold text-slate-800 block">My New Belief</span>
                                  <span className="text-xs text-slate-500 italic">Ang aking bagong positibong paniniwala.</span>
                                </div>
                              </li>
                              <li className="flex items-start justify-start gap-4 group">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-sm shrink-0 group-hover:bg-mythos-sky group-hover:text-white transition-colors mt-0.5">6</span>
                                <div className="text-left">
                                  <span className="font-bold text-slate-800 block">My Hero Choice</span>
                                  <span className="text-xs text-slate-500 italic">Ang paninindigang ginawa ko bilang hero.</span>
                                </div>
                              </li>
                              <li className="flex items-start justify-start gap-4 group">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-sm shrink-0 group-hover:bg-mythos-sky group-hover:text-white transition-colors mt-0.5">7</span>
                                <div className="text-left">
                                  <span className="font-bold text-slate-800 block">My Future</span>
                                  <span className="text-xs text-slate-500 italic">Ang kinabukasang isinusulat ko ngayon.</span>
                                </div>
                              </li>
                            </ol>
                          </div>
                        </div>
                      </div>

                      {/* Right Page: Writing canvas */}
                      <div className="w-full md:w-1/2 p-8 md:p-12 relative flex flex-col min-h-[60vh] text-left">
                        {/* Paper lines background */}
                        <div className="absolute inset-x-8 bottom-12 top-32 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(transparent 95%, #e2e8f0 100%)', backgroundSize: '100% 2.5rem' }}></div>

                        <div className="relative z-10 flex flex-col h-full text-left">
                          <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-800 mb-2 font-serif tracking-tight drop-shadow-sm text-left">
                              Activity 3: Create 'My New Story'
                            </h2>
                            <p className="text-lg text-slate-500 italic font-serif text-left">
                              (Isulat ang iyong Bagong Kuwento rito...)
                            </p>
                          </div>

                          <textarea
                            className="w-full flex-grow bg-transparent border-none focus:ring-0 outline-none resize-none font-serif text-lg md:text-xl leading-[2.5rem] pb-4 pt-1 text-slate-700 placeholder-slate-300/70 text-left"
                            placeholder="Once upon a time... (Noong unang panahon...)"
                            value={s5NewStory}
                            onChange={(e) => setS5NewStory(e.target.value)}
                            style={{ backgroundAttachment: 'local' }}
                          />

                          <div className="mt-8 flex justify-end gap-3 w-full border-t border-slate-200/50 pt-6">
                            <button
                              onClick={() => setIntroPage(4)}
                              className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-500 hover:bg-slate-100 transition-all font-bold"
                            >
                              Bumalik
                            </button>
                            <button
                              disabled={!s5NewStory.trim()}
                              onClick={async () => {
                                await dbClient.saveResponse(user.id, activeSession.number, 'my_new_story', s5NewStory);
                                setIntroPage(6);
                              }}
                              className="px-8 py-3 bg-sky-600 text-white font-black rounded-xl shadow-md hover:scale-105 hover:bg-sky-500 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                            >
                              Susunod: Activity 4
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : introPage === 6 && activeSession.number === 5 ? (
                  <div className="animate-fade-in relative max-w-6xl mx-auto mt-6 px-4 pb-20">
                    {/* Notebook Background */}
                    <div className="absolute inset-0 bg-[#fdfbf7] rounded-r-[3rem] rounded-l-md shadow-[20px_20px_60px_rgba(0,0,0,0.5),inset_10px_0_20px_rgba(0,0,0,0.05)] border-r border-[#e5e7eb] transform rotate-[1deg] pointer-events-none" />
                    <div className="absolute inset-0 bg-[#fffdfa] rounded-r-[3rem] rounded-l-md shadow-[10px_10px_30px_rgba(0,0,0,0.3)] border-r border-[#e5e7eb] transform -rotate-[0.5deg] pointer-events-none" />

                    <div className="relative bg-[#fffefc] w-full min-h-[70vh] rounded-r-[3rem] rounded-l-[1rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200">

                      {/* Center Notebook Binder Ring Graphic */}
                      <div className="hidden md:flex absolute inset-y-0 left-1/2 -ml-4 w-8 flex-col justify-evenly py-12 z-20 pointer-events-none">
                        <div className="absolute inset-y-0 left-4 w-[2px] bg-slate-200/60 shadow-sm" />
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="w-12 h-5 -ml-2 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-400 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.2)]" />
                        ))}
                      </div>

                      {/* Header Ribbon across both (simulated by placing it on left, but it looks good) */}

                      {/* Left Page: Items 1 to 3 */}
                      <div className="w-full md:w-1/2 p-8 md:p-12 relative flex flex-col min-h-[60vh] border-b md:border-b-0 md:border-r border-slate-200 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.02)]">
                        {/* Paper lines background */}
                        <div className="absolute inset-x-8 bottom-12 top-40 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(transparent 95%, #e2e8f0 100%)', backgroundSize: '100% 3.5rem' }}></div>

                        <div className="relative z-10 flex flex-col h-full text-left">
                          <div className="mb-6">
                            <h2 className="text-3xl font-black text-slate-800 mb-2 font-serif tracking-tight drop-shadow-sm leading-tight text-center md:text-left">
                              Activity 4: MyTHOS Personal Commitment
                            </h2>
                            <p className="text-lg text-mythos-sky font-bold uppercase tracking-widest text-center md:text-left mb-2">
                              "From this day forward..."
                            </p>
                            <p className="text-sm text-slate-500 italic font-serif text-center md:text-left">
                              (Mula sa araw na ito, buong puso kong ipinapangako na...)
                            </p>
                          </div>

                          <div className="space-y-4 pt-4 flex-grow flex flex-col">
                            {/* Grid item 1 */}
                            <div className="flex-grow flex flex-col justify-center relative min-h-[6.5rem]">
                              <span className="text-slate-700 font-bold block mb-1">
                                When I feel disrespected, I will: <span className="text-slate-400 italic text-sm font-normal ml-1 block sm:inline">(Kapag pakiramdam ko ako'y binabastos, ako ay...)</span>
                              </span>
                              <input
                                className="w-full bg-transparent border-none focus:ring-0 outline-none font-serif text-lg md:text-xl text-indigo-900 placeholder-slate-300 italic h-10 px-0 translate-y-1.5 leading-none bg-[url('data:image/svg+xml;utf8,<svg width=\'100%\' height=\'2\' xmlns=\'http://www.w3.org/2000/svg\'><line x1=\'0\' y1=\'1\' x2=\'100%\' y2=\'1\' stroke=\'#cbd5e1\' stroke-width=\'2\' stroke-dasharray=\'4 4\'/></svg>')] bg-bottom bg-repeat-x bg-[length:auto_2px]"
                                placeholder="..."
                                value={s5Commit1} onChange={e => setS5Commit1(e.target.value)}
                              />
                            </div>
                            {/* Grid item 2 */}
                            <div className="flex-grow flex flex-col justify-center relative min-h-[6.5rem]">
                              <span className="text-slate-700 font-bold block mb-1">
                                When I feel angry, I will: <span className="text-slate-400 italic text-sm font-normal ml-1 block sm:inline">(Kapag ako ay nagagalit, ako ay...)</span>
                              </span>
                              <input
                                className="w-full bg-transparent border-none focus:ring-0 outline-none font-serif text-lg md:text-xl text-indigo-900 placeholder-slate-300 italic h-10 px-0 translate-y-1.5 leading-none bg-[url('data:image/svg+xml;utf8,<svg width=\'100%\' height=\'2\' xmlns=\'http://www.w3.org/2000/svg\'><line x1=\'0\' y1=\'1\' x2=\'100%\' y2=\'1\' stroke=\'#cbd5e1\' stroke-width=\'2\' stroke-dasharray=\'4 4\'/></svg>')] bg-bottom bg-repeat-x bg-[length:auto_2px]"
                                placeholder="..."
                                value={s5Commit2} onChange={e => setS5Commit2(e.target.value)}
                              />
                            </div>
                            {/* Grid item 3 */}
                            <div className="flex-grow flex flex-col justify-center relative min-h-[6.5rem]">
                              <span className="text-slate-700 font-bold block mb-1">
                                When I have a negative thought about myself, I will: <span className="text-slate-400 italic text-sm font-normal ml-1 block sm:inline">(Kapag minamaliit ko ang sarili, ako ay...)</span>
                              </span>
                              <input
                                className="w-full bg-transparent border-none focus:ring-0 outline-none font-serif text-lg md:text-xl text-indigo-900 placeholder-slate-300 italic h-10 px-0 translate-y-1.5 leading-none bg-[url('data:image/svg+xml;utf8,<svg width=\'100%\' height=\'2\' xmlns=\'http://www.w3.org/2000/svg\'><line x1=\'0\' y1=\'1\' x2=\'100%\' y2=\'1\' stroke=\'#cbd5e1\' stroke-width=\'2\' stroke-dasharray=\'4 4\'/></svg>')] bg-bottom bg-repeat-x bg-[length:auto_2px]"
                                placeholder="..."
                                value={s5Commit3} onChange={e => setS5Commit3(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Page: Items 4 to 6 */}
                      <div className="w-full md:w-1/2 p-8 md:p-12 relative flex flex-col min-h-[60vh] text-left">
                        {/* Paper lines background */}
                        <div className="absolute inset-x-8 bottom-32 top-16 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(transparent 95%, #e2e8f0 100%)', backgroundSize: '100% 3.5rem' }}></div>

                        <div className="relative z-10 flex flex-col h-full text-left">
                          <div className="space-y-4 flex-grow flex flex-col pt-8">
                            {/* Grid item 4 */}
                            <div className="flex-grow flex flex-col justify-center relative min-h-[6.5rem]">
                              <span className="text-slate-700 font-bold block mb-1 mt-6">
                                When I feel like giving up, I will remember: <span className="text-slate-400 italic text-sm font-normal ml-1 block sm:inline">(Kapag gusto ko nang sumuko, aalalahanin ko na...)</span>
                              </span>
                              <input
                                className="w-full bg-transparent border-none focus:ring-0 outline-none font-serif text-lg md:text-xl text-indigo-900 placeholder-slate-300 italic h-10 px-0 translate-y-1.5 leading-none bg-[url('data:image/svg+xml;utf8,<svg width=\'100%\' height=\'2\' xmlns=\'http://www.w3.org/2000/svg\'><line x1=\'0\' y1=\'1\' x2=\'100%\' y2=\'1\' stroke=\'#cbd5e1\' stroke-width=\'2\' stroke-dasharray=\'4 4\'/></svg>')] bg-bottom bg-repeat-x bg-[length:auto_2px]"
                                placeholder="..."
                                value={s5Commit4} onChange={e => setS5Commit4(e.target.value)}
                              />
                            </div>
                            {/* Grid item 5 */}
                            <div className="flex-grow flex flex-col justify-center relative min-h-[6.5rem]">
                              <span className="text-slate-700 font-bold block mb-1 mt-4">
                                One person I can ask for help is: <span className="text-slate-400 italic text-sm font-normal ml-1 block sm:inline">(Isang tao na pwede kong hingan ng tulong ay si...)</span>
                              </span>
                              <input
                                className="w-full bg-transparent border-none focus:ring-0 outline-none font-serif text-lg md:text-xl text-indigo-900 placeholder-slate-300 italic h-10 px-0 translate-y-1.5 leading-none bg-[url('data:image/svg+xml;utf8,<svg width=\'100%\' height=\'2\' xmlns=\'http://www.w3.org/2000/svg\'><line x1=\'0\' y1=\'1\' x2=\'100%\' y2=\'1\' stroke=\'#cbd5e1\' stroke-width=\'2\' stroke-dasharray=\'4 4\'/></svg>')] bg-bottom bg-repeat-x bg-[length:auto_2px]"
                                placeholder="..."
                                value={s5Commit5} onChange={e => setS5Commit5(e.target.value)}
                              />
                            </div>
                            {/* Grid item 6 */}
                            <div className="flex-grow flex flex-col justify-center relative min-h-[6.5rem]">
                              <span className="text-slate-700 font-bold block mb-1 mt-4">
                                The person I am becoming is: <span className="text-slate-400 italic text-sm font-normal ml-1 block sm:inline">(Ang taong nabubuo at hinuhubog ko ngayon ay...)</span>
                              </span>
                              <input
                                className="w-full bg-transparent border-none focus:ring-0 outline-none font-serif text-lg md:text-xl text-indigo-900 placeholder-slate-300 italic h-10 px-0 translate-y-1.5 leading-none bg-[url('data:image/svg+xml;utf8,<svg width=\'100%\' height=\'2\' xmlns=\'http://www.w3.org/2000/svg\'><line x1=\'0\' y1=\'1\' x2=\'100%\' y2=\'1\' stroke=\'#cbd5e1\' stroke-width=\'2\' stroke-dasharray=\'4 4\'/></svg>')] bg-bottom bg-repeat-x bg-[length:auto_2px]"
                                placeholder="..."
                                value={s5Commit6} onChange={e => setS5Commit6(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-slate-200/50 flex flex-col sm:flex-row justify-end gap-3 w-full shrink-0">
                            <button
                              onClick={() => setIntroPage(4)}
                              className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-500 hover:bg-slate-100 transition-all font-bold w-full sm:w-auto"
                            >
                              Bumalik (Back)
                            </button>
                            <button
                              disabled={!s5Commit1.trim() || !s5Commit2.trim() || !s5Commit3.trim() || !s5Commit4.trim() || !s5Commit5.trim() || !s5Commit6.trim()}
                              onClick={async () => {
                                const payload = {
                                  commit1: s5Commit1,
                                  commit2: s5Commit2,
                                  commit3: s5Commit3,
                                  commit4: s5Commit4,
                                  commit5: s5Commit5,
                                  commit6: s5Commit6
                                };
                                await dbClient.saveResponse(user.id, activeSession.number, 'mythos_personal_commitment', payload);
                                setSessionStep(6);
                              }}
                              className="w-full sm:w-auto px-8 py-3 bg-sky-600 text-white font-black rounded-xl shadow-md hover:scale-105 hover:bg-sky-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                            >
                              Pagtatapos ng Session
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* STEP 1: STORY SLIDE VIEW OR DIGITAL CHECK-IN */}
            {sessionStep === 1 && (
              activeSession.number === 1 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-10 md:p-16 rounded-[3rem] w-full max-w-4xl mx-auto text-center space-y-6 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <motion.h3 whileHover={{ scale: 1.02 }} className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 drop-shadow-md uppercase tracking-wide cursor-default">
                    Activity 1: Digital Check-In <br className="hidden md:block" />&mdash; &quot;How Am I Today?&quot;
                  </motion.h3>

                  <motion.div whileHover={{ scale: 1.05 }} className="inline-block px-4 py-1.5 bg-mythos-sky/20 border border-mythos-sky/30 text-mythos-sky rounded-full text-xs md:text-sm font-black uppercase mb-4 shadow-sm cursor-default">
                    5 minutes
                  </motion.div>

                  <motion.p whileHover={{ scale: 1.02 }} className="text-lg md:text-2xl text-white/95 font-bold mb-8 md:mb-12 cursor-default">
                    Choose the symbol that best represents how you feel today.<br />
                    <span className="text-base md:text-lg text-white/60 italic leading-loose font-medium mt-2 block">(Pumili ng simbolo na sumasalamin sa nararamdaman mo ngayon.)</span>
                  </motion.p>

                  <div className="flex justify-center flex-wrap gap-4 md:gap-8 mt-12 mb-10">
                    {[
                      { label: "Masaya (Great)", code: "1f604" },
                      { label: "Mabuti (Good)", code: "1f642" },
                      { label: "Kalmado (Neutral)", code: "1f610" },
                      { label: "Malungkot (Down)", code: "1f614" },
                      { label: "Pagod (Stressed)", code: "1f62b" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={async () => {
                          confetti({ particleCount: 50 });
                          await dbClient.saveResponse(user.id, activeSession.number, 'mood_checkin', { feeling: item.label });
                          setSessionStep(2);
                        }}
                        className="group flex flex-col items-center gap-4 p-4 sm:p-6 rounded-3xl hover:bg-white/10 transition-all duration-300 cursor-pointer border border-transparent hover:border-white/20 hover:shadow-xl"
                        title={item.label}
                      >
                        <div className="w-24 h-24 sm:w-32 sm:h-32 relative transform group-hover:scale-[1.4] group-hover:-translate-y-6 transition-transform duration-500 ease-out z-10 group-hover:z-50">
                          <img
                            src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${item.code}/512.webp`}
                            alt={item.label}
                            className="w-full h-full object-contain filter group-hover:brightness-110 drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_30px_35px_rgba(0,0,0,0.6)]"
                            loading="lazy"
                          />
                        </div>
                        <span className="text-sm md:text-base font-black text-white/50 group-hover:text-white transition-colors uppercase tracking-widest">{item.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : activeSession.number === 2 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 md:p-10 rounded-3xl space-y-6">
                  <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 border-b border-white/10 pb-4 tracking-wide shadow-sm uppercase">
                    Kuwento ni Bernardo Carpio
                  </h3>
                  <div className="flex justify-center w-full my-8">
                    <video
                      src="/videos/bernardo carpio.mp4"
                      className="w-full aspect-video rounded-3xl border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.8)] bg-black object-contain focus:outline-none"
                      controls
                      onEnded={() => setSessionStep(2)}
                    />
                  </div>

                  <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                    <button
                      onClick={() => setSessionStep(0)}
                      className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                    >
                      Bumalik
                    </button>
                    <button
                      onClick={() => setSessionStep(2)}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 text-sm md:text-base"
                    >
                      Ipagpatuloy
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              ) : activeSession.number === 3 ? (
                vidPage === 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 md:p-10 rounded-3xl space-y-6">
                    <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 border-b border-white/10 pb-4 tracking-wide shadow-sm uppercase">
                      Activity 2: Biag ni Lam-ang
                    </h3>
                    <div className="flex justify-center w-full my-8">
                      <video
                        src="/videos/lam_ang.mp4"
                        className="w-full aspect-video rounded-3xl border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.8)] bg-black object-contain focus:outline-none"
                        controls
                        onEnded={() => setVidPage(1)}
                      />
                    </div>

                    <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                      <button
                        onClick={() => setSessionStep(0)}
                        className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                      >
                        Bumalik
                      </button>
                      <button
                        onClick={() => setVidPage(1)}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 text-sm md:text-base"
                      >
                        Ipagpatuloy
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                ) : vidPage === 1 ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 md:p-12 rounded-[3xl] w-full max-w-5xl mx-auto shadow-2xl relative overflow-hidden backdrop-blur-xl text-center">
                    <motion.h2 whileHover={{ scale: 1.02 }} className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 mb-2 tracking-wide drop-shadow-md cursor-default uppercase">
                      What Makes a Hero?
                    </motion.h2>
                    <p className="text-base md:text-lg text-white/80 mb-10 font-bold italic tracking-wide">
                      Select as many traits as you think makes someone a hero.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto mb-10">
                      {[
                        { id: '1', label: 'Physical Strength' },
                        { id: '2', label: 'Courage' },
                        { id: '3', label: 'Intelligence' },
                        { id: '4', label: 'Self-Control' },
                        { id: '5', label: 'Helping Others' },
                        { id: '6', label: 'Making Good Decisions' },
                        { id: '7', label: 'Admitting Mistakes' }
                      ].map(trait => {
                        const isSelected = selectedHeroTraits.includes(trait.id);
                        return (
                          <motion.button
                            key={trait.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedHeroTraits(prev => prev.filter(t => t !== trait.id));
                              } else {
                                setSelectedHeroTraits(prev => [...prev, trait.id]);
                              }
                            }}
                            className={`px-6 py-4 rounded-xl border-2 font-bold text-sm md:text-lg transition-all duration-300 shadow-lg ${isSelected
                              ? 'bg-mythos-gold text-mythos-deep border-mythos-gold shadow-[0_0_20px_rgba(255,215,0,0.5)]'
                              : 'bg-black/40 text-white/80 border-white/20 hover:border-mythos-gold/50'
                              }`}
                          >
                            {trait.label}
                          </motion.button>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {selectedHeroTraits.length > 0 && !isHeroQuoteRevealed && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-6 mb-4 flex justify-center"
                        >
                          <button
                            onClick={() => setIsHeroQuoteRevealed(true)}
                            className="bg-emerald-500 text-white font-black px-10 py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-105 hover:bg-emerald-400 transition-all text-lg"
                          >
                            I-submit ang Sagot (Submit)
                          </button>
                        </motion.div>
                      )}

                      {isHeroQuoteRevealed && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="mt-8 mb-4 p-8 rounded-2xl bg-gradient-to-br from-blue-900/40 to-mythos-deep/60 border border-mythos-sky/30 shadow-[0_0_30px_rgba(72,202,228,0.2)]"
                        >
                          <h4 className="text-xl md:text-3xl font-black text-white italic drop-shadow-md leading-relaxed">
                            "Real strength includes the ability to control yourself when you have the power to hurt someone."
                          </h4>
                          <p className="text-mythos-sky/80 mt-2 font-bold tracking-widest uppercase text-sm md:text-base">
                            The true measure of a hero
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex justify-between mt-12 pt-6 border-t border-white/10">
                      <button
                        onClick={() => {
                          setVidPage(0);
                          setIsHeroQuoteRevealed(false);
                          setSelectedHeroTraits([]);
                        }}
                        className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                      >
                        Bumalik
                      </button>
                      <button
                        disabled={!isHeroQuoteRevealed}
                        onClick={async () => {
                          const traitOptions = [
                            { id: '1', label: 'Physical Strength' },
                            { id: '2', label: 'Courage' },
                            { id: '3', label: 'Intelligence' },
                            { id: '4', label: 'Self-Control' },
                            { id: '5', label: 'Helping Others' },
                            { id: '6', label: 'Making Good Decisions' },
                            { id: '7', label: 'Admitting Mistakes' }
                          ];
                          const savedTraits = selectedHeroTraits.map(id => traitOptions.find(t => t.id === id)?.label || id);
                          await dbClient.saveResponse(user.id, activeSession!.number, 'hero_traits', savedTraits);
                          setVidPage(2);
                          setIsHeroQuoteRevealed(false);
                          setSelectedHeroTraits([]);
                        }}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 text-sm md:text-base disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                      >
                        Ipagpatuloy
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                ) : vidPage === 2 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 md:p-12 rounded-[3xl] w-full max-w-5xl mx-auto shadow-2xl relative overflow-hidden backdrop-blur-xl">
                    <motion.h2 whileHover={{ scale: 1.02 }} className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-500 mb-2 tracking-wide drop-shadow-md cursor-default uppercase text-center">
                      Activity 3: The Hero's CBT Choice
                    </motion.h2>
                    <p className="text-base md:text-lg text-white/80 mb-10 font-bold italic tracking-wide text-center">
                      Step by step, a hero navigates through a difficult situation.
                    </p>

                    <div className="flex flex-col gap-8 md:gap-10 max-w-3xl mx-auto mb-10 text-center">
                      {[
                        { step: 0, title: "Sitwasyon (Situation)", text: "\"Someone pushes you.\" \n (May tumulak sa'yo.)", color: "text-blue-300 border-blue-500/40 bg-blue-900/20" },
                        { step: 1, title: "Awtomatikong Pag-iisip (Automatic Thought)", text: "\"He wants to disrespect me.\" \n (\"Bastos 'to ah.\")", color: "text-red-400 border-red-500/40 bg-red-900/20" },
                        { step: 2, title: "Pakiramdam (Feeling)", text: "Anger (Galit)", color: "text-orange-400 border-orange-500/40 bg-orange-900/20" },
                        { step: 3, title: "Bugso ng Damdamin (Impulse)", text: "Push back (Mangganti o itulak pabalik)", color: "text-yellow-400 border-yellow-500/40 bg-yellow-900/20" },
                        { step: 4, title: "Alternatibong Pag-iisip (Alternative Thought)", text: "\"I don't know why he pushed me. I can ask first.\" \n (\"Baka aksidente lang. Tatanungin ko muna.\")", color: "text-green-300 border-green-500/40 bg-green-900/20" },
                        { step: 5, title: "Ibang Tugon (Alternative Behavior)", text: "Move away / ask / seek assistance \n (Umiwas / magtanong / humingi ng tulong)", color: "text-teal-300 border-teal-500/40 bg-teal-900/20" },
                        { step: 6, title: "Posibleng Kahihinatnan (Possible Consequence)", text: "Conflict is prevented. You remain in control. \n (Naiwasan ang gulo. Nanatili kang kontrolado.)", color: "text-mythos-gold border-mythos-gold/40 bg-yellow-600/20" }
                      ].map((item, idx) => (
                        <AnimatePresence key={idx}>
                          {cbtChoiceStep >= idx && (
                            <motion.div
                              initial={{ opacity: 0, x: -30, height: 0 }}
                              animate={{ opacity: 1, x: 0, height: 'auto' }}
                              transition={{ duration: 0.4 }}
                              className={`p-5 rounded-2xl border-2 ${item.color} shadow-lg relative`}
                            >
                              {idx > 0 && (
                                <div className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
                                  <ArrowDown size={36} strokeWidth={2.5} />
                                </div>
                              )}
                              <h4 className="font-black uppercase tracking-widest text-xs md:text-sm opacity-80 mb-1">{item.title}</h4>
                              <p className="font-bold text-lg md:text-2xl text-white whitespace-pre-line">{item.text}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      ))}

                      {cbtChoiceStep < 6 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-6">
                          <button
                            onClick={() => setCbtChoiceStep(prev => prev + 1)}
                            className="bg-mythos-gold/20 text-mythos-gold border border-mythos-gold px-8 py-3 rounded-full font-black hover:bg-mythos-gold hover:text-mythos-deep transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                          >
                            Next Step
                          </button>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex justify-between mt-12 pt-6 border-t border-white/10">
                      <button
                        onClick={() => {
                          setVidPage(1);
                        }}
                        className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                      >
                        Bumalik
                      </button>
                      <button
                        disabled={cbtChoiceStep < 6}
                        onClick={() => {
                          setSessionStep(2);
                        }}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 text-sm md:text-base disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                      >
                        Tungo sa Pagsusuri
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                ) : null
              ) : (
                <StoryPlayer
                  slides={activeSession.slides}
                  sessionNumber={activeSession.number}
                  onComplete={() => setSessionStep(2)}
                />
              )
            )}

            {/* STEP 2: INTERACTIVE ACTIVITY */}
            {sessionStep === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {activeSession.number === 3 ? (
                  hamonPage === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 md:p-12 rounded-[3xl] w-full max-w-5xl mx-auto shadow-2xl relative overflow-hidden backdrop-blur-xl">
                      <motion.h2 whileHover={{ scale: 1.02 }} className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-500 mb-2 tracking-wide drop-shadow-md cursor-default uppercase text-center">
                        Activity 4: Choose Your Path
                      </motion.h2>
                      <p className="text-base md:text-lg text-white/80 mb-10 font-bold italic tracking-wide text-center">
                        Create your branching scenario and see where it leads you.
                      </p>

                      <div className="max-w-4xl mx-auto mb-10">
                        {/* Situation */}
                        <div className="bg-mythos-deep/60 p-6 md:p-8 rounded-2xl border border-white/20 shadow-lg text-center relative z-10">
                          <h4 className="font-black uppercase tracking-widest text-mythos-sky text-sm mb-2">Sitwasyon (Situation)</h4>
                          <p className="text-white text-xl md:text-2xl font-bold italic">
                            "A classmate insults you in front of your friends." <br />
                            <span className="text-white/60 text-lg">(May nang-insultong kaklase sa harap ng mga kaibigan mo.)</span>
                          </p>
                        </div>

                        {/* Direction arrow down to choices */}
                        <div className="flex justify-center mt-2 mb-6 relative z-0 text-white/50 animate-bounce">
                          <ArrowDown size={40} strokeWidth={2.5} />
                        </div>

                        {/* Choices */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Choice 1 */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => setBranchingChoice(1)}
                              className={`w-full p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 shadow-md flex flex-col items-center text-center ${branchingChoice === 1
                                ? 'bg-red-900/40 border-red-500 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                                : 'bg-black/30 border-white/10 hover:border-red-400 hover:bg-black/50'
                                }`}
                            >
                              <span className="font-black text-xs uppercase opacity-70 mb-2">Choice 1</span>
                              <span className="font-bold text-white">"You insult him back."</span>
                              <span className="text-sm text-white/60 mt-1">(Gaganti ka rin ng insulto.)</span>
                            </button>

                            {/* Flow Arrow */}
                            <AnimatePresence>
                              {branchingChoice === 1 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col items-center w-full">
                                  <div className="h-4 w-1 bg-red-500/50 my-2"></div>
                                  <ArrowDown className="text-red-400 mb-2 animate-bounce" size={36} strokeWidth={2.5} />
                                  <div className="p-4 bg-red-950/80 border border-red-500/30 rounded-xl w-full text-center">
                                    <span className="font-black text-xs uppercase text-red-300 block mb-1">Resulta (Consequence)</span>
                                    <span className="font-bold text-red-100">Conflict escalates.</span><br />
                                    <span className="text-sm text-red-200/70">(Mas lalala ang gulo.)</span>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Choice 2 */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => setBranchingChoice(2)}
                              className={`w-full p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 shadow-md flex flex-col items-center text-center ${branchingChoice === 2
                                ? 'bg-orange-900/40 border-orange-500 scale-105 shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                                : 'bg-black/30 border-white/10 hover:border-orange-400 hover:bg-black/50'
                                }`}
                            >
                              <span className="font-black text-xs uppercase opacity-70 mb-2">Choice 2</span>
                              <span className="font-bold text-white">"You immediately threaten him."</span>
                              <span className="text-sm text-white/60 mt-1">(Babanatan o bantaan mo agad.)</span>
                            </button>

                            {/* Flow Arrow */}
                            <AnimatePresence>
                              {branchingChoice === 2 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col items-center w-full">
                                  <div className="h-4 w-1 bg-orange-500/50 my-2"></div>
                                  <ArrowDown className="text-orange-400 mb-2 animate-bounce" size={36} strokeWidth={2.5} />
                                  <div className="p-4 bg-orange-950/80 border border-orange-500/30 rounded-xl w-full text-center">
                                    <span className="font-black text-xs uppercase text-orange-300 block mb-1">Resulta (Consequence)</span>
                                    <span className="font-bold text-orange-100">Risk increases.</span><br />
                                    <span className="text-sm text-orange-200/70">(Tataas ang panganib at posibleng magkapisikalan.)</span>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Choice 3 (Hero Path) */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => setBranchingChoice(3)}
                              className={`w-full p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 shadow-md flex flex-col items-center text-center ${branchingChoice === 3
                                ? 'bg-emerald-900/40 border-emerald-500 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                : 'bg-black/30 border-white/10 hover:border-emerald-400 hover:bg-black/50'
                                }`}
                            >
                              <span className="font-black text-xs uppercase opacity-70 mb-2">Choice 3</span>
                              <span className="font-bold text-white">"You pause and ask yourself what you want."</span>
                              <span className="text-sm text-white/60 mt-1">(Hihinto at mag-iisip muna.)</span>
                            </button>

                            {/* Flow Arrow */}
                            <AnimatePresence>
                              {branchingChoice === 3 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col items-center w-full">
                                  <div className="h-4 w-1 bg-emerald-500/50 my-2"></div>
                                  <ArrowDown className="text-emerald-400 mb-2 animate-bounce" size={36} strokeWidth={2.5} />
                                  <div className="p-4 bg-emerald-950/80 border border-emerald-500/30 rounded-xl w-full text-center">
                                    <span className="font-black text-xs uppercase text-emerald-300 block mb-1">Leads to:</span>
                                    <span className="font-bold text-emerald-100">"I want to protect myself without creating a bigger problem."</span>
                                  </div>

                                  <div className="h-4 w-1 bg-emerald-500/50 my-2"></div>
                                  <ArrowDown className="text-emerald-400 mb-2 animate-bounce" size={36} strokeWidth={2.5} />
                                  <div className="p-4 bg-emerald-900/40 border border-emerald-400/50 rounded-xl w-full text-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                    <span className="font-black text-xs uppercase text-emerald-200 block mb-2">Ano ang magandang itugon?</span>
                                    <span className="font-bold text-white block mb-4">"What response can help me achieve that?"</span>
                                    <textarea
                                      value={branchingFreeText}
                                      onChange={(e) => setBranchingFreeText(e.target.value)}
                                      placeholder="I-type ang iyong matalinong tugon dito..."
                                      className="w-full bg-black/40 border border-white/20 rounded-lg p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-mythos-gold resize-none h-24"
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-12 pt-6 border-t border-white/10">
                        <button
                          onClick={async () => {
                            const choiceLabels: Record<number, string> = {
                              1: '"You insult him back." (Gaganti ka rin ng insulto.)',
                              2: '"You immediately threaten him." (Babanatan o bantaan mo agad.)',
                              3: '"You pause and ask yourself what you want." (Hihinto at mag-iisip muna.)'
                            };
                            await dbClient.saveResponse(user.id, activeSession!.number, 'choose_your_path', {
                              choice: branchingChoice !== null ? (choiceLabels[branchingChoice] || branchingChoice) : null,
                              freeText: branchingFreeText
                            });
                            setHamonPage(1); // Proceed to Wrap-Up
                          }}
                          disabled={branchingChoice === null || (branchingChoice === 3 && branchingFreeText.trim().length === 0)}
                          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 text-sm md:text-base disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                        >
                          Ipagpatuloy sa Modyul
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 md:p-12 rounded-[3xl] w-full max-w-4xl mx-auto shadow-2xl relative overflow-hidden backdrop-blur-xl text-center">
                      <motion.h2 whileHover={{ scale: 1.02 }} className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 mb-2 tracking-wide drop-shadow-md cursor-default uppercase">
                        Wrap-Up
                      </motion.h2>
                      <p className="text-xl md:text-2xl text-white font-bold leading-relaxed mt-6 mb-2 mix-blend-screen text-shadow-sm">
                        "What is one choice you can make this week that your future self will be proud of?"
                      </p>
                      <p className="text-base md:text-xl text-white/70 font-medium italic mb-10 drop-shadow-sm max-w-2xl mx-auto">
                        (Ano ang isang desisyong magagawa mo ngayong linggo na maipagmamalaki ng iyong future self?)
                      </p>

                      <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/40 p-8 md:p-10 rounded-3xl border border-indigo-500/30 shadow-[0_0_40px_rgba(79,70,229,0.2)]">
                        <h3 className="font-black text-2xl text-indigo-300 uppercase tracking-widest mb-1">
                          My Hero Choice
                        </h3>
                        <p className="text-indigo-400/80 font-bold text-sm tracking-widest mb-8 uppercase">
                          (Ang Aking Bida-Desisyon)
                        </p>

                        <div className="flex flex-col gap-6 md:gap-8 text-xl font-medium text-left">
                          <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4 border-b border-indigo-500/20 pb-4">
                            <div className="flex flex-col shrink-0">
                              <span className="text-white whitespace-nowrap">"This week, I will</span>
                              <span className="text-white/50 text-sm font-bold italic">(Ngayong linggo, gagawin ko ang...)</span>
                            </div>
                            <input
                              type="text"
                              value={commitmentWill}
                              onChange={(e) => setCommitmentWill(e.target.value)}
                              placeholder="(action I will take...)"
                              className="w-full bg-black/40 border-b-2 border-indigo-400 focus:border-mythos-gold px-4 py-2 text-mythos-gold placeholder:text-white/30 focus:outline-none transition-colors"
                            />
                          </div>

                          <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4 border-b border-indigo-500/20 pb-4">
                            <div className="flex flex-col shrink-0">
                              <span className="text-white whitespace-nowrap">instead of</span>
                              <span className="text-white/50 text-sm font-bold italic">(sa halip na...)</span>
                            </div>
                            <div className="flex w-full items-end gap-2">
                              <input
                                type="text"
                                value={commitmentInstead}
                                onChange={(e) => setCommitmentInstead(e.target.value)}
                                placeholder="(action I want to avoid...)"
                                className="w-full bg-black/40 border-b-2 border-indigo-400 focus:border-mythos-gold px-4 py-2 text-mythos-gold placeholder:text-white/30 focus:outline-none transition-colors"
                              />
                              <span className="text-white font-black text-2xl pb-2">."</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between mt-12 pt-6 border-t border-white/10">
                        <button
                          onClick={() => {
                            setHamonPage(0);
                          }}
                          className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                        >
                          Bumalik
                        </button>
                        <button
                          disabled={!commitmentWill.trim() || !commitmentInstead.trim()}
                          onClick={async () => {
                            await dbClient.saveResponse(user.id, activeSession!.number, 'hero_choice_commitment', { willDo: commitmentWill, insteadOf: commitmentInstead });
                            if (activeSession!.number === 3) {
                              setSessionStep(6); // Skip Pagsusuri and Journal, jump to Wakas
                            } else {
                              setSessionStep(3); // Proceed to CBT module
                            }
                          }}
                          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 text-sm md:text-base disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                        >
                          {activeSession!.number === 3 ? "Tapusin ang Session" : "Ipagpatuloy sa Pagsusuri"}
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </motion.div>
                  )
                ) : activeSession.number === 4 ? (
                  hamonPage === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 md:p-12 rounded-[3xl] w-full max-w-4xl mx-auto shadow-2xl relative overflow-hidden backdrop-blur-xl">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                      <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-400 to-blue-500 mb-2 tracking-wide uppercase text-center relative z-10">
                        Process Question 1
                      </h2>
                      <div className="bg-indigo-950/40 p-6 md:p-10 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)] text-center mt-8 relative z-10">
                        <p className="text-white text-2xl md:text-4xl font-black mb-4 tracking-tight drop-shadow-md">
                          "What happens when emotions become too strong?"
                        </p>
                        <p className="text-indigo-300 text-lg md:text-xl font-bold italic mb-10 drop-shadow-sm">
                          (Anong nangyayari kapag sobrang tindi na ng emosyon?)
                        </p>
                        <textarea
                          value={s4Process1}
                          onChange={(e) => setS4Process1(e.target.value)}
                          placeholder="Your answer here... (Ang iyong sagot dito...)"
                          className="w-full bg-black/60 border border-indigo-500/50 rounded-xl p-6 text-white text-lg placeholder-white/30 focus:outline-none focus:border-mythos-sky focus:ring-1 focus:ring-mythos-sky shadow-inner transition-all resize-none h-40 md:h-48"
                        />
                      </div>
                      <div className="flex justify-end mt-10 relative z-10">
                        <button
                          disabled={!s4Process1.trim()}
                          onClick={() => setHamonPage(1)}
                          className="px-10 py-5 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep text-lg font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                        >
                          Susunod
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 md:p-12 rounded-[3xl] w-full max-w-4xl mx-auto shadow-2xl relative overflow-hidden backdrop-blur-xl">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                      <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-400 to-blue-500 mb-2 tracking-wide uppercase text-center relative z-10">
                        Process Question 2
                      </h2>
                      <div className="bg-indigo-950/40 p-6 md:p-10 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)] text-center mt-8 relative z-10">
                        <p className="text-white text-2xl md:text-4xl font-black mb-4 tracking-tight drop-shadow-md">
                          "How can a person respond to hurt without hurting others?"
                        </p>
                        <p className="text-indigo-300 text-lg md:text-xl font-bold italic mb-10 drop-shadow-sm">
                          (Paano makakatugon ang isang tao sa pananakit nang hindi nananakit ng iba?)
                        </p>
                        <textarea
                          value={s4Process2}
                          onChange={(e) => setS4Process2(e.target.value)}
                          placeholder="Your answer here... (Ang iyong sagot dito...)"
                          className="w-full bg-black/60 border border-indigo-500/50 rounded-xl p-6 text-white text-lg placeholder-white/30 focus:outline-none focus:border-mythos-sky focus:ring-1 focus:ring-mythos-sky shadow-inner transition-all resize-none h-40 md:h-48"
                        />
                      </div>
                      <div className="flex justify-between items-center mt-10 relative z-10">
                        <button
                          onClick={() => setHamonPage(0)}
                          className="px-8 py-4 rounded-xl border border-white/20 hover:bg-white/10 transition-all font-bold shadow-md text-white/90"
                        >
                          Bumalik
                        </button>
                        <button
                          disabled={!s4Process2.trim()}
                          onClick={() => {
                            setIntroPage(0);
                            setSessionStep(3);
                          }}
                          className="px-10 py-5 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep text-lg font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                        >
                          Ipagpatuloy sa Pagsusuri
                        </button>
                      </div>
                    </motion.div>
                  )

                ) : (
                  /* Standard interactive reflection quiz for distorion/identity */
                  activeSession.number === 1 ? (
                    hamonPage === 0 ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        className="relative p-10 md:p-16 rounded-3xl max-w-3xl mx-auto text-center overflow-hidden border border-mythos-gold/30 shadow-[0_0_50px_rgba(255,215,0,0.15)] bg-gradient-to-b from-black/60 to-black/80 backdrop-blur-xl"
                      >
                        {/* Decorative Background Glows */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-mythos-gold/10 blur-[80px] rounded-full pointer-events-none" />

                        <motion.h3
                          initial={{ y: -20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="relative z-10 text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-mythos-gold to-orange-400 tracking-tight mb-8 drop-shadow-xl"
                        >
                          Activity 2: Entering the MyTHOS World
                        </motion.h3>

                        <motion.p
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="relative z-10 text-lg md:text-2xl text-white/95 font-medium mb-12 leading-relaxed md:leading-loose px-4 md:px-8"
                        >
                          Welcome! You are about to step into the world of Philippine narratives and uncover your own story.
                        </motion.p>

                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.6, type: 'spring', bounce: 0.5 }}
                          className="relative z-10 flex justify-center mt-8"
                        >
                          <button
                            onClick={() => {
                              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                              setHamonPage(1);
                            }}
                            className="group relative px-10 py-5 rounded-full bg-gradient-to-r from-mythos-sky to-blue-500 text-white font-extrabold text-lg md:text-xl shadow-[0_0_30px_rgba(72,202,228,0.5)] hover:shadow-[0_0_60px_rgba(72,202,228,0.8)] hover:scale-110 transition-all duration-300 overflow-hidden"
                          >
                            <span className="relative z-10 flex items-center gap-3 tracking-wide">
                              Pumasok sa MyTHOS (Enter)
                              <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                              </svg>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                          </button>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel p-8 md:p-12 rounded-[2rem] w-full max-w-4xl mx-auto space-y-10 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                      >
                        <div className="text-center space-y-4 mb-4">
                          <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 tracking-wide uppercase drop-shadow-md">
                            Introduction to the Intervention
                          </h3>
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="bg-white/5 border-l-4 border-mythos-sky p-8 md:p-12 rounded-r-[2rem] shadow-2xl relative overflow-hidden hover:bg-white/10"
                        >
                          <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Quote size={120} />
                          </div>
                          <p className="text-2xl md:text-3xl text-white/95 font-medium leading-relaxed italic z-10 relative drop-shadow-md">
                            &quot;Every person carries a story. Some chapters are difficult. Some chapters contain people who hurt us, situations we did not choose, and moments we wish had never happened. But a difficult chapter does not mean that the entire story is hopeless.&quot;
                          </p>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.015 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="mt-12 p-6 md:p-8 bg-red-900/40 border border-red-500/30 rounded-3xl flex gap-6 items-start shadow-[0_0_30px_rgba(255,0,0,0.15)] hover:shadow-[0_0_40px_rgba(255,0,0,0.3)]"
                        >
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex flex-col items-center justify-center text-red-300">
                            <AlertCircle size={28} />
                          </div>
                          <div>
                            <h4 className="text-red-300 font-black uppercase tracking-widest text-base mb-2">Important Reminder</h4>
                            <p className="text-white/90 font-bold text-base md:text-lg leading-relaxed">
                              You decide what parts of your personal story you want to share. You will never be required to tell us about painful experiences. You always have full control.
                            </p>
                          </div>
                        </motion.div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                          <button
                            onClick={() => setHamonPage(0)}
                            className="px-6 py-2 rounded-lg font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                          >
                            Bumalik (Go Back)
                          </button>
                          <button
                            onClick={() => setSessionStep(3)}
                            className="group flex gap-2 items-center px-8 py-3 rounded-xl bg-mythos-sky text-mythos-deep font-bold hover:bg-white hover:scale-105 transition-all shadow-lg"
                          >
                            Ituloy (Proceed)
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  ) : (
                    <div className="glass-panel p-6 md:p-10 rounded-3xl max-w-3xl mx-auto text-center space-y-6 shadow-xl">
                      {activeSession.number === 2 ? (
                        <>
                          <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 tracking-wide uppercase drop-shadow-md">
                            Process Questions
                          </h3>
                          <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl shadow-inner mt-6 text-left space-y-4 hover:border-mythos-sky/30 transition-colors">
                            <p className="text-xl md:text-2xl text-white/95 font-medium leading-relaxed italic z-10 relative">
                              &quot;What happens when a person has great strength but does not know how to direct it?&quot;
                            </p>
                            <p className="text-sm text-mythos-sky/80 mt-2 font-bold mb-4">
                              (Ano ang nangyayari kapag ang isang tao ay may taglay na matinding lakas ngunit hindi alam kung paano ito idirekta?)
                            </p>

                            <motion.div
                              whileHover={{ scale: 1.01 }}
                              className="relative group mt-6"
                            >
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-mythos-sky to-mythos-gold rounded-2xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
                              <textarea
                                value={processAnswer}
                                onChange={(e) => setProcessAnswer(e.target.value)}
                                placeholder="I-type ang iyong pagninilay dito..."
                                className="relative w-full p-5 glass-input rounded-2xl text-lg md:text-xl font-medium outline-none border border-white/10 focus:border-transparent focus:shadow-[inset_0_0_20px_rgba(72,202,228,0.2),0_0_20px_rgba(72,202,228,0.4)] bg-[#0b132b]/80 focus:bg-mythos-deep transition-all duration-300 placeholder:text-white/30 min-h-[140px] resize-y"
                              />
                            </motion.div>
                          </div>

                          <div className="pt-6">
                            <button
                              onClick={() => setSessionStep(3)}
                              disabled={!processAnswer.trim()}
                              className="px-8 py-4 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-extrabold rounded-2xl shadow-lg hover:scale-105 hover:shadow-[0_0_30px_rgba(78,168,222,0.4)] transition-all duration-300 w-full md:w-auto text-sm md:text-base flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none disabled:cursor-not-allowed"
                            >
                              Ipagpatuloy ang Pagsusuri
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 className="text-xl font-bold text-mythos-gold">
                            Interactive Discovery Exercise
                          </h3>
                          <p className="text-sm text-white/70">
                            I-click ang ipagpatuloy upang mapanood ang kwento.
                          </p>
                          <button
                            onClick={() => setSessionStep(3)}
                            className="px-6 py-2.5 bg-mythos-sky text-mythos-deep font-bold rounded-lg text-sm hover:bg-mythos-teal transition"
                          >
                            Ipagpatuloy
                          </button>
                        </>
                      )}
                    </div>
                  )
                )}

                {(activeSession.number === 3 || activeSession.number === 4) && (
                  <div className="flex justify-end max-w-md mx-auto mt-4">
                    <button
                      onClick={() => setSessionStep(3)}
                      className="px-6 py-2.5 bg-mythos-sky text-mythos-deep font-bold rounded-lg text-sm hover:bg-mythos-teal transition-all duration-200"
                    >
                      Ipagpatuloy
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: CBT QUESTIONNAIRE OR VIDEO */}
            {sessionStep === 3 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 md:p-10 rounded-3xl space-y-6">

                {activeSession.number === 1 && vidPage === 0 ? (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 border-b border-white/10 pb-4 tracking-wide shadow-sm">
                      Kuwento ni Malakas at Maganda
                    </h3>
                    <div className="flex justify-center w-full my-8">
                      <video
                        src="/videos/malakas_maganda.mp4"
                        className="w-full aspect-video rounded-3xl border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.8)] bg-black object-contain focus:outline-none"
                        controls
                        autoPlay
                      />
                    </div>

                    <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                      <button
                        onClick={() => setSessionStep(2)}
                        className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                      >
                        Bumalik
                      </button>
                      <button
                        onClick={() => setVidPage(1)}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 text-sm md:text-base"
                      >
                        Ipagpatuloy
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </>
                ) : activeSession.number === 2 ? (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 border-b border-white/10 pb-4 mb-6 shadow-sm uppercase tracking-wide">
                      Activity 2: Anger Thermometer
                    </h3>

                    <div className="text-center space-y-6 pt-4 mb-12">
                      <p className="text-lg md:text-xl text-white/95 font-bold mb-8">
                        Privately rate your current emotional level:<br />
                        <span className="text-sm md:text-base text-white/60 italic mt-2 block">(Piliin ang antas ng iyong galit o inis sa oras na ito.)</span>
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 md:gap-6 max-w-5xl mx-auto items-end pb-8">
                        {[
                          { label: "Calm", range: "0", code: "1f642", color: "from-emerald-500/20 to-emerald-400/10", border: "border-emerald-500/50", glow: "shadow-[0_0_30px_rgba(16,185,129,0.5)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]" },
                          { label: "Irritated", range: "1–3", code: "1f612", color: "from-yellow-500/20 to-yellow-400/10", border: "border-yellow-500/50", glow: "shadow-[0_0_30px_rgba(234,179,8,0.5)] group-hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]" },
                          { label: "Angry", range: "4–6", code: "1f620", color: "from-orange-500/20 to-orange-400/10", border: "border-orange-500/50", glow: "shadow-[0_0_30px_rgba(249,115,22,0.5)] group-hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]" },
                          { label: "Very Angry", range: "7–8", code: "1f621", color: "from-red-500/30 to-red-400/10", border: "border-red-500/60", glow: "shadow-[0_0_35px_rgba(239,68,68,0.6)] group-hover:shadow-[0_0_35px_rgba(239,68,68,0.6)]" },
                          { label: "Exploding", range: "9–10", code: "1f92f", color: "from-red-800/50 to-red-600/30", border: "border-red-500/80", glow: "shadow-[0_0_45px_rgba(220,38,38,0.9)] group-hover:shadow-[0_0_45px_rgba(220,38,38,0.9)]" }
                        ].map((item, idx) => {
                          const isSelected = selectedQuizAnswer === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedQuizAnswer(idx);
                                confetti({ particleCount: 30, spread: 40 });
                              }}
                              className={`group flex flex-col items-center gap-3 p-4 md:p-6 rounded-3xl transition-all duration-300 cursor-pointer border focus:outline-none ${isSelected ? `bg-gradient-to-b ${item.color} ${item.border} scale-[1.15] -translate-y-4 ${item.glow} z-20` : 'border-white/10 hover:border-white/30 hover:bg-white/5'} origin-bottom`}
                              title={item.label}
                            >
                              <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative transform transition-transform duration-500 ease-out z-10 ${isSelected ? 'scale-[1.3]' : 'group-hover:scale-[1.1] group-hover:-translate-y-2'}`}>
                                <img
                                  src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${item.code}/512.webp`}
                                  alt={item.label}
                                  className={`w-full h-full object-contain filter drop-shadow-xl transition-all duration-500 ${isSelected ? 'brightness-110 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]' : 'grayscale-[0.6] opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:brightness-110'}`}
                                  loading="lazy"
                                />
                              </div>
                              <div className="text-center mt-2">
                                <span className={`block text-xl md:text-3xl font-black transition-colors ${isSelected ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>{item.range}</span>
                                <span className={`block text-[10px] md:text-xs font-bold uppercase tracking-wide mt-1 transition-colors ${isSelected ? 'text-mythos-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'text-white/40 group-hover:text-white/70'}`}>{item.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                      <button
                        onClick={() => setSessionStep(2)}
                        className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                      >
                        Bumalik
                      </button>
                      <button
                        onClick={() => {
                          setSelectedQuizAnswer(null); // Reset for future interactions
                          setSessionStep(4);
                        }}
                        disabled={selectedQuizAnswer === null}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 text-sm md:text-base disabled:opacity-50 disabled:pointer-events-none"
                      >
                        Ipagpatuloy
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </>
                ) : activeSession.number === 4 ? (
                  introPage === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 md:p-12 rounded-[3xl] max-w-5xl mx-auto shadow-2xl border border-indigo-500/30 relative overflow-hidden backdrop-blur-xl">
                      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                      <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-400 to-blue-500 pb-2 mb-2 tracking-wide uppercase text-center relative z-10">
                        Activity 3: The Inner Battle
                      </h3>
                      <p className="text-center text-indigo-200/80 mb-8 font-bold text-sm md:text-base italic uppercase tracking-wider relative z-10 drop-shadow-sm">
                        (See how a single thought can trigger an inner storm, and how to calm it.)
                      </p>

                      <div className="relative min-h-[600px] flex flex-col items-center justify-start w-full gap-4 mt-8 pb-10">

                        {/* SITUATION */}
                        <AnimatePresence mode="popLayout">
                          {innerBattleStep >= 0 && (
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center shadow-lg relative z-20">
                              <h4 className="text-xs font-black text-mythos-sky uppercase tracking-widest mb-1">Situation</h4>
                              <p className="text-xl font-bold text-white">"A friend ignores you."</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {innerBattleStep >= 1 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col items-center z-10 relative">
                              <div className="w-0.5 h-8 bg-gradient-to-b from-white/50 to-red-500/80" />
                              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500/80 -mt-0.5" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* AUTOMATIC THOUGHT */}
                        <AnimatePresence mode="popLayout">
                          {innerBattleStep >= 1 && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className={`w-full max-w-md p-5 rounded-2xl text-center shadow-xl relative z-20 transition-all duration-700 ${innerBattleStep >= 7 ? 'bg-black/40 border border-white/10 opacity-40' : 'bg-red-950/60 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]'}`}>
                              <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${innerBattleStep >= 7 ? 'text-white/40' : 'text-red-400'}`}>Automatic Thought</h4>
                              <p className={`text-xl font-bold ${innerBattleStep >= 7 ? 'text-white/40 line-through' : 'text-red-100'}`}>"They don't care about me."</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {innerBattleStep >= 2 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col items-center z-10 relative">
                              <div className={`w-0.5 h-8 transition-colors duration-700 ${innerBattleStep >= 7 ? 'bg-white/10' : 'bg-gradient-to-b from-red-500/80 to-orange-500/80'}`} />
                              <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] transition-colors duration-700 ${innerBattleStep >= 7 ? 'border-t-white/10' : 'border-t-orange-500/80'} -mt-0.5`} />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* EMOTION */}
                        <AnimatePresence mode="popLayout">
                          {innerBattleStep >= 2 && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className={`w-full max-w-md p-4 rounded-2xl text-center shadow-lg transition-all duration-700 ${innerBattleStep >= 7 ? 'bg-black/40 border border-white/10 opacity-40' : 'bg-orange-950/50 border border-orange-500/40'}`}>
                              <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${innerBattleStep >= 7 ? 'text-white/40' : 'text-orange-400'}`}>Emotion</h4>
                              <p className={`text-2xl font-bold ${innerBattleStep >= 7 ? 'text-white/40' : 'text-orange-100'}`}>Anger 😡</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {innerBattleStep >= 3 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col items-center z-10 relative">
                              <div className={`w-0.5 h-8 transition-colors duration-700 ${innerBattleStep >= 7 ? 'bg-white/10' : 'bg-gradient-to-b from-orange-500/80 to-rose-500/80'}`} />
                              <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] transition-colors duration-700 ${innerBattleStep >= 7 ? 'border-t-white/10' : 'border-t-rose-500/80'} -mt-0.5`} />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* BEHAVIOR */}
                        <AnimatePresence mode="popLayout">
                          {innerBattleStep >= 3 && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className={`w-full max-w-md p-4 rounded-2xl text-center shadow-lg transition-all duration-700 ${innerBattleStep >= 7 ? 'bg-black/40 border border-white/10 opacity-40' : 'bg-rose-950/50 border border-rose-500/40'}`}>
                              <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${innerBattleStep >= 7 ? 'text-white/40' : 'text-rose-400'}`}>Behavior</h4>
                              <p className={`text-xl font-bold ${innerBattleStep >= 7 ? 'text-white/40' : 'text-rose-100'}`}>"I'll ignore them too."</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* CHALLENGE THOUGHT BLOCK */}
                        <AnimatePresence>
                          {innerBattleStep >= 4 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col items-center z-10 relative">
                              <div className={`w-0.5 h-8 transition-colors duration-700 ${innerBattleStep >= 7 ? 'bg-white/10' : 'bg-gradient-to-b from-rose-500/80 to-indigo-500/80'}`} />
                              <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] transition-colors duration-700 ${innerBattleStep >= 7 ? 'border-t-white/10' : 'border-t-indigo-500/80'} -mt-0.5`} />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence mode="popLayout">
                          {innerBattleStep >= 4 && (
                            <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={`w-full max-w-2xl bg-indigo-950/80 border border-indigo-400 p-6 rounded-3xl text-center shadow-[0_0_40px_rgba(99,102,241,0.3)] relative z-30 transition-all duration-700 ${innerBattleStep >= 7 ? 'opacity-40 grayscale-[50%] scale-95 border-white/10' : ''}`}>
                              <h4 className="text-xs md:text-sm font-black text-indigo-300 uppercase tracking-widest mb-4 flex justify-center items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-mythos-sky animate-ping"></span>
                                ⚡ Challenge The Thought ⚡
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
                                <AnimatePresence>
                                  {innerBattleStep >= 4 && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white/10 p-4 rounded-xl border border-white/20 hover:bg-white/20 hover:border-mythos-sky/50 transition-all cursor-pointer shadow-sm group">
                                      <div className="text-3xl mb-2 group-hover:-translate-y-1 transition-transform">🤔</div>
                                      <p className="text-[10px] font-black text-white uppercase opacity-70 mb-1">Evidence For</p>
                                      <p className="text-sm font-medium text-indigo-100">"What supports this thought?"</p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                                <AnimatePresence>
                                  {innerBattleStep >= 5 && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white/10 p-4 rounded-xl border border-white/20 hover:bg-white/20 hover:border-emerald-400/50 transition-all cursor-pointer shadow-sm group">
                                      <div className="text-3xl mb-2 group-hover:-translate-y-1 transition-transform">💡</div>
                                      <p className="text-[10px] font-black text-white uppercase opacity-70 mb-1">Evidence Against</p>
                                      <p className="text-sm font-medium text-emerald-100">"What does not support it?"</p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                                <AnimatePresence>
                                  {innerBattleStep >= 6 && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white/10 p-4 rounded-xl border border-white/20 hover:bg-white/20 hover:border-purple-400/50 transition-all cursor-pointer shadow-sm group">
                                      <div className="text-3xl mb-2 group-hover:-translate-y-1 transition-transform">🌍</div>
                                      <p className="text-[10px] font-black text-white uppercase opacity-70 mb-1">Big Picture</p>
                                      <p className="text-sm font-medium text-purple-100">"What else could be happening?"</p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* BALANCED THOUGHT */}
                        <AnimatePresence>
                          {innerBattleStep >= 7 && (
                            <>
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col items-center z-10 relative">
                                <div className="w-1 h-10 bg-gradient-to-b from-indigo-500/80 via-emerald-500/50 to-emerald-400/80" />
                                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-emerald-400/80 -mt-0.5" />
                              </motion.div>
                              <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-lg bg-emerald-950/60 border-2 border-emerald-500/80 p-8 rounded-3xl text-center shadow-[0_0_80px_rgba(16,185,129,0.3)] relative z-30">
                                <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-3 flex justify-center items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                  Balanced Thought
                                </h4>
                                <p className="text-xl md:text-2xl font-black text-emerald-100 italic">"I feel ignored, but I don't know what the other person is experiencing."</p>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>

                      </div>

                      {/* INTERACTIVE CONTROLS */}
                      <div className="flex justify-center items-center mt-6 relative z-30 pt-8 border-t border-indigo-500/20">
                        {innerBattleStep < 7 ? (
                          <div className="flex flex-col items-center gap-3">
                            <span className="text-mythos-sky text-xs md:text-sm font-black uppercase tracking-widest animate-pulse drop-shadow-[0_0_10px_rgba(72,202,228,0.5)]">
                              👇 Pindutin (Click Here) 👇
                            </span>
                            <button
                              onClick={() => setInnerBattleStep(s => s + 1)}
                              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black rounded-xl hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300 flex items-center gap-3 text-sm md:text-base border border-indigo-400/50 bg-opacity-90 backdrop-blur-md"
                            >
                              {innerBattleStep === 0 && "Ano ang maiisip mo? (What's the thought?)"}
                              {innerBattleStep === 1 && "Ano ang mararamdaman mo? (What's the emotion?)"}
                              {innerBattleStep === 2 && "Ano ang sunod na gagawin mo? (What's the behavior?)"}
                              {innerBattleStep === 3 && (
                                <>
                                  <span className="text-mythos-sky">⚔️</span> Suriin: May ebidensya ba? (Evidence For?)
                                </>
                              )}
                              {innerBattleStep === 4 && (
                                <>
                                  <span className="text-emerald-400">💡</span> Ano ang KONTRA ebidensya? (Evidence Against?)
                                </>
                              )}
                              {innerBattleStep === 5 && (
                                <>
                                  <span className="text-purple-400">🌍</span> Ano pa ang pwedeng nangyayari? (What else?)
                                </>
                              )}
                              {innerBattleStep === 6 && (
                                <>
                                  <span className="text-emerald-400">✨</span> Humanap ng Balanse (Find Balanced Thought)
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
                            <button
                              onClick={() => setInnerBattleStep(0)}
                              className="px-6 py-3 border border-white/20 text-white/70 font-bold rounded-xl hover:bg-white/10 transition-all shadow-md"
                            >
                              Ulitin (Restart)
                            </button>
                            <button
                              onClick={() => setIntroPage(1)}
                              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-black rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center w-full md:w-auto shadow-lg"
                            >
                              Susunod (Next Activity)
                              <ChevronRight size={18} className="inline ml-2" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : introPage === 1 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 md:p-12 rounded-[3xl] max-w-5xl mx-auto shadow-2xl border border-teal-500/30 relative overflow-hidden backdrop-blur-xl">
                      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                      <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-500 pb-2 mb-2 tracking-wide uppercase text-center relative z-10">
                        Activity 4: Change the Voice Inside
                      </h3>
                      <p className="text-center text-teal-200/80 mb-8 font-bold text-sm md:text-base italic uppercase tracking-wider relative z-10 drop-shadow-sm">
                        (Transform negative statements into balanced statements.)
                      </p>

                      {/* Example Presentation */}
                      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <motion.div whileHover={{ scale: 1.02, y: -4 }} className="bg-red-950/40 border border-red-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] transition-shadow duration-300 cursor-default">
                          <h4 className="text-red-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2"><span className="text-lg">❌</span> Negative</h4>
                          <p className="text-red-100 font-bold text-lg leading-relaxed">"I have to fight when someone disrespects me."</p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02, y: -4 }} className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-shadow duration-300 cursor-default">
                          <h4 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2"><span className="text-lg">✅</span> Balanced</h4>
                          <p className="text-emerald-100 font-bold text-lg leading-relaxed">"I can stand up for myself without becoming aggressive."</p>
                        </motion.div>
                      </div>

                      {/* Interactive Area */}
                      <div className="relative z-10 bg-black/40 rounded-3xl border border-white/10 p-6 md:p-8">
                        <h4 className="text-white/80 font-black uppercase tracking-widest text-sm mb-6 pb-4 border-b border-white/10 text-center drop-shadow-md">Iyong Turn (Your Turn)</h4>
                        <div className="space-y-6">
                          {[
                            "I'm useless.",
                            "Everyone is against me.",
                            "If someone disrespects me, I have to fight.",
                            "Nobody cares about me."
                          ].map((stmt, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-4 align-top">
                              <motion.div whileHover={{ scale: 1.02, x: 2 }} className="w-full md:w-1/2 bg-red-950/50 border border-red-500/20 hover:border-red-500/40 hover:bg-red-950/70 rounded-xl p-5 transition-all duration-300 cursor-default shadow-sm hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                                <h5 className="text-[10px] font-black uppercase text-red-500/70 mb-1">Negative</h5>
                                <p className="text-red-100 text-base font-semibold">{stmt}</p>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.02, x: -2 }} className="w-full md:w-1/2 relative group">
                                <h5 className="text-[10px] font-black uppercase text-emerald-500/70 mb-1 absolute -top-5 right-2 opacity-0 group-focus-within:opacity-100 transition-opacity">Balanced</h5>
                                <textarea
                                  className="w-full h-full min-h-[80px] bg-emerald-950/30 border border-emerald-500/30 group-hover:border-emerald-500/50 group-hover:bg-emerald-950/40 focus:border-emerald-400/80 hover:bg-emerald-950/40 p-5 rounded-xl text-emerald-100 text-base font-medium resize-none shadow-inner focus:shadow-[0_0_20px_rgba(52,211,153,0.3)] focus:outline-none transition-all duration-300"
                                  placeholder={"Isulat ang balanseng kaisipan... (Write balanced thought...)"}
                                  value={voiceInsideAnswers[idx] || ""}
                                  onChange={(e) => setVoiceInsideAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                />
                              </motion.div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-10 flex justify-between items-center pt-8 border-t border-teal-500/20">
                          <button
                            onClick={() => setIntroPage(0)}
                            className="px-6 py-3 border border-white/20 text-white/70 font-bold rounded-xl hover:bg-white/10 transition-all shadow-md"
                          >
                            Bumalik (Back)
                          </button>
                          <button
                            onClick={async () => {
                              await dbClient.saveResponse(user.id, activeSession!.number, 'voice_inside', voiceInsideAnswers);
                              setIntroPage(2);
                            }}
                            className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-mythos-deep text-lg font-black rounded-xl hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 flex items-center justify-center w-full md:w-auto"
                          >
                            Susunod (Next Activity)
                            <ChevronRight size={18} className="inline ml-2" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : introPage === 2 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 md:p-12 rounded-[3rem] w-full max-w-4xl mx-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-blue-400/30 relative overflow-hidden backdrop-blur-xl">
                      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>
                      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none"></div>

                      <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-400 to-purple-400 pb-2 mb-2 tracking-wide uppercase text-center relative z-10 drop-shadow-md">
                        Activity 5: My Personal Regulation Toolbox
                      </h3>
                      <p className="text-center text-blue-200/80 mb-12 font-bold text-sm md:text-base italic uppercase tracking-wider relative z-10 drop-shadow-sm">
                        (Mga paraan para mapakalma ang sarili)
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mb-12">
                        {[
                          { id: 'breathing', title: "Deep Breathing", icon: "🌬️", desc: "Humugot ng malalim na hininga at dahan-dahang ilabas" },
                          { id: 'counting', title: "Counting", icon: "🔢", desc: "Magbilang upang lumipas ang matinding bugso ng damdamin" },
                          { id: 'music', title: "Listening to Music", icon: "🎧", desc: "Pakinggan ang paboritong nakakakalmang kanta" },
                          { id: 'prayer', title: "Prayer", icon: "🙏", desc: "Magdasal para sa kapayapaan at linaw ng isip" }
                        ].map((item, idx) => {
                          const isDone = completedRegulations.includes(item.id);
                          return (
                            <motion.div
                              key={idx}
                              onClick={() => setActiveRegulationTimer({ id: item.id, title: item.title, icon: item.icon, timeLeft: 60 })}
                              whileHover={{ scale: 1.03, y: -5 }}
                              className={`border p-6 md:p-8 rounded-3xl flex items-start gap-5 transition-all duration-300 shadow-lg group cursor-pointer ${isDone
                                ? 'bg-emerald-950/40 border-emerald-500/40 hover:bg-emerald-900/40'
                                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-blue-400/40'
                                }`}
                            >
                              <div className="text-4xl md:text-5xl drop-shadow-lg group-hover:scale-110 transition-transform origin-center flex flex-col items-center">
                                {item.icon}
                                {isDone && <span className="text-xs bg-emerald-500 text-white rounded-full px-2 py-0.5 mt-2 font-bold shadow-md uppercase">Done</span>}
                              </div>
                              <div>
                                <h4 className={`text-xl md:text-2xl font-black mb-1 transition-colors tracking-wide ${isDone ? 'text-emerald-300' : 'text-white group-hover:text-blue-300'}`}>
                                  {item.title}
                                </h4>
                                <p className={`text-sm md:text-base font-medium leading-relaxed ${isDone ? 'text-emerald-200/70' : 'text-blue-200/70'}`}>
                                  {item.desc}
                                </p>
                                <p className="text-xs font-bold text-white/40 mt-3 flex items-center gap-1 group-hover:text-white/60">
                                  <Clock size={12} /> 1 Minute Activity
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Fullscreen Timer Overlay */}
                      <AnimatePresence>
                        {activeRegulationTimer && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080f1e]/95 backdrop-blur-2xl"
                          >
                            <div className="max-w-2xl w-full mx-auto p-8 text-center flex flex-col items-center">
                              <div className="relative text-8xl md:text-[120px] mb-8 drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]">
                                {activeRegulationTimer.id === 'prayer' && activeRegulationTimer.timeLeft > 0 && (
                                  <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-[-50%] bg-mythos-gold/30 rounded-full blur-[40px] pointer-events-none" />
                                )}
                                <motion.div
                                  animate={
                                    activeRegulationTimer.id === 'breathing'
                                      ? { scale: [1, 1.5, 1.5, 1], rotate: [0, 0, 0, 0] }
                                      : activeRegulationTimer.id === 'music'
                                        ? { scale: [1, 1.1, 1, 1.1, 1], rotate: [-5, 5, -5, 5, 0] }
                                        : { scale: 1 }
                                  }
                                  transition={
                                    activeRegulationTimer.id === 'breathing' || activeRegulationTimer.id === 'music'
                                      ? { duration: 10, repeat: Infinity, ease: "easeInOut" }
                                      : {}
                                  }
                                >
                                  {activeRegulationTimer.icon}
                                </motion.div>
                              </div>
                              <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400 mb-6 drop-shadow-lg tracking-wide uppercase">
                                {activeRegulationTimer.title}
                              </h2>

                              {activeRegulationTimer.id === 'breathing' && activeRegulationTimer.timeLeft > 0 && (
                                <p className="text-xl md:text-3xl text-mythos-sky font-bold mb-8 italic">
                                  {(60 - activeRegulationTimer.timeLeft) % 10 < 4 ? "Humugot ng hininga (Inhale)..." :
                                    (60 - activeRegulationTimer.timeLeft) % 10 < 6 ? "Pigilan (Hold)..." :
                                      "Dahan-dahang ilabas (Exhale)..."}
                                </p>
                              )}

                              {activeRegulationTimer.id === 'counting' && activeRegulationTimer.timeLeft > 0 && (
                                <div className="text-2xl md:text-4xl text-mythos-sky font-black mb-8 tracking-widest tabular-nums">
                                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1, repeat: Infinity }}>
                                    Magbilang: {60 - activeRegulationTimer.timeLeft + 1}
                                  </motion.div>
                                </div>
                              )}

                              {activeRegulationTimer.id === 'music' && activeRegulationTimer.timeLeft > 0 && (
                                <>
                                  <audio autoPlay src="/mythos-theme.mp3" />
                                  <div className="flex gap-3 justify-center items-end h-16 w-full mb-8">
                                    {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                                      <motion.div
                                        key={bar}
                                        animate={{ height: [15, Math.random() * 50 + 20, 15] }}
                                        transition={{ duration: Math.random() * 0.5 + 0.5, repeat: Infinity, ease: 'easeInOut' }}
                                        className="w-3 md:w-4 bg-gradient-to-t from-blue-400 to-indigo-300 rounded-t-full shadow-[0_0_15px_rgba(96,165,250,0.5)]"
                                      />
                                    ))}
                                  </div>
                                </>
                              )}

                              {activeRegulationTimer.id === 'prayer' && activeRegulationTimer.timeLeft > 0 && (
                                <p className="text-xl md:text-2xl text-mythos-gold font-medium mb-8 italic tracking-wide">
                                  Ipikit ang iyong mga mata at humingi ng kapayapaan...<br />(Close your eyes and seek peace...)
                                </p>
                              )}

                              <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                                  <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray="553"
                                    strokeDashoffset={553 - (553 * activeRegulationTimer.timeLeft) / 60}
                                    className="text-blue-500 transition-all duration-1000 ease-linear"
                                  />
                                </svg>
                                {activeRegulationTimer.timeLeft > 0 ? (
                                  <span className="text-5xl md:text-7xl font-black text-white drop-shadow-md">
                                    {activeRegulationTimer.timeLeft}
                                  </span>
                                ) : (
                                  <span className="text-5xl md:text-6xl font-black text-emerald-400 drop-shadow-md">
                                    ✓
                                  </span>
                                )}
                              </div>

                              {activeRegulationTimer.timeLeft === 0 ? (
                                <button
                                  onClick={() => setActiveRegulationTimer(null)}
                                  className="mt-6 px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xl font-black rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-2"
                                >
                                  <CheckCircle size={24} /> Tapos Na (Done)
                                </button>
                              ) : (
                                <button
                                  onClick={() => setActiveRegulationTimer(null)}
                                  className="mt-6 px-8 py-3 border border-white/20 text-white/50 hover:text-white font-bold rounded-xl hover:bg-white/10 transition-all"
                                >
                                  Ihinto (Cancel)
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex justify-between items-center pt-8 border-t border-white/10 relative z-10">
                        <button
                          onClick={() => setIntroPage(1)}
                          className="px-6 py-3 border border-white/20 text-white/70 font-bold rounded-xl hover:bg-white/10 transition-all shadow-md"
                        >
                          Bumalik (Back)
                        </button>
                        <button
                          onClick={() => setSessionStep(4)}
                          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg font-black rounded-xl hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300 flex items-center justify-center w-full md:w-auto"
                        >
                          Pag-usapan Natin (Proceed to Journal)
                          <ChevronRight size={18} className="inline ml-2" />
                        </button>
                      </div>
                    </motion.div>
                  ) : null
                ) : (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 border-b border-white/10 pb-4 mb-6 shadow-sm">
                      {activeSession.number === 1 ? 'PROCESS QUESTIONS' : 'CBT GUIDED THOUGHT RECORD'}
                    </h3>

                    <div className="space-y-8 mt-8">
                      {activeSession.cbtQuestions.map((q) => (
                        <motion.div
                          key={q.id}
                          className="group space-y-4 p-6 md:p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-mythos-sky/30 focus-within:border-mythos-sky/50 focus-within:bg-mythos-deep/40 transition-all duration-300 focus-within:shadow-[0_0_40px_rgba(72,202,228,0.15)] hover:shadow-xl"
                          whileHover={{ scale: 1.01, x: 2 }}
                          whileFocus={{ scale: 1.02, x: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                          <label className="block text-xl md:text-2xl font-black text-mythos-sky group-focus-within:text-mythos-gold leading-relaxed drop-shadow-md transition-colors duration-300 tracking-wide">
                            {q.question}
                          </label>

                          {q.inputType === 'distortion' ? (
                            <select
                              value={distortionSelected}
                              onChange={(e) => {
                                setDistortionSelected(e.target.value);
                                handleCbtAnswerChange(q.id, e.target.value);
                              }}
                              className="w-full px-6 py-5 rounded-2xl glass-input border border-white/10 focus:border-mythos-sky text-lg md:text-xl font-medium shadow-inner focus:shadow-[inset_0_0_20px_rgba(72,202,228,0.1),0_0_20px_rgba(72,202,228,0.3)] bg-white/5 focus:bg-mythos-deep transition-all duration-300 outline-none cursor-pointer"
                            >
                              {DISTORTIONS_LIST.map((dist) => (
                                <option key={dist} value={dist} className="bg-[#0b132b] text-white">
                                  {dist}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <textarea
                              rows={4}
                              value={cbtAnswers[q.id] || ''}
                              onChange={(e) => handleCbtAnswerChange(q.id, e.target.value)}
                              placeholder={q.placeholder}
                              className="w-full px-6 py-5 rounded-2xl glass-input border border-white/10 focus:border-mythos-sky text-lg md:text-xl font-medium resize-none shadow-inner focus:shadow-[inset_0_0_20px_rgba(72,202,228,0.1),0_0_20px_rgba(72,202,228,0.4)] bg-white/5 focus:bg-mythos-deep transition-all duration-300 outline-none placeholder:text-white/20"
                              required
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                      <button
                        onClick={() => activeSession.number === 1 ? setVidPage(0) : setSessionStep(2)}
                        className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                      >
                        Bumalik
                      </button>
                      <button
                        onClick={() => setSessionStep(4)}
                        disabled={activeSession.cbtQuestions.some(q => q.inputType !== 'distortion' && !cbtAnswers[q.id]?.trim())}
                        className="px-8 py-3 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:shadow-none text-sm md:text-base"
                      >
                        Pagsulat ng Journal
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* STEP 4: JOURNAL REFLECTION / COGNITIVE TRIANGLE VIDEO (SESSION 1) OR AI ANALYSIS */}
            {sessionStep === 4 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 md:p-10 rounded-3xl space-y-6">
                {activeSession.number === 1 ? (
                  actPage === 0 ? (
                    <>
                      <h3 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 border-b border-white/10 pb-4 tracking-wide shadow-sm uppercase">
                        Activity 4: My Story Is Not My Identity
                      </h3>

                      <p className="text-lg text-white/90 font-medium leading-relaxed mt-4 drop-shadow-sm">
                        Panoorin ang video ukol sa <strong className="text-mythos-sky">The Cognitive Triangle</strong> upang mas maintindihan kung paano nakakaapekto ang iyong mga naiisip, nararamdaman, at ginagawa sa iyong araw-araw na buhay.
                      </p>

                      <div className="flex justify-center w-full my-8">
                        <video
                          src="/videos/the_cognitive_triangle.mp4"
                          className="w-full max-w-4xl rounded-3xl border border-white/20 shadow-[0_0_60px_rgba(72,202,228,0.3)] bg-black"
                          controls
                          autoPlay
                        />
                      </div>

                      <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10">
                        <button
                          onClick={() => setSessionStep(3)}
                          className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                        >
                          Bumalik
                        </button>
                        <button
                          type="button"
                          onClick={() => setActPage(1)}
                          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 text-sm md:text-base"
                        >
                          Ipagpatuloy
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 border-b border-white/10 pb-4 tracking-wide shadow-sm uppercase">
                        Activity 5: Finding My Strengths
                      </h3>

                      <p className="text-lg text-white/90 font-medium leading-relaxed mt-4 drop-shadow-sm text-center">
                        Piliin ang mga kalakasang tumutugma sa iyong pagkatao. Maaaring pumili ng higit sa isa, at magsulat pa ng iba sa ibaba.
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 my-8 pt-4 pb-4">
                        {['Courage', 'Kindness', 'Creativity', 'Perseverance', 'Humor', 'Responsibility', 'Loyalty', 'Patience', 'Leadership', 'Empathy', 'Determination', 'Self-control'].map((strength) => {
                          const isSelected = selectedStrengths.includes(strength);
                          return (
                            <motion.button
                              key={strength}
                              animate={{
                                scale: isSelected ? 1.15 : 1,
                                y: isSelected ? -8 : 0
                              }}
                              whileHover={{
                                scale: isSelected ? 1.2 : 1.05,
                                y: isSelected ? -12 : -5
                              }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedStrengths(prev => prev.includes(strength) ? prev.filter(s => s !== strength) : [...prev, strength])}
                              className={`group p-6 rounded-2xl flex items-center justify-center text-center cursor-pointer relative overflow-visible transition-colors duration-300 shadow-md border ${isSelected ? 'bg-mythos-sky/40 border-mythos-sky shadow-[0_0_40px_rgba(72,202,228,0.7)] z-50' : 'glass-panel bg-white/5 border-white/10 hover:border-mythos-sky hover:bg-white/10 hover:shadow-[0_0_20px_rgba(72,202,228,0.4)] z-0'}`}
                            >
                              <span className={`text-lg md:text-xl font-bold transition-all z-10 block w-full px-2 ${isSelected ? 'text-mythos-gold drop-shadow-[0_0_15px_rgba(255,215,0,1)]' : 'bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 group-hover:from-mythos-gold group-hover:to-yellow-200'}`}>
                                {strength}
                              </span>
                              {!isSelected && (
                                <div className="absolute inset-0 bg-gradient-to-b from-mythos-sky/0 to-mythos-sky/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className="mt-8 mb-4 max-w-4xl mx-auto">
                        <label className="block text-lg font-bold text-mythos-sky mb-3 drop-shadow-md">Others (Iba pang kalakasan):</label>
                        <textarea
                          value={otherStrengths}
                          onChange={(e) => setOtherStrengths(e.target.value)}
                          placeholder="I-type dito kung mayroon pang ibang kalakasang nais mong idagdag..."
                          className="w-full p-5 glass-input rounded-2xl text-lg md:text-xl font-medium outline-none resize-none shadow-inner border border-white/10 focus:border-mythos-sky focus:shadow-[inset_0_0_20px_rgba(72,202,228,0.1),0_0_20px_rgba(72,202,228,0.4)] bg-white/5 focus:bg-mythos-deep transition-all duration-300 placeholder:text-white/30"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10">
                        <button
                          onClick={() => setActPage(0)}
                          className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                        >
                          Bumalik sa Activity 4
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await dbClient.saveResponse(user.id, activeSession!.number, 'finding_strengths', { strengths: selectedStrengths, other: otherStrengths });
                            setSessionStep(5);
                          }}
                          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 text-sm md:text-base"
                        >
                          Tumuloy sa Pagsusulit
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </>
                  )
                ) : activeSession.number === 2 ? (
                  <>
                    <div className="text-center space-y-6 pt-4 mb-12">
                      <p className="text-lg md:text-xl text-white/95 font-bold mb-4 drop-shadow-md">
                        What usually happens to you when your anger reaches 7 or above?<br />
                        <span className="text-sm md:text-base text-white/60 italic mt-2 block">(Ano ang karaniwang nangyayari sa iyo kapag umaabot sa 7 o higit pa ang iyong galit?)</span>
                      </p>

                      <p className="text-xs text-mythos-sky/80 uppercase font-bold tracking-widest mb-6 drop-shadow-md">Select all that apply:</p>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto items-stretch pb-8">
                        {[
                          { label: "Shouting", icon: "🗣️", filipino: "Sumisigaw", hoverColor: "hover:border-red-400/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-white/10", activeColor: "bg-red-900/30 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.5)]", accent: "text-red-300 group-hover:text-red-200" },
                          { label: "Insulting", icon: "🤬", filipino: "Nang-iinsulto", hoverColor: "hover:border-orange-400/60 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:bg-white/10", activeColor: "bg-orange-900/30 border-orange-500/60 shadow-[0_0_30px_rgba(249,115,22,0.5)]", accent: "text-orange-300 group-hover:text-orange-200" },
                          { label: "Fighting", icon: "🥊", filipino: "Nakikipag-away", hoverColor: "hover:border-pink-400/60 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:bg-white/10", activeColor: "bg-pink-900/30 border-pink-500/60 shadow-[0_0_30px_rgba(236,72,153,0.5)]", accent: "text-pink-300 group-hover:text-pink-200" },
                          { label: "Threatening", icon: "⚠️", filipino: "Nagbabanta", hoverColor: "hover:border-yellow-400/60 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:bg-white/10", activeColor: "bg-yellow-900/30 border-yellow-500/60 shadow-[0_0_30px_rgba(234,179,8,0.5)]", accent: "text-yellow-300 group-hover:text-yellow-200" },
                          { label: "Walking Away", icon: "🚶", filipino: "Umaalis", hoverColor: "hover:border-emerald-400/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-white/10", activeColor: "bg-emerald-900/30 border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.5)]", accent: "text-emerald-300 group-hover:text-emerald-200" },
                          { label: "Crying", icon: "😢", filipino: "Umiiyak", hoverColor: "hover:border-blue-400/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:bg-white/10", activeColor: "bg-blue-900/30 border-blue-500/60 shadow-[0_0_30px_rgba(59,130,246,0.5)]", accent: "text-blue-300 group-hover:text-blue-200" },
                          { label: "Shutting Down", icon: "😶", filipino: "Nanahimik", hoverColor: "hover:border-slate-400/60 hover:shadow-[0_0_20px_rgba(148,163,184,0.4)] hover:bg-white/10", activeColor: "bg-slate-900/30 border-slate-500/60 shadow-[0_0_30px_rgba(148,163,184,0.5)]", accent: "text-slate-300 group-hover:text-slate-200" },
                          { label: "Throwing Things", icon: "💥", filipino: "Nagbabato ng gamit", hoverColor: "hover:border-purple-400/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:bg-white/10", activeColor: "bg-purple-900/30 border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.5)]", accent: "text-purple-300 group-hover:text-purple-200" },
                          { label: "Posting Online", icon: "📱", filipino: "Nagpo-post sa social media", hoverColor: "hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-white/10", activeColor: "bg-cyan-900/30 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.5)]", accent: "text-cyan-300 group-hover:text-cyan-200" }
                        ].map((item, idx) => {
                          const isSelected = selectedAggressions.includes(item.label);
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (!isExplanationRevealed) {
                                  setSelectedAggressions(prev =>
                                    prev.includes(item.label) ? prev.filter(a => a !== item.label) : [...prev, item.label]
                                  )
                                }
                              }}
                              className={`group flex items-center justify-between px-4 py-3 md:px-6 md:py-4 rounded-3xl transition-all duration-300 cursor-pointer border focus:outline-none backdrop-blur-md transform ${!isExplanationRevealed ? 'hover:scale-110' : ''} bg-white/5 ${isSelected ? `scale-105 z-10 ${item.activeColor}` : `border-white/10 ${!isExplanationRevealed ? item.hoverColor : 'opacity-60'}`} text-left`}
                            >
                              <div>
                                <span className={`block text-base md:text-lg font-black transition-colors ${isSelected ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{item.label}</span>
                                <span className={`block text-[10px] md:text-[11px] font-bold mt-1 transition-colors ${isSelected ? item.accent : 'text-white/40 group-hover:' + item.accent}`}>{item.filipino}</span>
                              </div>
                              <div className={`text-2xl md:text-3xl transition-all duration-300 drop-shadow-md ${isSelected ? 'scale-125 grayscale-0' : 'group-hover:scale-125 grayscale-[0.8] opacity-70 group-hover:opacity-100 group-hover:grayscale-[0.2]'}`}>{item.icon}</div>
                            </button>
                          );
                        })}
                      </div>

                      <AnimatePresence>
                        {isExplanationRevealed && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="max-w-4xl mx-auto p-8 md:p-12 rounded-[2rem] bg-gradient-to-br from-[#0b132b] to-mythos-deep border border-mythos-gold/40 shadow-[0_0_50px_rgba(255,215,0,0.15)] relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-mythos-gold/15 to-transparent pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-10 items-center text-center md:text-left">
                              <div className="text-6xl md:text-7xl drop-shadow-[0_0_25px_rgba(255,215,0,0.6)] animate-bounce">💡</div>
                              <div className="flex-1">
                                <span className="block text-sm md:text-base font-black text-mythos-gold tracking-widest uppercase mb-2">Katotohanan</span>
                                <p className="text-3xl md:text-4xl font-extrabold text-white leading-tight md:leading-snug">
                                  Anger is an emotion.<br className="hidden md:block" />
                                  <span className="text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] block mt-2">Aggression is a behavior.</span>
                                </p>
                                <p className="text-lg md:text-xl text-white/80 mt-4 font-bold italic">They are not the same thing.</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                      <button
                        onClick={() => {
                          if (isExplanationRevealed) {
                            setIsExplanationRevealed(false);
                          } else {
                            setSessionStep(3);
                          }
                        }}
                        className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                      >
                        Bumalik
                      </button>
                      <button
                        onClick={async () => {
                          if (!isExplanationRevealed) {
                            setIsExplanationRevealed(true);
                            confetti({ particleCount: 50, spread: 60 });
                          } else {
                            await dbClient.saveResponse(user.id, activeSession!.number, 'anger_aggressions', selectedAggressions);
                            setIsExplanationRevealed(false);
                            setSessionStep(5);
                          }
                        }}
                        disabled={selectedAggressions.length === 0}
                        className={`flex items-center gap-2 px-8 py-3 font-black rounded-xl hover:scale-105 transition-all duration-300 text-sm md:text-base disabled:opacity-50 disabled:pointer-events-none ${!isExplanationRevealed ? 'bg-gradient-to-r from-mythos-gold to-yellow-400 text-mythos-deep hover:shadow-[0_0_20px_rgba(255,215,0,0.5)]' : 'bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep hover:shadow-[0_0_20px_rgba(72,202,228,0.5)]'}`}
                      >
                        {!isExplanationRevealed ? 'I-lock ang Sagot' : 'Ipagpatuloy'}
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </>
                ) : activeSession.number === 4 ? (
                  <div className="animate-fade-in p-6 md:p-10 bg-gradient-to-br from-[#0a1122] to-mythos-deep border border-mythos-sky/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(72,202,228,0.15)] relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-mythos-sky/20 blur-[100px] pointer-events-none rounded-full"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[80px] pointer-events-none rounded-full"></div>

                    <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-sky to-blue-400 mb-2 drop-shadow-md tracking-wider uppercase relative z-10">
                      Activity 6: Create a Digital Card
                    </h3>

                    <div className="mt-8 relative z-10 bg-black/40 p-8 rounded-3xl border border-white/10 shadow-inner">
                      <p className="text-xl md:text-3xl text-mythos-gold font-black mb-8 italic tracking-wide">
                        "WHEN I FEEL ANGRY, I WILL:"
                      </p>
                      <div className="space-y-6">
                        {[0, 1, 2].map((idx) => (
                          <div key={idx} className="flex gap-4 items-center group">
                            <span className="text-3xl font-black text-mythos-sky/80 group-focus-within:text-mythos-gold transition-colors">{idx + 1}.</span>
                            <div className="relative w-full">
                              <input
                                type="text"
                                value={digitalCard[idx]}
                                onChange={(e) => {
                                  const newObj = [...digitalCard];
                                  newObj[idx] = e.target.value;
                                  setDigitalCard(newObj);
                                }}
                                className="bg-transparent border-b-2 border-mythos-sky/30 w-full text-lg md:text-2xl text-white font-medium focus:border-mythos-gold focus:outline-none transition-colors py-2 px-2 placeholder:text-white/20"
                                placeholder="I-type dito ang gagawin mo..."
                              />
                              <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-mythos-gold to-yellow-300 w-0 group-focus-within:w-full transition-all duration-500"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10 w-full relative z-10">
                      <button
                        onClick={() => setSessionStep(3)}
                        className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                      >
                        Bumalik
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await dbClient.saveResponse(user.id, activeSession.number, 'digital_card', digitalCard);
                          setSessionStep(5);
                        }}
                        disabled={digitalCard.some(answer => !answer.trim())}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all duration-300 text-sm md:text-base disabled:opacity-50 disabled:pointer-events-none"
                      >
                        Ipagpatuloy
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-mythos-gold">
                      Journal and Reflection
                      <span className="block text-sm font-semibold text-mythos-sky mt-1">Dyurnal at Repleksyon</span>
                    </h3>
                    <p className="text-xs text-white/60 font-sans">
                      Write your general thoughts or reflection on this session. Share freely — this is your safe space.
                      <em className="text-mythos-sky block mt-1">
                        (Isulat ang iyong pangkalahatang kaisipan o repleksyon sa session na ito. Ibahagi nang malaya — ito ay iyong ligtas na espasyo.)
                      </em>
                    </p>

                    <textarea
                      rows={6}
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      placeholder='Write your thoughts here... / Isulat dito ang iyong mga saloobin at nararamdaman...'
                      className="w-full px-4 py-3 rounded-lg glass-input text-sm resize-none"
                      required
                    />

                    {isAiLoading && (
                      <div className="text-center py-4">
                        <span className="text-xs text-mythos-sky animate-pulse">Sinusuri ng AI Counselor ang iyong isinulat...</span>
                      </div>
                    )}

                    {aiResult && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs leading-relaxed text-emerald-450">
                        <p className="font-bold">✓ Your response has been successfully submitted!</p>
                        <p className="mt-1">(Ang iyong sagot ay matagumpay na naipadala!)</p>
                      </motion.div>
                    )}

                    <div className="flex justify-between items-center mt-6">
                      <button
                        onClick={() => setSessionStep(3)}
                        disabled={isAiLoading}
                        className="px-5 py-2 rounded-lg border border-white/20 hover:bg-white/5 text-sm"
                      >
                        Bumalik
                      </button>
                      <div className="flex gap-2">
                        {!aiResult ? (
                          <button
                            type="button"
                            onClick={analyzeReflection}
                            disabled={!journalText.trim() || isAiLoading}
                            className="px-6 py-2.5 bg-mythos-gold text-mythos-deep font-bold rounded-lg text-sm hover:bg-yellow-500 transition-all duration-200 disabled:opacity-50"
                          >
                            Ipasa ang Sagot
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (activeSession.number === 1 || activeSession.number === 2) {
                                setSessionStep(5);
                              } else {
                                setSessionStep(6);
                              }
                            }}
                            className="px-6 py-2.5 bg-mythos-sky text-mythos-deep font-bold rounded-lg text-sm hover:bg-mythos-teal transition-all duration-200"
                          >
                            Ipagpatuloy sa Pagtatapos
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* STEP 5: END-OF-SESSION QUIZ OR REFLECTION */}
            {sessionStep === 5 && activeSession && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6 md:p-10 rounded-3xl space-y-6">
                {activeSession.number === 1 ? (
                  <>
                    <h3 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold to-yellow-200 border-b border-white/10 pb-4 tracking-wide shadow-sm uppercase">
                      Reflection on My Qualities
                    </h3>
                    <p className="text-lg text-white/90 font-medium my-6 md:text-xl leading-relaxed text-center">
                      Select three qualities you believe you possess or want to develop, and complete the statements below:
                    </p>

                    <div className="space-y-4 mt-8 max-w-4xl mx-auto">
                      <motion.div
                        whileHover={{ scale: 1.02, x: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="group space-y-4 p-5 md:p-8 rounded-[2rem] border border-transparent hover:border-mythos-sky/30 focus-within:border-mythos-sky/60 focus-within:bg-mythos-deep/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(72,202,228,0.15)] focus-within:shadow-[0_0_40px_rgba(72,202,228,0.25)] bg-white/0 hover:bg-white/5"
                      >
                        <label className="block text-xl md:text-2xl font-black text-mythos-sky group-hover:text-mythos-gold group-focus-within:text-mythos-gold drop-shadow-md transition-colors duration-300">
                          1. One strength I already have is___________
                          <em className="text-sm md:text-base italic font-bold text-white/60 bg-black/40 px-4 py-1.5 rounded-xl ml-0 md:ml-3 mt-3 md:mt-0 block md:inline-block border border-white/5 group-hover:text-white/90 transition-colors shadow-inner">
                            (Ang isang kalakasang mayroon na ako ay___________)
                          </em>
                        </label>
                        <input
                          type="text"
                          value={strengthReflect1}
                          onChange={(e) => setStrengthReflect1(e.target.value)}
                          placeholder="I-type ang iyong sagot dito..."
                          className="w-full p-5 glass-input rounded-2xl text-lg md:text-xl font-medium outline-none border border-white/10 focus:border-mythos-sky focus:shadow-[inset_0_0_20px_rgba(72,202,228,0.15),0_0_20px_rgba(72,202,228,0.5)] bg-white/5 focus:bg-mythos-deep transition-all duration-300 placeholder:text-white/20"
                        />
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02, x: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="group space-y-4 p-5 md:p-8 rounded-[2rem] border border-transparent hover:border-mythos-sky/30 focus-within:border-mythos-sky/60 focus-within:bg-mythos-deep/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(72,202,228,0.15)] focus-within:shadow-[0_0_40px_rgba(72,202,228,0.25)] bg-white/0 hover:bg-white/5"
                      >
                        <label className="block text-xl md:text-2xl font-black text-mythos-sky group-hover:text-mythos-gold group-focus-within:text-mythos-gold drop-shadow-md transition-colors duration-300">
                          2. One strength I want to develop is___________
                          <em className="text-sm md:text-base italic font-bold text-white/60 bg-black/40 px-4 py-1.5 rounded-xl ml-0 md:ml-3 mt-3 md:mt-0 block md:inline-block border border-white/5 group-hover:text-white/90 transition-colors shadow-inner">
                            (Ang kalakasang gusto ko pang linangin ay___________)
                          </em>
                        </label>
                        <input
                          type="text"
                          value={strengthReflect2}
                          onChange={(e) => setStrengthReflect2(e.target.value)}
                          placeholder="I-type ang iyong sagot dito..."
                          className="w-full p-5 glass-input rounded-2xl text-lg md:text-xl font-medium outline-none border border-white/10 focus:border-mythos-sky focus:shadow-[inset_0_0_20px_rgba(72,202,228,0.15),0_0_20px_rgba(72,202,228,0.5)] bg-white/5 focus:bg-mythos-deep transition-all duration-300 placeholder:text-white/20"
                        />
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02, x: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="group space-y-4 p-5 md:p-8 rounded-[2rem] border border-transparent hover:border-mythos-sky/30 focus-within:border-mythos-sky/60 focus-within:bg-mythos-deep/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(72,202,228,0.15)] focus-within:shadow-[0_0_40px_rgba(72,202,228,0.25)] bg-white/0 hover:bg-white/5"
                      >
                        <label className="block text-xl md:text-2xl font-black text-mythos-sky group-hover:text-mythos-gold group-focus-within:text-mythos-gold drop-shadow-md transition-colors duration-300">
                          3. Others have noticed that one of my strengths is___________
                          <em className="text-sm md:text-base italic font-bold text-white/60 bg-black/40 px-4 py-1.5 rounded-xl ml-0 md:ml-3 mt-3 md:mt-0 block md:inline-block border border-white/5 group-hover:text-white/90 transition-colors shadow-inner">
                            (Napapansin ng iba na isa sa aking kalakasan ay___________)
                          </em>
                        </label>
                        <input
                          type="text"
                          value={strengthReflect3}
                          onChange={(e) => setStrengthReflect3(e.target.value)}
                          placeholder="I-type ang iyong sagot dito..."
                          className="w-full p-5 glass-input rounded-2xl text-lg md:text-xl font-medium outline-none border border-white/10 focus:border-mythos-sky focus:shadow-[inset_0_0_20px_rgba(72,202,228,0.15),0_0_20px_rgba(72,202,228,0.5)] bg-white/5 focus:bg-mythos-deep transition-all duration-300 placeholder:text-white/20"
                        />
                      </motion.div>
                    </div>

                    <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setSessionStep(4);
                          setActPage(1); // Bumalik sa Activity 5
                        }}
                        className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-base font-bold shadow-md"
                      >
                        Bumalik sa Strengths List
                      </button>
                      <button
                        type="button"
                        disabled={!strengthReflect1.trim() || !strengthReflect2.trim() || !strengthReflect3.trim()}
                        onClick={() => setSessionStep(6)}
                        className="px-8 py-3 bg-gradient-to-r from-mythos-gold to-yellow-300 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all duration-300 text-sm md:text-base disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                      >
                        Tapusin ang Session
                      </button>
                    </div>
                  </>
                ) : activeSession.number === 2 ? (
                  <>
                    {actPage === 0 ? (
                      <div className="animate-fade-in">
                        <div className="flex flex-col items-center justify-center min-h-[50vh] py-8">
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-center space-y-12 max-w-4xl mx-auto w-full"
                          >
                            <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold via-yellow-200 to-amber-500 drop-shadow-[0_0_15px_rgba(255,215,0,0.4)] tracking-widest uppercase">
                              Activity 3: My Shadow
                            </h3>

                            <div className="relative mt-8 md:mt-12">
                              <div className="absolute -inset-4 bg-gradient-to-r from-mythos-sky/0 via-mythos-sky/10 to-mythos-sky/0 blur-xl rounded-full"></div>
                              <div className="relative p-10 md:p-14 bg-black/50 rounded-[3rem] border border-white/10 shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(72,202,228,0.15)] backdrop-blur-md">
                                <div className="absolute top-4 left-6 text-6xl md:text-8xl text-mythos-sky/20 font-serif leading-none">"</div>
                                <p className="text-2xl md:text-4xl text-white font-black leading-snug drop-shadow-lg z-10 relative">
                                  A shadow represents parts of ourselves that we may not always understand<span className="text-mythos-gold md:text-5xl font-sans font-light">—</span><br className="hidden md:block mb-4" />
                                  <span className="text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]">anger</span>,{' '}
                                  <span className="text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">fear</span>,{' '}
                                  <span className="text-slate-400 drop-shadow-[0_0_10px_rgba(148,163,184,0.5)]">insecurity</span>,{' '}
                                  <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">jealousy</span>,{' '}
                                  <span className="text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.5)]">hurt</span>, or{' '}
                                  <span className="text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]">impulsive reactions</span>.
                                </p>
                                <p className="text-sm md:text-lg text-white/60 italic mt-8 font-medium font-serif leading-relaxed">
                                  (Ang "anino" ay kumakatawan sa mga bahagi ng ating sarili na hindi palaging natin nauunawaan—katulad ng galit, takot, kawalan ng kapanatagan, selos, sakit, o pabiglang reaksyon.)
                                </p>
                                <div className="absolute bottom-[-10px] right-6 text-6xl md:text-8xl text-mythos-sky/20 font-serif leading-none rotate-180">"</div>
                              </div>
                            </div>
                          </motion.div>
                        </div>

                        <div className="flex justify-between items-center mt-8 pt-8 border-t border-white/10 max-w-4xl mx-auto w-full">
                          <button
                            onClick={() => setSessionStep(4)}
                            className="px-6 py-3 md:px-8 md:py-3.5 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-lg font-bold shadow-md"
                          >
                            Bumalik
                          </button>

                          <button
                            type="button"
                            onClick={() => setActPage(1)}
                            className="group flex items-center gap-3 px-8 py-3 md:px-10 md:py-4 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-110 hover:shadow-[0_0_30px_rgba(72,202,228,0.6)] transition-all duration-300 text-sm md:text-lg overflow-hidden relative"
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              Magtungo sa Shadow Map
                              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-out" />
                          </button>
                        </div>
                      </div>
                    ) : actPage === 1 ? (
                      <div className="animate-fade-in">
                        <div className="flex flex-col items-center justify-center min-h-[50vh] py-8">
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="text-center space-y-12 max-w-5xl mx-auto w-full"
                          >
                            <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold via-yellow-200 to-amber-500 drop-shadow-[0_0_15px_rgba(255,215,0,0.4)] tracking-widest uppercase">
                              Shadow Map
                            </h3>

                            <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto">
                              Halimbawa kung paano nagkakaroon ng chain reaction bago umabot sa ating "usual reaction". Makikita mo kung paano nagsimula at nauwi sa galit ang sitwasyon.
                            </p>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-4 lg:gap-8 mt-12 w-full relative pt-8 pb-16">
                              {/* Connector Line for Desktop */}
                              <div className="hidden md:block absolute top-[45%] left-[5%] right-[5%] h-2 bg-gradient-to-r from-blue-500/40 via-orange-400/50 to-red-600/50 -z-10 rounded-full blur-[4px]"></div>

                              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="w-72 md:w-80 max-w-[90vw] z-10 shrink-0">
                                <div className="bg-gradient-to-b from-blue-900/80 to-[#0b132b]/95 p-8 rounded-[2.5rem] border-t border-l border-white/20 border-r border-b border-black/80 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_15px_rgba(59,130,246,0.2)] backdrop-blur-md relative group hover:-translate-y-3 transition-transform duration-300 min-h-[200px] flex flex-col justify-center">
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-blue-800 to-blue-950 rounded-full flex items-center justify-center border border-blue-400/80 shadow-[0_0_25px_rgba(59,130,246,0.6),inset_0_2px_5px_rgba(255,255,255,0.4)] text-3xl group-hover:scale-125 transition-transform z-10 drop-shadow-md">⚡</div>
                                  <h4 className="text-blue-300 text-sm font-black uppercase tracking-[0.2em] mt-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">Ang Simula</h4>
                                  <h3 className="text-2xl font-black text-white mt-1 drop-shadow-md">My Trigger</h3>
                                  <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-200/30 to-transparent my-4 w-full"></div>
                                  <p className="text-blue-100 text-lg font-bold italic drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]">"Someone insults me"</p>
                                </div>
                              </motion.div>

                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-mythos-sky hidden md:block z-20 -mx-6 drop-shadow-[0_0_15px_rgba(72,202,228,0.8)] relative">
                                <ChevronRight strokeWidth={4} size={64} className="group-hover:scale-110 transition-transform" />
                              </motion.div>
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-mythos-sky md:hidden my-2 z-20">
                                <div className="w-1.5 h-10 bg-gradient-to-b from-blue-400 to-mythos-gold shadow-[0_0_15px_rgba(72,202,228,0.6)] mx-auto rounded-full"></div>
                              </motion.div>

                              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="w-72 md:w-80 max-w-[90vw] z-10 shrink-0">
                                <div className="bg-gradient-to-b from-yellow-900/80 to-[#0b132b]/95 p-8 rounded-[2.5rem] border-t border-l border-white/20 border-r border-b border-black/80 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_15px_rgba(255,215,0,0.2)] backdrop-blur-md relative group hover:-translate-y-3 transition-transform duration-300 min-h-[200px] flex flex-col justify-center">
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-yellow-800 to-yellow-950 rounded-full flex items-center justify-center border border-mythos-gold/80 shadow-[0_0_25px_rgba(255,215,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.4)] text-3xl group-hover:scale-125 transition-transform z-10 drop-shadow-md">🧠</div>
                                  <h4 className="text-mythos-gold text-sm font-black uppercase tracking-[0.2em] mt-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">Ang Naisip</h4>
                                  <h3 className="text-2xl font-black text-white mt-1 drop-shadow-md">My Thought</h3>
                                  <div className="h-[2px] bg-gradient-to-r from-transparent via-yellow-200/30 to-transparent my-4 w-full"></div>
                                  <p className="text-yellow-100 text-lg font-bold italic drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]">"I have to fight back"</p>
                                </div>
                              </motion.div>

                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-orange-400 hidden md:block z-20 -mx-6 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)] relative">
                                <ChevronRight strokeWidth={4} size={64} className="group-hover:scale-110 transition-transform" />
                              </motion.div>
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-orange-400 md:hidden my-2 z-20">
                                <div className="w-1.5 h-10 bg-gradient-to-b from-mythos-gold to-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)] mx-auto rounded-full"></div>
                              </motion.div>

                              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.0 }} className="w-72 md:w-80 max-w-[90vw] z-10 shrink-0">
                                <div className="bg-gradient-to-b from-orange-900/80 to-[#1a0f0f]/95 p-8 rounded-[2.5rem] border-t border-l border-white/20 border-r border-b border-black/80 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_15px_rgba(249,115,22,0.2)] backdrop-blur-md relative group hover:-translate-y-3 transition-transform duration-300 min-h-[200px] flex flex-col justify-center">
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-orange-800 to-orange-950 rounded-full flex items-center justify-center border border-orange-400/80 shadow-[0_0_25px_rgba(249,115,22,0.6),inset_0_2px_5px_rgba(255,255,255,0.4)] text-3xl group-hover:scale-125 transition-transform z-10 drop-shadow-md pt-0.5">❤️‍🔥</div>
                                  <h4 className="text-orange-400 text-sm font-black uppercase tracking-[0.2em] mt-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">Ang Naramdaman</h4>
                                  <h3 className="text-2xl font-black text-white mt-1 drop-shadow-md">My Feeling</h3>
                                  <div className="h-[2px] bg-gradient-to-r from-transparent via-orange-200/30 to-transparent my-4 w-full"></div>
                                  <p className="text-orange-100 text-lg font-bold italic drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]">"Anger"</p>
                                </div>
                              </motion.div>

                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="text-red-500 hidden md:block z-20 -mx-6 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] relative">
                                <ChevronRight strokeWidth={4} size={64} className="group-hover:scale-110 transition-transform" />
                              </motion.div>
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="text-red-500 md:hidden my-2 z-20">
                                <div className="w-1.5 h-10 bg-gradient-to-b from-orange-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.6)] mx-auto rounded-full"></div>
                              </motion.div>

                              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4 }} className="w-72 md:w-80 max-w-[90vw] z-10 shrink-0">
                                <div className="bg-gradient-to-b from-red-900/80 to-[#220707]/95 p-8 rounded-[2.5rem] border-t border-l border-white/20 border-r border-b border-black/80 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_15px_rgba(239,68,68,0.2)] backdrop-blur-md relative group hover:-translate-y-3 transition-transform duration-300 min-h-[200px] flex flex-col justify-center">
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-red-800 to-red-950 rounded-full flex items-center justify-center border border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.8),inset_0_2px_5px_rgba(255,255,255,0.5)] text-3xl group-hover:scale-125 transition-transform z-10 drop-shadow-md">💥</div>
                                  <h4 className="text-red-400 text-sm font-black uppercase tracking-[0.2em] mt-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">Ang Ginawa</h4>
                                  <h3 className="text-3xl font-black text-white mt-1 leading-tight drop-shadow-lg">My Usual Reaction</h3>
                                  <div className="h-[2px] bg-gradient-to-r from-transparent via-red-200/30 to-transparent my-4 w-full"></div>
                                  <p className="text-red-100 text-xl font-bold italic drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]">"Shout or fight"</p>
                                </div>
                              </motion.div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.6, duration: 0.5, ease: "easeOut" }}
                            className="text-center space-y-12 max-w-5xl mx-auto w-full mt-16 pt-16 border-t border-white/10"
                          >
                            <h4 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-sky to-blue-300 drop-shadow-[0_0_15px_rgba(72,202,228,0.4)] tracking-wide">
                              Gumawa ng Sariling Shadow Map
                            </h4>

                            <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto">
                              Subukan mong ilagay ang iyong naging karanasan. Ano ang nagsimula ng galit, ano ang naisip mo, naramdaman, at ano ang naging reaksyon mo?
                            </p>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-4 lg:gap-8 mt-12 w-full relative pt-8 pb-16">
                              {/* Connector Line for Desktop */}
                              <div className="hidden md:block absolute top-[45%] left-[5%] right-[5%] h-2 bg-gradient-to-r from-blue-500/40 via-orange-400/50 to-red-600/50 -z-10 rounded-full blur-[4px]"></div>

                              <div className="w-72 md:w-80 max-w-[90vw] z-10 shrink-0">
                                <div className="bg-gradient-to-b from-blue-900/80 to-[#0b132b]/95 p-8 rounded-[2.5rem] border-t border-l border-white/20 border-r border-b border-black/80 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_15px_rgba(59,130,246,0.2)] backdrop-blur-md relative group transition-transform duration-300 min-h-[220px] flex flex-col justify-start">
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-blue-800 to-blue-950 rounded-full flex items-center justify-center border border-blue-400/80 shadow-[0_0_25px_rgba(59,130,246,0.6),inset_0_2px_5px_rgba(255,255,255,0.4)] text-3xl group-hover:scale-110 transition-transform z-10 drop-shadow-md">⚡</div>
                                  <h4 className="text-blue-300 text-sm font-black uppercase tracking-[0.2em] mt-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">Ang Simula</h4>
                                  <h3 className="text-2xl font-black text-white mt-1 drop-shadow-md">My Trigger</h3>
                                  <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-200/30 to-transparent my-4 w-full"></div>
                                  <textarea
                                    value={shadowMapTrigger}
                                    onChange={(e) => setShadowMapTrigger(e.target.value)}
                                    placeholder="Simulan dito..."
                                    className="w-full bg-black/30 border border-blue-400/30 rounded-xl p-3 text-blue-100 font-medium placeholder-blue-300/30 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none h-24 text-center transition-all"
                                  />
                                </div>
                              </div>

                              <div className="text-mythos-sky hidden md:block z-20 -mx-6 drop-shadow-[0_0_15px_rgba(72,202,228,0.8)] relative">
                                <ChevronRight strokeWidth={4} size={64} className="group-hover:scale-110 transition-transform" />
                              </div>
                              <div className="text-mythos-sky md:hidden my-2 z-20">
                                <div className="w-1.5 h-10 bg-gradient-to-b from-blue-400 to-mythos-gold shadow-[0_0_15px_rgba(72,202,228,0.6)] mx-auto rounded-full"></div>
                              </div>

                              <div className="w-72 md:w-80 max-w-[90vw] z-10 shrink-0">
                                <div className="bg-gradient-to-b from-yellow-900/80 to-[#0b132b]/95 p-8 rounded-[2.5rem] border-t border-l border-white/20 border-r border-b border-black/80 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_15px_rgba(255,215,0,0.2)] backdrop-blur-md relative group transition-transform duration-300 min-h-[220px] flex flex-col justify-start">
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-yellow-800 to-yellow-950 rounded-full flex items-center justify-center border border-mythos-gold/80 shadow-[0_0_25px_rgba(255,215,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.4)] text-3xl group-hover:scale-110 transition-transform z-10 drop-shadow-md">🧠</div>
                                  <h4 className="text-mythos-gold text-sm font-black uppercase tracking-[0.2em] mt-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">Ang Naisip</h4>
                                  <h3 className="text-2xl font-black text-white mt-1 drop-shadow-md">My Thought</h3>
                                  <div className="h-[2px] bg-gradient-to-r from-transparent via-yellow-200/30 to-transparent my-4 w-full"></div>
                                  <textarea
                                    value={shadowMapThought}
                                    onChange={(e) => setShadowMapThought(e.target.value)}
                                    placeholder="Ano ang naisip mo?"
                                    className="w-full bg-black/30 border border-mythos-gold/30 rounded-xl p-3 text-yellow-100 font-medium placeholder-yellow-300/30 focus:outline-none focus:border-mythos-gold focus:ring-1 focus:ring-mythos-gold resize-none h-24 text-center transition-all"
                                  />
                                </div>
                              </div>

                              <div className="text-orange-400 hidden md:block z-20 -mx-6 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)] relative">
                                <ChevronRight strokeWidth={4} size={64} className="group-hover:scale-110 transition-transform" />
                              </div>
                              <div className="text-orange-400 md:hidden my-2 z-20">
                                <div className="w-1.5 h-10 bg-gradient-to-b from-mythos-gold to-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)] mx-auto rounded-full"></div>
                              </div>

                              <div className="w-72 md:w-80 max-w-[90vw] z-10 shrink-0">
                                <div className="bg-gradient-to-b from-orange-900/80 to-[#1a0f0f]/95 p-8 rounded-[2.5rem] border-t border-l border-white/20 border-r border-b border-black/80 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_15px_rgba(249,115,22,0.2)] backdrop-blur-md relative group transition-transform duration-300 min-h-[220px] flex flex-col justify-start">
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-orange-800 to-orange-950 rounded-full flex items-center justify-center border border-orange-400/80 shadow-[0_0_25px_rgba(249,115,22,0.6),inset_0_2px_5px_rgba(255,255,255,0.4)] text-3xl group-hover:scale-110 transition-transform z-10 drop-shadow-md pt-0.5">❤️‍🔥</div>
                                  <h4 className="text-orange-400 text-sm font-black uppercase tracking-[0.2em] mt-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">Ang Naramdaman</h4>
                                  <h3 className="text-2xl font-black text-white mt-1 drop-shadow-md">My Feeling</h3>
                                  <div className="h-[2px] bg-gradient-to-r from-transparent via-orange-200/30 to-transparent my-4 w-full"></div>
                                  <textarea
                                    value={shadowMapFeeling}
                                    onChange={(e) => setShadowMapFeeling(e.target.value)}
                                    placeholder="Ano ang naramdaman mo?"
                                    className="w-full bg-black/30 border border-orange-400/30 rounded-xl p-3 text-orange-100 font-medium placeholder-orange-300/30 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none h-24 text-center transition-all"
                                  />
                                </div>
                              </div>

                              <div className="text-red-500 hidden md:block z-20 -mx-6 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] relative">
                                <ChevronRight strokeWidth={4} size={64} className="group-hover:scale-110 transition-transform" />
                              </div>
                              <div className="text-red-500 md:hidden my-2 z-20">
                                <div className="w-1.5 h-10 bg-gradient-to-b from-orange-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.6)] mx-auto rounded-full"></div>
                              </div>

                              <div className="w-72 md:w-80 max-w-[90vw] z-10 shrink-0">
                                <div className="bg-gradient-to-b from-red-900/80 to-[#220707]/95 p-8 rounded-[2.5rem] border-t border-l border-white/20 border-r border-b border-black/80 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_15px_rgba(239,68,68,0.2)] backdrop-blur-md relative group transition-transform duration-300 min-h-[220px] flex flex-col justify-start">
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-red-800 to-red-950 rounded-full flex items-center justify-center border border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.8),inset_0_2px_5px_rgba(255,255,255,0.5)] text-3xl group-hover:scale-110 transition-transform z-10 drop-shadow-md">💥</div>
                                  <h4 className="text-red-400 text-sm font-black uppercase tracking-[0.2em] mt-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">Ang Ginawa</h4>
                                  <h3 className="text-2xl font-black text-white mt-1 px-2 leading-tight drop-shadow-lg">My Usual Reaction</h3>
                                  <div className="h-[2px] bg-gradient-to-r from-transparent via-red-200/30 to-transparent my-4 w-full"></div>
                                  <textarea
                                    value={shadowMapReaction}
                                    onChange={(e) => setShadowMapReaction(e.target.value)}
                                    placeholder="Ano ang mabilis mong reaksyon?"
                                    className="w-full bg-black/30 border border-red-500/30 rounded-xl p-3 text-red-100 font-medium placeholder-red-300/30 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none h-24 text-center transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                          <div className="flex justify-between items-center mt-4 pt-8 border-t border-white/10 max-w-5xl mx-auto w-full">
                            <button
                              onClick={() => setActPage(0)}
                              className="px-6 py-3 md:px-8 md:py-3.5 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-lg font-bold shadow-md"
                            >
                              Bumalik sa My Shadow
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                await dbClient.saveResponse(user.id, activeSession!.number, 'shadow_map', {
                                  trigger: shadowMapTrigger,
                                  thought: shadowMapThought,
                                  feeling: shadowMapFeeling,
                                  reaction: shadowMapReaction
                                });
                                setActPage(2);
                              }}
                              className="group flex items-center gap-3 px-8 py-3 md:px-10 md:py-4 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-110 hover:shadow-[0_0_30px_rgba(72,202,228,0.6)] transition-all duration-300 text-sm md:text-lg overflow-hidden relative"
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                Magtungo sa STOP Strategy
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                              </span>
                              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-out" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : actPage === 2 ? (
                      <div className="animate-fade-in py-8">
                        <div className="text-center space-y-8 max-w-6xl mx-auto w-full">
                          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                            <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-sky via-blue-300 to-indigo-500 drop-shadow-[0_0_15px_rgba(72,202,228,0.5)] tracking-widest uppercase">
                              Activity 4: Pause Before the Battle
                            </h3>
                            <p className="text-xl md:text-2xl text-white/80 font-bold max-w-3xl mx-auto mt-4 drop-shadow-md">
                              Kilalanin ang <span className="text-mythos-gold font-black">STOP Strategy</span>
                            </p>
                            <p className="text-base text-white/60 mx-auto mt-2 italic max-w-2xl">
                              Mag-click sa mga letra sa ibaba upang malaman kung paano gamitin ang pamamaraang ito kapag nararamdaman mo ang matinding galit.
                            </p>
                          </motion.div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mt-12 w-full pt-8">
                            {/* Card S */}
                            <motion.button
                              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                              onClick={() => setActiveStop('S')}
                              className={`relative group rounded-[2rem] p-6 text-left overflow-hidden border transition-all duration-500 ease-out ${activeStop === 'S'
                                ? 'bg-gradient-to-br from-red-600/90 to-[#220707] min-h-[300px] border-red-400 shadow-[0_10px_30px_rgba(239,68,68,0.5)] scale-105 z-20 md:-mr-4'
                                : 'bg-black/50 border-white/10 hover:bg-white/5 min-h-[160px] opacity-70 hover:opacity-100 z-10'
                                }`}
                            >
                              <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
                              <div className="flex flex-col h-full z-10 relative">
                                <div className={`flex items-center gap-4 ${activeStop === 'S' ? 'mb-6' : 'mb-0'}`}>
                                  <div className={`flex items-center justify-center font-black text-4xl rounded-full bg-red-950/50 border transition-all duration-500 ${activeStop === 'S' ? 'w-20 h-20 text-red-400 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'w-16 h-16 text-white/50 border-white/20'}`}>S</div>
                                  <div className={`transition-all duration-500 ${activeStop === 'S' ? 'text-3xl text-white font-black drop-shadow-md' : 'text-xl text-white/50 font-bold'}`}>Stop</div>
                                </div>

                                <div className={`transition-all duration-500 overflow-hidden ${activeStop === 'S' ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                  <div className="bg-black/30 p-5 rounded-2xl border border-red-500/20">
                                    <h4 className="text-xl font-bold text-red-200 mb-2">Do not immediately react.</h4>
                                    <p className="text-red-100/70 italic text-sm">(Huwag munang kumilos o magsalita agad. I-pause ang iyong sarili.)</p>
                                  </div>
                                </div>
                              </div>
                            </motion.button>

                            {/* Card T */}
                            <motion.button
                              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                              onClick={() => setActiveStop('T')}
                              className={`relative group rounded-[2rem] p-6 text-left overflow-hidden border transition-all duration-500 ease-out ${activeStop === 'T'
                                ? 'bg-gradient-to-br from-mythos-sky/90 to-[#071922] min-h-[300px] border-mythos-sky shadow-[0_10px_30px_rgba(72,202,228,0.5)] scale-105 z-20 md:-mx-2'
                                : 'bg-black/50 border-white/10 hover:bg-white/5 min-h-[160px] opacity-70 hover:opacity-100 z-10'
                                }`}
                            >
                              <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
                              <div className="flex flex-col h-full z-10 relative">
                                <div className={`flex items-center gap-4 ${activeStop === 'T' ? 'mb-6' : 'mb-0'}`}>
                                  <div className={`flex items-center justify-center font-black text-4xl rounded-full bg-cyan-950/50 border transition-all duration-500 ${activeStop === 'T' ? 'w-20 h-20 text-mythos-sky border-mythos-sky shadow-[0_0_20px_rgba(72,202,228,0.6)]' : 'w-16 h-16 text-white/50 border-white/20'}`}>T</div>
                                  <div className={`transition-all duration-500 ${activeStop === 'T' ? 'text-3xl text-white font-black drop-shadow-md' : 'text-xl text-white/50 font-bold leading-tight'}`}>Take a<br />breath</div>
                                </div>

                                <div className={`transition-all duration-500 overflow-hidden ${activeStop === 'T' ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                  <div className="bg-black/30 p-5 rounded-2xl border border-mythos-sky/20">
                                    <h4 className="text-xl font-bold text-cyan-200 mb-2">Slow your body down.</h4>
                                    <p className="text-cyan-100/70 italic text-sm">(Huminga nang malalim. Pakalmahin ang iyong katawan para bumaba ang tensyon.)</p>
                                  </div>
                                </div>
                              </div>
                            </motion.button>

                            {/* Card O */}
                            <motion.button
                              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                              onClick={() => setActiveStop('O')}
                              className={`relative group rounded-[2rem] p-6 text-left overflow-hidden border transition-all duration-500 ease-out ${activeStop === 'O'
                                ? 'bg-gradient-to-br from-mythos-gold/90 to-[#221c07] min-h-[300px] border-mythos-gold shadow-[0_10px_30px_rgba(255,215,0,0.5)] scale-105 z-20 md:-ml-2 md:-mr-4'
                                : 'bg-black/50 border-white/10 hover:bg-white/5 min-h-[160px] opacity-70 hover:opacity-100 z-10'
                                }`}
                            >
                              <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
                              <div className="flex flex-col h-full z-10 relative">
                                <div className={`flex items-center gap-4 ${activeStop === 'O' ? 'mb-6' : 'mb-0'}`}>
                                  <div className={`flex items-center justify-center font-black text-4xl rounded-full bg-yellow-950/50 border transition-all duration-500 ${activeStop === 'O' ? 'w-20 h-20 text-mythos-gold border-mythos-gold shadow-[0_0_20px_rgba(255,215,0,0.6)]' : 'w-16 h-16 text-white/50 border-white/20'}`}>O</div>
                                  <div className={`transition-all duration-500 ${activeStop === 'O' ? 'text-3xl text-white font-black drop-shadow-md' : 'text-xl text-white/50 font-bold'}`}>Observe</div>
                                </div>

                                <div className={`transition-all duration-500 overflow-hidden ${activeStop === 'O' ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                  <div className="bg-black/30 p-5 rounded-2xl border border-mythos-gold/20">
                                    <h4 className="text-lg font-bold text-yellow-200 mb-2 leading-tight">What am I thinking?<br />What am I feeling?</h4>
                                    <p className="text-yellow-100/70 italic text-sm">(Obserbahan ang sarili. Ano ba ang naiisip ko ngayon? Ano ang nangyayari sa emosyon ko?)</p>
                                  </div>
                                </div>
                              </div>
                            </motion.button>

                            {/* Card P */}
                            <motion.button
                              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                              onClick={() => setActiveStop('P')}
                              className={`relative group rounded-[2rem] p-6 text-left overflow-hidden border transition-all duration-500 ease-out ${activeStop === 'P'
                                ? 'bg-gradient-to-br from-emerald-500/90 to-[#072213] min-h-[300px] border-emerald-400 shadow-[0_10px_30px_rgba(52,211,153,0.5)] scale-105 z-20'
                                : 'bg-black/50 border-white/10 hover:bg-white/5 min-h-[160px] opacity-70 hover:opacity-100 z-10'
                                }`}
                            >
                              <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
                              <div className="flex flex-col h-full z-10 relative">
                                <div className={`flex items-center gap-4 ${activeStop === 'P' ? 'mb-6' : 'mb-0'}`}>
                                  <div className={`flex items-center justify-center font-black text-4xl rounded-full bg-emerald-950/50 border transition-all duration-500 ${activeStop === 'P' ? 'w-20 h-20 text-emerald-400 border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.6)]' : 'w-16 h-16 text-white/50 border-white/20'}`}>P</div>
                                  <div className={`transition-all duration-500 ${activeStop === 'P' ? 'text-3xl text-white font-black drop-shadow-md' : 'text-xl text-white/50 font-bold leading-tight'}`}>Proceed<br />wisely</div>
                                </div>

                                <div className={`transition-all duration-500 overflow-hidden ${activeStop === 'P' ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                  <div className="bg-black/30 p-5 rounded-2xl border border-emerald-500/20">
                                    <h4 className="text-xl font-bold text-emerald-200 mb-2">Choose the best action.</h4>
                                    <p className="text-emerald-100/70 italic text-sm">(Ngayong kalmado na, magdesisyon kung ano ang pinakamabuting hakbang na hindi nakakasakit.)</p>
                                  </div>
                                </div>
                              </div>
                            </motion.button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/10 max-w-5xl mx-auto w-full">
                          <button
                            onClick={() => setActPage(1)}
                            className="px-6 py-3 md:px-8 md:py-3.5 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-lg font-bold shadow-md"
                          >
                            Bumalik
                          </button>

                          <button
                            type="button"
                            onClick={() => setActPage(3)}
                            className="group flex items-center gap-3 px-8 py-3 md:px-10 md:py-4 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-110 hover:shadow-[0_0_30px_rgba(72,202,228,0.6)] transition-all duration-300 text-sm md:text-lg overflow-hidden relative"
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              Magtungo sa Digital Scenario
                              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-out" />
                          </button>
                        </div>
                      </div>
                    ) : actPage === 3 ? (
                      <div className="animate-fade-in py-8">
                        <div className="max-w-4xl mx-auto w-full relative">
                          {/* Title */}
                          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                            <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_15px_rgba(192,132,252,0.6)] tracking-widest uppercase">
                              Digital Scenario
                            </h3>
                            <p className="text-xl md:text-2xl text-white/80 font-bold mt-4 drop-shadow-md">
                              Paano mo haharapin ang sitwasyong ito?
                            </p>
                          </motion.div>

                          {/* The Scenario Display */}
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="relative mb-12">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 rounded-2xl blur opacity-30"></div>
                            <div className="relative bg-black/60 border border-purple-500/40 rounded-2xl p-8 md:p-12 text-center shadow-[0_0_30px_rgba(192,132,252,0.15)] backdrop-blur-md">
                              <h2 className="text-2xl md:text-4xl font-black text-white italic drop-shadow-md">
                                "A classmate laughs when you answer incorrectly."
                              </h2>
                              <p className="text-sm md:text-lg text-purple-200/80 mt-4 font-medium italic">
                                (Tumawa ang kaklase mo nang magkamali ka sa pagsagot.)
                              </p>
                            </div>
                          </motion.div>

                          {/* Choices */}
                          <div className="space-y-4">
                            <motion.button
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                              onClick={() => setScenarioChoice('A')}
                              className={`w-full p-6 text-left rounded-xl border-2 transition-all duration-300 ${scenarioChoice === 'A'
                                ? 'bg-red-950/60 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-[1.02]'
                                : 'bg-black/40 border-white/10 hover:bg-white/10'
                                }`}
                            >
                              <div className="flex items-center gap-4">
                                <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center font-black rounded-full ${scenarioChoice === 'A' ? 'bg-red-500 text-white' : 'bg-white/10 text-white/50'}`}>A</span>
                                <div>
                                  <p className={`font-bold text-lg md:text-xl ${scenarioChoice === 'A' ? 'text-red-100' : 'text-white'}`}>"You embarrassed me! Let's fight."</p>
                                </div>
                              </div>
                            </motion.button>

                            <motion.button
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                              onClick={() => setScenarioChoice('B')}
                              className={`w-full p-6 text-left rounded-xl border-2 transition-all duration-300 ${scenarioChoice === 'B'
                                ? 'bg-yellow-950/60 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-[1.02]'
                                : 'bg-black/40 border-white/10 hover:bg-white/10'
                                }`}
                            >
                              <div className="flex items-center gap-4">
                                <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center font-black rounded-full ${scenarioChoice === 'B' ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/50'}`}>B</span>
                                <div>
                                  <p className={`font-bold text-lg md:text-xl ${scenarioChoice === 'B' ? 'text-yellow-100' : 'text-white'}`}>Walk away without saying anything.</p>
                                </div>
                              </div>
                            </motion.button>

                            <motion.button
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                              onClick={() => setScenarioChoice('C')}
                              className={`w-full p-6 text-left rounded-xl border-2 transition-all duration-300 ${scenarioChoice === 'C'
                                ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-[1.02]'
                                : 'bg-black/40 border-white/10 hover:bg-white/10'
                                }`}
                            >
                              <div className="flex items-center gap-4">
                                <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center font-black rounded-full ${scenarioChoice === 'C' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'}`}>C</span>
                                <div>
                                  <p className={`font-bold text-lg md:text-xl ${scenarioChoice === 'C' ? 'text-emerald-100' : 'text-white'}`}>Take a breath and say, "I didn't appreciate that."</p>
                                </div>
                              </div>
                            </motion.button>
                          </div>

                          {/* Explanation Reveal */}
                          <div className={`transition-all duration-700 overflow-hidden ${scenarioChoice ? 'max-h-[500px] opacity-100 mt-8' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-white/5 p-6 md:p-8 rounded-2xl border border-white/10">
                              <h4 className="text-xl font-bold text-mythos-sky mb-4">Bakit ito ang iyong piniling reaksyon?</h4>
                              <textarea
                                value={scenarioExplanation}
                                onChange={(e) => setScenarioExplanation(e.target.value)}
                                placeholder="I-type ang iyong paliwanag dito..."
                                className="w-full bg-black/40 border border-white/20 rounded-xl p-4 text-white font-medium placeholder-white/30 focus:outline-none focus:border-mythos-sky focus:ring-1 focus:ring-mythos-sky resize-none h-32"
                              />
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-between items-center mt-10 pt-8 border-t border-white/10 w-full">
                            <button
                              onClick={() => setActPage(2)}
                              className="px-6 py-3 md:px-8 md:py-3.5 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-sm md:text-lg font-bold shadow-md"
                            >
                              Bumalik sa STOP Strategy
                            </button>

                            <button
                              type="button"
                              disabled={!scenarioChoice || !scenarioExplanation.trim()}
                              onClick={async () => {
                                await dbClient.saveResponse(user.id, activeSession!.number, 'digital_scenario', {
                                  choice: scenarioChoice,
                                  explanation: scenarioExplanation
                                });
                                setSessionStep(6);
                              }}
                              className="group flex items-center gap-3 px-8 py-3 md:px-10 md:py-4 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-110 hover:shadow-[0_0_30px_rgba(72,202,228,0.6)] transition-all duration-300 text-sm md:text-lg overflow-hidden relative disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                I-submit at Pagtatapos
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                              </span>
                              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-out" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : activeSession.number === 4 ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] py-12 px-6">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="max-w-4xl w-full text-center relative"
                    >
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-9xl text-mythos-gold/20 font-serif leading-none z-0">"</div>

                      <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-mythos-gold via-yellow-200 to-amber-500 drop-shadow-[0_0_15px_rgba(255,215,0,0.4)] leading-tight mb-8 relative z-10 py-6">
                        The goal is not to make anger disappear. The goal is to create enough space between the emotion and the behavior to make a better choice.
                      </h3>

                      <p className="text-xl md:text-2xl text-mythos-sky/90 font-medium italic mb-12 drop-shadow-md z-10 relative">
                        (Ang layunin ay hindi pawiin ang galit. Ang layunin ay magkaroon ng sapat na espasyo sa pagitan ng emosyon at kilos upang makagawa ng mas mahusay na desisyon.)
                      </p>

                      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-9xl text-mythos-gold/20 font-serif leading-none rotate-180 z-0">"</div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="mt-16 pt-8 border-t border-white/10 w-full flex justify-center"
                    >
                      <button
                        onClick={() => setSessionStep(6)}
                        className="group flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-black rounded-xl hover:scale-105 hover:shadow-[0_0_30px_rgba(72,202,228,0.6)] transition-all duration-300 text-lg md:text-xl overflow-hidden relative"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Pagtatapos ng Session
                          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-out" />
                      </button>
                    </motion.div>
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* STEP 6: SESSION COMPLETED */}
            {sessionStep === 6 && activeSession && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className="relative p-10 md:p-14 rounded-[3rem] text-center space-y-8 max-w-2xl mx-auto border border-mythos-gold/40 shadow-[0_0_80px_rgba(255,215,0,0.2)] bg-black/60 overflow-hidden backdrop-blur-xl"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[200%] bg-mythos-gold/10 blur-[80px] pointer-events-none rounded-full" />

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ type: "spring", delay: 0.2, bounce: 0.6, duration: 1.5 }}
                  className="text-7xl md:text-8xl drop-shadow-[0_0_20px_rgba(255,215,0,0.6)] z-10 relative"
                >
                  🎉
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-mythos-gold to-orange-400 drop-shadow-lg tracking-wide uppercase relative z-10"
                >
                  Binabati Kita!
                </motion.h3>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="relative z-10 space-y-4"
                >
                  <p className="text-lg md:text-xl text-white/95 font-medium leading-relaxed">
                    Matagumpay mong nakumpleto ang Session {activeSession.number}: <br />
                    <strong className="text-mythos-sky text-2xl drop-shadow-md">{activeSession.title}</strong>
                  </p>

                  <div className="inline-block p-4 mt-2 rounded-2xl bg-white/5 border border-white/10 hover:border-mythos-gold/40 hover:bg-white/10 transition-all cursor-default">
                    <p className="text-base text-white/80 text-center">
                      Natanggap mo ang badge na <strong className="text-mythos-gold">{activeSession.badgeName}</strong>
                      <span className="inline-block ml-2 text-2xl">{activeSession.badgeIcon}</span>
                    </p>
                  </div>
                </motion.div>



                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="pt-6 relative z-10 flex justify-center"
                >
                  <button
                    onClick={() => {
                      if (activeSession.number === 5) {
                        setSessionStep(7);
                      } else {
                        finishSession();
                      }
                    }}
                    className="group relative px-10 py-5 bg-gradient-to-r from-mythos-sky to-blue-500 text-white font-extrabold text-lg md:text-xl rounded-full hover:scale-110 shadow-[0_0_30px_rgba(72,202,228,0.4)] hover:shadow-[0_0_50px_rgba(72,202,228,0.7)] transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {activeSession.number === 5 ? "Susunod" : "Bumalik sa Dashboard"}
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* STEP 7: MYTHOS DECLARATION / DISCLAIMER */}
            {sessionStep === 7 && activeSession && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="relative p-6 md:p-12 rounded-[2rem] text-center space-y-8 max-w-4xl mx-auto border-2 border-mythos-gold/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-[#0a0a0a] overflow-hidden"
              >
                {/* Background Textures/Gradients */}
                <div className="absolute inset-0 bg-[#0a0a0a] opacity-90" style={{ backgroundImage: 'radial-gradient(circle at center, #1a1600 0%, #0a0a0a 100%)' }}></div>
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255, 215, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 215, 0, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                {/* Header Section */}
                <div className="relative z-10 space-y-4 pt-4 border-b border-mythos-gold/20 pb-8">
                  <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-mythos-gold to-orange-600 drop-shadow-xl tracking-widest uppercase font-serif">
                    MyTHOS
                  </h2>
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-px bg-mythos-gold/40"></div>
                    <div className="w-2 h-2 rotate-45 border border-mythos-gold/60"></div>
                    <div className="w-12 h-px bg-mythos-gold/40"></div>
                  </div>
                  <h3 className="text-xl md:text-3xl font-bold text-mythos-gold/90 tracking-widest uppercase font-serif">
                    Declaration / Disclaimer
                  </h3>
                </div>

                {/* Content Section */}
                <div className="relative z-10 space-y-8 text-left bg-transparent p-2 md:p-4 rounded-2xl">
                  {/* Copyright Notice */}
                  <div className="flex gap-6 items-start">
                    <Shield className="text-mythos-gold/80 w-8 h-8 shrink-0 mt-1" strokeWidth={1.5} />
                    <div>
                      <h4 className="text-mythos-gold font-bold text-lg md:text-xl tracking-widest mb-3 uppercase font-serif">
                        Copyright Notice
                      </h4>
                      <p className="text-white/70 text-sm md:text-base leading-relaxed font-serif">
                        All videos, images, music, graphics, and other materials used in MyTHOS are the property of their respective and rightful owners. All rights reserved to the original creators and copyright holders.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 my-2 opacity-30">
                    <div className="w-1/4 h-px bg-mythos-gold"></div>
                    <div className="w-2 h-2 rotate-45 border border-mythos-gold"></div>
                    <div className="w-1/4 h-px bg-mythos-gold"></div>
                  </div>

                  {/* AI Generated Content Declaration */}
                  <div className="flex gap-6 items-start">
                    <Sparkles className="text-mythos-gold/80 w-8 h-8 shrink-0 mt-1" strokeWidth={1.5} />
                    <div>
                      <h4 className="text-mythos-gold font-bold text-lg md:text-xl tracking-widest mb-3 uppercase font-serif">
                        AI-Generated Content Declaration
                      </h4>
                      <p className="text-white/70 text-sm md:text-base leading-relaxed font-serif">
                        Some content in MyTHOS, including texts, images, voices, or other media, has been generated or enhanced using Artificial Intelligence (AI) tools. These AI-generated materials are intended solely for educational, informational, and creative purposes (as a functional proof-of-concept for this CBT intervention).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 my-2 opacity-30">
                    <div className="w-1/4 h-px bg-mythos-gold"></div>
                    <div className="w-2 h-2 rotate-45 border border-mythos-gold"></div>
                    <div className="w-1/4 h-px bg-mythos-gold"></div>
                  </div>

                  {/* Fair Use Statement */}
                  <div className="flex gap-6 items-start">
                    <Scale className="text-mythos-gold/80 w-8 h-8 shrink-0 mt-1" strokeWidth={1.5} />
                    <div>
                      <h4 className="text-mythos-gold font-bold text-lg md:text-xl tracking-widest mb-3 uppercase font-serif">
                        Fair Use Statement
                      </h4>
                      <p className="text-white/70 text-sm md:text-base leading-relaxed font-serif">
                        MyTHOS may contain copyrighted materials the use of which has not always been specifically authorized by the copyright owner. Such materials are made available for purposes such as criticism, comment, news reporting, teaching, scholarship, or research. This constitutes a &quot;fair use&quot; of any such copyrighted material as provided for in <strong>Section 185 of the Intellectual Property Code of the Philippines (Republic Act No. 8293)</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Footer Respect */}
                  <div className="flex gap-6 items-center pt-6 opacity-80">
                    <Heart className="text-mythos-gold/50 w-6 h-6 shrink-0" strokeWidth={1.5} fill="currentColor" />
                    <p className="text-white/50 text-xs md:text-sm italic font-serif">
                      Our utmost respect and gratitude to all creators and copyright holders. No copyright infringement is intended.
                    </p>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="pt-8 relative z-10 flex justify-between items-center w-full border-t border-mythos-gold/10"
                >
                  <button
                    onClick={() => setSessionStep(6)}
                    className="px-6 py-3 rounded-full border border-mythos-gold/30 text-mythos-gold/70 hover:bg-mythos-gold/10 hover:text-mythos-gold transition-all font-bold tracking-widest uppercase text-sm"
                  >
                    Bumalik
                  </button>
                  <button
                    onClick={finishSession}
                    className="group relative px-8 py-3 md:px-12 md:py-4 bg-transparent border-2 border-mythos-gold text-mythos-gold font-extrabold text-sm md:text-base rounded-full hover:bg-mythos-gold hover:text-black hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all duration-300 uppercase tracking-widest flex items-center gap-3"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      I Acknowledge
                      <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </span>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </div>
        )
        }
      </div >
    </div >
  );
}
