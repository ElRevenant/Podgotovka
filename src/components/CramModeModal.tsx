import {useEffect, useMemo, useState} from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Moon,
  RotateCcw,
  X,
} from 'lucide-react';
import {CardSRState, RecallGrade, TheoryCard} from '../types/study';
import {getCardSRState, getCardUrgencyScore} from '../utils/spacedRepetition';
import {MathBlock} from './MathBlock';

interface CramModeModalProps {
  subjectTitle: string;
  allCards: TheoryCard[];
  srMap: Record<number, CardSRState>;
  onRateCard: (cardId: number, grade: RecallGrade) => void;
  onClose: () => void;
}

export function CramModeModal({
  subjectTitle,
  allCards,
  srMap,
  onRateCard,
  onClose,
}: CramModeModalProps) {
  const [scope, setScope] = useState<'weak_first' | 'all'>('weak_first');
  const [index, setIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);

  const deck = useMemo(() => {
    const now = Date.now();
    const sorted = [...allCards].sort((a, b) => {
      const srA = getCardSRState(srMap, a.id);
      const srB = getCardSRState(srMap, b.id);
      return getCardUrgencyScore(srB, now) - getCardUrgencyScore(srA, now);
    });
    if (scope === 'weak_first') {
      const nonKnown = sorted.filter(
        (c) => getCardSRState(srMap, c.id).status !== 'known',
      );
      return nonKnown.length > 0 ? nonKnown : sorted;
    }
    return sorted;
  }, [allCards, srMap, scope]);

  const safeIndex = Math.min(index, Math.max(0, deck.length - 1));
  const currentCard = deck[safeIndex];
  const remainingCards = Math.max(0, deck.length - safeIndex);
  const estMinutesLeft = Math.max(1, Math.ceil((remainingCards * 20) / 60));

  const goNext = () => {
    if (safeIndex + 1 < deck.length) {
      setIndex(safeIndex + 1);
    } else {
      setIndex(0);
    }
  };

  const goPrev = () => {
    if (safeIndex > 0) {
      setIndex(safeIndex - 1);
    }
  };

  const handleQuickRate = (grade: RecallGrade) => {
    if (!currentCard) return;
    onRateCard(currentCard.id, grade);
    setReviewedCount((c) => c + 1);
    goNext();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex, deck.length]);

  if (!currentCard) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex flex-col bg-[#070B12] text-[#F3F4F6]">
      {/* Minimal High-Contrast Header */}
      <div className="px-4 sm:px-8 h-14 border-b border-white/[0.07] bg-[#0B101B]/90 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Moon className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-sm font-bold truncate">
            Ночь перед экзаменом · {subjectTitle}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
          <div className="hidden sm:inline-flex items-center gap-1 p-0.5 rounded-full bg-[#131B2B] border border-white/[0.07]">
            <button
              type="button"
              onClick={() => {
                setScope('weak_first');
                setIndex(0);
              }}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                scope === 'weak_first'
                  ? 'prism-tab-active text-white font-semibold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Приоритет слабых
            </button>
            <button
              type="button"
              onClick={() => {
                setScope('all');
                setIndex(0);
              }}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                scope === 'all'
                  ? 'prism-tab-active text-white font-semibold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Все карточки ({allCards.length})
            </button>
          </div>

          <span className="inline-flex items-center gap-1 font-mono tabular-nums text-amber-300">
            <Clock className="h-3.5 w-3.5" />~{estMinutesLeft} мин
          </span>
          <span className="font-mono tabular-nums">
            {safeIndex + 1} / {deck.length}
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Выйти из ночного режима"
            className="p-2 rounded-full text-[#94A3B8] hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Hairline */}
      <div className="w-full h-1 bg-[#131B2B]">
        <div
          className="h-full prism-progress-fill transition-all duration-200"
          style={{width: `${((safeIndex + 1) / Math.max(1, deck.length)) * 100}%`}}
        />
      </div>

      {/* Centered Ultra-Compressed Study Card */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-8">
        <article className="w-full max-w-3xl rounded-[20px] border border-white/[0.08] bg-[#0E1522]/95 backdrop-blur-md p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8]">
            <span className="font-mono font-semibold text-cyan-400">
              Вопрос №{currentCard.id} · {currentCard.chapter}
            </span>
            <span className="font-mono tabular-nums">
              Повторено в ночном спринте: {reviewedCount}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold leading-snug text-white">
            {currentCard.question}
          </h2>

          {/* Core Thesis */}
          <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.06] p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300 mb-1.5">
              Главный тезис (выучить наизусть)
            </p>
            <p className="text-base sm:text-lg font-medium leading-relaxed text-slate-100">
              {currentCard.keyThesis}
            </p>
          </div>

          {/* Formula or Code */}
          {currentCard.mathFormulaLatex && (
            <div className="rounded-2xl border border-white/[0.07] bg-[#0B101B] p-4">
              <MathBlock
                latex={currentCard.mathFormulaLatex}
                displayMode={true}
                className="!text-white"
              />
            </div>
          )}

          {currentCard.codeSnippet && !currentCard.mathFormulaLatex && (
            <pre className="rounded-2xl border border-white/[0.07] bg-[#070B12] p-4 text-xs font-mono text-slate-200 overflow-x-auto">
              <code>{currentCard.codeSnippet.code}</code>
            </pre>
          )}

          {/* Exam Trap */}
          {currentCard.examTip && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] p-4 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                <span className="font-bold text-amber-300">Ловушка экзамена: </span>
                {currentCard.examTip}
              </div>
            </div>
          )}
        </article>
      </div>

      {/* Bottom Action Controls */}
      <div className="px-4 sm:px-8 py-4 border-t border-white/[0.07] bg-[#0B101B]/95">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={safeIndex === 0}
            onClick={goPrev}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-full bg-[#131B2B] border border-white/[0.08] text-slate-300 hover:bg-[#182235] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Назад (←)</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickRate('hard')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-full border border-amber-500/45 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Ещё раз (Сложно)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRate('good')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-full prism-cta cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4 text-lime-300" />
              <span>Знаю · Дальше</span>
            </button>
          </div>

          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-full bg-[#131B2B] border border-white/[0.08] text-slate-300 hover:bg-[#182235] transition-colors cursor-pointer"
          >
            <span>Пропустить (→)</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
