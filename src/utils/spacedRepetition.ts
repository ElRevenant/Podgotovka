import {CardSRState, MasteryStatus, RecallGrade} from '../types/study';

export const DEFAULT_SR_STATE: CardSRState = {
  status: 'unseen',
  box: 0,
  easeFactor: 2.5,
  intervalMinutes: 0,
  repetitions: 0,
  lapses: 0,
};

export function getCardSRState(
  srMap: Record<number, CardSRState>,
  cardId: number,
): CardSRState {
  return srMap[cardId] ?? DEFAULT_SR_STATE;
}

/**
 * Simplified SM-2 + Leitner spaced repetition update:
 * - 'again' (1): Не помню -> repeat now (1 min), box = 0, status = 'hard', lapses + 1
 * - 'hard'  (2): Сложно -> repeat in 10 min (end of session), box = 1, status = 'hard'
 * - 'good'  (3): Хорошо -> 1 day -> 3 days -> interval * EF, box = 2..3, status = 'learning' or 'known'
 * - 'easy'  (4): Легко -> 4 days -> interval * EF * 1.3, box = 4, status = 'known'
 */
export function computeNextSRState(
  prev: CardSRState | undefined,
  grade: RecallGrade,
  now: number = Date.now(),
): CardSRState {
  const cur = prev ?? DEFAULT_SR_STATE;
  let easeFactor = cur.easeFactor || 2.5;
  let repetitions = cur.repetitions || 0;
  let lapses = cur.lapses || 0;
  let intervalMinutes = 0;
  let box = cur.box || 0;
  let status: MasteryStatus = 'learning';

  if (grade === 'again') {
    repetitions = 0;
    lapses += 1;
    box = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    intervalMinutes = 1; // повторить сейчас (через 1 мин)
    status = 'hard';
  } else if (grade === 'hard') {
    repetitions = 0;
    box = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    intervalMinutes = 10; // через 10 мин / в конце сессии
    status = 'hard';
  } else if (grade === 'good') {
    repetitions += 1;
    if (repetitions === 1) {
      intervalMinutes = 24 * 60; // 1 день
      box = 2;
      status = 'learning';
    } else if (repetitions === 2) {
      intervalMinutes = 3 * 24 * 60; // 3 дня
      box = 3;
      status = 'known';
    } else {
      intervalMinutes = Math.round(
        Math.max(3 * 24 * 60, cur.intervalMinutes * easeFactor),
      );
      box = 3;
      status = 'known';
    }
  } else {
    // 'easy'
    repetitions += 1;
    easeFactor = Math.min(2.8, easeFactor + 0.15);
    if (repetitions === 1) {
      intervalMinutes = 4 * 24 * 60; // 4 дня
    } else {
      intervalMinutes = Math.round(
        Math.max(4 * 24 * 60, cur.intervalMinutes * easeFactor * 1.3),
      );
    }
    box = 4;
    status = 'known';
  }

  return {
    status,
    box,
    easeFactor: Number(easeFactor.toFixed(2)),
    intervalMinutes,
    repetitions,
    lapses,
    lastReviewedAt: now,
    nextReviewAt: now + intervalMinutes * 60 * 1000,
    lastGrade: grade,
  };
}

export function formatIntervalLabel(state: CardSRState, now = Date.now()): string {
  if (state.status === 'unseen' || !state.nextReviewAt) {
    return 'Новая карточка';
  }
  const diffMin = Math.round((state.nextReviewAt - now) / 60000);
  if (diffMin <= 0) {
    return 'Пора повторить сейчас';
  }
  if (diffMin < 60) {
    return `Повтор через ${diffMin} мин`;
  }
  const hours = Math.round(diffMin / 60);
  if (hours < 24) {
    return `Повтор через ${hours} ч`;
  }
  const days = Math.round(hours / 24);
  return `Повтор через ${days} дн.`;
}

/**
 * Priority score for SM-2 smart queue:
 * Higher score = should be shown earlier.
 * 1) Overdue / immediate 'again' cards and cards with high lapses come first.
 * 2) Hard / Box 1 cards come next.
 * 3) Unseen cards come next.
 * 4) Known cards not yet due come last.
 */
export function getCardUrgencyScore(state: CardSRState, now = Date.now()): number {
  if (state.status === 'hard') {
    const dueBonus = state.nextReviewAt && state.nextReviewAt <= now ? 500 : 250;
    return 1000 + dueBonus + state.lapses * 80 - state.box * 30;
  }
  if (state.status === 'learning') {
    const dueBonus = state.nextReviewAt && state.nextReviewAt <= now ? 300 : 0;
    return 600 + dueBonus + state.lapses * 50;
  }
  if (state.status === 'unseen') {
    return 400;
  }
  // 'known'
  if (state.nextReviewAt && state.nextReviewAt <= now) {
    return 550 + state.lapses * 30;
  }
  return 100 - state.box * 15;
}

export type CardVisualTier =
  | 'unseen'
  | 'again'
  | 'hard'
  | 'learning'
  | 'known'
  | 'rainbow';

/**
 * Returns 0..100 understanding score for a card so UI can clearly distinguish:
 * - 0%: unseen
 * - ~15%: again («Не помню» — crimson/rose)
 * - ~42%: hard («Сложно» — amber/orange)
 * - ~72%: learning («Хорошо / в процессе» — cyan/sky)
 * - ~88%: known («Выучено» — emerald)
 * - 95..100%: rainbow mastery (box >= 4 / easy / 3+ solid reps)
 */
export function getCardMasteryPercent(state: CardSRState): number {
  if (state.status === 'unseen' && !state.lastGrade) {
    return 0;
  }
  if (state.lastGrade === 'again' || (state.status === 'hard' && state.box === 0)) {
    return Math.max(5, 15 - Math.min(10, state.lapses * 2));
  }
  if (state.lastGrade === 'hard' || state.status === 'hard') {
    return 42;
  }
  if (state.status === 'learning') {
    return state.repetitions >= 2 ? 78 : 72;
  }
  // status === 'known'
  if (state.box >= 4 || state.lastGrade === 'easy') {
    return state.repetitions >= 2 ? 100 : 96;
  }
  if (state.repetitions >= 3 || state.easeFactor >= 2.65) {
    return 95;
  }
  return 88;
}

export function getCardVisualTier(state: CardSRState): CardVisualTier {
  const pct = getCardMasteryPercent(state);
  if (pct >= 95) return 'rainbow';
  if (state.status === 'unseen' && !state.lastGrade) return 'unseen';
  if (state.lastGrade === 'again' || (state.status === 'hard' && state.box === 0)) {
    return 'again';
  }
  if (state.lastGrade === 'hard' || state.status === 'hard') {
    return 'hard';
  }
  if (state.status === 'learning') {
    return 'learning';
  }
  return 'known';
}

