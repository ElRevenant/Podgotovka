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

/* Rich synonym groups so local evaluation understands natural human phrasing across Матан, Ангем, and АИП C++ */
const SYNONYM_GROUPS: string[][] = [
  // Number sets & real analysis foundations
  [
    'вещественн',
    'действительн',
    'не мним',
    'немним',
    'без мним',
    'не комплексн',
    'числовая прям',
    'числовая ос',
    'числовой прям',
    'числовой ос',
    'рациональн и иррациональн',
    'иррациональн',
    'бесконечные десятичн',
    'множество r',
  ],
  [
    'натуральн',
    'для счета',
    'целые положительн',
    'больше нуля цел',
    'счетные числа',
    '1 2 3',
  ],
  [
    'целые числ',
    'без дробн',
    'отрицательные ноль и положительные',
    'натуральные ноль и противоположные',
  ],
  [
    'рациональн',
    'отношение целых',
    'дробь p/q',
    'в виде дроби',
    'm/n',
    'конечная или периодическая',
  ],
  [
    'комплексн',
    'мнимая единиц',
    'a+bi',
    'мнимая част',
    'действительная и мнимая',
  ],
  [
    'окрестност',
    'интервал вокруг',
    'открытый интервал',
    'x0 - delta',
    'дельта окрестность',
    'проколотая',
    'без самой точки',
  ],
  [
    'супремум',
    'верхняя гран',
    'наименьшая из верхних',
    'точная верхняя',
    'sup',
  ],
  [
    'инфимум',
    'нижняя гран',
    'наибольшая из нижних',
    'точная нижняя',
    'inf',
  ],
  [
    'ограничен',
    'не превосход',
    'существует константа',
    'модуль меньше',
    'лежит в отрезке',
  ],
  [
    'бесконечно мал',
    'бмф',
    'б.м.ф',
    'стремится к нулю',
    'предел равен нулю',
    'предел 0',
    'стремится к 0',
  ],
  [
    'бесконечно больш',
    'ббф',
    'б.б.ф',
    'стремится к бесконечности',
    'предел бесконечность',
    'неограниченно растет',
  ],
  [
    'эквивалентн',
    'отношение стремится к единице',
    'предел отношения равен 1',
    'предел отношения 1',
  ],
  [
    'предел',
    'стремится',
    'окрестность',
    'эпсилон',
    'дельта',
    'сходится',
    'найдется номер',
    'для любого эпсилон',
  ],
  [
    'непрерывн',
    'без разрыв',
    'предел равен значению',
    'предел слева равен пределу справа',
    'разрыв',
    'скачок',
    'устранимый',
  ],
  [
    'производн',
    'приращение',
    'касательн',
    'дифференциал',
    'скорость изменения',
    'предел отношения приращений',
    'тангенс угла наклона',
  ],
  [
    'экстремум',
    'максимум',
    'минимум',
    'производная меняет знак',
    'стационарн',
    'критическая точк',
  ],
  [
    'выпукл',
    'вогнут',
    'перегиб',
    'вторая производн',
    'касательная лежит',
  ],
  [
    'асимптот',
    'расстояние стремится к нулю',
    'вертикальн',
    'наклонн',
    'горизонтальн',
  ],
  [
    'тейлор',
    'маклорен',
    'пеано',
    'остаточный член',
    'многочлен',
    'разложение',
  ],
  [
    'лопиталь',
    'неопределенност',
    'отношение производных',
    'ноль на ноль',
    'бесконечность на бесконечность',
  ],
  [
    'ролл',
    'лагранж',
    'коши',
    'ферма',
    'теорема о среднем',
    'найдется точка c',
  ],
  // Analytic geometry & linear algebra
  [
    'коллинеарн',
    'параллельн',
    'на одной прямой',
    'параллельны одной прямой',
    'пропорциональн',
    'векторное равно нулю',
  ],
  [
    'компланарн',
    'в одной плоскости',
    'параллельны одной плоскости',
    'смешанное равно нулю',
  ],
  [
    'ортогональн',
    'перпендикулярн',
    'угол 90',
    'прямой угол',
    'скалярное равно нулю',
    'скалярное произведение 0',
  ],
  [
    'скалярное произведен',
    'произведение длин на косинус',
    'сумма произведений координат',
    'результат число',
  ],
  [
    'векторное произведен',
    'перпендикулярен обоим',
    'площадь параллелограмма',
    'правая тройка',
    'длина на синус',
  ],
  [
    'смешанное произведен',
    'объем параллелепипеда',
    'определитель из координат',
  ],
  [
    'базис',
    'линейно независим',
    'любой вектор разлагается',
    'единственным образом',
    'разложение по базису',
  ],
  [
    'матриц',
    'строка',
    'столбец',
    'транспонирован',
    'обратная',
    'единичная',
    'прямоугольная таблица',
  ],
  [
    'невырожденн',
    'определитель не равен нулю',
    'детерминант не ноль',
    'det != 0',
    'обратимая',
  ],
  [
    'вырожденн',
    'определитель равен нулю',
    'детерминант 0',
    'det = 0',
    'обратной не существует',
  ],
  [
    'определитель',
    'детерминант',
    'минор',
    'алгебраическое дополнение',
    'ранг',
    'базисный минор',
  ],
  [
    'слау',
    'система уравнений',
    'гаусс',
    'кронекер',
    'капелли',
    'фср',
    'совместна',
    'ранг основной равен расширенной',
  ],
  [
    'квадрик',
    'кривая второго порядка',
    'эллипс',
    'гипербола',
    'парабола',
    'инвариант',
    'поворот осей',
    'канонический вид',
  ],
  [
    'поверхност',
    'метод сечений',
    'цилиндр',
    'конус',
    'поверхность вращения',
    'эллипсоид',
    'параболоид',
    'гиперболоид',
  ],
  // C++ / АИП
  ['массив', 'индекс', 'элементы подряд', 'непрерывная область', 'однотипн'],
  ['указатель', 'хранит адрес', 'адрес', 'разыменование', 'звездочка', 'pointer', 'амперсанд', 'void*'],
  ['ссылка', 'псевдоним', 'второе имя', 'алиас', 'alias', 'reference', 'нельзя перенаправить'],
  ['стек', 'lifo', 'последний пришел первый ушел', 'последним пришел', 'вершина стека', 'push', 'pop'],
  ['очередь', 'fifo', 'первый пришел первый ушел', 'первым пришел', 'начало и конец', 'голова и хвост'],
  ['дек', 'с обоих концов', 'в начало и конец'],
  ['цикл', 'повторение', 'итерация', 'условие выхода', 'тело цикла'],
  ['предусловие', 'сначала проверяется', 'while', 'до выполнения'],
  ['постусловие', 'сначала выполняется', 'do while', 'хотя бы один раз'],
  ['рекурсия', 'вызов самой себя', 'базовый случай', 'базис рекурсии', 'условие остановки'],
  ['структура', 'struct', 'разнотипные поля', 'объединение данных'],
  ['объединение', 'union', 'общая область памяти', 'одно поле'],
  ['динамическая память', 'куча', 'heap', 'new', 'delete', 'malloc', 'free', 'утечка'],
  ['файл', 'поток', 'fstream', 'ifstream', 'ofstream', 'fopen', 'fclose', 'fseek', 'ftell', 'file*'],
  ['дерево', 'корень', 'узел', 'потомок', 'лист', 'левое и правое', 'поддерево', 'обход'],
  ['функция', 'подпрограмма', 'процедура', 'void', 'параметры', 'возвращаемое значение', 'прототип', 'inline'],
  ['синтаксис', 'правила записи', 'форма конструкций', 'рбнф', 'бнф'],
  ['семантика', 'смысл конструкций', 'содержание'],
  ['пространство имен', 'namespace', 'конфликт имен', 'std', 'глобальное'],
];

interface SemanticEquivalenceRule {
  /** Substrings (normalized) that identify this card's topic in question/thesis */
  cardSignals: string[];
  /** Intuitive / mathematically equivalent phrases a student may write */
  studentPatterns: RegExp[];
  /** Minimum fair score granted when the student's answer hits this conceptual equivalence */
  minScore: number;
  /** Short readable matched concept label */
  conceptLabel: string;
}

/**
 * Direct conceptual equivalences so valid intuitive definitions (like
 * "множество R — это любое не мнимое число") are NEVER unfairly marked "Не помню".
 */
const SEMANTIC_EQUIVALENCES: SemanticEquivalenceRule[] = [
  {
    cardSignals: ['вещественн', 'действительн', 'множество r', 'множество чисел r', '\\mathbb{r}'],
    studentPatterns: [
      /не\s*мним/i,
      /без\s+мним/i,
      /не\s+комплексн/i,
      /на\s+числов(ой|ую)\s+(прям|ос)/i,
      /рациональн.*иррациональн|иррациональн.*рациональн/i,
      /любое\s+(обычн|реальн|вещественн|действительн)/i,
      /все\s+(действительн|вещественн|реальн|обычн)/i,
      /бесконечн.*десятичн/i,
    ],
    minScore: 68,
    conceptLabel: 'Интуитивно верное определение множества ℝ (действительные / не мнимые числа)',
  },
  {
    cardSignals: ['натуральн', '\\mathbb{n}'],
    studentPatterns: [
      /для\s+счет/i,
      /цел\w*\s+положительн/i,
      /положительн\w*\s+цел/i,
      /1\s*,?\s*2\s*,?\s*3/i,
    ],
    minScore: 68,
    conceptLabel: 'Верная суть натуральных чисел ℕ',
  },
  {
    cardSignals: ['целые числ', 'множество z', '\\mathbb{z}'],
    studentPatterns: [
      /без\s+дробн/i,
      /отрицательн.*нол.*положительн|натуральн.*нол.*отрицательн/i,
      /натуральн.*противоположн/i,
    ],
    minScore: 68,
    conceptLabel: 'Верная суть множества целых чисел ℤ',
  },
  {
    cardSignals: ['рациональн', 'множество q', '\\mathbb{q}'],
    studentPatterns: [
      /в\s+виде\s+дроб/i,
      /отношен\w*\s+(двух\s+)?цел/i,
      /p\s*\/\s*q|m\s*\/\s*n/i,
      /периодическ\w*\s+десятичн/i,
    ],
    minScore: 68,
    conceptLabel: 'Верная суть множества рациональных чисел ℚ',
  },
  {
    cardSignals: ['иррациональн'],
    studentPatterns: [
      /нельзя\s+(представить|записать)\s+(в\s+виде\s+)?дроб/i,
      /не\s+представим\w*\s+дроб/i,
      /бесконечн\w*\s+непериодическ/i,
    ],
    minScore: 68,
    conceptLabel: 'Верная суть иррациональных чисел',
  },
  {
    cardSignals: ['бесконечно мал', 'б.м.ф', 'бмф'],
    studentPatterns: [
      /стремит\w*\s+к\s*(0|нул)/i,
      /предел\s+(равен\s+|=\s*)?(0|нул)/i,
    ],
    minScore: 66,
    conceptLabel: 'Верная суть б.м.ф. (предел равен 0)',
  },
  {
    cardSignals: ['бесконечно больш', 'б.б.ф', 'ббф'],
    studentPatterns: [
      /стремит\w*\s+к\s*бесконечн/i,
      /предел\s+(равен\s+|=\s*)?бесконечн/i,
      /неограничен\w*\s+(раст|возраста|увелич)/i,
    ],
    minScore: 66,
    conceptLabel: 'Верная суть б.б.ф. (стремится к бесконечности)',
  },
  {
    cardSignals: ['непрерывн'],
    studentPatterns: [
      /предел\s+(равен|совпадает)\s+.*значен/i,
      /без\s+(разрыв|скачк|отрыва)/i,
      /односторонн\w*\s+предел\w*\s+равн/i,
    ],
    minScore: 64,
    conceptLabel: 'Верное понимание непрерывности функции',
  },
  {
    cardSignals: ['ортогональн'],
    studentPatterns: [
      /перпендикулярн/i,
      /угол\s*(равен\s*|=\s*)?90|прям\w*\s+угол/i,
      /скалярн\w*\s+(произведен\w*\s+)?(равн\w*\s+|=\s*)?(0|нул)/i,
    ],
    minScore: 68,
    conceptLabel: 'Верное понимание ортогональности',
  },
  {
    cardSignals: ['коллинеарн'],
    studentPatterns: [
      /параллельн/i,
      /на\s+одной\s+прям/i,
      /координат\w*\s+пропорциональн/i,
    ],
    minScore: 68,
    conceptLabel: 'Верное понимание коллинеарности',
  },
  {
    cardSignals: ['компланарн'],
    studentPatterns: [
      /в\s+одной\s+плоскост/i,
      /параллельн\w*\s+одной\s+плоскост/i,
      /смешанн\w*\s+(произведен\w*\s+)?(равн\w*\s+|=\s*)?(0|нул)/i,
    ],
    minScore: 68,
    conceptLabel: 'Верное понимание компланарности',
  },
  {
    cardSignals: ['невырожденн'],
    studentPatterns: [
      /(определитель|детерминант|det)\s*(не\s*равен|!=|≠)\s*(0|нул)/i,
    ],
    minScore: 68,
    conceptLabel: 'Верное условие невырожденности (det ≠ 0)',
  },
  {
    cardSignals: ['вырожденн'],
    studentPatterns: [
      /(определитель|детерминант|det)\s*(равен|=)\s*(0|нул)/i,
    ],
    minScore: 68,
    conceptLabel: 'Верное условие вырожденности (det = 0)',
  },
  {
    cardSignals: ['ссылка', 'ссылки'],
    studentPatterns: [
      /второе\s+имя|псевдоним|алиас|alias/i,
      /нельзя\s+перенаправ/i,
    ],
    minScore: 66,
    conceptLabel: 'Верное определение ссылки (псевдоним / второе имя)',
  },
  {
    cardSignals: ['указатель', 'указатели'],
    studentPatterns: [
      /хранит\s+адрес|содержит\s+адрес|переменная.*адрес/i,
    ],
    minScore: 66,
    conceptLabel: 'Верное определение указателя (хранит адрес)',
  },
  {
    cardSignals: ['стек', 'lifo'],
    studentPatterns: [
      /последн\w*\s+(приш|заш|вош).*перв\w*\s+(уш|выш)/i,
      /lifo/i,
      /с\s+одного\s+конц/i,
    ],
    minScore: 66,
    conceptLabel: 'Верный принцип стека (LIFO)',
  },
  {
    cardSignals: ['очеред', 'fifo'],
    studentPatterns: [
      /перв\w*\s+(приш|заш|вош).*перв\w*\s+(уш|выш)/i,
      /fifo/i,
      /в\s+конец.*из\s+начал/i,
    ],
    minScore: 66,
    conceptLabel: 'Верный принцип очереди (FIFO)',
  },
];

const STOP_WORDS = new Set([
  'это',
  'или',
  'для',
  'при',
  'как',
  'что',
  'где',
  'если',
  'тогда',
  'которая',
  'которые',
  'который',
  'которое',
  'используется',
  'позволяет',
  'представляет',
  'называется',
  'называют',
  'является',
  'такое',
  'такой',
  'такие',
  'между',
  'через',
  'после',
  'перед',
  'всегда',
  'может',
  'можно',
  'нужно',
  'быть',
]);

function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"“”„'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getStem(word: string): string {
  const norm = normalizeWord(word);
  if (/^[a-z0-9_]+$/.test(norm)) {
    return norm;
  }
  if (norm.length >= 8) return norm.slice(0, 6);
  if (norm.length >= 6) return norm.slice(0, 5);
  if (norm.length >= 4) return norm.slice(0, 4);
  return norm;
}

function extractMeaningfulWords(text: string): string[] {
  const matches = normalizeWord(text).match(/[a-zа-я0-9_]{3,}/g) ?? [];
  return matches.filter((w) => !STOP_WORDS.has(w));
}

/**
 * Local human-toned fallback evaluator (used if backend API is unreachable or in Autonomous Mode).
 * Understands synonyms, intuitive mathematical paraphrases, and concise accurate definitions.
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
  const fullCardContext = normalizeWord(
    `${card.question} ${kwObj.keyword} ${card.keyThesis} ${card.answerPoints.join(' ')} ${card.mathFormulaLatex ?? ''}`,
  );
  const referenceSource = normalizeWord(
    `${kwObj.keyword} ${card.keyThesis} ${card.answerPoints.join(' ')}`,
  );

  // 1. Check direct conceptual equivalences (prevents false "again" on valid intuitive paraphrases!)
  let semanticFloorScore = 0;
  const semanticHits: string[] = [];
  for (const rule of SEMANTIC_EQUIVALENCES) {
    const cardMatches = rule.cardSignals.some((sig) =>
      fullCardContext.includes(normalizeWord(sig)),
    );
    if (!cardMatches) continue;
    if (rule.studentPatterns.some((rx) => rx.test(cleanUser))) {
      semanticFloorScore = Math.max(semanticFloorScore, rule.minScore);
      semanticHits.push(rule.conceptLabel);
    }
  }

  // 2. Check semantic clauses (thesis + answerPoints)
  const allClauses = [card.keyThesis, ...card.answerPoints.slice(0, 4)];
  const matchedIdeas: string[] = [...semanticHits];
  const missedIdeas: string[] = [];
  let thesisMatched = false;

  for (let idx = 0; idx < allClauses.length; idx++) {
    const clause = allClauses[idx];
    const clauseNorm = normalizeWord(clause);
    const words = extractMeaningfulWords(clauseNorm);
    if (words.length === 0) continue;

    let hits = 0;
    let groupHitInClause = false;
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
            groupHitInClause = true;
            break;
          }
        }
      }
      if (matched) hits++;
    }

    const ratio = hits / Math.max(1, Math.min(words.length, 5));
    const shortLabel =
      clause.length > 68 ? `${clause.slice(0, 65).trim()}...` : clause;

    if (ratio >= 0.25 || (groupHitInClause && ratio >= 0.18)) {
      if (idx === 0) thesisMatched = true;
      matchedIdeas.push(shortLabel);
    } else {
      missedIdeas.push(shortLabel);
    }
  }

  const mainKw = normalizeWord(kwObj.keyword);
  const mainHit =
    mainKw.length >= 2 &&
    (cleanUser.includes(mainKw) || cleanUser.includes(getStem(mainKw)));

  // 3. Synonym group overlap across the whole card (question + answer)
  let groupBonus = mainHit ? 20 : 0;
  let matchedGroupCount = 0;
  for (const group of SYNONYM_GROUPS) {
    if (
      group.some((g) => fullCardContext.includes(g)) &&
      group.some((g) => cleanUser.includes(g))
    ) {
      matchedGroupCount++;
      groupBonus += matchedGroupCount <= 2 ? 22 : 12;
    }
  }

  // 4. Token-level precision bonus for concise, accurate answers
  const userWords = extractMeaningfulWords(cleanUser);
  const refWords = new Set(extractMeaningfulWords(referenceSource).map(getStem));
  let userRefHits = 0;
  for (const uw of userWords) {
    const st = getStem(uw);
    if (refWords.has(st) || referenceSource.includes(st)) {
      userRefHits++;
    }
  }
  const precisionRatio =
    userWords.length > 0 ? userRefHits / userWords.length : 0;
  const conciseAccuracyBonus =
    userWords.length >= 2 && precisionRatio >= 0.45 ? 18 : 0;

  const clauseMatchCount = matchedIdeas.length - semanticHits.length;
  const ideaRatio = clauseMatchCount / Math.max(1, allClauses.length);
  const thesisBonus = thesisMatched ? 14 : 0;
  const lengthBonus =
    userWords.length >= 6 && (clauseMatchCount > 0 || matchedGroupCount > 0)
      ? 10
      : userWords.length >= 2 && (clauseMatchCount > 0 || matchedGroupCount > 0)
        ? 6
        : 0;

  const rawScore = Math.round(
    ideaRatio * 70 +
      groupBonus +
      thesisBonus +
      conciseAccuracyBonus +
      lengthBonus,
  );
  const scorePct = Math.min(100, Math.max(rawScore, semanticFloorScore));

  const localFollowUp =
    missedIdeas[0]
      ? `Уточните своими словами (для строгой формулировки): как здесь устроено «${missedIdeas[0]}»?`
      : card.examTip
        ? `На защите часто ловят на нюансе: «${card.examTip}». Поясните, почему это важно?`
        : '';

  if (scorePct >= 74) {
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

  if (scorePct >= 48) {
    return {
      scorePct,
      recommendedGrade: 'good',
      verdictTitle: 'Суть понята верно — «3 · Хорошо»',
      verdictDetail:
        semanticHits.length > 0
          ? 'По смыслу ответ верный! Ты дал понятное интуитивное определение. Для идеала на устной защите добавь строгую формулировку из эталона ниже.'
          : 'Главная мысль верная, видно, что тему ты понимаешь. На экзамене ответ засчитывается, но стоит уточнить оставшиеся детали ниже.',
      matchedKeywords: matchedIdeas.slice(0, 4),
      missedKeywords: missedIdeas.slice(0, 3),
      followUpQuestion: localFollowUp,
      evaluatedBy: 'local-fallback',
    };
  }

  if (scorePct >= 22) {
    return {
      scorePct,
      recommendedGrade: 'hard',
      verdictTitle: 'Мысль в верную сторону, но неполно — «2 · Сложно»',
      verdictDetail:
        'Ты зацепил верное направление, но для уверенного ответа на экзамене не хватает полной формулировки и условий. Посмотри эталон ниже.',
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

