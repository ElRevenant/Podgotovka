import {useEffect, useMemo} from 'react';
import {
  BarChart3,
  Calendar,
  ClipboardCheck,
  Clock,
  Download,
  Flame,
  Gamepad2,
  RotateCcw,
  Target,
  X,
  Zap,
} from 'lucide-react';
import {
  EXAM_QUESTIONS,
  MATAN_QUESTIONS,
  MATAN_TASKS,
  RK_QUESTIONS,
  RK_TASKS,
  TASKS_AND_EXAMPLES,
} from '../data';
import {
  CardSRState,
  CustomSubject,
  DailyActivityMap,
  QuestionChapter,
  QuizStats,
  RewardSystemState,
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
import {getCardSRState, getCardVisualTier} from '../utils/spacedRepetition';

interface AllStatsModalProps {
  studyCategory: StudyCategory;
  activeSubjectTitle: string;
  activeCategoryCards: TheoryCard[];
  activeCategoryTasks: TaskCard[];
  customCards: TheoryCard[];
  customSubjects: CustomSubject[];
  srMap: Record<number, CardSRState>;
  taskMastery: Record<string, TaskMasteryStatus>;
  cardNotes: Record<number, string>;
  activityLog: DailyActivityMap;
  plannerSettings: StudyPlannerSettings;
  quizStats: QuizStats;
  rewardState: RewardSystemState;
  breakNowMs: number;
  sessionStats: {
    totalReviewed: number;
    uniqueCount: number;
    goodOrEasy: number;
    againOrHard: number;
  };
  onSelectCategory: (category: StudyCategory) => void;
  onJumpToChapter: (chapter: QuestionChapter) => void;
  onStartWeakSprint: () => void;
  onOpenRewards: () => void;
  onResetSession: () => void;
  onExportBackup: () => void;
  onUpdatePlanner?: (patch: Partial<StudyPlannerSettings>) => void;
  onUpdateExamDate?: (category: StudyCategory, dateIso: string) => void;
  onOpenAudit?: () => void;
  onClose: () => void;
}

interface SubjectSummaryRow {
  id: StudyCategory;
  label: string;
  totalCards: number;
  knownCards: number;
  inProgressCards: number;
  hardCards: number;
  tasksSolved: number;
  tasksTotal: number;
  readinessPct: number;
  knownPct: number;
  inProgressPct: number;
}

function computeSubjectMetrics(
  id: StudyCategory,
  label: string,
  cards: TheoryCard[],
  tasks: TaskCard[],
  srMap: Record<number, CardSRState>,
  taskMastery: Record<string, TaskMasteryStatus>,
): SubjectSummaryRow {
  let known = 0;
  let inProgress = 0;
  let hard = 0;

  for (const c of cards) {
    const sr = getCardSRState(srMap, c.id);
    if (sr.status === 'known') known++;
    else if (sr.status === 'learning') inProgress++;
    else if (sr.status === 'hard') hard++;
  }

  let tasksSolved = 0;
  let tasksHint = 0;
  for (const t of tasks) {
    const st = taskMastery[t.id] ?? 'unsolved';
    if (st === 'solved') tasksSolved++;
    else if (st === 'hint') tasksHint++;
  }

  const totalCards = Math.max(1, cards.length);
  const totalTasks = Math.max(1, tasks.length);
  const theoryPct = ((known + inProgress * 0.55 + hard * 0.2) / totalCards) * 100;
  const practicePct = ((tasksSolved + tasksHint * 0.5) / totalTasks) * 100;
  const readinessPct = Math.min(
    100,
    Math.round(tasks.length > 0 ? theoryPct * 0.65 + practicePct * 0.35 : theoryPct),
  );

  return {
    id,
    label,
    totalCards: cards.length,
    knownCards: known,
    inProgressCards: inProgress,
    hardCards: hard,
    tasksSolved,
    tasksTotal: tasks.length,
    readinessPct,
    knownPct: Math.round((known / totalCards) * 100),
    inProgressPct: Math.round(((inProgress + hard) / totalCards) * 100),
  };
}

export function AllStatsModal({
  studyCategory,
  activeSubjectTitle,
  activeCategoryCards,
  activeCategoryTasks,
  customCards,
  customSubjects,
  srMap,
  taskMastery,
  cardNotes,
  activityLog,
  plannerSettings,
  quizStats,
  rewardState,
  breakNowMs,
  sessionStats,
  onSelectCategory,
  onJumpToChapter,
  onStartWeakSprint,
  onOpenRewards,
  onResetSession,
  onExportBackup,
  onUpdatePlanner,
  onUpdateExamDate,
  onOpenAudit,
  onClose,
}: AllStatsModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const now = Date.now();
  const todayKey = getLocalDateKey();
  const todayFocusMinutes = activityLog[todayKey]?.focusMinutes ?? 0;

  const {todayTotal, currentStreak, bestStreak} = useMemo(
    () => computeActivityStreaks(activityLog, plannerSettings.dailyGoal),
    [activityLog, plannerSettings.dailyGoal],
  );

  const dailyPct = Math.min(
    100,
    Math.round((todayTotal / Math.max(1, plannerSettings.dailyGoal)) * 100),
  );

  const examDateIso =
    plannerSettings.examDates[studyCategory] ?? addDaysToDateKey(14);

  const daysUntilExam = useMemo(() => {
    const todayMidnight = new Date(`${todayKey}T00:00:00`).getTime();
    const targetMidnight = new Date(`${examDateIso}T00:00:00`).getTime();
    const rawDays = Math.ceil((targetMidnight - todayMidnight) / 86400000);
    return {
      daysLeft: Math.max(0, Number.isFinite(rawDays) ? rawDays : 14),
      isPast: Number.isFinite(rawDays) && rawDays < 0,
    };
  }, [todayKey, examDateIso]);

  // All subjects overview
  const allSubjectRows = useMemo<SubjectSummaryRow[]>(() => {
    const rkCards = [
      ...RK_QUESTIONS,
      ...customCards.filter((c) => c.category === 'rk'),
    ];
    const examCards = [
      ...EXAM_QUESTIONS,
      ...customCards.filter(
        (c) =>
          c.category !== 'rk' &&
          c.category !== 'matan' &&
          !String(c.category ?? '').startsWith('custom_'),
      ),
    ];
    const matanCards = [
      ...MATAN_QUESTIONS,
      ...customCards.filter((c) => c.category === 'matan'),
    ];

    const rows: SubjectSummaryRow[] = [
      computeSubjectMetrics('rk', 'Ангем · РК 2', rkCards, RK_TASKS, srMap, taskMastery),
      computeSubjectMetrics('exam', 'АИП · Экзамен', examCards, TASKS_AND_EXAMPLES, srMap, taskMastery),
      computeSubjectMetrics('matan', 'Матан · Экзамен', matanCards, MATAN_TASKS, srMap, taskMastery),
    ];

    for (const subj of customSubjects) {
      const extra = customCards.filter((c) => c.category === subj.id);
      rows.push(
        computeSubjectMetrics(
          subj.id,
          subj.name,
          [...subj.cards, ...extra],
          [],
          srMap,
          taskMastery,
        ),
      );
    }

    return rows;
  }, [customCards, customSubjects, srMap, taskMastery]);

  const activeRow = useMemo(
    () =>
      allSubjectRows.find((r) => r.id === studyCategory) ??
      computeSubjectMetrics(
        studyCategory,
        activeSubjectTitle,
        activeCategoryCards,
        activeCategoryTasks,
        srMap,
        taskMastery,
      ),
    [
      allSubjectRows,
      studyCategory,
      activeSubjectTitle,
      activeCategoryCards,
      activeCategoryTasks,
      srMap,
      taskMastery,
    ],
  );

  // Detailed SM-2 stats for active subject (6 distinct tiers)
  const activeDetailed = useMemo(() => {
    let rainbow = 0;
    let known = 0;
    let learning = 0;
    let hardOnly = 0;
    let againOnly = 0;
    let unseen = 0;
    let dueNow = 0;
    let totalLapses = 0;
    let weakCount = 0;
    let notesCount = 0;

    for (const c of activeCategoryCards) {
      const sr = getCardSRState(srMap, c.id);
      const tier = getCardVisualTier(sr);
      if (tier === 'rainbow') rainbow++;
      else if (tier === 'known') known++;
      else if (tier === 'learning') learning++;
      else if (tier === 'hard') hardOnly++;
      else if (tier === 'again') againOnly++;
      else unseen++;

      const isOverdue = sr.nextReviewAt !== undefined && sr.nextReviewAt <= now;
      if (sr.status === 'hard' || isOverdue) dueNow++;
      if (sr.lapses > 0 || sr.status === 'hard' || isOverdue) weakCount++;
      totalLapses += sr.lapses;
      if (cardNotes[c.id]?.trim()) notesCount++;
    }

    const total = Math.max(1, activeCategoryCards.length);
    return {
      total: activeCategoryCards.length,
      rainbow,
      known,
      learning,
      hard: hardOnly + againOnly,
      hardOnly,
      againOnly,
      unseen,
      dueNow,
      totalLapses,
      weakCount,
      notesCount,
      rainbowPct: (rainbow / total) * 100,
      knownPct: (known / total) * 100,
      learningPct: (learning / total) * 100,
      hardOnlyPct: (hardOnly / total) * 100,
      againOnlyPct: (againOnly / total) * 100,
    };
  }, [activeCategoryCards, srMap, cardNotes, now]);

  // 28-day heatmap & aggregates
  const activity28 = useMemo(() => {
    const days: {
      key: string;
      label: string;
      total: number;
      reviews: number;
      tasksSolved: number;
      focusMinutes: number;
      level: 0 | 1 | 2 | 3 | 4;
    }[] = [];

    let sumReviews = 0;
    let sumTasks = 0;
    let sumFocus = 0;
    let activeDaysCount = 0;

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

      sumReviews += reviews;
      sumTasks += tasksSolved;
      sumFocus += focusMinutes;
      if (total > 0 || focusMinutes > 0) activeDaysCount++;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (total > 0) {
        const ratio = total / goal;
        if (ratio >= 1) level = 4;
        else if (ratio >= 0.65) level = 3;
        else if (ratio >= 0.3) level = 2;
        else level = 1;
      }

      days.push({
        key,
        label: d.toLocaleDateString('ru-RU', {day: '2-digit', month: 'short'}),
        total,
        reviews,
        tasksSolved,
        focusMinutes,
        level,
      });
    }

    return {days, sumReviews, sumTasks, sumFocus, activeDaysCount};
  }, [activityLog, plannerSettings.dailyGoal]);

  // Chapter breakdown for active subject
  const chapterBreakdown = useMemo(() => {
    const map = new Map<
      QuestionChapter,
      {total: number; known: number; weighted: number; lapses: number}
    >();

    for (const c of activeCategoryCards) {
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

    const rows = Array.from(map.entries()).map(([chapter, stat]) => ({
      chapter,
      total: stat.total,
      known: stat.known,
      lapses: stat.lapses,
      pct: Math.round((stat.weighted / Math.max(1, stat.total)) * 100),
    }));

    let weakest: QuestionChapter | null = null;
    if (rows.length > 0) {
      const sorted = [...rows].sort((a, b) =>
        a.pct !== b.pct ? a.pct - b.pct : b.lapses - a.lapses,
      );
      if (sorted[0].pct < 100) weakest = sorted[0].chapter;
    }

    return {rows, weakest};
  }, [activeCategoryCards, srMap]);

  const quizAccuracyPct =
    quizStats.totalQuestionsAnswered > 0
      ? Math.round(
          (quizStats.totalCorrect / quizStats.totalQuestionsAnswered) * 100,
        )
      : 0;

  const sessionAccuracyPct =
    sessionStats.totalReviewed > 0
      ? Math.round((sessionStats.goodOrEasy / sessionStats.totalReviewed) * 100)
      : 0;

  const activeBreakLeftMins = rewardState.activeBreak
    ? Math.max(0, Math.ceil((rewardState.activeBreak.endsAt - breakNowMs) / 60000))
    : 0;

  const heatColor = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 0:
        return 'bg-slate-100 dark:bg-[#131B2B] border-slate-200/80 dark:border-white/[0.06]';
      case 1:
        return 'bg-emerald-200 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800/70';
      case 2:
        return 'bg-emerald-300 dark:bg-emerald-800/80 border-emerald-400 dark:border-emerald-700/70';
      case 3:
        return 'bg-emerald-500 dark:bg-emerald-500/85 border-emerald-600 dark:border-emerald-400/70';
      case 4:
        return 'bg-emerald-600 dark:bg-cyan-400 border-emerald-700 dark:border-cyan-300';
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#04070D]/80 backdrop-blur-md p-3 sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="all-stats-modal-title"
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] rounded-[20px] prism-surface shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Iridescent Rainbow Accent Bar */}
        <div className="h-1 w-full rainbow-shimmer-bar shrink-0" />

        {/* Unified Header with Exam Date & Daily Goal Controls */}
        <div className="px-5 py-4 border-b border-slate-200/75 dark:border-white/[0.07] bg-white/80 dark:bg-[#0B101B]/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <h2
                id="all-stats-modal-title"
                className="text-lg font-bold tracking-tight text-slate-950 dark:text-[#F3F4F6] truncate"
              >
                Вся статистика и план подготовки
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-[#94A3B8] flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>Активный предмет: {activeSubjectTitle}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Calendar className="h-3 w-3" />
                {daysUntilExam.isPast
                  ? 'Дата сдачи прошла'
                  : `До экзамена: ${daysUntilExam.daysLeft} дн. (${examDateIso})`}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onUpdateExamDate && (
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-white/[0.1] bg-slate-50/90 dark:bg-[#121926] text-xs text-slate-700 dark:text-[#CBD5E1]">
                <Calendar className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-[#94A3B8]">
                  Дата сдачи:
                </span>
                <input
                  type="date"
                  value={examDateIso}
                  onChange={(e) => {
                    if (e.target.value) {
                      onUpdateExamDate(studyCategory, e.target.value);
                    }
                  }}
                  aria-label="Дата сдачи экзамена или РК"
                  className="bg-transparent font-mono text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
                />
              </label>
            )}

            {onUpdatePlanner && (
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-white/[0.1] bg-slate-50/90 dark:bg-[#121926] text-xs text-slate-700 dark:text-[#CBD5E1]">
                <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                  Цель дня:
                </span>
                <select
                  value={plannerSettings.dailyGoal}
                  onChange={(e) =>
                    onUpdatePlanner({
                      dailyGoal: Math.max(5, Math.min(100, Number(e.target.value) || 15)),
                    })
                  }
                  aria-label="Дневная цель карточек и задач"
                  className="bg-transparent font-mono font-semibold text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
                >
                  {[10, 15, 20, 25, 30, 40, 50].map((g) => (
                    <option key={g} value={g} className="bg-white dark:bg-[#0E1522]">
                      {g} карт.
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть статистику"
              className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#94A3B8] dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Single Unified Scrollable Block with Hairline Dividers */}
        <div className="overflow-y-auto divide-y divide-slate-200/80 dark:divide-white/[0.07]">
          {/* Section 1: 4-Column Core KPI Strip */}
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: Readiness */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">
                Готовность ({activeSubjectTitle})
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold tabular-nums text-sky-700 dark:text-sky-400">
                  {activeRow.readinessPct}%
                </span>
                <span className="text-xs text-slate-500 dark:text-[#9CA3AF] tabular-nums">
                  {activeRow.knownCards}/{activeRow.totalCards} теор.
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#D1D5DB] tabular-nums">
                {activeRow.tasksTotal > 0
                  ? `Задачи: ${activeRow.tasksSolved}/${activeRow.tasksTotal} · Сложные: ${activeRow.hardCards}`
                  : `Сложные: ${activeRow.hardCards} · В процессе: ${activeRow.inProgressCards}`}
              </p>
            </div>

            {/* KPI 2: Today + Streak + Focus */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">
                Сегодня и серия
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {todayTotal}/{plannerSettings.dailyGoal}
                </span>
                <span className="text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {dailyPct}%
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#D1D5DB] flex items-center gap-2 tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  {currentStreak} дн. (рекорд {bestStreak})
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-[#404040]">·</span>
                <span>{todayFocusMinutes} мин</span>
              </p>
            </div>

            {/* KPI 3: Blitz Quiz */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">
                Блиц-тесты
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-[#F3F4F6]">
                  {quizStats.totalQuestionsAnswered > 0 ? `${quizAccuracyPct}%` : '—'}
                </span>
                <span className="text-xs text-slate-500 dark:text-[#9CA3AF] tabular-nums">
                  точность
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#D1D5DB] tabular-nums">
                Пройдено: {quizStats.completedCount} · Рекорд: {quizStats.bestScorePct}%
              </p>
            </div>

            {/* KPI 4: XP & Rewards */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">
                Опыт и допуск на отдых
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold tabular-nums text-violet-700 dark:text-violet-400">
                  {rewardState.balanceXp}
                </span>
                <span className="text-xs font-mono text-violet-700 dark:text-violet-400">
                  XP
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#D1D5DB] tabular-nums">
                {activeBreakLeftMins > 0 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <Clock className="h-3.5 w-3.5" />
                    Отдых идёт · {activeBreakLeftMins} мин
                  </span>
                ) : (
                  `Сегодня +${rewardState.earnedTodayXp} · Всего ${rewardState.totalEarnedXp} XP · Наград: ${rewardState.totalRedeemedCount}`
                )}
              </p>
            </div>
          </div>

          {/* Section 2: All Subjects Overview */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                Прогресс по всем предметам
              </h3>
              <span className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                Клик по предмету — быстрый переход
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {allSubjectRows.map((row) => {
                const isActive = row.id === studyCategory;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(row.id);
                      onClose();
                    }}
                    className={`w-full py-2.5 px-3 -mx-1 rounded-xl text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-cyan-50/80 dark:bg-cyan-500/[0.08]'
                        : 'hover:bg-slate-50 dark:hover:bg-[#131B2B]'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6] truncate">
                        {row.label}
                      </span>
                      {isActive && (
                        <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300 shrink-0">
                          · активный
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 shrink-0">
                      <span className="text-xs text-slate-600 dark:text-[#CBD5E1] tabular-nums">
                        Теория:{' '}
                        <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                          {row.knownCards}/{row.totalCards}
                        </strong>
                      </span>
                      {row.tasksTotal > 0 && (
                        <span className="text-xs text-slate-600 dark:text-[#CBD5E1] tabular-nums">
                          Задачи:{' '}
                          <strong className="font-mono text-slate-900 dark:text-[#F3F4F6]">
                            {row.tasksSolved}/{row.tasksTotal}
                          </strong>
                        </span>
                      )}
                      <span className="text-xs text-slate-600 dark:text-[#CBD5E1] tabular-nums">
                        Сложные:{' '}
                        <strong className="font-mono text-amber-700 dark:text-amber-300">
                          {row.hardCards}
                        </strong>
                      </span>
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-[#131B2B] overflow-hidden flex">
                          <div
                            className="h-full prism-progress-fill"
                            style={{width: `${row.knownPct}%`}}
                          />
                          <div
                            className="h-full bg-cyan-500/50 dark:bg-cyan-400/50"
                            style={{width: `${row.inProgressPct}%`}}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-[#F3F4F6] w-9 text-right">
                          {row.readinessPct}%
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Deep Breakdown (SM-2 + Session + 28-Day Heatmap | Chapters) */}
          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: SM-2 Distribution, Current Session, 28-Day Heatmap */}
            <div className="lg:col-span-6 space-y-5">
              {/* SM-2 Memory Distribution */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                    Состояние памяти SM-2
                  </h3>
                  <span className="font-mono tabular-nums text-slate-500 dark:text-[#9CA3AF]">
                    Всего: {activeDetailed.total}
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-[#131B2B] overflow-hidden flex">
                  <div
                    className="h-full rainbow-shimmer-bar"
                    style={{width: `${activeDetailed.rainbowPct}%`}}
                    title={`Мастерство 95%+: ${activeDetailed.rainbow}`}
                  />
                  <div
                    className="h-full bg-emerald-500"
                    style={{width: `${activeDetailed.knownPct}%`}}
                    title={`Выучено: ${activeDetailed.known}`}
                  />
                  <div
                    className="h-full bg-cyan-400"
                    style={{width: `${activeDetailed.learningPct}%`}}
                    title={`Хорошо: ${activeDetailed.learning}`}
                  />
                  <div
                    className="h-full bg-amber-400"
                    style={{width: `${activeDetailed.hardOnlyPct}%`}}
                    title={`Сложно: ${activeDetailed.hardOnly}`}
                  />
                  <div
                    className="h-full bg-rose-500"
                    style={{width: `${activeDetailed.againOnlyPct}%`}}
                    title={`Не помню: ${activeDetailed.againOnly}`}
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs tabular-nums pt-0.5">
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8]">95%+</span>
                    <p className="font-mono text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-emerald-400 to-cyan-400">
                      {activeDetailed.rainbow}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8]">Выучено</span>
                    <p className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {activeDetailed.known}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8]">Хорошо</span>
                    <p className="font-mono text-sm font-bold text-cyan-700 dark:text-cyan-400">
                      {activeDetailed.learning}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8]">Сложно</span>
                    <p className="font-mono text-sm font-bold text-amber-700 dark:text-amber-300">
                      {activeDetailed.hardOnly}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8]">Не помню</span>
                    <p className="font-mono text-sm font-bold text-rose-700 dark:text-rose-400">
                      {activeDetailed.againOnly}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8]">Новые</span>
                    <p className="font-mono text-sm font-bold text-slate-700 dark:text-[#CBD5E1]">
                      {activeDetailed.unseen}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-[#94A3B8] tabular-nums">
                  К повтору сейчас: <strong className="font-mono text-amber-700 dark:text-amber-300">{activeDetailed.dueNow}</strong>
                  {' · '}Ошибок/сбросов: <strong className="font-mono text-slate-800 dark:text-[#E5E7EB]">{activeDetailed.totalLapses}</strong>
                  {' · '}Своих заметок: <strong className="font-mono text-slate-800 dark:text-[#E5E7EB]">{activeDetailed.notesCount}</strong>
                </p>
              </div>

              {/* Current Session */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                    Текущая сессия
                  </h3>
                  {sessionStats.totalReviewed > 0 && (
                    <button
                      type="button"
                      onClick={onResetSession}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 dark:text-[#94A3B8] dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Обнулить сессию</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-[#CBD5E1] tabular-nums">
                  <span>
                    Повторов:{' '}
                    <strong className="font-mono text-cyan-700 dark:text-cyan-400">
                      {sessionStats.totalReviewed}
                    </strong>
                  </span>
                  <span>
                    Уникальных:{' '}
                    <strong className="font-mono text-slate-900 dark:text-[#F3F4F6]">
                      {sessionStats.uniqueCount}
                    </strong>
                  </span>
                  <span>
                    Зачтено:{' '}
                    <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                      {sessionStats.goodOrEasy}
                    </strong>
                  </span>
                  <span>
                    На повтор:{' '}
                    <strong className="font-mono text-amber-700 dark:text-amber-300">
                      {sessionStats.againOrHard}
                    </strong>
                  </span>
                  <span>
                    Точность:{' '}
                    <strong className="font-mono text-slate-900 dark:text-[#F3F4F6]">
                      {sessionStats.totalReviewed > 0 ? `${sessionAccuracyPct}%` : '—'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* 28-Day Activity Heatmap */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                    Активность за 28 дней
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-[#94A3B8] tabular-nums">
                    Активных дней: {activity28.activeDaysCount}/28
                  </span>
                </div>

                <div className="grid grid-cols-14 gap-1.5">
                  {activity28.days.map((day) => (
                    <div
                      key={day.key}
                      title={`${day.label}: ${day.reviews} карт., ${day.tasksSolved} зад., ${day.focusMinutes} мин фокуса`}
                      className={`aspect-square rounded-[4px] border ${heatColor(day.level)}`}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#94A3B8] tabular-nums">
                  <span>
                    За 28 дн.: {activity28.sumReviews} карт. · {activity28.sumTasks} зад. · {activity28.sumFocus} мин фокуса
                  </span>
                  <span>Сегодня ({activity28.days[activity28.days.length - 1]?.label})</span>
                </div>
              </div>
            </div>

            {/* Right Column: Chapters & Weak Topics */}
            <div className="lg:col-span-6 lg:border-l lg:border-slate-100 lg:dark:border-white/[0.06] lg:pl-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                  Разделы предмета ({chapterBreakdown.rows.length})
                </h3>
                <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Клик — перейти к разделу
                </span>
              </div>

              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {chapterBreakdown.rows.map((row) => {
                  const isWeakest = chapterBreakdown.weakest === row.chapter;
                  return (
                    <button
                      key={row.chapter}
                      type="button"
                      onClick={() => {
                        onJumpToChapter(row.chapter);
                        onClose();
                      }}
                      className="w-full text-left py-2.5 px-3 rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/40 dark:bg-[#131B2B]/60 hover:border-cyan-400/60 transition-colors cursor-pointer"
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
                          <span className="font-mono text-slate-600 dark:text-[#CBD5E1]">
                            {row.known}/{row.total} ({row.pct}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-[#0B101B] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 ${
                            row.pct >= 95
                              ? 'rainbow-shimmer-bar'
                              : row.pct >= 75
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

        {/* Footer Quick Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 dark:border-white/[0.07] bg-slate-50/70 dark:bg-[#0B101B]/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartWeakSprint();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full prism-tool-btn text-rose-700 dark:text-rose-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Спринт по слабым ({activeDetailed.weakCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRewards();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full prism-tool-btn text-slate-800 dark:text-[#E5E7EB] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Gamepad2 className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
              <span>Награды ({rewardState.balanceXp} XP)</span>
            </button>

            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-full prism-tool-btn text-slate-700 dark:text-[#CBD5E1] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Экспорт JSON</span>
            </button>

            {onOpenAudit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAudit();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full prism-tool-btn text-slate-800 dark:text-[#E5E7EB] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ClipboardCheck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Полный реестр вопросов и аудит базы</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full prism-cta whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Target className="h-3.5 w-3.5 text-lime-300" />
            <span>Продолжить учёбу</span>
          </button>
        </div>
      </div>
    </div>
  );
}
