import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { chatWithSystem } from '../services/geminiService';
import { soundService } from '../services/soundService';
import { Bot, Mic, MicOff, Send, X, Terminal, Sparkles, Fingerprint, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SystemAssistantProps {
  player: Player;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const SystemAssistant: React.FC<SystemAssistantProps> = ({ player }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  
  // Ref for speech recognition
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Ref to track open state inside event handlers without re-binding
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    // Check browser support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Use continuous to prevent "no-speech" timeouts during standby
      recognitionRef.current.continuous = true; 
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                const transcript = event.results[i][0].transcript.trim();
                handleVoiceInput(transcript);
            }
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Auto-restart if it stops unexpectedly (keep listening loop alive)
        // Only restart if the component is still mounted and we want it to be listening
        if (recognitionRef.current) {
            setTimeout(() => {
                try { 
                    recognitionRef.current?.start(); 
                    setIsListening(true);
                } catch(e) {}
            }, 1000);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        // Ignore errors to keep the "Always On" illusion
        // 'no-speech' is common and ignored
      };

      // Auto-start listening immediately
      const startListening = () => {
         try {
             recognitionRef.current?.start();
             setIsListening(true);
         } catch(e) {
             // Browser might block auto-start, wait for interaction
         }
      };

      startListening();

      // Ensure listening starts on any user interaction if blocked initially
      const handleInteraction = () => {
          if (recognitionRef.current && !isListening) {
              startListening();
          }
      };

      window.addEventListener('click', handleInteraction);
      window.addEventListener('keydown', handleInteraction);
      
      return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
      };
    }
  }, []); 

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVoiceInput = (text: string) => {
    const cleanText = text.toLowerCase();
    const isWakeWord = cleanText.replace(/[^a-z ]/g, '').includes('arise');
    
    // Check for Wake Word "ARISE" via ref to avoid stale closure
    if (!isOpenRef.current) {
      if (isWakeWord) {
        soundService.playLevelUp(); // Power up sound
        setIsOpen(true);
        const greeting = `System Online. How can I assist you, ${player.username}?`;
        setMessages([{ role: 'model', text: greeting }]);
        // No TTS speak() call here
      }
    } else {
      // If open, treat as chat input
      sendMessage(text);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInputText('');
    setIsProcessing(true);

    // Convert history format for Gemini
    const history = newMessages.slice(0, -1).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await chatWithSystem(history, text, player);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsProcessing(false);
    // No TTS speak() call here
  };

  return (
    <>
    {/* === Collapsed / "Always On" Monitor Card === */}
    <div className="relative group rounded-lg overflow-hidden border border-purple-500/30 bg-gray-900/80 backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.1)] h-full min-h-[150px] flex flex-col justify-between">
        <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(168,85,247,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[gradient_15s_ease_infinite]"></div>
        
        <div className="p-6 relative z-10">
            <div className="flex items-center gap-3 mb-4 border-b border-purple-900/50 pb-2">
                <div className="p-2 bg-purple-900/30 rounded border border-purple-500/50 relative">
                    <Bot className="w-6 h-6 text-purple-400" />
                    {isListening && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                    )}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white tracking-widest flex items-center gap-2">
                        SYSTEM LINK
                    </h3>
                    <p className="text-[10px] text-purple-500/70 font-mono uppercase tracking-[0.2em]">
                        Background Monitor
                    </p>
                </div>
            </div>

            <div className="py-2 text-center flex flex-col items-center justify-center min-h-[80px]">
                {voiceSupported ? (
                    <>
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-purple-500 animate-pulse" />
                            <div className="h-4 w-32 bg-gray-800 rounded overflow-hidden flex items-center gap-0.5 px-1">
                                {[1,2,3,4,5,6,7,8].map(i => (
                                    <div key={i} className="flex-1 bg-purple-500/50 rounded-full h-full animate-[pulse_1s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 100}%` }}></div>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm font-bold text-gray-300 tracking-widest uppercase animate-pulse">
                             Listening...
                        </p>
                        <p className="text-[10px] text-purple-400 font-mono mt-2">
                            Say "ARISE" to Access Interface
                        </p>
                    </>
                ) : (
                    <p className="text-xs text-red-500 font-mono">
                        Voice Module Not Detected
                    </p>
                )}
            </div>
        </div>
        
        {/* Decorative footer */}
        <div className="bg-purple-900/20 p-2 text-[9px] font-mono text-center text-purple-500/50 border-t border-purple-500/10">
            NEURAL CONNECTION STABLE // LATENCY 12MS
        </div>
    </div>

    {/* === Active Chat Modal === */}
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-lg bg-gray-900 border border-purple-500 rounded-xl shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden flex flex-col h-[600px] max-h-[80vh] relative"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-purple-500/30 bg-purple-950/20">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            <span className="font-bold text-white tracking-widest">THE SYSTEM</span>
                        </div>
                        <button 
                            onClick={() => {
                                setIsOpen(false);
                                // Don't stop recognition, just close modal so it goes back to standby
                            }}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40">
                         {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-50">
                                <Fingerprint className="w-16 h-16" />
                                <p className="font-mono text-xs uppercase tracking-widest">Awaiting Input...</p>
                            </div>
                         )}
                         {messages.map((msg, i) => (
                             <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                             >
                                 <div className={`max-w-[80%] p-3 rounded-lg border ${
                                     msg.role === 'user' 
                                        ? 'bg-purple-900/40 border-purple-500/50 text-white rounded-tr-none' 
                                        : 'bg-gray-800 border-gray-600 text-cyan-100 rounded-tl-none font-mono text-sm'
                                 }`}>
                                     {msg.role === 'model' && (
                                         <div className="flex items-center gap-1 mb-1 text-[10px] text-cyan-500 font-bold uppercase">
                                             <Terminal className="w-3 h-3" /> System
                                         </div>
                                     )}
                                     {msg.text}
                                 </div>
                             </motion.div>
                         ))}
                         {isProcessing && (
                             <div className="flex justify-start">
                                 <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 rounded-tl-none flex gap-1">
                                     <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                                     <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-75"></div>
                                     <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-150"></div>
                                 </div>
                             </div>
                         )}
                         <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-purple-500/30 bg-gray-900 flex gap-2 items-center">
                        <div className={`p-2 rounded-full border transition-all ${
                                isListening 
                                    ? 'bg-red-900/20 border-red-500/50 text-red-400 animate-pulse' 
                                    : 'bg-gray-800 border-gray-600 text-gray-500'
                            }`}
                        >
                            <Mic className="w-4 h-4" />
                        </div>
                        
                        <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
                            placeholder="Type or Say command..."
                            className="flex-1 bg-black/50 border border-gray-700 rounded-full px-4 py-2 text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                        />

                        <button 
                            onClick={() => sendMessage(inputText)}
                            disabled={!inputText.trim()}
                            className="p-3 bg-purple-900/50 border border-purple-500 rounded-full text-purple-300 hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
    </>
  );
};

export default SystemAssistant;