import {useState, useMemo} from 'react';
import {
  X,
  Table2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Flame,
  Eye,
  HelpCircle,
} from 'lucide-react';
import {
  CLOZE_TABLES_DATA,
  type ClozeSubject,
  type ClozeCellItem,
} from '../data/clozeTablesData';
import {MathBlock} from './MathBlock';

interface ClozeTableDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: ClozeSubject;
  onAwardXp?: (amount: number) => void;
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function ClozeTableDrillModal({
  isOpen,
  onClose,
  initialSubject = 'matan',
  onAwardXp,
}: ClozeTableDrillModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<ClozeSubject>(initialSubject);
  const subjectTables = useMemo(
    () => CLOZE_TABLES_DATA.filter((t) => t.subject === selectedSubject),
    [selectedSubject]
  );

  const [selectedTableId, setSelectedTableId] = useState<string>(
    () => CLOZE_TABLES_DATA.find((t) => t.subject === initialSubject)?.id || CLOZE_TABLES_DATA[0].id
  );

  const activeTable = useMemo(
    () =>
      CLOZE_TABLES_DATA.find((t) => t.id === selectedTableId) ||
      subjectTables[0] ||
      CLOZE_TABLES_DATA[0],
    [selectedTableId, subjectTables]
  );

  // cellId -> selected option string
  const [solvedCells, setSolvedCells] = useState<Record<string, string>>({});
  // cellId -> last wrong choice string
  const [wrongCells, setWrongCells] = useState<Record<string, string>>({});
  // streak of consecutive right answers without error
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  // tableId -> true if XP already awarded for completing this table in current attempt
  const [rewardedTables, setRewardedTables] = useState<Record<string, boolean>>({});
  const [activeFeedback, setActiveFeedback] = useState<{
    cellId: string;
    isCorrect: boolean;
    chosen: string;
    explanation: string;
  } | null>(null);

  const shuffledOptionsByCell = useMemo(() => {
    void shuffleSeed;
    const map: Record<string, string[]> = {};
    for (const row of activeTable.rows) {
      for (const cell of row.cells) {
        if (cell.isBlank && cell.options) {
          map[cell.id] = shuffleArray(cell.options);
        }
      }
    }
    return map;
  }, [activeTable, shuffleSeed]);

  if (!isOpen) return null;

  const allBlankCells: ClozeCellItem[] = activeTable.rows.flatMap((r) =>
    r.cells.filter((c) => c.isBlank)
  );
  const totalBlanks = allBlankCells.length;
  const solvedCount = allBlankCells.filter((c) => solvedCells[c.id] === c.content).length;
  const isTableComplete = totalBlanks > 0 && solvedCount === totalBlanks;

  const handleSelectSubject = (subj: ClozeSubject) => {
    setSelectedSubject(subj);
    const first = CLOZE_TABLES_DATA.find((t) => t.subject === subj);
    if (first) {
      setSelectedTableId(first.id);
    }
    setActiveFeedback(null);
  };

  const handlePickOption = (cell: ClozeCellItem, option: string) => {
    if (solvedCells[cell.id] === cell.content) return;

    if (option === cell.content) {
      const nextSolved = {...solvedCells, [cell.id]: option};
      setSolvedCells(nextSolved);
      setWrongCells((prev) => {
        const copy = {...prev};
        delete copy[cell.id];
        return copy;
      });
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > bestStreak) setBestStreak(nextStreak);

      setActiveFeedback({
        cellId: cell.id,
        isCorrect: true,
        chosen: option,
        explanation: cell.explanation || 'Точное попадание!',
      });

      // Check if table just finished
      const nowCompletedCount = allBlankCells.filter(
        (c) => nextSolved[c.id] === c.content
      ).length;
      if (nowCompletedCount === totalBlanks && !rewardedTables[activeTable.id]) {
        setRewardedTables((prev) => ({...prev, [activeTable.id]: true}));
        onAwardXp?.(15);
      }
    } else {
      setWrongCells((prev) => ({...prev, [cell.id]: option}));
      setStreak(0);
      setActiveFeedback({
        cellId: cell.id,
        isCorrect: false,
        chosen: option,
        explanation:
          cell.explanation ||
          'Обрати внимание на знак, коэффициент или наличие факториала в знаменателе.',
      });
    }
  };

  const handleResetTable = () => {
    const tableCellIds = new Set(allBlankCells.map((c) => c.id));
    setSolvedCells((prev) => {
      const copy = {...prev};
      tableCellIds.forEach((id) => delete copy[id]);
      return copy;
    });
    setWrongCells((prev) => {
      const copy = {...prev};
      tableCellIds.forEach((id) => delete copy[id]);
      return copy;
    });
    setRewardedTables((prev) => {
      const copy = {...prev};
      delete copy[activeTable.id];
      return copy;
    });
    setActiveFeedback(null);
    setShuffleSeed((s) => s + 1);
  };

  const handleRevealAll = () => {
    const nextSolved = {...solvedCells};
    allBlankCells.forEach((c) => {
      nextSolved[c.id] = c.content;
    });
    setSolvedCells(nextSolved);
    setActiveFeedback(null);
  };

  const renderCellContent = (
    text: string,
    mode: 'latex' | 'code' | 'text' = 'text',
    compact = false
  ) => {
    if (mode === 'latex') {
      return (
        <MathBlock
          latex={text}
          displayMode={false}
          className={compact ? 'text-xs !py-0' : 'text-sm !py-0.5'}
        />
      );
    }
    if (mode === 'code') {
      return (
        <code
          className={`font-mono ${
            compact ? 'text-[11px]' : 'text-xs'
          } text-emerald-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-emerald-500/20`}
        >
          {text}
        </code>
      );
    }
    return <span className={compact ? 'text-xs' : 'text-xs sm:text-sm'}>{text}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#0B101B] border border-cyan-500/25 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Тренажёр «Слепая таблица»
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  +15 XP за таблицу
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Заполни пропуски в формулах, эквивалентностях, рангах СЛАУ и таблицах памяти C/C++
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Серия без ошибок: {streak}</span>
              {bestStreak > 0 && (
                <span className="text-[10px] text-amber-400/70 ml-1">(макс: {bestStreak})</span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subject & Table Switcher */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/60 border-b border-white/10 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {(
                [
                  {id: 'matan', label: 'Матан (4 таблицы)'},
                  {id: 'rk', label: 'Ангем РК 2 (2 таблицы)'},
                  {id: 'exam', label: 'АИП C/C++ (2 таблицы)'},
                ] as {id: ClozeSubject; label: string}[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleSelectSubject(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedSubject === tab.id
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Заполнено:{' '}
                <strong className="text-cyan-300">
                  {solvedCount} / {totalBlanks}
                </strong>
              </span>
              <button
                onClick={handleRevealAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
                title="Показать все ответы для повторения"
              >
                <Eye className="w-3.5 h-3.5" />
                Шпаргалка
              </button>
              <button
                onClick={handleResetTable}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs text-cyan-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Скрыть ячейки заново
              </button>
            </div>
          </div>

          {/* Sub-tabs for specific tables in current subject */}
          <div className="flex flex-wrap gap-1.5">
            {subjectTables.map((t) => {
              const tBlanks = t.rows.flatMap((r) => r.cells.filter((c) => c.isBlank));
              const tDone = tBlanks.filter((c) => solvedCells[c.id] === c.content).length;
              const isCurrent = t.id === activeTable.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTableId(t.id);
                    setActiveFeedback(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 ${
                    isCurrent
                      ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200'
                      : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{t.title}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      tDone === tBlanks.length
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {tDone}/{tBlanks.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Table Header Info + Exam Tip */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-indigo-950/40 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-cyan-400">
                {activeTable.badge}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {activeTable.title}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">{activeTable.subtitle}</p>
            </div>
            <div className="sm:max-w-md p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{activeTable.examTip}</span>
            </div>
          </div>

          {/* Completion Banner */}
          {isTableComplete && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-emerald-200 text-xs sm:text-sm font-medium">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  Таблица полностью восстановлена без пробелов! Начислено{' '}
                  <strong className="text-emerald-300">+15 XP</strong>.
                </span>
              </div>
              <button
                onClick={handleResetTable}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shrink-0"
              >
                Пройти ещё раз
              </button>
            </div>
          )}

          {/* Feedback banner for last clicked option */}
          {activeFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 transition-all ${
                activeFeedback.isCorrect
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
              }`}
            >
              {activeFeedback.isCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">
                  {activeFeedback.isCorrect
                    ? 'Верно! Ячейка открыта:'
                    : 'Ловушка! Почему этот вариант не подходит:'}
                </div>
                <div className="mt-0.5 text-slate-200">{activeFeedback.explanation}</div>
              </div>
            </div>
          )}

          {/* Interactive Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                  {activeTable.columns.map((col, idx) => (
                    <th key={idx} className="py-3 px-4 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {activeTable.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* First Column: Row Label */}
                    <td className="py-3.5 px-4 align-top w-1/4 bg-slate-900/40 border-r border-white/5 font-medium text-slate-100">
                      {renderCellContent(row.rowLabel, row.rowLabelMode || 'text')}
                    </td>

                    {/* Remaining Columns */}
                    {row.cells.map((cell) => {
                      const isSolved = solvedCells[cell.id] === cell.content;
                      const wrongPick = wrongCells[cell.id];

                      if (!cell.isBlank) {
                        return (
                          <td
                            key={cell.id}
                            className="py-3.5 px-4 align-top text-slate-300 border-r border-white/5 last:border-r-0"
                          >
                            {renderCellContent(cell.content, cell.renderMode)}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={cell.id}
                          className={`py-3.5 px-4 align-top border-r border-white/5 last:border-r-0 transition-colors ${
                            isSolved
                              ? 'bg-emerald-950/20'
                              : wrongPick
                              ? 'bg-rose-950/20'
                              : 'bg-cyan-950/10'
                          }`}
                        >
                          {isSolved ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-100 flex-1">
                                  {renderCellContent(cell.content, cell.renderMode)}
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              </div>
                              {cell.explanation && (
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  {cell.explanation}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-[11px] font-semibold text-cyan-300 flex items-center justify-between">
                                <span>[ ? ] Выбери точное выражение:</span>
                                {wrongPick && (
                                  <span className="text-rose-400 text-[10px]">
                                    Ошибка — попробуй ещё раз
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {(shuffledOptionsByCell[cell.id] || cell.options || []).map((opt, optIdx) => {
                                  const isThisWrong = wrongPick === opt;
                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => handlePickOption(cell, opt)}
                                      className={`text-left px-2.5 py-2 rounded-lg border transition-all flex items-center justify-between gap-1.5 ${
                                        isThisWrong
                                          ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                                          : 'bg-slate-900/90 hover:bg-cyan-500/15 border-white/10 hover:border-cyan-400/50 text-slate-200'
                                      }`}
                                    >
                                      <div className="overflow-x-auto">
                                        {renderCellContent(opt, cell.renderMode, true)}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
