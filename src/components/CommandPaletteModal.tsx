import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MessageSquare,
  Sparkles,
  Database,
  Radio,
  Settings,
  Shield,
  Volume2,
  VolumeX,
  Trash2,
  Plus,
  Compass,
  ArrowRight,
  Download,
} from 'lucide-react';
import { Conversation, UserPreferences } from '../types';
import { playTactileSound } from '../utils/audio';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  preferences: UserPreferences;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenKnowledgeStudio: () => void;
  onOpenApiManagement: () => void;
  onOpenSettings: () => void;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  onExportDialogue?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  preferences,
  onSelectConversation,
  onNewChat,
  onOpenKnowledgeStudio,
  onOpenApiManagement,
  onOpenSettings,
  onUpdatePreferences,
  onExportDialogue,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

  // Built-in command actions
  const staticActions: PaletteItem[] = [
    {
      id: 'action-new-chat',
      title: 'Start New Dialogue',
      category: 'Actions',
      icon: Plus,
      run: () => {
        onNewChat();
        onClose();
      },
    },
    {
      id: 'action-knowledge-studio',
      title: 'Open Grounded Knowledge Studio (Scraped Data)',
      category: 'Intelligence',
      icon: Database,
      run: () => {
        onOpenKnowledgeStudio();
        onClose();
      },
    },
    {
      id: 'action-api-gateway',
      title: 'AI Gateway & Health Hub (Speed & Latency)',
      category: 'Intelligence',
      icon: Radio,
      run: () => {
        onOpenApiManagement();
        onClose();
      },
    },
    {
      id: 'action-export',
      title: 'Export Active Dialogue (Markdown / JSON)',
      category: 'Actions',
      icon: Download,
      run: () => {
        onExportDialogue?.();
        onClose();
      },
    },
    {
      id: 'action-sound-toggle',
      title: preferences.soundEffects ? 'Mute Tactile Sound Synthesizer' : 'Enable Tactile Sound Synthesizer',
      category: 'Preferences',
      icon: preferences.soundEffects ? VolumeX : Volume2,
      run: () => {
        onUpdatePreferences({ soundEffects: !preferences.soundEffects });
        onClose();
      },
    },
    {
      id: 'action-settings',
      title: 'Open Settings & Preferences',
      category: 'Preferences',
      icon: Settings,
      run: () => {
        onOpenSettings();
        onClose();
      },
    },
  ];

  // Conversation search items
  const conversationItems: PaletteItem[] = conversations.map((c) => ({
    id: `conv-${c.id}`,
    title: c.title,
    subtitle: c.preview,
    category: 'Dialogues',
    icon: MessageSquare,
    run: () => {
      onSelectConversation(c.id);
      onClose();
    },
  }));

  const allItems: PaletteItem[] = [...staticActions, ...conversationItems];

  const filteredItems = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        playTactileSound('click', preferences.soundEffects);
        selected.run();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] sm:pt-[14vh] p-3 sm:p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Floating Command Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border"
          style={{
            background: 'var(--theme-surface-modal, #0e0906)',
            borderColor: 'var(--theme-border-ambient, rgba(255,255,255,0.14))',
            boxShadow: '0 32px 90px rgba(0,0,0,0.85), inset 0 1px 2px rgba(255,255,255,0.2)',
          }}
        >
          {/* Input Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
            <Search className="w-5 h-5 text-amber-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search dialogues, commands, grounding data, or settings..."
              className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none font-sans"
            />
            <kbd className="hidden sm:inline px-2 py-0.5 rounded-md text-[10px] font-mono text-white/40 bg-white/[0.08] border border-white/[0.08]">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
            {filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    playTactileSound('click', preferences.soundEffects);
                    item.run();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white/[0.10] text-white'
                      : 'text-white/70 hover:bg-white/[0.04]'
                  }`}
                  style={
                    isSelected
                      ? {
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)',
                          border: '1px solid var(--theme-border-specular)',
                        }
                      : { border: '1px solid transparent' }
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: isSelected ? 'var(--theme-accent-soft-glow)' : 'rgba(255,255,255,0.04)',
                        color: isSelected ? 'var(--theme-accent-primary)' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white/95 truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-white/40 truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                      {item.category}
                    </span>
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-xs text-white/40">
                No matching results for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>

          {/* Footer Shortcuts hint */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/[0.08] bg-white/[0.02] text-[11px] font-mono text-white/40">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <span className="text-amber-400/80">Aetheria Omni-Control</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
