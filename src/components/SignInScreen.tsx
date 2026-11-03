import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SITE_CONFIG } from '../config/site';
import { playTactileSound } from '../utils/audio';

interface SignInScreenProps {
  initialName?: string;
  onComplete: (name: string) => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ initialName = '', onComplete }) => {
  const safeInitial = typeof initialName === 'string' ? initialName : '';
  const [name, setName] = useState<string>(safeInitial);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomLetter, setZoomLetter] = useState('A');
  const [isBlackout, setIsBlackout] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof initialName === 'string' && initialName && !name) {
      setName(initialName);
    }
  }, [initialName]);

  // Auto focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const triggerZoomSequence = (userName: string) => {
    const safeUser = typeof userName === 'string' ? userName.trim() : 'User';
    const letter = safeUser.charAt(0).toUpperCase() || 'A';
    setZoomLetter(letter);
    setIsZooming(true);
    playTactileSound('click', true);

    setTimeout(() => {
      setIsBlackout(true);
    }, 700);

    setTimeout(() => {
      setShowWelcome(true);
      playTactileSound('glassChime', true);
    }, 1100);

    setTimeout(() => {
      setIsSweeping(true);
    }, 3100);

    setTimeout(() => {
      onComplete(safeUser);
    }, 3900);
  };

  // Handle manual name submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed || isZooming) return;
    triggerZoomSequence(trimmed);
  };

  const currentName = typeof name === 'string' ? name : '';
  const typingProgress = Math.min(currentName.length, 12);
  const liveOSizeScale = 1 + typingProgress * 0.08;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden select-none transition-colors duration-500 ${
        isBlackout ? 'bg-black text-white' : 'bg-white text-black'
      }`}
    >
      {/* ZOOM INSIDE LETTER ANIMATION */}
      <AnimatePresence>
        {isZooming && !showWelcome && (
          <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none overflow-hidden">
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                scale: [1, 2.5, 18, 120],
                opacity: [1, 1, 1, 1],
              }}
              transition={{
                duration: 1.4,
                ease: [0.32, 0, 0.24, 1],
              }}
              className="flex items-center justify-center text-black font-black select-none"
              style={{
                fontSize: '180px',
                lineHeight: 1,
                transformOrigin: '50% 50%',
              }}
            >
              {zoomLetter}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main minimal input box with ROUNDED CORNERS & EXTRA BLACK TYPOGRAPHY */}
      <motion.div
        animate={
          isZooming
            ? { opacity: 0, scale: 0.88, filter: 'blur(10px)' }
            : { opacity: 1, scale: 1, filter: 'blur(0px)' }
        }
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[400px] mx-4"
      >
        {/* Rounded Box with refined Apple border and subtle shadow */}
        <div className="relative rounded-3xl border-2 border-black bg-white px-8 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          {/* X-shaped detail on the left border */}
          <div
            aria-hidden="true"
            className="absolute -left-[11px] top-1/2 -translate-y-1/2 flex items-center justify-center w-[22px] h-[22px] bg-white text-black border-2 border-black rounded-full select-none pointer-events-none shadow-sm"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" className="stroke-current stroke-[2.2]">
              <line x1="2" y1="2" x2="8" y2="8" />
              <line x1="8" y1="2" x2="2" y2="8" />
            </svg>
          </div>

          {/* O-shaped detail on the right border */}
          <div
            aria-hidden="true"
            style={{
              transform: `translateY(-50%) scale(${liveOSizeScale})`,
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute -right-[11px] top-1/2 flex items-center justify-center w-[22px] h-[22px] bg-white text-black border-2 border-black rounded-full select-none pointer-events-none shadow-sm"
          >
            <div className="w-[6px] h-[6px] rounded-full border-2 border-black" />
          </div>

          {/* Header prompt: "Type your name" in EXTRA BLACK */}
          <div className="mb-4">
            <h1 className="text-2xl font-black tracking-tight text-black uppercase">
              Type your name
            </h1>
            <p className="text-[12px] text-neutral-500 font-medium mt-1 tracking-wide">
              Press Enter or proceed to initialize your session
            </p>
          </div>

          {/* Minimal text input with light-grey underline and EXTRA BLACK font */}
          <form onSubmit={handleSubmit} className="relative mt-3">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name..."
              maxLength={36}
              disabled={isZooming}
              className="w-full bg-transparent pb-2.5 pt-1 text-xl font-black text-black placeholder:text-neutral-300 placeholder:font-normal border-b-2 border-neutral-200 focus:border-black outline-none transition-colors duration-200"
            />

            {/* Action affordance appears when typing */}
            <AnimatePresence>
              {name.trim().length > 0 && (
                <motion.button
                  type="submit"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 bottom-3 flex items-center gap-1 text-xs font-black uppercase tracking-wider text-black hover:opacity-70 cursor-pointer"
                >
                  <span>Continue</span>
                  <span className="text-sm leading-none">→</span>
                </motion.button>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Minimal hint below showing ORG NAME */}
        <div className="mt-3.5 text-center">
          <span className="text-[11px] font-mono font-medium text-neutral-400 tracking-wider">
            {SITE_CONFIG.organizationName} · SECURE LOGIN
          </span>
        </div>
      </motion.div>

      {/* WELCOME TO [ORGANIZATION NAME] ON PURE BLACK SCREEN */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white select-none transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isSweeping ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            {/* Subtle warm atmospheric glow on black */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#3a2215]/25 to-[#6b3c1d]/15 blur-[120px]" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 text-center px-6"
            >
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="h-[1px] w-8 bg-white/25" />
                <span className="text-[11px] tracking-[0.28em] text-white/50 uppercase font-mono">
                  INITIALIZED
                </span>
                <span className="h-[1px] w-8 bg-white/25" />
              </div>

              <h2 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight text-white/95">
                Welcome to <span className="font-bold text-white">{SITE_CONFIG.organizationName}</span>
              </h2>

              <p className="mt-4 text-base sm:text-lg text-white/50 font-light tracking-wide max-w-lg mx-auto">
                {name ? `${name}, your ` : 'Your '}liquid glass workspace is active.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
