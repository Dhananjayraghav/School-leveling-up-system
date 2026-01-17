import React, { useMemo } from 'react';
import { Player } from '../types';
import { motion } from 'framer-motion';
import { Activity, Brain, Zap, Shield, Target, Crosshair } from 'lucide-react';

interface StatsVisualizationProps {
  player: Player;
}

const StatsVisualization: React.FC<StatsVisualizationProps> = ({ player }) => {
  
  // Calculate Stats for Radar Chart (Normalized 0-100)
  const stats = useMemo(() => {
    return {
      INT: Math.min((player.level / 50) * 100, 100), // Based on Level
      WIL: Math.min((player.streakDays / 30) * 100, 100), // Based on Streak
      END: Math.min((player.studyMinutes / 600) * 100, 100), // Based on Study Time
      FOC: Math.min((player.currentExp / player.maxExp) * 100 + 20, 100), // Based on current XP progress
      EFF: Math.min(player.level + 40, 100), // Base efficiency
    };
  }, [player]);

  // Generate Mock History for Line Chart (Last 6 days + Today)
  const activityData = useMemo(() => {
    const data = [45, 60, 30, 80, 50, 75]; // Mock history
    // Add current session (normalized roughly for display)
    const todayVal = Math.min((player.studyMinutes / 60) * 100, 100); 
    return [...data, Math.max(20, todayVal)];
  }, [player.studyMinutes]);

  // Radar Chart Helper
  const getPoint = (value: number, index: number, total: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const x = 100 + Math.cos(angle) * radius * (value / 100);
    const y = 100 + Math.sin(angle) * radius * (value / 100);
    return `${x},${y}`;
  };

  const radarPoints = [stats.INT, stats.WIL, stats.END, stats.FOC, stats.EFF]
    .map((val, i) => getPoint(val, i, 5, 80))
    .join(' ');

  const radarBackground = [100, 100, 100, 100, 100]
    .map((val, i) => getPoint(val, i, 5, 80))
    .join(' ');
  
  const radarGrid50 = [50, 50, 50, 50, 50]
    .map((val, i) => getPoint(val, i, 5, 80))
    .join(' ');

  // Labels for Radar
  const labels = [
    { text: "INT", x: 100, y: 10, icon: Brain },
    { text: "WIL", x: 190, y: 75, icon: Shield },
    { text: "END", x: 160, y: 190, icon: Zap },
    { text: "FOC", x: 40, y: 190, icon: Target },
    { text: "EFF", x: 10, y: 75, icon: Crosshair },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6 backdrop-blur-sm relative overflow-hidden group">
        {/* Scanning Line Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[200%] w-full animate-[scan_4s_linear_infinite] pointer-events-none z-0"></div>

        {/* === Left: Soul Matrix (Radar) === */}
        <div className="relative z-10 flex flex-col items-center">
            <h3 className="text-sm font-bold text-cyan-500 tracking-[0.2em] mb-4 flex items-center gap-2">
                <Crosshair className="w-4 h-4" /> SOUL MATRIX
            </h3>
            
            <div className="relative w-[240px] h-[240px]">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
                    {/* Background Web */}
                    <polygon points={radarBackground} fill="none" stroke="#374151" strokeWidth="1" />
                    <polygon points={radarGrid50} fill="none" stroke="#374151" strokeWidth="0.5" strokeDasharray="4 2" />
                    
                    {/* Axis Lines */}
                    {[0, 1, 2, 3, 4].map(i => (
                        <line 
                            key={i}
                            x1="100" y1="100"
                            x2={getPoint(100, i, 5, 80).split(',')[0]}
                            y2={getPoint(100, i, 5, 80).split(',')[1]}
                            stroke="#374151" strokeWidth="1"
                        />
                    ))}

                    {/* Data Shape */}
                    <motion.polygon 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 0.6, scale: 1 }}
                        transition={{ duration: 1 }}
                        points={radarPoints} 
                        fill="rgba(6, 182, 212, 0.2)" 
                        stroke="#22d3ee" 
                        strokeWidth="2"
                    />
                    
                    {/* Data Points */}
                    {[stats.INT, stats.WIL, stats.END, stats.FOC, stats.EFF].map((val, i) => {
                        const [x, y] = getPoint(val, i, 5, 80).split(',');
                        return (
                            <motion.circle 
                                key={i}
                                cx={x} cy={y} r="3" 
                                fill="#fff"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                            />
                        );
                    })}
                </svg>

                {/* Labels Overlay */}
                {labels.map((l, i) => (
                    <div 
                        key={i} 
                        className="absolute text-[10px] font-mono font-bold text-cyan-400 flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${(l.x / 200) * 100}%`, top: `${(l.y / 200) * 100}%` }}
                    >
                        <l.icon className="w-3 h-3 mb-0.5 opacity-70" />
                        {l.text}
                    </div>
                ))}
            </div>
            
            <div className="mt-2 grid grid-cols-5 gap-2 w-full text-center">
                 {Object.entries(stats).map(([k, v], i) => (
                     <div key={i} className="bg-cyan-900/20 border border-cyan-500/20 rounded py-1">
                         <div className="text-[8px] text-gray-400">{k}</div>
                         <div className="text-xs font-bold text-cyan-300">{Math.round(v)}</div>
                     </div>
                 ))}
            </div>
        </div>

        {/* === Right: Sync Rate (Line Graph) === */}
        <div className="relative z-10 flex flex-col">
            <h3 className="text-sm font-bold text-purple-500 tracking-[0.2em] mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> SYNC RATE (7D)
            </h3>

            <div className="flex-1 bg-black/40 border border-gray-800 rounded relative overflow-hidden flex items-end p-4">
                 {/* Grid Lines */}
                 <div className="absolute inset-0 z-0">
                     <div className="h-full w-full bg-[linear-gradient(rgba(168,85,247,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                 </div>

                 <div className="flex justify-between items-end w-full h-full gap-2 relative z-10">
                     {activityData.map((val, i) => (
                         <div key={i} className="flex flex-col justify-end items-center h-full w-full gap-2">
                             {/* Bar/Point Visual */}
                             <motion.div 
                                className="w-full bg-purple-500/20 border-t border-purple-400 relative group"
                                initial={{ height: 0 }}
                                animate={{ height: `${val}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                             >
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-300 rounded-full shadow-[0_0_5px_#d8b4fe]"></div>
                                {/* Tooltip */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-xs px-2 py-1 rounded border border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                    {i === 6 ? 'Today' : `Day -${6-i}`}
                                </div>
                             </motion.div>
                         </div>
                     ))}
                 </div>

                 {/* Decorative Line */}
                 <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" preserveAspectRatio="none">
                    <motion.path
                        d={`M0,${100 - activityData[0]} ${activityData.map((v, i) => `L${(i / 6) * 100}%,${100 - v}`).join(' ')}`}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        vectorEffect="non-scaling-stroke"
                    />
                     <motion.path
                        d={`M0,${100 - activityData[0]} ${activityData.map((v, i) => `L${(i / 6) * 100}%,${100 - v}`).join(' ')} L100%,100 L0,100 Z`}
                        fill="url(#gradPurple)"
                        stroke="none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ delay: 1, duration: 1 }}
                    />
                    <defs>
                        <linearGradient id="gradPurple" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                 </svg>
            </div>
            
            {/* System Log */}
            <div className="mt-3 font-mono text-[10px] text-gray-500 uppercase flex justify-between">
                <span>Data_Stream: Stable</span>
                <span className="animate-pulse text-purple-400">Updating...</span>
            </div>
        </div>

        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>
    </div>
  );
};

export default StatsVisualization;