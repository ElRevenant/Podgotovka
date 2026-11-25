import {useState, useMemo} from 'react';
import {
  X,
  ShieldAlert,
  Sparkles,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Play,
  Sliders,
  TrendingUp,
} from 'lucide-react';
import type {
  TheoryCard,
  CardSRState,
  TaskMasteryStatus,
} from '../types/study';
import {getCardSRState} from '../utils/spacedRepetition';

interface ExamSurvivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectLabel: string;
  cards: TheoryCard[];
  srMap: Record<number, CardSRState>;
  taskMastery: Record<string, TaskMasteryStatus>;
  onStartRescueSprint: (label: string, cardIds: number[]) => void;
}

function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

/**
 * Computes hypergeometric ticket survival probabilities for drawing a 3-question exam ticket
 * from N total cards where K are mastered ("known"), L are familiar ("learning"), and U are weak/unseen.
 */
function computeTicketProbabilities(total: number, known: number, learning: number) {
  const N = Math.max(3, total);
  const K = Math.min(N, Math.max(0, known));
  const L = Math.min(N - K, Math.max(0, learning));
  const U = Math.max(0, N - K - L); // weak (hard + unseen)

  const totalTickets = comb(N, 3);
  if (totalTickets <= 0) {
    return {
      idealPct: 0,
      workingPct: 0,
      fatalityPct: 100,
      grade5Pct: 0,
      grade4Pct: 0,
      grade3Pct: 0,
    };
  }

  // Ideal ticket: all 3 questions in ticket are from Known
  const all3Known = comb(K, 3) / totalTickets;
  const twoKnownOneLearn = (comb(K, 2) * comb(L, 1)) / totalTickets;

  // Fatality ticket: all 3 questions are Weak/Unseen, OR 2 Weak + 1 Learning with 0 Known
  const all3Weak = comb(U, 3) / totalTickets;
  const twoWeakOneLearn = (comb(U, 2) * comb(L, 1)) / totalTickets;
  const fatalityProb = Math.min(1, all3Weak + 0.65 * twoWeakOneLearn);

  // Working ticket (pass with at least 3): 1 - fatalityProb
  const workingProb = Math.max(0, 1 - fatalityProb);

  // Grade 5: 3 Known, or 2 Known + 1 Learning
  const grade5Prob = Math.min(1, all3Known + 0.7 * twoKnownOneLearn);

  // Grade 4: 2 Known + 1 Weak, or 1 Known + 2 Learning, or remaining 2 Known + 1 Learning
  const twoKnownOneWeak = (comb(K, 2) * comb(U, 1)) / totalTickets;
  const oneKnownTwoLearn = (comb(K, 1) * comb(L, 2)) / totalTickets;
  const all3Learn = comb(L, 3) / totalTickets;
  const grade4Prob = Math.min(
    Math.max(0, workingProb - grade5Prob),
    0.3 * twoKnownOneLearn + twoKnownOneWeak + oneKnownTwoLearn + 0.7 * all3Learn
  );

  // Grade 3: remaining passing tickets
  const grade3Prob = Math.max(0, workingProb - grade5Prob - grade4Prob);

  return {
    idealPct: Math.round(all3Known * 1000) / 10,
    workingPct: Math.round(workingProb * 1000) / 10,
    fatalityPct: Math.round(fatalityProb * 1000) / 10,
    grade5Pct: Math.round(grade5Prob * 1000) / 10,
    grade4Pct: Math.round(grade4Prob * 1000) / 10,
    grade3Pct: Math.round(grade3Prob * 1000) / 10,
  };
}

export function ExamSurvivalModal({
  isOpen,
  onClose,
  subjectLabel,
  cards,
  srMap,
  taskMastery,
  onStartRescueSprint,
}: ExamSurvivalModalProps) {
  const [extraCardsToLearn, setExtraCardsToLearn] = useState<number>(8);

  const stats = useMemo(() => {
    let known = 0;
    let learning = 0;
    let hard = 0;
    let unseen = 0;

    const now = Date.now();
    const scoredCards: {
      card: TheoryCard;
      status: string;
      lapses: number;
      overdueDays: number;
      priorityScore: number;
      reason: string;
    }[] = [];

    for (const card of cards) {
      const sr = getCardSRState(srMap, card.id);
      const status = sr.status;
      const lapses = sr.lapses || 0;
      const overdueMs = sr.nextReviewAt ? Math.max(0, now - sr.nextReviewAt) : 0;
      const overdueDays = Math.floor(overdueMs / 86_400_000);

      if (status === 'known') known++;
      else if (status === 'learning') learning++;
      else if (status === 'hard') hard++;
      else unseen++;

      // Calculate rescue priority score
      let priorityScore = 0;
      let reason = 'Новый неизученный билет';

      if (status === 'hard') {
        priorityScore += 100 + lapses * 25;
        reason = lapses > 0 ? `Сложный билет (срывов памяти: ${lapses})` : 'Отмечен как «Сложно»';
      } else if (lapses > 0 && status !== 'known') {
        priorityScore += 75 + lapses * 20;
        reason = `Частые ошибки при повторении (${lapses})`;
      } else if (overdueDays > 0 && status !== 'known') {
        priorityScore += 65 + Math.min(30, overdueDays * 5);
        reason = `Просрочено повторение SM-2 (${overdueDays} дн.)`;
      } else if (status === 'unseen') {
        priorityScore += 50 + (card.coverage === 'full' ? 20 : 0);
        reason = 'Ещё ни разу не открывался (риск на билете)';
      } else if (status === 'learning') {
        priorityScore += 30;
        reason = 'В процессе закрепления (нужен повтор до «Знаю»)';
      }

      scoredCards.push({
        card,
        status,
        lapses,
        overdueDays,
        priorityScore,
        reason,
      });
    }

    scoredCards.sort((a, b) => b.priorityScore - a.priorityScore);
    const top7Rescue = scoredCards.slice(0, 7);

    const solvedTasksCount = Object.values(taskMastery).filter(
      (st) => st === 'solved'
    ).length;

    return {
      total: cards.length,
      known,
      learning,
      hard,
      unseen,
      weakTotal: hard + unseen,
      top7Rescue,
      solvedTasksCount,
    };
  }, [cards, srMap, taskMastery]);

  const maxSimulatableExtra = Math.max(0, stats.total - stats.known);
  const clampedExtra = Math.min(extraCardsToLearn, maxSimulatableExtra);

  const currentOdds = useMemo(
    () => computeTicketProbabilities(stats.total, stats.known, stats.learning),
    [stats.total, stats.known, stats.learning]
  );

  const simulatedOdds = useMemo(() => {
    const newKnown = Math.min(stats.total, stats.known + clampedExtra);
    const remainingForLearning = Math.min(stats.learning, stats.total - newKnown);
    return computeTicketProbabilities(stats.total, newKnown, remainingForLearning);
  }, [stats.total, stats.known, stats.learning, clampedExtra]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0B101B] border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Калькулятор выживания на экзамене
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {subjectLabel} · Гипергеометрическая модель билета
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Точная комбинаторная вероятность вытянуть сдаваемый билет из 3 вопросов по твоей базе SM-2
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 3 Main Survival Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/35 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                <span>Вероятность рабочего билета</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {currentOdds.workingPct}%
              </div>
              <p className="text-[11px] text-slate-300">
                Шанс сдать экзамен на положительную оценку (минимум половина билета изучена)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/35 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-cyan-300 font-bold">
                <span>Вероятность идеального билета</span>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {currentOdds.idealPct}%
              </div>
              <p className="text-[11px] text-slate-300">
                Все вопросы в вытянутом билете находятся в статусе «Знаю твёрдо» ({stats.known} из {stats.total})
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/35 border border-rose-500/40 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-rose-300 font-bold">
                <span>Риск «Фаталити» (провал)</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-300">
                {currentOdds.fatalityPct}%
              </div>
              <p className="text-[11px] text-slate-300">
                Вероятность вытянуть билет, где все вопросы из категории «Не видел / Сложно» ({stats.weakTotal} шт.)
              </p>
            </div>
          </div>

          {/* Interactive What-If Simulator Slider */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Симулятор: «А что если я доучу ещё +{clampedExtra} карточек сегодня?»
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
                Станет известно: {Math.min(stats.total, stats.known + clampedExtra)} / {stats.total}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={Math.max(1, maxSimulatableExtra)}
              step={1}
              value={clampedExtra}
              onChange={(e) => setExtraCardsToLearn(Number(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />

            {/* Grade 5 / 4 / 3 Probability Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/85 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Шанс на «Отлично (5)»</div>
                  <div className="text-lg font-extrabold text-emerald-300 mt-0.5">
                    {simulatedOdds.grade5Pct}%
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">
                  +{(simulatedOdds.grade5Pct - currentOdds.grade5Pct).toFixed(1)}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/85 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Шанс на «Хорошо (4)»</div>
                  <div className="text-lg font-extrabold text-cyan-300 mt-0.5">
                    {simulatedOdds.grade4Pct}%
                  </div>
                </div>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded">
                  Рабочий: {simulatedOdds.workingPct}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/85 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Шанс на «Удовл. (3)»</div>
                  <div className="text-lg font-extrabold text-amber-300 mt-0.5">
                    {simulatedOdds.grade3Pct}%
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded">
                  Риск: {simulatedOdds.fatalityPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Top-7 Priority Rescue Tickets */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Топ-7 приоритетных билетов для спасения сессии
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Отобраны автоматически по максимальному числу срывов памяти (lapses), просрочке SM-2 и слепым зонам
                </p>
              </div>

              <button
                onClick={() => {
                  const ids = stats.top7Rescue.map((item) => item.card.id);
                  if (ids.length > 0) {
                    onStartRescueSprint('Спасательный спринт (Топ-7 билетов)', ids);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-rose-500/20 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Запустить спасательный спринт по этим билетам</span>
              </button>
            </div>

            <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-slate-950/70 overflow-hidden">
              {stats.top7Rescue.map((item, idx) => (
                <div
                  key={item.card.id}
                  className="p-3 sm:px-4 flex flex-wrap items-center justify-between gap-2 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white">
                        {item.card.question}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-cyan-300">{item.card.chapter}</span>
                        <span>•</span>
                        <span className="text-amber-300">{item.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.status === 'hard'
                          ? 'bg-rose-500/20 text-rose-300'
                          : item.status === 'unseen'
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.status === 'hard'
                        ? 'Сложно'
                        : item.status === 'unseen'
                        ? 'Не изучен'
                        : 'На повторе'}
                    </span>
                    <button
                      onClick={() => {
                        onStartRescueSprint(`Билет: ${item.card.question}`, [item.card.id]);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 font-medium"
                    >
                      Учить →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Изучение этих 7 билетов снизит риск «Фаталити» быстрее всего!
              </span>
              <span>Практических задач решено: {stats.solvedTasksCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
