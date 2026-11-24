import {useEffect, useState} from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Maximize2,
} from 'lucide-react';
import {LECTURE_MAP} from '../data/lectures';
import {SlideAttachment} from '../types/study';
import {SlideCanvas} from './SlideCanvas';
import {SlideModal} from './SlideModal';

interface SlideAttachmentsPanelProps {
  slides: SlideAttachment[];
  heading?: string;
  compact?: boolean;
  defaultHidden?: boolean;
}

export function SlideAttachmentsPanel({
  slides,
  heading = 'Прикреплённые слайды лекции',
  compact = false,
  defaultHidden = true,
}: SlideAttachmentsPanelProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [browseOffset, setBrowseOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(() => defaultHidden);

  const slidesKey = slides
    .map((s) => `${s.lectureId}:${s.page}:${s.label}`)
    .join('|');

  useEffect(() => {
    setSelectedIdx(0);
    setBrowseOffset(0);
    setIsHidden(defaultHidden);
  }, [slidesKey, defaultHidden]);

  if (slides.length === 0) {
    return null;
  }

  const activeAttachment = slides[selectedIdx] ?? slides[0];
  const lecture = LECTURE_MAP[activeAttachment.lectureId];
  const currentPage = Math.max(
    1,
    Math.min(activeAttachment.page + browseOffset, lecture.pageCount),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
              {heading}
            </h4>
            {activeAttachment.isAnswerSlide && browseOffset === 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Слайд с ответом</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsHidden((h) => !h)}
            className="prism-tool-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#E5E7EB] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isHidden ? (
              <>
                <Eye className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Показать слайд</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-slate-500 dark:text-[#9CA3AF]" />
                <span>Скрыть</span>
              </>
            )}
          </button>
        </div>

        {!isHidden && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-white/[0.07]">
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setBrowseOffset((o) => o - 1)}
                className="prism-tool-btn inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#E5E7EB] disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                title="Предыдущий слайд этой лекции"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Лист</span>
              </button>

              <span className="px-2 text-xs font-mono tabular-nums text-slate-700 dark:text-[#E2E8F0] whitespace-nowrap">
                стр. {currentPage}/{lecture.pageCount}
              </span>

              <button
                type="button"
                disabled={currentPage >= lecture.pageCount}
                onClick={() => setBrowseOffset((o) => o + 1)}
                className="prism-tool-btn inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-full text-slate-700 dark:text-[#E5E7EB] disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                title="Следующий слайд этой лекции"
              >
                <span>Лист</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="prism-tool-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-slate-800 dark:text-[#F1F5F9] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Увеличить</span>
            </button>
          </div>
        )}
      </div>

      {isHidden ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 dark:border-white/[0.12] bg-slate-50/70 dark:bg-[#070B12]/55 p-6 text-center space-y-3 min-h-[260px]">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#121926] border border-slate-200/80 dark:border-white/[0.1] flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Eye className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC]">
            Слайд из лекции скрыт, чтобы не подсказывать ответ заранее
          </p>
          <p className="text-xs text-slate-600 dark:text-[#CBD5E1] font-mono tabular-nums">
            Слайдов: {slides.length} · {lecture.shortTitle}, стр. {activeAttachment.page}
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsHidden(false)}
              className="prism-cta inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Показать слайд с ответом ({slides.length})</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {slides.length > 1 && (
            <div className="flex flex-col gap-1.5">
              {slides.map((slide, idx) => {
                const isSelected = idx === selectedIdx;
                const slideLecture = LECTURE_MAP[slide.lectureId];
                return (
                  <button
                    key={`${slide.lectureId}-${slide.page}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedIdx(idx);
                      setBrowseOffset(0);
                    }}
                    className={`w-full flex items-start justify-between gap-2.5 px-3 py-2 text-left text-xs rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'prism-tab-active font-semibold text-slate-950 dark:text-[#F8FAFC]'
                        : 'prism-tool-btn font-medium text-slate-800 dark:text-[#CBD5E1] hover:text-slate-950 dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    <span className="flex items-start gap-2 min-w-0 leading-snug">
                      {slide.isAnswerSlide && (
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      <span className="break-words">{slide.label}</span>
                    </span>
                    <span
                      className={`text-[11px] font-mono tabular-nums whitespace-nowrap shrink-0 mt-0.5 ${
                        isSelected
                          ? 'text-cyan-700 dark:text-cyan-300'
                          : 'text-slate-600 dark:text-[#94A3B8]'
                      }`}
                    >
                      {slideLecture.shortTitle} · с.{slide.page}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="text-xs leading-relaxed text-slate-600 dark:text-[#CBD5E1] tabular-nums">
            <span className="font-semibold text-slate-800 dark:text-[#F1F5F9]">
              {lecture.shortTitle}
            </span>
            <span aria-hidden="true"> · </span>
            <span>{lecture.title}</span>
            <span aria-hidden="true"> · </span>
            <span className="text-slate-700 dark:text-[#E2E8F0]">{activeAttachment.label}</span>
            {browseOffset !== 0 && (
              <>
                <span aria-hidden="true"> · </span>
                <button
                  type="button"
                  onClick={() => setBrowseOffset(0)}
                  className="text-cyan-600 dark:text-cyan-300 hover:underline cursor-pointer"
                >
                  Вернуться к с.{activeAttachment.page}
                </button>
              </>
            )}
          </div>

          <SlideCanvas
            lectureId={activeAttachment.lectureId}
            page={currentPage}
            maxWidth={compact ? 1040 : 1200}
          />
        </>
      )}

      {modalOpen && (
        <SlideModal
          lectureId={activeAttachment.lectureId}
          initialPage={currentPage}
          title={activeAttachment.label}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
