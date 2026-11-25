import 'dotenv/config';
import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import {GoogleGenAI, ThinkingLevel, Type} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isNoApiKeyError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : '';
  return msg.includes('NO_API_KEY') || msg.includes('GEMINI_API_KEY is not configured');
}

function isTransientOrOverloadError(err: unknown): boolean {
  if (isNoApiKeyError(err)) return true;
  const msg =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === 'string'
        ? err
        : JSON.stringify(err ?? '');
  const lower = msg.toLowerCase();
  return (
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('overloaded') ||
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('504') ||
    lower.includes('internal') ||
    lower.includes('deadline_exceeded') ||
    lower.includes('fetch failed') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout')
  );
}

function formatGeminiError(err: unknown, defaultRussianMsg: string): string {
  if (isNoApiKeyError(err)) {
    return 'Включён автономный режим проверки без внешнего ИИ-сервера.';
  }
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : defaultRussianMsg;
  if (isTransientOrOverloadError(raw)) {
    return 'Сервер нейросети сейчас испытывает высокую нагрузку (503). Пожалуйста, повторите попытку через несколько секунд.';
  }
  if (raw.trim().startsWith('{') && raw.includes('"error"')) {
    try {
      const parsed = JSON.parse(raw);
      const apiMsg = parsed?.error?.message;
      if (typeof apiMsg === 'string' && apiMsg.trim()) {
        return `${defaultRussianMsg}: ${apiMsg}`;
      }
    } catch {
      // fall through
    }
  }
  return raw || defaultRussianMsg;
}

function parseJsonSafely<T = Record<string, any>>(rawText: string | undefined): T {
  const cleaned = (rawText ?? '{}')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned || '{}') as T;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type GenerateContentParams = Parameters<GoogleGenAI['models']['generateContent']>[0];

async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: GenerateContentParams,
  options?: {
    fallbackModels?: string[];
    maxAttemptsPerModel?: number;
  },
) {
  const primaryModel = params.model;
  const defaultFallbacks =
    primaryModel === 'gemini-4-hydrogen'
      ? ['gemini-3.1-flash-lite']
      : primaryModel === 'gemini-3.5-transcribe'
        ? ['gemini-3.1-flash-lite', 'gemini-4-hydrogen']
        : primaryModel === 'gemini-3.8-flash-tts'
          ? ['gemini-3.8-flash-lite-tts']
          : primaryModel === 'gemini-3.8-flash-lite-tts'
            ? ['gemini-3.8-flash-tts']
            : [];

  const modelsToTry = [
    primaryModel,
    ...(options?.fallbackModels ?? defaultFallbacks),
  ];
  const maxAttempts = options?.maxAttemptsPerModel ?? 2;
  let lastError: unknown;

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const currentModel = modelsToTry[mIdx];
    const requestParams: GenerateContentParams = {
      ...params,
      model: currentModel,
    };

    // When falling back to gemini-3.1-flash-lite, remove thinkingConfig to maximize compatibility & speed
    if (
      currentModel === 'gemini-3.1-flash-lite' &&
      requestParams.config &&
      'thinkingConfig' in requestParams.config
    ) {
      const nextConfig = {...requestParams.config};
      delete nextConfig.thinkingConfig;
      requestParams.config = nextConfig;
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await ai.models.generateContent(requestParams);
      } catch (err) {
        lastError = err;
        const transient = isTransientOrOverloadError(err);
        const hasMoreAttemptsOnCurrent = attempt < maxAttempts;
        const hasNextModel = mIdx < modelsToTry.length - 1;

        if (!transient && !hasNextModel) {
          throw err;
        }

        if (transient && hasMoreAttemptsOnCurrent) {
          const delayMs =
            attempt * 650 + Math.floor(Math.random() * 350);
          await sleep(delayMs);
          continue;
        }

        if (hasNextModel) {
          await sleep(250);
          break;
        }
      }
    }
  }

  throw lastError ?? new Error('Не удалось получить ответ от модели ИИ.');
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support audio payloads up to 15MB
  app.use(express.json({limit: '15mb'}));

  // 1. Audio Transcription Endpoint (for reliable microphone recording in iframes & all browsers)
  app.post('/api/exam/transcribe', async (req, res) => {
    try {
      const {audioBase64, mimeType, questionContext} = req.body ?? {};
      if (!audioBase64 || typeof audioBase64 !== 'string') {
        res.status(400).json({error: 'Не переданы аудиоданные для распознавания.'});
        return;
      }

      const ai = getGenAIClient();
      const safeMime =
        typeof mimeType === 'string' && mimeType.trim()
          ? mimeType.split(';')[0].trim()
          : 'audio/webm';

      const audioPart = {
        inlineData: {
          mimeType: safeMime,
          data: audioBase64,
        },
      };

      const contextHint = questionContext
        ? `Контекст: студент устно отвечает на экзамене по программированию C/C++, аналитической геометрии/линейной алгебре (матрицы, ранг, минор, определитель, обратная матрица, СЛАУ, ФСР, метод Гаусса, Кронекер-Капелли) или математическому анализу (предел, последовательность, Коши, Вейерштрасс, Больцано-Коши, Лагранж, Ролль, Лопиталь, Тейлор, Маклорен, остаток Пеано, производная, дифференциал, асимптота, перегиб, бесконечно малая, эквивалентность): «${questionContext}». `
        : 'Контекст: устный ответ студента на экзамене по C/C++, линейной алгебре или математическому анализу. ';

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            {
              text: `${contextHint}Расшифруй речь на русском языке максимально точно, сохраняя математические термины (предел, эпсилон, дельта, супремум, инфимум, бесконечно малая, о-малое, Коши, Больцано, Вейерштрасс, Ферма, Ролль, Лагранж, Лопиталь, Тейлор, Маклорен, Пеано, асимптота, выпуклость, перегиб, разрыв первого рода, матрица, транспонирование, определитель, минор, ранг, СЛАУ, ФСР, Кронекер-Капелли, Крамер, метод Гаусса) и термины C/C++ (int, char, float, double, struct, while, for, switch, break, continue, return, cin, cout, nullptr, new, delete, стек, очередь, дерево, указатель, ссылка). Выведи только распознанный текст ответа без своих комментариев.`,
            },
          ],
        },
      });
      const transcript = (response.text ?? '').trim();

      res.json({transcript});
    } catch (error) {
      const msg = formatGeminiError(error, 'Ошибка распознавания аудио');
      res.status(500).json({error: msg});
    }
  });

  // 2. Strict but Fair & Human Professor Evaluation Endpoint
  app.post('/api/exam/evaluate', async (req, res) => {
    try {
      const {card, userAnswer} = req.body ?? {};
      if (!card || typeof card.question !== 'string') {
        res.status(400).json({error: 'Не переданы данные карточки вопроса.'});
        return;
      }

      const cleanAnswer = typeof userAnswer === 'string' ? userAnswer.trim() : '';
      if (!cleanAnswer) {
        res.json({
          scorePct: 0,
          recommendedGrade: 'again',
          verdictTitle: 'В ответ тишина — «1 · Не помню»',
          verdictDetail:
            'Вы пока ничего не сказали по билету. Не страшно: откройте эталон, спокойно прочитайте главную мысль и попробуйте пересказать её своими словами.',
          matchedKeywords: [],
          missedKeywords: [],
          followUpQuestion: '',
          evaluatedBy: 'professor-ai',
        });
        return;
      }

      const ai = getGenAIClient();
      const isRkCard =
        card.category === 'rk' ||
        (typeof card.id === 'number' && card.id >= 200 && card.id < 400) ||
        String(card.chapter ?? '').startsWith('РК') ||
        String(card.chapter ?? '').startsWith('Ангем');

      const isMatanCard =
        card.category === 'matan' ||
        (typeof card.id === 'number' && card.id >= 500 && card.id < 700) ||
        String(card.chapter ?? '').startsWith('Матан');

      const subjectDescription = isRkCard
        ? 'экзамен и рубежные контроли (РК 1 и РК 2) по курсу «Аналитическая геометрия» (1 семестр: векторы, базисы, скалярное/векторное/смешанное произведения, прямая и плоскость, матрицы, обратная матрица, ранг, СЛАУ, ФСР, кривые и поверхности 2-го порядка)'
        : isMatanCard
          ? 'устный экзамен по курсу «Математический анализ» (1 семестр: числовые множества, пределы, бесконечно малые и эквивалентные, непрерывность и разрывы, производная и дифференциал, теоремы Ролля/Лагранжа/Коши, Лопиталь, формула Тейлора, исследование функций и асимптоты)'
          : 'устный экзамен по курсу «Алгоритмизация и программирование» (1 семестр, язык C/C++)';

      const systemInstruction = `Ты — опытный, справедливый, живой и человечный преподаватель МГТУ им. Н.Э. Баумана, принимающий ${subjectDescription}.

Твоя главная задача — оценить ответ студента ПО СМЫСЛУ И ПОНИМАНИЮ СУТИ, а НЕ по буквоедскому совпадению отдельных слов со слайда или методички!

ПРАВИЛА СПРАВЕДЛИВОГО И ЧЕЛОВЕЧНОГО ОЦЕНИВАНИЯ:
1. Никакого буквоедства и придирок к неформальной речи: студент отвечает вживую своими словами. Если он дал краткое, интуитивное, но математически/логически ВЕРНОЕ по сути определение или эквивалентную формулировку (например: «множество ℝ — это любое не мнимое число» или «все числа на числовой прямой», «ортогональные — значит перпендикулярные», «б.м.ф. — стремится к нулю», «ссылка — второе имя переменной») — НИКОГДА не ставь «again» («Не помню»)! Такой ответ показывает верное понимание концепции: ставь «good» (55–79%), а если не хватает строгости формального определения из учебника — просто подскажи строгую формулировку в уточняющем вопросе.
2. Учитывай погрешности микрофона и устной записи формул: если студент произносит формулы словами («ранг равен эн минус эр», «детерминант не ноль», «си плюс плюс», «поинтер») — понимай по контексту и никогда не снижай оценку за форму записи.
3. Когда реально ставить низкую оценку:
   - «again» (0..24) — ТОЛЬКО за пустой ответ, полную бессмыслицу или прямое фактическое противоречие (например, перепутал стек LIFO и очередь FIFO, сказал что у вырожденной матрицы det ≠ 0, перепутал порядок (AB)⁻¹ = B⁻¹A⁻¹).
   - «hard» (25..54) — если студент назвал лишь фрагмент сути, сильно путается в условии или упустил ключевую половину теоремы/доказательства.
   - «good» (55..79) — суть схвачена верно (в том числе своими словами или интуитивно), студент понимает тему, хотя ответ краткий или не хватает 1–2 формальных деталей.
   - «easy» (80..100) — уверенное, точное понимание сути с ключевыми условиями/формулами.
4. Тон обращения (verdictDetail):
   - Говори от первого лица, как живой, доброжелательный и честный преподаватель напротив студента (2–4 предложения).
5. В полях matchedKeywords и missedKeywords пиши короткие СМЫСЛОВЫЕ ТЕЗИСЫ (по 2–5 слов).`;

      const prompt = `ЭКЗАМЕНАЦИОННЫЙ БИЛЕТ №${card.id} (${card.chapter})
Вопрос: ${card.question}

Опорный материал из лекции (для понимания темы, НЕ требуй дословного цитирования!):
- Главная суть: ${card.keyThesis}
- Основные смысловые моменты: ${(card.answerPoints ?? []).join(' | ')}
${card.examTip ? `- Подводный камень на экзамене: ${card.examTip}` : ''}

ОТВЕТ СТУДЕНТА:
"""
${cleanAnswer}
"""

Оцени ответ как строгий, но человечный и понимающий преподаватель.`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scorePct: {
                type: Type.INTEGER,
                description: 'Оценка понимания сути вопроса от 0 до 100',
              },
              recommendedGrade: {
                type: Type.STRING,
                description:
                  'Рекомендуемая оценка SM-2: строго одно из значений "again", "hard", "good", "easy"',
              },
              verdictTitle: {
                type: Type.STRING,
                description:
                  'Короткий живой вердикт преподавателя (например: "Зачтено! Своими словами, но в самую точку" или "Мысль верная, но упущен важный нюанс")',
              },
              verdictDetail: {
                type: Type.STRING,
                description:
                  'Живой человечный комментарий преподавателя от первого лица (2-4 предложения): что понято верно, в чём неточность и почему выставлена такая оценка',
              },
              matchedKeywords: {
                type: Type.ARRAY,
                items: {type: Type.STRING},
                description:
                  'Смысловые идеи и понятия (по 2-5 слов), которые студент раскрыл верно (до 5 пунктов)',
              },
              missedKeywords: {
                type: Type.ARRAY,
                items: {type: Type.STRING},
                description:
                  'Важные смысловые моменты (по 2-5 слов), которые студент упустил или перепутал (до 4 пунктов)',
              },
              followUpQuestion: {
                type: Type.STRING,
                description:
                  'Короткий дополнительный вопрос от экзаменатора на понимание (если есть что уточнить) или пустая строка',
              },
            },
            required: [
              'scorePct',
              'recommendedGrade',
              'verdictTitle',
              'verdictDetail',
              'matchedKeywords',
              'missedKeywords',
            ],
          },
        },
      });

      const parsed = parseJsonSafely(response.text);

      const validGrades = new Set(['again', 'hard', 'good', 'easy']);
      const recommendedGrade = validGrades.has(parsed.recommendedGrade)
        ? parsed.recommendedGrade
        : parsed.scorePct >= 80
          ? 'easy'
          : parsed.scorePct >= 55
            ? 'good'
            : parsed.scorePct >= 25
              ? 'hard'
              : 'again';

      res.json({
        scorePct: Math.max(0, Math.min(100, Number(parsed.scorePct) || 0)),
        recommendedGrade,
        verdictTitle:
          typeof parsed.verdictTitle === 'string' && parsed.verdictTitle.trim()
            ? parsed.verdictTitle.trim()
            : 'Ответ проверен экзаменатором',
        verdictDetail:
          typeof parsed.verdictDetail === 'string' && parsed.verdictDetail.trim()
            ? parsed.verdictDetail.trim()
            : '',
        matchedKeywords: Array.isArray(parsed.matchedKeywords)
          ? parsed.matchedKeywords.slice(0, 6)
          : [],
        missedKeywords: Array.isArray(parsed.missedKeywords)
          ? parsed.missedKeywords.slice(0, 5)
          : [],
        followUpQuestion:
          typeof parsed.followUpQuestion === 'string'
            ? parsed.followUpQuestion.trim()
            : '',
        evaluatedBy: 'professor-ai',
      });
    } catch (error) {
      const msg = formatGeminiError(error, 'Ошибка при проверке ответа');
      res.status(500).json({error: msg});
    }
  });

  // 3. Examiner Follow-Up Defense Round Endpoint (1-round follow-up question check)
  app.post('/api/exam/followup', async (req, res) => {
    try {
      const {card, initialAnswer, followUpQuestion, followUpAnswer, initialScorePct} =
        req.body ?? {};
      if (!card || typeof followUpQuestion !== 'string') {
        res.status(400).json({error: 'Не передан дополнительный вопрос.'});
        return;
      }
      const cleanFollowUp =
        typeof followUpAnswer === 'string' ? followUpAnswer.trim() : '';
      if (!cleanFollowUp) {
        res.status(400).json({error: 'Введите ответ на дополнительный вопрос.'});
        return;
      }

      const ai = getGenAIClient();
      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: `Исходный билет: ${card.question}
Эталонная суть: ${card.keyThesis}
Первый ответ студента: """${String(initialAnswer ?? '')}""" (первичная оценка: ${Number(initialScorePct) || 0}%)
Твой дополнительный вопрос студенту: «${followUpQuestion}»
Ответ студента на доп. вопрос: """${cleanFollowUp}"""

Оцени ответ на дополнительный вопрос как строгий, но справедливый преподаватель МГТУ им. Н.Э. Баумана. Если студент вытянул тему и ответил верно — повысь итоговую оценку (recommendedGrade и updatedScorePct). Ответь кратко (2–3 живых предложения).`,
        config: {
          systemInstruction:
            'Ты — строгий и человечный преподаватель-экзаменатор. Оценивай ответ на свой дополнительный вопрос строго по смыслу, без буквоедства. Выставляй итоговую оценку SM-2 ("again", "hard", "good", "easy").',
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              passed: {
                type: Type.BOOLEAN,
                description: 'Зачтён ли ответ на дополнительный вопрос',
              },
              updatedScorePct: {
                type: Type.INTEGER,
                description: 'Обновлённый процент понимания темы (0..100)',
              },
              recommendedGrade: {
                type: Type.STRING,
                description: 'Итоговая оценка SM-2: "again", "hard", "good" или "easy"',
              },
              professorReply: {
                type: Type.STRING,
                description: 'Короткий живой ответ преподавателя на доп. вопрос (2-3 предложения)',
              },
            },
            required: ['passed', 'updatedScorePct', 'recommendedGrade', 'professorReply'],
          },
        },
      });

      const parsed = parseJsonSafely(response.text);
      const validGrades = new Set(['again', 'hard', 'good', 'easy']);
      const updatedScorePct = Math.max(
        0,
        Math.min(100, Number(parsed.updatedScorePct) || Number(initialScorePct) || 50),
      );
      const recommendedGrade = validGrades.has(parsed.recommendedGrade)
        ? parsed.recommendedGrade
        : updatedScorePct >= 80
          ? 'easy'
          : updatedScorePct >= 55
            ? 'good'
            : updatedScorePct >= 25
              ? 'hard'
              : 'again';

      res.json({
        passed: Boolean(parsed.passed),
        updatedScorePct,
        recommendedGrade,
        professorReply:
          typeof parsed.professorReply === 'string' && parsed.professorReply.trim()
            ? parsed.professorReply.trim()
            : 'Ответ на дополнительный вопрос принят.',
      });
    } catch (error) {
      const msg = formatGeminiError(
        error,
        'Ошибка при проверке ответа на дополнительный вопрос',
      );
      res.status(500).json({error: msg});
    }
  });

  // 4. Handwritten Notebook / Scratchpad Photo Solution Checker
  app.post('/api/exam/check-photo', async (req, res) => {
    try {
      const {imageBase64, mimeType, task} = req.body ?? {};
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({error: 'Не передано изображение решения.'});
        return;
      }
      if (!task || typeof task.problemStatement !== 'string') {
        res.status(400).json({error: 'Не переданы данные задачи.'});
        return;
      }

      const ai = getGenAIClient();
      const safeMime =
        typeof mimeType === 'string' && mimeType.startsWith('image/')
          ? mimeType.split(';')[0].trim()
          : 'image/png';

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: safeMime,
                data: imageBase64,
              },
            },
            {
              text: `Проверь рукописное или нарисованное решение студента для следующей задачи.
Условие: ${task.problemStatement}
LaTeX условия: ${task.problemLatex ?? ''}
Ключевая идея эталона: ${task.algorithmSummary ?? ''}
Эталонный ответ: ${task.expectedOutput ?? ''}

Инструкция:
1. Внимательно разбери каждый шаг, написанный на изображении.
2. Если изображение пустое, неразборчивое или не относится к задаче — честно укажи это с verdict: "wrong".
3. Если решение верное и доведено до правильного ответа (даже другим корректным методом!) — поставь verdict: "correct".
4. Если идея верная, но есть конкретная ошибка в выкладках (потерян минус, ошибка дифференцирования, незаконная замена на эквивалентные в сумме/разности, неверная ОДЗ, арифметическая ошибка) или решение не доведено до конца — поставь verdict: "partial" или "wrong" и укажи конкретный шаг, ошибку и способ исправления.`,
            },
          ],
        },
        config: {
          systemInstruction:
            'Ты — строгий, внимательный и доброжелательный преподаватель математики и информатики МГТУ им. Н.Э. Баумана. Ты проверяешь фото тетради или черновик студента, находя точные ошибки в выкладках и помогая их исправить.',
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: {
                type: Type.STRING,
                description: 'Строго одно из значений: "correct", "partial", "wrong"',
              },
              verdictTitle: {
                type: Type.STRING,
                description: 'Короткий заголовок вердикта (4-8 слов)',
              },
              summary: {
                type: Type.STRING,
                description: 'Развёрнутый, но ёмкий комментарий преподавателя (2-4 предложения)',
              },
              praise: {
                type: Type.STRING,
                description: 'Что студент сделал верно (1 предложение, если есть за что похвалить)',
              },
              mistakes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: {type: Type.STRING, description: 'Где именно ошибка (шаг/строка)'},
                    issue: {type: Type.STRING, description: 'В чём суть ошибки'},
                    fix: {type: Type.STRING, description: 'Как правильно исправить'},
                  },
                  required: ['step', 'issue', 'fix'],
                },
                description: 'Список конкретных ошибок в выкладках (пустой, если решение верно)',
              },
              nextHint: {
                type: Type.STRING,
                description: 'Короткая подсказка для следующего шага (если решение не завершено или есть ошибка)',
              },
            },
            required: ['verdict', 'verdictTitle', 'summary', 'mistakes'],
          },
        },
      });

      const parsed = parseJsonSafely(response.text);
      const validVerdicts = new Set(['correct', 'partial', 'wrong']);
      res.json({
        verdict: validVerdicts.has(parsed.verdict) ? parsed.verdict : 'partial',
        verdictTitle:
          typeof parsed.verdictTitle === 'string' && parsed.verdictTitle.trim()
            ? parsed.verdictTitle.trim()
            : 'Решение проверено преподавателем',
        summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
        praise: typeof parsed.praise === 'string' ? parsed.praise.trim() : '',
        mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes.slice(0, 6) : [],
        nextHint: typeof parsed.nextHint === 'string' ? parsed.nextHint.trim() : '',
      });
    } catch (error) {
      const msg = formatGeminiError(error, 'Ошибка при проверке фото решения');
      res.status(500).json({error: msg});
    }
  });

  // 5. Multi-turn Oral Exam Defense Mode ("Устный экзамен до конца")
  app.post('/api/exam/oral-turn', async (req, res) => {
    try {
      const {card, history, finishNow} = req.body ?? {};
      if (!card || typeof card.question !== 'string') {
        res.status(400).json({error: 'Не передан экзаменационный билет.'});
        return;
      }

      const turns: {role: string; text: string}[] = Array.isArray(history)
        ? history.slice(-10)
        : [];
      const studentTurns = turns.filter((t) => t.role === 'student').length;
      const shouldConclude = Boolean(finishNow) || studentTurns >= 3;

      const ai = getGenAIClient();
      const transcriptText = turns
        .map((t) =>
          t.role === 'professor'
            ? `Преподаватель: ${t.text}`
            : `Студент: ${t.text}`,
        )
        .join('\n');

      const prompt = `ЭКЗАМЕНАЦИОННЫЙ ВОПРОС: ${card.question}
Раздел: ${card.chapter ?? ''}
Эталонный тезис: ${card.keyThesis ?? ''}
Ключевые пункты: ${(card.answerPoints ?? []).join(' | ')}
Подводный камень / ловушка: ${card.examTip ?? ''}

ХОД УСТНОГО ЭКЗАМЕНА (ответов студента: ${studentTurns} из 3):
${transcriptText || '(экзамен только начался)'}

${
  shouldConclude
    ? 'ЗАДАЧА: Подведи финальный итог устного ответа по этому билету! Выстави итоговую оценку по 5-балльной шкале (examGrade: 2, 3, 4 или 5), процент понимания (scorePct 0..100), оценку SM-2 (recommendedGrade), и дай живой, справедливый разбор в professorMessage и feedbackSummary. Установи isFinished = true.'
    : 'ЗАДАЧА: Отреагируй по-человечески на последний ответ студента (1-2 коротких предложения) и задай ОДИН точный, живой уточняющий вопрос на понимание (например, про пропущенное условие теоремы, граничный случай, смысл квантора или контрпример). Если студент уже идеально и полностью раскрыл весь билет включая нюансы — можешь завершить экзамен досрочно с оценкой 5 (isFinished = true). Иначе оставь isFinished = false.'
}`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Ты — строгий, но справедливый и живой преподаватель МГТУ им. Н.Э. Баумана, принимающий устный экзамен. Не цепляйся к оговоркам распознавания речи и не требуй зубрежки дословно — проверяй реальное понимание логики, условий теорем и контрпримеров. Говори кратко, естественно и вслух (как в аудитории).',
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isFinished: {
                type: Type.BOOLEAN,
                description: 'Завершён ли устный экзамен по этому билету',
              },
              professorMessage: {
                type: Type.STRING,
                description:
                  'Реплика преподавателя вслух (реакция + уточняющий вопрос или итоговый вердикт, 2-4 предложения)',
              },
              examGrade: {
                type: Type.INTEGER,
                description: 'Итоговая оценка 2, 3, 4 или 5 (если isFinished = true, иначе 0)',
              },
              scorePct: {
                type: Type.INTEGER,
                description: 'Текущий процент понимания темы (0..100)',
              },
              recommendedGrade: {
                type: Type.STRING,
                description: 'Рекомендуемая оценка SM-2: "again", "hard", "good", "easy"',
              },
              feedbackSummary: {
                type: Type.STRING,
                description: 'Краткий итог: сильные стороны и что доучить (заполняется при isFinished = true)',
              },
            },
            required: [
              'isFinished',
              'professorMessage',
              'scorePct',
              'recommendedGrade',
            ],
          },
        },
      });

      const parsed = parseJsonSafely(response.text);
      const validGrades = new Set(['again', 'hard', 'good', 'easy']);
      const scorePct = Math.max(0, Math.min(100, Number(parsed.scorePct) || 50));
      const recommendedGrade = validGrades.has(parsed.recommendedGrade)
        ? parsed.recommendedGrade
        : scorePct >= 80
          ? 'easy'
          : scorePct >= 55
            ? 'good'
            : scorePct >= 25
              ? 'hard'
              : 'again';
      const isFinished = shouldConclude ? true : Boolean(parsed.isFinished);
      const rawGrade = Number(parsed.examGrade);
      const examGrade = isFinished
        ? rawGrade >= 2 && rawGrade <= 5
          ? rawGrade
          : scorePct >= 85
            ? 5
            : scorePct >= 65
              ? 4
              : scorePct >= 45
                ? 3
                : 2
        : null;

      res.json({
        isFinished,
        professorMessage:
          typeof parsed.professorMessage === 'string' &&
          parsed.professorMessage.trim()
            ? parsed.professorMessage.trim()
            : isFinished
              ? 'Спасибо, на этом всё — выставляю итоговую оценку.'
              : 'Хорошо, а можете уточнить ключевое условие этой теоремы?',
        examGrade,
        scorePct,
        recommendedGrade,
        feedbackSummary:
          typeof parsed.feedbackSummary === 'string'
            ? parsed.feedbackSummary.trim()
            : '',
      });
    } catch (error) {
      if (isTransientOrOverloadError(error) && req.body?.card) {
        const {card, history, finishNow} = req.body;
        const turns: {role: string; text: string}[] = Array.isArray(history)
          ? history
          : [];
        const studentTurns = turns.filter((t) => t.role === 'student').length;
        const isFinished = Boolean(finishNow) || studentTurns >= 3;
        const points: string[] = Array.isArray(card.answerPoints)
          ? card.answerPoints
          : [];
        const followPoint =
          points[Math.min(studentTurns, Math.max(0, points.length - 1))] ||
          card.examTip ||
          card.keyThesis ||
          'условие применимости теоремы';

        res.json({
          isFinished,
          professorMessage: isFinished
            ? `Хорошо, основную мысль по теме «${card.question}» вы раскрыли. Обратите особое внимание на ключевой тезис: ${card.keyThesis || ''}`
            : `Мысль понятна. А можете уточнить важный момент: ${followPoint}?`,
          examGrade: isFinished ? 4 : null,
          scorePct: isFinished ? 76 : 65,
          recommendedGrade: 'good',
          feedbackSummary: isFinished
            ? `Главная суть: ${card.keyThesis || ''}. ${card.examTip ? `Подводный камень: ${card.examTip}` : ''}`
            : '',
        });
        return;
      }
      const msg = formatGeminiError(error, 'Ошибка диалога с преподавателем');
      res.status(500).json({error: msg});
    }
  });

  // 6. Custom PDF Subject Importer (extracts structured flashcards from browser-extracted PDF pages)
  app.post('/api/exam/import-pdf', async (req, res) => {
    try {
      const {subjectName, pages, targetCount} = req.body ?? {};
      if (
        !subjectName ||
        typeof subjectName !== 'string' ||
        !Array.isArray(pages) ||
        pages.length === 0
      ) {
        res.status(400).json({error: 'Не передано название предмета или текст страниц PDF.'});
        return;
      }

      const safeCount = Math.max(5, Math.min(35, Number(targetCount) || 15));
      const trimmedPages = pages
        .slice(0, 60)
        .map((p: {page?: number; text?: string}) => ({
          page: Number(p.page) || 1,
          text: String(p.text ?? '').slice(0, 2200),
        }))
        .filter((p) => p.text.trim().length > 20);

      if (trimmedPages.length === 0) {
        res.status(400).json({
          error:
            'В этом PDF не найден текстовый слой (возможно, это скан). Выберите PDF с текстом.',
        });
        return;
      }

      const combinedText = trimmedPages
        .map((p) => `--- СТРАНИЦА ${p.page} ---\n${p.text}`)
        .join('\n\n')
        .slice(0, 48000);

      const ai = getGenAIClient();
      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: `Предмет: «${subjectName.trim()}».
Создай ровно ${safeCount} (или меньше, если конспект короткий) качественных учебных карточек для подготовки к экзамену/РК строго на основе текста ниже.

Требования:
- Каждая карточка должна проверять важное определение, теорему, закон, формулу или концепцию из текста.
- Поле keyThesis: чёткий главный тезис ответа (1–2 предложения).
- Поле answerPoints: 3–5 логических шагов ответа или доказательства (удобно для конструктора доказательств).
- Поле mathFormulaLatex: если в теме есть формула, запиши её чистым валидным LaTeX БЕЗ знаков $ (иначе пустая строка).
- Поле examTip: частая ошибка или ловушка экзаменатора.
- Поле chapter: короткое название раздела/темы (до 45 символов), сгруппируй карточки в 2–4 логических раздела.
- Поле page: номер страницы PDF, откуда взят материал.

ТЕКСТ PDF:
${combinedText}`,
        config: {
          systemInstruction:
            'Ты — опытный методист технического вуза. Извлекай из конспектов точные, структурированные карточки для интервального повторения на русском языке.',
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: {type: Type.STRING},
                    chapter: {type: Type.STRING},
                    keyThesis: {type: Type.STRING},
                    answerPoints: {
                      type: Type.ARRAY,
                      items: {type: Type.STRING},
                    },
                    mathFormulaLatex: {type: Type.STRING},
                    examTip: {type: Type.STRING},
                    page: {type: Type.INTEGER},
                  },
                  required: [
                    'question',
                    'chapter',
                    'keyThesis',
                    'answerPoints',
                    'examTip',
                    'page',
                  ],
                },
              },
            },
            required: ['cards'],
          },
        },
      });

      const parsed = parseJsonSafely(response.text);
      const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
      res.json({cards});
    } catch (error) {
      const msg = formatGeminiError(error, 'Ошибка разбора PDF в карточки');
      res.status(500).json({error: msg});
    }
  });

  // 7. Spot-the-Lie 30s Proof Game Generator (creates a 6-step proof with ONE subtle poisoned step)
  app.post('/api/exam/spot-the-lie', async (req, res) => {
    try {
      const {card, subjectTitle} = req.body ?? {};
      if (!card || typeof card.question !== 'string') {
        res.status(400).json({error: 'Не передана карточка для генерации раунда.'});
        return;
      }

      const ai = getGenAIClient();
      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: `Предмет: ${String(subjectTitle ?? 'Экзамен')}.
Исходная тема/теорема: ${card.question}
Главная суть: ${card.keyThesis ?? ''}
Ключевые шаги: ${(card.answerPoints ?? []).join(' | ')}
Ловушка: ${card.examTip ?? ''}

ЗАДАЧА: Создай раунд игры «Найди ложь за 30 секунд» — правдоподобное доказательство, вывод или разбор ровно из 6 последовательных шагов, в котором ровно ОДИН шаг (индекс от 1 до 5, т.е. шаги 2..6 — желательно не первый) содержит ТОНКУЮ, но строго математически или логически НЕВЕРНУЮ подмену (например: скрытое деление на ноль, перестановка кванторов ∀∃ ↔ ∃∀, незаконная замена на эквивалентную в сумме/разности, применение теоремы без проверки условия непрерывности/дифференцируемости, перепутанный порядок (AB)^{-1} = A^{-1}B^{-1}, потеря транспонирования, перепутанный LIFO/FIFO или утечка памяти/UB в C++).
Остальные 5 шагов должны быть абсолютно корректными и убедительными!

Формат:
- title: короткое название утверждения/доказательства (до 70 символов).
- statement: формулировка того, что «доказывается» (1 предложение).
- steps: ровно 6 объектов { text: string, latex?: string }. Если формула не нужна, latex = "". Формулы в latex пиши чистым LaTeX без символов $.
- poisonedIndex: 0-based индекс единственного ложного шага (от 0 до 5).
- fallacyType: короткий ярлык типа ловушки (3–5 слов, например «Подмена кванторов ∀∃ ↔ ∃∀» или «Незаконная замена в разности»).
- explanation: чёткое, живое объяснение в 2–3 предложениях, почему именно этот шаг ложен и к какому абсурду/ошибке он ведёт.
- correctStep: как должен выглядеть исправленный правильный шаг (1–2 предложения).`,
        config: {
          systemInstruction:
            'Ты — профессор математики и информатики, составляющий олимпиадные и экзаменационные задачи на поиск скрытой ошибки в доказательстве. Ошибка должна быть строго ОДНОЙ, тонкой, но бесспорной и математически точной.',
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {type: Type.STRING},
              statement: {type: Type.STRING},
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: {type: Type.STRING},
                    latex: {type: Type.STRING},
                  },
                  required: ['text'],
                },
              },
              poisonedIndex: {type: Type.INTEGER},
              fallacyType: {type: Type.STRING},
              explanation: {type: Type.STRING},
              correctStep: {type: Type.STRING},
            },
            required: [
              'title',
              'statement',
              'steps',
              'poisonedIndex',
              'fallacyType',
              'explanation',
              'correctStep',
            ],
          },
        },
      });

      const parsed = parseJsonSafely(response.text);
      const steps = Array.isArray(parsed.steps) ? parsed.steps.slice(0, 6) : [];
      if (steps.length < 4) {
        res.status(500).json({error: 'Не удалось собрать 6 шагов доказательства.'});
        return;
      }
      const poisonedIndex = Math.max(
        0,
        Math.min(steps.length - 1, Number(parsed.poisonedIndex) || 2),
      );
      res.json({
        title: String(parsed.title || card.question).trim(),
        statement: String(parsed.statement || card.keyThesis || '').trim(),
        steps: steps.map((s: {text?: string; latex?: string}) => ({
          text: String(s.text ?? '').trim(),
          latex: typeof s.latex === 'string' && s.latex.trim() ? s.latex.trim() : undefined,
        })),
        poisonedIndex,
        fallacyType: String(parsed.fallacyType || 'Логическая подмена').trim(),
        explanation: String(parsed.explanation || '').trim(),
        correctStep: String(parsed.correctStep || '').trim(),
      });
    } catch (error) {
      if (isTransientOrOverloadError(error) && req.body?.card) {
        const {card} = req.body;
        const rawPoints: string[] = Array.isArray(card.answerPoints)
          ? card.answerPoints.filter((p: unknown) => typeof p === 'string' && p.trim())
          : [];
        const baseSteps = [
          `Рассмотрим исходную постановку: ${card.question}.`,
          rawPoints[0] || `Исходим из главного определения: ${card.keyThesis || ''}.`,
          rawPoints[1] || 'Проверяем выполнение необходимых условий в рассматриваемой области.',
          `Утверждаем, что свойство сохраняется даже при отбрасывании граничных условий и без проверки области определения (типичная ловушка: ${card.examTip || 'пропуск ключевого условия теоремы'}).`,
          rawPoints[2] || 'Применяем основной переход и связываем промежуточный результат с искомой величиной.',
          rawPoints[3] || `Получаем итоговое утверждение: ${card.keyThesis || card.question}.`,
        ];
        res.json({
          title: String(card.question || 'Разбор доказательства').slice(0, 70),
          statement: String(card.keyThesis || card.question || '').trim(),
          steps: baseSteps.map((text, idx) => ({
            text,
            latex:
              idx === 5 && typeof card.mathFormulaLatex === 'string' && card.mathFormulaLatex.trim()
                ? card.mathFormulaLatex.trim()
                : undefined,
          })),
          poisonedIndex: 3,
          fallacyType: 'Отбрасывание обязательного условия',
          explanation:
            card.examTip ||
            'На шаге 4 незаконно отброшено существенное условие теоремы, без которого переход перестаёт быть равносильным.',
          correctStep:
            rawPoints[1] ||
            `Необходимо строго проверить условия применимости: ${card.keyThesis || ''}`,
        });
        return;
      }
      const msg = formatGeminiError(
        error,
        'Ошибка генерации раунда «Найди ложь»',
      );
      res.status(500).json({error: msg});
    }
  });

  // 8A. Personal Study Podcast Script Generator (conversational Russian, spoken math, 5s recall pauses)
  app.post('/api/exam/podcast-script', async (req, res) => {
    try {
      const {cards, subjectTitle, format, paceMode} = req.body ?? {};
      if (!Array.isArray(cards) || cards.length === 0) {
        res.status(400).json({error: 'Выберите хотя бы одну карточку для подкаста.'});
        return;
      }

      const safeFormat: 'dialogue' | 'solo' = format === 'solo' ? 'solo' : 'dialogue';
      const selected = cards.slice(0, 5);
      const cardsContext = selected
        .map(
          (
            c: {
              id: number;
              question: string;
              keyThesis: string;
              answerPoints?: string[];
              examTip?: string;
            },
            idx: number,
          ) =>
            `ТЕМА ${idx + 1} (Билет №${c.id}): ${c.question}\nСуть: ${c.keyThesis}\nШаги: ${(c.answerPoints ?? []).slice(0, 4).join('; ')}\nЛовушка: ${c.examTip ?? ''}`,
        )
        .join('\n\n');

      const ai = getGenAIClient();
      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: `Предмет: «${String(subjectTitle ?? 'Экзамен')}».
Формат: ${safeFormat === 'dialogue' ? 'Живой диалог двух дружелюбных ведущих подкаста — Артём (спокойный умный ведущий) и Алиса (живая соведущая, задаёт уточняющие вопросы и подсвечивает ловушки)' : 'Спокойный, тёплый и бодрый монолог одного лектора-наставника (Артём)'}.
Темп: ${paceMode === 'calm' ? 'спокойный, мягкий, для повторения перед сном' : 'умеренно быстрый, бодрый, без лишней воды, для прослушивания в метро и по дороге на экзамен'}.

СЛАБЫЕ ТЕМЫ СТУДЕНТА НА СЕГОДНЯ:
${cardsContext}

ПРАВИЛА СЦЕНАРИЯ (КРИТИЧНО ДЛЯ ЕСТЕСТВЕННОЙ ОЗВУЧКИ):
1. НИКАКОГО LaTeX, обратных слэшей, символов ^, _, |, \\lim, \\forall или программных скобок в тексте для озвучки! Все формулы пиши ЧИСТЫМ РАЗГОВОРНЫМ РУССКИМ ЯЗЫКОМ, как произносят вслух (например: «предел отношения синуса икс к икс при икс стремящемся к нулю равен единице», «а в минус первой равно бэ в минус первой умножить на а в минус первой», «эпсилон больше нуля»).
2. Естественная живая речь, как в хорошем подкасте — без канцелярита и робо-шаблонов. Короткие энергичные фразы.
3. Разбей сценарий на сегменты (segments). Для КАЖДОЙ из ${selected.length} тем сделай:
   - Сначала сегмент «вопрос-затравка» (segmentType: "prompt", cardId: номер билета), который заканчивается фразой вроде «Остановись на пять секунд и попробуй вспомнить главную формулировку сам...» и имеет pauseAfterSec: 4.
   - Затем сегмент «разбор и ловушка» (segmentType: "answer", cardId: номер билета, pauseAfterSec: 0), где чётко даётся правильная суть, логика и главная ловушка экзаменатора.
4. Начни с короткого бодрого вступления (segmentType: "intro", 2 реплики) и заверши коротким мотивирующим аутро (segmentType: "outro", 1–2 реплики).
5. В каждом сегменте lines — массив реплик { speaker: "Артем" | "Алиса", text: string }. ${safeFormat === 'solo' ? 'Используй только speaker: "Артем".' : 'Чередуй "Артем" и "Алиса" естественно (по 2–4 короткие реплики на сегмент).'}
6. Делай реплики компактными (1–3 предложения каждая), чтобы выпуск звучал динамично и не затянуто.`,
        config: {
          systemInstruction:
            'Ты — сценарист лучших образовательных подкастов. Твои тексты звучат абсолютно естественно в живой речи на русском языке, с правильными ударениями по смыслу, без единого нечитаемого символа LaTeX.',
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              episodeTitle: {type: Type.STRING},
              estimatedMinutes: {type: Type.NUMBER},
              segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    segmentType: {
                      type: Type.STRING,
                      description: '"intro" | "prompt" | "answer" | "outro"',
                    },
                    cardId: {type: Type.INTEGER},
                    heading: {type: Type.STRING},
                    pauseAfterSec: {type: Type.INTEGER},
                    lines: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          speaker: {type: Type.STRING},
                          text: {type: Type.STRING},
                        },
                        required: ['speaker', 'text'],
                      },
                    },
                  },
                  required: ['segmentType', 'heading', 'pauseAfterSec', 'lines'],
                },
              },
            },
            required: ['episodeTitle', 'estimatedMinutes', 'segments'],
          },
        },
      });

      const parsed = parseJsonSafely(response.text);
      res.json({
        episodeTitle: String(parsed.episodeTitle || `Аудиоразбор · ${subjectTitle}`).trim(),
        estimatedMinutes: Number(parsed.estimatedMinutes) || Math.max(2, selected.length * 1.2),
        segments: Array.isArray(parsed.segments) ? parsed.segments : [],
      });
    } catch (error) {
      if (isTransientOrOverloadError(error) && Array.isArray(req.body?.cards) && req.body.cards.length > 0) {
        const {cards, subjectTitle, format} = req.body;
        const isSolo = format === 'solo';
        const selected = cards.slice(0, 5);
        const stripLatex = (s: string) =>
          String(s || '')
            .replace(/[$\\^_{}]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const segments: Array<{
          segmentType: string;
          cardId?: number;
          heading: string;
          pauseAfterSec: number;
          lines: Array<{speaker: string; text: string}>;
        }> = [
          {
            segmentType: 'intro',
            heading: 'Вступление',
            pauseAfterSec: 0,
            lines: isSolo
              ? [
                  {
                    speaker: 'Артем',
                    text: `Привет! Разбираем ключевые билеты по курсу ${stripLatex(subjectTitle || 'Экзамен')}. Коротко, по сути и с паузами для самопроверки.`,
                  },
                ]
              : [
                  {
                    speaker: 'Артем',
                    text: `Привет! Сегодня повторяем самые важные темы по предмету ${stripLatex(subjectTitle || 'Экзамен')}.`,
                  },
                  {
                    speaker: 'Алиса',
                    text: 'Будем делать короткие паузы на пять секунд перед каждым ответом, чтобы ты успел вспомнить суть сам!',
                  },
                ],
          },
        ];

        for (const c of selected) {
          segments.push({
            segmentType: 'prompt',
            cardId: Number(c.id),
            heading: `Вопрос · Билет №${c.id}`,
            pauseAfterSec: 4,
            lines: [
              {
                speaker: 'Артем',
                text: `Билет номер ${c.id}: ${stripLatex(c.question)}. Остановись на четыре секунды и сформулируй главную идею сам.`,
              },
            ],
          });
          const pointsText = Array.isArray(c.answerPoints)
            ? c.answerPoints.slice(0, 3).map(stripLatex).join('. ')
            : '';
          segments.push({
            segmentType: 'answer',
            cardId: Number(c.id),
            heading: `Разбор · Билет №${c.id}`,
            pauseAfterSec: 0,
            lines: isSolo
              ? [
                  {
                    speaker: 'Артем',
                    text: `Главная суть: ${stripLatex(c.keyThesis)}. ${pointsText}. ${c.examTip ? `Обрати внимание на ловушку: ${stripLatex(c.examTip)}` : ''}`,
                  },
                ]
              : [
                  {
                    speaker: 'Артем',
                    text: `Правильная суть звучит так: ${stripLatex(c.keyThesis)}. ${pointsText}`,
                  },
                  {
                    speaker: 'Алиса',
                    text: c.examTip
                      ? `И осторожнее на экзамене: ${stripLatex(c.examTip)}`
                      : 'Отлично, зафиксировали ключевой переход и идём дальше!',
                  },
                ],
          });
        }

        segments.push({
          segmentType: 'outro',
          heading: 'Финал выпуска',
          pauseAfterSec: 0,
          lines: [
            {
              speaker: 'Артем',
              text: 'Отличная работа! Все выбранные билеты разобраны. Удачи на защите и экзамене!',
            },
          ],
        });

        res.json({
          episodeTitle: `Аудиоразбор · ${String(subjectTitle || 'Экзамен')}`,
          estimatedMinutes: Math.max(2, Number((selected.length * 1.2).toFixed(1))),
          segments,
        });
        return;
      }
      const msg = formatGeminiError(error, 'Ошибка генерации сценария подкаста');
      res.status(500).json({error: msg});
    }
  });

  // Helper: generate soft pleasant chime + silence PCM (24kHz, 16-bit mono LE) for 5-second active recall pauses
  function createRecallPausePcm(seconds: number): Buffer {
    const sampleRate = 24000;
    const clampedSec = Math.max(1, Math.min(6, seconds));
    const totalSamples = Math.floor(sampleRate * clampedSec);
    const buf = Buffer.alloc(totalSamples * 2);

    // Gentle warm soft chime at start (0.05s..0.35s) and gentle cue at end (last 0.25s)
    const writeTone = (startSec: number, durSec: number, freqHz: number, amp: number) => {
      const startIdx = Math.floor(startSec * sampleRate);
      const count = Math.floor(durSec * sampleRate);
      for (let i = 0; i < count; i++) {
        const idx = startIdx + i;
        if (idx < 0 || idx >= totalSamples) continue;
        const t = i / sampleRate;
        const env = Math.sin((Math.PI * i) / count) * Math.exp(-t * 5.5);
        const val = Math.round(Math.sin(2 * Math.PI * freqHz * t) * amp * env * 32767);
        buf.writeInt16LE(Math.max(-32768, Math.min(32767, val)), idx * 2);
      }
    };

    writeTone(0.08, 0.35, 523.25, 0.09); // Soft C5 chime (start thinking)
    if (clampedSec >= 2) {
      writeTone(clampedSec - 0.35, 0.3, 659.25, 0.08); // Soft E5 chime (answer coming!)
    }
    return buf;
  }

  function buildWavHeader(pcmDataLength: number, sampleRate = 24000): Buffer {
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcmDataLength, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // PCM chunk size
    header.writeUInt16LE(1, 20); // PCM format
    header.writeUInt16LE(1, 22); // Mono
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28); // Byte rate
    header.writeUInt16LE(2, 32); // Block align
    header.writeUInt16LE(16, 34); // Bits per sample
    header.write('data', 36);
    header.writeUInt32LE(pcmDataLength, 40);
    return header;
  }

  // 8B. Natural Neural TTS Podcast Audio Synthesizer (gemini-3.8-flash-tts, stitches segments + recall pauses into 1 WAV)
  app.post('/api/exam/podcast-audio', async (req, res) => {
    try {
      const {segments, format, voicePreset, paceMode} = req.body ?? {};
      if (!Array.isArray(segments) || segments.length === 0) {
        res.status(400).json({error: 'Не переданы сегменты сценария для озвучки.'});
        return;
      }

      const ai = getGenAIClient();
      const safeFormat: 'dialogue' | 'solo' = format === 'solo' ? 'solo' : 'dialogue';
      const soloVoice =
        typeof voicePreset === 'string' &&
        ['Kore', 'Charon', 'Puck', 'Fenrir', 'Zephyr'].includes(voicePreset)
          ? voicePreset
          : 'Charon';

      const styleSuffix =
        paceMode === 'calm'
          ? 'Warm, gentle, smooth Russian podcast voice, relaxed natural rhythm, pleasant soft timbre, never robotic'
          : 'Warm, natural, moderately brisk Russian podcast host, engaging conversational tone, smooth clear articulation, pleasant timbre, never robotic';

      const pcmParts: Buffer[] = [];
      const segmentTimings: {heading: string; cardId?: number; startSec: number; endSec: number}[] = [];
      let currentSampleOffset = 0;
      const sampleRate = 24000;

      for (const seg of segments.slice(0, 14)) {
        const lines: {speaker?: string; text?: string}[] = Array.isArray(seg.lines)
          ? seg.lines
          : [];
        const cleanLines = lines
          .map((l) => ({
            speaker: String(l.speaker || 'Артем').trim(),
            text: String(l.text || '')
              .replace(/[*_`#$\\]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim(),
          }))
          .filter((l) => l.text.length > 0);

        if (cleanLines.length === 0) continue;

        const startSec = currentSampleOffset / sampleRate;
        let base64Wav: string | undefined;

        if (safeFormat === 'dialogue') {
          const parts = cleanLines.map((l) => {
            const isAlice = l.speaker.toLowerCase().includes('алис');
            const speakerTag = isAlice ? 'Alisa' : 'Artem';
            return {
              text: `${speakerTag}: ${l.text}`,
              speechMetadata: {
                speaker: speakerTag,
                style: isAlice
                  ? `Bright, friendly female co-host. ${styleSuffix}`
                  : `Calm, articulate male podcast host. ${styleSuffix}`,
              },
            };
          });

          const ttsRes = await generateContentWithRetry(ai, {
            model: 'gemini-3.8-flash-tts',
            contents: [{role: 'user', parts}],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                multiSpeakerVoiceConfig: {
                  speakerVoiceConfigs: [
                    {
                      speaker: 'Artem',
                      voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Charon'}},
                    },
                    {
                      speaker: 'Alisa',
                      voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Zephyr'}},
                    },
                  ],
                },
              },
            },
          });
          base64Wav = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        } else {
          const combinedText = cleanLines.map((l) => l.text).join(' ');
          const ttsRes = await generateContentWithRetry(ai, {
            model: 'gemini-3.8-flash-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: combinedText,
                    speechMetadata: {
                      style: styleSuffix,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {voiceName: soloVoice},
                },
              },
            },
          });
          base64Wav = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        }

        if (base64Wav) {
          const rawBuf = Buffer.from(base64Wav, 'base64');
          // Unary gemini-3.8-flash-tts returns a complete 44-byte RIFF WAV (24kHz 16-bit mono)
          const hasRiffHeader =
            rawBuf.length > 44 && rawBuf.subarray(0, 4).toString('ascii') === 'RIFF';
          const pcm = hasRiffHeader ? rawBuf.subarray(44) : rawBuf;
          pcmParts.push(pcm);
          currentSampleOffset += Math.floor(pcm.length / 2);
        }

        // Insert a gentle micro-gap or real 4-5s active-recall pause with soft chime
        const pauseSec = Number(seg.pauseAfterSec) || 0;
        if (pauseSec >= 2) {
          const pausePcm = createRecallPausePcm(pauseSec);
          pcmParts.push(pausePcm);
          currentSampleOffset += Math.floor(pausePcm.length / 2);
        } else {
          // 0.45s natural breath gap between sections
          const breathPcm = Buffer.alloc(Math.floor(sampleRate * 0.45) * 2);
          pcmParts.push(breathPcm);
          currentSampleOffset += Math.floor(breathPcm.length / 2);
        }

        const endSec = currentSampleOffset / sampleRate;
        segmentTimings.push({
          heading: String(seg.heading || 'Раздел'),
          cardId: typeof seg.cardId === 'number' ? seg.cardId : undefined,
          startSec: Number(startSec.toFixed(2)),
          endSec: Number(endSec.toFixed(2)),
        });
      }

      if (pcmParts.length === 0) {
        res.status(500).json({error: 'Не удалось синтезировать аудиодорожку.'});
        return;
      }

      const fullPcm = Buffer.concat(pcmParts);
      const fullWav = Buffer.concat([buildWavHeader(fullPcm.length, sampleRate), fullPcm]);

      res.json({
        audioBase64: fullWav.toString('base64'),
        mimeType: 'audio/wav',
        durationSec: Number((fullPcm.length / 2 / sampleRate).toFixed(1)),
        segmentTimings,
      });
    } catch (error) {
      const msg = formatGeminiError(error, 'Ошибка синтеза голоса подкаста');
      res.status(500).json({error: msg});
    }
  });

  // 8C. Natural Single-Line Voice Synthesis for Freshman / Oral Exam (short, fast, warm voice)
  app.post('/api/exam/tts-line', async (req, res) => {
    try {
      const {text, voiceName, style} = req.body ?? {};
      const clean = String(text ?? '')
        .replace(/[*_`#$\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 800);
      if (!clean) {
        res.status(400).json({error: 'Пустой текст для озвучки.'});
        return;
      }

      const ai = getGenAIClient();
      const safeVoice =
        typeof voiceName === 'string' &&
        ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voiceName)
          ? voiceName
          : 'Puck';

      const ttsRes = await generateContentWithRetry(ai, {
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: clean,
                speechMetadata: {
                  style:
                    typeof style === 'string' && style.trim()
                      ? style.trim()
                      : 'Natural, friendly, moderately brisk Russian university student voice, warm conversational tone',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {voiceName: safeVoice},
            },
          },
        },
      });

      const base64Wav = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Wav) {
        res.status(500).json({error: 'Не удалось озвучить реплику.'});
        return;
      }
      res.json({audioBase64: base64Wav, mimeType: 'audio/wav'});
    } catch (error) {
      const msg = formatGeminiError(error, 'Ошибка озвучки');
      res.status(500).json({error: msg});
    }
  });

  // 9. Reverse Feynman Method ("Объясни тупому первокурснику" with 0..100% understanding meter & illusion audit)
  app.post('/api/exam/feynman-turn', async (req, res) => {
    try {
      const {card, history, currentUnderstanding, finishNow} = req.body ?? {};
      if (!card || typeof card.question !== 'string') {
        res.status(400).json({error: 'Не передана тема для объяснения.'});
        return;
      }

      const turns: {role: string; text: string}[] = Array.isArray(history)
        ? history.slice(-12)
        : [];
      const userTurns = turns.filter((t) => t.role === 'teacher').length;
      const prevPct = Math.max(0, Math.min(100, Number(currentUnderstanding) || 0));
      const forceEnd = Boolean(finishNow) || userTurns >= 5;

      const transcript = turns
        .map((t) =>
          t.role === 'freshman' ? `Первокурсник Даня: ${t.text}` : `Наставник (пользователь): ${t.text}`,
        )
        .join('\n');

      const ai = getGenAIClient();
      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: `ТЕМА, КОТОРУЮ ТЕБЕ ОБЪЯСНЯЮТ: «${card.question}»
Раздел: ${card.chapter ?? ''}
Эталонная суть (для твоей скрытой проверки, не цитируй её сам!): ${card.keyThesis ?? ''}
Ключевые логические пункты: ${(card.answerPoints ?? []).join(' | ')}
Ловушка/нюанс: ${card.examTip ?? ''}

Текущая шкала твоего понимания до последнего сообщения: ${prevPct}% (раундов объяснения: ${userTurns} из 5).

ДИАЛОГ:
${transcript}

${
  forceEnd
    ? 'ЗАДАЧА: Подведи финал! Дай последнюю живую реакцию Дани, зафиксируй итоговый understandingPct (0..100), установи isFinished = true и заполни подробный и честный аудит «Иллюзии понимания» (explainedWell, illusionGaps, recommendedGrade).'
    : 'ЗАДАЧА: Ответь в образе первокурсника Дани (2–4 живых предложения). Правила:\n1. Если пользователь просто сухо скопировал определение из учебника или кинул сложный термин без объяснения на пальцах — включи jargonDetected = true, почти не поднимай understandingPct (+5..10%) и по-человечески переспроси: «Погоди, ты щас просто учебник процитировал! А простыми словами-то зачем это нужно? Что сломается, если убрать это условие?».\n2. Если объяснение реально понятное, живое, с примером/интуицией и без логических дыр — заметно подними understandingPct (+25..40%) и задай ОДИН наивный, но коварный вопрос в самую суть (про граничный случай, контрпример или «почему нельзя проще»).\n3. Если understandingPct достиг 100% — обрадуйся, установи isFinished = true и заполни explainedWell, illusionGaps и recommendedGrade!'
}`,
        config: {
          systemInstruction:
            'Ты играешь роль живого, немного растерянного первокурсника Дани перед пересдачей (метод Фейнмана наоборот). Ты НЕ преподаватель! Ты реально пытаешься понять тему на пальцах, без заумных штампов, и задаёшь наивные, но бьющие точно в логические дыры вопросы. Если тебя убедили понятно и строго по сути — доводишь шкалу понимания до 100% и выдаёшь честный разбор, где у объясняющего была «иллюзия понимания».',
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              freshmanReply: {
                type: Type.STRING,
                description: 'Живая реплика первокурсника Дани (2–4 предложения)',
              },
              understandingPct: {
                type: Type.INTEGER,
                description: 'Новый уровень понимания Дани от 0 до 100',
              },
              jargonDetected: {
                type: Type.BOOLEAN,
                description: 'True, если объяснение было сухим штампом/зубрёжкой без объяснения сути на пальцах',
              },
              moodLabel: {
                type: Type.STRING,
                description: 'Короткий статус состояния Дани (2–4 слова, например «В полном тумане», «Поймал штамп!», «Начинает доходить», «Эврика! Понял всё»)',
              },
              isFinished: {type: Type.BOOLEAN},
              explainedWell: {
                type: Type.ARRAY,
                items: {type: Type.STRING},
                description: 'Что пользователь объяснил блестяще и понятно (при isFinished = true)',
              },
              illusionGaps: {
                type: Type.ARRAY,
                items: {type: Type.STRING},
                description: 'Где вскрылась «иллюзия понимания» — какие нюансы/почему-вопросы остались шаткими (при isFinished = true)',
              },
              recommendedGrade: {
                type: Type.STRING,
                description: 'Оценка SM-2: "again", "hard", "good" или "easy"',
              },
            },
            required: [
              'freshmanReply',
              'understandingPct',
              'jargonDetected',
              'moodLabel',
              'isFinished',
            ],
          },
        },
      });

      const parsed = parseJsonSafely(response.text);
      const understandingPct = Math.max(
        0,
        Math.min(100, Number(parsed.understandingPct) || prevPct),
      );
      const isFinished = forceEnd || understandingPct >= 100 || Boolean(parsed.isFinished);
      const validGrades = new Set(['again', 'hard', 'good', 'easy']);
      const recommendedGrade = validGrades.has(parsed.recommendedGrade)
        ? parsed.recommendedGrade
        : understandingPct >= 90
          ? 'easy'
          : understandingPct >= 65
            ? 'good'
            : understandingPct >= 35
              ? 'hard'
              : 'again';

      res.json({
        freshmanReply:
          typeof parsed.freshmanReply === 'string' && parsed.freshmanReply.trim()
            ? parsed.freshmanReply.trim()
            : 'Погоди, а можешь объяснить это ещё проще, на каком-нибудь примере?',
        understandingPct,
        jargonDetected: Boolean(parsed.jargonDetected),
        moodLabel:
          typeof parsed.moodLabel === 'string' && parsed.moodLabel.trim()
            ? parsed.moodLabel.trim()
            : understandingPct >= 90
              ? 'Понял на 100%!'
              : understandingPct >= 50
                ? 'Вроде доходит...'
                : 'Всё ещё в тумане',
        isFinished,
        explainedWell: Array.isArray(parsed.explainedWell)
          ? parsed.explainedWell.slice(0, 5)
          : [],
        illusionGaps: Array.isArray(parsed.illusionGaps)
          ? parsed.illusionGaps.slice(0, 5)
          : [],
        recommendedGrade,
      });
    } catch (error) {
      if (isTransientOrOverloadError(error) && req.body?.card) {
        const {card, history, currentUnderstanding, finishNow} = req.body;
        const turns: {role: string; text: string}[] = Array.isArray(history)
          ? history
          : [];
        const userTurns = turns.filter((t) => t.role === 'teacher').length;
        const prevPct = Math.max(0, Math.min(100, Number(currentUnderstanding) || 0));
        const nextPct = Math.min(100, prevPct + 35);
        const isFinished = Boolean(finishNow) || userTurns >= 4 || nextPct >= 100;
        const points: string[] = Array.isArray(card.answerPoints)
          ? card.answerPoints
          : [];
        const askPoint =
          points[Math.min(userTurns, Math.max(0, points.length - 1))] ||
          card.examTip ||
          card.keyThesis ||
          'почему это работает в граничном случае';

        res.json({
          freshmanReply: isFinished
            ? `Ага, вот теперь пазл реально сложился! Значит, главная суть — ${card.keyThesis || card.question}. Спасибо, теперь на пересдаче точно не поплыву!`
            : `Окей, общая идея начинает доходить! А можешь на пальцах пояснить вот этот момент: ${askPoint}?`,
          understandingPct: isFinished ? Math.max(85, nextPct) : nextPct,
          jargonDetected: false,
          moodLabel: isFinished ? 'Эврика! Понял всё' : 'Начинает доходить',
          isFinished,
          explainedWell: isFinished ? [card.keyThesis || card.question] : [],
          illusionGaps:
            isFinished && card.examTip ? [card.examTip] : [],
          recommendedGrade: isFinished ? 'good' : 'good',
        });
        return;
      }
      const msg = formatGeminiError(error, 'Ошибка диалога с первокурсником');
      res.status(500).json({error: msg});
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      plugins: [
        {
          name: 'disable-hmr-client-ws',
          enforce: 'post',
          transform(code, id) {
            if (
              id.endsWith('/vite/dist/client/client.mjs') ||
              id.endsWith('/@vite/client')
            ) {
              return code
                .replace(
                  'transport.connect(createHMRHandler(handleMessage));',
                  '/* WebSocket HMR transport disabled */',
                )
                .replace(
                  'wsTransport.send(data);',
                  '/* WebSocket HMR send disabled */',
                )
                .replace(
                  /throw new SendBeforeConnectError\(\)/g,
                  'return',
                );
            }
          },
        },
      ],
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
