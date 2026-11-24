import {TouchEvent, useEffect, useMemo, useRef, useState} from 'react';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  HelpCircle,
  Keyboard,
  Mic,
  MicOff,
  Plus,
  RotateCcw,
  Search,
  Send,
  Shuffle,
  Sparkles,
  StickyNote,
  Trash2,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  EXAM_QUESTION_CHAPTERS,
  LECTURES,
  MATAN_QUESTION_CHAPTERS,
  RK_QUESTION_CHAPTERS,
} from '../data';
import {
  CardSRState,
  LectureId,
  QuestionChapter,
  RecallGrade,
  StudyCategory,
  TheoryCard,
} from '../types/study';
import {getCardHint} from '../utils/cardHelpers';
import {
  formatIntervalLabel,
  getCardMasteryPercent,
  getCardSRState,
  getCardUrgencyScore,
  getCardVisualTier,
} from '../utils/spacedRepetition';
import {
  AnswerEvaluationResult,
  buildCardAnswerSpeechText,
  evaluateFollowUpWithProfessor,
  evaluateStudentAnswerWithProfessor,
  FollowUpEvaluationResult,
  HybridVoiceRecorderHandle,
  speakRussianText,
  startHybridVoiceRecording,
  stopSpeaking,
} from '../utils/speechAndGrading';
import {MathBlock} from './MathBlock';
import {SlideAttachmentsPanel} from './SlideAttachmentsPanel';

export type DeckStatusFilter =
  | 'all'
  | 'weak_sprint'
  | 'hard_unlearned'
  | 'due_now'
  | 'known'
  | 'unseen';

export type DeckScopeFilter =
  | 'all'
  | 'official50'
  | 'extras'
  | 'rk_basic'
  | 'rk_advanced'
  | 'rk_tasks'
  | 'rk_ticket'
  | 'matan_theorems'
  | 'matan_defs'
  | 'custom';

interface FlashcardStageProps {
  category: StudyCategory;
  allCards: TheoryCard[];
  srMap: Record<number, CardSRState>;
  onRateGrade: (questionId: number, grade: RecallGrade) => void;
  selectedQuestionId: number;
  onSelectQuestionId: (id: number) => void;
  activeFilter: DeckStatusFilter;
  onFilterChange: (filter: DeckStatusFilter) => void;
  onOpenAddCustomCard: () => void;
  onDeleteCustomCard: (id: number) => void;
  externalChapter?: QuestionChapter | null;
  chapterJumpToken?: number;
  cardNotes: Record<number, string>;
  onSaveCardNote: (cardId: number, note: string) => void;
  onOpenOralExam?: (card: TheoryCard) => void;
  onOpenFeynman?: (card: TheoryCard) => void;
  skillSubset?: {label: string; cardIds: number[]} | null;
  onClearSkillSubset?: () => void;
}

const GRADE_LABELS: Record<RecallGrade, string> = {
  again: '1 · Не помню',
  hard: '2 · Сложно',
  good: '3 · Хорошо',
  easy: '4 · Легко',
};

export function FlashcardStage({
  category,
  allCards,
  srMap,
  onRateGrade,
  selectedQuestionId,
  onSelectQuestionId,
  activeFilter,
  onFilterChange,
  onOpenAddCustomCard,
  onDeleteCustomCard,
  externalChapter,
  chapterJumpToken,
  cardNotes,
  onSaveCardNote,
  onOpenOralExam,
  onOpenFeynman,
  skillSubset,
  onClearSkillSubset,
}: FlashcardStageProps) {
  const [chapterFilter, setChapterFilter] = useState<'all' | QuestionChapter>('all');
  const [lectureFilter, setLectureFilter] = useState<'all' | LectureId>('all');
  const [scopeFilter, setScopeFilter] = useState<DeckScopeFilter>('all');
  const [smartQueue, setSmartQueue] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState<number[] | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync external chapter jump (e.g. clicking a weak topic in StudyAnalyticsPanel)
  useEffect(() => {
    if (externalChapter && chapterJumpToken) {
      setChapterFilter(externalChapter);
      setScopeFilter('all');
      setLectureFilter('all');
      setSearchQuery('');
    }
  }, [externalChapter, chapterJumpToken]);

  // Clear local sub-filters when jumping from Knowledge Graph Skill Tree
  useEffect(() => {
    if (skillSubset) {
      setChapterFilter('all');
      setScopeFilter('all');
      setLectureFilter('all');
      setSearchQuery('');
    }
  }, [skillSubset]);

  // Reset scope/chapter/lecture filters when switching between Exam and RK
  useEffect(() => {
    setChapterFilter('all');
    setLectureFilter('all');
    setScopeFilter('all');
    setShuffledOrder(null);
  }, [category]);

  // Web Speech API TTS state ('question' | 'answer' | null)
  const [speakingTarget, setSpeakingTarget] = useState<'question' | 'answer' | null>(
    null,
  );

  // Oral / Text Exam Answer Mode (collapsed by default to keep SM-2 buttons close to first fold)
  const [examInputExpanded, setExamInputExpanded] = useState<boolean>(false);
  const [answerInputMode, setAnswerInputMode] = useState<'voice' | 'text'>('voice');
  const [userAnswerText, setUserAnswerText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string>('');
  const [evaluation, setEvaluation] = useState<AnswerEvaluationResult | null>(null);

  // 1-round examiner follow-up defense state
  const [followUpOpen, setFollowUpOpen] = useState<boolean>(false);
  const [followUpText, setFollowUpText] = useState<string>('');
  const [isEvaluatingFollowUp, setIsEvaluatingFollowUp] = useState<boolean>(false);
  const [isRecordingFollowUp, setIsRecordingFollowUp] = useState<boolean>(false);
  const [followUpResult, setFollowUpResult] =
    useState<FollowUpEvaluationResult | null>(null);

  // Personal note / mnemonic editor toggle
  const [noteOpen, setNoteOpen] = useState<boolean>(false);

  const voiceRecorderRef = useRef<HybridVoiceRecorderHandle | null>(null);
  const followUpRecorderRef = useRef<HybridVoiceRecorderHandle | null>(null);

  // Touch swipe tracking for mobile ergonomics
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const availableChapters = useMemo(() => {
    if (category === 'rk') return RK_QUESTION_CHAPTERS;
    if (category === 'matan') return MATAN_QUESTION_CHAPTERS;
    if (category.startsWith('custom_')) {
      return Array.from(new Set(allCards.map((c) => c.chapter)));
    }
    return EXAM_QUESTION_CHAPTERS;
  }, [category, allCards]);

  const availableLectures = useMemo(
    () =>
      category === 'rk'
        ? LECTURES.filter((l) => l.category === 'rk')
        : category === 'matan'
          ? LECTURES.filter((l) => l.category === 'matan')
          : category.startsWith('custom_')
            ? []
            : LECTURES.filter(
                (l) =>
                  l.category !== 'rk' &&
                  l.category !== 'matan' &&
                  l.id !== 'exam',
              ),
    [category],
  );

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = Date.now();
    const skillIdSet =
      skillSubset && skillSubset.cardIds.length > 0
        ? new Set(skillSubset.cardIds)
        : null;

    const base = allCards.filter((card) => {
      if (skillIdSet && !skillIdSet.has(card.id)) return false;
      if (scopeFilter === 'official50' && card.id > 50) return false;
      if (scopeFilter === 'extras' && (card.id <= 50 || card.isCustom)) return false;
      if (scopeFilter === 'rk_basic' && (card.id < 201 || card.id > 224)) return false;
      if (scopeFilter === 'rk_advanced' && (card.id < 225 || card.id > 232))
        return false;
      if (scopeFilter === 'rk_tasks' && (card.id < 233 || card.id > 249))
        return false;
      if (
        scopeFilter === 'rk_ticket' &&
        !card.slides.some((s) => s.lectureId === 'rk2_angeom' && s.page === 4)
      ) {
        return false;
      }
      if (scopeFilter === 'matan_theorems' && (card.id < 501 || card.id > 549)) {
        return false;
      }
      if (scopeFilter === 'matan_defs' && (card.id < 551 || card.id > 598)) {
        return false;
      }
      if (scopeFilter === 'custom' && !card.isCustom) return false;

      if (chapterFilter !== 'all' && card.chapter !== chapterFilter) {
        return false;
      }
      if (
        lectureFilter !== 'all' &&
        !card.slides.some((s) => s.lectureId === lectureFilter)
      ) {
        return false;
      }

      const sr = getCardSRState(srMap, card.id);
      if (activeFilter === 'weak_sprint') {
        const isWeak =
          sr.lapses > 0 ||
          sr.status === 'hard' ||
          (sr.nextReviewAt !== undefined && sr.nextReviewAt <= now);
        if (!isWeak) return false;
      }
      if (activeFilter === 'hard_unlearned' && sr.status === 'known') {
        return false;
      }
      if (activeFilter === 'due_now') {
        const isDue =
          sr.status === 'hard' ||
          (sr.nextReviewAt !== undefined && sr.nextReviewAt <= now);
        if (!isDue) return false;
      }
      if (activeFilter === 'known' && sr.status !== 'known') {
        return false;
      }
      if (activeFilter === 'unseen' && sr.status !== 'unseen') {
        return false;
      }

      if (q) {
        const hay = `${card.id} ${card.badgeLabel ?? ''} ${card.question} ${card.keyThesis} ${card.answerPoints.join(' ')} ${card.codeSnippet?.code ?? ''}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });

    if (shuffledOrder) {
      const rank = new Map(shuffledOrder.map((id, idx) => [id, idx]));
      return [...base].sort(
        (a, b) => (rank.get(a.id) ?? 9999) - (rank.get(b.id) ?? 9999),
      );
    }

    if (smartQueue) {
      return [...base].sort((a, b) => {
        const scoreA = getCardUrgencyScore(getCardSRState(srMap, a.id), now);
        const scoreB = getCardUrgencyScore(getCardSRState(srMap, b.id), now);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.id - b.id;
      });
    }

    return base;
  }, [
    allCards,
    scopeFilter,
    chapterFilter,
    lectureFilter,
    srMap,
    activeFilter,
    searchQuery,
    shuffledOrder,
    smartQueue,
    skillSubset,
  ]);

  const currentIndex = useMemo(() => {
    const idx = filteredCards.findIndex((c) => c.id === selectedQuestionId);
    return idx >= 0 ? idx : 0;
  }, [filteredCards, selectedQuestionId]);

  const activeCard: TheoryCard | undefined = filteredCards[currentIndex];

  useEffect(() => {
    if (activeCard && activeCard.id !== selectedQuestionId) {
      onSelectQuestionId(activeCard.id);
    }
  }, [activeCard, selectedQuestionId, onSelectQuestionId]);

  const stopVoiceRecording = async (): Promise<string> => {
    const handle = voiceRecorderRef.current;
    voiceRecorderRef.current = null;
    setIsRecording(false);
    if (handle) {
      try {
        return await handle.stop();
      } catch {
        return userAnswerText;
      }
    }
    return userAnswerText;
  };

  // Reset per-card states when switching cards
  useEffect(() => {
    setRevealed(false);
    setShowHint(false);
    setCopiedCode(false);
    setExamInputExpanded(false);
    setUserAnswerText('');
    setEvaluation(null);
    setFollowUpOpen(false);
    setFollowUpText('');
    setFollowUpResult(null);
    setIsEvaluatingFollowUp(false);
    setIsRecordingFollowUp(false);
    setNoteOpen(false);
    setSpeechError('');
    setIsEvaluating(false);
    setIsTranscribing(false);
    stopSpeaking();
    setSpeakingTarget(null);
    void stopVoiceRecording();
    if (followUpRecorderRef.current) {
      void followUpRecorderRef.current.stop();
      followUpRecorderRef.current = null;
    }
  }, [activeCard?.id]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      void stopVoiceRecording();
      if (followUpRecorderRef.current) {
        void followUpRecorderRef.current.stop();
        followUpRecorderRef.current = null;
      }
    };
  }, []);

  const handleSpeakQuestion = () => {
    if (!activeCard) return;
    if (speakingTarget === 'question') {
      stopSpeaking();
      setSpeakingTarget(null);
      return;
    }
    speakRussianText(
      `Вопрос номер ${activeCard.id}. ${activeCard.question}`,
      () => setSpeakingTarget('question'),
      () => setSpeakingTarget(null),
    );
  };

  const handleSpeakAnswer = () => {
    if (!activeCard) return;
    if (speakingTarget === 'answer') {
      stopSpeaking();
      setSpeakingTarget(null);
      return;
    }
    speakRussianText(
      buildCardAnswerSpeechText(activeCard),
      () => setSpeakingTarget('answer'),
      () => setSpeakingTarget(null),
    );
  };

  const handleToggleVoiceRecording = async () => {
    if (isRecording) {
      await stopVoiceRecording();
      return;
    }
    stopSpeaking();
    setSpeakingTarget(null);
    setSpeechError('');

    const handle = await startHybridVoiceRecording({
      initialText: userAnswerText,
      questionContext: activeCard?.question,
      onLiveText: (txt) => setUserAnswerText(txt),
      onTranscribingChange: (flag) => setIsTranscribing(flag),
      onError: (msg) => {
        setSpeechError(msg);
        setIsRecording(false);
      },
      onStop: () => {
        setIsRecording(false);
      },
    });

    if (handle) {
      voiceRecorderRef.current = handle;
      setIsRecording(true);
    }
  };

  const handleEvaluateAndReveal = async () => {
    if (!activeCard || isEvaluating) return;
    setSpeechError('');
    let finalAnswer = userAnswerText;
    if (isRecording) {
      finalAnswer = await stopVoiceRecording();
    }
    setIsEvaluating(true);
    setFollowUpOpen(false);
    setFollowUpText('');
    setFollowUpResult(null);
    try {
      const res = await evaluateStudentAnswerWithProfessor(
        activeCard,
        finalAnswer,
      );
      setEvaluation(res);
      setRevealed(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleToggleFollowUpVoice = async () => {
    if (isRecordingFollowUp) {
      const h = followUpRecorderRef.current;
      followUpRecorderRef.current = null;
      setIsRecordingFollowUp(false);
      if (h) {
        const finalTxt = await h.stop();
        if (finalTxt) setFollowUpText(finalTxt);
      }
      return;
    }
    const handle = await startHybridVoiceRecording({
      initialText: followUpText,
      questionContext: evaluation?.followUpQuestion ?? activeCard?.question,
      onLiveText: (txt) => setFollowUpText(txt),
      onError: () => setIsRecordingFollowUp(false),
      onStop: () => setIsRecordingFollowUp(false),
    });
    if (handle) {
      followUpRecorderRef.current = handle;
      setIsRecordingFollowUp(true);
    }
  };

  const handleSubmitFollowUp = async () => {
    if (
      !activeCard ||
      !evaluation?.followUpQuestion ||
      isEvaluatingFollowUp
    ) {
      return;
    }
    let answer = followUpText;
    if (isRecordingFollowUp && followUpRecorderRef.current) {
      answer = await followUpRecorderRef.current.stop();
      followUpRecorderRef.current = null;
      setIsRecordingFollowUp(false);
      setFollowUpText(answer);
    }
    if (!answer.trim()) return;
    setIsEvaluatingFollowUp(true);
    try {
      const res = await evaluateFollowUpWithProfessor(
        activeCard,
        userAnswerText,
        evaluation.followUpQuestion,
        answer,
        evaluation.scorePct,
      );
      setFollowUpResult(res);
      setEvaluation((prev) =>
        prev
          ? {
              ...prev,
              scorePct: res.updatedScorePct,
              recommendedGrade: res.recommendedGrade,
            }
          : prev,
      );
    } finally {
      setIsEvaluatingFollowUp(false);
    }
  };

  const goPrev = () => {
    if (filteredCards.length === 0) return;
    const prevIdx =
      currentIndex > 0 ? currentIndex - 1 : filteredCards.length - 1;
    onSelectQuestionId(filteredCards[prevIdx].id);
  };

  const goNext = () => {
    if (filteredCards.length === 0) return;
    const nextIdx =
      currentIndex < filteredCards.length - 1 ? currentIndex + 1 : 0;
    onSelectQuestionId(filteredCards[nextIdx].id);
  };

  const handleGradeClick = (grade: RecallGrade) => {
    if (!activeCard) return;
    stopSpeaking();
    stopVoiceRecording();
    const currentId = activeCard.id;
    const nextIdx =
      currentIndex < filteredCards.length - 1 ? currentIndex + 1 : 0;
    const nextCardId = filteredCards[nextIdx]?.id;
    onRateGrade(currentId, grade);
    if (nextCardId !== undefined && nextCardId !== currentId) {
      onSelectQuestionId(nextCardId);
    } else {
      setRevealed(false);
      setEvaluation(null);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (!activeCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setRevealed((r) => !r);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'h' || e.key === 'H' || e.key === 'р' || e.key === 'Р') {
        setShowHint((h) => !h);
      } else if (e.key === '1') {
        handleGradeClick('again');
      } else if (e.key === '2') {
        handleGradeClick('hard');
      } else if (e.key === '3') {
        handleGradeClick('good');
      } else if (e.key === '4') {
        handleGradeClick('easy');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleTouchStart = (e: TouchEvent<HTMLElement>) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLElement>) => {
    const t = e.changedTouches[0];
    if (!t || touchStartX.current === null || touchStartY.current === null) {
      return;
    }
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  const handleShuffle = () => {
    if (shuffledOrder) {
      setShuffledOrder(null);
      return;
    }
    const ids = allCards.map((c) => c.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setSmartQueue(false);
    setShuffledOrder(ids);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1600);
    } catch {
      // Clipboard may be unavailable in restricted contexts
    }
  };

  const counts = useMemo(() => {
    let known = 0;
    let hardUnlearned = 0;
    let dueNow = 0;
    let unseen = 0;
    let weakSprint = 0;
    const now = Date.now();

    for (const q of allCards) {
      const sr = getCardSRState(srMap, q.id);
      if (sr.status === 'known') {
        known++;
      } else {
        hardUnlearned++;
      }
      if (sr.status === 'unseen') {
        unseen++;
      }
      const isOverdue =
        sr.nextReviewAt !== undefined && sr.nextReviewAt <= now;
      if (sr.status === 'hard' || isOverdue) {
        dueNow++;
      }
      if (sr.lapses > 0 || sr.status === 'hard' || isOverdue) {
        weakSprint++;
      }
    }
    return {known, hardUnlearned, dueNow, unseen, weakSprint};
  }, [allCards, srMap]);

  const activeSR = activeCard
    ? getCardSRState(srMap, activeCard.id)
    : undefined;

  const activeMasteryPct = activeSR
    ? Math.max(
        getCardMasteryPercent(activeSR),
        evaluation && evaluation.scorePct >= 95 ? evaluation.scorePct : 0,
      )
    : 0;

  const activeVisualTier = activeSR
    ? activeMasteryPct >= 95
      ? 'rainbow'
      : getCardVisualTier(activeSR)
    : 'unseen';

  const tierMeta = (() => {
    switch (activeVisualTier) {
      case 'rainbow':
        return {
          label: `Мастерство · ${activeMasteryPct}%`,
          dotClass: 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-300',
          badgeClass:
            'rainbow-mastered-badge text-slate-900 dark:text-[#F8FAFC] font-semibold',
        };
      case 'known':
        return {
          label: `Выучено · ${activeMasteryPct}%`,
          dotClass: 'bg-emerald-400',
          badgeClass:
            'bg-emerald-500/14 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
        };
      case 'learning':
        return {
          label: `Хорошо · ${activeMasteryPct}%`,
          dotClass: 'bg-cyan-400',
          badgeClass:
            'bg-cyan-500/14 border border-cyan-500/30 text-cyan-800 dark:text-cyan-300',
        };
      case 'hard':
        return {
          label: `Сложно · ${activeMasteryPct}%`,
          dotClass: 'bg-amber-400',
          badgeClass:
            'bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-300',
        };
      case 'again':
        return {
          label: `Не помню · ${activeMasteryPct}%`,
          dotClass: 'bg-rose-500',
          badgeClass:
            'bg-rose-500/15 border border-rose-500/35 text-rose-800 dark:text-rose-300',
        };
      default:
        return {
          label: 'Новая · 0%',
          dotClass: 'bg-slate-400 dark:bg-slate-500',
          badgeClass:
            'bg-slate-100/90 dark:bg-[#131B2B] border border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8]',
        };
    }
  })();

  return (
    <div className="flex flex-col gap-6">
      {/* Active Skill Tree Topic / Prerequisite Subset Banner */}
      {skillSubset && skillSubset.cardIds.length > 0 && (
        <div className="rounded-2xl border border-violet-400/35 bg-violet-500/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-violet-950 dark:text-violet-200 font-medium">
            <Sparkles className="h-4 w-4 text-violet-500 dark:text-violet-400 shrink-0" />
            <span>
              Подборка из Дерева навыков:{' '}
              <strong className="font-bold">{skillSubset.label}</strong> (
              <span className="font-mono tabular-nums">{filteredCards.length}</span> карт.)
            </span>
          </div>
          {onClearSkillSubset && (
            <button
              type="button"
              onClick={onClearSkillSubset}
              className="prism-tool-btn px-3 py-1 rounded-full text-violet-900 dark:text-violet-200 font-semibold cursor-pointer"
            >
              Показать всю колоду
            </button>
          )}
        </div>
      )}

      {/* Filter, Search & Spaced Repetition Controls */}
      <section className="prism-surface rounded-[20px] p-4 sm:p-5 space-y-3.5">
        {/* Top Row: Unified Segmented Filter Control + Secondary Deck Tools */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Фильтры состояния карточек"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full border border-slate-200/80 dark:border-white/[0.07] bg-slate-100/85 dark:bg-[#070B12]/80"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'all'}
              onClick={() => onFilterChange('all')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                activeFilter === 'all'
                  ? 'prism-tab-active font-semibold'
                  : 'text-slate-600 hover:text-slate-950 dark:text-[#9CA3AF] dark:hover:text-[#F8FAFC]'
              }`}
            >
              Все ({allCards.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'weak_sprint'}
              onClick={() => onFilterChange('weak_sprint')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                activeFilter === 'weak_sprint'
                  ? 'prism-tab-active font-semibold'
                  : 'text-slate-600 hover:text-slate-950 dark:text-[#9CA3AF] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Zap className="h-3 w-3 text-rose-500 dark:text-rose-400" />
              <span>Слабые места ({counts.weakSprint})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'hard_unlearned'}
              onClick={() => onFilterChange('hard_unlearned')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                activeFilter === 'hard_unlearned'
                  ? 'prism-tab-active font-semibold'
                  : 'text-slate-600 hover:text-slate-950 dark:text-[#9CA3AF] dark:hover:text-[#F8FAFC]'
              }`}
            >
              Невыученные ({counts.hardUnlearned})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'due_now'}
              onClick={() => onFilterChange('due_now')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                activeFilter === 'due_now'
                  ? 'prism-tab-active font-semibold'
                  : 'text-slate-600 hover:text-slate-950 dark:text-[#9CA3AF] dark:hover:text-[#F8FAFC]'
              }`}
            >
              Повторить сейчас ({counts.dueNow})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'known'}
              onClick={() => onFilterChange('known')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                activeFilter === 'known'
                  ? 'prism-tab-active font-semibold'
                  : 'text-slate-600 hover:text-slate-950 dark:text-[#9CA3AF] dark:hover:text-[#F8FAFC]'
              }`}
            >
              Выучено ({counts.known})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSmartQueue((s) => !s);
                setShuffledOrder(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                smartQueue
                  ? 'prism-tab-active font-semibold'
                  : 'prism-tool-btn text-slate-700 dark:text-[#D1D5DB]'
              }`}
              title="Автоматически поднимает карточки с ошибками и подошедшим сроком повтора SM-2 наверх"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Умная очередь SM-2</span>
            </button>

            <button
              type="button"
              onClick={handleShuffle}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                shuffledOrder
                  ? 'prism-tab-active font-semibold'
                  : 'prism-tool-btn text-slate-700 dark:text-[#D1D5DB]'
              }`}
            >
              <Shuffle className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
              <span>{shuffledOrder ? 'По порядку' : 'Перемешать'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddCustomCard}
              className="prism-tool-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-slate-800 dark:text-[#F8FAFC] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Своя карточка</span>
            </button>
          </div>
        </div>

        {/* Second Row: Strictly Aligned Search + 3 Selects (Identical Height 42px) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-3 border-t border-slate-200/70 dark:border-white/[0.06] items-center">
          <div className="relative lg:col-span-4">
            <Search className="h-4 w-4 text-slate-400 dark:text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                category === 'rk'
                  ? 'Быстрый поиск (минор, ранг, ФСР, Крамер)...'
                  : category === 'matan'
                    ? 'Быстрый поиск (предел, Коши, Лагранж, Тейлор)...'
                    : 'Быстрый поиск (термин, вопрос, оператор C++)...'
              }
              aria-label="Поиск по всем вопросам и ответам"
              className="prism-input w-full h-[42px] pl-10 pr-3.5 text-xs rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder:text-slate-400 dark:placeholder:text-[#64748B]"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as DeckScopeFilter)}
              aria-label="Раздел колоды"
              className="prism-input w-full h-[42px] px-3 text-xs rounded-xl text-slate-900 dark:text-[#E5E7EB] cursor-pointer"
            >
              {category === 'rk' ? (
                <>
                  <option value="all">Вся теория РК 2 ({allCards.length})</option>
                  <option value="rk_basic">Базовая теория (1–24)</option>
                  <option value="rk_advanced">Повыш. сложность с док-вом (1–8)</option>
                  <option value="rk_ticket">Типовой билет по теории (4 вопр.)</option>
                  <option value="custom">Свои карточки</option>
                </>
              ) : category === 'matan' ? (
                <>
                  <option value="all">Вся теория Матан ({allCards.length})</option>
                  <option value="matan_theorems">49 экзаменационных вопросов (1–49)</option>
                  <option value="matan_defs">48 базовых определений (1–48)</option>
                  <option value="custom">Свои карточки</option>
                </>
              ) : (
                <>
                  <option value="all">Вся база ({allCards.length})</option>
                  <option value="official50">Билеты экзамена (1–50)</option>
                  <option value="extras">Доп. темы лекций (51–62)</option>
                  <option value="custom">Свои карточки</option>
                </>
              )}
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={lectureFilter}
              onChange={(e) =>
                setLectureFilter(e.target.value as 'all' | LectureId)
              }
              aria-label="Фильтр по конкретной лекции"
              className="prism-input w-full h-[42px] px-3 text-xs rounded-xl text-slate-900 dark:text-[#E5E7EB] cursor-pointer"
            >
              <option value="all">
                {category === 'rk'
                  ? 'Все материалы РК 2 (стр. 1–4)'
                  : category === 'matan'
                    ? 'Все PDF Матана (5 док. · 190 с.)'
                    : 'Все лекции (1.1–1.8)'}
              </option>
              {availableLectures.map((lec) => (
                <option key={lec.id} value={lec.id}>
                  {lec.shortTitle} · {lec.title}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={chapterFilter}
              onChange={(e) =>
                setChapterFilter(e.target.value as 'all' | QuestionChapter)
              }
              aria-label="Фильтр по главе курса"
              className="prism-input w-full h-[42px] px-3 text-xs rounded-xl text-slate-900 dark:text-[#E5E7EB] cursor-pointer"
            >
              <option value="all">
                {category === 'rk'
                  ? 'Все разделы РК 2'
                  : category === 'matan'
                    ? 'Все разделы Матана (7)'
                    : 'Все главы (1–8)'}
              </option>
              {availableChapters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Main Balanced Two-Column Workbench (Card + Slides aligned in height) */}
      {!activeCard ? (
        <div className="prism-surface rounded-[20px] p-10 text-center">
          <p className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Нет карточек по выбранному фильтру
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
            Сбросьте фильтры или выберите отображение всей базы вопросов.
          </p>
          <button
            type="button"
            onClick={() => {
              onFilterChange('all');
              setScopeFilter('all');
              setLectureFilter('all');
              setChapterFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 prism-cta inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Сбросить фильтры</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Zone: Focal Active Flashcard (Generous 28-32px Padding + Subtle Mastery Frame if >= 95%) */}
            <div className="lg:col-span-7 flex flex-col min-w-0">
              <article
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`flex flex-col justify-between rounded-[20px] p-6 sm:p-7 transition-colors ${
                  activeVisualTier === 'rainbow'
                    ? 'rainbow-mastered-card'
                    : 'prism-card-hero'
                }`}
              >
                <div>
                  {/* a) Top Card Header: Ticket Meta, Color-Coded Mastery Pill & Speak Capsule */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-[#9CA3AF]">
                      <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-300 tabular-nums">
                        {activeCard.badgeLabel
                          ? activeCard.badgeLabel
                          : activeCard.id <= 50
                            ? `Билет №${activeCard.id} / 50`
                            : activeCard.isCustom
                              ? `Своя №${activeCard.id}`
                              : `Доп. тема №${activeCard.id}`}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-white/15">·</span>
                      <span className="truncate max-w-[260px]">{activeCard.chapter}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-white/15">·</span>
                      <span className="font-mono tabular-nums">
                        {currentIndex + 1}/{filteredCards.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activeSR && (
                        <span
                          title={`Коробка ${activeSR.box}/4 · ${formatIntervalLabel(activeSR)}${activeSR.lapses > 0 ? ` · Ошибок: ${activeSR.lapses}` : ''}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono tabular-nums ${tierMeta.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${tierMeta.dotClass}`} />
                          <span>{tierMeta.label}</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={handleSpeakQuestion}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                          speakingTarget === 'question'
                            ? 'prism-tab-active font-semibold'
                            : 'prism-tool-btn text-slate-700 dark:text-[#D1D5DB]'
                        }`}
                        title="Озвучить текст вопроса с помощью Web Speech API"
                      >
                        {speakingTarget === 'question' ? (
                          <>
                            <VolumeX className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
                            <span>Стоп</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                            <span>Озвучить</span>
                          </>
                        )}
                      </button>

                      {activeCard.isCustom && (
                        <button
                          type="button"
                          onClick={() => onDeleteCustomCard(activeCard.id)}
                          className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                          title="Удалить свою карточку"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Spacious, High-Contrast Question Title */}
                  <div className="mt-5">
                    <h2 className="text-xl sm:text-[26px] font-bold leading-snug tracking-tight text-slate-950 dark:text-[#F8FAFC]">
                      {activeCard.question}
                    </h2>
                    {activeSR && (
                      <p className="mt-2 text-[11px] font-mono tabular-nums text-slate-500 dark:text-[#64748B]">
                        Коробка {activeSR.box}/4 · {formatIntervalLabel(activeSR)}
                        {activeSR.lapses > 0 && (
                          <span className="text-rose-600 dark:text-rose-400">
                            {' '}
                            · Ошибок: {activeSR.lapses}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* b) Primary Action Bar: Prominent Show Answer + Quiet Secondary Capsules + Compact Prev/Next */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 pt-5 border-t border-slate-200/70 dark:border-white/[0.07]">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRevealed((r) => !r)}
                        className={`${
                          revealed
                            ? 'prism-tool-btn text-slate-800 dark:text-[#F1F5F9]'
                            : 'prism-cta'
                        } inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-[13px] font-semibold rounded-full whitespace-nowrap shrink-0 cursor-pointer`}
                      >
                        {revealed ? (
                          <>
                            <EyeOff className="h-4 w-4 text-slate-500 dark:text-[#94A3B8]" />
                            <span>Скрыть ответ (Пробел)</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 text-cyan-400" />
                            <span>Показать ответ (Пробел)</span>
                          </>
                        )}
                      </button>

                      {!revealed && (
                        <button
                          type="button"
                          onClick={() => setShowHint((h) => !h)}
                          className="prism-tool-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-full text-slate-700 dark:text-[#D1D5DB] whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <HelpCircle className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>{showHint ? 'Скрыть' : 'Подсказка (H)'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={goPrev}
                        className="prism-tool-btn inline-flex items-center justify-center h-9 px-3 gap-1 text-xs font-medium rounded-full text-slate-700 dark:text-[#D1D5DB] whitespace-nowrap shrink-0 cursor-pointer"
                        aria-label="Предыдущий вопрос"
                        title="Предыдущий вопрос (←)"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Назад</span>
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="prism-tool-btn inline-flex items-center justify-center h-9 px-3 gap-1 text-xs font-medium rounded-full text-slate-700 dark:text-[#D1D5DB] whitespace-nowrap shrink-0 cursor-pointer"
                        aria-label="Следующий вопрос"
                        title="Следующий вопрос (→)"
                      >
                        <span className="hidden sm:inline">Далее</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Hint Box when unrevealed */}
                  {!revealed && showHint && (
                    <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/[0.08] p-4 text-xs sm:text-sm text-cyan-950 dark:text-cyan-100">
                      <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                        Подсказка:{' '}
                      </span>
                      {getCardHint(activeCard)}
                    </div>
                  )}

                  {/* c) Compact Collapsible 'Ответ как на экзамене' Module */}
                  {(() => {
                    const isExamInputOpen =
                      examInputExpanded ||
                      isRecording ||
                      isTranscribing ||
                      isEvaluating ||
                      Boolean(userAnswerText.trim()) ||
                      Boolean(evaluation);

                    if (!isExamInputOpen) {
                      return (
                        <div className="mt-5 prism-subpanel rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                              Ответ как на экзамене
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-[#9CA3AF]">
                              Самопроверка с ИИ-экзаменатором (по смыслу, без зубрёжки)
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setAnswerInputMode('voice');
                                setExamInputExpanded(true);
                                void handleToggleVoiceRecording();
                              }}
                              className="prism-tool-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full text-slate-800 dark:text-[#F1F5F9] whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Mic className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                              <span>Ответить голосом</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAnswerInputMode('text');
                                setExamInputExpanded(true);
                              }}
                              className="prism-tool-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#CBD5E1] whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Keyboard className="h-3.5 w-3.5 text-slate-500 dark:text-[#94A3B8]" />
                              <span>Написать текстом</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                  <div className="mt-5 prism-subpanel rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                          Ответ как на экзамене
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-[#9CA3AF]">
                          Расскажите суть своими словами — оценивается понимание, а не зубрёжка
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full border border-slate-200/80 dark:border-white/[0.07] bg-slate-100/85 dark:bg-[#0E1522]">
                          <button
                            type="button"
                            onClick={() => setAnswerInputMode('voice')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                              answerInputMode === 'voice'
                                ? 'prism-tab-active font-semibold'
                                : 'text-slate-600 hover:text-slate-950 dark:text-[#9CA3AF] dark:hover:text-white'
                            }`}
                          >
                            <Mic className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                            <span>Голос</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void stopVoiceRecording();
                              setAnswerInputMode('text');
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                              answerInputMode === 'text'
                                ? 'prism-tab-active font-semibold'
                                : 'text-slate-600 hover:text-slate-950 dark:text-[#9CA3AF] dark:hover:text-white'
                            }`}
                          >
                            <Keyboard className="h-3 w-3" />
                            <span>Текст</span>
                          </button>
                        </div>

                        {!isRecording && !isTranscribing && !isEvaluating && (
                          <button
                            type="button"
                            onClick={() => {
                              setExamInputExpanded(false);
                              if (!evaluation && !userAnswerText.trim()) {
                                setSpeechError('');
                              }
                            }}
                            disabled={Boolean(userAnswerText.trim()) || Boolean(evaluation)}
                            title={
                              Boolean(userAnswerText.trim()) || Boolean(evaluation)
                                ? 'Очистите ответ, чтобы свернуть блок'
                                : 'Свернуть блок ответа'
                            }
                            className="prism-tool-btn inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full text-slate-600 dark:text-[#CBD5E1] disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <ChevronUp className="h-3 w-3" />
                            <span>Свернуть</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {answerInputMode === 'voice' && (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          disabled={isTranscribing || isEvaluating}
                          onClick={handleToggleVoiceRecording}
                          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 ${
                            isRecording
                              ? 'bg-rose-600/90 text-white border border-rose-400/50 hover:bg-rose-600'
                              : 'prism-tool-btn text-slate-900 dark:text-[#F1F5F9]'
                          }`}
                        >
                          {isRecording ? (
                            <>
                              <MicOff className="h-3.5 w-3.5" />
                              <span>Остановить запись</span>
                            </>
                          ) : (
                            <>
                              <Mic className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                              <span>Ответить голосом</span>
                            </>
                          )}
                        </button>

                        <span className="text-[11px] text-slate-500 dark:text-[#9CA3AF]">
                          {isTranscribing
                            ? 'Расшифровка голосового ответа...'
                            : isRecording
                              ? 'Идёт запись — говорите спокойно своими словами...'
                              : 'Нажмите микрофон или допишите ответ ниже'}
                        </span>
                      </div>
                    )}

                    {speechError && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                        <span>{speechError}</span>
                        <button
                          type="button"
                          onClick={() => void handleToggleVoiceRecording()}
                          className="prism-tool-btn inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full text-amber-800 dark:text-amber-200 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Повторить микрофон</span>
                        </button>
                      </div>
                    )}

                    <textarea
                      rows={2}
                      value={userAnswerText}
                      onChange={(e) => setUserAnswerText(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          void handleEvaluateAndReveal();
                        }
                      }}
                      placeholder={
                        answerInputMode === 'voice'
                          ? 'Здесь появится ваш устный ответ (или допишите текст вручную, Ctrl+Enter для проверки)...'
                          : 'Объясните суть своими словами, приведите пример или формулу (Ctrl+Enter для проверки)...'
                      }
                      className="prism-input w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder:text-slate-400 dark:placeholder:text-[#64748B]"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        disabled={isEvaluating || isTranscribing}
                        onClick={() => void handleEvaluateAndReveal()}
                        className="prism-tool-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full text-slate-900 dark:text-[#F8FAFC] whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                        <span>
                          {isEvaluating
                            ? 'Преподаватель оценивает...'
                            : isTranscribing
                              ? 'Распознаём голос...'
                              : 'Проверить ответ у преподавателя'}
                        </span>
                      </button>

                      {userAnswerText && !isEvaluating && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserAnswerText('');
                            setEvaluation(null);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-900 dark:text-[#9CA3AF] dark:hover:text-white transition-colors cursor-pointer"
                        >
                          Очистить
                        </button>
                      )}
                    </div>

                    {/* Evaluation Result & Grade Recommendation from Professor */}
                    {evaluation && (
                      <div
                        className={`rounded-2xl p-4 space-y-2.5 ${
                          evaluation.scorePct >= 95
                            ? 'rainbow-mastered-badge'
                            : 'border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#0E1522]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC] tabular-nums">
                              {evaluation.verdictTitle} · Понимание:{' '}
                              <span className="font-mono text-cyan-600 dark:text-cyan-300">
                                {evaluation.scorePct}%
                              </span>
                            </span>
                            {evaluation.evaluatedBy === 'local-fallback' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200/80 dark:bg-white/[0.08] text-slate-600 dark:text-[#CBD5E1]">
                                Локальная проверка по смысловым тезисам
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleGradeClick(evaluation.recommendedGrade)}
                            className="prism-cta inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <span>
                              Подтвердить «{GRADE_LABELS[evaluation.recommendedGrade]}» →
                            </span>
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-[#E5E7EB]">
                          {evaluation.verdictDetail}
                        </p>

                        {evaluation.matchedKeywords.length > 0 && (
                          <p className="text-xs text-emerald-700 dark:text-emerald-400">
                            <strong>Верно раскрыто:</strong>{' '}
                            {evaluation.matchedKeywords.join(' · ')}
                          </p>
                        )}

                        {evaluation.missedKeywords.length > 0 && (
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            <strong>Чего не хватило:</strong>{' '}
                            {evaluation.missedKeywords.join(' · ')}
                          </p>
                        )}

                        {evaluation.followUpQuestion && (
                          <div className="pt-2.5 border-t border-slate-200/70 dark:border-white/[0.07] space-y-2.5">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="text-xs text-cyan-800 dark:text-cyan-300">
                                <strong>Доп. вопрос экзаменатора:</strong>{' '}
                                {evaluation.followUpQuestion}
                              </p>
                              {!followUpOpen && !followUpResult && (
                                <button
                                  type="button"
                                  onClick={() => setFollowUpOpen(true)}
                                  className="prism-tool-btn px-3 py-1 text-xs font-semibold rounded-full text-cyan-800 dark:text-cyan-200 whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  Ответить на доп. вопрос
                                </button>
                              )}
                            </div>

                            {followUpOpen && !followUpResult && (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={followUpText}
                                  onChange={(e) => setFollowUpText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      void handleSubmitFollowUp();
                                    }
                                  }}
                                  placeholder="Ваш ответ на уточняющий вопрос экзаменатора..."
                                  className="prism-input flex-1 px-3 py-1.5 text-xs rounded-xl text-slate-900 dark:text-[#F3F4F6]"
                                />
                                <button
                                  type="button"
                                  onClick={() => void handleToggleFollowUpVoice()}
                                  className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer ${
                                    isRecordingFollowUp
                                      ? 'bg-rose-600 border border-rose-500 text-white shadow-[0_0_16px_-4px_rgba(244,63,94,0.55)]'
                                      : 'prism-tool-btn text-slate-700 dark:text-[#D1D5DB]'
                                  }`}
                                  title="Ответить на доп. вопрос голосом"
                                >
                                  {isRecordingFollowUp ? (
                                    <MicOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Mic className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  disabled={isEvaluatingFollowUp || !followUpText.trim()}
                                  onClick={() => void handleSubmitFollowUp()}
                                  className="prism-cta inline-flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-full disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  <span>
                                    {isEvaluatingFollowUp ? 'Проверка...' : 'Ответить'}
                                  </span>
                                </button>
                              </div>
                            )}

                            {followUpResult && (
                              <div
                                className={`rounded-xl border p-2.5 text-xs space-y-1 ${
                                  followUpResult.passed
                                    ? 'border-emerald-400/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                                    : 'border-amber-400/35 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                                }`}
                              >
                                <p className="font-semibold">
                                  {followUpResult.passed
                                    ? `Доп. вопрос защищён! Оценка: ${GRADE_LABELS[followUpResult.recommendedGrade]} (${followUpResult.updatedScorePct}%)`
                                    : `Уточнение не засчитано (${followUpResult.updatedScorePct}%)`}
                                </p>
                                <p>{followUpResult.professorReply}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                    );
                  })()}

                  {/* Structured Back Answer */}
                  {revealed && (
                    <div className="mt-6 space-y-5 pt-5 border-t border-slate-200/70 dark:border-white/[0.07]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                          Эталонный ответ по лекциям
                        </span>
                        <button
                          type="button"
                          onClick={handleSpeakAnswer}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                            speakingTarget === 'answer'
                              ? 'prism-tab-active font-semibold'
                              : 'prism-tool-btn text-slate-700 dark:text-[#D1D5DB]'
                          }`}
                          title="Озвучить текст ответа с помощью Web Speech API"
                        >
                          {speakingTarget === 'answer' ? (
                            <>
                              <VolumeX className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
                              <span>Остановить озвучку</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                              <span>Озвучить ответ</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="prism-subpanel rounded-2xl p-4 sm:p-5">
                        <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 mb-1.5">
                          Главный тезис (определение для начала ответа)
                        </p>
                        <p className="text-[15px] sm:text-base leading-relaxed font-bold text-slate-900 dark:text-[#F8FAFC]">
                          {activeCard.keyThesis}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-[#9CA3AF] mb-2.5">
                          Структура ответа по пунктам
                        </p>
                        <ul className="space-y-2.5">
                          {activeCard.answerPoints.map((point, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-[#D1D5DB]"
                            >
                              <span className="font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400 mt-1 tabular-nums shrink-0">
                                {idx + 1}.
                              </span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {activeCard.category === 'rk' ||
                      activeCard.category === 'matan' ? (
                        (activeCard.mathFormulaLatex || activeCard.codeSnippet) && (
                          <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/[0.06] p-4 space-y-2">
                            <p className="text-xs font-semibold text-cyan-800 dark:text-cyan-300">
                              {activeCard.codeSnippet?.title ??
                                'Математическая запись и ключевые формулы'}
                            </p>
                            {activeCard.mathFormulaLatex ? (
                              <MathBlock
                                latex={activeCard.mathFormulaLatex}
                                displayMode={true}
                              />
                            ) : (
                              <p className="text-sm leading-relaxed text-slate-800 dark:text-[#E5E7EB] whitespace-pre-line">
                                {activeCard.codeSnippet?.code}
                              </p>
                            )}
                          </div>
                        )
                      ) : (
                        activeCard.codeSnippet && (
                          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-[#070B12] text-slate-100 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.07] bg-white/[0.03]">
                              <span className="text-xs font-medium text-slate-300 truncate">
                                {activeCard.codeSnippet.title}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyCode(activeCard.codeSnippet!.code)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                {copiedCode ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>Скопировано</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Копировать</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-4 text-xs leading-relaxed overflow-x-auto font-mono text-slate-100">
                              <code>{activeCard.codeSnippet.code}</code>
                            </pre>
                          </div>
                        )
                      )}

                      <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.07] p-4">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                          Частый вопрос и ловушка на экзамене
                        </p>
                        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-amber-950 dark:text-amber-100/90">
                          {activeCard.examTip}
                        </p>
                      </div>

                      {activeCard.coverageNote && (
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-[#9CA3AF]">
                          Примечание: {activeCard.coverageNote}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Personal Mnemonic / Note Field */}
                  <div className="mt-5 pt-3.5 border-t border-slate-200/70 dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setNoteOpen((o) => !o)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-[#9CA3AF] hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                      <span>
                        {cardNotes[activeCard.id]
                          ? 'Моя заметка / мнемоника (сохранена)'
                          : 'Добавить личную заметку / мнемонику'}
                      </span>
                    </button>

                    {(noteOpen || Boolean(cardNotes[activeCard.id])) && (
                      <textarea
                        rows={2}
                        value={cardNotes[activeCard.id] ?? ''}
                        onChange={(e) => onSaveCardNote(activeCard.id, e.target.value)}
                        placeholder="Ваша ассоциация, мнемоника или короткая пометка (сохраняется автоматически)..."
                        className="prism-input mt-2 w-full px-3.5 py-2 text-xs rounded-xl text-slate-900 dark:text-[#F3F4F6] placeholder:text-slate-400 dark:placeholder:text-[#64748B]"
                      />
                    )}
                  </div>
                </div>

                {/* d) Calm SM-2 Bottom Rating Strip (Neutral at rest -> Vivid Distinct Color on Hover/Selection) */}
                <div className="mt-6 pt-4 border-t border-slate-200/70 dark:border-white/[0.07]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">
                      Оценка ответа SM-2 (клавиши 1–4):
                    </span>
                    {evaluation && (
                      <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                        Рекомендовано: {GRADE_LABELS[evaluation.recommendedGrade]}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* 1 · Не помню -> CRIMSON / ROSE */}
                    <button
                      type="button"
                      onClick={() => handleGradeClick('again')}
                      className={`group min-h-[52px] flex flex-col items-center justify-center px-3 py-2 rounded-2xl border text-center transition-colors cursor-pointer ${
                        evaluation?.recommendedGrade === 'again'
                          ? 'border-rose-500/60 bg-rose-500/14'
                          : activeSR?.lastGrade === 'again'
                            ? 'border-rose-500/45 bg-rose-500/10'
                            : 'border-slate-200/80 dark:border-white/[0.12] bg-slate-50/80 dark:bg-[#121926] hover:border-rose-500/50 hover:bg-rose-500/10'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-[#F1F5F9] group-hover:text-rose-600 dark:group-hover:text-rose-300 whitespace-nowrap">
                        <span className="h-2 w-2 rounded-full bg-rose-500/90" />
                        <span>1 · Не помню</span>
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-[#94A3B8] whitespace-nowrap">
                        сейчас · 15%
                      </span>
                    </button>

                    {/* 2 · Сложно -> AMBER */}
                    <button
                      type="button"
                      onClick={() => handleGradeClick('hard')}
                      className={`group min-h-[52px] flex flex-col items-center justify-center px-3 py-2 rounded-2xl border text-center transition-colors cursor-pointer ${
                        evaluation?.recommendedGrade === 'hard'
                          ? 'border-amber-500/60 bg-amber-500/14'
                          : activeSR?.lastGrade === 'hard'
                            ? 'border-amber-500/45 bg-amber-500/10'
                            : 'border-slate-200/80 dark:border-white/[0.12] bg-slate-50/80 dark:bg-[#121926] hover:border-amber-500/50 hover:bg-amber-500/10'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-[#F1F5F9] group-hover:text-amber-600 dark:group-hover:text-amber-300 whitespace-nowrap">
                        <span className="h-2 w-2 rounded-full bg-amber-400/90" />
                        <span>2 · Сложно</span>
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-[#94A3B8] whitespace-nowrap">
                        10 мин · 42%
                      </span>
                    </button>

                    {/* 3 · Хорошо -> CYAN */}
                    <button
                      type="button"
                      onClick={() => handleGradeClick('good')}
                      className={`group min-h-[52px] flex flex-col items-center justify-center px-3 py-2 rounded-2xl border text-center transition-colors cursor-pointer ${
                        evaluation?.recommendedGrade === 'good'
                          ? 'border-cyan-400/60 bg-cyan-500/14'
                          : activeSR?.lastGrade === 'good'
                            ? 'border-cyan-400/45 bg-cyan-500/10'
                            : 'border-slate-200/80 dark:border-white/[0.12] bg-slate-50/80 dark:bg-[#121926] hover:border-cyan-400/50 hover:bg-cyan-500/10'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-[#F1F5F9] group-hover:text-cyan-600 dark:group-hover:text-cyan-300 whitespace-nowrap">
                        <span className="h-2 w-2 rounded-full bg-cyan-400/90" />
                        <span>3 · Хорошо</span>
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-[#94A3B8] whitespace-nowrap">
                        1–3 дн. · 72%+
                      </span>
                    </button>

                    {/* 4 · Легко -> EMERALD */}
                    <button
                      type="button"
                      onClick={() => handleGradeClick('easy')}
                      className={`group min-h-[52px] flex flex-col items-center justify-center px-3 py-2 rounded-2xl border text-center transition-colors cursor-pointer ${
                        evaluation?.recommendedGrade === 'easy'
                          ? 'prism-tab-active'
                          : activeSR?.lastGrade === 'easy'
                            ? 'border-emerald-400/45 bg-emerald-500/10'
                            : 'border-slate-200/80 dark:border-white/[0.12] bg-slate-50/80 dark:bg-[#121926] hover:border-emerald-400/50 hover:bg-emerald-500/10'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-[#F1F5F9] group-hover:text-emerald-600 dark:group-hover:text-emerald-300 whitespace-nowrap">
                        <span className="h-2 w-2 rounded-full bg-emerald-400/90" />
                        <span>4 · Легко</span>
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-[#94A3B8] whitespace-nowrap">
                        4+ дн. · 96%+
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            </div>

            {/* Right Zone: Sticky Source Slides Panel (Stable Position, Maximized Width for Reading) */}
            <aside className="lg:col-span-5 lg:sticky lg:top-20 flex flex-col min-w-0 prism-surface rounded-[20px] p-4 sm:p-5">
              {!revealed ? (
                <div className="flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/70 dark:border-white/[0.08]">
                    <span className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      Слайды конспекта к билету
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono tabular-nums bg-slate-100 dark:bg-[#121926] border border-slate-200/70 dark:border-white/[0.1] text-slate-600 dark:text-[#CBD5E1]">
                      {activeCard.slides.length} шт.
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 dark:border-white/[0.12] bg-slate-50/70 dark:bg-[#070B12]/55 p-6 text-center space-y-3.5 min-h-[260px]">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100/90 dark:bg-[#121926] border border-slate-200/80 dark:border-white/[0.1] flex items-center justify-center text-slate-500 dark:text-[#94A3B8]">
                      <EyeOff className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5 max-w-xs">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                        Слайды скрыты до переворота карточки
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-[#9CA3AF] leading-relaxed">
                        Сначала попробуйте вспомнить ответ сами — затем откройте эталон и оригинальные слайды лекции.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRevealed(true)}
                      className="prism-tool-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full text-slate-800 dark:text-[#F1F5F9] cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Открыть ответ и слайды</span>
                    </button>
                  </div>

                  {activeCard.slides.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-slate-200/70 dark:border-white/[0.08]">
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-[#94A3B8]">
                        Прикреплённые материалы:
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {activeCard.slides.slice(0, 4).map((sl, i) => (
                          <div
                            key={`${sl.lectureId}-${sl.page}-${i}`}
                            className="flex items-start justify-between gap-2 px-3 py-1.5 rounded-xl text-xs bg-slate-100/90 dark:bg-[#121926] border border-slate-200/70 dark:border-white/[0.08] text-slate-800 dark:text-[#CBD5E1]"
                          >
                            <span className="leading-snug break-words">{sl.label}</span>
                            <span className="font-mono tabular-nums text-[11px] text-slate-600 dark:text-cyan-300/90 whitespace-nowrap shrink-0">
                              с.{sl.page}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <SlideAttachmentsPanel
                  slides={activeCard.slides}
                  heading="Слайды из лекций к вопросу"
                  compact
                  defaultHidden={false}
                />
              )}
            </aside>
          </div>

          {/* Full-Width Muted Navigator Grid (Low-Glare Tiles So Card Text Stays Primary) */}
          <section className="prism-surface rounded-[20px] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">
                  Навигатор по карточкам ({filteredCards.length})
                </h3>
                <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 dark:text-[#94A3B8]">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                    Не помню
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                    Сложно
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-cyan-400/80" />
                    Хорошо
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                    Выучено
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-[#CBD5E1]">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-300" />
                    Мастерство 95%+
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-[#64748B]">
                ← / → или свайп
              </span>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(2.35rem,1fr))] gap-1.5 max-h-[220px] overflow-y-auto pr-1">
              {filteredCards.map((card) => {
                const sr = getCardSRState(srMap, card.id);
                const masteryPct = getCardMasteryPercent(sr);
                const tier = getCardVisualTier(sr);
                const isActive = card.id === activeCard.id;

                let tone =
                  'border-slate-200/80 dark:border-white/[0.08] bg-slate-100/75 dark:bg-[#101724] text-slate-600 dark:text-[#94A3B8] hover:border-slate-300 dark:hover:border-white/25 hover:text-slate-900 dark:hover:text-[#F1F5F9]';
                let dotColor = '';

                if (tier === 'rainbow') {
                  tone = 'rainbow-mastered-tile font-semibold';
                  dotColor = 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-300';
                } else if (tier === 'known') {
                  tone =
                    'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300/85 hover:border-emerald-400/40';
                  dotColor = 'bg-emerald-400/85';
                } else if (tier === 'learning') {
                  tone =
                    'border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-700 dark:text-cyan-300/85 hover:border-cyan-400/40';
                  dotColor = 'bg-cyan-400/85';
                } else if (tier === 'hard') {
                  tone =
                    'border-amber-500/22 bg-amber-500/[0.08] text-amber-700 dark:text-amber-300/85 hover:border-amber-400/45';
                  dotColor = 'bg-amber-400/85';
                } else if (tier === 'again') {
                  tone =
                    'border-rose-500/22 bg-rose-500/[0.08] text-rose-700 dark:text-rose-300/85 hover:border-rose-400/45';
                  dotColor = 'bg-rose-500/85';
                }

                const navLabel =
                  card.id >= 201 && card.id <= 224
                    ? `${card.id - 200}`
                    : card.id >= 225 && card.id <= 232
                      ? `П${card.id - 224}`
                      : card.id >= 233 && card.id <= 249
                        ? `З${card.id - 232}`
                        : card.id >= 501 && card.id <= 549
                          ? `В${card.id - 500}`
                          : card.id >= 551 && card.id <= 598
                            ? `О${card.id - 550}`
                            : card.id >= 601 && card.id <= 618
                              ? `М${card.id - 600}`
                              : `${card.id}`;

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => onSelectQuestionId(card.id)}
                    title={`${card.badgeLabel ?? `№${card.id}`} (${masteryPct}%): ${card.question}`}
                    className={`relative h-8 rounded-lg border text-xs font-mono tabular-nums font-medium transition-colors cursor-pointer ${tone} ${
                      isActive ? 'dt-active-tile font-bold z-10' : ''
                    }`}
                  >
                    {navLabel}
                    {isActive && dotColor && (
                      <span
                        className={`absolute top-1 right-1 h-1.5 w-1.5 rounded-full ${dotColor}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
