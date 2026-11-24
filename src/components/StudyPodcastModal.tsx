import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Check,
  Download,
  Headphones,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import {CardSRState, TheoryCard} from '../types/study';
import {getCardSRState, getCardUrgencyScore} from '../utils/spacedRepetition';

interface StudyPodcastModalProps {
  subjectTitle: string;
  allCards: TheoryCard[];
  srMap: Record<number, CardSRState>;
  onClose: () => void;
}

interface PodcastLine {
  speaker: string;
  text: string;
}

interface PodcastSegment {
  segmentType: 'intro' | 'prompt' | 'answer' | 'outro';
  cardId?: number;
  heading: string;
  pauseAfterSec: number;
  lines: PodcastLine[];
}

interface SegmentTiming {
  heading: string;
  cardId?: number;
  startSec: number;
  endSec: number;
}

const SPEED_OPTIONS = [0.9, 1.0, 1.1, 1.25, 1.4];

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function base64ToBlobUrl(base64: string, mimeType: string): {url: string; blob: Blob} {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], {type: mimeType});
  return {url: URL.createObjectURL(blob), blob};
}

export function StudyPodcastModal({
  subjectTitle,
  allCards,
  srMap,
  onClose,
}: StudyPodcastModalProps) {
  // Rank weakest / hardest / due cards first
  const rankedCards = useMemo(() => {
    const now = Date.now();
    return [...allCards].sort((a, b) => {
      const sa = getCardUrgencyScore(getCardSRState(srMap, a.id), now);
      const sb = getCardUrgencyScore(getCardSRState(srMap, b.id), now);
      return sb - sa;
    });
  }, [allCards, srMap]);

  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    rankedCards.slice(0, Math.min(3, rankedCards.length)).map((c) => c.id),
  );
  const [format, setFormat] = useState<'dialogue' | 'solo'>('dialogue');
  const [voicePreset, setVoicePreset] = useState<'Charon' | 'Zephyr' | 'Kore'>('Charon');
  const [paceMode, setPaceMode] = useState<'brisk' | 'calm'>('brisk');

  const [phase, setPhase] = useState<'setup' | 'scripting' | 'voicing' | 'ready'>('setup');
  const [error, setError] = useState('');

  const [episodeTitle, setEpisodeTitle] = useState('');
  const [segments, setSegments] = useState<PodcastSegment[]>([]);
  const [timings, setTimings] = useState<SegmentTiming[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Default moderately brisk speed (1.1x) as requested!
  const [playbackRate, setPlaybackRate] = useState<number>(1.1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, audioUrl]);

  // Register MediaSession so lock-screen controls work in the metro / pocket!
  useEffect(() => {
    if (!audioUrl || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: episodeTitle || `Аудиоразбор · ${subjectTitle}`,
        artist: format === 'dialogue' ? 'Артём и Алиса · Учебный подкаст' : 'Учебный подкаст',
        album: subjectTitle,
      });
      navigator.mediaSession.setActionHandler('play', () => {
        void audioRef.current?.play();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
        }
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(
            audioRef.current.duration || 0,
            audioRef.current.currentTime + 10,
          );
        }
      });
    } catch {
      // ignore unsupported MediaSession handlers
    }
  }, [audioUrl, episodeTitle, subjectTitle, format]);

  const toggleCardSelection = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((x) => x !== id) : prev;
      }
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const handleGeneratePodcast = async () => {
    const pickedCards = allCards.filter((c) => selectedIds.includes(c.id));
    if (pickedCards.length === 0) return;

    setError('');
    setPhase('scripting');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
    }

    try {
      // Step 1: Generate natural conversational Russian script with spoken math + 5s pauses
      const scriptRes = await fetch('/api/exam/podcast-script', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          subjectTitle,
          format,
          paceMode,
          cards: pickedCards.map((c) => ({
            id: c.id,
            question: c.question,
            keyThesis: c.keyThesis,
            answerPoints: c.answerPoints,
            examTip: c.examTip,
          })),
        }),
      });
      if (!scriptRes.ok) {
        const body = await scriptRes.json().catch(() => ({}));
        throw new Error(body.error || 'Не удалось написать сценарий подкаста');
      }
      const scriptData = (await scriptRes.json()) as {
        episodeTitle: string;
        segments: PodcastSegment[];
      };

      setEpisodeTitle(scriptData.episodeTitle);
      setSegments(scriptData.segments);
      setPhase('voicing');

      // Step 2: Synthesize natural non-robotic neural speech via gemini-3.8-flash-tts + stitch pauses into 1 WAV
      const audioRes = await fetch('/api/exam/podcast-audio', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          segments: scriptData.segments,
          format,
          voicePreset,
          paceMode,
        }),
      });
      if (!audioRes.ok) {
        const body = await audioRes.json().catch(() => ({}));
        throw new Error(body.error || 'Не удалось озвучить выпуск');
      }
      const audioData = (await audioRes.json()) as {
        audioBase64: string;
        mimeType: string;
        durationSec: number;
        segmentTimings: SegmentTiming[];
      };

      const {url, blob} = base64ToBlobUrl(audioData.audioBase64, audioData.mimeType || 'audio/wav');
      setAudioUrl(url);
      setAudioBlob(blob);
      setTimings(audioData.segmentTimings ?? []);
      setDuration(audioData.durationSec || 0);
      setCurrentTime(0);
      setPhase('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания подкаста');
      setPhase('setup');
    }
  };

  const handleTogglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.playbackRate = playbackRate;
      void el.play();
    } else {
      el.pause();
    }
  };

  const handleSeek = (sec: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(duration || el.duration || 0, sec));
    setCurrentTime(el.currentTime);
  };

  const handleDownloadWav = () => {
    if (!audioBlob) return;
    const dlUrl = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = dlUrl;
    const safeSlug = subjectTitle.replace(/[^a-zA-Zа-яА-Я0-9]+/g, '_').slice(0, 30);
    a.download = `podcast_${safeSlug}_${new Date().toISOString().slice(0, 10)}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(dlUrl);
  };

  const activeSegmentIndex = useMemo(() => {
    if (timings.length === 0) return -1;
    const idx = timings.findIndex(
      (t) => currentTime >= t.startSec && currentTime < t.endSec,
    );
    return idx >= 0 ? idx : currentTime >= (timings[timings.length - 1]?.endSec ?? 0) ? timings.length - 1 : 0;
  }, [timings, currentTime]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Личный аудиоподкаст по слабым темам"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04070D]/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
    >
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1522] shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Headphones className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-[#F3F4F6] truncate">
                Личный подкаст в метро и перед сном
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] truncate">
                Живые нейронные голоса · паузы 5 сек на самопроверку · скачивание в офлайн WAV
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-[#94A3B8] dark:hover:bg-[#182235] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto space-y-5">
          {error && (
            <div className="rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </div>
          )}

          {phase === 'setup' && (
            <>
              {/* Format & Voice Settings */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E1522] p-3.5 space-y-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-[#D1D5DB]">
                    Формат выпуска
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormat('dialogue')}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        format === 'dialogue'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200'
                          : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8]'
                      }`}
                    >
                      Диалог (Артём + Алиса)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat('solo')}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        format === 'solo'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200'
                          : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8]'
                      }`}
                    >
                      Один ведущий
                    </button>
                  </div>
                  {format === 'solo' && (
                    <div className="flex items-center gap-1.5 pt-1">
                      {(
                        [
                          {id: 'Charon', label: 'Мужской тёплый'},
                          {id: 'Zephyr', label: 'Женский живой'},
                          {id: 'Kore', label: 'Женский мягкий'},
                        ] as const
                      ).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVoicePreset(v.id)}
                          className={`px-2 py-1 text-[11px] font-medium rounded-md border cursor-pointer ${
                            voicePreset === v.id
                              ? 'border-sky-500 bg-sky-500 text-white'
                              : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8]'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E1522] p-3.5 space-y-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-[#D1D5DB]">
                    Темп и настроение речи
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaceMode('brisk');
                        setPlaybackRate(1.1);
                      }}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        paceMode === 'brisk'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200'
                          : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8]'
                      }`}
                    >
                      Бодрый (в метро, 1.1×)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaceMode('calm');
                        setPlaybackRate(1.0);
                      }}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        paceMode === 'calm'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200'
                          : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8]'
                      }`}
                    >
                      Спокойный (перед сном)
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                    Все формулы переводятся в естественную русскую речь + добавляются мягкие 4-секундные паузы для самопроверки.
                  </p>
                </div>
              </div>

              {/* Card Picker (Weakest cards highlighted at top) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-[#E5E7EB]">
                    Выбери от 1 до 5 слабых тем для этого выпуска (выбрано: {selectedIds.length}/5)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedIds(
                        rankedCards.slice(0, Math.min(4, rankedCards.length)).map((c) => c.id),
                      )
                    }
                    className="text-xs text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Взять 4 самые слабые
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/[0.08] divide-y divide-slate-100 dark:divide-white/[0.07]">
                  {rankedCards.slice(0, 24).map((c) => {
                    const checked = selectedIds.includes(c.id);
                    const sr = getCardSRState(srMap, c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCardSelection(c.id)}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                          checked
                            ? 'bg-sky-50/70 dark:bg-sky-950/25'
                            : 'hover:bg-slate-50 dark:hover:bg-[#182235]'
                        }`}
                      >
                        <span
                          className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                            checked
                              ? 'prism-tab-active text-slate-900 dark:text-white'
                              : 'border-slate-300 dark:border-[#444]'
                          }`}
                        >
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-slate-900 dark:text-[#F3F4F6] truncate">
                            №{c.id} · {c.question}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] truncate">
                            {c.chapter}
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                            sr.status === 'hard'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                              : sr.status === 'unseen'
                                ? 'bg-slate-200/70 dark:bg-[#131B2B] text-slate-600 dark:text-[#94A3B8]'
                                : sr.status === 'learning'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {sr.status === 'hard'
                            ? 'Сложно'
                            : sr.status === 'unseen'
                              ? 'Новое'
                              : sr.status === 'learning'
                                ? 'Повтор'
                                : 'Выучено'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGeneratePodcast}
                  disabled={selectedIds.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl prism-cta disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Записать аудиоподкаст ({selectedIds.length} тем)</span>
                </button>
              </div>
            </>
          )}

          {(phase === 'scripting' || phase === 'voicing') && (
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="h-9 w-9 animate-spin text-sky-500" />
              <div className="text-base font-bold text-slate-950 dark:text-[#F3F4F6]">
                {phase === 'scripting'
                  ? 'Пишем живой сценарий без робо-штампов...'
                  : 'Озвучиваем выпуск живыми нейронными голосами и вшиваем паузы...'}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-md">
                {phase === 'scripting'
                  ? 'Переводим формулы в естественную русскую речь и расставляем 5-секундные паузы для активного вспоминания.'
                  : 'Обычно занимает 15–35 секунд. После этого выпуск можно слушать с выключенным экраном и скачать как WAV.'}
              </p>
            </div>
          )}

          {phase === 'ready' && audioUrl && (
            <div className="space-y-4">
              <audio
                ref={audioRef}
                src={audioUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => {
                  if (Number.isFinite(e.currentTarget.duration)) {
                    setDuration(e.currentTarget.duration);
                  }
                  e.currentTarget.playbackRate = playbackRate;
                }}
              />

              {/* Player Card */}
              <div className="rounded-2xl border border-cyan-200/80 dark:border-cyan-500/25 bg-gradient-to-br from-cyan-50/70 to-slate-50 dark:from-[#131B2B] dark:to-[#0B101B] p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">
                      {format === 'dialogue' ? 'Артём и Алиса · Живой разбор' : 'Соло-выпуск · Наставник'}
                    </span>
                    <h3 className="mt-0.5 text-lg font-bold text-slate-950 dark:text-white">
                      {episodeTitle}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadWav}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Скачать WAV (офлайн)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        audioRef.current?.pause();
                        setPhase('setup');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-white/60 dark:hover:bg-[#182235] cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Новый</span>
                    </button>
                  </div>
                </div>

                {/* Seek Bar */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, duration)}
                    step={0.1}
                    value={Math.min(currentTime, Math.max(1, duration))}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-mono tabular-nums text-slate-600 dark:text-[#94A3B8]">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls + Speed */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSeek(currentTime - 10)}
                      className="px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131B2B] text-slate-700 dark:text-[#E5E7EB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
                    >
                      −10с
                    </button>
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="h-11 w-11 rounded-full prism-cta flex items-center justify-center shadow-md cursor-pointer"
                      aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSeek(currentTime + 10)}
                      className="px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131B2B] text-slate-700 dark:text-[#E5E7EB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
                    >
                      +10с
                    </button>
                  </div>

                  {/* Speed Pills */}
                  <div className="flex items-center gap-1">
                    <Volume2 className="h-3.5 w-3.5 text-slate-500 mr-1" />
                    {SPEED_OPTIONS.map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => setPlaybackRate(sp)}
                        className={`px-2 py-1 text-xs font-mono font-semibold rounded-md cursor-pointer ${
                          playbackRate === sp
                            ? 'prism-cta'
                            : 'text-slate-600 dark:text-[#94A3B8] hover:bg-slate-200/70 dark:hover:bg-[#182235]'
                        }`}
                      >
                        {sp}×
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Synchronized Transcript / Chapters */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-[#D1D5DB]">
                  Главы и расшифровка (нажми на блок, чтобы перемотать)
                </div>
                <div className="space-y-2">
                  {segments.map((seg, idx) => {
                    const timing = timings[idx];
                    const isActive = idx === activeSegmentIndex;
                    return (
                      <button
                        key={`${seg.heading}-${idx}`}
                        type="button"
                        onClick={() => {
                          if (timing) {
                            handleSeek(timing.startSec);
                            if (audioRef.current?.paused) {
                              void audioRef.current.play();
                            }
                          }
                        }}
                        className={`w-full text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                          isActive
                            ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/30'
                            : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1522] hover:border-slate-300 dark:hover:border-[#3A3A3A]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-[#F3F4F6]">
                            {seg.heading}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-[#94A3B8]">
                            {seg.pauseAfterSec >= 2 && (
                              <span className="text-amber-700 dark:text-amber-400 font-sans font-semibold">
                                + пауза {seg.pauseAfterSec}с на ответ
                              </span>
                            )}
                            {timing && <span>{formatTime(timing.startSec)}</span>}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {seg.lines.map((line, lIdx) => (
                            <p
                              key={lIdx}
                              className="text-xs leading-relaxed text-slate-700 dark:text-[#D1D5DB]"
                            >
                              <strong className="text-slate-950 dark:text-white">
                                {line.speaker}:{' '}
                              </strong>
                              {line.text}
                            </p>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
