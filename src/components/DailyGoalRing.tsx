import {Check} from 'lucide-react';

interface DailyGoalRingProps {
  todayTotal: number;
  dailyGoal: number;
  onClick?: () => void;
}

export function DailyGoalRing({
  todayTotal,
  dailyGoal,
  onClick,
}: DailyGoalRingProps) {
  const safeGoal = Math.max(1, dailyGoal);
  const rawPct = Math.round((todayTotal / safeGoal) * 100);
  const clampedPct = Math.min(100, Math.max(0, rawPct));
  const isComplete = todayTotal >= safeGoal;
  const remaining = Math.max(0, safeGoal - todayTotal);

  const size = 48;
  const strokeWidth = 4.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedPct / 100) * circumference;

  const titleText = isComplete
    ? `Дневная цель выполнена: ${todayTotal} из ${safeGoal} повторений за сегодня. Нажмите, чтобы открыть статистику и настройки плана.`
    : `Цель дня: ${todayTotal} из ${safeGoal} (${clampedPct}%). Осталось ${remaining} повт. Нажмите, чтобы открыть статистику.`;

  return (
    <button
      type="button"
      onClick={onClick}
      title={titleText}
      aria-label={titleText}
      className="group inline-flex items-center gap-2.5 pr-1 text-left shrink-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 cursor-pointer"
    >
      <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="dailyGoalRingGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor={isComplete ? '#10b981' : '#06b6d4'}
              />
              <stop
                offset="100%"
                stopColor={isComplete ? '#fbbf24' : '#34d399'}
              />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-slate-200/85 dark:stroke-white/[0.08]"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#dailyGoalRingGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition:
                'stroke-dashoffset 450ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>

        <span className="absolute inset-0 flex items-center justify-center">
          {isComplete ? (
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[2.75]" />
          ) : (
            <span className="font-mono text-[11px] font-bold tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {clampedPct}%
            </span>
          )}
        </span>
      </div>

      <div className="hidden sm:flex flex-col leading-tight min-w-0">
        <span className="text-[11px] font-medium text-slate-500 dark:text-[#9CA3AF] group-hover:text-slate-800 dark:group-hover:text-[#E5E7EB] transition-colors whitespace-nowrap">
          Цель дня
        </span>
        <span className="font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-[#F8FAFC] whitespace-nowrap">
          {todayTotal}/{safeGoal}
        </span>
        <span
          className={`text-[10px] font-medium whitespace-nowrap ${
            isComplete
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-[#94A3B8]'
          }`}
        >
          {isComplete ? 'Выполнена' : `ещё ${remaining}`}
        </span>
      </div>
    </button>
  );
}
