import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Upload, RefreshCw, X, AlertCircle, Plus, Calendar, BookOpen } from 'lucide-react';
import { importExamsApi } from '../../services/cremaApi';

interface ExamItem {
  id: string;
  title: string;
  date: string;
  syllabus: string;
  source?: string;
}

interface ExamsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExamsModal: React.FC<ExamsModalProps> = ({ isOpen, onClose }) => {
  const [exams, setExams] = useState<ExamItem[]>(() => {
    try {
      const saved = localStorage.getItem('crema_tracked_exams');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvText, setCsvText] = useState('');
  const [showCsvInput, setShowCsvInput] = useState(false);

  // Manual add form
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newSyllabus, setNewSyllabus] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('crema_tracked_exams', JSON.stringify(exams));
    } catch {
      // storage unavailable
    }
  }, [exams]);

  if (!isOpen) return null;

  const handleSyncGoogleForms = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await importExamsApi();
      if (res.available && res.exams?.length > 0) {
        setExams((prev) => [...prev, ...res.exams]);
        setMessage(`Successfully imported ${res.exams.length} exams from Google Forms responses.`);
      } else {
        setMessage(res.message || 'Google Forms sync is not configured. You can paste CSV data directly.');
        setShowCsvInput(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync exams.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await importExamsApi(csvText.trim());
      if (res.exams?.length > 0) {
        setExams((prev) => [...prev, ...res.exams]);
        setMessage(`Imported ${res.exams.length} exams from CSV.`);
        setCsvText('');
        setShowCsvInput(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newExam: ExamItem = {
      id: `exam_${Date.now()}`,
      title: newTitle.trim(),
      date: newDate || 'Upcoming',
      syllabus: newSyllabus.trim() || 'General Topics',
      source: 'Manual Entry',
    };
    setExams((prev) => [...prev, newExam]);
    setNewTitle('');
    setNewDate('');
    setNewSyllabus('');
  };

  const handleDelete = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
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
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-100">Exam Tracker & Google Forms Sync</h2>
              <p className="text-xs text-stone-400">Track test dates, syllabus portions, and import from Forms CSV</p>
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

          {message && (
            <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-xl text-amber-300 text-xs">
              {message}
            </div>
          )}

          {/* Sync & Action bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-stone-900/60 border border-stone-800 rounded-xl">
            <span className="text-xs text-stone-300">
              {exams.length} {exams.length === 1 ? 'Exam' : 'Exams'} Tracked
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncGoogleForms}
                disabled={isLoading}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Sync Google Forms
              </button>
              <button
                type="button"
                onClick={() => setShowCsvInput(!showCsvInput)}
                className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Paste CSV
              </button>
            </div>
          </div>

          {/* Paste CSV Box */}
          {showCsvInput && (
            <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl space-y-3">
              <label className="block text-xs font-semibold uppercase text-stone-400">
                Paste CSV Rows (Course, Date, Syllabus)
              </label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Course,Date,Syllabus&#10;Calculus 2,2026-11-20,Integration Techniques, Series&#10;Organic Chemistry,2026-12-05,Reactions Mechanisms"
                rows={4}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleImportCsv}
                disabled={isLoading || !csvText.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg"
              >
                Parse & Add Exams
              </button>
            </div>
          )}

          {/* Manual Add Form */}
          <form onSubmit={handleAddManual} className="p-4 bg-stone-900/40 border border-stone-800/80 rounded-xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
              Quick Add Exam
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Exam Title / Course"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-stone-200 text-xs focus:outline-none focus:border-amber-500"
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-stone-200 text-xs focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                placeholder="Syllabus / Chapters"
                value={newSyllabus}
                onChange={(e) => setNewSyllabus(e.target.value)}
                className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-stone-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Exam
            </button>
          </form>

          {/* Exam List */}
          <div className="space-y-3">
            {exams.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-sm">
                No exams tracked yet. Click "Sync Google Forms" or use the quick add form above.
              </div>
            ) : (
              exams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 bg-stone-900/70 border border-stone-800 rounded-xl flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-stone-100">{exam.title}</h4>
                      {exam.source && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-400">
                          {exam.source}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Date: {exam.date}
                    </p>
                    <p className="text-xs text-stone-300 flex items-start gap-1.5 mt-1">
                      <BookOpen className="w-3.5 h-3.5 text-stone-500 mt-0.5 shrink-0" />
                      <span>{exam.syllabus}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-800 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
