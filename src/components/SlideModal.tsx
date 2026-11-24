import {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut} from 'lucide-react';
import {LECTURE_MAP} from '../data/lectures';
import {LectureId} from '../types/study';
import {SlideCanvas} from './SlideCanvas';

interface SlideModalProps {
  lectureId: LectureId;
  initialPage: number;
  title?: string;
  onClose: () => void;
}

export function SlideModal({
  lectureId,
  initialPage,
  title,
  onClose,
}: SlideModalProps) {
  const lecture = LECTURE_MAP[lectureId];
  const [page, setPage] = useState(initialPage);
  const [zoomWidth, setZoomWidth] = useState(980);

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage, lectureId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setPage((p) => Math.max(1, p - 1));
      } else if (e.key === 'ArrowRight') {
        setPage((p) => Math.min(lecture.pageCount, p + 1));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lecture.pageCount, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04070D]/80 backdrop-blur-md p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? lecture.title}
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full max-w-6xl max-h-[92vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {title ?? lecture.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {lecture.shortTitle} · {lecture.chapterLabel} · страница {page} из {lecture.pageCount}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setZoomWidth((w) => Math.max(680, w - 160))}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Уменьшить масштаб"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="px-2.5 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {Math.round((zoomWidth / 980) * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomWidth((w) => Math.min(1460, w + 160))}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Увеличить масштаб"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                aria-label="Предыдущая страница"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2.5 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {page} / {lecture.pageCount}
              </span>
              <button
                type="button"
                disabled={page >= lecture.pageCount}
                onClick={() => setPage((p) => Math.min(lecture.pageCount, p + 1))}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                aria-label="Следующая страница"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Закрыть просмотр"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100 dark:bg-[#0B1120] flex justify-center">
          <div style={{width: `${zoomWidth}px`, maxWidth: '100%'}}>
            <SlideCanvas lectureId={lectureId} page={page} maxWidth={zoomWidth} />
          </div>
        </div>
      </div>
    </div>
  );
}
