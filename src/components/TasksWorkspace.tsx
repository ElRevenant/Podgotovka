import {useEffect, useMemo, useState} from 'react';
import {
  Activity,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Dices,
  Eye,
  EyeOff,
  LayoutList,
  Lightbulb,
  PenTool,
  RefreshCw,
  Send,
  SplitSquareVertical,
  Terminal,
  XCircle,
} from 'lucide-react';
import {
  StudyCategory,
  TaskCard,
  TaskMasteryStatus,
} from '../types/study';
import {
  GeneratedPracticeTask,
  generateInfinitePracticeTask,
} from '../utils/infiniteTaskGenerator';
import {
  checkRkTaskAnswer,
  getTaskAnswerHint,
  TaskAnswerCheckResult,
} from '../utils/taskAnswerChecker';
import {DrawingScratchpad} from './DrawingScratchpad';
import {FunctionGraphCard, hasMatanGraph} from './FunctionGraphCard';
import {GostFlowchart} from './GostFlowchart';
import {MathBlock} from './MathBlock';
import {PhotoSolutionChecker} from './PhotoSolutionChecker';
import {SlideAttachmentsPanel} from './SlideAttachmentsPanel';

interface TasksWorkspaceProps {
  category: StudyCategory;
  tasks: TaskCard[];
  selectedTaskId: string;
  onSelectTaskId: (id: string) => void;
  taskMastery: Record<string, TaskMasteryStatus>;
  onSetTaskMastery: (taskId: string, status: TaskMasteryStatus) => void;
}

type TaskFilterOption =
  | 'all'
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

type RkLayoutMode = 'book' | 'single';

const MASTERY_LABELS: Record<TaskMasteryStatus, string> = {
  unsolved: 'Не решал',
  hint: 'С подсказкой',
  solved: 'Решил сам',
};

export function TasksWorkspace({
  category,
  tasks,
  selectedTaskId,
  onSelectTaskId,
  taskMastery,
  onSetTaskMastery,
}: TasksWorkspaceProps) {
  const [kindFilter, setKindFilter] = useState<TaskFilterOption>('all');
  const [copied, setCopied] = useState(false);
  const [layoutMode, setLayoutMode] = useState<RkLayoutMode>('book');

  /**
   * Progressive hint level per task:
   * 0 = hidden
   * 1 = idea (algorithmSummary)
   * 2 .. steps.length + 1 = step 1 .. step N revealed
   * steps.length + 2 = full solution + final answer
   */
  const [revealLevels, setRevealLevels] = useState<Record<string, number>>({});
  const [answerOnlyOpen, setAnswerOnlyOpen] = useState<Record<string, boolean>>(
    {},
  );
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});
  const [answerResults, setAnswerResults] = useState<
    Record<string, TaskAnswerCheckResult>
  >({});

  // Interactive tools per task (Scratchpad, Photo Checker, Function Graph)
  const [scratchpadOpen, setScratchpadOpen] = useState<Record<string, boolean>>({});
  const [photoCheckerOpen, setPhotoCheckerOpen] = useState<Record<string, boolean>>({});
  const [graphOpen, setGraphOpen] = useState<Record<string, boolean>>({});
  const [scratchpadExports, setScratchpadExports] = useState<Record<string, string | null>>({});

  // Infinite parametric practice generator state
  const [generatedTask, setGeneratedTask] = useState<GeneratedPracticeTask | null>(null);
  const [genAnswerInput, setGenAnswerInput] = useState('');
  const [genCheckResult, setGenCheckResult] = useState<TaskAnswerCheckResult | null>(null);
  const [genRevealLevel, setGenRevealLevel] = useState(0);
  const [genScratchOpen, setGenScratchOpen] = useState(false);
  const [genPhotoOpen, setGenPhotoOpen] = useState(false);
  const [genScratchImg, setGenScratchImg] = useState<string | null>(null);

  useEffect(() => {
    setKindFilter('all');
    setGeneratedTask(null);
    setGenAnswerInput('');
    setGenCheckResult(null);
    setGenRevealLevel(0);
  }, [category]);

  const handleSpawnGeneratedTask = (preferredKind?: string) => {
    const next = generateInfinitePracticeTask(category, preferredKind);
    setGeneratedTask(next);
    setGenAnswerInput('');
    setGenCheckResult(null);
    setGenRevealLevel(0);
    setGenScratchImg(null);
  };

  const visibleTasks = useMemo(() => {
    if (kindFilter === 'all') return tasks;
    return tasks.filter((t) => t.kind === kindFilter);
  }, [kindFilter, tasks]);

  const activeTask: TaskCard =
    visibleTasks.find((t) => t.id === selectedTaskId) ??
    visibleTasks[0] ??
    tasks[0];

  const masteryCounts = useMemo(() => {
    let solved = 0;
    let hint = 0;
    for (const t of tasks) {
      const st = taskMastery[t.id] ?? 'unsolved';
      if (st === 'solved') solved++;
      else if (st === 'hint') hint++;
    }
    return {solved, hint, total: tasks.length};
  }, [tasks, taskMastery]);

  const getFullLevel = (task: TaskCard) => task.explanationSteps.length + 2;

  const handleRevealNextHint = (task: TaskCard) => {
    const full = getFullLevel(task);
    setRevealLevels((prev) => {
      const curr = prev[task.id] ?? 0;
      return {...prev, [task.id]: Math.min(full, curr + 1)};
    });
  };

  const handleToggleFullSolution = (task: TaskCard) => {
    const full = getFullLevel(task);
    setRevealLevels((prev) => {
      const curr = prev[task.id] ?? 0;
      return {...prev, [task.id]: curr >= full ? 0 : full};
    });
  };

  const setAllSolutionsOpen = (open: boolean) => {
    const next: Record<string, number> = {};
    for (const t of visibleTasks) {
      next[t.id] = open ? getFullLevel(t) : 0;
    }
    setRevealLevels(next);
  };

  const handleVerifyAnswer = (task: TaskCard) => {
    const raw = answerInputs[task.id] ?? '';
    const res = checkRkTaskAnswer(task.id, raw);
    setAnswerResults((prev) => ({...prev, [task.id]: res}));
    if (res.isCorrect) {
      const currentStatus = taskMastery[task.id] ?? 'unsolved';
      const usedHints =
        (revealLevels[task.id] ?? 0) > 0 || Boolean(answerOnlyOpen[task.id]);
      if (currentStatus !== 'solved') {
        onSetTaskMastery(task.id, usedHints ? 'hint' : 'solved');
      }
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore clipboard restriction
    }
  };

  const renderMasteryButtons = (taskId: string) => {
    const status = taskMastery[taskId] ?? 'unsolved';
    return (
      <div
        role="group"
        aria-label="Статус решения задачи"
        className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-[#0B101B] border border-slate-200/80 dark:border-white/[0.08]"
      >
        {(['unsolved', 'hint', 'solved'] as const).map((st) => {
          const active = status === st;
          const activeTone =
            st === 'solved'
              ? 'bg-emerald-600 text-white'
              : st === 'hint'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-900 shadow-2xs dark:bg-[#131B2B] dark:text-[#F3F4F6]';
          return (
            <button
              key={st}
              type="button"
              onClick={() => onSetTaskMastery(taskId, st)}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? activeTone
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
              }`}
            >
              {MASTERY_LABELS[st]}
            </button>
          );
        })}
      </div>
    );
  };

  const renderRkProblemCondition = (task: TaskCard) => {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0E1522] p-4 sm:p-5 space-y-2.5">
        <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-900 dark:text-[#F3F4F6]">
          {task.problemTextClean ?? task.problemStatement}
        </p>
        {task.problemLatex && (
          <div className="py-1">
            <MathBlock latex={task.problemLatex} displayMode={true} />
          </div>
        )}
        {task.problemTextAfter && (
          <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-900 dark:text-[#F3F4F6]">
            {task.problemTextAfter}
          </p>
        )}
      </div>
    );
  };

  const renderRkAnswerChecker = (task: TaskCard) => {
    const hint = getTaskAnswerHint(task.id);
    if (!hint) return null;
    const result = answerResults[task.id];

    return (
      <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#0B101B] p-3.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-900 dark:text-[#F3F4F6]">
            Сверь свой ответ (автопроверка)
          </span>
          <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
            {hint.formatHint}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={answerInputs[task.id] ?? ''}
            onChange={(e) =>
              setAnswerInputs((prev) => ({...prev, [task.id]: e.target.value}))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleVerifyAnswer(task);
              }
            }}
            placeholder={hint.placeholder}
            className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] placeholder:text-slate-400 dark:placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={() => handleVerifyAnswer(task)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg prism-cta transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Проверить ответ</span>
          </button>
        </div>

        {result && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs flex items-start gap-2 ${
              result.isCorrect
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/70 dark:bg-emerald-950/35 dark:text-emerald-200'
                : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/35 dark:text-amber-200'
            }`}
          >
            {result.isCorrect ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <span>{result.feedback}</span>
          </div>
        )}
      </div>
    );
  };

  const renderProgressiveControlsAndSolution = (task: TaskCard) => {
    const level = revealLevels[task.id] ?? 0;
    const fullLevel = getFullLevel(task);
    const stepsVisibleCount = Math.max(
      0,
      Math.min(task.explanationSteps.length, level - 1),
    );
    const showIdea = level >= 1;
    const showAnswer = level >= fullLevel || Boolean(answerOnlyOpen[task.id]);

    const nextHintLabel =
      level === 0
        ? '1. Показать идею'
        : level <= task.explanationSteps.length
          ? `2. Показать шаг ${level} из ${task.explanationSteps.length}`
          : '3. Открыть финальный ответ';

    return (
      <div className="mt-4 space-y-4">
        {/* Progressive Hint Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-2">
            {level < fullLevel && (
              <button
                type="button"
                onClick={() => handleRevealNextHint(task)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-sky-300 dark:border-sky-600/60 bg-sky-50/80 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-950/50 transition-colors cursor-pointer"
              >
                <Lightbulb className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>{nextHintLabel}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setAnswerOnlyOpen((prev) => ({
                  ...prev,
                  [task.id]: !prev[task.id],
                }))
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] transition-colors cursor-pointer"
            >
              <span>
                {answerOnlyOpen[task.id] && level < fullLevel
                  ? 'Скрыть ответ'
                  : 'Только ответ'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleFullSolution(task)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                level >= fullLevel
                  ? 'border border-slate-200 dark:border-white/[0.08] bg-slate-100 text-slate-800 dark:bg-[#131B2B] dark:text-[#E5E7EB]'
                  : 'prism-cta'
              }`}
            >
              {level >= fullLevel ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Скрыть решение</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>Открыть всё решение</span>
                </>
              )}
            </button>
          </div>

          {renderMasteryButtons(task.id)}
        </div>

        {/* Disclosed Idea */}
        {showIdea && (
          <div className="rounded-xl border border-sky-200/80 dark:border-sky-900/50 bg-sky-50/60 dark:bg-sky-950/20 p-4">
            <p className="text-xs font-semibold text-sky-800 dark:text-sky-300 mb-1">
              Идея и метод решения
            </p>
            <p className="text-sm leading-relaxed text-slate-800 dark:text-[#E5E7EB]">
              {task.algorithmSummary}
            </p>
          </div>
        )}

        {/* Disclosed Steps (1..N progressively) */}
        {stepsVisibleCount > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              Пошаговое решение ({stepsVisibleCount} из {task.explanationSteps.length})
            </p>
            {task.explanationSteps
              .slice(0, stepsVisibleCount)
              .map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1522] p-4 space-y-2"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                    {step.title}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-[#D1D5DB]">
                    {step.detail}
                  </p>
                  {step.latex && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
                      <MathBlock latex={step.latex} displayMode={true} />
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Boxed Final Answer */}
        {showAnswer && (
          <div className="rounded-xl border-2 border-emerald-300 dark:border-emerald-700/70 bg-emerald-50/70 dark:bg-emerald-950/25 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Ответ к задаче</span>
            </div>
            {task.answerLatex ? (
              <MathBlock latex={task.answerLatex} displayMode={true} />
            ) : (
              <p className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                {task.expectedOutput}
              </p>
            )}
          </div>
        )}

        {/* Interactive Tools Strip: Scratchpad + Photo Solution Check + Matan Set 5 Function Graph */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setScratchpadOpen((prev) => ({
                  ...prev,
                  [task.id]: !prev[task.id],
                }))
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                scratchpadOpen[task.id]
                  ? 'border-sky-400 bg-sky-50 text-sky-900 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-200'
                  : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235]'
              }`}
            >
              <PenTool className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Черновик (рисовать)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setPhotoCheckerOpen((prev) => ({
                  ...prev,
                  [task.id]: !prev[task.id],
                }))
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                photoCheckerOpen[task.id]
                  ? 'border-sky-400 bg-sky-50 text-sky-900 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-200'
                  : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235]'
              }`}
            >
              <Camera className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Проверить решение по фото</span>
            </button>

            {hasMatanGraph(task.id) && (
              <button
                type="button"
                onClick={() =>
                  setGraphOpen((prev) => ({
                    ...prev,
                    [task.id]: !prev[task.id],
                  }))
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  graphOpen[task.id]
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235]'
                }`}
              >
                <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Интерактивный график</span>
              </button>
            )}
          </div>

          {hasMatanGraph(task.id) && graphOpen[task.id] && (
            <FunctionGraphCard taskId={task.id} />
          )}

          {scratchpadOpen[task.id] && (
            <DrawingScratchpad
              taskKey={task.id}
              onSendToPhotoCheck={(dataUrl) => {
                setPhotoCheckerOpen((prev) => ({...prev, [task.id]: true}));
                setScratchpadExports((prev) => ({...prev, [task.id]: dataUrl}));
              }}
            />
          )}

          {photoCheckerOpen[task.id] && (
            <PhotoSolutionChecker
              taskStatement={task.problemStatement}
              taskLatex={task.problemLatex}
              algorithmSummary={task.algorithmSummary}
              expectedOutput={task.expectedOutput}
              externalImageDataUrl={scratchpadExports[task.id]}
              onClearExternalImage={() =>
                setScratchpadExports((prev) => ({...prev, [task.id]: null}))
              }
              onSolved={() => onSetTaskMastery(task.id, 'solved')}
            />
          )}
        </div>
      </div>
    );
  };

  const basicCount = tasks.filter((t) => t.kind === 'rk-basic').length;
  const advCount = tasks.filter((t) => t.kind === 'rk-advanced').length;
  const ticketCount = tasks.filter((t) => t.kind === 'rk-ticket').length;

  const matanSetCounts = {
    'matan-1': tasks.filter((t) => t.kind === 'matan-1').length,
    'matan-2': tasks.filter((t) => t.kind === 'matan-2').length,
    'matan-3': tasks.filter((t) => t.kind === 'matan-3').length,
    'matan-4': tasks.filter((t) => t.kind === 'matan-4').length,
    'matan-5': tasks.filter((t) => t.kind === 'matan-5').length,
  };

  if (category === 'rk' || category === 'matan') {
    const anySolutionOpen = visibleTasks.some(
      (t) => (revealLevels[t.id] ?? 0) >= getFullLevel(t),
    );

    return (
      <div className="flex flex-col gap-6">
        {/* Top Control Bar for Math Practice Tasks (РК 2 & Матан G22) */}
        <section className="prism-surface rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-[#F3F4F6]">
                {category === 'matan'
                  ? `Практика Матан · ${tasks.length} решённых задач (G22 + Методички МГТУ Ч.1–3)`
                  : 'Практика РК 2 · Все 17 задач с подсказками и автопроверкой ответа'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] tabular-nums">
                Решил сам:{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">
                  {masteryCounts.solved}
                </strong>{' '}
                из {masteryCounts.total} · С подсказкой:{' '}
                <strong className="text-amber-700 dark:text-amber-400">
                  {masteryCounts.hint}
                </strong>{' '}
                · Раскрывайте решение пошагово: Идея → Шаги → Ответ
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B101B]">
              <button
                type="button"
                onClick={() => setKindFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  kindFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
                }`}
              >
                Все ({tasks.length})
              </button>

              {category === 'matan' ? (
                <>
                  {(
                    [
                      {id: 'matan-1', label: '1. Пределы', first: 'matan-1-1'},
                      {id: 'matan-2', label: '2. Б.м. и б.б.', first: 'matan-2-1'},
                      {id: 'matan-3', label: '3. Разрывы', first: 'matan-3-1'},
                      {id: 'matan-4', label: '4. Тейлор', first: 'matan-4-1'},
                      {id: 'matan-5', label: '5. Графики', first: 'matan-5-1'},
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setKindFilter(tab.id);
                        onSelectTaskId(tab.first);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        kindFilter === tab.id
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                          : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
                      }`}
                    >
                      {tab.label} ({matanSetCounts[tab.id]})
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setKindFilter('rk-basic');
                      onSelectTaskId('rk-base-1');
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      kindFilter === 'rk-basic'
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                        : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
                    }`}
                  >
                    Базовый уровень ({basicCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setKindFilter('rk-advanced');
                      onSelectTaskId('rk-adv-1');
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      kindFilter === 'rk-advanced'
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                        : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
                    }`}
                  >
                    Повыш. сложность ({advCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setKindFilter('rk-ticket');
                      onSelectTaskId('rk-ticket-1');
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      kindFilter === 'rk-ticket'
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                        : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
                    }`}
                  >
                    Типовой билет ({ticketCount})
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Jump Chips + Layout Switcher */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {visibleTasks.map((task) => {
                const isSelected = task.id === activeTask.id;
                const status = taskMastery[task.id] ?? 'unsolved';
                const statusTone =
                  status === 'solved'
                    ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900 dark:border-emerald-700/70 dark:bg-emerald-950/35 dark:text-emerald-200'
                    : status === 'hint'
                      ? 'border-amber-300 bg-amber-50/70 text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/35 dark:text-amber-200'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 dark:bg-[#0B101B] dark:border-white/[0.08] dark:text-[#D1D5DB]';

                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => {
                      onSelectTaskId(task.id);
                      if (layoutMode === 'book') {
                        const el = document.getElementById(`task-card-${task.id}`);
                        el?.scrollIntoView({behavior: 'smooth', block: 'start'});
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-sky-500 border-sky-400 bg-sky-50 text-sky-900 dark:bg-sky-500/15 dark:border-sky-500/60 dark:text-sky-100'
                        : statusTone
                    }`}
                  >
                    <span className="font-semibold">{task.badgeNumber}</span>
                    <span className="truncate max-w-[170px] opacity-85">
                      {task.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B101B]">
                <button
                  type="button"
                  onClick={() => setLayoutMode('book')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    layoutMode === 'book'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
                  }`}
                >
                  <LayoutList className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Списком ({visibleTasks.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('single')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    layoutMode === 'single'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
                  }`}
                >
                  <SplitSquareVertical className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>По одной + лист PDF</span>
                </button>
              </div>

              {layoutMode === 'book' && (
                <button
                  type="button"
                  onClick={() => setAllSolutionsOpen(!anySolutionOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] transition-colors cursor-pointer"
                >
                  {anySolutionOpen ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                      <span>Скрыть все решения</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Показать все решения</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  handleSpawnGeneratedTask(
                    kindFilter !== 'all' ? kindFilter : undefined,
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg prism-cta transition-colors cursor-pointer"
              >
                <Dices className="h-3.5 w-3.5" />
                <span>Аналог с новыми числами</span>
              </button>
            </div>
          </div>
        </section>

        {/* Infinite Parametric Practice Task Generator Panel */}
        {generatedTask && (
          <section className="rounded-xl border-2 border-sky-400/70 dark:border-sky-500/60 bg-white dark:bg-[#131B2B] p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono font-semibold text-sky-700 dark:text-sky-400">
                  Бесконечный тренажёр · {generatedTask.generatorTopic}
                </p>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F3F4F6]">
                  {generatedTask.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSpawnGeneratedTask(
                      kindFilter !== 'all' ? kindFilter : undefined,
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg prism-cta cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Новые числа</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratedTask(null)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </div>

            {renderRkProblemCondition(generatedTask)}

            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#0B101B] p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-[#F3F4F6]">
                  Автопроверка ответа
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                  {generatedTask.formatHint}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={genAnswerInput}
                  onChange={(e) => setGenAnswerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setGenCheckResult(generatedTask.checkAnswer(genAnswerInput));
                    }
                  }}
                  placeholder={generatedTask.placeholder}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setGenCheckResult(generatedTask.checkAnswer(genAnswerInput))
                  }
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg prism-cta cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Проверить</span>
                </button>
              </div>
              {genCheckResult && (
                <div
                  className={`rounded-lg border px-3 py-2 text-xs flex items-start gap-2 ${
                    genCheckResult.isCorrect
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/70 dark:bg-emerald-950/35 dark:text-emerald-200'
                      : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/35 dark:text-amber-200'
                  }`}
                >
                  {genCheckResult.isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span>{genCheckResult.feedback}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setGenRevealLevel((l) =>
                    l >= generatedTask.explanationSteps.length + 2
                      ? 0
                      : generatedTask.explanationSteps.length + 2,
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg prism-cta cursor-pointer"
              >
                {genRevealLevel > 0 ? 'Скрыть решение' : 'Показать пошаговое решение'}
              </button>
              <button
                type="button"
                onClick={() => setGenScratchOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] cursor-pointer"
              >
                <PenTool className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>Черновик</span>
              </button>
              <button
                type="button"
                onClick={() => setGenPhotoOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>Проверить по фото</span>
              </button>
            </div>

            {genScratchOpen && (
              <DrawingScratchpad
                taskKey={generatedTask.id}
                onSendToPhotoCheck={(url) => {
                  setGenPhotoOpen(true);
                  setGenScratchImg(url);
                }}
              />
            )}

            {genPhotoOpen && (
              <PhotoSolutionChecker
                taskStatement={generatedTask.problemStatement}
                taskLatex={generatedTask.problemLatex}
                algorithmSummary={generatedTask.algorithmSummary}
                expectedOutput={generatedTask.expectedOutput}
                externalImageDataUrl={genScratchImg}
                onClearExternalImage={() => setGenScratchImg(null)}
              />
            )}

            {genRevealLevel > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
                <p className="text-xs sm:text-sm text-slate-700 dark:text-[#D1D5DB]">
                  <strong>Идея:</strong> {generatedTask.algorithmSummary}
                </p>
                {generatedTask.explanationSteps.map((step, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0E1522] p-3 space-y-1.5"
                  >
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                      {step.title}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-[#D1D5DB]">
                      {step.detail}
                    </p>
                    {step.latex && <MathBlock latex={step.latex} displayMode={true} />}
                  </div>
                ))}
                {generatedTask.answerLatex && (
                  <div className="rounded-lg border border-emerald-300 dark:border-emerald-700/70 bg-emerald-50/70 dark:bg-emerald-950/25 p-3">
                    <MathBlock latex={generatedTask.answerLatex} displayMode={true} />
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* MODE 1: Book / Problem Sheet List */}
        {layoutMode === 'book' ? (
          <div className="space-y-5">
            {visibleTasks.map((task) => {
              return (
                <article
                  key={task.id}
                  id={`task-card-${task.id}`}
                  className="scroll-mt-20 prism-surface rounded-2xl p-5 sm:p-6 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-sky-700 dark:text-sky-400">
                        {task.badgeNumber}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-[#404040]">·</span>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-[#F3F4F6]">
                        {task.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTaskId(task.id);
                        setLayoutMode('single');
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] transition-colors cursor-pointer"
                    >
                      Весь лист PDF
                    </button>
                  </div>

                  {renderRkProblemCondition(task)}
                  {renderRkAnswerChecker(task)}
                  {renderProgressiveControlsAndSolution(task)}
                </article>
              );
            })}
          </div>
        ) : (
          /* MODE 2: Single Task Split View + Full PDF Sheet */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-7 flex flex-col gap-5">
              <article className="prism-surface rounded-2xl p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#94A3B8] mb-2">
                  <span className="font-mono font-semibold text-sky-700 dark:text-sky-400">
                    {activeTask.badgeNumber}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeTask.chapter}</span>
                </div>

                <h3 className="text-xl font-semibold text-slate-900 dark:text-[#F3F4F6] mb-4">
                  {activeTask.title}
                </h3>

                {renderRkProblemCondition(activeTask)}
                {renderRkAnswerChecker(activeTask)}
                {renderProgressiveControlsAndSolution(activeTask)}
              </article>
            </div>

            <aside className="xl:col-span-5 xl:sticky xl:top-20 prism-surface rounded-2xl p-4 sm:p-5">
              <SlideAttachmentsPanel
                slides={activeTask.slides}
                heading={
                  category === 'matan'
                    ? 'Полный лист PDF с задачами Матана (G22)'
                    : 'Полный лист PDF с задачей РК 2'
                }
                compact
                defaultHidden={false}
              />
            </aside>
          </div>
        )}
      </div>
    );
  }

  // Handle custom imported PDF subjects that don't have built-in practice tasks
  if (!activeTask) {
    return (
      <section className="prism-surface rounded-2xl p-8 text-center space-y-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-[#F3F4F6]">
          Для импортированного PDF-предмета пока нет встроенных практических задач
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
          Используйте вкладки «Карточки», «Блиц-тест», «Ночь перед экзаменом» и «Устный экзамен» для повторения сгенерированных карточек.
        </p>
      </section>
    );
  }

  // ======================== EXAM (АИП) MODE ========================
  const examLevel = revealLevels[activeTask.id] ?? getFullLevel(activeTask);
  const examFull = getFullLevel(activeTask);
  const examStepsShown = Math.max(
    0,
    Math.min(activeTask.explanationSteps.length, examLevel - 1),
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="prism-surface rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-[#F3F4F6]">
              Разбор задач и примеров со слайдами-ответами
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] tabular-nums">
              Решил сам:{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">
                {masteryCounts.solved}
              </strong>{' '}
              из {masteryCounts.total} · С подсказкой:{' '}
              <strong className="text-amber-700 dark:text-amber-400">
                {masteryCounts.hint}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B101B]">
            <button
              type="button"
              onClick={() => setKindFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                kindFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
              }`}
            >
              Все ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setKindFilter('exam');
                onSelectTaskId('exam-task-1');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                kindFilter === 'exam'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
              }`}
            >
              Экзаменационные (2)
            </button>
            <button
              type="button"
              onClick={() => setKindFilter('lecture')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                kindFilter === 'lecture'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
              }`}
            >
              Примеры лекций ({Math.max(0, tasks.length - 2)})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleTasks.map((task) => {
            const isSelected = task.id === activeTask.id;
            const st = taskMastery[task.id] ?? 'unsolved';
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  onSelectTaskId(task.id);
                  setCopied(false);
                }}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 border-sky-300 text-sky-900 dark:bg-sky-500/15 dark:border-sky-500/60 dark:text-sky-100'
                    : st === 'solved'
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 dark:bg-emerald-950/35 dark:border-emerald-700/70 dark:text-emerald-200'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 dark:bg-[#0B101B] dark:border-white/[0.08] dark:text-[#D1D5DB] dark:hover:border-[#404040]'
                }`}
              >
                <span className="font-mono font-semibold tabular-nums">
                  {task.badgeNumber}
                </span>
                <span className="truncate max-w-[230px]">{task.title}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 flex flex-col gap-5">
          <article className="prism-surface rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#94A3B8]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-semibold text-sky-700 dark:text-sky-400">
                  {activeTask.badgeNumber}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeTask.chapter}</span>
              </div>
              {renderMasteryButtons(activeTask.id)}
            </div>

            <h3 className="mt-2.5 text-xl font-semibold text-slate-900 dark:text-[#F3F4F6]">
              {activeTask.title}
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-[#D1D5DB]">
              {activeTask.problemStatement}
            </p>

            {/* Progressive step disclosure controls for АИП tasks */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.08] flex flex-wrap items-center gap-2">
              {examLevel < examFull && (
                <button
                  type="button"
                  onClick={() => handleRevealNextHint(activeTask)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-sky-300 dark:border-sky-600/60 bg-sky-50/80 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 cursor-pointer"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>
                    {examLevel === 0
                      ? '1. Показать идею'
                      : examLevel <= activeTask.explanationSteps.length
                        ? `2. Показать шаг ${examLevel}`
                        : '3. Показать код и вывод'}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  setRevealLevels((prev) => ({
                    ...prev,
                    [activeTask.id]: examLevel >= examFull ? 0 : examFull,
                  }))
                }
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
              >
                {examLevel >= examFull
                  ? 'Скрыть решение (тренировка с подсказками)'
                  : 'Открыть всё решение'}
              </button>
            </div>

            {examLevel >= 1 && (
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.08]">
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">
                  Идея алгоритма
                </p>
                <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-[#F3F4F6]">
                  {activeTask.algorithmSummary}
                </p>
              </div>
            )}

            {examStepsShown > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.08] space-y-3">
                <p className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">
                  Пошаговое пояснение к решению ({examStepsShown}/{activeTask.explanationSteps.length})
                </p>
                {activeTask.explanationSteps
                  .slice(0, examStepsShown)
                  .map((step, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                        {step.title}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-[#D1D5DB]">
                        {step.detail}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            {examLevel >= examFull && (
              <>
                <div className="mt-5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-[#070B12] text-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08] bg-[#0E1522]">
                    <span className="text-xs font-medium text-slate-300">
                      Текст программы (C / C++)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeTask.code)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Копировать код</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs leading-relaxed overflow-x-auto font-mono text-slate-100">
                    <code>{activeTask.code}</code>
                  </pre>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] mb-1.5">
                    <Terminal className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Контрольный вывод в терминале</span>
                  </div>
                  <pre className="text-xs font-mono leading-relaxed text-slate-800 dark:text-[#E5E7EB] whitespace-pre-wrap">
                    {activeTask.expectedOutput}
                  </pre>
                </div>
              </>
            )}
          </article>

          {activeTask.gostFlowchartId && (
            <GostFlowchart taskId={activeTask.gostFlowchartId} />
          )}
        </div>

        <aside className="xl:col-span-5 xl:sticky xl:top-20 prism-surface rounded-2xl p-4 sm:p-5">
          <SlideAttachmentsPanel
            slides={activeTask.slides}
            heading="Слайд с ответом и опорные слайды"
            compact
          />
        </aside>
      </div>
    </div>
  );
}
