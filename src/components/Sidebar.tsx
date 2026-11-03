import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Shield,
  Search,
  Pin,
  Edit2,
  Check,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sparkles,
  Radio,
  Database,
  HelpCircle,
  FileText,
  Camera,
  Calendar,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGSAP } from '@gsap/react';
import { Conversation, UserProfile, ThemePreset } from '../types';
import { SITE_CONFIG } from '../config/site';
import { playTactileSound } from '../utils/audio';
import {
  animateSidebarCollapse,
  animateConversationListItems,
  setupSidebarScrollTrigger,
  refreshScrollTriggers,
} from '../animations/gsapAnimations';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isOpenMobile: boolean;
  soundEffects: boolean;
  userProfile: UserProfile | null;
  firebaseUser?: { email?: string | null; uid?: string } | null;
  theme?: ThemePreset;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onPinConversation: (id: string) => void;
  onToggleMobile: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  onOpenApiManagement?: () => void;
  onOpenKnowledgeStudio?: () => void;
  onOpenQuiz?: () => void;
  onOpenSummarize?: () => void;
  onOpenSolver?: () => void;
  onOpenPlanner?: () => void;
  onOpenExams?: () => void;
  onOpenFlashcards?: () => void;
  onResetSession: () => void;
  onSignInGoogle?: () => void;
  onSignOutFirebase?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  isOpenMobile,
  soundEffects,
  userProfile,
  firebaseUser,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onPinConversation,
  onToggleMobile,
  onOpenSettings,
  onOpenPrivacy,
  onOpenApiManagement,
  onOpenKnowledgeStudio,
  onOpenQuiz,
  onOpenSummarize,
  onOpenSolver,
  onOpenPlanner,
  onOpenExams,
  onOpenFlashcards,
  onResetSession,
  onSignInGoogle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null);

  const sidebarRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by category with pinned items always first
  const grouped: Record<string, Conversation[]> = {
    Pinned: [],
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  filteredConversations.forEach((conv) => {
    if (conv.isPinned) {
      grouped.Pinned.push(conv);
      return;
    }
    const diffDays = (now - conv.updatedAt) / oneDay;
    if (diffDays < 1) {
      grouped.Today.push(conv);
    } else if (diffDays < 2) {
      grouped.Yesterday.push(conv);
    } else if (diffDays < 7) {
      grouped['Previous 7 Days'].push(conv);
    } else {
      grouped.Older.push(conv);
    }
  });

  // 1. GSAP Physics-Based Collapse / Expand Transition
  useGSAP(
    () => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      animateSidebarCollapse(sidebarRef.current, isCollapsedDesktop);
      animateConversationListItems(scrollContainerRef.current, isCollapsedDesktop);
    },
    { dependencies: [isCollapsedDesktop], scope: sidebarRef }
  );

  // 2. GSAP ScrollTrigger Integration for conversation items
  useEffect(() => {
    const cleanup = setupSidebarScrollTrigger(scrollContainerRef.current);
    refreshScrollTriggers();
    return () => {
      cleanup();
    };
  }, [conversations.length, searchQuery, isCollapsedDesktop]);

  const handleStartRename = (conv: Conversation) => {
    playTactileSound('click', soundEffects);
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isOpenMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggleMobile}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md lg:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Mobile Floating Menu Button */}
      <div className="fixed top-3 left-3 z-30 lg:hidden">
        <button
          type="button"
          onClick={() => {
            playTactileSound('toggle', soundEffects);
            onToggleMobile();
          }}
          aria-label="Open Dialogue Navigation"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/[0.14] text-white/80 shadow-lg cursor-pointer active:scale-95 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Apple-Grade Liquid Glass Sidebar with GSAP Physics Transitions */}
      <aside
        ref={sidebarRef}
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col h-full backdrop-blur-3xl select-none ${
          isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsedDesktop ? 'lg:w-[72px]' : 'lg:w-[280px]'}`}
        style={{
          background: 'var(--theme-surface-sidebar)',
          borderRight: '1px solid var(--theme-border-ambient)',
          boxShadow: '16px 0 60px var(--theme-shadow-ambient)',
          willChange: 'width',
        }}
      >
        {/* Specular Ambient Underlayer */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(circle at 10% 20%, var(--theme-accent-soft-glow), transparent 70%)',
          }}
        />

        {/* Top Header: Brand Wordmark & Collapse Toggle */}
        <div className="relative z-10 flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Custom geometric logo mark */}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
              style={{
                background: 'var(--theme-surface-elevated)',
                border: '1px solid var(--theme-border-specular)',
                boxShadow: 'inset 0 1px 1px var(--theme-border-specular)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="var(--theme-accent-primary)" strokeWidth="1.2" />
                <path d="M8 2V14M2 8H14" stroke="var(--theme-accent-primary)" strokeWidth="0.8" opacity="0.6" />
                <circle cx="8" cy="8" r="2.2" fill="var(--theme-accent-primary)" />
              </svg>
            </div>

            {/* Wordmark (hidden if collapsed on desktop) */}
            <div
              className={`flex flex-col transition-opacity duration-200 ${
                isCollapsedDesktop ? 'lg:hidden' : 'opacity-100'
              }`}
            >
              <span className="text-[14px] font-semibold tracking-wider text-white font-sans">
                {SITE_CONFIG.organizationName}
              </span>
              <span
                className="text-[10px] font-mono tracking-widest uppercase font-medium"
                style={{ color: 'var(--theme-text-accent)', opacity: 0.85 }}
              >
                OPTICAL SUITE
              </span>
            </div>
          </div>

          {/* Desktop collapse toggle & mobile close */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', soundEffects);
                setIsCollapsedDesktop(!isCollapsedDesktop);
              }}
              title={isCollapsedDesktop ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer active:scale-95"
            >
              {isCollapsedDesktop ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onToggleMobile}
              aria-label="Close Dialogue Navigation"
              className="flex lg:hidden min-w-[44px] min-h-[44px] items-center justify-center text-white/60 hover:text-white rounded-xl cursor-pointer active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action: New Dialogue Button */}
        <div className="relative z-10 p-3">
          <button
            type="button"
            onClick={() => {
              playTactileSound('click', soundEffects);
              onNewChat();
              if (isOpenMobile) onToggleMobile();
            }}
            title="Start New Dialogue"
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer active:scale-95 ${
              isCollapsedDesktop ? 'lg:px-0' : ''
            }`}
            style={{
              background: 'var(--theme-accent-soft-glow)',
              border: '1px solid var(--theme-border-ambient)',
              color: 'var(--theme-text-primary)',
              boxShadow: '0 4px 16px var(--theme-shadow-ambient), inset 0 1px 1px var(--theme-border-specular)',
            }}
          >
            <Plus className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-accent-primary)' }} />
            <span className={`${isCollapsedDesktop ? 'lg:hidden' : ''} truncate font-sans`}>
              New Dialogue
            </span>
          </button>
        </div>

        {/* Search input (visible only when expanded) */}
        {!isCollapsedDesktop && (
          <div className="relative z-10 px-3 pb-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] focus-within:border-[var(--theme-border-focus)] text-white/40 text-xs transition-colors">
              <Search className="w-3.5 h-3.5 shrink-0 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dialogues..."
                className="w-full bg-transparent text-white placeholder:text-white/30 text-[12px] outline-none font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white cursor-pointer text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chat History List with GSAP ScrollTrigger Integration */}
        <div
          ref={scrollContainerRef}
          className="relative z-10 flex-1 overflow-y-auto px-2 py-1 space-y-4"
        >
          {Object.entries(grouped).map(([category, items]) => {
            if (items.length === 0) return null;

            return (
              <div key={category} className="space-y-1">
                {/* Section Header */}
                <div
                  className={`px-3 py-1 text-[10px] font-mono tracking-wider text-white/40 uppercase ${
                    isCollapsedDesktop ? 'lg:hidden' : ''
                  }`}
                >
                  {category}
                </div>

                {/* Items */}
                {items.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  const isEditing = editingId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onMouseEnter={() => setHoveredConvId(conv.id)}
                      onMouseLeave={() => setHoveredConvId(null)}
                      className="relative group sidebar-dialogue-item"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/[0.08] border border-white/[0.18]">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(conv.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="flex-1 bg-transparent text-xs text-white outline-none font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(conv.id)}
                            className="p-1 hover:text-emerald-400 text-white/70"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            playTactileSound('click', soundEffects);
                            onSelectConversation(conv.id);
                            if (isOpenMobile) onToggleMobile();
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                            isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''
                          }`}
                          style={
                            isActive
                              ? {
                                  background: 'var(--theme-accent-soft-glow)',
                                  border: '1px solid var(--theme-border-focus)',
                                  boxShadow: 'inset 0 1px 1px var(--theme-border-specular), 0 4px 16px var(--theme-shadow-ambient)',
                                  color: 'var(--theme-text-primary)',
                                }
                              : {
                                  border: '1px solid transparent',
                                  color: 'rgba(255, 255, 255, 0.70)',
                                }
                          }
                        >
                          <MessageSquare
                            className="w-3.5 h-3.5 shrink-0 transition-colors"
                            style={
                              isActive
                                ? { color: 'var(--theme-accent-primary)' }
                                : { color: 'rgba(255, 255, 255, 0.40)' }
                            }
                          />
                          <div
                            className={`flex-1 min-w-0 ${
                              isCollapsedDesktop ? 'lg:hidden' : ''
                            }`}
                          >
                            <div className="text-[12px] font-medium truncate flex items-center gap-1.5">
                              {conv.isPinned && (
                                <Pin
                                  className="w-2.5 h-2.5 shrink-0 rotate-45"
                                  style={{ color: 'var(--theme-accent-primary)' }}
                                />
                              )}
                              <span className="truncate">{conv.title}</span>
                            </div>
                            <div className="text-[11px] text-white/35 truncate">
                              {conv.preview}
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Hover action icons */}
                      {!isCollapsedDesktop && !isEditing && (
                        <div
                          className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-xl backdrop-blur-md shadow-md transition-opacity duration-150 ${
                            hoveredConvId === conv.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                          }`}
                          style={{
                            background: 'var(--theme-surface-popover)',
                            border: '1px solid var(--theme-border-ambient)',
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(conv);
                            }}
                            title="Rename Dialogue"
                            className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playTactileSound('click', soundEffects);
                              onPinConversation(conv.id);
                            }}
                            title={conv.isPinned ? 'Unpin' : 'Pin to top'}
                            className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playTactileSound('click', soundEffects);
                              onDeleteConversation(conv.id);
                            }}
                            title="Delete Dialogue"
                            className="p-1 text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="text-center py-8 text-xs text-white/30 font-sans">
              No dialogues found
            </div>
          )}
        </div>

        {/* Bottom Section: Profile, Settings & Cloud Status */}
        <div className="relative z-10 p-3 border-t border-white/[0.06] space-y-1.5 bg-black/30 backdrop-blur-md">
          {/* User Profile Card */}
          {userProfile && (
            <div
              className={`flex items-center gap-2.5 px-2.5 py-2 mb-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] ${
                isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''
              }`}
            >
              <div
                className="w-7 h-7 rounded-xl text-white text-[11px] font-semibold flex items-center justify-center shrink-0 shadow-inner"
                style={{
                  background: 'var(--theme-surface-elevated)',
                  border: '1px solid var(--theme-border-ambient)',
                  color: 'var(--theme-accent-primary)',
                }}
              >
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <div
                className={`flex-1 min-w-0 ${
                  isCollapsedDesktop ? 'lg:hidden' : ''
                }`}
              >
                <div className="text-[12px] font-medium text-white/90 truncate flex items-center justify-between">
                  <span className="truncate">{userProfile.name}</span>
                  {firebaseUser ? (
                    <span
                      className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] shrink-0"
                      title="Cloud Synced"
                    />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-neutral-500 shrink-0" title="Local Sandbox" />
                  )}
                </div>
                <div className="text-[10px] text-white/40 font-mono truncate">
                  {firebaseUser ? 'Cloud Verified' : 'Local Sandbox'}
                </div>
              </div>
            </div>
          )}

          {/* Connect Cloud button if unauthenticated */}
          {!firebaseUser && onSignInGoogle && !isCollapsedDesktop && (
            <button
              type="button"
              onClick={onSignInGoogle}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 mb-1 rounded-xl text-[11px] font-medium transition-colors cursor-pointer"
              style={{
                background: 'var(--theme-accent-soft-glow)',
                border: '1px solid var(--theme-border-ambient)',
                color: 'var(--theme-accent-primary)',
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span>Sync with Cloud</span>
            </button>
          )}

          {/* Crema Study Buddy Tools */}
          <div className="pt-2 pb-1 border-t border-white/[0.06] space-y-1">
            {!isCollapsedDesktop && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/80 px-2 block mb-1">
                Study Buddy Tools
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', soundEffects);
                onOpenQuiz?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-left text-amber-200/90 hover:text-amber-100 hover:bg-amber-500/10 border border-amber-500/20 transition-all text-xs cursor-pointer ${
                isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''
              }`}
              title="Practice Quizzes"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className={isCollapsedDesktop ? 'lg:hidden' : 'font-medium'}>Practice Quizzes</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', soundEffects);
                onOpenSummarize?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-left text-stone-200 hover:text-white hover:bg-white/[0.06] transition-all text-xs cursor-pointer ${
                isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''
              }`}
              title="File & Note Summaries"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className={isCollapsedDesktop ? 'lg:hidden' : ''}>Summarize Notes</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', soundEffects);
                onOpenSolver?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-left text-stone-200 hover:text-white hover:bg-white/[0.06] transition-all text-xs cursor-pointer ${
                isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''
              }`}
              title="Photo Question Solver"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className={isCollapsedDesktop ? 'lg:hidden' : ''}>Photo Problem Solver</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', soundEffects);
                onOpenPlanner?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-left text-stone-200 hover:text-white hover:bg-white/[0.06] transition-all text-xs cursor-pointer ${
                isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''
              }`}
              title="Study Planner"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className={isCollapsedDesktop ? 'lg:hidden' : ''}>Study Planner</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', soundEffects);
                onOpenExams?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-left text-stone-200 hover:text-white hover:bg-white/[0.06] transition-all text-xs cursor-pointer ${
                isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''
              }`}
              title="Exam Tracker & Google Forms"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className={isCollapsedDesktop ? 'lg:hidden' : ''}>Exam Tracker</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', soundEffects);
                onOpenFlashcards?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-left text-stone-200 hover:text-white hover:bg-white/[0.06] transition-all text-xs cursor-pointer ${
                isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''
              }`}
              title="Flashcards"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className={isCollapsedDesktop ? 'lg:hidden' : ''}>Flashcards</span>
            </button>
          </div>

          {/* AI Gateway & Health Hub Button */}
          <button
            type="button"
            onClick={() => {
              playTactileSound('click', soundEffects);
              onOpenApiManagement?.();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors text-xs cursor-pointer ${
              isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className={isCollapsedDesktop ? 'lg:hidden' : ''}>
              AI Gateway & Health Hub
            </span>
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => {
              playTactileSound('click', soundEffects);
              onOpenSettings();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-xs cursor-pointer ${
              isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-white/50 shrink-0" />
            <span className={isCollapsedDesktop ? 'lg:hidden' : ''}>
              Settings & Preferences
            </span>
          </button>

          {/* Privacy Policy Link */}
          <button
            type="button"
            onClick={() => {
              playTactileSound('click', soundEffects);
              onOpenPrivacy();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-xs cursor-pointer ${
              isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-white/50 shrink-0" />
            <span className={isCollapsedDesktop ? 'lg:hidden' : ''}>
              Privacy & Safeguards
            </span>
          </button>

          {/* Sign Out / Reset Experience */}
          <button
            type="button"
            onClick={() => {
              playTactileSound('click', soundEffects);
              onResetSession();
            }}
            title="Reset to Opening Screen"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-colors text-xs cursor-pointer ${
              isCollapsedDesktop ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <LogOut className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <span className={isCollapsedDesktop ? 'lg:hidden' : ''}>
              Restart Experience
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
