import {RecallGrade, TheoryCard} from '../types/study';
import {
  getAutonomousMode,
  getCardQuizPromptAndKeyword,
  getGeminiHeaders,
} from './cardHelpers';

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore browser speech errors
  }
}

export function speakRussianText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  rate = 1.02,
): void {
  if (!isSpeechSynthesisSupported()) {
    onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const cleaned = text
      .replace(/!==|!=/g, ' не равно ')
      .replace(/==/g, ' равно ')
      .replace(/->/g, ' стрелка ')
      .replace(/::=/g, ' определяется как ')
      .replace(/::/g, ' двойное двоеточие ')
      .replace(/&&/g, ' логическое И ')
      .replace(/\|\|/g, ' логическое ИЛИ ')
      .replace(/[«»"`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'ru-RU';
    utterance.rate = Math.max(0.7, Math.min(1.6, rate));

    const voices = window.speechSynthesis.getVoices();
    const ruVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('ru') && v.localService) ??
      voices.find((v) => v.lang.toLowerCase().startsWith('ru'));
    if (ruVoice) {
      utterance.voice = ruVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}

export function buildCardAnswerSpeechText(card: TheoryCard): string {
  const points = card.answerPoints.join(' ');
  return `Главный тезис: ${card.keyThesis}. Основные пункты ответа: ${points}. На экзамене обратите внимание: ${card.examTip}`;
}

/* Web Speech API SpeechRecognition type declarations */
export interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: {transcript: string};
    };
  };
}

export interface BrowserSpeechRecognitionErrorEvent {
  error: string;
}

export interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((e: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

export function createSpeechRecognition(): BrowserSpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  try {
    const rec = new Ctor();
    rec.lang = 'ru-RU';
    rec.continuous = true;
    rec.interimResults = true;
    return rec;
  } catch {
    return null;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = res.indexOf(',');
      resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
    };
    reader.onerror = () => reject(new Error('Failed to read audio blob'));
    reader.readAsDataURL(blob);
  });
}

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export type MicrophonePermissionState =
  | 'granted'
  | 'prompt'
  | 'denied'
  | 'unknown';

/**
 * Explicitly checks the browser's microphone permission state via the Permissions API.
 */
export async function queryMicrophonePermissionState(): Promise<MicrophonePermissionState> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.permissions ||
    typeof navigator.permissions.query !== 'function'
  ) {
    return 'unknown';
  }
  try {
    const status = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    });
    if (
      status.state === 'granted' ||
      status.state === 'prompt' ||
      status.state === 'denied'
    ) {
      return status.state;
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Subscribes to live changes in microphone permission state (e.g. when the user
 * grants access in the address bar or browser prompt).
 */
export async function subscribeToMicrophonePermission(
  onChange: (state: MicrophonePermissionState) => void,
): Promise<() => void> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.permissions ||
    typeof navigator.permissions.query !== 'function'
  ) {
    return () => {};
  }
  try {
    const status = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    });
    onChange(status.state as MicrophonePermissionState);
    const listener = () => {
      onChange(status.state as MicrophonePermissionState);
    };
    status.addEventListener?.('change', listener);
    return () => {
      status.removeEventListener?.('change', listener);
    };
  } catch {
    return () => {};
  }
}

export interface AcquireMicResult {
  stream: MediaStream | null;
  permissionState: MicrophonePermissionState;
  errorName?: string;
}

/**
 * Requests a live audio MediaStream via `navigator.mediaDevices.getUserMedia`
 * with an explicit permission check and multi-step retry mechanism:
 * - Attempt 1: Enhanced voice constraints (echoCancellation, noiseSuppression, autoGainControl)
 * - Attempt 2: Bare `{ audio: true }` fallback after a short settling delay
 * - Attempt 3: Re-checks `queryMicrophonePermissionState()`; if permission was just granted
 *   or is still promptable, waits and retries `{ audio: true }` so recently granted permissions
 *   never fail silently or trigger a false 'access denied' warning.
 */
export async function acquireMicrophoneStreamWithRetry(
  maxAttempts = 3,
  onPermissionChange?: (state: MicrophonePermissionState) => void,
): Promise<AcquireMicResult> {
  let permState = await queryMicrophonePermissionState();
  onPermissionChange?.(permState);

  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    return {
      stream: null,
      permissionState: permState,
      errorName: 'NotSupportedError',
    };
  }

  const constraintSequence: MediaStreamConstraints[] = [
    {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    },
    {audio: true},
    {audio: true},
  ];

  let lastErrorName = '';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const constraints =
      constraintSequence[Math.min(attempt, constraintSequence.length - 1)];

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const hasLiveTrack = stream
        .getAudioTracks()
        .some((t) => t.readyState === 'live' || t.enabled);

      if (hasLiveTrack) {
        onPermissionChange?.('granted');
        return {
          stream,
          permissionState: 'granted',
        };
      }
    } catch (err) {
      const domErr = err as {name?: string};
      lastErrorName = domErr?.name || 'UnknownError';
    }

    // Re-check explicit permission state after an attempt fails
    permState = await queryMicrophonePermissionState();
    onPermissionChange?.(permState);

    // Wait briefly before retrying (gives browser audio subsystem time to settle after user clicks "Allow")
    if (attempt < maxAttempts - 1) {
      await delayMs(280 * (attempt + 1));
    }
  }

  // Final check: if permission is actually 'granted', try one last bare getUserMedia call
  const finalPerm = await queryMicrophonePermissionState();
  onPermissionChange?.(finalPerm);
  if (finalPerm === 'granted') {
    try {
      await delayMs(250);
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      return {
        stream,
        permissionState: 'granted',
      };
    } catch (err) {
      const domErr = err as {name?: string};
      lastErrorName = domErr?.name || lastErrorName;
    }
  }

  return {
    stream: null,
    permissionState: finalPerm,
    errorName: lastErrorName,
  };
}

export interface HybridVoiceRecorderCallbacks {
  initialText: string;
  questionContext?: string;
  onLiveText: (text: string) => void;
  onTranscribingChange?: (isTranscribing: boolean) => void;
  onPermissionStateChange?: (state: MicrophonePermissionState) => void;
  onError: (message: string) => void;
  onStop?: () => void;
}

export interface HybridVoiceRecorderHandle {
  stop: () => Promise<string>;
}

/**
 * Starts a reliable hybrid microphone session:
 * 1. Acquires real microphone stream via `acquireMicrophoneStreamWithRetry` (`getUserMedia` with retry
 *    and explicit permission state checks) and records via `MediaRecorder`.
 * 2. Runs `SpeechRecognition` in parallel for live preview text while speaking, with automatic retry
 *    if `SpeechRecognition` initially fires `not-allowed` right after permission was granted.
 * 3. Never displays a false 'access denied' error when `getUserMedia` or `navigator.permissions`
 *    confirms microphone access is granted.
 */
export async function startHybridVoiceRecording(
  callbacks: HybridVoiceRecorderCallbacks,
): Promise<HybridVoiceRecorderHandle | null> {
  const prefix = callbacks.initialText.trim()
    ? `${callbacks.initialText.trim()} `
    : '';
  let liveCommitted = '';
  let liveInterim = '';
  let mediaStream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  const audioChunks: BlobPart[] = [];
  let recognition: BrowserSpeechRecognition | null = null;
  let recognitionRetried = false;
  let stopped = false;

  // Step 1: Acquire real microphone stream with retry and explicit permission state check
  const micResult = await acquireMicrophoneStreamWithRetry(
    3,
    callbacks.onPermissionStateChange,
  );
  mediaStream = micResult.stream;

  if (mediaStream && typeof MediaRecorder !== 'undefined') {
    const attachDataHandler = (rec: MediaRecorder) => {
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunks.push(ev.data);
        }
      };
    };

    try {
      const preferredMime = MediaRecorder.isTypeSupported(
        'audio/webm;codecs=opus',
      )
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';

      mediaRecorder = preferredMime
        ? new MediaRecorder(mediaStream, {mimeType: preferredMime})
        : new MediaRecorder(mediaStream);
      attachDataHandler(mediaRecorder);
      mediaRecorder.start(250);
    } catch {
      // Fallback: instantiate MediaRecorder with default browser settings so mediaStream is never wasted
      try {
        mediaRecorder = new MediaRecorder(mediaStream);
        attachDataHandler(mediaRecorder);
        mediaRecorder.start(250);
      } catch {
        mediaRecorder = null;
      }
    }
  }

  // Step 2: Also start browser SpeechRecognition if available for instant live preview
  const setupAndStartRecognition = () => {
    const rec = createSpeechRecognition();
    if (!rec) return null;

    rec.onresult = (event) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalChunk += `${res[0].transcript} `;
        } else {
          interim += res[0].transcript;
        }
      }
      if (finalChunk) {
        liveCommitted += finalChunk;
      }
      liveInterim = interim;
      const combined = `${prefix}${liveCommitted}${liveInterim}`.trimStart();
      if (combined) {
        callbacks.onLiveText(combined);
      }
    };

    rec.onerror = async (err) => {
      if (stopped) return;

      const hasActiveStream =
        Boolean(mediaStream && mediaStream.active) ||
        Boolean(mediaRecorder && mediaRecorder.state !== 'inactive');

      const latestPerm = await queryMicrophonePermissionState();
      callbacks.onPermissionStateChange?.(latestPerm);

      // If permission was just granted (or MediaRecorder is actively capturing audio),
      // do NOT fail or show a false "access denied" warning!
      if (hasActiveStream || latestPerm === 'granted') {
        if (
          !recognitionRetried &&
          (err.error === 'not-allowed' || err.error === 'service-not-allowed')
        ) {
          recognitionRetried = true;
          await delayMs(350);
          if (!stopped) {
            try {
              recognition = setupAndStartRecognition();
            } catch {
              // MediaRecorder continues capturing audio for server transcription
            }
          }
        }
        return;
      }

      if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
        callbacks.onError(
          'Доступ к микрофону ещё не подтверждён браузером. Нажмите «Повторить подключение к микрофону» или проверьте значок микрофона в адресной строке.',
        );
      }
    };

    try {
      rec.start();
      return rec;
    } catch {
      return null;
    }
  };

  recognition = setupAndStartRecognition();

  // Step 3: Verify we have at least one active capture path or handle recently granted permission
  const finalPermCheck = await queryMicrophonePermissionState();
  callbacks.onPermissionStateChange?.(finalPermCheck);

  if (!mediaStream && !mediaRecorder && !recognition) {
    if (finalPermCheck === 'granted') {
      callbacks.onError(
        'Разрешение на микрофон получено, но аудиопоток ещё инициализируется. Нажмите «Повторить подключение к микрофону».',
      );
    } else if (
      micResult.errorName === 'NotFoundError' ||
      micResult.errorName === 'DevicesNotFoundError'
    ) {
      callbacks.onError(
        'Аудиоустройство ввода (микрофон) не найдено в системе. Подключите микрофон или введите ответ текстом.',
      );
    } else {
      callbacks.onError(
        'Не удалось открыть микрофон. Если вы только что разрешили доступ в браузере, нажмите «Повторить подключение к микрофону».',
      );
    }
    return null;
  }

  const stop = async (): Promise<string> => {
    if (stopped) {
      return `${prefix}${liveCommitted}${liveInterim}`.trim();
    }
    stopped = true;

    if (recognition) {
      try {
        recognition.onend = null;
        recognition.stop();
      } catch {
        // ignore
      }
      recognition = null;
    }

    let recordedBlob: Blob | null = null;
    let recordedMime = 'audio/webm';

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      recordedMime = mediaRecorder.mimeType || 'audio/webm';
      await new Promise<void>((resolve) => {
        if (!mediaRecorder) {
          resolve();
          return;
        }
        mediaRecorder.onstop = () => resolve();
        try {
          mediaRecorder.stop();
        } catch {
          resolve();
        }
      });
      if (audioChunks.length > 0) {
        recordedBlob = new Blob(audioChunks, {type: recordedMime});
      }
    }

    if (mediaStream) {
      for (const track of mediaStream.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      mediaStream = null;
    }

    const browserSpeechText = `${liveCommitted}${liveInterim}`.trim();

    // If Autonomous Mode is enabled or browser SpeechRecognition already produced solid text, use it immediately
    if (getAutonomousMode() || browserSpeechText.length >= 12) {
      const fullText = `${prefix}${browserSpeechText}`.trim();
      if (fullText) {
        callbacks.onLiveText(fullText);
      }
      callbacks.onStop?.();
      return fullText;
    }

    // Otherwise, if we recorded audio via MediaRecorder, transcribe it via server-side Gemini!
    if (recordedBlob && recordedBlob.size > 400) {
      try {
        callbacks.onTranscribingChange?.(true);
        const base64 = await blobToBase64(recordedBlob);
        const resp = await fetch('/api/exam/transcribe', {
          method: 'POST',
          headers: getGeminiHeaders(),
          body: JSON.stringify({
            audioBase64: base64,
            mimeType: recordedMime,
            questionContext: callbacks.questionContext,
          }),
        });
        if (resp.ok) {
          const data = (await resp.json()) as {transcript?: string};
          const serverTranscript = (data.transcript ?? '').trim();
          if (serverTranscript) {
            const finalText = `${prefix}${serverTranscript}`.trim();
            callbacks.onLiveText(finalText);
            callbacks.onTranscribingChange?.(false);
            callbacks.onStop?.();
            return finalText;
          }
        }
      } catch {
        // fallback to whatever browserSpeechText had
      } finally {
        callbacks.onTranscribingChange?.(false);
      }
    }

    const finalFallback = `${prefix}${browserSpeechText}`.trim();
    if (finalFallback) {
      callbacks.onLiveText(finalFallback);
    }
    callbacks.onStop?.();
    return finalFallback;
  };

  return {stop};
}

export interface AnswerEvaluationResult {
  scorePct: number;
  recommendedGrade: RecallGrade;
  verdictTitle: string;
  verdictDetail: string;
  matchedKeywords: string[];
  missedKeywords: string[];
  followUpQuestion?: string;
  evaluatedBy?: 'professor-ai' | 'local-fallback';
}

/* Synonym dictionary so even local fallback understands human phrasing across АИП, Матан, and Ангем РК 2 */
const SYNONYM_GROUPS: string[][] = [
  ['массив', 'массива', 'индекс', 'элементы подряд', 'непрерывная область'],
  ['указатель', 'адрес', 'разыменование', 'звездочка', 'pointer', 'амперсанд'],
  ['ссылка', 'псевдоним', 'второе имя', 'алиас', 'reference'],
  ['стек', 'lifo', 'последним пришел', 'вершина стека', 'push', 'pop'],
  ['очередь', 'fifo', 'первым пришел', 'начало и конец', 'голова и хвост'],
  ['цикл', 'повторение', 'итерация', 'условие выхода', 'тело цикла'],
  ['предусловие', 'сначала проверяется', 'while', 'до выполнения'],
  ['постусловие', 'сначала выполняется', 'do while', 'хотя бы один раз'],
  ['рекурсия', 'вызов самой себя', 'базовый случай', 'условие остановки'],
  ['структура', 'struct', 'разнотипные поля', 'объединение данных'],
  ['динамическая память', 'куча', 'heap', 'new', 'delete', 'выделение памяти'],
  ['файл', 'поток', 'fstream', 'ifstream', 'ofstream', 'чтение и запись'],
  ['дерево', 'корень', 'узел', 'потомок', 'лист', 'левое и правое'],
  ['функция', 'подпрограмма', 'параметры', 'возвращаемое значение', 'прототип'],
  ['предел', 'стремится', 'окрестность', 'эпсилон', 'дельта', 'сходится'],
  ['производная', 'приращение', 'касательная', 'дифференциал', 'скорость изменения'],
  ['непрерывность', 'непрерывна', 'разрыв', 'скачок', 'устранимый', 'предел слева', 'предел справа'],
  ['тейлор', 'маклорен', 'пеано', 'остаточный член', 'многочлен', 'разложение'],
  ['лопиталь', 'неопределенность', 'отношение производных', 'ноль на ноль', 'бесконечность'],
  ['матрица', 'строка', 'столбец', 'транспонирование', 'обратная', 'вырожденная'],
  ['определитель', 'детерминант', 'минор', 'алгебраическое дополнение', 'ранг'],
  ['слау', 'система уравнений', 'гаусс', 'кронекер', 'капелли', 'фср', 'совместна'],
];

function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/ё/g, 'е').trim();
}

function getStem(word: string): string {
  const norm = normalizeWord(word);
  if (/^[a-z0-9_]+$/.test(norm)) {
    return norm;
  }
  if (norm.length >= 7) return norm.slice(0, 5);
  if (norm.length >= 5) return norm.slice(0, 4);
  return norm;
}

/**
 * Local human-toned fallback evaluator (used if backend API is unreachable).
 */
export function evaluateStudentAnswer(
  card: TheoryCard,
  userAnswer: string,
): AnswerEvaluationResult {
  const cleanUser = normalizeWord(userAnswer);
  if (!cleanUser) {
    return {
      scorePct: 0,
      recommendedGrade: 'again',
      verdictTitle: 'В ответ тишина — рекомендуется «1 · Не помню»',
      verdictDetail:
        'Пока вы ничего не ответили. На экзамене лучше начать хотя бы своими словами: объясните, зачем эта конструкция нужна и как она работает.',
      matchedKeywords: [],
      missedKeywords: [],
      evaluatedBy: 'local-fallback',
    };
  }

  const kwObj = getCardQuizPromptAndKeyword(card);
  const referenceSource = normalizeWord(
    `${kwObj.keyword} ${card.keyThesis} ${card.answerPoints.join(' ')}`,
  );

  // Check semantic clauses (thesis + answerPoints)
  const allClauses = [card.keyThesis, ...card.answerPoints.slice(0, 4)];
  const matchedIdeas: string[] = [];
  const missedIdeas: string[] = [];

  for (const clause of allClauses) {
    const clauseNorm = normalizeWord(clause);
    const words =
      clauseNorm
        .match(/[a-zA-Zа-яА-ЯёЁ0-9_]{4,}/g)
        ?.filter((w) => !['которая', 'которые', 'который', 'используется', 'позволяет', 'представляет'].includes(w)) ?? [];

    if (words.length === 0) continue;

    let hits = 0;
    for (const w of words) {
      const stem = getStem(w);
      let matched = cleanUser.includes(stem);
      if (!matched) {
        for (const group of SYNONYM_GROUPS) {
          if (
            group.some((g) => clauseNorm.includes(g)) &&
            group.some((g) => cleanUser.includes(g))
          ) {
            matched = true;
            break;
          }
        }
      }
      if (matched) hits++;
    }

    const ratio = hits / Math.max(1, Math.min(words.length, 5));
    const shortLabel =
      clause.length > 68 ? `${clause.slice(0, 65).trim()}...` : clause;

    if (ratio >= 0.32) {
      matchedIdeas.push(shortLabel);
    } else {
      missedIdeas.push(shortLabel);
    }
  }

  const mainKw = normalizeWord(kwObj.keyword);
  const mainHit =
    mainKw.length >= 2 &&
    (cleanUser.includes(mainKw) || cleanUser.includes(getStem(mainKw)));

  // Also check overall synonym/concept overlap
  let bonus = mainHit ? 20 : 0;
  for (const group of SYNONYM_GROUPS) {
    if (
      group.some((g) => referenceSource.includes(g)) &&
      group.some((g) => cleanUser.includes(g))
    ) {
      bonus += 15;
    }
  }

  const ideaRatio = matchedIdeas.length / Math.max(1, allClauses.length);
  const lengthFactor = cleanUser.split(/\s+/).length >= 8 ? 15 : 5;
  const scorePct = Math.min(
    100,
    Math.round(ideaRatio * 80 + bonus + (matchedIdeas.length > 0 ? lengthFactor : 0)),
  );

  const localFollowUp =
    missedIdeas[0]
      ? `Уточните своими словами: как именно здесь работает «${missedIdeas[0]}»?`
      : card.examTip
        ? `На защите часто ловят на нюансе: «${card.examTip}». Поясните, почему это важно?`
        : '';

  if (scorePct >= 76) {
    return {
      scorePct,
      recommendedGrade: 'easy',
      verdictTitle: 'Зачтено уверенно — «4 · Легко»',
      verdictDetail:
        'Отлично! Своими словами, но саму суть и ключевые условия ты объяснил верно. На экзамене за такой ответ ставится уверенный плюс.',
      matchedKeywords: matchedIdeas.slice(0, 4),
      missedKeywords: missedIdeas.slice(0, 2),
      followUpQuestion: '',
      evaluatedBy: 'local-fallback',
    };
  }

  if (scorePct >= 50) {
    return {
      scorePct,
      recommendedGrade: 'good',
      verdictTitle: 'Хорошее понимание сути — «3 · Хорошо»',
      verdictDetail:
        'Главная мысль верная, видно, что тему ты понимаешь. На экзамене ответ засчитывается, но стоит уточнить оставшиеся детали ниже.',
      matchedKeywords: matchedIdeas.slice(0, 4),
      missedKeywords: missedIdeas.slice(0, 3),
      followUpQuestion: localFollowUp,
      evaluatedBy: 'local-fallback',
    };
  }

  if (scorePct >= 24) {
    return {
      scorePct,
      recommendedGrade: 'hard',
      verdictTitle: 'Мысль в верную сторону, но сыро — «2 · Сложно»',
      verdictDetail:
        'Ты зацепил только часть темы, но для уверенного ответа на экзамене не хватает полной формулировки и условий. Посмотри эталон ниже.',
      matchedKeywords: matchedIdeas.slice(0, 3),
      missedKeywords: missedIdeas.slice(0, 3),
      followUpQuestion: localFollowUp,
      evaluatedBy: 'local-fallback',
    };
  }

  return {
    scorePct,
    recommendedGrade: 'again',
    verdictTitle: 'Так билет пока не сдать — «1 · Не помню»',
    verdictDetail:
      'В ответе пока не раскрыта суть вопроса. Разбери главный тезис на обороте карточки и попробуй объяснить его своими словами.',
    matchedKeywords: matchedIdeas.slice(0, 2),
    missedKeywords: missedIdeas.slice(0, 3),
    followUpQuestion: localFollowUp,
    evaluatedBy: 'local-fallback',
  };
}

/**
 * Calls the server-side Gemini Professor evaluator (`/api/exam/evaluate`)
 * for a strict, fair, human oral-exam assessment, falling back to `evaluateStudentAnswer` if offline or in Autonomous Mode.
 */
export async function evaluateStudentAnswerWithProfessor(
  card: TheoryCard,
  userAnswer: string,
): Promise<AnswerEvaluationResult> {
  const clean = userAnswer.trim();
  if (!clean || getAutonomousMode()) {
    return evaluateStudentAnswer(card, clean);
  }

  try {
    const resp = await fetch('/api/exam/evaluate', {
      method: 'POST',
      headers: getGeminiHeaders(),
      body: JSON.stringify({
        card: {
          id: card.id,
          chapter: card.chapter,
          question: card.question,
          keyThesis: card.keyThesis,
          answerPoints: card.answerPoints,
          examTip: card.examTip,
          codeSnippet: card.codeSnippet,
        },
        userAnswer: clean,
      }),
    });

    if (resp.ok) {
      const data = (await resp.json()) as AnswerEvaluationResult;
      if (data && typeof data.verdictTitle === 'string') {
        return data;
      }
    }
  } catch {
    // Fall back to local evaluator on network error
  }

  return evaluateStudentAnswer(card, clean);
}

export interface FollowUpEvaluationResult {
  passed: boolean;
  updatedScorePct: number;
  recommendedGrade: RecallGrade;
  professorReply: string;
}

/**
 * Evaluates a student's 1-round answer to the examiner's follow-up question (`/api/exam/followup`),
 * upgrading the recommended SM-2 grade when the student successfully defends their understanding.
 */
export async function evaluateFollowUpWithProfessor(
  card: TheoryCard,
  initialAnswer: string,
  followUpQuestion: string,
  followUpAnswer: string,
  initialScorePct: number,
): Promise<FollowUpEvaluationResult> {
  const clean = followUpAnswer.trim();
  if (!clean) {
    return {
      passed: false,
      updatedScorePct: initialScorePct,
      recommendedGrade: initialScorePct >= 55 ? 'good' : 'hard',
      professorReply:
        'Ответ на дополнительный вопрос пуст — попробуйте сформулировать короткое пояснение своими словами.',
    };
  }

  if (!getAutonomousMode()) {
    try {
      const resp = await fetch('/api/exam/followup', {
        method: 'POST',
        headers: getGeminiHeaders(),
        body: JSON.stringify({
          card: {
            id: card.id,
            question: card.question,
            keyThesis: card.keyThesis,
            answerPoints: card.answerPoints,
            examTip: card.examTip,
          },
          initialAnswer,
          followUpQuestion,
          followUpAnswer: clean,
          initialScorePct,
        }),
      });

      if (resp.ok) {
        const data = (await resp.json()) as FollowUpEvaluationResult;
        if (data && typeof data.professorReply === 'string') {
          return data;
        }
      }
    } catch {
      // Graceful local fallback if server is unavailable
    }
  }

  const localCheck = evaluateStudentAnswer(card, `${initialAnswer} ${clean}`);
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  const passed = localCheck.scorePct >= Math.max(45, initialScorePct + 5) || wordCount >= 7;
  const updatedScorePct = passed
    ? Math.min(100, Math.max(initialScorePct + 14, localCheck.scorePct))
    : initialScorePct;
  const recommendedGrade: RecallGrade =
    updatedScorePct >= 82
      ? 'easy'
      : updatedScorePct >= 55
        ? 'good'
        : updatedScorePct >= 28
          ? 'hard'
          : 'again';

  return {
    passed,
    updatedScorePct,
    recommendedGrade,
    professorReply: passed
      ? 'Хорошо, уточнение принято — логика понятна, балл можно повысить.'
      : 'Пока уточнение не до конца закрывает вопрос. Сверьтесь с эталонным ответом на обороте карточки.',
  };
}

