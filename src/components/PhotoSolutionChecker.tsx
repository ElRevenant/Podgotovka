import {ChangeEvent, useEffect, useRef, useState} from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  Sparkles,
  Upload,
  XCircle,
} from 'lucide-react';
import {getAutonomousMode, getGeminiHeaders} from '../utils/cardHelpers';

export interface PhotoCheckResult {
  verdict: 'correct' | 'partial' | 'wrong';
  verdictTitle: string;
  summary: string;
  praise: string;
  mistakes: {step: string; issue: string; fix: string}[];
  nextHint: string;
}

interface PhotoSolutionCheckerProps {
  taskStatement: string;
  taskLatex?: string;
  algorithmSummary?: string;
  expectedOutput?: string;
  /** Optional PNG/JPEG dataUrl injected directly from DrawingScratchpad */
  externalImageDataUrl?: string | null;
  onClearExternalImage?: () => void;
  onSolved?: () => void;
}

async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      const img = new Image();
      img.onerror = () => reject(new Error('Не удалось декодировать изображение'));
      img.onload = () => {
        const maxSide = 1400;
        let {width, height} = img;
        if (width > maxSide || height > maxSide) {
          const ratio = Math.min(maxSide / width, maxSide / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoSolutionChecker({
  taskStatement,
  taskLatex,
  algorithmSummary,
  expectedOutput,
  externalImageDataUrl,
  onClearExternalImage,
  onSolved,
}: PhotoSolutionCheckerProps) {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<PhotoCheckResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const runCheck = async (dataUrl: string) => {
    setChecking(true);
    setError('');
    setResult(null);

    if (getAutonomousMode()) {
      setChecking(false);
      setResult({
        verdict: 'partial',
        verdictTitle: 'Автономная самопроверка по эталону',
        summary:
          'Включён Автономный режим: сверьте ваш рукописный черновик с эталонным алгоритмом и ответом задачи ниже.',
        praise: 'Отлично, что расписали ход решения на листе или черновике!',
        mistakes: algorithmSummary
          ? [
              {
                step: 'Ключевой метод',
                issue: 'Проверьте каждый переход по шагам алгоритма',
                fix: algorithmSummary,
              },
            ]
          : [],
        nextHint: expectedOutput
          ? `Эталонный ответ для сверки: ${expectedOutput}`
          : 'Раскройте пошаговое решение под задачей и отметьте её как решённую.',
      });
      return;
    }

    try {
      const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        throw new Error('Некорректный формат изображения');
      }
      const mimeType = match[1];
      const imageBase64 = match[2];

      const res = await fetch('/api/exam/check-photo', {
        method: 'POST',
        headers: getGeminiHeaders(),
        body: JSON.stringify({
          imageBase64,
          mimeType,
          task: {
            problemStatement: taskStatement,
            problemLatex: taskLatex ?? '',
            algorithmSummary: algorithmSummary ?? '',
            expectedOutput: expectedOutput ?? '',
          },
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody.error || 'Не удалось проверить фото решения. Попробуйте ещё раз.',
        );
      }
      const data = (await res.json()) as PhotoCheckResult;
      setResult(data);
      if (data.verdict === 'correct' && onSolved) {
        onSolved();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка проверки фото');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (externalImageDataUrl) {
      setPreviewDataUrl(externalImageDataUrl);
      void runCheck(externalImageDataUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalImageDataUrl]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file);
      setPreviewDataUrl(compressed);
      setResult(null);
      setError('');
      await runCheck(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обработки фото');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B101B] p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-semibold text-slate-900 dark:text-[#F3F4F6]">
            Проверка решения из тетради (или черновика) по фото
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => void handleFileChange(e)}
            className="hidden"
          />
          <button
            type="button"
            disabled={checking}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md prism-cta disabled:opacity-50 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>
              {previewDataUrl ? 'Загрузить другое фото' : 'Загрузить фото тетради'}
            </span>
          </button>
          {previewDataUrl && (
            <button
              type="button"
              onClick={() => {
                setPreviewDataUrl(null);
                setResult(null);
                setError('');
                onClearExternalImage?.();
              }}
              className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6] cursor-pointer"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      {previewDataUrl && (
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <img
            src={previewDataUrl}
            alt="Фото вашего решения"
            className="w-full sm:w-44 max-h-44 object-contain rounded-md border border-slate-200 dark:border-white/[0.08] bg-white shrink-0"
          />

          <div className="flex-1 min-w-0 space-y-2.5">
            {checking && (
              <div className="flex items-center gap-2 text-xs text-sky-700 dark:text-sky-400 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  Преподаватель проверяет каждую строчку вашего решения...
                </span>
              </div>
            )}

            {error && (
              <div className="rounded-md border border-rose-300 dark:border-rose-800/70 bg-rose-50 dark:bg-rose-950/30 p-2.5 text-xs text-rose-800 dark:text-rose-200">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-2.5">
                <div
                  className={`rounded-md border p-3 text-xs space-y-1 ${
                    result.verdict === 'correct'
                      ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950 dark:border-emerald-800/70 dark:bg-emerald-950/35 dark:text-emerald-100'
                      : result.verdict === 'partial'
                        ? 'border-amber-300 bg-amber-50/80 text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/35 dark:text-amber-100'
                        : 'border-rose-300 bg-rose-50/80 text-rose-950 dark:border-rose-800/70 dark:bg-rose-950/35 dark:text-rose-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {result.verdict === 'correct' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : result.verdict === 'partial' ? (
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{result.verdictTitle}</span>
                  </div>
                  <p className="leading-relaxed">{result.summary}</p>
                  {result.praise && (
                    <p className="text-[11px] opacity-90">
                      <Sparkles className="inline h-3 w-3 mr-1" />
                      {result.praise}
                    </p>
                  )}
                </div>

                {result.mistakes.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                      Найденные неточности:
                    </p>
                    {result.mistakes.map((m, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1522] p-2.5 text-xs space-y-1"
                      >
                        <p className="font-semibold text-slate-900 dark:text-[#F3F4F6]">
                          Шаг: {m.step}
                        </p>
                        <p className="text-rose-700 dark:text-rose-400">
                          Ошибка: {m.issue}
                        </p>
                        <p className="text-emerald-700 dark:text-emerald-400">
                          Как исправить: {m.fix}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {result.nextHint && (
                  <p className="text-xs text-sky-800 dark:text-sky-300 bg-sky-50/70 dark:bg-sky-950/25 border border-sky-200 dark:border-sky-800/50 rounded-md px-2.5 py-2">
                    Подсказка преподавателя: {result.nextHint}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
