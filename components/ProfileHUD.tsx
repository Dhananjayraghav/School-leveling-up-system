
import React, { useState } from 'react';
import { Player } from '../types';
import { getRankColor } from '../services/gameLogic';
import { Shield, Zap, Book, Award, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleSelector from './TitleSelector';
import { soundService } from '../services/soundService';
import { db } from '../services/databaseService';

interface ProfileHUDProps {
  player: Player;
}

const ProfileHUD: React.FC<ProfileHUDProps> = ({ player }) => {
  const [showTitles, setShowTitles] = useState(false);

  const handleTitleUpdate = (newTitle: string) => {
    soundService.playClick();
    db.updatePlayer({ title: newTitle });
    setShowTitles(false);
  };

  return (
    <>
    <AnimatePresence>
      {showTitles && (
        <TitleSelector 
          player={player} 
          onSelectTitle={handleTitleUpdate} 
          onClose={() => setShowTitles(false)} 
        />
      )}
    </AnimatePresence>

    <div className="relative w-full mb-8 perspective-1000">
      {/* Main Hologram Container */}
      <motion.div
        initial={{ opacity: 0, rotateX: 10, scale: 0.9 }}
        animate={{ opacity: 1, rotateX: 0, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        className="relative bg-[#0a0514]/90 p-8 md:p-12 overflow-hidden rounded-xl border border-purple-500/30"
        style={{
          boxShadow: "0 0 50px rgba(168, 85, 247, 0.25), inset 0 0 30px rgba(168, 85, 247, 0.1)"
        }}
      >
        {/* === Background Magic Circles (Portal Effect) === */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
             {/* Rotating Ring 1 (Slow) */}
             <motion.svg 
               viewBox="0 0 100 100" 
               className="absolute w-[140%] h-[140%] opacity-20 text-purple-500"
               animate={{ rotate: 360 }}
               transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
             >
                <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.2" strokeDasharray="5 5" fill="none" />
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.1" fill="none" />
                <path d="M50 2 L50 10 M50 90 L50 98 M2 50 L10 50 M90 50 L98 50" stroke="currentColor" strokeWidth="0.5" />
             </motion.svg>

             {/* Rotating Ring 2 (Fast Reverse) */}
             <motion.svg 
               viewBox="0 0 100 100" 
               className="absolute w-[100%] h-[100%] opacity-30 text-fuchsia-500"
               animate={{ rotate: -360 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             >
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" strokeDasharray="20 10" fill="none" />
             </motion.svg>
             
            {/* Radial Core Glow */}
            <div className="absolute w-2/3 h-2/3 bg-purple-600/20 blur-[80px] rounded-full mix-blend-screen"></div>
            
            {/* Scanlines */}
            <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none"></div>
        </div>

        {/* === Frame Borders (The "Gate" look) === */}
        {/* Top/Bottom Heavy Bars */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_15px_#a855f7]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_15px_#a855f7]"></div>

        {/* Corner Brackets */}
        <svg className="absolute top-2 left-2 w-12 h-12 text-purple-400 drop-shadow-[0_0_5px_currentColor]" viewBox="0 0 50 50" fill="none">
            <path d="M2 15 V 2 H 15" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
        </svg>
        <svg className="absolute top-2 right-2 w-12 h-12 text-purple-400 drop-shadow-[0_0_5px_currentColor]" viewBox="0 0 50 50" fill="none">
            <path d="M35 2 H 48 V 15" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
        </svg>
        <svg className="absolute bottom-2 left-2 w-12 h-12 text-purple-400 drop-shadow-[0_0_5px_currentColor]" viewBox="0 0 50 50" fill="none">
            <path d="M2 35 V 48 H 15" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
        </svg>
        <svg className="absolute bottom-2 right-2 w-12 h-12 text-purple-400 drop-shadow-[0_0_5px_currentColor]" viewBox="0 0 50 50" fill="none">
            <path d="M35 48 H 48 V 35" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
        </svg>

        {/* === Content === */}
        <div className="relative z-10 flex flex-col items-center text-center">

            {/* Top Label */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-2"
            >
                <div className="inline-block px-4 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full backdrop-blur-sm">
                    <span className="text-xs md:text-sm tracking-[0.3em] text-cyan-300 font-bold uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] font-mono">
                        System • Designation
                    </span>
                </div>
            </motion.div>

            {/* Main Name */}
            <motion.h1 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-100 to-purple-300 tracking-tighter uppercase mb-2 drop-shadow-[0_0_30px_rgba(168,85,247,0.8)]"
              style={{ fontFamily: "'Rajdhani', sans-serif", textShadow: "0 4px 0 rgba(0,0,0,0.5)" }}
            >
                {player.username}
            </motion.h1>
            
            {/* Sub-Title / Status - Clickable */}
             <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => { soundService.playClick(); setShowTitles(true); }}
              className="group relative cursor-pointer inline-block"
            >
              <div className="text-lg md:text-xl text-purple-200 tracking-[0.5em] font-light mb-8 uppercase flex items-center gap-2 justify-center group-hover:text-cyan-300 transition-colors">
                 {player.title}
                 <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-cyan-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                 [CLICK TO MODIFY DESIGNATION]
              </div>
            </motion.div>

            {/* Glowing Divider */}
            <div className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-8 shadow-[0_0_10px_#d946ef]"></div>

            {/* Rank / Level Box */}
            <div className="flex justify-center items-center gap-8 mb-8">
                 <div className="text-center">
                    <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Rank</div>
                    <div className={`text-5xl font-black italic ${getRankColor(player.rank)} drop-shadow-[0_0_20px_currentColor]`}>
                        {player.rank}
                    </div>
                 </div>
                 
                 <div className="h-12 w-[1px] bg-purple-800"></div>
                 
                 <div className="text-center">
                    <div className="text-xs text-cyan-400 uppercase tracking-widest mb-1">Level</div>
                    <div className="text-5xl font-black text-white drop-shadow-[0_0_10px_white]">
                        {player.level}
                    </div>
                 </div>
            </div>

            {/* EXP Bar */}
            <div className="w-full max-w-2xl mx-auto mb-8 group">
                <div className="flex justify-between items-end mb-2 px-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-purple-300 font-mono uppercase tracking-widest">Sync Rate (EXP)</span>
                    <span className="text-[10px] text-white font-mono">{Math.floor((player.currentExp / player.maxExp) * 100)}%</span>
                </div>
                <div className="h-4 bg-black/80 border border-purple-600/30 skew-x-[-15deg] overflow-hidden relative shadow-[0_0_20px_rgba(147,51,234,0.1)]">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(player.currentExp / player.maxExp) * 100}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-900 via-fuchsia-600 to-white skew-x-[15deg] -ml-2 box-content pr-2 shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                    />
                </div>
            </div>

            {/* Bottom Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl border-t border-purple-500/10 pt-6">
                 <StatItem icon={Book} label="Study Time" value={`${Math.floor(player.studyMinutes / 60)}h ${player.studyMinutes % 60}m`} />
                 <StatItem icon={Zap} label="Streak" value={`${player.streakDays} Days`} />
                 <StatItem icon={Shield} label="Defense" value={(player.level * 5) + 10} />
                 <StatItem icon={Award} label="Class" value={player.grade} />
            </div>

        </div>
      </motion.div>
    </div>
    </>
  );
};

const StatItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-3 rounded bg-purple-900/10 border border-purple-500/10 hover:border-purple-500/50 hover:bg-purple-900/20 transition-all cursor-default group">
        <Icon className="w-4 h-4 text-purple-400 mb-2 group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_5px_cyan] transition-colors" />
        <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">{label}</div>
        <div className="font-mono font-bold text-white text-base tracking-wide">{value}</div>
    </div>
);

export default ProfileHUD;
