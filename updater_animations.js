const fs = require('fs');
let txt = fs.readFileSync('src/components/ParticipantDashboard.tsx', 'utf-8');

// 1. Avatar Ring Animation
const avatarOld = '<div className="absolute inset-0 bg-[#d4af37]/20 animate-pulse opacity-50 z-0"/>';
const avatarNew = '<div className="absolute inset-0 bg-[#d4af37]/20 animate-pulse opacity-50 z-0"/>\\n                    <div className="absolute inset-[-4px] rounded-full border-[2px] border-dashed border-[#d4af37]/60 animate-[spin_12s_linear_infinite] group-hover:animate-[spin_4s_linear_infinite] z-0" />';
txt = txt.replace(avatarOld, avatarNew);

// 2. Tree Magic Ring
const treeOld = '<div className="absolute inset-0 bg-[#d4af37] opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none" />';
const treeNew = '<div className="absolute inset-0 bg-[#d4af37] opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none" />\\n                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full border-[2.5px] border-dashed border-[#d4af37]/20 animate-[spin_12s_linear_infinite] group-hover:animate-[spin_4s_linear_infinite] pointer-events-none z-0" />\\n                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[190px] h-[190px] rounded-full border-[1.5px] border-dotted border-[#d4af37]/30 animate-[spin_8s_linear_infinite_reverse] group-hover:animate-[spin_2s_linear_infinite_reverse] pointer-events-none z-0" />';
txt = txt.replace(treeOld, treeNew);

// 3. Tree Flower Spin
const flowerOld = '<circle cx="100" cy="70" r="15" stroke={flowerColor} strokeWidth="1" strokeDasharray="3" fill="none" opacity={leafOpacity(5)} />';
const flowerNew = '<circle cx="100" cy="70" r="15" stroke={flowerColor} strokeWidth="2" strokeDasharray="4" fill="none" opacity={leafOpacity(5)} className="origin-[100px_70px] animate-[spin_6s_linear_infinite]" />';
txt = txt.replace(flowerOld, flowerNew);

fs.writeFileSync('src/components/ParticipantDashboard.tsx', txt);
console.log('Animation added!');
