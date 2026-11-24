export type BuiltinStudyCategory = 'exam' | 'rk' | 'matan';
export type StudyCategory = BuiltinStudyCategory | `custom_${string}`;

export type LectureId =
  | 'exam'
  | 'lec1'
  | 'lec2'
  | 'lec3'
  | 'lec4'
  | 'lec5'
  | 'lec6'
  | 'lec7'
  | 'lec8'
  | 'rk2_angeom'
  | 'matan_theory'
  | 'matan_tasks'
  | 'matan_metodichka_1'
  | 'matan_metodichka_2'
  | 'matan_metodichka_3'
  | 'matan_bilet_1'
  | 'matan_bilet_3'
  | 'matan_bilet_6'
  | 'matan_bilet_7'
  | 'matan_bilet_9'
  | 'matan_bilet_10'
  | 'matan_bilet_11'
  | 'matan_bilet_12'
  | 'matan_bilet_13'
  | 'matan_bilet_14'
  | 'matan_bilet_15'
  | 'matan_bilet_17'
  | 'matan_bilet_20'
  | 'matan_bilet_21'
  | 'matan_bilet_22';

export type MasteryStatus = 'unseen' | 'hard' | 'learning' | 'known';

/**
 * 4-grade SM-2 / Leitner recall rating:
 * 1 = again («Не помню — повторить сейчас»)
 * 2 = hard  («Сложно — через 10 мин / в конце сессии»)
 * 3 = good  («Хорошо — плановый интервал»)
 * 4 = easy  («Легко — уверенно выучено»)
 */
export type RecallGrade = 'again' | 'hard' | 'good' | 'easy';

export interface CardSRState {
  status: MasteryStatus;
  /** Leitner box 0..4 (0 = again/error, 1 = hard, 2 = good-1, 3 = good-2+, 4 = easy/mastered) */
  box: number;
  /** SM-2 easiness factor (1.3 .. 2.8) */
  easeFactor: number;
  /** Interval in minutes */
  intervalMinutes: number;
  /** Consecutive successful recalls (grade >= good) */
  repetitions: number;
  /** Number of times rated 'again' or failed in quiz */
  lapses: number;
  /** Timestamp (ms) of last review */
  lastReviewedAt?: number;
  /** Timestamp (ms) when next review is due */
  nextReviewAt?: number;
  /** Last recall grade */
  lastGrade?: RecallGrade;
}

export type QuestionChapter =
  | 'Глава 1 · Простейшие конструкции и ввод-вывод'
  | 'Глава 2 · Управляющие конструкции'
  | 'Глава 3 · Массивы, указатели, строки и структуры'
  | 'Глава 4 · Модульное программирование и рекурсия'
  | 'Глава 5 · Динамические списки и очереди'
  | 'Глава 6 · Работа с файлами и кодировки'
  | 'Глава 8 · Деревья и разбор выражений'
  | 'РК 2 · Базовые теоретические вопросы'
  | 'РК 2 · Теория повышенной сложности (доказательства)'
  | 'РК 2 · Задачи и типовой билет'
  | 'Матан · Базовые определения (1–48)'
  | 'Матан · Пределы и б.м.ф. (вопр. 1–15)'
  | 'Матан · Непрерывность и разрывы (вопр. 16–22)'
  | 'Матан · Производная и дифференциал (вопр. 23–29)'
  | 'Матан · Теоремы о среднем, Лопиталь и Тейлор (вопр. 30–42)'
  | 'Матан · Монотонность, экстремумы и выпуклость (вопр. 43–49)'
  | 'Матан · Методички МГТУ (Ч.1–3 · алгоритмы и таблицы)'
  | (string & {});

export interface SlideAttachment {
  lectureId: LectureId;
  /** 1-indexed PDF page number */
  page: number;
  label: string;
  /** True when the slide shows the terminal result, worked answer, or exam task text */
  isAnswerSlide?: boolean;
}

export interface LectureDoc {
  id: LectureId;
  category?: StudyCategory;
  shortTitle: string;
  title: string;
  chapterLabel: string;
  dateLabel: string;
  pageCount: number;
  url: string;
  topics: string[];
}

export type CoverageStatus = 'full' | 'supplemented' | 'lecture-extra' | 'custom';

export interface TheoryCard {
  /** Question number: 1..50 official exam questions, 51..62 lecture deep-dive topics, 201..249 RK-2 cards, 100+ user custom cards */
  id: number;
  /** Category: 'exam' (АИП) or 'rk' (Рубежный контроль 2 · Аналитическая геометрия) */
  category?: StudyCategory;
  /** Display badge label (e.g., "Базовый вопрос №1", "Повыш. сложность №3", "Задача №1") */
  badgeLabel?: string;
  /** Question or term title */
  question: string;
  chapter: QuestionChapter;
  /** Concise short-answer lead to recite first on an oral/written exam (rendered bold on back) */
  keyThesis: string;
  /** Structured bullet points for memorization */
  answerPoints: string[];
  /** Authentic C/C++, RBNF, or mathematical derivation snippet */
  codeSnippet?: {
    title: string;
    code: string;
  };
  /** Optional KaTeX formula block for clean academic math rendering on theory cards (no IDE terminal look) */
  mathFormulaLatex?: string;
  /** Common traps or examiner follow-up points */
  examTip: string;
  /** Short hint for active recall before flipping the card */
  hint?: string;
  /** Key term or construct for active text-input self-testing in Blitz Quiz */
  quizKeyword?: string;
  /** Lecture and slide attachments (with answer/example slides marked) */
  slides: SlideAttachment[];
  coverage: CoverageStatus;
  /** Explicit audit note when slides cover a concept briefly and formula/case completion is provided */
  coverageNote?: string;
  /** True for user-created cards */
  isCustom?: boolean;
}

export interface TaskExplanationStep {
  title: string;
  detail: string;
  /** Optional KaTeX mathematical formula or matrix step for clean textbook rendering */
  latex?: string;
}

export interface TaskPdfCrop {
  lectureId: LectureId;
  page: number;
  /** Vertical start ratio (0.0 to 1.0) on the PDF page */
  topRatio: number;
  /** Vertical end ratio (0.0 to 1.0) on the PDF page */
  bottomRatio: number;
  /** Horizontal start ratio (0.0 to 1.0, defaults to 0.06) */
  leftRatio?: number;
  /** Horizontal end ratio (0.0 to 1.0, defaults to 0.94) */
  rightRatio?: number;
}

export interface TaskCard {
  id: string;
  category?: StudyCategory;
  kind:
    | 'exam'
    | 'lecture'
    | 'rk-basic'
    | 'rk-advanced'
    | 'rk-ticket'
    | 'matan-1'
    | 'matan-2'
    | 'matan-3'
    | 'matan-4'
    | 'matan-5';
  badgeNumber: string;
  title: string;
  chapter: QuestionChapter | 'Экзаменационные задачи';
  problemStatement: string;
  /** Clean text prompt accompanying problemLatex (without IDE array brackets) */
  problemTextClean?: string;
  /** Optional follow-up text prompt after the main LaTeX block */
  problemTextAfter?: string;
  /** Genuine LaTeX mathematical expression (2D matrices, determinants, curly-brace systems) */
  problemLatex?: string;
  /** Exact crop region from the original PDF sheet to display the task as an authentic image */
  pdfCrop?: TaskPdfCrop;
  /** Core algorithmic idea / short oral summary */
  algorithmSummary: string;
  explanationSteps: TaskExplanationStep[];
  code: string;
  expectedOutput: string;
  /** Clean textbook KaTeX expression for the final answer */
  answerLatex?: string;
  /** For exam tasks 1 & 2, links to bespoke GOST 19.701-90 SVG flowcharts */
  gostFlowchartId?: 'exam-task-1' | 'exam-task-2';
  /** Attached slides — answer/terminal output slides placed first */
  slides: SlideAttachment[];
}

export type TaskMasteryStatus = 'unsolved' | 'hint' | 'solved';

export interface DailyActivityEntry {
  reviews: number;
  tasksSolved: number;
  focusMinutes: number;
}

export type DailyActivityMap = Record<string, DailyActivityEntry>;

export interface CustomSubject {
  id: `custom_${string}`;
  name: string;
  shortName: string;
  fileName: string;
  pageCount: number;
  createdAt: string;
  cards: TheoryCard[];
}

export interface StudyPlannerSettings {
  examDates: Record<string, string>;
  dailyGoal: number;
  pomodoroMode: '25/5' | '50/10';
}

export interface AppPreferences {
  snowEnabled: boolean;
  warmGlowEnabled: boolean;
  confettiEnabled: boolean;
  showXpInHeader: boolean;
  focusMinutes: number;
  breakMinutes: number;
  autoSaveJsonEnabled: boolean;
  autoSaveIntervalMinutes: number;
  lastAutoSaveAt?: number;
}

export interface QuizStats {
  completedCount: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  bestScorePct: number;
  lastPlayedAt?: number;
}

export interface RewardItem {
  id: string;
  title: string;
  subtitle: string;
  costXp: number;
  breakMinutes: number;
  icon: 'dota' | 'coffee' | 'movie' | 'food' | 'party' | 'custom';
  permitQuote: string;
  isCustom?: boolean;
}

export interface ActiveRewardBreak {
  rewardId: string;
  title: string;
  permitQuote: string;
  startedAt: number;
  endsAt: number;
  durationMinutes: number;
}

export interface RewardSystemState {
  balanceXp: number;
  earnedTodayXp: number;
  earnedDateKey: string;
  totalEarnedXp: number;
  redeemedTodayIds: string[];
  totalRedeemedCount: number;
  rewards: RewardItem[];
  activeBreak: ActiveRewardBreak | null;
  claimedAchievementIds?: string[];
  streakFreezes?: number;
}

export type AchievementCategory = 'streak' | 'mastery' | 'practice' | 'special';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type AchievementIcon =
  | 'flame'
  | 'zap'
  | 'award'
  | 'trophy'
  | 'star'
  | 'target'
  | 'brain'
  | 'clock'
  | 'check'
  | 'sparkles'
  | 'moon'
  | 'layers';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  rewardXp: number;
  target: number;
  unitLabel: string;
  icon: AchievementIcon;
}

export interface AchievementCounters {
  easyStreak: number;
  bestEasyStreak: number;
  goodOrEasyStreak: number;
  bestGoodOrEasyStreak: number;
  totalReviews: number;
  spotTheLieWins: number;
  nightStudyCount: number;
}

export interface AchievementSystemState {
  unlocked: Record<string, number>;
  counters: AchievementCounters;
}

export interface StudyProgressBackup {
  version: 2;
  exportedAt: string;
  theme: 'dark' | 'light';
  srMap: Record<number, CardSRState>;
  customCards: TheoryCard[];
  customSubjects?: CustomSubject[];
  quizStats: QuizStats;
  taskMastery?: Record<string, TaskMasteryStatus>;
  cardNotes?: Record<number, string>;
  activityLog?: DailyActivityMap;
  plannerSettings?: StudyPlannerSettings;
  rewardState?: RewardSystemState;
  preferences?: AppPreferences;
  achievements?: AchievementSystemState;
}

export type AppSection =
  | 'flashcards'
  | 'tasks'
  | 'simulator'
  | 'quiz'
  | 'audit'
  | 'lectures'
  | 'guide';
