import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, Sparkles, RefreshCw, Trophy, HelpCircle, X } from 'lucide-react';
import { generateQuizApi, gradeQuizApi } from '../../services/cremaApi';

interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_in_the_blank' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  topic: string;
  questions: QuizQuestion[];
}

interface QuizGradeResult {
  score: number;
  total: number;
  percentage: number;
  feedback: string;
  questionReviews: Array<{
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
  }>;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'multiple_choice',
    'true_false',
    'fill_in_the_blank',
    'short_answer',
  ]);
  const [contextText, setContextText] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [gradeResult, setGradeResult] = useState<QuizGradeResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  if (!isOpen) return null;

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter((x) => x !== t) : prev) : [...prev, t]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a quiz topic or subject.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setGradeResult(null);
    setUserAnswers({});

    try {
      const generated = await generateQuizApi({
        topic: topic.trim(),
        questionCount,
        difficulty,
        questionTypes: selectedTypes,
        contextText: contextText.trim() || undefined,
      });
      setQuiz(generated);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrade = async () => {
    if (!quiz) return;
    setIsGrading(true);
    setError(null);
    try {
      const result = await gradeQuizApi({
        quiz,
        userAnswers,
      });
      setGradeResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to grade quiz.');
    } finally {
      setIsGrading(false);
    }
  };

  const handleReset = () => {
    setQuiz(null);
    setGradeResult(null);
    setUserAnswers({});
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
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-100">Crema Quiz Master</h2>
              <p className="text-xs text-stone-400">Interactive practice quizzes with instant grading & feedback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p>{error}</p>
                {retryAfter && <p className="text-xs mt-1 text-red-300">Cooldown: {retryAfter}s remaining.</p>}
              </div>
              <button
                onClick={handleGenerate}
                className="px-3 py-1 bg-red-800 hover:bg-red-700 text-xs font-medium rounded-lg text-white"
              >
                Retry
              </button>
            </div>
          )}

          {!quiz ? (
            /* Quiz Generator Configuration Form */
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Topic or Subject
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Krebs Cycle, Linear Algebra Eigenvalues, The French Revolution..."
                  className="w-full px-4 py-3 bg-stone-900/80 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/50 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-900/80 border border-stone-800 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="beginner">Beginner / Fundamentals</option>
                    <option value="intermediate">Intermediate / Standard</option>
                    <option value="advanced">Advanced / AP / University</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Question Count: {questionCount}
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Question Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'multiple_choice', label: 'Multiple Choice' },
                    { id: 'true_false', label: 'True / False' },
                    { id: 'fill_in_the_blank', label: 'Fill in the Blank' },
                    { id: 'short_answer', label: 'Short Answer' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleType(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedTypes.includes(t.id)
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Optional Study Notes / Context
                </label>
                <textarea
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Paste textbook notes, syllabus, or lecture transcript to generate questions directly from your material..."
                  rows={4}
                  className="w-full px-4 py-3 bg-stone-900/80 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/50 text-sm"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-xl text-sm shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Quiz with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Practice Quiz
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Interactive Quiz Taking & Review UI */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Quiz Active</span>
                  <h3 className="text-lg font-bold text-stone-100">{quiz.topic}</h3>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-lg text-xs text-stone-300 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  New Quiz
                </button>
              </div>

              {gradeResult && (
                <div className="p-5 bg-gradient-to-br from-amber-950/40 to-stone-900/60 border border-amber-600/30 rounded-2xl flex items-center gap-5">
                  <div className="p-4 rounded-xl bg-amber-500/20 text-amber-400">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">
                      Score: {gradeResult.score} / {gradeResult.total} ({gradeResult.percentage}%)
                    </h4>
                    <p className="text-sm text-stone-300 mt-1">{gradeResult.feedback}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {quiz.questions.map((q, index) => {
                  const review = gradeResult?.questionReviews.find((r) => r.questionId === q.id);
                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        review
                          ? review.isCorrect
                            ? 'bg-emerald-950/20 border-emerald-800/40'
                            : 'bg-rose-950/20 border-rose-800/40'
                          : 'bg-stone-900/50 border-stone-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-400">
                          Q{index + 1} &bull; {q.type.replace(/_/g, ' ')}
                        </span>
                        {review && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            {review.isCorrect ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Correct
                              </span>
                            ) : (
                              <span className="text-rose-400 flex items-center gap-1">
                                <XCircle className="w-4 h-4" /> Needs Review
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-stone-100 font-medium text-sm mb-4">{q.question}</p>

                      {/* Multiple choice or true/false options */}
                      {(q.type === 'multiple_choice' || q.type === 'true_false') && q.options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = userAnswers[q.id] === opt;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={Boolean(gradeResult)}
                                onClick={() => setUserAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                                className={`px-4 py-2.5 rounded-xl text-left text-xs transition-all border ${
                                  isSelected
                                    ? 'bg-amber-600/20 border-amber-500 text-amber-200'
                                    : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:bg-stone-800/80'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Fill in the blank or short answer */}
                      {(q.type === 'fill_in_the_blank' || q.type === 'short_answer') && (
                        <div>
                          <input
                            type="text"
                            disabled={Boolean(gradeResult)}
                            value={userAnswers[q.id] || ''}
                            onChange={(e) =>
                              setUserAnswers((prev) => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))
                            }
                            placeholder="Type your answer here..."
                            className="w-full px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      )}

                      {review && (
                        <div className="mt-4 pt-3 border-t border-stone-800/80 text-xs text-stone-300 space-y-1">
                          <p>
                            <strong className="text-amber-400">Correct Answer:</strong> {review.correctAnswer}
                          </p>
                          <p>
                            <strong className="text-stone-400">Explanation:</strong> {review.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!gradeResult && (
                <button
                  onClick={handleGrade}
                  disabled={isGrading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isGrading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Grading Quiz Answers...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Submit & Grade Quiz
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
