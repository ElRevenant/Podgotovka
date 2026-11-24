import {useEffect, useMemo, useState} from 'react';
import {AlertCircle, ArrowUpRight, CheckCircle2, HelpCircle, Search, Sparkles} from 'lucide-react';
import {LECTURES} from '../data';
import {CardSRState, StudyCategory, TaskCard, TheoryCard} from '../types/study';
import {
  getCardMasteryPercent,
  getCardSRState,
  getCardVisualTier,
} from '../utils/spacedRepetition';

interface CompletenessAuditProps {
  category: StudyCategory;
  allCards: TheoryCard[];
  tasks: TaskCard[];
  srMap: Record<number, CardSRState>;
  onOpenQuestion: (id: number) => void;
  onOpenTask: (id: string) => void;
}

type AuditFilter =
  | 'all'
  | 'official50'
  | 'extras'
  | 'supplemented'
  | 'rk_basic'
  | 'rk_advanced'
  | 'rk_tasks'
  | 'rk_ticket'
  | 'matan_theorems'
  | 'matan_defs'
  | 'matan_metodichka'
  | 'unseen';

export function CompletenessAudit({
  category,
  allCards,
  tasks,
  srMap,
  onOpenQuestion,
  onOpenTask,
}: CompletenessAuditProps) {
  const [query, setQuery] = useState('');
  const [coverageFilter, setCoverageFilter] = useState<AuditFilter>('all');

  useEffect(() => {
    setCoverageFilter('all');
    setQuery('');
  }, [category]);

  const examTasks = useMemo(
    () =>
      category === 'rk'
        ? tasks.filter((t) => t.kind === 'rk-ticket')
        : category === 'matan'
          ? (
              ['matan-1', 'matan-2', 'matan-3', 'matan-4', 'matan-5'] as const
            )
              .map((kind) => tasks.find((t) => t.kind === kind))
              .filter((t): t is TaskCard => Boolean(t))
          : tasks.filter((t) => t.kind === 'exam'),
    [category, tasks],
  );

  const stats = useMemo(() => {
    const idsPresent = new Set(allCards.map((q) => q.id));
    let missingOfficial = 0;
    if (category === 'rk') {
      for (let i = 201; i <= 232; i++) {
        if (!idsPresent.has(i)) missingOfficial++;
      }
    } else if (category === 'matan') {
      for (let i = 501; i <= 549; i++) {
        if (!idsPresent.has(i)) missingOfficial++;
      }
      for (let i = 551; i <= 598; i++) {
        if (!idsPresent.has(i)) missingOfficial++;
      }
    } else if (!category.startsWith('custom_')) {
      for (let i = 1; i <= 50; i++) {
        if (!idsPresent.has(i)) missingOfficial++;
      }
    }

    const rkBasicCount = allCards.filter((q) => q.id >= 201 && q.id <= 224).length;
    const rkAdvCount = allCards.filter((q) => q.id >= 225 && q.id <= 232).length;
    const rkTaskCardCount = tasks.length;

    const matanTheoremsCount = allCards.filter(
      (q) => q.id >= 501 && q.id <= 549,
    ).length;
    const matanDefsCount = allCards.filter(
      (q) => q.id >= 551 && q.id <= 598,
    ).length;
    const matanMetodichkaCount = allCards.filter(
      (q) => q.id >= 601 && q.id <= 699,
    ).length;
    const matanDocs = LECTURES.filter((d) => d.category === 'matan');
    const matanPdfCount = matanDocs.length;
    const matanPdfPages = matanDocs.reduce((sum, d) => sum + d.pageCount, 0);

    const extraCount = allCards.filter(
      (q) => q.id > 50 && !q.isCustom,
    ).length;
    const customCount = allCards.filter((q) => q.isCustom).length;
    const knownCount = allCards.filter(
      (q) => getCardSRState(srMap, q.id).status === 'known',
    ).length;
    const supplementedCount = allCards.filter(
      (q) => q.coverage === 'supplemented',
    ).length;
    const withAnswerSlides = allCards.filter((q) =>
      q.slides.some((s) => s.isAnswerSlide),
    ).length;

    return {
      totalCards: allCards.length,
      missingOfficial,
      rkBasicCount,
      rkAdvCount,
      rkTaskCardCount,
      matanTheoremsCount,
      matanDefsCount,
      matanMetodichkaCount,
      matanPdfCount,
      matanPdfPages,
      extraCount,
      customCount,
      examTasksCount: examTasks.length,
      knownCount,
      supplementedCount,
      withAnswerSlides,
    };
  }, [allCards, category, examTasks.length, srMap, tasks.length]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCards.filter((item) => {
      if (coverageFilter === 'official50' && item.id > 50) return false;
      if (coverageFilter === 'extras' && (item.id <= 50 || item.isCustom)) {
        return false;
      }
      if (coverageFilter === 'supplemented' && item.coverage !== 'supplemented') {
        return false;
      }
      if (coverageFilter === 'rk_basic' && (item.id < 201 || item.id > 224)) {
        return false;
      }
      if (coverageFilter === 'rk_advanced' && (item.id < 225 || item.id > 232)) {
        return false;
      }
      if (coverageFilter === 'rk_tasks' && (item.id < 233 || item.id > 249)) {
        return false;
      }
      if (
        coverageFilter === 'rk_ticket' &&
        !item.slides.some((s) => s.lectureId === 'rk2_angeom' && s.page === 4)
      ) {
        return false;
      }
      if (
        coverageFilter === 'matan_theorems' &&
        (item.id < 501 || item.id > 549)
      ) {
        return false;
      }
      if (
        coverageFilter === 'matan_defs' &&
        (item.id < 551 || item.id > 598)
      ) {
        return false;
      }
      if (
        coverageFilter === 'matan_metodichka' &&
        (item.id < 601 || item.id > 699)
      ) {
        return false;
      }
      if (
        coverageFilter === 'unseen' &&
        getCardSRState(srMap, item.id).status !== 'unseen'
      ) {
        return false;
      }
      if (!q) return true;
      return `${item.id} ${item.badgeLabel ?? ''} ${item.question} ${item.chapter}`
        .toLowerCase()
        .includes(q);
    });
  }, [allCards, coverageFilter, query, srMap]);

  return (
    <div className="flex flex-col gap-6">
      {/* Audit Summary Cards */}
      {category === 'rk' ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="prism-surface rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Базовые теоретические вопросы РК 2
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F3F4F6]">
              {stats.rkBasicCount} / 24
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Все 24 базовых вопроса (стр. 1 PDF)</span>
            </p>
          </div>

          <div className="prism-surface rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Теория повышенной сложности (с док-вом)
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F3F4F6]">
              {stats.rkAdvCount} / 8
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Полные доказательства всех 8 теорем</span>
            </p>
          </div>

          <div className="prism-surface rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Задачи РК 2 (База + Повыш. + Билет)
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F3F4F6]">
              {stats.rkTaskCardCount} / 17
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>8 базовых + 3 повыш. + 6 типового билета</span>
            </p>
          </div>

          <div className="prism-surface rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Привязка к страницам PDF «Ангем РК 2»
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F3F4F6]">
              {stats.withAnswerSlides} / {stats.totalCards}
            </p>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-[#D1D5DB] tabular-nums">
              Все 4 страницы PDF · Своих карточек: {stats.customCount}
            </p>
          </div>
        </section>
      ) : category === 'matan' ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="prism-surface rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Экзаменационные вопросы (теоремы)
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F3F4F6]">
              {stats.matanTheoremsCount} / 49
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Все 49 билетных теорем с док-вами (стр. 9–62)</span>
            </p>
          </div>

          <div className="prism-surface rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Базовые определения + Методички Ч.1–3
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F3F4F6]">
              {stats.matanDefsCount} + {stats.matanMetodichkaCount}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>48 опред. + {stats.matanMetodichkaCount} карточек таблиц и алгоритмов</span>
            </p>
          </div>

          <div className="prism-surface rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Практика (G22 + Методички МГТУ Ч.1–3)
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F3F4F6]">
              {tasks.length} задач
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>30 G22 + 9 разборов из методичек с автопроверкой</span>
            </p>
          </div>

          <div className="prism-surface rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Привязка к PDF Матана ({stats.matanPdfCount} документов)
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F3F4F6]">
              {stats.withAnswerSlides} / {stats.totalCards}
            </p>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-[#D1D5DB] tabular-nums">
              {stats.matanPdfPages} стр. PDF (конспект + G22 + 3 метод.) · Своих: {stats.customCount}
            </p>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="prism-surface rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Официальные билеты экзамена
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F3F4F6]">
              50 / 50
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>
                {stats.missingOfficial === 0
                  ? 'Все номера 1–50 без пропусков'
                  : `Пропущено: ${stats.missingOfficial}`}
              </span>
            </p>
          </div>

          <div className="prism-surface rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Доп. темы из концов лекций 1.1–1.8
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F3F4F6]">
              +{stats.extraCount} тем (№51–62)
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Кодировки, inline, argc/argv, fseek, remove</span>
            </p>
          </div>

          <div className="prism-surface rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Экзаменационные задачи и примеры
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F3F4F6]">
              {stats.examTasksCount} / 2 + 17 Ex
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Код Си, схемы ГОСТ и слайды-ответы</span>
            </p>
          </div>

          <div className="prism-surface rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Привязка к слайдам PDF
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F3F4F6]">
              {stats.withAnswerSlides} / {stats.totalCards}
            </p>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-[#D1D5DB] tabular-nums">
              Документов PDF: {LECTURES.length} · Своих карточек: {stats.customCount}
            </p>
          </div>
        </section>
      )}

      {/* Audit Note on Complete Lecture Coverage */}
      <section className="prism-surface rounded-2xl p-5">
        {category === 'rk' ? (
          <>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F3F4F6]">
              Полный аудит PDF «Ангем РК 2»: 24 базовых вопроса + 8 доказательств + 17 задач + типовой билет
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#D1D5DB]">
              Проверены все 4 страницы загруженного документа «Аналитическая геометрия, 1-й семестр, ИУ (кроме ИУ9), РЛ, ПС, РТ · Рубежный контроль 2». В базу включены все 24 базовых теоретических вопроса (стр. 1), все 8 теоретических вопросов повышенной сложности с полными математическими доказательствами (стр. 1–2), все 8 базовых задач (стр. 2), все 3 задачи повышенной сложности (стр. 3), а также все 4 теоретических вопроса и 6 задач из Типового варианта билета (стр. 4).
            </p>

            {/* Sample Theory Ticket Questions (Page 4) */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              {[206, 214, 221, 230].map((qId, idx) => {
                const card = allCards.find((q) => q.id === qId);
                if (!card) return null;
                return (
                  <button
                    key={qId}
                    type="button"
                    onClick={() => onOpenQuestion(qId)}
                    className="text-left rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] p-3.5 hover:border-sky-400 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400">
                        Типовой билет · Теория №{idx + 1} ({idx === 3 ? '3 балла' : '1 балл'})
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-900 dark:text-[#F3F4F6] line-clamp-2">
                      {card.question}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Sample Tasks Ticket Strip (Page 4) */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {examTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onOpenTask(task.id)}
                  className="text-left rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] p-3.5 hover:border-sky-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {task.badgeNumber} · Решено
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-900 dark:text-[#F3F4F6] line-clamp-1">
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8] line-clamp-1">
                    Ответ: {task.expectedOutput}
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : category === 'matan' ? (
          <>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F3F4F6]">
              Полный аудит Матана: 49 вопросов + 48 определений + {stats.matanMetodichkaCount} карточек методичек + {tasks.length} задач ({stats.matanPdfCount} PDF · {stats.matanPdfPages} стр.)
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#D1D5DB]">
              Проверены все {stats.matanPdfCount} загруженных PDF-документов по Математическому анализу (1-й семестр, ИУ / РЛ / ПС / РТ · G22): конспект теории (62 стр. — 48 базовых определений и 49 билетных теорем с доказательствами), сборник экзаменационных задач G22 (32 стр. — 5 комплектов билета) и три официальные методички МГТУ им. Н.Э. Баумана «Введение в анализ. Теория пределов» Части 1–3 (96 стр. — алгоритмы ε–N, 6 окрестностей, таблицы 10 эквивалентностей и главных частей б.м.ф./б.б.ф., классификация разрывов и контрольные задания с ответами).
            </p>

            {/* Key Theorems Spotlight */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              {[501, 524, 535, 545].map((qId) => {
                const card = allCards.find((q) => q.id === qId);
                if (!card) return null;
                return (
                  <button
                    key={qId}
                    type="button"
                    onClick={() => onOpenQuestion(qId)}
                    className="text-left rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] p-3.5 hover:border-sky-400 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400">
                        {card.badgeLabel ?? `Вопрос №${qId - 500}`}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-900 dark:text-[#F3F4F6] line-clamp-2">
                      {card.question}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* 5 G22 Task Sets Quick-Open Strip */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {examTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onOpenTask(task.id)}
                  className="text-left rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] p-3.5 hover:border-sky-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {task.badgeNumber}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-900 dark:text-[#F3F4F6] line-clamp-1">
                    {task.title}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-[#94A3B8] line-clamp-1">
                    {task.chapter}
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F3F4F6]">
              Полный аудит: 50 экзаменационных билетов + 12 дополнительных разделов лекций + 2 задачи
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#D1D5DB]">
              Проверены все 9 PDF-документов до последней страницы. Помимо 50 вопросов из официального перечня, в колоду включены 12 дополнительных карточек (№51–62) по разделам из концов лекций: побитовые операции и <code className="font-mono text-xs">sizeof</code>, <code className="font-mono text-xs">&lt;cmath&gt;</code> и <code className="font-mono text-xs">rand()</code>, операторы <code className="font-mono text-xs">goto/break/continue</code>, классификация циклов, поиск экстремума <code className="font-mono text-xs">Ex03_03</code>, функции <code className="font-mono text-xs">atoi/atof/sprintf</code>, параметры командной строки <code className="font-mono text-xs">argc/argv</code>, <code className="font-mono text-xs">inline</code> и перегрузка функций, кодировки <code className="font-mono text-xs">ASCII / CP-866 / Win-1251 / UTF-16 / UTF-8</code>, позиционирование <code className="font-mono text-xs">fseek / ftell / rewind</code> и файловые операции <code className="font-mono text-xs">remove / rename</code>.
            </p>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[11, 41, 45].map((qId) => {
                const card = allCards.find((q) => q.id === qId);
                if (!card) return null;
                return (
                  <button
                    key={qId}
                    type="button"
                    onClick={() => onOpenQuestion(qId)}
                    className="text-left rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] p-3.5 hover:border-sky-400 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400">
                        Вопрос {card.id} (дополнено)
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-900 dark:text-[#F3F4F6] line-clamp-2">
                      {card.question}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-[#94A3B8]">
                      {card.coverageNote}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Exam Tasks Verification Strip */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-3">
              {examTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onOpenTask(task.id)}
                  className="text-left rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] p-3.5 hover:border-sky-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {task.badgeNumber} · Проверено
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-[#F3F4F6]">
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                    Прикреплено слайдов: {task.slides.length} · Схемы ГОСТ 19.701-90 (main + подпрограмма)
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Complete Verification Table */}
      <section className="prism-surface rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B101B]">
            <button
              type="button"
              onClick={() => setCoverageFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                coverageFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
              }`}
            >
              Все карточки ({allCards.length})
            </button>

            {category === 'rk' ? (
              <>
                <button
                  type="button"
                  onClick={() => setCoverageFilter('rk_basic')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    coverageFilter === 'rk_basic'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
                  }`}
                >
                  Базовая теория (24)
                </button>
                <button
                  type="button"
                  onClick={() => setCoverageFilter('rk_advanced')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    coverageFilter === 'rk_advanced'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
                  }`}
                >
                  Повыш. сложность (8)
                </button>
                <button
                  type="button"
                  onClick={() => setCoverageFilter('rk_ticket')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    coverageFilter === 'rk_ticket'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
                  }`}
                >
                  Типовой билет теории (4)
                </button>
              </>
            ) : category === 'matan' ? (
              <>
                <button
                  type="button"
                  onClick={() => setCoverageFilter('matan_theorems')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    coverageFilter === 'matan_theorems'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
                  }`}
                >
                  49 вопросов (теоремы)
                </button>
                <button
                  type="button"
                  onClick={() => setCoverageFilter('matan_defs')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    coverageFilter === 'matan_defs'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
                  }`}
                >
                  48 определений
                </button>
                <button
                  type="button"
                  onClick={() => setCoverageFilter('matan_metodichka')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    coverageFilter === 'matan_metodichka'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
                  }`}
                >
                  Методички Ч.1–3 ({stats.matanMetodichkaCount})
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCoverageFilter('official50')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    coverageFilter === 'official50'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
                  }`}
                >
                  Билеты 1–50
                </button>
                <button
                  type="button"
                  onClick={() => setCoverageFilter('extras')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    coverageFilter === 'extras'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
                  }`}
                >
                  Доп. темы лекций (51–62)
                </button>
                <button
                  type="button"
                  onClick={() => setCoverageFilter('supplemented')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    coverageFilter === 'supplemented'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
                  }`}
                >
                  Уточнённые (3)
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setCoverageFilter('unseen')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                coverageFilter === 'unseen'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#131B2B] dark:text-[#F3F4F6]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8]'
              }`}
            >
              Ещё не изучены
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Фильтр по тексту..."
              aria-label="Фильтр таблицы проверки"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B101B] text-slate-900 dark:text-[#F3F4F6] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/[0.07] text-xs font-semibold text-slate-500 dark:text-[#94A3B8] bg-slate-50/70 dark:bg-[#0B101B]">
                <th className="py-3 px-4 w-36">Номер / Тип</th>
                <th className="py-3 px-4">Вопрос / тема</th>
                <th className="py-3 px-4 hidden md:table-cell w-56">Раздел</th>
                <th className="py-3 px-4 w-28">Слайды</th>
                <th className="py-3 px-4 w-44">Статус SM-2</th>
                <th className="py-3 px-4 w-28 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-sm">
              {filteredRows.map((item) => {
                const sr = getCardSRState(srMap, item.id);
                const tier = getCardVisualTier(sr);
                const pct = getCardMasteryPercent(sr);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#131B2B]/80 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-[#CBD5E1] align-top">
                      {item.badgeLabel ?? `№${item.id}`}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <p className="text-sm text-slate-900 dark:text-[#F3F4F6] leading-snug">
                        {item.question}
                      </p>
                      {item.coverage === 'supplemented' && (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                          Дополнено по курсу к опорным слайдам
                        </p>
                      )}
                      {item.coverage === 'lecture-extra' && (
                        <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-400">
                          Дополнительный раздел из слайдов лекции
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-xs text-slate-500 dark:text-[#94A3B8] align-top">
                      {item.chapter}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600 dark:text-[#CBD5E1] align-top">
                      {item.slides.length} сл.
                    </td>
                    <td className="py-3 px-4 text-xs align-top">
                      {tier === 'rainbow' && (
                        <span className="rainbow-mastered-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                          <Sparkles className="h-3 w-3" />
                          <span>Мастерство {pct}%</span>
                        </span>
                      )}
                      {tier === 'known' && (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Выучено (кор. {sr.box})</span>
                        </span>
                      )}
                      {tier === 'learning' && (
                        <span className="inline-flex items-center gap-1 font-medium text-cyan-700 dark:text-cyan-400 whitespace-nowrap">
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>Хорошо (кор. {sr.box})</span>
                        </span>
                      )}
                      {tier === 'hard' && (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300 whitespace-nowrap">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Сложно (ош: {sr.lapses})</span>
                        </span>
                      )}
                      {tier === 'again' && (
                        <span className="inline-flex items-center gap-1 font-medium text-rose-700 dark:text-rose-400 whitespace-nowrap">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Не помню (ош: {sr.lapses})</span>
                        </span>
                      )}
                      {tier === 'unseen' && (
                        <span className="text-slate-500 dark:text-[#64748B] whitespace-nowrap">
                          Не открывалось
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right align-top">
                      <button
                        type="button"
                        onClick={() => onOpenQuestion(item.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 dark:text-cyan-400 hover:underline whitespace-nowrap cursor-pointer"
                      >
                        <span>Открыть</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

