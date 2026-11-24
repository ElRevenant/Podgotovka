import {ChangeEvent, useRef, useState} from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {CustomSubject, StudyCategory, TheoryCard} from '../types/study';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfSubjectImporterModalProps {
  nextCardIdStart: number;
  onSaveSubject: (subject: CustomSubject) => void;
  onClose: () => void;
}

interface ExtractedPage {
  page: number;
  text: string;
}

export function PdfSubjectImporterModal({
  nextCardIdStart,
  onSaveSubject,
  onClose,
}: PdfSubjectImporterModalProps) {
  const [fileName, setFileName] = useState('');
  const [subjectTitle, setSubjectTitle] = useState('');
  const [shortTitle, setShortTitle] = useState('');
  const [targetCount, setTargetCount] = useState<10 | 15 | 25>(15);
  const [pages, setPages] = useState<ExtractedPage[]>([]);
  const [status, setStatus] = useState<
    'idle' | 'extracting' | 'ready' | 'generating'
  >('idle');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFilePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setFileName(file.name);
    const baseName = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
    if (!subjectTitle) setSubjectTitle(baseName);
    if (!shortTitle) setShortTitle(baseName.slice(0, 12));

    setStatus('extracting');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
      const maxPages = Math.min(doc.numPages, 60);
      const extracted: ExtractedPage[] = [];

      for (let p = 1; p <= maxPages; p++) {
        const pdfPage = await doc.getPage(p);
        const content = await pdfPage.getTextContent();
        const pageText = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (pageText.length > 20) {
          extracted.push({page: p, text: pageText});
        }
      }

      if (extracted.length === 0) {
        setError(
          'В этом PDF не обнаружен текстовый слой (похоже на скан без OCR). Выберите PDF с копируемым текстом.',
        );
        setPages([]);
        setStatus('idle');
        return;
      }

      setPages(extracted);
      setStatus('ready');
    } catch (err) {
      setError(
        err instanceof Error
          ? `Ошибка чтения PDF: ${err.message}`
          : 'Не удалось прочитать PDF-файл',
      );
      setStatus('idle');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleGenerateSubject = async () => {
    const cleanTitle = subjectTitle.trim();
    const cleanShort = (shortTitle.trim() || cleanTitle).slice(0, 14);
    if (!cleanTitle) {
      setError('Укажите название предмета.');
      return;
    }
    if (pages.length === 0) {
      setError('Сначала загрузите PDF-конспект.');
      return;
    }

    setStatus('generating');
    setError('');
    try {
      const res = await fetch('/api/exam/import-pdf', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          subjectName: cleanTitle,
          pages,
          targetCount,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Не удалось сгенерировать карточки из PDF');
      }
      const data = (await res.json()) as {
        cards?: {
          question: string;
          chapter: string;
          keyThesis: string;
          answerPoints: string[];
          mathFormulaLatex?: string;
          examTip?: string;
          page?: number;
        }[];
      };

      const rawCards = Array.isArray(data.cards) ? data.cards : [];
      if (rawCards.length === 0) {
        throw new Error('Сервер не вернул ни одной карточки. Попробуйте другой PDF.');
      }

      const subjectId = `custom_${Date.now().toString(36)}` as `custom_${string}`;
      const startId = Math.max(2000, nextCardIdStart);
      const cards: TheoryCard[] = rawCards.map((c, i) => ({
        id: startId + i,
        category: subjectId as StudyCategory,
        question: String(c.question || `Вопрос №${i + 1}`).trim(),
        chapter: String(c.chapter || cleanTitle).trim(),
        keyThesis: String(c.keyThesis || '').trim(),
        answerPoints:
          Array.isArray(c.answerPoints) && c.answerPoints.length > 0
            ? c.answerPoints.map((pt) => String(pt).trim()).filter(Boolean)
            : [String(c.keyThesis || 'См. конспект PDF').trim()],
        mathFormulaLatex:
          typeof c.mathFormulaLatex === 'string' && c.mathFormulaLatex.trim()
            ? c.mathFormulaLatex.trim()
            : undefined,
        examTip:
          typeof c.examTip === 'string' && c.examTip.trim()
            ? c.examTip.trim()
            : 'Обратите внимание на точные условия и формулировку из конспекта.',
        hint: c.page ? `Источник: ${fileName}, стр. ${c.page}` : undefined,
        slides: [],
        coverage: 'custom',
        isCustom: true,
      }));

      const newSubject: CustomSubject = {
        id: subjectId,
        name: cleanTitle,
        shortName: cleanShort,
        fileName,
        pageCount: pages.length,
        createdAt: new Date().toISOString(),
        cards,
      };
      onSaveSubject(newSubject);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ошибка при создании предмета',
      );
      setStatus('ready');
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#04070D]/80 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1522] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F3F4F6]">
                Импорт своего предмета из PDF
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Загрузите конспект (физика, линал, история...) — мы создадим колоду карточек SM-2
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть импорт PDF"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* File Drop / Pick */}
          <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-[#3A3A3A] bg-slate-50/70 dark:bg-[#0B101B] p-5 text-center space-y-2.5">
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => void handleFilePick(e)}
              className="hidden"
            />
            {status === 'extracting' ? (
              <div className="flex flex-col items-center gap-2 py-2 text-xs text-sky-700 dark:text-sky-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Извлекаем текст со страниц PDF локально в браузере...</span>
              </div>
            ) : pages.length > 0 ? (
              <div className="flex flex-col items-center gap-1.5">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                  {fileName}
                </p>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Извлечено страниц с текстом: {pages.length}
                </p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-1 text-xs font-medium text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Выбрать другой PDF
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-6 w-6 mx-auto text-slate-400" />
                <p className="text-xs text-slate-600 dark:text-[#D1D5DB]">
                  Выберите PDF-файл с лекциями или билетами (до 60 страниц текста)
                </p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg prism-cta cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Выбрать PDF-файл</span>
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700 dark:text-[#D1D5DB]">
                Полное название предмета
              </span>
              <input
                type="text"
                value={subjectTitle}
                onChange={(e) => setSubjectTitle(e.target.value)}
                placeholder="Например: Физика · Механика"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6]"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700 dark:text-[#D1D5DB]">
                Короткое имя вкладки (до 14 симв.)
              </span>
              <input
                type="text"
                maxLength={14}
                value={shortTitle}
                onChange={(e) => setShortTitle(e.target.value)}
                placeholder="Физика"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700 dark:text-[#D1D5DB]">
              Сколько карточек сгенерировать:
            </span>
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B101B]">
              {([10, 15, 25] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setTargetCount(cnt)}
                  className={`px-3 py-1 font-mono font-semibold rounded-md cursor-pointer ${
                    targetCount === cnt
                      ? 'prism-tab-active text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-[#94A3B8]'
                  }`}
                >
                  {cnt} шт.
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-300 dark:border-rose-800/70 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={status !== 'ready' && status !== 'generating'}
              onClick={() => void handleGenerateSubject()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg prism-cta disabled:opacity-50 cursor-pointer"
            >
              {status === 'generating' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Создаём карточки из конспекта...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Создать предмет ({targetCount} карточек)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
