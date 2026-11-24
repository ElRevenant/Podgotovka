import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';
import {
  getCuratedRoundsForCategory,
  SpotTheLieRound,
} from '../data/spotTheLieData';
import {StudyCategory, TheoryCard} from '../types/study';
import {getAutonomousMode, getGeminiHeaders} from '../utils/cardHelpers';
import {MathBlock} from './MathBlock';

interface SpotTheLieModalProps {
  category: StudyCategory;
  subjectTitle: string;
  allCards: TheoryCard[];
  onOpenCardInDeck?: (cardId: number) => void;
  onCorrectRound?: () => void;
  onClose: () => void;
}

const ROUND_SECONDS = 30;
const SESSION_TARGET = 10;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function SpotTheLieModal({
  category,
  subjectTitle,
  allCards,
  onOpenCardInDeck,
  onCorrectRound,
  onClose,
}: SpotTheLieModalProps) {
  const initialPool = useMemo(
    () => shuffle(getCuratedRoundsForCategory(category)),
    [category],
  );

  const [rounds, setRounds] = useState<SpotTheLieRound[]>(initialPool);
  const [roundIdx, setRoundIdx] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_SECONDS * 1000);
  const [selectedStepIdx, setSelectedStepIdx] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [reactionTimesSec, setReactionTimesSec] = useState<number[]>([]);
  const [sessionDone, setSessionDone] = useState(false);

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const timerRef = useRef<number | null>(null);
  const currentRound = rounds[roundIdx] ?? null;
  const isResolved = selectedStepIdx !== null || timedOut;

  // Countdown timer
  useEffect(() => {
    if (!currentRound || isResolved || sessionDone || isGeneratingAi) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const startedAt = Date.now();
    const initialRemaining = timeLeftMs;

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.max(0, initialRemaining - elapsed);
      setTimeLeftMs(next);
      if (next <= 0) {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTimedOut(true);
        setPlayed((p) => p + 1);
        setStreak(0);
      }
    }, 100);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx, isResolved, sessionDone, isGeneratingAi, currentRound?.id]);

  // Escape key closes modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSelectStep = (idx: number) => {
    if (!currentRound || isResolved) return;
    const elapsedSec = Math.max(
      0.4,
      Number(((ROUND_SECONDS * 1000 - timeLeftMs) / 1000).toFixed(1)),
    );
    setSelectedStepIdx(idx);
    setPlayed((p) => p + 1);

    if (idx === currentRound.poisonedIndex) {
      setScore((s) => s + 1);
      onCorrectRound?.();
      setReactionTimesSec((prev) => [...prev, elapsedSec]);
      setStreak((prev) => {
        const next = prev + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const reshuffleCuratedRounds = useCallback(() => {
    const reshuffled = shuffle(getCuratedRoundsForCategory(category)).map(
      (r, idx) => ({
        ...r,
        id: `${r.id}-cycle-${Date.now()}-${idx}`,
      }),
    );
    setRounds((prev) => {
      const next = [...prev, ...reshuffled];
      setRoundIdx(prev.length);
      return next;
    });
    setSelectedStepIdx(null);
    setTimedOut(false);
    setTimeLeftMs(ROUND_SECONDS * 1000);
    setAiError('');
  }, [category]);

  const generateAiRound = useCallback(async () => {
    if (getAutonomousMode() || allCards.length === 0) {
      reshuffleCuratedRounds();
      return;
    }
    setIsGeneratingAi(true);
    setAiError('');
    try {
      // Prefer cards with rich proofs / points
      const candidates = allCards.filter((c) => c.answerPoints.length >= 3);
      const pool = candidates.length > 0 ? candidates : allCards;
      const picked = pool[Math.floor(Math.random() * pool.length)];

      const res = await fetch('/api/exam/spot-the-lie', {
        method: 'POST',
        headers: getGeminiHeaders(),
        body: JSON.stringify({
          card: {
            id: picked.id,
            question: picked.question,
            keyThesis: picked.keyThesis,
            answerPoints: picked.answerPoints,
            examTip: picked.examTip,
          },
          subjectTitle,
        }),
      });
      if (!res.ok) {
        reshuffleCuratedRounds();
        return;
      }
      const data = await res.json();
      const newRound: SpotTheLieRound = {
        id: `ai-lie-${Date.now()}`,
        category: 'custom',
        title: data.title,
        statement: data.statement,
        steps: data.steps,
        poisonedIndex: data.poisonedIndex,
        fallacyType: data.fallacyType,
        explanation: data.explanation,
        correctStep: data.correctStep,
        linkedCardId: picked.id,
      };
      setRounds((prev) => {
        const next = [...prev, newRound];
        setRoundIdx(next.length - 1);
        return next;
      });
      setSelectedStepIdx(null);
      setTimedOut(false);
      setTimeLeftMs(ROUND_SECONDS * 1000);
    } catch {
      reshuffleCuratedRounds();
    } finally {
      setIsGeneratingAi(false);
    }
  }, [allCards, subjectTitle, reshuffleCuratedRounds]);

  const handleNextRound = () => {
    if (played >= SESSION_TARGET) {
      setSessionDone(true);
      return;
    }
    if (roundIdx + 1 < rounds.length) {
      setRoundIdx((i) => i + 1);
      setSelectedStepIdx(null);
      setTimedOut(false);
      setTimeLeftMs(ROUND_SECONDS * 1000);
    } else {
      // Out of curated rounds -> auto-generate fresh AI proof or reshuffle curated pool seamlessly
      void generateAiRound();
    }
  };

  const handleRestartSession = () => {
    setRounds(shuffle(getCuratedRoundsForCategory(category)));
    setRoundIdx(0);
    setSelectedStepIdx(null);
    setTimedOut(false);
    setTimeLeftMs(ROUND_SECONDS * 1000);
    setScore(0);
    setPlayed(0);
    setStreak(0);
    setBestStreak(0);
    setReactionTimesSec([]);
    setSessionDone(false);
    setAiError('');
  };

  const secDisplay = (timeLeftMs / 1000).toFixed(1);
  const progressPct = Math.max(
    0,
    Math.min(100, (timeLeftMs / (ROUND_SECONDS * 1000)) * 100),
  );
  const timerColor =
    timeLeftMs <= 7500
      ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
      : timeLeftMs <= 15000
        ? 'bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
        : 'prism-progress-fill';

  const avgReaction =
    reactionTimesSec.length > 0
      ? (
          reactionTimesSec.reduce((a, b) => a + b, 0) / reactionTimesSec.length
        ).toFixed(1)
      : '—';

  const wasCorrect =
    currentRound !== null && selectedStepIdx === currentRound.poisonedIndex;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Игра Найди ложь за 30 секунд"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04070D]/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
    >
      <div className="w-full max-w-3xl prism-surface rounded-[20px] shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/75 dark:border-white/[0.07] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-2xl bg-rose-500/14 border border-rose-500/25 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-[#F8FAFC] truncate">
                Найди ложь за 30 секунд
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#9CA3AF] truncate">
                {subjectTitle} · Ткни в единственную «отравленную» строку доказательства
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-[#131B2B] border border-slate-200/75 dark:border-white/[0.07] text-xs font-mono tabular-nums">
              <span className="text-slate-600 dark:text-[#9CA3AF]">
                Раунд <strong className="text-slate-950 dark:text-white">{Math.min(played + (isResolved ? 0 : 1), SESSION_TARGET)}/{SESSION_TARGET}</strong>
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-white/15">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                {score} верно
              </span>
              {streak >= 2 && (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                  <Flame className="h-3.5 w-3.5" />
                  {streak}×
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="prism-tool-btn p-2 rounded-full text-slate-500 dark:text-[#9CA3AF] hover:text-slate-950 dark:hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7 max-h-[82vh] overflow-y-auto space-y-5">
          {sessionDone ? (
            <div className="py-6 text-center space-y-5">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
                <Trophy className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-950 dark:text-white">
                  Серия из {played} раундов завершена!
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-[#9CA3AF] max-w-lg mx-auto">
                  {score >= 8
                    ? 'Уровень «Детектор лжи»: на экзамене тебя невозможно подловить на подмене кванторов или скрытом делении на ноль.'
                    : score >= 5
                      ? 'Хорошая хватка! Повтори ещё серию — и логические дыры будут бросаться в глаза мгновенно.'
                      : 'Отличная разминка для внимания — теперь ты точно знаешь главные ловушки экзаменаторов.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                <div className="prism-subpanel rounded-2xl p-3.5">
                  <div className="text-xs text-slate-500 dark:text-[#9CA3AF]">Точность</div>
                  <div className="mt-1 text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {score}/{played}
                  </div>
                </div>
                <div className="prism-subpanel rounded-2xl p-3.5">
                  <div className="text-xs text-slate-500 dark:text-[#9CA3AF]">Макс. комбо</div>
                  <div className="mt-1 text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    {bestStreak}×
                  </div>
                </div>
                <div className="prism-subpanel rounded-2xl p-3.5">
                  <div className="text-xs text-slate-500 dark:text-[#9CA3AF]">Ср. скорость</div>
                  <div className="mt-1 text-xl font-bold font-mono tabular-nums text-cyan-600 dark:text-cyan-400">
                    {avgReaction}с
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleRestartSession}
                  className="prism-cta inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-full cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Новая серия (10 раундов)</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="prism-tool-btn px-5 py-2.5 text-xs sm:text-sm font-medium rounded-full text-slate-700 dark:text-[#E5E7EB] cursor-pointer"
                >
                  Вернуться к подготовке
                </button>
              </div>
            </div>
          ) : isGeneratingAi ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Прячем тонкую математическую ловушку в новом доказательстве...
              </p>
              <p className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                Собираем 6 правдоподобных шагов по билетам «{subjectTitle}»
              </p>
            </div>
          ) : currentRound ? (
            <>
              {/* Timer Bar */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-[#E5E7EB]">
                    <Clock className={`h-3.5 w-3.5 ${timeLeftMs <= 7500 && !isResolved ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`} />
                    {isResolved
                      ? timedOut
                        ? 'Время вышло!'
                        : `Ответ дан за ${Math.max(0.4, Number(((ROUND_SECONDS * 1000 - timeLeftMs) / 1000).toFixed(1)))} сек`
                      : `Осталось: ${secDisplay} сек`}
                  </span>
                  <button
                    type="button"
                    onClick={() => void generateAiRound()}
                    className="prism-tool-btn inline-flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-medium rounded-full text-cyan-700 dark:text-cyan-300 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Сгенерировать ИИ-ловушку по колоде</span>
                  </button>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 ${timerColor}`}
                    style={{width: `${progressPct}%`}}
                  />
                </div>
              </div>

              {aiError && (
                <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200">
                  {aiError}
                </div>
              )}

              {/* Proof Statement Header */}
              <div className="prism-subpanel rounded-2xl p-4 sm:p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-400/90">
                  Доказательство / вывод
                </div>
                <h3 className="mt-1 text-base sm:text-lg font-bold text-slate-950 dark:text-[#F8FAFC]">
                  {currentRound.title}
                </h3>
                <p className="mt-1 text-sm text-slate-700 dark:text-[#CBD5E1]">
                  {currentRound.statement}
                </p>
              </div>

              {/* 6 Clickable Steps */}
              <div className="space-y-2.5">
                {currentRound.steps.map((step, idx) => {
                  const isPoisoned = idx === currentRound.poisonedIndex;
                  const isPicked = idx === selectedStepIdx;

                  let cardStyle =
                    'border-slate-200/80 dark:border-white/[0.07] bg-white/85 dark:bg-[#131B2B]/85 hover:border-cyan-400/55 dark:hover:border-cyan-400/55 hover:bg-cyan-50/50 dark:hover:bg-[#172336] hover:shadow-[0_0_18px_-8px_rgba(34,211,238,0.45)] cursor-pointer';
                  if (isResolved) {
                    if (isPoisoned && isPicked) {
                      cardStyle =
                        'border-emerald-400/70 bg-emerald-500/14 shadow-[0_0_20px_-6px_rgba(52,211,153,0.45)]';
                    } else if (isPoisoned) {
                      cardStyle =
                        'border-rose-500/70 bg-rose-500/14 shadow-[0_0_20px_-6px_rgba(244,63,94,0.45)]';
                    } else if (isPicked) {
                      cardStyle =
                        'border-amber-400/70 bg-amber-500/14';
                    } else {
                      cardStyle =
                        'border-slate-200/60 dark:border-white/[0.05] bg-white/50 dark:bg-[#0B101B]/65 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={`${currentRound.id}-step-${idx}`}
                      type="button"
                      disabled={isResolved}
                      onClick={() => handleSelectStep(idx)}
                      className={`w-full text-left rounded-2xl border p-3.5 sm:p-4 transition-all flex items-start gap-3 ${cardStyle}`}
                    >
                      <span
                        className={`mt-0.5 h-6 w-6 rounded-lg text-xs font-mono tabular-nums font-bold flex items-center justify-center shrink-0 ${
                          isResolved && isPoisoned
                            ? wasCorrect
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-rose-500 text-white'
                            : isResolved && isPicked
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-100 dark:bg-[#0E1522] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-[#CBD5E1]'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-sm leading-relaxed text-slate-900 dark:text-[#F3F4F6]">
                          {step.text}
                        </p>
                        {step.latex && (
                          <div className="overflow-x-auto pt-0.5">
                            <MathBlock latex={step.latex} displayMode={false} />
                          </div>
                        )}
                      </div>
                      {isResolved && isPoisoned && (
                        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-700 dark:text-rose-300">
                          Ложь
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Verdict & Forensic Explanation */}
              {isResolved && (
                <div
                  className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                    wasCorrect
                      ? 'border-emerald-400/35 bg-emerald-500/10'
                      : 'border-rose-400/35 bg-rose-500/10'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {wasCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                      ) : timedOut ? (
                        <AlertTriangle className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                      )}
                      <span className="text-sm font-bold text-slate-950 dark:text-[#F8FAFC]">
                        {wasCorrect
                          ? `Поймал ложь! Шаг №${currentRound.poisonedIndex + 1} разоблачён`
                          : timedOut
                            ? `Не успел — ложь скрывалась в шаге №${currentRound.poisonedIndex + 1}`
                            : `Промах! Отравлен был шаг №${currentRound.poisonedIndex + 1}`}
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900/10 dark:bg-white/[0.08] text-slate-900 dark:text-[#F8FAFC]">
                      Ловушка: {currentRound.fallacyType}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-800 dark:text-[#E5E7EB]">
                    {currentRound.explanation}
                  </p>

                  <div className="prism-subpanel rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-[#E5E7EB]">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Как правильно:{' '}
                    </span>
                    {currentRound.correctStep}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {currentRound.linkedCardId && onOpenCardInDeck ? (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenCardInDeck(currentRound.linkedCardId!);
                          onClose();
                        }}
                        className="text-xs font-medium text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                      >
                        Открыть связанный билет №{currentRound.linkedCardId} в колоде →
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={handleNextRound}
                      className="prism-cta inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full cursor-pointer"
                    >
                      <span>
                        {played >= SESSION_TARGET
                          ? 'Показать итоги серии'
                          : 'Следующий раунд'}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
