import {useEffect, useRef, useState} from 'react';
import {
  CloudRain,
  Flame,
  Headphones,
  Library,
  Pause,
  Play,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Waves,
} from 'lucide-react';

type SoundscapeId = 'rain' | 'fireplace' | 'brown' | 'binaural';

interface SoundscapePreset {
  id: SoundscapeId;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: 'rain' | 'fireplace' | 'brown' | 'binaural';
}

const SOUNDSCAPES: ReadonlyArray<SoundscapePreset> = [
  {
    id: 'rain',
    label: 'Зимний дождь',
    shortLabel: 'Дождь',
    subtitle: 'Мягкий шум дождя за окном',
    icon: 'rain',
  },
  {
    id: 'fireplace',
    label: 'Тёплый камин',
    shortLabel: 'Камин',
    subtitle: 'Уютное потрескивание дров',
    icon: 'fireplace',
  },
  {
    id: 'brown',
    label: 'Тихая библиотека',
    shortLabel: 'Шум',
    subtitle: 'Глубокий коричневый шум для чтения',
    icon: 'brown',
  },
  {
    id: 'binaural',
    label: 'Альфа-фокус (10 Гц)',
    shortLabel: 'Альфа',
    subtitle: 'Спокойный гармонический тон в наушниках',
    icon: 'binaural',
  },
];

const STORAGE_KEY = 'aip_exam_focus_soundscape_v1';

interface SavedSoundscapePrefs {
  preset: SoundscapeId;
  volume: number;
}

function loadSavedSoundscape(): SavedSoundscapePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedSoundscapePrefs>;
      const validPreset = SOUNDSCAPES.some((s) => s.id === parsed.preset)
        ? (parsed.preset as SoundscapeId)
        : 'rain';
      const validVolume =
        typeof parsed.volume === 'number' &&
        Number.isFinite(parsed.volume) &&
        parsed.volume >= 0.05 &&
        parsed.volume <= 1
          ? parsed.volume
          : 0.4;
      return {preset: validPreset, volume: validVolume};
    }
  } catch {
    // ignore storage errors
  }
  return {preset: 'rain', volume: 0.4};
}

interface ActiveAudioGraph {
  ctx: AudioContext;
  masterGain: GainNode;
  cleanup: () => void;
}

function createNoiseBuffer(
  ctx: AudioContext,
  type: 'pink' | 'brown',
  durationSec = 4,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * durationSec;
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    if (type === 'pink') {
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.153852;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.055;
        b6 = white * 0.115926;
      }
    } else {
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 1.9;
      }
    }
  }
  return buffer;
}

function buildSoundscapeGraph(
  preset: SoundscapeId,
  volume: number,
): ActiveAudioGraph | null {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as {webkitAudioContext?: typeof AudioContext})
      .webkitAudioContext;
  if (!AudioCtx) return null;

  const ctx = new AudioCtx();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(
    Math.max(0.001, volume),
    ctx.currentTime + 0.45,
  );
  masterGain.connect(ctx.destination);

  const stoppers: Array<() => void> = [];

  if (preset === 'rain') {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx, 'pink', 5);
    source.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'lowpass';
    bandpass.frequency.value = 1350;
    bandpass.Q.value = 0.6;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 180;

    // Gentle rain gust LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.14;
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);

    source.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(masterGain);

    source.start();
    lfo.start();
    stoppers.push(() => {
      source.stop();
      lfo.stop();
    });
  } else if (preset === 'fireplace') {
    // Deep hearth rumble
    const rumbleSource = ctx.createBufferSource();
    rumbleSource.buffer = createNoiseBuffer(ctx, 'brown', 5);
    rumbleSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 240;

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.85;

    rumbleSource.connect(lowpass);
    lowpass.connect(rumbleGain);
    rumbleGain.connect(masterGain);
    rumbleSource.start();

    // Subtle crackle bursts
    let crackleTimer: number | undefined;
    const scheduleCrackle = () => {
      if (ctx.state === 'closed') return;
      const delayMs = 240 + Math.random() * 1400;
      crackleTimer = window.setTimeout(() => {
        if (ctx.state !== 'running') {
          scheduleCrackle();
          return;
        }
        const popBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.018), ctx.sampleRate);
        const ch = popBuf.getChannelData(0);
        for (let i = 0; i < ch.length; i++) {
          const env = Math.exp(-i / (ch.length * 0.22));
          ch[i] = (Math.random() * 2 - 1) * env * 0.55;
        }
        const pop = ctx.createBufferSource();
        pop.buffer = popBuf;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1400 + Math.random() * 2200;
        bp.Q.value = 1.6;

        const popGain = ctx.createGain();
        popGain.gain.value = 0.14 + Math.random() * 0.22;

        pop.connect(bp);
        bp.connect(popGain);
        popGain.connect(masterGain);
        pop.start();

        scheduleCrackle();
      }, delayMs);
    };
    scheduleCrackle();

    stoppers.push(() => {
      if (crackleTimer !== undefined) window.clearTimeout(crackleTimer);
      rumbleSource.stop();
    });
  } else if (preset === 'brown') {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx, 'brown', 5);
    source.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 340;
    lp.Q.value = 0.5;

    source.connect(lp);
    lp.connect(masterGain);
    source.start();
    stoppers.push(() => source.stop());
  } else {
    // Warm Alpha Focus binaural pad (200 Hz left, 210 Hz right = 10 Hz alpha beat + soft fifth overtone)
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const oscWarm = ctx.createOscillator();
    oscL.type = 'sine';
    oscR.type = 'sine';
    oscWarm.type = 'sine';
    oscL.frequency.value = 200;
    oscR.frequency.value = 210;
    oscWarm.frequency.value = 300;

    const merger = ctx.createChannelMerger(2);
    const padGain = ctx.createGain();
    padGain.gain.value = 0.22;

    const warmGain = ctx.createGain();
    warmGain.gain.value = 0.06;

    oscL.connect(merger, 0, 0);
    oscR.connect(merger, 0, 1);
    merger.connect(padGain);
    padGain.connect(masterGain);

    oscWarm.connect(warmGain);
    warmGain.connect(masterGain);

    // Subtle soft air layer underneath
    const air = ctx.createBufferSource();
    air.buffer = createNoiseBuffer(ctx, 'pink', 4);
    air.loop = true;
    const airLp = ctx.createBiquadFilter();
    airLp.type = 'lowpass';
    airLp.frequency.value = 420;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.12;
    air.connect(airLp);
    airLp.connect(airGain);
    airGain.connect(masterGain);

    oscL.start();
    oscR.start();
    oscWarm.start();
    air.start();
    stoppers.push(() => {
      oscL.stop();
      oscR.stop();
      oscWarm.stop();
      air.stop();
    });
  }

  return {
    ctx,
    masterGain,
    cleanup: () => {
      try {
        masterGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.06);
      } catch {
        // ignore
      }
      window.setTimeout(() => {
        for (const stop of stoppers) {
          try {
            stop();
          } catch {
            // ignore
          }
        }
        ctx.close().catch(() => {
          // ignore
        });
      }, 220);
    },
  };
}

function PresetIcon({
  kind,
  className,
}: {
  kind: SoundscapePreset['icon'];
  className?: string;
}) {
  if (kind === 'rain') return <CloudRain className={className} />;
  if (kind === 'fireplace') return <Flame className={className} />;
  if (kind === 'brown') return <Library className={className} />;
  return <Waves className={className} />;
}

export function FocusSoundscape() {
  const initial = loadSavedSoundscape();
  const [preset, setPreset] = useState<SoundscapeId>(initial.preset);
  const [volume, setVolume] = useState<number>(initial.volume);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [panelOpen, setPanelOpen] = useState<boolean>(false);

  const audioRef = useRef<ActiveAudioGraph | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const activePreset =
    SOUNDSCAPES.find((s) => s.id === preset) ?? SOUNDSCAPES[0];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({preset, volume}));
    } catch {
      // ignore
    }
  }, [preset, volume]);

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!panelOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setPanelOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [panelOpen]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.cleanup();
      audioRef.current = null;
    };
  }, []);

  // Update volume smoothly when playing
  useEffect(() => {
    const graph = audioRef.current;
    if (graph && graph.ctx.state !== 'closed') {
      try {
        graph.masterGain.gain.setTargetAtTime(
          Math.max(0.001, volume),
          graph.ctx.currentTime,
          0.05,
        );
      } catch {
        // ignore
      }
    }
  }, [volume]);

  const stopAudio = () => {
    audioRef.current?.cleanup();
    audioRef.current = null;
    setIsPlaying(false);
  };

  const startAudio = (targetPreset: SoundscapeId) => {
    if (audioRef.current) {
      audioRef.current.cleanup();
      audioRef.current = null;
    }
    const graph = buildSoundscapeGraph(targetPreset, volume);
    if (graph) {
      audioRef.current = graph;
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio(preset);
    }
  };

  const handleSelectPreset = (nextId: SoundscapeId) => {
    setPreset(nextId);
    if (isPlaying) {
      startAudio(nextId);
    } else {
      startAudio(nextId);
    }
  };

  const volumePct = Math.round(volume * 100);

  return (
    <div ref={popoverRef} className="relative shrink-0">
      <div
        className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-full transition-all shrink-0 ${
          isPlaying
            ? 'prism-tab-active'
            : 'border border-slate-200/80 dark:border-white/[0.1] bg-slate-100/80 dark:bg-[#0E1522]/95'
        }`}
      >
        <button
          type="button"
          onClick={handleTogglePlay}
          aria-label={
            isPlaying
              ? `Пауза фонового звука (${activePreset.label})`
              : `Включить фоновый звук для фокуса (${activePreset.label})`
          }
          title={
            isPlaying
              ? `Играет: ${activePreset.label} (${volumePct}%) — нажмите для паузы`
              : `Звуковой фон для фокуса: ${activePreset.label} — нажмите, чтобы включить`
          }
          className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-semibold text-slate-800 dark:text-[#F1F5F9] hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          {isPlaying ? (
            <Volume2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          ) : (
            <Headphones className="h-3.5 w-3.5 text-slate-500 dark:text-[#9CA3AF] shrink-0" />
          )}
          <span className="hidden sm:inline">
            {isPlaying ? activePreset.shortLabel : 'Звук'}
          </span>
          {isPlaying ? (
            <Pause className="h-3 w-3 text-amber-600 dark:text-amber-300 shrink-0" />
          ) : (
            <Play className="h-3 w-3 text-slate-500 dark:text-[#94A3B8] shrink-0" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          aria-label="Выбрать звуковой фон и громкость"
          title="Выбрать звуковой фон и громкость"
          className="p-1 rounded-full text-slate-500 hover:text-slate-900 dark:text-[#9CA3AF] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="h-3 w-3" />
        </button>
      </div>

      {panelOpen && (
        <div
          role="dialog"
          aria-label="Настройка звукового фона для фокуса"
          className="absolute right-0 mt-2 w-[280px] sm:w-[300px] z-40 rounded-[18px] border border-slate-200/80 dark:border-white/[0.1] bg-white/96 dark:bg-[#0E1522]/96 backdrop-blur-xl shadow-2xl p-3.5 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Звуковой фон для фокуса
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                Работает офлайн без загрузки файлов
              </p>
            </div>
            {isPlaying && (
              <button
                type="button"
                onClick={stopAudio}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
              >
                <VolumeX className="h-3 w-3" />
                <span>Стоп</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {SOUNDSCAPES.map((item) => {
              const selected = item.id === preset;
              const playingThis = selected && isPlaying;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPreset(item.id)}
                  className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                    playingThis
                      ? 'bg-cyan-50 border-cyan-300 text-slate-950 dark:bg-cyan-500/15 dark:border-cyan-400/40 dark:text-white'
                      : selected
                        ? 'bg-slate-100/90 border-slate-300 text-slate-900 dark:bg-white/[0.06] dark:border-white/[0.14] dark:text-[#F3F4F6]'
                        : 'bg-transparent border-slate-200/70 dark:border-white/[0.06] text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100/70 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`p-1.5 rounded-lg shrink-0 ${
                        playingThis
                          ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'
                          : 'bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-[#94A3B8]'
                      }`}
                    >
                      <PresetIcon kind={item.icon} className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold shrink-0 text-cyan-700 dark:text-cyan-300">
                    {playingThis ? 'ВКЛ' : ''}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.08] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <label
                htmlFor="focus-soundscape-volume"
                className="font-medium text-slate-600 dark:text-[#CBD5E1]"
              >
                Громкость
              </label>
              <span className="font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC] font-semibold">
                {volumePct}%
              </span>
            </div>
            <input
              id="focus-soundscape-volume"
              type="range"
              min={5}
              max={100}
              step={5}
              value={volumePct}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
