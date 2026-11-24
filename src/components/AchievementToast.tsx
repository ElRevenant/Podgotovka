import {
  Award,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  Moon,
  Sparkles,
  Star,
  Target,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import {AchievementDefinition, AchievementIcon, AchievementRarity} from '../types/study';

export function AchievementGlyph({
  icon,
  className = 'h-5 w-5',
}: {
  icon: AchievementIcon;
  className?: string;
}) {
  switch (icon) {
    case 'flame':
      return <Flame className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'target':
      return <Target className={className} />;
    case 'brain':
      return <Brain className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'check':
      return <CheckCircle2 className={className} />;
    case 'moon':
      return <Moon className={className} />;
    case 'layers':
      return <Layers className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

export function getRarityLabel(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'legendary':
      return 'Легендарное';
    case 'epic':
      return 'Эпическое';
    case 'rare':
      return 'Редкое';
    default:
      return 'Обычное';
  }
}

export function getRarityAccentText(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'legendary':
      return 'text-amber-600 dark:text-amber-300';
    case 'epic':
      return 'text-cyan-700 dark:text-cyan-300';
    case 'rare':
      return 'text-emerald-700 dark:text-emerald-400';
    default:
      return 'text-slate-600 dark:text-slate-300';
  }
}

export function getRarityIconBox(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'legendary':
      return 'bg-amber-500/15 border-amber-400/40 text-amber-600 dark:text-amber-300';
    case 'epic':
      return 'bg-cyan-500/15 border-cyan-400/40 text-cyan-700 dark:text-cyan-300';
    case 'rare':
      return 'bg-emerald-500/15 border-emerald-400/35 text-emerald-700 dark:text-emerald-300';
    default:
      return 'bg-slate-100 border-slate-300/80 text-slate-700 dark:bg-white/[0.06] dark:border-white/[0.14] dark:text-slate-200';
  }
}

interface AchievementToastProps {
  achievement: AchievementDefinition;
  queuedCount: number;
  onOpenAll: () => void;
  onDismiss: () => void;
}

export function AchievementToast({
  achievement,
  queuedCount,
  onOpenAll,
  onDismiss,
}: AchievementToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print fixed top-20 right-4 sm:right-6 z-50 w-[min(370px,calc(100vw-2rem))] rounded-[18px] border border-cyan-400/35 dark:border-cyan-400/30 bg-white/95 dark:bg-[#0E1522]/96 backdrop-blur-xl shadow-[0_18px_44px_-16px_rgba(6,182,212,0.38)] p-4 flex items-start gap-3 transition-all"
    >
      <div
        className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${getRarityIconBox(achievement.rarity)}`}
      >
        <AchievementGlyph icon={achievement.icon} className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <span className={getRarityAccentText(achievement.rarity)}>
              Достижение открыто
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-white/20">
              ·
            </span>
            <span className="font-mono tabular-nums text-amber-600 dark:text-amber-300">
              +{achievement.rewardXp} XP
            </span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Скрыть уведомление о достижении"
            className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <h4 className="text-sm font-bold text-slate-950 dark:text-white leading-snug">
          {achievement.title}
        </h4>
        <p className="text-xs text-slate-600 dark:text-[#9CA3AF] leading-relaxed">
          {achievement.description}
        </p>

        <div className="pt-1 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenAll}
            className="prism-tool-btn px-3 py-1 text-[11px] font-semibold rounded-full text-slate-800 dark:text-[#F8FAFC] cursor-pointer"
          >
            Все достижения
          </button>
          {queuedCount > 0 && (
            <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-[#9CA3AF]">
              Ещё +{queuedCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
