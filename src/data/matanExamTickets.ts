import {LectureId, TaskCard} from '../types/study';

const CH_LIM = 'Матан · Пределы и б.м.ф. (вопр. 1–15)' as const;
const CH_CONT = 'Матан · Непрерывность и разрывы (вопр. 16–22)' as const;
const CH_MVT = 'Матан · Теоремы о среднем, Лопиталь и Тейлор (вопр. 30–42)' as const;
const CH_STUDY = 'Матан · Монотонность, экстремумы и выпуклость (вопр. 43–49)' as const;

export interface MatanOfficialTicketSpec {
  ticketNumber: number;
  code: string;
  lectureId: LectureId;
  pdfUrl: string;
  theoryCardId: number;
  theoryPrompt: string;
  /** 5 tasks: №2 (5 б.), №3 (5 б.), №4 (5 б.), №5 (6 б.), №6 (5 б.) */
  taskIds: [string, string, string, string, string];
}

/**
 * Полный набор решённых экзаменационных задач из 15 реальных билетов кафедры ФН-12 МГТУ им. Н.Э. Баумана
 * (1-й семестр, ИУ-РЛ-БМТ, шифр 20-08, утверждены А.П. Крищенко):
 * Билеты №1, 3, 6, 7, 9, 10, 11, 12, 13, 14, 15, 17, 20, 21, 22.
 */
export const MATAN_EXAM_TICKET_TASKS: TaskCard[] = [
  // ======================== БИЛЕТ №1 (20-08) ========================
  {
    id: 'matan-b1-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 1 · №2 (5 б.)',
    title: 'Билет 1 · Предел с радикалом при x → +∞',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→+∞} (√(x² + 2x − 4) − x) / (8x + 1)',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №1, зад. 2):',
    problemLatex: '\\lim_{x \\to +\\infty} \\frac{\\sqrt{x^2 + 2x - 4} - x}{8x + 1}',
    algorithmSummary:
      'При x → +∞ вынести старшую степень x > 0 из числителя и знаменателя: √(x² + 2x − 4) ~ x, поэтому числитель имеет порядок o(x), а знаменатель ~ 8x ⇒ предел равен (1 − 1)/8 = 0.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вынести x > 0 из-под корня в числителе',
        detail: 'Так как x → +∞ (x > 0), имеем √(x²) = x. Разделим числитель и знаменатель на x:',
        latex: '\\frac{\\sqrt{x^2 + 2x - 4} - x}{8x + 1} = \\frac{x\\left(\\sqrt{1 + \\frac{2}{x} - \\frac{4}{x^2}} - 1\\right)}{x\\left(8 + \\frac{1}{x}\\right)}',
      },
      {
        title: 'Шаг 2 · Перейти к пределу при x → +∞',
        detail: 'При x → +∞ дроби 2/x, 4/x², 1/x стремятся к 0 (или домножением на сопряжённое числитель стремится к 1, а знаменатель к +∞):',
        latex: '\\lim_{x \\to +\\infty} \\frac{\\sqrt{1 + \\frac{2}{x} - \\frac{4}{x^2}} - 1}{8 + \\frac{1}{x}} = \\frac{1 - 1}{8} = 0',
      },
    ],
    code: '',
    expectedOutput: '0',
    answerLatex: '0',
    slides: [
      {lectureId: 'matan_bilet_1', page: 1, label: 'Билет ФН-12 №1 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b1-3',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'Билет 1 · №3 (5 б.)',
    title: 'Билет 1 · Сравнение б.м. α(x) = ∛(x²) − √(x³) и β(x) = x при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Сравнить бесконечно малые при x → 0 функции α(x) = ∛(x²) − √(x³) и β(x) = x.',
    problemTextClean: 'Сравнить бесконечно малые при x → 0 функции (Билет ФН-12 №1, зад. 3):',
    problemLatex: '\\alpha(x) = \\sqrt[3]{x^2} - \\sqrt{x^3}, \\qquad \\beta(x) = x \\quad (x \\to +0)',
    algorithmSummary:
      'При x → +0 старшее (наименьшее по показателю!) слагаемое в α(x) = x^(2/3) − x^(3/2) равно x^(2/3). Порядок малости относительно β(x) = x равен k = 2/3 < 1 (α — б.м. более низкого порядка малости, чем x).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить главную часть α(x) при x → +0',
        detail: 'Запишем радикалы в виде дробных степеней (ОДЗ √(x³): x ≥ 0): α(x) = x^(2/3) − x^(3/2). При x → 0 меньшая степень убывает медленнее:',
        latex: '\\alpha(x) = x^{2/3}\\left(1 - x^{5/6}\\right) \\sim x^{2/3} \\quad (x \\to +0)',
      },
      {
        title: 'Шаг 2 · Сравнить с эталоном β(x) = x',
        detail: 'Находим предел отношения α(x)/β(x) и порядок малости k:',
        latex: '\\lim_{x \\to +0} \\frac{\\alpha(x)}{\\beta(x)} = \\lim_{x \\to +0} \\frac{x^{2/3}}{x} = \\lim_{x \\to +0} x^{-1/3} = +\\infty, \\quad k = \\frac{2}{3}',
      },
    ],
    code: '',
    expectedOutput: 'k = 2/3 (более низкого порядка малости, главная часть x^(2/3))',
    answerLatex: '\\alpha(x) \\sim x^{2/3},\\; k = \\frac{2}{3} \\text{ (б.м. более низкого порядка, чем } x\\text{)}',
    slides: [
      {lectureId: 'matan_bilet_1', page: 1, label: 'Билет ФН-12 №1 (20-08) · Зад. 3', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b1-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 1 · №4 (5 б.)',
    title: 'Билет 1 · Точки разрыва f(x) = 1 / (1 + e^(1/(x⁴ − 1)))',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = 1 / (1 + e^(1/(x⁴ − 1))) и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №1, зад. 4):',
    problemLatex: 'f(x) = \\frac{1}{1 + e^{1/(x^4 - 1)}}',
    algorithmSummary:
      'Знаменатель показателя x⁴ − 1 = (x − 1)(x + 1)(x² + 1) = 0 даёт две точки разрыва x = −1 и x = 1. В обеих точках односторонние пределы равны 0 и 1 ⇒ обе точки являются точками разрыва I рода (со скачком).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти точки, в которых функция не определена',
        detail: 'Показатель экспоненты 1/(x⁴ − 1) не определён при x⁴ − 1 = 0 ⇔ x = −1 и x = 1. Экспонента всегда > 0, поэтому внешний знаменатель 1 + e^(...) в нуль не обращается.',
      },
      {
        title: 'Шаг 2 · Исследовать точку x = 1',
        detail: 'При x → 1 − 0 имеем x⁴ − 1 → −0 ⇒ 1/(x⁴ − 1) → −∞ ⇒ e^(−∞) = 0 ⇒ f(1 − 0) = 1. При x → 1 + 0 имеем 1/(x⁴ − 1) → +∞ ⇒ e^(+∞) = +∞ ⇒ f(1 + 0) = 0:',
        latex: 'f(1 - 0) = 1, \\quad f(1 + 0) = 0 \\implies x = 1 \\text{ — разрыв I рода (скачок } \\Delta = -1\\text{)}',
      },
      {
        title: 'Шаг 3 · Исследовать точку x = −1',
        detail: 'В силу чётности f(−x) = f(x): при x → −1 − 0 имеем x⁴ − 1 → +0 ⇒ f(−1 − 0) = 0; при x → −1 + 0 имеем x⁴ − 1 → −0 ⇒ f(−1 + 0) = 1:',
        latex: 'f(-1 - 0) = 0, \\quad f(-1 + 0) = 1 \\implies x = -1 \\text{ — разрыв I рода (скачок } \\Delta = +1\\text{)}',
      },
    ],
    code: '',
    expectedOutput: 'x = -1 и x = 1 (точки разрыва I рода со скачком)',
    answerLatex: 'x_1 = -1,\\; x_2 = 1 \\text{ — точки разрыва I рода (скачок)}',
    slides: [
      {lectureId: 'matan_bilet_1', page: 1, label: 'Билет ФН-12 №1 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b1-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Билет 1 · №5 (6 б.)',
    title: 'Билет 1 · Касательная к эллипсу x = 5 cos t, y = 2 sin t параллельно 2x + 5y = 0',
    chapter: CH_MVT,
    problemStatement: 'Составить уравнение касательной к кривой x = 5 cos t, y = 2 sin t, которая параллельна прямой 2x + 5y = 0.',
    problemTextClean: 'Составить уравнение касательной к параметрически заданной кривой (Билет ФН-12 №1, зад. 5):',
    problemLatex: '\\begin{cases} x = 5\\cos t, \\\\ y = 2\\sin t, \\end{cases} \\quad \\text{параллельной прямой } 2x + 5y = 0',
    algorithmSummary:
      'Производная параметрической функции y′_x = y′_t / x′_t = (2 cos t)/(−5 sin t) = −(2/5) ctg t. Из параллельности прямой y = −(2/5)x получаем ctg t = 1 ⇒ две точки касания и две касательные: 2x + 5y = ±10√2.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти производную y′_x параметрически заданной кривой',
        detail: 'Вычисляем x′(t) = −5 sin t, y′(t) = 2 cos t и приравниваем к угловому коэффициенту прямой k = −2/5:',
        latex: "y'_x = \\frac{y'_t}{x'_t} = \\frac{2\\cos t}{-5\\sin t} = -\\frac{2}{5}\\operatorname{ctg} t = -\\frac{2}{5} \\implies \\operatorname{ctg} t = 1",
      },
      {
        title: 'Шаг 2 · Найти координаты точек касания на эллипсе',
        detail: 'Из ctg t = 1 получаем t₁ = π/4 и t₂ = 5π/4:',
        latex: 'M_1\\left(\\frac{5\\sqrt{2}}{2};\\, \\sqrt{2}\\right), \\qquad M_2\\left(-\\frac{5\\sqrt{2}}{2};\\, -\\sqrt{2}\\right)',
      },
      {
        title: 'Шаг 3 · Записать уравнения обеих касательных',
        detail: 'Подставляем точки M₁ и M₂ в уравнение прямой 2x + 5y + C = 0:',
        latex: '2x + 5y - 10\\sqrt{2} = 0 \\quad \\text{и} \\quad 2x + 5y + 10\\sqrt{2} = 0',
      },
    ],
    code: '',
    expectedOutput: '2x + 5y = 10*sqrt(2) и 2x + 5y = -10*sqrt(2)',
    answerLatex: '2x + 5y \\pm 10\\sqrt{2} = 0 \\;\\; \\left(y = -\\frac{2}{5}x \\pm 2\\sqrt{2}\\right)',
    slides: [
      {lectureId: 'matan_bilet_1', page: 1, label: 'Билет ФН-12 №1 (20-08) · Зад. 5', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b1-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Билет 1 · №6 (5 б.)',
    title: 'Билет 1 · Монотонность и экстремумы функции f(x) = ∛((x² − 1)²)',
    chapter: CH_STUDY,
    problemStatement: 'Найти интервалы возрастания, убывания, точки экстремума функции f(x) = ∛((x² − 1)²).',
    problemTextClean: 'Найти интервалы монотонности и точки экстремума функции (Билет ФН-12 №1, зад. 6):',
    problemLatex: 'f(x) = \\sqrt[3]{(x^2 - 1)^2}',
    algorithmSummary:
      'f′(x) = 4x / (3∛(x² − 1)). Критические точки: x = 0 (f′ = 0) и x = ±1 (f′ не существует — острые пики/точки возврата!). Экстремумы есть во всех трёх точках: x_min = −1 (y = 0), x_max = 0 (y = 1), x_min = 1 (y = 0).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вычислить производную и найти критические точки',
        detail: 'Функция непрерывна на всей оси R. Находим f′(x):',
        latex: "f'(x) = \\frac{2}{3}(x^2 - 1)^{-1/3} \\cdot 2x = \\frac{4x}{3\\sqrt[3]{x^2 - 1}}",
      },
      {
        title: 'Шаг 2 · Определить знаки f′(x) на 4 интервалах',
        detail: 'Критическими являются как точка x = 0 (где f′ = 0), так и точки x = −1, x = 1 (где f′ = ∞, а сама функция непрерывна!):',
        latex: '(-\\infty, -1): f\'<0\\;(\\downarrow); \\quad (-1, 0): f\'>0\\;(\\uparrow); \\quad (0, 1): f\'<0\\;(\\downarrow); \\quad (1, +\\infty): f\'>0\\;(\\uparrow)',
      },
      {
        title: 'Шаг 3 · Выписать точки экстремума',
        detail: 'По первому достаточному условию смена знака f′ даёт три экстремума:',
        latex: 'x_{\\min} = \\pm 1,\\; f(\\pm 1) = 0; \\qquad x_{\\max} = 0,\\; f(0) = 1',
      },
    ],
    code: '',
    expectedOutput: 'x_min = -1, x_max = 0, x_min = 1',
    answerLatex: 'x_{\\min} = \\pm 1\\;(y = 0), \\quad x_{\\max} = 0\\;(y = 1)',
    slides: [
      {lectureId: 'matan_bilet_1', page: 1, label: 'Билет ФН-12 №1 (20-08) · Зад. 6', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №3 (20-08) ========================
  {
    id: 'matan-b3-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 3 · №2 (5 б.)',
    title: 'Билет 3 · Предел (sin(πx/2) − 1) / (x − 1)² при x → 1',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→1} (sin(πx/2) − 1) / (x − 1)²',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №3, зад. 2):',
    problemLatex: '\\lim_{x \\to 1} \\frac{\\sin\\frac{\\pi x}{2} - 1}{(x - 1)^2}',
    algorithmSummary:
      'Замена t = x − 1 → 0 переводит sin(π(1+t)/2) в cos(πt/2). Далее используем эталон 1 − cos u ~ u²/2 ⇒ (cos(πt/2) − 1)/t² ~ −(πt/2)² / (2t²) = −π²/8.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Сделать замену переменной t = x − 1 → 0',
        detail: 'По формуле приведения sin(π/2 + πt/2) = cos(πt/2):',
        latex: '\\lim_{t \\to 0} \\frac{\\cos\\frac{\\pi t}{2} - 1}{t^2}',
      },
      {
        title: 'Шаг 2 · Применить эквивалентность 1 − cos u ~ u²/2',
        detail: 'При t → 0 имеем cos(πt/2) − 1 ~ −(1/2)·(πt/2)² = −π²t²/8:',
        latex: '\\lim_{t \\to 0} \\frac{-\\frac{1}{2}\\left(\\frac{\\pi t}{2}\\right)^2}{t^2} = -\\frac{\\pi^2}{8}',
      },
    ],
    code: '',
    expectedOutput: '-pi^2/8',
    answerLatex: '-\\frac{\\pi^2}{8}',
    slides: [
      {lectureId: 'matan_bilet_3', page: 1, label: 'Билет ФН-12 №3 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b3-3',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'Билет 3 · №3 (5 б.)',
    title: 'Билет 3 · Сравнение б.м. α(x) = ln(1 + x e^x) и β(x) = ln(x + √(1 + x²)) при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Показать, что функции α(x) = ln(1 + x e^x) и β(x) = ln(x + √(1 + x²)) являются ب.м. при x → 0. Выделить их главные части и сравнить.',
    problemTextClean: 'Выделить главные части б.м. при x → 0 и сравнить их (Билет ФН-12 №3, зад. 3):',
    problemLatex: '\\alpha(x) = \\ln(1 + x e^x), \\qquad \\beta(x) = \\ln\\left(x + \\sqrt{1 + x^2}\\right) \\quad (x \\to 0)',
    algorithmSummary:
      'Обе функции эквивалентны x при x → 0: α(x) ~ x e^x ~ x, а β(x) = ln(1 + (x + √(1+x²) − 1)) ~ x + x²/2 ~ x. Главные части обеих функций равны x ⇒ функции эквивалентны (α ~ β при x → 0).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Главная часть α(x)',
        detail: 'При x → 0 имеем u = x e^x → 0, поэтому ln(1 + x e^x) ~ x e^x ~ x·1 = x:',
        latex: '\\alpha(x) = \\ln(1 + x e^x) \\sim x e^x \\sim x',
      },
      {
        title: 'Шаг 2 · Главная часть β(x)',
        detail: 'Представим аргумент логарифма в виде 1 + t, где t = x + √(1 + x²) − 1 ~ x + x²/2 ~ x при x → 0:',
        latex: '\\beta(x) = \\ln\\bigl(1 + (x + \\sqrt{1 + x^2} - 1)\\bigr) \\sim x + \\frac{x^2}{2} \\sim x',
      },
      {
        title: 'Шаг 3 · Вывод о сравнении',
        detail: 'Отношение главных частей равно x / x = 1 ⇒ α(x) и β(x) эквивалентны при x → 0:',
        latex: '\\lim_{x \\to 0} \\frac{\\alpha(x)}{\\beta(x)} = 1 \\implies \\alpha(x) \\sim \\beta(x) \\sim x',
      },
    ],
    code: '',
    expectedOutput: 'эквивалентны, главная часть x (предел отношения 1)',
    answerLatex: '\\alpha(x) \\sim x,\\; \\beta(x) \\sim x \\implies \\alpha(x) \\sim \\beta(x) \\text{ (эквивалентны)}',
    slides: [
      {lectureId: 'matan_bilet_3', page: 1, label: 'Билет ФН-12 №3 (20-08) · Зад. 3', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b3-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 3 · №4 (5 б.)',
    title: 'Билет 3 · Точки разрыва кусочной функции на отрезке [0; 4]',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва кусочной функции f(x) = {2√x при 0≤x≤1; 4−2x при 1<x<2.5; 2x−7 при 2.5≤x≤4} и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №3, зад. 4):',
    problemLatex: 'f(x) = \\begin{cases} 2\\sqrt{x}, & 0 \\le x \\le 1; \\\\ 4 - 2x, & 1 < x < 2{,}5; \\\\ 2x - 7, & 2{,}5 \\le x \\le 4. \\end{cases}',
    algorithmSummary:
      'Проверяем два стыка: в точке x = 1 пределы слева и справа равны 2 (непрерывна!), а в точке x = 2,5 левый предел равен −1, правый −2 ⇒ x = 2,5 — единственная точка разрыва I рода (скачок Δ = −1).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Проверить стык x = 1',
        detail: 'Вычисляем односторонние пределы и значение f(1):',
        latex: 'f(1 - 0) = 2\\sqrt{1} = 2, \\quad f(1 + 0) = 4 - 2\\cdot 1 = 2, \\quad f(1) = 2 \\implies \\text{в } x = 1 \\text{ непрерывна}',
      },
      {
        title: 'Шаг 2 · Проверить стык x = 2,5',
        detail: 'Вычисляем предел слева по второй ветви и предел справа по третьей ветви:',
        latex: 'f(2{,}5 - 0) = 4 - 2\\cdot 2{,}5 = -1, \\quad f(2{,}5 + 0) = 2\\cdot 2{,}5 - 7 = -2 \\implies x = 2{,}5 \\text{ — разрыв I рода (скачок } -1\\text{)}',
      },
    ],
    code: '',
    expectedOutput: 'x = 2.5 (разрыв I рода, скачок -1; в x = 1 непрерывна)',
    answerLatex: 'x = 2{,}5 \\text{ — точка разрыва I рода (скачок } \\Delta = -1\\text{)}; \\; \\text{в } x = 1 \\text{ непрерывна}',
    slides: [
      {lectureId: 'matan_bilet_3', page: 1, label: 'Билет ФН-12 №3 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b3-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Билет 3 · №5 (6 б.)',
    title: 'Билет 3 · Касательная к графику y = arcctg x перпендикулярно прямой y = x',
    chapter: CH_MVT,
    problemStatement: 'Составить уравнение касательной к графику функции y = arcctg x, которая перпендикулярна прямой y = x.',
    problemTextClean: 'Составить уравнение касательной к графику функции (Билет ФН-12 №3, зад. 5):',
    problemLatex: 'y = \\operatorname{arcctg} x, \\quad \\text{перпендикулярной прямой } y = x',
    algorithmSummary:
      'Условие перпендикулярности прямой с k₁ = 1 даёт угловой коэффициент касательной k = −1/k₁ = −1. Решаем y′(x₀) = −1/(1 + x₀²) = −1 ⇒ x₀ = 0, y₀ = π/2 ⇒ касательная y = −x + π/2.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти угловой коэффициент касательной из перпендикулярности',
        detail: 'У прямой y = x угловой коэффициент k₁ = 1. Для перпендикулярной касательной k = −1/k₁ = −1. Приравниваем производную (arcctg x)′ = −1/(1 + x²):',
        latex: "y'(x_0) = -\\frac{1}{1 + x_0^2} = -1 \\implies 1 + x_0^2 = 1 \\implies x_0 = 0",
      },
      {
        title: 'Шаг 2 · Составить уравнение касательной',
        detail: 'В точке x₀ = 0 значение функции y₀ = arcctg 0 = π/2:',
        latex: 'y - \\frac{\\pi}{2} = -1\\cdot(x - 0) \\implies y = -x + \\frac{\\pi}{2}',
      },
    ],
    code: '',
    expectedOutput: 'y = -x + pi/2',
    answerLatex: 'y = -x + \\frac{\\pi}{2}',
    slides: [
      {lectureId: 'matan_bilet_3', page: 1, label: 'Билет ФН-12 №3 (20-08) · Зад. 5', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №6 (20-08) ========================
  {
    id: 'matan-b6-3',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'Билет 6 · №3 (5 б.)',
    title: 'Билет 6 · Порядок малости β(x) = sin(√(4 + x) − 2) относительно α(x) = x² при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Найти порядок малости функции β(x) = sin(√(4 + x) − 2) относительно функции α(x) = x² при x → 0.',
    problemTextClean: 'Найти порядок малости функции β(x) относительно α(x) = x² при x → 0 (Билет ФН-12 №6, зад. 3):',
    problemLatex: '\\beta(x) = \\sin\\left(\\sqrt{4 + x} - 2\\right) \\quad \\text{относительно } \\alpha(x) = x^2 \\; (x \\to 0)',
    algorithmSummary:
      'При x → 0 имеем sin(√(4+x) − 2) ~ √(4+x) − 2 = 2((1 + x/4)^(1/2) − 1) ~ 2·(x/8) = x/4 = (1/4)·(x²)^(1/2). Следовательно, относительно эталона α(x) = x² порядок малости равен k = 1/2!',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить главную часть β(x) по степеням x',
        detail: 'Заменяем sin u ~ u и выносим 2 из-под корня √(4 + x) = 2√(1 + x/4):',
        latex: '\\beta(x) \\sim \\sqrt{4 + x} - 2 = 2\\left(\\sqrt{1 + \\frac{x}{4}} - 1\\right) \\sim 2 \\cdot \\frac{x}{8} = \\frac{x}{4}',
      },
      {
        title: 'Шаг 2 · Выразить через эталон α(x) = x²',
        detail: 'Внимание на ловушку условия: эталон равен α(x) = x², а не x! Так как |x| = (x²)^(1/2), получаем:',
        latex: '\\beta(x) \\sim \\frac{1}{4}x = \\frac{1}{4}\\bigl(\\alpha(x)\\bigr)^{1/2} \\implies k = \\frac{1}{2}',
      },
    ],
    code: '',
    expectedOutput: '1/2 (порядок k = 1/2 относительно x^2; относительно x порядок 1)',
    answerLatex: 'k = \\frac{1}{2} \\;\\;\\left(\\beta(x) \\sim \\frac{1}{4}x = \\frac{1}{4}(\\alpha(x))^{1/2}\\right)',
    slides: [
      {lectureId: 'matan_bilet_6', page: 1, label: 'Билет ФН-12 №6 (20-08) · Зад. 3', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b6-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Билет 6 · №6 (5 б.)',
    title: 'Билет 6 · Асимптоты и точки экстремума функции f(x) = 2x + 3∛(x²)',
    chapter: CH_STUDY,
    problemStatement: 'Найти асимптоты и точки экстремума функции f(x) = 2x + 3∛(x²). Построить график в окрестности точек экстремума.',
    problemTextClean: 'Найти асимптоты и точки экстремума функции (Билет ФН-12 №6, зад. 6):',
    problemLatex: 'f(x) = 2x + 3\\sqrt[3]{x^2}',
    algorithmSummary:
      'f′(x) = 2 + 2/∛x = 2(∛x + 1)/∛x. Две критические точки: x = −1 (f′ = 0 ⇒ x_max = −1, y = 1) и x = 0 (f′ = ∞, остриё ⇒ x_min = 0, y = 0). Асимптот нет, т.к. при x → ±∞ разность f(x) − 2x = 3∛(x²) → +∞.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти производную и критические точки',
        detail: 'Функция определена и непрерывна на R. Дифференцируем при x ≠ 0:',
        latex: "f'(x) = 2 + 3 \\cdot \\frac{2}{3}x^{-1/3} = 2 + \\frac{2}{\\sqrt[3]{x}} = \\frac{2(\\sqrt[3]{x} + 1)}{\\sqrt[3]{x}}",
      },
      {
        title: 'Шаг 2 · Исследовать знаки f′(x) и найти экстремумы',
        detail: 'Критические точки: x = −1 (f′ = 0) и x = 0 (f′ не существует). На (−∞, −1) f′ > 0; на (−1, 0) f′ < 0; на (0, +∞) f′ > 0:',
        latex: 'x_{\\max} = -1,\\; f(-1) = 1; \\qquad x_{\\min} = 0,\\; f(0) = 0',
      },
      {
        title: 'Шаг 3 · Проверить наличие асимптот',
        detail: 'Вертикальных асимптот нет (D(f) = R). Для наклонной k = lim (2 + 3/∛x) = 2, но b = lim (f(x) − 2x) = lim 3∛(x²) = +∞ ⇒ наклонных асимптот нет.',
      },
    ],
    code: '',
    expectedOutput: 'x_max = -1 (y = 1), x_min = 0 (y = 0); асимптот нет',
    answerLatex: 'x_{\\max} = -1\\;(y = 1), \\quad x_{\\min} = 0\\;(y = 0); \\quad \\text{асимптот нет}',
    slides: [
      {lectureId: 'matan_bilet_6', page: 1, label: 'Билет ФН-12 №6 (20-08) · Зад. 6', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №7 (20-08) ========================
  {
    id: 'matan-b7-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 7 · №2 (5 б.)',
    title: 'Билет 7 · Предел с двумя радикалами при x → 4',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→4} (√(2x + 1) − 3) / (√(x − 2) − √2)',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №7, зад. 2):',
    problemLatex: '\\lim_{x \\to 4} \\frac{\\sqrt{2x + 1} - 3}{\\sqrt{x - 2} - \\sqrt{2}}',
    algorithmSummary:
      'Неопределённость [0/0]. Домножить числитель и знаменатель на сопряжённые радикалы: в числителе получим 2(x − 4), в знаменателе (x − 4), после сокращения предел равен 2·(2√2)/6 = 2√2 / 3.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Домножить на сопряжённые выражения числителя и знаменателя',
        detail: 'Используем формулу разности квадратов (√a − √b)(√a + √b) = a − b:',
        latex: '\\frac{2x + 1 - 9}{x - 2 - 2} \\cdot \\frac{\\sqrt{x - 2} + \\sqrt{2}}{\\sqrt{2x + 1} + 3} = \\frac{2(x - 4)}{x - 4} \\cdot \\frac{\\sqrt{x - 2} + \\sqrt{2}}{\\sqrt{2x + 1} + 3}',
      },
      {
        title: 'Шаг 2 · Сократить на (x − 4) и подставить x = 4',
        detail: 'Подставляем x = 4 в оставшуюся дробь:',
        latex: '2 \\cdot \\frac{\\sqrt{2} + \\sqrt{2}}{3 + 3} = \\frac{4\\sqrt{2}}{6} = \\frac{2\\sqrt{2}}{3}',
      },
    ],
    code: '',
    expectedOutput: '2*sqrt(2)/3',
    answerLatex: '\\frac{2\\sqrt{2}}{3}',
    slides: [
      {lectureId: 'matan_bilet_7', page: 1, label: 'Билет ФН-12 №7 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b7-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 7 · №4 (5 б.)',
    title: 'Билет 7 · Точки разрыва рациональной функции f(x) = (x² − 4) / ((x − 2)(x + 3))',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = (x² − 4) / ((x − 2)(x + 3)) и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №7, зад. 4):',
    problemLatex: 'f(x) = \\frac{x^2 - 4}{(x - 2)(x + 3)}',
    algorithmSummary:
      'Знаменатель обращается в нуль при x = 2 и x = −3. При x ≠ 2 дробь сокращается до (x + 2)/(x + 3): в точке x = 2 конечный предел равен 4/5 (устранимый разрыв I рода), а в точке x = −3 пределы бесконечны (разрыв II рода).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Разложить числитель на множители',
        detail: 'При всех x ≠ 2, x ≠ −3 имеем x² − 4 = (x − 2)(x + 2):',
        latex: 'f(x) = \\frac{(x - 2)(x + 2)}{(x - 2)(x + 3)} = \\frac{x + 2}{x + 3} \\quad (x \\ne 2)',
      },
      {
        title: 'Шаг 2 · Классифицировать точки x = 2 и x = −3',
        detail: 'Вычисляем пределы в обеих особых точках:',
        latex: '\\lim_{x \\to 2} f(x) = \\frac{4}{5} \\implies x = 2 \\text{ — устранимый разрыв I рода}; \\qquad \\lim_{x \\to -3\\pm 0} f(x) = \\mp\\infty \\implies x = -3 \\text{ — разрыв II рода}',
      },
    ],
    code: '',
    expectedOutput: 'x = 2 (устранимый разрыв I рода, предел 4/5) и x = -3 (разрыв II рода)',
    answerLatex: 'x = 2 \\text{ — устранимый разрыв I рода } (\\lim = 4/5); \\quad x = -3 \\text{ — разрыв II рода}',
    slides: [
      {lectureId: 'matan_bilet_7', page: 1, label: 'Билет ФН-12 №7 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b7-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Билет 7 · №6 (5 б.)',
    title: 'Билет 7 · Интервалы выпуклости и точки перегиба f(x) = x² + 9∛x',
    chapter: CH_STUDY,
    problemStatement: 'Найти интервалы выпуклости вверх, вниз, точки перегиба графика функции f(x) = x² + 9∛x.',
    problemTextClean: 'Найти интервалы выпуклости и точки перегиба функции (Билет ФН-12 №7, зад. 6):',
    problemLatex: 'f(x) = x^2 + 9\\sqrt[3]{x}',
    algorithmSummary:
      'f′(x) = 2x + 3x^(−2/3), f″(x) = 2 − 2x^(−5/3) = 2(x^(5/3) − 1)/x^(5/3). Вторая производная меняет знак в ДВУХ точках: x = 0 (f″ = ∞, вертикальная касательная) и x = 1 (f″ = 0) ⇒ две точки перегиба: (0; 0) и (1; 10).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вычислить первую и вторую производные',
        detail: 'Функция непрерывна на R. Находим f′(x) и f″(x) при x ≠ 0:',
        latex: "f'(x) = 2x + 3x^{-2/3}, \\qquad f''(x) = 2 - 2x^{-5/3} = \\frac{2\\left(\\sqrt[3]{x^5} - 1\\right)}{\\sqrt[3]{x^5}}",
      },
      {
        title: 'Шаг 2 · Определить знаки f″(x) и точки перегиба',
        detail: 'Критические точки II рода: x = 0 (f″ не существует, но есть вертикальная касательная) и x = 1 (f″ = 0):',
        latex: '(-\\infty, 0): f\'\'>0\\;(\\cup \\text{ вниз}); \\quad (0, 1): f\'\'<0\\;(\\cap \\text{ вверх}); \\quad (1, +\\infty): f\'\'>0\\;(\\cup \\text{ вниз})',
      },
      {
        title: 'Шаг 3 · Выписать обе точки перегиба',
        detail: 'В обеих точках x = 0 и x = 1 кривая меняет направление выпуклости:',
        latex: 'M_1(0;\\, 0) \\quad \\text{и} \\quad M_2(1;\\, 10)',
      },
    ],
    code: '',
    expectedOutput: 'x = 0 (0, 0) и x = 1 (1, 10)',
    answerLatex: '\\text{Вниз: } (-\\infty,0),\\,(1,+\\infty); \\; \\text{вверх: } (0,1); \\; \\text{перегибы: } (0;0),\\,(1;10)',
    slides: [
      {lectureId: 'matan_bilet_7', page: 1, label: 'Билет ФН-12 №7 (20-08) · Зад. 6', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №9 (20-08) ========================
  {
    id: 'matan-b9-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 9 · №2 (5 б.)',
    title: 'Билет 9 · Предел отношения многочленов 5-й степени при x → ∞',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→∞} (x−1)(x−2)(x−3)(x−4)(x−5) / (5x − 1)⁵',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №9, зад. 2):',
    problemLatex: '\\lim_{x \\to \\infty} \\frac{(x - 1)(x - 2)(x - 3)(x - 4)(x - 5)}{(5x - 1)^5}',
    algorithmSummary:
      'Разделить каждую из 5 скобок числителя и знаменателя на x: старший член числителя равен x⁵, знаменателя (5x)⁵ = 3125 x⁵ ⇒ предел равен 1 / 5⁵ = 1/3125.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Разделить числитель и знаменатель на x⁵',
        detail: 'Вносим деление на x в каждый из пяти сомножителей:',
        latex: '\\lim_{x \\to \\infty} \\frac{\\left(1 - \\frac{1}{x}\\right)\\left(1 - \\frac{2}{x}\\right)\\left(1 - \\frac{3}{x}\\right)\\left(1 - \\frac{4}{x}\\right)\\left(1 - \\frac{5}{x}\\right)}{\\left(5 - \\frac{1}{x}\\right)^5} = \\frac{1}{5^5} = \\frac{1}{3125}',
      },
    ],
    code: '',
    expectedOutput: '1/3125',
    answerLatex: '\\frac{1}{5^5} = \\frac{1}{3125}',
    slides: [
      {lectureId: 'matan_bilet_9', page: 1, label: 'Билет ФН-12 №9 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b9-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 9 · №4 (5 б.)',
    title: 'Билет 9 · Точки разрыва функции f(x) = √((1 − cos πx) / (4 − x²))',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = √((1 − cos πx) / (4 − x²)) и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №9, зад. 4):',
    problemLatex: 'f(x) = \\sqrt{\\frac{1 - \\cos \\pi x}{4 - x^2}}',
    algorithmSummary:
      'Так как 1 − cos πx = 2 sin²(πx/2) ≥ 0, подкоренное выражение неотрицательно при 4 − x² > 0, т.е. функция определена только на интервале (−2; 2)! В граничных точках x = ±2 числитель sin²(±π) = 0, поэтому существуют конечные односторонние пределы π/2 ⇒ x = ±2 — устранимые точки разрыва I рода на границе ОДЗ.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти область определения функции',
        detail: 'Числитель 1 − cos πx = 2 sin²(πx/2) ≥ 0 при всех x. Поэтому подкоренная дробь определена и ≥ 0 на интервале (−2; 2) (при |x| > 2 знаменатель 4 − x² < 0, и функция не определена, кроме изолированных нулей синуса).',
      },
      {
        title: 'Шаг 2 · Вычислить пределы при x → 2 − 0 и x → −2 + 0',
        detail: 'При x = 2 имеем t = 2 − x → +0, sin(πx/2) = sin(π − πt/2) = sin(πt/2) ~ πt/2:',
        latex: '\\lim_{x \\to 2 - 0} \\frac{\\sqrt{2}\\,|\\sin(\\pi x / 2)|}{\\sqrt{(2 - x)(2 + x)}} = \\lim_{t \\to +0} \\frac{\\sqrt{2} \\cdot (\\pi t / 2)}{\\sqrt{t \\cdot 4}} = 0',
      },
      {
        title: 'Шаг 3 · Классификация точек x = −2 и x = 2',
        detail: 'Односторонние пределы со стороны области определения (−2; 2) конечны и равны 0 ⇒ обе граничные точки x = −2 и x = 2 являются точками устранимого разрыва (I рода).',
      },
    ],
    code: '',
    expectedOutput: 'x = -2 и x = 2 (устранимые точки разрыва I рода, предел 0)',
    answerLatex: 'x = \\pm 2 \\text{ — точки разрыва I рода (устранимые со стороны } (-2;2),\\; \\lim = 0\\text{)}',
    slides: [
      {lectureId: 'matan_bilet_9', page: 1, label: 'Билет ФН-12 №9 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b9-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Билет 9 · №5 (6 б.)',
    title: 'Билет 9 · Уравнение нормали к кривой y = 3/(x − 2) параллельно y − 3x = 0',
    chapter: CH_MVT,
    problemStatement: 'Составить уравнение нормали к кривой y = 3/(x − 2), которая параллельна прямой y − 3x = 0.',
    problemTextClean: 'Составить уравнение нормали к кривой (Билет ФН-12 №9, зад. 5):',
    problemLatex: 'y = \\frac{3}{x - 2}, \\quad \\text{параллельной прямой } y - 3x = 0',
    algorithmSummary:
      'Угловой коэффициент нормали равен k_н = −1 / y′(x₀) = 3 ⇒ y′(x₀) = −3/(x₀ − 2)² = −1/3 ⇒ (x₀ − 2)² = 9 ⇒ две точки M₁(5; 1) и M₂(−1; −1) и две нормали: y = 3x − 14 и y = 3x + 2.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти производную и приравнять угловой коэффициент нормали к 3',
        detail: 'У прямой y = 3x угловой коэффициент равен 3. Для нормали k_н = −1/y′(x₀) = 3 ⇒ y′(x₀) = −1/3:',
        latex: "y'(x_0) = -\\frac{3}{(x_0 - 2)^2} = -\\frac{1}{3} \\implies (x_0 - 2)^2 = 9 \\implies x_0 = 5 \\;\\text{или}\\; x_0 = -1",
      },
      {
        title: 'Шаг 2 · Записать уравнения обеих нормалей',
        detail: 'При x₀ = 5 имеем y₀ = 1; при x₀ = −1 имеем y₀ = −1:',
        latex: 'y - 1 = 3(x - 5) \\implies y = 3x - 14; \\qquad y + 1 = 3(x + 1) \\implies y = 3x + 2',
      },
    ],
    code: '',
    expectedOutput: 'y = 3x - 14 и y = 3x + 2',
    answerLatex: 'y = 3x - 14 \\quad \\text{и} \\quad y = 3x + 2',
    slides: [
      {lectureId: 'matan_bilet_9', page: 1, label: 'Билет ФН-12 №9 (20-08) · Зад. 5', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №10 (20-08) ========================
  {
    id: 'matan-b10-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 10 · №2 (5 б.)',
    title: 'Билет 10 · Показательно-степенной предел (tg x)^(1 / cos(3π/4 − x)) при x → π/4',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→π/4} (tg x)^(1 / cos(3π/4 − x))',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №10, зад. 2):',
    problemLatex: '\\lim_{x \\to \\pi/4} (\\operatorname{tg} x)^{\\frac{1}{\\cos(3\\pi/4 - x)}}',
    algorithmSummary:
      'Неопределённость [1^∞]. Замена t = x − π/4 → 0 даёт cos(3π/4 − x) = cos(π/2 − t) = sin t ~ t, а tg(π/4 + t) − 1 = 2 tg t / (1 − tg t) ~ 2t ⇒ показатель экспоненты равен lim (2t / t) = 2 ⇒ ответ e².',
    explanationSteps: [
      {
        title: 'Шаг 1 · Сделать замену t = x − π/4 → 0',
        detail: 'Тогда 3π/4 − x = π/2 − t, откуда cos(π/2 − t) = sin t. Для тангенса:',
        latex: '\\operatorname{tg}\\left(\\frac{\\pi}{4} + t\\right) - 1 = \\frac{1 + \\operatorname{tg} t}{1 - \\operatorname{tg} t} - 1 = \\frac{2\\operatorname{tg} t}{1 - \\operatorname{tg} t} \\sim 2t',
      },
      {
        title: 'Шаг 2 · Применить второй замечательный предел',
        detail: 'По правилу 1^∞ предел равен e^A, где A = lim (tg x − 1) / cos(3π/4 − x):',
        latex: 'A = \\lim_{t \\to 0} \\frac{2t}{\\sin t} = 2 \\implies \\text{Предел} = e^2',
      },
    ],
    code: '',
    expectedOutput: 'e^2',
    answerLatex: 'e^2',
    slides: [
      {lectureId: 'matan_bilet_10', page: 1, label: 'Билет ФН-12 №10 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b10-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 10 · №4 (5 б.)',
    title: 'Билет 10 · Точки разрыва функции f(x) = 1 / (1 − 2^(x/(x − 1)))',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = 1 / (1 − 2^(x/(x − 1))) и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №10, зад. 4):',
    problemLatex: 'f(x) = \\frac{1}{1 - 2^{\\frac{x}{x - 1}}}',
    algorithmSummary:
      'Две особые точки: 1) x = 0 (знаменатель 1 − 2⁰ = 0 ⇒ f(0±0) = ±∞ ⇒ разрыв II рода); 2) x = 1 (показатель x/(x−1) → ±∞ ⇒ f(1 − 0) = 1, f(1 + 0) = 0 ⇒ разрыв I рода со скачком Δ = −1).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти все точки, в которых функция не определена',
        detail: 'Показатель не определён при x = 1, а знаменатель 1 − 2^(x/(x−1)) = 0 при x/(x−1) = 0 ⇔ x = 0.',
      },
      {
        title: 'Шаг 2 · Исследовать точку x = 0',
        detail: 'При x → 0±0 показатель x/(x − 1) → ∓0, поэтому 1 − 2^(x/(x−1)) ~ −x ln 2 / (x − 1) → ±0 ⇒ f(0±0) = ±∞ (разрыв II рода).',
      },
      {
        title: 'Шаг 3 · Исследовать точку x = 1',
        detail: 'При x → 1 − 0 имеем x/(x − 1) → −∞ ⇒ 2^(−∞) = 0 ⇒ f(1 − 0) = 1. При x → 1 + 0 имеем x/(x − 1) → +∞ ⇒ 2^(+∞) = +∞ ⇒ f(1 + 0) = −0 = 0:',
        latex: 'x = 0 \\text{ — разрыв II рода}; \\qquad x = 1 \\text{ — разрыв I рода (скачок } f(1-0)=1,\\; f(1+0)=0\\text{)}',
      },
    ],
    code: '',
    expectedOutput: 'x = 0 (разрыв II рода) и x = 1 (разрыв I рода, скачок)',
    answerLatex: 'x = 0 \\text{ — разрыв II рода}; \\quad x = 1 \\text{ — разрыв I рода (скачок)}',
    slides: [
      {lectureId: 'matan_bilet_10', page: 1, label: 'Билет ФН-12 №10 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b10-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Билет 10 · №5 (6 б.)',
    title: 'Билет 10 · Касательная к y = arcsin(x/3) параллельно прямой y = 2x/3',
    chapter: CH_MVT,
    problemStatement: 'Составить уравнение касательной к графику функции y = arcsin(x/3), которая параллельна прямой y = 2x/3.',
    problemTextClean: 'Составить уравнение касательной к графику функции (Билет ФН-12 №10, зад. 5):',
    problemLatex: 'y = \\arcsin\\frac{x}{3}, \\quad \\text{параллельной прямой } y = \\frac{2x}{3}',
    algorithmSummary:
      'y′(x) = 1 / √(9 − x²) = 2/3 ⇒ 9 − x² = 9/4 ⇒ x₀ = ±3√3 / 2, y₀ = ±π/3. Получаем две параллельные касательные: y = (2/3)x ± (π/3 − √3).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Приравнять производную к угловому коэффициенту k = 2/3',
        detail: 'Находим производную y′ = 1 / √(9 − x²):',
        latex: "y'(x_0) = \\frac{1}{\\sqrt{9 - x_0^2}} = \\frac{2}{3} \\implies 9 - x_0^2 = \\frac{9}{4} \\implies x_0 = \\pm\\frac{3\\sqrt{3}}{2}",
      },
      {
        title: 'Шаг 2 · Составить уравнения касательных в обеих точках',
        detail: 'В точке x₀ = 3√3/2 имеем y₀ = arcsin(√3/2) = π/3; в точке x₀ = −3√3/2 имеем y₀ = −π/3:',
        latex: 'y = \\frac{2}{3}x + \\frac{\\pi}{3} - \\sqrt{3} \\quad \\text{и} \\quad y = \\frac{2}{3}x - \\frac{\\pi}{3} + \\sqrt{3}',
      },
    ],
    code: '',
    expectedOutput: 'y = (2/3)x + pi/3 - sqrt(3) и y = (2/3)x - pi/3 + sqrt(3)',
    answerLatex: 'y = \\frac{2}{3}x \\pm \\left(\\frac{\\pi}{3} - \\sqrt{3}\\right)',
    slides: [
      {lectureId: 'matan_bilet_10', page: 1, label: 'Билет ФН-12 №10 (20-08) · Зад. 5', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b10-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Билет 10 · №6 (5 б.)',
    title: 'Билет 10 · Точки перегиба и области выпуклости f(x) = ∛(x² − 4)',
    chapter: CH_STUDY,
    problemStatement: 'Найти точки перегиба и области выпуклости графика функции f(x) = ∛(x² − 4).',
    problemTextClean: 'Найти точки перегиба и области выпуклости функции (Билет ФН-12 №10, зад. 6):',
    problemLatex: 'f(x) = \\sqrt[3]{x^2 - 4}',
    algorithmSummary:
      'f′(x) = 2x / (3(x² − 4)^(2/3)), f″(x) = −2(x² + 12) / (9(x² − 4)^(5/3)). Числитель f″ всегда отрицателен, а знаменатель меняет знак при переходе через x = −2 и x = 2 (вертикальные касательные!) ⇒ две точки перегиба: (−2; 0) и (2; 0).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти первую и вторую производные',
        detail: 'Дифференцируем f(x) = (x² − 4)^(1/3):',
        latex: "f'(x) = \\frac{2x}{3(x^2 - 4)^{2/3}}, \\qquad f''(x) = -\\frac{2(x^2 + 12)}{9(x^2 - 4)^{5/3}}",
      },
      {
        title: 'Шаг 2 · Исследовать знаки f″(x) и точки перегиба',
        detail: 'Так как x² + 12 > 0, знак f″(x) противоположен знаку (x² − 4): на (−2; 2) имеем f″ > 0 (выпукла вниз), а при |x| > 2 имеем f″ < 0 (выпукла вверх). В точках x = ±2 существуют вертикальные касательные:',
        latex: '\\text{Вниз: } (-2;\\, 2); \\quad \\text{вверх: } (-\\infty;-2),\\,(2;+\\infty); \\quad \\text{точки перегиба: } (-2;\\,0),\\;(2;\\,0)',
      },
    ],
    code: '',
    expectedOutput: 'x = -2 и x = 2 (точки перегиба (-2, 0) и (2, 0))',
    answerLatex: '\\text{Вниз: } (-2;2); \\; \\text{вверх: } (-\\infty;-2),\\,(2;+\\infty); \\; \\text{перегибы: } (\\pm 2;\\,0)',
    slides: [
      {lectureId: 'matan_bilet_10', page: 1, label: 'Билет ФН-12 №10 (20-08) · Зад. 6', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №11 (20-08) ========================
  {
    id: 'matan-b11-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 11 · №2 (5 б.)',
    title: 'Билет 11 · Предел (x + 3^x)^(2/(x + 3)) при x → +∞',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→+∞} (x + 3^x)^(2 / (x + 3))',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №11, зад. 2):',
    problemLatex: '\\lim_{x \\to +\\infty} \\left(x + 3^x\\right)^{\\frac{2}{x + 3}}',
    algorithmSummary:
      'Вынести доминирующую показательную функцию 3^x из скобки: (3^x)^(2/(x+3)) = 3^(2x/(x+3)) → 3² = 9, а множитель (1 + x/3^x)^(2/(x+3)) → 1⁰ = 1 ⇒ ответ 9.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вынести 3^x из основания степени',
        detail: 'При x → +∞ показательная функция 3^x растёт быстрее степенной x (x / 3^x → 0):',
        latex: '\\left(x + 3^x\\right)^{\\frac{2}{x + 3}} = 3^{\\frac{2x}{x + 3}} \\cdot \\left(1 + \\frac{x}{3^x}\\right)^{\\frac{2}{x + 3}}',
      },
      {
        title: 'Шаг 2 · Перейти к пределу',
        detail: 'Показатель 2x/(x + 3) → 2, а второй сомножитель имеет вид (1 + 0)⁰ = 1:',
        latex: '3^2 \\cdot 1^0 = 9',
      },
    ],
    code: '',
    expectedOutput: '9',
    answerLatex: '9',
    slides: [
      {lectureId: 'matan_bilet_11', page: 1, label: 'Билет ФН-12 №11 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b11-3',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'Билет 11 · №3 (5 б.)',
    title: 'Билет 11 · Главные части б.м. α(x) = sin(√(x + 2) − √2) и β(x) = ln(1 + x³) при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Показать, что функции α(x) = sin(√(x + 2) − √2) и β(x) = ln(1 + x³) являются б.м. при x → 0. Выделить их главные части и сравнить.',
    problemTextClean: 'Выделить главные части б.м. при x → 0 и сравнить их (Билет ФН-12 №11, зад. 3):',
    problemLatex: '\\alpha(x) = \\sin\\left(\\sqrt{x + 2} - \\sqrt{2}\\right), \\qquad \\beta(x) = \\ln(1 + x^3) \\quad (x \\to 0)',
    algorithmSummary:
      'Главная часть α(x) ~ √2·((1 + x/2)^(1/2) − 1) ~ (√2/4)x (1-й порядок), а главная часть β(x) ~ x³ (3-й порядок). Следовательно, β(x) = o(α(x)) — б.м. более высокого порядка малости.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить главную часть α(x)',
        detail: 'Используем sin u ~ u и домножение на сопряжённое √(x+2) + √2 → 2√2:',
        latex: '\\alpha(x) \\sim \\sqrt{x + 2} - \\sqrt{2} = \\frac{x}{\\sqrt{x + 2} + \\sqrt{2}} \\sim \\frac{x}{2\\sqrt{2}} = \\frac{\\sqrt{2}}{4}x',
      },
      {
        title: 'Шаг 2 · Выделить главную часть β(x) и сравнить',
        detail: 'Для логарифма β(x) = ln(1 + x³) ~ x³. Так как порядок 3 > 1, β(x) малости выше, чем α(x):',
        latex: '\\beta(x) \\sim x^3 = o(\\alpha(x)) \\quad (x \\to 0)',
      },
    ],
    code: '',
    expectedOutput: 'x/(2*sqrt(2)) и x^3 (beta более высокого порядка малости)',
    answerLatex: '\\alpha(x) \\sim \\frac{x}{2\\sqrt{2}}, \\quad \\beta(x) \\sim x^3 \\;\\;\\bigl(\\beta = o(\\alpha)\\bigr)',
    slides: [
      {lectureId: 'matan_bilet_11', page: 1, label: 'Билет ФН-12 №11 (20-08) · Зад. 3', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b11-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 11 · №4 (5 б.)',
    title: 'Билет 11 · Точки разрыва функции f(x) = (x − 1) sin(1 / (1 − x²))',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = (x − 1) sin(1 / (1 − x²)) и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №11, зад. 4):',
    problemLatex: 'f(x) = (x - 1)\\sin\\frac{1}{1 - x^2}',
    algorithmSummary:
      'В точке x = 1 произведение бесконечно малой (x − 1) на ограниченную sin(...) даёт предел 0 ⇒ x = 1 — устранимая точка разрыва I рода! А в точке x = −1 множитель (x − 1) → −2 ≠ 0, а sin(1/(1−x²)) осциллирует между −1 и 1 ⇒ x = −1 — точка разрыва II рода.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Исследовать точку x = 1',
        detail: 'По теореме о произведении б.м. (x − 1) → 0 на ограниченную функцию |sin(...)| ≤ 1:',
        latex: '\\lim_{x \\to 1} (x - 1)\\sin\\frac{1}{1 - x^2} = 0 \\implies x = 1 \\text{ — устранимый разрыв I рода}',
      },
      {
        title: 'Шаг 2 · Исследовать точку x = −1',
        detail: 'При x → −1 множитель (x − 1) → −2, а синус бесконечно часто колеблется от −1 до 1 (пределов слева и справа не существует):',
        latex: 'x = -1 \\text{ — точка разрыва II рода (осцилляция)}',
      },
    ],
    code: '',
    expectedOutput: 'x = 1 (устранимый разрыв I рода) и x = -1 (разрыв II рода)',
    answerLatex: 'x = 1 \\text{ — устранимый разрыв I рода } (\\lim = 0); \\quad x = -1 \\text{ — разрыв II рода}',
    slides: [
      {lectureId: 'matan_bilet_11', page: 1, label: 'Билет ФН-12 №11 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b11-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Билет 11 · №5 (6 б.)',
    title: 'Билет 11 · Разложение многочлена P(x) = x⁵ − 2x⁴ + x³ − x² + 2x − 1 по степеням x − 1',
    chapter: CH_MVT,
    problemStatement: 'С помощью формулы Тейлора разложить многочлен P(x) = x⁵ − 2x⁴ + x³ − x² + 2x − 1 по степеням x − 1.',
    problemTextClean: 'Разложить многочлен по формуле Тейлора по степеням (x − 1) (Билет ФН-12 №11, зад. 5):',
    problemLatex: 'P(x) = x^5 - 2x^4 + x^3 - x^2 + 2x - 1, \\qquad x_0 = 1',
    algorithmSummary:
      'Вычислить значения P и его производных в x₀ = 1 (или заметить группировку P(x) = x³(x−1)² − (x−1)² = (x³−1)(x−1)²): P(1)=0, P′(1)=0, P″(1)=0, P‴(1)/6 = 3, P⁽⁴⁾(1)/24 = 3, P⁽⁵⁾(1)/120 = 1 ⇒ P(x) = 3(x−1)³ + 3(x−1)⁴ + (x−1)⁵.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вычислить производные P⁽ᵏ⁾(1) или сделать замену t = x − 1',
        detail: 'Заметим, что P(x) = (x³ − 1)(x − 1)². Подставим x = 1 + t, где t = x − 1:',
        latex: 'P(1 + t) = \\bigl((1 + t)^3 - 1\\bigr)t^2 = (3t + 3t^2 + t^3)t^2 = 3t^3 + 3t^4 + t^5',
      },
      {
        title: 'Шаг 2 · Записать итоговое разложение Тейлора',
        detail: 'Возвращаемся к переменной x − 1:',
        latex: 'P(x) = 3(x - 1)^3 + 3(x - 1)^4 + (x - 1)^5',
      },
    ],
    code: '',
    expectedOutput: '3(x-1)^3 + 3(x-1)^4 + (x-1)^5',
    answerLatex: 'P(x) = 3(x - 1)^3 + 3(x - 1)^4 + (x - 1)^5',
    slides: [
      {lectureId: 'matan_bilet_11', page: 1, label: 'Билет ФН-12 №11 (20-08) · Зад. 5', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b11-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Билет 11 · №6 (5 б.)',
    title: 'Билет 11 · Точки перегиба и области выпуклости f(x) = (x³ − 3x) / (x² − 1)',
    chapter: CH_STUDY,
    problemStatement: 'Найти точки перегиба и области выпуклости графика функции f(x) = (x³ − 3x) / (x² − 1).',
    problemTextClean: 'Найти точки перегиба и области выпуклости функции (Билет ФН-12 №11, зад. 6):',
    problemLatex: 'f(x) = \\frac{x^3 - 3x}{x^2 - 1}',
    algorithmSummary:
      'Выделим целую часть: f(x) = x − 2x/(x² − 1). Тогда f″(x) = 4x(x² + 3)/(x² − 1)³. Знак f″ меняется в точке x = 0 (перегиб (0; 0)) и в точках разрыва x = ±1.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить целую часть и найти f′(x), f″(x)',
        detail: 'Представим дробь в виде f(x) = x − 2x/(x² − 1), что радикально упрощает дифференцирование:',
        latex: "f'(x) = 1 + \\frac{2(x^2 + 1)}{(x^2 - 1)^2}, \\qquad f''(x) = -\\frac{4x(x^2 + 3)}{(x^2 - 1)^3}",
      },
      {
        title: 'Шаг 2 · Найти интервалы выпуклости и точку перегиба',
        detail: 'Единственный корень f″(x) = 0 в области определения D(f) = R \\ {±1} — это x = 0 (точки x = ±1 — вертикальные асимптоты):',
        latex: '\\text{Вверх } (f\'\'<0): (-1;0),\\,(1;+\\infty); \\quad \\text{вниз } (f\'\'>0): (-\\infty;-1),\\,(0;1); \\quad \\text{перегиб: } (0;\\,0)',
      },
    ],
    code: '',
    expectedOutput: 'x = 0 (точка перегиба (0, 0))',
    answerLatex: '\\text{Перегиб: } (0;0); \\; \\text{вниз: } (-\\infty;-1),\\,(0;1); \\; \\text{вверх: } (-1;0),\\,(1;+\\infty)',
    slides: [
      {lectureId: 'matan_bilet_11', page: 1, label: 'Билет ФН-12 №11 (20-08) · Зад. 6', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №12 (20-08) ========================
  {
    id: 'matan-b12-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 12 · №2 (5 б.)',
    title: 'Билет 12 · Предел ((1 + x)(1 + 2x)(1 + 3x) − 1) / x при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→0} ((1 + x)(1 + 2x)(1 + 3x) − 1) / x',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №12, зад. 2):',
    problemLatex: '\\lim_{x \\to 0} \\frac{(1 + x)(1 + 2x)(1 + 3x) - 1}{x}',
    algorithmSummary:
      'Раскрыть скобки до линейного члена по x: (1 + x)(1 + 2x)(1 + 3x) = 1 + (1 + 2 + 3)x + o(x) = 1 + 6x + o(x) ⇒ предел равен 6.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить линейную часть произведения в числителе',
        detail: 'При перемножении скобок свободный член равен 1, а коэффициент при x равен сумме коэффициентов 1 + 2 + 3 = 6:',
        latex: '(1 + x)(1 + 2x)(1 + 3x) - 1 = 6x + 11x^2 + 6x^3',
      },
      {
        title: 'Шаг 2 · Разделить на x и перейти к пределу',
        detail: 'Сокращаем на x и подставляем x = 0:',
        latex: '\\lim_{x \\to 0} (6 + 11x + 6x^2) = 6',
      },
    ],
    code: '',
    expectedOutput: '6',
    answerLatex: '6',
    slides: [
      {lectureId: 'matan_bilet_12', page: 1, label: 'Билет ФН-12 №12 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b12-3',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'Билет 12 · №3 (5 б.)',
    title: 'Билет 12 · Сравнение б.м. α(x) = arctg x / (1 + x²) и β(x) = 1/x² при x → +∞',
    chapter: CH_LIM,
    problemStatement: 'Показать, что функции α(x) = arctg x / (1 + x²) и β(x) = 1/x² являются б.м. при x → +∞. Выделить их главные части и сравнить.',
    problemTextClean: 'Выделить главные части б.м. при x → +∞ и сравнить их (Билет ФН-12 №12, зад. 3):',
    problemLatex: '\\alpha(x) = \\frac{\\operatorname{arctg} x}{1 + x^2}, \\qquad \\beta(x) = \\frac{1}{x^2} \\quad (x \\to +\\infty)',
    algorithmSummary:
      'При x → +∞ имеем arctg x → π/2, а 1 + x² ~ x² ⇒ главная часть α(x) равна (π/2)·(1/x²). Отношение α(x)/β(x) → π/2 ≠ 0 ⇒ функции одного порядка малости!',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить главную часть α(x) при x → +∞',
        detail: 'Так как lim_{x→+∞} arctg x = π/2 и 1 + x² ~ x²:',
        latex: '\\alpha(x) = \\frac{\\operatorname{arctg} x}{1 + x^2} \\sim \\frac{\\pi}{2x^2} \\quad (x \\to +\\infty)',
      },
      {
        title: 'Шаг 2 · Сравнить с β(x) = 1/x²',
        detail: 'Предел отношения конечен и отличен от нуля:',
        latex: '\\lim_{x \\to +\\infty} \\frac{\\alpha(x)}{\\beta(x)} = \\frac{\\pi}{2} \\implies \\alpha(x) \\text{ и } \\beta(x) \\text{ — б.м. одного порядка малости}',
      },
    ],
    code: '',
    expectedOutput: 'одного порядка малости, главная часть pi/(2x^2), предел отношения pi/2',
    answerLatex: '\\alpha(x) \\sim \\frac{\\pi}{2x^2}, \\quad \\lim_{x\\to+\\infty}\\frac{\\alpha(x)}{\\beta(x)} = \\frac{\\pi}{2} \\text{ (одного порядка)}',
    slides: [
      {lectureId: 'matan_bilet_12', page: 1, label: 'Билет ФН-12 №12 (20-08) · Зад. 3', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b12-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 12 · №4 (5 б.)',
    title: 'Билет 12 · Точки разрыва функции f(x) = (2^(1/x) − 1) / (2^(1/(x + 1)) + 1)',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = (2^(1/x) − 1) / (2^(1/(x + 1)) + 1) и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №12, зад. 4):',
    problemLatex: 'f(x) = \\frac{2^{1/x} - 1}{2^{1/(x + 1)} + 1}',
    algorithmSummary:
      'В точке x = 0: при x → +0 числитель 2^(+∞) − 1 → +∞ ⇒ разрыв II рода. В точке x = −1: числитель стремится к 2^(−1) − 1 = −1/2, а знаменатель при x → −1−0 стремится к 0+1=1 (f(−1−0) = −1/2), при x → −1+0 стремится к +∞ (f(−1+0) = 0) ⇒ x = −1 — разрыв I рода (скачок 1/2).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Исследовать точку x = 0',
        detail: 'При x → −0 имеем 2^(1/x) → 0 ⇒ f(−0) = −1/3. При x → +0 имеем 2^(1/x) → +∞ ⇒ f(+0) = +∞:',
        latex: 'x = 0 \\text{ — точка разрыва II рода } (f(+0) = +\\infty)',
      },
      {
        title: 'Шаг 2 · Исследовать точку x = −1',
        detail: 'Числитель в точке x = −1 равен 2^(−1) − 1 = −1/2. В знаменателе при x → −1 − 0 имеем 2^(−∞) + 1 = 1, а при x → −1 + 0 имеем 2^(+∞) + 1 = +∞:',
        latex: 'f(-1 - 0) = -\\frac{1}{2}, \\quad f(-1 + 0) = 0 \\implies x = -1 \\text{ — точка разрыва I рода (скачок } \\frac{1}{2}\\text{)}',
      },
    ],
    code: '',
    expectedOutput: 'x = -1 (разрыв I рода, скачок 1/2) и x = 0 (разрыв II рода)',
    answerLatex: 'x = -1 \\text{ — разрыв I рода (скачок)}; \\quad x = 0 \\text{ — разрыв II рода}',
    slides: [
      {lectureId: 'matan_bilet_12', page: 1, label: 'Билет ФН-12 №12 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b12-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Билет 12 · №5 (6 б.)',
    title: 'Билет 12 · Разложение f(x) = e^(1 − x²) по формуле Маклорена (3 ненулевых члена)',
    chapter: CH_MVT,
    problemStatement: 'Представить функцию f(x) = e^(1 − x²) по формуле Маклорена с остаточным членом в форме Пеано, ограничившись тремя первыми ненулевыми членами.',
    problemTextClean: 'Разложить функцию по формуле Маклорена до 3 ненулевых членов (Билет ФН-12 №12, зад. 5):',
    problemLatex: 'f(x) = e^{1 - x^2} = e \\cdot e^{-x^2}',
    algorithmSummary:
      'Вынести множитель e и подставить t = −x² в стандартное разложение e^t = 1 + t + t²/2! + o(t²): получаем e − e x² + (e/2) x⁴ + o(x⁴).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Использовать табличное разложение экспоненты',
        detail: 'Представим f(x) = e · e^(−x²) и подставим u = −x² в e^u = 1 + u + u²/2 + o(u²):',
        latex: 'f(x) = e\\left(1 - x^2 + \\frac{(-x^2)^2}{2!} + o(x^4)\\right) = e - e x^2 + \\frac{e}{2}x^4 + o(x^4)',
      },
    ],
    code: '',
    expectedOutput: 'e - e*x^2 + (e/2)*x^4 + o(x^4)',
    answerLatex: 'e^{1 - x^2} = e - ex^2 + \\frac{e}{2}x^4 + o(x^4)',
    slides: [
      {lectureId: 'matan_bilet_12', page: 1, label: 'Билет ФН-12 №12 (20-08) · Зад. 5', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b12-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Билет 12 · №6 (5 б.)',
    title: 'Билет 12 · Выпуклость и точка перегиба f(x) = (2x + 3)e^(−2(x + 1))',
    chapter: CH_STUDY,
    problemStatement: 'Определить интервалы выпуклости вверх, вниз, точки перегиба графика функции f(x) = (2x + 3)e^(−2(x + 1)).',
    problemTextClean: 'Найти интервалы выпуклости и точки перегиба функции (Билет ФН-12 №12, зад. 6):',
    problemLatex: 'f(x) = (2x + 3)e^{-2(x + 1)}',
    algorithmSummary:
      'f′(x) = −4(x + 1)e^(−2(x+1)), f″(x) = 4(2x + 1)e^(−2(x+1)). Приравняв f″(x) = 0, получаем единственную точку перегиба x = −1/2, f(−1/2) = 2/e.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вычислить первую и вторую производные',
        detail: 'По правилу дифференцирования произведения:',
        latex: "f'(x) = (2 - 4x - 6)e^{-2(x+1)} = -4(x + 1)e^{-2(x+1)}, \\qquad f''(x) = 4(2x + 1)e^{-2(x+1)}",
      },
      {
        title: 'Шаг 2 · Найти интервалы выпуклости и точку перегиба',
        detail: 'Так как экспонента всегда > 0, знак f″(x) совпадает со знаком (2x + 1):',
        latex: '\\text{Вверх } (f\'\'<0): (-\\infty; -\\tfrac{1}{2}); \\quad \\text{вниз } (f\'\'>0): (-\\tfrac{1}{2}; +\\infty); \\quad \\text{перегиб: } \\left(-\\frac{1}{2};\\, \\frac{2}{e}\\right)',
      },
    ],
    code: '',
    expectedOutput: 'x = -1/2 (точка перегиба (-1/2, 2/e))',
    answerLatex: 'x_{\\text{пер}} = -\\frac{1}{2}\\;\\left(y = \\frac{2}{e}\\right); \\quad \\text{вверх: } (-\\infty;-\\tfrac{1}{2}), \\; \\text{вниз: } (-\\tfrac{1}{2};+\\infty)',
    slides: [
      {lectureId: 'matan_bilet_12', page: 1, label: 'Билет ФН-12 №12 (20-08) · Зад. 6', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №13 (20-08) ========================
  {
    id: 'matan-b13-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 13 · №2 (5 б.)',
    title: 'Билет 13 · Предел (arcsin x⁴ + 3 ln(1 + e^x sin x)) / (x + cos x − 1) при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→0} (arcsin x⁴ + 3 ln(1 + e^x sin x)) / (x + cos x − 1)',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №13, зад. 2):',
    problemLatex: '\\lim_{x \\to 0} \\frac{\\arcsin x^4 + 3\\ln(1 + e^x\\sin x)}{x + \\cos x - 1}',
    algorithmSummary:
      'Выделить главные части числителя и знаменателя при x → 0: в числителе 3 ln(1 + e^x sin x) ~ 3x (а arcsin x⁴ ~ x⁴ = o(x)), в знаменателе x + (cos x − 1) = x − x²/2 + o(x²) ~ x ⇒ предел равен 3x / x = 3.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить главную часть числителя и знаменателя при x → 0',
        detail: 'Так как e^x sin x ~ x, имеем 3 ln(1 + e^x sin x) ~ 3x, а слагаемое arcsin x⁴ ~ x⁴ = o(x). В знаменателе cos x − 1 ~ −x²/2 = o(x), поэтому знаменатель эквивалентен x:',
        latex: '\\lim_{x \\to 0} \\frac{3x + o(x)}{x - \\frac{x^2}{2} + o(x^2)} = \\lim_{x \\to 0} \\frac{3x}{x} = 3',
      },
    ],
    code: '',
    expectedOutput: '3',
    answerLatex: '3',
    slides: [
      {lectureId: 'matan_bilet_13', page: 1, label: 'Билет ФН-12 №13 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b13-3',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'Билет 13 · №3 (5 б.)',
    title: 'Билет 13 · Главные части б.б. f(x) = (x³ + 2x sin x)/x² и g(x) = (3x² + x − 1)/√(x + 2) при x → +∞',
    chapter: CH_LIM,
    problemStatement: 'Показать, что функции f(x) = (x³ + 2x sin x)/x² и g(x) = (3x² + x − 1)/√(x + 2) являются б.б. при x → +∞. Записать их главные части и сравнить.',
    problemTextClean: 'Выделить главные части б.б. при x → +∞ и сравнить их (Билет ФН-12 №13, зад. 3):',
    problemLatex: 'f(x) = \\frac{x^3 + 2x\\sin x}{x^2}, \\qquad g(x) = \\frac{3x^2 + x - 1}{\\sqrt{x + 2}} \\quad (x \\to +\\infty)',
    algorithmSummary:
      'При x → +∞: f(x) = x + (2 sin x)/x ~ x (порядок роста k₁ = 1), а g(x) ~ 3x² / √x = 3 x^(3/2) (порядок роста k₂ = 3/2). Следовательно, g(x) растёт быстрее f(x) (g — б.б. более высокого порядка роста).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Главная часть f(x) и g(x) при x → +∞',
        detail: 'Для f(x) слагаемое (2 sin x)/x → 0, поэтому f(x) ~ x. Для g(x) числитель ~ 3x², знаменатель ~ x^(1/2):',
        latex: 'f(x) \\sim x \\; (k_1 = 1), \\qquad g(x) \\sim 3x^{3/2} \\; (k_2 = \\tfrac{3}{2})',
      },
      {
        title: 'Шаг 2 · Сравнение порядков роста',
        detail: 'Так как 3/2 > 1, функция g(x) является бесконечно большой более высокого порядка роста, чем f(x).',
      },
    ],
    code: '',
    expectedOutput: 'f(x) ~ x (порядок 1), g(x) ~ 3x^(3/2) (порядок 3/2, g растет быстрее)',
    answerLatex: 'f(x) \\sim x,\\; g(x) \\sim 3x^{3/2} \\;\\;\\bigl(g(x) \\text{ — б.б. более высокого порядка роста}\\bigr)',
    slides: [
      {lectureId: 'matan_bilet_13', page: 1, label: 'Билет ФН-12 №13 (20-08) · Зад. 3', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b13-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 13 · №4 (5 б.)',
    title: 'Билет 13 · Точки разрыва кусочной функции sin(1/x) (x ≤ 1) и cos x (x > 1)',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = {sin(1/x) при x ≤ 1; cos x при x > 1} и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №13, зад. 4):',
    problemLatex: 'f(x) = \\begin{cases} \\sin\\dfrac{1}{x}, & x \\le 1; \\\\ \\cos x, & x > 1. \\end{cases}',
    algorithmSummary:
      'Две точки разрыва: 1) x = 0 (входит в область x ≤ 1: sin(1/x) бесконечно осциллирует при x → 0 ⇒ разрыв II рода); 2) стык x = 1 (слева sin 1, справа cos 1, причём sin 1 ≠ cos 1 ⇒ разрыв I рода со скачком cos 1 − sin 1).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Исследовать точку x = 0',
        detail: 'При x → 0 аргумент 1/x → ±∞, и sin(1/x) колеблется между −1 и 1 без предела ⇒ x = 0 — точка разрыва II рода.',
      },
      {
        title: 'Шаг 2 · Исследовать точку склейки x = 1',
        detail: 'Вычисляем односторонние пределы в точке x = 1:',
        latex: 'f(1 - 0) = \\sin 1 \\approx 0{,}841, \\quad f(1 + 0) = \\cos 1 \\approx 0{,}540 \\implies x = 1 \\text{ — разрыв I рода (скачок } \\cos 1 - \\sin 1\\text{)}',
      },
    ],
    code: '',
    expectedOutput: 'x = 0 (разрыв II рода) и x = 1 (разрыв I рода, скачок cos 1 - sin 1)',
    answerLatex: 'x = 0 \\text{ — разрыв II рода}; \\quad x = 1 \\text{ — разрыв I рода (скачок } \\cos 1 - \\sin 1\\text{)}',
    slides: [
      {lectureId: 'matan_bilet_13', page: 1, label: 'Билет ФН-12 №13 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b13-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Билет 13 · №5 (6 б.)',
    title: 'Билет 13 · Формула Тейлора для y = (x³ − 8)² в точке x₀ = 2 (2 ненулевых слагаемых)',
    chapter: CH_MVT,
    problemStatement: 'Записать первые два ненулевых слагаемых формулы Тейлора для функции y = (x³ − 8)² в точке x₀ = 2 с остаточным членом в форме Пеано.',
    problemTextClean: 'Записать первые два ненулевых слагаемых формулы Тейлора в точке x₀ = 2 (Билет ФН-12 №13, зад. 5):',
    problemLatex: 'y = (x^3 - 8)^2, \\qquad x_0 = 2',
    algorithmSummary:
      'Сделать замену t = x − 2: тогда x³ − 8 = (2 + t)³ − 8 = 12t + 6t² + t³. Возводим в квадрат и оставляем два младших члена: (12t + 6t² + t³)² = 144t² + 144t³ + o(t³) = 144(x − 2)² + 144(x − 2)³ + o((x − 2)³).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Разложить внутреннюю скобку x³ − 8 по степеням t = x − 2',
        detail: 'Подставляем x = 2 + t:',
        latex: 'x^3 - 8 = (2 + t)^3 - 8 = 12t + 6t^2 + t^3',
      },
      {
        title: 'Шаг 2 · Возвести в квадрат и выделить два первых ненулевых члена',
        detail: 'Возводим в квадрат и удерживаем степени t² и t³:',
        latex: 'y = (12t + 6t^2 + t^3)^2 = 144(x - 2)^2 + 144(x - 2)^3 + o\\bigl((x - 2)^3\\bigr)',
      },
    ],
    code: '',
    expectedOutput: '144(x-2)^2 + 144(x-2)^3 + o((x-2)^3)',
    answerLatex: 'y = 144(x - 2)^2 + 144(x - 2)^3 + o\\bigl((x - 2)^3\\bigr)',
    slides: [
      {lectureId: 'matan_bilet_13', page: 1, label: 'Билет ФН-12 №13 (20-08) · Зад. 5', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b13-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Билет 13 · №6 (5 б.)',
    title: 'Билет 13 · Асимптоты, выпуклость и перегибы функции f(x) = x + 2 arctg x',
    chapter: CH_STUDY,
    problemStatement: 'Найти асимптоты и интервалы выпуклости вверх, вниз и точки перегиба графика функции f(x) = x + 2 arctg x.',
    problemTextClean: 'Найти асимптоты, интервалы выпуклости и точки перегиба (Билет ФН-12 №13, зад. 6):',
    problemLatex: 'f(x) = x + 2\\operatorname{arctg} x',
    algorithmSummary:
      'f″(x) = −4x / (1 + x²)² ⇒ единственная точка перегиба x = 0, y = 0; на (−∞, 0) выпукла вниз, на (0, +∞) выпукла вверх. Две наклонные асимптоты: y = x + π при x → +∞ и y = x − π при x → −∞.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти наклонные асимптоты при x → ±∞',
        detail: 'Так как f(x) − x = 2 arctg x → ±π при x → ±∞, график имеет две разные наклонные асимптоты:',
        latex: 'y = x + \\pi \\; (x \\to +\\infty), \\qquad y = x - \\pi \\; (x \\to -\\infty)',
      },
      {
        title: 'Шаг 2 · Найти вторую производную и точку перегиба',
        detail: 'f′(x) = 1 + 2/(1 + x²), откуда f″(x) = −4x / (1 + x²)²:',
        latex: '\\text{Вниз } (f\'\'>0): (-\\infty; 0); \\quad \\text{вверх } (f\'\'<0): (0; +\\infty); \\quad \\text{перегиб: } (0;\\, 0)',
      },
    ],
    code: '',
    expectedOutput: 'перегиб (0, 0); асимптоты y = x + pi и y = x - pi',
    answerLatex: '\\text{Перегиб: } (0;0); \\quad \\text{асимптоты: } y = x \\pm \\pi',
    slides: [
      {lectureId: 'matan_bilet_13', page: 1, label: 'Билет ФН-12 №13 (20-08) · Зад. 6', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №14 (20-08) ========================
  {
    id: 'matan-b14-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 14 · №2 (5 б.)',
    title: 'Билет 14 · Показательно-степенной предел (sin x / x)^(sin x / (x − sin x)) при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→0} (sin x / x)^(sin x / (x − sin x))',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №14, зад. 2):',
    problemLatex: '\\lim_{x \\to 0} \\left(\\frac{\\sin x}{x}\\right)^{\\frac{\\sin x}{x - \\sin x}}',
    algorithmSummary:
      'Неопределённость [1^∞]. При x → 0 имеем sin x = x − x³/6 + o(x³), поэтому (sin x / x) − 1 ~ −x²/6, а показатель sin x / (x − sin x) ~ x / (x³/6) = 6/x² ⇒ произведение равно (−x²/6)·(6/x²) = −1 ⇒ ответ e^(−1) = 1/e.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Разложить sin x по Тейлору до x³',
        detail: 'В разности x − sin x первые члены x сокращаются, поэтому нужна формула Тейлора sin x = x − x³/6 + o(x³):',
        latex: '\\frac{\\sin x}{x} - 1 = \\frac{\\sin x - x}{x} \\sim -\\frac{x^2}{6}',
      },
      {
        title: 'Шаг 2 · Применить второй замечательный предел',
        detail: 'Перемножаем бесконечно малую добавку основания и показатель степени:',
        latex: 'A = \\lim_{x \\to 0} \\left(\\frac{\\sin x - x}{x} \\cdot \\frac{\\sin x}{x - \\sin x}\\right) = -\\lim_{x \\to 0} \\frac{\\sin x}{x} = -1 \\implies \\text{Ответ: } e^{-1} = \\frac{1}{e}',
      },
    ],
    code: '',
    expectedOutput: '1/e',
    answerLatex: 'e^{-1} = \\frac{1}{e}',
    slides: [
      {lectureId: 'matan_bilet_14', page: 1, label: 'Билет ФН-12 №14 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b14-3',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'Билет 14 · №3 (5 б.)',
    title: 'Билет 14 · Главные части б.м. α(x) = e^(x²) − 1 и β(x) = √(1 + sin x²) − 1 при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Показать, что функции α(x) = e^(x²) − 1 и β(x) = √(1 + sin x²) − 1 являются б.м. при x → 0. Выделить их главные части и сравнить.',
    problemTextClean: 'Выделить главные части б.м. при x → 0 и сравнить их (Билет ФН-12 №14, зад. 3):',
    problemLatex: '\\alpha(x) = e^{x^2} - 1, \\qquad \\beta(x) = \\sqrt{1 + \\sin x^2} - 1 \\quad (x \\to 0)',
    algorithmSummary:
      'При x → 0: главная часть α(x) равна x², а главная часть β(x) ~ (1/2) sin(x²) ~ (1/2)x². Обе функции имеют 2-й порядок малости и являются б.м. одного порядка (lim α/β = 2).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить главные части α(x) и β(x)',
        detail: 'По таблице эквивалентностей при u = x² → 0:',
        latex: '\\alpha(x) = e^{x^2} - 1 \\sim x^2, \\qquad \\beta(x) = \\sqrt{1 + \\sin x^2} - 1 \\sim \\frac{1}{2}\\sin x^2 \\sim \\frac{1}{2}x^2',
      },
      {
        title: 'Шаг 2 · Сравнить функции',
        detail: 'Предел отношения равен 2 ≠ 0 ⇒ функции одного порядка малости (2-го порядка относительно x).',
      },
    ],
    code: '',
    expectedOutput: 'одного порядка малости, главные части x^2 и (1/2)x^2, отношение 2',
    answerLatex: '\\alpha(x) \\sim x^2,\\; \\beta(x) \\sim \\frac{1}{2}x^2 \\implies \\lim_{x\\to 0}\\frac{\\alpha}{\\beta} = 2 \\text{ (одного порядка)}',
    slides: [
      {lectureId: 'matan_bilet_14', page: 1, label: 'Билет ФН-12 №14 (20-08) · Зад. 3', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b14-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 14 · №4 (5 б.)',
    title: 'Билет 14 · Точки разрыва f(x) = arctg(1/x + 1/(x − 1) + 1/(x − 2))',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = arctg(1/x + 1/(x − 1) + 1/(x − 2)) и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №14, зад. 4):',
    problemLatex: 'f(x) = \\operatorname{arctg}\\left(\\frac{1}{x} + \\frac{1}{x - 1} + \\frac{1}{x - 2}\\right)',
    algorithmSummary:
      'В каждой из трёх точек x = 0, x = 1, x = 2 соответствующее слагаемое 1/(x − x_k) стремится к −∞ слева и к +∞ справа. Так как arctg(±∞) = ±π/2 конечен, все три точки x = 0, 1, 2 являются точками разрыва I рода со скачком π!',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти особые точки аргумента арктангенса',
        detail: 'Аргумент не определён в трёх точках: x₁ = 0, x₂ = 1, x₃ = 2.',
      },
      {
        title: 'Шаг 2 · Вычислить односторонние пределы в каждой точке x_k ∈ {0, 1, 2}',
        detail: 'При x → x_k − 0 доминирующее слагаемое 1/(x − x_k) → −∞, поэтому f(x_k − 0) = −π/2. При x → x_k + 0 имеем 1/(x − x_k) → +∞, поэтому f(x_k + 0) = +π/2:',
        latex: 'x \\in \\{0,\\, 1,\\, 2\\}: \\quad f(x_k - 0) = -\\frac{\\pi}{2}, \\; f(x_k + 0) = +\\frac{\\pi}{2} \\implies \\text{три точки разрыва I рода (скачок } \\pi\\text{)}',
      },
    ],
    code: '',
    expectedOutput: 'x = 0, x = 1, x = 2 (все три — точки разрыва I рода со скачком pi)',
    answerLatex: 'x_1 = 0,\\; x_2 = 1,\\; x_3 = 2 \\text{ — точки разрыва I рода (скачок } \\pi\\text{)}',
    slides: [
      {lectureId: 'matan_bilet_14', page: 1, label: 'Билет ФН-12 №14 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b14-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Билет 14 · №5 (6 б.)',
    title: 'Билет 14 · Касательная и нормаль к окружности x = a cos t, y = a sin t в точке A(a√2/2; a√2/2)',
    chapter: CH_MVT,
    problemStatement: 'Написать уравнения касательной и нормали к кривой x = a cos t, y = a sin t в точке A(a√2/2; a√2/2).',
    problemTextClean: 'Написать уравнения касательной и нормали к параметрической кривой (Билет ФН-12 №14, зад. 5):',
    problemLatex: 'x = a\\cos t,\\; y = a\\sin t \\quad \\text{в точке } A\\left(\\frac{a\\sqrt{2}}{2};\\, \\frac{a\\sqrt{2}}{2}\\right)',
    algorithmSummary:
      'Точке A отвечает угол t₀ = π/4. Производная y′_x = −ctg t₀ = −1 ⇒ касательная имеет вид x + y = a√2, а нормаль проходит через начало координат: y = x.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти параметр t₀ и производную y′_x(t₀)',
        detail: 'В точке A имеем cos t₀ = sin t₀ = √2/2 ⇒ t₀ = π/4. Вычисляем производную:',
        latex: "y'_x = \\frac{y'_t}{x'_t} = \\frac{a\\cos t}{-a\\sin t} = -\\operatorname{ctg}\\frac{\\pi}{4} = -1",
      },
      {
        title: 'Шаг 2 · Записать уравнения касательной и нормали',
        detail: 'Для касательной k = −1, для нормали k_н = +1:',
        latex: '\\text{Касательная: } x + y = a\\sqrt{2}; \\qquad \\text{Нормаль: } y = x',
      },
    ],
    code: '',
    expectedOutput: 'касательная x + y = a*sqrt(2), нормаль y = x',
    answerLatex: '\\text{Касательная: } y = -x + a\\sqrt{2}; \\qquad \\text{Нормаль: } y = x',
    slides: [
      {lectureId: 'matan_bilet_14', page: 1, label: 'Билет ФН-12 №14 (20-08) · Зад. 5', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b14-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Билет 14 · №6 (5 б.)',
    title: 'Билет 14 · Асимптоты и точки экстремума функции f(x) = x√(1 − x²)',
    chapter: CH_STUDY,
    problemStatement: 'Найти асимптоты и точки экстремума функции f(x) = x√(1 − x²). Построить график.',
    problemTextClean: 'Найти асимптоты и точки экстремума функции (Билет ФН-12 №14, зад. 6):',
    problemLatex: 'f(x) = x\\sqrt{1 - x^2}',
    algorithmSummary:
      'Область определения D(f) = [−1; 1] компактна и функция непрерывна на ней ⇒ асимптот нет! Производная f′(x) = (1 − 2x²) / √(1 − x²) = 0 даёт x_min = −√2/2 (y = −1/2) и x_max = √2/2 (y = 1/2).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Проверить асимптоты',
        detail: 'Функция определена и непрерывна только на конечном отрезке [−1; 1], поэтому ни вертикальных, ни наклонных асимптот нет.',
      },
      {
        title: 'Шаг 2 · Найти производную и точки экстремума',
        detail: 'Дифференцируем на интервале (−1; 1):',
        latex: "f'(x) = \\sqrt{1 - x^2} - \\frac{x^2}{\\sqrt{1 - x^2}} = \\frac{1 - 2x^2}{\\sqrt{1 - x^2}} = 0 \\implies x = \\pm\\frac{\\sqrt{2}}{2}",
      },
      {
        title: 'Шаг 3 · Вычислить значения в точках экстремума',
        detail: 'На (−1, −√2/2) f′ < 0; на (−√2/2, √2/2) f′ > 0; на (√2/2, 1) f′ < 0:',
        latex: 'x_{\\min} = -\\frac{\\sqrt{2}}{2},\\; f(x_{\\min}) = -\\frac{1}{2}; \\qquad x_{\\max} = \\frac{\\sqrt{2}}{2},\\; f(x_{\\max}) = \\frac{1}{2}',
      },
    ],
    code: '',
    expectedOutput: 'x_min = -sqrt(2)/2 (y = -1/2), x_max = sqrt(2)/2 (y = 1/2); асимптот нет',
    answerLatex: 'x_{\\min} = -\\frac{\\sqrt{2}}{2}\\;(y=-\\tfrac{1}{2}), \\quad x_{\\max} = \\frac{\\sqrt{2}}{2}\\;(y=\\tfrac{1}{2}); \\quad \\text{асимптот нет}',
    slides: [
      {lectureId: 'matan_bilet_14', page: 1, label: 'Билет ФН-12 №14 (20-08) · Зад. 6', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №15 (20-08) ========================
  {
    id: 'matan-b15-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 15 · №2 (5 б.)',
    title: 'Билет 15 · Предел (sin √(x + 1) − sin √x) при x → +∞',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→+∞} (sin √(x + 1) − sin √x)',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №15, зад. 2):',
    problemLatex: '\\lim_{x \\to +\\infty} \\left(\\sin\\sqrt{x + 1} - \\sin\\sqrt{x}\\right)',
    algorithmSummary:
      'Разложить разность синусов в произведение: 2 sin((√(x+1) − √x)/2) · cos((√(x+1) + √x)/2). Первый множитель стремится к 2 sin 0 = 0 (б.м.), а косинус ограничен (|cos| ≤ 1) ⇒ по теореме о произведении б.м. на ограниченную предел равен 0!',
    explanationSteps: [
      {
        title: 'Шаг 1 · Применить формулу разности синусов',
        detail: 'Преобразуем разность в произведение и домножим полуразность корней на сопряжённое:',
        latex: '\\sin\\sqrt{x+1} - \\sin\\sqrt{x} = 2\\sin\\frac{1}{2(\\sqrt{x+1}+\\sqrt{x})} \\cdot \\cos\\frac{\\sqrt{x+1}+\\sqrt{x}}{2}',
      },
      {
        title: 'Шаг 2 · Применить теорему о произведении б.м. на ограниченную',
        detail: 'При x → +∞ аргумент синуса стремится к 0 ⇒ синус бесконечно мал, а |cos(...)| ≤ 1 ограничен:',
        latex: '\\lim_{x \\to +\\infty} \\left(\\sin\\sqrt{x + 1} - \\sin\\sqrt{x}\\right) = 0',
      },
    ],
    code: '',
    expectedOutput: '0',
    answerLatex: '0',
    slides: [
      {lectureId: 'matan_bilet_15', page: 1, label: 'Билет ФН-12 №15 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b15-3',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'Билет 15 · №3 (5 б.)',
    title: 'Билет 15 · Порядок роста б.б. f(x) = √((3 + x)/(3 − x)) и g(x) = 1/(2^x − 8) при x → 3⁻',
    chapter: CH_LIM,
    problemStatement: 'Показать, что функции f(x) = √((3+x)/(3−x)) и g(x) = 1/(2^x − 8) являются б.б. при x → 3⁻. Найти их порядки роста и сравнить.',
    problemTextClean: 'Найти порядки роста б.б. при x → 3⁻ и сравнить функции (Билет ФН-12 №15, зад. 3):',
    problemLatex: 'f(x) = \\sqrt{\\frac{3 + x}{3 - x}}, \\qquad g(x) = \\frac{1}{2^x - 8} \\quad (x \\to 3^-)',
    algorithmSummary:
      'Пусть t = 3 − x → +0 (эталон б.б. 1/t). Тогда f(x) ~ √6 · t^(−1/2) (порядок роста k₁ = 1/2), а 2^x − 8 = 8(2^(−t) − 1) ~ −8 ln 2 · t ⇒ g(x) ~ −1/(8 ln 2) · t^(−1) (порядок роста k₂ = 1). Функция g(x) растёт быстрее f(x).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить главную часть f(x) при t = 3 − x → +0',
        detail: 'Подставляем x → 3 в числитель (√6):',
        latex: 'f(x) \\sim \\frac{\\sqrt{6}}{(3 - x)^{1/2}} \\implies k_1 = \\frac{1}{2}',
      },
      {
        title: 'Шаг 2 · Выделить главную часть g(x) при x → 3⁻',
        detail: 'Выносим 8 = 2³ из знаменателя: 2^x − 8 = 8(2^(x−3) − 1) ~ 8 ln 2 · (x − 3):',
        latex: 'g(x) \\sim -\\frac{1}{8\\ln 2} \\cdot (3 - x)^{-1} \\implies k_2 = 1 \\; (g \\text{ выше порядком роста, чем } f)',
      },
    ],
    code: '',
    expectedOutput: 'k1 = 1/2, k2 = 1 (g растет быстрее f)',
    answerLatex: 'k_f = \\frac{1}{2}, \\quad k_g = 1 \\;\\;\\bigl(g(x) \\text{ — б.б. более высокого порядка роста}\\bigr)',
    slides: [
      {lectureId: 'matan_bilet_15', page: 1, label: 'Билет ФН-12 №15 (20-08) · Зад. 3', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b15-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 15 · №4 (5 б.)',
    title: 'Билет 15 · Точки разрыва функции f(x) = arctg((x + 1) / (x(x − 1)²))',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = arctg((x + 1) / (x(x² − 2x + 1))) и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №15, зад. 4):',
    problemLatex: 'f(x) = \\operatorname{arctg}\\frac{x + 1}{x(x^2 - 2x + 1)} = \\operatorname{arctg}\\frac{x + 1}{x(x - 1)^2}',
    algorithmSummary:
      'Две точки разрыва: 1) в точке x = 0 знак дроби меняется (при x → −0 имеем −∞, при x → +0 имеем +∞) ⇒ f(−0) = −π/2, f(+0) = +π/2 — разрыв I рода (скачок π); 2) в точке x = 1 квадрат (x − 1)² > 0 не меняет знак ⇒ и слева, и справа дробь стремится к +∞, поэтому f(1 − 0) = f(1 + 0) = +π/2 — УСТРАНИМЫЙ разрыв I рода!',
    explanationSteps: [
      {
        title: 'Шаг 1 · Исследовать точку x = 0',
        detail: 'При x → 0 числитель x + 1 → 1 > 0, квадрат (x − 1)² → 1 > 0, а множитель x меняет знак:',
        latex: 'f(0 - 0) = -\\frac{\\pi}{2}, \\quad f(0 + 0) = +\\frac{\\pi}{2} \\implies x = 0 \\text{ — разрыв I рода (скачок } \\pi\\text{)}',
      },
      {
        title: 'Шаг 2 · Исследовать точку x = 1 (любимая ловушка ФН-12!)',
        detail: 'В окрестности x = 1 имеем x + 1 → 2 > 0, x → 1 > 0 и (x − 1)² > 0 с ОБЕИХ сторон! Поэтому аргумент арктангенса стремится к +∞ и слева, и справа:',
        latex: 'f(1 - 0) = f(1 + 0) = +\\frac{\\pi}{2} \\implies x = 1 \\text{ — устранимый разрыв I рода!}',
      },
    ],
    code: '',
    expectedOutput: 'x = 0 (разрыв I рода со скачком pi) и x = 1 (устранимый разрыв I рода, предел pi/2)',
    answerLatex: 'x = 0 \\text{ — разрыв I рода (скачок } \\pi\\text{)}; \\quad x = 1 \\text{ — устранимый разрыв I рода } (\\lim = \\pi/2)',
    slides: [
      {lectureId: 'matan_bilet_15', page: 1, label: 'Билет ФН-12 №15 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b15-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Билет 15 · №5 (6 б.)',
    title: 'Билет 15 · Касательная к y = 3e^(x/2) − 2 в точке пересечения с осью Oy',
    chapter: CH_MVT,
    problemStatement: 'Составить уравнение касательной к графику функции y = 3e^(x/2) − 2 в точке пересечения графика с осью Oy.',
    problemTextClean: 'Составить уравнение касательной в точке пересечения с осью Oy (Билет ФН-12 №15, зад. 5):',
    problemLatex: 'y = 3e^{x/2} - 2, \\qquad x_0 = 0',
    algorithmSummary:
      'При x₀ = 0 имеем y(0) = 3 − 2 = 1 и y′(0) = (3/2)e⁰ = 3/2 ⇒ уравнение касательной y = (3/2)x + 1.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти точку пересечения с осью Oy и производную в ней',
        detail: 'Пересечение с Oy отвечает x₀ = 0: y₀ = 3e⁰ − 2 = 1. Производная y′(x) = (3/2)e^(x/2), значит y′(0) = 3/2:',
        latex: 'y - 1 = \\frac{3}{2}(x - 0) \\implies y = \\frac{3}{2}x + 1',
      },
    ],
    code: '',
    expectedOutput: 'y = 1.5x + 1',
    answerLatex: 'y = \\frac{3}{2}x + 1',
    slides: [
      {lectureId: 'matan_bilet_15', page: 1, label: 'Билет ФН-12 №15 (20-08) · Зад. 5', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №17 (20-08) ========================
  {
    id: 'matan-b17-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 17 · №2 (5 б.)',
    title: 'Билет 17 · Предел (1 − x) tg(πx/2) при x → 1',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→1} (1 − x) tg(πx/2)',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №17, зад. 2):',
    problemLatex: '\\lim_{x \\to 1} (1 - x)\\operatorname{tg}\\frac{\\pi x}{2}',
    algorithmSummary:
      'Замена t = 1 − x → 0 переводит tg(π(1−t)/2) в ctg(πt/2) = 1 / tg(πt/2) ~ 2 / (πt) ⇒ предел равен lim t · (2 / πt) = 2/π.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Сделать замену t = 1 − x → 0',
        detail: 'По формуле приведения tg(π/2 − πt/2) = ctg(πt/2):',
        latex: '\\lim_{t \\to 0} \\frac{t}{\\operatorname{tg}\\frac{\\pi t}{2}} = \\lim_{t \\to 0} \\frac{t}{\\pi t / 2} = \\frac{2}{\\pi}',
      },
    ],
    code: '',
    expectedOutput: '2/pi',
    answerLatex: '\\frac{2}{\\pi}',
    slides: [
      {lectureId: 'matan_bilet_17', page: 1, label: 'Билет ФН-12 №17 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b17-3',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'Билет 17 · №3 (5 б.)',
    title: 'Билет 17 · Порядок роста б.б. f(x) = ∛(x² − x) + √x при x → +∞',
    chapter: CH_LIM,
    problemStatement: 'Доказать, что функция f(x) = ∛(x² − x) + √x является б.б. при x → +∞. Найти порядок роста относительно h(x) = x.',
    problemTextClean: 'Найти порядок роста б.б. функции при x → +∞ (Билет ФН-12 №17, зад. 3):',
    problemLatex: 'f(x) = \\sqrt[3]{x^2 - x} + \\sqrt{x} \\quad (x \\to +\\infty)',
    algorithmSummary:
      'При x → +∞ первое слагаемое эквивалентно x^(2/3), второе равно x^(1/2). Доминирует старшая степень x^(2/3) ⇒ порядок роста равен k = 2/3.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить старшую степень при x → +∞',
        detail: 'Сравниваем показатели степеней 2/3 и 1/2: так как 2/3 > 1/2, при x → +∞ доминирует кубический корень:',
        latex: 'f(x) = x^{2/3}\\left(\\sqrt[3]{1 - \\frac{1}{x}} + x^{-1/6}\\right) \\sim x^{2/3} \\implies k = \\frac{2}{3}',
      },
    ],
    code: '',
    expectedOutput: '2/3',
    answerLatex: 'k = \\frac{2}{3} \\;\\;\\bigl(f(x) \\sim x^{2/3}\\bigr)',
    slides: [
      {lectureId: 'matan_bilet_17', page: 1, label: 'Билет ФН-12 №17 (20-08) · Зад. 3', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b17-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 17 · №4 (5 б.)',
    title: 'Билет 17 · Точки разрыва кусочно-заданной функции с порогами −π и π/2',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = {x при x ≤ −π; sin x при −π < x < π/2; 1 при x > π/2} и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №17, зад. 4):',
    problemLatex: 'f(x) = \\begin{cases} x, & x \\le -\\pi; \\\\ \\sin x, & -\\pi < x < \\dfrac{\\pi}{2}; \\\\ 1, & x > \\dfrac{\\pi}{2}. \\end{cases}',
    algorithmSummary:
      'В точке x = −π левый предел равен −π, правый sin(−π) = 0 ⇒ разрыв I рода (скачок π). В точке x = π/2 левый и правый пределы равны 1, НО сама функция при x = π/2 не задана (строгие неравенства < и >!) ⇒ x = π/2 — устранимый разрыв I рода!',
    explanationSteps: [
      {
        title: 'Шаг 1 · Проверить стык x = −π',
        detail: 'Вычисляем односторонние пределы:',
        latex: 'f(-\\pi - 0) = -\\pi, \\quad f(-\\pi + 0) = \\sin(-\\pi) = 0 \\implies x = -\\pi \\text{ — разрыв I рода (скачок } \\pi\\text{)}',
      },
      {
        title: 'Шаг 2 · Проверить стык x = π/2 (внимание на строгие знаки неравенств!)',
        detail: 'Пределы слева и справа совпадают: sin(π/2) = 1 и 1, однако значение f(π/2) в условии не определено:',
        latex: 'f(\\tfrac{\\pi}{2} - 0) = f(\\tfrac{\\pi}{2} + 0) = 1,\\; \\text{но } \\tfrac{\\pi}{2} \\notin D(f) \\implies x = \\frac{\\pi}{2} \\text{ — устранимый разрыв I рода}',
      },
    ],
    code: '',
    expectedOutput: 'x = -pi (разрыв I рода, скачок pi) и x = pi/2 (устранимый разрыв I рода)',
    answerLatex: 'x = -\\pi \\text{ — разрыв I рода (скачок } \\pi\\text{)}; \\quad x = \\frac{\\pi}{2} \\text{ — устранимый разрыв I рода}',
    slides: [
      {lectureId: 'matan_bilet_17', page: 1, label: 'Билет ФН-12 №17 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b17-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Билет 17 · №5 (6 б.)',
    title: 'Билет 17 · Формула Тейлора для ln x по степеням (x − 1) с остатком Лагранжа до (x − 1)²',
    chapter: CH_MVT,
    problemStatement: 'Для функции ln x записать формулу Тейлора по степеням x − 1 с остаточным членом в форме Лагранжа до слагаемого (x − 1)².',
    problemTextClean: 'Записать формулу Тейлора для ln x в точке x₀ = 1 с остатком Лагранжа (Билет ФН-12 №17, зад. 5):',
    problemLatex: 'f(x) = \\ln x, \\qquad x_0 = 1,\\; n = 2',
    algorithmSummary:
      'f(1) = 0, f′(1) = 1, f″(1) = −1, f‴(c) = 2/c³ ⇒ ln x = (x − 1) − (x − 1)²/2 + (x − 1)³ / (3c³), где c лежит между 1 и x.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вычислить производные до 3-го порядка',
        detail: 'f(x) = ln x ⇒ f′(x) = 1/x, f″(x) = −1/x², f‴(x) = 2/x³:',
        latex: 'f(1) = 0, \\quad f\'(1) = 1, \\quad f\'\'(1) = -1, \\quad R_2(x) = \\frac{f\'\'\'(c)}{3!}(x - 1)^3 = \\frac{(x - 1)^3}{3c^3}',
      },
      {
        title: 'Шаг 2 · Записать формулу Тейлора с остатком Лагранжа',
        detail: 'Собираем многочлен Тейлора 2-й степени и остаточный член:',
        latex: '\\ln x = (x - 1) - \\frac{(x - 1)^2}{2} + \\frac{(x - 1)^3}{3c^3}, \\quad c \\text{ между } 1 \\text{ и } x',
      },
    ],
    code: '',
    expectedOutput: '(x - 1) - (x - 1)^2 / 2 + (x - 1)^3 / (3c^3)',
    answerLatex: '\\ln x = (x - 1) - \\frac{(x - 1)^2}{2} + \\frac{(x - 1)^3}{3c^3}',
    slides: [
      {lectureId: 'matan_bilet_17', page: 1, label: 'Билет ФН-12 №17 (20-08) · Зад. 5', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b17-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Билет 17 · №6 (5 б.)',
    title: 'Билет 17 · Асимптоты, монотонность и экстремумы функции f(x) = x e^(−x/2)',
    chapter: CH_STUDY,
    problemStatement: 'Найти асимптоты, интервалы возрастания, убывания, точки экстремума функции f(x) = x e^(−x/2).',
    problemTextClean: 'Исследовать функцию на монотонность, экстремумы и асимптоты (Билет ФН-12 №17, зад. 6):',
    problemLatex: 'f(x) = x e^{-x/2}',
    algorithmSummary:
      'f′(x) = (1 − x/2)e^(−x/2) = 0 ⇒ единственная точка максимума x_max = 2, f(2) = 2/e. При x → +∞ имеем f(x) → 0 ⇒ горизонтальная правосторонняя асимптота y = 0.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти производную, интервалы монотонности и экстремум',
        detail: 'Вычисляем f′(x):',
        latex: "f'(x) = e^{-x/2}\\left(1 - \\frac{x}{2}\\right) = 0 \\implies x_{\\max} = 2,\\; f(2) = \\frac{2}{e}",
      },
      {
        title: 'Шаг 2 · Найти асимптоты',
        detail: 'При x → +∞ экспонента гасит x: lim_{x→+∞} x e^(−x/2) = 0 ⇒ горизонтальная асимптота y = 0 (при x → +∞). При x → −∞ асимптот нет.',
      },
    ],
    code: '',
    expectedOutput: 'x_max = 2 (y = 2/e); асимптота y = 0 при x -> +inf',
    answerLatex: 'x_{\\max} = 2\\;\\left(y = \\frac{2}{e}\\right); \\quad \\uparrow (-\\infty;2],\\; \\downarrow [2;+\\infty); \\quad \\text{асимптота } y = 0',
    slides: [
      {lectureId: 'matan_bilet_17', page: 1, label: 'Билет ФН-12 №17 (20-08) · Зад. 6', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №20 (20-08) ========================
  {
    id: 'matan-b20-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 20 · №2 (5 б.)',
    title: 'Билет 20 · Предел разности корней (√(x² + 7x + 6) − √(x² + 6x + 7)) при x → +∞',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→+∞} (√(x² + 7x + 6) − √(x² + 6x + 7))',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №20, зад. 2):',
    problemLatex: '\\lim_{x \\to +\\infty} \\left(\\sqrt{x^2 + 7x + 6} - \\sqrt{x^2 + 6x + 7}\\right)',
    algorithmSummary:
      'Умножить и разделить на сопряжённую сумму корней: в числителе останется x − 1, в знаменателе при x → +∞ сумма двух корней эквивалентна 2x ⇒ предел равен 1/2.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Домножить на сопряжённое выражение',
        detail: 'Раскрываем разность квадратов в числителе:',
        latex: '\\frac{(x^2 + 7x + 6) - (x^2 + 6x + 7)}{\\sqrt{x^2 + 7x + 6} + \\sqrt{x^2 + 6x + 7}} = \\frac{x - 1}{\\sqrt{x^2 + 7x + 6} + \\sqrt{x^2 + 6x + 7}}',
      },
      {
        title: 'Шаг 2 · Вынести x > 0 и перейти к пределу',
        detail: 'Делим числитель и знаменатель на x:',
        latex: '\\lim_{x \\to +\\infty} \\frac{1 - 1/x}{\\sqrt{1 + 7/x + 6/x^2} + \\sqrt{1 + 6/x + 7/x^2}} = \\frac{1}{1 + 1} = \\frac{1}{2}',
      },
    ],
    code: '',
    expectedOutput: '1/2',
    answerLatex: '\\frac{1}{2}',
    slides: [
      {lectureId: 'matan_bilet_20', page: 1, label: 'Билет ФН-12 №20 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b20-3',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'Билет 20 · №3 (5 б.)',
    title: 'Билет 20 · Порядок малости f(x) = x² cos x − sin(x²) при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Доказать, что функция f(x) = x² cos x − sin(x²) является б.м. при x → 0. Найти её порядок малости относительно h(x) = x.',
    problemTextClean: 'Найти порядок малости функции при x → 0 (Билет ФН-12 №20, зад. 3):',
    problemLatex: 'f(x) = x^2\\cos x - \\sin(x^2) \\quad (x \\to 0)',
    algorithmSummary:
      'В разложении cos x = 1 − x²/2 + o(x²) и sin(x²) = x² − x⁶/6 + o(x⁶) слагаемые x² взаимно уничтожаются! Главная часть равна x²(−x²/2) = −x⁴/2 ⇒ порядок малости равен k = 4.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Разложить оба слагаемых по формуле Маклорена',
        detail: 'Заменяем cos x = 1 − x²/2 + o(x²) и sin(x²) = x² + o(x⁴):',
        latex: 'f(x) = x^2\\left(1 - \\frac{x^2}{2} + o(x^2)\\right) - \\bigl(x^2 + o(x^4)\\bigr) = -\\frac{1}{2}x^4 + o(x^4)',
      },
      {
        title: 'Шаг 2 · Вывод о порядке малости',
        detail: 'Главная часть равна −(1/2)x⁴ ⇒ порядок малости относительно x равен k = 4.',
      },
    ],
    code: '',
    expectedOutput: '4 (главная часть -x^4/2)',
    answerLatex: 'k = 4 \\;\\;\\left(f(x) \\sim -\\frac{1}{2}x^4\\right)',
    slides: [
      {lectureId: 'matan_bilet_20', page: 1, label: 'Билет ФН-12 №20 (20-08) · Зад. 3', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b20-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 20 · №4 (5 б.)',
    title: 'Билет 20 · Точки разрыва функции f(x) = 2^(1 / (x² − 4))',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = 2^(1 / (x² − 4)) и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №20, зад. 4):',
    problemLatex: 'f(x) = 2^{\\frac{1}{x^2 - 4}}',
    algorithmSummary:
      'Особые точки x = −2 и x = 2. В каждой из них с одной стороны показатель 1/(x² − 4) → +∞ и 2^(+∞) = +∞ (а с другой стороны 2^(−∞) = 0) ⇒ обе точки x = −2 и x = 2 являются точками разрыва II рода.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вычислить односторонние пределы в точках x = ±2',
        detail: 'При |x| > 2 имеем x² − 4 > 0, а при |x| < 2 имеем x² − 4 < 0:',
        latex: 'f(-2 - 0) = +\\infty,\\; f(-2 + 0) = 0; \\qquad f(2 - 0) = 0,\\; f(2 + 0) = +\\infty \\implies x = \\pm 2 \\text{ — разрывы II рода}',
      },
    ],
    code: '',
    expectedOutput: 'x = -2 и x = 2 (обе — точки разрыва II рода)',
    answerLatex: 'x_1 = -2,\\; x_2 = 2 \\text{ — точки разрыва II рода}',
    slides: [
      {lectureId: 'matan_bilet_20', page: 1, label: 'Билет ФН-12 №20 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b20-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Билет 20 · №6 (5 б.)',
    title: 'Билет 20 · Асимптоты и точки экстремума функции f(x) = √(x² + 1) / x',
    chapter: CH_STUDY,
    problemStatement: 'Найти асимптоты и точки экстремума функции f(x) = √(x² + 1) / x. Построить график.',
    problemTextClean: 'Найти асимптоты и точки экстремума функции (Билет ФН-12 №20, зад. 6):',
    problemLatex: 'f(x) = \\frac{\\sqrt{x^2 + 1}}{x}',
    algorithmSummary:
      'Производная f′(x) = −1 / (x²√(x² + 1)) < 0 при всех x ≠ 0 ⇒ функция строго убывает на (−∞, 0) и на (0, +∞), точек экстремума НЕТ! Асимптоты: вертикальная x = 0 и две горизонтальные: y = 1 при x → +∞ и y = −1 при x → −∞.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вычислить производную и проверить экстремумы',
        detail: 'D(f) = R \\ {0}. Находим f′(x):',
        latex: "f'(x) = \\frac{\\frac{x}{\\sqrt{x^2+1}}\\cdot x - \\sqrt{x^2+1}}{x^2} = -\\frac{1}{x^2\\sqrt{x^2 + 1}} < 0 \\implies \\text{экстремумов нет}",
      },
      {
        title: 'Шаг 2 · Найти вертикальную и горизонтальные асимптоты',
        detail: 'При x → ±0 имеем f(x) → ±∞ (вертикальная асимптота x = 0). При x → ±∞ учитываем √(x²) = |x|:',
        latex: '\\lim_{x \\to +\\infty} f(x) = 1 \\implies y = 1; \\qquad \\lim_{x \\to -\\infty} f(x) = -1 \\implies y = -1',
      },
    ],
    code: '',
    expectedOutput: 'экстремумов нет; асимптоты x = 0, y = 1, y = -1',
    answerLatex: '\\text{Экстремумов нет}; \\quad \\text{асимптоты: } x = 0,\\; y = 1\\;(x\\to+\\infty),\\; y = -1\\;(x\\to-\\infty)',
    slides: [
      {lectureId: 'matan_bilet_20', page: 1, label: 'Билет ФН-12 №20 (20-08) · Зад. 6', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №21 (20-08) ========================
  {
    id: 'matan-b21-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 21 · №2 (5 б.)',
    title: 'Билет 21 · Предел отношения многочленов с кратным корнем x = 1',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→1} (x³ − 3x + 2) / (x⁴ − 4x + 3)',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №21, зад. 2):',
    problemLatex: '\\lim_{x \\to 1} \\frac{x^3 - 3x + 2}{x^4 - 4x + 3}',
    algorithmSummary:
      'И числитель, и знаменатель вместе со своими первыми производными обращаются в нуль при x = 1, т.е. делятся на (x − 1)²: x³ − 3x + 2 = (x − 1)²(x + 2), а x⁴ − 4x + 3 = (x − 1)²(x² + 2x + 3) ⇒ предел равен 3/6 = 1/2.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Разложить числитель и знаменатель на множители',
        detail: 'Выделим множитель (x − 1)² делением уголком или схемой Горнера:',
        latex: '\\frac{x^3 - 3x + 2}{x^4 - 4x + 3} = \\frac{(x - 1)^2(x + 2)}{(x - 1)^2(x^2 + 2x + 3)}',
      },
      {
        title: 'Шаг 2 · Сократить на (x − 1)² и подставить x = 1',
        detail: 'Переходим к пределу при x → 1:',
        latex: '\\lim_{x \\to 1} \\frac{x + 2}{x^2 + 2x + 3} = \\frac{1 + 2}{1 + 2 + 3} = \\frac{3}{6} = \\frac{1}{2}',
      },
    ],
    code: '',
    expectedOutput: '1/2',
    answerLatex: '\\frac{1}{2}',
    slides: [
      {lectureId: 'matan_bilet_21', page: 1, label: 'Билет ФН-12 №21 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b21-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 21 · №4 (5 б.)',
    title: 'Билет 21 · Точки разрыва функции f(x) = (1 / (x − 1)) arcctg(1/x)',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = (1 / (x − 1)) arcctg(1/x) и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №21, зад. 4):',
    problemLatex: 'f(x) = \\frac{1}{x - 1}\\operatorname{arcctg}\\frac{1}{x}',
    algorithmSummary:
      'Внимание: в MГТУ область значений arcctg u равна (0; π), поэтому arcctg(−∞) = π и arcctg(+∞) = 0! В точке x = 0: слева (1/(0−1))·π = −π, справа (1/(0−1))·0 = 0 ⇒ x = 0 — разрыв I рода (скачок π). В точке x = 1: arcctg 1 = π/4 ≠ 0, поэтому f(1±0) = ±∞ ⇒ x = 1 — разрыв II рода.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Исследовать точку x = 0',
        detail: 'Так как arcctg: R → (0; π), при x → −0 имеем 1/x → −∞ ⇒ arcctg(1/x) → π, а при x → +0 имеем 1/x → +∞ ⇒ arcctg(1/x) → 0:',
        latex: 'f(0 - 0) = -\\pi, \\quad f(0 + 0) = 0 \\implies x = 0 \\text{ — точка разрыва I рода (скачок } \\pi\\text{)}',
      },
      {
        title: 'Шаг 2 · Исследовать точку x = 1',
        detail: 'При x → 1 множитель arcctg(1/x) → π/4 > 0, а 1/(x − 1) → ±∞:',
        latex: 'f(1 - 0) = -\\infty, \\quad f(1 + 0) = +\\infty \\implies x = 1 \\text{ — точка разрыва II рода}',
      },
    ],
    code: '',
    expectedOutput: 'x = 0 (разрыв I рода, скачок pi) и x = 1 (разрыв II рода)',
    answerLatex: 'x = 0 \\text{ — разрыв I рода (скачок } \\pi\\text{)}; \\quad x = 1 \\text{ — разрыв II рода}',
    slides: [
      {lectureId: 'matan_bilet_21', page: 1, label: 'Билет ФН-12 №21 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b21-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Билет 21 · №5 (6 б.)',
    title: 'Билет 21 · Касательная и нормаль к кривой y = −√(5 − x²) в точке (1; −2)',
    chapter: CH_MVT,
    problemStatement: 'Составить уравнения касательной и нормали к кривой y = −√(5 − x²) в точке (1; −2).',
    problemTextClean: 'Составить уравнения касательной и нормали в точке (1; −2) (Билет ФН-12 №21, зад. 5):',
    problemLatex: 'y = -\\sqrt{5 - x^2}, \\qquad M_0(1;\\, -2)',
    algorithmSummary:
      'y′(x) = x / √(5 − x²) ⇒ y′(1) = 1/2. Касательная: y + 2 = (1/2)(x − 1) ⇔ y = (1/2)x − 5/2. Нормаль (k_н = −2): y + 2 = −2(x − 1) ⇔ y = −2x.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вычислить производную в точке x₀ = 1',
        detail: 'Дифференцируем нижнюю полуокружность радиуса √5:',
        latex: "y'(x) = \\frac{x}{\\sqrt{5 - x^2}} \\implies y'(1) = \\frac{1}{2}",
      },
      {
        title: 'Шаг 2 · Записать уравнения касательной и нормали',
        detail: 'Угловой коэффициент касательной равен 1/2, нормали равен −2:',
        latex: '\\text{Касательная: } y = \\frac{1}{2}x - \\frac{5}{2} \\; (x - 2y - 5 = 0); \\qquad \\text{Нормаль: } y = -2x',
      },
    ],
    code: '',
    expectedOutput: 'касательная y = 0.5x - 2.5, нормаль y = -2x',
    answerLatex: '\\text{Касательная: } y = \\frac{1}{2}x - \\frac{5}{2}; \\qquad \\text{Нормаль: } y = -2x',
    slides: [
      {lectureId: 'matan_bilet_21', page: 1, label: 'Билет ФН-12 №21 (20-08) · Зад. 5', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b21-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Билет 21 · №6 (5 б.)',
    title: 'Билет 21 · Асимптоты и точки экстремума функции f(x) = ∛(12x − x³) / x',
    chapter: CH_STUDY,
    problemStatement: 'Найти асимптоты и точки экстремума функции f(x) = ∛(12x − x³) / x. Построить график.',
    problemTextClean: 'Найти асимптоты и точки экстремума функции (Билет ФН-12 №21, зад. 6):',
    problemLatex: 'f(x) = \\frac{\\sqrt[3]{12x - x^3}}{x}',
    algorithmSummary:
      'f′(x) = −8 / (x(12x − x³)^(2/3)) не обращается в нуль, но в точках x = ±2√3 (где 12x − x³ = 0) производная бесконечна (вертикальные касательные), однако знак f′ при переходе через ±2√3 НЕ меняется ⇒ экстремумов нет! Асимптоты: вертикальная x = 0 и горизонтальная y = −1 при x → ±∞.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти асимптоты',
        detail: 'При x → 0 числитель ∛(12x) ~ ∛12 · x^(1/3), поэтому f(x) ~ ∛12 · x^(−2/3) → ∞ ⇒ вертикальная асимптота x = 0. При x → ±∞ имеем ∛(−x³)/x = −x/x = −1 ⇒ горизонтальная асимптота y = −1.',
      },
      {
        title: 'Шаг 2 · Вычислить производную и проверить экстремумы',
        detail: 'Находим f′(x) при x ≠ 0, x ≠ ±2√3:',
        latex: "f'(x) = \\frac{-8}{x\\left(12x - x^3\\right)^{2/3}}",
      },
      {
        title: 'Шаг 3 · Вывод об экстремумах',
        detail: 'Так как степень 2/3 чётна в числителе показателя, знак f′(x) зависит только от знака (−8/x): при x < 0 имеем f′ > 0 (возрастает), при x > 0 имеем f′ < 0 (убывает), а в точке x = 0 разрыв ⇒ точек экстремума нет.',
      },
    ],
    code: '',
    expectedOutput: 'экстремумов нет; асимптоты x = 0 и y = -1',
    answerLatex: '\\text{Экстремумов нет}; \\quad \\text{асимптоты: } x = 0,\\; y = -1',
    slides: [
      {lectureId: 'matan_bilet_21', page: 1, label: 'Билет ФН-12 №21 (20-08) · Зад. 6', isAnswerSlide: true},
    ],
  },

  // ======================== БИЛЕТ №22 (20-08) ========================
  {
    id: 'matan-b22-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Билет 22 · №2 (5 б.)',
    title: 'Билет 22 · Предел (5 − 4 / cos x)^(1 / sin² 3x) при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→0} (5 − 4 / cos x)^(1 / sin² 3x)',
    problemTextClean: 'Вычислить предел (Билет ФН-12 №22, зад. 2):',
    problemLatex: '\\lim_{x \\to 0} \\left(5 - \\frac{4}{\\cos x}\\right)^{\\frac{1}{\\sin^2 3x}}',
    algorithmSummary:
      'Неопределённость [1^∞]. При x → 0 имеем (5 − 4/cos x) − 1 = 4(cos x − 1)/cos x ~ −2x², а знаменатель показателя sin² 3x ~ 9x² ⇒ предел показателя равен −2/9 ⇒ ответ e^(−2/9).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить бесконечно малую добавку к 1 в основании',
        detail: 'Приводим к виду (1 + α(x))^β(x):',
        latex: '\\alpha(x) = 4 - \\frac{4}{\\cos x} = \\frac{4(\\cos x - 1)}{\\cos x} \\sim 4\\left(-\\frac{x^2}{2}\\right) = -2x^2',
      },
      {
        title: 'Шаг 2 · Вычислить предел показателя',
        detail: 'Заменяем sin² 3x ~ (3x)² = 9x²:',
        latex: '\\lim_{x \\to 0} \\frac{-2x^2}{9x^2} = -\\frac{2}{9} \\implies \\text{Ответ: } e^{-2/9}',
      },
    ],
    code: '',
    expectedOutput: 'e^(-2/9)',
    answerLatex: 'e^{-2/9}',
    slides: [
      {lectureId: 'matan_bilet_22', page: 1, label: 'Билет ФН-12 №22 (20-08) · Зад. 2', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b22-3',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'Билет 22 · №3 (5 б.)',
    title: 'Билет 22 · Порядок малости f(x) = ∛(1 − √x) относительно g(x) = x − 1 при x → 1',
    chapter: CH_LIM,
    problemStatement: 'Найти порядок малости функции f(x) = ∛(1 − √x) относительно функции g(x) = x − 1 при x → 1.',
    problemTextClean: 'Найти порядок малости функции относительно g(x) = x − 1 при x → 1 (Билет ФН-12 №22, зад. 3):',
    problemLatex: 'f(x) = \\sqrt[3]{1 - \\sqrt{x}}, \\qquad g(x) = x - 1 \\quad (x \\to 1)',
    algorithmSummary:
      'При x → 1 имеем 1 − √x = (1 − x)/(1 + √x) ~ −(1/2)(x − 1). Извлекая кубический корень, получаем f(x) ~ −2^(−1/3) (x − 1)^(1/3) ⇒ порядок малости равен k = 1/3.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить главную часть подкоренного выражения 1 − √x',
        detail: 'При t = x − 1 → 0 имеем √(1 + t) − 1 ~ t/2:',
        latex: '1 - \\sqrt{x} \\sim -\\frac{1}{2}(x - 1) \\implies f(x) \\sim -\\frac{1}{\\sqrt[3]{2}}(x - 1)^{1/3}',
      },
      {
        title: 'Шаг 2 · Определить порядок малости k',
        detail: 'Показатель степени эталона (x − 1) равен k = 1/3.',
      },
    ],
    code: '',
    expectedOutput: '1/3',
    answerLatex: 'k = \\frac{1}{3} \\;\\;\\left(f(x) \\sim -2^{-1/3}(x - 1)^{1/3}\\right)',
    slides: [
      {lectureId: 'matan_bilet_22', page: 1, label: 'Билет ФН-12 №22 (20-08) · Зад. 3', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b22-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Билет 22 · №4 (5 б.)',
    title: 'Билет 22 · Точки разрыва кусочной функции e^(x/(1 − x)) (x > 0) и cos x (x ≤ 0)',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции f(x) = {e^(x/(1−x)) при x > 0; cos x при x ≤ 0} и классифицировать их.',
    problemTextClean: 'Найти точки разрыва функции и классифицировать их (Билет ФН-12 №22, зад. 4):',
    problemLatex: 'f(x) = \\begin{cases} e^{\\frac{x}{1 - x}}, & x > 0; \\\\ \\cos x, & x \\le 0. \\end{cases}',
    algorithmSummary:
      'В точке склейки x = 0: слева cos 0 = 1, справа e⁰ = 1 ⇒ функция НЕПРЕРЫВНА в точке x = 0! Единственная точка разрыва находится внутри первой ветви при x = 1: слева e^(+∞) = +∞, справа e^(−∞) = 0 ⇒ x = 1 — точка разрыва II рода.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Проверить точку склейки x = 0',
        detail: 'Вычисляем односторонние пределы в нуле:',
        latex: 'f(0 - 0) = \\cos 0 = 1, \\quad f(0 + 0) = e^0 = 1, \\quad f(0) = 1 \\implies \\text{в } x = 0 \\text{ непрерывна!}',
      },
      {
        title: 'Шаг 2 · Исследовать особую точку показателя x = 1 (x > 0)',
        detail: 'При x → 1 − 0 имеем x/(1 − x) → +∞ ⇒ f(1 − 0) = +∞; при x → 1 + 0 имеем x/(1 − x) → −∞ ⇒ f(1 + 0) = 0:',
        latex: 'x = 1 \\text{ — единственная точка разрыва (II рода)}',
      },
    ],
    code: '',
    expectedOutput: 'x = 1 (точка разрыва II рода; в x = 0 непрерывна)',
    answerLatex: 'x = 1 \\text{ — точка разрыва II рода}; \\quad \\text{в } x = 0 \\text{ функция непрерывна}',
    slides: [
      {lectureId: 'matan_bilet_22', page: 1, label: 'Билет ФН-12 №22 (20-08) · Зад. 4', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b22-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Билет 22 · №5 (6 б.)',
    title: 'Билет 22 · Предел по формуле Тейлора (cos x − e^(−x²/2)) / (x³ tg x) при x → 0',
    chapter: CH_MVT,
    problemStatement: 'С помощью формулы Тейлора вычислить предел lim_{x→0} (cos x − e^(−x²/2)) / (x³ tg x)',
    problemTextClean: 'Вычислить предел по формуле Тейлора (Билет ФН-12 №22, зад. 5):',
    problemLatex: '\\lim_{x \\to 0} \\frac{\\cos x - e^{-x^2/2}}{x^3\\operatorname{tg} x}',
    algorithmSummary:
      'Знаменатель x³ tg x ~ x⁴. Раскладываем числитель до x⁴: cos x = 1 − x²/2 + x⁴/24 + o(x⁴), а e^(−x²/2) = 1 − x²/2 + x⁴/8 + o(x⁴). Их разность равна (1/24 − 1/8)x⁴ = −(1/12)x⁴ ⇒ предел равен −1/12.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Разложить числитель по Маклорену до x⁴',
        detail: 'Члены 1 − x²/2 взаимно уничтожаются:',
        latex: '\\cos x - e^{-x^2/2} = \\left(1 - \\frac{x^2}{2} + \\frac{x^4}{24}\\right) - \\left(1 - \\frac{x^2}{2} + \\frac{x^4}{8}\\right) + o(x^4) = -\\frac{1}{12}x^4 + o(x^4)',
      },
      {
        title: 'Шаг 2 · Разделить на эквивалентный знаменатель x⁴',
        detail: 'Так как tg x = x + o(x), знаменатель x³ tg x = x⁴ + o(x⁴):',
        latex: '\\lim_{x \\to 0} \\frac{-\\frac{1}{12}x^4 + o(x^4)}{x^4 + o(x^4)} = -\\frac{1}{12}',
      },
    ],
    code: '',
    expectedOutput: '-1/12',
    answerLatex: '-\\frac{1}{12}',
    slides: [
      {lectureId: 'matan_bilet_22', page: 1, label: 'Билет ФН-12 №22 (20-08) · Зад. 5', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-b22-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Билет 22 · №6 (5 б.)',
    title: 'Билет 22 · Исследование функции f(x) = ln(x + √(x² + 1)) (аршинус arsh x)',
    chapter: CH_STUDY,
    problemStatement: 'Исследовать функцию f(x) = ln(x + √(x² + 1)) на локальный экстремум, найти асимптоты, интервалы возрастания и убывания.',
    problemTextClean: 'Исследовать функцию на монотонность, экстремумы и асимптоты (Билет ФН-12 №22, зад. 6):',
    problemLatex: 'f(x) = \\ln\\left(x + \\sqrt{x^2 + 1}\\right)',
    algorithmSummary:
      'D(f) = R (т.к. √(x² + 1) > |x|). Производная f′(x) = 1 / √(x² + 1) > 0 при всех x ∈ R ⇒ функция строго возрастает на всей числовой прямой (−∞; +∞), локальных экстремумов НЕТ! Асимптот тоже нет (при x → ±∞ имеем k = lim f(x)/x = 0, а f(x) → ±∞).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вычислить производную и исследовать монотонность',
        detail: 'Функция определена при всех x ∈ R. Дифференцируем:',
        latex: "f'(x) = \\frac{1 + \\frac{x}{\\sqrt{x^2 + 1}}}{x + \\sqrt{x^2 + 1}} = \\frac{1}{\\sqrt{x^2 + 1}} > 0 \\quad (\\forall x \\in \\mathbb{R})",
      },
      {
        title: 'Шаг 2 · Сделать вывод об экстремумах и асимптотах',
        detail: 'Так как f′(x) > 0 всюду, функция строго возрастает на R и точек экстремума не имеет. Вертикальных асимптот нет, а для наклонных k = lim ln(x + √(x²+1))/x = 0, но b = lim f(x) = ±∞ ⇒ асимптот нет.',
      },
    ],
    code: '',
    expectedOutput: 'возрастает на R, экстремумов нет, асимптот нет',
    answerLatex: 'f\'(x) = \\frac{1}{\\sqrt{x^2+1}} > 0 \\implies \\uparrow \\text{ на } \\mathbb{R},\\; \\text{экстремумов и асимптот нет}',
    slides: [
      {lectureId: 'matan_bilet_22', page: 1, label: 'Билет ФН-12 №22 (20-08) · Зад. 6', isAnswerSlide: true},
    ],
  },
];

/**
 * Реестр 15 официальных экзаменационных билетов кафедры ФН-12 МГТУ им. Н.Э. Баумана (20-08)
 * для мгновенной загрузки любого реального билета в разделе «Билет».
 */
export const MATAN_OFFICIAL_TICKETS: MatanOfficialTicketSpec[] = [
  {
    ticketNumber: 1,
    code: 'ФН12-01 (20-08)',
    lectureId: 'matan_bilet_1',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var01__1__0f891a48.pdf',
    theoryCardId: 508,
    theoryPrompt: '1. (4 балла) Сформулируйте и докажите теорему о пределе сложной функции.',
    taskIds: ['matan-b1-2', 'matan-b1-3', 'matan-b1-4', 'matan-b1-5', 'matan-b1-6'],
  },
  {
    ticketNumber: 3,
    code: 'ФН12-03 (20-08)',
    lectureId: 'matan_bilet_3',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var03_020a9afd.pdf',
    theoryCardId: 515,
    theoryPrompt: '1. (4 балла) Сформулируйте и докажите теорему о сумме конечного числа б.м. разных порядков. Приведите таблицу эквивалентных б.м.',
    taskIds: ['matan-b3-2', 'matan-b3-3', 'matan-b3-4', 'matan-b3-5', 'matan-5-4'],
  },
  {
    ticketNumber: 6,
    code: 'ФН12-06 (20-08)',
    lectureId: 'matan_bilet_6',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var06_b2ec66d4.pdf',
    theoryCardId: 518,
    theoryPrompt: '1. (4 балла) Сформулируйте и докажите теорему о сохранении знака непрерывной функции в окрестности точки.',
    taskIds: ['matan-1-3', 'matan-b6-3', 'matan-3-3', 'matan-4-3', 'matan-b6-6'],
  },
  {
    ticketNumber: 7,
    code: 'ФН12-07 (20-08)',
    lectureId: 'matan_bilet_7',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var07-1_ff559f21.pdf',
    theoryCardId: 529,
    theoryPrompt: '1. (4 балла) Сформулируйте и докажите свойство инвариантности формы записи дифференциала первого порядка.',
    taskIds: ['matan-b7-2', 'matan-2-4', 'matan-b7-4', 'matan-4-6', 'matan-b7-6'],
  },
  {
    ticketNumber: 9,
    code: 'ФН12-09 (20-08)',
    lectureId: 'matan_bilet_9',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var09_21402bf4.pdf',
    theoryCardId: 532,
    theoryPrompt: '1. (4 балла) Сформулируйте и докажите теорему Лагранжа.',
    taskIds: ['matan-b9-2', 'matan-2-6', 'matan-b9-4', 'matan-b9-5', 'matan-5-6'],
  },
  {
    ticketNumber: 10,
    code: 'ФН12-10 (20-08)',
    lectureId: 'matan_bilet_10',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var10_e3049db9.pdf',
    theoryCardId: 514,
    theoryPrompt: '1. (4 балла) Сформулируйте и докажите теорему о необходимом и достаточном условии эквивалентности бесконечно малых.',
    taskIds: ['matan-b10-2', 'matan-2-3', 'matan-b10-4', 'matan-b10-5', 'matan-b10-6'],
  },
  {
    ticketNumber: 11,
    code: 'ФН12-11 (20-08)',
    lectureId: 'matan_bilet_11',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var11_267df3af.pdf',
    theoryCardId: 501,
    theoryPrompt: '1. (4 балла) Сформулируйте и докажите теорему о единственности предела сходящейся последовательности.',
    taskIds: ['matan-b11-2', 'matan-b11-3', 'matan-b11-4', 'matan-b11-5', 'matan-b11-6'],
  },
  {
    ticketNumber: 12,
    code: 'ФН12-12 (20-08)',
    lectureId: 'matan_bilet_12',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var12_084718d2.pdf',
    theoryCardId: 549,
    theoryPrompt: '1. (4 балла) Сформулируйте и докажите необходимое и достаточное условия точки перегиба.',
    taskIds: ['matan-b12-2', 'matan-b12-3', 'matan-b12-4', 'matan-b12-5', 'matan-b12-6'],
  },
  {
    ticketNumber: 13,
    code: 'ФН12-13 (20-08)',
    lectureId: 'matan_bilet_13',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var13_5116dfbd.pdf',
    theoryCardId: 538,
    theoryPrompt: '1. (4 балла) Выведите формулу Маклорена для функций y = e^x, y = sh x, y = ch x с остаточным членом в форме Лагранжа.',
    taskIds: ['matan-b13-2', 'matan-b13-3', 'matan-b13-4', 'matan-b13-5', 'matan-b13-6'],
  },
  {
    ticketNumber: 14,
    code: 'ФН12-14 (20-08)',
    lectureId: 'matan_bilet_14',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var14_ce62b4aa.pdf',
    theoryCardId: 521,
    theoryPrompt: '1. (4 балла) Сформулируйте определение точки разрыва функции и дайте классификацию точек разрыва. На каждый случай приведите примеры.',
    taskIds: ['matan-b14-2', 'matan-b14-3', 'matan-b14-4', 'matan-b14-5', 'matan-b14-6'],
  },
  {
    ticketNumber: 15,
    code: 'ФН12-15 (20-08)',
    lectureId: 'matan_bilet_15',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var15_b1ff2094.pdf',
    theoryCardId: 536,
    theoryPrompt: '1. (4 балла) Выведите формулу Тейлора с остаточным членом в форме Лагранжа.',
    taskIds: ['matan-b15-2', 'matan-b15-3', 'matan-b15-4', 'matan-b15-5', 'matan-5-2'],
  },
  {
    ticketNumber: 17,
    code: 'ФН12-17 (20-08)',
    lectureId: 'matan_bilet_17',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var17_9357ceb5.pdf',
    theoryCardId: 511,
    theoryPrompt: '1. (4 балла) Сформулируйте и докажите теорема о произведении бесконечно малой функции на ограниченную.',
    taskIds: ['matan-b17-2', 'matan-b17-3', 'matan-b17-4', 'matan-b17-5', 'matan-b17-6'],
  },
  {
    ticketNumber: 20,
    code: 'ФН12-20 (20-08)',
    lectureId: 'matan_bilet_20',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var20_0d98cf23.pdf',
    theoryCardId: 506,
    theoryPrompt: '1. (4 балла) Сформулируйте и докажите теорему о пределе промежуточной функции.',
    taskIds: ['matan-b20-2', 'matan-b20-3', 'matan-b20-4', 'matan-4-2', 'matan-b20-6'],
  },
  {
    ticketNumber: 21,
    code: 'ФН12-21 (20-08)',
    lectureId: 'matan_bilet_21',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var21_dc1ba539.pdf',
    theoryCardId: 509,
    theoryPrompt: '1. (4 балла) Докажите формулу первого замечательного предела lim_{x→0} (sin x / x) = 1. Запишите формулу второго замечательного предела.',
    taskIds: ['matan-b21-2', 'matan-2-1', 'matan-b21-4', 'matan-b21-5', 'matan-b21-6'],
  },
  {
    ticketNumber: 22,
    code: 'ФН12-22 (20-08)',
    lectureId: 'matan_bilet_22',
    pdfUrl: '/assets/aistudio/MA_1s_All_Ekz__20-08__Var22_9a9d9fb6.pdf',
    theoryCardId: 522,
    theoryPrompt: '1. (4 балла) Сформулируйте и докажите необходимое и достаточное условие существования наклонной асимптоты.',
    taskIds: ['matan-b22-2', 'matan-b22-3', 'matan-b22-4', 'matan-b22-5', 'matan-b22-6'],
  },
];
