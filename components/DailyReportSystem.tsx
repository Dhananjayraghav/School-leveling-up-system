
import React, { useState } from 'react';
import { Player, DailyReport } from '../types';
import { db } from '../services/databaseService';
import { addExp } from '../services/gameLogic';
import { soundService } from '../services/soundService';
import { X, Send, Book, Calendar, ChevronRight, Activity, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyReportSystemProps {
  player: Player;
  onClose: () => void;
}

const DailyReportSystem: React.FC<DailyReportSystemProps> = ({ player, onClose }) => {
  const [activeTab, setActiveTab] = useState<'write' | 'archive'>('write');
  const [reportContent, setReportContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<DailyReport['mood']>('productive');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    if (!reportContent.trim()) return;

    soundService.playClick();
    setIsSubmitting(true);

    // Simulate Network Delay for Effect
    setTimeout(() => {
        const today = new Date().toISOString();
        const newReport: DailyReport = {
            id: `report-${Date.now()}`,
            timestamp: today,
            content: reportContent,
            mood: selectedMood
        };

        // Check if first report of the day for reward
        const lastReportDate = player.reports.length > 0 ? new Date(player.reports[0].timestamp).toDateString() : null;
        const isFirstToday = lastReportDate !== new Date().toDateString();

        let updatedPlayer = {
            ...player,
            reports: [newReport, ...player.reports]
        };

        if (isFirstToday) {
            updatedPlayer = addExp(updatedPlayer, 50);
            soundService.playQuestComplete();
        }

        db.updatePlayer(updatedPlayer);

        setIsSubmitting(false);
        setShowSuccess(true);
        setReportContent('');
        
        setTimeout(() => {
            setShowSuccess(false);
            setActiveTab('archive');
        }, 1500);

    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#0a0f1c] border border-cyan-900 rounded-lg shadow-[0_0_50px_rgba(8,145,178,0.2)] overflow-hidden flex flex-col h-[600px] max-h-[90vh] relative"
      >
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center p-4 border-b border-cyan-900 bg-cyan-950/20">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-900/30 border border-cyan-500/30 rounded">
                    <Book className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase font-[Rajdhani]">Daily Report Log</h2>
                    <p className="text-[10px] text-cyan-500/60 font-mono tracking-wider">SECURE UPLINK ESTABLISHED</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-cyan-900/40 rounded transition-colors text-cyan-500/70 hover:text-cyan-400">
                <X size={20} />
            </button>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 flex border-b border-cyan-900/50 bg-black/40">
            <button 
                onClick={() => { soundService.playClick(); setActiveTab('write'); }}
                className={`flex-1 py-3 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'write' ? 'text-cyan-400 bg-cyan-900/10' : 'text-gray-500 hover:text-gray-300'}`}
            >
                New Entry
                {activeTab === 'write' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-500 shadow-[0_0_10px_cyan]"></div>}
            </button>
            <button 
                onClick={() => { soundService.playClick(); setActiveTab('archive'); }}
                className={`flex-1 py-3 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'archive' ? 'text-cyan-400 bg-cyan-900/10' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Archive ({player.reports.length})
                {activeTab === 'archive' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-500 shadow-[0_0_10px_cyan]"></div>}
            </button>
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
                {activeTab === 'write' ? (
                    <motion.div 
                        key="write"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="h-full flex flex-col p-6"
                    >
                        {showSuccess ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500 mb-4 animate-[bounce_1s_infinite]">
                                    <Activity className="w-8 h-8 text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-green-400 tracking-widest mb-2">UPLOAD COMPLETE</h3>
                                <p className="text-gray-400 font-mono text-sm">Data synchronized with central mainframe.</p>
                                <div className="mt-4 px-3 py-1 bg-yellow-900/30 border border-yellow-600/50 rounded text-yellow-500 text-xs font-mono">
                                    +50 EXP AWARDED
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <label className="block text-xs font-mono text-cyan-500/70 mb-2 uppercase tracking-wider">Session Mood Status</label>
                                    <div className="flex gap-2">
                                        {(['productive', 'neutral', 'struggling'] as const).map(mood => (
                                            <button
                                                key={mood}
                                                onClick={() => setSelectedMood(mood)}
                                                className={`flex-1 py-2 px-3 border rounded text-xs uppercase tracking-wider font-bold transition-all ${
                                                    selectedMood === mood 
                                                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' 
                                                    : 'bg-black/40 border-gray-700 text-gray-500 hover:border-cyan-700'
                                                }`}
                                            >
                                                {mood}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col mb-4">
                                    <label className="block text-xs font-mono text-cyan-500/70 mb-2 uppercase tracking-wider">Log Content</label>
                                    <textarea 
                                        value={reportContent}
                                        onChange={(e) => setReportContent(e.target.value)}
                                        placeholder="Enter observation data regarding your study session..."
                                        className="flex-1 bg-black/60 border border-gray-700 rounded p-4 text-gray-300 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.1)] resize-none font-mono text-sm leading-relaxed"
                                    />
                                </div>

                                <button 
                                    onClick={handleSubmit}
                                    disabled={!reportContent.trim() || isSubmitting}
                                    className={`w-full py-4 flex items-center justify-center gap-2 uppercase tracking-[0.2em] font-bold text-sm transition-all border ${
                                        !reportContent.trim() || isSubmitting
                                        ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-cyan-900/20 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_20px_cyan]'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="animate-spin mr-2">⟳</span> UPLOADING...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} /> SUBMIT ENTRY
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="archive"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="h-full overflow-y-auto p-4 space-y-3 custom-scrollbar"
                    >
                        {player.reports.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 font-mono text-xs text-center p-8 border border-dashed border-gray-800 rounded">
                                NO LOGS FOUND IN DATABASE.
                            </div>
                        ) : (
                            player.reports.map((report) => (
                                <div key={report.id} className="bg-gray-900/60 border border-gray-800 p-4 rounded hover:border-cyan-900/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-2 border-b border-gray-800 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-cyan-500">{new Date(report.timestamp).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-mono text-gray-600">{new Date(report.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-widest ${
                                            report.mood === 'productive' ? 'border-green-900 text-green-500 bg-green-900/10' :
                                            report.mood === 'struggling' ? 'border-red-900 text-red-500 bg-red-900/10' :
                                            'border-gray-700 text-gray-500 bg-gray-900'
                                        }`}>
                                            {report.mood}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">
                                        {report.content}
                                    </p>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Footer Deco */}
        <div className="bg-cyan-950/30 p-1 border-t border-cyan-900/50 flex justify-between items-center px-4 relative z-10">
            <div className="flex gap-1">
                <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse delay-150"></div>
            </div>
            <span className="text-[9px] font-mono text-cyan-600">SYSTEM VER 2.4.0 // STORAGE: 12%</span>
        </div>
      </motion.div>
    </div>
  );
};

export default DailyReportSystem;
