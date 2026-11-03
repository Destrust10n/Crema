import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck, Lock, EyeOff, FileText, CheckCircle2 } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'storage' | 'retention' | 'rights'>('overview');

  if (!isOpen) return null;

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

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl rounded-3xl bg-[#140d09]/95 backdrop-blur-2xl border border-white/[0.14] border-t-white/[0.24] shadow-[0_30px_90px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold tracking-wide text-white">
              {SITE_CONFIG.organizationName} Privacy Constitution
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/[0.06] bg-black/20 text-xs overflow-x-auto">
          {[
            { id: 'overview', label: 'Data Philosophy' },
            { id: 'storage', label: 'Local Memory' },
            { id: 'retention', label: 'Zero Training' },
            { id: 'rights', label: 'Your Inviolable Rights' },
          ].map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as typeof activeSection)}
                className={`px-3.5 py-2.5 border-b-2 font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-amber-400 text-white bg-white/[0.04]'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5 text-xs text-white/75 leading-relaxed font-light">
          {activeSection === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white font-medium text-sm">
                <Lock className="w-4 h-4 text-amber-300" />
                <span>The Principle of Ephemeral Intelligence</span>
              </div>
              <p>
                At {SITE_CONFIG.organizationName}, we believe cognitive tools should honor your intellectual sovereignty. Our architecture operates on the bedrock premise that your dialogue, ideas, and keystrokes belong solely to you.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="flex items-center gap-2 font-medium text-white mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>No Cloud Logging</span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Your dialogues are rendered purely in your browser runtime and client memory.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="flex items-center gap-2 font-medium text-white mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Zero Ad Telemetry</span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    No third-party trackers, pixels, cookies, or behavioral surveillance scripts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'storage' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white font-medium text-sm">
                <EyeOff className="w-4 h-4 text-amber-300" />
                <span>Isolated Client-Side Persistence</span>
              </div>
              <p>
                All conversations and settings are stored locally within your device&apos;s browser sandbox using HTML5 LocalStorage.
              </p>
              <ul className="space-y-2 list-disc list-inside text-white/70">
                <li><strong className="text-white">Your Name:</strong> Saved only to personalize greetings on this machine.</li>
                <li><strong className="text-white">Conversation History:</strong> Serialized within your browser. Never transmitted to {SITE_CONFIG.organizationName} servers.</li>
                <li><strong className="text-white">Preferences:</strong> Optical blur, themes, and motion tolerances stored locally.</li>
              </ul>
            </div>
          )}

          {activeSection === 'retention' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white font-medium text-sm">
                <FileText className="w-4 h-4 text-amber-300" />
                <span>Strict Zero-Training Guarantee</span>
              </div>
              <p>
                {SITE_CONFIG.organizationName} guarantees that no portion of your inputs, code snippets, or inquiries will ever be harvested, indexed, or utilized to train general foundation models.
              </p>
              <p className="text-white/60">
                When operating in offline or mock mode, all response generation is completely synthesized client-side without network calls.
              </p>
            </div>
          )}

          {activeSection === 'rights' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white font-medium text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Your Inviolable Control</span>
              </div>
              <p>
                You maintain sovereign ownership of your workspace:
              </p>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <strong className="text-white block mb-0.5">Instant Total Erasure</strong>
                  <span>Use the &quot;Clear All Dialogues&quot; button in Settings to purge all local records instantly.</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <strong className="text-white block mb-0.5">Session Reinitialization</strong>
                  <span>Reset your active session at any point to experience the clean opening screen afresh.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/[0.08] bg-black/40 text-xs text-white/40">
          <span>Effective: 2026 · {SITE_CONFIG.organizationName} Global Trust</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-white/[0.1] hover:bg-white/[0.18] rounded-lg transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </motion.div>
    </div>
  );
};
