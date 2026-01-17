import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { soundService } from '../services/soundService';
import SystemWindow from './SystemWindow';

interface SystemAlertProps {
  message: string;
  type?: 'warning' | 'info';
  onClose: () => void;
}

const SystemAlert: React.FC<SystemAlertProps> = ({ message, type = 'warning', onClose }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const isWarning = type === 'warning';
  const themeColor = isWarning ? '#ef4444' : '#22d3ee'; // red-500 : cyan-400

  useEffect(() => {
    soundService.playBossStart(); // Play alert sound on mount
    let index = 0;
    const timer = setInterval(() => {
      setDisplayedText((prev) => {
        if (index < message.length) {
          return message.slice(0, index + 1);
        }
        setIsTyping(false);
        clearInterval(timer);
        return prev;
      });
      index++;
    }, 30); // Typing speed

    return () => clearInterval(timer);
  }, [message]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
      {/* Container with Pointer Events Enabled */}
      <div className="pointer-events-auto w-full flex justify-center">
        <SystemWindow 
            title={isWarning ? 'EMERGENCY' : 'NOTIFICATION'} 
            type={type}
            width="max-w-md w-full"
        >
             {/* Close Button (Top Right) */}
             <button 
               onClick={onClose}
               className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white transition-colors z-20"
             >
               <X className="w-5 h-5" />
             </button>

             {/* Content */}
             <div className="text-center min-h-[100px] flex flex-col justify-between">
                 
                 <div className="flex-1 flex items-center justify-center mb-6">
                   <p className="text-white font-medium text-lg leading-relaxed font-[Rajdhani] whitespace-pre-line drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]">
                     {displayedText}
                     {isTyping && <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse align-middle" style={{ color: themeColor }}></span>}
                   </p>
                 </div>

                 {!isTyping && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center"
                    >
                       <button 
                         onClick={onClose}
                         className="bg-transparent border py-2 px-10 uppercase tracking-[0.2em] font-bold text-sm transition-all hover:text-black group relative overflow-hidden"
                         style={{ borderColor: themeColor, color: themeColor, boxShadow: `0 0 15px ${themeColor}20` }}
                       >
                         <span className="relative z-10">Confirm</span>
                         <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity z-0" 
                            style={{ backgroundColor: themeColor }}
                         />
                       </button>
                    </motion.div>
                 )}
             </div>
        </SystemWindow>
      </div>
    </div>
  );
};

export default SystemAlert;