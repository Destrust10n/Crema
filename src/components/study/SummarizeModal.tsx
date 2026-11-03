import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Upload, Sparkles, RefreshCw, X, AlertCircle, BookOpen, Check } from 'lucide-react';
import { summarizeApi } from '../../services/cremaApi';

interface SummarizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SummarizeModal: React.FC<SummarizeModalProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [length, setLength] = useState<'brief' | 'detailed' | 'bullet_points'>('detailed');
  const [focus, setFocus] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<{
    title: string;
    summary: string;
    keyTakeaways: string[];
    glossary?: Array<{ term: string; definition: string }>;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      setFile({
        name: selected.name,
        base64,
        mimeType: selected.type || 'text/plain',
      });
      setError(null);
    };
    reader.readAsDataURL(selected);
  };

  const handleSummarize = async () => {
    if (!content.trim() && !file) {
      setError('Please provide text or upload a document to summarize.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await summarizeApi({
        content: content.trim() || undefined,
        fileData: file || undefined,
        length,
        focus: focus.trim() || undefined,
      });
      setSummaryResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to summarize document.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#141210] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-[#1c1815]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-100">Document & File Summarizer</h2>
              <p className="text-xs text-stone-400">Summarize long PDFs, lecture notes, textbook chapters & Google Drive text</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <p className="flex-1">{error}</p>
            </div>
          )}

          {!summaryResult ? (
            <div className="space-y-5">
              {/* File upload box */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Upload PDF, Text, Markdown or Image (Max 25MB)
                </label>
                <div className="border-2 border-dashed border-stone-800 hover:border-amber-500/50 rounded-2xl p-6 text-center transition-all bg-stone-900/40">
                  <input
                    type="file"
                    id="fileUpload"
                    accept=".pdf,.txt,.md,.csv,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-stone-800 text-amber-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-stone-200">
                      {file ? file.name : 'Click to select or drop study file'}
                    </span>
                    <span className="text-xs text-stone-500">Supports PDF, TXT, MD, CSV, PNG, JPG</span>
                  </label>
                  {file && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-400">
                      <Check className="w-4 h-4" /> Ready for summary ({file.name})
                    </div>
                  )}
                </div>
              </div>

              {/* Paste Text */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Or Paste Study Text Directly
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste article, lecture transcript, or Google Drive notes here..."
                  rows={5}
                  className="w-full px-4 py-3 bg-stone-900/80 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Summary Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="brief">Brief Executive Summary</option>
                    <option value="detailed">Detailed Study Notes</option>
                    <option value="bullet_points">High-Yield Bullet Points Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Specific Focus or Topic (Optional)
                  </label>
                  <input
                    type="text"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder="e.g. Focus on formulas, historical dates..."
                    className="w-full px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSummarize}
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Extracting & Summarizing with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Summary
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <h3 className="text-xl font-bold text-stone-100">{summaryResult.title}</h3>
                <button
                  onClick={() => setSummaryResult(null)}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-lg text-xs text-stone-300 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Summarize Another
                </button>
              </div>

              <div className="p-5 bg-stone-900/60 border border-stone-800 rounded-2xl">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Comprehensive Summary
                </h4>
                <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-wrap">{summaryResult.summary}</p>
              </div>

              {summaryResult.keyTakeaways && summaryResult.keyTakeaways.length > 0 && (
                <div className="p-5 bg-stone-900/60 border border-stone-800 rounded-2xl">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
                    High-Yield Exam Takeaways
                  </h4>
                  <ul className="space-y-2">
                    {summaryResult.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summaryResult.glossary && summaryResult.glossary.length > 0 && (
                <div className="p-5 bg-stone-900/60 border border-stone-800 rounded-2xl">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
                    Terminology Glossary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {summaryResult.glossary.map((item, idx) => (
                      <div key={idx} className="p-3 bg-stone-950/60 border border-stone-800/80 rounded-xl text-xs">
                        <span className="font-bold text-amber-300">{item.term}:</span>{' '}
                        <span className="text-stone-300">{item.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
