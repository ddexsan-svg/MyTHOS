const fs = require('fs');
let txt = fs.readFileSync('src/components/ParticipantDashboard.tsx', 'utf-8');

const replacement = `            {/* LEFT COLUMN: Gamification & Tree */}
            <div className="lg:col-span-1 space-y-4">

              {/* Enhanced Profile Card */}
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.4 }} className="rounded-[2.5rem] border-[1.5px] border-[#d4af37]/40 bg-gradient-to-b from-[#141f36] via-[#10192b] to-[#0a101d] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('/images/mystic-bg.jpg')] opacity-[0.03] rounded-[2.5rem] pointer-events-none mix-blend-screen" />
                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_60%)] pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity duration-1000" />
                
                <div className="flex items-center relative z-10">
                  <div className="relative w-[5.5rem] h-[5.5rem] rounded-full border-[3px] border-[#d4af37] p-1 shadow-[0_0_25px_rgba(212,175,55,0.6)] bg-gradient-to-br from-[#1e2a44] to-[#0a1122] flex-shrink-0 overflow-hidden group-hover:shadow-[0_0_35px_rgba(212,175,55,0.8)] transition-shadow duration-500">
                    <div className="absolute inset-0 bg-[#d4af37]/20 animate-pulse opacity-50 z-0"/>
                    <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=MythosHero&backgroundColor=1e2a44" alt="Hero Avatar" className="w-full h-full rounded-full object-cover relative z-10 scale-110" />
                  </div>
                  
                  <div className="ml-5 flex flex-col justify-center flex-1 relative min-h-[5rem]">
                    <h2 className="text-2xl lg:text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff5d1] to-[#d4af37] uppercase tracking-widest leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:scale-105 origin-left transition-transform duration-300">{profile?.name || 'JAHZ'}</h2>
                    <span className="text-[#aeb6c4] text-[11px] italic font-semibold mt-1.5 tracking-wider">/ lakbay</span>

                    <div className="absolute right-0 top-1/2 -translate-y-1/2 max-w-[130px] text-right hidden sm:block">
                      <p className="text-[#e2e8f0] text-[10px] italic leading-snug font-serif pr-3 py-1 border-r-2 border-[#d4af37]/40 drop-shadow-md">
                        "Bravery is not the absence of fear, but the courage to keep going."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mt-7 relative z-10">
                  <div className="group/stat rounded-2xl border border-[#d4af37]/30 hover:border-[#d4af37]/70 bg-gradient-to-b from-[#1a2542]/80 to-[#121c32]/80 p-2 text-center shadow-[inset_0_0_15px_rgba(255,215,0,0.05)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300 transform hover:-translate-y-1 pt-3 pb-3 backdrop-blur-sm">
                    <div className="flex justify-center flex-col items-center gap-1.5 mb-1.5">
                      <Flame size={20} className="text-red-500 fill-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] group-hover/stat:scale-125 transition-transform duration-300" />
                      <span className="text-[9px] uppercase tracking-widest text-[#aeb6c4] font-bold group-hover/stat:text-white transition-colors">Streak</span>
                    </div>
                    <div className="text-xl font-black text-white drop-shadow-md">{profile?.daily_streak || 0}</div>
                    <div className="text-[8px] text-[#aeb6c4] font-medium tracking-wide">Araw</div>
                  </div>

                  <div className="group/stat rounded-2xl border border-[#d4af37]/30 hover:border-[#d4af37]/70 bg-gradient-to-b from-[#1a2542]/80 to-[#121c32]/80 p-2 text-center shadow-[inset_0_0_15px_rgba(255,215,0,0.05)] hover:shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all duration-300 transform hover:-translate-y-1 pt-3 pb-3 backdrop-blur-sm">
                    <div className="flex justify-center flex-col items-center gap-1.5 mb-1.5">
                      <Star size={20} className="text-[#d4af37] fill-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.8)] group-hover/stat:scale-125 transition-transform duration-300" />
                      <span className="text-[9px] uppercase tracking-widest text-[#aeb6c4] font-bold group-hover/stat:text-white transition-colors">Level</span>
                    </div>
                    <div className="text-xl font-black text-white drop-shadow-md">{profile?.hero_level || 1}</div>
                    <div className="text-[8px] text-[#aeb6c4] font-medium tracking-wide">Lakbay</div>
                  </div>

                  <div className="group/stat rounded-2xl border border-[#d4af37]/30 hover:border-[#d4af37]/70 bg-gradient-to-b from-[#1a2542]/80 to-[#121c32]/80 p-2 text-center shadow-[inset_0_0_15px_rgba(255,215,0,0.05)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300 transform hover:-translate-y-1 pt-3 pb-3 backdrop-blur-sm">
                    <div className="flex justify-center flex-col items-center gap-1.5 mb-1.5">
                      <Award size={20} className="text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)] group-hover/stat:scale-125 transition-transform duration-300" />
                      <span className="text-[9px] uppercase tracking-widest text-[#aeb6c4] font-bold group-hover/stat:text-white transition-colors">Puntos</span>
                    </div>
                    <div className="text-xl font-black text-white drop-shadow-md">{profile?.session_points || 0}</div>
                    <div className="text-[8px] text-[#aeb6c4] font-medium tracking-wide">Kalakasan</div>
                  </div>
                </div>
              </motion.div>

              {/* Progress Tree Display */}
              <div className="relative rounded-[2rem] border border-[#d4af37]/40 bg-gradient-to-r from-[#172545] to-[#0a1122] overflow-hidden p-6 flex flex-row items-center justify-between shadow-[0_15px_30px_rgba(0,0,0,0.6)] h-[180px] group cursor-pointer hover:border-[#d4af37]/70 transition-all duration-500">
                <div className="absolute inset-0 bg-[#d4af37] opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none" />
                
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

              {/* Navigation Grid (4 buttons) */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: 1, label: "Continue My Session", title: "Sessions", color: "from-[#1c2a4c] to-[#121c32]" },
                  { id: 2, label: "Mood Tracker", title: "Mood", color: "from-[#1c2a4c] to-[#121c32]" },
                  { id: 3, label: "Learn & Grow", title: "Learn", color: "from-[#1c2a4c] to-[#121c32]" },
                  { id: 4, label: "My Achievements", title: "Achievements", color: "from-[#1c2a4c] to-[#121c32]" }
                ].map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      if (item.title === 'Sessions') setDashboardTab('sessions');
                      else if (item.title === 'Mood') setDashboardTab('stats');
                      else if (item.title === 'Learn') window.open('https://your-resources-link', '_blank');
                      else setDashboardTab('achievements');
                    }}
                    className={\`relative group rounded-[1.25rem] border-2 border-[#d4af37]/20 bg-gradient-to-b \${item.color} hover:bg-[#1f2e4c] hover:border-[#d4af37]/80 hover:shadow-[0_10px_25px_rgba(212,175,55,0.2)] transition-all duration-300 pb-1 overflow-hidden flex flex-col items-center shadow-lg h-[110px] w-full transform hover:-translate-y-1\`}
                  >
                    <div className="flex-1 flex items-center justify-center pt-3 relative w-full">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Detailed Lucide Icons replacing Emojis */}
                      {idx === 0 && <Scroll size={36} strokeWidth={1.5} className="text-[#f8e5b4] drop-shadow-[0_0_12px_rgba(255,215,0,0.6)] group-hover:scale-110 transition-transform duration-300 relative z-10" />}
                      {idx === 1 && <Heart size={36} strokeWidth={1.5} className="text-[#f472b6] drop-shadow-[0_0_12px_rgba(244,114,182,0.6)] group-hover:scale-110 group-hover:fill-[#f472b6]/20 transition-all duration-300 relative z-10" />}
                      {idx === 2 && <BookOpen size={36} strokeWidth={1.5} className="text-[#93c5fd] drop-shadow-[0_0_12px_rgba(147,197,253,0.6)] group-hover:scale-110 transition-transform duration-300 relative z-10" />}
                      {idx === 3 && <Compass size={36} strokeWidth={1.5} className="text-[#a78bfa] drop-shadow-[0_0_12px_rgba(167,139,250,0.6)] group-hover:scale-110 transition-transform duration-300 relative z-10" />}
                    </div>
                    {/* Faux Ribbon */}
                    <div className="w-[105%] absolute bottom-[-2px] group-hover:bottom-0 transition-all duration-300">
                      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-9 absolute bottom-0 left-0 right-0 drop-shadow-[0_-3px_5px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_-4px_8px_rgba(212,175,55,0.4)] transition-all">
                        <defs>
                          <linearGradient id={\`ribbonGrad\${idx}\`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#d4af37" />
                            <stop offset="50%" stopColor="#f8e5b4" />
                            <stop offset="100%" stopColor="#d4af37" />
                          </linearGradient>
                        </defs>
                        <path d="M-5,15 Q25,25 50,15 T105,15 L105,35 L-5,35 Z" fill={\`url(#ribbonGrad\${idx})\`} />
                        <path d="M-5,10 Q25,20 50,10 T105,10 L105,35 L-5,35 Z" fill="#b98a1c" opacity="0.8"/>
                      </svg>
                      <div className="absolute bottom-2 w-full text-center px-1">
                        <span className="relative z-10 text-[#4a2e0a] text-[8.5px] font-black block leading-[1.1] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] group-hover:scale-105 transition-transform">
                          {item.label}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Badges Panel */}
              <div className="rounded-[2.5rem] border border-[#d4af37]/30 bg-gradient-to-b from-[#162137] to-[#0a1122] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.7)] mb-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-[40px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] pointer-events-none" />
                
                <div className="flex items-center justify-center gap-3 mb-7 relative z-10">
                  <Trophy size={16} className="text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                  <h3 className="text-[11px] md:text-[13px] font-black text-[#f8e5b4] uppercase tracking-[0.2em] drop-shadow-md">
                    Mga Natanggap Na Badge
                  </h3>
                  <Trophy size={16} className="text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                </div>

                <div className="flex overflow-hidden justify-between items-center relative z-10">
                  <div className="text-[#d4af37] absolute left-0 z-20 cursor-pointer hover:scale-125 hover:text-white transition-all bg-[#0a1122]/90 hover:bg-[#1c2a4c] p-1.5 rounded-full shadow-lg border border-[#d4af37]/30 backdrop-blur-sm">
                    <ChevronLeft size={16} />
                  </div>
                  
                  <div className="flex gap-5 px-8 overflow-x-auto hide-scrollbar scroll-smooth w-full py-3 justify-start md:justify-center">
                    {Object.values(INTERVENTION_SESSIONS).map((cfg) => {
                      const isUnlocked = sessions.find(s => s.session_number === cfg.number)?.is_completed;
                      return (
                        <div key={cfg.number} className="flex flex-col items-center gap-2.5 flex-shrink-0 relative group cursor-pointer" title={cfg.badgeDescription}>
                          <div className="relative">
                            <div className={\`w-[66px] h-[66px] rounded-full border-[2.5px] \${isUnlocked ? 'border-transparent bg-gradient-to-br from-[#1c2b4c] to-[#0a1122] shadow-[0_0_20px_rgba(88,224,160,0.5)]' : 'border-[#d4af37]/20 bg-[#0f172a] grayscale opacity-30'} flex items-center justify-center p-2 group-hover:scale-110 transition-transform duration-500 relative z-10\`}>
                              <span className="text-[30px] drop-shadow-xl leading-none">{cfg.badgeIcon}</span>
                            </div>
                            {isUnlocked && (
                              <div className="absolute inset-[-4px] rounded-full border-[2px] border-dashed border-[#58e0a0]/60 hover:border-[#58e0a0] animate-[spin_12s_linear_infinite] z-0 group-hover:animate-[spin_6s_linear_infinite]" />
                            )}
                          </div>
                          <span className={\`text-[9px] font-extrabold \${isUnlocked ? 'text-[#b9c6dc]' : 'text-[#b9c6dc]/60'} uppercase tracking-wide text-center w-[74px] leading-tight group-hover:text-white transition-colors\`}>{cfg.badgeName}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[#d4af37] absolute right-0 z-20 cursor-pointer hover:scale-125 hover:text-white transition-all bg-[#0a1122]/90 hover:bg-[#1c2a4c] p-1.5 rounded-full shadow-lg border border-[#d4af37]/30 backdrop-blur-sm">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </div>`;

const startIndex = txt.indexOf('            {/* LEFT COLUMN: Gamification & Tree */}');
const endIndex = txt.indexOf('            {/* RIGHT COLUMN: Sessions & Navigation */}');
if (startIndex !== -1 && endIndex !== -1) {
    const newTxt = txt.substring(0, startIndex) + replacement + '\n' + txt.substring(endIndex);
    fs.writeFileSync('src/components/ParticipantDashboard.tsx', newTxt);
    console.log('Successfully replaced Left Column');
} else {
    console.log('Could not find boundaries.');
}
