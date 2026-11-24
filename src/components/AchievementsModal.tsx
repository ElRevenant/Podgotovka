import {useEffect, useMemo, useState} from 'react';
import {CheckCircle2, Flame, Lock, Sparkles, Trophy, X, Zap} from 'lucide-react';
import {AchievementCategory, AchievementSystemState} from '../types/study';
import {
  AchievementEvalSnapshot,
  computeAchievementMetrics,
  getAchievementProgressList,
} from '../utils/achievements';
import {
  AchievementGlyph,
  getRarityAccentText,
  getRarityIconBox,
  getRarityLabel,
} from './AchievementToast';

interface AchievementsModalProps {
  achievementState: AchievementSystemState;
  snapshot: AchievementEvalSnapshot;
  onClose: () => void;
}

type CategoryFilter = 'all' | AchievementCategory;

const CATEGORY_TABS: {id: CategoryFilter; label: string}[] = [
  {id: 'all', label: 'Все'},
  {id: 'streak', label: 'Серии и ритм'},
  {id: 'mastery', label: 'Мастерство'},
  {id: 'practice', label: 'Практика'},
  {id: 'special', label: 'Особые'},
];

function formatUnlockDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function AchievementsModal({
  achievementState,
  snapshot,
  onClose,
}: AchievementsModalProps) {
  const [filter, setFilter] = useState<CategoryFilter>('all');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const items = useMemo(
    () => getAchievementProgressList(achievementState, snapshot),
    [achievementState, snapshot],
  );

  const metrics = useMemo(() => computeAchievementMetrics(snapshot), [snapshot]);

  const unlockedCount = useMemo(
    () => items.filter((i) => i.isUnlocked).length,
    [items],
  );
  const totalCount = items.length;
  const completionPct = Math.round(
    (unlockedCount / Math.max(1, totalCount)) * 100,
  );
  const earnedBonusXp = useMemo(
    () =>
      items
        .filter((i) => i.isUnlocked)
        .reduce((acc, i) => acc + i.definition.rewardXp, 0),
    [items],
  );

  const filteredItems = useMemo(() => {
    const list =
      filter === 'all'
        ? items
        : items.filter((i) => i.definition.category === filter);
    return [...list].sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
      if (a.isUnlocked && b.isUnlocked) {
        return (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0);
      }
      return b.percent - a.percent;
    });
  }, [items, filter]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-[20px] border border-slate-200/80 dark:border-white/[0.1] bg-white dark:bg-[#0E1522] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-400/35 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="achievements-modal-title"
                className="text-lg font-bold tracking-tight text-slate-950 dark:text-[#F8FAFC]"
              >
                Достижения
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-[#9CA3AF]">
                Открывай ачивки за серии «Легко», регулярность без пропусков и мастерство — за каждую начисляется бонусный XP.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть достижения"
            className="prism-tool-btn p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-[#9CA3AF] dark:hover:text-white shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary & Live Streak Strip */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200/70 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#070B12]/45 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
              <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Открыто{' '}
                <strong className="font-mono text-cyan-700 dark:text-cyan-300">
                  {unlockedCount}/{totalCount}
                </strong>{' '}
                <span className="text-slate-500 dark:text-[#9CA3AF]">
                  ({completionPct}%)
                </span>
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-white/15">
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  Бонус: <strong className="font-mono">+{earnedBonusXp} XP</strong>
                </span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 dark:text-[#9CA3AF] tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
                <span>
                  Серия «Легко»:{' '}
                  <strong className="font-mono text-slate-900 dark:text-[#F8FAFC]">
                    {metrics.easyStreak}
                  </strong>{' '}
                  (рекорд {metrics.bestEasyStreak})
                </span>
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-white/15">
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                <span>
                  Дни подряд:{' '}
                  <strong className="font-mono text-slate-900 dark:text-[#F8FAFC]">
                    {metrics.currentDayStreak} дн.
                  </strong>
                </span>
              </span>
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
            <div
              className="h-full prism-progress-fill transition-all duration-300"
              style={{width: `${completionPct}%`}}
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {CATEGORY_TABS.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    active
                      ? 'prism-tab-active font-semibold'
                      : 'prism-tool-btn text-slate-600 dark:text-[#9CA3AF]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const {definition, current, target, percent, isUnlocked, unlockedAt} =
                item;
              return (
                <div
                  key={definition.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                    isUnlocked
                      ? 'border-emerald-400/35 dark:border-emerald-400/25 bg-emerald-50/40 dark:bg-[#121926]'
                      : 'border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#0B111C]/90'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${
                        isUnlocked
                          ? getRarityIconBox(definition.rarity)
                          : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-slate-500'
                      }`}
                    >
                      {isUnlocked ? (
                        <AchievementGlyph icon={definition.icon} className="h-5 w-5" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span
                          className={`font-semibold ${
                            isUnlocked
                              ? getRarityAccentText(definition.rarity)
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {getRarityLabel(definition.rarity)}
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-300">
                          +{definition.rewardXp} XP
                        </span>
                      </div>

                      <h3
                        className={`mt-0.5 text-sm font-bold leading-snug ${
                          isUnlocked
                            ? 'text-slate-950 dark:text-[#F8FAFC]'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {definition.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-600 dark:text-[#9CA3AF] leading-relaxed">
                        {definition.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress / Unlock Footer */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] tabular-nums">
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Открыто</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-[#9CA3AF]">
                          Прогресс
                        </span>
                      )}

                      <span className="font-mono text-slate-600 dark:text-[#CBD5E1]">
                        {isUnlocked && unlockedAt
                          ? formatUnlockDate(unlockedAt)
                          : `${current}/${target} ${definition.unitLabel}`}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.07] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isUnlocked
                            ? 'prism-progress-fill'
                            : 'bg-cyan-500/70 dark:bg-cyan-400/65'
                        }`}
                        style={{width: `${percent}%`}}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
