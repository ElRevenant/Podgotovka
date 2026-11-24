import {useMemo} from 'react';
import {
  CardSRState,
  DailyActivityMap,
  QuestionChapter,
  StudyCategory,
  StudyPlannerSettings,
  TaskCard,
  TaskMasteryStatus,
  TheoryCard,
} from '../types/study';
import {
  addDaysToDateKey,
  computeActivityStreaks,
  getLocalDateKey,
} from '../utils/cardHelpers';
import {getCardSRState} from '../utils/spacedRepetition';

interface StudyAnalyticsPanelProps {
  category: StudyCategory;
  subjectLabel?: string;
  allCards: TheoryCard[];
  tasks: TaskCard[];
  srMap: Record<number, CardSRState>;
  taskMastery: Record<string, TaskMasteryStatus>;
  activityLog: DailyActivityMap;
  plannerSettings: StudyPlannerSettings;
  onUpdatePlanner: (patch: Partial<StudyPlannerSettings>) => void;
  onUpdateExamDate: (category: StudyCategory, dateIso: string) => void;
  onJumpToChapter: (chapter: QuestionChapter) => void;
}

export function StudyAnalyticsPanel({
  category,
  subjectLabel,
  allCards,
  tasks,
  srMap,
  taskMastery,
  activityLog,
  plannerSettings,
  onUpdatePlanner,
  onUpdateExamDate,
  onJumpToChapter,
}: StudyAnalyticsPanelProps) {
  const now = Date.now();
  const examDateIso =
    plannerSettings.examDates[category] ?? addDaysToDateKey(14);
  const displayTargetName =
    category === 'rk'
      ? 'РК 2'
      : category === 'matan'
        ? 'экзамена Матан'
        : category === 'exam'
          ? 'экзамена АИП'
          : subjectLabel || 'экзамена';

  const {todayTotal, bestStreak} = useMemo(
    () => computeActivityStreaks(activityLog, plannerSettings.dailyGoal),
    [activityLog, plannerSettings.dailyGoal],
  );

  const planMetrics = useMemo(() => {
    const todayMidnight = new Date(`${getLocalDateKey()}T00:00:00`).getTime();
    const targetMidnight = new Date(`${examDateIso}T00:00:00`).getTime();
    const rawDays = Math.ceil((targetMidnight - todayMidnight) / 86400000);
    const daysLeft = Math.max(1, Number.isFinite(rawDays) ? rawDays : 7);

    let unseenCards = 0;
    let dueReviews = 0;

    for (const c of allCards) {
      const sr = getCardSRState(srMap, c.id);
      if (sr.status === 'unseen') unseenCards++;
      const isOverdue =
        sr.nextReviewAt !== undefined && sr.nextReviewAt <= now;
      if (sr.status === 'hard' || isOverdue) dueReviews++;
    }

    const unsolvedTasks = tasks.filter(
      (t) => (taskMastery[t.id] ?? 'unsolved') !== 'solved',
    ).length;

    const dailyNewCards =
      unseenCards > 0 ? Math.max(1, Math.ceil(unseenCards / daysLeft)) : 0;
    const dailyTasks =
      unsolvedTasks > 0 ? Math.max(1, Math.ceil(unsolvedTasks / daysLeft)) : 0;

    return {
      daysLeft,
      dailyNewCards,
      dueReviews,
      dailyTasks,
    };
  }, [examDateIso, allCards, srMap, tasks, taskMastery, now]);

  const heatmapDays = useMemo(() => {
    const list: {
      key: string;
      label: string;
      total: number;
      reviews: number;
      tasksSolved: number;
      focusMinutes: number;
      level: 0 | 1 | 2 | 3 | 4;
    }[] = [];

    const goal = Math.max(5, plannerSettings.dailyGoal);
    const today = new Date();
    for (let offset = 27; offset >= 0; offset--) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const key = getLocalDateKey(d);
      const entry = activityLog[key];
      const reviews = entry?.reviews ?? 0;
      const tasksSolved = entry?.tasksSolved ?? 0;
      const focusMinutes = entry?.focusMinutes ?? 0;
      const total = reviews + tasksSolved;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (total > 0) {
        const ratio = total / goal;
        if (ratio >= 1) level = 4;
        else if (ratio >= 0.65) level = 3;
        else if (ratio >= 0.3) level = 2;
        else level = 1;
      }

      const label = d.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'short',
      });
      list.push({key, label, total, reviews, tasksSolved, focusMinutes, level});
    }
    return list;
  }, [activityLog, plannerSettings.dailyGoal]);

  const chapterStats = useMemo(() => {
    const map = new Map<
      QuestionChapter,
      {total: number; known: number; weighted: number; lapses: number}
    >();

    for (const c of allCards) {
      const sr = getCardSRState(srMap, c.id);
      const curr = map.get(c.chapter) ?? {
        total: 0,
        known: 0,
        weighted: 0,
        lapses: 0,
      };
      curr.total += 1;
      if (sr.status === 'known') {
        curr.known += 1;
        curr.weighted += 1;
      } else if (sr.status === 'learning') {
        curr.weighted += 0.55;
      } else if (sr.status === 'hard') {
        curr.weighted += 0.2;
      }
      curr.lapses += sr.lapses;
      map.set(c.chapter, curr);
    }

    const rows = Array.from(map.entries()).map(([chapter, stat]) => {
      const pct = Math.round((stat.weighted / Math.max(1, stat.total)) * 100);
      return {
        chapter,
        total: stat.total,
        known: stat.known,
        lapses: stat.lapses,
        pct,
      };
    });

    let weakestChapter: QuestionChapter | null = null;
    if (rows.length > 0) {
      const sorted = [...rows].sort((a, b) => {
        if (a.pct !== b.pct) return a.pct - b.pct;
        return b.lapses - a.lapses;
      });
      if (sorted[0].pct < 100) {
        weakestChapter = sorted[0].chapter;
      }
    }

    return {rows, weakestChapter};
  }, [allCards, srMap]);

  const dailyPct = Math.min(
    100,
    Math.round((todayTotal / Math.max(1, plannerSettings.dailyGoal)) * 100),
  );

  const heatColor = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 0:
        return 'bg-slate-200/70 dark:bg-[#131B2B] border-slate-200 dark:border-white/[0.06]';
      case 1:
        return 'bg-emerald-200 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800/70';
      case 2:
        return 'bg-emerald-300 dark:bg-emerald-800/80 border-emerald-400 dark:border-emerald-600/70';
      case 3:
        return 'bg-teal-400 dark:bg-emerald-500/85 border-teal-500 dark:border-emerald-400/80';
      case 4:
        return 'bg-cyan-500 dark:bg-cyan-400 border-cyan-600 dark:border-lime-300/80';
    }
  };

  return (
    <div className="pt-4 mt-4 border-t border-slate-200/70 dark:border-white/[0.07] grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Column 1: Exam Date Quota + 28-Day Heatmap */}
      <div className="lg:col-span-6 space-y-4">
        <div className="prism-subpanel rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
              План подготовки до {displayTargetName}
            </span>
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-[#9CA3AF]">
              <span>Дата:</span>
              <input
                type="date"
                value={examDateIso}
                onChange={(e) => {
                  if (e.target.value) {
                    onUpdateExamDate(category, e.target.value);
                  }
                }}
                className="prism-input px-2.5 py-1 text-xs font-mono rounded-lg text-slate-900 dark:text-[#F8FAFC]"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white/75 dark:bg-[#0E1522]/90 p-2.5">
              <p className="text-[11px] text-slate-500 dark:text-[#9CA3AF]">
                Новых в день
              </p>
              <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-cyan-700 dark:text-cyan-400">
                {planMetrics.dailyNewCards}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white/75 dark:bg-[#0E1522]/90 p-2.5">
              <p className="text-[11px] text-slate-500 dark:text-[#9CA3AF]">
                Повторов SM-2
              </p>
              <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {planMetrics.dueReviews}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white/75 dark:bg-[#0E1522]/90 p-2.5">
              <p className="text-[11px] text-slate-500 dark:text-[#9CA3AF]">
                Задач в день
              </p>
              <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {planMetrics.dailyTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="prism-subpanel rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Активность за 28 дней
              </span>
              <span className="text-slate-500 dark:text-[#9CA3AF] tabular-nums font-mono">
                Рекорд: {bestStreak} дн.
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-[#9CA3AF]">Цель:</span>
              <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-slate-100 dark:bg-[#131B2B] border border-slate-200/80 dark:border-white/[0.07]">
                {([10, 15, 25] as const).map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => onUpdatePlanner({dailyGoal: goal})}
                    className={`px-2.5 py-0.5 text-[11px] font-mono tabular-nums rounded-full transition-all cursor-pointer ${
                      plannerSettings.dailyGoal === goal
                        ? 'prism-tab-active font-semibold'
                        : 'text-slate-600 dark:text-[#9CA3AF] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-[#9CA3AF] tabular-nums">
              <span>
                Сегодня: {todayTotal} из {plannerSettings.dailyGoal} (карточки + задачи)
              </span>
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                {dailyPct}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
              <div
                className="h-full prism-progress-fill transition-all duration-200"
                style={{width: `${dailyPct}%`}}
              />
            </div>
          </div>

          <div className="grid grid-cols-14 gap-1.5">
            {heatmapDays.map((day) => (
              <div
                key={day.key}
                title={`${day.label}: ${day.reviews} карт., ${day.tasksSolved} зад., ${day.focusMinutes} мин фокуса`}
                className={`aspect-square rounded-[4px] border transition-colors ${heatColor(day.level)}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#9CA3AF]">
            <span>{heatmapDays[0]?.label}</span>
            <span>Сегодня ({heatmapDays[heatmapDays.length - 1]?.label})</span>
          </div>
        </div>
      </div>

      {/* Column 2: Weak Topics Map by Chapter */}
      <div className="lg:col-span-6 prism-subpanel rounded-2xl p-4 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Карта тем и слабых мест (клик — перейти к теме)
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-[#9CA3AF]">
              Глав: {chapterStats.rows.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[245px] overflow-y-auto pr-1">
            {chapterStats.rows.map((row) => {
              const isWeakest = chapterStats.weakestChapter === row.chapter;
              return (
                <button
                  key={row.chapter}
                  type="button"
                  onClick={() => onJumpToChapter(row.chapter)}
                  className="w-full text-left rounded-xl border border-slate-200/75 dark:border-white/[0.06] bg-white/80 dark:bg-[#0E1522]/90 hover:border-cyan-400/50 dark:hover:border-cyan-400/45 p-2.5 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span className="font-medium text-slate-900 dark:text-[#F3F4F6] truncate">
                      {row.chapter}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                      {isWeakest && (
                        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          Слабое место
                        </span>
                      )}
                      <span className="font-mono text-slate-600 dark:text-[#D1D5DB]">
                        {row.known}/{row.total} ({row.pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200/75 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        row.pct >= 75
                          ? 'prism-progress-fill'
                          : row.pct >= 35
                            ? 'bg-cyan-400'
                            : 'bg-rose-500'
                      }`}
                      style={{width: `${row.pct}%`}}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
