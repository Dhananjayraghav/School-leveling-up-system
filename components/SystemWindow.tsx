import React from 'react';
import { motion } from 'framer-motion';

export interface SystemWindowProps {
  children: React.ReactNode;
  title?: string;
  type?: 'info' | 'warning' | 'success' | 'default';
  className?: string;
  width?: string;
}

const SystemWindow: React.FC<SystemWindowProps> = ({ 
  children, 
  title = "NOTIFICATION", 
  type = 'info',
  className = "",
  width = "max-w-md"
}) => {
  // Theme Config
  const themes = {
    info: { 
        primary: '#22d3ee', // Cyan
        bg: 'rgba(8, 47, 73, 0.95)', 
        shadow: 'rgba(34, 211, 238, 0.6)',
        text: 'text-cyan-400'
    },
    warning: { 
        primary: '#ef4444', // Red
        bg: 'rgba(69, 10, 10, 0.95)', 
        shadow: 'rgba(239, 68, 68, 0.6)',
        text: 'text-red-500'
    },
    success: { 
        primary: '#facc15', // Yellow
        bg: 'rgba(66, 32, 6, 0.95)', 
        shadow: 'rgba(250, 204, 21, 0.6)',
        text: 'text-yellow-400'
    },
    default: {
        primary: '#ffffff',
        bg: 'rgba(23, 23, 23, 0.95)',
        shadow: 'rgba(255, 255, 255, 0.6)',
        text: 'text-white'
    }
  };

  const t = themes[type] || themes.info;

  return (
    <div className={`relative ${width} mx-auto ${className} font-sans group`}>
      {/* Global Style for Animations */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(500%); }
        }
        @keyframes lightning-pulse {
          0%, 100% { opacity: 1; height: 2px; box-shadow: 0 0 5px ${t.primary}, 0 0 10px ${t.primary}, 0 0 20px ${t.primary}; }
          5% { opacity: 0.8; height: 1px; box-shadow: 0 0 2px ${t.primary}; }
          10% { opacity: 1; height: 3px; box-shadow: 0 0 8px ${t.primary}, 0 0 15px ${t.primary}, 0 0 30px ${t.primary}; }
          15% { opacity: 0.5; height: 1px; }
          20% { opacity: 1; height: 2px; box-shadow: 0 0 5px ${t.primary}; }
          25% { opacity: 0.9; height: 2px; }
          45% { opacity: 1; height: 2px; box-shadow: 0 0 8px ${t.primary}; }
          50% { opacity: 0.2; height: 1px; box-shadow: none; }
          55% { opacity: 1; height: 4px; box-shadow: 0 0 12px ${t.primary}, 0 0 25px ${t.primary}; filter: brightness(1.5); }
          60% { opacity: 0.8; height: 2px; }
          80% { opacity: 1; height: 2px; box-shadow: 0 0 6px ${t.primary}; }
          90% { opacity: 0.6; height: 1px; }
        }
        @keyframes noise {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-5%, -5%); }
            20% { transform: translate(-10%, 5%); }
            30% { transform: translate(5%, -10%); }
            40% { transform: translate(-5%, 15%); }
            50% { transform: translate(-10%, 5%); }
            60% { transform: translate(15%, 0); }
            70% { transform: translate(0, 10%); }
            80% { transform: translate(-15%, 0); }
            90% { transform: translate(10%, 5%); }
        }
        @keyframes hologram-flicker {
            0%, 100% { opacity: 1; }
            3% { opacity: 0.95; }
            4% { opacity: 0.8; }
            5% { opacity: 1; }
            50% { opacity: 1; }
            51% { opacity: 0.9; }
            52% { opacity: 1; }
            80% { opacity: 1; }
            81% { opacity: 0.96; }
            82% { opacity: 1; }
        }
        .scanline {
          animation: scan 4s linear infinite;
        }
        .lightning-border {
          animation: lightning-pulse 2s infinite steps(4);
        }
        .noise-bg {
          animation: noise 0.2s steps(2) infinite;
        }
        .hologram-container {
          animation: hologram-flicker 5s infinite linear;
        }
      `}</style>

      <motion.div
        initial={{ clipPath: "inset(50% 0 50% 0)", opacity: 0 }}
        animate={{ clipPath: "inset(0% 0 0% 0)", opacity: 1 }}
        exit={{ clipPath: "inset(50% 0 50% 0)", opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative hologram-container"
      >
        {/* Main Holographic Container */}
        {/* Border removed from main container, applied via lightning divs */}
        <div 
            className="relative p-1 overflow-hidden backdrop-blur-3xl"
            style={{ 
                backgroundColor: 'rgba(2, 6, 23, 0.9)', // Darker opaque base for better contrast
                boxShadow: `inset 0 0 60px ${t.shadow}`
            }}
        >
            {/* === STATIC LIGHTNING BORDERS === */}
            {/* Top Border */}
            <div 
              className="absolute top-0 left-0 right-0 z-30 lightning-border flex items-center justify-center overflow-visible" 
              style={{ backgroundColor: t.primary }}
            >
                 <div className="w-full h-[1px] bg-white opacity-80 blur-[2px] absolute top-1/2 -translate-y-1/2"></div>
            </div>
            
            {/* Bottom Border */}
            <div 
              className="absolute bottom-0 left-0 right-0 z-30 lightning-border flex items-center justify-center overflow-visible" 
              style={{ backgroundColor: t.primary, animationDirection: 'reverse', animationDuration: '2.3s' }}
            >
                 <div className="w-full h-[1px] bg-white opacity-80 blur-[2px] absolute top-1/2 -translate-y-1/2"></div>
            </div>


            {/* === HOLOGRAPHIC LAYERS === */}
            
            {/* 1. Static Noise Pattern (The "Illusion") */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden mix-blend-screen">
                <div className="w-[200%] h-[200%] -top-[50%] -left-[50%] absolute noise-bg" 
                     style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
                        backgroundSize: '100px 100px'
                     }}>
                </div>
            </div>

            {/* 2. CRT Lines Pattern */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-overlay" 
                 style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${t.primary} 3px)` }}>
            </div>

            {/* 3. Moving Scanline */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20 overflow-hidden mix-blend-color-dodge">
                <div className="w-full h-[20%] bg-gradient-to-b from-transparent via-white to-transparent scanline blur-md"></div>
            </div>

            {/* 4. Radial Glow (Vignette) */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)]"></div>
            
            {/* 5. Subtle Grid Background */}
             <div className="absolute inset-0 z-0 opacity-[0.07] pointer-events-none" 
                 style={{ 
                     backgroundImage: `linear-gradient(${t.primary} 1px, transparent 1px), linear-gradient(90deg, ${t.primary} 1px, transparent 1px)`,
                     backgroundSize: '30px 30px',
                 }}>
            </div>

            {/* === FRAME DECORATION === */}

            {/* Header / Title Box - Floating over the top line */}
            <div 
                className="absolute -top-[1px] left-1/2 -translate-x-1/2 px-10 py-1 flex items-center gap-3 z-40 bg-black border-b border-l border-r"
                style={{ 
                    borderColor: t.primary,
                    boxShadow: `0 5px 20px ${t.shadow}`,
                    clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' // Trapezoid shape
                }}
            >
                {/* Alert Icon */}
                <div 
                    className="w-4 h-4 flex items-center justify-center font-bold text-xs text-black animate-pulse rounded-[1px]"
                    style={{ backgroundColor: t.primary }}
                >
                    !
                </div>
                <span 
                    className="font-bold tracking-[0.25em] text-sm uppercase drop-shadow-[0_0_8px_currentColor]"
                    style={{ color: t.primary }}
                >
                    {title}
                </span>
            </div>

            {/* Tech Nodes (Side Decorations) */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[2px] h-8 opacity-50" style={{ backgroundColor: t.primary }}></div>
            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[2px] h-8 opacity-50" style={{ backgroundColor: t.primary }}></div>

            {/* Corner Brackets (Thicker & Glowing) */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] z-20" style={{ borderColor: t.primary, boxShadow: `-2px -2px 10px ${t.shadow}` }}></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] z-20" style={{ borderColor: t.primary, boxShadow: `2px -2px 10px ${t.shadow}` }}></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] z-20" style={{ borderColor: t.primary, boxShadow: `-2px 2px 10px ${t.shadow}` }}></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] z-20" style={{ borderColor: t.primary, boxShadow: `2px 2px 10px ${t.shadow}` }}></div>

            {/* Content Area */}
            <div className="pt-14 pb-10 px-8 relative z-10 text-center">
                 {/* Inner Grid for Tech Feel */}
                 <div 
                    className="absolute inset-4 border border-dashed opacity-10 pointer-events-none rounded"
                    style={{ borderColor: t.primary }}
                 ></div>
                 
                 <div className="relative z-20">
                    {children}
                 </div>
            </div>
        </div>
      </motion.div>

      {/* Opening Flash Effect */}
      <motion.div 
        initial={{ scaleX: 0, opacity: 1, height: 4, filter: 'blur(0px)' }}
        animate={{ scaleX: 1.5, opacity: 0, height: 0, filter: 'blur(10px)' }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="absolute top-1/2 left-0 right-0 z-50 pointer-events-none bg-white mix-blend-overlay"
      />
    </div>
  );
};

export default SystemWindow;