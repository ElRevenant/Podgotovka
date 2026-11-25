import {RewardItem, RewardSystemState} from '../types/study';
import {getLocalDateKey, STORAGE_KEYS} from './cardHelpers';

export const DEFAULT_REWARDS: RewardItem[] = [
  {
    id: 'rew_coffee',
    title: 'Чай / какао-брейк у окна · 10 мин',
    subtitle: 'Разминка пройдена (~30 карточек или 11 задач)',
    costXp: 90,
    breakMinutes: 10,
    icon: 'coffee',
    permitQuote:
      'Разминка зачтена! Можно заварить горячий чай или какао у окна, передохнуть 10 минут и возвращаться в бой.',
  },
  {
    id: 'rew_dota_turbo',
    title: '1 катка в Dota 2 (Турбо)',
    subtitle: 'Быстрый допуск после серьёзного разогрева (~65 карточек или 25 задач)',
    costXp: 200,
    breakMinutes: 25,
    icon: 'dota',
    permitQuote:
      'ДОПУСК ВЫДАН! Одна быстрая катка в Турбо официально разрешена. Только без тильта и назад к билетам!',
  },
  {
    id: 'rew_dota_full',
    title: '1 полноценная катка в Dota 2',
    subtitle: 'Серьёзный этап закрыт (~115 карточек или 44 задачи)',
    costXp: 350,
    breakMinutes: 50,
    icon: 'dota',
    permitQuote:
      'ОФИЦИАЛЬНОЕ РАЗРЕШЕНИЕ НА ДОТУ! Можешь забирать мид или керри — эта катка честно заработана головой. ГГ ВП!',
  },
  {
    id: 'rew_series',
    title: 'Серия сериала + мандарины / вкусняшка',
    subtitle: 'Уютная зимняя перезагрузка мозга (~140 карточек)',
    costXp: 420,
    breakMinutes: 45,
    icon: 'movie',
    permitQuote:
      'Дофаминовая пауза одобрена! Включай серию, бери мандарины или вкусняшку и отдыхай без малейшего чувства вины.',
  },
  {
    id: 'rew_party',
    title: '2 катки в пати / CS / Любимая игра',
    subtitle: 'Мощный рывок (~200 карточек или 75 задач)',
    costXp: 600,
    breakMinutes: 90,
    icon: 'party',
    permitQuote:
      'Мощнейший этап закрыт! Зови друзей в пати — полтора часа свободной игры твои по праву.',
  },
  {
    id: 'rew_free_evening',
    title: 'Вечер полной свободы (норма 100%)',
    subtitle: 'Хардкор-режим босса: огромный учебный объём закрыт',
    costXp: 900,
    breakMinutes: 180,
    icon: 'food',
    permitQuote:
      'ЛЕГЕНДА ЗИМНЕЙ СЕССИИ! Огромный объём подготовки выполнен на 100%. Иди в Доту, гулять или отдыхать — совесть абсолютно чиста.',
  },
];

export function createDefaultRewardState(): RewardSystemState {
  return {
    balanceXp: 0,
    earnedTodayXp: 0,
    earnedDateKey: getLocalDateKey(),
    totalEarnedXp: 0,
    redeemedTodayIds: [],
    totalRedeemedCount: 0,
    rewards: DEFAULT_REWARDS,
    activeBreak: null,
    claimedAchievementIds: [],
    streakFreezes: 0,
  };
}

export function loadRewardState(): RewardSystemState {
  const today = getLocalDateKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REWARDS);
    if (!raw) return createDefaultRewardState();
    const parsed = JSON.parse(raw) as Partial<RewardSystemState>;
    const isSameDay = parsed.earnedDateKey === today;
    const defaultById = new Map(DEFAULT_REWARDS.map((d) => [d.id, d]));
    const rewards =
      Array.isArray(parsed.rewards) && parsed.rewards.length > 0
        ? parsed.rewards.map((r) => {
            const def = defaultById.get(r.id);
            if (def && !r.isCustom) {
              return {
                ...r,
                title: def.title,
                subtitle: def.subtitle,
                costXp: def.costXp,
              };
            }
            return r;
          })
        : DEFAULT_REWARDS;

    const activeBreak =
      parsed.activeBreak &&
      typeof parsed.activeBreak.endsAt === 'number' &&
      parsed.activeBreak.endsAt > Date.now()
        ? parsed.activeBreak
        : null;

    const claimedAchievementIds = Array.isArray(parsed.claimedAchievementIds)
      ? parsed.claimedAchievementIds.filter(
          (id): id is string => typeof id === 'string',
        )
      : [];

    const streakFreezes = Math.max(
      0,
      Math.min(3, Math.floor(Number(parsed.streakFreezes) || 0)),
    );

    return {
      balanceXp: Math.max(0, Number(parsed.balanceXp) || 0),
      earnedTodayXp: isSameDay
        ? Math.max(0, Number(parsed.earnedTodayXp) || 0)
        : 0,
      earnedDateKey: today,
      totalEarnedXp: Math.max(0, Number(parsed.totalEarnedXp) || 0),
      redeemedTodayIds:
        isSameDay && Array.isArray(parsed.redeemedTodayIds)
          ? parsed.redeemedTodayIds
          : [],
      totalRedeemedCount: Math.max(0, Number(parsed.totalRedeemedCount) || 0),
      rewards,
      activeBreak,
      claimedAchievementIds,
      streakFreezes,
    };
  } catch {
    return createDefaultRewardState();
  }
}

export function applyXpAward(
  prev: RewardSystemState,
  deltaXp: number,
): {next: RewardSystemState; newlyUnlocked: RewardItem | null} {
  const today = getLocalDateKey();
  const isSameDay = prev.earnedDateKey === today;
  const oldBalance = prev.balanceXp;
  const newBalance = oldBalance + Math.max(0, deltaXp);

  // Detect if we just crossed the threshold for a reward!
  const sortedRewards = [...prev.rewards].sort((a, b) => a.costXp - b.costXp);
  const newlyUnlocked =
    sortedRewards.find(
      (r) => oldBalance < r.costXp && newBalance >= r.costXp,
    ) ?? null;

  const next: RewardSystemState = {
    ...prev,
    balanceXp: newBalance,
    earnedTodayXp: (isSameDay ? prev.earnedTodayXp : 0) + Math.max(0, deltaXp),
    earnedDateKey: today,
    totalEarnedXp: prev.totalEarnedXp + Math.max(0, deltaXp),
    redeemedTodayIds: isSameDay ? prev.redeemedTodayIds : [],
  };

  return {next, newlyUnlocked};
}

export function getNextLockedReward(state: RewardSystemState): RewardItem | null {
  const sorted = [...state.rewards].sort((a, b) => a.costXp - b.costXp);
  return sorted.find((r) => state.balanceXp < r.costXp) ?? null;
}

export function getHighestUnlockedReward(
  state: RewardSystemState,
): RewardItem | null {
  const unlocked = state.rewards
    .filter((r) => state.balanceXp >= r.costXp)
    .sort((a, b) => b.costXp - a.costXp);
  return unlocked[0] ?? null;
}
