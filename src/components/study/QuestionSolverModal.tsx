import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Upload, Sparkles, RefreshCw, X, AlertCircle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { solveQuestionApi } from '../../services/cremaApi';

interface QuestionSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuestionSolverModal: React.FC<QuestionSolverModalProps> = ({ isOpen, onClose }) => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solutionResult, setSolutionResult] = useState<{
    isQuestion: boolean;
    isBlurry?: boolean;
    clarification?: string;
    message?: string;
    questionText?: string;
    stepByStep?: string[];
    finalAnswer?: string;
    tips?: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError('Photo exceeds 25 MB size limit.');
      return;
    }

    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setImageBase64(result.split(',')[1] || result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSolve = async () => {
    if (!imageBase64) {
      setError('Please upload or snap a photo of the question first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const solution = await solveQuestionApi({
        imageBase64,
        mimeType,
        additionalNotes: notes.trim() || undefined,
      });
      setSolutionResult(solution);
    } catch (err: any) {
      setError(err.message || 'Failed to solve question from photo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImageBase64(null);
    setPreviewUrl(null);
    setSolutionResult(null);
    setError(null);
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
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-100">Photo Question Solver</h2>
              <p className="text-xs text-stone-400">Snap a problem for instant step-by-step breakdown & final answer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <p className="flex-1">{error}</p>
            </div>
          )}

          {!solutionResult ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Upload Problem Photo or Screenshot
                </label>
                <div className="border-2 border-dashed border-stone-800 hover:border-amber-500/50 rounded-2xl p-6 text-center transition-all bg-stone-900/40">
                  <input
                    type="file"
                    id="photoUpload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="photoUpload" className="cursor-pointer flex flex-col items-center gap-2">
                    {previewUrl ? (
                      <div className="max-h-48 overflow-hidden rounded-xl border border-stone-700">
                        <img src={previewUrl} alt="Problem Preview" className="max-h-48 object-contain" />
                      </div>
                    ) : (
                      <>
                        <div className="p-3 rounded-full bg-stone-800 text-amber-400">
                          <Camera className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-stone-200">
                          Click to select or capture problem photo
                        </span>
                        <span className="text-xs text-stone-500">Supports Math, Physics, Chemistry, Code & Diagrams</span>
                      </>
                    )}
                  </label>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-3 text-xs text-stone-400 hover:text-stone-200 underline"
                    >
                      Choose another photo
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Additional Context or Specific Sub-part (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Only solve part (b), or explain without calculus..."
                  className="w-full px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={handleSolve}
                disabled={isLoading || !imageBase64}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing & Solving Question with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Solve Question
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <h3 className="text-lg font-bold text-stone-100">Solution Analysis</h3>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-lg text-xs text-stone-300 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Solve Another Photo
                </button>
              </div>

              {/* Case 1: Non-question image */}
              {!solutionResult.isQuestion && (
                <div className="p-5 bg-amber-950/30 border border-amber-800/40 rounded-2xl flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-stone-100">No Problem Detected</h4>
                    <p className="text-sm text-stone-300 mt-1">
                      {solutionResult.message || 'Please upload a photo of a homework problem, quiz, or exam question.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Case 2: Blurry notice */}
              {solutionResult.isBlurry && (
                <div className="p-4 bg-yellow-950/30 border border-yellow-800/40 rounded-xl text-yellow-300 text-xs">
                  <strong>Notice:</strong> {solutionResult.clarification || 'The photo appeared blurry, but was reconstructed.'}
                </div>
              )}

              {/* Case 3: Question Solved */}
              {solutionResult.isQuestion && (
                <>
                  {solutionResult.questionText && (
                    <div className="p-4 bg-stone-900/60 border border-stone-800 rounded-xl">
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-1">
                        Detected Problem Statement
                      </span>
                      <p className="text-stone-200 text-sm italic">{solutionResult.questionText}</p>
                    </div>
                  )}

                  {solutionResult.stepByStep && solutionResult.stepByStep.length > 0 && (
                    <div className="p-5 bg-stone-900/60 border border-stone-800 rounded-2xl space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                        Step-by-Step Derivation
                      </h4>
                      <div className="space-y-3">
                        {solutionResult.stepByStep.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm text-stone-200">
                            <span className="w-6 h-6 rounded-lg bg-stone-800 border border-stone-700 text-amber-400 flex items-center justify-center font-mono text-xs shrink-0">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed whitespace-pre-wrap">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {solutionResult.finalAnswer && (
                    <div className="p-5 bg-gradient-to-r from-emerald-950/40 to-stone-900 border border-emerald-800/40 rounded-2xl flex items-start gap-4">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                          Final Answer
                        </span>
                        <p className="text-base font-bold text-stone-100 mt-1">{solutionResult.finalAnswer}</p>
                      </div>
                    </div>
                  )}

                  {solutionResult.tips && solutionResult.tips.length > 0 && (
                    <div className="p-4 bg-stone-900/40 border border-stone-800 rounded-xl">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4" /> Study Tips & Common Pitfalls
                      </h4>
                      <ul className="space-y-1.5">
                        {solutionResult.tips.map((tip, idx) => (
                          <li key={idx} className="text-xs text-stone-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
