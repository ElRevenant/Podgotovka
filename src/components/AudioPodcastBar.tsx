import {useEffect, useRef, useState} from 'react';
import {Headphones, Pause, Play, SkipBack, SkipForward, X} from 'lucide-react';
import {TheoryCard} from '../types/study';
import {
  isSpeechSynthesisSupported,
  speakRussianText,
  stopSpeaking,
} from '../utils/speechAndGrading';

interface AudioPodcastBarProps {
  cards: TheoryCard[];
  currentIndex: number;
  onSelectCardId: (id: number) => void;
  onClose: () => void;
}

type PodcastStage = 'idle' | 'question' | 'pause' | 'answer';

export function AudioPodcastBar({
  cards,
  currentIndex,
  onSelectCardId,
  onClose,
}: AudioPodcastBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [stage, setStage] = useState<PodcastStage>('idle');
  const [pauseSec, setPauseSec] = useState<5 | 7 | 10>(7);
  const [speechRate, setSpeechRate] = useState<0.9 | 1.0 | 1.2>(1.0);
  const [countdown, setCountdown] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const activeRunIdRef = useRef(0);

  const supported = isSpeechSynthesisSupported();
  const currentCard = cards[currentIndex];

  const clearTimers = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopPlayback = () => {
    activeRunIdRef.current += 1;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setStage('idle');
    setCountdown(0);
    clearTimers();
    stopSpeaking();
  };

  useEffect(() => {
    return () => {
      activeRunIdRef.current += 1;
      isPlayingRef.current = false;
      clearTimers();
      stopSpeaking();
    };
  }, []);

  const playCardAtIndex = (idx: number) => {
    const card = cards[idx];
    if (!card) {
      stopPlayback();
      return;
    }

    const runId = ++activeRunIdRef.current;
    clearTimers();
    stopSpeaking();
    onSelectCardId(card.id);
    setStage('question');
    setCountdown(0);

    const questionText = `Вопрос ${card.badgeLabel ? card.badgeLabel : `номер ${card.id}`}. ${card.question}`;
    speakRussianText(
      questionText,
      undefined,
      () => {
        if (!isPlayingRef.current || activeRunIdRef.current !== runId) return;

        // Pause phase so the student can mentally recall the answer
        setStage('pause');
        let remaining = pauseSec;
        setCountdown(remaining);

        timerRef.current = window.setInterval(() => {
          if (!isPlayingRef.current || activeRunIdRef.current !== runId) {
            clearTimers();
            return;
          }
          remaining -= 1;
          setCountdown(remaining);
          if (remaining <= 0) {
            clearTimers();
            setStage('answer');
            const conciseAnswer = `Главный тезис: ${card.keyThesis}. ${card.answerPoints[0] ?? ''}`;
            speakRussianText(
              conciseAnswer,
              undefined,
              () => {
                if (!isPlayingRef.current || activeRunIdRef.current !== runId) {
                  return;
                }
                // Brief 1.4s breath before moving to the next card
                timerRef.current = window.setTimeout(() => {
                  if (!isPlayingRef.current || activeRunIdRef.current !== runId) {
                    return;
                  }
                  const nextIdx = idx + 1 < cards.length ? idx + 1 : 0;
                  playCardAtIndex(nextIdx);
                }, 1400);
              },
              speechRate,
            );
          }
        }, 1000);
      },
      speechRate,
    );
  };

  const handleTogglePlay = () => {
    if (!supported || cards.length === 0) return;
    if (isPlaying) {
      stopPlayback();
      return;
    }
    isPlayingRef.current = true;
    setIsPlaying(true);
    playCardAtIndex(currentIndex);
  };

  const handleSkip = (dir: -1 | 1) => {
    if (cards.length === 0) return;
    const nextIdx =
      dir === 1
        ? currentIndex + 1 < cards.length
          ? currentIndex + 1
          : 0
        : currentIndex > 0
          ? currentIndex - 1
          : cards.length - 1;
    if (isPlaying) {
      playCardAtIndex(nextIdx);
    } else {
      onSelectCardId(cards[nextIdx].id);
    }
  };

  const stageLabel =
    stage === 'question'
      ? 'Читаю вопрос...'
      : stage === 'pause'
        ? `Пауза на вспоминание: ${countdown} с`
        : stage === 'answer'
          ? 'Читаю главный тезис ответа...'
          : 'Готово к аудио-повторению (вопрос → пауза → тезис)';

  return (
    <div className="rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/70 dark:bg-sky-950/25 p-3.5 sm:p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Headphones className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-[#F3F4F6]">
              Режим «Подкаст» — аудио-повторение без рук ({currentIndex + 1}/{cards.length})
            </p>
            <p className="text-xs text-sky-800 dark:text-sky-300 truncate">
              {supported
                ? `${stageLabel}${currentCard ? ` · ${currentCard.question}` : ''}`
                : 'Web Speech API недоступен в этом браузере'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            stopPlayback();
            onClose();
          }}
          aria-label="Закрыть режим подкаста"
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSkip(-1)}
            disabled={cards.length === 0}
            className="p-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131B2B] text-slate-700 dark:text-[#E5E7EB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer disabled:opacity-50"
            title="Предыдущая карточка"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={!supported || cards.length === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
              isPlaying
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'prism-cta'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Пауза</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Запустить подкаст</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSkip(1)}
            disabled={cards.length === 0}
            className="p-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131B2B] text-slate-700 dark:text-[#E5E7EB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer disabled:opacity-50"
            title="Следующая карточка"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-[#94A3B8]">Пауза:</span>
            <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-white dark:bg-[#0B101B] border border-slate-200 dark:border-white/[0.08]">
              {([5, 7, 10] as const).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setPauseSec(sec)}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded cursor-pointer ${
                    pauseSec === sec
                      ? 'prism-tab-active text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-[#94A3B8]'
                  }`}
                >
                  {sec}с
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-[#94A3B8]">Скорость:</span>
            <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-white dark:bg-[#0B101B] border border-slate-200 dark:border-white/[0.08]">
              {([0.9, 1.0, 1.2] as const).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeechRate(rate)}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded cursor-pointer ${
                    speechRate === rate
                      ? 'prism-tab-active text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-[#94A3B8]'
                  }`}
                >
                  {rate.toFixed(1)}×
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
