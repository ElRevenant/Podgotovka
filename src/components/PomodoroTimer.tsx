import {useEffect, useRef, useState} from 'react';
import {Coffee, Pause, Play, RotateCcw, Timer} from 'lucide-react';

interface PomodoroTimerProps {
  focusMinutes: number;
  breakMinutes: number;
  onChangeDurations: (focusMinutes: number, breakMinutes: number) => void;
  onFocusMinuteCompleted: () => void;
  sessionReviewsCount: number;
  remainingCardsToMaster: number;
  totalFocusMinutesToday: number;
}

const FOCUS_PRESETS: ReadonlyArray<{focus: number; brk: number}> = [
  {focus: 25, brk: 5},
  {focus: 45, brk: 10},
  {focus: 50, brk: 10},
  {focus: 90, brk: 15},
];

export function PomodoroTimer({
  focusMinutes,
  breakMinutes,
  onChangeDurations,
  onFocusMinuteCompleted,
  sessionReviewsCount,
  remainingCardsToMaster,
  totalFocusMinutesToday,
}: PomodoroTimerProps) {
  const safeFocusMin = Math.max(5, Math.min(120, Math.round(focusMinutes)));
  const safeBreakMin = Math.max(1, Math.min(45, Math.round(breakMinutes)));
  const focusSeconds = safeFocusMin * 60;
  const breakSeconds = safeBreakMin * 60;

  const [phase, setPhase] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(focusSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedFocusSecThisSession, setElapsedFocusSecThisSession] =
    useState<number>(0);

  const minuteAccumulatorRef = useRef<number>(0);
  const onFocusMinuteRef = useRef(onFocusMinuteCompleted);
  onFocusMinuteRef.current = onFocusMinuteCompleted;

  useEffect(() => {
    setIsRunning(false);
    setPhase('focus');
    setSecondsLeft(safeFocusMin * 60);
    minuteAccumulatorRef.current = 0;
  }, [safeFocusMin, safeBreakMin]);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      if (phase === 'focus') {
        setElapsedFocusSecThisSession((s) => s + 1);
        minuteAccumulatorRef.current += 1;
        if (minuteAccumulatorRef.current >= 60) {
          minuteAccumulatorRef.current = 0;
          onFocusMinuteRef.current();
        }
      }
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextPhase = phase === 'focus' ? 'break' : 'focus';
          setPhase(nextPhase);
          setIsRunning(false);
          return nextPhase === 'focus' ? focusSeconds : breakSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [isRunning, phase, focusSeconds, breakSeconds]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const effectiveFocusMins = Math.max(
    1,
    elapsedFocusSecThisSession / 60 +
      (sessionReviewsCount > 0 ? 0 : totalFocusMinutesToday),
  );
  const hasRealPace =
    sessionReviewsCount >= 2 && elapsedFocusSecThisSession >= 30;
  const cardsPerPomodoro = hasRealPace
    ? Math.max(
        1,
        Math.round((sessionReviewsCount / effectiveFocusMins) * safeFocusMin),
      )
    : 12;
  const estHoursToMaster =
    remainingCardsToMaster <= 0
      ? 0
      : Math.max(
          0.5,
          Math.round(
            (remainingCardsToMaster / cardsPerPomodoro) * (safeFocusMin / 60) * 2,
          ) / 2,
        );

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(phase === 'focus' ? focusSeconds : breakSeconds);
  };

  const handleTogglePhase = () => {
    setIsRunning(false);
    const nextPhase = phase === 'focus' ? 'break' : 'focus';
    setPhase(nextPhase);
    setSecondsLeft(nextPhase === 'focus' ? focusSeconds : breakSeconds);
  };

  const handleCycleMode = () => {
    const idx = FOCUS_PRESETS.findIndex(
      (p) => p.focus === safeFocusMin && p.brk === safeBreakMin,
    );
    const next = FOCUS_PRESETS[(idx + 1) % FOCUS_PRESETS.length];
    onChangeDurations(next.focus, next.brk);
  };

  const paceTooltip =
    remainingCardsToMaster <= 0
      ? `Фокус сегодня: ${totalFocusMinutesToday} мин · Все карточки выучены`
      : `Фокус сегодня: ${totalFocusMinutesToday} мин · Темп: ~${cardsPerPomodoro} карт./${safeFocusMin} мин · Прогноз до 100%: ~${estHoursToMaster} ч`;

  return (
    <div
      title={paceTooltip}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all shrink-0 ${
        isRunning
          ? 'prism-tab-active'
          : 'border border-slate-200/80 dark:border-white/[0.1] bg-slate-100/80 dark:bg-[#0E1522]/95'
      }`}
    >
      <button
        type="button"
        onClick={handleTogglePhase}
        title={
          phase === 'focus'
            ? 'Режим «Фокус» · Нажмите, чтобы переключить на перерыв «Чай / Отдых» у тёплой лампы'
            : 'Перерыв «Чай / Отдых» · Заварите горячий чай у зимнего окна и дайте голове отдохнуть (клик — вернуться в «Фокус»)'
        }
        className="inline-flex items-center gap-1 px-1 text-[11px] font-medium text-slate-600 dark:text-[#9CA3AF] hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
      >
        {phase === 'focus' ? (
          <Timer className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
        ) : (
          <Coffee className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        )}
        <span className="hidden sm:inline">
          {phase === 'focus' ? 'Фокус' : 'Чай / Отдых'}
        </span>
      </button>

      <span className="font-mono text-xs sm:text-[13px] font-bold tabular-nums text-slate-950 dark:text-[#F8FAFC] px-1">
        {formattedTime}
      </span>

      <button
        type="button"
        onClick={() => setIsRunning((r) => !r)}
        aria-label={isRunning ? 'Пауза' : 'Старт фокус-таймера'}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full transition-colors cursor-pointer ${
          isRunning
            ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35 hover:bg-amber-500/25'
            : 'prism-tool-btn text-slate-800 dark:text-[#F1F5F9]'
        }`}
      >
        {isRunning ? (
          <>
            <Pause className="h-3 w-3" />
            <span>Пауза</span>
          </>
        ) : (
          <>
            <Play className="h-3 w-3" />
            <span>Старт</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleReset}
        title="Сбросить таймер"
        aria-label="Сбросить таймер"
        className="p-1 rounded-full text-slate-500 hover:text-slate-900 dark:text-[#9CA3AF] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <RotateCcw className="h-3 w-3" />
      </button>

      <button
        type="button"
        onClick={handleCycleMode}
        title="Переключить пресет фокуса (25/5, 45/10, 50/10, 90/15) или задайте вручную в Настройках"
        className="px-2 py-0.5 text-[10px] font-mono tabular-nums font-medium rounded-full bg-white/80 dark:bg-white/[0.06] text-slate-600 dark:text-[#CBD5E1] hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
      >
        {safeFocusMin}/{safeBreakMin}
      </button>

      <span className="hidden xl:inline-flex items-center pl-1 pr-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-[#9CA3AF] border-l border-slate-200/80 dark:border-white/[0.08]">
        {totalFocusMinutesToday}м
      </span>
    </div>
  );
}
