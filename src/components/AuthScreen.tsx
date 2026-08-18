'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Info, Compass, Leaf, Sword } from 'lucide-react';
import { dbClient, User } from '../lib/db';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [screen, setScreen] = useState<'welcome' | 'assent' | 'auth'>('welcome');
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<'Participant' | 'Facilitator' | 'Admin'>('Participant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Registration fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [school, setSchool] = useState('');
  const [course, setCourse] = useState('');
  const [gradeSection, setGradeSection] = useState('');
  const [contact, setContact] = useState('');
  const [parentsName, setParentsName] = useState('');
  const [address, setAddress] = useState('');

  // Facilitator registration fields
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [designation, setDesignation] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      const user = await dbClient.verifyLogin(email.trim(), password, role);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Email not found or incorrect role.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login. Please try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !name || !password) {
      setError('Please enter your email, name, and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      const existing = await dbClient.getUserByEmail(email.trim());
      if (existing) {
        setError('This email is already registered. Please log in.');
        return;
      }

      const details = role === 'Participant' ? {
        age: parseInt(age) || 18,
        gender,
        school: school || 'Not Specified',
        grade_section: gradeSection || 'Not Specified',
        contact_number: contact || 'Not Specified',
        parents_name: parentsName || 'Not Specified',
        address: address || 'Not Specified'
      } : role === 'Facilitator' ? {
        employee_number: employeeNumber || 'Not Specified',
        birthdate: birthdate || 'Not Specified',
        address: address || 'Not Specified',
        designation: designation || 'Not Specified'
      } : {};

      const registered = await dbClient.registerUser(email.trim(), role, name, details, password);
      setSuccess('Registration successful! You may now log in.');
      setEmail(registered.email);
      setIsRegistering(false);
    } catch (err: any) {
      setError('An error occurred during registration. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-x-hidden overflow-y-auto bg-[#080f1e]"
      style={{ backgroundImage: "url('/landing-bg.png')", backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "top center" }}>

      {/* Radial soft overlay for readability only in the center, keeping edges bright */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(14,28,54,0.9) 0%, rgba(14,28,54,0.4) 50%, transparent 100%)' }} />

      {/* Background glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-mythos-gold/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-mythos-sky/10 rounded-full blur-[120px] pointer-events-none" />

      {screen === 'welcome' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative w-full min-h-[92vh] flex flex-col items-center justify-between py-10 md:py-16 z-10 gap-10"
        >
          <div className="absolute inset-0 md:inset-2 border border-mythos-gold/40 pointer-events-none z-0">
            {/* Corner Ornaments */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-mythos-gold"></div>
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-mythos-gold"></div>
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-mythos-gold"></div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-mythos-gold"></div>
          </div>

          <div className="flex-grow flex flex-col items-center justify-center space-y-6 md:space-y-8 relative z-10 text-center w-full max-w-4xl px-4 mt-8 md:mt-0">
            {/* Logo Group */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="flex flex-col items-center justify-center w-full"
            >
              {/* Logo Emblem */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                whileHover={{ scale: 1.15, rotate: 360, boxShadow: '0 0 50px rgba(255,215,0,0.8)' }}
                className="w-20 h-20 md:w-28 md:h-28 rounded-full border border-mythos-gold flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)] backdrop-blur-sm bg-black/40 relative group cursor-pointer transition-all duration-700"
              >
                <div className="absolute inset-2 border border-mythos-gold/50 rounded-full border-dashed animate-[spin_15s_linear_infinite] group-hover:animate-[spin_2s_linear_infinite]"></div>
                <Leaf className="w-10 h-10 md:w-14 md:h-14 text-[#ffeb7a] drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] flex-shrink-0 animate-[spin_8s_linear_infinite] group-hover:animate-[spin_2s_linear_infinite]" strokeWidth={1.5} />
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                whileHover={{ scale: 1.05, filter: "brightness(1.5)" }}
                className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-widest bg-gradient-to-b from-[#ffffff] via-[#ffeb7a] to-[#d4af37] bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(255,215,0,0.5)] font-serif mt-6 py-2 cursor-default transition-all duration-300"
                style={{ textShadow: '0 0 40px rgba(255,215,0,0.6), 3px 3px 6px rgba(0,0,0,0.9)' }}
              >
                MYTHOS
              </motion.h1>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-center justify-center gap-4 w-full"
            >
              <div className="w-16 md:w-32 h-px bg-gradient-to-r from-transparent to-mythos-gold/70"></div>
              <div className="w-2 h-2 rotate-45 border border-mythos-gold bg-mythos-gold/20"></div>
              <div className="w-16 md:w-32 h-px bg-gradient-to-l from-transparent to-mythos-gold/70"></div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-2 md:space-y-4 max-w-2xl mx-auto"
            >
              <p className="text-xs md:text-sm lg:text-base text-white/90 font-medium tracking-[0.2em] font-sans uppercase drop-shadow-lg px-2">
                A SAFE SPACE FOR YOU TO EXPLORE, LEARN, AND GROW. <br className="hidden md:block" />
                BEGIN YOUR JOURNEY SHAPED BY PHILIPPINE MYTHOLOGY.
              </p>
              <p className="text-mythos-gold/90 text-[10px] md:text-sm italic drop-shadow-md">
                &quot;Isang ligtas na espasyo para sa iyong pagkatuto at pag-unlad. <br className="hidden md:block" />
                Simulan ang iyong paglalakbay sa tulong ng Mitolohiyang Pilipino.&quot;
              </p>
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              whileHover={{ scale: 1.15, boxShadow: "0 0 80px rgba(255,215,0,0.9)" }}
              onClick={() => setScreen('assent')}
              className="group relative mt-4 md:mt-6 mb-4 md:mb-8 px-8 py-3 md:px-12 md:py-4 rounded-full bg-gradient-to-b from-[#ffed9b] via-[#e8c049] to-[#bf953f] text-[#3d2c0b] font-black shadow-[0_0_40px_rgba(212,175,55,0.6)] transition-all duration-300 overflow-hidden border border-[#523f14]"
            >
              <span className="relative z-10 flex flex-col items-center justify-center">
                <span className="text-sm md:text-lg tracking-widest flex items-center gap-2">
                  START YOUR JOURNEY
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    →
                  </motion.span>
                </span>
                <span className="text-[9px] md:text-xs font-bold tracking-widest uppercase opacity-80 mt-1">
                  (SIMULAN ANG PAGLALAKBAY)
                </span>
              </span>
              <div className="absolute inset-0 bg-white/30 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out" />
            </motion.button>
          </div>

          {/* Footer Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            whileHover={{ scale: 1.05 }}
            className="mb-2 md:mb-4 relative z-10 cursor-default"
          >
            <div className="flex items-center justify-between border-2 border-mythos-gold/50 bg-black/60 backdrop-blur-md px-6 py-3 rounded-md shadow-[0_0_20px_rgba(0,0,0,0.8)] hover:bg-black/80 hover:border-mythos-gold transition-colors mx-4 gap-4 md:gap-12 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-mythos-gold/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>

              <div className="flex items-center justify-center">
                <Sword className="w-5 h-5 text-mythos-gold/80 group-hover:text-mythos-sky opacity-80 transition-colors" strokeWidth={1.5} style={{ transform: 'rotate(225deg)' }} />
              </div>

              <div className="text-center font-sans tracking-widest relative z-10">
                <p className="text-mythos-gold font-bold text-[8px] md:text-[10px] uppercase mb-1">
                  DEVELOPED BY:
                </p>
                <p className="text-white font-medium text-xs md:text-sm uppercase group-hover:text-mythos-gold/90 transition-colors">
                  DEXSAN P. DE GUZMAN <span className="text-mythos-gold/70 mx-1 md:mx-2 text-[10px] md:text-xs">AND</span> AILLEN A. DIAMANTE
                </p>
                <p className="text-white/30 font-medium text-[7px] md:text-[8px] mt-2 tracking-widest uppercase group-hover:text-white/60 transition-colors">
                  &copy; 2026 Mythos CBT Intervention System. All Rights Reserved.
                </p>
              </div>

              <div className="flex items-center justify-center">
                <Sword className="w-5 h-5 text-mythos-gold/80 group-hover:text-mythos-sky opacity-80 transition-colors" strokeWidth={1.5} style={{ transform: 'rotate(45deg)' }} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {screen === 'assent' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className="w-full max-w-4xl glass-panel p-8 md:p-12 rounded-[2.5rem] relative z-10 border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.4)]"
        >
          <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10">
            <motion.div
              whileHover={{ rotate: 90, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-mythos-gold/10 border border-mythos-gold/40 flex items-center justify-center cursor-pointer shadow-[0_0_30px_rgba(212,175,55,0.2)]"
            >
              <Compass className="w-10 h-10 md:w-12 md:h-12 text-mythos-gold" />
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-mythos-gold via-yellow-200 to-mythos-gold bg-clip-text text-transparent drop-shadow-md tracking-wide">
              Data Privacy &amp; Assent Form
            </h2>
          </div>

          <div className="space-y-6 md:space-y-8 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar text-base md:text-lg text-white/95 leading-relaxed bg-black/40 p-6 md:p-10 rounded-3xl border border-white/10 text-left shadow-inner">
            <motion.div whileHover={{ scale: 1.02, x: 10 }} transition={{ type: "spring", stiffness: 300 }} className="p-4 rounded-2xl hover:bg-white/5 transition-colors duration-300">
              <p><strong>Mabuhay! Welcome to MyTHOS,</strong> a safe and guided digital space designed to support you through the stories of Philippine Mythology using Cognitive Behavioral Therapy (CBT) principles.<br />
                <em className="text-mythos-gold opacity-90 block mt-2 text-sm md:text-base">&quot;(Mabuhay! Maligayang pagdating sa MyTHOS, isang ligtas at ginagabayang espasyong digital na idinisenyo upang suportahan ka gamit ang mga kwento ng Mitolohiyang Pilipino at mga prinsipyo ng Cognitive Behavioral Therapy.)&quot;</em></p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, x: 10 }} transition={{ type: "spring", stiffness: 300 }} className="p-4 rounded-2xl hover:bg-white/5 transition-colors duration-300 border-l-2 border-transparent hover:border-mythos-sky/50">
              <h3 className="font-black text-xl md:text-2xl text-mythos-sky mb-2 drop-shadow-sm">1. Information We Collect <em className="font-normal opacity-80 italic text-[0.8em] md:text-base">(Impormasyong Kokolektahin Namin)</em></h3>
              <p>To help you progress, we will collect information such as your name, age, email, journal entries, and activity responses.<br />
                <em className="text-mythos-sky opacity-90 block mt-2 text-sm md:text-base">&quot;(Upang matulungan ka sa iyong pag-unlad, mangongolekta kami ng ilang impormasyon tulad ng iyong pangalan, edad, email, nilalaman ng iyong dyurnal, at mga sagot sa aktibidad.)&quot;</em></p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, x: 10 }} transition={{ type: "spring", stiffness: 300 }} className="p-4 rounded-2xl hover:bg-white/5 transition-colors duration-300 border-l-2 border-transparent hover:border-mythos-sky/50">
              <h3 className="font-black text-xl md:text-2xl text-mythos-sky mb-2 drop-shadow-sm">2. How We Use Your Data <em className="font-normal opacity-80 italic text-[0.8em] md:text-base">(Paano Namin Ito Gagamitin)</em></h3>
              <p>Your data will only be used to customize your MyTHOS experience, provide appropriate feedback, and for evaluation to improve the program. Your personal information will not be sold.<br />
                <em className="text-mythos-sky opacity-90 block mt-2 text-sm md:text-base">&quot;(Ang iyong data ay gagamitin lamang upang i-customize ang iyong MyTHOS experience, bigyan ka ng nararapat na feedback, at para sa evaluation upang mapaganda pa ang programa. Hindi ibebenta ang iyong personal na impormasyon.)&quot;</em></p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, x: 10 }} transition={{ type: "spring", stiffness: 300 }} className="p-4 rounded-2xl hover:bg-white/5 transition-colors duration-300 border-l-2 border-transparent hover:border-mythos-sky/50">
              <h3 className="font-black text-xl md:text-2xl text-mythos-sky mb-2 drop-shadow-sm">3. Confidentiality <em className="font-normal opacity-80 italic text-[0.8em] md:text-base">(Pagiging Kumpidensyal)</em></h3>
              <p>We will strictly protect your privacy. Only your assigned Counselor can read your journals to support your needs. Note that confidentiality is limited if what you share involves harm to yourself or others.<br />
                <em className="text-mythos-sky opacity-90 block mt-2 text-sm md:text-base">&quot;(Mahigpit naming pangangalagaan ang iyong privacy. Ang nakatalagang Counselor lamang ang makakabasa ng iyong dyurnal. Tandaan, may limitasyon ang confidentiality kung ang iyong ibinahagi ay may kinalaman sa pananakit sa sarili o sa iba.)&quot;</em></p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, x: 10 }} transition={{ type: "spring", stiffness: 300 }} className="p-4 rounded-2xl hover:bg-white/5 transition-colors duration-300 border-l-2 border-transparent hover:border-mythos-sky/50">
              <h3 className="font-black text-xl md:text-2xl text-mythos-sky mb-2 drop-shadow-sm">4. Your Assent <em className="font-normal opacity-80 italic text-[0.8em] md:text-base">(Ang Iyong Pahintulot)</em></h3>
              <p>By clicking &quot;I Agree &amp; Continue&quot;, I confirm that I understand these terms and voluntarily participate as a Learner in MyTHOS.<br />
                <em className="text-mythos-sky opacity-90 block mt-2 text-sm md:text-base">&quot;(Sa pagpindot ng &apos;I Agree &amp; Continue&apos;, pinapatunayan ko na naunawaan ko ang mga tuntuning ito, at ako ay kusang-loob na sumasali bilang Learner sa programang MyTHOS.)&quot;</em></p>
            </motion.div>
          </div>

          <div className="mt-10 flex flex-col-reverse md:flex-row justify-end items-center gap-4">
            <button
              onClick={() => setScreen('welcome')}
              className="w-full md:w-auto px-8 py-4 bg-white/5 text-white/70 font-bold text-lg rounded-full hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              Bumalik
            </button>
            <button
              onClick={() => setScreen('auth')}
              className="w-full md:w-auto group relative px-10 py-5 bg-gradient-to-r from-mythos-sky to-blue-500 text-mythos-deep font-extrabold text-xl rounded-full shadow-[0_0_30px_rgba(78,168,222,0.4)] hover:shadow-[0_0_50px_rgba(78,168,222,0.7)] hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                I Agree &amp; Continue
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700" />
            </button>
          </div>
        </motion.div>
      )}

      {screen === 'auth' && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-xl glass-panel p-8 md:p-12 rounded-[2.5rem] relative z-10 text-mythos-sand shadow-[0_0_50px_rgba(0,0,0,0.6)]"
        >
          <div className="flex flex-col items-center mb-10 text-center">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-mythos-gold/10 border border-mythos-gold/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(212,175,55,0.2)] cursor-pointer"
            >
              <Compass className="w-12 h-12 md:w-14 md:h-14 text-mythos-gold animate-spin-slow" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black tracking-[0.15em] bg-gradient-to-r from-mythos-gold via-white to-mythos-sky bg-clip-text text-transparent drop-shadow-md">
              MyTHOS
            </h1>
            <p className="text-sm md:text-base uppercase tracking-widest text-mythos-sky mt-2 font-bold flex flex-col items-center">
              <span>Philippine Mythology-Based CBT Intervention</span>
              <em className="text-[11px] md:text-xs text-mythos-gold opacity-90 normal-case italic mt-1">&quot;(CBT na Nakabatay sa Mitolohiyang Pilipino)&quot;</em>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg text-xs text-red-400 mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 mb-4">
              {success}
            </div>
          )}

          {/* Tab switch between login/register */}
          <div className="flex bg-white/5 p-2 rounded-2xl mb-8 border border-white/10">
            <button
              onClick={() => { setIsRegistering(false); setError(''); }}
              className={`flex-1 py-3 text-sm md:text-base font-bold rounded-xl transition-all duration-300 flex flex-col items-center leading-tight ${!isRegistering ? 'bg-mythos-sky text-mythos-deep shadow-[0_4px_20px_rgba(78,168,222,0.4)] scale-[1.02]' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
            >
              <span>Login</span>
              <em className="font-normal opacity-80 text-[11px] italic mt-0.5">(Mag-login)</em>
            </button>
            <button
              onClick={() => { setIsRegistering(true); setError(''); }}
              className={`flex-1 py-3 text-sm md:text-base font-bold rounded-xl transition-all duration-300 flex flex-col items-center leading-tight ${isRegistering ? 'bg-mythos-sky text-mythos-deep shadow-[0_4px_20px_rgba(78,168,222,0.4)] scale-[1.02]' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
            >
              <span>Register</span>
              <em className="font-normal opacity-80 text-[11px] italic mt-0.5">(Gumawa ng Account)</em>
            </button>
          </div>

          {/* Auth Role Select */}
          <div className="mb-6">
            <label className="block text-sm font-black text-mythos-gold uppercase tracking-widest mb-3">
              Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['Participant', 'Facilitator'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3 rounded-xl text-sm md:text-base font-bold transition-all duration-300 border hover:scale-105 ${role === r
                    ? 'border-mythos-gold bg-mythos-gold/10 text-mythos-gold font-extrabold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                >
                  {r === 'Participant' ? 'Learner' : 'Counselor'}
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm md:text-base text-white/80 mb-2 font-bold uppercase tracking-wider">
                  {role === 'Facilitator' ? 'Email Address' : 'Learner\'s Reference Number / Email Address'}
                </label>
                <input
                  type="text"
                  placeholder={role === 'Facilitator' ? 'e.g., jane@example.com' : 'e.g., 123456789012 o participant@mythos.org'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl glass-input text-base md:text-lg focus:scale-[1.02] transition-transform duration-300 mb-4"
                  required
                />
              </div>

              <div>
                <label className="block text-sm md:text-base text-white/80 mb-2 font-bold uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl glass-input text-base md:text-lg focus:scale-[1.02] transition-transform duration-300"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-mythos-gold to-yellow-500 text-mythos-deep font-black text-lg md:text-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_rgba(212,175,55,0.7)] hover:scale-105 transition-all duration-300 mt-8 cursor-pointer group"
              >
                <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Continue <em className="font-bold opacity-90 italic text-[0.8em] ml-1">(Ipagpatuloy)</em></span>
              </button>


            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">
                  {role === 'Facilitator' ? 'Email Address' : 'Learner\'s Reference Number / Email Address'}
                </label>
                <input
                  type="text"
                  placeholder={role === 'Facilitator' ? 'e.g., jane@example.com' : 'e.g., 123456789012 o john@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg glass-input text-sm mb-3"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                  required
                />
              </div>

              {role === 'Participant' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">Age</label>
                      <input
                        type="number"
                        placeholder="e.g., 20"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-Binary">Non-Binary</option>
                        <option value="Prefer Not to Say">Prefer Not to Say</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">School</label>
                    <input
                      type="text"
                      placeholder="e.g., University of the Philippines"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">Grade and Section</label>
                    <input
                      type="text"
                      placeholder="e.g., Grade 11 - Rizal"
                      value={gradeSection}
                      onChange={(e) => setGradeSection(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">Contact Number</label>
                      <input
                        type="text"
                        placeholder="e.g., 09123456789"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">Parent&apos;s Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Maria Dela Cruz"
                        value={parentsName}
                        onChange={(e) => setParentsName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">Address</label>
                    <input
                      type="text"
                      placeholder="e.g., 123 Sampaguita St., Quezon City"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                    />
                  </div>
                </>
              )}

              {role === 'Facilitator' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">Employee Number</label>
                      <input
                        type="text"
                        placeholder="e.g., EMP-12345"
                        value={employeeNumber}
                        onChange={(e) => setEmployeeNumber(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">Birthdate</label>
                      <input
                        type="date"
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">Address</label>
                    <input
                      type="text"
                      placeholder="e.g., 123 Sampaguita St., Quezon City"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/70 mb-1 font-semibold uppercase tracking-wider">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g., Guidance Counselor III"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-mythos-sky text-mythos-deep font-extrabold shadow-lg shadow-mythos-sky/20 hover:bg-mythos-teal transition-all duration-200 mt-4 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register <em className="font-normal opacity-80 text-[0.9em] italic ml-1">(Irehistro)</em></span>
              </button>
            </form>
          )}
        </motion.div>
      )}
    </div>
  );
}
