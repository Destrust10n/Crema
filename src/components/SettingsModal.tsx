import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Palette,
  Activity,
  Eye,
  User,
  Check,
  Volume2,
  VolumeX,
  Type,
  Download,
  Trash2,
  RotateCcw,
  Cpu,
  Zap,
  Lock,
  Globe,
  Languages,
} from 'lucide-react';
import { UserPreferences, UserProfile, ThemePreset, MotionSpeed, GlassIntensity, FontSize, Conversation, ApiProvider, IndianLanguageCode } from '../types';
import { SITE_CONFIG, updateOrganizationName } from '../config/site';
import { INDIAN_LANGUAGES, getLanguageItem } from '../config/languages';
import { playTactileSound } from '../utils/audio';
import { THEME_PALETTES } from '../theme/designSystem';

interface SettingsModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  userProfile: UserProfile | null;
  conversations: Conversation[];
  firebaseUser?: { email?: string | null; uid?: string } | null;
  onClose: () => void;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onUpdateProfile: (name: string) => void;
  onClearAllChats: () => void;
  onResetSession: () => void;
  onSignInGoogle?: () => void;
  onSignOutFirebase?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  preferences,
  userProfile,
  conversations,
  firebaseUser,
  onClose,
  onUpdatePreferences,
  onUpdateProfile,
  onClearAllChats,
  onResetSession,
  onSignInGoogle,
  onSignOutFirebase,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'motion' | 'glass' | 'language' | 'api' | 'profile'>('appearance');
  const [tempName, setTempName] = useState(userProfile?.name || '');
  const [tempOrg, setTempOrg] = useState(SITE_CONFIG.organizationName);
  const [savedNameNotice, setSavedNameNotice] = useState(false);
  const [savedOrgNotice, setSavedOrgNotice] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);
  const [exportedNotice, setExportedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempOrg.trim()) return;
    playTactileSound('click', preferences.soundEffects);
    setSavedOrgNotice(true);
    updateOrganizationName(tempOrg.trim());
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    playTactileSound('click', preferences.soundEffects);
    onUpdateProfile(tempName.trim());
    setSavedNameNotice(true);
    setTimeout(() => setSavedNameNotice(false), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all conversation history? This cannot be undone.')) {
      playTactileSound('click', preferences.soundEffects);
      onClearAllChats();
      setClearedNotice(true);
      setTimeout(() => setClearedNotice(false), 2000);
    }
  };

  const handleExportData = () => {
    playTactileSound('click', preferences.soundEffects);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${SITE_CONFIG.organizationName.toLowerCase()}_dialogues_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExportedNotice(true);
    setTimeout(() => setExportedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
      />

      {/* Modal Dialog Chassis — Dynamic Theme Surface */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl rounded-3xl backdrop-blur-3xl overflow-hidden text-white transition-all duration-300"
        style={{
          background: 'var(--theme-surface-elevated)',
          border: '1px solid var(--theme-border-ambient)',
          boxShadow: '0 30px 90px var(--theme-shadow-ambient), inset 0 1px 1px var(--theme-border-specular)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: 'var(--theme-accent-primary)' }}
            />
            <h3 className="text-sm font-semibold tracking-wide text-white">
              System Preferences & Diagnostics
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              playTactileSound('click', preferences.soundEffects);
              onClose();
            }}
            className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/[0.06] bg-black/20 text-xs overflow-x-auto">
          {[
            { id: 'appearance', label: 'Theme & Palette', icon: Palette },
            { id: 'motion', label: 'Motion & Physics', icon: Activity },
            { id: 'glass', label: 'Optics & Font', icon: Eye },
            { id: 'language', label: 'Languages (10 Indian)', icon: Languages },
            { id: 'api', label: 'From My API', icon: Cpu },
            { id: 'profile', label: 'Profile & Data', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playTactileSound('click', preferences.soundEffects);
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-white'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
                style={
                  isActive
                    ? {
                        borderBottomColor: 'var(--theme-accent-primary)',
                        backgroundColor: 'var(--theme-accent-soft-glow)',
                        color: 'var(--theme-text-primary)',
                      }
                    : undefined
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {/* TAB 1: Theme & Palette */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-1">
                  Atmospheric Color Matrix
                </h4>
                <p className="text-xs text-white/50">
                  Switch the ambient light field and optical refraction palette. Updates instantly in real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(THEME_PALETTES).map((t) => {
                  const isSelected = preferences.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        playTactileSound('click', preferences.soundEffects);
                        onUpdatePreferences({ theme: t.id });
                      }}
                      className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'shadow-lg'
                          : 'hover:bg-white/[0.05]'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: 'var(--theme-accent-soft-glow)',
                              borderColor: 'var(--theme-border-focus)',
                              boxShadow: '0 0 20px var(--theme-accent-glow), inset 0 1px 1px var(--theme-border-specular)',
                            }
                          : {
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              borderColor: 'var(--theme-border-ambient)',
                            }
                      }
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                            style={{ backgroundColor: t.swatches.accent }}
                          />
                          <span className="text-xs font-semibold text-white">{t.name}</span>
                        </div>
                        {isSelected && (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: 'var(--theme-accent-primary)', color: 'var(--theme-canvas-bg)' }}
                          >
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-white/40 mb-1.5 font-mono">
                        {t.tagline}
                      </div>

                      <span className="text-[11px] text-white/60 leading-relaxed mb-3">
                        {t.description}
                      </span>

                      {/* Mini Swatches Bar */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.06]">
                        <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest mr-1">Tones</span>
                        <span
                          className="w-3.5 h-3.5 rounded border border-white/20"
                          style={{ backgroundColor: t.swatches.canvas }}
                          title="Canvas Void"
                        />
                        <span
                          className="w-3.5 h-3.5 rounded border border-white/20"
                          style={{ backgroundColor: t.swatches.surface }}
                          title="Glass Surface"
                        />
                        <span
                          className="w-3.5 h-3.5 rounded border border-white/20"
                          style={{ backgroundColor: t.swatches.accent }}
                          title="Primary Accent"
                        />
                        <span
                          className="w-3.5 h-3.5 rounded border border-white/20"
                          style={{ backgroundColor: t.swatches.specular }}
                          title="Specular Reflection"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sound Effects Audio Toggle */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white flex items-center gap-2">
                    {preferences.soundEffects ? <Volume2 className="w-3.5 h-3.5 text-amber-300" /> : <VolumeX className="w-3.5 h-3.5 text-white/40" />}
                    <span>Tactile Optical Sound Effects</span>
                  </div>
                  <div className="text-[11px] text-white/45">
                    Subtle synthetic Web Audio tones on message dispatch and button clicks
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.soundEffects}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    playTactileSound('toggle', checked);
                    onUpdatePreferences({ soundEffects: checked });
                  }}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Motion & Physics */}
          {activeTab === 'motion' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-1">
                  Kinetic Dynamics & Animation Curves
                </h4>
                <p className="text-xs text-white/50">
                  Configure transition durations, letter zoom speed, and streaming pacing.
                </p>
              </div>

              <div className="space-y-2">
                {(
                  [
                    { id: 'cinematic', label: 'Cinematic Smooth (Recommended)', desc: 'Apple-inspired spring physics, fluid easing, full letter plunge zoom' },
                    { id: 'snappy', label: 'Snappy Minimalist', desc: 'Rapid 14ms response streaming and instant view switches' },
                    { id: 'reduced', label: 'Reduced Motion (Accessibility)', desc: 'Zero parallax or tilt effects, instantaneous screen fades' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      playTactileSound('click', preferences.soundEffects);
                      onUpdatePreferences({ motionSpeed: m.id as MotionSpeed });
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      preferences.motionSpeed === m.id
                        ? 'border-amber-400/80 bg-white/[0.08]'
                        : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium text-white">{m.label}</div>
                      <div className="text-[11px] text-white/45">{m.desc}</div>
                    </div>
                    {preferences.motionSpeed === m.id && (
                      <Check className="w-3.5 h-3.5 text-amber-300 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>

              {/* 3D Tilt toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <div>
                  <div className="text-xs font-medium text-white">3D Dynamic Tilt on Typing Box</div>
                  <div className="text-[11px] text-white/45">Physical perspective tilt responding to mouse hover over the glass dock</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enable3dTilt}
                  onChange={(e) => {
                    playTactileSound('toggle', preferences.soundEffects);
                    onUpdatePreferences({ enable3dTilt: e.target.checked });
                  }}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Optics & Font Scale */}
          {activeTab === 'glass' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-1">
                  Liquid Glass & Typography Calibration
                </h4>
                <p className="text-xs text-white/50">
                  Control backdrop blur density and reading font size.
                </p>
              </div>

              {/* Glass intensity */}
              <div>
                <label className="text-xs font-medium text-white/80 block mb-2">
                  Glass Blur & Dispersion Density
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['subtle', 'balanced', 'deep'] as const).map((intensity) => (
                    <button
                      key={intensity}
                      type="button"
                      onClick={() => {
                        playTactileSound('click', preferences.soundEffects);
                        onUpdatePreferences({ glassIntensity: intensity as GlassIntensity });
                      }}
                      className={`py-2 px-3 text-xs capitalize rounded-xl border transition-colors cursor-pointer ${
                        preferences.glassIntensity === intensity
                          ? 'border-amber-400 bg-white/[0.1] text-white font-medium'
                          : 'border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white'
                      }`}
                    >
                      {intensity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-xs font-medium text-white/80 block mb-2 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-amber-300" />
                  <span>Dialogue Typography Scale</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'sm', label: 'Compact (13px)' },
                      { id: 'base', label: 'Standard (15px)' },
                      { id: 'lg', label: 'Generous (17px)' },
                    ] as const
                  ).map((scale) => (
                    <button
                      key={scale.id}
                      type="button"
                      onClick={() => {
                        playTactileSound('click', preferences.soundEffects);
                        onUpdatePreferences({ fontSize: scale.id as FontSize });
                      }}
                      className={`py-2 px-3 text-xs rounded-xl border transition-colors cursor-pointer ${
                        preferences.fontSize === scale.id
                          ? 'border-amber-400 bg-white/[0.1] text-white font-medium'
                          : 'border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white'
                      }`}
                    >
                      {scale.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Particles toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <div>
                  <div className="text-xs font-medium text-white">Atmospheric Micro-Particles</div>
                  <div className="text-[11px] text-white/45">Tiny ambient dust particles that gently float in the 3D space</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enableParticles}
                  onChange={(e) => {
                    playTactileSound('toggle', preferences.soundEffects);
                    onUpdatePreferences({ enableParticles: e.target.checked });
                  }}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB: Languages (10 Indian Languages + English) */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-amber-400" />
                    <span>Indian Languages · भारतीय भाषाएं</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-semibold">
                    10 Official Indian Languages
                  </span>
                </div>
                <p className="text-xs text-white/50">
                  Select your preferred language. The Aetheria cognitive model will calibrate its thinking and respond fluently in your chosen language and native script.
                </p>
              </div>

              {/* Language Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {INDIAN_LANGUAGES.map((lang) => {
                  const isSelected = (preferences.language || 'en') === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        playTactileSound('click', preferences.soundEffects);
                        onUpdatePreferences({ language: lang.code });
                      }}
                      className={`group p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400/60 bg-amber-400/[0.08] shadow-[0_4px_16px_rgba(245,158,11,0.15)]'
                          : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-bold text-white tracking-wide font-sans flex items-center gap-2">
                            <span>{lang.nativeName}</span>
                            {lang.code === 'en' && (
                              <span className="text-[10px] font-mono text-white/40 font-normal">
                                (Universal)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-medium text-amber-300/80 mt-0.5">
                            {lang.name} · <span className="text-white/40 font-mono">{lang.script}</span>
                          </div>
                        </div>

                        {isSelected ? (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                            style={{
                              backgroundColor: 'var(--theme-accent-primary)',
                              color: 'var(--theme-btn-primary-text)',
                            }}
                          >
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-white/20 group-hover:border-white/40 shrink-0" />
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-white/40 font-mono">
                        <span className="truncate max-w-[200px]">{lang.region}</span>
                        {isSelected && (
                          <span className="text-emerald-400 font-semibold uppercase">Active</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sample greeting preview banner */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-white/70 leading-relaxed">
                  <span className="font-semibold text-white">Sample Dialogue Greeting: </span>
                  &ldquo;{getLanguageItem(preferences.language).sampleGreeting}&rdquo;
                </div>
              </div>
            </div>
          )}

          {/* TAB: From My API */}
          {activeTab === 'api' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-amber-300" />
                    <span>From My API · Inference & Intelligence Engine</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                    Free / Non-Paid Tier Active
                  </span>
                </div>
                <p className="text-xs text-white/50">
                  Select your active AI API engine. Standard and free-tier models are enabled; paid-tier models are excluded per your configuration.
                </p>
              </div>

              {/* Free Models Group */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-white/40 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Available APIs (Free / Standard Tier)</span>
                </div>

                {/* Gemini Flash (Latest) */}
                <button
                  type="button"
                  onClick={() => {
                    playTactileSound('click', preferences.soundEffects);
                    onUpdatePreferences({ activeApi: 'gemini-flash-latest' });
                  }}
                  className={`w-full flex items-start justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    (preferences.activeApi ?? 'gemini-flash-latest') === 'gemini-flash-latest'
                      ? 'border-amber-400/80 bg-white/[0.08] shadow-[0_0_24px_rgba(245,158,11,0.12)]'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Google Gemini Flash (Latest)</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-medium">
                        Active · Sub-Second Fast
                      </span>
                    </div>
                    <div className="text-[11px] text-white/50 leading-relaxed">
                      Highest availability free-tier model with real-time SSE token streaming (~1s latency). Immune to high-demand stalls.
                    </div>
                    <div className="text-[10px] font-mono text-white/35">
                      Model ID: gemini-flash-latest · Zero Cost Free Quota
                    </div>
                  </div>
                  {(preferences.activeApi ?? 'gemini-flash-latest') === 'gemini-flash-latest' && (
                    <Check className="w-4 h-4 text-amber-300 shrink-0 ml-3 mt-0.5" />
                  )}
                </button>

                {/* Gemini 3.8 Flash */}
                <button
                  type="button"
                  onClick={() => {
                    playTactileSound('click', preferences.soundEffects);
                    onUpdatePreferences({ activeApi: 'gemini-3.8-flash' });
                  }}
                  className={`w-full flex items-start justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    preferences.activeApi === 'gemini-3.8-flash'
                      ? 'border-amber-400/80 bg-white/[0.08] shadow-[0_0_24px_rgba(245,158,11,0.12)]'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Google Gemini 3.8 Flash</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-medium">
                        Free Tier · Recommended
                      </span>
                    </div>
                    <div className="text-[11px] text-white/50 leading-relaxed">
                      Standard intelligent cloud synthesis via @google/genai SDK. High-capacity reasoning, quick latency, zero billing costs.
                    </div>
                    <div className="text-[10px] font-mono text-white/35">
                      Model ID: gemini-3.8-flash · Server Proxy (/api/chat)
                    </div>
                  </div>
                  {(preferences.activeApi ?? 'gemini-3.8-flash') === 'gemini-3.8-flash' && (
                    <Check className="w-4 h-4 text-amber-300 shrink-0 ml-3 mt-0.5" />
                  )}
                </button>

                {/* Gemini 3.1 Flash-Lite */}
                <button
                  type="button"
                  onClick={() => {
                    playTactileSound('click', preferences.soundEffects);
                    onUpdatePreferences({ activeApi: 'gemini-3.1-flash-lite' });
                  }}
                  className={`w-full flex items-start justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    preferences.activeApi === 'gemini-3.1-flash-lite'
                      ? 'border-amber-400/80 bg-white/[0.08] shadow-[0_0_24px_rgba(245,158,11,0.12)]'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Google Gemini 3.1 Flash-Lite</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono font-medium">
                        Free Tier · Ultra Fast
                      </span>
                    </div>
                    <div className="text-[11px] text-white/50 leading-relaxed">
                      Optimized for rapid response streaming, brief synthesis, and high throughput without cost.
                    </div>
                    <div className="text-[10px] font-mono text-white/35">
                      Model ID: gemini-3.1-flash-lite · Telemetry header aistudio-build
                    </div>
                  </div>
                  {preferences.activeApi === 'gemini-3.1-flash-lite' && (
                    <Check className="w-4 h-4 text-amber-300 shrink-0 ml-3 mt-0.5" />
                  )}
                </button>

                {/* Aetheria Local Engine */}
                <button
                  type="button"
                  onClick={() => {
                    playTactileSound('click', preferences.soundEffects);
                    onUpdatePreferences({ activeApi: 'aetheria-local' });
                  }}
                  className={`w-full flex items-start justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    preferences.activeApi === 'aetheria-local'
                      ? 'border-amber-400/80 bg-white/[0.08] shadow-[0_0_24px_rgba(245,158,11,0.12)]'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Aetheria Cognitive Core (Local Engine)</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-medium">
                        Offline Fallback
                      </span>
                    </div>
                    <div className="text-[11px] text-white/50 leading-relaxed">
                      Deterministic in-memory synthesis calibrated for architectural and philosophical analysis with zero network requests.
                    </div>
                  </div>
                  {preferences.activeApi === 'aetheria-local' && (
                    <Check className="w-4 h-4 text-amber-300 shrink-0 ml-3 mt-0.5" />
                  )}
                </button>
              </div>

              {/* Excluded Paid Tier Section */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-white/40 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-neutral-400">
                    <Lock className="w-3 h-3" />
                    <span>Excluded Paid APIs (Billing Excluded)</span>
                  </span>
                  <span className="text-[10px] text-amber-400/70">Excluded per prompt instruction</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.015] border border-white/[0.06] opacity-60 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white/70 line-through">Gemini 4 Argon / Gemini 3 Pro</span>
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px] font-mono">
                        Paid Key Required · Disabled
                      </span>
                    </div>
                    <div className="text-[11px] text-white/40">
                      Paid tier model flow disabled as requested ("Take any except the paid one"). Only 100% free/standard quota is utilized.
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-white/30 shrink-0 ml-3 mt-0.5" />
                </div>
              </div>

              {/* Security & Endpoint Architecture Status */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/50 space-y-1">
                <div className="flex items-center justify-between text-white/80 font-mono text-[10px]">
                  <span>PROXY ARCHITECTURE</span>
                  <span className="text-emerald-400">SERVER-SIDE SECURE</span>
                </div>
                <p>
                  Requests route through <code className="text-amber-200">/api/chat</code> on Express backend. API keys stay securely on the server; browser never touches credentials.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: Profile & Data */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-1">
                  Session Profile & Export
                </h4>
                <p className="text-xs text-white/50">
                  Manage your display identity and download or purge conversation records.
                </p>
              </div>

              <form onSubmit={handleSaveName} className="space-y-2">
                <label className="text-xs font-medium text-white/80 block">
                  Display Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/[0.05] border border-white/[0.12] text-white focus:border-amber-400 outline-none"
                    placeholder="Enter your name"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-medium rounded-xl bg-white/[0.1] hover:bg-white/[0.2] border border-white/[0.15] text-white transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
                {savedNameNotice && (
                  <span className="text-[11px] text-emerald-400">Name updated successfully.</span>
                )}
              </form>

              {/* Organization & Project Branding */}
              <form onSubmit={handleSaveOrg} className="space-y-2 pt-2">
                <label className="text-xs font-medium text-white/80 block">
                  Organization & Project Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempOrg}
                    onChange={(e) => setTempOrg(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/[0.05] border border-white/[0.12] text-white focus:border-amber-400 outline-none uppercase font-semibold tracking-wider font-mono"
                    placeholder="e.g. AETHERIA"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-medium rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold transition-colors cursor-pointer shadow-sm"
                  >
                    Update Org
                  </button>
                </div>
                {savedOrgNotice && (
                  <span className="text-[11px] text-emerald-400">Organization name updated.</span>
                )}
              </form>

              {/* Firebase Cloud Sync Section */}
              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                      {SITE_CONFIG.organizationName} Cloud Vault
                    </h4>
                    <p className="text-[11px] text-white/50">
                      Sync dialogues and preferences to {SITE_CONFIG.organizationName} Cloud Database
                    </p>
                  </div>
                  {firebaseUser ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/50 text-[11px] font-mono">
                      Offline Mode
                    </span>
                  )}
                </div>

                {firebaseUser ? (
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">{firebaseUser.email || 'Authenticated User'}</div>
                      <div className="text-[10px] text-white/40 font-mono">UID: {firebaseUser.uid?.slice(0, 16)}...</div>
                    </div>
                    {onSignOutFirebase && (
                      <button
                        type="button"
                        onClick={onSignOutFirebase}
                        className="px-3 py-1 text-xs rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-white/80 hover:text-white transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                ) : (
                  onSignInGoogle && (
                    <button
                      type="button"
                      onClick={onSignInGoogle}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600/30 to-amber-700/30 hover:from-amber-600/50 hover:to-amber-700/50 border border-amber-500/40 text-amber-200 text-xs font-medium transition-all cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Connect to {SITE_CONFIG.organizationName} Cloud</span>
                    </button>
                  )
                )}
              </div>

              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                  Data Portability & Reset
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-red-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playTactileSound('click', preferences.soundEffects);
                      onClose();
                      onResetSession();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white/80 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restart Flow</span>
                  </button>
                </div>

                {exportedNotice && (
                  <span className="text-[11px] text-emerald-400 block">Conversation archive exported successfully.</span>
                )}
                {clearedNotice && (
                  <span className="text-[11px] text-red-300 block">All chat history cleared.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/[0.08] bg-black/40 text-xs text-white/40">
          <span>{SITE_CONFIG.organizationName} Engine · v{SITE_CONFIG.version}</span>
          <button
            type="button"
            onClick={() => {
              playTactileSound('click', preferences.soundEffects);
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-medium text-white bg-white/[0.1] hover:bg-white/[0.18] rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
