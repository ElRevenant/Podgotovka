export type ClozeSubject = 'matan' | 'rk' | 'exam';

export interface ClozeCellItem {
  id: string;
  /** If isBlank is false, it's a static reference cell */
  isBlank: boolean;
  /** Content displayed when static or once revealed */
  content: string;
  /** Render mode: 'latex' for KaTeX, 'code' for monospace C/C++, 'text' for Russian explanation */
  renderMode: 'latex' | 'code' | 'text';
  /** 4 compact choices if isBlank === true */
  options?: string[];
  /** Detailed explanation shown if student picks a wrong answer or hovers after solving */
  explanation?: string;
}

export interface ClozeTableRow {
  id: string;
  rowLabel: string;
  rowLabelMode?: 'latex' | 'code' | 'text';
  cells: ClozeCellItem[];
}

export interface ClozeTableConfig {
  id: string;
  subject: ClozeSubject;
  badge: string;
  title: string;
  subtitle: string;
  columns: string[];
  rows: ClozeTableRow[];
  examTip: string;
}

export const CLOZE_TABLES_DATA: ClozeTableConfig[] = [
  // ============================================================================
  // МАТАН 1: Таблица 10 эквивалентных бесконечно малых при u -> 0
  // ============================================================================
  {
    id: 'matan-equiv-bmf',
    subject: 'matan',
    badge: 'Матан · Пределы',
    title: 'Таблица 10 эквивалентных бесконечно малых при u → 0',
    subtitle: 'Вспомни точные коэффициенты, знаки и условия замены на эквивалентные',
    columns: ['Функция f(u) при u → 0', 'Эквивалентная б.м.ф. φ(u)', 'Главный подвох / условие'],
    examTip:
      'Заменять функцию на эквивалентную можно ТОЛЬКО в множителях и делителях! В алгебраической сумме или разности (например, sin x - tg x) прямая замена без оценки o(...) запрещена.',
    rows: [
      {
        id: 'eq-1',
        rowLabel: '\\sin u,\\; \\operatorname{tg} u,\\; \\arcsin u,\\; \\operatorname{arctg} u',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'eq-1-c1',
            isBlank: true,
            content: 'u',
            renderMode: 'latex',
            options: ['u', 'u^2', '\\frac{u^2}{2}', '1 + u'],
            explanation: 'Все четыре базовые тригонометрические и обратные функции при u → 0 эквивалентны первой степени аргумента u.',
          },
          {
            id: 'eq-1-c2',
            isBlank: false,
            content: 'В разности sin u − tg u члены первой степени взаимно уничтожаются → нужен Тейлор до u³!',
            renderMode: 'text',
          },
        ],
      },
      {
        id: 'eq-2',
        rowLabel: '1 - \\cos u',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'eq-2-c1',
            isBlank: true,
            content: '\\frac{u^2}{2}',
            renderMode: 'latex',
            options: ['\\frac{u^2}{2}', '-\\frac{u^2}{2}', 'u^2', '\\frac{u}{2}'],
            explanation: 'По формуле полуугла 1 - cos u = 2 sin²(u/2) ~ 2·(u/2)² = u²/2 (знак плюс, так как cos u ≤ 1!).',
          },
          {
            id: 'eq-2-c2',
            isBlank: true,
            content: '\\cos u - 1 \\sim -\\frac{u^2}{2}',
            renderMode: 'latex',
            options: [
              '\\cos u - 1 \\sim -\\frac{u^2}{2}',
              '\\cos u - 1 \\sim \\frac{u^2}{2}',
              '\\cos u - 1 \\sim -u^2',
              '\\cos u - 1 \\sim -u',
            ],
            explanation: 'Частая ловушка на РК: в (cos u - 1) порядок слагаемых обратный, поэтому появляется знак МИНУС: -u²/2.',
          },
        ],
      },
      {
        id: 'eq-3',
        rowLabel: '\\ln(1 + u)',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'eq-3-c1',
            isBlank: true,
            content: 'u',
            renderMode: 'latex',
            options: ['u', '1 + u', 'u \\cdot \\ln e', '\\frac{u^2}{2}'],
            explanation: 'Из второго замечательного предела следует, что ln(1 + u) / u → 1 при u → 0, значит ln(1 + u) ~ u.',
          },
          {
            id: 'eq-3-c2',
            isBlank: true,
            content: '\\log_a(1 + u) \\sim \\frac{u}{\\ln a}',
            renderMode: 'latex',
            options: [
              '\\log_a(1 + u) \\sim \\frac{u}{\\ln a}',
              '\\log_a(1 + u) \\sim u \\cdot \\ln a',
              '\\log_a(1 + u) \\sim u',
              '\\log_a(1 + u) \\sim \\frac{\\ln a}{u}',
            ],
            explanation: 'При переходе к основанию e: log_a(1+u) = ln(1+u) / ln a ~ u / ln a (деление на ln a, а не умножение!).',
          },
        ],
      },
      {
        id: 'eq-4',
        rowLabel: 'e^u - 1',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'eq-4-c1',
            isBlank: true,
            content: 'u',
            renderMode: 'latex',
            options: ['u', '1 + u', 'e \\cdot u', '\\frac{u^2}{2}'],
            explanation: 'Экспонента вблизи нуля ведёт себя как 1 + u, поэтому e^u - 1 ~ u.',
          },
          {
            id: 'eq-4-c2',
            isBlank: true,
            content: 'a^u - 1 \\sim u \\cdot \\ln a',
            renderMode: 'latex',
            options: [
              'a^u - 1 \\sim u \\cdot \\ln a',
              'a^u - 1 \\sim \\frac{u}{\\ln a}',
              'a^u - 1 \\sim a \\cdot u',
              'a^u - 1 \\sim u^a',
            ],
            explanation: 'Так как a^u = e^{u ln a}, получаем e^{u ln a} - 1 ~ u · ln a (здесь умножение на ln a!).',
          },
        ],
      },
      {
        id: 'eq-5',
        rowLabel: '(1 + u)^\\alpha - 1',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'eq-5-c1',
            isBlank: true,
            content: '\\alpha \\cdot u',
            renderMode: 'latex',
            options: ['\\alpha \\cdot u', '\\frac{u}{\\alpha}', 'u^\\alpha', '1 + \\alpha u'],
            explanation: 'По биному Ньютона (1 + u)^α = 1 + αu + o(u), поэтому после вычитания единицы остаётся α·u.',
          },
          {
            id: 'eq-5-c2',
            isBlank: true,
            content: '\\sqrt[n]{1 + u} - 1 \\sim \\frac{u}{n}',
            renderMode: 'latex',
            options: [
              '\\sqrt[n]{1 + u} - 1 \\sim \\frac{u}{n}',
              '\\sqrt[n]{1 + u} - 1 \\sim n \\cdot u',
              '\\sqrt[n]{1 + u} - 1 \\sim u^{1/n}',
              '\\sqrt[n]{1 + u} - 1 \\sim \\frac{u^2}{n}',
            ],
            explanation: 'Частный случай при α = 1/n: корень n-й степени даёт эквивалентность u / n.',
          },
        ],
      },
    ],
  },

  // ============================================================================
  // МАТАН 2: 6 базовых разложений Маклорена при x -> 0
  // ============================================================================
  {
    id: 'matan-maclaurin-6',
    subject: 'matan',
    badge: 'Матан · Тейлор и Маклорен',
    title: '6 канонических разложений Маклорена при x → 0',
    subtitle: 'Не перепутай знаки, чётные/нечётные степени и наличие факториала в знаменателе!',
    columns: ['Функция f(x)', 'Первые ненулевые члены ряда', 'Знаменатель (факториал или степень?)'],
    examTip:
      'Запомни главное правило: у e^x, sin x, cos x в знаменателях стоят ФАКТОРИАЛЫ (n!), а у ln(1+x) и 1/(1-x) факториалов НЕТ — у логарифма просто деление на n!',
    rows: [
      {
        id: 'mac-exp',
        rowLabel: 'e^x',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'mac-exp-1',
            isBlank: true,
            content: '1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + o(x^3)',
            renderMode: 'latex',
            options: [
              '1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + o(x^3)',
              '1 - x + \\frac{x^2}{2!} - \\frac{x^3}{3!} + o(x^3)',
              'x + \\frac{x^2}{2} + \\frac{x^3}{3} + o(x^3)',
              '1 + x + x^2 + x^3 + o(x^3)',
            ],
            explanation: 'У экспоненты все производные в нуле равны 1, поэтому идут все степени подряд со знаком «+» и факториалами k!.',
          },
          {
            id: 'mac-exp-2',
            isBlank: false,
            content: '\\frac{x^k}{k!} \\quad (\\text{с факториалом } k!)',
            renderMode: 'latex',
          },
        ],
      },
      {
        id: 'mac-sin',
        rowLabel: '\\sin x',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'mac-sin-1',
            isBlank: true,
            content: 'x - \\frac{x^3}{3!} + \\frac{x^5}{5!} + o(x^5)',
            renderMode: 'latex',
            options: [
              'x - \\frac{x^3}{3!} + \\frac{x^5}{5!} + o(x^5)',
              'x + \\frac{x^3}{3!} + \\frac{x^5}{5!} + o(x^5)',
              'x - \\frac{x^3}{3} + \\frac{x^5}{5} + o(x^5)',
              '1 - \\frac{x^2}{2!} + \\frac{x^4}{4!} + o(x^4)',
            ],
            explanation: 'Синус — нечётная функция: остаются только НЕЧЁТНЫЕ степени (x, x³, x⁵) с чередованием знаков и факториалами 3! = 6, 5! = 120.',
          },
          {
            id: 'mac-sin-2',
            isBlank: true,
            content: '(-1)^k \\frac{x^{2k+1}}{(2k+1)!}',
            renderMode: 'latex',
            options: [
              '(-1)^k \\frac{x^{2k+1}}{(2k+1)!}',
              '(-1)^k \\frac{x^{2k+1}}{2k+1}',
              '\\frac{x^{2k+1}}{(2k+1)!}',
              '(-1)^k \\frac{x^{2k}}{(2k)!}',
            ],
            explanation: 'Общий член синуса имеет нечётную степень 2k+1, знакочередование (-1)^k и факториал (2k+1)!.',
          },
        ],
      },
      {
        id: 'mac-cos',
        rowLabel: '\\cos x',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'mac-cos-1',
            isBlank: true,
            content: '1 - \\frac{x^2}{2!} + \\frac{x^4}{4!} + o(x^4)',
            renderMode: 'latex',
            options: [
              '1 - \\frac{x^2}{2!} + \\frac{x^4}{4!} + o(x^4)',
              '1 + \\frac{x^2}{2!} + \\frac{x^4}{4!} + o(x^4)',
              '1 - \\frac{x^2}{2} + \\frac{x^4}{4} + o(x^4)',
              'x - \\frac{x^3}{3!} + o(x^3)',
            ],
            explanation: 'Косинус — чётная функция: только ЧЁТНЫЕ степени (1, x², x⁴), чередование знаков и факториалы 2! = 2, 4! = 24.',
          },
          {
            id: 'mac-cos-2',
            isBlank: true,
            content: '(-1)^k \\frac{x^{2k}}{(2k)!}',
            renderMode: 'latex',
            options: [
              '(-1)^k \\frac{x^{2k}}{(2k)!}',
              '(-1)^k \\frac{x^{2k}}{2k}',
              '\\frac{x^{2k}}{(2k)!}',
              '(-1)^k \\frac{x^{2k+1}}{(2k+1)!}',
            ],
            explanation: 'Чётные степени 2k с факториалом (2k)! и чередованием знака (-1)^k.',
          },
        ],
      },
      {
        id: 'mac-ln',
        rowLabel: '\\ln(1 + x)',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'mac-ln-1',
            isBlank: true,
            content: 'x - \\frac{x^2}{2} + \\frac{x^3}{3} - \\frac{x^4}{4} + o(x^4)',
            renderMode: 'latex',
            options: [
              'x - \\frac{x^2}{2} + \\frac{x^3}{3} - \\frac{x^4}{4} + o(x^4)',
              'x - \\frac{x^2}{2!} + \\frac{x^3}{3!} - \\frac{x^4}{4!} + o(x^4)',
              'x + \\frac{x^2}{2} + \\frac{x^3}{3} + \\frac{x^4}{4} + o(x^4)',
              '1 + x - \\frac{x^2}{2} + o(x^2)',
            ],
            explanation: 'Внимание! У ln(1+x) НЕТ факториалов в знаменателе (3, а не 3! = 6), так как производная (k-1)! сокращается с k!.',
          },
          {
            id: 'mac-ln-2',
            isBlank: true,
            content: '(-1)^{k-1}\\frac{x^k}{k} \\quad (\\text{БЕЗ факториала!})',
            renderMode: 'latex',
            options: [
              '(-1)^{k-1}\\frac{x^k}{k} \\quad (\\text{БЕЗ факториала!})',
              '(-1)^{k-1}\\frac{x^k}{k!}',
              '\\frac{x^k}{k}',
              '(-1)^k \\frac{x^k}{k!}',
            ],
            explanation: 'В знаменателе стоит просто номер степени k без восклицательного знака.',
          },
        ],
      },
      {
        id: 'mac-binom',
        rowLabel: '(1 + x)^\\alpha',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'mac-binom-1',
            isBlank: true,
            content: '1 + \\alpha x + \\frac{\\alpha(\\alpha - 1)}{2!}x^2 + o(x^2)',
            renderMode: 'latex',
            options: [
              '1 + \\alpha x + \\frac{\\alpha(\\alpha - 1)}{2!}x^2 + o(x^2)',
              '1 + \\alpha x + \\frac{\\alpha^2}{2!}x^2 + o(x^2)',
              '1 + \\alpha x + \\frac{\\alpha(\\alpha + 1)}{2!}x^2 + o(x^2)',
              '\\alpha x + \\frac{\\alpha(\\alpha - 1)}{2}x^2 + o(x^2)',
            ],
            explanation: 'При втором члене коэффициент равен α(α - 1)/2!, а при третьем — α(α - 1)(α - 2)/3!.',
          },
          {
            id: 'mac-binom-2',
            isBlank: true,
            content: '\\frac{1}{1 - x} = 1 + x + x^2 + x^3 + o(x^3)',
            renderMode: 'latex',
            options: [
              '\\frac{1}{1 - x} = 1 + x + x^2 + x^3 + o(x^3)',
              '\\frac{1}{1 - x} = 1 - x + x^2 - x^3 + o(x^3)',
              '\\frac{1}{1 - x} = 1 + x + \\frac{x^2}{2!} + o(x^2)',
              '\\frac{1}{1 - x} = x + x^2 + x^3 + o(x^3)',
            ],
            explanation: 'Сумма бесконечно убывающей геометрической прогрессии 1/(1 - x) имеет все коэффициенты +1 без факториалов.',
          },
        ],
      },
    ],
  },

  // ============================================================================
  // МАТАН 3: Классификация точек разрыва и 6 окрестностей по Коши
  // ============================================================================
  {
    id: 'matan-discontinuities-cauchy',
    subject: 'matan',
    badge: 'Матан · Непрерывность и Коши',
    title: 'Классификация точек разрыва и окрестности на языке Коши',
    subtitle: 'Точные условия на односторонние пределы f(x₀−0) и f(x₀+0) для билета',
    columns: ['Тип точки / окрестности', 'Условие на односторонние пределы', 'Геометрический смысл / формула'],
    examTip:
      'Разрыв 1-го рода требует, чтобы ОБА односторонних предела существовали и были КОНЕЧНЫ. Если хотя бы один равен ∞ или не существует — это сразу разрыв 2-го рода!',
    rows: [
      {
        id: 'disc-cont',
        rowLabel: 'Непрерывность в точке x₀',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'disc-cont-1',
            isBlank: true,
            content: 'f(x_0 - 0) = f(x_0 + 0) = f(x_0) \\in \\mathbb{R}',
            renderMode: 'latex',
            options: [
              'f(x_0 - 0) = f(x_0 + 0) = f(x_0) \\in \\mathbb{R}',
              'f(x_0 - 0) = f(x_0 + 0) \\neq f(x_0)',
              'f(x_0 - 0) \\neq f(x_0 + 0)',
              '\\lim_{x\\to x_0} f(x) = \\infty',
            ],
            explanation: 'Для непрерывности в точке оба односторонних предела должны быть конечны, равны друг другу и равны значению функции f(x₀).',
          },
          {
            id: 'disc-cont-2',
            isBlank: false,
            content: 'График проходит через точку (x₀, f(x₀)) без разрыва',
            renderMode: 'text',
          },
        ],
      },
      {
        id: 'disc-rem',
        rowLabel: 'Устранимый разрыв (1-го рода)',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'disc-rem-1',
            isBlank: true,
            content: 'f(x_0 - 0) = f(x_0 + 0) = A \\in \\mathbb{R},\\; \\text{но } A \\neq f(x_0)',
            renderMode: 'latex',
            options: [
              'f(x_0 - 0) = f(x_0 + 0) = A \\in \\mathbb{R},\\; \\text{но } A \\neq f(x_0)',
              'f(x_0 - 0) \\neq f(x_0 + 0),\\; \\text{оба конечны}',
              'f(x_0 - 0) = \\pm\\infty',
              'f(x_0 - 0) = f(x_0 + 0) = f(x_0)',
            ],
            explanation: 'Конечный предел существует (левый равен правому), но в самой точке x₀ функция либо не определена, либо f(x₀) ≠ A (выколотая точка).',
          },
          {
            id: 'disc-rem-2',
            isBlank: false,
            content: 'Пример: sin(x)/x в точке x₀ = 0 (доопределяется значением 1)',
            renderMode: 'text',
          },
        ],
      },
      {
        id: 'disc-jump',
        rowLabel: 'Разрыв 1-го рода со скачком',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'disc-jump-1',
            isBlank: true,
            content: 'f(x_0 - 0) \\in \\mathbb{R},\\; f(x_0 + 0) \\in \\mathbb{R},\\; f(x_0 - 0) \\neq f(x_0 + 0)',
            renderMode: 'latex',
            options: [
              'f(x_0 - 0) \\in \\mathbb{R},\\; f(x_0 + 0) \\in \\mathbb{R},\\; f(x_0 - 0) \\neq f(x_0 + 0)',
              'f(x_0 - 0) = f(x_0 + 0) \\neq f(x_0)',
              'f(x_0 + 0) = +\\infty,\\; f(x_0 - 0) = 0',
              '\\text{Пределы не существуют}',
            ],
            explanation: 'Оба односторонних предела конечны, но не равны друг другу.',
          },
          {
            id: 'disc-jump-2',
            isBlank: true,
            content: '\\Delta = |f(x_0 + 0) - f(x_0 - 0)| \\quad (\\text{величина скачка})',
            renderMode: 'latex',
            options: [
              '\\Delta = |f(x_0 + 0) - f(x_0 - 0)| \\quad (\\text{величина скачка})',
              '\\Delta = f(x_0 + 0) + f(x_0 - 0)',
              '\\Delta = \\infty',
              '\\Delta = 0',
            ],
            explanation: 'Скачок функции равен разности правого и левого односторонних пределов. Пример: arctg(1/x) в x₀ = 0 (скачок π).',
          },
        ],
      },
      {
        id: 'disc-second',
        rowLabel: 'Точка разрыва 2-го рода',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'disc-second-1',
            isBlank: true,
            content: '\\text{Хотя бы один из } f(x_0 \\pm 0) \\text{ равен } \\pm\\infty \\text{ или не существует}',
            renderMode: 'latex',
            options: [
              '\\text{Хотя бы один из } f(x_0 \\pm 0) \\text{ равен } \\pm\\infty \\text{ или не существует}',
              'f(x_0 - 0) \\neq f(x_0 + 0),\\; \\text{оба конечны}',
              'f(x_0 - 0) = f(x_0 + 0) \\neq f(x_0)',
              'f\\text{\'\'}(x_0) = 0',
            ],
            explanation: 'Пример: 2^{1/x} в точке x₀ = 0 (слева предел 0, а справа +∞ → разрыв 2-го рода!), либо sin(1/x) в нуле.',
          },
          {
            id: 'disc-second-2',
            isBlank: true,
            content: '\\mathring{U}_\\delta(x_0) = \\{x : 0 < |x - x_0| < \\delta\\}',
            renderMode: 'latex',
            options: [
              '\\mathring{U}_\\delta(x_0) = \\{x : 0 < |x - x_0| < \\delta\\}',
              'U_\\delta(x_0) = \\{x : |x - x_0| < \\delta\\}',
              '\\mathring{U}_\\delta(+\\infty) = \\{x : x > \\delta\\}',
              '\\mathring{U}_\\delta(x_0) = \\{x : |x - x_0| > \\delta\\}',
            ],
            explanation: 'Проколотая δ-окрестность точки x₀ обязательно включает неравенство 0 < |x - x₀|, исключая саму точку x = x₀.',
          },
        ],
      },
    ],
  },

  // ============================================================================
  // МАТАН 4: Исследование функции (производные, экстремумы, перегиб, асимптоты)
  // ============================================================================
  {
    id: 'matan-curve-study',
    subject: 'matan',
    badge: 'Матан · Производные и графики',
    title: 'Полное исследование функции: экстремумы, выпуклость и асимптоты',
    subtitle: 'Связь знаков f\'(x) и f\'\'(x) с поведением графика и формулы наклонной асимптоты',
    columns: ['Характеристика графика', 'Математический критерий', 'Следствие для эскиза'],
    examTip:
      'Если f\'\'(x) > 0 («вторая производная положительна — смайлик улыбается ∪»), то кривая выпукла ВНИЗ (вогнута). Если f\'\'(x) < 0 — выпукла ВВЕРХ (∩).',
    rows: [
      {
        id: 'cs-1',
        rowLabel: 'Достаточный признак точки максимума x₀',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'cs-1-c1',
            isBlank: true,
            content: 'f\'(x) \\text{ меняет знак с } (+) \\text{ на } (-),\\; \\text{либо } f\'(x_0)=0,\\; f\'\'(x_0) < 0',
            renderMode: 'latex',
            options: [
              'f\'(x) \\text{ меняет знак с } (+) \\text{ на } (-),\\; \\text{либо } f\'(x_0)=0,\\; f\'\'(x_0) < 0',
              'f\'(x) \\text{ меняет знак с } (-) \\text{ на } (+),\\; f\'\'(x_0) > 0',
              'f\'\'(x) \\text{ меняет знак с } (+) \\text{ на } (-)',
              'f\'(x_0) > 0',
            ],
            explanation: 'В точке максимума возрастание (+) сменяется убыванием (-), а график выпуклый вверх, поэтому вторая производная f\'\'(x₀) < 0.',
          },
          {
            id: 'cs-1-c2',
            isBlank: false,
            content: 'Вершина «горба» ∩ графика',
            renderMode: 'text',
          },
        ],
      },
      {
        id: 'cs-2',
        rowLabel: 'Выпуклость графика и точка перегиба',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'cs-2-c1',
            isBlank: true,
            content: 'f\'\'(x) > 0 \\Rightarrow \\text{выпукла вниз } (\\cup);\\quad f\'\'(x) < 0 \\Rightarrow \\text{выпукла вверх } (\\cap)',
            renderMode: 'latex',
            options: [
              'f\'\'(x) > 0 \\Rightarrow \\text{выпукла вниз } (\\cup);\\quad f\'\'(x) < 0 \\Rightarrow \\text{выпукла вверх } (\\cap)',
              'f\'\'(x) > 0 \\Rightarrow \\text{выпукла вверх } (\\cap);\\quad f\'\'(x) < 0 \\Rightarrow \\text{выпукла вниз } (\\cup)',
              'f\'(x) > 0 \\Rightarrow \\text{выпукла вниз}',
              'f\'\'(x) = 0 \\text{ на всём интервале}',
            ],
            explanation: 'Положительная вторая производная означает, что касательная поворачивается против часовой стрелки, и график лежит ВЫШЕ касательной (∪).',
          },
          {
            id: 'cs-2-c2',
            isBlank: true,
            content: '\\text{Перегиб в } x_0:\\; f\'\'(x) \\text{ меняет знак при переходе через } x_0',
            renderMode: 'latex',
            options: [
              '\\text{Перегиб в } x_0:\\; f\'\'(x) \\text{ меняет знак при переходе через } x_0',
              '\\text{Перегиб в } x_0:\\; f\'(x) \\text{ меняет знак}',
              '\\text{Достаточно только } f\'\'(x_0) = 0 \\text{ без смены знака}',
              'f(x_0) = 0',
            ],
            explanation: 'Одного равенства f\'\'(x₀)=0 недостаточно (у y = x⁴ в нуле f\'\'(0)=0, но знак не меняется и перегиба нет!). Нужна смена знака f\'\'(x).',
          },
        ],
      },
      {
        id: 'cs-3',
        rowLabel: 'Наклонная асимптота y = kx + b при x → ±∞',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'cs-3-c1',
            isBlank: true,
            content: 'k = \\lim_{x\\to\\pm\\infty} \\frac{f(x)}{x}',
            renderMode: 'latex',
            options: [
              'k = \\lim_{x\\to\\pm\\infty} \\frac{f(x)}{x}',
              'k = \\lim_{x\\to\\pm\\infty} f\'(x) \\cdot x',
              'k = \\lim_{x\\to\\pm\\infty} (f(x) - x)',
              'k = f\'(0)',
            ],
            explanation: 'Угловой коэффициент наклонной асимптоты находится как предел отношения f(x) / x при x → ±∞.',
          },
          {
            id: 'cs-3-c2',
            isBlank: true,
            content: 'b = \\lim_{x\\to\\pm\\infty} \\bigl(f(x) - k x\\bigr)',
            renderMode: 'latex',
            options: [
              'b = \\lim_{x\\to\\pm\\infty} \\bigl(f(x) - k x\\bigr)',
              'b = \\lim_{x\\to\\pm\\infty} \\frac{f(x)}{k x}',
              'b = f(0)',
              'b = \\lim_{x\\to 0} (f(x) - kx)',
            ],
            explanation: 'Свободный член b ищется только после нахождения конечного k как предел разности (f(x) − kx) при x → ±∞.',
          },
        ],
      },
    ],
  },

  // ============================================================================
  // АНГЕМ РК 2 (5): Матричные операции, определители и обратная матрица
  // ============================================================================
  {
    id: 'rk-matrices-inverse',
    subject: 'rk',
    badge: 'Ангем РК 2 · Матрицы',
    title: 'Свойства матричных операций, определителя и обратной матрицы',
    subtitle: 'Порядок множителей при транспонировании и обращении — главная ловушка РК 2',
    columns: ['Выражение / Уравнение', 'Точная формула', 'Важное замечание для РК 2'],
    examTip:
      'Умножение матриц НЕКОММУТАТИВНО (AB ≠ BA)! Поэтому при транспонировании и обращении произведения порядок матриц меняется на обратный, а в уравнениях AX=B и XA=B умножать на A⁻¹ нужно с разных сторон.',
    rows: [
      {
        id: 'rk-m1',
        rowLabel: '(A \\cdot B)^T \\text{ и } (A \\cdot B)^{-1}',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'rk-m1-c1',
            isBlank: true,
            content: '(AB)^T = B^T A^T,\\quad (AB)^{-1} = B^{-1} A^{-1}',
            renderMode: 'latex',
            options: [
              '(AB)^T = B^T A^T,\\quad (AB)^{-1} = B^{-1} A^{-1}',
              '(AB)^T = A^T B^T,\\quad (AB)^{-1} = A^{-1} B^{-1}',
              '(AB)^T = B^T A^T,\\quad (AB)^{-1} = A^{-1} B^{-1}',
              '(AB)^{-1} = \\frac{1}{\\det(AB)} AB',
            ],
            explanation: '«Правило носков и ботинок»: чтобы разуться, действия выполняются в обратном порядке → сначала B, потом A.',
          },
          {
            id: 'rk-m1-c2',
            isBlank: false,
            content: 'Перестановка множителей обязательна!',
            renderMode: 'text',
          },
        ],
      },
      {
        id: 'rk-m2',
        rowLabel: '\\det(\\lambda A) \\text{ для матрицы } n \\times n',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'rk-m2-c1',
            isBlank: true,
            content: '\\det(\\lambda A) = \\lambda^n \\cdot \\det A',
            renderMode: 'latex',
            options: [
              '\\det(\\lambda A) = \\lambda^n \\cdot \\det A',
              '\\det(\\lambda A) = \\lambda \\cdot \\det A',
              '\\det(\\lambda A) = n\\lambda \\cdot \\det A',
              '\\det(\\lambda A) = \\det A',
            ],
            explanation: 'Число λ умножает КАЖДУЮ из n строк матрицы A, поэтому из определителя n-го порядка выносится множитель λⁿ!',
          },
          {
            id: 'rk-m2-c2',
            isBlank: true,
            content: '\\det(A^{-1}) = \\frac{1}{\\det A},\\quad \\det(A^T) = \\det A',
            renderMode: 'latex',
            options: [
              '\\det(A^{-1}) = \\frac{1}{\\det A},\\quad \\det(A^T) = \\det A',
              '\\det(A^{-1}) = -\\det A,\\quad \\det(A^T) = -\\det A',
              '\\det(A^{-1}) = (\\det A)^n',
              '\\det(A + B) = \\det A + \\det B',
            ],
            explanation: 'Так как A·A⁻¹ = E, то det(A)·det(A⁻¹) = 1. При транспонировании определитель не меняется.',
          },
        ],
      },
      {
        id: 'rk-m3',
        rowLabel: '\\text{Обратная матрица } A^{-1}',
        rowLabelMode: 'latex',
        cells: [
          {
            id: 'rk-m3-c1',
            isBlank: true,
            content: 'A^{-1} = \\frac{1}{\\det A} \\cdot (A^*)^T,\\quad A_{ij} = (-1)^{i+j} M_{ij}',
            renderMode: 'latex',
            options: [
              'A^{-1} = \\frac{1}{\\det A} \\cdot (A^*)^T,\\quad A_{ij} = (-1)^{i+j} M_{ij}',
              'A^{-1} = \\frac{1}{\\det A} \\cdot A,\\quad A_{ij} = M_{ij}',
              'A^{-1} = \\det A \\cdot (A^*)^T',
              'A^{-1} = A^T',
            ],
            explanation: 'Присоединённая матрица составляется из алгебраических дополнений A_ij = (-1)^{i+j} M_ij и ОБЯЗАТЕЛЬНО транспонируется!',
          },
          {
            id: 'rk-m3-c2',
            isBlank: true,
            content: 'A X = B \\Rightarrow X = A^{-1}B;\\quad X A = B \\Rightarrow X = B A^{-1}',
            renderMode: 'latex',
            options: [
              'A X = B \\Rightarrow X = A^{-1}B;\\quad X A = B \\Rightarrow X = B A^{-1}',
              'A X = B \\Rightarrow X = B A^{-1};\\quad X A = B \\Rightarrow X = A^{-1}B',
              '\\text{В обоих случаях } X = A^{-1}B',
              'X = B / A',
            ],
            explanation: 'Если A стоит слева от X (AX=B), умножаем на A⁻¹ СЛЕВА. Если A стоит справа от X (XA=B), умножаем на A⁻¹ СПРАВА!',
          },
        ],
      },
    ],
  },

  // ============================================================================
  // АНГЕМ РК 2 (6): Теорема Кронекера-Капелли и структура решений СЛАУ
  // ============================================================================
  {
    id: 'rk-kronecker-capelli',
    subject: 'rk',
    badge: 'Ангем РК 2 · СЛАУ и ФСР',
    title: 'Исследование СЛАУ по теореме Кронекера—Капелли и ФСР',
    subtitle: 'Соотношение рангов r = rang A, rang(A|b) и числа неизвестных n',
    columns: ['Случай СЛАУ Ax = b', 'Соотношение рангов r и n', 'Множество решений / размерность ФСР'],
    examTip:
      'Число векторов в фундаментальной системе решений (ФСР) однородной системы Ax = 0 всегда равно в точности числу свободных неизвестных: k = n − r!',
    rows: [
      {
        id: 'kc-1',
        rowLabel: 'Несовместная СЛАУ',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'kc-1-c1',
            isBlank: true,
            content: '\\operatorname{rang} A < \\operatorname{rang}(A|b)',
            renderMode: 'latex',
            options: [
              '\\operatorname{rang} A < \\operatorname{rang}(A|b)',
              '\\operatorname{rang} A = \\operatorname{rang}(A|b) < n',
              '\\operatorname{rang} A = \\operatorname{rang}(A|b) = n',
              '\\operatorname{rang} A > \\operatorname{rang}(A|b)',
            ],
            explanation: 'В методе Гаусса это проявляется строкой вида (0 0 ... 0 | c), где c ≠ 0: ранг расширенной матрицы больше ранга основной.',
          },
          {
            id: 'kc-1-c2',
            isBlank: false,
            content: 'Решений нет (∅)',
            renderMode: 'text',
          },
        ],
      },
      {
        id: 'kc-2',
        rowLabel: 'Совместная определённая СЛАУ',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'kc-2-c1',
            isBlank: true,
            content: '\\operatorname{rang} A = \\operatorname{rang}(A|b) = r = n',
            renderMode: 'latex',
            options: [
              '\\operatorname{rang} A = \\operatorname{rang}(A|b) = r = n',
              '\\operatorname{rang} A = \\operatorname{rang}(A|b) = r < n',
              '\\operatorname{rang} A < \\operatorname{rang}(A|b)',
              'r = 0',
            ],
            explanation: 'Ранги равны и совпадают с числом всех неизвестных n → свободных переменных нет (n - r = 0).',
          },
          {
            id: 'kc-2-c2',
            isBlank: true,
            content: '\\text{Единственное решение } (x_i = \\frac{\\Delta_i}{\\Delta} \\text{ по Крамеру при } m=n)',
            renderMode: 'latex',
            options: [
              '\\text{Единственное решение } (x_i = \\frac{\\Delta_i}{\\Delta} \\text{ по Крамеру при } m=n)',
              '\\text{Бесконечно много решений}',
              '\\text{Только нулевое решение всегда}',
              '\\text{Решений нет}',
            ],
            explanation: 'Для квадратной системы с det A = Δ ≠ 0 единственное решение можно найти по формулам Крамера x_i = Δ_i / Δ.',
          },
        ],
      },
      {
        id: 'kc-3',
        rowLabel: 'Совместная неопределённая СЛАУ',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'kc-3-c1',
            isBlank: true,
            content: '\\operatorname{rang} A = \\operatorname{rang}(A|b) = r < n',
            renderMode: 'latex',
            options: [
              '\\operatorname{rang} A = \\operatorname{rang}(A|b) = r < n',
              '\\operatorname{rang} A = \\operatorname{rang}(A|b) = n',
              '\\operatorname{rang} A \\neq \\operatorname{rang}(A|b)',
              'r > n',
            ],
            explanation: 'Система совместна, но ранг r строго меньше числа неизвестных n → появляются n − r свободных неизвестных.',
          },
          {
            id: 'kc-3-c2',
            isBlank: true,
            content: 'X_{\\text{общ}} = X_{\\text{ч.н.}} + C_1 E_1 + \\dots + C_{n-r} E_{n-r}',
            renderMode: 'latex',
            options: [
              'X_{\\text{общ}} = X_{\\text{ч.н.}} + C_1 E_1 + \\dots + C_{n-r} E_{n-r}',
              'X_{\\text{общ}} = C_1 E_1 + \\dots + C_r E_r',
              'X_{\\text{общ}} = X_{\\text{ч.н.}}',
              'X_{\\text{общ}} = A^{-1} b',
            ],
            explanation: 'Общее решение неоднородной СЛАУ равно сумме одного частного решения X_{ч.н.} и общего решения однородной системы (линейной комбинации n−r векторов ФСР).',
          },
        ],
      },
    ],
  },

  // ============================================================================
  // АИП C/C++ (7): Классы памяти и время жизни переменных
  // ============================================================================
  {
    id: 'aip-memory-classes',
    subject: 'exam',
    badge: 'АИП C/C++ · Память',
    title: 'Классы памяти C/C++: сегмент, время жизни и инициализация',
    subtitle: 'Любимый вопрос на защите билета АИП: чем локальный static отличается от стека и кучи',
    columns: ['Вид переменной в C/C++', 'Сегмент памяти и время жизни', 'Значение по умолчанию (без инициализации)'],
    examTip:
      'Переменная `static int count;` внутри функции видна только внутри этой функции, НО живёт в статической памяти всё время работы программы и инициализируется только один раз при старте!',
    rows: [
      {
        id: 'mem-auto',
        rowLabel: 'Локальная (auto): int x;',
        rowLabelMode: 'code',
        cells: [
          {
            id: 'mem-auto-1',
            isBlank: true,
            content: 'Стек (Stack) — от входа в блок {} до выхода из функции',
            renderMode: 'text',
            options: [
              'Стек (Stack) — от входа в блок {} до выхода из функции',
              'Куча (Heap) — до вызова delete',
              'Сегмент данных (.bss) — вся программа',
              'Регистры процессора — постоянно',
            ],
            explanation: 'При каждом вызове функции в стеке создаётся новый фрейм активации, а при возврате (`return`) он автоматически уничтожается.',
          },
          {
            id: 'mem-auto-2',
            isBlank: true,
            content: 'Случайный «мусор» (неопределённое значение)',
            renderMode: 'text',
            options: [
              'Случайный «мусор» (неопределённое значение)',
              'Всегда автоматически обнуляется (0)',
              'Равно -1',
              'Вызывает ошибку компиляции',
            ],
            explanation: 'Память на стеке не очищается автоматически ради скорости — чтение неинициализированной локальной переменной даёт UB (мусор).',
          },
        ],
      },
      {
        id: 'mem-static',
        rowLabel: 'Статическая: static int s;',
        rowLabelMode: 'code',
        cells: [
          {
            id: 'mem-static-1',
            isBlank: true,
            content: 'Сегмент данных (.data / .bss) — живёт всё время работы программы',
            renderMode: 'text',
            options: [
              'Сегмент данных (.data / .bss) — живёт всё время работы программы',
              'Стек (Stack) — уничтожается при выходе из функции',
              'Куча (Heap) — освобождается через free()',
              'Стек — пересоздаётся при каждом вызове',
            ],
            explanation: 'Даже если `static` объявлена внутри функции, она размещается в статической области памяти и сохраняет значение между вызовами функции.',
          },
          {
            id: 'mem-static-2',
            isBlank: true,
            content: 'Автоматически обнуляется (0 / nullptr) один раз до старта main()',
            renderMode: 'text',
            options: [
              'Автоматически обнуляется (0 / nullptr) один раз до старта main()',
              'Содержит случайный мусор',
              'Переинициализируется нулём при каждом входе в функцию',
              'Нельзя использовать без явного = 0',
            ],
            explanation: 'Все глобальные и static-переменные без явного инициализатора гарантированно обнуляются загрузчиком ОС.',
          },
        ],
      },
      {
        id: 'mem-heap',
        rowLabel: 'Динамическая: int *p = new int[n];',
        rowLabelMode: 'code',
        cells: [
          {
            id: 'mem-heap-1',
            isBlank: true,
            content: 'Сам указатель p — на стеке, массив — в Куче (Heap) до delete[] p;',
            renderMode: 'code',
            options: [
              'Сам указатель p — на стеке, массив — в Куче (Heap) до delete[] p;',
              'И указатель p, и массив — целиком в Куче',
              'И указатель p, и массив — на Стеке',
              'Массив автоматически удаляется при выходе из функции',
            ],
            explanation: 'Локальная переменная-указатель `p` лежит на стеке (4 или 8 байт), а выделенный блок памяти — в куче. Если забыть `delete[] p;`, произойдёт утечка памяти!',
          },
          {
            id: 'mem-heap-2',
            isBlank: true,
            content: 'delete[] p; p = nullptr; (для массива именно delete[])',
            renderMode: 'code',
            options: [
              'delete[] p; p = nullptr; (для массива именно delete[])',
              'delete p; (квадратные скобки не нужны)',
              'remove(p);',
              'Память очистится сама сборщиком мусора C++',
            ],
            explanation: 'Память, выделенная через `new T[n]`, обязана освобождаться парным оператором `delete[] p;`.',
          },
        ],
      },
    ],
  },

  // ============================================================================
  // АИП C/C++ (8): Обходы бинарного дерева и работа с файлами C
  // ============================================================================
  {
    id: 'aip-trees-files',
    subject: 'exam',
    badge: 'АИП C/C++ · Деревья и Файлы',
    title: 'Обходы бинарного дерева (NLR, LNR, LRN) и файлы stdio.h',
    subtitle: 'Какой обход сортирует BST по возрастанию, а какой безопасно удаляет дерево из памяти',
    columns: ['Конструкция / Функция', 'Порядок действий / Сигнатура', 'Практическое назначение в билете'],
    examTip:
      'Удалять узлы дерева (`delete t;`) можно ТОЛЬКО при обратном обходе `LRN` (сначала удалить левое и правое поддеревья, и лишь в конце — сам корень `t`).',
    rows: [
      {
        id: 'tf-lnr',
        rowLabel: 'Симметричный обход (In-order)',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'tf-lnr-1',
            isBlank: true,
            content: 'LNR: Left (левое) -> Node (корень) -> Right (правое)',
            renderMode: 'code',
            options: [
              'LNR: Left (левое) -> Node (корень) -> Right (правое)',
              'NLR: Node (корень) -> Left (левое) -> Right (правое)',
              'LRN: Left (левое) -> Right (правое) -> Node (корень)',
              'RNL: только корень без рекурсии',
            ],
            explanation: 'При симметричном обходе LNR корень обрабатывается МЕЖДУ рекурсивными вызовами для левого и правого поддеревьев.',
          },
          {
            id: 'tf-lnr-2',
            isBlank: true,
            content: 'Выводит ключи бинарного дерева поиска (BST) строго по возрастанию',
            renderMode: 'text',
            options: [
              'Выводит ключи бинарного дерева поиска (BST) строго по возрастанию',
              'Безопасно освобождает память дерева через delete',
              'Копирует дерево сверху вниз',
              'Ищет высоту дерева без рекурсии',
            ],
            explanation: 'Так как в BST слева лежат меньшие ключи, а справа — большие, обход LNR печатает все элементы в отсортированном порядке.',
          },
        ],
      },
      {
        id: 'tf-lrn',
        rowLabel: 'Обратный / Концевой обход (Post-order)',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'tf-lrn-1',
            isBlank: true,
            content: 'LRN: Del(t->left); Del(t->right); delete t;',
            renderMode: 'code',
            options: [
              'LRN: Del(t->left); Del(t->right); delete t;',
              'NLR: delete t; Del(t->left); Del(t->right);',
              'LNR: Del(t->left); delete t; Del(t->right);',
              'delete[] t;',
            ],
            explanation: 'Если сделать `delete t;` до обхода потомков (NLR или LNR), указатели `t->left` и `t->right` станут недействительными (обращение к освобождённой памяти)!',
          },
          {
            id: 'tf-lrn-2',
            isBlank: false,
            content: 'Безопасное освобождение динамической памяти всего дерева (Del_Tree)',
            renderMode: 'text',
          },
        ],
      },
      {
        id: 'tf-fseek',
        rowLabel: 'Позиционирование и бинарный ввод/вывод',
        rowLabelMode: 'text',
        cells: [
          {
            id: 'tf-fseek-1',
            isBlank: true,
            content: 'fseek(f, k * sizeof(Record), SEEK_SET);',
            renderMode: 'code',
            options: [
              'fseek(f, k * sizeof(Record), SEEK_SET);',
              'fseek(f, k, SEEK_END);',
              'ftell(f, k * sizeof(Record));',
              'rewind(f, k);',
            ],
            explanation: 'Для прямого перехода к k-й записи (0-индексация) в типизированном бинарном файле смещение равно `k * sizeof(Record)` от начала файла `SEEK_SET`.',
          },
          {
            id: 'tf-fseek-2',
            isBlank: true,
            content: 'fread(&rec, sizeof(Record), 1, f); // возвращает число прочитанных элементов',
            renderMode: 'code',
            options: [
              'fread(&rec, sizeof(Record), 1, f); // возвращает число прочитанных элементов',
              'fscanf(f, "%s", rec); // для бинарных структур',
              'fread(rec, 1, f);',
              'fgets(&rec, sizeof(Record), f);',
            ],
            explanation: '`fread` и `fwrite` работают с бинарным образом структуры в памяти по её адресу `&rec` и возвращают количество успешно обработанных блоков.',
          },
        ],
      },
    ],
  },
];
