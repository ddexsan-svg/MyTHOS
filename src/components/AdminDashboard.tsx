'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, ShieldCheck, Download, Trash, UserPlus, Compass, LogOut, Printer, Info } from 'lucide-react';
import { dbClient, Participant, User, Facilitator } from '../lib/db';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [selectedFacilitatorId, setSelectedFacilitatorId] = useState('');
  const [prePostData, setPrePostData] = useState<{ pre: any, post: any }>({ pre: null, post: null });

  // Reporting / Admin stats
  const [totalPoints, setTotalPoints] = useState(0);
  const [averageLevel, setAverageLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<'management' | 'analytics' | 'reports'>('management');

  // Trigger loading database rows
  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (selectedParticipantId) {
      loadParticipantDetails(selectedParticipantId);
    }
  }, [selectedParticipantId]);

  const loadAdminData = async () => {
    const list = await dbClient.getAllParticipants();
    setParticipants(list);

    // Calculate aggregate metrics
    if (list.length > 0) {
      const sumPoints = list.reduce((a, b) => a + b.session_points, 0);
      const avgLvl = list.reduce((a, b) => a + b.hero_level, 0) / list.length;
      setTotalPoints(sumPoints);
      setAverageLevel(Number(avgLvl.toFixed(1)));
      if (!selectedParticipantId) {
        setSelectedParticipantId(list[0].id);
      }
    }

    // Load mock/real facilitators for dropdowns
    // Since it falls back, we grab local list
    if (typeof window !== 'undefined') {
      const storedFacs = localStorage.getItem('mythos_facilitators');
      if (storedFacs) {
        setFacilitators(JSON.parse(storedFacs));
      }
    }
  };

  const loadParticipantDetails = async (pId: string) => {
    const pp = await dbClient.getPrePostData(pId);
    setPrePostData(pp);
  };

  // Assign counselor
  const handleAssignFacilitator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantId || !selectedFacilitatorId) return;

    await dbClient.assignParticipantToFacilitator(selectedParticipantId, selectedFacilitatorId);
    alert('Counselor successfully assigned to the participant!');
    await loadAdminData();
  };

  const handlePrintReport = () => {
    window.print();
  };

  const selectedPart = participants.find(p => p.id === selectedParticipantId);

  // Helper for pure CSS charts
  const getPercentageWidth = (score: number, max: number) => {
    return `${(score / max) * 100}%`;
  };

  return (
    <div className="min-h-screen text-mythos-sand pb-16 print:bg-white print:text-black">

      {/* Header Banner */}
      <header className="glass-panel sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-white/10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mythos-gold/10 border border-mythos-gold/30 flex items-center justify-center">
            <Compass className="w-6 h-6 text-mythos-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider">MyTHOS</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold font-sans">Administrator Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-bold">Admin Account</span>
            <span className="text-[10px] text-mythos-sky font-semibold font-sans">System Monitor</span>
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

        {/* Top Aggregate Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 print:hidden">
          <div className="glass-panel p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-mythos-sky uppercase tracking-wider font-sans">Total Participants</span>
            <p className="text-3xl font-extrabold text-white mt-1">{participants.length}</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-mythos-gold uppercase tracking-wider font-sans">Sum of Session Points</span>
            <p className="text-3xl font-extrabold text-mythos-gold mt-1">{totalPoints}</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-sans">Average Hero Level</span>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">Lvl {averageLevel}</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-mythos-terracotta uppercase tracking-wider font-sans">Active Counselors</span>
            <p className="text-3xl font-extrabold text-mythos-terracotta mt-1">{facilitators.length}</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-white/5 p-1 rounded-xl mb-8 print:hidden">
          <button
            onClick={() => setActiveTab('management')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${activeTab === 'management' ? 'bg-mythos-sky text-mythos-deep' : 'text-white/60 hover:text-white'
              }`}
          >
            <Users className="w-4 h-4" /> Manage Participants
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${activeTab === 'analytics' ? 'bg-mythos-sky text-mythos-deep' : 'text-white/60 hover:text-white'
              }`}
          >
            <BarChart3 className="w-4 h-4" /> View Analytics
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${activeTab === 'reports' ? 'bg-mythos-sky text-mythos-deep' : 'text-white/60 hover:text-white'
              }`}
          >
            <Printer className="w-4 h-4" /> Export Reports
          </button>
        </div>

        {/* MAIN TAB CONTENT */}

        {/* Tab 1: Participant Management */}
        {activeTab === 'management' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">

            {/* List block */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-panel p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-mythos-gold uppercase tracking-wider mb-4">Participant Roster</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/50">
                        <th className="pb-3">Name</th>
                        <th className="pb-3">School / Program</th>
                        <th className="pb-3">Hero Lvl</th>
                        <th className="pb-3">Points</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {participants.map((part) => (
                        <tr key={part.id} className="hover:bg-white/2">
                          <td className="py-3 font-bold">{part.name}</td>
                          <td className="py-3 text-white/70">{part.school}<br /><span className="text-[10px] text-white/50">{part.course_program}</span></td>
                          <td className="py-3 text-mythos-gold font-extrabold">{part.hero_level}</td>
                          <td className="py-3">{part.session_points} pts</td>
                          <td className="py-3">
                            <button
                              onClick={() => setSelectedParticipantId(part.id)}
                              className="px-2.5 py-1 bg-mythos-sky/15 text-mythos-sky border border-mythos-sky/30 rounded font-semibold text-[10px] hover:bg-mythos-sky/30"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick assignment panel */}
            <div className="lg:col-span-1 space-y-6">
              {selectedPart ? (
                <div className="glass-panel p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-mythos-gold uppercase tracking-wider">Assign Counselor</h3>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs space-y-1">
                    <p>Participant: <span className="font-bold text-white">{selectedPart.name}</span></p>
                    <p>Program: <span className="text-white/70">{selectedPart.course_program}</span></p>
                  </div>

                  <form onSubmit={handleAssignFacilitator} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-white/60 mb-1 uppercase font-bold">Select Counselor</label>
                      <select
                        value={selectedFacilitatorId}
                        onChange={(e) => setSelectedFacilitatorId(e.target.value)}
                        className="w-full p-2.5 rounded-lg glass-input text-xs"
                        required
                      >
                        <option value="" className="bg-[#0b132b] text-white">-- Select --</option>
                        {facilitators.map((fac) => (
                          <option key={fac.id} value={fac.id} className="bg-[#0b132b] text-white">
                            {fac.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-mythos-sky text-mythos-deep font-bold rounded-lg text-xs hover:bg-mythos-teal transition cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      Assign Counselor
                    </button>
                  </form>
                </div>
              ) : (
                <div className="glass-panel p-5 rounded-2xl text-center text-white/40 italic">
                  Select a participant from the roster to assign a Counselor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Analytics & Graphs */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 print:hidden">
            {selectedPart ? (
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-mythos-sky uppercase tracking-wider font-sans">Individual Analytics</span>
                    <h2 className="text-xl font-bold mt-0.5 text-white">{selectedPart.name}</h2>
                  </div>
                  <span className="text-xs bg-mythos-gold/10 text-mythos-gold border border-mythos-gold/30 px-3 py-1 rounded-full font-bold">
                    CBT Baseline Score: {selectedPart.cbt_baseline_score}%
                  </span>
                </div>

                {prePostData.pre ? (
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest">
                      Pre-Test vs Post-Test Psychological Score Comparison
                    </h3>

                    {/* Chart Comparison Bars */}
                    <div className="space-y-4">
                      {/* Scale 1: Self-Esteem */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-white/80">Self-Esteem (Self-Esteem Scale - Max: 20)</span>
                          <span className="text-[10px]">
                            Pre: {prePostData.pre.self_esteem_score} | Post: {prePostData.post ? prePostData.post.self_esteem_score : 'Not Taken'}
                          </span>
                        </div>
                        <div className="h-6 w-full bg-white/5 rounded overflow-hidden flex flex-col gap-1 p-0.5 border border-white/5">
                          {/* Pre Bar */}
                          <div
                            className="h-2 bg-mythos-sky rounded-sm text-[8px] flex items-center justify-end pr-1 text-mythos-deep font-bold transition-all duration-500"
                            style={{ width: getPercentageWidth(prePostData.pre.self_esteem_score, 20) }}
                          >
                            Pre
                          </div>
                          {/* Post Bar */}
                          {prePostData.post && (
                            <div
                              className="h-2 bg-mythos-gold rounded-sm text-[8px] flex items-center justify-end pr-1 text-mythos-deep font-bold transition-all duration-500"
                              style={{ width: getPercentageWidth(prePostData.post.self_esteem_score, 20) }}
                            >
                              Post
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Scale 2: Hope Scale */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-white/80">Hope (Hope Scale - Max: 16)</span>
                          <span className="text-[10px]">
                            Pre: {prePostData.pre.hope_score} | Post: {prePostData.post ? prePostData.post.hope_score : 'Not Taken'}
                          </span>
                        </div>
                        <div className="h-6 w-full bg-white/5 rounded overflow-hidden flex flex-col gap-1 p-0.5 border border-white/5">
                          <div
                            className="h-2 bg-mythos-sky rounded-sm text-[8px] flex items-center justify-end pr-1 text-mythos-deep font-bold transition-all duration-500"
                            style={{ width: getPercentageWidth(prePostData.pre.hope_score, 16) }}
                          >
                            Pre
                          </div>
                          {prePostData.post && (
                            <div
                              className="h-2 bg-mythos-gold rounded-sm text-[8px] flex items-center justify-end pr-1 text-mythos-deep font-bold transition-all duration-500"
                              style={{ width: getPercentageWidth(prePostData.post.hope_score, 16) }}
                            >
                              Post
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Scale 3: Automatic thoughts score (restructured percentage) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-white/80">CBT Restructuring Score (ATQ - Max: 20)</span>
                          <span className="text-[10px]">
                            Pre: {prePostData.pre.automatic_thoughts_score} | Post: {prePostData.post ? prePostData.post.automatic_thoughts_score : 'Not Taken'}
                          </span>
                        </div>
                        <div className="h-6 w-full bg-white/5 rounded overflow-hidden flex flex-col gap-1 p-0.5 border border-white/5">
                          <div
                            className="h-2 bg-mythos-sky rounded-sm text-[8px] flex items-center justify-end pr-1 text-mythos-deep font-bold transition-all duration-500"
                            style={{ width: getPercentageWidth(prePostData.pre.automatic_thoughts_score, 20) }}
                          >
                            Pre
                          </div>
                          {prePostData.post && (
                            <div
                              className="h-2 bg-mythos-gold rounded-sm text-[8px] flex items-center justify-end pr-1 text-mythos-deep font-bold transition-all duration-500"
                              style={{ width: getPercentageWidth(prePostData.post.automatic_thoughts_score, 20) }}
                            >
                              Post
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex gap-4 justify-center text-xs pt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-mythos-sky rounded" />
                        <span className="text-white/60">Pre-Test (Baseline)</span>
                      </div>
                      {prePostData.post && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 bg-mythos-gold rounded" />
                          <span className="text-white/60">Post-Test (Evaluation)</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-white/40 italic py-6 text-center font-sans">This participant has not completed the baseline Pre-Test yet.</p>
                )}
              </div>
            ) : (
              <div className="glass-panel p-8 rounded-2xl text-center text-white/40 italic font-sans animate-pulse-slow">
                Select a participant from the roster in the management tab to review charts.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Printable Report view */}
        {activeTab === 'reports' && (
          <div className="space-y-6">

            {/* Control Bar */}
            <div className="glass-panel p-4 rounded-xl flex justify-between items-center border-b border-white/5 print:hidden">
              <span className="text-xs text-white/60">Print or save the psychological progress report as PDF.</span>
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-1.5 px-4 py-2 bg-mythos-gold text-mythos-deep font-bold rounded-lg text-xs hover:bg-yellow-500 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Report (Save PDF)
              </button>
            </div>

            {/* Printable Area Layout */}
            {selectedPart ? (
              <div className="bg-white text-black p-8 rounded-2xl max-w-4xl mx-auto shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0">

                {/* Header */}
                <div className="border-b-2 border-slate-300 pb-4 flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-extrabold text-[#0e1c36] font-serif">MyTHOS Psychological Report</h1>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">Digital Mythology-Based CBT Intervention Platform</p>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-sans">
                    <p>Date: {new Date().toLocaleDateString()}</p>
                    <p>License: DOH-CBT-103</p>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="grid grid-cols-2 gap-6 border-b border-slate-200 pb-4 text-xs font-sans">
                  <div>
                    <h3 className="font-bold text-slate-700 uppercase tracking-wide mb-2">Participant Details</h3>
                    <p className="font-bold text-sm">{selectedPart.name}</p>
                    <p className="text-slate-600 mt-1">Age/Gender: {selectedPart.age} / {selectedPart.gender}</p>
                    <p className="text-slate-600">School: {selectedPart.school}</p>
                    <p className="text-slate-600">Program: {selectedPart.course_program}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wide mb-2 text-right">Intervention Summary</h3>
                    <p>Progress Level: <span className="font-bold">Level {selectedPart.hero_level}</span></p>
                    <p>Points Accumulation: <span className="font-bold">{selectedPart.session_points} pts</span></p>
                    <p>Daily Attendance Streak: <span className="font-bold">{selectedPart.daily_streak} Days</span></p>
                    <p>Baseline CBT Score: <span className="font-bold text-[#0e1c36]">{selectedPart.cbt_baseline_score}%</span></p>
                  </div>
                </div>

                {/* Evaluation comparison details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide font-serif">Score Evaluations</h3>
                  {prePostData.pre ? (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Self-Esteem Score</span>
                        <p className="text-lg font-bold text-slate-800 mt-1">Pre: {prePostData.pre.self_esteem_score}/20</p>
                        {prePostData.post && (
                          <p className="text-xs font-semibold text-emerald-600 mt-0.5">Post: {prePostData.post.self_esteem_score}/20</p>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Snyder Hope Scale</span>
                        <p className="text-lg font-bold text-slate-800 mt-1">Pre: {prePostData.pre.hope_score}/16</p>
                        {prePostData.post && (
                          <p className="text-xs font-semibold text-emerald-600 mt-0.5">Post: {prePostData.post.hope_score}/16</p>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CBT Thought Record</span>
                        <p className="text-lg font-bold text-slate-800 mt-1">Pre: {prePostData.pre.automatic_thoughts_score}/20</p>
                        {prePostData.post && (
                          <p className="text-xs font-semibold text-emerald-600 mt-0.5">Post: {prePostData.post.automatic_thoughts_score}/20</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No baseline metrics logged.</p>
                  )}
                </div>

                {/* Sign-offs */}
                <div className="pt-12 grid grid-cols-2 gap-8 text-xs font-sans border-t border-slate-100">
                  <div>
                    <div className="w-40 border-b border-slate-400" />
                    <p className="text-slate-500 mt-1">Dr. Maria Clara, RPsy</p>
                    <p className="text-slate-400">Clinical Facilitator</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="w-40 border-b border-slate-400" />
                    <p className="text-slate-500 mt-1">MyTHOS System</p>
                    <p className="text-slate-400">Verifiable Code: AGY-CBT-739</p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="glass-panel p-8 rounded-2xl text-center text-white/40 italic font-sans">
                Select a participant from the roster in the management tab to render the report.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
