import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  Paperclip,
  Mic,
  MicOff,
  Copy,
  Check,
  Plus,
  ChevronDown,
  Volume2,
  VolumeX,
  FileCode,
  FileText,
  X,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Terminal,
  Compass,
  Square,
  Radio,
  Cpu,
  Database,
  Command,
  Languages,
} from 'lucide-react';
import { Conversation, UserPreferences, ChatMessage } from '../types';
import { SITE_CONFIG, STARTER_PROMPTS } from '../config/site';
import { getLanguageItem } from '../config/languages';
import { playTactileSound, speakText, stopSpeech } from '../utils/audio';
import { ChatComposer, AttachedFile, ComposerTone } from './composer/ChatComposer';
import { MessageItem } from './chat/MessageItem';
import { ApiManagementModal } from './ApiManagementModal';
import { loadProviderConfig } from '../services/apiGatewayService';
import { GroundedDataset } from './KnowledgeBaseModal';

interface LiquidGlassContainerProps {
  conversation: Conversation | null;
  userName: string;
  preferences: UserPreferences;
  onSendMessage: (
    conversationId: string,
    content: string,
    response: string,
    modelName?: string,
    isError?: boolean
  ) => void;
  onNewChat: () => void;
  onClearChat?: () => void;
  onOpenApiManagement?: () => void;
  activeDataset?: GroundedDataset | null;
  onOpenKnowledgeStudio?: () => void;
  onOpenCommandPalette?: () => void;
  onExportDialogue?: () => void;
  onOpenArtifact?: (artifact: { title: string; language: string; content: string }) => void;
  onOpenSettings?: () => void;
}

export const LiquidGlassContainer: React.FC<LiquidGlassContainerProps> = ({
  conversation,
  userName,
  preferences,
  onSendMessage,
  onNewChat,
  onOpenApiManagement,
  activeDataset,
  onOpenKnowledgeStudio,
  onOpenCommandPalette,
  onExportDialogue,
  onOpenArtifact,
  onOpenSettings,
}) => {
  const [showApiModal, setShowApiModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTypingAi, setIsTypingAi] = useState(false);
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<ChatMessage | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeStreamModel, setActiveStreamModel] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [selectedTone, setSelectedTone] = useState<'Deep Thought' | 'Creative' | 'Concise' | 'Architectural'>('Deep Thought');
  const [showToneDropdown, setShowToneDropdown] = useState(false);
  const [showSparksDrawer, setShowSparksDrawer] = useState(false);
  const [messageReactions, setMessageReactions] = useState<Record<string, 'up' | 'down'>>({});
  const [dockTilt, setDockTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 350, y: 35 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const accumulatedTextRef = useRef<string>('');
  const activeRequestIdRef = useRef<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);

  // Performance-aware smart scroll: avoids fighting user scroll during streaming
  const smartScroll = (force = false, behavior: ScrollBehavior = 'auto') => {
    if (!scrollContainerRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior });
      return;
    }
    const el = scrollContainerRef.current;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (force || distanceFromBottom < 180) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  // Scroll smoothly when a new conversation or message item is appended
  useEffect(() => {
    smartScroll(true, 'smooth');
  }, [conversation?.id, conversation?.messages?.length, optimisticUserMessage?.id]);

  // Clean up ongoing operations when active conversation changes
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsTypingAi(false);
    setOptimisticUserMessage(null);
    setStreamingContent('');
    accumulatedTextRef.current = '';
    setActiveStreamModel('');
    stopSpeech();
  }, [conversation?.id]);

  // Global unmount cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      stopSpeech();
      if (voiceTimerRef.current) {
        clearInterval(voiceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

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

  // Dynamic textarea height
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    playTactileSound('keystroke', preferences.soundEffects);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // 3D Tilt and Refraction Specular tracking
  const handleDockMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = dockRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });

    if (!preferences.enable3dTilt || preferences.motionSpeed === 'reduced') return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setDockTilt({
      rotateX: -((y - centerY) / centerY) * 3.5,
      rotateY: ((x - centerX) / centerX) * 3.5,
    });
  };

  const handleDockMouseLeave = () => {
    setDockTilt({ rotateX: 0, rotateY: 0 });
    setCursorPos({ x: 350, y: 35 });
  };

  // Native & simulated file attachment handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    playTactileSound('click', preferences.soundEffects);

    const newAttachments: AttachedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const sizeStr = f.size > 1024 * 1024
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(f.size / 1024)} KB`;
      newAttachments.push({
        name: f.name,
        size: sizeStr,
        type: f.type || 'document',
      });
    }

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const handleQuickSampleAttachment = () => {
    playTactileSound('click', preferences.soundEffects);
    const samples: AttachedFile[] = [
      { name: 'optical_spec_v2.pdf', size: '1.4 MB', type: 'application/pdf' },
      { name: 'liquid_refraction_matrix.json', size: '42 KB', type: 'application/json' },
      { name: 'coherence_invariance.py', size: '18 KB', type: 'text/x-python' },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    if (!attachedFiles.some((f) => f.name === pick.name)) {
      setAttachedFiles((prev) => [...prev, pick]);
    }
  };

  // Real Web Speech API with fallback
  const handleToggleVoice = () => {
    playTactileSound('toggle', preferences.soundEffects);

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsRecording(false);
    } else {
      setIsRecording(true);

      // Check for browser speech recognition
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript) {
              setInputValue((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
            }
          };

          recognition.onerror = () => {
            // Handled gracefully
          };

          recognition.onend = () => {
            setIsRecording(false);
          };

          recognitionRef.current = recognition;
          recognition.start();
          return;
        } catch {
          // Fall through to sample transcription
        }
      }

      // Fallback transcription sampler
      const voiceSamples = [
        'How does liquid glass disperse light at glancing refraction angles?',
        'Synthesize an architectural blueprint for sub-millisecond real-time event streaming.',
        'Deconstruct the principles of Dieter Rams and Jony Ive into modern UI architecture.',
      ];
      setTimeout(() => {
        const sample = voiceSamples[Math.floor(Math.random() * voiceSamples.length)];
        setInputValue((prev) => (prev ? `${prev} ` : '') + sample);
        setIsRecording(false);
      }, 2400);
    }
  };

  // Stop ongoing AI generation
  const handleStopGeneration = () => {
    playTactileSound('click', preferences.soundEffects);
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTypingAi(false);
    const targetConvId = activeConversationIdRef.current || conversation?.id || `conv-${Date.now()}`;
    const promptText = optimisticUserMessage?.content || inputValue.trim() || 'Prompt';
    const finalContent = accumulatedTextRef.current || streamingContent;
    if (finalContent.trim()) {
      onSendMessage(
        targetConvId,
        promptText,
        finalContent.trim(),
        activeStreamModel || 'Interrupted',
        false
      );
    }
    setOptimisticUserMessage(null);
    setStreamingContent('');
    accumulatedTextRef.current = '';
    setActiveStreamModel('');
    activeRequestIdRef.current = null;
    activeConversationIdRef.current = null;
  };

  // Dispatch message with real-time SSE streaming response and optimistic UI rendering
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text || isTypingAi) return;

    playTactileSound('send', preferences.soundEffects);

    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const currentAttachments = [...attachedFiles];
    setAttachedFiles([]);
    setShowSparksDrawer(false);

    const promptContext = currentAttachments.length > 0
      ? `${text} [Attached: ${currentAttachments.map((f) => `${f.name} (${f.size})`).join(', ')}]`
      : text;

    const targetConvId = conversation?.id || `conv-${Date.now()}`;
    const currentRequestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeRequestIdRef.current = currentRequestId;
    activeConversationIdRef.current = targetConvId;

    // 1. Optimistically display user's message immediately (0ms visual latency)
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const pendingUserMsg: ChatMessage = {
      id: `usr-pending-${Date.now()}`,
      role: 'user',
      content: promptContext,
      timestamp: timeString,
    };
    setOptimisticUserMessage(pendingUserMsg);

    setIsTypingAi(true);
    setStreamingContent('');
    accumulatedTextRef.current = '';

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const providerConfig = loadProviderConfig();
    const preferredProvider = providerConfig.preferredProvider;
    const preferredModel = providerConfig.preferredModel[preferredProvider] || preferences.activeApi || 'gemini-flash-latest';
    let usedModel = preferredModel;
    setActiveStreamModel(preferredModel);

    let streamingSucceeded = false;
    let hasError = false;
    let errorMessage = '';
    smartScroll(true, 'smooth');

    // Multi-turn conversation context preparation
    const conversationHistory = (conversation?.messages || [])
      .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          history: conversationHistory,
          conversationId: targetConvId,
          requestId: currentRequestId,
          attachments: currentAttachments,
          groundedData: activeDataset?.data,
          tone: selectedTone === 'Architectural' ? 'Deep Thought' : selectedTone,
          model: providerConfig.modelRouting === 'auto' ? 'auto' : preferredModel,
          modelRouting: providerConfig.modelRouting || 'auto',
          provider: preferredProvider,
          customKeys: providerConfig.customKeys,
          customEndpoints: providerConfig.customEndpoints,
          fallbackOrder: providerConfig.fallbackOrder,
          language: preferences.language || 'en',
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        hasError = true;
        errorMessage = errJson.error || `HTTP ${response.status}: Failed to reach AI gateway.`;
        accumulatedTextRef.current = errorMessage;
        setStreamingContent(errorMessage);
      } else if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          if (controller.signal.aborted) break;

          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (controller.signal.aborted) break;
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);

              // Validate chunk correlation: discard stale chunks from other conversations/requests
              if (parsed.requestId && parsed.requestId !== activeRequestIdRef.current) continue;
              if (parsed.conversationId && parsed.conversationId !== activeConversationIdRef.current) continue;

              if (parsed.type === 'error' || parsed.error) {
                hasError = true;
                errorMessage = parsed.error || 'The AI provider encountered an error generating the response.';
                accumulatedTextRef.current = errorMessage;
                setStreamingContent(errorMessage);
                streamingSucceeded = true;
                break;
              }

              if (parsed.type === 'metadata') {
                if (parsed.model) {
                  usedModel = parsed.model;
                  setActiveStreamModel(parsed.model);
                }
                continue;
              }

              if (parsed.model) {
                usedModel = parsed.model;
                setActiveStreamModel(parsed.model);
              }

              if (parsed.text) {
                streamingSucceeded = true;
                accumulatedTextRef.current += parsed.text;

                if (!rafIdRef.current) {
                  rafIdRef.current = requestAnimationFrame(() => {
                    setStreamingContent(accumulatedTextRef.current);
                    rafIdRef.current = null;
                    smartScroll(false, 'auto');
                  });
                }
              }

              if (parsed.done) {
                streamingSucceeded = true;
                break;
              }
            } catch {
              // Ignore partial chunk parse errors
            }
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return;
      }
      hasError = true;
      errorMessage = (err as Error)?.message || 'Network connection interrupted.';
      accumulatedTextRef.current = errorMessage;
      setStreamingContent(errorMessage);
    }

    // Flush any pending RAF frame
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (accumulatedTextRef.current) {
      setStreamingContent(accumulatedTextRef.current);
    }

    if (controller.signal.aborted) {
      return;
    }

    let accumulatedText = accumulatedTextRef.current;

    // Strict validation: Never fall back to fake mock AI. Report real status or error.
    if (hasError) {
      accumulatedText = errorMessage || 'Failed to complete request.';
    } else if (!streamingSucceeded || !accumulatedText.trim()) {
      accumulatedText = 'AI provider is not configured. Connect an AI provider to start chatting.';
      hasError = true;
    }

    setIsTypingAi(false);
    setOptimisticUserMessage(null);
    setStreamingContent('');
    accumulatedTextRef.current = '';
    setActiveStreamModel('');
    activeRequestIdRef.current = null;
    activeConversationIdRef.current = null;
    abortControllerRef.current = null;

    playTactileSound('receive', preferences.soundEffects);
    onSendMessage(targetConvId, text, accumulatedText, usedModel, hasError);
    smartScroll(true, 'smooth');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string, id: string) => {
    playTactileSound('click', preferences.soundEffects);
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakToggle = (content: string, id: string) => {
    if (speakingId === id) {
      stopSpeech();
      setSpeakingId(null);
    } else {
      playTactileSound('click', preferences.soundEffects);
      setSpeakingId(id);
      speakText(content, () => setSpeakingId(null));
    }
  };

  const handleReaction = (messageId: string, type: 'up' | 'down') => {
    playTactileSound('click', preferences.soundEffects);
    setMessageReactions((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === type ? (null as unknown as 'up') : type,
    }));
  };

  const handleRegenerate = (assistantMsgId: string) => {
    if (isTypingAi || !conversation) return;
    const msgIndex = conversation.messages.findIndex((m) => m.id === assistantMsgId);
    const userMsg = msgIndex > 0 ? conversation.messages[msgIndex - 1] : null;
    const prompt = userMsg ? userMsg.content : 'Refine and expand upon the previous answer';
    handleSend(prompt);
  };



  // Glass blur intensity class
  const getGlassBlurClass = () => {
    switch (preferences.glassIntensity) {
      case 'subtle':
        return 'backdrop-blur-xl';
      case 'deep':
        return 'backdrop-blur-[40px] saturate-200';
      case 'balanced':
      default:
        return 'backdrop-blur-3xl';
    }
  };

  // Font size multiplier
  const getFontSizeClass = () => {
    switch (preferences.fontSize) {
      case 'sm':
        return 'text-[13px] sm:text-[14px]';
      case 'lg':
        return 'text-[16px] sm:text-[17px]';
      case 'base':
      default:
        return 'text-[14px] sm:text-[15px]';
    }
  };

  const messages = conversation?.messages ?? [];
  const isGreetingState = messages.length === 0 && !optimisticUserMessage && !isTypingAi;
  const currentLang = getLanguageItem(preferences.language);

  return (
    <div className="relative z-10 flex-1 flex flex-col h-full w-full bg-transparent text-white overflow-hidden select-none">
      {/* Hidden Real File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Header Bar with Glass Treatment */}
      <header className="relative z-20 flex items-center justify-between pl-14 lg:pl-6 pr-3 sm:px-6 lg:px-8 py-3 sm:py-3.5 border-b border-white/[0.06] bg-black/30 backdrop-blur-md safe-area-top">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: 'var(--theme-accent-primary)',
                boxShadow: '0 0 8px var(--theme-accent-glow)',
              }}
            />
            <h2 className="text-[13px] sm:text-[14px] font-medium tracking-tight text-white/90 truncate max-w-[120px] xs:max-w-[180px] sm:max-w-xs md:max-w-md">
              {conversation?.title || 'New Dialogue'}
            </h2>
          </div>
          <span className="hidden sm:inline text-white/20 text-xs">·</span>
          <span className="hidden md:inline text-[11px] font-mono text-white/40 tracking-wider uppercase">
            {SITE_CONFIG.organizationName} · {selectedTone}
          </span>
          <button
            type="button"
            onClick={() => {
              playTactileSound('click', preferences.soundEffects);
              if (onOpenApiManagement) {
                onOpenApiManagement();
              } else {
                setShowApiModal(true);
              }
            }}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono hover:scale-105 transition-transform cursor-pointer"
            style={{
              backgroundColor: 'var(--theme-accent-soft-glow)',
              border: '1px solid var(--theme-border-ambient)',
              color: 'var(--theme-text-accent)',
            }}
            title="Open Aetheria AI Gateway & Health Hub"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Radio className="w-3 h-3 text-amber-400" />
            <span className="uppercase tracking-wider font-semibold">AI Gateway</span>
            <span className="hidden lg:inline text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              ⚡ Multi-Engine
            </span>
          </button>

          {/* Grounded Knowledge Studio Chip */}
          {activeDataset ? (
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', preferences.soundEffects);
                onOpenKnowledgeStudio?.();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 transition-all cursor-pointer shadow-sm"
              title="Scraped JSON Dataset active in LLM context — click to inspect or replace"
            >
              <Database className="w-3 h-3 text-indigo-400 animate-pulse" />
              <span className="font-semibold truncate max-w-[110px] sm:max-w-[140px]">{activeDataset.name}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-400/20 text-indigo-200 uppercase font-bold">Grounded</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', preferences.soundEffects);
                onOpenKnowledgeStudio?.();
              }}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              title="Ground Aetheria with your scraped JSON dataset"
            >
              <Database className="w-3 h-3 text-amber-400/80" />
              <span>Grounding Studio</span>
            </button>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Active Indian Language Selector Button */}
          <button
            type="button"
            onClick={() => {
              playTactileSound('click', preferences.soundEffects);
              onOpenSettings?.();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] hover:border-amber-400/40 rounded-xl transition-all cursor-pointer font-sans"
            title={`Active Language: ${currentLang.name} (${currentLang.nativeName}). Click to change language.`}
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-[11px] truncate max-w-[80px] sm:max-w-[110px]">{currentLang.nativeName}</span>
          </button>

          {/* Quick Command Palette Trigger (⌘K) */}
          <button
            type="button"
            onClick={() => {
              playTactileSound('click', preferences.soundEffects);
              onOpenCommandPalette?.();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] rounded-xl transition-all cursor-pointer font-mono"
            title="Open Command Palette (⌘K)"
          >
            <Command className="w-3 h-3" />
            <span className="text-[11px]">⌘K</span>
          </button>

          {/* Tone Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', preferences.soundEffects);
                setShowToneDropdown(!showToneDropdown);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-colors cursor-pointer"
            >
              <span>{selectedTone}</span>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>

            <AnimatePresence>
              {showToneDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1.5 w-44 rounded-2xl backdrop-blur-3xl shadow-2xl py-1.5 z-30"
                  style={{
                    background: 'var(--theme-surface-popover)',
                    border: '1px solid var(--theme-border-ambient)',
                  }}
                >
                  {(['Deep Thought', 'Creative', 'Concise', 'Architectural'] as const).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => {
                        playTactileSound('click', preferences.soundEffects);
                        setSelectedTone(tone);
                        setShowToneDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                        selectedTone === tone
                          ? 'text-white font-medium'
                          : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
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
                        <Check className="w-3 h-3" style={{ color: 'var(--theme-accent-primary)' }} />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={() => {
              playTactileSound('click', preferences.soundEffects);
              onNewChat();
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-white/80 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </header>

      {/* Main Messages Scroll Area */}
      <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 pb-6 select-text">
        <div className="max-w-3xl xl:max-w-4xl mx-auto w-full space-y-6">
          {/* Greeting State when dialogue is empty */}
          {isGreetingState && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-xl mx-auto my-auto pt-6"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner mb-5 backdrop-blur-xl"
                style={{
                  background: 'var(--theme-surface-base)',
                  border: '1px solid var(--theme-border-specular)',
                }}
              >
                <Sparkles className="w-5 h-5" style={{ color: 'var(--theme-accent-primary)' }} />
              </div>

              <h3 className="text-3xl sm:text-4xl font-light tracking-tight text-white">
                {currentLang.code === 'en' ? (
                  <>Good day, <span className="font-semibold text-white">{userName}</span></>
                ) : (
                  <>{currentLang.nativeName} · <span className="font-semibold text-white">{userName}</span></>
                )}
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-white/50 font-light tracking-wide leading-relaxed">
                {currentLang.sampleGreeting}
              </p>

              {/* Starter Sparks in selected language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full text-left">
                {(currentLang.quickStarters && currentLang.quickStarters.length > 0
                  ? currentLang.quickStarters
                  : STARTER_PROMPTS
                ).map((starter) => (
                  <button
                    key={starter.title}
                    type="button"
                    onClick={() => handleSend(starter.prompt)}
                    className="group p-4 rounded-2xl transition-all duration-300 text-left cursor-pointer"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--theme-border-ambient)',
                    }}
                  >
                    <div
                      className="text-[10px] font-mono tracking-widest uppercase mb-1 font-semibold"
                      style={{ color: 'var(--theme-accent-primary)' }}
                    >
                      {currentLang.name}
                    </div>
                    <div className="text-xs font-medium text-white/90 group-hover:text-white transition-colors">
                      {starter.title}
                    </div>
                    <div className="text-[11px] text-white/40 mt-1 line-clamp-2 leading-relaxed">
                      {starter.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Rendered Messages with Apple Brown-Tinted Liquid Glass */}
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              userName={userName}
              preferences={preferences}
              onOpenArtifact={onOpenArtifact}
            />
          ))}

          {/* Optimistic User Message — Instant Zero-Latency Display */}
          {optimisticUserMessage && (
            <MessageItem
              key={optimisticUserMessage.id}
              message={optimisticUserMessage}
              userName={userName}
              preferences={preferences}
              onOpenArtifact={onOpenArtifact}
            />
          )}

          {/* Active Streaming Response */}
          {isTypingAi && (
            <MessageItem
              message={{
                id: 'streaming-active',
                role: 'assistant',
                content: streamingContent || `Reflecting with ${selectedTone} mode...`,
                timestamp: 'Now',
                model: activeStreamModel || (preferences.activeApi === 'gemini-3.1-flash-lite'
                  ? 'Gemini 3.1 Flash-Lite (Speed Tier)'
                  : preferences.activeApi === 'gemini-3.8-flash'
                  ? 'Gemini 3.8 Flash (Reasoning Tier)'
                  : 'Aetheria Optical 2.5'),
              }}
              userName={userName}
              preferences={preferences}
              isStreaming={true}
              onOpenArtifact={onOpenArtifact}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* FLOATING LIQUID-GLASS TYPING BOX */}
      <div className="relative z-30 w-full p-3 sm:p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-2">
        <div className="max-w-3xl xl:max-w-4xl mx-auto w-full">
        {/* Apple-grade Liquid Glass Floating Chat Composer */}
        <ChatComposer
          preferences={preferences}
          isTypingAi={isTypingAi}
          onSendMessage={(text) => handleSend(text)}
          onStopGeneration={handleStopGeneration}
          selectedTone={selectedTone}
          onToneChange={(tone) => setSelectedTone(tone)}
          attachedFiles={attachedFiles}
          onAddAttachment={(file) => setAttachedFiles((prev) => [...prev, file])}
          onRemoveAttachment={(idx) => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
        />
      </div>
    </div>

    <ApiManagementModal
      isOpen={showApiModal}
      onClose={() => setShowApiModal(false)}
      soundEnabled={preferences.soundEffects}
    />
  </div>
  );
};

/**
 * Dedicated Interactive Code Block Component with Copy Action
 */
interface CodeBlockProps {
  language: string;
  code: string;
  soundEffects: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, soundEffects }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    playTactileSound('click', soundEffects);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-white/[0.12] bg-[#0a0705]/95 shadow-2xl text-[13px]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/[0.08] text-[11px] font-mono text-white/60">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          <span className="uppercase tracking-wider font-semibold text-white/80">{language || 'code'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-neutral-100 leading-relaxed text-xs sm:text-[13px] bg-black/40">
        <code>{code}</code>
      </pre>
    </div>
  );
};

/**
 * Clean formatter for message content with markdown, bolding, blockquotes, and code blocks
 */
function formatMessageContent(content: string, soundEffects = true) {
  if (!content) return null;

  const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderTextParagraphs(content.slice(lastIndex, match.index), `txt-${lastIndex}`));
    }

    const language = match[1] || 'code';
    const codeBody = match[2];

    parts.push(
      <CodeBlock
        key={`code-${match.index}`}
        language={language}
        code={codeBody}
        soundEffects={soundEffects}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(renderTextParagraphs(content.slice(lastIndex), `txt-${lastIndex}`));
  }

  return parts;
}

function renderTextParagraphs(text: string, keyPrefix: string) {
  const lines = text.split('\n');
  return (
    <div key={keyPrefix} className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1.5" />;

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm font-semibold text-white/95 pt-1 tracking-tight">
              {trimmed.replace('### ', '')}
            </h4>
          );
        }

        if (trimmed.startsWith('> ')) {
          return (
            <div
              key={idx}
              className="pl-3.5 border-l-2 border-amber-400/70 italic text-white/80 my-2.5 bg-white/[0.015] py-1 rounded-r-lg"
            >
              {trimmed.replace('> ', '')}
            </div>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-amber-300 mt-1 text-xs">·</span>
              <span>{renderInlineBold(trimmed.slice(2))}</span>
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-mono text-xs text-amber-300/80 pt-0.5">{numMatch[1]}.</span>
              <span>{renderInlineBold(numMatch[2])}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInlineBold(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInlineBold(str: string) {
  const boldParts = str.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="font-mono text-xs bg-white/[0.08] px-1.5 py-0.5 rounded text-amber-200 border border-white/[0.06]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
