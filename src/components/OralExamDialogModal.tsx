import {FormEvent, useEffect, useRef, useState} from 'react';
import {
  Award,
  Flag,
  GraduationCap,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Settings,
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
  stopSpeaking,
} from '../utils/speechAndGrading';
import {MathBlock} from './MathBlock';

interface OralExamDialogModalProps {
  initialCard: TheoryCard;
  allCards: TheoryCard[];
  onRateCard: (cardId: number, grade: RecallGrade) => void;
  onOpenSettings?: () => void;
  onClose: () => void;
}

interface DialogTurn {
  role: 'professor' | 'student';
  text: string;
}

interface OralTurnResponse {
  isFinished: boolean;
  professorMessage: string;
  examGrade: number | null;
  scorePct: number;
  recommendedGrade: RecallGrade;
  feedbackSummary: string;
}

export function OralExamDialogModal({
  initialCard,
  allCards,
  onRateCard,
  onOpenSettings,
  onClose,
}: OralExamDialogModalProps) {
  const [card, setCard] = useState<TheoryCard>(initialCard);
  const [history, setHistory] = useState<DialogTurn[]>([
    {
      role: 'professor',
      text: `Здравствуйте! Ваш билет №${initialCard.id}: «${initialCard.question}». Расскажите своими словами ключевую суть, формулировку и главные шаги.`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [error, setError] = useState('');
  const [usingLocalDialog, setUsingLocalDialog] = useState<boolean>(
    getAutonomousMode,
  );
  const [finalOutcome, setFinalOutcome] = useState<{
    examGrade: number;
    scorePct: number;
    recommendedGrade: RecallGrade;
    feedbackSummary: string;
  } | null>(null);

  const recorderRef = useRef<HybridVoiceRecorderHandle | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const studentTurns = history.filter((h) => h.role === 'student').length;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [history, isSending]);

  useEffect(() => {
    if (autoSpeak && history.length === 1) {
      speakRussianText(history[0].text);
    }
    return () => {
      stopSpeaking();
      void recorderRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

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
    stopSpeaking();
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

  const buildLocalProfessorTurn = (
    nextHistory: DialogTurn[],
    finishNow: boolean,
  ): OralTurnResponse => {
    const studentAnswers = nextHistory
      .filter((t) => t.role === 'student')
      .map((t) => t.text);
    const turnCount = studentAnswers.length;
    const combinedAnswer = studentAnswers.join(' ');
    const localEval = evaluateStudentAnswer(card, combinedAnswer);
    const shouldFinish = finishNow || turnCount >= 3;

    if (shouldFinish) {
      const scorePct = localEval.scorePct;
      const examGrade =
        scorePct >= 82 ? 5 : scorePct >= 62 ? 4 : scorePct >= 38 ? 3 : 2;
      return {
        isFinished: true,
        professorMessage: `${localEval.verdictTitle}. ${localEval.verdictDetail}`,
        examGrade,
        scorePct,
        recommendedGrade: localEval.recommendedGrade,
        feedbackSummary:
          localEval.missedKeywords.length > 0
            ? `Обратите внимание на тезисы: ${localEval.missedKeywords.join(' · ')}. ${card.examTip ? `Ловушка экзамена: ${card.examTip}` : ''}`
            : `Все ключевые тезисы раскрыты верно! ${card.examTip ? `Помните про нюанс: ${card.examTip}` : ''}`,
      };
    }

    const points = card.answerPoints ?? [];
    if (turnCount === 1) {
      const targetPoint =
        localEval.missedKeywords[0] ||
        points[1] ||
        points[0] ||
        card.keyThesis;
      return {
        isFinished: false,
        professorMessage: `Хорошо, начало понятное (текущая полнота: ${localEval.scorePct}%). А теперь уточните второй шаг: как именно формулируется и работает тезис «${targetPoint}»?`,
        examGrade: null,
        scorePct: localEval.scorePct,
        recommendedGrade: localEval.recommendedGrade,
        feedbackSummary: '',
      };
    }

    const trapOrLastPoint =
      card.examTip ||
      localEval.missedKeywords[0] ||
      points[points.length - 1] ||
      card.keyThesis;
    return {
      isFinished: false,
      professorMessage: `Принято! И финальный вопрос на засыпку (3-й шаг): на защите часто проверяют нюанс — «${trapOrLastPoint}». Поясните своими словами, почему это важно и что будет, если это условие нарушить?`,
      examGrade: null,
      scorePct: localEval.scorePct,
      recommendedGrade: localEval.recommendedGrade,
      feedbackSummary: '',
    };
  };

  const applyProfessorTurn = (
    nextHistory: DialogTurn[],
    data: OralTurnResponse,
  ) => {
    const updated = [
      ...nextHistory,
      {role: 'professor' as const, text: data.professorMessage},
    ];
    setHistory(updated);

    if (autoSpeak) {
      speakRussianText(data.professorMessage);
    }

    if (data.isFinished) {
      const grade = data.examGrade ?? 3;
      setFinalOutcome({
        examGrade: grade,
        scorePct: data.scorePct,
        recommendedGrade: data.recommendedGrade,
        feedbackSummary: data.feedbackSummary,
      });
      onRateCard(card.id, data.recommendedGrade);
    }
  };

  const sendTurnToProfessor = async (finishNow = false) => {
    if (isSending || finalOutcome) return;
    stopSpeaking();

    let answerText = inputText.trim();
    if (isRecording) {
      answerText = (await stopRecordingIfActive()).trim();
    }

    const nextHistory = [...history];
    if (answerText) {
      nextHistory.push({role: 'student', text: answerText});
      setHistory(nextHistory);
      setInputText('');
    } else if (!finishNow) {
      setError('Скажите или напишите свой ответ перед отправкой.');
      return;
    }

    setIsSending(true);
    setError('');

    if (getAutonomousMode()) {
      setUsingLocalDialog(true);
      const localTurn = buildLocalProfessorTurn(nextHistory, finishNow);
      applyProfessorTurn(nextHistory, localTurn);
      setIsSending(false);
      return;
    }

    try {
      const res = await fetch('/api/exam/oral-turn', {
        method: 'POST',
        headers: getGeminiHeaders(),
        body: JSON.stringify({
          card: {
            question: card.question,
            chapter: card.chapter,
            keyThesis: card.keyThesis,
            answerPoints: card.answerPoints,
            examTip: card.examTip,
          },
          history: nextHistory,
          finishNow,
        }),
      });
      if (!res.ok) {
        setUsingLocalDialog(true);
        const localTurn = buildLocalProfessorTurn(nextHistory, finishNow);
        applyProfessorTurn(nextHistory, localTurn);
        return;
      }
      const data = (await res.json()) as OralTurnResponse;
      applyProfessorTurn(nextHistory, data);
    } catch {
      setUsingLocalDialog(true);
      const localTurn = buildLocalProfessorTurn(nextHistory, finishNow);
      applyProfessorTurn(nextHistory, localTurn);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendTurnToProfessor(false);
  };

  const handlePickNextTicket = () => {
    stopSpeaking();
    void stopRecordingIfActive();
    const pool = allCards.filter((c) => c.id !== card.id);
    const next =
      pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : card;
    setCard(next);
    setHistory([
      {
        role: 'professor',
        text: `Следующий билет №${next.id}: «${next.question}». Слушаю ваш ответ!`,
      },
    ]);
    setInputText('');
    setFinalOutcome(null);
    setError('');
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#04070D]/80 backdrop-blur-md p-2 sm:p-4">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1522] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <GraduationCap className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F3F4F6] truncate">
                Устный экзамен до конца · Билет №{card.id}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] truncate">
                {card.chapter} · Раунд {Math.min(3, studentTurns + 1)} из 3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (autoSpeak) stopSpeaking();
                setAutoSpeak((s) => !s);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
            >
              {autoSpeak ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Озвучка вкл</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                  <span>Без звука</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handlePickNextTicket}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Другой билет</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                void stopRecordingIfActive();
                onClose();
              }}
              aria-label="Закрыть устный экзамен"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Question Banner */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B101B] flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
            {card.question}
          </p>
          {usingLocalDialog && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-200/80 dark:bg-white/[0.08] text-slate-700 dark:text-[#CBD5E1]">
                Автономный диалог по тезисам (3 шага)
              </span>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 border border-cyan-400/35 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/25 cursor-pointer"
                >
                  <Settings className="h-3 w-3" />
                  <span>Настройки режима</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chat Transcript */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-3 bg-white dark:bg-[#0E1522]"
        >
          {history.map((turn, idx) => (
            <div
              key={idx}
              className={`flex ${
                turn.role === 'student' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  turn.role === 'student'
                    ? 'prism-tab-active text-slate-900 dark:text-white'
                    : 'border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#131B2B] text-slate-900 dark:text-[#F3F4F6]'
                }`}
              >
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                    turn.role === 'student'
                      ? 'text-sky-100'
                      : 'text-sky-700 dark:text-sky-400'
                  }`}
                >
                  {turn.role === 'student' ? 'Вы (студент)' : 'Экзаменатор'}
                </p>
                <p>{turn.text}</p>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#131B2B] px-4 py-3 text-xs text-slate-600 dark:text-[#94A3B8] flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600 dark:text-sky-400" />
                <span>Преподаватель обдумывает уточняющий вопрос...</span>
              </div>
            </div>
          )}

          {finalOutcome && (
            <div className="rounded-xl border-2 border-emerald-300 dark:border-emerald-700/70 bg-emerald-50/70 dark:bg-emerald-950/25 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F3F4F6]">
                    Итоговая оценка: {finalOutcome.examGrade} из 5 (
                    {finalOutcome.scorePct}%)
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                  Записано в SM-2
                </span>
              </div>
              {finalOutcome.feedbackSummary && (
                <p className="text-xs sm:text-sm text-slate-700 dark:text-[#D1D5DB]">
                  {finalOutcome.feedbackSummary}
                </p>
              )}
              <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-800/50 space-y-1.5 text-xs">
                <p className="font-semibold text-slate-900 dark:text-[#F3F4F6]">
                  Эталонный тезис: {card.keyThesis}
                </p>
                {card.mathFormulaLatex && (
                  <MathBlock latex={card.mathFormulaLatex} displayMode={false} />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePickNextTicket}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg prism-cta cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Тянуть следующий билет</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
                >
                  Вернуться к подготовке
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Composer */}
        {!finalOutcome && (
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B101B] space-y-2.5"
          >
            {error && (
              <p className="text-xs text-rose-700 dark:text-rose-400">{error}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                rows={2}
                disabled={isSending}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isRecording
                    ? 'Говорите в микрофон — ваш ответ записывается...'
                    : isTranscribing
                      ? 'Расшифровка речи...'
                      : 'Ответьте голосом (кнопка микрофона) или введите текст...'
                }
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131B2B] text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSending || isTranscribing}
                  onClick={() => void handleToggleMic()}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                    isRecording
                      ? 'bg-rose-600 text-white hover:bg-rose-500'
                      : 'prism-cta'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-3.5 w-3.5" />
                      <span>Стоп записи</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5" />
                      <span>Ответить голосом</span>
                    </>
                  )}
                </button>

                {studentTurns > 0 && (
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => void sendTurnToProfessor(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer disabled:opacity-50"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    <span>Завершить и получить оценку</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSending || isTranscribing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-emerald-400 cursor-pointer disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Отправить ответ</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
