import React from "react";
import { motion } from "framer-motion";

interface FingerGuideProps {
  currentChar: string;
}

export default function FingerGuide({ currentChar }: FingerGuideProps) {
  // Mapping of characters to fingers
  // 0-4: Left Pinky, Ring, Middle, Index, Thumb
  // 5-9: Right Thumb, Index, Middle, Ring, Pinky
  const getFingerIndex = (char: string): number | null => {
    const c = char.toLowerCase();
    
    // Left Hand
    if ("1qaz".includes(c)) return 0;
    if ("2wsx".includes(c)) return 1;
    if ("3edc".includes(c)) return 2;
    if ("45rtfgvb".includes(c)) return 3;
    
    // Space
    if (c === " ") return 4; // Or 5, using both thumbs
    
    // Right Hand
    if ("67yuhjnm".includes(c)) return 6;
    if ("8ik,".includes(c)) return 7;
    if ("9ol.".includes(c)) return 8;
    if ("0p;/'[]-=\\".includes(c)) return 9;
    
    return null;
  };

  const activeFinger = getFingerIndex(currentChar);

  const fingers = [
    { id: 0, label: "L. Pinky", side: "left" },
    { id: 1, label: "L. Ring", side: "left" },
    { id: 2, label: "L. Middle", side: "left" },
    { id: 3, label: "L. Index", side: "left" },
    { id: 4, label: "L. Thumb", side: "left" },
    { id: 5, label: "R. Thumb", side: "right" },
    { id: 6, label: "R. Index", side: "right" },
    { id: 7, label: "R. Middle", side: "right" },
    { id: 8, label: "R. Ring", side: "right" },
    { id: 9, label: "R. Pinky", side: "right" },
  ];

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm">
      <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
        Neural Positioning Guide
      </div>
      
      <div className="flex items-end gap-12">
        {/* Left Hand */}
        <div className="flex items-end gap-2">
          {fingers.slice(0, 5).map((f) => (
            <div key={f.id} className="flex flex-col items-center gap-2">
              <motion.div 
                animate={{ 
                  height: f.id === 4 ? 40 : (50 + (f.id === 2 ? 20 : f.id === 1 || f.id === 3 ? 10 : 0)),
                  backgroundColor: activeFinger === f.id ? "rgba(59, 130, 246, 0.5)" : "rgba(255, 255, 255, 0.05)",
                  borderColor: activeFinger === f.id ? "rgba(59, 130, 246, 1)" : "rgba(255, 255, 255, 0.1)"
                }}
                className={`w-4 border-2 rounded-full shadow-lg ${activeFinger === f.id ? 'shadow-blue-500/50' : ''}`}
              />
              <span className={`text-[8px] font-black uppercase tracking-tighter ${activeFinger === f.id ? 'text-blue-400' : 'text-gray-600'}`}>
                {f.label.split('.')[1]}
              </span>
            </div>
          ))}
        </div>

        {/* Right Hand */}
        <div className="flex items-end gap-2">
          {fingers.slice(5, 10).map((f) => (
            <div key={f.id} className="flex flex-col items-center gap-2">
              <motion.div 
                animate={{ 
                  height: f.id === 5 ? 40 : (50 + (f.id === 7 ? 20 : f.id === 6 || f.id === 8 ? 10 : 0)),
                  backgroundColor: activeFinger === f.id ? "rgba(59, 130, 246, 0.5)" : "rgba(255, 255, 255, 0.05)",
                  borderColor: activeFinger === f.id ? "rgba(59, 130, 246, 1)" : "rgba(255, 255, 255, 0.1)"
                }}
                className={`w-4 border-2 rounded-full shadow-lg ${activeFinger === f.id ? 'shadow-blue-500/50' : ''}`}
              />
              <span className={`text-[8px] font-black uppercase tracking-tighter ${activeFinger === f.id ? 'text-blue-400' : 'text-gray-600'}`}>
                {f.label.split('.')[1]}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {activeFinger !== null && (
        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
          Use {fingers[activeFinger].label} for "{currentChar === " " ? "SPACE" : currentChar.toUpperCase()}"
        </div>
      )}
    </div>
  );
}
