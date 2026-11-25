import {useState, useEffect, useMemo} from 'react';
import {
  X,
  Compass,
  Timer,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ArrowRight,
  RotateCcw,
  Flame,
  Lightbulb,
  Trophy,
  Pause,
  Play,
} from 'lucide-react';
import {
  METHOD_DECISION_CASES,
  type MethodSubject,
  type MethodOptionItem,
} from '../data/methodDecisionData';
import {MathBlock} from './MathBlock';

interface MethodDecisionTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: MethodSubject | 'all';
  onAwardXp?: (amount: number) => void;
}

const DEFAULT_RECOGNITION_SECONDS = 45;

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function MethodDecisionTreeModal({
  isOpen,
  onClose,
  initialSubject = 'all',
  onAwardXp,
}: MethodDecisionTreeModalProps) {
  const [subjectFilter, setSubjectFilter] = useState<MethodSubject | 'all'>(initialSubject);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  // 0 means "No timer (unlimited reading time)"
  const [timerDuration, setTimerDuration] = useState<number>(DEFAULT_RECOGNITION_SECONDS);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_RECOGNITION_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<Record<string, boolean>>({});
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);

  const filteredCases = useMemo(() => {
    if (subjectFilter === 'all') return METHOD_DECISION_CASES;
    return METHOD_DECISION_CASES.filter((c) => c.subject === subjectFilter);
  }, [subjectFilter]);

  const activeCase = filteredCases[currentIndex] || filteredCases[0];

  const shuffledOptions = useMemo(() => {
    if (!activeCase) return [];
    // Shuffle options whenever activeCase or shuffleSeed changes so the right answer is in a random slot 1..4
    void shuffleSeed;
    return shuffleArray(activeCase.options);
  }, [activeCase, shuffleSeed]);

  // Reset timer when case or duration changes
  useEffect(() => {
    if (!isOpen || selectedOptionId !== null || timerDuration === 0) return;
    setSecondsLeft(timerDuration);
    setIsPaused(false);
  }, [isOpen, activeCase?.id, timerDuration, selectedOptionId]);

  useEffect(() => {
    if (!isOpen || selectedOptionId !== null || timerDuration === 0 || isPaused) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOpen, activeCase?.id, selectedOptionId, timerDuration, isPaused]);

  if (!isOpen || !activeCase) return null;

  const handleSelectSubject = (subj: MethodSubject | 'all') => {
    setSubjectFilter(subj);
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setSecondsLeft(timerDuration);
    setIsPaused(false);
    setShuffleSeed((s) => s + 1);
  };

  const handlePickOption = (opt: MethodOptionItem) => {
    if (selectedOptionId !== null) return;
    setSelectedOptionId(opt.id);

    if (opt.isOptimal) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setCorrectCount((c) => c + 1);
      if (!answeredIds[activeCase.id]) {
        setAnsweredIds((prev) => ({...prev, [activeCase.id]: true}));
        // Award +15 XP on every 3-answer streak or first correct completion
        if (nextStreak % 3 === 0 || Object.keys(answeredIds).length === 0) {
          onAwardXp?.(15);
        }
      }
    } else {
      setStreak(0);
    }
  };

  const handleNextCase = () => {
    const nextIdx = (currentIndex + 1) % filteredCases.length;
    setCurrentIndex(nextIdx);
    setSelectedOptionId(null);
    setSecondsLeft(timerDuration);
    setIsPaused(false);
    setShuffleSeed((s) => s + 1);
  };

  const handlePrevCase = () => {
    const prevIdx = (currentIndex - 1 + filteredCases.length) % filteredCases.length;
    setCurrentIndex(prevIdx);
    setSelectedOptionId(null);
    setSecondsLeft(timerDuration);
    setIsPaused(false);
    setShuffleSeed((s) => s + 1);
  };

  const chosenOption = activeCase.options.find((o) => o.id === selectedOptionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0B101B] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Тренажёр «Выбор метода решения»
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Алгоритмический навигатор · 21 ситуация
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Спокойно прочитай условие и выбери правильный первый шаг (таймер можно настроить или отключить)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Серия: {streak}</span>
              <span className="text-slate-400">|</span>
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Верно: {correctCount}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subject Filter & Navigation Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/70 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                {id: 'all', label: `Все (${METHOD_DECISION_CASES.length})`},
                {
                  id: 'matan',
                  label: `Матан (${METHOD_DECISION_CASES.filter((c) => c.subject === 'matan').length})`,
                },
                {
                  id: 'rk',
                  label: `Ангем РК 2 (${METHOD_DECISION_CASES.filter((c) => c.subject === 'rk').length})`,
                },
                {
                  id: 'exam',
                  label: `АИП C/C++ (${METHOD_DECISION_CASES.filter((c) => c.subject === 'exam').length})`,
                },
              ] as {id: MethodSubject | 'all'; label: string}[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSelectSubject(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  subjectFilter === tab.id
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevCase}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300"
            >
              ← Пред.
            </button>
            <span className="text-xs font-semibold text-slate-300">
              Задача {currentIndex + 1} из {filteredCases.length}
            </span>
            <button
              onClick={handleNextCase}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs text-indigo-200 font-semibold"
            >
              След. →
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Problem Stage Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#111827] to-indigo-950/40 border border-indigo-500/25 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
                  {activeCase.categoryBadge}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold">
                  {activeCase.uncertaintyBadge}
                </span>
              </div>

              {/* Configurable Recognition Timer with 30s / 45s / 60s / ∞ No-Timer & Pause */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-950/80 border border-white/10 text-[11px]">
                  {[
                    {sec: 30, label: '30с'},
                    {sec: 45, label: '45с'},
                    {sec: 60, label: '60с'},
                    {sec: 0, label: '∞ Без таймера'},
                  ].map((mode) => (
                    <button
                      key={mode.sec}
                      type="button"
                      onClick={() => {
                        setTimerDuration(mode.sec);
                        setSecondsLeft(mode.sec);
                        setIsPaused(false);
                      }}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                        timerDuration === mode.sec
                          ? 'bg-indigo-500 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {timerDuration > 0 && (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                      selectedOptionId !== null
                        ? 'bg-slate-800/80 border-white/10 text-slate-400'
                        : isPaused
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : secondsLeft <= 5
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                        : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>
                      {selectedOptionId !== null
                        ? 'Метод выбран'
                        : isPaused
                        ? `Пауза (${secondsLeft} с)`
                        : secondsLeft > 0
                        ? `Осталось: ${secondsLeft} сек`
                        : 'Время вышло — можно спокойно ответить!'}
                    </span>
                    {selectedOptionId === null && secondsLeft > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsPaused((p) => !p)}
                        title={isPaused ? 'Продолжить отсчёт' : 'Поставить таймер на паузу, чтобы спокойно дочитать'}
                        className="ml-1 p-0.5 rounded hover:bg-white/10 text-current cursor-pointer"
                      >
                        {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white">{activeCase.title}</h3>

            {/* Large KaTeX problem box */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-white/10 flex items-center justify-center min-h-[76px]">
              <MathBlock
                latex={activeCase.problemLatex}
                displayMode={true}
                className="text-base sm:text-lg"
              />
            </div>

            {activeCase.problemContext && (
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeCase.problemContext}
              </p>
            )}
          </div>

          {/* 4 Method Options */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Какой первый шаг и метод решения здесь оптимален?
              </span>
              {selectedOptionId !== null && (
                <button
                  onClick={() => {
                    setSelectedOptionId(null);
                    setSecondsLeft(timerDuration);
                    setIsPaused(false);
                    setShuffleSeed((s) => s + 1);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Сбросить ответ
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {shuffledOptions.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id;
                const isRevealed = selectedOptionId !== null;

                let cardStyle =
                  'bg-slate-900/90 hover:bg-indigo-500/10 border-white/10 hover:border-indigo-400/50 text-slate-100';
                if (isRevealed) {
                  if (opt.isOptimal) {
                    cardStyle =
                      'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-lg shadow-emerald-950/30';
                  } else if (isSelected) {
                    cardStyle = 'bg-rose-950/50 border-rose-500/60 text-rose-100';
                  } else {
                    cardStyle = 'bg-slate-900/60 border-white/10 text-slate-300';
                  }
                }

                return (
                  <div
                    key={opt.id}
                    onClick={() => handlePickOption(opt)}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                      !isRevealed ? 'cursor-pointer' : ''
                    } ${cardStyle}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                            isRevealed && opt.isOptimal
                              ? 'bg-emerald-500 text-slate-950'
                              : isRevealed && isSelected && !opt.isOptimal
                              ? 'bg-rose-500 text-white'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="space-y-1.5">
                          <div className="text-xs sm:text-sm font-semibold leading-snug">
                            {opt.label}
                          </div>
                          {opt.formulaHint && (
                            <div className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-white/5 inline-block max-w-full overflow-x-auto">
                              <MathBlock
                                latex={opt.formulaHint}
                                displayMode={false}
                                className="text-xs !py-0"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {isRevealed && (
                        <div className="shrink-0">
                          {opt.isOptimal ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Оптимальный метод
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[11px] font-bold">
                              <AlertOctagon className="w-3.5 h-3.5" />
                              Ловушка / Тупик
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Detailed Explanation for ALL 4 options once answered */}
                    {isRevealed && (
                      <div
                        className={`mt-3 pt-2.5 border-t text-xs leading-relaxed ${
                          opt.isOptimal
                            ? 'border-emerald-500/30 text-emerald-200'
                            : 'border-white/10 text-slate-300'
                        }`}
                      >
                        <strong className={opt.isOptimal ? 'text-emerald-300' : 'text-rose-300'}>
                          {opt.isOptimal ? 'Почему это верный ход: ' : 'Почему это ловушка: '}
                        </strong>
                        {opt.whyExplanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary & Golden Rule Box after answering */}
          {selectedOptionId !== null && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-emerald-950/40 border border-indigo-400/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {chosenOption?.isOptimal ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span className="text-sm font-bold text-white">
                    {chosenOption?.isOptimal
                      ? 'Безупречный выбор метода!'
                      : 'Разбор ошибки: запомни правило для этой конструкции'}
                  </span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/80 border border-white/10 text-xs">
                  <span className="text-slate-400">Итоговый ответ задачи:</span>
                  <MathBlock
                    latex={activeCase.finalResultLatex}
                    displayMode={false}
                    className="text-xs font-bold text-emerald-300 !py-0"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300">Золотое правило: </span>
                  {activeCase.goldenRule}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNextCase}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <span>Следующая ситуация ({currentIndex + 1}/{filteredCases.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
