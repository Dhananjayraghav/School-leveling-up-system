
import React from 'react';
import { Player } from '../types';
import { AVAILABLE_TITLES } from '../services/gameLogic';
import { X, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TitleSelectorProps {
  player: Player;
  onSelectTitle: (title: string) => void;
  onClose: () => void;
}

const TitleSelector: React.FC<TitleSelectorProps> = ({ player, onSelectTitle, onClose }) => {
  
  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'legendary': return 'text-orange-500 border-orange-500 shadow-orange-500/20';
      case 'epic': return 'text-purple-500 border-purple-500 shadow-purple-500/20';
      case 'rare': return 'text-cyan-500 border-cyan-500 shadow-cyan-500/20';
      default: return 'text-gray-300 border-gray-500 shadow-gray-500/20';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch(rarity) {
      case 'legendary': return 'bg-orange-900/20';
      case 'epic': return 'bg-purple-900/20';
      case 'rare': return 'bg-cyan-900/20';
      default: return 'bg-gray-900/40';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-gray-950 border border-gray-700 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-widest uppercase flex items-center gap-3">
              Title Collection
            </h2>
            <p className="text-sm text-gray-500 font-mono mt-1">
              Equip a designation to display on your profile.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
           {AVAILABLE_TITLES.map((titleDef) => {
             const isUnlocked = player.unlockedTitles.includes(titleDef.name);
             const isEquipped = player.title === titleDef.name;
             const rarityStyle = getRarityColor(titleDef.rarity);
             const bgStyle = getRarityBg(titleDef.rarity);

             return (
               <div 
                  key={titleDef.id}
                  onClick={() => isUnlocked && onSelectTitle(titleDef.name)}
                  className={`relative p-4 rounded border transition-all duration-300 flex items-center justify-between group
                    ${isUnlocked 
                        ? `cursor-pointer hover:bg-opacity-50 border-opacity-30 hover:border-opacity-80 ${bgStyle} border-${rarityStyle.split(' ')[1].replace('border-', '')}` 
                        : 'bg-gray-900/50 border-gray-800 opacity-60 grayscale cursor-not-allowed'
                    }
                    ${isEquipped ? 'ring-1 ring-offset-2 ring-offset-black ring-cyan-500' : ''}
                  `}
               >
                  <div className="flex items-center gap-4">
                     {/* Icon/Status */}
                     <div className={`w-12 h-12 rounded flex items-center justify-center border bg-black/50 ${isUnlocked ? rarityStyle.split(' ')[1] : 'border-gray-700'}`}>
                        {isEquipped ? <Check className="text-cyan-400" /> : (
                            isUnlocked ? <div className={`w-3 h-3 rounded-full ${titleDef.rarity === 'legendary' ? 'bg-orange-500' : titleDef.rarity === 'epic' ? 'bg-purple-500' : titleDef.rarity === 'rare' ? 'bg-cyan-500' : 'bg-white'}`}></div> : <Lock className="text-gray-600 w-4 h-4" />
                        )}
                     </div>

                     <div>
                        <h3 className={`text-lg font-bold uppercase tracking-wider ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                           {isUnlocked ? titleDef.name : '??????????'}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono mt-1">
                           {isUnlocked ? titleDef.description : 'Unlock condition hidden.'}
                        </p>
                     </div>
                  </div>

                  {isUnlocked && (
                    <div className={`px-2 py-1 text-[10px] font-bold uppercase border rounded tracking-widest ${rarityStyle}`}>
                       {titleDef.rarity}
                    </div>
                  )}
               </div>
             );
           })}
        </div>
      </motion.div>
    </div>
  );
};

export default TitleSelector;
