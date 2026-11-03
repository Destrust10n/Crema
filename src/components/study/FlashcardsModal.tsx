import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, RotateCcw, ChevronLeft, ChevronRight, Check, X, Plus } from 'lucide-react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered?: boolean;
}

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CARDS: Flashcard[] = [
  {
    id: '1',
    front: 'What is the rate-limiting enzyme of Glycolysis?',
    back: 'Phosphofructokinase-1 (PFK-1), allosterically inhibited by ATP and citrate.',
  },
  {
    id: '2',
    front: 'State the Fundamental Theorem of Calculus (Part 1).',
    back: 'If f is continuous on [a, b], then g(x) = ∫[a, x] f(t) dt is continuous on [a, b], differentiable on (a, b), and g\'(x) = f(x).',
  },
  {
    id: '3',
    front: 'What causes Quantum Decoherence in open quantum systems?',
    back: 'Environmental interaction causing the phase relationship between quantum states to disperse into the environment.',
  },
  {
    id: '4',
    front: 'What is Amdahl\'s Law in computer architecture?',
    back: 'Predicts the theoretical maximum speedup of a program when using multiple processors: S = 1 / ((1 - p) + (p / s)).',
  },
];

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({ isOpen, onClose }) => {
  const [cards, setCards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('crema_flashcards');
      return saved ? JSON.parse(saved) : DEFAULT_CARDS;
    } catch {
      return DEFAULT_CARDS;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  if (!isOpen) return null;

  const currentCard = cards[currentIndex] || cards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const toggleMastered = (id: string) => {
    setCards((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, mastered: !c.mastered } : c));
      try {
        localStorage.setItem('crema_flashcards', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;
    const newCard: Flashcard = {
      id: `card_${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      mastered: false,
    };
    const updated = [...cards, newCard];
    setCards(updated);
    try {
      localStorage.setItem('crema_flashcards', JSON.stringify(updated));
    } catch {}
    setNewFront('');
    setNewBack('');
    setShowAddForm(false);
    setCurrentIndex(updated.length - 1);
  };

  const masteredCount = cards.filter((c) => c.mastered).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#141210] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-[#1c1815]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-100">Spaced Repetition Flashcards</h2>
              <p className="text-xs text-stone-400">
                {cards.length} Cards &bull; {masteredCount} Mastered ({Math.round((masteredCount / cards.length) * 100)}%)
              </p>
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
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
          {cards.length > 0 && currentCard ? (
            <div className="w-full flex flex-col items-center gap-6">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-widest">
                Card {currentIndex + 1} of {cards.length}
              </span>

              {/* Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[260px] p-8 rounded-2xl border border-stone-800 bg-gradient-to-br from-[#1c1815] to-[#12100e] hover:border-amber-500/40 cursor-pointer shadow-xl flex flex-col items-center justify-center text-center transition-all select-none relative group"
              >
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="text-[10px] uppercase font-semibold text-stone-500 bg-stone-900 px-2 py-1 rounded">
                    {isFlipped ? 'Answer' : 'Question (Click to flip)'}
                  </span>
                </div>

                <div className="text-stone-100 text-lg md:text-xl font-medium max-w-lg leading-relaxed">
                  {isFlipped ? currentCard.back : currentCard.front}
                </div>

                <span className="absolute bottom-4 text-xs text-stone-500 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <RotateCcw className="w-3.5 h-3.5" /> Tap card to reveal
                </span>
              </div>

              {/* Navigation & Mastery Controls */}
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={handlePrev}
                  className="p-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleMastered(currentCard.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                      currentCard.mastered
                        ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {currentCard.mastered ? 'Mastered!' : 'Mark as Mastered'}
                  </button>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl text-xs text-stone-300 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Card
                  </button>
                </div>

                <button
                  onClick={handleNext}
                  className="p-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Add Form */}
              {showAddForm && (
                <form
                  onSubmit={handleAddCard}
                  className="w-full p-4 bg-stone-900/60 border border-stone-800 rounded-xl space-y-3 mt-2"
                >
                  <span className="text-xs font-bold uppercase text-amber-400 block">Create New Flashcard</span>
                  <input
                    type="text"
                    placeholder="Front (Prompt / Question / Term)"
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <textarea
                    placeholder="Back (Answer / Definition / Formula)"
                    value={newBack}
                    onChange={(e) => setNewBack(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium"
                    >
                      Save Card
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="text-stone-500 text-sm">No flashcards found.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
