
import React, { useState, useEffect, useRef } from 'react';
import { Player, LeaderboardEntry, QuestMetric } from './types';
import { db } from './services/databaseService';
import { soundService } from './services/soundService';
import { checkForNewTitles } from './services/gameLogic';
import IntroSequence from './components/IntroSequence';
import ProfileHUD from './components/ProfileHUD';
import DungeonSystem from './components/DungeonSystem';
import QuestBoard from './components/QuestBoard';
import StatsVisualization from './components/StatsVisualization';
import SystemAssistant from './components/SystemAssistant';
import SystemAlert from './components/SystemAlert';
import DailyReportSystem from './components/DailyReportSystem';
import { User, Map, Trophy, LogOut, Globe, Users, Clock, Zap, Database, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [view, setView] = useState<'dashboard' | 'dungeon' | 'leaderboard'>('dashboard');
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'class'>('global');
  const [showReports, setShowReports] = useState(false);
  
  // Alert System
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'warning' | 'info' | 'success'>('info');
  const hasShownAlert = useRef(false);

  // Track previous level to trigger sound
  const prevLevelRef = useRef<number | null>(null);

  // Initialize and Subscribe to DB
  useEffect(() => {
    // Initial fetch
    const p = db.getPlayer();
    setPlayer(p);
    setLeaderboardData(db.getLeaderboard(leaderboardType));

    // Subscribe to real-time updates
    const unsubscribe = db.subscribe(() => {
      const updatedPlayer = db.getPlayer();
      setPlayer(updatedPlayer);
      setLeaderboardData(db.getLeaderboard(leaderboardType)); // Refresh leaderboard

      if (updatedPlayer) {
        // Check for level up sound
        if (prevLevelRef.current !== null && updatedPlayer.level > prevLevelRef.current) {
          soundService.playLevelUp();
        }
        prevLevelRef.current = updatedPlayer.level;

        // Check for New Titles
        const newTitles = checkForNewTitles(updatedPlayer);
        if (newTitles.length > 0) {
            // Update player with new titles immediately to avoid loops
            // The DB update will trigger another subscription callback, but checkForNewTitles will check against the updated list
            const finalUnlocked = [...updatedPlayer.unlockedTitles, ...newTitles];
            db.updatePlayer({ unlockedTitles: finalUnlocked });
            
            // Show Alert
            setAlertType('success');
            setAlertMessage(`DESIGNATION UNLOCKED:\n\n${newTitles.join(', ')}\n\nCheck your profile to equip.`);
            soundService.playQuestComplete();
        }
      }
    });
    
    // Check for System Warnings (Once per session load)
    if (p && !hasShownAlert.current) {
       setTimeout(() => checkSystemStatus(p), 2000); // Delay for effect
       hasShownAlert.current = true;
    }

    return unsubscribe;
  }, [leaderboardType]); // Re-subscribe/fetch when LB type changes

  const checkSystemStatus = (p: Player) => {
     const quests = db.getQuests();
     const incomplete = quests.filter(q => !q.isCompleted);
     
     if (incomplete.length > 0) {
        setAlertType('warning');
        setAlertMessage(`⚠️ ATTENTION ${p.username.toUpperCase()}:\n\nYou have ${incomplete.length} pending Daily Quests. \n\nFailure to complete objectives will result in Rank Stagnation. Immediate action recommended.`);
     } else if (p.studyMinutes < 15) {
        setAlertType('info');
        setAlertMessage(`Notice: Daily study duration is below optimal thresholds. \n\nRecommendation: Enter a Dungeon and initiate a 30-minute learning session.`);
     }
  };

  const handleRecruit = (username: string, grade: string) => {
    soundService.playClick();
    const newPlayer = db.createPlayer(username, grade);
    prevLevelRef.current = 1;
    // Trigger welcome alert
    setTimeout(() => {
        setAlertType('info');
        setAlertMessage(`System synchronized. Welcome to RankUp, ${username}. \n\nYour journey to S-Rank begins now. Check your Quest Board.`);
    }, 1000);
  };

  const logout = () => {
    db.logout();
    prevLevelRef.current = null;
    hasShownAlert.current = false;
  };

  const handleNav = (v: typeof view) => {
    soundService.playClick();
    setView(v);
  };

  // Helper for formatting time
  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Wrapper to update player via DB
  const handleUpdatePlayer = (p: Player) => {
      db.updatePlayer(p);
  };

  // Automatic Quest Progress Handler
  const handleQuestProgress = (metric: QuestMetric, amount: number) => {
      const completed = db.incrementQuestProgress(metric, amount);
      if (completed) {
          soundService.playQuestComplete();
          // We can show a toast here if we want, but sound might be enough or the alert system from DB subscription
      }
  };

  if (!player) {
    return <IntroSequence onComplete={handleRecruit} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* System Popup */}
      <AnimatePresence>
        {alertMessage && (
          <SystemAlert 
            message={alertMessage} 
            type={alertType as any} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
      </AnimatePresence>

      {/* Reports Modal */}
      <AnimatePresence>
        {showReports && (
          <DailyReportSystem 
            player={player} 
            onClose={() => setShowReports(false)} 
          />
        )}
      </AnimatePresence>

      {/* Header / Nav */}
      <header className="relative z-50 bg-gray-900/90 border-b border-cyan-900/50 backdrop-blur-md sticky top-0 shadow-lg shadow-black/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-default select-none">
            <div className="w-2 h-8 bg-cyan-500 rounded-sm shadow-[0_0_8px_cyan]"></div>
            <span className="font-bold text-xl tracking-widest text-white">RANK<span className="text-cyan-400">UP</span></span>
            <div className="ml-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-900/30 border border-green-500/30 text-[10px] text-green-400 animate-pulse">
                <Database className="w-3 h-3" />
                LIVE
            </div>
          </div>
          <nav className="hidden md:flex gap-6">
            <button 
              onClick={() => handleNav('dashboard')}
              className={`flex items-center gap-2 text-sm uppercase font-bold tracking-wider hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded px-2 py-1 ${view === 'dashboard' ? 'text-cyan-400' : 'text-gray-500'}`}
            >
              <User size={16} /> Portal
            </button>
            <button 
               onClick={() => handleNav('dungeon')}
               className={`flex items-center gap-2 text-sm uppercase font-bold tracking-wider hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded px-2 py-1 ${view === 'dungeon' ? 'text-cyan-400' : 'text-gray-500'}`}
            >
              <Map size={16} /> Dungeons
            </button>
            <button 
               onClick={() => handleNav('leaderboard')}
               className={`flex items-center gap-2 text-sm uppercase font-bold tracking-wider hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded px-2 py-1 ${view === 'leaderboard' ? 'text-cyan-400' : 'text-gray-500'}`}
            >
              <Trophy size={16} /> Rankings
            </button>
            <button 
               onClick={() => { soundService.playClick(); setShowReports(true); }}
               className={`flex items-center gap-2 text-sm uppercase font-bold tracking-wider hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded px-2 py-1 ${showReports ? 'text-cyan-400' : 'text-gray-500'}`}
            >
              <FileText size={16} /> Reports
            </button>
          </nav>
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-xs font-mono text-cyan-600 border border-cyan-900/50 px-2 py-1 rounded bg-black/30">
               ID: {player.grade}
             </div>
             <button 
              onClick={logout} 
              className="hidden md:block text-gray-500 hover:text-red-400 transition-colors focus:outline-none" 
              title="Log Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
        
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ProfileHUD player={player} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Stats Visualization */}
                  <StatsVisualization player={player} />
                  
                  {/* AI Recommendation System */}
                  <SystemAssistant player={player} />

                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="bg-gradient-to-r from-red-900/20 to-transparent border border-red-900/30 rounded-lg p-6 cursor-pointer hover:border-red-500 transition-all duration-300 group shadow-[0_0_20px_rgba(153,27,27,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                    onClick={() => handleNav('dungeon')}
                  >
                    <h3 className="text-xl font-bold text-red-400 mb-2 group-hover:text-red-300 flex items-center gap-2">
                      CONTINUE EXPLORATION <Map className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-gray-400 text-sm">Return to the dungeons and continue your ascent.</p>
                  </motion.div>
                </div>

                <div>
                  <QuestBoard player={player} onUpdatePlayer={handleUpdatePlayer} />
                </div>
              </div>
            </motion.div>
          )}

          {view === 'dungeon' && (
            <motion.div
              key="dungeon"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <DungeonSystem 
                player={player} 
                onUpdatePlayer={handleUpdatePlayer} 
                onBack={() => handleNav('dashboard')} 
                onReportActivity={handleQuestProgress}
              />
            </motion.div>
          )}

          {view === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-900/80 border border-gray-700 rounded-lg p-4 md:p-8 text-center backdrop-blur-md shadow-2xl relative overflow-hidden"
            >
               {/* Background Glow */}
               <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2 blur-[100px] rounded-full -z-10 ${leaderboardType === 'global' ? 'bg-cyan-500/10' : 'bg-purple-500/10'}`}></div>

               <Trophy className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 drop-shadow-[0_0_15px_currentColor] transition-colors ${leaderboardType === 'global' ? 'text-yellow-500' : 'text-purple-500'}`} />
               
               <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-wider">
                  {leaderboardType === 'global' ? 'GLOBAL RANKINGS' : `${player.grade.toUpperCase()} RANKINGS`}
               </h2>
               <p className="text-gray-400 mb-8 font-mono text-xs md:text-sm">
                 {leaderboardType === 'global' ? 'Elite Awakeners across the world.' : 'Top students in your immediate sector.'}
               </p>
               
               {/* Toggle Switch */}
               <div className="flex justify-center gap-4 mb-8">
                  <button 
                    onClick={() => { soundService.playClick(); setLeaderboardType('class'); }}
                    className={`flex items-center gap-2 px-6 py-2 rounded border font-mono tracking-widest transition-all duration-300 ${leaderboardType === 'class' ? 'bg-purple-900/50 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'bg-transparent border-gray-700 text-gray-500 hover:border-purple-500/50 hover:text-purple-300'}`}
                  >
                    <Users size={16} /> CLASS
                  </button>
                  <button 
                    onClick={() => { soundService.playClick(); setLeaderboardType('global'); }}
                    className={`flex items-center gap-2 px-6 py-2 rounded border font-mono tracking-widest transition-all duration-300 ${leaderboardType === 'global' ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-transparent border-gray-700 text-gray-500 hover:border-cyan-500/50 hover:text-cyan-300'}`}
                  >
                    <Globe size={16} /> GLOBAL
                  </button>
               </div>

               <div className="max-w-3xl mx-auto text-left">
                 {/* Table Header */}
                 <div className="flex justify-between items-center px-4 py-2 text-xs font-mono text-gray-500 uppercase tracking-widest border-b border-gray-800 mb-2">
                    <div className="flex-1">Rank / User</div>
                    <div className="flex gap-4 md:gap-8 text-right">
                       <span className="w-16 hidden md:block">Time</span>
                       <span className="w-12 hidden md:block">Streak</span>
                       <span className="w-12">Lvl</span>
                    </div>
                 </div>

                 <AnimatePresence mode="popLayout">
                    <motion.div className="space-y-3">
                        {leaderboardData.map((u, i) => (
                          <motion.div 
                            layoutId={u.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            key={u.id} 
                            className={`flex justify-between p-3 md:p-4 rounded border ${u.style} items-center backdrop-blur-sm transition-all duration-500`}
                          >
                            <div className="flex items-center gap-3 md:gap-4 flex-1">
                                <span className="font-mono font-bold text-lg w-8 md:w-12 text-center opacity-70">#{i + 1}</span>
                                <span className="tracking-wide text-sm md:text-base truncate">{u.name}</span>
                                {u.isPlayer && <span className="text-[10px] bg-cyan-900/50 text-cyan-400 px-1 rounded border border-cyan-500/30">YOU</span>}
                            </div>
                            <div className="flex items-center gap-4 md:gap-8 font-mono text-xs md:text-sm">
                                <div className="flex items-center gap-1 w-16 justify-end text-cyan-300/80">
                                   <Clock className="w-3 h-3 md:hidden" />
                                   <span>{formatTime(u.studyMinutes)}</span>
                                </div>
                                <div className="flex items-center gap-1 w-12 justify-end text-yellow-500/80">
                                   <Zap className="w-3 h-3 md:hidden" />
                                   <span>{u.streak}d</span>
                                </div>
                                <span className="font-bold w-12 text-right text-white">LVL {u.level}</span>
                            </div>
                          </motion.div>
                        ))}
                    </motion.div>
                 </AnimatePresence>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
      
      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-cyan-900/30 p-4 flex justify-around z-50 backdrop-blur-lg pb-safe">
        <button onClick={() => handleNav('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-cyan-400' : 'text-gray-500'}`}>
          <User size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Portal</span>
        </button>
        <button onClick={() => handleNav('dungeon')} className={`flex flex-col items-center gap-1 ${view === 'dungeon' ? 'text-cyan-400' : 'text-gray-500'}`}>
          <Map size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Dungeon</span>
        </button>
        <button onClick={() => handleNav('leaderboard')} className={`flex flex-col items-center gap-1 ${view === 'leaderboard' ? 'text-cyan-400' : 'text-gray-500'}`}>
          <Trophy size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Rank</span>
        </button>
        <button onClick={() => { soundService.playClick(); setShowReports(true); }} className={`flex flex-col items-center gap-1 ${showReports ? 'text-cyan-400' : 'text-gray-500'}`}>
          <FileText size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Log</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
