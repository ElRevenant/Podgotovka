import {FormEvent, useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Clock,
  GraduationCap,
  HelpCircle,
  Keyboard,
  ListOrdered,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  CardSRState,
  QuizStats,
  RecallGrade,
  StudyCategory,
  TheoryCard,
} from '../types/study';
import {getCardHint, getCardQuizPromptAndKeyword} from '../utils/cardHelpers';
import {getCardSRState, getCardUrgencyScore} from '../utils/spacedRepetition';
import {
  AnswerEvaluationResult,
  buildCardAnswerSpeechText,
  evaluateStudentAnswerWithProfessor,
  HybridVoiceRecorderHandle,
  MicrophonePermissionState,
  queryMicrophonePermissionState,
  speakRussianText,
  startHybridVoiceRecording,
  stopSpeaking,
  subscribeToMicrophonePermission,
} from '../utils/speechAndGrading';
import {MathBlock} from './MathBlock';
import {SlideAttachmentsPanel} from './SlideAttachmentsPanel';

interface BlitzQuizProps {
  category: StudyCategory;
  allCards: TheoryCard[];
  srMap: Record<number, CardSRState>;
  quizStats: QuizStats;
  onRateCard: (cardId: number, grade: RecallGrade) => void;
  onRecordQuizFinish: (totalQuestions: number, correctCount: number) => void;
  onOpenCardInDeck: (cardId: number) => void;
  onOpenOralExam?: (card: TheoryCard) => void;
}

type QuizFormat = 'voice' | 'formula' | 'proof' | 'input' | 'choice';
type QuizSource = 'hardest' | 'random' | 'official50';

interface QuizQuestionItem {
  card: TheoryCard;
  options: {id: number; text: string}[];
  keywordPrompt: string;
  keywordAnswer: string;
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildQuizItems(
  allCards: TheoryCard[],
  srMap: Record<number, CardSRState>,
  count: number,
  source: QuizSource,
  category: StudyCategory,
  format?: QuizFormat,
): QuizQuestionItem[] {
  let pool =
    source === 'official50'
      ? category === 'rk'
        ? allCards.filter((c) => c.id >= 201 && c.id <= 224)
        : category === 'matan'
          ? allCards.filter((c) => c.id >= 501 && c.id <= 549)
          : category.startsWith('custom_')
            ? [...allCards]
            : allCards.filter((c) => c.id <= 50)
      : [...allCards];

  if (format === 'proof') {
    const multiStep = pool.filter((c) => c.answerPoints.length >= 3);
    if (multiStep.length > 0) {
      pool = multiStep;
    } else {
      const twoStep = pool.filter((c) => c.answerPoints.length >= 2);
      if (twoStep.length > 0) pool = twoStep;
    }
  }

  if (source === 'hardest') {
    const now = Date.now();
    pool = [...pool].sort((a, b) => {
      const scoreA =
        getCardUrgencyScore(getCardSRState(srMap, a.id), now) +
        Math.random() * 25;
      const scoreB =
        getCardUrgencyScore(getCardSRState(srMap, b.id), now) +
        Math.random() * 25;
      return scoreB - scoreA;
    });
  } else {
    pool = shuffleArray(pool);
  }

  const picked = pool.slice(0, Math.min(count, pool.length));

  return picked.map((card) => {
    const sameChapter = allCards.filter(
      (c) => c.id !== card.id && c.chapter === card.chapter,
    );
    const otherChapter = allCards.filter(
      (c) => c.id !== card.id && c.chapter !== card.chapter,
    );
    const distractors = [
      ...shuffleArray(sameChapter),
      ...shuffleArray(otherChapter),
    ].slice(0, 3);

    const options = shuffleArray([
      {id: card.id, text: card.keyThesis},
      ...distractors.map((d) => ({id: d.id, text: d.keyThesis})),
    ]);

    const kw = getCardQuizPromptAndKeyword(card);

    return {
      card,
      options,
      keywordPrompt: kw.prompt,
      keywordAnswer: kw.keyword,
    };
  });
}

const GRADE_TITLES: Record<RecallGrade, string> = {
  again: '1 · Не помню',
  hard: '2 · Сложно',
  good: '3 · Хорошо',
  easy: '4 · Легко',
};

export function BlitzQuiz({
  category,
  allCards,
  srMap,
  quizStats,
  onRateCard,
  onRecordQuizFinish,
  onOpenCardInDeck,
  onOpenOralExam,
}: BlitzQuizProps) {
  const [questionCount, setQuestionCount] = useState<10 | 15>(10);
  const [quizSource, setQuizSource] = useState<QuizSource>('hardest');
  // Default format: 'voice' (oral exam mode by default!)
  const [quizFormat, setQuizFormat] = useState<QuizFormat>('voice');

  const [items, setItems] = useState<QuizQuestionItem[]>(() =>
    buildQuizItems(allCards, srMap, 10, 'hardest', category),
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [chosenGrade, setChosenGrade] = useState<RecallGrade>('good');
  const [voiceEval, setVoiceEval] = useState<AnswerEvaluationResult | null>(
    null,
  );
  const [showHint, setShowHint] = useState(false);
  const [speakingTarget, setSpeakingTarget] = useState<
    'question' | 'answer' | null
  >(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnectingMic, setIsConnectingMic] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [micPermissionState, setMicPermissionState] =
    useState<MicrophonePermissionState>('unknown');
  const [speechError, setSpeechError] = useState('');

  // Formula / Term 10-second rapid-fire blitz state
  const [formulaSecondsLeft, setFormulaSecondsLeft] = useState<number>(10);
  const [formulaRevealed, setFormulaRevealed] = useState<boolean>(false);
  const [formulaPaused, setFormulaPaused] = useState<boolean>(false);

  // Proof Builder ("Собери по шагам") state: array of original step indices
  const [proofStepOrder, setProofStepOrder] = useState<number[]>([]);

  const [results, setResults] = useState<
    {card: TheoryCard; correct: boolean; grade: RecallGrade; userAnswer: string}[]
  >([]);
  const [finished, setFinished] = useState(false);

  const voiceRecorderRef = useRef<HybridVoiceRecorderHandle | null>(null);

  const currentItem = items[currentIdx];

  const stopVoiceRecording = async (): Promise<string> => {
    const handle = voiceRecorderRef.current;
    voiceRecorderRef.current = null;
    setIsRecording(false);
    setIsConnectingMic(false);
    if (handle) {
      try {
        return await handle.stop();
      } catch {
        return typedAnswer;
      }
    }
    return typedAnswer;
  };

  // Track browser microphone permission state in real time and clear stale errors if recently granted
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let active = true;

    void subscribeToMicrophonePermission((state) => {
      if (!active) return;
      setMicPermissionState(state);
      if (state === 'granted') {
        setSpeechError('');
      }
    }).then((unsub) => {
      if (active) {
        cleanup = unsub;
      } else {
        unsub();
      }
    });

    return () => {
      active = false;
      cleanup?.();
      stopSpeaking();
      void stopVoiceRecording();
    };
  }, []);

  // Regenerate quiz when category changes
  useEffect(() => {
    startNewQuiz(questionCount, quizSource);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // 10-second countdown timer for 'formula' rapid-fire blitz mode
  useEffect(() => {
    if (
      quizFormat !== 'formula' ||
      finished ||
      formulaRevealed ||
      formulaPaused ||
      !currentItem
    ) {
      return;
    }
    const id = window.setInterval(() => {
      setFormulaSecondsLeft((prev) => {
        if (prev <= 1) {
          setFormulaRevealed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [quizFormat, finished, formulaRevealed, formulaPaused, currentItem]);

  // Shuffle proof steps whenever currentItem or format changes
  useEffect(() => {
    if (quizFormat !== 'proof' || !currentItem) {
      setProofStepOrder([]);
      return;
    }
    const count = Math.min(6, currentItem.card.answerPoints.length);
    const indices = Array.from({length: count}, (_, i) => i);
    let shuffled = shuffleArray(indices);
    if (count > 1 && shuffled.every((v, i) => v === i)) {
      shuffled = [...shuffled.slice(1), shuffled[0]];
    }
    setProofStepOrder(shuffled);
  }, [quizFormat, currentItem]);

  const startNewQuiz = (
    nextCount = questionCount,
    nextSource = quizSource,
    nextFormat = quizFormat,
  ) => {
    stopSpeaking();
    void stopVoiceRecording();
    const generated = buildQuizItems(
      allCards,
      srMap,
      nextCount,
      nextSource,
      category,
      nextFormat,
    );
    setItems(generated);
    setCurrentIdx(0);
    setSelectedOptionId(null);
    setTypedAnswer('');
    setSubmitted(false);
    setIsCorrect(false);
    setVoiceEval(null);
    setShowHint(false);
    setSpeakingTarget(null);
    setSpeechError('');
    setIsEvaluating(false);
    setIsTranscribing(false);
    setFormulaSecondsLeft(10);
    setFormulaRevealed(false);
    setFormulaPaused(false);
    setResults([]);
    setFinished(false);
  };

  const moveProofStep = (fromIdx: number, delta: -1 | 1) => {
    if (submitted) return;
    setProofStepOrder((prev) => {
      const toIdx = fromIdx + delta;
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const next = [...prev];
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      return next;
    });
  };

  const handleCheckProofOrder = () => {
    if (submitted || !currentItem || proofStepOrder.length === 0) return;
    let exactMatches = 0;
    for (let i = 0; i < proofStepOrder.length; i++) {
      if (proofStepOrder[i] === i) exactMatches++;
    }
    const ratio = exactMatches / proofStepOrder.length;
    const grade: RecallGrade =
      ratio === 1 ? 'easy' : ratio >= 0.65 ? 'good' : ratio >= 0.35 ? 'hard' : 'again';
    const ok = grade === 'easy' || grade === 'good';
    setSubmitted(true);
    setIsCorrect(ok);
    setChosenGrade(grade);
    onRateCard(currentItem.card.id, grade);
    setResults((prev) => [
      ...prev,
      {
        card: currentItem.card,
        correct: ok,
        grade,
        userAnswer: `Верно расставлено шагов: ${exactMatches} из ${proofStepOrder.length}`,
      },
    ]);
  };

  const handleFormulaRateAndAdvance = (remembered: boolean) => {
    if (!currentItem) return;
    const grade: RecallGrade = remembered ? 'good' : 'again';
    onRateCard(currentItem.card.id, grade);
    const nextResults = [
      ...results,
      {
        card: currentItem.card,
        correct: remembered,
        grade,
        userAnswer: remembered ? 'Вспомнил за 10 с' : 'Мимо / не вспомнил',
      },
    ];
    setResults(nextResults);

    if (currentIdx + 1 >= items.length) {
      const correctCount = nextResults.filter((r) => r.correct).length;
      onRecordQuizFinish(items.length, correctCount);
      setFinished(true);
      return;
    }

    setCurrentIdx((i) => i + 1);
    setFormulaSecondsLeft(10);
    setFormulaRevealed(false);
    setFormulaPaused(false);
    setShowHint(false);
  };

  const startVoiceCaptureWithRetry = async () => {
    if (isConnectingMic) return;
    stopSpeaking();
    setSpeakingTarget(null);
    setSpeechError('');
    setIsConnectingMic(true);

    try {
      const initialPerm = await queryMicrophonePermissionState();
      setMicPermissionState(initialPerm);

      let pendingError = '';
      let handle = await startHybridVoiceRecording({
        initialText: typedAnswer,
        questionContext: currentItem?.card.question,
        onLiveText: (txt) => setTypedAnswer(txt),
        onTranscribingChange: (flag) => setIsTranscribing(flag),
        onPermissionStateChange: (state) => {
          setMicPermissionState(state);
          if (state === 'granted') {
            setSpeechError('');
          }
        },
        onError: (msg) => {
          pendingError = msg;
        },
        onStop: () => {
          setIsRecording(false);
        },
      });

      // If first attempt returned null right after permission was granted, wait and retry automatically
      const postPerm = await queryMicrophonePermissionState();
      setMicPermissionState(postPerm);

      if (!handle && postPerm === 'granted') {
        pendingError = '';
        await new Promise((r) => window.setTimeout(r, 320));
        handle = await startHybridVoiceRecording({
          initialText: typedAnswer,
          questionContext: currentItem?.card.question,
          onLiveText: (txt) => setTypedAnswer(txt),
          onTranscribingChange: (flag) => setIsTranscribing(flag),
          onPermissionStateChange: (state) => setMicPermissionState(state),
          onError: (msg) => {
            pendingError = msg;
          },
          onStop: () => {
            setIsRecording(false);
          },
        });
      }

      if (handle) {
        voiceRecorderRef.current = handle;
        setSpeechError('');
        setIsRecording(true);
      } else if (pendingError) {
        setSpeechError(pendingError);
        setIsRecording(false);
      }
    } finally {
      setIsConnectingMic(false);
    }
  };

  const handleToggleVoice = async () => {
    if (isRecording) {
      await stopVoiceRecording();
      return;
    }
    await startVoiceCaptureWithRetry();
  };

  const handleOptionSelect = (optionCardId: number) => {
    if (submitted || !currentItem) return;
    const correct = optionCardId === currentItem.card.id;
    const grade: RecallGrade = correct ? 'good' : 'again';
    setSelectedOptionId(optionCardId);
    setSubmitted(true);
    setIsCorrect(correct);
    setChosenGrade(grade);

    onRateCard(currentItem.card.id, grade);
    const chosenText =
      currentItem.options.find((o) => o.id === optionCardId)?.text ?? '';
    setResults((prev) => [
      ...prev,
      {card: currentItem.card, correct, grade, userAnswer: chosenText},
    ]);
  };

  const handleVoiceOrTextSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitted || !currentItem || isEvaluating) return;
    let finalAnswer = typedAnswer;
    if (isRecording) {
      finalAnswer = await stopVoiceRecording();
    }

    // Check if exact short keyword matched immediately in 'input' mode
    if (quizFormat === 'input') {
      const cleanUser = finalAnswer.trim().toLowerCase();
      const cleanTarget = currentItem.keywordAnswer.trim().toLowerCase();
      if (!cleanUser) return;

      const exactMatch =
        cleanUser === cleanTarget ||
        (cleanTarget.length >= 3 && cleanUser.includes(cleanTarget));

      if (exactMatch) {
        const grade: RecallGrade = 'easy';
        setSubmitted(true);
        setIsCorrect(true);
        setChosenGrade(grade);
        onRateCard(currentItem.card.id, grade);
        setResults((prev) => [
          ...prev,
          {card: currentItem.card, correct: true, grade, userAnswer: finalAnswer.trim()},
        ]);
        return;
      }
    }

    // Evaluate with the strict-but-human AI professor
    setIsEvaluating(true);
    try {
      const ev = await evaluateStudentAnswerWithProfessor(
        currentItem.card,
        finalAnswer,
      );
      const ok =
        ev.recommendedGrade === 'good' || ev.recommendedGrade === 'easy';
      setVoiceEval(ev);
      setSubmitted(true);
      setIsCorrect(ok);
      setChosenGrade(ev.recommendedGrade);
      onRateCard(currentItem.card.id, ev.recommendedGrade);
      setResults((prev) => [
        ...prev,
        {
          card: currentItem.card,
          correct: ok,
          grade: ev.recommendedGrade,
          userAnswer: finalAnswer.trim() || '(без ответа)',
        },
      ]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleOverrideGrade = (grade: RecallGrade) => {
    if (!currentItem) return;
    setChosenGrade(grade);
    const ok = grade === 'good' || grade === 'easy';
    setIsCorrect(ok);
    onRateCard(currentItem.card.id, grade);
    setResults((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      copy[copy.length - 1] = {
        ...copy[copy.length - 1],
        correct: ok,
        grade,
      };
      return copy;
    });
  };

  const handleNext = () => {
    stopSpeaking();
    void stopVoiceRecording();
    if (currentIdx + 1 >= items.length) {
      const correctCount = results.filter((r) => r.correct).length;
      onRecordQuizFinish(items.length, correctCount);
      setFinished(true);
      return;
    }
    setCurrentIdx((i) => i + 1);
    setSelectedOptionId(null);
    setTypedAnswer('');
    setSubmitted(false);
    setIsCorrect(false);
    setVoiceEval(null);
    setShowHint(false);
    setSpeakingTarget(null);
    setSpeechError('');
    setIsEvaluating(false);
    setIsTranscribing(false);
  };

  const correctSoFar = useMemo(
    () => results.filter((r) => r.correct).length,
    [results],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Quiz Configuration Bar */}
      <section className="prism-surface rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Format selector: Голосовой / Формула за 10 сек / Собери доказательство / Текстовый / 4 варианта */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B101B]">
              <button
                type="button"
                onClick={() => {
                  setQuizFormat('voice');
                  startNewQuiz(questionCount, quizSource, 'voice');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  quizFormat === 'voice'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
                }`}
              >
                <Mic className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>Голосовой экзамен</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuizFormat('formula');
                  startNewQuiz(questionCount, quizSource, 'formula');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  quizFormat === 'formula'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>
                  {category === 'rk' || category === 'matan'
                    ? 'Формула за 10 сек'
                    : 'Термин за 10 сек'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuizFormat('proof');
                  startNewQuiz(questionCount, quizSource, 'proof');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  quizFormat === 'proof'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
                }`}
              >
                <ListOrdered className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Собери по шагам</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuizFormat('input');
                  startNewQuiz(questionCount, quizSource, 'input');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  quizFormat === 'input'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
                }`}
              >
                <Keyboard className="h-3.5 w-3.5" />
                <span>Текстовый ввод</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuizFormat('choice');
                  startNewQuiz(questionCount, quizSource, 'choice');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  quizFormat === 'choice'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
                }`}
              >
                4 варианта
              </button>
            </div>

            {/* Source selector */}
            <select
              value={quizSource}
              onChange={(e) => {
                const src = e.target.value as QuizSource;
                setQuizSource(src);
                startNewQuiz(questionCount, src, quizFormat);
              }}
              aria-label="Источник вопросов блиц-теста"
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#E5E7EB] cursor-pointer"
            >
              <option value="hardest">Сложные и невыученные (приоритет SM-2)</option>
              <option value="random">Случайные из всей базы ({allCards.length})</option>
              <option value="official50">
                {category === 'rk'
                  ? 'Только базовая теория РК 2 (1–24)'
                  : category === 'matan'
                    ? 'Только 49 экзаменационных вопросов (теоремы)'
                    : category.startsWith('custom_')
                      ? 'Все карточки предмета'
                      : 'Только билеты экзамена (1–50)'}
              </option>
            </select>

            {/* Count selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B101B]">
              {([10, 15] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setQuestionCount(cnt);
                    startNewQuiz(cnt, quizSource, quizFormat);
                  }}
                  className={`px-2.5 py-1.5 text-xs font-mono tabular-nums font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    questionCount === cnt
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
                  }`}
                >
                  {cnt} вопр.
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-slate-500 dark:text-[#94A3B8] tabular-nums">
              Пройдено: {quizStats.completedCount} · Рекорд: {quizStats.bestScorePct}%
            </span>
            {onOpenOralExam && currentItem && (
              <button
                type="button"
                onClick={() => onOpenOralExam(currentItem.card)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg prism-cta transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Устный диалог</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => startNewQuiz(questionCount, quizSource, quizFormat)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#E5E7EB] hover:bg-slate-100 dark:hover:bg-[#182235] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Новый билет</span>
            </button>
          </div>
        </div>
      </section>

      {finished ? (
        <section className="prism-surface rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/[0.08]">
            <div>
              <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
                Итоги экзаменационной самопроверки
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-[#F3F4F6] tabular-nums">
                Зачтено ответов: {correctSoFar} из {items.length} (
                {Math.round((correctSoFar / Math.max(1, items.length)) * 100)}%)
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                Все выставленные оценки (Не помню / Сложно / Хорошо / Легко) сохранены в расписании SM-2.
              </p>
            </div>

            <button
              type="button"
              onClick={() => startNewQuiz(questionCount, quizSource)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg prism-cta transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="h-4 w-4" />
              <span>Следующий билет</span>
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {results.map((res, idx) => (
              <div
                key={`${res.card.id}-${idx}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0E1522] p-3.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    {res.correct ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{GRADE_TITLES[res.grade]}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>{GRADE_TITLES[res.grade]}</span>
                      </span>
                    )}
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span className="font-mono text-slate-500 dark:text-[#94A3B8] tabular-nums">
                      Вопрос №{res.card.id}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                    {res.card.question}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                    Эталон: {res.card.keyThesis}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenCardInDeck(res.card.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-white/[0.08] text-sky-700 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-[#182235] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  К карточке
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : currentItem ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 prism-surface rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
                  Вопрос {currentIdx + 1} / {items.length}
                </span>
                <span aria-hidden="true">·</span>
                <span>Карточка №{currentItem.card.id}</span>
                <span aria-hidden="true">·</span>
                <span>{currentItem.card.chapter}</span>
              </div>
              <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-medium">
                Зачтено: {correctSoFar}
              </span>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-[#F3F4F6]">
                {quizFormat === 'input'
                  ? currentItem.keywordPrompt
                  : currentItem.card.question}
              </h2>

              <button
                type="button"
                onClick={() => {
                  if (speakingTarget === 'question') {
                    stopSpeaking();
                    setSpeakingTarget(null);
                  } else {
                    speakRussianText(
                      quizFormat === 'input'
                        ? currentItem.keywordPrompt
                        : currentItem.card.question,
                      () => setSpeakingTarget('question'),
                      () => setSpeakingTarget(null),
                    );
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {speakingTarget === 'question' ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Стоп</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Озвучить</span>
                  </>
                )}
              </button>
            </div>

            {!submitted && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>{showHint ? 'Скрыть подсказку' : 'Показать подсказку'}</span>
                </button>
                {showHint && (
                  <p className="mt-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] p-3 text-xs text-slate-600 dark:text-[#D1D5DB]">
                    {getCardHint(currentItem.card)}
                  </p>
                )}
              </div>
            )}

            {quizFormat === 'formula' ? (
              <div className="mt-5 space-y-4">
                {/* 10-Second Countdown Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-mono font-bold tabular-nums text-amber-700 dark:text-amber-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {formulaRevealed
                          ? 'Ответ открыт — оцените себя честно'
                          : `Вспомните за ${formulaSecondsLeft} сек`}
                      </span>
                    </span>
                    {!formulaRevealed && (
                      <button
                        type="button"
                        onClick={() => setFormulaPaused((p) => !p)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] cursor-pointer"
                      >
                        {formulaPaused ? (
                          <>
                            <Play className="h-3 w-3" />
                            <span>Продолжить</span>
                          </>
                        ) : (
                          <>
                            <Pause className="h-3 w-3" />
                            <span>Пауза</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#0B101B] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        formulaSecondsLeft <= 3
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                      style={{width: `${(formulaSecondsLeft / 10) * 100}%`}}
                    />
                  </div>
                </div>

                {!formulaRevealed ? (
                  <button
                    type="button"
                    onClick={() => setFormulaRevealed(true)}
                    className="w-full py-3 text-sm font-semibold rounded-lg prism-cta transition-colors cursor-pointer"
                  >
                    Показать формулу и главный тезис
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/20 p-4 space-y-3">
                      {currentItem.card.mathFormulaLatex && (
                        <MathBlock
                          latex={currentItem.card.mathFormulaLatex}
                          displayMode={true}
                        />
                      )}
                      <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F3F4F6]">
                        {currentItem.card.keyThesis}
                      </p>
                      {currentItem.card.codeSnippet &&
                        !currentItem.card.mathFormulaLatex && (
                          <pre className="p-3 rounded-lg bg-[#070B12] text-slate-100 text-xs font-mono overflow-x-auto">
                            <code>{currentItem.card.codeSnippet.code}</code>
                          </pre>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleFormulaRateAndAdvance(false)}
                        className="inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg border border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200 transition-colors cursor-pointer"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Мимо (SM-2 · Не помню)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFormulaRateAndAdvance(true)}
                        className="inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Вспомнил (SM-2 · Хорошо)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : quizFormat === 'proof' ? (
              <div className="mt-5 space-y-3">
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Расставьте шаги доказательства / логического ответа в правильном порядке сверху вниз:
                </p>

                <div className="space-y-2">
                  {proofStepOrder.map((origIndex, pos) => {
                    const stepText = currentItem.card.answerPoints[origIndex] ?? '';
                    const isRightSpot = submitted && origIndex === pos;
                    const isWrongSpot = submitted && origIndex !== pos;
                    return (
                      <div
                        key={`${origIndex}-${pos}`}
                        className={`rounded-lg border p-3 flex items-start justify-between gap-3 transition-colors ${
                          isRightSpot
                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/35'
                            : isWrongSpot
                              ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/35'
                              : 'border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B101B]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 mt-0.5 shrink-0 tabular-nums">
                            {pos + 1}.
                          </span>
                          <div className="space-y-1">
                            <p className="text-sm leading-relaxed text-slate-800 dark:text-[#E5E7EB]">
                              {stepText}
                            </p>
                            {isWrongSpot && (
                              <p className="text-[11px] font-medium text-rose-700 dark:text-rose-400">
                                Должен стоять на позиции #{origIndex + 1}
                              </p>
                            )}
                          </div>
                        </div>

                        {!submitted && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={pos === 0}
                              onClick={() => moveProofStep(pos, -1)}
                              aria-label="Поднять шаг выше"
                              className="p-1.5 rounded border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] hover:bg-white dark:hover:bg-[#182235] disabled:opacity-35 cursor-pointer"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={pos === proofStepOrder.length - 1}
                              onClick={() => moveProofStep(pos, 1)}
                              aria-label="Опустить шаг ниже"
                              className="p-1.5 rounded border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] hover:bg-white dark:hover:bg-[#182235] disabled:opacity-35 cursor-pointer"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!submitted && (
                  <button
                    type="button"
                    onClick={handleCheckProofOrder}
                    className="px-4 py-2.5 text-xs font-semibold rounded-lg prism-cta transition-colors cursor-pointer"
                  >
                    Проверить порядок доказательства
                  </button>
                )}

                {submitted && currentItem.card.mathFormulaLatex && (
                  <div className="rounded-lg border border-sky-200 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/20 p-3">
                    <MathBlock latex={currentItem.card.mathFormulaLatex} displayMode={true} />
                  </div>
                )}
              </div>
            ) : quizFormat === 'choice' ? (
              <div className="mt-5 space-y-2.5">
                {currentItem.options.map((opt, idx) => {
                  const isTarget = opt.id === currentItem.card.id;
                  const isChosen = selectedOptionId === opt.id;
                  let style =
                    'border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B101B] hover:border-sky-400 dark:hover:border-sky-500/60 text-slate-800 dark:text-[#E5E7EB]';

                  if (submitted) {
                    if (isTarget) {
                      style =
                        'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/35 text-emerald-950 dark:text-emerald-100';
                    } else if (isChosen && !isTarget) {
                      style =
                        'border-rose-500 bg-rose-50/80 dark:bg-rose-950/35 text-rose-950 dark:text-rose-100';
                    } else {
                      style =
                        'border-slate-200 dark:border-white/[0.08] opacity-60 text-slate-500 dark:text-[#94A3B8]';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleOptionSelect(opt.id)}
                      className={`w-full text-left rounded-lg border p-3.5 transition-colors flex items-start gap-3 cursor-pointer disabled:cursor-default ${style}`}
                    >
                      <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 mt-0.5 tabular-nums shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="text-sm leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={(e) => void handleVoiceOrTextSubmit(e)} className="mt-5 space-y-3">
                {quizFormat === 'voice' && !submitted && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isConnectingMic || isTranscribing || isEvaluating}
                      onClick={() => void handleToggleVoice()}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 ${
                        isRecording
                          ? 'bg-rose-600 text-white hover:bg-rose-500'
                          : 'prism-cta'
                      }`}
                    >
                      {isConnectingMic ? (
                        <>
                          <Mic className="h-4 w-4 animate-pulse" />
                          <span>Подключение к микрофону...</span>
                        </>
                      ) : isRecording ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          <span>Остановить микрофон</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          <span>Ответить голосом (как на экзамене)</span>
                        </>
                      )}
                    </button>

                    {micPermissionState === 'granted' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Доступ к микрофону активен</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
                      {isTranscribing
                        ? 'Расшифровка записанного голосового ответа...'
                        : isConnectingMic
                          ? 'Проверяем разрешение и подключаем аудиопоток...'
                          : isRecording
                            ? 'Идёт запись микрофона (объясните суть вопроса своими словами)...'
                            : 'Можно говорить в микрофон или ответить текстом с клавиатуры'}
                    </span>
                  </div>
                )}

                {speechError && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300/80 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                    <span>{speechError}</span>
                    <button
                      type="button"
                      disabled={isConnectingMic}
                      onClick={() => void startVoiceCaptureWithRetry()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Повторить подключение к микрофону</span>
                    </button>
                  </div>
                )}

                {quizFormat === 'voice' ? (
                  <textarea
                    rows={3}
                    disabled={submitted || isEvaluating}
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder="Ваш устный (или письменный) ответ своими словами..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                ) : (
                  <input
                    type="text"
                    disabled={submitted || isEvaluating}
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder={
                      category === 'rk' || category === 'matan'
                        ? 'Введите термин/формулу или объясните суть своими словами...'
                        : 'Введите термин/оператор C++ или объясните своими словами...'
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                )}

                {!submitted && (
                  <button
                    type="submit"
                    disabled={isEvaluating || isTranscribing}
                    className="px-4 py-2.5 text-xs font-semibold rounded-lg prism-cta transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {isEvaluating
                      ? 'Преподаватель оценивает ответ...'
                      : isTranscribing
                        ? 'Распознаём ваш голос...'
                        : 'Проверить ответ у преподавателя'}
                  </button>
                )}
              </form>
            )}

            {submitted && (
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.08] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    {voiceEval ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                          {voiceEval.verdictTitle} · Понимание сути: {voiceEval.scorePct}%
                        </p>
                        {voiceEval.evaluatedBy === 'local-fallback' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200/80 dark:bg-white/[0.08] text-slate-600 dark:text-[#CBD5E1]">
                            Локальная проверка по смысловым тезисам
                          </span>
                        )}
                      </div>
                    ) : isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Верно! Выбрана оценка «{GRADE_TITLES[chosenGrade]}».</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-700 dark:text-rose-400">
                        <XCircle className="h-4 w-4" />
                        <span>
                          Ошибка. Выставлено «{GRADE_TITLES[chosenGrade]}».
                        </span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg prism-cta transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>
                      {currentIdx + 1 >= items.length
                        ? 'Завершить билет'
                        : 'Следующий вопрос'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {voiceEval && (
                  <div className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0E1522] p-3.5 space-y-2">
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-[#E5E7EB]">
                      {voiceEval.verdictDetail}
                    </p>
                    {voiceEval.matchedKeywords.length > 0 && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        <strong>Верно раскрыто по смыслу:</strong>{' '}
                        {voiceEval.matchedKeywords.join(' · ')}
                      </p>
                    )}
                    {voiceEval.missedKeywords.length > 0 && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        <strong>Чего не хватило для полноты:</strong>{' '}
                        {voiceEval.missedKeywords.join(' · ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Allow selecting / confirming exact grade: Не помню / Сложно / Хорошо / Легко */}
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    Оценка ответа (можете скорректировать):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['again', 'hard', 'good', 'easy'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleOverrideGrade(g)}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          chosenGrade === g
                            ? 'border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-500/20 dark:border-sky-400 dark:text-sky-100'
                            : 'border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235]'
                        }`}
                      >
                        {GRADE_TITLES[g]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                      Эталонный ответ (Вопрос №{currentItem.card.id})
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (speakingTarget === 'answer') {
                          stopSpeaking();
                          setSpeakingTarget(null);
                        } else {
                          speakRussianText(
                            buildCardAnswerSpeechText(currentItem.card),
                            () => setSpeakingTarget('answer'),
                            () => setSpeakingTarget(null),
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
                    >
                      {speakingTarget === 'answer' ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                          <span>Стоп</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                          <span>Озвучить ответ</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-sm font-bold text-slate-900 dark:text-[#F3F4F6]">
                    {currentItem.card.keyThesis}
                  </p>
                  <ul className="space-y-1.5 pt-1">
                    {currentItem.card.answerPoints.slice(0, 3).map((pt, i) => (
                      <li
                        key={i}
                        className="text-xs leading-relaxed text-slate-600 dark:text-[#D1D5DB] flex gap-2"
                      >
                        <span className="font-mono text-sky-600 dark:text-sky-400 shrink-0">
                          •
                        </span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          <aside className="lg:col-span-5 prism-surface rounded-2xl p-4 sm:p-5">
            {submitted || (quizFormat === 'formula' && formulaRevealed) ? (
              <SlideAttachmentsPanel
                slides={currentItem.card.slides}
                heading="Слайд лекции с ответом"
                compact
                defaultHidden={true}
              />
            ) : (
              <div className="py-12 px-4 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-[#E5E7EB]">
                  Слайд с ответом закрыт на время ответа
                </p>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Ответьте голосом или текстом, чтобы открыть эталонный ответ и слайд.
                </p>
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
