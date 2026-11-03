import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Code2,
  Eye,
  FileText,
  Copy,
  Check,
  Download,
  Terminal,
  Maximize2,
  Minimize2,
  Layers,
} from 'lucide-react';
import { playTactileSound } from '../utils/audio';

export interface ArtifactData {
  id: string;
  title: string;
  language: string;
  content: string;
  type: 'code' | 'document' | 'architecture';
}

interface ArtifactsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: ArtifactData | null;
  soundEnabled: boolean;
}

export const ArtifactsDrawer: React.FC<ArtifactsDrawerProps> = ({
  isOpen,
  onClose,
  artifact,
  soundEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('code');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen || !artifact) return null;

  const handleCopy = () => {
    playTactileSound('click', soundEnabled);
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    playTactileSound('receive', soundEnabled);
    const ext =
      artifact.language === 'typescript' || artifact.language === 'ts'
        ? 'ts'
        : artifact.language === 'javascript' || artifact.language === 'js'
        ? 'js'
        : artifact.language === 'html'
        ? 'html'
        : artifact.language === 'json'
        ? 'json'
        : artifact.language === 'python'
        ? 'py'
        : 'md';

    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isHtmlOrSvg =
    artifact.language === 'html' ||
    artifact.language === 'svg' ||
    artifact.content.includes('<svg') ||
    artifact.content.includes('<!DOCTYPE html>') ||
    artifact.content.includes('<div');

  const wordCount = artifact.content.trim().split(/\s+/).length;
  const lineCount = artifact.content.split('\n').length;

  return (
    <AnimatePresence>
      {/* Mobile/Tablet Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden cursor-pointer"
      />

      <motion.aside
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col backdrop-blur-3xl border-l shadow-2xl transition-all duration-300 ${
          isExpanded ? 'w-full md:w-[85vw]' : 'w-full md:w-[540px] xl:w-[620px]'
        }`}
        style={{
          background: 'var(--theme-surface-modal, rgba(12, 8, 5, 0.96))',
          borderColor: 'var(--theme-border-ambient, rgba(255,255,255,0.12))',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.85), inset 1px 0 1px rgba(255,255,255,0.15)',
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'var(--theme-accent-soft-glow)',
                color: 'var(--theme-accent-primary)',
                border: '1px solid var(--theme-border-ambient)',
              }}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-white truncate">{artifact.title}</h3>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                <span className="uppercase">{artifact.language}</span>
                <span>·</span>
                <span>{lineCount} lines</span>
                <span>·</span>
                <span>{wordCount} words</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Switcher if HTML/SVG */}
            {isHtmlOrSvg && (
              <div className="flex items-center p-0.5 rounded-lg bg-white/[0.06] border border-white/[0.06] text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    playTactileSound('click', soundEnabled);
                    setActiveTab('code');
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                    activeTab === 'code' ? 'bg-white/[0.12] text-white font-medium' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  <span>Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTactileSound('click', soundEnabled);
                    setActiveTab('preview');
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                    activeTab === 'preview' ? 'bg-white/[0.12] text-white font-medium' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>
              </div>
            )}

            {/* Expand / Minimize */}
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', soundEnabled);
                setIsExpanded(!isExpanded);
              }}
              title={isExpanded ? 'Collapse Drawer' : 'Expand Fullscreen'}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', soundEnabled);
                onClose();
              }}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {activeTab === 'preview' && isHtmlOrSvg ? (
            <div className="flex-1 w-full h-full bg-white p-4 overflow-auto">
              <iframe
                title="Artifact Live Preview"
                srcDoc={artifact.content}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4 bg-[#070503] font-mono text-[13px] text-neutral-200 select-text leading-relaxed">
              <pre className="whitespace-pre-wrap">
                <code>{artifact.content}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Action Bottom Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.08] bg-white/[0.02] text-xs">
          <span className="text-[11px] font-mono text-white/40">Cognitive Artifact Engine</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-black font-medium transition-transform cursor-pointer active:scale-95"
              style={{
                background: 'var(--theme-btn-primary-bg)',
                color: 'var(--theme-btn-primary-text)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
