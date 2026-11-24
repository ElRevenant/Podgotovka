import {useEffect, useRef, useState} from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {FileWarning, Loader2} from 'lucide-react';
import {LECTURE_MAP} from '../data/lectures';
import {TaskPdfCrop} from '../types/study';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const cropDocCache = new Map<string, Promise<pdfjsLib.PDFDocumentProxy>>();

function getCachedPdfDoc(url: string): Promise<pdfjsLib.PDFDocumentProxy> {
  const cached = cropDocCache.get(url);
  if (cached) return cached;
  const task = pdfjsLib.getDocument({url});
  const promise = task.promise.catch((err) => {
    cropDocCache.delete(url);
    throw err;
  });
  cropDocCache.set(url, promise);
  return promise;
}

interface PdfTaskCropProps {
  crop: TaskPdfCrop;
  label?: string;
  className?: string;
}

/**
 * Renders the exact cropped region of a practice problem directly from the
 * original PDF sheet at high DPI so the task can be viewed as a clean image.
 */
export function PdfTaskCrop({crop, label, className = ''}: PdfTaskCropProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(680);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const lecture = LECTURE_MAP[crop.lectureId];
  const leftRatio = crop.leftRatio ?? 0.08;
  const rightRatio = crop.rightRatio ?? 0.92;
  const topRatio = Math.max(0, Math.min(0.95, crop.topRatio));
  const bottomRatio = Math.max(topRatio + 0.04, Math.min(1, crop.bottomRatio));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setContainerWidth(Math.min(el.clientWidth, 760));
      }
    };
    updateWidth();
    const obs = new ResizeObserver(updateWidth);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;

    async function renderCroppedTask() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setStatus('loading');

      try {
        const doc = await getCachedPdfDoc(lecture.url);
        if (cancelled) return;

        const pdfPage = await doc.getPage(crop.page);
        if (cancelled) return;

        const baseVp = pdfPage.getViewport({scale: 1});
        const cropFractionW = Math.max(0.2, rightRatio - leftRatio);
        const cropFractionH = Math.max(0.04, bottomRatio - topRatio);

        const targetCssW = Math.max(260, containerWidth);
        const fullPageCssW = targetCssW / cropFractionW;
        const scale = fullPageCssW / baseVp.width;
        const fullVp = pdfPage.getViewport({scale});

        const cropCssW = Math.floor(fullVp.width * cropFractionW);
        const cropCssH = Math.floor(fullVp.height * cropFractionH);
        const offsetX = -Math.floor(fullVp.width * leftRatio);
        const offsetY = -Math.floor(fullVp.height * topRatio);

        // Render full page onto an offscreen canvas at high DPI, then blit cropped region
        const dpr = Math.min(window.devicePixelRatio || 1, 2.25);
        const offscreen = document.createElement('canvas');
        offscreen.width = Math.floor(fullVp.width * dpr);
        offscreen.height = Math.floor(fullVp.height * dpr);

        renderTask = pdfPage.render({
          canvas: offscreen,
          viewport: fullVp,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });
        await renderTask.promise;
        if (cancelled) return;

        canvas.width = Math.floor(cropCssW * dpr);
        canvas.height = Math.floor(cropCssH * dpr);
        canvas.style.width = `${cropCssW}px`;
        canvas.style.height = `${cropCssH}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            offscreen,
            Math.floor(offsetX * dpr),
            Math.floor(offsetY * dpr),
          );
        }

        if (!cancelled) {
          setStatus('ready');
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes('cancel')) return;
        setStatus('error');
      }
    }

    renderCroppedTask();
    return () => {
      cancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [
    lecture.url,
    crop.page,
    topRatio,
    bottomRatio,
    leftRatio,
    rightRatio,
    containerWidth,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white p-2 sm:p-3 flex items-center justify-center min-h-[96px] shadow-2xs ${className}`}
    >
      {status === 'loading' && (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
          <span>Вырезка оригинала задачи из PDF (стр. {crop.page})...</span>
        </div>
      )}

      {status === 'error' ? (
        <div className="py-5 flex items-center gap-2 text-xs text-rose-600">
          <FileWarning className="h-4 w-4" />
          <span>Не удалось отрисовать фрагмент PDF (стр. {crop.page})</span>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="block max-w-full h-auto rounded"
          aria-label={label ?? `Фрагмент задачи со страницы ${crop.page}`}
        />
      )}
    </div>
  );
}
