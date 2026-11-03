import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { playTactileSound } from '../utils/audio';

interface OpeningScreenProps {
  onBegin: () => void;
}

export const OpeningScreen: React.FC<OpeningScreenProps> = ({ onBegin }) => {
  const handleStart = () => {
    playTactileSound('click', true);
    onBegin();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-black select-none cursor-default px-4"
    >
      <motion.button
        type="button"
        onClick={handleStart}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="group relative px-7 py-3.5 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-black rounded-full"
      >
        <span className="text-[13px] font-normal tracking-[0.28em] text-neutral-900 transition-colors duration-500 group-hover:text-black uppercase">
          Let&apos;s begin
        </span>
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 left-1/2 h-[1px] w-0 -translate-x-1/2 bg-black transition-all duration-500 ease-out group-hover:w-10"
        />
      </motion.button>

      {/* Subtle keyboard hint */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 text-[10px] font-mono tracking-widest text-neutral-400 uppercase pointer-events-none"
      >
        Press Enter ↵ to begin
      </motion.span>
    </motion.div>
  );
};
