import {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, Maximize2} from 'lucide-react';
import {LECTURES, LECTURE_MAP} from '../data';
import {LectureId, StudyCategory} from '../types/study';
import {SlideCanvas} from './SlideCanvas';
import {SlideModal} from './SlideModal';

interface LecturesLibraryProps {
  category: StudyCategory;
}

export function LecturesLibrary({category}: LecturesLibraryProps) {
  const [selectedId, setSelectedId] = useState<LectureId>(
    category === 'rk'
      ? 'rk2_angeom'
      : category === 'matan'
        ? 'matan_theory'
        : 'lec1',
  );
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setSelectedId(
      category === 'rk'
        ? 'rk2_angeom'
        : category === 'matan'
          ? 'matan_theory'
          : 'lec1',
    );
    setPage(1);
  }, [category]);

  const visibleLectures =
    category === 'rk'
      ? LECTURES.filter((l) => l.category === 'rk')
      : category === 'matan'
        ? LECTURES.filter((l) => l.category === 'matan')
        : LECTURES.filter((l) => l.category !== 'rk' && l.category !== 'matan');

  if (category.startsWith('custom_')) {
    return (
      <section className="prism-surface rounded-2xl p-8 text-center space-y-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-[#F3F4F6]">
          Карточки этого предмета уже извлечены из вашего PDF
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
          Исходный локальный PDF-файл обрабатывается прямо в браузере и не загружается на сервер. В каждой карточке в подсказке указан номер исходной страницы.
        </p>
      </section>
    );
  }

  const activeLecture = LECTURE_MAP[selectedId] ?? visibleLectures[0];

  const handleSelectLecture = (id: LectureId) => {
    setSelectedId(id);
    setPage(1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Lecture Catalog */}
      <aside className="lg:col-span-4 prism-surface rounded-2xl p-4 space-y-2">
        <div className="px-1 pb-2 border-b border-slate-100 dark:border-white/[0.08]">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
            {category === 'rk'
              ? 'PDF-документ Рубежного контроля №2'
              : category === 'matan'
                ? 'PDF-документы Экзамена по Матану'
                : 'Исходные PDF-материалы курса АИП'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5 tabular-nums">
            {category === 'rk'
              ? 'Ангем РК 2 · 4 страницы (теория, задачи, типовой билет)'
              : category === 'matan'
                ? `${visibleLectures.length} PDF-документов · ${visibleLectures.reduce((sum, d) => sum + d.pageCount, 0)} стр.: теория, задачи G22 и 3 методички МГТУ Ч.1–3`
                : `${visibleLectures.length} документов · перечень и 8 лекций`}
          </p>
        </div>

        <div className="space-y-1.5">
          {visibleLectures.map((doc) => {
            const isActive = doc.id === activeLecture.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => handleSelectLecture(doc.id)}
                className={`w-full text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 border-sky-300 dark:bg-sky-500/15 dark:border-sky-500/50'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 dark:bg-[#0B101B] dark:border-white/[0.08] dark:hover:border-[#404040]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-sky-700 dark:text-sky-400">
                    {doc.shortTitle}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-[#94A3B8] tabular-nums">
                    {doc.pageCount} стр.
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-[#F3F4F6] leading-snug">
                  {doc.title}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                  {doc.chapterLabel} · {doc.dateLabel}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Column: Slide Browser */}
      <section className="lg:col-span-8 prism-surface rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              {activeLecture.shortTitle} · {activeLecture.chapterLabel}
            </p>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-[#F3F4F6] truncate">
              {activeLecture.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Предыдущий слайд"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-slate-700 dark:text-[#E5E7EB]">
              <input
                type="number"
                min={1}
                max={activeLecture.pageCount}
                value={page}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!Number.isNaN(val)) {
                    setPage(Math.max(1, Math.min(val, activeLecture.pageCount)));
                  }
                }}
                aria-label="Номер страницы лекции"
                className="w-14 px-2 py-1.5 text-center rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span>/ {activeLecture.pageCount}</span>
            </div>

            <button
              type="button"
              disabled={page >= activeLecture.pageCount}
              onClick={() => setPage((p) => Math.min(activeLecture.pageCount, p + 1))}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Следующий слайд"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg prism-cta transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>На весь экран</span>
            </button>
          </div>
        </div>

        <div className="mt-4">
          <SlideCanvas lectureId={selectedId} page={page} maxWidth={960} />
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.08] flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-[#94A3B8]">
          {activeLecture.topics.map((topic, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mr-4" aria-hidden="true">·</span>}
              {topic}
            </span>
          ))}
        </div>
      </section>

      {modalOpen && (
        <SlideModal
          lectureId={selectedId}
          initialPage={page}
          title={activeLecture.title}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
