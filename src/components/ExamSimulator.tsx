import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Activity,
  Award,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Mic,
  MicOff,
  Pause,
  PenTool,
  Play,
  RefreshCw,
  Send,
  XCircle,
} from 'lucide-react';
import {MATAN_OFFICIAL_TICKETS, MatanOfficialTicketSpec} from '../data';
import {
  RecallGrade,
  StudyCategory,
  TaskCard,
  TaskMasteryStatus,
  TheoryCard,
} from '../types/study';
import {
  AnswerEvaluationResult,
  evaluateStudentAnswerWithProfessor,
  HybridVoiceRecorderHandle,
  startHybridVoiceRecording,
} from '../utils/speechAndGrading';
import {checkRkTaskAnswer, getTaskAnswerHint} from '../utils/taskAnswerChecker';
import {DrawingScratchpad} from './DrawingScratchpad';
import {FunctionGraphCard, hasMatanGraph} from './FunctionGraphCard';
import {MathBlock} from './MathBlock';
import {PhotoSolutionChecker} from './PhotoSolutionChecker';

interface ExamSimulatorProps {
  category: StudyCategory;
  allCards: TheoryCard[];
  tasks: TaskCard[];
  onRateCard: (cardId: number, grade: RecallGrade) => void;
  onSetTaskMastery: (taskId: string, status: TaskMasteryStatus) => void;
  onOpenOralExam?: (card: TheoryCard) => void;
}

interface SimulatorTheoryItem {
  card: TheoryCard;
  maxPoints: number;
  label: string;
}

interface SimulatorTaskItem {
  task: TaskCard;
  maxPoints: number;
  label: string;
}

interface GeneratedTicket {
  ticketCode: string;
  officialTicketNumber?: number;
  officialPdfUrl?: string;
  officialTitle?: string;
  theory: SimulatorTheoryItem[];
  practice: SimulatorTaskItem[];
}

function buildOfficialMatanTicket(
  official: MatanOfficialTicketSpec,
  allCards: TheoryCard[],
  tasks: TaskCard[],
): GeneratedTicket {
  const theoryCard =
    allCards.find((c) => c.id === official.theoryCardId) ??
    allCards.find((c) => c.id >= 501 && c.id <= 549);

  const theoryItems: SimulatorTheoryItem[] = theoryCard
    ? [
        {
          card: {
            ...theoryCard,
            question: `1. (4 б.) ${official.theoryPrompt}`,
          },
          maxPoints: 4,
          label: `Билет №${official.ticketNumber} · Теоретический вопрос №1 (4 балла)`,
        },
      ]
    : [];

  const taskLabels = [
    {pts: 5, label: 'Задача №2 · Вычисление пределов (5 баллов)'},
    {pts: 5, label: 'Задача №3 · Сравнение б.м. и б.б. функций (5 баллов)'},
    {pts: 5, label: 'Задача №4 · Точки разрыва и их род (5 баллов)'},
    {pts: 6, label: 'Задача №5 · Формула Тейлора / касательная (6 баллов)'},
    {pts: 5, label: 'Задача №6 · Исследование функции и график (5 баллов)'},
  ];

  const practiceItems: SimulatorTaskItem[] = [];
  official.taskIds.forEach((tId: string, idx: number) => {
    const found = tasks.find((t) => t.id === tId);
    if (found) {
      const cfg = taskLabels[idx] ?? {pts: 5, label: `Задача №${idx + 2} (5 баллов)`};
      practiceItems.push({
        task: found,
        maxPoints: cfg.pts,
        label: cfg.label,
      });
    }
  });

  return {
    ticketCode: `ФН12-№${official.ticketNumber}`,
    officialTicketNumber: official.ticketNumber,
    officialPdfUrl: official.pdfUrl,
    officialTitle: `Матан · Официальный билет ФН-12 (${official.code}) №${official.ticketNumber}`,
    theory: theoryItems,
    practice: practiceItems,
  };
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function generateTicket(
  category: StudyCategory,
  allCards: TheoryCard[],
  tasks: TaskCard[],
): GeneratedTicket {
  const ticketNum = Math.floor(10 + Math.random() * 89);

  if (category === 'rk') {
    const basicTheory = allCards.filter((c) => c.id >= 201 && c.id <= 224);
    const proofTheory = allCards.filter((c) => c.id >= 225 && c.id <= 232);

    const chosenBasicTheory = pickRandom(basicTheory, 3).map((card, i) => ({
      card,
      maxPoints: 1,
      label: `Теория · Базовый вопрос №${i + 1} (1 балл)`,
    }));
    const chosenProof = pickRandom(proofTheory, 1).map((card) => ({
      card,
      maxPoints: 2,
      label: 'Теория · Повышенная сложность / доказательство (2 балла)',
    }));

    // 4 basic tasks (7 pts each = 28) + 2 advanced/hard tasks (9 pts each = 18) = 46 pts max
    const sevenPtPool = tasks.filter(
      (t) =>
        t.kind === 'rk-basic' ||
        (t.kind === 'rk-ticket' && t.badgeNumber.includes('7 баллов')),
    );
    const ninePtPool = tasks.filter(
      (t) =>
        t.kind === 'rk-advanced' ||
        (t.kind === 'rk-ticket' && t.badgeNumber.includes('9 баллов')),
    );

    const chosenSeven = pickRandom(sevenPtPool, 4).map((task, i) => ({
      task,
      maxPoints: 7,
      label: `Задача №${i + 1} (7 баллов)`,
    }));
    const chosenNine = pickRandom(ninePtPool, 2).map((task, i) => ({
      task,
      maxPoints: 9,
      label: `Задача №${i + 5} (9 баллов)`,
    }));

    return {
      ticketCode: `РК2-${ticketNum}`,
      theory: [...chosenBasicTheory, ...chosenProof],
      practice: [...chosenSeven, ...chosenNine],
    };
  }

  if (category === 'matan') {
    const theorems = allCards.filter((c) => c.id >= 501 && c.id <= 549);
    const definitions = allCards.filter((c) => c.id >= 551 && c.id <= 598);

    const firstTh = pickRandom(theorems, 1)[0];
    const otherChapTh = firstTh
      ? theorems.filter((c) => c.chapter !== firstTh.chapter)
      : theorems;
    const secondTh = pickRandom(
      otherChapTh.length > 0 ? otherChapTh : theorems,
      1,
    )[0];
    const chosenDef = pickRandom(definitions, 1)[0];

    const theoryItems: SimulatorTheoryItem[] = [];
    if (firstTh) {
      theoryItems.push({
        card: firstTh,
        maxPoints: 5,
        label: 'Теория · Экзаменационный вопрос №1 (5 баллов)',
      });
    }
    if (secondTh) {
      theoryItems.push({
        card: secondTh,
        maxPoints: 5,
        label: 'Теория · Экзаменационный вопрос №2 (другой раздел · 5 баллов)',
      });
    }
    if (chosenDef) {
      theoryItems.push({
        card: chosenDef,
        maxPoints: 4,
        label: 'Теория · Базовое определение (4 балла)',
      });
    }

    const setConfigs = [
      {kind: 'matan-1' as const, pts: 5, label: 'Задача №1 · Пределы (5 баллов)'},
      {kind: 'matan-2' as const, pts: 5, label: 'Задача №2 · Сравнение б.м./б.б. (5 баллов)'},
      {kind: 'matan-3' as const, pts: 5, label: 'Задача №3 · Непрерывность и разрывы (5 баллов)'},
      {kind: 'matan-4' as const, pts: 6, label: 'Задача №4 · Касательная и Тейлор (6 баллов)'},
      {kind: 'matan-5' as const, pts: 5, label: 'Задача №5 · Монотонность и выпуклость (5 баллов)'},
    ];

    const practiceItems: SimulatorTaskItem[] = [];
    for (const cfg of setConfigs) {
      const pool = tasks.filter((t) => t.kind === cfg.kind);
      const picked = pickRandom(pool, 1)[0];
      if (picked) {
        practiceItems.push({
          task: picked,
          maxPoints: cfg.pts,
          label: cfg.label,
        });
      }
    }

    return {
      ticketCode: `G22-${ticketNum}`,
      theory: theoryItems,
      practice: practiceItems,
    };
  }

  // Custom imported PDF subject: 3 theory questions
  if (category.startsWith('custom_')) {
    const picked = pickRandom(allCards, 3).map((card, i) => ({
      card,
      maxPoints: 5,
      label: `Теория · Вопрос №${i + 1} (5 баллов)`,
    }));
    return {
      ticketCode: `PDF-${ticketNum}`,
      theory: picked,
      practice: [],
    };
  }

  // Exam (АИП): 2 official theory questions from distinct chapters + 1 official exam task
  const official50 = allCards.filter((c) => c.id >= 1 && c.id <= 50);
  const firstQ = pickRandom(official50, 1)[0];
  const otherChapterPool = firstQ
    ? official50.filter((c) => c.chapter !== firstQ.chapter)
    : official50;
  const secondQ = pickRandom(
    otherChapterPool.length > 0 ? otherChapterPool : official50,
    1,
  )[0];

  const examTasks = tasks.filter((t) => t.kind === 'exam');
  const chosenExamTask = pickRandom(
    examTasks.length > 0 ? examTasks : tasks,
    1,
  )[0];

  const theoryItems: SimulatorTheoryItem[] = [];
  if (firstQ) {
    theoryItems.push({
      card: firstQ,
      maxPoints: 2,
      label: 'Вопрос 1 (теория · 2 балла)',
    });
  }
  if (secondQ) {
    theoryItems.push({
      card: secondQ,
      maxPoints: 2,
      label: 'Вопрос 2 (теория · другая глава · 2 балла)',
    });
  }

  const practiceItems: SimulatorTaskItem[] = chosenExamTask
    ? [
        {
          task: chosenExamTask,
          maxPoints: 1,
          label: 'Практическая задача экзамена (1 балл)',
        },
      ]
    : [];

  return {
    ticketCode: `АИП-${ticketNum}`,
    theory: theoryItems,
    practice: practiceItems,
  };
}

export function ExamSimulator({
  category,
  allCards,
  tasks,
  onRateCard,
  onSetTaskMastery,
  onOpenOralExam,
}: ExamSimulatorProps) {
  const [ticket, setTicket] = useState<GeneratedTicket>(() =>
    generateTicket(category, allCards, tasks),
  );
  const [timerPresetMin, setTimerPresetMin] = useState<0 | 45 | 60 | 90>(60);
  const [secondsLeft, setSecondsLeft] = useState<number>(60 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Per-theory-item state
  const [theoryAnswers, setTheoryAnswers] = useState<Record<number, string>>({});
  const [theoryEvals, setTheoryEvals] = useState<
    Record<number, AnswerEvaluationResult>
  >({});
  const [theoryScores, setTheoryScores] = useState<Record<number, number>>({});
  const [theoryRevealed, setTheoryRevealed] = useState<Record<number, boolean>>(
    {},
  );
  const [evaluatingCardId, setEvaluatingCardId] = useState<number | null>(null);
  const [recordingCardId, setRecordingCardId] = useState<number | null>(null);

  // Per-practice-task state
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});
  const [taskFeedbacks, setTaskFeedbacks] = useState<
    Record<string, {isCorrect: boolean; feedback: string}>
  >({});
  const [taskScores, setTaskScores] = useState<Record<string, number>>({});
  const [taskSolutionOpen, setTaskSolutionOpen] = useState<
    Record<string, boolean>
  >({});
  const [taskScratchOpen, setTaskScratchOpen] = useState<Record<string, boolean>>({});
  const [taskPhotoOpen, setTaskPhotoOpen] = useState<Record<string, boolean>>({});
  const [taskGraphOpen, setTaskGraphOpen] = useState<Record<string, boolean>>({});
  const [taskScratchImg, setTaskScratchImg] = useState<Record<string, string | null>>({});

  const [showFinalVerdict, setShowFinalVerdict] = useState<boolean>(false);
  const recorderRef = useRef<HybridVoiceRecorderHandle | null>(null);

  const resetForTicket = (next: GeneratedTicket, presetMin = timerPresetMin) => {
    void recorderRef.current?.stop();
    recorderRef.current = null;
    setRecordingCardId(null);
    setTicket(next);
    setTheoryAnswers({});
    setTheoryEvals({});
    setTheoryScores({});
    setTheoryRevealed({});
    setTaskInputs({});
    setTaskFeedbacks({});
    setTaskScores({});
    setTaskSolutionOpen({});
    setShowFinalVerdict(false);
    setTimerRunning(false);
    setSecondsLeft(presetMin * 60);
  };

  useEffect(() => {
    const defaultMin =
      category === 'matan' ? 90 : category === 'rk' ? 60 : 45;
    setTimerPresetMin(defaultMin);
    resetForTicket(generateTicket(category, allCards, tasks), defaultMin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    if (!timerRunning || timerPresetMin === 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          setShowFinalVerdict(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, timerPresetMin]);

  useEffect(() => {
    return () => {
      void recorderRef.current?.stop();
    };
  }, []);

  const handleToggleVoiceForCard = async (card: TheoryCard) => {
    if (recordingCardId === card.id) {
      const handle = recorderRef.current;
      recorderRef.current = null;
      setRecordingCardId(null);
      if (handle) {
        const finalText = await handle.stop();
        if (finalText) {
          setTheoryAnswers((prev) => ({...prev, [card.id]: finalText}));
        }
      }
      return;
    }

    if (recorderRef.current) {
      await recorderRef.current.stop();
      recorderRef.current = null;
    }

    const handle = await startHybridVoiceRecording({
      initialText: theoryAnswers[card.id] ?? '',
      questionContext: card.question,
      onLiveText: (txt) =>
        setTheoryAnswers((prev) => ({...prev, [card.id]: txt})),
      onError: () => {
        setRecordingCardId(null);
      },
      onStop: () => {
        setRecordingCardId(null);
      },
    });
    if (handle) {
      recorderRef.current = handle;
      setRecordingCardId(card.id);
    }
  };

  const handleCheckTheory = async (item: SimulatorTheoryItem) => {
    const cardId = item.card.id;
    let ans = theoryAnswers[cardId] ?? '';
    if (recordingCardId === cardId && recorderRef.current) {
      ans = await recorderRef.current.stop();
      recorderRef.current = null;
      setRecordingCardId(null);
      setTheoryAnswers((prev) => ({...prev, [cardId]: ans}));
    }

    setEvaluatingCardId(cardId);
    try {
      const ev = await evaluateStudentAnswerWithProfessor(item.card, ans);
      setTheoryEvals((prev) => ({...prev, [cardId]: ev}));
      setTheoryRevealed((prev) => ({...prev, [cardId]: true}));

      // Map professor score to official points
      let pts = 0;
      if (item.maxPoints === 1) {
        pts = ev.scorePct >= 55 ? 1 : 0;
      } else if (item.maxPoints === 2) {
        pts = ev.scorePct >= 75 ? 2 : ev.scorePct >= 45 ? 1 : 0;
      } else {
        pts = Math.round((ev.scorePct / 100) * item.maxPoints);
      }
      setTheoryScores((prev) => ({...prev, [cardId]: pts}));
      onRateCard(cardId, ev.recommendedGrade);
    } finally {
      setEvaluatingCardId(null);
    }
  };

  const handleCheckRkTask = (item: SimulatorTaskItem) => {
    const res = checkRkTaskAnswer(item.task.id, taskInputs[item.task.id] ?? '');
    setTaskFeedbacks((prev) => ({...prev, [item.task.id]: res}));
    if (res.isCorrect) {
      setTaskScores((prev) => ({...prev, [item.task.id]: item.maxPoints}));
      onSetTaskMastery(
        item.task.id,
        taskSolutionOpen[item.task.id] ? 'hint' : 'solved',
      );
    }
  };

  const scoreSummary = useMemo(() => {
    const theoryEarned = ticket.theory.reduce(
      (sum, item) => sum + (theoryScores[item.card.id] ?? 0),
      0,
    );
    const theoryMax = ticket.theory.reduce((sum, i) => sum + i.maxPoints, 0);

    const practiceEarned = ticket.practice.reduce(
      (sum, item) => sum + (taskScores[item.task.id] ?? 0),
      0,
    );
    const practiceMax = ticket.practice.reduce(
      (sum, i) => sum + i.maxPoints,
      0,
    );

    if (category === 'rk') {
      const theoryPassed = theoryEarned >= 3;
      const practicePassed = practiceEarned >= 27;
      const overallPassed = theoryPassed && practicePassed;
      return {
        theoryEarned,
        theoryMax,
        practiceEarned,
        practiceMax,
        theoryPassed,
        practicePassed,
        overallPassed,
        examGrade: null as number | null,
      };
    }

    if (category === 'matan') {
      const totalPts = theoryEarned + practiceEarned;
      const totalMax = theoryMax + practiceMax; // 30 for official FN-12 ticket, 40 for random G22
      const isOfficial30 = totalMax === 30;
      const theoryPassed = isOfficial30 ? theoryEarned >= 2 : theoryEarned >= 8;
      const practicePassed = practiceEarned >= 15;
      const examGrade = isOfficial30
        ? totalPts >= 25
          ? 5
          : totalPts >= 20
            ? 4
            : totalPts >= 17
              ? 3
              : 2
        : totalPts >= 34
          ? 5
          : totalPts >= 26
            ? 4
            : totalPts >= 18
              ? 3
              : 2;
      const overallPassed = theoryPassed && practicePassed && examGrade >= 3;
      return {
        theoryEarned,
        theoryMax,
        practiceEarned,
        practiceMax,
        theoryPassed,
        practicePassed,
        overallPassed,
        examGrade,
      };
    }

    const totalPts = theoryEarned + practiceEarned; // max 5
    const examGrade = Math.max(2, Math.min(5, Math.round(totalPts)));
    return {
      theoryEarned,
      theoryMax,
      practiceEarned,
      practiceMax,
      theoryPassed: theoryEarned >= 2,
      practicePassed: practiceEarned >= 1,
      overallPassed: examGrade >= 3,
      examGrade,
    };
  }, [ticket, theoryScores, taskScores, category]);

  const [showOfficialPdf, setShowOfficialPdf] = useState<boolean>(false);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedClock = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Simulator Control Bar */}
      <section className="prism-surface rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#94A3B8]">
              <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                Билет {ticket.ticketCode}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {category === 'rk'
                  ? 'Официальная структура РК 2: Теория (3×1 + 1×2 = 5 б., зачёт ≥ 3) + Задачи (4×7 + 2×9 = 46 б., зачёт ≥ 27)'
                  : category === 'matan'
                    ? ticket.officialTicketNumber
                      ? `Официальный билет ФН-12 (20-08) №${ticket.officialTicketNumber} (30 б.): Вопрос №1 (4 б.) + 5 задач (5+5+5+6+5 = 26 б.)`
                      : 'Структура билета Матан G22 (40 б.): Теория (2×5 + 1×4 = 14 б., порог ≥ 8) + 5 задач (5+5+5+6+5 = 26 б., порог ≥ 15)'
                    : 'Структура экзамена АИП: 2 вопроса теории из разных глав + 1 экзаменационная задача'}
              </span>
            </div>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-[#F3F4F6]">
              Боевой симулятор билета (
              {category === 'rk'
                ? 'Ангем РК 2'
                : category === 'matan'
                  ? ticket.officialTitle ?? 'Матан · Экзамен ФН-12 / G22'
                  : 'Экзамен АИП'}
              )
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Timer presets */}
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B101B]">
              {([45, 60, 90, 0] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setTimerPresetMin(m);
                    setTimerRunning(false);
                    setSecondsLeft(m * 60);
                  }}
                  className={`px-2 py-1 text-xs font-mono rounded-md cursor-pointer ${
                    timerPresetMin === m
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 dark:text-[#94A3B8]'
                  }`}
                >
                  {m === 0 ? 'Без тайм.' : `${m}м`}
                </button>
              ))}
            </div>

            {timerPresetMin > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B]">
                <Clock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-[#F3F4F6]">
                  {formattedClock}
                </span>
                <button
                  type="button"
                  onClick={() => setTimerRunning((r) => !r)}
                  className="p-1 rounded prism-cta cursor-pointer"
                  title={timerRunning ? 'Пауза' : 'Старт таймера'}
                >
                  {timerRunning ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowOfficialPdf(false);
                resetForTicket(generateTicket(category, allCards, tasks));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#E5E7EB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Случайный билет</span>
            </button>
          </div>
        </div>

        {/* Official BMSTU FN-12 (20-08) Exam Ticket Selector Bar */}
        {category === 'matan' && (
          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                Реальные экзаменационные билеты МГТУ ФН-12 (20-08 · ИУ/РЛ/БМТ, 15 вариантов):
              </span>
              {ticket.officialPdfUrl && (
                <button
                  type="button"
                  onClick={() => setShowOfficialPdf((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-amber-400/50 bg-amber-50/70 dark:bg-amber-950/25 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>
                    {showOfficialPdf
                      ? 'Скрыть оригинал бланка PDF'
                      : `Показать оригинал PDF (Билет №${ticket.officialTicketNumber})`}
                  </span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setShowOfficialPdf(false);
                  resetForTicket(generateTicket(category, allCards, tasks));
                }}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                  !ticket.officialTicketNumber
                    ? 'border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200'
                    : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#182235]'
                }`}
              >
                Случайный G22
              </button>
              {MATAN_OFFICIAL_TICKETS.map((off) => {
                const isSelected = ticket.officialTicketNumber === off.ticketNumber;
                return (
                  <button
                    key={off.ticketNumber}
                    type="button"
                    onClick={() => {
                      resetForTicket(buildOfficialMatanTicket(off, allCards, tasks));
                    }}
                    className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235]'
                    }`}
                  >
                    Билет №{off.ticketNumber}
                  </button>
                );
              })}
            </div>

            {showOfficialPdf && ticket.officialPdfUrl && (
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden bg-slate-900/90">
                <iframe
                  src={ticket.officialPdfUrl}
                  title={`Оригинал билета ФН-12 №${ticket.officialTicketNumber}`}
                  className="w-full h-[460px] border-0"
                />
              </div>
            )}
          </div>
        )}

        {/* Live Score Strip */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
            <span className="text-slate-600 dark:text-[#D1D5DB]">
              Теория:{' '}
              <strong
                className={`font-mono ${
                  scoreSummary.theoryPassed
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {scoreSummary.theoryEarned} / {scoreSummary.theoryMax}
              </strong>
              {category === 'rk'
                ? ' (мин. 3)'
                : category === 'matan'
                  ? ticket.officialTicketNumber
                    ? ' (мин. 2)'
                    : ' (мин. 8)'
                  : ''}
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-[#404040]">·</span>
            <span className="text-slate-600 dark:text-[#D1D5DB]">
              Практика:{' '}
              <strong
                className={`font-mono ${
                  scoreSummary.practicePassed
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {scoreSummary.practiceEarned} / {scoreSummary.practiceMax}
              </strong>
              {category === 'rk'
                ? ' (мин. 27)'
                : category === 'matan'
                  ? ' (мин. 15)'
                  : ''}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setTimerRunning(false);
              setShowFinalVerdict(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg prism-cta cursor-pointer"
          >
            <Award className="h-3.5 w-3.5" />
            <span>Подвести итог билета</span>
          </button>
        </div>
      </section>

      {/* Final Verdict Card */}
      {showFinalVerdict && (
        <section
          className={`rounded-xl border-2 p-5 sm:p-6 space-y-2 ${
            scoreSummary.overallPassed
              ? 'border-emerald-400 dark:border-emerald-600/70 bg-emerald-50/70 dark:bg-emerald-950/30'
              : 'border-rose-400 dark:border-rose-600/70 bg-rose-50/70 dark:bg-rose-950/30'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {scoreSummary.overallPassed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              )}
              <h3 className="text-lg font-bold text-slate-900 dark:text-[#F3F4F6]">
                {category === 'rk'
                  ? scoreSummary.overallPassed
                    ? 'Итог: РК 2 СДАН!'
                    : 'Итог: РК 2 пока НЕ СДАН (не набран порог по части билета)'
                  : category === 'matan'
                    ? scoreSummary.overallPassed
                      ? `Итог Матан: СДАНО · Оценка ${scoreSummary.examGrade} из 5 (${scoreSummary.theoryEarned + scoreSummary.practiceEarned} / ${scoreSummary.theoryMax + scoreSummary.practiceMax} б.)`
                      : `Итог Матан: НЕ СДАНО · Оценка 2 (${scoreSummary.theoryEarned + scoreSummary.practiceEarned} / ${scoreSummary.theoryMax + scoreSummary.practiceMax} б., не пройден порог)`
                    : `Итоговая экзаменационная оценка: ${scoreSummary.examGrade} из 5`}
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                resetForTicket(generateTicket(category, allCards, tasks))
              }
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg prism-cta cursor-pointer"
            >
              Вытянуть новый билет
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-[#D1D5DB] tabular-nums">
            {category === 'rk'
              ? `Теория: ${scoreSummary.theoryEarned} из 5 (порог 3 балла — ${
                  scoreSummary.theoryPassed ? 'пройден' : 'не пройден'
                }) · Задачи: ${scoreSummary.practiceEarned} из 46 (порог 27 баллов — ${
                  scoreSummary.practicePassed ? 'пройден' : 'не пройден'
                }).`
              : category === 'matan'
                ? `Теория: ${scoreSummary.theoryEarned} из ${scoreSummary.theoryMax} (${
                    scoreSummary.theoryPassed ? 'порог пройден' : 'порог не пройден'
                  }) · Практика (5 задач ФН-12): ${scoreSummary.practiceEarned} из ${scoreSummary.practiceMax} (порог 15 — ${
                    scoreSummary.practicePassed ? 'пройден' : 'не пройден'
                  }).`
                : `Теория: ${scoreSummary.theoryEarned} из ${scoreSummary.theoryMax} · Практическая задача: ${scoreSummary.practiceEarned} из ${scoreSummary.practiceMax}.`}
          </p>
        </section>
      )}

      {/* Part 1: Theory Questions */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
          Часть 1 · Теоретические вопросы ({ticket.theory.length})
        </h3>
        {ticket.theory.map((item) => {
          const cardId = item.card.id;
          const ev = theoryEvals[cardId];
          const isOpen = Boolean(theoryRevealed[cardId]);
          const score = theoryScores[cardId] ?? 0;
          const isRec = recordingCardId === cardId;
          const isEval = evaluatingCardId === cardId;

          return (
            <article
              key={cardId}
              className="prism-surface rounded-2xl p-5 space-y-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#94A3B8]">
                  <span className="font-semibold text-sky-700 dark:text-sky-400">
                    {item.label}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.card.chapter}</span>
                </div>

                {/* Self-score selector */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 dark:text-[#94A3B8]">Балл:</span>
                  {Array.from({length: item.maxPoints + 1}, (_, pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() =>
                        setTheoryScores((prev) => ({...prev, [cardId]: pts}))
                      }
                      className={`px-2 py-0.5 font-mono rounded border cursor-pointer ${
                        score === pts
                          ? 'border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200 font-bold'
                          : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8]'
                      }`}
                    >
                      {pts}
                    </button>
                  ))}
                </div>
              </div>

              <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-[#F3F4F6]">
                {item.card.question}
              </h4>

              <textarea
                rows={2}
                value={theoryAnswers[cardId] ?? ''}
                onChange={(e) =>
                  setTheoryAnswers((prev) => ({
                    ...prev,
                    [cardId]: e.target.value,
                  }))
                }
                placeholder="Напишите или продиктуйте ответ своими словами..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleToggleVoiceForCard(item.card)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                    isRec
                      ? 'bg-rose-600 text-white hover:bg-rose-500'
                      : 'border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#E5E7EB] hover:bg-slate-100 dark:hover:bg-[#182235]'
                  }`}
                >
                  {isRec ? (
                    <>
                      <MicOff className="h-3.5 w-3.5" />
                      <span>Стоп</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Голосом</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isEval}
                  onClick={() => void handleCheckTheory(item)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg prism-cta cursor-pointer disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {isEval ? 'Оценка преподавателя...' : 'Проверить у преподавателя'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTheoryRevealed((prev) => ({
                      ...prev,
                      [cardId]: !prev[cardId],
                    }))
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
                >
                  {isOpen ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Скрыть эталон</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Показать эталон</span>
                    </>
                  )}
                </button>

                {onOpenOralExam && (
                  <button
                    type="button"
                    onClick={() => onOpenOralExam(item.card)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-sky-300 dark:border-sky-600/60 bg-sky-50/70 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-950/50 cursor-pointer"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Сдать устно до конца</span>
                  </button>
                )}
              </div>

              {ev && (
                <div className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E1522] p-3 text-xs space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-[#F3F4F6]">
                      {ev.verdictTitle} ({ev.scorePct}%)
                    </p>
                    {ev.evaluatedBy === 'local-fallback' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200/80 dark:bg-white/[0.08] text-slate-600 dark:text-[#CBD5E1]">
                        Локальная проверка по смысловым тезисам
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-[#D1D5DB]">
                    {ev.verdictDetail}
                  </p>
                </div>
              )}

              {isOpen && (
                <div className="rounded-lg border border-sky-200/80 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 p-3.5 space-y-2 text-xs sm:text-sm">
                  <p className="font-bold text-slate-900 dark:text-[#F3F4F6]">
                    {item.card.keyThesis}
                  </p>
                  <ul className="space-y-1 text-slate-700 dark:text-[#D1D5DB]">
                    {item.card.answerPoints.map((pt, idx) => (
                      <li key={idx}>
                        {idx + 1}. {pt}
                      </li>
                    ))}
                  </ul>
                  {item.card.mathFormulaLatex && (
                    <div className="pt-1">
                      <MathBlock
                        latex={item.card.mathFormulaLatex}
                        displayMode={true}
                      />
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Part 2: Practice Tasks */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
          Часть 2 · Практические задачи ({ticket.practice.length})
        </h3>

        {ticket.practice.map((item) => {
          const t = item.task;
          const fb = taskFeedbacks[t.id];
          const hint = getTaskAnswerHint(t.id);
          const isOpen = Boolean(taskSolutionOpen[t.id]);
          const score = taskScores[t.id] ?? 0;
          const scoreOptions =
            item.maxPoints === 1
              ? [0, 1]
              : item.maxPoints === 5
                ? [0, 2, 3, 5]
                : item.maxPoints === 6
                  ? [0, 2, 4, 6]
                  : item.maxPoints === 7
                    ? [0, 3, 5, 7]
                    : [0, 4, 7, 9];

          return (
            <article
              key={t.id}
              className="prism-surface rounded-2xl p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-sky-700 dark:text-sky-400">
                    {item.label}
                  </span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span className="font-medium text-slate-800 dark:text-[#E5E7EB]">
                    {t.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 dark:text-[#94A3B8]">Балл:</span>
                  {scoreOptions.map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() =>
                        setTaskScores((prev) => ({...prev, [t.id]: pts}))
                      }
                      className={`px-2 py-0.5 font-mono rounded border cursor-pointer ${
                        score === pts
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200 font-bold'
                          : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8]'
                      }`}
                    >
                      {pts}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0E1522] p-4 space-y-2">
                <p className="text-sm font-medium text-slate-900 dark:text-[#F3F4F6]">
                  {t.problemTextClean ?? t.problemStatement}
                </p>
                {t.problemLatex && (
                  <MathBlock latex={t.problemLatex} displayMode={true} />
                )}
                {t.problemTextAfter && (
                  <p className="text-sm font-medium text-slate-900 dark:text-[#F3F4F6]">
                    {t.problemTextAfter}
                  </p>
                )}
              </div>

              {/* RK / Matan Auto Answer Verifier */}
              {(category === 'rk' || category === 'matan') && hint && (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={taskInputs[t.id] ?? ''}
                      onChange={(e) =>
                        setTaskInputs((prev) => ({
                          ...prev,
                          [t.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCheckRkTask(item);
                        }
                      }}
                      placeholder={hint.placeholder}
                      className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleCheckRkTask(item)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg prism-cta whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Сверить ответ
                    </button>
                  </div>
                  {fb && (
                    <p
                      className={`text-xs font-medium ${
                        fb.isCorrect
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {fb.feedback}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setTaskSolutionOpen((prev) => ({
                      ...prev,
                      [t.id]: !prev[t.id],
                    }))
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
                >
                  {isOpen ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Скрыть решение</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Показать решение и ответ</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTaskScratchOpen((prev) => ({...prev, [t.id]: !prev[t.id]}))
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
                >
                  <PenTool className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Черновик</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTaskPhotoOpen((prev) => ({...prev, [t.id]: !prev[t.id]}))
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Проверка по фото</span>
                </button>

                {hasMatanGraph(t.id) && (
                  <button
                    type="button"
                    onClick={() =>
                      setTaskGraphOpen((prev) => ({...prev, [t.id]: !prev[t.id]}))
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
                  >
                    <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>График</span>
                  </button>
                )}
              </div>

              {hasMatanGraph(t.id) && taskGraphOpen[t.id] && (
                <FunctionGraphCard taskId={t.id} />
              )}

              {taskScratchOpen[t.id] && (
                <DrawingScratchpad
                  taskKey={`${ticket.ticketCode}-${t.id}`}
                  onSendToPhotoCheck={(url) => {
                    setTaskPhotoOpen((prev) => ({...prev, [t.id]: true}));
                    setTaskScratchImg((prev) => ({...prev, [t.id]: url}));
                  }}
                />
              )}

              {taskPhotoOpen[t.id] && (
                <PhotoSolutionChecker
                  taskStatement={t.problemStatement}
                  taskLatex={t.problemLatex}
                  algorithmSummary={t.algorithmSummary}
                  expectedOutput={t.expectedOutput}
                  externalImageDataUrl={taskScratchImg[t.id]}
                  onClearExternalImage={() =>
                    setTaskScratchImg((prev) => ({...prev, [t.id]: null}))
                  }
                  onSolved={() => {
                    setTaskScores((prev) => ({...prev, [t.id]: item.maxPoints}));
                    onSetTaskMastery(t.id, 'solved');
                  }}
                />
              )}

              {isOpen && (
                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] space-y-3">
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-[#D1D5DB]">
                    <strong>Идея:</strong> {t.algorithmSummary}
                  </p>
                  {t.explanationSteps.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#0B101B] p-3 space-y-1.5 text-xs sm:text-sm"
                    >
                      <p className="font-semibold text-slate-900 dark:text-[#F3F4F6]">
                        {step.title}
                      </p>
                      <p className="text-slate-700 dark:text-[#D1D5DB]">
                        {step.detail}
                      </p>
                      {step.latex && (
                        <MathBlock latex={step.latex} displayMode={true} />
                      )}
                    </div>
                  ))}
                  {t.answerLatex ? (
                    <div className="rounded-lg border border-emerald-300 dark:border-emerald-700/70 bg-emerald-50/70 dark:bg-emerald-950/25 p-3">
                      <MathBlock latex={t.answerLatex} displayMode={true} />
                    </div>
                  ) : (
                    <pre className="p-3 rounded-lg bg-[#070B12] text-slate-100 text-xs font-mono overflow-x-auto">
                      <code>{t.code}</code>
                    </pre>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
