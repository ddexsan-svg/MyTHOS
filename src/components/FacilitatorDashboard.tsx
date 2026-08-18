'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, MessageSquare, Calendar, Send, CheckCircle2, User, LogOut, Compass, Sparkles, Trash2 } from 'lucide-react';
import { dbClient, Participant, Reflection, ResponseData, User as UserType } from '../lib/db';
import { getClinicalAIAnalysis } from '../lib/ai';

const renderDetailedResponses = (formData: any): React.ReactNode => {
  if (formData === null || formData === undefined || formData === '') {
    return <span className="italic text-gray-400">Walang naibigay na sagot.</span>;
  }

  if (typeof formData === 'string' || typeof formData === 'number' || typeof formData === 'boolean') {
    return <span className="text-gray-900">{String(formData)}</span>;
  }

  if (Array.isArray(formData)) {
    if (formData.length === 0) return <span className="italic text-gray-400">Walang piniling sagot.</span>;
    return (
      <ul className="list-disc pl-5 mt-1 space-y-1">
        {formData.map((item, i) => (
          <li key={i}>{renderDetailedResponses(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof formData === 'object') {
    const entries = Object.entries(formData).filter(([_, val]) => val !== undefined && val !== null && val !== '');

    if (entries.length === 0) return <span className="italic text-gray-400">Walang nakumpletong sagot.</span>;

    return (
      <div className="space-y-3 mt-1">
        {entries.map(([key, val]) => {
          const readableKey = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .trim()
            .replace(/^./, str => str.toUpperCase());

          return (
            <div key={key} className="text-sm">
              <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px] block mb-1">{readableKey}</span>
              <div className="block pl-3 border-l-2 border-[#1a2b4c]/20 text-gray-900 text-[14px]">
                {renderDetailedResponses(val)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="italic text-gray-400">Hindi mabasa ang format ng data.</span>;
};

interface FacilitatorDashboardProps {
  user: UserType;
  onLogout: () => void;
}

export default function FacilitatorDashboard({ user, onLogout }: FacilitatorDashboardProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [participantReflections, setParticipantReflections] = useState<Reflection[]>([]);
  const [participantResponses, setParticipantResponses] = useState<ResponseData[]>([]);

  // Feedback states
  const [activeReflectionId, setActiveReflectionId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // AI Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clinicalAiSummary, setClinicalAiSummary] = useState<string | null>(null);

  const [activeSessionTab, setActiveSessionTab] = useState<number>(1);

  // Scheduling states
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  useEffect(() => {
    loadParticipants();
  }, []);

  useEffect(() => {
    if (selectedParticipantId) {
      loadReflections(selectedParticipantId);
    }
  }, [selectedParticipantId]);

  const loadParticipants = async () => {
    // We now fetch ALL registered participants so newly registered users instantly appear for review.
    const list = await dbClient.getAllParticipants();
    setParticipants(list);
    if (list.length > 0 && !selectedParticipantId) {
      setSelectedParticipantId(list[0].id);
    }
  };

  const loadReflections = async (pId: string) => {
    const refs = await dbClient.getReflections(pId);
    setParticipantReflections(refs);
    const resp = await dbClient.getAllResponses(pId);
    setParticipantResponses(resp);
    setClinicalAiSummary(null); // reset AI summary on participant change
  };

  const handleResetData = async (pId: string) => {
    if (window.confirm("ARE YOU SURE? This will permanently erase all CBT responses, reflections, and logs for this participant. This cannot be undone.")) {
      await dbClient.clearParticipantData(pId);
      loadReflections(pId);
      // Small delay to ensure state updates
      setTimeout(() => alert("Participant data has been securely reset. You may now perform a fresh test."), 500);
    }
  };

  const handleSeedData = async (pId: string) => {
    if (window.confirm("Seed sample responses for Session 1? This will instantly populate the dashboard with synthetic activity logs.")) {
      await dbClient.seedSampleData(pId);
      loadReflections(pId);
      setTimeout(() => alert("Sample data generated! Check the Session 1 tab."), 500);
    }
  };

  const handleGenerateAISummary = async () => {
    if (!selectedParticipantId) return;
    setIsAnalyzing(true);
    try {
      const sessionResp = participantResponses.filter(r => r.session_number === activeSessionTab && r.activity_name !== 'registration_metadata' && r.form_data);
      const sessionRefs = participantReflections.filter(r => r.session_number === activeSessionTab);

      const dataStr = JSON.stringify({
        session: activeSessionTab,
        responses: sessionResp.map(r => ({ activity: r.activity_name, data: r.form_data })),
        journals: sessionRefs.map(r => ({ text: r.journal_text }))
      });
      // Sending max 4000 characters to prevent overloading token limit
      const result = await getClinicalAIAnalysis(dataStr.substring(0, 4000));
      setClinicalAiSummary(result);
    } catch (e) {
      console.error(e);
      setClinicalAiSummary("Failed to generate clinical analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReflectionId || !feedbackText.trim()) return;

    await dbClient.saveFacilitatorFeedback(activeReflectionId, feedbackText.trim(), user.id);
    setFeedbackSuccess(true);
    setFeedbackText('');

    if (selectedParticipantId) {
      await loadReflections(selectedParticipantId);
    }

    setTimeout(() => {
      setFeedbackSuccess(false);
      setActiveReflectionId(null);
    }, 2000);
  };

  const handleScheduleSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDate || !scheduleTime) return;

    // Simulate session scheduling
    setScheduleSuccess(true);
    setScheduleDate('');
    setScheduleTime('');
    setScheduleNotes('');

    setTimeout(() => {
      setScheduleSuccess(false);
    }, 3000);
  };

  const selectedPart = participants.find(p => p.id === selectedParticipantId);

  return (
    <div className="min-h-screen text-mythos-sand pb-16">

      {/* Header Banner */}
      <header className="glass-panel sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mythos-gold/10 border border-mythos-gold/30 flex items-center justify-center">
            <Compass className="w-6 h-6 text-mythos-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider">MyTHOS</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Counselor / Facilitator Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-bold uppercase">Aileen Diamante</span>
            <span className="text-[10px] text-mythos-gold font-semibold uppercase">Licensed Psychologist</span>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT SIDEBAR: Participant List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-5 rounded-2xl min-h-[450px]">
              <h3 className="text-sm font-bold text-mythos-gold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Assigned Participants
              </h3>

              <div className="space-y-2">
                {participants.length === 0 ? (
                  <p className="text-xs text-white/40 italic">No assigned participants at this time.</p>
                ) : (
                  participants.map((part) => (
                    <button
                      key={part.id}
                      onClick={() => setSelectedParticipantId(part.id)}
                      className={`w-full p-4 rounded-xl text-left border transition-all duration-200 flex items-center gap-3 ${selectedParticipantId === part.id
                        ? 'bg-mythos-sky/10 border-mythos-sky text-white font-semibold'
                        : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold">{part.name}</h4>
                        <p className="text-[10px] text-white/50">{part.course_program}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>


          </div>

          {/* RIGHT VIEW: Reflections monitoring & Feedback */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPart ? (
              <>
                {/* Profile Overview Card */}
                <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center gap-4 relative text-center">
                  <div>
                    <span className="text-xs font-bold text-mythos-sky uppercase tracking-wider">Current Participant</span>
                    <h2 className="text-4xl font-black mt-2 text-white uppercase tracking-wide">{selectedPart.name}</h2>
                    <p className="text-sm font-medium text-white/60 mt-1 uppercase tracking-widest">{selectedPart.school} | {selectedPart.course_program}</p>
                    <div className="flex justify-center gap-6 mt-4 text-sm text-white/80">
                      <p>Age: <span className="font-bold text-mythos-gold">{selectedPart.age}</span></p>
                      <p>Gender: <span className="font-bold text-mythos-gold">{selectedPart.gender}</span></p>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => handleResetData(selectedPart.id)}
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-red-500/50 hover:text-red-400 transition-colors"
                      title="Reset Data"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Session Tabs */}
                <div className="flex px-2 md:px-4 pt-2 gap-2 overflow-x-auto border-b border-mythos-sky/30">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => { setActiveSessionTab(num); setClinicalAiSummary(null); }}
                      className={`px-4 md:px-6 py-3 rounded-t-xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeSessionTab === num ? 'bg-[#fcfbf9] text-gray-900 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-black/20 text-white/50 hover:bg-black/40 hover:text-white/80'}`}
                    >
                      Session {num}
                    </button>
                  ))}
                </div>

                {/* Bond Paper View */}
                <div className="bg-[#fcfbf9] text-gray-900 rounded-b-2xl rounded-tr-2xl shadow-[0_10px_50px_rgba(0,0,0,0.5)] p-6 md:p-12 min-h-[600px] border border-gray-300/50 mx-1 mb-6 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between md:items-start mb-10 border-b-2 border-gray-200 pb-6 gap-4">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black uppercase tracking-widest text-[#1a2b4c]">Session {activeSessionTab} Evaluation Report</h3>
                      <p className="text-xs md:text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">{selectedPart.name}</p>
                    </div>

                  </div>
                  {(() => {
                    // Fetch and deduplicate responses (to handle rapid localstorage write race conditions)
                    const rawSessionResp = participantResponses.filter(r => r.session_number === activeSessionTab && r.activity_name !== 'registration_metadata' && r.form_data);
                    const dedupMap = new Map();
                    rawSessionResp.forEach(r => {
                      const existing = dedupMap.get(r.activity_name);
                      if (!existing || new Date(r.updated_at || 0) >= new Date(existing.updated_at || 0)) {
                        dedupMap.set(r.activity_name, r);
                      }
                    });
                    const sessionResp = Array.from(dedupMap.values());

                    const sessionRef = participantReflections.filter(r => r.session_number === activeSessionTab);
                    if (sessionResp.length === 0 && sessionRef.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center p-12 opacity-40 mt-10">
                          <BookOpen className="w-12 h-12 mb-4" />
                          <p className="text-sm font-medium italic">Wala pang naisusumiteng data ang mag-aaral para sa session na ito.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-10">
                        {sessionResp.length > 0 && (
                          <div className="space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Activity Responses</h4>
                            {sessionResp.map((resp, index) => (
                              <div key={resp.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-[#1a2b4c]/30 before:rounded-full">
                                <h5 className="text-sm font-black text-[#1a2b4c] uppercase tracking-widest mb-3 flex items-center gap-2">
                                  ACTIVITY {index + 1}: {resp.activity_name.replace(/_/g, ' ')}
                                  <span className="text-[9px] text-gray-400 font-medium">{resp.updated_at ? new Date(resp.updated_at).toLocaleDateString() : 'Recent'}</span>
                                </h5>
                                <div className="text-sm text-gray-700 leading-relaxed font-serif bg-white/60 p-5 rounded-xl border border-gray-200/60 shadow-sm">
                                  {renderDetailedResponses(resp.form_data)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {sessionRef.map((ref) => (
                          <div key={ref.id} className="bg-gray-50 border border-gray-200 p-6 rounded-xl mt-8 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Written Journal Log</span>
                              <span className="text-[10px] text-gray-400 font-medium">{new Date(ref.created_at).toLocaleDateString()}</span>
                            </div>

                            <p className="text-sm text-gray-800 leading-relaxed font-serif italic border-l-4 border-[#d4af37] pl-4 mb-6">
                              &quot;{ref.journal_text}&quot;
                            </p>

                            {ref.ai_summary && (
                              <div className="bg-white p-4 rounded-lg border border-gray-100 text-[11px] text-gray-600 mb-3 shadow-sm">
                                <strong className="text-gray-800 uppercase tracking-widest">✨ Summary:</strong> {ref.ai_summary}
                              </div>
                            )}

                            {ref.ai_feedback && (
                              <div className="bg-white p-4 rounded-lg border border-gray-100 text-[11px] text-gray-600 mb-4 shadow-sm">
                                <strong className="text-[#1a2b4c] uppercase tracking-widest">✨ Feedback:</strong> {ref.ai_feedback}
                              </div>
                            )}

                            {ref.facilitator_feedback ? (
                              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-xs text-yellow-900 shadow-sm mt-4">
                                <strong className="uppercase tracking-widest block mb-1">💬 Your Feedback:</strong>
                                {ref.facilitator_feedback}
                              </div>
                            ) : (
                              <div>
                                {activeReflectionId === ref.id ? (
                                  <form onSubmit={handleSendFeedback} className="mt-4">
                                    <textarea
                                      value={feedbackText}
                                      onChange={(e) => setFeedbackText(e.target.value)}
                                      placeholder="Write your professional feedback here..."
                                      rows={3}
                                      className="w-full p-4 rounded-xl border border-gray-300 text-sm resize-none focus:outline-none focus:border-[#1a2b4c] focus:ring-1 focus:ring-[#1a2b4c]"
                                      required
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                      <button type="button" onClick={() => setActiveReflectionId(null)} className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                                      <button type="submit" className="flex items-center gap-1.5 px-6 py-2 bg-[#1a2b4c] text-white font-bold rounded-lg text-xs hover:bg-[#111d33] transition shadow-md"><Send className="w-3 h-3" /> Send Feedback</button>
                                    </div>
                                  </form>
                                ) : (
                                  <button onClick={() => { setActiveReflectionId(ref.id); setFeedbackText(''); }} className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-all cursor-pointer">
                                    <MessageSquare className="w-3.5 h-3.5" /> Provide Counselor Feedback
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="glass-panel p-8 rounded-2xl text-center text-white/40 italic">
                Select a participant from the list to monitor their progress.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
