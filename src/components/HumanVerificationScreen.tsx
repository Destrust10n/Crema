import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { SITE_CONFIG } from '../config/site';
import { playTactileSound } from '../utils/audio';

interface HumanVerificationScreenProps {
  onConfirmHuman: () => void;
  onDenyHuman: () => void;
}

export const HumanVerificationScreen: React.FC<HumanVerificationScreenProps> = ({
  onConfirmHuman,
  onDenyHuman,
}) => {
  const handleConfirm = () => {
    playTactileSound('click', true);
    onConfirmHuman();
  };

  const handleDeny = () => {
    playTactileSound('toggle', true);
    onDenyHuman();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y' || e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        e.preventDefault();
        handleDeny();
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
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-black select-none px-4"
    >
      <div className="w-full max-w-sm text-center">
        {/* Verification Title */}
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mb-3"
        >
          Are you human?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-xs text-neutral-400 font-mono tracking-wider uppercase mb-8"
        >
          {SITE_CONFIG.organizationName} Identity Verification
        </motion.p>

        {/* Two Boxes: Pure Yes or No with keyboard hint */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 gap-4"
        >
          {/* Box 1: Yes */}
          <button
            type="button"
            onClick={handleConfirm}
            className="group relative flex flex-col items-center justify-center py-7 px-5 rounded-2xl border-2 border-black bg-white hover:bg-black hover:text-white transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.04)] cursor-pointer active:scale-95"
          >
            <span className="text-xl font-black uppercase tracking-wider">
              Yes
            </span>
            <span className="text-[10px] font-mono opacity-40 group-hover:opacity-75 mt-1">
              [Y]
            </span>
          </button>

          {/* Box 2: No */}
          <button
            type="button"
            onClick={handleDeny}
            className="group relative flex flex-col items-center justify-center py-7 px-5 rounded-2xl border-2 border-black bg-white hover:bg-black hover:text-white transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.04)] cursor-pointer active:scale-95"
          >
            <span className="text-xl font-black uppercase tracking-wider">
              No
            </span>
            <span className="text-[10px] font-mono opacity-40 group-hover:opacity-75 mt-1">
              [N]
            </span>
          </button>
        </motion.div>

        {/* Minimal hint */}
        <div className="mt-8 text-center">
          <span className="text-[10px] font-mono tracking-widest text-neutral-300 uppercase">
            {SITE_CONFIG.organizationName} · SECURE GATE
          </span>
        </div>
      </div>
    </motion.div>
  );
};
