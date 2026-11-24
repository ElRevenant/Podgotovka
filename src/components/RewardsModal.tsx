import {FormEvent, useEffect, useMemo, useState} from 'react';
import {
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Coffee,
  Film,
  Flame,
  Gamepad2,
  GraduationCap,
  Layers,
  Lock,
  Moon,
  Pizza,
  Plus,
  ShieldCheck,
  Snowflake,
  Sparkles,
  StickyNote,
  Target,
  Trash2,
  Trophy,
  Unlock,
  X,
  Zap,
} from 'lucide-react';
import {
  CardSRState,
  DailyActivityMap,
  QuizStats,
  RewardItem,
  RewardSystemState,
  TaskCard,
  TaskMasteryStatus,
  TheoryCard,
} from '../types/study';
import {DEFAULT_REWARDS} from '../utils/rewards';
import {getCardSRState} from '../utils/spacedRepetition';

export type SessionAchievementCategory =
  | 'all'
  | 'theory'
  | 'sm2_streaks'
  | 'practice'
  | 'blitz_arena'
  | 'winter_focus'
  | 'notes_arsenal'
  | 'baumanka_boss';

interface SessionAchievementItem {
  id: string;
  title: string;
  description: string;
  category: Exclude<SessionAchievementCategory, 'all'>;
  categoryLabel: string;
  rewardXp: number;
  current: number;
  target: number;
  unitLabel: string;
  icon:
    | 'snow'
    | 'layers'
    | 'crystal'
    | 'shield'
    | 'note'
    | 'board'
    | 'calc'
    | 'practice'
    | 'sniper'
    | 'blitz100'
    | 'lamp'
    | 'night'
    | 'frost3'
    | 'streak7'
    | 'admitted'
    | 'automat';
}

interface RewardsModalProps {
  rewardState: RewardSystemState;
  initialTab?: 'shop' | 'achievements';
  srMap: Record<number, CardSRState>;
  taskMastery: Record<string, TaskMasteryStatus>;
  quizStats: QuizStats;
  activityLog: DailyActivityMap;
  currentStreak: number;
  bestStreak: number;
  cardNotes: Record<number, string>;
  activeCategoryCards: TheoryCard[];
  activeCategoryTasks: TaskCard[];
  readinessPct: number;
  onClaimReward: (reward: RewardItem) => void;
  onBuyStreakFreeze: () => void;
  onClaimAchievement: (achievementId: string, rewardXp: number) => void;
  onClaimAllAchievements?: (items: {id: string; rewardXp: number}[]) => void;
  onEndActiveBreak: () => void;
  onAddCustomReward: (reward: RewardItem) => void;
  onDeleteReward: (rewardId: string) => void;
  onRestoreDefaults: () => void;
  onClose: () => void;
}

function RewardIcon({
  kind,
  className = 'h-5 w-5',
}: {
  kind: RewardItem['icon'];
  className?: string;
}) {
  switch (kind) {
    case 'dota':
      return <Gamepad2 className={className} />;
    case 'coffee':
      return <Coffee className={className} />;
    case 'movie':
      return <Film className={className} />;
    case 'food':
      return <Pizza className={className} />;
    case 'party':
      return <Trophy className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

function SessionAchievementIcon({
  kind,
  className = 'h-5 w-5',
}: {
  kind: SessionAchievementItem['icon'];
  className?: string;
}) {
  switch (kind) {
    case 'snow':
    case 'frost3':
      return <Snowflake className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'crystal':
      return <Sparkles className={className} />;
    case 'shield':
      return <ShieldCheck className={className} />;
    case 'note':
      return <StickyNote className={className} />;
    case 'board':
    case 'calc':
    case 'practice':
      return <Brain className={className} />;
    case 'sniper':
      return <Target className={className} />;
    case 'blitz100':
      return <Zap className={className} />;
    case 'lamp':
      return <Coffee className={className} />;
    case 'night':
      return <Moon className={className} />;
    case 'streak7':
      return <Flame className={className} />;
    case 'admitted':
      return <GraduationCap className={className} />;
    case 'automat':
      return <Trophy className={className} />;
    default:
      return <BookOpen className={className} />;
  }
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function RewardsModal({
  rewardState,
  initialTab = 'shop',
  srMap,
  taskMastery,
  quizStats,
  activityLog,
  currentStreak,
  bestStreak,
  cardNotes,
  activeCategoryCards,
  activeCategoryTasks,
  readinessPct,
  onClaimReward,
  onBuyStreakFreeze,
  onClaimAchievement,
  onClaimAllAchievements,
  onEndActiveBreak,
  onAddCustomReward,
  onDeleteReward,
  onRestoreDefaults,
  onClose,
}: RewardsModalProps) {
  const [activeTab, setActiveTab] = useState<'shop' | 'achievements'>(initialTab);
  const [achCategoryFilter, setAchCategoryFilter] =
    useState<SessionAchievementCategory>('all');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState('150');
  const [newMinutes, setNewMinutes] = useState('45');
  const [newIcon, setNewIcon] = useState<RewardItem['icon']>('dota');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const sortedRewards = useMemo(
    () => [...rewardState.rewards].sort((a, b) => a.costXp - b.costXp),
    [rewardState.rewards],
  );

  const nextLocked = useMemo(
    () => sortedRewards.find((r) => rewardState.balanceXp < r.costXp) ?? null,
    [sortedRewards, rewardState.balanceXp],
  );

  const activeBreakRemainingMs = rewardState.activeBreak
    ? Math.max(0, rewardState.activeBreak.endsAt - nowMs)
    : 0;

  const streakFreezesCount = rewardState.streakFreezes ?? 0;
  const canBuyFreeze = rewardState.balanceXp >= 150 && streakFreezesCount < 3;

  const claimedSet = useMemo(
    () => new Set(rewardState.claimedAchievementIds ?? []),
    [rewardState.claimedAchievementIds],
  );

  // Compute all 52 Winter Session Hall of Achievements across 7 categories
  const sessionAchievements = useMemo<SessionAchievementItem[]>(() => {
    const allEntries = Object.entries(srMap);
    const allSrValues = allEntries.map(([, s]) => s);
    const totalKnownAll = allSrValues.filter((s) => s.status === 'known').length;
    const totalBox4All = allSrValues.filter((s) => s.box >= 4).length;
    const totalErrorSlayerAll = allSrValues.filter(
      (s) => s.status === 'known' && s.lapses > 0,
    ).length;

    let matanTheoremsKnown = 0;
    let matanAnyKnown = 0;
    let rkAnyKnown = 0;
    let aipAnyKnown = 0;
    for (const [idStr, s] of allEntries) {
      if (s.status !== 'known') continue;
      const id = Number(idStr);
      if (id >= 501 && id <= 549) matanTheoremsKnown++;
      if (id >= 501 && id <= 650) matanAnyKnown++;
      if (id >= 201 && id <= 250) rkAnyKnown++;
      if (id >= 1 && id <= 100) aipAnyKnown++;
    }
    const minKnownAcross3Subjects = Math.min(
      matanAnyKnown,
      rkAnyKnown,
      aipAnyKnown,
    );

    let activeDeckKnown = 0;
    for (const c of activeCategoryCards) {
      if (getCardSRState(srMap, c.id).status === 'known') {
        activeDeckKnown++;
      }
    }
    const quarterDeckTarget = Math.max(
      1,
      Math.ceil(activeCategoryCards.length * 0.25),
    );
    const halfDeckTarget = Math.max(
      1,
      Math.ceil(activeCategoryCards.length * 0.5),
    );
    const threeQuarterDeckTarget = Math.max(
      1,
      Math.ceil(activeCategoryCards.length * 0.75),
    );

    const notesCount = Object.values(cardNotes).filter(
      (n) => typeof n === 'string' && n.trim().length > 0,
    ).length;

    const taskEntries = Object.entries(taskMastery);
    const totalSolvedAll = taskEntries.filter(
      ([, st]) => st === 'solved',
    ).length;
    const fn12TicketTasksSolved = taskEntries.filter(
      ([tId, st]) => tId.startsWith('matan-b') && st === 'solved',
    ).length;

    let activeTasksSolved = 0;
    for (const t of activeCategoryTasks) {
      if (taskMastery[t.id] === 'solved') {
        activeTasksSolved++;
      }
    }
    const halfTasksTarget = Math.max(
      1,
      Math.ceil(Math.max(2, activeCategoryTasks.length) * 0.5),
    );
    const activeTasksForHalf =
      activeCategoryTasks.length > 0 ? activeTasksSolved : totalSolvedAll;

    let totalFocusMinutes = 0;
    let activeStudyDays = 0;
    for (const entry of Object.values(activityLog)) {
      totalFocusMinutes += entry.focusMinutes || 0;
      if (
        (entry.reviews || 0) +
          (entry.tasksSolved || 0) +
          (entry.focusMinutes || 0) >
        0
      ) {
        activeStudyDays++;
      }
    }

    const effectiveStreak = Math.max(currentStreak, bestStreak);
    const bestQuizPct = quizStats.bestScorePct || 0;
    const totalQuizzes = quizStats.completedCount || 0;

    return [
      // ==================== КАТЕГОРИЯ 1 · ТЕОРИЯ И ПАМЯТЬ (10) ====================
      {
        id: 'ach_first_snow',
        title: 'Первый след на снегу',
        description: 'Выучить (статус «Выучено») первые 5 карточек теории',
        category: 'theory',
        categoryLabel: 'Теория и память',
        rewardXp: 15,
        current: totalKnownAll,
        target: 5,
        unitLabel: 'карт.',
        icon: 'snow',
      },
      {
        id: 'ach_theory_15',
        title: 'Конспект первокурсника',
        description: 'Довести 15 карточек теории до статуса «Выучено»',
        category: 'theory',
        categoryLabel: 'Теория и память',
        rewardXp: 25,
        current: totalKnownAll,
        target: 15,
        unitLabel: 'карт.',
        icon: 'snow',
      },
      {
        id: 'ach_theory_30',
        title: 'База фундамента',
        description: 'Выучить 30 карточек теории по любым предметам',
        category: 'theory',
        categoryLabel: 'Теория и память',
        rewardXp: 35,
        current: totalKnownAll,
        target: 30,
        unitLabel: 'карт.',
        icon: 'layers',
      },
      {
        id: 'ach_deck_quarter',
        title: 'Четверть дистанции',
        description: 'Выучить не менее 25% карточек активного предмета',
        category: 'theory',
        categoryLabel: 'Теория и память',
        rewardXp: 30,
        current: activeDeckKnown,
        target: quarterDeckTarget,
        unitLabel: 'карт.',
        icon: 'layers',
      },
      {
        id: 'ach_deck_half',
        title: 'Экватор колоды',
        description: 'Выучить не менее 50% карточек активного предмета',
        category: 'theory',
        categoryLabel: 'Теория и память',
        rewardXp: 45,
        current: activeDeckKnown,
        target: halfDeckTarget,
        unitLabel: 'карт.',
        icon: 'layers',
      },
      {
        id: 'ach_deck_75',
        title: 'Штурм кафедры (75% колоды)',
        description: 'Выучить не менее 75% карточек активного предмета',
        category: 'theory',
        categoryLabel: 'Теория и память',
        rewardXp: 65,
        current: activeDeckKnown,
        target: threeQuarterDeckTarget,
        unitLabel: 'карт.',
        icon: 'admitted',
      },
      {
        id: 'ach_theory_60',
        title: 'Архивариус лекций',
        description: 'Выучить суммарно 60 карточек по всем предметам сессии',
        category: 'theory',
        categoryLabel: 'Теория и память',
        rewardXp: 60,
        current: totalKnownAll,
        target: 60,
        unitLabel: 'карт.',
        icon: 'layers',
      },
      {
        id: 'ach_theory_100',
        title: 'Сто теорем в голове',
        description: 'Выучить суммарно 100 карточек теории по всем предметам',
        category: 'theory',
        categoryLabel: 'Теория и память',
        rewardXp: 90,
        current: totalKnownAll,
        target: 100,
        unitLabel: 'карт.',
        icon: 'crystal',
      },
      {
        id: 'ach_theory_150',
        title: 'Ходячий учебник ФН-12',
        description: 'Выучить суммарно 150 карточек теории и определений',
        category: 'theory',
        categoryLabel: 'Теория и память',
        rewardXp: 120,
        current: totalKnownAll,
        target: 150,
        unitLabel: 'карт.',
        icon: 'automat',
      },
      {
        id: 'ach_matan_theorems_25',
        title: 'Доказано на доске (25 теорем Матана)',
        description: 'Выучить 25 официальных экзаменационных теорем Матана (№1–49)',
        category: 'theory',
        categoryLabel: 'Теория и память',
        rewardXp: 75,
        current: matanTheoremsKnown,
        target: 25,
        unitLabel: 'теорем',
        icon: 'admitted',
      },

      // ==================== КАТЕГОРИЯ 2 · СЕРИИ И SM-2 (8) ====================
      {
        id: 'ach_box4_5',
        title: 'Первые кристаллы (Коробка 4)',
        description: 'Довести 5 карточек до максимальной коробки 4 (мастерство 95%+)',
        category: 'sm2_streaks',
        categoryLabel: 'Серии и SM-2',
        rewardXp: 25,
        current: totalBox4All,
        target: 5,
        unitLabel: 'карт.',
        icon: 'crystal',
      },
      {
        id: 'ach_box4_master',
        title: 'Хрустальная память (15× Коробка 4)',
        description: 'Довести 15 карточек до максимальной коробки 4 (мастерство 95%+)',
        category: 'sm2_streaks',
        categoryLabel: 'Серии и SM-2',
        rewardXp: 45,
        current: totalBox4All,
        target: 15,
        unitLabel: 'карт.',
        icon: 'crystal',
      },
      {
        id: 'ach_box4_35',
        title: 'Алмазный фонд SM-2 (35× Коробка 4)',
        description: 'Довести 35 карточек до максимальной коробки 4 (95%+)',
        category: 'sm2_streaks',
        categoryLabel: 'Серии и SM-2',
        rewardXp: 75,
        current: totalBox4All,
        target: 35,
        unitLabel: 'карт.',
        icon: 'crystal',
      },
      {
        id: 'ach_box4_70',
        title: 'Абсолютный ретеншн (70× Коробка 4)',
        description: 'Довести 70 карточек до максимальной коробки 4 (95%+)',
        category: 'sm2_streaks',
        categoryLabel: 'Серии и SM-2',
        rewardXp: 110,
        current: totalBox4All,
        target: 70,
        unitLabel: 'карт.',
        icon: 'automat',
      },
      {
        id: 'ach_error_3',
        title: 'Работа над ошибками',
        description: 'Довести до «Выучено» 3 карточки, где ранее были ошибки или сбросы',
        category: 'sm2_streaks',
        categoryLabel: 'Серии и SM-2',
        rewardXp: 25,
        current: totalErrorSlayerAll,
        target: 3,
        unitLabel: 'карт.',
        icon: 'shield',
      },
      {
        id: 'ach_error_slayer',
        title: 'Укротитель слабых мест',
        description: 'Довести до статуса «Выучено» 7 карточек, на которых ранее были ошибки',
        category: 'sm2_streaks',
        categoryLabel: 'Серии и SM-2',
        rewardXp: 45,
        current: totalErrorSlayerAll,
        target: 7,
        unitLabel: 'карт.',
        icon: 'shield',
      },
      {
        id: 'ach_error_15',
        title: 'Феникс зимней сессии',
        description: 'Закрыть до статуса «Выучено» 15 ранее заваленных карточек',
        category: 'sm2_streaks',
        categoryLabel: 'Серии и SM-2',
        rewardXp: 70,
        current: totalErrorSlayerAll,
        target: 15,
        unitLabel: 'карт.',
        icon: 'shield',
      },
      {
        id: 'ach_error_30',
        title: 'Непробиваемый иммунитет',
        description: 'Закрыть до статуса «Выучено» 30 ранее проблемных карточек',
        category: 'sm2_streaks',
        categoryLabel: 'Серии и SM-2',
        rewardXp: 100,
        current: totalErrorSlayerAll,
        target: 30,
        unitLabel: 'карт.',
        icon: 'shield',
      },

      // ==================== КАТЕГОРИЯ 3 · ПРАКТИКА И БИЛЕТЫ ФН-12 (10) ====================
      {
        id: 'ach_tasks_1',
        title: 'Первая задача у доски',
        description: 'Самостоятельно решить первую практическую задачу без подсказок',
        category: 'practice',
        categoryLabel: 'Практика и ФН-12',
        rewardXp: 15,
        current: totalSolvedAll,
        target: 1,
        unitLabel: 'задач',
        icon: 'board',
      },
      {
        id: 'ach_tasks_3',
        title: 'Разминка у доски',
        description: 'Самостоятельно решить 3 практические задачи',
        category: 'practice',
        categoryLabel: 'Практика и ФН-12',
        rewardXp: 25,
        current: totalSolvedAll,
        target: 3,
        unitLabel: 'задач',
        icon: 'board',
      },
      {
        id: 'ach_tasks_7',
        title: 'Семинарский зачёт',
        description: 'Самостоятельно решить 7 практических задач',
        category: 'practice',
        categoryLabel: 'Практика и ФН-12',
        rewardXp: 35,
        current: totalSolvedAll,
        target: 7,
        unitLabel: 'задач',
        icon: 'calc',
      },
      {
        id: 'ach_tasks_12',
        title: 'Инженерный расчёт',
        description: 'Самостоятельно решить 12 практических задач',
        category: 'practice',
        categoryLabel: 'Практика и ФН-12',
        rewardXp: 50,
        current: totalSolvedAll,
        target: 12,
        unitLabel: 'задач',
        icon: 'calc',
      },
      {
        id: 'ach_tasks_25',
        title: 'Решебник кафедры',
        description: 'Самостоятельно решить 25 практических задач',
        category: 'practice',
        categoryLabel: 'Практика и ФН-12',
        rewardXp: 75,
        current: totalSolvedAll,
        target: 25,
        unitLabel: 'задач',
        icon: 'practice',
      },
      {
        id: 'ach_tasks_45',
        title: 'Гроза задачников (45 задач)',
        description: 'Самостоятельно решить 45 практических задач',
        category: 'practice',
        categoryLabel: 'Практика и ФН-12',
        rewardXp: 110,
        current: totalSolvedAll,
        target: 45,
        unitLabel: 'задач',
        icon: 'automat',
      },
      {
        id: 'ach_tasks_half',
        title: 'Практик без подсказок (50%)',
        description: 'Решить самостоятельно не менее 50% задач активного предмета',
        category: 'practice',
        categoryLabel: 'Практика и ФН-12',
        rewardXp: 65,
        current: activeTasksForHalf,
        target: halfTasksTarget,
        unitLabel: 'задач',
        icon: 'practice',
      },
      {
        id: 'ach_fn12_tickets_5',
        title: 'Покоритель билетов 20-08 (I)',
        description: 'Решить 5 задач из реальных экзаменационных билетов ФН-12 (№1–22)',
        category: 'practice',
        categoryLabel: 'Практика и ФН-12',
        rewardXp: 40,
        current: fn12TicketTasksSolved,
        target: 5,
        unitLabel: 'задач ФН-12',
        icon: 'calc',
      },
      {
        id: 'ach_fn12_tickets_15',
        title: 'Покоритель билетов 20-08 (II)',
        description: 'Решить 15 задач из реальных экзаменационных билетов ФН-12 (№1–22)',
        category: 'practice',
        categoryLabel: 'Практика и ФН-12',
        rewardXp: 70,
        current: fn12TicketTasksSolved,
        target: 15,
        unitLabel: 'задач ФН-12',
        icon: 'practice',
      },
      {
        id: 'ach_fn12_tickets_30',
        title: 'Магистр билетов Крищенко (30 задач)',
        description: 'Решить 30 задач из реальных экзаменационных билетов ФН-12 (20-08)',
        category: 'practice',
        categoryLabel: 'Практика и ФН-12',
        rewardXp: 115,
        current: fn12TicketTasksSolved,
        target: 30,
        unitLabel: 'задач ФН-12',
        icon: 'automat',
      },

      // ==================== КАТЕГОРИЯ 4 · БЛИЦ И АРЕНА (6) ====================
      {
        id: 'ach_quiz_first',
        title: 'Боевое крещение тестом',
        description: 'Завершить свой первый блиц-тест по любому предмету',
        category: 'blitz_arena',
        categoryLabel: 'Блиц и арена',
        rewardXp: 15,
        current: totalQuizzes,
        target: 1,
        unitLabel: 'тест',
        icon: 'sniper',
      },
      {
        id: 'ach_quiz_5_runs',
        title: 'Серийный тестировщик',
        description: 'Пройти до конца 5 блиц-тестов',
        category: 'blitz_arena',
        categoryLabel: 'Блиц и арена',
        rewardXp: 30,
        current: totalQuizzes,
        target: 5,
        unitLabel: 'тестов',
        icon: 'sniper',
      },
      {
        id: 'ach_quiz_15_runs',
        title: 'Марафонец блиц-тестов',
        description: 'Пройти до конца 15 блиц-тестов',
        category: 'blitz_arena',
        categoryLabel: 'Блиц и арена',
        rewardXp: 55,
        current: totalQuizzes,
        target: 15,
        unitLabel: 'тестов',
        icon: 'blitz100',
      },
      {
        id: 'ach_quiz_80',
        title: 'Снайпер блиц-теста (80%+)',
        description: 'Пройти блиц-тест с результатом не ниже 80%',
        category: 'blitz_arena',
        categoryLabel: 'Блиц и арена',
        rewardXp: 35,
        current: bestQuizPct,
        target: 80,
        unitLabel: '%',
        icon: 'sniper',
      },
      {
        id: 'ach_quiz_90',
        title: 'Ювелирная точность (90%+)',
        description: 'Пройти блиц-тест с результатом не ниже 90%',
        category: 'blitz_arena',
        categoryLabel: 'Блиц и арена',
        rewardXp: 50,
        current: bestQuizPct,
        target: 90,
        unitLabel: '%',
        icon: 'sniper',
      },
      {
        id: 'ach_quiz_100',
        title: 'Безошибочный блиц (100%)',
        description: 'Выбить 100% правильных ответов в блиц-тесте',
        category: 'blitz_arena',
        categoryLabel: 'Блиц и арена',
        rewardXp: 75,
        current: bestQuizPct,
        target: 100,
        unitLabel: '%',
        icon: 'blitz100',
      },

      // ==================== КАТЕГОРИЯ 5 · ЗИМНИЙ РЕЖИМ И ФОКУС (8) ====================
      {
        id: 'ach_focus_25',
        title: 'Первая помидорка (25 мин)',
        description: 'Накопить первые 25 минут чистого фокуса в таймере',
        category: 'winter_focus',
        categoryLabel: 'Зимний режим и фокус',
        rewardXp: 20,
        current: totalFocusMinutes,
        target: 25,
        unitLabel: 'мин',
        icon: 'lamp',
      },
      {
        id: 'ach_focus_50',
        title: 'Тёплая лампа (50 мин фокуса)',
        description: 'Накопить суммарно 50 минут чистого фокуса в Pomodoro-таймере',
        category: 'winter_focus',
        categoryLabel: 'Зимний режим и фокус',
        rewardXp: 30,
        current: totalFocusMinutes,
        target: 50,
        unitLabel: 'мин',
        icon: 'lamp',
      },
      {
        id: 'ach_focus_120',
        title: 'Два часа тишины (120 мин)',
        description: 'Накопить суммарно 120 минут чистого фокуса',
        category: 'winter_focus',
        categoryLabel: 'Зимний режим и фокус',
        rewardXp: 45,
        current: totalFocusMinutes,
        target: 120,
        unitLabel: 'мин',
        icon: 'lamp',
      },
      {
        id: 'ach_focus_180',
        title: 'Ночной дозор (3 часа фокуса)',
        description: 'Накопить суммарно 180 минут чистого фокуса по дневнику активности',
        category: 'winter_focus',
        categoryLabel: 'Зимний режим и фокус',
        rewardXp: 65,
        current: totalFocusMinutes,
        target: 180,
        unitLabel: 'мин',
        icon: 'night',
      },
      {
        id: 'ach_focus_360',
        title: 'Глубокое погружение (6 часов фокуса)',
        description: 'Накопить суммарно 360 минут чистого фокуса',
        category: 'winter_focus',
        categoryLabel: 'Зимний режим и фокус',
        rewardXp: 95,
        current: totalFocusMinutes,
        target: 360,
        unitLabel: 'мин',
        icon: 'night',
      },
      {
        id: 'ach_focus_600',
        title: 'Монах зимней сессии (10 часов фокуса)',
        description: 'Накопить суммарно 600 минут чистого фокуса за подготовку',
        category: 'winter_focus',
        categoryLabel: 'Зимний режим и фокус',
        rewardXp: 140,
        current: totalFocusMinutes,
        target: 600,
        unitLabel: 'мин',
        icon: 'automat',
      },
      {
        id: 'ach_streak_3',
        title: 'Морозная выдержка (3 дня подряд)',
        description: 'Заниматься подготовкой 3 дня подряд без пропусков',
        category: 'winter_focus',
        categoryLabel: 'Зимний режим и фокус',
        rewardXp: 35,
        current: effectiveStreak,
        target: 3,
        unitLabel: 'дн.',
        icon: 'frost3',
      },
      {
        id: 'ach_streak_7',
        title: 'Неделя без тильта (7 дней подряд)',
        description: 'Достичь серии из 7 дней подготовки подряд',
        category: 'winter_focus',
        categoryLabel: 'Зимний режим и фокус',
        rewardXp: 75,
        current: effectiveStreak,
        target: 7,
        unitLabel: 'дн.',
        icon: 'streak7',
      },

      // ==================== КАТЕГОРИЯ 6 · КОНСПЕКТЫ И СВОЯ БАЗА (4) ====================
      {
        id: 'ach_notes_1',
        title: 'Первая пометка на полях',
        description: 'Добавить собственную заметку или мнемонику к 1 карточке',
        category: 'notes_arsenal',
        categoryLabel: 'Конспекты и база',
        rewardXp: 15,
        current: notesCount,
        target: 1,
        unitLabel: 'заметок',
        icon: 'note',
      },
      {
        id: 'ach_notes_author',
        title: 'Авторские мнемоники (5 заметок)',
        description: 'Написать собственные заметки или ассоциации минимум к 5 карточкам',
        category: 'notes_arsenal',
        categoryLabel: 'Конспекты и база',
        rewardXp: 30,
        current: notesCount,
        target: 5,
        unitLabel: 'заметок',
        icon: 'note',
      },
      {
        id: 'ach_notes_15',
        title: 'Собственный конспект (15 заметок)',
        description: 'Написать собственные заметки или шпаргалки к 15 карточкам',
        category: 'notes_arsenal',
        categoryLabel: 'Конспекты и база',
        rewardXp: 55,
        current: notesCount,
        target: 15,
        unitLabel: 'заметок',
        icon: 'note',
      },
      {
        id: 'ach_notes_30',
        title: 'Соавтор методички (30 заметок)',
        description: 'Написать собственные заметки или разборы к 30 карточкам',
        category: 'notes_arsenal',
        categoryLabel: 'Конспекты и база',
        rewardXp: 85,
        current: notesCount,
        target: 30,
        unitLabel: 'заметок',
        icon: 'note',
      },

      // ==================== КАТЕГОРИЯ 7 · БОССЫ БАУМАНКИ (6) ====================
      {
        id: 'ach_streak_14',
        title: 'Двухнедельный штурм (14 дней подряд)',
        description: 'Держать непрерывную серию подготовки 14 дней подряд',
        category: 'baumanka_boss',
        categoryLabel: 'Боссы Бауманки',
        rewardXp: 115,
        current: effectiveStreak,
        target: 14,
        unitLabel: 'дн.',
        icon: 'streak7',
      },
      {
        id: 'ach_active_days_10',
        title: 'Декада упорства (10 учебных дней)',
        description: 'Заниматься подготовкой минимум в 10 разных дней по календарю',
        category: 'baumanka_boss',
        categoryLabel: 'Боссы Бауманки',
        rewardXp: 70,
        current: activeStudyDays,
        target: 10,
        unitLabel: 'дн.',
        icon: 'frost3',
      },
      {
        id: 'ach_ready_50',
        title: 'Зачётная книжка открыта (50%+)',
        description: 'Довести общую готовность активного предмета до 50% и выше',
        category: 'baumanka_boss',
        categoryLabel: 'Боссы Бауманки',
        rewardXp: 40,
        current: readinessPct,
        target: 50,
        unitLabel: '%',
        icon: 'admitted',
      },
      {
        id: 'ach_ready_75',
        title: 'К зачёту допущен (75%+)',
        description: 'Довести общую готовность активного предмета до 75% и выше',
        category: 'baumanka_boss',
        categoryLabel: 'Боссы Бауманки',
        rewardXp: 65,
        current: readinessPct,
        target: 75,
        unitLabel: '%',
        icon: 'admitted',
      },
      {
        id: 'ach_ready_95',
        title: 'Автомат до боя курантов (95%+)',
        description: 'Довести общую готовность активного предмета до 95%+',
        category: 'baumanka_boss',
        categoryLabel: 'Боссы Бауманки',
        rewardXp: 110,
        current: readinessPct,
        target: 95,
        unitLabel: '%',
        icon: 'automat',
      },
      {
        id: 'ach_all_3_subjects_10',
        title: 'Триумвират ИУ / ФН (3 предмета × 10)',
        description: 'Выучить минимум по 10 карточек в каждом из трёх предметов: Матан, Ангем и АИП',
        category: 'baumanka_boss',
        categoryLabel: 'Боссы Бауманки',
        rewardXp: 125,
        current: minKnownAcross3Subjects,
        target: 10,
        unitLabel: 'карт./предм.',
        icon: 'automat',
      },
    ];
  }, [
    srMap,
    activeCategoryCards,
    cardNotes,
    taskMastery,
    activeCategoryTasks,
    activityLog,
    currentStreak,
    bestStreak,
    quizStats.bestScorePct,
    quizStats.completedCount,
    readinessPct,
  ]);

  const completedAchievementsCount = useMemo(
    () =>
      sessionAchievements.filter(
        (a) => a.current >= a.target || claimedSet.has(a.id),
      ).length,
    [sessionAchievements, claimedSet],
  );

  const claimableAchievements = useMemo(
    () =>
      sessionAchievements.filter(
        (a) => a.current >= a.target && !claimedSet.has(a.id),
      ),
    [sessionAchievements, claimedSet],
  );

  const claimableTotalXp = useMemo(
    () => claimableAchievements.reduce((sum, a) => sum + a.rewardXp, 0),
    [claimableAchievements],
  );

  const filteredAchievements = useMemo(() => {
    if (achCategoryFilter === 'all') return sessionAchievements;
    return sessionAchievements.filter((a) => a.category === achCategoryFilter);
  }, [sessionAchievements, achCategoryFilter]);

  const handleCreateCustom = (e: FormEvent) => {
    e.preventDefault();
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) return;
    const cost = Math.max(20, Math.min(3000, Number(newCost) || 150));
    const mins = Math.max(5, Math.min(300, Number(newMinutes) || 30));

    onAddCustomReward({
      id: `rew_custom_${Date.now().toString(36)}`,
      title: cleanTitle,
      subtitle: `Твоя личная цель (${mins} мин отдыха)`,
      costXp: cost,
      breakMinutes: mins,
      icon: newIcon,
      permitQuote: `ДОПУСК ВЫДАН! «${cleanTitle}» официально разрешено — ты честно заработал ${cost} XP!`,
      isCustom: true,
    });
    setNewTitle('');
    setNewCost('150');
    setNewMinutes('45');
    setAddOpen(false);
  };

  const handleClaimAll = () => {
    if (claimableAchievements.length === 0) return;
    if (onClaimAllAchievements) {
      onClaimAllAchievements(
        claimableAchievements.map((a) => ({id: a.id, rewardXp: a.rewardXp})),
      );
      return;
    }
    for (const a of claimableAchievements) {
      onClaimAchievement(a.id, a.rewardXp);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Магазин XP, анти-тильт и зал достижений зимней сессии"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04070D]/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-[20px] prism-surface shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Winter Accent Bar */}
        <div className="h-1 w-full rainbow-shimmer-bar shrink-0" />

        {/* Header + 2-Tab Switcher */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#0B101B]/85 space-y-3.5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                {activeTab === 'shop' ? (
                  <Gamepad2 className="h-5 w-5" />
                ) : (
                  <Trophy className="h-5 w-5 text-amber-500 dark:text-amber-300" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-[#F3F4F6] truncate">
                  Награды, анти-тильт и Зал из 52 достижений зимней сессии
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] truncate">
                  Хардкорная экономика XP: закрывай слабые места и билеты ФН-12 → забирай бонусы ачивок → отдыхай по праву
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-[#94A3B8] dark:hover:bg-[#182235] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 2-Tab Top Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="Разделы наград и достижений"
              className="inline-flex items-center gap-1 p-1 rounded-full border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/90 dark:bg-[#0E1522]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'shop'}
                onClick={() => setActiveTab('shop')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  activeTab === 'shop'
                    ? 'prism-tab-active text-slate-950 dark:text-white'
                    : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Gamepad2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Допуски на отдых (Магазин XP)</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'achievements'}
                onClick={() => setActiveTab('achievements')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  activeTab === 'achievements'
                    ? 'prism-tab-active text-slate-950 dark:text-white'
                    : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Trophy className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300" />
                <span>
                  Достижения сессии ({completedAchievementsCount} / {sessionAchievements.length})
                </span>
                {claimableAchievements.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-extrabold">
                    +{claimableAchievements.length}
                  </span>
                )}
              </button>
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-mono tabular-nums">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">
                Баланс: {rewardState.balanceXp} XP
              </span>
              {streakFreezesCount > 0 && (
                <span
                  title="Заморозки стрика защищают серию дней при пропуске"
                  className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-700 dark:text-cyan-300 font-bold"
                >
                  ❄️×{streakFreezesCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {activeTab === 'shop' ? (
            <>
              {/* Active Official Break Permit */}
              {rewardState.activeBreak && activeBreakRemainingMs > 0 && (
                <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/50 dark:to-[#13221c] p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-extrabold uppercase tracking-wider">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Разрешено
                      </span>
                      <h3 className="text-lg font-extrabold text-emerald-950 dark:text-emerald-200">
                        {rewardState.activeBreak.title}
                      </h3>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#111916] border border-emerald-300 dark:border-emerald-700 font-mono text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                      <Clock className="h-4 w-4" />
                      <span>{formatCountdown(activeBreakRemainingMs)}</span>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 leading-relaxed">
                    {rewardState.activeBreak.permitQuote}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                      Когда таймер закончится — пора возвращаться к билетам!
                    </span>
                    <button
                      type="button"
                      onClick={onEndActiveBreak}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-400 dark:border-emerald-700 bg-white/80 dark:bg-[#16251f] text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
                    >
                      Завершить отдых досрочно и вернуться к учёбе
                    </button>
                  </div>
                </div>
              )}

              {/* XP Wallet & Next Stage Progress */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E1522] p-4">
                  <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    Доступно для траты
                  </div>
                  <div className="mt-1 text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {rewardState.balanceXp} XP
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-[#94A3B8]">
                    Сегодня заработано: +{rewardState.earnedTodayXp} XP
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E1522] p-4 flex flex-col justify-between space-y-2">
                  {nextLocked ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-800 dark:text-[#E5E7EB]">
                          Следующий этап:{' '}
                          <strong className="text-sky-700 dark:text-sky-400">
                            {nextLocked.title}
                          </strong>
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-[#D1D5DB] tabular-nums">
                          Осталось {nextLocked.costXp - rewardState.balanceXp} XP
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-[#131B2B] overflow-hidden">
                        <div
                          className="h-full prism-progress-fill transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (rewardState.balanceXp /
                                  Math.max(1, nextLocked.costXp)) *
                                  100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                        Примерно ещё{' '}
                        <strong className="text-slate-700 dark:text-[#D1D5DB]">
                          {Math.ceil(
                            (nextLocked.costXp - rewardState.balanceXp) / 5,
                          )}{' '}
                          карточек
                        </strong>{' '}
                        или{' '}
                        <strong className="text-slate-700 dark:text-[#D1D5DB]">
                          {Math.ceil(
                            (nextLocked.costXp - rewardState.balanceXp) / 12,
                          )}{' '}
                          решённых задач
                        </strong>{' '}
                        — и допуск твой!
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 my-auto">
                      <Award className="h-8 w-8 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-slate-950 dark:text-white">
                          Все этапы наград открыты!
                        </div>
                        <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
                          Можешь смело забрать любую награду ниже или добавить свою супер-цель.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Winter Item: Streak Freeze (Anti-Tilt) */}
              <div className="rounded-2xl border border-cyan-400/35 bg-gradient-to-r from-cyan-500/[0.08] via-sky-500/[0.06] to-emerald-500/[0.08] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/20 border border-cyan-400/35 text-cyan-600 dark:text-cyan-300 flex items-center justify-center shrink-0">
                    <Snowflake className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-950 dark:text-[#F8FAFC]">
                        Заморозка стрика (Анти-тильт) ❄️
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/15 border border-cyan-400/30 text-cyan-800 dark:text-cyan-200 tabular-nums">
                        В запасе: {streakFreezesCount} / 3 ❄️
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
                      Защищает твою серию ударных дней при пропуске одного тяжёлого дня перед сессией. Максимум 3 заморозки в запасе.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={!canBuyFreeze}
                    onClick={onBuyStreakFreeze}
                    className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                      canBuyFreeze
                        ? 'prism-cta'
                        : 'prism-tool-btn text-slate-500 dark:text-[#94A3B8]'
                    }`}
                  >
                    {streakFreezesCount >= 3
                      ? 'Максимум (3/3 ❄️)'
                      : 'Купить заморозку · 150 XP'}
                  </button>
                </div>
              </div>

              {/* How XP is Earned Strip (Harder Economy) */}
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1522] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-[#94A3B8]">
                <span className="font-semibold text-slate-900 dark:text-[#F3F4F6]">
                  Усложнённая экономика XP (КД карточки 3 мин):
                </span>
                <span>
                  Закрытие ошибки/сложной:{' '}
                  <strong className="text-amber-600 dark:text-amber-300">
                    +8 XP
                  </strong>
                </span>
                <span>
                  Карточка легко/хорошо:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    +5 / +4 XP
                  </strong>
                </span>
                <span>
                  Сложно / Не помню:{' '}
                  <strong className="text-sky-600 dark:text-sky-400">
                    +2 / +1 XP
                  </strong>
                </span>
                <span>
                  Решённая задача:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    +12 XP
                  </strong>
                </span>
                <span>
                  Блиц-тест (от 60%):{' '}
                  <strong className="text-amber-600 dark:text-amber-300">
                    до +10 XP
                  </strong>
                </span>
                <span>
                  Раунд «Найди ложь»:{' '}
                  <strong className="text-rose-600 dark:text-rose-400">
                    +5 XP
                  </strong>
                </span>
                <span>
                  1 мин Фокуса:{' '}
                  <strong className="text-sky-600 dark:text-sky-400">
                    +1 XP
                  </strong>
                </span>
              </div>

              {/* Rewards Catalog */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-950 dark:text-[#F3F4F6]">
                    Этапы-допуски и магазин отдыха ({sortedRewards.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {rewardState.rewards.length < DEFAULT_REWARDS.length && (
                      <button
                        type="button"
                        onClick={onRestoreDefaults}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:text-[#94A3B8] dark:hover:text-white cursor-pointer"
                      >
                        Вернуть стандартные
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAddOpen((v) => !v)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full prism-tool-btn text-slate-800 dark:text-[#E5E7EB] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 text-sky-500" />
                      <span>Своя награда</span>
                    </button>
                  </div>
                </div>

                {/* Add Custom Reward Form */}
                {addOpen && (
                  <form
                    onSubmit={handleCreateCustom}
                    className="rounded-xl border border-sky-300 dark:border-sky-800/70 bg-sky-50/50 dark:bg-sky-950/20 p-4 grid sm:grid-cols-[1fr_100px_100px_auto] gap-2.5 items-end"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
                        Что разрешить себе?
                      </label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Например: 2 катки в CS2 или какао с булочкой"
                        required
                        className="w-full rounded-lg border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0B101B] px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
                        Цена (XP)
                      </label>
                      <input
                        type="number"
                        min={20}
                        max={3000}
                        value={newCost}
                        onChange={(e) => setNewCost(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0B101B] px-2.5 py-2 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1">
                        Минут отдыха
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={300}
                        value={newMinutes}
                        onChange={(e) => setNewMinutes(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0B101B] px-2.5 py-2 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={newIcon}
                        onChange={(e) =>
                          setNewIcon(e.target.value as RewardItem['icon'])
                        }
                        className="rounded-lg border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0B101B] px-2 py-2 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="dota">Игра</option>
                        <option value="coffee">Чай/Кофе</option>
                        <option value="movie">Сериал</option>
                        <option value="food">Вкусняшка</option>
                        <option value="party">Пати</option>
                      </select>
                      <button
                        type="submit"
                        className="px-3.5 py-2 text-xs font-semibold rounded-lg prism-cta cursor-pointer"
                      >
                        Добавить
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                  {sortedRewards.map((reward) => {
                    const canAfford = rewardState.balanceXp >= reward.costXp;
                    const pct = Math.min(
                      100,
                      Math.round(
                        (rewardState.balanceXp / Math.max(1, reward.costXp)) *
                          100,
                      ),
                    );
                    const redeemedToday = rewardState.redeemedTodayIds.includes(
                      reward.id,
                    );

                    return (
                      <div
                        key={reward.id}
                        className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                          canAfford
                            ? 'border-emerald-400/80 dark:border-emerald-700/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                            : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1522]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                                canAfford
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-[#131B2B] text-slate-500 dark:text-[#94A3B8]'
                              }`}
                            >
                              <RewardIcon kind={reward.icon} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-950 dark:text-[#F3F4F6] leading-snug">
                                {reward.title}
                              </h4>
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-[#94A3B8]">
                                {reward.subtitle} · {reward.breakMinutes} мин
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold tabular-nums ${
                                canAfford
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 dark:bg-[#131B2B] text-slate-700 dark:text-[#D1D5DB]'
                              }`}
                            >
                              {reward.costXp} XP
                            </span>
                            {reward.isCustom && (
                              <button
                                type="button"
                                onClick={() => onDeleteReward(reward.id)}
                                title="Удалить свою награду"
                                className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress or Claim Button */}
                        {canAfford ? (
                          <button
                            type="button"
                            onClick={() => onClaimReward(reward)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                            <span>
                              {redeemedToday
                                ? 'Забрать допуск ещё раз'
                                : 'Разрешено! Забрать допуск и идти отдыхать'}
                            </span>
                          </button>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8]">
                              <span className="inline-flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Ещё не открыто
                              </span>
                              <span className="font-mono tabular-nums">
                                {rewardState.balanceXp}/{reward.costXp} XP
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#131B2B] overflow-hidden">
                              <div
                                className="h-full bg-sky-500/80 transition-all duration-300"
                                style={{width: `${pct}%`}}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Tab 2: Hall of 52 Winter Session Achievements */
            <div className="space-y-4">
              {/* Top Filter & Claim All Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      {id: 'all', label: `Все (${sessionAchievements.length})`},
                      {id: 'theory', label: 'Теория и память (10)'},
                      {id: 'sm2_streaks', label: 'Серии и SM-2 (8)'},
                      {id: 'practice', label: 'Практика и ФН-12 (10)'},
                      {id: 'blitz_arena', label: 'Блиц и арена (6)'},
                      {id: 'winter_focus', label: 'Зимний режим и фокус (8)'},
                      {id: 'notes_arsenal', label: 'Конспекты и база (4)'},
                      {id: 'baumanka_boss', label: 'Боссы Бауманки (6)'},
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAchCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                        achCategoryFilter === cat.id
                          ? 'prism-tab-active text-slate-950 dark:text-white'
                          : 'prism-tool-btn text-slate-600 dark:text-[#CBD5E1]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {claimableAchievements.length > 1 && (
                  <button
                    type="button"
                    onClick={handleClaimAll}
                    className="prism-cta inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>
                      Забрать все открытые награды (+{claimableTotalXp} XP)
                    </span>
                  </button>
                )}
              </div>

              {/* 52 Achievements Grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredAchievements.map((ach) => {
                  const isClaimed = claimedSet.has(ach.id);
                  const isCompleted = ach.current >= ach.target || isClaimed;
                  const canClaim = ach.current >= ach.target && !isClaimed;
                  const displayCurrent = Math.min(ach.target, ach.current);
                  const pct = Math.min(
                    100,
                    Math.round((displayCurrent / Math.max(1, ach.target)) * 100),
                  );

                  return (
                    <div
                      key={ach.id}
                      className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                        canClaim
                          ? 'rainbow-mastered-card'
                          : isClaimed
                            ? 'border-emerald-400/50 dark:border-emerald-500/35 bg-emerald-50/30 dark:bg-emerald-950/15'
                            : 'border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0E1522]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              canClaim
                                ? 'bg-amber-500/20 border-amber-400/50 text-amber-600 dark:text-amber-300'
                                : isClaimed
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-[#131B2B] border-slate-200/70 dark:border-white/[0.07] text-slate-500 dark:text-[#94A3B8]'
                            }`}
                          >
                            <SessionAchievementIcon kind={ach.icon} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                              {ach.categoryLabel}
                            </span>
                            <h4 className="text-sm font-bold text-slate-950 dark:text-[#F8FAFC] leading-snug">
                              {ach.title}
                            </h4>
                            <p className="mt-0.5 text-xs text-slate-600 dark:text-[#9CA3AF] leading-relaxed">
                              {ach.description}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold tabular-nums shrink-0 ${
                            isClaimed
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : canClaim
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-100 dark:bg-[#131B2B] text-slate-700 dark:text-[#CBD5E1]'
                          }`}
                        >
                          +{ach.rewardXp} XP
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-[#94A3B8]">
                          <span>
                            Прогресс: {displayCurrent} / {ach.target}{' '}
                            {ach.unitLabel}
                          </span>
                          <span>{pct}%</span>
                        </div>

                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#131B2B] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isCompleted
                                ? 'prism-progress-fill'
                                : 'bg-cyan-500/75'
                            }`}
                            style={{width: `${pct}%`}}
                          />
                        </div>

                        {canClaim ? (
                          <button
                            type="button"
                            onClick={() =>
                              onClaimAchievement(ach.id, ach.rewardXp)
                            }
                            className="w-full prism-cta inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            <span>Забрать +{ach.rewardXp} XP</span>
                          </button>
                        ) : isClaimed ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Бонус +{ach.rewardXp} XP получен</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
