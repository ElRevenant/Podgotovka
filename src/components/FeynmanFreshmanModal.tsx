import {FormEvent, useEffect, useRef, useState} from 'react';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Flag,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {RecallGrade, TheoryCard} from '../types/study';
import {getAutonomousMode, getGeminiHeaders} from '../utils/cardHelpers';
import {
  evaluateStudentAnswer,
  HybridVoiceRecorderHandle,
  speakRussianText,
  startHybridVoiceRecording,
} from '../utils/speechAndGrading';

interface FeynmanFreshmanModalProps {
  initialCard: TheoryCard;
  allCards: TheoryCard[];
  onRateCard: (cardId: number, grade: RecallGrade) => void;
  onOpenSettings?: () => void;
  onClose: () => void;
}

interface FeynmanMessage {
  role: 'freshman' | 'teacher';
  text: string;
  jargonAlert?: boolean;
}

interface FeynmanReport {
  understandingPct: number;
  explainedWell: string[];
  illusionGaps: string[];
  recommendedGrade: RecallGrade;
}

const GRADE_LABELS: Record<RecallGrade, string> = {
  again: '1 · Не помню',
  hard: '2 · Сложно',
  good: '3 · Хорошо',
  easy: '4 · Легко',
};

export function FeynmanFreshmanModal({
  initialCard,
  allCards,
  onRateCard,
  onOpenSettings,
  onClose,
}: FeynmanFreshmanModalProps) {
  const [card, setCard] = useState<TheoryCard>(initialCard);
  const [messages, setMessages] = useState<FeynmanMessage[]>([
    {
      role: 'freshman',
      text: `Слушай, выручай 😅 У меня завтра пересдача, а я вообще не вдупляю тему «${initialCard.question}». Только, умоляю, не читай мне сухой учебник — объясни на пальцах, по-человечески, зачем это вообще нужно и как работает!`,
    },
  ]);
  const [understandingPct, setUnderstandingPct] = useState(0);
  const [moodLabel, setMoodLabel] = useState('В полном тумане (0%)');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [error, setError] = useState('');
  const [usingLocalDialog, setUsingLocalDialog] = useState<boolean>(
    getAutonomousMode,
  );
  const [report, setReport] = useState<FeynmanReport | null>(null);
  const [savedGrade, setSavedGrade] = useState<RecallGrade | null>(null);

  const recorderRef = useRef<HybridVoiceRecorderHandle | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const teacherTurns = messages.filter((m) => m.role === 'teacher').length;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isSending, report]);

  useEffect(() => {
    return () => {
      void recorderRef.current?.stop();
      audioRef.current?.pause();
    };
  }, []);

  const playNaturalFreshmanVoice = async (text: string) => {
    if (!voiceEnabled) return;
    if (getAutonomousMode()) {
      speakRussianText(text);
      return;
    }
    try {
      audioRef.current?.pause();
      const res = await fetch('/api/exam/tts-line', {
        method: 'POST',
        headers: getGeminiHeaders(),
        body: JSON.stringify({
          text,
          voiceName: 'Puck',
          style: 'Natural, lively, moderately brisk Russian university freshman voice, friendly and expressive',
        }),
      });
      if (!res.ok) {
        speakRussianText(text);
        return;
      }
      const data = (await res.json()) as {audioBase64?: string};
      if (!data.audioBase64) {
        speakRussianText(text);
        return;
      }
      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      audio.playbackRate = 1.1;
      audioRef.current = audio;
      void audio.play();
    } catch {
      speakRussianText(text);
    }
  };

  const stopRecordingIfActive = async (): Promise<string> => {
    const handle = recorderRef.current;
    recorderRef.current = null;
    setIsRecording(false);
    if (!handle) return inputText;
    try {
      return await handle.stop();
    } catch {
      return inputText;
    }
  };

  const handleToggleMic = async () => {
    if (isRecording) {
      const txt = await stopRecordingIfActive();
      setInputText(txt);
      return;
    }
    audioRef.current?.pause();
    setError('');
    const handle = await startHybridVoiceRecording({
      initialText: inputText,
      questionContext: card.question,
      onLiveText: (t) => setInputText(t),
      onTranscribingChange: (flag) => setIsTranscribing(flag),
      onError: (msg) => setError(msg),
      onStop: () => setIsRecording(false),
    });
    if (handle) {
      recorderRef.current = handle;
      setIsRecording(true);
    }
  };

  const applyLocalFeynmanTurn = (
    nextMessages: FeynmanMessage[],
    finishNow: boolean,
  ) => {
    const teacherReplies = nextMessages
      .filter((m) => m.role === 'teacher')
      .map((m) => m.text);
    const step = teacherReplies.length;
    const combined = teacherReplies.join(' ');
    const localEval = evaluateStudentAnswer(card, combined);
    const shouldFinish = finishNow || step >= 3;

    const points = card.answerPoints ?? [];
    let nextPct = Math.min(
      100,
      Math.max(understandingPct + 34, localEval.scorePct),
    );
    let replyText = '';
    let nextMood = 'Начинает доходить';

    if (shouldFinish) {
      nextPct = Math.max(localEval.scorePct, Math.min(100, understandingPct + 25));
      nextMood =
        nextPct >= 80
          ? 'Эврика! Понял всё'
          : nextPct >= 50
            ? 'Общая суть ясна'
            : 'Нужно ещё разобрать детали';
      replyText =
        nextPct >= 60
          ? `О, вот теперь пазл реально сложился! Главная суть — ${card.keyThesis}. Спасибо, на пересдаче точно вытяну!`
          : `В общих чертах понял: ${card.keyThesis}. Но давай ещё глянем шпаргалку по шагам ниже, чтобы не поплыть на деталях!`;
    } else if (step === 1) {
      const point2 =
        localEval.missedKeywords[0] ||
        points[1] ||
        points[0] ||
        card.keyThesis;
      replyText = `Ага, базовая мысль понятна! А можешь на пальцах объяснить второй шаг — как именно работает «${point2}»?`;
      nextMood = 'Начинает доходить';
    } else {
      const trap =
        card.examTip ||
        localEval.missedKeywords[0] ||
        points[points.length - 1] ||
        card.keyThesis;
      replyText = `Круто! И последний вопрос (шаг 3 из 3): препод на пересдаче любит ловить на этом — «${trap}». Почему тут нельзя ошибиться и что сломается?`;
      nextMood = 'Почти понял!';
    }

    const freshmanMsg: FeynmanMessage = {
      role: 'freshman',
      text: replyText,
      jargonAlert: false,
    };
    setMessages((prev) => [...prev, freshmanMsg]);
    setUnderstandingPct(nextPct);
    setMoodLabel(nextMood);

    if (shouldFinish) {
      setReport({
        understandingPct: nextPct,
        explainedWell:
          localEval.matchedKeywords.length > 0
            ? localEval.matchedKeywords
            : [card.keyThesis],
        illusionGaps:
          localEval.missedKeywords.length > 0
            ? localEval.missedKeywords
            : card.examTip
              ? [card.examTip]
              : [],
        recommendedGrade: localEval.recommendedGrade,
      });
    }

    void playNaturalFreshmanVoice(replyText);
  };

  const sendTurn = async (textToSend: string, finishNow = false) => {
    const clean = textToSend.trim();
    if (!finishNow && !clean) return;
    setError('');
    setIsSending(true);

    const nextMessages: FeynmanMessage[] = clean
      ? [...messages, {role: 'teacher', text: clean}]
      : [...messages];

    if (clean) {
      setMessages(nextMessages);
      setInputText('');
    }

    if (getAutonomousMode()) {
      setUsingLocalDialog(true);
      applyLocalFeynmanTurn(nextMessages, finishNow);
      setIsSending(false);
      return;
    }

    try {
      const res = await fetch('/api/exam/feynman-turn', {
        method: 'POST',
        headers: getGeminiHeaders(),
        body: JSON.stringify({
          card: {
            id: card.id,
            question: card.question,
            chapter: card.chapter,
            keyThesis: card.keyThesis,
            answerPoints: card.answerPoints,
            examTip: card.examTip,
          },
          history: nextMessages.map((m) => ({role: m.role, text: m.text})),
          currentUnderstanding: understandingPct,
          finishNow,
        }),
      });
      if (!res.ok) {
        setUsingLocalDialog(true);
        applyLocalFeynmanTurn(nextMessages, finishNow);
        return;
      }
      const data = await res.json();

      const freshmanMsg: FeynmanMessage = {
        role: 'freshman',
        text: data.freshmanReply,
        jargonAlert: Boolean(data.jargonDetected),
      };
      setMessages((prev) => [...prev, freshmanMsg]);
      setUnderstandingPct(data.understandingPct);
      setMoodLabel(data.moodLabel);

      if (data.isFinished) {
        setReport({
          understandingPct: data.understandingPct,
          explainedWell: data.explainedWell ?? [],
          illusionGaps: data.illusionGaps ?? [],
          recommendedGrade: data.recommendedGrade ?? 'good',
        });
      }

      void playNaturalFreshmanVoice(data.freshmanReply);
    } catch {
      setUsingLocalDialog(true);
      applyLocalFeynmanTurn(nextMessages, finishNow);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let finalText = inputText;
    if (isRecording) {
      finalText = await stopRecordingIfActive();
    }
    if (!finalText.trim() || isSending) return;
    await sendTurn(finalText, false);
  };

  const handlePickAnotherCard = () => {
    audioRef.current?.pause();
    const others = allCards.filter((c) => c.id !== card.id);
    const next =
      others.length > 0
        ? others[Math.floor(Math.random() * others.length)]
        : card;
    setCard(next);
    setMessages([
      {
        role: 'freshman',
        text: `Окей, новая тема! Расскажи мне по-человечески про «${next.question}» — только без заученных штампов, на пальцах!`,
      },
    ]);
    setUnderstandingPct(0);
    setMoodLabel('В полном тумане (0%)');
    setInputText('');
    setReport(null);
    setSavedGrade(null);
    setError('');
  };

  const meterColor =
    understandingPct >= 85
      ? 'bg-emerald-500'
      : understandingPct >= 45
        ? 'bg-sky-500'
        : 'bg-amber-500';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Метод Фейнмана наоборот: объясни первокурснику"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04070D]/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1522] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Brain className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-950 dark:text-[#F3F4F6] truncate">
                Метод Фейнмана · Объясни первокурснику Дане
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] truncate">
                Билет №{card.id}: {card.question}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (!next) audioRef.current?.pause();
              }}
              title={voiceEnabled ? 'Выключить озвучку Дани' : 'Включить живой голос Дани'}
              className={`p-2 rounded-lg border text-xs cursor-pointer ${
                voiceEnabled
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                  : 'border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-[#94A3B8]'
              }`}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handlePickAnotherCard}
              title="Другой билет"
              className="p-2 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-[#94A3B8] dark:hover:bg-[#182235] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Understanding Meter Bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0E1522] space-y-1.5 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-800 dark:text-[#E5E7EB]">
              Понимание первокурсника: <span className="text-sky-700 dark:text-sky-400">{moodLabel}</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {usingLocalDialog && (
                <>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200/80 dark:bg-white/[0.08] text-slate-700 dark:text-[#CBD5E1]">
                    Автономный диалог (3 шага)
                  </span>
                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSettings();
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 border border-cyan-400/35 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/25 cursor-pointer"
                    >
                      <Settings className="h-3 w-3" />
                      <span>Настройки режима</span>
                    </button>
                  )}
                </>
              )}
              <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                {understandingPct}% / 100%
              </span>
            </div>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-[#131B2B] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${meterColor}`}
              style={{width: `${Math.max(4, understandingPct)}%`}}
            />
          </div>
        </div>

        {/* Chat Stream */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-3.5 min-h-[260px]"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === 'teacher' ? 'items-end' : 'items-start'
              }`}
            >
              {msg.jargonAlert && (
                <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                  <AlertTriangle className="h-3 w-3" />
                  Поймал сухой штамп из учебника — объясни на пальцах!
                </span>
              )}
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'teacher'
                    ? 'bg-cyan-600/90 dark:bg-cyan-500/20 border border-cyan-500/40 text-white dark:text-cyan-50 rounded-br-sm'
                    : 'bg-slate-100 dark:bg-[#131B2B] text-slate-900 dark:text-[#F3F4F6] border border-slate-200 dark:border-white/[0.08] rounded-bl-sm'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-1">
                  {msg.role === 'teacher' ? 'Твоё объяснение' : 'Даня (первокурсник)'}
                </div>
                {msg.text}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#94A3B8]">
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              <span>Даня чешет затылок и пытается переварить объяснение...</span>
            </div>
          )}

          {/* Illusion of Competence Report */}
          {report && (
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/70 bg-emerald-50/60 dark:bg-emerald-950/25 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                    Аудит «Иллюзии понимания» ({report.understandingPct}%)
                  </h3>
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Рекомендация SM-2: {GRADE_LABELS[report.recommendedGrade]}
                </span>
              </div>

              {report.explainedWell.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Что ты реально понимаешь глубоко:
                  </div>
                  <ul className="list-disc pl-5 text-xs text-slate-800 dark:text-[#E5E7EB] space-y-0.5">
                    {report.explainedWell.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.illusionGaps.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Где пряталась «иллюзия понимания» (что дошлифовать):
                  </div>
                  <ul className="list-disc pl-5 text-xs text-slate-800 dark:text-[#E5E7EB] space-y-0.5">
                    {report.illusionGaps.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {savedGrade ? (
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Сохранено в SM-2: {GRADE_LABELS[savedGrade]}
                  </span>
                ) : (
                  (['again', 'hard', 'good', 'easy'] as RecallGrade[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        onRateCard(card.id, g);
                        setSavedGrade(g);
                      }}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                        g === report.recommendedGrade
                          ? 'prism-tab-active text-slate-900 dark:text-white'
                          : 'border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#131B2B] text-slate-700 dark:text-[#D1D5DB]'
                      }`}
                    >
                      {GRADE_LABELS[g]}
                    </button>
                  ))
                )}
                <button
                  type="button"
                  onClick={handlePickAnotherCard}
                  className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-950 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Следующая тема</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </div>
          )}
        </div>

        {/* Input Composer */}
        {!report && (
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E1522] space-y-2 shrink-0"
          >
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => void handleToggleMic()}
                disabled={isSending || isTranscribing}
                title={isRecording ? 'Остановить запись' : 'Объяснить голосом'}
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#222] text-slate-700 dark:text-[#E5E7EB] hover:border-sky-500'
                }`}
              >
                {isTranscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>

              <textarea
                rows={2}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmit(e);
                  }
                }}
                placeholder="Объясни Дане своими словами, с жизненным примером или интуицией..."
                className="flex-1 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0B101B] px-3 py-2 text-sm text-slate-900 dark:text-[#F3F4F6] placeholder:text-slate-400 focus:outline-none focus:border-sky-500 resize-none"
              />

              <button
                type="submit"
                disabled={isSending || (!inputText.trim() && !isRecording)}
                className="h-10 px-4 rounded-xl prism-cta disabled:opacity-40 inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Объяснить</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8]">
              <span>Раунд {teacherTurns + 1} из 5 · Доведи понимание до 100%</span>
              {teacherTurns >= 1 && (
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => void sendTurn('', true)}
                  className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  <Flag className="h-3 w-3" />
                  <span>Завершить и вскрыть «иллюзию понимания»</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
