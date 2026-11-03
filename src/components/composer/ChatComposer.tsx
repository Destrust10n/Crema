import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Paperclip,
  Mic,
  MicOff,
  ChevronDown,
  X,
  FileCode,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGSAP } from '@gsap/react';
import { UserPreferences } from '../../types';
import { SITE_CONFIG, STARTER_PROMPTS } from '../../config/site';
import { playTactileSound } from '../../utils/audio';
import { animateComposerEntrance } from '../../animations/gsapAnimations';

export type ComposerTone = 'Deep Thought' | 'Creative' | 'Concise' | 'Architectural';

export interface AttachedFile {
  name: string;
  size: string;
  type: string;
}

interface ChatComposerProps {
  preferences: UserPreferences;
  isTypingAi: boolean;
  onSendMessage: (text: string) => void;
  onStopGeneration: () => void;
  selectedTone: ComposerTone;
  onToneChange: (tone: ComposerTone) => void;
  attachedFiles: AttachedFile[];
  onAddAttachment: (file: AttachedFile) => void;
  onRemoveAttachment: (index: number) => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  preferences,
  isTypingAi,
  onSendMessage,
  onStopGeneration,
  selectedTone,
  onToneChange,
  attachedFiles,
  onAddAttachment,
  onRemoveAttachment,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [, setVoiceSeconds] = useState(0);
  const [showToneMenu, setShowToneMenu] = useState(false);
  const [showSparks, setShowSparks] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 300, y: 35 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const dockRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // GSAP Dock Entrance Animation
  useGSAP(() => {
    animateComposerEntrance(dockRef.current);
  }, { scope: dockRef });

  // Auto-resize textarea smoothly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 40), 180);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      voiceTimerRef.current = setInterval(() => {
        setVoiceSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      setVoiceSeconds(0);
    }
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    };
  }, [isRecording]);

  // Interactive 3D tilt and specular lighting tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = dockRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });

    if (!preferences.enable3dTilt || preferences.motionSpeed === 'reduced') return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setTilt({
      rotateX: -((y - centerY) / centerY) * 3,
      rotateY: ((x - centerX) / centerX) * 3,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (textOverride?: string) => {
    const text = (textOverride ?? inputValue).trim();
    if (!text || isTypingAi) return;

    playTactileSound('send', preferences.soundEffects);
    onSendMessage(text);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
    setShowSparks(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    playTactileSound('toggle', preferences.soundEffects);

    Array.from(files).forEach((file) => {
      const sizeStr = file.size < 1024 * 1024
        ? `${Math.round(file.size / 1024)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      onAddAttachment({
        name: file.name,
        size: sizeStr,
        type: file.type || 'document',
      });
    });
    e.target.value = '';
  };

  const handleQuickSampleAttachment = () => {
    playTactileSound('click', preferences.soundEffects);
    const samples = [
      { name: 'quantum_refraction_spec.pdf', size: '1.4 MB', type: 'application/pdf' },
      { name: 'aetheria_architecture_v3.ts', size: '28 KB', type: 'text/typescript' },
      { name: 'benchmarks_gemini_flash.json', size: '42 KB', type: 'application/json' },
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    onAddAttachment(picked);
  };

  const handleToggleVoice = () => {
    playTactileSound('toggle', preferences.soundEffects);
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    } else {
      setIsRecording(true);
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition: typeof Object }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition: typeof Object }).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const recognition = new (SpeechRecognition as any)();
          recognition.continuous = false;
          recognition.interimResults = true;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((result: any) => result[0].transcript)
              .join('');
            if (transcript) {
              setInputValue((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
            }
          };
          recognition.onend = () => setIsRecording(false);
          recognition.onerror = () => setIsRecording(false);
          recognitionRef.current = recognition;
          recognition.start();
          return;
        } catch {
          // Fall through to sample
        }
      }

      // Fallback voice transcription sample
      setTimeout(() => {
        setInputValue((prev) => (prev ? `${prev} ` : '') + 'Explain the optical mechanics of liquid glass reflections.');
        setIsRecording(false);
      }, 2000);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto select-none">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Sparks drawer */}
      <AnimatePresence>
        {showSparks && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="overflow-hidden mb-2.5"
          >
            <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
              {STARTER_PROMPTS.map((sp) => (
                <button
                  key={sp.title}
                  type="button"
                  onClick={() => handleSubmit(sp.prompt)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.10] text-white/80 hover:text-white text-xs font-sans transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3 h-3" style={{ color: 'var(--theme-accent-primary)' }} />
                  <span>{sp.title}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attached file pills */}
      {attachedFiles.length > 0 && (
        <div className="flex items-center gap-2 mb-2 px-2 overflow-x-auto">
          {attachedFiles.map((file, i) => (
            <div
              key={file.name + i}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] rounded-full text-white/90 shadow-sm shrink-0"
            >
              <FileCode className="w-3.5 h-3.5 text-white/60" />
              <span className="font-medium truncate max-w-[120px]">{file.name}</span>
              <span className="text-white/40">{file.size}</span>
              <button
                type="button"
                onClick={() => {
                  playTactileSound('click', preferences.soundEffects);
                  onRemoveAttachment(i);
                }}
                className="hover:text-red-400 text-white/50 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hero Liquid Glass Composer Dock — Dynamic Theme Surface */}
      <motion.div
        ref={dockRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: tilt.rotateX,
          rotateY: tilt.rotateY,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300, mass: 0.5 }}
        style={{
          transformStyle: 'preserve-3d',
          background: 'var(--theme-surface-dock)',
          border: '1px solid var(--theme-border-ambient)',
          boxShadow: isFocused
            ? '0 32px 90px var(--theme-shadow-ambient), 0 0 20px var(--theme-accent-soft-glow), inset 0 1px 2px var(--theme-border-specular)'
            : '0 28px 80px var(--theme-shadow-ambient), inset 0 1px 2px var(--theme-border-specular)',
        }}
        className="relative rounded-3xl p-3 sm:p-4 backdrop-blur-3xl overflow-hidden transition-all duration-300"
      >
        {/* Dynamic Specular Tracking Spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(350px circle at ${cursorPos.x}px ${cursorPos.y}px, var(--theme-border-specular), transparent 75%)`,
            opacity: isHovered || isFocused ? 0.65 : 0.25,
          }}
        />

        {/* Glossy Upper Bevel Reflection */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--theme-border-specular)] to-transparent"
        />

        {/* Input Textarea Container */}
        <div className="relative flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              playTactileSound('keystroke', preferences.soundEffects);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${SITE_CONFIG.organizationName} anything... (${selectedTone} mode)`}
            rows={1}
            className="w-full bg-transparent px-2 py-1 text-[14px] sm:text-[15px] outline-none resize-none leading-relaxed min-h-[40px] max-h-44 font-sans"
            style={{
              color: 'var(--theme-text-primary)',
            }}
          />

          {/* Integrated Dock Toolbar */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
            {/* Left Controls: Attachments, Samples, Tone Pill, Voice */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => {
                  playTactileSound('click', preferences.soundEffects);
                  fileInputRef.current?.click();
                }}
                title="Attach Document or Image"
                aria-label="Attach Document or Image"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Sample Research Document */}
              <button
                type="button"
                onClick={handleQuickSampleAttachment}
                title="Insert Sample Architecture File"
                aria-label="Insert Sample Architecture File"
                className="hidden sm:inline-flex min-w-[36px] min-h-[36px] items-center justify-center p-2 text-white/40 hover:text-white/80 hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <FileCode className="w-4 h-4" />
              </button>

              {/* Sparks Prompts Toggle */}
              <button
                type="button"
                onClick={() => {
                  playTactileSound('click', preferences.soundEffects);
                  setShowSparks(!showSparks);
                }}
                title="Explore Inquiry Prompts"
                aria-label="Explore Inquiry Prompts"
                className={`min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                  showSparks
                    ? 'border'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
                }`}
                style={
                  showSparks
                    ? {
                        backgroundColor: 'var(--theme-accent-soft-glow)',
                        color: 'var(--theme-accent-primary)',
                        borderColor: 'var(--theme-border-focus)',
                      }
                    : undefined
                }
              >
                <Flame className="w-4 h-4" />
              </button>

              {/* Tone Selection Pill & Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    playTactileSound('click', preferences.soundEffects);
                    setShowToneMenu(!showToneMenu);
                  }}
                  aria-label={`Select cognitive tone. Current tone: ${selectedTone}`}
                  className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.10] text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--theme-accent-primary)' }}
                  />
                  <span>{selectedTone}</span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>

                <AnimatePresence>
                  {showToneMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 mb-2 w-44 rounded-2xl backdrop-blur-2xl shadow-2xl p-1.5 z-50 text-xs font-sans"
                      style={{
                        background: 'var(--theme-surface-popover)',
                        border: '1px solid var(--theme-border-ambient)',
                      }}
                    >
                      {(['Deep Thought', 'Creative', 'Concise', 'Architectural'] as ComposerTone[]).map(
                        (tone) => (
                          <button
                            key={tone}
                            type="button"
                            onClick={() => {
                              playTactileSound('click', preferences.soundEffects);
                              onToneChange(tone);
                              setShowToneMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                              selectedTone === tone
                                ? 'font-medium'
                                : 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                            }`}
                            style={
                              selectedTone === tone
                                ? {
                                    backgroundColor: 'var(--theme-accent-soft-glow)',
                                    color: 'var(--theme-accent-primary)',
                                  }
                                : undefined
                            }
                          >
                            <span>{tone}</span>
                            {selectedTone === tone && (
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: 'var(--theme-accent-primary)' }}
                              />
                            )}
                          </button>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Voice Dictation */}
              <button
                type="button"
                onClick={handleToggleVoice}
                title={isRecording ? 'Halt Recording' : 'Voice Dictation'}
                aria-label={isRecording ? 'Halt Recording' : 'Voice Dictation'}
                className={`min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                  isRecording
                    ? 'border animate-pulse'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
                }`}
                style={
                  isRecording
                    ? {
                        backgroundColor: 'var(--theme-accent-soft-glow)',
                        color: 'var(--theme-accent-primary)',
                        borderColor: 'var(--theme-border-focus)',
                      }
                    : undefined
                }
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {/* Right Controls: Active Status & Send/Stop Button */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-white/30 hidden md:inline">
                {inputValue.length > 0 ? `${inputValue.length} chars` : 'Return to send'}
              </span>

              {isTypingAi ? (
                <button
                  type="button"
                  onClick={() => {
                    playTactileSound('click', preferences.soundEffects);
                    onStopGeneration();
                  }}
                  title="Stop Generating Response"
                  aria-label="Stop Generating Response"
                  className="min-h-[44px] px-4 py-2 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 active:scale-95 animate-pulse"
                  style={{
                    backgroundColor: 'var(--theme-accent-soft-glow)',
                    color: 'var(--theme-accent-primary)',
                    borderColor: 'var(--theme-border-focus)',
                    boxShadow: '0 4px 16px var(--theme-accent-glow)',
                  }}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-medium font-sans">Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!inputValue.trim()}
                  title="Send message"
                  aria-label="Send message"
                  className={`min-w-[44px] min-h-[44px] p-2.5 rounded-2xl transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                    inputValue.trim()
                      ? ''
                      : 'bg-white/[0.05] text-white/20 border border-white/[0.06] cursor-not-allowed'
                  }`}
                  style={
                    inputValue.trim()
                      ? {
                          background: 'var(--theme-btn-primary-bg)',
                          color: 'var(--theme-btn-primary-text)',
                          boxShadow: '0 4px 18px var(--theme-accent-glow)',
                          border: '1px solid var(--theme-border-specular)',
                        }
                      : undefined
                  }
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Optical Footnote */}
      <div className="flex items-center justify-between mt-2.5 px-3 text-[11px] text-white/30 font-light font-mono">
        <span>AETHERIA OPTICS · SUB-SECOND LATENCY</span>
        <span>STREAMING ENCRYPTED</span>
      </div>
    </div>
  );
};
