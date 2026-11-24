import {useEffect, useRef, useState} from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {LECTURE_MAP} from '../data/lectures';
import {LectureId} from '../types/study';
import {FileWarning, Loader2} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const docCache = new Map<string, Promise<pdfjsLib.PDFDocumentProxy>>();

function loadPdfDocument(url: string): Promise<pdfjsLib.PDFDocumentProxy> {
  const existing = docCache.get(url);
  if (existing) {
    return existing;
  }
  const loadingTask = pdfjsLib.getDocument({url});
  const promise = loadingTask.promise.catch((err) => {
    docCache.delete(url);
    throw err;
  });
  docCache.set(url, promise);
  return promise;
}

interface SlideCanvasProps {
  lectureId: LectureId;
  page: number;
  /** Target display width in CSS pixels; canvas automatically adapts to container width */
  maxWidth?: number;
  className?: string;
}

export function SlideCanvas({
  lectureId,
  page,
  maxWidth = 880,
  className = '',
}: SlideCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(maxWidth);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const lecture = LECTURE_MAP[lectureId];
  const safePage = Math.max(1, Math.min(page, lecture.pageCount));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = el.clientWidth;
      if (w > 0) {
        setContainerWidth(Math.min(w, maxWidth));
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxWidth]);

  useEffect(() => {
    let cancelled = false;
    let activeRenderTask: pdfjsLib.RenderTask | null = null;

    async function renderSlide() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setStatus('loading');
      setErrorMessage('');

      try {
        const doc = await loadPdfDocument(lecture.url);
        if (cancelled) return;

        const pdfPage = await doc.getPage(safePage);
        if (cancelled) return;

        const baseViewport = pdfPage.getViewport({scale: 1});
        const targetCssWidth = Math.max(240, containerWidth);
        const scale = targetCssWidth / baseViewport.width;
        const viewport = pdfPage.getViewport({scale});

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const renderParams: Parameters<typeof pdfPage.render>[0] = {
          canvas,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        };

        activeRenderTask = pdfPage.render(renderParams);
        await activeRenderTask.promise;

        if (!cancelled) {
          setStatus('ready');
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes('cancel')) {
          return;
        }
        setErrorMessage('Не удалось загрузить слайд лекции');
        setStatus('error');
      }
    }

    renderSlide();

    return () => {
      cancelled = true;
      if (activeRenderTask) {
        activeRenderTask.cancel();
      }
    };
  }, [lecture.url, safePage, containerWidth]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0B111C] flex items-center justify-center min-h-[280px] sm:min-h-[340px] ${className}`}
    >
      {status === 'loading' && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-100/80 dark:bg-[#0B111C]/80 backdrop-blur-[2px] text-slate-700 dark:text-[#E2E8F0] transition-opacity"
          aria-live="polite"
        >
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs font-medium tabular-nums">
            Загрузка слайда {safePage} ({lecture.shortTitle})...
          </span>
        </div>
      )}

      {status === 'error' ? (
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-slate-500 dark:text-slate-400">
          <FileWarning className="h-6 w-6 text-rose-500" />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {errorMessage}
          </p>
          <p className="text-xs tabular-nums">
            {lecture.shortTitle} · стр. {safePage}
          </p>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="block w-full max-w-full h-auto"
          aria-label={`${lecture.shortTitle}, страница ${safePage}`}
        />
      )}
    </div>
  );
}
