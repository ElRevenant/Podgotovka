import {
  AchievementCounters,
  AchievementDefinition,
  AchievementSystemState,
  CardSRState,
  DailyActivityMap,
  QuizStats,
  TaskMasteryStatus,
} from '../types/study';
import {EXAM_QUESTIONS, MATAN_QUESTIONS, RK_QUESTIONS} from '../data';
import {computeActivityStreaks, STORAGE_KEYS} from './cardHelpers';
import {getCardMasteryPercent} from './spacedRepetition';

export const DEFAULT_ACHIEVEMENT_COUNTERS: AchievementCounters = {
  easyStreak: 0,
  bestEasyStreak: 0,
  goodOrEasyStreak: 0,
  bestGoodOrEasyStreak: 0,
  totalReviews: 0,
  spotTheLieWins: 0,
  nightStudyCount: 0,
};

export function createDefaultAchievementState(): AchievementSystemState {
  return {
    unlocked: {},
    counters: {...DEFAULT_ACHIEVEMENT_COUNTERS},
  };
}

export const ACHIEVEMENTS_CATALOG: AchievementDefinition[] = [
  {
    id: 'first_step',
    title: 'Первый шаг',
    description: 'Оценил первую карточку по алгоритму интервального повторения SM-2.',
    category: 'mastery',
    rarity: 'common',
    rewardXp: 8,
    target: 1,
    unitLabel: 'повтор.',
    icon: 'sparkles',
  },
  {
    id: 'reviews_25',
    title: 'Разгон нейронов',
    description: 'Выполнил 25 повторений карточек.',
    category: 'mastery',
    rarity: 'common',
    rewardXp: 15,
    target: 25,
    unitLabel: 'повтор.',
    icon: 'brain',
  },
  {
    id: 'reviews_100',
    title: 'Сотня повторений',
    description: 'Выполнил 100 повторений карточек по системе SM-2.',
    category: 'mastery',
    rarity: 'rare',
    rewardXp: 30,
    target: 100,
    unitLabel: 'повтор.',
    icon: 'brain',
  },
  {
    id: 'reviews_300',
    title: 'Железный синапс',
    description: 'Выполнил 300 повторений карточек.',
    category: 'mastery',
    rarity: 'epic',
    rewardXp: 55,
    target: 300,
    unitLabel: 'повтор.',
    icon: 'trophy',
  },
  {
    id: 'reviews_750',
    title: 'Машина интервальной памяти',
    description: 'Выполнил 750 повторений карточек.',
    category: 'mastery',
    rarity: 'legendary',
    rewardXp: 95,
    target: 750,
    unitLabel: 'повтор.',
    icon: 'trophy',
  },
  {
    id: 'easy_streak_5',
    title: 'На одном дыхании',
    description: 'Изучил 5 карточек подряд на оценку «Легко».',
    category: 'streak',
    rarity: 'common',
    rewardXp: 15,
    target: 5,
    unitLabel: 'подряд',
    icon: 'zap',
  },
  {
    id: 'easy_streak_10',
    title: 'Без единой осечки',
    description: 'Изучил 10 карточек подряд на оценку «Легко».',
    category: 'streak',
    rarity: 'rare',
    rewardXp: 35,
    target: 10,
    unitLabel: 'подряд',
    icon: 'star',
  },
  {
    id: 'easy_streak_20',
    title: 'Кристальная ясность',
    description: 'Изучил 20 карточек подряд на оценку «Легко».',
    category: 'streak',
    rarity: 'epic',
    rewardXp: 65,
    target: 20,
    unitLabel: 'подряд',
    icon: 'sparkles',
  },
  {
    id: 'flow_streak_15',
    title: 'Уверенный темп',
    description: 'Ответил на 15 карточек подряд на «Хорошо» или «Легко».',
    category: 'streak',
    rarity: 'common',
    rewardXp: 20,
    target: 15,
    unitLabel: 'подряд',
    icon: 'brain',
  },
  {
    id: 'flow_streak_20',
    title: 'В потоке',
    description: 'Ответил на 20 карточек подряд на «Хорошо» или «Легко».',
    category: 'streak',
    rarity: 'rare',
    rewardXp: 40,
    target: 20,
    unitLabel: 'подряд',
    icon: 'brain',
  },
  {
    id: 'flow_streak_40',
    title: 'Сверхпроводник знаний',
    description: 'Ответил на 40 карточек подряд без оценок «Не помню» и «Сложно».',
    category: 'streak',
    rarity: 'legendary',
    rewardXp: 85,
    target: 40,
    unitLabel: 'подряд',
    icon: 'zap',
  },
  {
    id: 'daily_goal_done',
    title: 'Норма дня выполнена',
    description: 'Достиг дневной цели по карточкам и решённым задачам.',
    category: 'streak',
    rarity: 'common',
    rewardXp: 20,
    target: 1,
    unitLabel: 'цель',
    icon: 'target',
  },
  {
    id: 'streak_3_days',
    title: 'Ритм пойман',
    description: 'Занимаешься 3 дня подряд без пропусков.',
    category: 'streak',
    rarity: 'common',
    rewardXp: 25,
    target: 3,
    unitLabel: 'дн.',
    icon: 'flame',
  },
  {
    id: 'streak_5_days',
    title: 'Рабочая пятидневка',
    description: 'Занимаешься 5 дней подряд без пропусков.',
    category: 'streak',
    rarity: 'rare',
    rewardXp: 40,
    target: 5,
    unitLabel: 'дн.',
    icon: 'flame',
  },
  {
    id: 'streak_7_days',
    title: 'Железная дисциплина',
    description: 'Занимаешься 7 дней без пропусков.',
    category: 'streak',
    rarity: 'epic',
    rewardXp: 65,
    target: 7,
    unitLabel: 'дн.',
    icon: 'flame',
  },
  {
    id: 'streak_14_days',
    title: 'Двухнедельный марафон',
    description: 'Занимаешься 14 дней подряд без единого пропуска.',
    category: 'streak',
    rarity: 'legendary',
    rewardXp: 110,
    target: 14,
    unitLabel: 'дн.',
    icon: 'trophy',
  },
  {
    id: 'mastered_10',
    title: 'Первая десятка',
    description: 'Выучил 10 карточек до статуса «Знаю».',
    category: 'mastery',
    rarity: 'common',
    rewardXp: 15,
    target: 10,
    unitLabel: 'карт.',
    icon: 'award',
  },
  {
    id: 'mastered_25',
    title: 'Уверенный фундамент',
    description: 'Выучил 25 карточек до статуса «Знаю».',
    category: 'mastery',
    rarity: 'rare',
    rewardXp: 30,
    target: 25,
    unitLabel: 'карт.',
    icon: 'award',
  },
  {
    id: 'mastered_50',
    title: 'Полсотни билетов',
    description: 'Выучил 50 карточек до статуса «Знаю».',
    category: 'mastery',
    rarity: 'rare',
    rewardXp: 45,
    target: 50,
    unitLabel: 'карт.',
    icon: 'award',
  },
  {
    id: 'mastered_75',
    title: 'Энциклопедист',
    description: 'Выучил 75 карточек по всем предметам.',
    category: 'mastery',
    rarity: 'epic',
    rewardXp: 70,
    target: 75,
    unitLabel: 'карт.',
    icon: 'trophy',
  },
  {
    id: 'mastered_120',
    title: 'Гроссмейстер теории',
    description: 'Выучил 120 карточек по всем предметам.',
    category: 'mastery',
    rarity: 'legendary',
    rewardXp: 100,
    target: 120,
    unitLabel: 'карт.',
    icon: 'trophy',
  },
  {
    id: 'rainbow_master_10',
    title: 'Радужное мастерство (I)',
    description: 'Довёл 10 карточек до идеального уровня 95%+.',
    category: 'mastery',
    rarity: 'rare',
    rewardXp: 45,
    target: 10,
    unitLabel: 'карт.',
    icon: 'sparkles',
  },
  {
    id: 'rainbow_master_30',
    title: 'Радужное мастерство (II)',
    description: 'Довёл 30 карточек до идеального уровня 95%+.',
    category: 'mastery',
    rarity: 'epic',
    rewardXp: 80,
    target: 30,
    unitLabel: 'карт.',
    icon: 'sparkles',
  },
  {
    id: 'rainbow_master_60',
    title: 'Хрустальный архив 95%+',
    description: 'Довёл 60 карточек до идеального уровня 95%+.',
    category: 'mastery',
    rarity: 'legendary',
    rewardXp: 120,
    target: 60,
    unitLabel: 'карт.',
    icon: 'sparkles',
  },
  {
    id: 'tasks_5',
    title: 'Первые расчёты',
    description: 'Решил 5 практических задач без подсказок.',
    category: 'practice',
    rarity: 'common',
    rewardXp: 20,
    target: 5,
    unitLabel: 'задач',
    icon: 'check',
  },
  {
    id: 'tasks_10',
    title: 'Практик',
    description: 'Решил 10 практических задач без подсказок.',
    category: 'practice',
    rarity: 'rare',
    rewardXp: 35,
    target: 10,
    unitLabel: 'задач',
    icon: 'check',
  },
  {
    id: 'tasks_25',
    title: 'Инженер ФН-12',
    description: 'Решил 25 практических задач без подсказок.',
    category: 'practice',
    rarity: 'epic',
    rewardXp: 65,
    target: 25,
    unitLabel: 'задач',
    icon: 'check',
  },
  {
    id: 'tasks_45',
    title: 'Покоритель вариантов 20-08',
    description: 'Решил 45 практических задач без подсказок.',
    category: 'practice',
    rarity: 'legendary',
    rewardXp: 105,
    target: 45,
    unitLabel: 'задач',
    icon: 'trophy',
  },
  {
    id: 'spot_lie_3',
    title: 'Критический взгляд',
    description: 'Разоблачил 3 математические уловки в тренажёре «Найди ложь».',
    category: 'practice',
    rarity: 'common',
    rewardXp: 20,
    target: 3,
    unitLabel: 'раунд.',
    icon: 'target',
  },
  {
    id: 'spot_lie_10',
    title: 'Детектор софизмов',
    description: 'Разоблачил 10 ложных утверждений в тренажёре «Найди ложь».',
    category: 'practice',
    rarity: 'rare',
    rewardXp: 40,
    target: 10,
    unitLabel: 'раунд.',
    icon: 'target',
  },
  {
    id: 'spot_lie_25',
    title: 'Инквизитор ошибок',
    description: 'Разоблачил 25 ложных утверждений в тренажёре «Найди ложь».',
    category: 'practice',
    rarity: 'epic',
    rewardXp: 70,
    target: 25,
    unitLabel: 'раунд.',
    icon: 'star',
  },
  {
    id: 'quiz_ace',
    title: 'Снайпер блиц-теста',
    description: 'Набрал 90% или выше в прохождении блиц-теста.',
    category: 'practice',
    rarity: 'rare',
    rewardXp: 35,
    target: 90,
    unitLabel: '%',
    icon: 'target',
  },
  {
    id: 'focus_60',
    title: 'Час глубокого фокуса',
    description: 'Провёл суммарно 60 минут в таймере фокуса.',
    category: 'practice',
    rarity: 'rare',
    rewardXp: 30,
    target: 60,
    unitLabel: 'мин',
    icon: 'clock',
  },
  {
    id: 'focus_240',
    title: 'Четыре часа концентрации',
    description: 'Провёл суммарно 240 минут в таймере фокуса.',
    category: 'practice',
    rarity: 'epic',
    rewardXp: 65,
    target: 240,
    unitLabel: 'мин',
    icon: 'clock',
  },
  {
    id: 'all_subjects',
    title: 'Полимат',
    description: 'Повторил хотя бы по одной карточке во всех 3 предметах: Ангем, АИП и Матан.',
    category: 'special',
    rarity: 'rare',
    rewardXp: 40,
    target: 3,
    unitLabel: 'предм.',
    icon: 'layers',
  },
  {
    id: 'night_owl',
    title: 'Ночная подготовка',
    description: 'Повторил карточку в позднее время (с 23:00 до 05:00).',
    category: 'special',
    rarity: 'common',
    rewardXp: 15,
    target: 1,
    unitLabel: 'сессия',
    icon: 'moon',
  },
];

export function sanitizeAchievementState(
  raw: Partial<AchievementSystemState> | null | undefined,
): AchievementSystemState {
  if (!raw || typeof raw !== 'object') {
    return createDefaultAchievementState();
  }
  const unlocked: Record<string, number> = {};
  if (raw.unlocked && typeof raw.unlocked === 'object') {
    for (const [k, v] of Object.entries(raw.unlocked)) {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
        unlocked[k] = v;
      }
    }
  }
  const c = (raw.counters ?? {}) as Partial<AchievementCounters>;
  return {
    unlocked,
    counters: {
      easyStreak: Math.max(0, Number(c.easyStreak) || 0),
      bestEasyStreak: Math.max(0, Number(c.bestEasyStreak) || 0),
      goodOrEasyStreak: Math.max(0, Number(c.goodOrEasyStreak) || 0),
      bestGoodOrEasyStreak: Math.max(0, Number(c.bestGoodOrEasyStreak) || 0),
      totalReviews: Math.max(0, Number(c.totalReviews) || 0),
      spotTheLieWins: Math.max(0, Number(c.spotTheLieWins) || 0),
      nightStudyCount: Math.max(0, Number(c.nightStudyCount) || 0),
    },
  };
}

export function loadAchievementState(): {
  state: AchievementSystemState;
  hadSavedRecord: boolean;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (!raw) {
      return {state: createDefaultAchievementState(), hadSavedRecord: false};
    }
    return {
      state: sanitizeAchievementState(
        JSON.parse(raw) as Partial<AchievementSystemState>,
      ),
      hadSavedRecord: true,
    };
  } catch {
    return {state: createDefaultAchievementState(), hadSavedRecord: false};
  }
}

export interface AchievementEvalSnapshot {
  srMap: Record<number, CardSRState>;
  taskMastery: Record<string, TaskMasteryStatus>;
  activityLog: DailyActivityMap;
  dailyGoal: number;
  quizStats: QuizStats;
  counters: AchievementCounters;
}

const RK_IDS = new Set(RK_QUESTIONS.map((c) => c.id));
const EXAM_IDS = new Set(EXAM_QUESTIONS.map((c) => c.id));
const MATAN_IDS = new Set(MATAN_QUESTIONS.map((c) => c.id));

export interface AchievementProgressItem {
  definition: AchievementDefinition;
  current: number;
  target: number;
  percent: number;
  isUnlocked: boolean;
  unlockedAt?: number;
}

export function computeAchievementMetrics(snapshot: AchievementEvalSnapshot) {
  const {srMap, taskMastery, activityLog, dailyGoal, quizStats, counters} =
    snapshot;

  let knownCards = 0;
  let rainbowCards = 0;
  let reviewedCardsInSr = 0;
  let touchedRk = false;
  let touchedExam = false;
  let touchedMatan = false;

  for (const [idStr, sr] of Object.entries(srMap)) {
    const id = Number(idStr);
    if (sr.status !== 'unseen' || sr.lastGrade) {
      reviewedCardsInSr++;
      if (RK_IDS.has(id)) touchedRk = true;
      if (EXAM_IDS.has(id)) touchedExam = true;
      if (MATAN_IDS.has(id)) touchedMatan = true;
    }
    if (sr.status === 'known') knownCards++;
    if (getCardMasteryPercent(sr) >= 95) rainbowCards++;
  }

  let solvedTasks = 0;
  for (const status of Object.values(taskMastery)) {
    if (status === 'solved') solvedTasks++;
  }

  const streaks = computeActivityStreaks(activityLog, dailyGoal);
  const subjectsTouched =
    (touchedRk ? 1 : 0) + (touchedExam ? 1 : 0) + (touchedMatan ? 1 : 0);

  return {
    totalReviews: Math.max(counters.totalReviews, reviewedCardsInSr),
    bestEasyStreak: counters.bestEasyStreak,
    easyStreak: counters.easyStreak,
    bestGoodOrEasyStreak: counters.bestGoodOrEasyStreak,
    goodOrEasyStreak: counters.goodOrEasyStreak,
    dailyGoalHit: streaks.todayTotal >= Math.max(1, dailyGoal) ? 1 : 0,
    todayTotal: streaks.todayTotal,
    dailyGoal: Math.max(1, dailyGoal),
    bestDayStreak: Math.max(streaks.currentStreak, streaks.bestStreak),
    currentDayStreak: streaks.currentStreak,
    knownCards,
    rainbowCards,
    solvedTasks,
    bestQuizPct: quizStats.bestScorePct,
    totalFocusMinutes: streaks.totalFocusMinutes,
    subjectsTouched,
    nightStudyCount: counters.nightStudyCount,
    spotTheLieWins: counters.spotTheLieWins,
  };
}

export function getAchievementCurrentValue(
  id: string,
  metrics: ReturnType<typeof computeAchievementMetrics>,
): number {
  switch (id) {
    case 'first_step':
    case 'reviews_25':
    case 'reviews_100':
    case 'reviews_300':
    case 'reviews_750':
      return metrics.totalReviews;
    case 'easy_streak_5':
    case 'easy_streak_10':
    case 'easy_streak_20':
      return metrics.bestEasyStreak;
    case 'flow_streak_15':
    case 'flow_streak_20':
    case 'flow_streak_40':
      return metrics.bestGoodOrEasyStreak;
    case 'daily_goal_done':
      return metrics.dailyGoalHit;
    case 'streak_3_days':
    case 'streak_5_days':
    case 'streak_7_days':
    case 'streak_14_days':
      return metrics.bestDayStreak;
    case 'mastered_10':
    case 'mastered_25':
    case 'mastered_50':
    case 'mastered_75':
    case 'mastered_120':
      return metrics.knownCards;
    case 'rainbow_master_10':
    case 'rainbow_master_30':
    case 'rainbow_master_60':
      return metrics.rainbowCards;
    case 'tasks_5':
    case 'tasks_10':
    case 'tasks_25':
    case 'tasks_45':
      return metrics.solvedTasks;
    case 'spot_lie_3':
    case 'spot_lie_10':
    case 'spot_lie_25':
      return metrics.spotTheLieWins;
    case 'quiz_ace':
      return metrics.bestQuizPct;
    case 'focus_60':
    case 'focus_240':
      return metrics.totalFocusMinutes;
    case 'all_subjects':
      return metrics.subjectsTouched;
    case 'night_owl':
      return metrics.nightStudyCount;
    default:
      return 0;
  }
}

export function evaluateAchievements(
  state: AchievementSystemState,
  snapshot: AchievementEvalSnapshot,
  now = Date.now(),
): {
  nextUnlocked: Record<string, number>;
  newlyUnlocked: AchievementDefinition[];
} {
  const metrics = computeAchievementMetrics(snapshot);
  const newlyUnlocked: AchievementDefinition[] = [];
  let changed = false;
  const nextUnlocked: Record<string, number> = {...state.unlocked};

  for (const def of ACHIEVEMENTS_CATALOG) {
    if (nextUnlocked[def.id]) continue;
    const current = getAchievementCurrentValue(def.id, metrics);
    if (current >= def.target) {
      nextUnlocked[def.id] = now;
      newlyUnlocked.push(def);
      changed = true;
    }
  }

  return {
    nextUnlocked: changed ? nextUnlocked : state.unlocked,
    newlyUnlocked,
  };
}

export function getAchievementProgressList(
  state: AchievementSystemState,
  snapshot: AchievementEvalSnapshot,
): AchievementProgressItem[] {
  const metrics = computeAchievementMetrics(snapshot);
  return ACHIEVEMENTS_CATALOG.map((definition) => {
    const unlockedAt = state.unlocked[definition.id];
    const isUnlocked = Boolean(unlockedAt);
    const rawCurrent = getAchievementCurrentValue(definition.id, metrics);
    const current = isUnlocked
      ? Math.max(rawCurrent, definition.target)
      : Math.min(rawCurrent, definition.target);
    const percent = Math.min(
      100,
      Math.round((current / Math.max(1, definition.target)) * 100),
    );
    return {
      definition,
      current,
      target: definition.target,
      percent,
      isUnlocked,
      unlockedAt,
    };
  });
}
