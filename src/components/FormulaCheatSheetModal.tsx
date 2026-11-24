import {useMemo, useState} from 'react';
import {BookOpen, Printer, X} from 'lucide-react';
import {CardSRState, StudyCategory, TheoryCard} from '../types/study';
import {getCardSRState} from '../utils/spacedRepetition';
import {MathBlock} from './MathBlock';

interface FormulaCheatSheetModalProps {
  category: StudyCategory;
  subjectTitle: string;
  allCards: TheoryCard[];
  srMap: Record<number, CardSRState>;
  onClose: () => void;
}

type SheetTab = 'matan' | 'rk' | 'exam' | 'weak_print';

interface FormulaRow {
  name: string;
  latex: string;
  note: string;
}

const MATAN_EQUIVALENTS: FormulaRow[] = [
  {
    name: 'Тригонометрия (x → 0)',
    latex:
      '\\sin x \\sim x,\\quad \\operatorname{tg} x \\sim x,\\quad \\arcsin x \\sim x,\\quad \\operatorname{arctg} x \\sim x,\\quad 1 - \\cos x \\sim \\dfrac{x^2}{2}',
    note: 'Только в произведениях и частных! В суммах/разностях — разложение по Тейлору.',
  },
  {
    name: 'Показательная и логарифм',
    latex:
      'e^x - 1 \\sim x,\\quad a^x - 1 \\sim x\\ln a,\\quad \\ln(1+x) \\sim x,\\quad (1+x)^\\alpha - 1 \\sim \\alpha x',
    note: 'Замечательный предел: \\lim_{x\\to 0}(1+x)^{1/x} = e.',
  },
  {
    name: 'Гиперболические (x → 0)',
    latex:
      '\\operatorname{sh} x \\sim x,\\quad \\operatorname{th} x \\sim x,\\quad \\operatorname{ch} x - 1 \\sim \\dfrac{x^2}{2}',
    note: 'sh x = (e^x - e^{-x})/2, ch x = (e^x + e^{-x})/2.',
  },
];

const MATAN_MACLAURIN: FormulaRow[] = [
  {
    name: 'Экспонента e^x',
    latex:
      'e^x = 1 + x + \\dfrac{x^2}{2!} + \\dfrac{x^3}{3!} + \\dots + \\dfrac{x^n}{n!} + o(x^n)',
    note: 'Справедливо для любого x ∈ ℝ.',
  },
  {
    name: 'Синус и косинус',
    latex:
      '\\sin x = x - \\dfrac{x^3}{3!} + \\dfrac{x^5}{5!} - \\dots + o(x^{2n+2}),\\quad \\cos x = 1 - \\dfrac{x^2}{2!} + \\dfrac{x^4}{4!} - \\dots + o(x^{2n+1})',
    note: 'Обязательно писать + o(x^k) нужного порядка при вычислении пределов!',
  },
  {
    name: 'Логарифм ln(1+x)',
    latex:
      '\\ln(1+x) = x - \\dfrac{x^2}{2} + \\dfrac{x^3}{3} - \\dfrac{x^4}{4} + \\dots + (-1)^{n-1}\\dfrac{x^n}{n} + o(x^n)',
    note: 'В знаменателях НЕТ факториалов! |x| < 1.',
  },
  {
    name: 'Бином (1+x)^α и геом. прогрессия',
    latex:
      '(1+x)^\\alpha = 1 + \\alpha x + \\dfrac{\\alpha(\\alpha-1)}{2!}x^2 + \\dots + o(x^n),\\quad \\dfrac{1}{1-x} = 1 + x + x^2 + \\dots + x^n + o(x^n)',
    note: 'Частый приём: √(1+x) = 1 + x/2 − x²/8 + o(x²).',
  },
  {
    name: 'Тангенс и арктангенс',
    latex:
      '\\operatorname{tg} x = x + \\dfrac{x^3}{3} + \\dfrac{2x^5}{15} + o(x^5),\\quad \\operatorname{arctg} x = x - \\dfrac{x^3}{3} + \\dfrac{x^5}{5} + o(x^5)',
    note: 'Не путать знак у x³/3: у tg плюс, у arctg минус.',
  },
];

const MATAN_DERIVATIVES_AND_STUDY: FormulaRow[] = [
  {
    name: 'Таблица производных (ловушки)',
    latex:
      '(\\arcsin x)\' = \\dfrac{1}{\\sqrt{1-x^2}},\\quad (\\operatorname{arctg} x)\' = \\dfrac{1}{1+x^2},\\quad (a^x)\' = a^x\\ln a,\\quad (\\log_a x)\' = \\dfrac{1}{x\\ln a}',
    note: 'Логарифмическое дифференцирование: (u^v)\' = u^v (v\'\\ln u + v\\cdot u\'/u).',
  },
  {
    name: 'Параметрическое дифференцирование',
    latex:
      'y\'_x = \\dfrac{y\'_t}{x\'_t},\\qquad y\'\'_{xx} = \\dfrac{(y\'_x)\'_t}{x\'_t} = \\dfrac{y\'\'_{tt} x\'_t - y\'_t x\'\'_{tt}}{(x\'_t)^3}',
    note: 'Частая ошибка: забыть разделить на x\'_t при вычислении второй производной!',
  },
  {
    name: 'Формула Лейбница (n-я производная)',
    latex: '(u\\cdot v)^{(n)} = \\sum_{k=0}^{n} C_n^k u^{(n-k)} v^{(k)}',
    note: 'Удобно, когда v(x) — многочлен малой степени.',
  },
  {
    name: 'Наклонные асимптоты (x → ±∞)',
    latex:
      'y = kx + b,\\qquad k = \\lim_{x\\to\\pm\\infty} \\dfrac{f(x)}{x},\\qquad b = \\lim_{x\\to\\pm\\infty}\\bigl(f(x) - kx\\bigr)',
    note: 'Проверять отдельно +∞ и −∞, если есть корни или экспоненты.',
  },
  {
    name: 'Классификация разрывов',
    latex:
      '\\text{Устранимый: } f(x_0-0)=f(x_0+0)\\ne f(x_0);\\quad \\text{1-го рода (скачок): конечны и не равны};\\quad \\text{2-го рода: хоть один } \\pm\\infty \\text{ или } \\nexists',
    note: 'Схема: область определения → односторонние пределы → вывод.',
  },
];

const RK_FORMULAS: FormulaRow[] = [
  {
    name: 'Обратная матрица и критерий существования',
    latex:
      'A^{-1} = \\dfrac{1}{\\det A}\\,(A^*)^T,\\qquad \\exists A^{-1} \\iff \\det A \\ne 0',
    note: 'Алгебраическое дополнение: A_{ij} = (-1)^{i+j} M_{ij}. Не забудьте транспонировать!',
  },
  {
    name: 'Свойства определителей',
    latex:
      '\\det(AB) = \\det A\\cdot\\det B,\\quad \\det(A^T)=\\det A,\\quad \\det(\\lambda A) = \\lambda^n \\det A,\\quad \\det(A^{-1}) = \\dfrac{1}{\\det A}',
    note: 'Множитель λ выносится из КАЖДОЙ из n строк → λ^n.',
  },
  {
    name: 'Теорема Кронекера–Капелли',
    latex:
      '\\text{СЛАУ } AX = B \\text{ совместна} \\iff \\operatorname{rg} A = \\operatorname{rg}(A\\mid B)',
    note: 'Если rg A = n — единственное решение; если rg A = r < n — бесконечно много (n−r свободных).',
  },
  {
    name: 'Формулы Крамера',
    latex: 'x_i = \\dfrac{\\Delta_i}{\\Delta},\\qquad \\Delta = \\det A \\ne 0',
    note: 'Δ_i получается заменой i-го столбца на столбец свободных членов B.',
  },
  {
    name: 'ФСР однородной СЛАУ (AX = 0)',
    latex:
      '\\dim V_0 = n - r,\\qquad X_{\\text{общ. одн.}} = C_1 X^{(1)} + \\dots + C_{n-r} X^{(n-r)}',
    note: 'Для неоднородной: X_общ = X_частн + X_общ.одн.',
  },
];

const EXAM_AIP_ROWS: {title: string; code: string; note: string}[] = [
  {
    title: 'Теорема Бёма–Якопини и ГОСТ 19.701-90',
    code: 'Базовые конструкции: следование, ветвление (ромб), цикл ПОКА.\nПодпрограмма: предопределённый процесс (прямоугольник с двойными боковыми линиями).',
    note: 'Неструктурные операторы break/continue/goto допустимы только по явной договорённости.',
  },
  {
    title: 'Память и указатели C/C++',
    code: 'int *p = new int[n];  // куча (heap)\ndelete[] p;           // обязательно с [] для массива!\np + k  =>  сдвиг адреса на k * sizeof(T) байт',
    note: 'Локальные переменные — стек; static/глобальные — сегмент данных; new/malloc — куча.',
  },
  {
    title: 'Матрица в функции и одномерная развёртка',
    code: 'void f(int a[][M], int n);       // число столбцов M — константа!\nint elem = B[i * q + j];          // элемент [i][j] при q столбцах',
    note: 'Параметр-массив в функции вырождается в указатель, поэтому range-for по нему не работает.',
  },
  {
    title: 'Структуры данных и обходы деревьев',
    code: 'Стек: LIFO | Очередь: FIFO | Бинарное дерево поиска:\nNLR (прямой) | LNR (симметричный — по возрастанию!) | LRN (обратный — удаление Del_Tree)',
    note: 'Удаление дерева всегда выполняют обратным обходом (LRN): сначала потомки, потом корень.',
  },
  {
    title: 'Файлы и заголовочные файлы',
    code: '#ifndef MY_HEADER_H\n#define MY_HEADER_H\n...\n#endif\n// Двоичный: fread/fwrite | Текстовый безопасный: fgets(buf, size, f)',
    note: 'Разделитель путей в Astra Linux — «/». Журнальный файл: struct с тегом типа + union.',
  },
];

export function FormulaCheatSheetModal({
  category,
  subjectTitle,
  allCards,
  srMap,
  onClose,
}: FormulaCheatSheetModalProps) {
  const initialTab: SheetTab =
    category === 'rk'
      ? 'rk'
      : category === 'exam'
        ? 'exam'
        : category === 'matan'
          ? 'matan'
          : 'weak_print';
  const [tab, setTab] = useState<SheetTab>(initialTab);
  const [printScope, setPrintScope] = useState<'weak' | 'all_with_formulas'>(
    'weak',
  );

  const weakCards = useMemo(() => {
    const scored = allCards.map((card) => {
      const sr = getCardSRState(srMap, card.id);
      const priority =
        sr.status === 'hard'
          ? 100 + sr.lapses * 20
          : sr.status === 'unseen'
            ? 60
            : sr.status === 'learning'
              ? 40 + sr.lapses * 10
              : 0;
      return {card, sr, priority};
    });
    const nonKnown = scored
      .filter((x) => x.sr.status !== 'known')
      .sort((a, b) => b.priority - a.priority);
    if (nonKnown.length > 0) {
      return nonKnown.slice(0, 30);
    }
    return scored.slice(0, 20);
  }, [allCards, srMap]);

  const formulaCards = useMemo(
    () =>
      allCards
        .filter((c) => Boolean(c.mathFormulaLatex) || Boolean(c.codeSnippet))
        .slice(0, 40),
    [allCards],
  );

  const cardsToPrint =
    printScope === 'weak'
      ? weakCards.map((w) => w.card)
      : formulaCards.length > 0
        ? formulaCards
        : allCards.slice(0, 30);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#04070D]/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      {/* Interactive Modal UI (hidden on print via no-print) */}
      <div className="no-print w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1522] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F3F4F6]">
                Справочник формул и печать шпаргалки (PDF)
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Компактные таблицы формул KaTeX + лист ваших слабых карточек для печати
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg prism-cta transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Печать / Сохранить PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть справочник"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#182235] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B101B] flex flex-wrap items-center gap-1.5">
          {(
            [
              {id: 'matan', label: 'Матан (формулы и Тейлор)'},
              {id: 'rk', label: 'Ангем РК 2 (матрицы и СЛАУ)'},
              {id: 'exam', label: 'АИП (C/C++ и ГОСТ)'},
              {
                id: 'weak_print',
                label: `Лист слабых карточек (${weakCards.length})`,
              },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tab === t.id
                  ? 'prism-cta'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F3F4F6]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {tab === 'matan' && (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F3F4F6]">
                  1. Таблица эквивалентных бесконечно малых (при x → 0)
                </h3>
                <div className="space-y-2.5">
                  {MATAN_EQUIVALENTS.map((row) => (
                    <div
                      key={row.name}
                      className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B101B] p-3.5"
                    >
                      <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                        {row.name}
                      </p>
                      <MathBlock latex={row.latex} displayMode={true} />
                      <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                        {row.note}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F3F4F6]">
                  2. Разложения Маклорена с остатком в форме Пеано
                </h3>
                <div className="space-y-2.5">
                  {MATAN_MACLAURIN.map((row) => (
                    <div
                      key={row.name}
                      className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B101B] p-3.5"
                    >
                      <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                        {row.name}
                      </p>
                      <MathBlock latex={row.latex} displayMode={true} />
                      <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                        {row.note}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F3F4F6]">
                  3. Производные, Лейбниц, асимптоты и разрывы
                </h3>
                <div className="space-y-2.5">
                  {MATAN_DERIVATIVES_AND_STUDY.map((row) => (
                    <div
                      key={row.name}
                      className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B101B] p-3.5"
                    >
                      <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                        {row.name}
                      </p>
                      <MathBlock latex={row.latex} displayMode={true} />
                      <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                        {row.note}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {tab === 'rk' && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F3F4F6]">
                Ключевые формулы РК 2 (Матрицы, Определители, СЛАУ, ФСР)
              </h3>
              <div className="space-y-2.5">
                {RK_FORMULAS.map((row) => (
                  <div
                    key={row.name}
                    className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B101B] p-3.5"
                  >
                    <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                      {row.name}
                    </p>
                    <MathBlock latex={row.latex} displayMode={true} />
                    <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                      {row.note}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'exam' && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F3F4F6]">
                Шпаргалка по АИП (C/C++, память, деревья, файлы)
              </h3>
              <div className="space-y-3">
                {EXAM_AIP_ROWS.map((row) => (
                  <div
                    key={row.title}
                    className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B101B] p-3.5 space-y-2"
                  >
                    <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                      {row.title}
                    </p>
                    <pre className="p-2.5 rounded-md bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                      <code>{row.code}</code>
                    </pre>
                    <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                      {row.note}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'weak_print' && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200 dark:border-sky-800/60 bg-sky-50/60 dark:bg-sky-950/20 p-3.5">
                <div>
                  <p className="text-xs font-semibold text-sky-900 dark:text-sky-300">
                    Лист повторения для печати — {subjectTitle}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-[#D1D5DB] mt-0.5">
                    Нажмите «Печать / Сохранить PDF» — браузер сформирует чистый белый лист без лишнего интерфейса.
                  </p>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#0B101B] border border-slate-200 dark:border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setPrintScope('weak')}
                    className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                      printScope === 'weak'
                        ? 'prism-tab-active text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-[#94A3B8]'
                    }`}
                  >
                    Слабые и невыученные ({weakCards.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintScope('all_with_formulas')}
                    className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                      printScope === 'all_with_formulas'
                        ? 'prism-tab-active text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-[#94A3B8]'
                    }`}
                  >
                    Карточки с формулами ({formulaCards.length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cardsToPrint.map((card) => (
                  <article
                    key={card.id}
                    className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#0B101B] p-3.5 space-y-2"
                  >
                    <p className="text-xs font-mono text-sky-700 dark:text-sky-400">
                      №{card.id} · {card.chapter}
                    </p>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-[#F3F4F6]">
                      {card.question}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-[#D1D5DB]">
                      {card.keyThesis}
                    </p>
                    {card.mathFormulaLatex && (
                      <div className="pt-1">
                        <MathBlock latex={card.mathFormulaLatex} displayMode={false} />
                      </div>
                    )}
                    {card.examTip && (
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 border-t border-slate-200 dark:border-white/[0.08] pt-1.5">
                        Ловушка: {card.examTip}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Dedicated Clean Printable Sheet (visible ONLY when printing to paper / PDF) */}
      <div className="print-only w-full bg-white text-black p-4 space-y-5">
        <div className="border-b-2 border-black pb-2 flex items-baseline justify-between">
          <h1 className="text-xl font-bold">
            Шпаргалка: {subjectTitle} (
            {tab === 'weak_print'
              ? printScope === 'weak'
                ? 'Слабые и невыученные карточки'
                : 'Карточки с формулами'
              : tab === 'matan'
                ? 'Таблицы формул Матан'
                : tab === 'rk'
                  ? 'Формулы Ангем РК 2'
                  : 'Справочник АИП C/C++'}
            )
          </h1>
          <span className="text-xs font-mono">
            {new Date().toLocaleDateString('ru-RU')}
          </span>
        </div>

        {tab === 'matan' && (
          <div className="space-y-3">
            {[
              ...MATAN_EQUIVALENTS,
              ...MATAN_MACLAURIN,
              ...MATAN_DERIVATIVES_AND_STUDY,
            ].map((row) => (
              <div
                key={row.name}
                className="print-break-avoid border border-slate-300 rounded p-2.5"
              >
                <div className="text-xs font-bold">{row.name}</div>
                <MathBlock latex={row.latex} displayMode={true} className="!text-black" />
                <div className="text-[11px] text-slate-700">{row.note}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'rk' && (
          <div className="space-y-3">
            {RK_FORMULAS.map((row) => (
              <div
                key={row.name}
                className="print-break-avoid border border-slate-300 rounded p-2.5"
              >
                <div className="text-xs font-bold">{row.name}</div>
                <MathBlock latex={row.latex} displayMode={true} className="!text-black" />
                <div className="text-[11px] text-slate-700">{row.note}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'exam' && (
          <div className="space-y-3">
            {EXAM_AIP_ROWS.map((row) => (
              <div
                key={row.title}
                className="print-break-avoid border border-slate-300 rounded p-2.5"
              >
                <div className="text-xs font-bold">{row.title}</div>
                <pre className="text-[11px] font-mono whitespace-pre-wrap mt-1">
                  {row.code}
                </pre>
                <div className="text-[11px] text-slate-700 mt-1">{row.note}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'weak_print' && (
          <div className="grid grid-cols-2 gap-3">
            {cardsToPrint.map((card) => (
              <div
                key={card.id}
                className="print-break-avoid border border-slate-300 rounded p-2.5 space-y-1"
              >
                <div className="text-[10px] font-mono text-slate-600">
                  №{card.id} · {card.chapter}
                </div>
                <div className="text-xs font-bold">{card.question}</div>
                <div className="text-[11px]">{card.keyThesis}</div>
                {card.mathFormulaLatex && (
                  <MathBlock
                    latex={card.mathFormulaLatex}
                    displayMode={false}
                    className="!text-black"
                  />
                )}
                {card.examTip && (
                  <div className="text-[10px] italic text-slate-700">
                    Ловушка: {card.examTip}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
