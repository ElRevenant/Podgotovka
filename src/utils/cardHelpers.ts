import {
  AppPreferences,
  CardSRState,
  CustomSubject,
  DailyActivityMap,
  MasteryStatus,
  QuizStats,
  StudyCategory,
  StudyPlannerSettings,
  StudyProgressBackup,
  TaskMasteryStatus,
  TheoryCard,
} from '../types/study';
import {DEFAULT_SR_STATE} from './spacedRepetition';

export const STORAGE_KEYS = {
  THEME: 'aip_exam_theme_v1',
  CATEGORY: 'aip_exam_category_v1',
  SR_MAP: 'aip_exam_sr_v2',
  LEGACY_MASTERY: 'aip_exam_mastery_v1',
  CUSTOM_CARDS: 'aip_exam_custom_cards_v1',
  CUSTOM_SUBJECTS: 'aip_exam_custom_subjects_v1',
  QUIZ_STATS: 'aip_exam_quiz_stats_v1',
  TASK_MASTERY: 'aip_exam_task_mastery_v1',
  CARD_NOTES: 'aip_exam_card_notes_v1',
  ACTIVITY_LOG: 'aip_exam_activity_log_v1',
  PLANNER: 'aip_exam_planner_v1',
  REWARDS: 'aip_exam_rewards_v1',
  PREFERENCES: 'aip_exam_preferences_v1',
  ACHIEVEMENTS: 'aip_exam_achievements_v1',
  AUTONOMOUS_MODE: 'aip_exam_autonomous_mode_v1',
} as const;

export function getAutonomousMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTONOMOUS_MODE) === 'true';
  } catch {
    return false;
  }
}

export function setAutonomousMode(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(STORAGE_KEYS.AUTONOMOUS_MODE, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTONOMOUS_MODE);
    }
  } catch {
    // ignore storage errors
  }
}

export function getGeminiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  };
}

export function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToDateKey(daysFromToday: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysFromToday);
  return getLocalDateKey(dt);
}

export function loadInitialCategory(): StudyCategory {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORY);
    if (
      saved === 'rk' ||
      saved === 'exam' ||
      saved === 'matan' ||
      (typeof saved === 'string' && saved.startsWith('custom_'))
    ) {
      return saved as StudyCategory;
    }
  } catch {
    // ignore storage errors
  }
  return 'matan';
}

export function loadCustomSubjects(): CustomSubject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_SUBJECTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is CustomSubject =>
        Boolean(
          s &&
            typeof s.id === 'string' &&
            s.id.startsWith('custom_') &&
            typeof s.name === 'string' &&
            typeof s.shortName === 'string' &&
            Array.isArray(s.cards),
        ),
    );
  } catch {
    return [];
  }
}

export const DEFAULT_PLANNER_SETTINGS: StudyPlannerSettings = {
  examDates: {
    rk: addDaysToDateKey(7),
    exam: addDaysToDateKey(21),
    matan: addDaysToDateKey(14),
  },
  dailyGoal: 15,
  pomodoroMode: '25/5',
};

export function loadTaskMastery(): Record<string, TaskMasteryStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASK_MASTERY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: Record<string, TaskMasteryStatus> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === 'unsolved' || v === 'hint' || v === 'solved') {
        clean[k] = v;
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function loadCardNotes(): Record<number, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARD_NOTES);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: Record<number, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const id = Number(k);
      if (Number.isInteger(id) && typeof v === 'string' && v.trim()) {
        clean[id] = v;
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function loadActivityLog(): DailyActivityMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: DailyActivityMap = {};
    for (const [dateKey, val] of Object.entries(parsed)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey) && val && typeof val === 'object') {
        const entry = val as Partial<{
          reviews: number;
          tasksSolved: number;
          focusMinutes: number;
        }>;
        clean[dateKey] = {
          reviews: Math.max(0, Number(entry.reviews) || 0),
          tasksSolved: Math.max(0, Number(entry.tasksSolved) || 0),
          focusMinutes: Math.max(0, Number(entry.focusMinutes) || 0),
        };
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function loadPlannerSettings(): StudyPlannerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLANNER);
    if (!raw) return DEFAULT_PLANNER_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<StudyPlannerSettings>;
    const mergedDates: Record<string, string> = {
      ...DEFAULT_PLANNER_SETTINGS.examDates,
    };
    if (parsed.examDates && typeof parsed.examDates === 'object') {
      for (const [k, v] of Object.entries(parsed.examDates)) {
        if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
          mergedDates[k] = v;
        }
      }
    }
    return {
      examDates: mergedDates,
      dailyGoal:
        typeof parsed.dailyGoal === 'number' &&
        parsed.dailyGoal >= 5 &&
        parsed.dailyGoal <= 100
          ? Math.round(parsed.dailyGoal)
          : DEFAULT_PLANNER_SETTINGS.dailyGoal,
      pomodoroMode: parsed.pomodoroMode === '50/10' ? '50/10' : '25/5',
    };
  } catch {
    return DEFAULT_PLANNER_SETTINGS;
  }
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  snowEnabled: true,
  warmGlowEnabled: true,
  confettiEnabled: true,
  showXpInHeader: true,
  focusMinutes: 25,
  breakMinutes: 5,
  autoSaveJsonEnabled: false,
  autoSaveIntervalMinutes: 15,
};

export function sanitizeAppPreferences(
  raw: Partial<AppPreferences> | null | undefined,
): AppPreferences {
  if (!raw || typeof raw !== 'object') {
    return {...DEFAULT_APP_PREFERENCES};
  }
  const focusMinutes =
    typeof raw.focusMinutes === 'number' && Number.isFinite(raw.focusMinutes)
      ? Math.max(5, Math.min(120, Math.round(raw.focusMinutes)))
      : DEFAULT_APP_PREFERENCES.focusMinutes;
  const breakMinutes =
    typeof raw.breakMinutes === 'number' && Number.isFinite(raw.breakMinutes)
      ? Math.max(1, Math.min(45, Math.round(raw.breakMinutes)))
      : DEFAULT_APP_PREFERENCES.breakMinutes;
  const autoSaveIntervalMinutes =
    typeof raw.autoSaveIntervalMinutes === 'number' &&
    Number.isFinite(raw.autoSaveIntervalMinutes)
      ? Math.max(1, Math.min(240, Math.round(raw.autoSaveIntervalMinutes)))
      : DEFAULT_APP_PREFERENCES.autoSaveIntervalMinutes;

  return {
    snowEnabled:
      typeof raw.snowEnabled === 'boolean'
        ? raw.snowEnabled
        : DEFAULT_APP_PREFERENCES.snowEnabled,
    warmGlowEnabled:
      typeof raw.warmGlowEnabled === 'boolean'
        ? raw.warmGlowEnabled
        : DEFAULT_APP_PREFERENCES.warmGlowEnabled,
    confettiEnabled:
      typeof raw.confettiEnabled === 'boolean'
        ? raw.confettiEnabled
        : DEFAULT_APP_PREFERENCES.confettiEnabled,
    showXpInHeader:
      typeof raw.showXpInHeader === 'boolean'
        ? raw.showXpInHeader
        : DEFAULT_APP_PREFERENCES.showXpInHeader,
    focusMinutes,
    breakMinutes,
    autoSaveJsonEnabled:
      typeof raw.autoSaveJsonEnabled === 'boolean'
        ? raw.autoSaveJsonEnabled
        : DEFAULT_APP_PREFERENCES.autoSaveJsonEnabled,
    autoSaveIntervalMinutes,
    lastAutoSaveAt:
      typeof raw.lastAutoSaveAt === 'number' && Number.isFinite(raw.lastAutoSaveAt)
        ? raw.lastAutoSaveAt
        : undefined,
  };
}

export function loadAppPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!raw) {
      // Seed initial focus/break from existing plannerSettings.pomodoroMode if present
      const planner = loadPlannerSettings();
      return {
        ...DEFAULT_APP_PREFERENCES,
        focusMinutes: planner.pomodoroMode === '50/10' ? 50 : 25,
        breakMinutes: planner.pomodoroMode === '50/10' ? 10 : 5,
      };
    }
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return sanitizeAppPreferences(parsed);
  } catch {
    return {...DEFAULT_APP_PREFERENCES};
  }
}

export function computeActivityStreaks(
  activityLog: DailyActivityMap,
  dailyGoal: number,
): {
  todayTotal: number;
  currentStreak: number;
  bestStreak: number;
  totalFocusMinutes: number;
} {
  const todayKey = getLocalDateKey();
  const getTotal = (key: string) => {
    const e = activityLog[key];
    return e ? e.reviews + e.tasksSolved : 0;
  };
  const todayTotal = getTotal(todayKey);

  // Current streak: consecutive days ending today (or yesterday if today isn't completed yet)
  let currentStreak = 0;
  const cursor = new Date();
  if (todayTotal === 0) {
    cursor.setDate(cursor.getDate() - 1);
  }
  for (let i = 0; i < 365; i++) {
    const key = getLocalDateKey(cursor);
    if (getTotal(key) > 0) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // Best streak across recorded dates
  const activeDates = Object.keys(activityLog)
    .filter((k) => getTotal(k) > 0)
    .sort();
  let bestStreak = currentStreak;
  let running = 0;
  let prevTime: number | null = null;
  for (const key of activeDates) {
    const t = new Date(`${key}T12:00:00`).getTime();
    if (prevTime !== null && Math.round((t - prevTime) / 86400000) === 1) {
      running++;
    } else {
      running = 1;
    }
    if (running > bestStreak) bestStreak = running;
    prevTime = t;
  }

  let totalFocusMinutes = 0;
  for (const entry of Object.values(activityLog)) {
    totalFocusMinutes += entry.focusMinutes || 0;
  }

  void dailyGoal;
  return {todayTotal, currentStreak, bestStreak, totalFocusMinutes};
}

/** Deterministic key terms for questions 1..50 for active term-input self-testing */
const QUESTION_KEYWORDS: Record<number, {keyword: string; prompt: string}> = {
  1: {keyword: 'документации', prompt: 'Завершающий 5-й этап создания ПО — создание ...'},
  2: {keyword: 'ромб', prompt: 'Какая геометрическая фигура обозначает блок «Решение» (условие) по ГОСТ 19.701-90?'},
  3: {keyword: 'следование', prompt: 'Назовите первую из трёх базовых конструкций теоремы Бёма-Якопини (помимо развилки и цикла ПОКА)'},
  4: {keyword: 'do', prompt: 'Какое ключевое слово открывает цикл с постусловием в структурной программе вычисления интеграла?'},
  5: {keyword: 'компоновка', prompt: 'Этап объединения объектных модулей и библиотек в исполняемый файл (линковка)'},
  6: {keyword: 'семантика', prompt: 'Синтаксис задаёт форму конструкций языка, а что определяет их смысловое значение?'},
  7: {keyword: 'typedef', prompt: 'Ключевое слово С/С++ для объявления нового имени (синонима) существующего типа данных'},
  8: {keyword: 'дополнительном', prompt: 'В каком коде (прямом, обратном или дополнительном) хранятся отрицательные целые числа в памяти?'},
  9: {keyword: 'static_cast', prompt: 'Оператор безопасного явного приведения скалярных типов в стиле C++'},
  10: {keyword: 'ассоциативность', prompt: 'Свойство операций одного приоритета, определяющее порядок их выполнения (слева направо или справа налево)'},
  11: {keyword: 'fabs', prompt: 'Стандартная функция модуля вещественного числа для проверки |f - q| <= eps'},
  12: {keyword: 'iostream', prompt: 'Стандартный заголовочный файл потокового ввода-вывода C++ (cin, cout)'},
  13: {keyword: 'scanf', prompt: 'Функция форматного ввода данных с клавиатуры из библиотеки <stdio.h>'},
  14: {keyword: 'setw', prompt: 'Манипулятор <iomanip>, задающий ширину поля только для одного следующего выводимого значения'},
  15: {keyword: 'switch', prompt: 'Управляющий оператор множественного выбора по целочисленному селектору'},
  16: {keyword: 'while', prompt: 'Оператор цикла с предусловием, тело которого может не выполниться ни разу'},
  17: {keyword: 'указатель', prompt: 'Во что вырождается параметр-массив в функции, из-за чего к нему нельзя применить цикл foreach?'},
  18: {keyword: 'break', prompt: 'Оператор досрочного выхода из середины тела цикла в неструктурном поисковом цикле'},
  19: {keyword: '&&', prompt: 'Логическая операция в заголовке while (i < n ... a[i] >= 0), связывающая проверку границы и условия поиска'},
  20: {keyword: 'static', prompt: 'Ключевое слово локального массива, сохраняющего свои значения между вызовами функции в сегменте данных'},
  21: {keyword: 'void*', prompt: 'Тип нетипизированного указателя, способного хранить адрес объекта любого типа'},
  22: {keyword: 'delete[]', prompt: 'Оператор C++ для освобождения памяти динамического массива, выделенного через new T[n]'},
  23: {keyword: 'sizeof', prompt: 'Прибавление целого k к указателю T* смещает адрес на k * ...(T) байт'},
  24: {keyword: 'куча', prompt: 'Область памяти (heap), в которой размещаются динамические массивы во время выполнения'},
  25: {keyword: 'strcmp', prompt: 'Стандартная функция <cstring> для лексикографического сравнения двух C-строк'},
  26: {keyword: '->', prompt: 'Оператор доступа к полю структуры через указатель на неё'},
  27: {keyword: 'union', prompt: 'Ключевое слово объединения, все поля которого размещаются с одного и того же начального адреса'},
  28: {keyword: 'void', prompt: 'Возвращаемый тип функции в C++, реализующей процедуру (не возвращающей значения)'},
  29: {keyword: 'стек', prompt: 'Сегмент памяти, в котором размещаются автоматические локальные переменные функции'},
  30: {keyword: 'значению', prompt: 'Передача параметра по ... создаёт локальную копию аргумента и не изменяет оригинал'},
  31: {keyword: 'столбцов', prompt: 'Какую размерность (строк или столбцов) обязательно указывать константой при передаче статической матрицы в функцию?'},
  32: {keyword: 'предопределенный', prompt: 'Блок ГОСТ 19.701-90 с двойными боковыми линиями для вызова подпрограммы — ... процесс'},
  33: {keyword: 'ifndef', prompt: 'Директива препроцессора (#...) защиты заголовочного файла .h от повторного включения'},
  34: {keyword: 'i * q + j', prompt: 'Формула индекса в одномерной развёртке для элемента матрицы B[i][j] при числе столбцов q'},
  35: {keyword: 'функцию', prompt: 'Параметр процедурного типа в C/C++ представляет собой указатель на ...'},
  36: {keyword: 'namespace', prompt: 'Ключевое слово C++ для объявления пространства имён'},
  37: {keyword: 'фрейм', prompt: 'Блок данных в стеке вызовов, создаваемый для каждого активного вызова рекурсивной функции — ... активации'},
  38: {keyword: 'один', prompt: 'Сколько рекурсивных вызовов выполняется на каждом шаге ветвления при линейной рекурсии?'},
  39: {keyword: 'высоте', prompt: 'При древовидной рекурсии максимальная глубина стека пропорциональна ... дерева вызовов'},
  40: {keyword: 'односвязный', prompt: 'Список, каждый узел которого содержит ровно один указатель на следующий элемент'},
  41: {keyword: 'FIFO', prompt: 'Аббревиатура принципа обслуживания очереди («первым пришёл — первым ушёл»)'},
  42: {keyword: 'LIFO', prompt: 'Аббревиатура принципа работы стека («последним пришёл — первым ушёл»)'},
  43: {keyword: 'симметричный', prompt: 'Вид обхода (прямой, симметричный или обратный), выводящий ключи сортированного дерева по возрастанию'},
  44: {keyword: 'лист', prompt: 'Узел бинарного дерева без потомков (left == nullptr и right == nullptr), на место которого вставляется новый ключ'},
  45: {keyword: 'обратный', prompt: 'Какой обход дерева (NLR, LNR или LRN — словами) используется для полного освобождения памяти Del_Tree?'},
  46: {keyword: 'корне', prompt: 'Где в дереве синтаксического разбора выражения располагается операция, выполняемая в самую последнюю очередь?'},
  47: {keyword: '/', prompt: 'Символ-разделитель каталогов в полном имени файла ОС Linux (Astra Linux)'},
  48: {keyword: 'fread', prompt: 'Стандартная функция чтения блока байт/структур из двоичного файла'},
  49: {keyword: 'fgets', prompt: 'Безопасная стандартная функция построчного чтения из текстового файла с ограничением длины буфера'},
  50: {keyword: 'журнальный', prompt: 'Двоичный файл с разнородными записями на основе struct с полем-признаком и union'},
};

export function getCardHint(card: TheoryCard): string {
  if (card.hint) {
    return card.hint;
  }
  const firstPoint = card.answerPoints[0] ?? '';
  const slideHint = card.slides[0]
    ? `Опорный слайд: «${card.slides[0].label}» (с. ${card.slides[0].page}).`
    : '';
  const shortLead =
    firstPoint.length > 110 ? `${firstPoint.slice(0, 110).trim()}...` : firstPoint;
  return `${shortLead} ${slideHint}`.trim();
}

export function getCardQuizPromptAndKeyword(card: TheoryCard): {
  prompt: string;
  keyword: string;
} {
  const mapped = QUESTION_KEYWORDS[card.id];
  if (mapped) {
    return mapped;
  }
  if (card.quizKeyword) {
    return {
      prompt: card.question,
      keyword: card.quizKeyword,
    };
  }
  return {
    prompt: card.question,
    keyword: card.keyThesis.split(/\s+/)[0]?.replace(/[.,:;()]/g, '') || 'C++',
  };
}

export function loadInitialTheme(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore storage errors
  }
  return 'dark';
}

export function loadInitialSRMap(): Record<number, CardSRState> {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEYS.SR_MAP);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as Record<string, CardSRState>;
      const clean: Record<number, CardSRState> = {};
      for (const [k, v] of Object.entries(parsed)) {
        const id = Number(k);
        if (Number.isInteger(id) && id >= 1 && v && typeof v === 'object') {
          clean[id] = {
            status:
              v.status === 'known' ||
              v.status === 'learning' ||
              v.status === 'hard'
                ? v.status
                : 'unseen',
            box: typeof v.box === 'number' ? Math.max(0, Math.min(4, v.box)) : 0,
            easeFactor:
              typeof v.easeFactor === 'number'
                ? Math.max(1.3, Math.min(2.8, v.easeFactor))
                : 2.5,
            intervalMinutes:
              typeof v.intervalMinutes === 'number' ? v.intervalMinutes : 0,
            repetitions:
              typeof v.repetitions === 'number' ? v.repetitions : 0,
            lapses: typeof v.lapses === 'number' ? v.lapses : 0,
            lastReviewedAt: v.lastReviewedAt,
            nextReviewAt: v.nextReviewAt,
            lastGrade: v.lastGrade,
          };
        }
      }
      return clean;
    }

    // Migrate legacy v1 mastery map if present
    const rawV1 = localStorage.getItem(STORAGE_KEYS.LEGACY_MASTERY);
    if (rawV1) {
      const legacy = JSON.parse(rawV1) as Record<string, MasteryStatus>;
      const migrated: Record<number, CardSRState> = {};
      for (const [k, st] of Object.entries(legacy)) {
        const id = Number(k);
        if (
          Number.isInteger(id) &&
          id >= 1 &&
          (st === 'unseen' || st === 'hard' || st === 'learning' || st === 'known')
        ) {
          migrated[id] = {
            ...DEFAULT_SR_STATE,
            status: st,
            box: st === 'known' ? 3 : st === 'learning' ? 2 : st === 'hard' ? 1 : 0,
          };
        }
      }
      return migrated;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

export function loadCustomCards(): TheoryCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CARDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is TheoryCard =>
        Boolean(
          c &&
            typeof c.id === 'number' &&
            typeof c.question === 'string' &&
            typeof c.keyThesis === 'string' &&
            Array.isArray(c.answerPoints),
        ),
    );
  } catch {
    return [];
  }
}

export const DEFAULT_QUIZ_STATS: QuizStats = {
  completedCount: 0,
  totalQuestionsAnswered: 0,
  totalCorrect: 0,
  bestScorePct: 0,
};

export function loadQuizStats(): QuizStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZ_STATS);
    if (!raw) return DEFAULT_QUIZ_STATS;
    const parsed = JSON.parse(raw) as Partial<QuizStats>;
    return {
      completedCount: parsed.completedCount ?? 0,
      totalQuestionsAnswered: parsed.totalQuestionsAnswered ?? 0,
      totalCorrect: parsed.totalCorrect ?? 0,
      bestScorePct: parsed.bestScorePct ?? 0,
      lastPlayedAt: parsed.lastPlayedAt,
    };
  } catch {
    return DEFAULT_QUIZ_STATS;
  }
}

export function validateBackupPayload(data: unknown): StudyProgressBackup | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Partial<StudyProgressBackup>;
  if (!obj.srMap || typeof obj.srMap !== 'object') return null;
  return {
    version: 2,
    exportedAt:
      typeof obj.exportedAt === 'string'
        ? obj.exportedAt
        : new Date().toISOString(),
    theme: obj.theme === 'light' ? 'light' : 'dark',
    srMap: obj.srMap,
    customCards: Array.isArray(obj.customCards) ? obj.customCards : [],
    quizStats:
      obj.quizStats && typeof obj.quizStats === 'object'
        ? {
            completedCount: Number(obj.quizStats.completedCount) || 0,
            totalQuestionsAnswered:
              Number(obj.quizStats.totalQuestionsAnswered) || 0,
            totalCorrect: Number(obj.quizStats.totalCorrect) || 0,
            bestScorePct: Number(obj.quizStats.bestScorePct) || 0,
            lastPlayedAt: obj.quizStats.lastPlayedAt,
          }
        : DEFAULT_QUIZ_STATS,
    taskMastery:
      obj.taskMastery && typeof obj.taskMastery === 'object'
        ? obj.taskMastery
        : undefined,
    cardNotes:
      obj.cardNotes && typeof obj.cardNotes === 'object'
        ? obj.cardNotes
        : undefined,
    activityLog:
      obj.activityLog && typeof obj.activityLog === 'object'
        ? obj.activityLog
        : undefined,
    plannerSettings:
      obj.plannerSettings && typeof obj.plannerSettings === 'object'
        ? {
            ...DEFAULT_PLANNER_SETTINGS,
            ...obj.plannerSettings,
            examDates: {
              ...DEFAULT_PLANNER_SETTINGS.examDates,
              ...(obj.plannerSettings.examDates ?? {}),
            },
          }
        : undefined,
    customSubjects: Array.isArray(obj.customSubjects)
      ? obj.customSubjects
      : undefined,
    rewardState:
      obj.rewardState && typeof obj.rewardState === 'object'
        ? obj.rewardState
        : undefined,
    preferences:
      obj.preferences && typeof obj.preferences === 'object'
        ? sanitizeAppPreferences(obj.preferences)
        : undefined,
    achievements:
      obj.achievements && typeof obj.achievements === 'object'
        ? obj.achievements
        : undefined,
  };
}
