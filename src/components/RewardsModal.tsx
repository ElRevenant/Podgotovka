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

export const SESSION_ACHIEVEMENTS_TOTAL = 136;

export type SessionAchievementCategory =
  | 'all'
  | 'theory'
  | 'subjects'
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
  const canBuyFreeze = rewardState.balanceXp >= 250 && streakFreezesCount < 3;

  const claimedSet = useMemo(
    () => new Set(rewardState.claimedAchievementIds ?? []),
    [rewardState.claimedAchievementIds],
  );

  // Compute all 136 Winter Session Hall of Achievements across 8 categories
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
    let cppBookKnown = 0;
    for (const [idStr, s] of allEntries) {
      if (s.status !== 'known') continue;
      const id = Number(idStr);
      if (id >= 501 && id <= 549) matanTheoremsKnown++;
      if (id >= 501 && id <= 650) matanAnyKnown++;
      if (id >= 201 && id <= 350) rkAnyKnown++;
      if (id >= 1 && id <= 150) aipAnyKnown++;
      if (id >= 63 && id <= 90) cppBookKnown++;
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
    const deckLen = Math.max(1, activeCategoryCards.length);
    const tenPctDeckTarget = Math.max(1, Math.ceil(deckLen * 0.1));
    const quarterDeckTarget = Math.max(1, Math.ceil(deckLen * 0.25));
    const halfDeckTarget = Math.max(1, Math.ceil(deckLen * 0.5));
    const threeQuarterDeckTarget = Math.max(1, Math.ceil(deckLen * 0.75));
    const fullDeckTarget = deckLen;

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
    const activeTasksLen = Math.max(2, activeCategoryTasks.length);
    const quarterTasksTarget = Math.max(1, Math.ceil(activeTasksLen * 0.25));
    const halfTasksTarget = Math.max(1, Math.ceil(activeTasksLen * 0.5));
    const fullTasksTarget = activeTasksLen;
    const activeTasksProgress =
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
    const totalQuizQuestions = quizStats.totalQuestionsAnswered || 0;

    const mk = (
      id: string,
      title: string,
      description: string,
      category: Exclude<SessionAchievementCategory, 'all'>,
      categoryLabel: string,
      rewardXp: number,
      current: number,
      target: number,
      unitLabel: string,
      icon: SessionAchievementItem['icon'],
    ): SessionAchievementItem => ({
      id,
      title,
      description,
      category,
      categoryLabel,
      rewardXp,
      current,
      target,
      unitLabel,
      icon,
    });

    const T = 'Теория и память';
    const SUB = 'Предметы';
    const SM = 'Серии и SM-2';
    const PR = 'Практика и ФН-12';
    const BL = 'Блиц и арена';
    const WF = 'Зимний режим и фокус';
    const NT = 'Конспекты и база';
    const BS = 'Боссы Бауманки';

    return [
      // ==================== 1 · ТЕОРИЯ И ПАМЯТЬ (20) ====================
      mk('ach_theory_1', 'Первая выученная карточка', 'Довести первую карточку до статуса «Выучено»', 'theory', T, 5, totalKnownAll, 1, 'карт.', 'snow'),
      mk('ach_first_snow', 'Первый след на снегу', 'Выучить (статус «Выучено») первые 5 карточек теории', 'theory', T, 8, totalKnownAll, 5, 'карт.', 'snow'),
      mk('ach_theory_10', 'Уверенная десятка', 'Выучить 10 карточек теории по любым предметам', 'theory', T, 10, totalKnownAll, 10, 'карт.', 'snow'),
      mk('ach_theory_15', 'Конспект первокурсника', 'Довести 15 карточек теории до статуса «Выучено»', 'theory', T, 12, totalKnownAll, 15, 'карт.', 'snow'),
      mk('ach_theory_20', 'Двадцатка знаний', 'Выучить 20 карточек теории по любым предметам', 'theory', T, 15, totalKnownAll, 20, 'карт.', 'layers'),
      mk('ach_theory_30', 'База фундамента', 'Выучить 30 карточек теории по любым предметам', 'theory', T, 18, totalKnownAll, 30, 'карт.', 'layers'),
      mk('ach_theory_45', 'Устойчивый каркас', 'Выучить 45 карточек теории по всем предметам', 'theory', T, 24, totalKnownAll, 45, 'карт.', 'layers'),
      mk('ach_theory_60', 'Архивариус лекций', 'Выучить суммарно 60 карточек по всем предметам сессии', 'theory', T, 30, totalKnownAll, 60, 'карт.', 'layers'),
      mk('ach_theory_80', 'Восемьдесят билетов', 'Выучить суммарно 80 карточек теории', 'theory', T, 36, totalKnownAll, 80, 'карт.', 'crystal'),
      mk('ach_theory_100', 'Сто теорем в голове', 'Выучить суммарно 100 карточек теории по всем предметам', 'theory', T, 45, totalKnownAll, 100, 'карт.', 'crystal'),
      mk('ach_theory_125', 'Большая библиотека', 'Выучить суммарно 125 карточек теории', 'theory', T, 52, totalKnownAll, 125, 'карт.', 'crystal'),
      mk('ach_theory_150', 'Ходячий учебник ФН-12', 'Выучить суммарно 150 карточек теории и определений', 'theory', T, 60, totalKnownAll, 150, 'карт.', 'automat'),
      mk('ach_theory_180', 'Хранитель курса (180)', 'Выучить суммарно 180 карточек теории', 'theory', T, 68, totalKnownAll, 180, 'карт.', 'automat'),
      mk('ach_theory_220', 'Академик 1 семестра (220)', 'Выучить суммарно 220 карточек теории', 'theory', T, 78, totalKnownAll, 220, 'карт.', 'automat'),
      mk('ach_theory_275', 'Полный свод знаний (275)', 'Выучить суммарно 275 карточек по всем предметам', 'theory', T, 90, totalKnownAll, 275, 'карт.', 'automat'),
      mk('ach_deck_10', 'Разведка колоды (10%)', 'Выучить не менее 10% карточек активного предмета', 'theory', T, 8, activeDeckKnown, tenPctDeckTarget, 'карт.', 'snow'),
      mk('ach_deck_quarter', 'Четверть дистанции', 'Выучить не менее 25% карточек активного предмета', 'theory', T, 15, activeDeckKnown, quarterDeckTarget, 'карт.', 'layers'),
      mk('ach_deck_half', 'Экватор колоды', 'Выучить не менее 50% карточек активного предмета', 'theory', T, 25, activeDeckKnown, halfDeckTarget, 'карт.', 'layers'),
      mk('ach_deck_75', 'Штурм кафедры (75% колоды)', 'Выучить не менее 75% карточек активного предмета', 'theory', T, 35, activeDeckKnown, threeQuarterDeckTarget, 'карт.', 'admitted'),
      mk('ach_deck_100', 'Идеальная колода (100%)', 'Выучить абсолютно все карточки активного предмета', 'theory', T, 65, activeDeckKnown, fullDeckTarget, 'карт.', 'automat'),

      // ==================== 2 · ПРЕДМЕТЫ: МАТАН, АНГЕМ, АИП (24) ====================
      mk('ach_matan_theorems_5', 'Матан · Первые 5 теорем', 'Выучить 5 официальных теорем Матана (№1–49)', 'subjects', SUB, 10, matanTheoremsKnown, 5, 'теорем', 'board'),
      mk('ach_matan_theorems_12', 'Матан · 12 теорем экзамена', 'Выучить 12 официальных теорем Матана (№1–49)', 'subjects', SUB, 18, matanTheoremsKnown, 12, 'теорем', 'board'),
      mk('ach_matan_theorems_25', 'Доказано на доске (25 теорем Матана)', 'Выучить 25 официальных экзаменационных теорем Матана (№1–49)', 'subjects', SUB, 38, matanTheoremsKnown, 25, 'теорем', 'admitted'),
      mk('ach_matan_theorems_38', 'Матан · 38 теорем экзамена', 'Выучить 38 официальных экзаменационных теорем Матана', 'subjects', SUB, 52, matanTheoremsKnown, 38, 'теорем', 'admitted'),
      mk('ach_matan_theorems_49', 'Матан · Все 49 теорем ФН-12', 'Выучить все 49 официальных экзаменационных вопросов Матана', 'subjects', SUB, 75, matanTheoremsKnown, 49, 'теорем', 'automat'),
      mk('ach_matan_10', 'Матан · Пределы и базы (10)', 'Выучить 10 карточек по Матану', 'subjects', SUB, 10, matanAnyKnown, 10, 'карт.', 'snow'),
      mk('ach_matan_30', 'Матан · Непрерывность (30)', 'Выучить 30 карточек по Матану', 'subjects', SUB, 22, matanAnyKnown, 30, 'карт.', 'layers'),
      mk('ach_matan_60', 'Матан · Дифференциал (60)', 'Выучить 60 карточек по Матану', 'subjects', SUB, 38, matanAnyKnown, 60, 'карт.', 'crystal'),
      mk('ach_matan_90', 'Матан · Тейлор и асимптоты (90)', 'Выучить 90 карточек по Матану', 'subjects', SUB, 54, matanAnyKnown, 90, 'карт.', 'admitted'),
      mk('ach_matan_115', 'Матан · Полный охват (115)', 'Выучить 115 карточек по Матану', 'subjects', SUB, 72, matanAnyKnown, 115, 'карт.', 'automat'),
      mk('ach_rk_5', 'Ангем · Первые векторы (5)', 'Выучить 5 карточек по Аналитической геометрии', 'subjects', SUB, 8, rkAnyKnown, 5, 'карт.', 'snow'),
      mk('ach_rk_15', 'Ангем · Базис и прямые (15)', 'Выучить 15 карточек по Ангему', 'subjects', SUB, 15, rkAnyKnown, 15, 'карт.', 'layers'),
      mk('ach_rk_30', 'Ангем · Матрицы и СЛАУ (30)', 'Выучить 30 карточек по Ангему', 'subjects', SUB, 24, rkAnyKnown, 30, 'карт.', 'layers'),
      mk('ach_rk_50', 'Ангем · РК 1 + РК 2 (50)', 'Выучить 50 карточек по Аналитической геометрии', 'subjects', SUB, 36, rkAnyKnown, 50, 'карт.', 'crystal'),
      mk('ach_rk_75', 'Ангем · Поверхности и квадрики (75)', 'Выучить 75 карточек по Ангему', 'subjects', SUB, 52, rkAnyKnown, 75, 'карт.', 'admitted'),
      mk('ach_rk_95', 'Ангем · Абсолютный базис (95)', 'Выучить 95 карточек по Аналитической геометрии', 'subjects', SUB, 68, rkAnyKnown, 95, 'карт.', 'automat'),
      mk('ach_aip_5', 'АИП · Первый компилятор (5)', 'Выучить 5 карточек по АИП и C++', 'subjects', SUB, 8, aipAnyKnown, 5, 'карт.', 'snow'),
      mk('ach_aip_15', 'АИП · Типы и циклы (15)', 'Выучить 15 карточек по АИП и C++', 'subjects', SUB, 15, aipAnyKnown, 15, 'карт.', 'layers'),
      mk('ach_aip_30', 'АИП · Указатели и функции (30)', 'Выучить 30 карточек по АИП и C++', 'subjects', SUB, 24, aipAnyKnown, 30, 'карт.', 'layers'),
      mk('ach_aip_50', 'АИП · Все 50 билетов (50)', 'Выучить 50 карточек по АИП и C++', 'subjects', SUB, 36, aipAnyKnown, 50, 'карт.', 'crystal'),
      mk('ach_aip_70', 'АИП · Структуры и списки (70)', 'Выучить 70 карточек по АИП и C++', 'subjects', SUB, 50, aipAnyKnown, 70, 'карт.', 'admitted'),
      mk('ach_aip_88', 'АИП · Мастер C++17 (88)', 'Выучить 88 карточек по АИП и учебнику C++', 'subjects', SUB, 66, aipAnyKnown, 88, 'карт.', 'automat'),
      mk('ach_cpp_book_7', 'Учебник C++ · Четверть контрольных (7)', 'Выучить 7 карточек из учебника C++ (№63–90)', 'subjects', SUB, 12, cppBookKnown, 7, 'карт.', 'board'),
      mk('ach_cpp_book_20', 'Учебник C++ · Модули РК 1–3 (20)', 'Выучить 20 карточек из учебника C++ (№63–90)', 'subjects', SUB, 30, cppBookKnown, 20, 'карт.', 'admitted'),

      // ==================== 3 · СЕРИИ И SM-2 (18) ====================
      mk('ach_box4_1', 'Первый кристалл SM-2', 'Довести первую карточку до максимальной коробки 4 (95%+)', 'sm2_streaks', SM, 6, totalBox4All, 1, 'карт.', 'crystal'),
      mk('ach_box4_5', 'Первые кристаллы (Коробка 4)', 'Довести 5 карточек до максимальной коробки 4 (мастерство 95%+)', 'sm2_streaks', SM, 14, totalBox4All, 5, 'карт.', 'crystal'),
      mk('ach_box4_10', 'Десять граней (10× Коробка 4)', 'Довести 10 карточек до максимальной коробки 4 (95%+)', 'sm2_streaks', SM, 20, totalBox4All, 10, 'карт.', 'crystal'),
      mk('ach_box4_master', 'Хрустальная память (15× Коробка 4)', 'Довести 15 карточек до максимальной коробки 4 (мастерство 95%+)', 'sm2_streaks', SM, 25, totalBox4All, 15, 'карт.', 'crystal'),
      mk('ach_box4_25', 'Кварцевая выдержка (25× Коробка 4)', 'Довести 25 карточек до максимальной коробки 4 (95%+)', 'sm2_streaks', SM, 34, totalBox4All, 25, 'карт.', 'crystal'),
      mk('ach_box4_35', 'Алмазный фонд SM-2 (35× Коробка 4)', 'Довести 35 карточек до максимальной коробки 4 (95%+)', 'sm2_streaks', SM, 42, totalBox4All, 35, 'карт.', 'crystal'),
      mk('ach_box4_50', 'Полусотня кристаллов (50× Коробка 4)', 'Довести 50 карточек до максимальной коробки 4 (95%+)', 'sm2_streaks', SM, 52, totalBox4All, 50, 'карт.', 'crystal'),
      mk('ach_box4_70', 'Абсолютный ретеншн (70× Коробка 4)', 'Довести 70 карточек до максимальной коробки 4 (95%+)', 'sm2_streaks', SM, 62, totalBox4All, 70, 'карт.', 'automat'),
      mk('ach_box4_100', 'Сто кристаллов SM-2 (100× Коробка 4)', 'Довести 100 карточек до максимальной коробки 4 (95%+)', 'sm2_streaks', SM, 75, totalBox4All, 100, 'карт.', 'automat'),
      mk('ach_box4_150', 'Вечный архив (150× Коробка 4)', 'Довести 150 карточек до максимальной коробки 4 (95%+)', 'sm2_streaks', SM, 92, totalBox4All, 150, 'карт.', 'automat'),
      mk('ach_error_1', 'Первый реванш', 'Закрыть до «Выучено» первую карточку после ошибки', 'sm2_streaks', SM, 6, totalErrorSlayerAll, 1, 'карт.', 'shield'),
      mk('ach_error_3', 'Работа над ошибками', 'Довести до «Выучено» 3 карточки, где ранее были ошибки или сбросы', 'sm2_streaks', SM, 12, totalErrorSlayerAll, 3, 'карт.', 'shield'),
      mk('ach_error_5', 'Исправление пробелов (5)', 'Закрыть до «Выучено» 5 ранее проблемных карточек', 'sm2_streaks', SM, 16, totalErrorSlayerAll, 5, 'карт.', 'shield'),
      mk('ach_error_slayer', 'Укротитель слабых мест', 'Довести до статуса «Выучено» 7 карточек, на которых ранее были ошибки', 'sm2_streaks', SM, 22, totalErrorSlayerAll, 7, 'карт.', 'shield'),
      mk('ach_error_10', 'Десять реваншей', 'Закрыть до статуса «Выучено» 10 ранее заваленных карточек', 'sm2_streaks', SM, 28, totalErrorSlayerAll, 10, 'карт.', 'shield'),
      mk('ach_error_15', 'Феникс зимней сессии', 'Закрыть до статуса «Выучено» 15 ранее заваленных карточек', 'sm2_streaks', SM, 36, totalErrorSlayerAll, 15, 'карт.', 'shield'),
      mk('ach_error_30', 'Непробиваемый иммунитет', 'Закрыть до статуса «Выучено» 30 ранее проблемных карточек', 'sm2_streaks', SM, 52, totalErrorSlayerAll, 30, 'карт.', 'shield'),
      mk('ach_error_50', 'Ноль уязвимостей (50)', 'Закрыть до статуса «Выучено» 50 ранее проблемных карточек', 'sm2_streaks', SM, 72, totalErrorSlayerAll, 50, 'карт.', 'automat'),

      // ==================== 4 · ПРАКТИКА И БИЛЕТЫ ФН-12 (18) ====================
      mk('ach_tasks_1', 'Первая задача у доски', 'Самостоятельно решить первую практическую задачу без подсказок', 'practice', PR, 8, totalSolvedAll, 1, 'задач', 'board'),
      mk('ach_tasks_3', 'Разминка у доски', 'Самостоятельно решить 3 практические задачи', 'practice', PR, 12, totalSolvedAll, 3, 'задач', 'board'),
      mk('ach_tasks_5', 'Пятёрка практических', 'Самостоятельно решить 5 практических задач', 'practice', PR, 16, totalSolvedAll, 5, 'задач', 'calc'),
      mk('ach_tasks_7', 'Семинарский зачёт', 'Самостоятельно решить 7 практических задач', 'practice', PR, 20, totalSolvedAll, 7, 'задач', 'calc'),
      mk('ach_tasks_12', 'Инженерный расчёт', 'Самостоятельно решить 12 практических задач', 'practice', PR, 26, totalSolvedAll, 12, 'задач', 'calc'),
      mk('ach_tasks_18', 'Уверенный практикум (18)', 'Самостоятельно решить 18 практических задач', 'practice', PR, 32, totalSolvedAll, 18, 'задач', 'practice'),
      mk('ach_tasks_25', 'Решебник кафедры', 'Самостоятельно решить 25 практических задач', 'practice', PR, 40, totalSolvedAll, 25, 'задач', 'practice'),
      mk('ach_tasks_35', 'Сборник решений (35)', 'Самостоятельно решить 35 практических задач', 'practice', PR, 50, totalSolvedAll, 35, 'задач', 'practice'),
      mk('ach_tasks_45', 'Гроза задачников (45 задач)', 'Самостоятельно решить 45 практических задач', 'practice', PR, 60, totalSolvedAll, 45, 'задач', 'automat'),
      mk('ach_tasks_60', 'Эксперт практики (60 задач)', 'Самостоятельно решить 60 практических задач', 'practice', PR, 72, totalSolvedAll, 60, 'задач', 'automat'),
      mk('ach_tasks_80', 'Легенда семинаров (80 задач)', 'Самостоятельно решить 80 практических задач', 'practice', PR, 88, totalSolvedAll, 80, 'задач', 'automat'),
      mk('ach_tasks_quarter', 'Четверть практикума (25%)', 'Решить не менее 25% задач активного предмета', 'practice', PR, 16, activeTasksProgress, quarterTasksTarget, 'задач', 'board'),
      mk('ach_tasks_half', 'Практик без подсказок (50%)', 'Решить самостоятельно не менее 50% задач активного предмета', 'practice', PR, 32, activeTasksProgress, halfTasksTarget, 'задач', 'practice'),
      mk('ach_tasks_all', 'Все задачи предмета (100%)', 'Решить все практические задачи активного предмета', 'practice', PR, 60, activeTasksProgress, fullTasksTarget, 'задач', 'automat'),
      mk('ach_fn12_tickets_2', 'Проба билетов ФН-12 (2)', 'Решить 2 задачи из реальных экзаменационных билетов ФН-12', 'practice', PR, 12, fn12TicketTasksSolved, 2, 'задач ФН-12', 'calc'),
      mk('ach_fn12_tickets_5', 'Покоритель билетов 20-08 (I)', 'Решить 5 задач из реальных экзаменационных билетов ФН-12 (№1–22)', 'practice', PR, 20, fn12TicketTasksSolved, 5, 'задач ФН-12', 'calc'),
      mk('ach_fn12_tickets_15', 'Покоритель билетов 20-08 (II)', 'Решить 15 задач из реальных экзаменационных билетов ФН-12 (№1–22)', 'practice', PR, 36, fn12TicketTasksSolved, 15, 'задач ФН-12', 'practice'),
      mk('ach_fn12_tickets_30', 'Магистр билетов Крищенко (30 задач)', 'Решить 30 задач из реальных экзаменационных билетов ФН-12 (20-08)', 'practice', PR, 58, fn12TicketTasksSolved, 30, 'задач ФН-12', 'automat'),

      // ==================== 5 · БЛИЦ И АРЕНА (14) ====================
      mk('ach_quiz_first', 'Боевое крещение тестом', 'Завершить свой первый блиц-тест по любому предмету', 'blitz_arena', BL, 8, totalQuizzes, 1, 'тест', 'sniper'),
      mk('ach_quiz_3_runs', 'Разогрев блиц-арены (3)', 'Пройти до конца 3 блиц-теста', 'blitz_arena', BL, 12, totalQuizzes, 3, 'тестов', 'sniper'),
      mk('ach_quiz_5_runs', 'Серийный тестировщик', 'Пройти до конца 5 блиц-тестов', 'blitz_arena', BL, 16, totalQuizzes, 5, 'тестов', 'sniper'),
      mk('ach_quiz_10_runs', 'Десятка блицев', 'Пройти до конца 10 блиц-тестов', 'blitz_arena', BL, 24, totalQuizzes, 10, 'тестов', 'sniper'),
      mk('ach_quiz_15_runs', 'Марафонец блиц-тестов', 'Пройти до конца 15 блиц-тестов', 'blitz_arena', BL, 30, totalQuizzes, 15, 'тестов', 'blitz100'),
      mk('ach_quiz_25_runs', 'Гладиатор блица (25)', 'Пройти до конца 25 блиц-тестов', 'blitz_arena', BL, 42, totalQuizzes, 25, 'тестов', 'blitz100'),
      mk('ach_quiz_50_runs', 'Чемпион арены (50)', 'Пройти до конца 50 блиц-тестов', 'blitz_arena', BL, 65, totalQuizzes, 50, 'тестов', 'automat'),
      mk('ach_quiz_65', 'Зачётный блиц (65%+)', 'Пройти блиц-тест с результатом не ниже 65%', 'blitz_arena', BL, 10, bestQuizPct, 65, '%', 'sniper'),
      mk('ach_quiz_80', 'Снайпер блиц-теста (80%+)', 'Пройти блиц-тест с результатом не ниже 80%', 'blitz_arena', BL, 18, bestQuizPct, 80, '%', 'sniper'),
      mk('ach_quiz_90', 'Ювелирная точность (90%+)', 'Пройти блиц-тест с результатом не ниже 90%', 'blitz_arena', BL, 28, bestQuizPct, 90, '%', 'sniper'),
      mk('ach_quiz_100', 'Безошибочный блиц (100%)', 'Выбить 100% правильных ответов в блиц-тесте', 'blitz_arena', BL, 42, bestQuizPct, 100, '%', 'blitz100'),
      mk('ach_quiz_q_30', '30 ответов в блице', 'Ответить суммарно на 30 вопросов в блиц-тестах', 'blitz_arena', BL, 10, totalQuizQuestions, 30, 'вопр.', 'sniper'),
      mk('ach_quiz_q_150', '150 ответов в блице', 'Ответить суммарно на 150 вопросов в блиц-тестах', 'blitz_arena', BL, 26, totalQuizQuestions, 150, 'вопр.', 'blitz100'),
      mk('ach_quiz_q_400', '400 ответов в блице', 'Ответить суммарно на 400 вопросов в блиц-тестах', 'blitz_arena', BL, 48, totalQuizQuestions, 400, 'вопр.', 'automat'),

      // ==================== 6 · ЗИМНИЙ РЕЖИМ И ФОКУС (16) ====================
      mk('ach_focus_10', 'Первые 10 минут тишины', 'Накопить первые 10 минут чистого фокуса в таймере', 'winter_focus', WF, 6, totalFocusMinutes, 10, 'мин', 'lamp'),
      mk('ach_focus_25', 'Первая помидорка (25 мин)', 'Накопить первые 25 минут чистого фокуса в таймере', 'winter_focus', WF, 10, totalFocusMinutes, 25, 'мин', 'lamp'),
      mk('ach_focus_50', 'Тёплая лампа (50 мин фокуса)', 'Накопить суммарно 50 минут чистого фокуса в Pomodoro-таймере', 'winter_focus', WF, 16, totalFocusMinutes, 50, 'мин', 'lamp'),
      mk('ach_focus_90', 'Полная пара (90 мин фокуса)', 'Накопить суммарно 90 минут чистого фокуса (как университетская пара)', 'winter_focus', WF, 22, totalFocusMinutes, 90, 'мин', 'lamp'),
      mk('ach_focus_120', 'Два часа тишины (120 мин)', 'Накопить суммарно 120 минут чистого фокуса', 'winter_focus', WF, 26, totalFocusMinutes, 120, 'мин', 'lamp'),
      mk('ach_focus_180', 'Ночной дозор (3 часа фокуса)', 'Накопить суммарно 180 минут чистого фокуса по дневнику активности', 'winter_focus', WF, 34, totalFocusMinutes, 180, 'мин', 'night'),
      mk('ach_focus_240', 'Четыре часа дзена (240 мин)', 'Накопить суммарно 240 минут чистого фокуса', 'winter_focus', WF, 42, totalFocusMinutes, 240, 'мин', 'night'),
      mk('ach_focus_360', 'Глубокое погружение (6 часов фокуса)', 'Накопить суммарно 360 минут чистого фокуса', 'winter_focus', WF, 52, totalFocusMinutes, 360, 'мин', 'night'),
      mk('ach_focus_600', 'Монах зимней сессии (10 часов фокуса)', 'Накопить суммарно 600 минут чистого фокуса за подготовку', 'winter_focus', WF, 72, totalFocusMinutes, 600, 'мин', 'automat'),
      mk('ach_focus_900', 'Пятнадцать часов потока (900 мин)', 'Накопить суммарно 900 минут чистого фокуса', 'winter_focus', WF, 88, totalFocusMinutes, 900, 'мин', 'automat'),
      mk('ach_focus_1200', 'Двадцать часов тишины (1200 мин)', 'Накопить суммарно 1200 минут чистого фокуса за сессию', 'winter_focus', WF, 105, totalFocusMinutes, 1200, 'мин', 'automat'),
      mk('ach_streak_2', 'Два дня подряд', 'Заниматься подготовкой 2 дня подряд без пропусков', 'winter_focus', WF, 10, effectiveStreak, 2, 'дн.', 'frost3'),
      mk('ach_streak_3', 'Морозная выдержка (3 дня подряд)', 'Заниматься подготовкой 3 дня подряд без пропусков', 'winter_focus', WF, 18, effectiveStreak, 3, 'дн.', 'frost3'),
      mk('ach_streak_5', 'Ударная пятидневка (5 дней подряд)', 'Заниматься подготовкой 5 дней подряд без пропусков', 'winter_focus', WF, 28, effectiveStreak, 5, 'дн.', 'frost3'),
      mk('ach_streak_7', 'Неделя без тильта (7 дней подряд)', 'Достичь серии из 7 дней подготовки подряд', 'winter_focus', WF, 40, effectiveStreak, 7, 'дн.', 'streak7'),
      mk('ach_streak_10', 'Десять дней дисциплины', 'Достичь серии из 10 дней подготовки подряд', 'winter_focus', WF, 50, effectiveStreak, 10, 'дн.', 'streak7'),

      // ==================== 7 · КОНСПЕКТЫ И СВОЯ БАЗА (10) ====================
      mk('ach_notes_1', 'Первая пометка на полях', 'Добавить собственную заметку или мнемонику к 1 карточке', 'notes_arsenal', NT, 6, notesCount, 1, 'заметок', 'note'),
      mk('ach_notes_3', 'Три подсказки себе', 'Написать собственные заметки к 3 карточкам', 'notes_arsenal', NT, 10, notesCount, 3, 'заметок', 'note'),
      mk('ach_notes_author', 'Авторские мнемоники (5 заметок)', 'Написать собственные заметки или ассоциации минимум к 5 карточкам', 'notes_arsenal', NT, 15, notesCount, 5, 'заметок', 'note'),
      mk('ach_notes_10', 'Личный словарик (10 заметок)', 'Написать собственные заметки к 10 карточкам', 'notes_arsenal', NT, 22, notesCount, 10, 'заметок', 'note'),
      mk('ach_notes_15', 'Собственный конспект (15 заметок)', 'Написать собственные заметки или шпаргалки к 15 карточкам', 'notes_arsenal', NT, 28, notesCount, 15, 'заметок', 'note'),
      mk('ach_notes_22', 'Тетрадь отличника (22 заметки)', 'Написать собственные заметки или разборы к 22 карточкам', 'notes_arsenal', NT, 36, notesCount, 22, 'заметок', 'note'),
      mk('ach_notes_30', 'Соавтор методички (30 заметок)', 'Написать собственные заметки или разборы к 30 карточкам', 'notes_arsenal', NT, 45, notesCount, 30, 'заметок', 'note'),
      mk('ach_notes_45', 'Архив шпаргалок (45 заметок)', 'Написать собственные заметки или разборы к 45 карточкам', 'notes_arsenal', NT, 58, notesCount, 45, 'заметок', 'note'),
      mk('ach_notes_60', 'Автор курса (60 заметок)', 'Написать собственные заметки к 60 карточкам', 'notes_arsenal', NT, 72, notesCount, 60, 'заметок', 'automat'),
      mk('ach_notes_80', 'Полная редакция конспекта (80)', 'Написать собственные заметки к 80 карточкам', 'notes_arsenal', NT, 90, notesCount, 80, 'заметок', 'automat'),

      // ==================== 8 · БОССЫ БАУМАНКИ (16) ====================
      mk('ach_streak_14', 'Двухнедельный штурм (14 дней подряд)', 'Держать непрерывную серию подготовки 14 дней подряд', 'baumanka_boss', BS, 60, effectiveStreak, 14, 'дн.', 'streak7'),
      mk('ach_streak_21', 'Три недели без сбоев (21 день)', 'Держать непрерывную серию подготовки 21 день подряд', 'baumanka_boss', BS, 78, effectiveStreak, 21, 'дн.', 'streak7'),
      mk('ach_streak_30', 'Месяц железной воли (30 дней)', 'Держать непрерывную серию подготовки 30 дней подряд', 'baumanka_boss', BS, 100, effectiveStreak, 30, 'дн.', 'automat'),
      mk('ach_active_days_3', 'Три учебных дня', 'Заниматься подготовкой минимум в 3 разных дня по календарю', 'baumanka_boss', BS, 10, activeStudyDays, 3, 'дн.', 'frost3'),
      mk('ach_active_days_5', 'Пять учебных дней', 'Заниматься подготовкой минимум в 5 разных дней по календарю', 'baumanka_boss', BS, 16, activeStudyDays, 5, 'дн.', 'frost3'),
      mk('ach_active_days_10', 'Декада упорства (10 учебных дней)', 'Заниматься подготовкой минимум в 10 разных дней по календарю', 'baumanka_boss', BS, 35, activeStudyDays, 10, 'дн.', 'frost3'),
      mk('ach_active_days_20', 'Двадцать дней сессии', 'Заниматься подготовкой минимум в 20 разных дней по календарю', 'baumanka_boss', BS, 55, activeStudyDays, 20, 'дн.', 'frost3'),
      mk('ach_active_days_35', 'Тридцать пять дней в строю', 'Заниматься подготовкой минимум в 35 разных дней по календарю', 'baumanka_boss', BS, 78, activeStudyDays, 35, 'дн.', 'automat'),
      mk('ach_ready_25', 'Разгон готовности (25%+)', 'Довести общую готовность активного предмета до 25% и выше', 'baumanka_boss', BS, 12, readinessPct, 25, '%', 'admitted'),
      mk('ach_ready_50', 'Зачётная книжка открыта (50%+)', 'Довести общую готовность активного предмета до 50% и выше', 'baumanka_boss', BS, 22, readinessPct, 50, '%', 'admitted'),
      mk('ach_ready_75', 'К зачёту допущен (75%+)', 'Довести общую готовность активного предмета до 75% и выше', 'baumanka_boss', BS, 36, readinessPct, 75, '%', 'admitted'),
      mk('ach_ready_95', 'Автомат до боя курантов (95%+)', 'Довести общую готовность активного предмета до 95%+', 'baumanka_boss', BS, 60, readinessPct, 95, '%', 'automat'),
      mk('ach_ready_100', 'Абсолютный максимум (100%)', 'Довести общую готовность активного предмета до 100%', 'baumanka_boss', BS, 95, readinessPct, 100, '%', 'automat'),
      mk('ach_all_3_subjects_10', 'Триумвират ИУ / ФН (3 предмета × 10)', 'Выучить минимум по 10 карточек в каждом из трёх предметов: Матан, Ангем и АИП', 'baumanka_boss', BS, 55, minKnownAcross3Subjects, 10, 'карт./предм.', 'automat'),
      mk('ach_all_3_subjects_25', 'Тройной штурм (3 предмета × 25)', 'Выучить минимум по 25 карточек в Матане, Ангеме и АИП', 'baumanka_boss', BS, 80, minKnownAcross3Subjects, 25, 'карт./предм.', 'automat'),
      mk('ach_all_3_subjects_50', 'Легенда первого курса (3 × 50)', 'Выучить минимум по 50 карточек в Матане, Ангеме и АИП', 'baumanka_boss', BS, 115, minKnownAcross3Subjects, 50, 'карт./предм.', 'automat'),
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
    quizStats.totalQuestionsAnswered,
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
                  Награды, анти-тильт и Зал из {sessionAchievements.length} достижений зимней сессии
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
                            (nextLocked.costXp - rewardState.balanceXp) / 3,
                          )}{' '}
                          карточек
                        </strong>{' '}
                        или{' '}
                        <strong className="text-slate-700 dark:text-[#D1D5DB]">
                          {Math.ceil(
                            (nextLocked.costXp - rewardState.balanceXp) / 8,
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
                      : 'Купить заморозку · 250 XP'}
                  </button>
                </div>
              </div>

              {/* How XP is Earned Strip (Harder Economy) */}
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1522] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-[#94A3B8]">
                <span className="font-semibold text-slate-900 dark:text-[#F3F4F6]">
                  Хардкорная экономика XP (КД карточки 5 мин):
                </span>
                <span>
                  Закрытие ошибки/сложной:{' '}
                  <strong className="text-amber-600 dark:text-amber-300">
                    +5 XP
                  </strong>
                </span>
                <span>
                  Карточка легко/хорошо:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    +3 / +2 XP
                  </strong>
                </span>
                <span>
                  Сложно / Не помню:{' '}
                  <strong className="text-sky-600 dark:text-sky-400">
                    +1 / 0 XP
                  </strong>
                </span>
                <span>
                  Решённая задача:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    +8 XP
                  </strong>
                </span>
                <span>
                  Блиц-тест (от 70%):{' '}
                  <strong className="text-amber-600 dark:text-amber-300">
                    до +7 XP
                  </strong>
                </span>
                <span>
                  Раунд «Найди ложь»:{' '}
                  <strong className="text-rose-600 dark:text-rose-400">
                    +3 XP
                  </strong>
                </span>
                <span>
                  2 мин Фокуса:{' '}
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
                      {id: 'all', label: 'Все'},
                      {id: 'theory', label: 'Теория и память'},
                      {id: 'subjects', label: 'Предметы'},
                      {id: 'sm2_streaks', label: 'Серии и SM-2'},
                      {id: 'practice', label: 'Практика и ФН-12'},
                      {id: 'blitz_arena', label: 'Блиц и арена'},
                      {id: 'winter_focus', label: 'Зимний режим и фокус'},
                      {id: 'notes_arsenal', label: 'Конспекты и база'},
                      {id: 'baumanka_boss', label: 'Боссы Бауманки'},
                    ] as const
                  ).map((cat) => {
                    const count =
                      cat.id === 'all'
                        ? sessionAchievements.length
                        : sessionAchievements.filter(
                            (a) => a.category === cat.id,
                          ).length;
                    return (
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
                        {cat.label} ({count})
                      </button>
                    );
                  })}
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
