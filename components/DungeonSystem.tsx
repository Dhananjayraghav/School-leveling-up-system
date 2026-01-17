
import React, { useState, useEffect, useRef } from 'react';
import { Player, Subject, Chapter, BossEncounter, QuizQuestion, QuestMetric } from '../types';
import { MOCK_SUBJECTS, addExp } from '../services/gameLogic';
import { generateBossQuiz } from '../services/geminiService';
import { soundService } from '../services/soundService';
import { Sword, Scroll, ArrowLeft, Skull, CheckCircle, Brain, Clock, Lock, Filter, ChevronRight, Zap, Play, FileText, List, AlertTriangle, Activity, ChevronLeft, RotateCcw, XCircle, Check } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import SystemWindow from './SystemWindow';

interface DungeonSystemProps {
  player: Player;
  onUpdatePlayer: (p: Player) => void;
  onBack: () => void;
  onReportActivity: (metric: QuestMetric, amount: number) => void;
}

type ChapterViewMode = 'hub' | 'notes' | 'summary';

const DungeonSystem: React.FC<DungeonSystemProps> = ({ player, onUpdatePlayer, onBack, onReportActivity }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [chapterViewMode, setChapterViewMode] = useState<ChapterViewMode>('hub');

  const [isBossBattle, setIsBossBattle] = useState(false);
  const [bossData, setBossData] = useState<BossEncounter | null>(null);
  const [loadingBoss, setLoadingBoss] = useState(false);
  
  // Timer State
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [bossHealth, setBossHealth] = useState(100);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [victory, setVictory] = useState(false);
  
  // Stats tracking for current session
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  
  // UI Interaction State for Quiz
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | null>(null);

  // 3D Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const autoRotateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Filter subjects for the player's grade
  const availableSubjects = MOCK_SUBJECTS.filter(sub => sub.allowedGrades.includes(player.grade));
  const subjectCount = availableSubjects.length;

  const getChapterKey = (subId: string, chapId: string) => `${subId}_${chapId}`;

  // Update Progress Helper
  const updateProgress = (subId: string, chapId: string, field: keyof import('../types').ChapterProgress) => {
    const key = getChapterKey(subId, chapId);
    const currentProgress = player.dungeonProgress?.[key] || { notesRead: false, summaryRead: false, bossDefeated: false };
    
    if (!currentProgress[field]) {
       const newProgress = { ...currentProgress, [field]: true };
       onUpdatePlayer({
         ...player,
         dungeonProgress: {
            ...player.dungeonProgress,
            [key]: newProgress
         }
       });

       // If fully exploring a chapter (reading summary usually implies reading notes first in this flow)
       // We can trigger 'chapter_complete' quest progress here
       if (field === 'summaryRead' || field === 'notesRead') {
          // Note: "Complete 1 Chapter" might be vague. Let's assume reading summary counts as "clearing" the reading part.
          onReportActivity('chapter_complete', 1); 
       }
    }
  };

  // Reset timer/mode when entering a new chapter
  useEffect(() => {
    if (activeChapter) {
      setSessionSeconds(0);
      setChapterViewMode('hub');
    }
  }, [activeChapter]);

  // Study Timer Logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (activeChapter && !isBossBattle && chapterViewMode === 'notes') {
      timer = setInterval(() => {
        setSessionSeconds(prev => {
          const next = prev + 1;
          if (next > 0 && next % 60 === 0) {
             // Update Player Stats
             onUpdatePlayer({ ...player, studyMinutes: player.studyMinutes + 1 });
             // Report Activity for Quests
             onReportActivity('study_minutes', 1);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeChapter, isBossBattle, chapterViewMode, player, onUpdatePlayer, onReportActivity]);

  // Track Views (Notes/Summary)
  useEffect(() => {
     if (selectedSubject && activeChapter) {
        if (chapterViewMode === 'notes') {
           updateProgress(selectedSubject.id, activeChapter.id, 'notesRead');
        } else if (chapterViewMode === 'summary') {
           updateProgress(selectedSubject.id, activeChapter.id, 'summaryRead');
        }
     }
  }, [chapterViewMode, selectedSubject, activeChapter]);

  // Auto-Rotation Logic for Carousel
  useEffect(() => {
    if (isAutoRotating && !selectedSubject && !activeChapter) {
      autoRotateTimerRef.current = setInterval(() => {
        setCarouselIndex(prev => prev + 1);
      }, 5000); // Auto rotate every 5 seconds
    }

    return () => {
      if (autoRotateTimerRef.current) clearInterval(autoRotateTimerRef.current);
    };
  }, [isAutoRotating, selectedSubject, activeChapter]);

  const stopAutoRotation = () => {
    setIsAutoRotating(false);
    if (autoRotateTimerRef.current) clearInterval(autoRotateTimerRef.current);
  };

  // Unified Back Navigation
  const handleBackNavigation = () => {
    soundService.playClick();
    if (loadingBoss) return; 

    if (isBossBattle) {
      // Retreating from Boss -> Return to Chapter Hub
      setIsBossBattle(false);
      setBossData(null);
      setChapterViewMode('hub');
      return;
    }

    if (activeChapter) {
      if (chapterViewMode !== 'hub') {
        // Leaving Notes/Summary -> Return to Hub
        setChapterViewMode('hub');
        return;
      }
      // Leaving Chapter Hub -> Return to Floor List
      setActiveChapter(null);
      return;
    }
    
    if (selectedSubject) {
      // Leaving Subject -> Back to Gate Selection
      setSelectedSubject(null);
      return;
    }
    
    // Leaving Dungeon System -> Dashboard
    onBack(); 
  };

  const handleStartBoss = async () => {
    if (!selectedSubject) return;
    soundService.playClick();
    setLoadingBoss(true);
    const boss = await generateBossQuiz(selectedSubject.name, activeChapter ? activeChapter.title : 'General Knowledge', player.rank);
    setBossData(boss);
    setBossHealth(boss.maxHealth);
    setPlayerHealth(100);
    setCurrentQuestionIndex(0);
    setQuizCompleted(false);
    setSelectedOption(null);
    setAnswerStatus(null);
    setSessionCorrect(0);
    setSessionTotal(0);
    setIsBossBattle(true);
    setLoadingBoss(false);
    soundService.playBossStart();
  };

  const handleAnswer = (optionIndex: number) => {
    if (!bossData || selectedOption !== null) return;
    
    setSelectedOption(optionIndex);
    const currentQ = bossData.questions[currentQuestionIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;
    
    setAnswerStatus(isCorrect ? 'correct' : 'wrong');
    
    // Report Activity (Attempting a question counts towards activity, or strictly correct?)
    // Usually "Answer 10 Questions" implies attempting, but "Correctly" implies skill. 
    // Let's count *correct* answers for the quest to make it harder, or just count attempts?
    // The previous prompt said "Solve 10 Math problems", usually implies solving correctly.
    // Let's report only correct answers for 'questions_answered' to match 'Logic Calibration'.
    if (isCorrect) {
       onReportActivity('questions_answered', 1);
    }
    
    // Track stats
    setSessionTotal(prev => prev + 1);
    if (isCorrect) setSessionCorrect(prev => prev + 1);

    let nextBossHealth = bossHealth;
    let nextPlayerHealth = playerHealth;

    if (isCorrect) {
      soundService.playCorrect();
      const damage = Math.floor(bossData.maxHealth / bossData.questions.length);
      nextBossHealth = Math.max(0, bossHealth - damage);
      setBossHealth(nextBossHealth);
    } else {
      soundService.playWrong();
      nextPlayerHealth = Math.max(0, playerHealth - 25);
      setPlayerHealth(nextPlayerHealth);
    }

    setTimeout(() => {
      setSelectedOption(null);
      setAnswerStatus(null);
      
      if (nextPlayerHealth <= 0) {
        finishQuiz(false, sessionCorrect + (isCorrect ? 1 : 0), sessionTotal + 1);
      } else if (nextBossHealth <= 0) {
        finishQuiz(true, sessionCorrect + (isCorrect ? 1 : 0), sessionTotal + 1);
      } else if (currentQuestionIndex < bossData.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Ran out of questions
        finishQuiz(nextBossHealth <= 0, sessionCorrect + (isCorrect ? 1 : 0), sessionTotal + 1);
      }
    }, 1500);
  };

  const finishQuiz = (isVictory: boolean, finalCorrect: number, finalTotal: number) => {
    setVictory(isVictory);
    setQuizCompleted(true);
    
    // Calculate new stats
    const updatedStats = {
        totalQuestionsAnswered: player.stats.totalQuestionsAnswered + finalTotal,
        totalQuestionsCorrect: player.stats.totalQuestionsCorrect + finalCorrect,
        bossesDefeated: player.stats.bossesDefeated + (isVictory ? 1 : 0)
    };

    if (isVictory && selectedSubject && activeChapter) {
      soundService.playQuestComplete();
      const expGain = 250; 
      
      // Report Boss Defeat
      onReportActivity('boss_defeat', 1);

      // Update boss progress
      const key = getChapterKey(selectedSubject.id, activeChapter.id);
      const currentProgress = player.dungeonProgress?.[key] || { notesRead: false, summaryRead: false, bossDefeated: false };
      const newProgress = { ...currentProgress, bossDefeated: true };

      onUpdatePlayer({
          ...addExp(player, expGain),
          stats: updatedStats,
          dungeonProgress: {
              ...player.dungeonProgress,
              [key]: newProgress
          }
      });
    } else {
      soundService.playFail();
      // Even on failure, update question stats
      onUpdatePlayer({
          ...player,
          stats: updatedStats
      });
    }
  };

  // Carousel Logic
  const rotateCarousel = (direction: 'left' | 'right') => {
    stopAutoRotation();
    soundService.playClick();
    setCarouselIndex(prev => direction === 'left' ? prev - 1 : prev + 1);
  };

  const handleCardClick = (index: number, sub: Subject) => {
    stopAutoRotation();
    // Calculate normalized index to see if it's the current front card
    const normalizedCurrent = ((carouselIndex % subjectCount) + subjectCount) % subjectCount;
    
    if (normalizedCurrent === index) {
      soundService.playClick();
      setSelectedSubject(sub);
    } else {
      // Rotate to this card
      // Find shortest path
      let diff = index - normalizedCurrent;
      if (diff > subjectCount / 2) diff -= subjectCount;
      if (diff < -subjectCount / 2) diff += subjectCount;
      
      soundService.playClick();
      setCarouselIndex(prev => prev + diff);
    }
  };

  // Helper to get icon component dynamically
  const getIcon = (iconName: string, className?: string) => {
    // Access icon from the namespace object
    const Icon = (LucideIcons as any)[iconName] || Scroll;
    return <Icon className={className || "w-8 h-8 md:w-10 md:h-10"} />;
  };

  // Helper component for progress indicators
  const ProgressIcon = ({ active, icon: Icon, tooltip, isBoss }: any) => (
      <div className={`p-1 rounded ${active ? (isBoss ? 'bg-red-900/40 text-red-400' : 'bg-cyan-900/40 text-cyan-400') : 'bg-gray-800 text-gray-600'} border ${active ? (isBoss ? 'border-red-500/50' : 'border-cyan-500/50') : 'border-gray-700'}`} title={tooltip}>
          <Icon className="w-3 h-3" />
      </div>
  );

  // Carousel Geometry
  const cardWidth = 280; // px
  // Adjust radius based on count to keep items spaced
  const radius = Math.max(400, (subjectCount * (cardWidth + 20)) / (2 * Math.PI)); 
  const anglePerCard = 360 / subjectCount;

  return (
    <AnimatePresence mode="wait">
      {/* Loading State */}
      {loadingBoss && (
        <motion.div 
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-64 text-red-500 animate-pulse"
        >
          <Skull className="w-16 h-16 mb-4" />
          <h2 className="text-2xl font-bold tracking-widest">SUMMONING BOSS...</h2>
        </motion.div>
      )}

      {/* Boss Battle View (Quiz) */}
      {!loadingBoss && isBossBattle && bossData && (
        <motion.div 
          key="boss"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="h-full"
        >
          {quizCompleted ? (
             <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <SystemWindow 
                    title="NOTIFICATION" 
                    type={victory ? 'success' : 'warning'}
                    width="max-w-md w-full"
                >
                     <div className="text-center">
                        <h2 className={`text-4xl font-bold mb-4 tracking-wider ${victory ? 'text-yellow-400' : 'text-red-500'} drop-shadow-[0_0_10px_currentColor]`}>
                           {victory ? 'DUNGEON CLEARED' : 'YOU DIED'}
                        </h2>
                        <p className="text-xl text-white mb-8 font-[Rajdhani] tracking-wide">
                           {victory ? 'Rewards Obtained: 250 EXP' : 'The boss proved too strong.'}
                        </p>

                        <button 
                           onClick={() => { setIsBossBattle(false); setBossData(null); setChapterViewMode('hub'); soundService.playClick(); }}
                           className="bg-transparent border py-3 px-8 uppercase tracking-[0.2em] font-bold transition-all hover:text-black w-full"
                           style={{ 
                               borderColor: victory ? '#fbbf24' : '#ef4444', 
                               color: victory ? '#fbbf24' : '#ef4444' 
                           }}
                           onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = victory ? '#fbbf24' : '#ef4444'; }}
                           onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                           Return to Base
                        </button>
                     </div>
                </SystemWindow>
             </div>
          ) : (
             <div className="max-w-2xl mx-auto p-4">
               {/* HUDs */}
               <div className="space-y-4 mb-8">
                 {/* Boss Health Bar */}
                 <motion.div 
                   animate={answerStatus === 'correct' ? { x: [-5, 5, -5, 5, 0], backgroundColor: 'rgba(127, 29, 29, 0.8)' } : { backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                   transition={{ duration: 0.4 }}
                   className="flex justify-between items-center p-4 rounded border border-red-900 shadow-lg relative overflow-hidden"
                 >
                   <div className="text-red-500 font-bold text-xl flex items-center gap-2 relative z-10">
                     <Skull className={answerStatus === 'correct' ? "animate-bounce" : "animate-pulse"} /> {bossData.name}
                   </div>
                   <div className="w-48 h-4 bg-gray-900 rounded border border-red-800 overflow-hidden relative z-10">
                      <motion.div 
                        className="h-full bg-red-600"
                        initial={{ width: "100%" }}
                        animate={{ width: `${(bossHealth / bossData.maxHealth) * 100}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      />
                   </div>
                   {/* Damage Flash Effect */}
                   <AnimatePresence>
                     {answerStatus === 'correct' && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.5, 0] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 bg-red-500 z-0"
                        />
                     )}
                   </AnimatePresence>
                 </motion.div>

                 {/* Player Health Bar */}
                 <motion.div 
                   animate={answerStatus === 'wrong' ? { x: [-5, 5, -5, 5, 0], borderColor: '#ef4444' } : { borderColor: '#164e63' }}
                   className="flex justify-between items-center bg-black/60 p-4 rounded border shadow-lg"
                 >
                    <div className="text-cyan-500 font-bold flex items-center gap-2">
                     <Sword /> {player.username}
                    </div>
                    <div className="w-48 h-4 bg-gray-900 rounded border border-cyan-800 overflow-hidden relative">
                      <motion.div 
                        className="h-full bg-cyan-600"
                        initial={{ width: "100%" }}
                        animate={{ width: `${playerHealth}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      />
                   </div>
                 </motion.div>
               </div>

               {/* Question */}
               <motion.div 
                 key={currentQuestionIndex}
                 initial={{ opacity: 0, x: 50 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -50 }}
                 className="bg-gray-900/90 border border-gray-700 p-6 rounded-lg shadow-xl backdrop-blur-md"
               >
                  <h3 className="text-xl text-white mb-6 font-semibold leading-relaxed">Q{currentQuestionIndex + 1}: {bossData.questions[currentQuestionIndex].question}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {bossData.questions[currentQuestionIndex].options.map((opt, idx) => {
                       const isSelected = selectedOption === idx;
                       const isCorrectOption = idx === bossData.questions[currentQuestionIndex].correctIndex;
                       
                       let buttonStyle = "bg-gray-800 border-gray-700 hover:bg-cyan-900/50 hover:border-cyan-500 text-gray-300";
                       let icon = <div className="w-6 font-mono text-cyan-500">{String.fromCharCode(65 + idx)}.</div>;

                       if (selectedOption !== null) {
                           if (isSelected) {
                               if (isCorrectOption) {
                                   buttonStyle = "bg-green-900/40 border-green-500 text-green-100 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                                   icon = <CheckCircle className="w-6 text-green-400" />;
                               } else {
                                   buttonStyle = "bg-red-900/40 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                                   icon = <XCircle className="w-6 text-red-400" />;
                               }
                           } else if (isCorrectOption) {
                               buttonStyle = "bg-green-900/20 border-green-500/50 text-green-100/70";
                               icon = <Check className="w-6 text-green-500/70" />;
                           } else {
                               buttonStyle = "bg-gray-900/50 border-gray-800 text-gray-600 cursor-not-allowed";
                           }
                       }

                       return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          disabled={selectedOption !== null}
                          className={`flex items-center text-left p-4 rounded transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 ${buttonStyle}`}
                        >
                          <span className="mr-3">{icon}</span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
               </motion.div>
             </div>
          )}
        </motion.div>
      )}

      {/* Chapter View (Content) */}
      {!loadingBoss && !isBossBattle && activeChapter && selectedSubject && (
         <motion.div 
           key="chapter-container"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="h-full flex flex-col relative"
         >
           {/* Header */}
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 border-b border-gray-800 pb-4">
             <div>
                <button onClick={handleBackNavigation} className="flex items-center text-gray-500 hover:text-white transition-colors mb-2 text-sm uppercase tracking-wide">
                  <ArrowLeft className="w-4 h-4 mr-1" /> 
                  {chapterViewMode === 'hub' ? 'Leave Floor' : 'Back to Hub'}
                </button>
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-900/20 rounded border border-purple-500/30">
                     {getIcon(selectedSubject.icon, "w-8 h-8 text-purple-400")}
                   </div>
                   <div>
                       <h2 className="text-2xl text-white font-black tracking-wider uppercase">
                         {activeChapter.title}
                       </h2>
                       <div className="flex gap-2 text-xs font-mono mt-1">
                          <span className="text-purple-400">SECTOR: {selectedSubject.name.toUpperCase()}</span>
                          <span className="text-gray-600">|</span>
                          <span className="text-cyan-400">STATUS: {chapterViewMode.toUpperCase()}</span>
                       </div>
                   </div>
                </div>
             </div>
           </div>

           {/* --- HUB MODE --- */}
           {chapterViewMode === 'hub' && (
             <motion.div 
               key="hub"
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full content-start"
             >
                {/* Notes Option */}
                <div 
                  onClick={() => { soundService.playClick(); setChapterViewMode('notes'); }}
                  className="group bg-gray-900/50 border border-gray-700 hover:border-cyan-500 hover:bg-cyan-900/10 p-8 rounded-xl cursor-pointer transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden"
                >
                   <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="p-4 bg-gray-800 rounded-full group-hover:bg-cyan-900 group-hover:text-cyan-400 transition-colors">
                      <FileText className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-bold text-white tracking-widest">ARCHIVES</h3>
                   <p className="text-sm text-gray-400 group-hover:text-gray-300">Access detailed study notes and full content for this floor.</p>
                </div>

                {/* Summary Option */}
                <div 
                  onClick={() => { soundService.playClick(); setChapterViewMode('summary'); }}
                  className="group bg-gray-900/50 border border-gray-700 hover:border-purple-500 hover:bg-purple-900/10 p-8 rounded-xl cursor-pointer transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden"
                >
                   <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="p-4 bg-gray-800 rounded-full group-hover:bg-purple-900 group-hover:text-purple-400 transition-colors">
                      <List className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-bold text-white tracking-widest">SYNOPSIS</h3>
                   <p className="text-sm text-gray-400 group-hover:text-gray-300">Quick summary and key bullet points for rapid assimilation.</p>
                </div>

                {/* Quiz Option */}
                <div 
                  onClick={() => handleStartBoss()}
                  className="group bg-gray-900/50 border border-gray-700 hover:border-red-500 hover:bg-red-900/10 p-8 rounded-xl cursor-pointer transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden"
                >
                   <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="p-4 bg-gray-800 rounded-full group-hover:bg-red-900 group-hover:text-red-400 transition-colors">
                      <Skull className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-bold text-white tracking-widest">BATTLE</h3>
                   <p className="text-sm text-gray-400 group-hover:text-gray-300">Challenge the floor boss with a quiz to earn EXP.</p>
                </div>
             </motion.div>
           )}

           {/* --- NOTES MODE --- */}
           {chapterViewMode === 'notes' && (
             <motion.div
               key="notes"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex flex-col h-full bg-black/20 rounded border border-gray-800 overflow-hidden"
             >
                {/* Enhanced Sticky Timer HUD */}
                <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-md border-b border-cyan-500/30 p-3 shadow-lg">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="relative flex items-center justify-center w-8 h-8 bg-cyan-900/30 rounded border border-cyan-500/50">
                            <Clock className="w-4 h-4 text-cyan-400 animate-[pulse_2s_infinite]" />
                         </div>
                         <div>
                            <div className="text-[10px] text-cyan-500/70 font-mono font-bold tracking-widest uppercase mb-0.5">Session Uplink</div>
                            <div className="text-lg text-cyan-400 font-mono font-bold tracking-widest leading-none">
                              {Math.floor(sessionSeconds / 60).toString().padStart(2, '0')}:{ (sessionSeconds % 60).toString().padStart(2, '0')}
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300/80">
                             <Activity className="w-3 h-3" />
                             <span className="tracking-wider">SYNCING</span>
                          </div>
                          <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                             <motion.div 
                                className="h-full bg-cyan-400 shadow-[0_0_8px_cyan]"
                                animate={{ width: `${((sessionSeconds % 60) / 60) * 100}%` }}
                                transition={{ ease: "linear" }}
                             />
                          </div>
                      </div>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
                   <div className="prose prose-invert max-w-none prose-headings:text-cyan-400 prose-p:text-gray-300 prose-li:text-gray-400 prose-strong:text-cyan-200">
                      <h3 className="flex items-center gap-2 text-white border-b border-gray-800 pb-2 mb-4">
                        <FileText className="w-5 h-5 text-cyan-500" /> Full Archives
                      </h3>
                      <div className="whitespace-pre-wrap font-sans text-lg leading-relaxed">
                        {activeChapter.content}
                      </div>
                   </div>
                </div>
             </motion.div>
           )}

           {/* --- SUMMARY MODE --- */}
           {chapterViewMode === 'summary' && (
             <motion.div
               key="summary"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex flex-col h-full"
             >
                <div className="flex-1 bg-purple-900/10 p-8 rounded border border-purple-500/30 overflow-y-auto shadow-[0_0_20px_rgba(168,85,247,0.05)]">
                   <h3 className="flex items-center gap-2 text-purple-300 border-b border-purple-500/30 pb-4 mb-6 text-xl font-bold tracking-widest">
                      <List className="w-6 h-6" /> TACTICAL SYNOPSIS
                   </h3>
                   <div className="space-y-4">
                      {activeChapter.summary.split('\n').map((line, i) => (
                        <div key={i} className="flex items-start gap-3">
                           <div className="mt-1.5 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></div>
                           <p className="text-lg text-gray-200">{line.replace(/^- /, '')}</p>
                        </div>
                      ))}
                   </div>
                   <div className="mt-8 p-4 bg-black/40 rounded border border-purple-500/20 text-sm text-gray-500 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-purple-400" />
                      <span>Review this synopsis before engaging the floor boss.</span>
                   </div>
                </div>
             </motion.div>
           )}

         </motion.div>
      )}

      {/* Chapter (Floor) Selection View */}
      {!loadingBoss && !isBossBattle && !activeChapter && selectedSubject && (
        <motion.div
           key="chapters"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
           className="relative"
        >
          <div className="flex flex-col mb-6 pb-4 border-b border-gray-800">
             <button onClick={handleBackNavigation} className="flex items-center text-gray-500 hover:text-white transition-colors mb-2 w-fit">
               <ArrowLeft className="w-4 h-4 mr-1"/> RETURN TO GATES
             </button>
             <div className="flex items-center gap-3">
               <div className="p-2 bg-purple-900/20 rounded border border-purple-500/30">
                 {getIcon(selectedSubject.icon, "w-8 h-8 md:w-10 md:h-10 text-purple-400")}
               </div>
               <div>
                  <h2 className="text-3xl font-black text-white tracking-wider uppercase">
                    SECTOR: {selectedSubject.name}
                  </h2>
                  <div className="text-xs text-purple-400 font-mono tracking-[0.2em] mt-1">
                    SELECT A FLOOR TO INITIATE SYNCHRONIZATION
                  </div>
               </div>
             </div>
          </div>

          <div className="grid gap-4 max-w-4xl mx-auto">
             {selectedSubject.chapters.length > 0 ? selectedSubject.chapters.map((chapter, index) => {
                const progressKey = getChapterKey(selectedSubject.id, chapter.id);
                const progress = player.dungeonProgress?.[progressKey] || { notesRead: false, summaryRead: false, bossDefeated: false };

                return (
                <motion.div 
                  key={chapter.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    soundService.playClick();
                    setActiveChapter(chapter);
                  }}
                  className="flex items-center bg-gray-900/40 border border-gray-700 hover:border-cyan-500 p-4 rounded-lg cursor-pointer group transition-all"
                >
                   {/* Floor Badge */}
                   <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-black border border-gray-800 rounded font-mono font-bold text-gray-500 group-hover:text-cyan-400 group-hover:border-cyan-900 transition-colors">
                      <div className="text-center">
                        <div className="text-[10px] uppercase">Floor</div>
                        <div className="text-xl">{(index + 1).toString().padStart(2, '0')}</div>
                      </div>
                   </div>

                   {/* Info */}
                   <div className="ml-6 flex-1">
                      <h3 className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">
                        {chapter.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-1 group-hover:text-gray-400">
                         {chapter.content.substring(0, 60)}...
                      </p>
                   </div>

                   {/* Progress Indicators */}
                   <div className="ml-4 flex flex-col gap-1 items-end">
                      <div className="flex gap-1">
                          <ProgressIcon active={progress.notesRead} icon={FileText} tooltip="Archives Read" />
                          <ProgressIcon active={progress.summaryRead} icon={List} tooltip="Synopsis Read" />
                          <ProgressIcon active={progress.bossDefeated} icon={Skull} tooltip="Boss Defeated" isBoss />
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                          {progress.bossDefeated ? 'CLEARED' : 'INCOMPLETE'}
                      </div>
                   </div>

                   {/* Action */}
                   <div className="ml-4 opacity-50 group-hover:opacity-100 transition-opacity text-cyan-500">
                      <Play className="w-6 h-6 fill-current" />
                   </div>
                </motion.div>
             )}) : (
                <div className="p-8 text-center border border-dashed border-gray-800 rounded-lg text-gray-500">
                   No floors detected in this sector.
                </div>
             )}
          </div>
        </motion.div>
      )}

      {/* Dungeon Gate 3D Ring Selection Interface */}
      {!loadingBoss && !isBossBattle && !activeChapter && !selectedSubject && (
        <motion.div 
          key="subjects-ring"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative h-screen max-h-[700px] flex flex-col"
        >
          {/* Header Area */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 z-10 relative pointer-events-none">
             <div className="pointer-events-auto">
                <button onClick={handleBackNavigation} className="flex items-center text-gray-500 hover:text-white transition-colors mb-2"><ArrowLeft className="w-4 h-4 mr-1"/> RETURN</button>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-400 tracking-wider drop-shadow-lg">
                  DUNGEON GATES
                </h2>
             </div>
             
             <div className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-purple-900/20 border border-purple-500/50 rounded-full backdrop-blur pointer-events-auto">
                <Filter className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-300 font-bold tracking-widest">
                  CLEARANCE: <span className="text-white">{player.grade.toUpperCase()}</span>
                </span>
             </div>
          </div>

          {availableSubjects.length > 0 ? (
            <div 
               className="flex-1 relative flex items-center justify-center overflow-hidden my-8"
               style={{ perspective: '2000px' }} // Deep perspective
            >
               
               {/* 3D Carousel Container */}
               <motion.div
                 className="relative w-[280px] h-[400px]"
                 style={{ 
                   transformStyle: 'preserve-3d',
                 }}
                 animate={{ rotateY: -carouselIndex * anglePerCard }}
                 transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1 }}
                 onHoverStart={stopAutoRotation}
               >
                  {/* Decorative Revolving Rings */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
                     {/* Ceiling Ring */}
                     <motion.div 
                        className="absolute inset-0 border-[1px] border-cyan-500/20 rounded-full"
                        style={{ transform: 'translateY(-300px) rotateX(90deg)' }}
                        animate={{ rotateZ: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                     />
                     {/* Floor Ring Inner */}
                     <motion.div 
                        className="absolute inset-0 border-[2px] border-dashed border-purple-500/30 rounded-full"
                        style={{ transform: 'translateY(300px) rotateX(90deg) scale(0.8)' }}
                        animate={{ rotateZ: -360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                     />
                     {/* Floor Ring Outer */}
                     <motion.div 
                        className="absolute inset-0 border-[4px] border-cyan-500/10 rounded-full"
                        style={{ transform: 'translateY(300px) rotateX(90deg) scale(1.2)' }}
                        animate={{ rotateZ: 360 }}
                        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
                     />
                  </div>

                  {availableSubjects.map((sub, i) => {
                     return (
                        <div
                          key={sub.id}
                          onClick={() => handleCardClick(i, sub)}
                          className="absolute inset-0 rounded-xl overflow-hidden cursor-pointer group border border-gray-700 bg-gray-900/40 backdrop-blur-[2px] transition-all duration-300 hover:border-cyan-400 hover:bg-gray-800/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                          style={{
                             transform: `rotateY(${i * anglePerCard}deg) translateZ(${radius}px)`,
                             backfaceVisibility: 'visible',
                             boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                          }}
                        >
                           {/* Card Face */}
                           <div className="absolute inset-0 flex flex-col p-6 bg-gradient-to-b from-white/5 to-black/90">
                              
                              {/* Top Bar */}
                              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-2">
                                 <span className="text-[10px] font-mono text-cyan-500">GATE-{i + 1}</span>
                                 <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_green]"></div>
                              </div>

                              {/* Icon */}
                              <div className="flex-1 flex items-center justify-center relative">
                                 <div className="absolute inset-0 bg-cyan-500/10 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                 <motion.div
                                   animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
                                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                 >
                                    {getIcon(sub.icon, "w-20 h-20 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]")}
                                 </motion.div>
                              </div>

                              {/* Info */}
                              <div className="mt-8 text-center">
                                 <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">{sub.name}</h3>
                                 <p className="text-xs text-gray-400 font-mono border-t border-white/10 pt-2">{sub.description}</p>
                              </div>

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                           </div>
                        </div>
                     );
                  })}
               </motion.div>

               {/* Navigation Buttons (Left/Right) */}
               <button 
                  onClick={(e) => { e.stopPropagation(); rotateCarousel('left'); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 border border-gray-700 text-white hover:bg-cyan-900/50 hover:border-cyan-500 transition-all z-20"
               >
                  <ChevronLeft className="w-6 h-6" />
               </button>
               <button 
                  onClick={(e) => { e.stopPropagation(); rotateCarousel('right'); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 border border-gray-700 text-white hover:bg-cyan-900/50 hover:border-cyan-500 transition-all z-20"
               >
                  <ChevronRight className="w-6 h-6" />
               </button>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 font-mono animate-pulse">
               NO DUNGEONS DETECTED FOR CURRENT CLEARANCE LEVEL.
            </div>
          )}
          
          <div className="text-center pb-4 text-[10px] text-gray-600 font-mono">
            SWIPE OR CLICK TO ENGAGE PORTAL
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DungeonSystem;
