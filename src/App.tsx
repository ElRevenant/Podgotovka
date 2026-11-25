import {ChangeEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import confetti from 'canvas-confetti';
import {
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FilePlus2,
  Flame,
  Gamepad2,
  GitBranch,
  GraduationCap,
  LayoutGrid,
  Moon,
  Plus,
  RotateCcw,
  Settings,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Trophy,
  Upload,
  Zap,
} from 'lucide-react';
import {AchievementsModal} from './components/AchievementsModal';
import {AchievementToast} from './components/AchievementToast';
import {AllStatsModal} from './components/AllStatsModal';
import {AmbientSnowBackdrop} from './components/AmbientSnowBackdrop';
import {BlitzQuiz} from './components/BlitzQuiz';
import {CompletenessAudit} from './components/CompletenessAudit';
import {CramModeModal} from './components/CramModeModal';
import {CustomCardModal} from './components/CustomCardModal';
import {DailyGoalRing} from './components/DailyGoalRing';
import {ExamSimulator} from './components/ExamSimulator';
import {FeynmanFreshmanModal} from './components/FeynmanFreshmanModal';
import {DeckStatusFilter, FlashcardStage} from './components/FlashcardStage';
import {FocusSoundscape} from './components/FocusSoundscape';
import {FormulaCheatSheetModal} from './components/FormulaCheatSheetModal';
import {GuideWorkspace} from './components/GuideWorkspace';
import {KnowledgeGraphModal} from './components/KnowledgeGraphModal';
import {LecturesLibrary} from './components/LecturesLibrary';
import {OfflineIndicator} from './components/OfflineIndicator';
import {OralExamDialogModal} from './components/OralExamDialogModal';
import {PdfSubjectImporterModal} from './components/PdfSubjectImporterModal';
import {PomodoroTimer} from './components/PomodoroTimer';
import {RewardsModal, SESSION_ACHIEVEMENTS_TOTAL} from './components/RewardsModal';
import {SettingsModal} from './components/SettingsModal';
import {SpotTheLieModal} from './components/SpotTheLieModal';
import {TasksWorkspace} from './components/TasksWorkspace';
import {
  EXAM_QUESTIONS,
  MATAN_QUESTIONS,
  MATAN_TASKS,
  RK_QUESTIONS,
  RK_TASKS,
  TASKS_AND_EXAMPLES,
} from './data';
import {
  AchievementDefinition,
  AchievementSystemState,
  AppPreferences,
  AppSection,
  CardSRState,
  CustomSubject,
  DailyActivityMap,
  QuestionChapter,
  QuizStats,
  RecallGrade,
  RewardItem,
  RewardSystemState,
  StudyCategory,
  StudyPlannerSettings,
  StudyProgressBackup,
  TaskMasteryStatus,
  TheoryCard,
} from './types/study';
import {
  addDaysToDateKey,
  computeActivityStreaks,
  DEFAULT_APP_PREFERENCES,
  DEFAULT_PLANNER_SETTINGS,
  DEFAULT_QUIZ_STATS,
  getLocalDateKey,
  loadActivityLog,
  loadAppPreferences,
  loadCardNotes,
  loadCustomCards,
  loadCustomSubjects,
  loadInitialCategory,
  loadInitialSRMap,
  loadInitialTheme,
  loadPlannerSettings,
  loadQuizStats,
  loadTaskMastery,
  STORAGE_KEYS,
  validateBackupPayload,
} from './utils/cardHelpers';
import {
  computeNextSRState,
  getCardSRState,
} from './utils/spacedRepetition';
import {
  applyXpAward,
  createDefaultRewardState,
  DEFAULT_REWARDS,
  getHighestUnlockedReward,
  getNextLockedReward,
  loadRewardState,
} from './utils/rewards';
import {
  ACHIEVEMENTS_CATALOG,
  createDefaultAchievementState,
  evaluateAchievements,
  loadAchievementState,
  sanitizeAchievementState,
} from './utils/achievements';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(loadInitialTheme);
  const [studyCategory, setStudyCategory] = useState<StudyCategory>(
    loadInitialCategory,
  );
  const [section, setSection] = useState<AppSection>('flashcards');
  const [srMap, setSrMap] = useState<Record<number, CardSRState>>(loadInitialSRMap);
  const [customCards, setCustomCards] = useState<TheoryCard[]>(loadCustomCards);
  const [customSubjects, setCustomSubjects] =
    useState<CustomSubject[]>(loadCustomSubjects);
  const [quizStats, setQuizStats] = useState<QuizStats>(loadQuizStats);
  const [taskMastery, setTaskMastery] =
    useState<Record<string, TaskMasteryStatus>>(loadTaskMastery);
  const [cardNotes, setCardNotes] =
    useState<Record<number, string>>(loadCardNotes);
  const [activityLog, setActivityLog] =
    useState<DailyActivityMap>(loadActivityLog);
  const [plannerSettings, setPlannerSettings] =
    useState<StudyPlannerSettings>(loadPlannerSettings);
  const [dailyGoalDraft, setDailyGoalDraft] = useState<string>(() =>
    String(loadPlannerSettings().dailyGoal),
  );
  const [preferences, setPreferences] =
    useState<AppPreferences>(loadAppPreferences);

  const [selectedQuestionId, setSelectedQuestionId] = useState<number>(() => {
    const initCat = loadInitialCategory();
    if (initCat === 'rk') return 201;
    if (initCat === 'matan') return 501;
    if (initCat.startsWith('custom_')) {
      const subj = loadCustomSubjects().find((s) => s.id === initCat);
      return subj?.cards[0]?.id ?? 501;
    }
    return 1;
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => {
    const initCat = loadInitialCategory();
    return initCat === 'rk'
      ? 'rk-base-1'
      : initCat === 'matan'
        ? 'matan-1-1'
        : 'exam-task-1';
  });
  const [cardFilter, setCardFilter] = useState<DeckStatusFilter>('all');
  const [externalChapter, setExternalChapter] =
    useState<QuestionChapter | null>(null);
  const [chapterJumpToken, setChapterJumpToken] = useState<number>(0);
  const [skillSubset, setSkillSubset] = useState<{
    label: string;
    cardIds: number[];
  } | null>(null);

  const [customModalOpen, setCustomModalOpen] = useState<boolean>(false);
  const [cheatSheetOpen, setCheatSheetOpen] = useState<boolean>(false);
  const [cramModeOpen, setCramModeOpen] = useState<boolean>(false);
  const [pdfImporterOpen, setPdfImporterOpen] = useState<boolean>(false);
  const [oralExamCard, setOralExamCard] = useState<TheoryCard | null>(null);
  const [spotTheLieOpen, setSpotTheLieOpen] = useState<boolean>(false);
  const [knowledgeGraphOpen, setKnowledgeGraphOpen] = useState<boolean>(false);
  const [feynmanCard, setFeynmanCard] = useState<TheoryCard | null>(null);
  const [rewardsOpen, setRewardsOpen] = useState<boolean>(false);
  const [rewardsInitialTab, setRewardsInitialTab] = useState<
    'shop' | 'achievements'
  >('shop');
  const [achievementsOpen, setAchievementsOpen] = useState<boolean>(false);
  const [allStatsOpen, setAllStatsOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [modesMenuOpen, setModesMenuOpen] = useState<boolean>(false);
  const [rewardState, setRewardState] =
    useState<RewardSystemState>(loadRewardState);
  const lastCardXpTimeRef = useRef<Record<number, number>>({});
  const focusMinuteCounterRef = useRef<number>(0);
  const initialAchievementsRef = useRef<ReturnType<typeof loadAchievementState> | null>(
    null,
  );
  if (initialAchievementsRef.current === null) {
    initialAchievementsRef.current = loadAchievementState();
  }
  const [achievementState, setAchievementState] = useState<AchievementSystemState>(
    () => initialAchievementsRef.current!.state,
  );
  const achievementSilentSyncDoneRef = useRef<boolean>(
    initialAchievementsRef.current.hadSavedRecord,
  );
  const [achievementToastQueue, setAchievementToastQueue] = useState<
    AchievementDefinition[]
  >([]);
  const [unlockedToast, setUnlockedToast] = useState<RewardItem | null>(null);
  const [breakNowMs, setBreakNowMs] = useState<number>(() => Date.now());
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [bannerMsg, setBannerMsg] = useState<{
    kind: 'ok' | 'err';
    text: string;
  } | null>(null);

  // In-memory session statistics (since last page refresh)
  const [sessionHistory, setSessionHistory] = useState<
    {questionId: number; grade: RecallGrade; timestamp: number}[]
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modesMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modesMenuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        modesMenuRef.current &&
        !modesMenuRef.current.contains(e.target as Node)
      ) {
        setModesMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModesMenuOpen(false);
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [modesMenuOpen]);

  const activeCustomSubject = useMemo(
    () =>
      studyCategory.startsWith('custom_')
        ? customSubjects.find((s) => s.id === studyCategory) ?? null
        : null,
    [studyCategory, customSubjects],
  );

  // Fallback to 'matan' if saved custom subject was removed
  useEffect(() => {
    if (studyCategory.startsWith('custom_') && !activeCustomSubject) {
      setStudyCategory('matan');
      setSelectedQuestionId(501);
    }
  }, [studyCategory, activeCustomSubject]);

  const activeCategoryCards = useMemo(() => {
    if (activeCustomSubject) {
      const extraCustom = customCards.filter(
        (c) => c.category === activeCustomSubject.id,
      );
      return [...activeCustomSubject.cards, ...extraCustom];
    }
    const baseDeck =
      studyCategory === 'rk'
        ? RK_QUESTIONS
        : studyCategory === 'matan'
          ? MATAN_QUESTIONS
          : EXAM_QUESTIONS;
    const categoryCustom = customCards.filter((c) => {
      if (studyCategory === 'rk') return c.category === 'rk';
      if (studyCategory === 'matan') return c.category === 'matan';
      return (
        c.category !== 'rk' &&
        c.category !== 'matan' &&
        !String(c.category ?? '').startsWith('custom_')
      );
    });
    return [...baseDeck, ...categoryCustom];
  }, [studyCategory, customCards, activeCustomSubject]);

  const activeCategoryTasks = useMemo(
    () =>
      studyCategory === 'rk'
        ? RK_TASKS
        : studyCategory === 'matan'
          ? MATAN_TASKS
          : studyCategory.startsWith('custom_')
            ? []
            : TASKS_AND_EXAMPLES,
    [studyCategory],
  );

  const activeSubjectDisplayTitle = useMemo(() => {
    if (activeCustomSubject) return activeCustomSubject.name;
    if (studyCategory === 'rk') return 'Ангем · РК 1, РК 2 и Экзамен';
    if (studyCategory === 'matan') return 'Матан · Экзамен';
    return 'АИП · Экзамен';
  }, [studyCategory, activeCustomSubject]);

  const handleCategoryChange = (nextCategory: StudyCategory) => {
    if (nextCategory === studyCategory) return;
    setStudyCategory(nextCategory);
    setCardFilter('all');
    setExternalChapter(null);
    setSkillSubset(null);
    if (nextCategory === 'rk') {
      setSelectedQuestionId(201);
      setSelectedTaskId('rk-base-1');
    } else if (nextCategory === 'matan') {
      setSelectedQuestionId(501);
      setSelectedTaskId('matan-1-1');
    } else if (nextCategory.startsWith('custom_')) {
      const subj = customSubjects.find((s) => s.id === nextCategory);
      setSelectedQuestionId(subj?.cards[0]?.id ?? 2000);
      setSection('flashcards');
    } else {
      setSelectedQuestionId(1);
      setSelectedTaskId('exam-task-1');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORY, nextCategory);
    } catch {
      // ignore storage errors
    }
  };

  // Sync dark mode class and persist theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  // Sync warm glow class/data attribute and persist AppPreferences
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.warmGlow = preferences.warmGlowEnabled ? 'on' : 'off';
    if (preferences.warmGlowEnabled) {
      root.classList.remove('no-warm-glow');
    } else {
      root.classList.add('no-warm-glow');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch {
      // ignore storage errors
    }
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SR_MAP, JSON.stringify(srMap));
    } catch {
      // ignore
    }
  }, [srMap]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CUSTOM_CARDS,
        JSON.stringify(customCards),
      );
    } catch {
      // ignore
    }
  }, [customCards]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CUSTOM_SUBJECTS,
        JSON.stringify(customSubjects),
      );
    } catch {
      // ignore
    }
  }, [customSubjects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUIZ_STATS, JSON.stringify(quizStats));
    } catch {
      // ignore
    }
  }, [quizStats]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.TASK_MASTERY,
        JSON.stringify(taskMastery),
      );
    } catch {
      // ignore
    }
  }, [taskMastery]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CARD_NOTES, JSON.stringify(cardNotes));
    } catch {
      // ignore
    }
  }, [cardNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.ACTIVITY_LOG,
        JSON.stringify(activityLog),
      );
    } catch {
      // ignore
    }
  }, [activityLog]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.PLANNER,
        JSON.stringify(plannerSettings),
      );
    } catch {
      // ignore
    }
  }, [plannerSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewardState));
    } catch {
      // ignore
    }
  }, [rewardState]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.ACHIEVEMENTS,
        JSON.stringify(achievementState),
      );
    } catch {
      // ignore
    }
  }, [achievementState]);

  // Tick live break countdown only while an official break permit is active
  useEffect(() => {
    if (!rewardState.activeBreak) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      setBreakNowMs(now);
      if (rewardState.activeBreak && now >= rewardState.activeBreak.endsAt) {
        setRewardState((prev) => ({...prev, activeBreak: null}));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [rewardState.activeBreak]);

  const showTempBanner = (kind: 'ok' | 'err', text: string) => {
    setBannerMsg({kind, text});
    window.setTimeout(() => {
      setBannerMsg((prev) => (prev?.text === text ? null : prev));
    }, 3800);
  };

  const bumpTodayActivity = useCallback(
    (delta: {reviews?: number; tasksSolved?: number; focusMinutes?: number}) => {
      const todayKey = getLocalDateKey();
      setActivityLog((prev) => {
        const curr = prev[todayKey] ?? {
          reviews: 0,
          tasksSolved: 0,
          focusMinutes: 0,
        };
        return {
          ...prev,
          [todayKey]: {
            reviews: curr.reviews + (delta.reviews ?? 0),
            tasksSolved: curr.tasksSolved + (delta.tasksSolved ?? 0),
            focusMinutes: curr.focusMinutes + (delta.focusMinutes ?? 0),
          },
        };
      });
    },
    [],
  );

  // Festive confetti / firework salute whenever a reward stage unlocks
  useEffect(() => {
    if (!unlockedToast || !preferences.confettiEnabled) return;

    const palette = ['#fbbf24', '#fde68a', '#34d399', '#38bdf8', '#e2e8f0'];

    // Stage 1: Side cannons angled inward
    void confetti({
      particleCount: 55,
      angle: 60,
      spread: 58,
      startVelocity: 46,
      origin: {x: 0.04, y: 0.72},
      colors: palette,
      disableForReducedMotion: true,
    });
    void confetti({
      particleCount: 55,
      angle: 120,
      spread: 58,
      startVelocity: 46,
      origin: {x: 0.96, y: 0.72},
      colors: palette,
      disableForReducedMotion: true,
    });

    // Stage 2: High center firework burst
    const burstTimer = window.setTimeout(() => {
      void confetti({
        particleCount: 70,
        spread: 85,
        startVelocity: 36,
        scalar: 0.95,
        origin: {x: 0.5, y: 0.42},
        colors: palette,
        disableForReducedMotion: true,
      });
    }, 220);

    return () => {
      window.clearTimeout(burstTimer);
    };
  }, [unlockedToast, preferences.confettiEnabled]);

  const grantStudyXp = useCallback((deltaXp: number) => {
    if (deltaXp <= 0) return;
    setRewardState((prev) => {
      const {next, newlyUnlocked} = applyXpAward(prev, deltaXp);
      if (newlyUnlocked) {
        setUnlockedToast(newlyUnlocked);
        window.setTimeout(() => {
          setUnlockedToast((curr) =>
            curr?.id === newlyUnlocked.id ? null : curr,
          );
        }, 7000);
      }
      return next;
    });
  }, []);

  const handleClaimReward = (reward: RewardItem) => {
    const now = Date.now();
    setRewardState((prev) => {
      if (prev.balanceXp < reward.costXp) return prev;
      return {
        ...prev,
        balanceXp: prev.balanceXp - reward.costXp,
        redeemedTodayIds: prev.redeemedTodayIds.includes(reward.id)
          ? prev.redeemedTodayIds
          : [...prev.redeemedTodayIds, reward.id],
        totalRedeemedCount: prev.totalRedeemedCount + 1,
        activeBreak: {
          rewardId: reward.id,
          title: reward.title,
          permitQuote: reward.permitQuote,
          startedAt: now,
          endsAt: now + reward.breakMinutes * 60 * 1000,
          durationMinutes: reward.breakMinutes,
        },
      };
    });
    setBreakNowMs(now);
    setUnlockedToast(null);
    if (preferences.confettiEnabled) {
      void confetti({
        particleCount: 45,
        spread: 68,
        startVelocity: 32,
        origin: {x: 0.5, y: 0.55},
        colors: ['#fbbf24', '#fde68a', '#34d399', '#38bdf8', '#e2e8f0'],
        disableForReducedMotion: true,
      });
    }
    showTempBanner(
      'ok',
      `Допуск выдан: «${reward.title}» (${reward.breakMinutes} мин). Хорошего отдыха!`,
    );
  };

  const handleEndActiveBreak = () => {
    setRewardState((prev) => ({...prev, activeBreak: null}));
    showTempBanner('ok', 'Отдых завершён — с возвращением к подготовке!');
  };

  const handleAddCustomReward = (reward: RewardItem) => {
    setRewardState((prev) => ({
      ...prev,
      rewards: [...prev.rewards, reward],
    }));
    showTempBanner('ok', `Добавлена награда «${reward.title}» (${reward.costXp} XP)`);
  };

  const handleDeleteReward = (rewardId: string) => {
    setRewardState((prev) => ({
      ...prev,
      rewards: prev.rewards.filter((r) => r.id !== rewardId),
    }));
  };

  const handleRestoreDefaultRewards = () => {
    setRewardState((prev) => {
      const customOnes = prev.rewards.filter((r) => r.isCustom);
      return {...prev, rewards: [...DEFAULT_REWARDS, ...customOnes]};
    });
  };

  const handleBuyStreakFreeze = () => {
    setRewardState((prev) => {
      const currentFreezes = prev.streakFreezes ?? 0;
      if (currentFreezes >= 3 || prev.balanceXp < 250) return prev;
      return {
        ...prev,
        balanceXp: prev.balanceXp - 250,
        streakFreezes: currentFreezes + 1,
      };
    });
    showTempBanner(
      'ok',
      'Заморозка стрика ❄️ активирована! Один пропущенный день не сбросит серию.',
    );
  };

  const handleClaimAchievement = (
    achievementId: string,
    rewardXp: number,
  ) => {
    setRewardState((prev) => {
      const claimed = prev.claimedAchievementIds ?? [];
      if (claimed.includes(achievementId)) return prev;
      const {next, newlyUnlocked} = applyXpAward(prev, rewardXp);
      if (newlyUnlocked) {
        setUnlockedToast(newlyUnlocked);
        window.setTimeout(() => {
          setUnlockedToast((curr) =>
            curr?.id === newlyUnlocked.id ? null : curr,
          );
        }, 7000);
      }
      return {
        ...next,
        claimedAchievementIds: [...claimed, achievementId],
      };
    });
    if (preferences.confettiEnabled) {
      void confetti({
        particleCount: 52,
        spread: 70,
        startVelocity: 35,
        origin: {x: 0.5, y: 0.5},
        colors: ['#fbbf24', '#fde68a', '#34d399', '#38bdf8', '#e2e8f0'],
        disableForReducedMotion: true,
      });
    }
    showTempBanner('ok', `Достижение зимней сессии получено: +${rewardXp} XP!`);
  };

  const handleClaimAllAchievements = (
    items: {id: string; rewardXp: number}[],
  ) => {
    if (items.length === 0) return;
    setRewardState((prev) => {
      const claimed = new Set(prev.claimedAchievementIds ?? []);
      const fresh = items.filter((item) => !claimed.has(item.id));
      if (fresh.length === 0) return prev;
      const totalXp = fresh.reduce((acc, item) => acc + item.rewardXp, 0);
      const {next, newlyUnlocked} = applyXpAward(prev, totalXp);
      if (newlyUnlocked) {
        setUnlockedToast(newlyUnlocked);
        window.setTimeout(() => {
          setUnlockedToast((curr) =>
            curr?.id === newlyUnlocked.id ? null : curr,
          );
        }, 7000);
      }
      return {
        ...next,
        claimedAchievementIds: [
          ...Array.from(claimed),
          ...fresh.map((i) => i.id),
        ],
      };
    });
    const totalXp = items.reduce((acc, item) => acc + item.rewardXp, 0);
    if (preferences.confettiEnabled) {
      void confetti({
        particleCount: 65,
        spread: 80,
        startVelocity: 38,
        origin: {x: 0.5, y: 0.45},
        colors: ['#fbbf24', '#fde68a', '#34d399', '#38bdf8', '#e2e8f0'],
        disableForReducedMotion: true,
      });
    }
    showTempBanner(
      'ok',
      `Забраны все открытые достижения (${items.length} шт.): +${totalXp} XP!`,
    );
  };

  const handleRateGrade = (questionId: number, grade: RecallGrade) => {
    const now = new Date();
    const nowMs = now.getTime();
    const hour = now.getHours();
    const isNightHour = hour >= 23 || hour < 5;
    const prevSR = getCardSRState(srMap, questionId);
    const wasWeakOrHard = prevSR.status === 'hard' || prevSR.lapses > 0;

    setSrMap((prev) => {
      const nextState = computeNextSRState(prev[questionId], grade);
      return {...prev, [questionId]: nextState};
    });
    setSessionHistory((prev) => [
      ...prev,
      {questionId, grade, timestamp: nowMs},
    ]);
    setAchievementState((prev) => {
      const c = prev.counters;
      const nextEasyStreak = grade === 'easy' ? c.easyStreak + 1 : 0;
      const nextGoodOrEasy =
        grade === 'easy' || grade === 'good' ? c.goodOrEasyStreak + 1 : 0;
      return {
        ...prev,
        counters: {
          ...c,
          easyStreak: nextEasyStreak,
          bestEasyStreak: Math.max(c.bestEasyStreak, nextEasyStreak),
          goodOrEasyStreak: nextGoodOrEasy,
          bestGoodOrEasyStreak: Math.max(c.bestGoodOrEasyStreak, nextGoodOrEasy),
          totalReviews: c.totalReviews + 1,
          nightStudyCount: c.nightStudyCount + (isNightHour ? 1 : 0),
        },
      };
    });
    bumpTodayActivity({reviews: 1});

    // Hardcore XP economy: 300-second (5 min) anti-farming cooldown per card
    const lastXpAt = lastCardXpTimeRef.current[questionId] ?? 0;
    if (nowMs - lastXpAt >= 300 * 1000) {
      lastCardXpTimeRef.current[questionId] = nowMs;
      const xpToGrant =
        grade === 'good' || grade === 'easy'
          ? wasWeakOrHard
            ? 5
            : grade === 'easy'
              ? 3
              : 2
          : grade === 'hard'
            ? 1
            : 0;
      if (xpToGrant > 0) {
        grantStudyXp(xpToGrant);
      }
    }
  };

  const handleSetTaskMastery = (taskId: string, status: TaskMasteryStatus) => {
    setTaskMastery((prev) => {
      const previous = prev[taskId] ?? 'unsolved';
      if (status === 'solved' && previous !== 'solved') {
        bumpTodayActivity({tasksSolved: 1});
        grantStudyXp(8);
      }
      return {...prev, [taskId]: status};
    });
  };

  const handleSaveCardNote = (cardId: number, note: string) => {
    setCardNotes((prev) => {
      const copy = {...prev};
      if (note.trim() === '') {
        delete copy[cardId];
      } else {
        copy[cardId] = note;
      }
      return copy;
    });
  };

  const handleFocusMinuteCompleted = useCallback(() => {
    bumpTodayActivity({focusMinutes: 1});
    focusMinuteCounterRef.current += 1;
    if (focusMinuteCounterRef.current % 2 === 0) {
      grantStudyXp(1);
    }
  }, [bumpTodayActivity, grantStudyXp]);

  const handleUpdatePlanner = (patch: Partial<StudyPlannerSettings>) => {
    setPlannerSettings((prev) => ({...prev, ...patch}));
  };

  useEffect(() => {
    setDailyGoalDraft(String(plannerSettings.dailyGoal));
  }, [plannerSettings.dailyGoal]);

  const commitDailyGoal = (raw: string) => {
    const parsed = Number(raw);
    const clamped = Number.isFinite(parsed)
      ? Math.max(5, Math.min(100, Math.round(parsed)))
      : plannerSettings.dailyGoal;
    handleUpdatePlanner({dailyGoal: clamped});
    setDailyGoalDraft(String(clamped));
  };

  const handleUpdateExamDate = (category: StudyCategory, dateIso: string) => {
    setPlannerSettings((prev) => ({
      ...prev,
      examDates: {...prev.examDates, [category]: dateIso},
    }));
  };

  const handleStartWeakSprint = () => {
    setExternalChapter(null);
    setSkillSubset(null);
    setCardFilter('weak_sprint');
    setSection('flashcards');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleJumpToChapter = (chapter: QuestionChapter) => {
    setCardFilter('all');
    setSkillSubset(null);
    setExternalChapter(chapter);
    setChapterJumpToken((t) => t + 1);
    setSection('flashcards');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleAddCustomCard = (card: TheoryCard) => {
    setCustomCards((prev) => [...prev, card]);
    setSelectedQuestionId(card.id);
    setSection('flashcards');
    showTempBanner('ok', `Добавлена карточка №${card.id}`);
  };

  const handleDeleteCustomCard = (id: number) => {
    setCustomCards((prev) => prev.filter((c) => c.id !== id));
    setCustomSubjects((prev) =>
      prev.map((s) => ({
        ...s,
        cards: s.cards.filter((c) => c.id !== id),
      })),
    );
    setSrMap((prev) => {
      const copy = {...prev};
      delete copy[id];
      return copy;
    });
    setSelectedQuestionId(
      studyCategory === 'rk'
        ? 201
        : studyCategory === 'matan'
          ? 501
          : activeCustomSubject?.cards[0]?.id ?? 1,
    );
    showTempBanner('ok', `Своя карточка №${id} удалена`);
  };

  const handleSaveCustomSubject = (subject: CustomSubject) => {
    setCustomSubjects((prev) => [...prev, subject]);
    setPlannerSettings((prev) => ({
      ...prev,
      examDates: {
        ...prev.examDates,
        [subject.id]: addDaysToDateKey(14),
      },
    }));
    setStudyCategory(subject.id);
    setSelectedQuestionId(subject.cards[0]?.id ?? 2000);
    setSection('flashcards');
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORY, subject.id);
    } catch {
      // ignore
    }
    showTempBanner(
      'ok',
      `Импортирован предмет «${subject.name}» (${subject.cards.length} карточек)`,
    );
  };

  const handleDeleteCustomSubject = (subjectId: `custom_${string}`) => {
    setCustomSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    if (studyCategory === subjectId) {
      handleCategoryChange('matan');
    }
    showTempBanner('ok', 'Импортированный PDF-предмет удалён');
  };

  const handleOpenOralExamForActiveDeck = (specificCard?: TheoryCard) => {
    const target =
      specificCard ??
      activeCategoryCards.find((c) => c.id === selectedQuestionId) ??
      activeCategoryCards[0];
    if (target) {
      setOralExamCard(target);
    }
  };

  const handleOpenFeynmanForActiveDeck = (specificCard?: TheoryCard) => {
    const target =
      specificCard ??
      activeCategoryCards.find((c) => c.id === selectedQuestionId) ??
      activeCategoryCards[0];
    if (target) {
      setFeynmanCard(target);
    }
  };

  const handleRecordQuizFinish = (
    totalQuestions: number,
    correctCount: number,
  ) => {
    const pct = Math.round(
      (correctCount / Math.max(1, totalQuestions)) * 100,
    );
    setQuizStats((prev) => ({
      completedCount: prev.completedCount + 1,
      totalQuestionsAnswered: prev.totalQuestionsAnswered + totalQuestions,
      totalCorrect: prev.totalCorrect + correctCount,
      bestScorePct: Math.max(prev.bestScorePct, pct),
      lastPlayedAt: Date.now(),
    }));
    if (pct >= 70) {
      const earnedQuizXp = Math.max(1, Math.round((pct / 100) * 7));
      grantStudyXp(earnedQuizXp);
    }
  };

  const handleOpenQuestion = (id: number) => {
    setCardFilter('all');
    setSkillSubset(null);
    setSelectedQuestionId(id);
    setSection('flashcards');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleOpenTopicInDeck = (
    label: string,
    cardIds: number[],
    startCardId?: number,
  ) => {
    setCardFilter('all');
    setExternalChapter(null);
    setSkillSubset({label, cardIds});
    const targetId = startCardId ?? cardIds[0];
    if (targetId !== undefined) {
      setSelectedQuestionId(targetId);
    }
    setSection('flashcards');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleOpenTask = (id: string) => {
    setSelectedTaskId(id);
    setSection('tasks');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleUpdatePreferences = useCallback((patch: Partial<AppPreferences>) => {
    setPreferences((prev) => ({...prev, ...patch}));
  }, []);

  const handleResetPreferences = useCallback(() => {
    setPreferences({...DEFAULT_APP_PREFERENCES});
    showTempBanner('ok', 'Настройки сброшены по умолчанию');
  }, []);

  const buildBackupPayload = useCallback(
    (): StudyProgressBackup => ({
      version: 2,
      exportedAt: new Date().toISOString(),
      theme,
      srMap,
      customCards,
      quizStats,
      taskMastery,
      cardNotes,
      activityLog,
      plannerSettings,
      customSubjects,
      rewardState,
      preferences,
      achievements: achievementState,
    }),
    [
      theme,
      srMap,
      customCards,
      quizStats,
      taskMastery,
      cardNotes,
      activityLog,
      plannerSettings,
      customSubjects,
      rewardState,
      preferences,
      achievementState,
    ],
  );

  const downloadBackupJson = useCallback(
    (payload: StudyProgressBackup, isAuto = false) => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(
        now.getMinutes(),
      ).padStart(2, '0')}`;
      a.href = url;
      a.download = isAuto
        ? `study_autosave_${studyCategory}_${dateStr}_${timeStr}.json`
        : `study_backup_${studyCategory}_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [studyCategory],
  );

  const handleExportBackup = () => {
    try {
      const payload = buildBackupPayload();
      downloadBackupJson(payload, false);
      setPreferences((prev) => ({...prev, lastAutoSaveAt: Date.now()}));
      showTempBanner('ok', 'Прогресс, заметки, настройки и календарь экспортированы в JSON');
    } catch {
      showTempBanner('err', 'Не удалось сформировать файл экспорта');
    }
  };

  const handleImportFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = typeof reader.result === 'string' ? reader.result : '';
        const parsed = JSON.parse(raw);
        const valid = validateBackupPayload(parsed);
        if (!valid) {
          showTempBanner('err', 'Некорректный формат файла бэкапа JSON');
          return;
        }
        setSrMap(valid.srMap);
        setCustomCards(valid.customCards);
        setQuizStats(valid.quizStats);
        setTheme(valid.theme);
        if (valid.taskMastery) setTaskMastery(valid.taskMastery);
        if (valid.cardNotes) setCardNotes(valid.cardNotes);
        if (valid.activityLog) setActivityLog(valid.activityLog);
        if (valid.plannerSettings) setPlannerSettings(valid.plannerSettings);
        if (valid.customSubjects) setCustomSubjects(valid.customSubjects);
        if (valid.rewardState) setRewardState(valid.rewardState);
        if (valid.preferences) setPreferences(valid.preferences);
        if (valid.achievements) {
          setAchievementState(sanitizeAchievementState(valid.achievements));
        }
        showTempBanner('ok', 'Прогресс, заметки и карточки восстановлены из JSON');
      } catch {
        showTempBanner('err', 'Ошибка чтения JSON-файла при импорте');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetProgress = () => {
    setSrMap({});
    setQuizStats(DEFAULT_QUIZ_STATS);
    setTaskMastery({});
    setActivityLog({});
    setPlannerSettings(DEFAULT_PLANNER_SETTINGS);
    setRewardState(createDefaultRewardState());
    setAchievementState(createDefaultAchievementState());
    setAchievementToastQueue([]);
    setCardFilter('all');
    setConfirmReset(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.SR_MAP);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_MASTERY);
      localStorage.removeItem(STORAGE_KEYS.QUIZ_STATS);
      localStorage.removeItem(STORAGE_KEYS.TASK_MASTERY);
      localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOG);
      localStorage.removeItem(STORAGE_KEYS.PLANNER);
      localStorage.removeItem(STORAGE_KEYS.REWARDS);
      localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
    } catch {
      // ignore
    }
    showTempBanner('ok', 'Статистика заучивания, достижений и задач сброшена');
  };

  // Readiness Dashboard metrics (combined Theory + Practice)
  const dashboardStats = useMemo(() => {
    let known = 0;
    let inProgress = 0;
    let hard = 0;
    let unseen = 0;

    for (const c of activeCategoryCards) {
      const sr = getCardSRState(srMap, c.id);
      if (sr.status === 'known') known++;
      else if (sr.status === 'learning') inProgress++;
      else if (sr.status === 'hard') hard++;
      else unseen++;
    }

    let tasksSolved = 0;
    let tasksHint = 0;
    for (const t of activeCategoryTasks) {
      const st = taskMastery[t.id] ?? 'unsolved';
      if (st === 'solved') tasksSolved++;
      else if (st === 'hint') tasksHint++;
    }

    const totalCards = Math.max(1, activeCategoryCards.length);
    const totalTasks = Math.max(1, activeCategoryTasks.length);
    const theoryPct =
      ((known * 1 + inProgress * 0.55 + hard * 0.2) / totalCards) * 100;
    const practicePct =
      ((tasksSolved * 1 + tasksHint * 0.5) / totalTasks) * 100;

    // Combined readiness: 65% theory + 35% practice (or 100% theory if no practice tasks)
    const readinessPct = Math.min(
      100,
      Math.round(
        activeCategoryTasks.length > 0
          ? theoryPct * 0.65 + practicePct * 0.35
          : theoryPct,
      ),
    );
    const knownPct = Math.round((known / totalCards) * 100);
    const progressBarInProgressPct = Math.round(
      ((inProgress + hard) / totalCards) * 100,
    );

    return {
      total: activeCategoryCards.length,
      known,
      inProgress,
      hard,
      unseen,
      tasksSolved,
      tasksHint,
      tasksTotal: activeCategoryTasks.length,
      readinessPct,
      knownPct,
      progressBarInProgressPct,
    };
  }, [activeCategoryCards, activeCategoryTasks, srMap, taskMastery]);

  // Current Session Statistics (since last page refresh)
  const sessionStats = useMemo(() => {
    const totalReviewed = sessionHistory.length;
    const uniqueCardIds = new Set(sessionHistory.map((h) => h.questionId));
    let goodOrEasy = 0;
    let againOrHard = 0;
    for (const item of sessionHistory) {
      if (item.grade === 'good' || item.grade === 'easy') {
        goodOrEasy++;
      } else {
        againOrHard++;
      }
    }
    return {
      totalReviewed,
      uniqueCount: uniqueCardIds.size,
      goodOrEasy,
      againOrHard,
    };
  }, [sessionHistory]);

  const todayFocusMinutes = activityLog[getLocalDateKey()]?.focusMinutes ?? 0;

  const {todayTotal, currentStreak, bestStreak} = useMemo(
    () => computeActivityStreaks(activityLog, plannerSettings.dailyGoal),
    [activityLog, plannerSettings.dailyGoal],
  );

  const quickPlanSummary = useMemo(() => {
    const now = Date.now();
    const examDateIso =
      plannerSettings.examDates[studyCategory] ?? addDaysToDateKey(14);
    const todayMidnight = new Date(`${getLocalDateKey()}T00:00:00`).getTime();
    const targetMidnight = new Date(`${examDateIso}T00:00:00`).getTime();
    const rawDays = Math.ceil((targetMidnight - todayMidnight) / 86400000);
    const daysLeft = Math.max(1, Number.isFinite(rawDays) ? rawDays : 7);
    let weakCount = 0;
    for (const c of activeCategoryCards) {
      const sr = getCardSRState(srMap, c.id);
      const isOverdue = sr.nextReviewAt !== undefined && sr.nextReviewAt <= now;
      if (sr.lapses > 0 || sr.status === 'hard' || isOverdue) weakCount++;
    }
    return {
      daysLeft,
      isPastDue: Number.isFinite(rawDays) && rawDays < 0,
      weakCount,
    };
  }, [plannerSettings.examDates, studyCategory, activeCategoryCards, srMap]);

  const nextCustomId = useMemo(() => {
    const allKnownIds = [
      ...EXAM_QUESTIONS,
      ...RK_QUESTIONS,
      ...MATAN_QUESTIONS,
      ...customCards,
      ...customSubjects.flatMap((s) => s.cards),
    ].map((c) => c.id);
    const maxId = allKnownIds.reduce((m, id) => Math.max(m, id), 700);
    return Math.max(701, maxId + 1);
  }, [customCards, customSubjects]);

  const nextImportedPdfCardId = useMemo(() => {
    const importedIds = customSubjects.flatMap((s) => s.cards.map((c) => c.id));
    return Math.max(2000, ...importedIds) + 1;
  }, [customSubjects]);

  const achievementSnapshot = useMemo(
    () => ({
      srMap,
      taskMastery,
      activityLog,
      dailyGoal: plannerSettings.dailyGoal,
      quizStats,
      counters: achievementState.counters,
    }),
    [
      srMap,
      taskMastery,
      activityLog,
      plannerSettings.dailyGoal,
      quizStats,
      achievementState.counters,
    ],
  );

  // Evaluate achievements whenever progress or streaks change
  useEffect(() => {
    const {nextUnlocked, newlyUnlocked} = evaluateAchievements(
      achievementState,
      achievementSnapshot,
    );
    if (!achievementSilentSyncDoneRef.current) {
      achievementSilentSyncDoneRef.current = true;
      if (newlyUnlocked.length > 0) {
        setAchievementState((prev) => ({...prev, unlocked: nextUnlocked}));
      }
      return;
    }
    if (newlyUnlocked.length > 0) {
      setAchievementState((prev) => ({...prev, unlocked: nextUnlocked}));
      setAchievementToastQueue((prev) => [...prev, ...newlyUnlocked]);
      const bonusXp = newlyUnlocked.reduce((sum, a) => sum + a.rewardXp, 0);
      if (bonusXp > 0) {
        grantStudyXp(bonusXp);
      }
    }
  }, [achievementState, achievementSnapshot, grantStudyXp]);

  const activeAchievementToast = achievementToastQueue[0] ?? null;

  // Auto-dismiss active achievement toast and celebrate with subtle confetti
  useEffect(() => {
    if (!activeAchievementToast) return;
    if (preferences.confettiEnabled) {
      void confetti({
        particleCount: 48,
        spread: 64,
        startVelocity: 34,
        origin: {x: 0.85, y: 0.22},
        colors: ['#fbbf24', '#fde68a', '#34d399', '#38bdf8', '#e2e8f0'],
        disableForReducedMotion: true,
      });
    }
    const timer = window.setTimeout(() => {
      setAchievementToastQueue((prev) => prev.slice(1));
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [activeAchievementToast, preferences.confettiEnabled]);

  const unlockedAchievementsCount = useMemo(
    () => Object.keys(achievementState.unlocked).length,
    [achievementState.unlocked],
  );

  const navItems: {id: AppSection; label: string; compactLabel: string}[] = [
    {
      id: 'flashcards',
      label:
        studyCategory === 'rk'
          ? `Теория (${activeCategoryCards.length})`
          : studyCategory === 'matan'
            ? `Теория (${activeCategoryCards.length})`
            : activeCustomSubject
              ? `Карточки (${activeCategoryCards.length})`
              : 'Карточки',
      compactLabel: 'Теория',
    },
    {
      id: 'tasks',
      label:
        studyCategory === 'rk'
          ? `Задачи (${activeCategoryTasks.length})`
          : studyCategory === 'matan'
            ? `Задачи (${activeCategoryTasks.length})`
            : 'Задачи',
      compactLabel: 'Задачи',
    },
    {id: 'simulator', label: 'Билет', compactLabel: 'Билет'},
    {id: 'quiz', label: 'Блиц-тест', compactLabel: 'Блиц'},
    {
      id: 'lectures',
      label:
        studyCategory === 'rk'
          ? 'PDF Ангема'
          : studyCategory === 'matan'
            ? 'PDF Матан'
            : activeCustomSubject
              ? 'PDF'
              : 'Лекции',
      compactLabel: 'PDF',
    },
    {
      id: 'guide',
      label: 'Гайд',
      compactLabel: 'Гайд',
    },
  ];

  const highestUnlockedReward = getHighestUnlockedReward(rewardState);
  const nextLockedReward = getNextLockedReward(rewardState);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-clip prism-canvas text-slate-900 dark:text-[#E5E7EB] transition-colors duration-200">
      <AmbientSnowBackdrop
        snowEnabled={preferences.snowEnabled}
        warmGlowEnabled={preferences.warmGlowEnabled}
      />

      {/* Top Bar: Resilient 1024-1440px Subject Switcher + Compact Nav + Snow/Stats/Settings/Theme */}
      <header className="no-print sticky top-0 z-30 prism-header border-b border-slate-200/70 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-16 py-2 flex items-center justify-between gap-2.5">
          {/* Subject Switcher: Full Labels Without Right-Edge Clipping on 1024-1440px */}
          <div className="flex items-center gap-2 min-w-0 flex-1 xl:flex-initial">
            <div
              role="group"
              aria-label="Переключение предмета подготовки"
              className="flex items-center gap-1 p-1 rounded-full border border-slate-200/80 dark:border-white/[0.1] bg-slate-100/80 dark:bg-[#0E1522]/95 overflow-x-auto no-scrollbar max-w-full"
            >
              <button
                type="button"
                onClick={() => handleCategoryChange('rk')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  studyCategory === 'rk'
                    ? 'prism-tab-active'
                    : 'text-slate-600 hover:text-slate-950 dark:text-[#9CA3AF] dark:hover:text-[#F8FAFC]'
                }`}
              >
                Ангем (РК + Экз)
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('exam')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  studyCategory === 'exam'
                    ? 'prism-tab-active'
                    : 'text-slate-600 hover:text-slate-950 dark:text-[#9CA3AF] dark:hover:text-[#F8FAFC]'
                }`}
              >
                Экзамен (АИП)
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('matan')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  studyCategory === 'matan'
                    ? 'prism-tab-active'
                    : 'text-slate-600 hover:text-slate-950 dark:text-[#9CA3AF] dark:hover:text-[#F8FAFC]'
                }`}
              >
                Экзамен (Матан)
              </button>
              {customSubjects.map((subj) => (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => handleCategoryChange(subj.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    studyCategory === subj.id
                      ? 'prism-tab-active'
                      : 'text-slate-600 hover:text-slate-950 dark:text-[#9CA3AF] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  {subj.shortName}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPdfImporterOpen(true)}
                title="Создать свой предмет из PDF-конспекта"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full text-slate-600 dark:text-[#CBD5E1] hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/[0.08] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          <nav
            aria-label="Основная навигация"
            className="hidden xl:flex items-center gap-2.5 text-[13px] font-medium shrink-0"
          >
            {navItems.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-slate-950 dark:text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-[#9CA3AF] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  {item.compactLabel}
                  {active && (
                    <span className="absolute left-0 right-0 bottom-0 h-[2px] rounded-full rainbow-shimmer-bar" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Always-Visible XP Capsule (Pinned in Sticky Header) */}
            {preferences.showXpInHeader && (
              <button
                type="button"
                onClick={() => {
                  setRewardsInitialTab('shop');
                  setRewardsOpen(true);
                }}
                aria-label={`Баланс опыта: ${rewardState.balanceXp} XP. Открыть награды и допуски`}
                title={
                  highestUnlockedReward
                    ? `Доступна награда «${highestUnlockedReward.title}» (${highestUnlockedReward.costXp} XP) — нажмите, чтобы забрать!`
                    : nextLockedReward
                      ? `Баланс: ${rewardState.balanceXp} XP · До «${nextLockedReward.title}»: ещё ${Math.max(0, nextLockedReward.costXp - rewardState.balanceXp)} XP`
                      : `Баланс: ${rewardState.balanceXp} XP · Открыть награды и допуски`
                }
                className={`warm-xp-pill inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 cursor-pointer ${
                  highestUnlockedReward ? 'warm-xp-pill-ready' : ''
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300 shrink-0" />
                <span className="font-mono tabular-nums">
                  {rewardState.balanceXp} XP
                </span>
              </button>
            )}

            {/* Achievements Showcase Button */}
            <button
              type="button"
              onClick={() => {
                setRewardsInitialTab('achievements');
                setRewardsOpen(true);
              }}
              aria-label="Открыть зал достижений зимней сессии"
              title={`Зал достижений зимней сессии (${SESSION_ACHIEVEMENTS_TOTAL} ачивок + награды XP)`}
              className="prism-tool-btn inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-full text-slate-700 dark:text-[#E5E7EB] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300 shrink-0" />
              <span className="font-mono tabular-nums text-[11px]">
                {(rewardState.claimedAchievementIds ?? []).length}/
                {SESSION_ACHIEVEMENTS_TOTAL}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAllStatsOpen(true)}
              aria-label="Открыть всю статистику в одном блоке"
              className="rainbow-shimmer-btn inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              <BarChart3 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="hidden md:inline">Статистика</span>
              <span className="font-mono tabular-nums text-[11px] text-slate-600 dark:text-cyan-300/95">
                <span className="hidden md:inline">· </span>
                {dashboardStats.readinessPct}%
              </span>
            </button>

            {/* Quick Snow Toggle Button */}
            <button
              type="button"
              onClick={() =>
                handleUpdatePreferences({snowEnabled: !preferences.snowEnabled})
              }
              aria-pressed={preferences.snowEnabled}
              aria-label={
                preferences.snowEnabled
                  ? 'Выключить зимний снег на фоне'
                  : 'Включить зимний снег на фоне'
              }
              title={
                preferences.snowEnabled
                  ? 'Снег на фоне: ВКЛ (нажмите, чтобы выключить)'
                  : 'Снег на фоне: ВЫКЛ (нажмите, чтобы включить)'
              }
              className={`prism-tool-btn inline-flex items-center justify-center p-2 text-xs font-medium rounded-full shrink-0 cursor-pointer ${
                preferences.snowEnabled
                  ? '!border-cyan-400/40 dark:!border-cyan-400/35 text-cyan-500 dark:text-cyan-300'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Snowflake className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Открыть настройки"
              title="Настройки (снег, фокус, резервная копия JSON, установка PWA)"
              className="prism-tool-btn inline-flex items-center justify-center p-2 text-xs font-medium rounded-full text-slate-700 dark:text-[#E5E7EB] shrink-0 cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 text-slate-600 dark:text-[#CBD5E1]" />
            </button>

            <button
              type="button"
              onClick={() =>
                setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
              }
              aria-label={
                theme === 'dark'
                  ? 'Переключить на светлую тему'
                  : 'Переключить на тёмную тему'
              }
              title={
                theme === 'dark'
                  ? 'Переключить на светлую тему'
                  : 'Переключить на тёмную тему'
              }
              className="prism-tool-btn inline-flex items-center justify-center p-2 text-xs font-medium rounded-full text-slate-700 dark:text-[#E5E7EB] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Navigation Strip */}
      <div className="no-print relative z-20 xl:hidden border-b border-slate-200/70 dark:border-white/[0.08] bg-white/80 dark:bg-[#070B12]/90 backdrop-blur-md px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'prism-tab-active font-semibold'
                    : 'bg-slate-100/80 text-slate-600 dark:bg-[#131B2B] dark:text-[#9CA3AF]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="no-print relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-7">
        {/* ONE Unified, Decluttered Top Preparation Panel */}
        <section className="mb-6 prism-surface rounded-[20px] p-4 sm:p-5">
          {/* Hidden JSON import input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFileChange}
            className="hidden"
          />

          {/* Row 1: Daily Goal Ring + Readiness Metrics + Focus Soundscape & Pomodoro */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 shrink-0">
                <DailyGoalRing
                  todayTotal={todayTotal}
                  dailyGoal={plannerSettings.dailyGoal}
                  onClick={() => setAllStatsOpen(true)}
                />
                <label
                  className="inline-flex flex-col items-start gap-0.5 shrink-0"
                  title="Изменить дневную цель повторений (от 5 до 100 в день)"
                >
                  <span className="text-[10px] font-medium text-slate-500 dark:text-[#9CA3AF] leading-none">
                    Цель/день
                  </span>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    step={1}
                    inputMode="numeric"
                    aria-label="Дневная цель повторений"
                    value={dailyGoalDraft}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      setDailyGoalDraft(nextVal);
                      const parsed = Number(nextVal);
                      if (
                        Number.isFinite(parsed) &&
                        parsed >= 5 &&
                        parsed <= 100
                      ) {
                        handleUpdatePlanner({dailyGoal: Math.round(parsed)});
                      }
                    }}
                    onBlur={() => commitDailyGoal(dailyGoalDraft)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        commitDailyGoal(dailyGoalDraft);
                        e.currentTarget.blur();
                      }
                    }}
                    className="prism-input w-14 h-7 px-2 text-xs font-mono font-semibold text-center tabular-nums rounded-lg text-slate-900 dark:text-[#F8FAFC]"
                  />
                </label>
              </div>

              <div className="hidden sm:block h-10 w-px bg-slate-200/80 dark:bg-white/[0.08] shrink-0" />

              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs">
                  {/* Group A: Subject Readiness & Core Mastery */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 tabular-nums">
                    <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      {activeCustomSubject
                        ? `Готовность (${activeCustomSubject.shortName}):`
                        : studyCategory === 'rk'
                          ? 'Готовность к Ангему:'
                          : studyCategory === 'matan'
                            ? 'Готовность к Матану:'
                            : 'Готовность к АИП:'}{' '}
                      <strong className="font-mono text-cyan-700 dark:text-cyan-300">
                        {dashboardStats.readinessPct}%
                      </strong>
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-white/15">·</span>
                    <span className="text-slate-600 dark:text-[#9CA3AF]">
                      Теория{' '}
                      <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                        {dashboardStats.known}/{dashboardStats.total}
                      </strong>
                    </span>
                    {dashboardStats.tasksTotal > 0 && (
                      <>
                        <span aria-hidden="true" className="text-slate-300 dark:text-white/15">·</span>
                        <span className="text-slate-600 dark:text-[#9CA3AF]">
                          Задачи{' '}
                          <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                            {dashboardStats.tasksSolved}/{dashboardStats.tasksTotal}
                          </strong>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Group B: Streak, XP & Exam Countdown */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-600 dark:text-[#9CA3AF] tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-amber-500" />
                      <strong className="font-mono text-slate-900 dark:text-[#F8FAFC]">
                        {currentStreak} дн.
                      </strong>
                      {(rewardState.streakFreezes ?? 0) > 0 && (
                        <span
                          title={`Заморозка стрика активна: в запасе ${rewardState.streakFreezes} из 3`}
                          className="ml-0.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/15 border border-cyan-400/35 text-cyan-700 dark:text-cyan-300"
                        >
                          ❄️×{rewardState.streakFreezes}
                        </span>
                      )}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-white/15">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRewardsInitialTab('shop');
                        setRewardsOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 hover:text-amber-600 dark:hover:text-amber-200 transition-colors cursor-pointer"
                      title="Открыть допуски и награды за XP"
                    >
                      <Sparkles className="h-3 w-3 shrink-0" />
                      <strong className="font-mono">
                        {rewardState.balanceXp}
                        {nextLockedReward ? `/${nextLockedReward.costXp}` : ''} XP
                      </strong>
                    </button>
                    <span aria-hidden="true" className="hidden sm:inline text-slate-300 dark:text-white/15">·</span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-slate-500 dark:text-[#9CA3AF]">
                      <Calendar className="h-3 w-3 text-slate-400 dark:text-[#64748B]" />
                      <span>
                        {quickPlanSummary.isPastDue
                          ? 'Срок прошёл'
                          : `До сдачи: ${quickPlanSummary.daysLeft} дн.`}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Signature Lime -> Emerald -> Cyan Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden flex">
                  <div
                    className="h-full prism-progress-fill transition-all duration-300"
                    style={{width: `${dashboardStats.knownPct}%`}}
                    title={`Выучено: ${dashboardStats.known}`}
                  />
                  <div
                    className="h-full bg-cyan-400/45 dark:bg-cyan-400/30 transition-all duration-300"
                    style={{width: `${dashboardStats.progressBarInProgressPct}%`}}
                    title={`В процессе повторения: ${dashboardStats.inProgress + dashboardStats.hard}`}
                  />
                </div>
              </div>
            </div>

            {/* Focus Controls Cluster: Soundscape + Pomodoro Timer */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <FocusSoundscape />
              <PomodoroTimer
                focusMinutes={preferences.focusMinutes}
                breakMinutes={preferences.breakMinutes}
                onChangeDurations={(focusMinutes, breakMinutes) => {
                  handleUpdatePreferences({focusMinutes, breakMinutes});
                  handleUpdatePlanner({
                    pomodoroMode: focusMinutes >= 50 ? '50/10' : '25/5',
                  });
                }}
                onFocusMinuteCompleted={handleFocusMinuteCompleted}
                sessionReviewsCount={sessionStats.totalReviewed}
                remainingCardsToMaster={dashboardStats.total - dashboardStats.known}
                totalFocusMinutesToday={todayFocusMinutes}
              />
            </div>
          </div>

          {/* Row 2: Non-Clipped Flex-Wrap Simulator Strip + Compact 'Ещё' Dropdown on Right */}
          <div className="mt-3.5 pt-3 border-t border-slate-200/70 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 py-0.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={handleStartWeakSprint}
                className="prism-tool-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-slate-800 dark:text-[#F3F4F6] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>
                  Спринт по слабым{' '}
                  <span className="font-mono tabular-nums opacity-80">
                    ({quickPlanSummary.weakCount})
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSection('simulator')}
                className="prism-cta inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Target className="h-3.5 w-3.5 shrink-0" />
                <span>Сгенерировать билет</span>
              </button>

              <button
                type="button"
                onClick={() => setKnowledgeGraphOpen(true)}
                className="prism-tool-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#D1D5DB] hover:text-slate-950 dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <GitBranch className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>Дерево навыков</span>
              </button>

              <button
                type="button"
                onClick={() => setSpotTheLieOpen(true)}
                className="prism-tool-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#D1D5DB] hover:text-slate-950 dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>Найди ложь (30с)</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenOralExamForActiveDeck()}
                className="prism-tool-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#D1D5DB] hover:text-slate-950 dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <GraduationCap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>Устный экзамен</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenFeynmanForActiveDeck()}
                className="prism-tool-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#D1D5DB] hover:text-slate-950 dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Brain className="h-3.5 w-3.5 text-fuchsia-500 dark:text-fuchsia-400 shrink-0" />
                <span>Фейнман (1-курснику)</span>
              </button>

              <button
                type="button"
                onClick={() => setCramModeOpen(true)}
                className="prism-tool-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#D1D5DB] hover:text-slate-950 dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>Ночь перед экз.</span>
              </button>

              <button
                type="button"
                onClick={() => setCheatSheetOpen(true)}
                className="prism-tool-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#D1D5DB] hover:text-slate-950 dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                <span>Шпаргалка + PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRewardsInitialTab('shop');
                  setRewardsOpen(true);
                }}
                className="prism-tool-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#D1D5DB] hover:text-slate-950 dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300 shrink-0" />
                <span>Награды и ачивки</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Active Break Permit Live Pill */}
              {(() => {
                const activeLeftMs = rewardState.activeBreak
                  ? Math.max(0, rewardState.activeBreak.endsAt - breakNowMs)
                  : 0;
                const activeMins = Math.ceil(activeLeftMs / 60000);
                if (activeLeftMs <= 0) return null;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setRewardsInitialTab('shop');
                      setRewardsOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-mono tabular-nums">
                      Отдых · {activeMins}м
                    </span>
                  </button>
                );
              })()}

              {/* Compact 'Ещё' Dropdown Menu (Custom Cards, JSON Export/Import) */}
              <div ref={modesMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setModesMenuOpen((v) => !v)}
                  aria-expanded={modesMenuOpen}
                  aria-haspopup="menu"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    modesMenuOpen
                      ? 'prism-tab-active'
                      : 'prism-tool-btn text-slate-800 dark:text-[#F3F4F6]'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Ещё</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${modesMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {modesMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-[280px] sm:w-[310px] z-40 rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/95 dark:bg-[#0E1522]/96 backdrop-blur-xl shadow-2xl p-3 space-y-2.5"
                  >
                    <div className="px-1 pt-0.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8]">
                      <span>Инструменты и резервная копия</span>
                      {sessionStats.totalReviewed > 0 && (
                        <button
                          type="button"
                          onClick={() => setSessionHistory([])}
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-600 dark:text-cyan-300 hover:underline cursor-pointer"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          <span>Сессия: {sessionStats.totalReviewed}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setModesMenuOpen(false);
                          setCustomModalOpen(true);
                        }}
                        className="prism-tool-btn inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-full text-slate-700 dark:text-[#E5E7EB] cursor-pointer"
                      >
                        <Plus className="h-3 w-3 text-cyan-400" />
                        <span>Своя карточка</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setModesMenuOpen(false);
                          setPdfImporterOpen(true);
                        }}
                        className="prism-tool-btn inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-full text-slate-700 dark:text-[#E5E7EB] cursor-pointer"
                      >
                        <FilePlus2 className="h-3 w-3 text-emerald-400" />
                        <span>+ PDF предмет</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setModesMenuOpen(false);
                          handleExportBackup();
                        }}
                        className="prism-tool-btn inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-full text-slate-700 dark:text-[#E5E7EB] cursor-pointer"
                      >
                        <Download className="h-3 w-3 text-emerald-400" />
                        <span>Экспорт JSON</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setModesMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="prism-tool-btn inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-full text-slate-700 dark:text-[#E5E7EB] cursor-pointer"
                      >
                        <Upload className="h-3 w-3 text-cyan-400" />
                        <span>Импорт JSON</span>
                      </button>

                      {activeCustomSubject && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setModesMenuOpen(false);
                            handleDeleteCustomSubject(activeCustomSubject.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-full text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Удалить «{activeCustomSubject.shortName}»</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {bannerMsg && (
            <div
              className={`mt-3 rounded-xl border px-3.5 py-2 text-xs flex items-center gap-2 ${
                bannerMsg.kind === 'ok'
                  ? 'border-emerald-300/80 bg-emerald-50/90 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/35 dark:text-emerald-200'
                  : 'border-rose-300/80 bg-rose-50/90 text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/35 dark:text-rose-200'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{bannerMsg.text}</span>
            </div>
          )}
        </section>

        {/* Page Section Header */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-[#9CA3AF]">
              {activeCustomSubject
                ? `Импортированный предмет из PDF: ${activeCustomSubject.fileName}`
                : studyCategory === 'rk'
                  ? 'Аналитическая геометрия · 1-й семестр · ИУ6 · РК 1 (модуль 1), РК 2 и Экзамен (лекции 1–5, 8–9)'
                  : studyCategory === 'matan'
                    ? 'Математический анализ · 1-й семестр · ИУ, РЛ, ПС, РТ · G22 · Экзамен (теория + 5 комплектов задач)'
                    : 'Алгоритмизация и программирование · 1 семестр · МГТУ им. Н.Э. Баумана, ИУ6'}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-[#F3F4F6]">
              {section === 'flashcards' &&
                (activeCustomSubject
                  ? `${activeCustomSubject.name} · Карточки (${activeCategoryCards.length})`
                  : studyCategory === 'rk'
                    ? `Теория Ангем (РК 1, РК 2 и Экзамен) · Карточки (${activeCategoryCards.length})`
                    : studyCategory === 'matan'
                      ? `Теория Матан · Билеты, определения и методички Ч.1–3 (${activeCategoryCards.length})`
                      : `Карточки интервального повторения (${activeCategoryCards.length})`)}
              {section === 'simulator' &&
                (activeCustomSubject
                  ? `Генератор билета · ${activeCustomSubject.name}`
                  : studyCategory === 'rk'
                    ? 'Генератор билета Ангем (РК и Экзамен · таймер и порог)'
                    : studyCategory === 'matan'
                      ? 'Генератор экзаменационного билета Матан G22 (40 баллов)'
                      : 'Генератор реального экзаменационного билета АИП')}
              {section === 'quiz' &&
                (activeCustomSubject
                  ? `Блиц-тест и конструктор шагов · ${activeCustomSubject.name}`
                  : studyCategory === 'rk'
                    ? 'Блиц-тест, формулы за 10 сек, конструктор шагов и устная защита Ангем'
                    : studyCategory === 'matan'
                      ? 'Блиц-тест, формулы за 10 сек, конструктор доказательств и устная защита Матан'
                      : 'Блиц-тест, термины за 10 сек, конструктор шагов и устная самопроверка АИП')}
              {section === 'tasks' &&
                (activeCustomSubject
                  ? `Практика · ${activeCustomSubject.name}`
                  : studyCategory === 'rk'
                    ? 'Практика Ангем · 17 задач РК 2 + бесконечный генератор и проверка по фото'
                    : studyCategory === 'matan'
                      ? `Практика Матан · ${activeCategoryTasks.length} задач (G22 + методички Ч.1–3) + графики и автопроверка`
                      : `Задачи к экзамену, РК и учебнику C++ (${activeCategoryTasks.length})`)}
              {section === 'audit' &&
                (activeCustomSubject
                  ? `Аудит полноты · ${activeCustomSubject.name}`
                  : studyCategory === 'rk'
                    ? `Аудит полноты Ангем: ${activeCategoryCards.length} вопросов теории (РК 1, РК 2, лекции) + ${activeCategoryTasks.length} задач`
                    : studyCategory === 'matan'
                      ? `Аудит полноты Матан: 49 теорем + 48 определений + 18 метод. + ${activeCategoryTasks.length} задач`
                      : `Аудит полноты АИП: 50 билетов + 12 доп. тем + 28 вопросов учебника C++ + ${activeCategoryTasks.length} задач`)}
              {section === 'lectures' &&
                (activeCustomSubject
                  ? `Источник PDF · ${activeCustomSubject.fileName}`
                  : studyCategory === 'rk'
                    ? 'Исходные PDF по Ангему: РК 1, РК 2 и лекции 1–5, 8–9 (7 док. · 67 стр.)'
                    : studyCategory === 'matan'
                      ? 'Исходные PDF Матана: теория (62 с.), задачи G22 (32 с.) и методички МГТУ Ч.1–3 (96 с.)'
                      : 'Конспекты лекций (1.1–1.8) и Учебник C++ (51 с.)')}
              {section === 'guide' &&
                'Гайд и обучение · Как готовиться к зимней сессии на максимум'}
            </h1>
          </div>

          <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-[#9CA3AF] whitespace-nowrap">
            {activeCustomSubject
              ? `Свой PDF · ${activeCategoryCards.length} карточек SM-2`
              : studyCategory === 'rk'
                ? `Теория: ${activeCategoryCards.length} карт. (РК 2 + РК 1 + лекции) · Практика: ${activeCategoryTasks.length} задач`
                : studyCategory === 'matan'
                  ? `Теория: ${activeCategoryCards.length} карт. (49+48+18 метод.) · Практика: ${activeCategoryTasks.length} задач`
                  : `SM-2 / Лейтнер · 1–50 билеты + 51–62 доп. + 63–90 учебник C++`}
          </p>
        </div>

        {section === 'flashcards' && (
          <FlashcardStage
            category={studyCategory}
            allCards={activeCategoryCards}
            srMap={srMap}
            onRateGrade={handleRateGrade}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestionId={setSelectedQuestionId}
            activeFilter={cardFilter}
            onFilterChange={setCardFilter}
            onOpenAddCustomCard={() => setCustomModalOpen(true)}
            onDeleteCustomCard={handleDeleteCustomCard}
            externalChapter={externalChapter}
            chapterJumpToken={chapterJumpToken}
            cardNotes={cardNotes}
            onSaveCardNote={handleSaveCardNote}
            onOpenOralExam={(card) => setOralExamCard(card)}
            onOpenFeynman={(card) => setFeynmanCard(card)}
            skillSubset={skillSubset}
            onClearSkillSubset={() => setSkillSubset(null)}
          />
        )}

        {section === 'simulator' && (
          <ExamSimulator
            category={studyCategory}
            allCards={activeCategoryCards}
            tasks={activeCategoryTasks}
            onRateCard={handleRateGrade}
            onSetTaskMastery={handleSetTaskMastery}
            onOpenOralExam={(card) => setOralExamCard(card)}
          />
        )}

        {section === 'quiz' && (
          <BlitzQuiz
            category={studyCategory}
            allCards={activeCategoryCards}
            srMap={srMap}
            quizStats={quizStats}
            onRateCard={handleRateGrade}
            onRecordQuizFinish={handleRecordQuizFinish}
            onOpenCardInDeck={handleOpenQuestion}
            onOpenOralExam={(card) => setOralExamCard(card)}
          />
        )}

        {section === 'tasks' && (
          <TasksWorkspace
            category={studyCategory}
            tasks={activeCategoryTasks}
            selectedTaskId={selectedTaskId}
            onSelectTaskId={setSelectedTaskId}
            taskMastery={taskMastery}
            onSetTaskMastery={handleSetTaskMastery}
          />
        )}

        {section === 'audit' && (
          <CompletenessAudit
            category={studyCategory}
            allCards={activeCategoryCards}
            tasks={activeCategoryTasks}
            srMap={srMap}
            onOpenQuestion={handleOpenQuestion}
            onOpenTask={handleOpenTask}
          />
        )}

        {section === 'lectures' && (
          <LecturesLibrary category={studyCategory} />
        )}

        {section === 'guide' && (
          <GuideWorkspace
            currentSubject={studyCategory}
            subjectTitle={activeSubjectDisplayTitle}
            onSelectSection={setSection}
            onStartWeakSprint={handleStartWeakSprint}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenKnowledgeGraph={() => setKnowledgeGraphOpen(true)}
            onOpenSpotTheLie={() => setSpotTheLieOpen(true)}
            onOpenOralExam={() => handleOpenOralExamForActiveDeck()}
            onOpenFeynman={() => handleOpenFeynmanForActiveDeck()}
            onOpenLastNight={() => setCramModeOpen(true)}
            onOpenCheatSheet={() => setCheatSheetOpen(true)}
            onOpenRewards={() => {
              setRewardsInitialTab('shop');
              setRewardsOpen(true);
            }}
            onExportBackup={handleExportBackup}
            onImportBackupClick={() => fileInputRef.current?.click()}
          />
        )}
      </main>

      {/* Quiet Footer (Zero Edge/Bottom Clipping on Narrow & Wide Screens) */}
      <footer className="no-print relative z-10 shrink-0 w-full border-t border-slate-200/70 dark:border-white/[0.08] py-5 pb-7 px-4 sm:px-6 bg-white/40 dark:bg-white/[0.015]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 text-xs leading-relaxed text-slate-600 dark:text-[#9CA3AF]">
          <span className="min-w-0 flex-1 break-words">
            {activeCustomSubject
              ? `Свой предмет «${activeCustomSubject.name}» (${activeCategoryCards.length} карточек, сохранено локально в браузере)`
              : studyCategory === 'rk'
                ? `Полная база по Аналитической геометрии: РК 1 (40 вопросов), РК 2 (32 вопроса + 17 задач) и лекции 1–5, 8–9 (${activeCategoryCards.length} карточек и 7 PDF-документов)`
                : studyCategory === 'matan'
                  ? `Полная база Экзамена по Матану (1 семестр, G22 + Методички МГТУ Ч.1–3): 49 вопросов с доказательствами, 48 базовых определений, 18 методических карточек и ${activeCategoryTasks.length} решённых задач`
                  : `Полная база АИП: 50 билетов, 12 доп. тем лекций 1.1–1.8, 28 контрольных вопросов и ${activeCategoryTasks.length} задач C++ из учебника`}
          </span>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 self-start md:self-center shrink-0 whitespace-nowrap text-slate-600 dark:text-[#CBD5E1] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span>Сбросить прогресс заучивания</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center max-w-full">
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                Подтвердить сброс прогресса?
              </span>
              <button
                type="button"
                onClick={handleResetProgress}
                className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-medium hover:bg-rose-500 whitespace-nowrap cursor-pointer"
              >
                Да, сбросить
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1 rounded-full prism-tool-btn text-slate-700 dark:text-[#CBD5E1] whitespace-nowrap cursor-pointer"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      </footer>

      {customModalOpen && (
        <CustomCardModal
          category={studyCategory}
          nextId={nextCustomId}
          onSave={handleAddCustomCard}
          onClose={() => setCustomModalOpen(false)}
        />
      )}

      {cheatSheetOpen && (
        <FormulaCheatSheetModal
          category={studyCategory}
          subjectTitle={activeSubjectDisplayTitle}
          allCards={activeCategoryCards}
          srMap={srMap}
          onClose={() => setCheatSheetOpen(false)}
        />
      )}

      {cramModeOpen && (
        <CramModeModal
          subjectTitle={activeSubjectDisplayTitle}
          allCards={activeCategoryCards}
          srMap={srMap}
          onRateCard={handleRateGrade}
          onClose={() => setCramModeOpen(false)}
        />
      )}

      {oralExamCard && (
        <OralExamDialogModal
          initialCard={oralExamCard}
          allCards={activeCategoryCards}
          onRateCard={handleRateGrade}
          onClose={() => setOralExamCard(null)}
          onOpenSettings={() => {
            setOralExamCard(null);
            setSettingsOpen(true);
          }}
        />
      )}

      {pdfImporterOpen && (
        <PdfSubjectImporterModal
          nextCardIdStart={nextImportedPdfCardId}
          onSaveSubject={handleSaveCustomSubject}
          onClose={() => setPdfImporterOpen(false)}
        />
      )}

      {spotTheLieOpen && (
        <SpotTheLieModal
          category={studyCategory}
          subjectTitle={activeSubjectDisplayTitle}
          allCards={activeCategoryCards}
          onOpenCardInDeck={handleOpenQuestion}
          onCorrectRound={() => {
            setAchievementState((prev) => ({
              ...prev,
              counters: {
                ...prev.counters,
                spotTheLieWins: prev.counters.spotTheLieWins + 1,
              },
            }));
            grantStudyXp(3);
          }}
          onClose={() => setSpotTheLieOpen(false)}
        />
      )}

      {knowledgeGraphOpen && (
        <KnowledgeGraphModal
          category={studyCategory}
          subjectTitle={activeSubjectDisplayTitle}
          allCards={activeCategoryCards}
          srMap={srMap}
          onJumpToCard={handleOpenQuestion}
          onOpenTopicInDeck={handleOpenTopicInDeck}
          onClose={() => setKnowledgeGraphOpen(false)}
        />
      )}

      {feynmanCard && (
        <FeynmanFreshmanModal
          initialCard={feynmanCard}
          allCards={activeCategoryCards}
          onRateCard={handleRateGrade}
          onClose={() => setFeynmanCard(null)}
          onOpenSettings={() => {
            setFeynmanCard(null);
            setSettingsOpen(true);
          }}
        />
      )}

      {rewardsOpen && (
        <RewardsModal
          rewardState={rewardState}
          initialTab={rewardsInitialTab}
          srMap={srMap}
          taskMastery={taskMastery}
          quizStats={quizStats}
          activityLog={activityLog}
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          cardNotes={cardNotes}
          activeCategoryCards={activeCategoryCards}
          activeCategoryTasks={activeCategoryTasks}
          readinessPct={dashboardStats.readinessPct}
          onClaimReward={handleClaimReward}
          onBuyStreakFreeze={handleBuyStreakFreeze}
          onClaimAchievement={handleClaimAchievement}
          onClaimAllAchievements={handleClaimAllAchievements}
          onEndActiveBreak={handleEndActiveBreak}
          onAddCustomReward={handleAddCustomReward}
          onDeleteReward={handleDeleteReward}
          onRestoreDefaults={handleRestoreDefaultRewards}
          onClose={() => setRewardsOpen(false)}
        />
      )}

      {allStatsOpen && (
        <AllStatsModal
          studyCategory={studyCategory}
          activeSubjectTitle={activeSubjectDisplayTitle}
          activeCategoryCards={activeCategoryCards}
          activeCategoryTasks={activeCategoryTasks}
          customCards={customCards}
          customSubjects={customSubjects}
          srMap={srMap}
          taskMastery={taskMastery}
          cardNotes={cardNotes}
          activityLog={activityLog}
          plannerSettings={plannerSettings}
          quizStats={quizStats}
          rewardState={rewardState}
          breakNowMs={breakNowMs}
          sessionStats={sessionStats}
          onSelectCategory={handleCategoryChange}
          onJumpToChapter={handleJumpToChapter}
          onStartWeakSprint={handleStartWeakSprint}
          onOpenRewards={() => {
            setRewardsInitialTab('shop');
            setRewardsOpen(true);
          }}
          onResetSession={() => setSessionHistory([])}
          onExportBackup={handleExportBackup}
          onUpdatePlanner={handleUpdatePlanner}
          onUpdateExamDate={handleUpdateExamDate}
          onOpenAudit={() => setSection('audit')}
          onClose={() => setAllStatsOpen(false)}
        />
      )}

      {achievementsOpen && (
        <AchievementsModal
          achievementState={achievementState}
          snapshot={achievementSnapshot}
          onClose={() => setAchievementsOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          preferences={preferences}
          plannerSettings={plannerSettings}
          theme={theme}
          onUpdatePreferences={handleUpdatePreferences}
          onResetPreferences={handleResetPreferences}
          onUpdatePlanner={handleUpdatePlanner}
          onChangeTheme={setTheme}
          onExportNow={handleExportBackup}
          onImportClick={() => fileInputRef.current?.click()}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Achievement Unlock Toast Notification */}
      {activeAchievementToast && (
        <AchievementToast
          achievement={activeAchievementToast}
          queuedCount={Math.max(0, achievementToastQueue.length - 1)}
          onOpenAll={() => {
            setAchievementToastQueue([]);
            setAchievementsOpen(true);
          }}
          onDismiss={() =>
            setAchievementToastQueue((prev) => prev.slice(1))
          }
        />
      )}

      {/* Celebratory Reward Stage Unlock Toast */}
      {unlockedToast && (
        <div className="no-print fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-amber-400/50 dark:border-amber-400/45 bg-white/95 dark:bg-[#121926]/95 backdrop-blur-xl shadow-[0_18px_40px_-14px_rgba(245,158,11,0.45)] p-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="text-xs font-bold tracking-tight text-amber-700 dark:text-amber-300">
              Этап пройден · Допуск открыт!
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
              Разрешено: «{unlockedToast.title}» ({unlockedToast.breakMinutes} мин)
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setUnlockedToast(null);
                  setRewardsOpen(true);
                }}
                className="prism-cta px-3 py-1 text-[11px] font-semibold rounded-full cursor-pointer"
              >
                Забрать допуск
              </button>
              <button
                type="button"
                onClick={() => setUnlockedToast(null)}
                className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 dark:text-[#9CA3AF] dark:hover:text-white cursor-pointer"
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      )}

      <OfflineIndicator />
    </div>
  );
}
