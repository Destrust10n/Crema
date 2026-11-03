import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Sparkles, RefreshCw, X, AlertCircle, CheckSquare, Square, Clock } from 'lucide-react';
import { generateStudyPlanApi, rescheduleStudyPlanApi } from '../../services/cremaApi';

interface StudyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudyPlannerModal: React.FC<StudyPlannerModalProps> = ({ isOpen, onClose }) => {
  const [targetExam, setTargetExam] = useState('');
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [focusAreas, setFocusAreas] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [isRescheduling, setIsRescheduling] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!targetExam.trim()) {
      setError('Please provide an exam name or study target.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCompletedTasks([]);

    try {
      const plan = await generateStudyPlanApi({
        targetExam: targetExam.trim(),
        examDate: examDate || undefined,
        hoursPerDay,
        focusAreas: focusAreas.split(',').map((f) => f.trim()).filter(Boolean),
      });
      setCurrentPlan(plan);
    } catch (err: any) {
      setError(err.message || 'Failed to generate study plan.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = (taskStr: string) => {
    setCompletedTasks((prev) =>
      prev.includes(taskStr) ? prev.filter((t) => t !== taskStr) : [...prev, taskStr]
    );
  };

  const handleReschedule = async () => {
    if (!currentPlan) return;
    setIsRescheduling(true);
    setError(null);

    // Identify missed tasks
    const allTasks: string[] = [];
    currentPlan.weeklyPlan.forEach((w: any) => {
      w.dailyTasks.forEach((d: any) => {
        d.tasks.forEach((t: string) => allTasks.push(t));
      });
    });
    const missed = allTasks.filter((t) => !completedTasks.includes(t));

    try {
      const updated = await rescheduleStudyPlanApi({
        currentPlan,
        completedTasks,
        missedTasks: missed,
        remainingDays: Math.max(7, Math.floor(currentPlan.totalDays * 0.7)),
        adjustmentReason: 'Rebalance missed and upcoming tasks',
      });
      setCurrentPlan(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule plan.');
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#141210] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-[#1c1815]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-100">Adaptive Study Planner</h2>
              <p className="text-xs text-stone-400">Generate weekly roadmap and dynamically rebalance missed topics</p>
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

          {!currentPlan ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Target Exam or Subject
                </label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="e.g. MCAT Biology, AP Calculus BC, CFA Level 1, Midterm Exam..."
                  className="w-full px-4 py-3 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Exam Date or Target Horizon
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Daily Study Commitment: {hoursPerDay} hrs/day
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  High-Priority Focus Areas (Comma separated)
                </label>
                <input
                  type="text"
                  value={focusAreas}
                  onChange={(e) => setFocusAreas(e.target.value)}
                  placeholder="e.g. Integration by parts, Organic Synthesis, Macroeconomics equations"
                  className="w-full px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Study Schedule with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Study Schedule
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Schedule Active &bull; {currentPlan.totalDays} Days ({currentPlan.dailyCommitmentHours}h/day)
                  </span>
                  <h3 className="text-xl font-bold text-stone-100">{currentPlan.targetExam}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReschedule}
                    disabled={isRescheduling}
                    className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 rounded-lg text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRescheduling ? 'animate-spin' : ''}`} />
                    Reschedule Missed Tasks
                  </button>
                  <button
                    onClick={() => setCurrentPlan(null)}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-lg text-xs text-stone-300"
                  >
                    New Plan
                  </button>
                </div>
              </div>

              {/* Weekly blocks */}
              <div className="space-y-6">
                {currentPlan.weeklyPlan?.map((week: any, wIdx: number) => (
                  <div key={wIdx} className="p-5 bg-stone-900/50 border border-stone-800 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-amber-300">
                        Week {week.weekNumber}: {week.focus}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {week.dailyTasks?.map((dayObj: any, dIdx: number) => (
                        <div key={dIdx} className="p-3.5 bg-stone-950/60 border border-stone-800/80 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-stone-300">
                            <span>{dayObj.day}</span>
                            <span className="flex items-center gap-1 text-stone-500">
                              <Clock className="w-3 h-3" /> {dayObj.estimatedHours}h
                            </span>
                          </div>
                          <ul className="space-y-1.5">
                            {dayObj.tasks?.map((task: string, tIdx: number) => {
                              const isDone = completedTasks.includes(task);
                              return (
                                <li
                                  key={tIdx}
                                  onClick={() => toggleTask(task)}
                                  className="flex items-start gap-2 text-xs cursor-pointer group select-none"
                                >
                                  {isDone ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-stone-600 group-hover:text-stone-400 mt-0.5 shrink-0" />
                                  )}
                                  <span className={isDone ? 'line-through text-stone-500' : 'text-stone-300'}>
                                    {task}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
