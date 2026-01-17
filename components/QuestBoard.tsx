
import React, { useEffect, useState } from 'react';
import { Player, Quest } from '../types';
import { db } from '../services/databaseService';
import { soundService } from '../services/soundService';
import { CheckCircle, Activity, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestBoardProps {
  player: Player;
  onUpdatePlayer: (p: Player) => void;
}

const QuestBoard: React.FC<QuestBoardProps> = ({ player }) => {
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    // Initial fetch from DB (already loaded in App init)
    setQuests(db.getQuests());

    // Listen for DB updates
    const unsubscribe = db.subscribe(() => {
        setQuests(db.getQuests());
    });

    return unsubscribe;
  }, []);

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 backdrop-blur-sm h-full shadow-lg">
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
        <h3 className="text-xl font-bold text-yellow-500 tracking-wider flex items-center gap-2">
          DAILY QUESTS
        </h3>
        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
           {new Date().toLocaleDateString()}
        </span>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {quests.map((quest, index) => {
            // Calculate percentage safely
            const percent = Math.min(100, Math.floor((quest.progress / quest.maxProgress) * 100));

            return (
              <motion.div 
                key={quest.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded border transition-all duration-300 relative overflow-hidden ${
                  quest.isCompleted 
                  ? 'bg-green-900/10 border-green-900/50 opacity-70' 
                  : 'bg-black/40 border-gray-700 hover:border-yellow-600/50'
                }`}
              >
                {/* Progress Bar Background */}
                {!quest.isCompleted && (
                  <div className="absolute bottom-0 left-0 h-1 bg-yellow-900/30 w-full">
                     <motion.div 
                       className="h-full bg-yellow-500"
                       initial={{ width: 0 }}
                       animate={{ width: `${percent}%` }}
                     />
                  </div>
                )}

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex-1">
                    <h4 className={`font-bold transition-colors duration-300 ${quest.isCompleted ? 'text-green-500 line-through' : 'text-gray-200'}`}>
                      {quest.title}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">{quest.description}</p>
                    
                    <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs font-mono text-yellow-600 bg-yellow-900/10 px-2 py-0.5 rounded border border-yellow-900/30">
                          Reward: {quest.rewardExp} EXP
                        </span>
                        {!quest.isCompleted && (
                           <span className="text-xs font-mono text-gray-400">
                             Progress: <span className="text-white">{quest.progress}</span> / {quest.maxProgress}
                           </span>
                        )}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col items-center justify-center">
                    {quest.isCompleted ? (
                       <CheckCircle className="text-green-500 w-6 h-6" />
                    ) : (
                       <div className="w-8 h-8 rounded-full border-2 border-gray-700 flex items-center justify-center">
                          <span className="text-[10px] font-mono text-gray-500">{percent}%</span>
                       </div>
                    )}
                    <span className="text-[9px] uppercase tracking-widest text-gray-600 mt-1">
                        {quest.isCompleted ? 'Complete' : 'Active'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {quests.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center text-gray-500 py-4 animate-pulse font-mono text-xs"
          >
            [SCANNING NETWORK FOR QUESTS...]
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuestBoard;
