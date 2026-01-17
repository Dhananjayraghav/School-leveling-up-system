import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SystemWindow from './SystemWindow';

interface IntroSequenceProps {
  onComplete: (username: string, grade: string) => void;
}

const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const [step, setStep] = useState(-1);
  const [text, setText] = useState('');
  const [username, setUsername] = useState('');
  const [grade, setGrade] = useState('Class 1');

  const fullText = "INITIALIZING SYSTEM...\nDETECTING USER POTENTIAL...";
  
  const GRADES = [
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
    "Class 11", "Class 12"
  ];

  // Phase -1: Visual Boot Animation
  useEffect(() => {
    if (step === -1) {
      const timer = setTimeout(() => setStep(0), 3500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Phase 0: Text Typing
  useEffect(() => {
    if (step === 0) {
      let i = 0;
      const interval = setInterval(() => {
        setText(fullText.slice(0, i));
        i++;
        if (i > fullText.length) {
          clearInterval(interval);
          setTimeout(() => setStep(1), 1000);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setStep(2);
      setTimeout(() => onComplete(username, grade), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col items-center justify-center z-50">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] pointer-events-none z-0"></div>

      <AnimatePresence mode='wait'>
        
        {/* Step -1: Visual Boot Sequence */}
        {step === -1 && (
          <motion.div
            key="intro-visual"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 5, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: "anticipate" }}
            className="relative flex items-center justify-center w-full h-full z-10"
          >
            {/* Energy Core */}
            <motion.div
              className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_100px_cyan]"
              animate={{ 
                scale: [1, 20, 0.5, 300], 
                opacity: [0, 1, 1, 0],
                backgroundColor: ["#fff", "#06b6d4", "#fff", "#000"]
              }}
              transition={{ duration: 3.5, times: [0, 0.4, 0.6, 1], ease: "easeInOut" }}
            />
          </motion.div>
        )}

        {/* Step 0: Text Typing */}
        {step === 0 && (
          <motion.div 
            key="intro-text"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="z-10 whitespace-pre-line text-center text-cyan-500 font-mono text-lg md:text-2xl drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]"
          >
            {text}
            <span className="animate-pulse">_</span>
          </motion.div>
        )}

        {/* Step 1: Recruitment Window (System Notification Style) */}
        {step === 1 && (
          <motion.div
            key="intro-window"
            exit={{ opacity: 0, scale: 0.9 }}
            className="z-20 w-full max-w-lg relative px-4"
          >
            <SystemWindow title="NOTIFICATION" type="info">
               <div className="text-center">
                  <p className="text-white text-lg md:text-xl font-medium leading-relaxed mb-8 font-[Rajdhani] tracking-wide">
                    You have acquired the qualifications to be a <span className="text-[#22d3ee] font-bold drop-shadow-[0_0_5px_cyan]">Player</span>.<br/>
                    Will you accept?
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6 max-w-xs mx-auto relative z-10">
                    <div className="group">
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#0f172a] border border-[#1e293b] group-hover:border-[#22d3ee] p-3 text-center text-white placeholder-gray-600 focus:outline-none focus:border-[#22d3ee] focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all font-mono text-sm uppercase tracking-wider"
                        autoFocus
                        placeholder="ENTER DESIGNATION"
                        required
                      />
                    </div>
                    
                    <div className="group">
                      <select 
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full bg-[#0f172a] border border-[#1e293b] group-hover:border-[#22d3ee] p-3 text-center text-white focus:outline-none focus:border-[#22d3ee] transition-all font-mono text-sm uppercase tracking-wider appearance-none"
                      >
                        {GRADES.map(g => (
                          <option key={g} value={g} className="bg-gray-900">{g}</option>
                        ))}
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className="w-full mt-4 bg-transparent border border-[#22d3ee] py-3 text-[#22d3ee] hover:bg-[#22d3ee] hover:text-black transition-all duration-300 uppercase tracking-[0.25em] font-bold text-sm shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
                    >
                      Accept Offer
                    </button>
                  </form>
               </div>
            </SystemWindow>
          </motion.div>
        )}

        {/* Step 2: Welcome */}
        {step === 2 && (
          <motion.div
            key="intro-welcome"
            initial={{ opacity: 0, filter: "blur(10px)", scale: 0.8 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            className="text-center z-10"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-8 shadow-[0_0_20px_cyan]" 
            />
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] font-sans tracking-tight">
              WELCOME, {username.toUpperCase()}
            </h1>
            <p className="text-xl text-gray-400 animate-pulse font-mono tracking-widest mb-2">
              SYSTEM ONLINE
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntroSequence;