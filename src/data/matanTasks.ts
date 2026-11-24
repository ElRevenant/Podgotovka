import {TaskCard} from '../types/study';

const CH_LIM = 'Матан · Пределы и б.м.ф. (вопр. 1–15)' as const;
const CH_CONT = 'Матан · Непрерывность и разрывы (вопр. 16–22)' as const;
const CH_MVT = 'Матан · Теоремы о среднем, Лопиталь и Тейлор (вопр. 30–42)' as const;
const CH_STUDY = 'Матан · Монотонность, экстремумы и выпуклость (вопр. 43–49)' as const;

export const MATAN_TASKS: TaskCard[] = [
  // ======================== КОМПЛЕКТ №1 · ПРЕДЕЛЫ (5 баллов) ========================
  {
    id: 'matan-1-1',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: '1.1 (5 б.)',
    title: 'Предел с радикалами на +∞ (неопределённость ∞/∞)',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→+∞} (∛(x²√(x²+1)) + 3x) / x',
    problemTextClean: 'Вычислить предел:',
    problemLatex: '\\lim_{x \\to +\\infty} \\frac{\\sqrt[3]{x^2\\sqrt{x^2 + 1}} + 3x}{x}',
    algorithmSummary:
      'Вынести старшую степень x > 0 из-под внутреннего квадратного и внешнего кубического корней, затем почленно разделить числитель на x.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Определить тип неопределённости',
        detail: 'При x → +∞ и числитель, и знаменатель стремятся к +∞ — неопределённость вида [∞/∞]. Поскольку x → +∞, считаем x > 0 и √(x²) = x.',
      },
      {
        title: 'Шаг 2 · Вынести x из-под корней',
        detail: 'Выносим x² из-под внутреннего корня, затем x³ из-под кубического корня:',
        latex: '\\sqrt[3]{x^2\\sqrt{x^2 + 1}} = \\sqrt[3]{x^2 \\cdot x\\sqrt{1 + \\frac{1}{x^2}}} = x\\sqrt[6]{1 + \\frac{1}{x^2}}',
      },
      {
        title: 'Шаг 3 · Сократить на x и перейти к пределу',
        detail: 'При x → +∞ слагаемое 1/x² → 0, поэтому корень стремится к 1:',
        latex: '\\lim_{x \\to +\\infty} \\left(\\sqrt[6]{1 + \\frac{1}{x^2}} + 3\\right) = 1 + 3 = 4',
      },
    ],
    code: '',
    expectedOutput: '4',
    answerLatex: '4',
    slides: [
      {lectureId: 'matan_tasks', page: 2, label: 'Комплект №1 · Задача 1.1 (стр. 2)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-1-2',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: '1.2 (5 б.)',
    title: 'Разность квадратных корней при x → −∞ (ловушка модуля |x| = −x)',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→−∞} (√(x²+3x+1) − √(x²−3x+1))',
    problemTextClean: 'Вычислить предел:',
    problemLatex: '\\lim_{x \\to -\\infty} \\left(\\sqrt{x^2 + 3x + 1} - \\sqrt{x^2 - 3x + 1}\\right)',
    algorithmSummary:
      'Умножить и разделить на сопряжённую сумму корней, затем вынести |x| = −x из знаменателя (главная экзаменационная ловушка при x → −∞!).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Избавиться от иррациональности в числителе',
        detail: 'Неопределённость [∞ − ∞]. Домножаем на сопряжённое выражение (a − b)(a + b) = a² − b²:',
        latex: '\\frac{(x^2 + 3x + 1) - (x^2 - 3x + 1)}{\\sqrt{x^2 + 3x + 1} + \\sqrt{x^2 - 3x + 1}} = \\frac{6x}{\\sqrt{x^2 + 3x + 1} + \\sqrt{x^2 - 3x + 1}}',
      },
      {
        title: 'Шаг 2 · Аккуратно вынести |x| = −x при x → −∞',
        detail: 'Т.к. x < 0, корень √(x²) = |x| = −x! Забыть знак минус — самая частая ошибка на экзамене:',
        latex: '\\frac{6x}{-x\\left(\\sqrt{1 + \\frac{3}{x} + \\frac{1}{x^2}} + \\sqrt{1 - \\frac{3}{x} + \\frac{1}{x^2}}\\right)}',
      },
      {
        title: 'Шаг 3 · Переход к пределу',
        detail: 'Сокращаем на x и устремляем дроби 3/x, 1/x² к нулю:',
        latex: '\\frac{6}{-1 \\cdot (1 + 1)} = -3',
      },
    ],
    code: '',
    expectedOutput: '-3',
    answerLatex: '-3',
    slides: [
      {lectureId: 'matan_tasks', page: 2, label: 'Комплект №1 · Задача 1.2 (стр. 2)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-1-3',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: '1.3 (5 б.)',
    title: 'Предел 0/0 с разностью tg x − sin x и ln(1 + x³)',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→0} (x⁴ − sin x + tg x) / ln(1 + x³)',
    problemTextClean: 'Вычислить предел:',
    problemLatex: '\\lim_{x \\to 0} \\frac{x^4 - \\sin x + \\operatorname{tg} x}{\\ln(1 + x^3)}',
    algorithmSummary:
      'Свернуть tg x − sin x = sin x·(1 − cos x)/cos x ~ x³/2 (нельзя заменять tg x и sin x на x по отдельности!), отбросить x⁴ = o(x³) и заменить ln(1+x³) ~ x³.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Преобразовать разность tg x − sin x',
        detail: 'Заменять tg x ~ x и sin x ~ x в разности НЕЛЬЗЯ (они сократятся в 0!). Вынесем sin x:',
        latex: '\\operatorname{tg} x - \\sin x = \\sin x \\cdot \\frac{1 - \\cos x}{\\cos x} \\sim x \\cdot \\frac{x^2 / 2}{1} = \\frac{x^3}{2}',
      },
      {
        title: 'Шаг 2 · Выделить главную часть числителя и знаменателя',
        detail: 'При x → 0 имеем x⁴ = o(x³), поэтому числитель ~ x³/2. В знаменателе ln(1 + x³) ~ x³:',
        latex: '\\lim_{x \\to 0} \\frac{x^4 + \\frac{x^3}{2} + o(x^3)}{x^3} = \\lim_{x \\to 0} \\left(x + \\frac{1}{2}\\right) = \\frac{1}{2}',
      },
    ],
    code: '',
    expectedOutput: '1/2',
    answerLatex: '\\frac{1}{2}',
    slides: [
      {lectureId: 'matan_tasks', page: 2, label: 'Комплект №1 · Задача 1.3 (стр. 2)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-1-4',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: '1.4 (5 б.)',
    title: 'Показательно-степенная неопределённость 1^∞ при x → 1',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→1} (2 − x)^(tg(πx/2))',
    problemTextClean: 'Вычислить предел:',
    problemLatex: '\\lim_{x \\to 1} (2 - x)^{\\operatorname{tg}\\frac{\\pi x}{2}}',
    algorithmSummary:
      'Сделать замену t = x − 1 → 0, свести к виду e^{lim α(t)·β(t)} и воспользоваться формулой приведения tg(π/2 + πt/2) = −ctg(πt/2).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Замена переменной t = x − 1 → 0',
        detail: 'Имеем неопределённость [1^∞]. Подставим x = 1 + t, тогда 2 − x = 1 − t:',
        latex: '\\operatorname{tg}\\frac{\\pi(1+t)}{2} = \\operatorname{tg}\\left(\\frac{\\pi}{2} + \\frac{\\pi t}{2}\\right) = -\\operatorname{ctg}\\frac{\\pi t}{2}',
      },
      {
        title: 'Шаг 2 · Свести к второму замечательному пределу',
        detail: 'Используем формулу (1 + α)^β → exp(lim α·β) при α = −t → 0:',
        latex: '\\lim_{t \\to 0} (-t)\\left(-\\frac{\\cos\\frac{\\pi t}{2}}{\\sin\\frac{\\pi t}{2}}\\right) = \\lim_{t \\to 0} \\frac{t \\cdot 1}{\\frac{\\pi t}{2}} = \\frac{2}{\\pi}',
      },
      {
        title: 'Шаг 3 · Записать ответ с экспонентой',
        detail: 'Не забыть возвести число e в найденный предел показателя:',
        latex: 'e^{\\frac{2}{\\pi}}',
      },
    ],
    code: '',
    expectedOutput: 'e^(2/pi)',
    answerLatex: 'e^{\\frac{2}{\\pi}}',
    slides: [
      {lectureId: 'matan_tasks', page: 2, label: 'Комплект №1 · Задача 1.4 (стр. 2)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-1-5',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: '1.5 (5 б.)',
    title: 'Предел отношения высоких степеней многочленов при x → ∞',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→∞} (2x³ + 7x − 1)⁶ / (2x⁶ − 13x² + x)³',
    problemTextClean: 'Вычислить предел:',
    problemLatex: '\\lim_{x \\to \\infty} \\frac{(2x^3 + 7x - 1)^6}{(2x^6 - 13x^2 + x)^3}',
    algorithmSummary:
      'Вынести старшую степень x из каждой скобки: числитель даёт степень x¹⁸ с коэффициентом 2⁶, знаменатель — x¹⁸ с коэффициентом 2³.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вынести старшие степени x из скобок',
        detail: 'Не раскрывайте скобки! Вынесите x³ из числителя и x⁶ из знаменателя:',
        latex: '\\frac{x^{18}\\left(2 + \\frac{7}{x^2} - \\frac{1}{x^3}\\right)^6}{x^{18}\\left(2 - \\frac{13}{x^4} + \\frac{1}{x^5}\\right)^3}',
      },
      {
        title: 'Шаг 2 · Сократить x¹⁸ и перейти к пределу',
        detail: 'Все дроби с x в знаменателе стремятся к 0:',
        latex: '\\frac{2^6}{2^3} = 2^3 = 8',
      },
    ],
    code: '',
    expectedOutput: '8',
    answerLatex: '8',
    slides: [
      {lectureId: 'matan_tasks', page: 2, label: 'Комплект №1 · Задача 1.5 (стр. 2)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-1-6',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: '1.9 (5 б.)',
    title: 'Неопределённость 1^∞ с тригонометрией: (5 − 4/cos x)^(1/sin² 3x)',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→0} (5 − 4/cos x)^(1/sin²(3x))',
    problemTextClean: 'Вычислить предел:',
    problemLatex: '\\lim_{x \\to 0} \\left(5 - \\frac{4}{\\cos x}\\right)^{\\frac{1}{\\sin^2 3x}}',
    algorithmSummary:
      'Выделить единицу в основании 1 + α(x), выразить α(x) через 1 − cos x ~ x²/2 и применить эквивалентность sin(3x) ~ 3x в показателе.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить единицу в основании',
        detail: 'При x → 0 основание → 5 − 4 = 1, показатель → ∞ — это неопределённость [1^∞]:',
        latex: '5 - \\frac{4}{\\cos x} = 1 + 4 - \\frac{4}{\\cos x} = 1 - \\frac{4(1 - \\cos x)}{\\cos x}',
      },
      {
        title: 'Шаг 2 · Найти предел произведения α(x)·β(x)',
        detail: 'Используем эквивалентности 1 − cos x ~ x²/2 и sin 3x ~ 3x (а cos x → 1):',
        latex: '\\lim_{x \\to 0} \\frac{-4(1 - \\cos x)}{\\cos x \\cdot \\sin^2 3x} = \\lim_{x \\to 0} \\frac{-4 \\cdot \\frac{x^2}{2}}{1 \\cdot (3x)^2} = \\frac{-2}{9}',
      },
      {
        title: 'Шаг 3 · Ответ',
        detail: 'Возводим e в найденный предел:',
        latex: 'e^{-\\frac{2}{9}}',
      },
    ],
    code: '',
    expectedOutput: 'e^(-2/9)',
    answerLatex: 'e^{-\\frac{2}{9}}',
    slides: [
      {lectureId: 'matan_tasks', page: 3, label: 'Комплект №1 · Задача 1.9 (стр. 3)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-1-7',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'М1 · З.26',
    title: 'Разность радикалов при x → −∞: √(4x²+5x+1) − √(4x²−5x+1)',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→−∞} (√(4x²+5x+1) − √(4x²−5x+1))',
    problemTextClean: 'Вычислить предел (Методичка Ч.1, Задача 26):',
    problemLatex: '\\lim_{x \\to -\\infty} \\left(\\sqrt{4x^2 + 5x + 1} - \\sqrt{4x^2 - 5x + 1}\\right)',
    algorithmSummary:
      'Домножить на сопряжённую сумму корней, получить 10x в числителе и вынести |x| = −x при x → −∞ из знаменателя.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Домножить на сопряжённое выражение',
        detail: 'Неопределённость [∞ − ∞]. Используем (a − b)(a + b) = a² − b²:',
        latex: '\\frac{(4x^2 + 5x + 1) - (4x^2 - 5x + 1)}{\\sqrt{4x^2 + 5x + 1} + \\sqrt{4x^2 - 5x + 1}} = \\frac{10x}{\\sqrt{4x^2 + 5x + 1} + \\sqrt{4x^2 - 5x + 1}}',
      },
      {
        title: 'Шаг 2 · Вынести √(x²) = |x| = −x при x → −∞',
        detail: 'Поскольку x < 0, из-под каждого квадратного корня выносится −x:',
        latex: '\\frac{10x}{-x\\left(\\sqrt{4 + \\frac{5}{x} + \\frac{1}{x^2}} + \\sqrt{4 - \\frac{5}{x} + \\frac{1}{x^2}}\\right)}',
      },
      {
        title: 'Шаг 3 · Сократить на x и перейти к пределу',
        detail: 'Дроби 5/x и 1/x² стремятся к 0, √4 = 2:',
        latex: '\\frac{10}{-(2 + 2)} = -\\frac{10}{4} = -\\frac{5}{2}',
      },
    ],
    code: '',
    expectedOutput: '-5/2',
    answerLatex: '-\\frac{5}{2}',
    slides: [
      {lectureId: 'matan_metodichka_1', page: 27, label: 'Методичка Ч.1 · Задача 26 (стр. 27)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-1-8',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'М2 · К1',
    title: 'Тригонометрический предел при x → 1 через замену t = x − 1',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→1} arcsin²(3x − 3) / (1 + cos(πx))',
    problemTextClean: 'Вычислить предел (Методичка Ч.2, Контр. задание №1):',
    problemLatex: '\\lim_{x \\to 1} \\frac{\\arcsin^2(3x - 3)}{1 + \\cos(\\pi x)}',
    algorithmSummary:
      'Сделать замену t = x − 1 → 0, применить формулу приведения cos(π + πt) = −cos(πt) и таблицу эквивалентных б.м.ф.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Сдвиг переменной t = x − 1 → 0',
        detail: 'Подставляем x = 1 + t; в числителе 3x − 3 = 3t, в знаменателе cos(π(1 + t)) = −cos(πt):',
        latex: '\\lim_{t \\to 0} \\frac{\\arcsin^2(3t)}{1 - \\cos(\\pi t)}',
      },
      {
        title: 'Шаг 2 · Замена на эквивалентные б.м.ф. в частном',
        detail: 'При t → 0 имеем arcsin(3t) ~ 3t и 1 − cos(πt) ~ (πt)²/2:',
        latex: '\\lim_{t \\to 0} \\frac{(3t)^2}{\\frac{(\\pi t)^2}{2}} = \\lim_{t \\to 0} \\frac{9t^2}{\\frac{\\pi^2}{2}t^2} = \\frac{18}{\\pi^2}',
      },
    ],
    code: '',
    expectedOutput: '18/pi^2',
    answerLatex: '\\frac{18}{\\pi^2}',
    slides: [
      {lectureId: 'matan_metodichka_2', page: 27, label: 'Методичка Ч.2 · Контрольное задание №1 (стр. 27)', isAnswerSlide: true},
      {lectureId: 'matan_metodichka_2', page: 11, label: 'Методичка Ч.2 · Таблица эквивалентностей (стр. 11)'},
    ],
  },
  {
    id: 'matan-1-9',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'М2 · 1^∞',
    title: 'Показательно-степенной предел [1^∞] с кубическим корнем при x → 8',
    chapter: CH_LIM,
    problemStatement: 'Вычислить предел lim_{x→8} ((2x − 7)/(x + 1))^{1/(∛x − 2)}',
    problemTextClean: 'Вычислить предел (Методичка Ч.2, раскрытие 1^∞):',
    problemLatex: '\\lim_{x \\to 8} \\left(\\frac{2x - 7}{x + 1}\\right)^{\\frac{1}{\\sqrt[3]{x} - 2}}',
    algorithmSummary:
      'Выделить 1 в основании ((2x−7)/(x+1) − 1 = (x−8)/(x+1)), свести к exp(lim α·β) и разложить разность кубов x − 8.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Проверить [1^∞] и выделить единицу в основании',
        detail: 'При x = 8 основание равно 9/9 = 1, показатель 1/(2−2) = ∞. Вычитаем 1:',
        latex: '\\frac{2x - 7}{x + 1} - 1 = \\frac{2x - 7 - x - 1}{x + 1} = \\frac{x - 8}{x + 1}',
      },
      {
        title: 'Шаг 2 · Перейти к экспоненте и разложить разность кубов',
        detail: 'Используем формулу x − 8 = (∛x − 2)(∛(x²) + 2∛x + 4):',
        latex: '\\lim_{x \\to 8} \\frac{x - 8}{(x + 1)(\\sqrt[3]{x} - 2)} = \\lim_{x \\to 8} \\frac{\\sqrt[3]{x^2} + 2\\sqrt[3]{x} + 4}{x + 1} = \\frac{4 + 4 + 4}{8 + 1} = \\frac{12}{9} = \\frac{4}{3}',
      },
      {
        title: 'Шаг 3 · Записать ответ с основанием e',
        detail: 'Возводим e в найденный предел показателя:',
        latex: 'e^{\\frac{4}{3}}',
      },
    ],
    code: '',
    expectedOutput: 'e^(4/3)',
    answerLatex: 'e^{\\frac{4}{3}}',
    slides: [
      {lectureId: 'matan_metodichka_2', page: 12, label: 'Методичка Ч.2 · Раскрытие 1^∞ (стр. 12)', isAnswerSlide: true},
    ],
  },

  // ======================== КОМПЛЕКТ №2 · СРАВНЕНИЕ Б.М. И Б.Б. (5 баллов) ========================
  {
    id: 'matan-2-1',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: '2.1 (5 б.)',
    title: 'Сравнение б.м.ф. с корнями при x → 1',
    chapter: CH_LIM,
    problemStatement: 'Сравнить б.м.ф. α(x) = ∜x − 1 и β(x) = ∛x − 1 при x → 1',
    problemTextClean: 'Сравнить бесконечно малые функции при x → 1:',
    problemLatex: '\\alpha(x) = \\sqrt[4]{x} - 1, \\qquad \\beta(x) = \\sqrt[3]{x} - 1',
    algorithmSummary:
      'Сделать замену t = x − 1 → 0, применить эквивалентность (1 + t)^m − 1 ~ m·t и вычислить предел отношения α/β.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Свести стремление к нулю (t = x − 1 → 0)',
        detail: 'Подставляем x = 1 + t и применяем (1 + t)^m − 1 ~ m·t:',
        latex: '\\alpha = (1+t)^{1/4} - 1 \\sim \\frac{1}{4}t, \\qquad \\beta = (1+t)^{1/3} - 1 \\sim \\frac{1}{3}t',
      },
      {
        title: 'Шаг 2 · Вычислить предел отношения',
        detail: 'Делим главные части:',
        latex: '\\lim_{x \\to 1} \\frac{\\alpha(x)}{\\beta(x)} = \\lim_{t \\to 0} \\frac{\\frac{1}{4}t}{\\frac{1}{3}t} = \\frac{3}{4} \\neq 0, \\infty',
      },
      {
        title: 'Шаг 3 · Вывод',
        detail: 'Предел конечен и отличен от нуля (3/4 ≠ 1), следовательно α(x) и β(x) — б.м.ф. ОДНОГО ПОРЯДКА малости (но не эквивалентны).',
      },
    ],
    code: '',
    expectedOutput: 'одного порядка (предел 3/4)',
    answerLatex: '\\lim_{x \\to 1}\\frac{\\alpha(x)}{\\beta(x)} = \\frac{3}{4} \\implies \\text{б.м.ф. одного порядка}',
    slides: [
      {lectureId: 'matan_tasks', page: 10, label: 'Комплект №2 · Задача 2.1 (стр. 10)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-2-2',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: '2.4 (5 б.)',
    title: 'Порядок роста и главная часть б.б.ф. при x → +∞',
    chapter: CH_LIM,
    problemStatement: 'Определить порядок роста и главную часть б.б.ф. A(x) = (x⁵ + 3x² + 1) / √(x² + 4x + 5) относительно x при x → +∞',
    problemTextClean: 'Определить порядок роста и главную часть б.б.ф. относительно x при x → +∞:',
    problemLatex: 'A(x) = \\frac{x^5 + 3x^2 + 1}{\\sqrt{x^2 + 4x + 5}}',
    algorithmSummary:
      'Для б.б.ф. при x → +∞ выделять СТАРШИЕ степени числителя и знаменателя: x⁵ / x = x⁴ ⇒ порядок роста k = 4.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить главные части числителя и знаменателя',
        detail: 'При x → +∞ в сумме б.б.ф. остаётся слагаемое НАИВЫСШЕЙ степени (x > 0 ⇒ √(x²) = x):',
        latex: 'x^5 + 3x^2 + 1 \\sim x^5, \\qquad \\sqrt{x^2 + 4x + 5} \\sim \\sqrt{x^2} = x',
      },
      {
        title: 'Шаг 2 · Проверить предел отношения A(x) / x^k',
        detail: 'Подбираем k = 4 и проверяем предел:',
        latex: '\\lim_{x \\to +\\infty} \\frac{A(x)}{x^4} = \\lim_{x \\to +\\infty} \\frac{1 + \\frac{3}{x^3} + \\frac{1}{x^5}}{\\sqrt{1 + \\frac{4}{x} + \\frac{5}{x^2}}} = 1',
      },
    ],
    code: '',
    expectedOutput: 'порядок 4, главная часть x^4',
    answerLatex: 'k = 4, \\qquad A(x) \\sim x^4',
    slides: [
      {lectureId: 'matan_tasks', page: 10, label: 'Комплект №2 · Задача 2.4 (стр. 10)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-2-3',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: '2.5 (5 б.)',
    title: 'Порядок малости вложенных радикалов при x → +0',
    chapter: CH_LIM,
    problemStatement: 'Определить порядок малости и главную часть б.м.ф. α(x) = √(x + √(x + √x)) относительно x при x → +0',
    problemTextClean: 'Определить порядок малости и главную часть б.м.ф. относительно x при x → +0:',
    problemLatex: '\\alpha(x) = \\sqrt{x + \\sqrt{x + \\sqrt{x}}}',
    algorithmSummary:
      'При x → +0 более НИЗКАЯ степень x главнее (√x ≫ x), поэтому двигаемся изнутри наружу: √x → x^(1/4) → x^(1/8).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить главную часть изнутри наружу',
        detail: 'При x → +0 отношение x / √x = √x → 0, значит x = o(√x):',
        latex: '\\sqrt{x + \\sqrt{x}} = \\sqrt{\\sqrt{x}\\bigl(\\sqrt{x} + 1\\bigr)} \\sim x^{1/4}',
      },
      {
        title: 'Шаг 2 · Внешний корень',
        detail: 'Аналогично x / x^(1/4) = x^(3/4) → 0, поэтому главным остаётся x^(1/4):',
        latex: '\\alpha(x) = \\sqrt{x + x^{1/4}(1 + o(1))} \\sim \\sqrt{x^{1/4}} = x^{1/8}',
      },
      {
        title: 'Шаг 3 · Итог',
        detail: 'Порядок малости k = 1/8 (ниже первого порядка), главная часть — x^(1/8).',
      },
    ],
    code: '',
    expectedOutput: '1/8',
    answerLatex: 'k = \\frac{1}{8}, \\qquad \\alpha(x) \\sim x^{1/8}',
    slides: [
      {lectureId: 'matan_tasks', page: 10, label: 'Комплект №2 · Задача 2.5 (стр. 10)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-2-4',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: '2.7 (5 б.)',
    title: 'Сравнение б.м.ф. 2ˣ − 3ˣ и ln(1 + x) при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Сравнить б.м.ф. α(x) = 2ˣ − 3ˣ и β(x) = ln(1 + x) при x → 0',
    problemTextClean: 'Сравнить бесконечно малые функции при x → 0:',
    problemLatex: '\\alpha(x) = 2^x - 3^x, \\qquad \\beta(x) = \\ln(1 + x)',
    algorithmSummary:
      'Вынести 3ˣ (или записать (2ˣ−1)−(3ˣ−1)), использовать aˣ − 1 ~ x ln a и ln(1+x) ~ x.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выделить главную часть α(x)',
        detail: 'Вынесем 3ˣ, чтобы привести к стандартной эквивалентности aˣ − 1 ~ x ln a:',
        latex: '2^x - 3^x = 3^x\\left(\\left(\\frac{2}{3}\\right)^x - 1\\right) \\sim 1 \\cdot x\\ln\\frac{2}{3}',
      },
      {
        title: 'Шаг 2 · Вычислить предел отношения',
        detail: 'Так как β(x) = ln(1 + x) ~ x:',
        latex: '\\lim_{x \\to 0} \\frac{2^x - 3^x}{\\ln(1 + x)} = \\lim_{x \\to 0} \\frac{x\\ln\\frac{2}{3}}{x} = \\ln\\frac{2}{3} \\neq 0',
      },
    ],
    code: '',
    expectedOutput: 'одного порядка (ln(2/3))',
    answerLatex: '\\lim_{x \\to 0}\\frac{\\alpha(x)}{\\beta(x)} = \\ln\\frac{2}{3} \\implies \\text{б.м.ф. одного порядка}',
    slides: [
      {lectureId: 'matan_tasks', page: 11, label: 'Комплект №2 · Задача 2.7 (стр. 11)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-2-5',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: '2.9 (5 б.)',
    title: 'Порядок малости и главная часть sin(1 − cos x) при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Определить порядок малости и главную часть α(x) = sin(1 − cos x) относительно x при x → 0',
    problemTextClean: 'Определить порядок малости и главную часть б.м.ф. относительно x при x → 0:',
    problemLatex: '\\alpha(x) = \\sin(1 - \\cos x)',
    algorithmSummary:
      'Применить цепочку эквивалентностей: u = 1 − cos x → 0 ⇒ sin u ~ u ~ x²/2 ⇒ порядок k = 2.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Применить эквивалентность для внешнего sin u',
        detail: 'При x → 0 аргумент u = 1 − cos x → 0, поэтому sin(1 − cos x) ~ 1 − cos x.',
      },
      {
        title: 'Шаг 2 · Применить 1 − cos x ~ x²/2',
        detail: 'Получаем главную часть и проверяем предел отношения:',
        latex: '\\sin(1 - \\cos x) \\sim 1 - \\cos x \\sim \\frac{x^2}{2} \\implies \\lim_{x \\to 0} \\frac{\\alpha(x)}{x^2} = \\frac{1}{2}',
      },
    ],
    code: '',
    expectedOutput: '2',
    answerLatex: 'k = 2, \\qquad \\alpha(x) \\sim \\frac{1}{2}x^2',
    slides: [
      {lectureId: 'matan_tasks', page: 11, label: 'Комплект №2 · Задача 2.9 (стр. 11)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-2-6',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: '2.14 (5 б.)',
    title: 'Порядок малости разности tg x − sin x при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Определить порядок малости и главную часть α(x) = tg x − sin x относительно x при x → 0',
    problemTextClean: 'Определить порядок малости и главную часть б.м.ф. относительно x при x → 0:',
    problemLatex: '\\alpha(x) = \\operatorname{tg} x - \\sin x',
    algorithmSummary:
      'Свернуть разность в произведение sin x·(1 − cos x)/cos x, затем заменить множители: x·(x²/2)/1 = (1/2)x³ ⇒ порядок k = 3.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Свернуть разность в произведение',
        detail: 'Выносим общий множитель sin x:',
        latex: '\\operatorname{tg} x - \\sin x = \\frac{\\sin x}{\\cos x} - \\sin x = \\frac{\\sin x\\,(1 - \\cos x)}{\\cos x}',
      },
      {
        title: 'Шаг 2 · Заменить множители на эквивалентные',
        detail: 'При x → 0: sin x ~ x, 1 − cos x ~ x²/2, cos x → 1:',
        latex: '\\alpha(x) \\sim \\frac{x \\cdot \\frac{x^2}{2}}{1} = \\frac{1}{2}x^3 \\implies k = 3',
      },
    ],
    code: '',
    expectedOutput: '3',
    answerLatex: 'k = 3, \\qquad \\alpha(x) \\sim \\frac{1}{2}x^3',
    slides: [
      {lectureId: 'matan_tasks', page: 12, label: 'Комплект №2 · Задача 2.14 (стр. 12)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-2-7',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'М2 · Пр.19',
    title: 'Главная часть и порядок б.м.ф. при x → 1: (2x − 1 − x²)/(x² + 2)',
    chapter: CH_LIM,
    problemStatement: 'Выделить главную часть вида C(x−1)^k и найти порядок малости функции f(x) = (2x − 1 − x²)/(x² + 2) при x → 1.',
    problemTextClean: 'Выделить главную часть вида C(x − 1)^k и порядок малости k при x → 1 (Методичка Ч.2, Пример 19):',
    problemLatex: 'f(x) = \\frac{2x - 1 - x^2}{x^2 + 2}, \\qquad x \\to 1',
    algorithmSummary:
      'Свернуть числитель в полный квадрат −(x − 1)² и подставить x = 1 в непрерывный ненулевой знаменатель x² + 2 → 3.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Разложить числитель по степеням (x − 1)',
        detail: 'Замечаем формулу квадрата разности с минусом:',
        latex: '2x - 1 - x^2 = -(x^2 - 2x + 1) = -(x - 1)^2',
      },
      {
        title: 'Шаг 2 · Вычислить предел отношения к (x − 1)²',
        detail: 'Знаменатель x² + 2 при x → 1 стремится к 3 ≠ 0:',
        latex: '\\lim_{x \\to 1} \\frac{f(x)}{(x - 1)^2} = \\lim_{x \\to 1} \\frac{-1}{x^2 + 2} = -\\frac{1}{3} \\implies f(x) \\sim -\\frac{1}{3}(x - 1)^2,\\; k = 2',
      },
    ],
    code: '',
    expectedOutput: '-1/3 (x-1)^2, k = 2',
    answerLatex: 'f(x) \\sim -\\frac{1}{3}(x - 1)^2, \\qquad k = 2',
    slides: [
      {lectureId: 'matan_metodichka_2', page: 16, label: 'Методичка Ч.2 · Пример 19 и таблица б.м.ф. (стр. 16)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-2-8',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'М2 · Пр.22',
    title: 'Главная часть и порядок роста б.б.ф. при x → ∞: (2x⁵)/(1 − x³)',
    chapter: CH_LIM,
    problemStatement: 'Выделить главную часть вида C·x^k и порядок роста б.б.ф. f(x) = (2x⁵)/(1 − x³) при x → ∞.',
    problemTextClean: 'Выделить главную часть C·x^k и порядок роста k б.б.ф. при x → ∞ (Методичка Ч.2, Пример 22):',
    problemLatex: 'f(x) = \\frac{2x^5}{1 - x^3}, \\qquad x \\to \\infty',
    algorithmSummary:
      'В знаменателе 1 − x³ при x → ∞ главной частью является старшая степень −x³, откуда дробь эквивалентна −2x² (k = 2).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Заменить знаменатель на главную часть б.б.ф.',
        detail: 'При x → ∞ единица пренебрежимо мала по сравнению с −x³:',
        latex: '1 - x^3 \\sim -x^3 \\quad (x \\to \\infty)',
      },
      {
        title: 'Шаг 2 · Найти главную часть дроби и порядок k',
        detail: 'Делим главные части числителя и знаменателя:',
        latex: 'f(x) \\sim \\frac{2x^5}{-x^3} = -2x^2 \\implies C = -2,\\; k = 2',
      },
    ],
    code: '',
    expectedOutput: '-2x^2, k = 2',
    answerLatex: 'f(x) \\sim -2x^2, \\qquad k = 2',
    slides: [
      {lectureId: 'matan_metodichka_2', page: 20, label: 'Методичка Ч.2 · Таблица главных частей б.б.ф. и Пример 22 (стр. 20)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-2-9',
    category: 'matan',
    kind: 'matan-2',
    badgeNumber: 'М2 · Лов.',
    title: 'Главная часть разности б.м.ф. ln(1 + 2x) − 2x при x → 0',
    chapter: CH_LIM,
    problemStatement: 'Выделить главную часть вида C·x^k и порядок малости б.м.ф. f(x) = ln(1 + 2x) − 2x при x → 0.',
    problemTextClean: 'Выделить главную часть C·x^k и порядок малости k при x → 0 (ловушка замены в разности!):',
    problemLatex: 'f(x) = \\ln(1 + 2x) - 2x, \\qquad x \\to 0',
    algorithmSummary:
      'Заменять ln(1 + 2x) ~ 2x в разности нельзя (будет 0)! Нужно разложить ln(1 + u) = u − u²/2 + o(u²) при u = 2x ⇒ −2x².',
    explanationSteps: [
      {
        title: 'Шаг 1 · Почему нельзя писать ln(1 + 2x) ~ 2x',
        detail: 'При прямой замене получим 2x − 2x = 0 — главные линейные части взаимно уничтожаются! Требуется второй член разложения.',
      },
      {
        title: 'Шаг 2 · Разложение Маклорена для ln(1 + 2x)',
        detail: 'Подставляем u = 2x в ln(1 + u) = u − u²/2 + o(u²):',
        latex: '\\ln(1 + 2x) - 2x = \\left(2x - \\frac{(2x)^2}{2} + o(x^2)\\right) - 2x = -2x^2 + o(x^2)',
      },
      {
        title: 'Шаг 3 · Ответ: главная часть и порядок малости',
        detail: 'Проверка через Лопиталя также даёт lim (ln(1+2x)−2x)/x² = lim (2/(1+2x) − 2)/(2x) = −2:',
        latex: 'f(x) \\sim -2x^2, \\qquad k = 2',
      },
    ],
    code: '',
    expectedOutput: '-2x^2, k = 2',
    answerLatex: 'f(x) \\sim -2x^2, \\qquad k = 2',
    slides: [
      {lectureId: 'matan_metodichka_2', page: 13, label: 'Методичка Ч.2 · Запрет замены в разности (стр. 13)', isAnswerSlide: true},
      {lectureId: 'matan_metodichka_2', page: 28, label: 'Методичка Ч.2 · Контрольное задание №2 (стр. 28)'},
    ],
  },

  // ======================== КОМПЛЕКТ №3 · НЕПРЕРЫВНОСТЬ И РАЗРЫВЫ (5 баллов) ========================
  {
    id: 'matan-3-1',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: '3.1 (5 б.)',
    title: 'Кусочная функция с тремя подозрительными точками (x = −1, 0, 1)',
    chapter: CH_CONT,
    problemStatement: 'Исследовать функцию на непрерывность и классифицировать точки разрыва: f(x) = 1/(x+1) при x < 0 и arctg(1/(x−1)) при x ≥ 0',
    problemTextClean: 'Исследовать функцию на непрерывность и указать род всех точек разрыва:',
    problemLatex: 'f(x) = \\begin{cases} \\dfrac{1}{x + 1}, & x < 0, \\\\[8pt] \\operatorname{arctg}\\dfrac{1}{x - 1}, & x \\ge 0. \\end{cases}',
    algorithmSummary:
      'Проверить все 3 подозрительные точки: нули знаменателей (x = −1 на x < 0; x = 1 на x ≥ 0) и точку стыка x = 0.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Точка x = −1 (знаменатель первой ветви)',
        detail: 'Оба односторонних предела бесконечны ⇒ разрыв II рода:',
        latex: '\\lim_{x \\to -1-0} \\frac{1}{x+1} = -\\infty, \\quad \\lim_{x \\to -1+0} \\frac{1}{x+1} = +\\infty \\implies \\text{II род}',
      },
      {
        title: 'Шаг 2 · Точка стыка x = 0',
        detail: 'Вычисляем левый и правый пределы — оба конечны, но не равны ⇒ разрыв I рода (скачок):',
        latex: '\\lim_{x \\to 0-0} \\frac{1}{x+1} = 1, \\quad \\lim_{x \\to 0+0} \\operatorname{arctg}\\frac{1}{x-1} = \\operatorname{arctg}(-1) = -\\frac{\\pi}{4} \\implies \\text{I род}',
      },
      {
        title: 'Шаг 3 · Точка x = 1 (знаменатель под arctg)',
        detail: 'Ловушка! Хотя 1/(x−1) → ±∞, сам arctg имеет КОНЕЧНЫЕ пределы ±π/2 ⇒ это разрыв I рода (скачок π):',
        latex: '\\lim_{x \\to 1-0} \\operatorname{arctg}\\frac{1}{x-1} = -\\frac{\\pi}{2}, \\quad \\lim_{x \\to 1+0} \\operatorname{arctg}\\frac{1}{x-1} = +\\frac{\\pi}{2} \\implies \\text{I род}',
      },
    ],
    code: '',
    expectedOutput: 'x = -1 (II род), x = 0 (I род), x = 1 (I род)',
    answerLatex: 'x = -1:\\; \\text{II род}; \\qquad x = 0:\\; \\text{I род (скачок)}; \\qquad x = 1:\\; \\text{I род (скачок } \\pi\\text{)}',
    slides: [
      {lectureId: 'matan_tasks', page: 15, label: 'Комплект №3 · Задача 3.1 (стр. 15)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-3-2',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: '3.15 (5 б.)',
    title: 'Рациональная дробь: устранимый разрыв I рода и разрыв II рода',
    chapter: CH_CONT,
    problemStatement: 'Найти и классифицировать точки разрыва функции f(x) = (x² − 4) / (x² + x − 6)',
    problemTextClean: 'Найти точки разрыва функции и определить их род:',
    problemLatex: 'f(x) = \\frac{x^2 - 4}{x^2 + x - 6}',
    algorithmSummary:
      'Разложить числитель и знаменатель на множители: корень, который сокращается (x = 2), даёт устранимый разрыв I рода; несократимый (x = −3) — разрыв II рода.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти нули знаменателя и разложить на множители',
        detail: 'x² + x − 6 = (x − 2)(x + 3) ⇒ подозрительные точки x = 2 и x = −3:',
        latex: 'f(x) = \\frac{(x - 2)(x + 2)}{(x - 2)(x + 3)}',
      },
      {
        title: 'Шаг 2 · Исследовать точку x = 2',
        detail: 'f(2) не определена, но двусторонний предел конечен ⇒ устранимый разрыв I рода:',
        latex: '\\lim_{x \\to 2} \\frac{x + 2}{x + 3} = \\frac{4}{5} \\implies x = 2 \\text{ — устранимый разрыв I рода}',
      },
      {
        title: 'Шаг 3 · Исследовать точку x = −3',
        detail: 'Числитель → −1 ≠ 0, знаменатель → 0 ⇒ бесконечные пределы (разрыв II рода):',
        latex: '\\lim_{x \\to -3-0} f(x) = +\\infty, \\quad \\lim_{x \\to -3+0} f(x) = -\\infty \\implies x = -3 \\text{ — II род}',
      },
    ],
    code: '',
    expectedOutput: 'x = 2 (I род устранимый), x = -3 (II род)',
    answerLatex: 'x = 2:\\; \\text{устранимый I рода } (\\lim = \\tfrac{4}{5}); \\qquad x = -3:\\; \\text{II рода}',
    slides: [
      {lectureId: 'matan_tasks', page: 17, label: 'Комплект №3 · Задача 3.15 (стр. 17)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-3-3',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: '3.5 (5 б.)',
    title: 'Экспонента с дробным показателем: 1 − e^(−1/(x² − 1))',
    chapter: CH_CONT,
    problemStatement: 'Найти и классифицировать точки разрыва функции f(x) = 1 − e^(−1/(x² − 1))',
    problemTextClean: 'Найти точки разрыва функции и определить их род:',
    problemLatex: 'f(x) = 1 - e^{-\\frac{1}{x^2 - 1}}',
    algorithmSummary:
      'Подозрительные точки x = ±1. В каждой из них один односторонний предел равен 1, а другой равен −∞ ⇒ обе точки — разрывы II рода.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Точка x = 1',
        detail: 'Проверяем знак x² − 1 справа (+0) и слева (−0) от единицы:',
        latex: '\\lim_{x \\to 1+0} \\left(1 - e^{-\\frac{1}{+0}}\\right) = 1 - 0 = 1, \\qquad \\lim_{x \\to 1-0} \\left(1 - e^{+\\infty}\\right) = -\\infty',
      },
      {
        title: 'Шаг 2 · Точка x = −1',
        detail: 'Функция чётная, поэтому пределы меняются местами: слева 1, справа −∞:',
        latex: '\\lim_{x \\to -1-0} f(x) = 1, \\qquad \\lim_{x \\to -1+0} f(x) = -\\infty',
      },
      {
        title: 'Шаг 3 · Вывод',
        detail: 'В обеих точках x = −1 и x = 1 существует бесконечный односторонний предел ⇒ обе точки являются точками разрыва II рода.',
      },
    ],
    code: '',
    expectedOutput: 'x = -1, x = 1 (оба II рода)',
    answerLatex: 'x = -1,\\; x = 1:\\; \\text{точки разрыва II рода}',
    slides: [
      {lectureId: 'matan_tasks', page: 15, label: 'Комплект №3 · Задача 3.5 (стр. 15)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-3-4',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: '3.6 (5 б.)',
    title: 'Кусочная функция на трёх интервалах (стыки x = 0 и x = π)',
    chapter: CH_CONT,
    problemStatement: 'Исследовать функцию на непрерывность: arctg(1/x) при x < 0; x/4 при 0 ≤ x ≤ π; (π/4)cos(x − π) при x > π',
    problemTextClean: 'Исследовать функцию на непрерывность и классифицировать точки разрыва:',
    problemLatex: 'f(x) = \\begin{cases} \\operatorname{arctg}\\dfrac{1}{x}, & x < 0, \\\\[6pt] \\dfrac{x}{4}, & 0 \\le x \\le \\pi, \\\\[6pt] \\dfrac{\\pi}{4}\\cos(x - \\pi), & x > \\pi. \\end{cases}',
    algorithmSummary:
      'Внутри каждого промежутка ветви элементарны и непрерывны. Проверяем стыки x = 0 (скачок I рода) и x = π (непрерывна).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Стык x = 0',
        detail: 'Находим левый, правый пределы и значение f(0):',
        latex: 'f(0-0) = \\lim_{x \\to 0-0} \\operatorname{arctg}\\frac{1}{x} = -\\frac{\\pi}{2}, \\quad f(0+0) = f(0) = 0',
      },
      {
        title: 'Шаг 2 · Стык x = π',
        detail: 'Сравниваем левый, правый пределы и f(π):',
        latex: 'f(\\pi - 0) = f(\\pi) = \\frac{\\pi}{4}, \\quad f(\\pi + 0) = \\frac{\\pi}{4}\\cos 0 = \\frac{\\pi}{4}',
      },
      {
        title: 'Шаг 3 · Вывод',
        detail: 'В точке x = 0 — разрыв I рода со скачком h = π/2; в точке x = π функция непрерывна.',
      },
    ],
    code: '',
    expectedOutput: 'x = 0 (I род), x = pi (непрерывна)',
    answerLatex: 'x = 0:\\; \\text{I род (скачок } \\tfrac{\\pi}{2}\\text{)}; \\qquad x = \\pi:\\; \\text{непрерывна}',
    slides: [
      {lectureId: 'matan_tasks', page: 16, label: 'Комплект №3 · Задача 3.6 (стр. 16)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-3-5',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: '3.12 (5 б.)',
    title: 'Логистическая дробь 1 / (1 + 2^(1/(x−3))): скачок I рода',
    chapter: CH_CONT,
    problemStatement: 'Найти и классифицировать точки разрыва функции f(x) = 1 / (1 + 2^(1/(x−3)))',
    problemTextClean: 'Найти точки разрыва функции и определить их род:',
    problemLatex: 'f(x) = \\frac{1}{1 + 2^{\\frac{1}{x - 3}}}',
    algorithmSummary:
      'Единственная подозрительная точка x = 3 (знаменатель 1 + 2^(...) > 1 > 0). Слева предел 1, справа 0 ⇒ разрыв I рода (скачок).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Предел справа (x → 3 + 0)',
        detail: 'Показатель 1/(x − 3) → +∞ ⇒ 2^(+∞) = +∞:',
        latex: '\\lim_{x \\to 3+0} \\frac{1}{1 + 2^{\\frac{1}{x-3}}} = \\frac{1}{1 + \\infty} = 0',
      },
      {
        title: 'Шаг 2 · Предел слева (x → 3 − 0)',
        detail: 'Показатель 1/(x − 3) → −∞ ⇒ 2^(−∞) = 0:',
        latex: '\\lim_{x \\to 3-0} \\frac{1}{1 + 2^{\\frac{1}{x-3}}} = \\frac{1}{1 + 0} = 1',
      },
      {
        title: 'Шаг 3 · Вывод',
        detail: 'Оба односторонних предела конечны (1 ≠ 0) ⇒ x = 3 — точка разрыва I рода (скачок h = −1).',
      },
    ],
    code: '',
    expectedOutput: 'x = 3 (I род, скачок -1)',
    answerLatex: 'x = 3:\\; \\text{разрыв I рода (скачок } h = 0 - 1 = -1\\text{)}',
    slides: [
      {lectureId: 'matan_tasks', page: 17, label: 'Комплект №3 · Задача 3.12 (стр. 17)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-3-6',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: '3.21 (5 б.)',
    title: 'Подбор параметра a для непрерывности функции на всей оси R',
    chapter: CH_CONT,
    problemStatement: 'Подобрать значение параметра a так, чтобы функция f(x) = (sin 3x)/x при x ≠ 0 и f(0) = a была непрерывна на R',
    problemTextClean: 'Подобрать значение параметра a так, чтобы функция была непрерывна на всей оси ℝ:',
    problemLatex: 'f(x) = \\begin{cases} \\dfrac{\\sin 3x}{x}, & x \\neq 0, \\\\[6pt] a, & x = 0. \\end{cases}',
    algorithmSummary:
      'По определению непрерывности приравнять f(0) = a к пределу lim_{x→0} (sin 3x)/x = 3.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Вычислить предел при x → 0',
        detail: 'Используем первый замечательный предел sin(3x) ~ 3x:',
        latex: '\\lim_{x \\to 0} \\frac{\\sin 3x}{x} = 3 \\lim_{x \\to 0} \\frac{\\sin 3x}{3x} = 3',
      },
      {
        title: 'Шаг 2 · Приравнять к значению в точке',
        detail: 'Для непрерывности в x = 0 необходимо и достаточно f(0) = lim_{x→0} f(x):',
        latex: 'a = 3',
      },
    ],
    code: '',
    expectedOutput: '3',
    answerLatex: 'a = 3',
    slides: [
      {lectureId: 'matan_tasks', page: 18, label: 'Комплект №3 · Задача 3.21 (стр. 18)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-3-7',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'М3 · Пр.12',
    title: 'Полное исследование кусочной функции с 3 ветвями (стыки 0, 2 и разрыв 1)',
    chapter: CH_CONT,
    problemStatement: 'Исследовать на непрерывность и классифицировать точки разрыва кусочной функции f(x) = (4^x−2)/(2x−1) при x ≤ 0; 1/(x−1) при 0 < x ≤ 2; 2x − 3 при x > 2.',
    problemTextClean: 'Найти все точки разрыва и определить их род (Методичка Ч.3, Пример 12):',
    problemLatex: 'f(x) = \\begin{cases} \\dfrac{4^x - 2}{2x - 1}, & x \\le 0, \\\\[6pt] \\dfrac{1}{x - 1}, & 0 < x \\le 2, \\\\[6pt] 2x - 3, & x > 2 \\end{cases}',
    algorithmSummary:
      'Проверить точки стыка x = 0 и x = 2 плюс ноль знаменателя x = 1 (x = 1/2 не входит в ветвь x ≤ 0!). В 0 — I род (скачок −2), в 1 — II род, в 2 — непрерывна.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Выписать подозрительные точки',
        detail: 'Для первой ветви 2x − 1 = 0 при x = 1/2, но 1/2 ∉ (−∞, 0], поэтому x = 1/2 НЕ проверяем! Остаются: x = 0 (стык), x = 1 (ноль знаменателя второй ветви), x = 2 (стык).',
      },
      {
        title: 'Шаг 2 · Исследовать точку x = 0',
        detail: 'Левый и правый пределы конечны, но различны ⇒ разрыв I рода со скачком Δf(0) = −1 − 1 = −2:',
        latex: 'f(0-0)=f(0)=\\frac{4^0-2}{-1}=1, \\qquad f(0+0)=\\frac{1}{0-1}=-1',
      },
      {
        title: 'Шаг 3 · Исследовать точки x = 1 и x = 2',
        detail: 'В x = 1 пределы бесконечны (II род). В x = 2 оба односторонних предела и f(2) равны 1 ⇒ функция непрерывна!',
        latex: 'f(1\\pm 0)=\\pm\\infty \\;\\text{(II род)}; \\qquad f(2-0)=f(2)=1=f(2+0) \\;\\text{(непрерывна)}',
      },
    ],
    code: '',
    expectedOutput: 'x = 0 (I род, скачок -2), x = 1 (II род); в x = 2 непрерывна',
    answerLatex: 'x=0 \\text{ — I род } (\\Delta=-2), \\quad x=1 \\text{ — II род}, \\quad x=2 \\text{ — непрерывна}',
    slides: [
      {lectureId: 'matan_metodichka_3', page: 19, label: 'Методичка Ч.3 · Пример 12: разбор кусочной функции (стр. 19)', isAnswerSlide: true},
      {lectureId: 'matan_metodichka_3', page: 20, label: 'Методичка Ч.3 · График и итог Примера 12 (стр. 20)'},
    ],
  },
  {
    id: 'matan-3-8',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'М3 · С.2',
    title: 'Классификация разрыва y = arctg(1/(x − 4)) и величина скачка',
    chapter: CH_CONT,
    problemStatement: 'Найти точки разрыва функции y = arctg(1/(x − 4)), определить их род и величину скачка.',
    problemTextClean: 'Найти точку разрыва, её род и величину скачка (Методичка Ч.3, стр. 13 и 24):',
    problemLatex: 'y = \\operatorname{arctg}\\frac{1}{x - 4}',
    algorithmSummary:
      'В единственной точке разрыва x = 4 аргумент стремится к ±∞, но сам arctg имеет конечные пределы −π/2 и +π/2 ⇒ I род, скачок π.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Область определения',
        detail: 'Элементарная функция непрерывна всюду на D(f) = ℝ \\ {4}. Единственная точка разрыва: x = 4.',
      },
      {
        title: 'Шаг 2 · Односторонние пределы и скачок',
        detail: 'Вычисляем пределы слева и справа от x = 4:',
        latex: 'f(4-0)=\\operatorname{arctg}(-\\infty)=-\\frac{\\pi}{2}, \\quad f(4+0)=\\operatorname{arctg}(+\\infty)=\\frac{\\pi}{2} \\implies \\Delta f(4)=\\pi',
      },
    ],
    code: '',
    expectedOutput: 'x = 4, I род, скачок pi',
    answerLatex: 'x = 4 \\text{ — разрыв I рода}, \\qquad \\Delta f(4) = \\pi',
    slides: [
      {lectureId: 'matan_metodichka_3', page: 13, label: 'Методичка Ч.3 · Пример arctg(1/(x−4)) (стр. 13)', isAnswerSlide: true},
      {lectureId: 'matan_metodichka_3', page: 24, label: 'Методичка Ч.3 · Задачи для самоконтроля (стр. 24)'},
    ],
  },
  {
    id: 'matan-3-9',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'М3 · С.6',
    title: 'Устранимый разрыв и доопределение по непрерывности: (x² − 25)/(x − 5)',
    chapter: CH_CONT,
    problemStatement: 'Исследовать точку разрыва функции y = (x² − 25)/(x − 5) и доопределить функцию по непрерывности.',
    problemTextClean: 'Исследовать точку разрыва и указать доопределение f(5) (Методичка Ч.3, стр. 15):',
    problemLatex: 'y = \\frac{x^2 - 25}{x - 5}',
    algorithmSummary:
      'Точка x = 5 не входит в D(f), но после сокращения (x−5) предел равен 10 ⇒ устранимый разрыв, доопределяем f(5) = 10.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти точку разрыва и вычислить предел',
        detail: 'При x ≠ 5 сокращаем дробь по формуле разности квадратов:',
        latex: '\\lim_{x \\to 5} \\frac{x^2 - 25}{x - 5} = \\lim_{x \\to 5} \\frac{(x - 5)(x + 5)}{x - 5} = \\lim_{x \\to 5}(x + 5) = 10',
      },
      {
        title: 'Шаг 2 · Классификация и доопределение',
        detail: 'Оба односторонних предела конечны и равны 10, но f(5) не определена ⇒ x = 5 — устранимый разрыв. Доопределяем f(5) = 10.',
        latex: 'x = 5 \\text{ — устранимый разрыв}, \\qquad f(5) := 10',
      },
    ],
    code: '',
    expectedOutput: 'x = 5, устранимый, f(5) = 10',
    answerLatex: 'x = 5 \\text{ — устранимый разрыв}, \\qquad f(5) = 10',
    slides: [
      {lectureId: 'matan_metodichka_3', page: 15, label: 'Методичка Ч.3 · Пример устранимого разрыва (стр. 15)', isAnswerSlide: true},
    ],
  },

  // ======================== КОМПЛЕКТ №4 · КАСАТЕЛЬНАЯ И ТЕЙЛОР (6 баллов) ========================
  {
    id: 'matan-4-1',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: '4.1 (6 б.)',
    title: 'Касательные и нормали к кривой y = e^(1−x²) при y = 1',
    chapter: CH_MVT,
    problemStatement: 'Составить уравнения касательных и нормалей к графику y = e^(1−x²) в точках его пересечения с прямой y = 1',
    problemTextClean: 'Составить уравнения касательных и нормалей к кривой в точках её пересечения с прямой y = 1:',
    problemLatex: 'y = e^{1 - x^2}, \\qquad y = 1',
    algorithmSummary:
      'Найти точки пересечения (±1, 1), вычислить y′ = −2x e^(1−x²), затем подставить в формулы касательной y − y₀ = k(x − x₀) и нормали y − y₀ = −(1/k)(x − x₀).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти точки пересечения с y = 1',
        detail: 'Решаем уравнение e^(1−x²) = 1 ⇒ 1 − x² = 0 ⇒ x₁ = −1, x₂ = 1:',
        latex: 'M_1(-1,\\, 1), \\qquad M_2(1,\\, 1)',
      },
      {
        title: 'Шаг 2 · Найти производную и угловые коэффициенты',
        detail: 'Дифференцируем сложную экспоненту:',
        latex: "y' = -2x\\,e^{1 - x^2} \\implies y'(-1) = 2,\\; y'(1) = -2",
      },
      {
        title: 'Шаг 3 · Записать уравнения касательных и нормалей',
        detail: 'Для M₁(−1, 1) (k = 2) и для M₂(1, 1) (k = −2):',
        latex: 'M_1:\\; y_{\\text{кас}} = 2x + 3,\\; y_{\\text{норм}} = -\\tfrac{1}{2}x + \\tfrac{1}{2}; \\qquad M_2:\\; y_{\\text{кас}} = -2x + 3,\\; y_{\\text{норм}} = \\tfrac{1}{2}x + \\tfrac{1}{2}',
      },
    ],
    code: '',
    expectedOutput: 'M1(-1,1): y=2x+3, y=-0.5x+0.5; M2(1,1): y=-2x+3, y=0.5x+0.5',
    answerLatex: 'M_1(-1,1):\\; y=2x+3,\\; y=-\\tfrac{1}{2}x+\\tfrac{1}{2}; \\quad M_2(1,1):\\; y=-2x+3,\\; y=\\tfrac{1}{2}x+\\tfrac{1}{2}',
    slides: [
      {lectureId: 'matan_tasks', page: 20, label: 'Комплект №4 · Задача 4.1 (стр. 20)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-4-2',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: '4.4 (6 б.)',
    title: 'Касательная к y = ln x, параллельная прямой y = x',
    chapter: CH_MVT,
    problemStatement: 'В какой точке касательная к графику y = ln x параллельна прямой y = x? Написать уравнение этой касательной.',
    problemTextClean: 'Найти точку касания и уравнение касательной к кривой, параллельной прямой y = x:',
    problemLatex: 'y = \\ln x \\;\\parallel\\; y = x',
    algorithmSummary:
      'Параллельность означает равенство угловых коэффициентов: y′(x₀) = 1/x₀ = 1 ⇒ x₀ = 1, y₀ = 0 ⇒ y = x − 1.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Приравнять производную угловому коэффициенту прямой',
        detail: 'У прямой y = x угловой коэффициент k = 1:',
        latex: "y'(x_0) = \\frac{1}{x_0} = 1 \\implies x_0 = 1,\\quad y_0 = \\ln 1 = 0",
      },
      {
        title: 'Шаг 2 · Записать уравнение касательной',
        detail: 'Подставляем точку (1, 0) и k = 1:',
        latex: 'y - 0 = 1\\cdot(x - 1) \\implies y = x - 1',
      },
    ],
    code: '',
    expectedOutput: '(1, 0), y = x - 1',
    answerLatex: '\\text{Точка } (1,\\, 0), \\qquad y = x - 1',
    slides: [
      {lectureId: 'matan_tasks', page: 20, label: 'Комплект №4 · Задача 4.4 (стр. 20)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-4-3',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: '4.5 (6 б.)',
    title: 'Вычисление предела по формуле Маклорена (порядок x³)',
    chapter: CH_MVT,
    problemStatement: 'Вычислить предел с помощью формулы Тейлора: lim_{x→0} (eˣ − e^(−x) − 2x) / (x − sin x)',
    problemTextClean: 'Вычислить предел с помощью формулы Тейлора (Маклорена):',
    problemLatex: '\\lim_{x \\to 0} \\frac{e^x - e^{-x} - 2x}{x - \\sin x}',
    algorithmSummary:
      'Разложить eˣ, e^(−x) и sin x по Маклорену до x³ с остатком Пеано o(x³): в числителе останется x³/3, в знаменателе x³/6 ⇒ ответ 2.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Разложить числитель до x³',
        detail: 'Чётные степени в eˣ − e^(−x) сокращаются, линейные слагаемые 2x уничтожаются:',
        latex: 'e^x - e^{-x} - 2x = \\left(1 + x + \\frac{x^2}{2} + \\frac{x^3}{6}\\right) - \\left(1 - x + \\frac{x^2}{2} - \\frac{x^3}{6}\\right) - 2x + o(x^3) = \\frac{x^3}{3} + o(x^3)',
      },
      {
        title: 'Шаг 2 · Разложить знаменатель до x³',
        detail: 'Подставляем sin x = x − x³/6 + o(x³):',
        latex: 'x - \\sin x = \\frac{x^3}{6} + o(x^3)',
      },
      {
        title: 'Шаг 3 · Вычислить предел',
        detail: 'Делим числитель и знаменатель на x³:',
        latex: '\\lim_{x \\to 0} \\frac{\\frac{1}{3}x^3 + o(x^3)}{\\frac{1}{6}x^3 + o(x^3)} = \\frac{1/3}{1/6} = 2',
      },
    ],
    code: '',
    expectedOutput: '2',
    answerLatex: '2',
    slides: [
      {lectureId: 'matan_tasks', page: 21, label: 'Комплект №4 · Задача 4.5 (стр. 21)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-4-4',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: '4.7 (6 б.)',
    title: 'Предел с произведением разложений: (eˣ sin x − x(1+x)) / x³',
    chapter: CH_MVT,
    problemStatement: 'Вычислить предел по формуле Маклорена: lim_{x→0} (eˣ sin x − x(1 + x)) / x³',
    problemTextClean: 'Вычислить предел с помощью формулы Маклорена:',
    problemLatex: '\\lim_{x \\to 0} \\frac{e^x \\sin x - x(1 + x)}{x^3}',
    algorithmSummary:
      'Перемножить разложения eˣ (до x²) и sin x (до x³), удержав все члены до x³ включительно: x + x² + x³/3 + o(x³) ⇒ ответ 1/3.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Перемножить разложения eˣ и sin x до x³',
        detail: 'Т.к. sin x начинается с x, достаточно разложить eˣ до x², а sin x до x³:',
        latex: 'e^x \\sin x = \\left(1 + x + \\frac{x^2}{2} + o(x^2)\\right)\\left(x - \\frac{x^3}{6} + o(x^3)\\right) = x + x^2 + \\left(\\frac{1}{2} - \\frac{1}{6}\\right)x^3 + o(x^3)',
      },
      {
        title: 'Шаг 2 · Вычесть x(1+x) и разделить на x³',
        detail: 'Коэффициент при x³ равен 1/2 − 1/6 = 1/3:',
        latex: '\\lim_{x \\to 0} \\frac{\\frac{1}{3}x^3 + o(x^3)}{x^3} = \\frac{1}{3}',
      },
    ],
    code: '',
    expectedOutput: '1/3',
    answerLatex: '\\frac{1}{3}',
    slides: [
      {lectureId: 'matan_tasks', page: 21, label: 'Комплект №4 · Задача 4.7 (стр. 21)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-4-5',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: '4.8 (6 б.)',
    title: 'Разложение f(x) = 1/x по формуле Тейлора в точке x₀ = 1',
    chapter: CH_MVT,
    problemStatement: 'Разложить функцию f(x) = 1/x по формуле Тейлора в окрестности точки x₀ = 1 до 3-й степени с остатком в форме Пеано',
    problemTextClean: 'Разложить функцию по формуле Тейлора в точке x₀ = 1 до (x − 1)³ с остатком в форме Пеано:',
    problemLatex: 'f(x) = \\frac{1}{x}, \\qquad x_0 = 1',
    algorithmSummary:
      'Сделать замену t = x − 1 ⇒ 1/(1+t) = 1 − t + t² − t³ + o(t³) (либо посчитать производные f⁽ᵏ⁾(1) = (−1)ᵏ k!).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Быстрый способ: замена t = x − 1',
        detail: 'Подставляем x = 1 + t и используем стандартное разложение (1 + t)⁻¹:',
        latex: '\\frac{1}{x} = \\frac{1}{1 + t} = 1 - t + t^2 - t^3 + o(t^3)',
      },
      {
        title: 'Шаг 2 · Проверка через производные в x₀ = 1',
        detail: 'f(1) = 1, f′(1) = −1, f″(1) = 2, f‴(1) = −6 ⇒ коэффициенты f⁽ᵏ⁾(1)/k! равны 1, −1, +1, −1:',
        latex: '\\frac{1}{x} = 1 - (x - 1) + (x - 1)^2 - (x - 1)^3 + o\\bigl((x - 1)^3\\bigr)',
      },
    ],
    code: '',
    expectedOutput: '1 - (x-1) + (x-1)^2 - (x-1)^3 + o((x-1)^3)',
    answerLatex: '1 - (x - 1) + (x - 1)^2 - (x - 1)^3 + o\\bigl((x - 1)^3\\bigr)',
    slides: [
      {lectureId: 'matan_tasks', page: 21, label: 'Комплект №4 · Задача 4.8 (стр. 21)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-4-6',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: '4.14 (6 б.)',
    title: 'Предел 4-го порядка по Маклорену: (cos x − e^(−x²/2)) / x⁴',
    chapter: CH_MVT,
    problemStatement: 'Вычислить предел по формуле Маклорена: lim_{x→0} (cos x − e^(−x²/2)) / x⁴',
    problemTextClean: 'Вычислить предел с помощью формулы Маклорена:',
    problemLatex: '\\lim_{x \\to 0} \\frac{\\cos x - e^{-x^2/2}}{x^4}',
    algorithmSummary:
      'Разложить cos x до x⁴ и подставить u = −x²/2 в eᵘ = 1 + u + u²/2 + o(u²): члены 1 и −x²/2 сокращаются, остаётся (1/24 − 1/8)x⁴ ⇒ −1/12.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Разложить обе функции до x⁴',
        detail: 'Для e^(−x²/2) достаточно разложить eᵘ до u², т.к. u² = x⁴/4:',
        latex: '\\cos x = 1 - \\frac{x^2}{2} + \\frac{x^4}{24} + o(x^4), \\qquad e^{-x^2/2} = 1 - \\frac{x^2}{2} + \\frac{x^4}{8} + o(x^4)',
      },
      {
        title: 'Шаг 2 · Вычесть и вычислить предел',
        detail: 'Приводим дроби 1/24 − 3/24 = −2/24 = −1/12:',
        latex: '\\lim_{x \\to 0} \\frac{\\left(\\frac{1}{24} - \\frac{1}{8}\\right)x^4 + o(x^4)}{x^4} = -\\frac{1}{12}',
      },
    ],
    code: '',
    expectedOutput: '-1/12',
    answerLatex: '-\\frac{1}{12}',
    slides: [
      {lectureId: 'matan_tasks', page: 22, label: 'Комплект №4 · Задача 4.14 (стр. 22)', isAnswerSlide: true},
    ],
  },

  // ======================== КОМПЛЕКТ №5 · МОНОТОННОСТЬ И ВЫПУКЛОСТЬ (5 баллов) ========================
  {
    id: 'matan-5-1',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: '5.1 (5 б.)',
    title: 'Интервалы монотонности и экстремумы f(x) = x⁴ / (x³ − 1)',
    chapter: CH_STUDY,
    problemStatement: 'Найти интервалы монотонности и экстремумы функции f(x) = x⁴ / (x³ − 1)',
    problemTextClean: 'Найти интервалы монотонности и точки экстремума функции:',
    problemLatex: 'f(x) = \\frac{x^4}{x^3 - 1}',
    algorithmSummary:
      'Область определения x ≠ 1. Найти f′(x) = x³(x³ − 4)/(x³ − 1)², отметить x = 0, x = 1 (выколота), x = ∛4 и расставить знаки f′.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Область определения и производная f′(x)',
        detail: 'D(f) = R \\ {1}. Дифференцируем дробь:',
        latex: "f'(x) = \\frac{4x^3(x^3 - 1) - x^4 \\cdot 3x^2}{(x^3 - 1)^2} = \\frac{x^3(x^3 - 4)}{(x^3 - 1)^2}",
      },
      {
        title: 'Шаг 2 · Стационарные точки и знаки f′(x)',
        detail: 'Знаменатель (x³ − 1)² > 0, поэтому знак f′ зависит от x³(x³ − 4). Нули: x = 0 и x = ∛4 ≈ 1.59:',
        latex: '( -\\infty, 0): +; \\quad (0, 1): -; \\quad (1, \\sqrt[3]{4}): -; \\quad (\\sqrt[3]{4}, +\\infty): +',
      },
      {
        title: 'Шаг 3 · Экстремумы',
        detail: 'В точке x = 1 разрыв (экстремума нет!). В x = 0 смена + → − (max), в x = ∛4 смена − → + (min):',
        latex: 'x_{\\max} = 0,\\; f(0) = 0; \\qquad x_{\\min} = \\sqrt[3]{4},\\; f(\\sqrt[3]{4}) = \\frac{4\\sqrt[3]{4}}{3}',
      },
    ],
    code: '',
    expectedOutput: 'x_max = 0, x_min = 4^(1/3)',
    answerLatex: '\\uparrow (-\\infty,0],\\,[\\sqrt[3]{4},+\\infty); \\; \\downarrow [0,1),\\,(1,\\sqrt[3]{4}]; \\; x_{\\max}=0,\\; x_{\\min}=\\sqrt[3]{4}',
    slides: [
      {lectureId: 'matan_tasks', page: 26, label: 'Комплект №5 · Задача 5.1 (стр. 26)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-5-2',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: '5.10 (5 б.)',
    title: 'Интервалы монотонности и экстремум f(x) = ln(1 + x²)',
    chapter: CH_STUDY,
    problemStatement: 'Найти интервалы монотонности и экстремумы функции f(x) = ln(1 + x²)',
    problemTextClean: 'Найти интервалы монотонности и экстремумы функции:',
    problemLatex: 'f(x) = \\ln(1 + x^2)',
    algorithmSummary:
      'D(f) = R. Найти f′(x) = 2x/(1+x²), откуда единственная стационарная точка x = 0 — минимум, f(0) = 0.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Производная и стационарные точки',
        detail: '1 + x² > 0 ∀x ∈ R ⇒ D(f) = R:',
        latex: "f'(x) = \\frac{2x}{1 + x^2} = 0 \\implies x = 0",
      },
      {
        title: 'Шаг 2 · Знаки f′ и вывод',
        detail: 'При x < 0 имеем f′(x) < 0 (убывает), при x > 0 имеем f′(x) > 0 (возрастает):',
        latex: '\\downarrow (-\\infty, 0], \\quad \\uparrow [0, +\\infty), \\quad x_{\\min} = 0,\\; f_{\\min} = 0',
      },
    ],
    code: '',
    expectedOutput: 'x_min = 0, f_min = 0',
    answerLatex: '\\downarrow (-\\infty, 0],\\; \\uparrow [0, +\\infty); \\qquad x_{\\min} = 0,\\; f(0) = 0',
    slides: [
      {lectureId: 'matan_tasks', page: 27, label: 'Комплект №5 · Задача 5.10 (стр. 27)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-5-3',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: '5.11 (5 б.)',
    title: 'Выпуклость и точки перегиба функции f(x) = ln(1 + x²)',
    chapter: CH_STUDY,
    problemStatement: 'Найти интервалы выпуклости и точки перегиба функции f(x) = ln(1 + x²)',
    problemTextClean: 'Найти интервалы выпуклости и точки перегиба графика функции:',
    problemLatex: 'f(x) = \\ln(1 + x^2)',
    algorithmSummary:
      'Вычислить f″(x) = 2(1 − x²)/(1 + x²)², найти нули x = ±1: на (−1, 1) выпукла вниз, на (−∞, −1) и (1, +∞) выпукла вверх; точки перегиба (±1, ln 2).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти первую и вторую производные',
        detail: 'Дифференцируем f′(x) = 2x / (1 + x²):',
        latex: "f''(x) = \\frac{2(1 + x^2) - 2x \\cdot 2x}{(1 + x^2)^2} = \\frac{2(1 - x^2)}{(1 + x^2)^2}",
      },
      {
        title: 'Шаг 2 · Знаки f″(x) и точки перегиба',
        detail: 'f″(x) = 0 при x = ±1; знак совпадает со знаком (1 − x²):',
        latex: '(-\\infty, -1): f\'\'<0 \\text{ (вверх)}; \\quad (-1, 1): f\'\'>0 \\text{ (вниз)}; \\quad (1, +\\infty): f\'\'<0 \\text{ (вверх)}',
      },
      {
        title: 'Шаг 3 · Вычислить ординаты точек перегиба',
        detail: 'f(±1) = ln(1 + 1) = ln 2:',
        latex: '(-1,\\, \\ln 2) \\quad \\text{и} \\quad (1,\\, \\ln 2)',
      },
    ],
    code: '',
    expectedOutput: 'x = -1, x = 1 (перегибы (-1, ln 2) и (1, ln 2))',
    answerLatex: '\\text{Вниз: } (-1, 1); \\; \\text{вверх: } (-\\infty,-1),\\,(1,+\\infty); \\; \\text{перегибы: } (\\pm 1,\\, \\ln 2)',
    slides: [
      {lectureId: 'matan_tasks', page: 28, label: 'Комплект №5 · Задача 5.11 (стр. 28)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-5-4',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: '5.12 (5 б.)',
    title: 'Монотонность, экстремумы и асимптоты f(x) = x² / (2(x − 1))',
    chapter: CH_STUDY,
    problemStatement: 'Найти интервалы монотонности, экстремумы и асимптоты функции f(x) = x² / (2(x − 1))',
    problemTextClean: 'Найти интервалы монотонности, экстремумы и асимптоты функции:',
    problemLatex: 'f(x) = \\frac{x^2}{2(x - 1)}',
    algorithmSummary:
      'f′(x) = x(x−2)/(2(x−1)²) ⇒ x_max = 0 (y = 0), x_min = 2 (y = 2). Асимптоты: вертикальная x = 1 и наклонная y = (1/2)x + 1/2.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Производная и экстремумы',
        detail: 'D(f) = R \\ {1}. Вычисляем f′(x):',
        latex: "f'(x) = \\frac{2x \\cdot 2(x - 1) - x^2 \\cdot 2}{4(x - 1)^2} = \\frac{x(x - 2)}{2(x - 1)^2}",
      },
      {
        title: 'Шаг 2 · Интервалы монотонности',
        detail: 'Знаки f′: (−∞, 0) «+», (0, 1) «−», (1, 2) «−», (2, +∞) «+»:',
        latex: 'x_{\\max} = 0,\\; f(0) = 0; \\qquad x_{\\min} = 2,\\; f(2) = 2',
      },
      {
        title: 'Шаг 3 · Вертикальная и наклонная асимптоты',
        detail: 'При x → 1 f(x) → ±∞ (вертикальная x = 1). Для наклонной вычисляем k и b (вопрос №22):',
        latex: 'k = \\lim_{x \\to \\infty} \\frac{x^2}{2x(x-1)} = \\frac{1}{2}, \\quad b = \\lim_{x \\to \\infty} \\frac{x}{2(x-1)} = \\frac{1}{2} \\implies y = \\frac{1}{2}x + \\frac{1}{2}',
      },
    ],
    code: '',
    expectedOutput: 'x_max = 0, x_min = 2; асимптоты x=1, y=0.5x+0.5',
    answerLatex: 'x_{\\max}=0\\,(y=0),\\; x_{\\min}=2\\,(y=2); \\quad \\text{асимптоты: } x=1,\\; y=\\tfrac{1}{2}x+\\tfrac{1}{2}',
    slides: [
      {lectureId: 'matan_tasks', page: 28, label: 'Комплект №5 · Задача 5.12 (стр. 28)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-5-5',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: '5.23 (5 б.)',
    title: 'Функция f(x) = (x² + 1)/x: монотонность, экстремумы и асимптоты',
    chapter: CH_STUDY,
    problemStatement: 'Найти интервалы монотонности, экстремумы и асимптоты функции f(x) = (x² + 1) / x',
    problemTextClean: 'Найти интервалы монотонности, экстремумы и асимптоты функции:',
    problemLatex: 'f(x) = \\frac{x^2 + 1}{x}',
    algorithmSummary:
      'Почленно разделить f(x) = x + 1/x: сразу видна наклонная асимптота y = x, вертикальная x = 0, а из f′ = 1 − 1/x² = 0 находятся x_max = −1 и x_min = 1.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Почленное деление и асимптоты',
        detail: 'Представление f(x) = x + 1/x сразу даёт обе асимптоты:',
        latex: 'f(x) = x + \\frac{1}{x} \\implies \\text{верт. } x = 0, \\quad \\text{накл. } y = x \\;\\bigl(\\tfrac{1}{x} \\to 0\\bigr)',
      },
      {
        title: 'Шаг 2 · Производная, монотонность и экстремумы',
        detail: 'f′(x) = 1 − 1/x² = (x² − 1)/x² = 0 ⇒ x = ±1:',
        latex: '\\uparrow (-\\infty,-1],\\,[1,+\\infty); \\; \\downarrow [-1,0),\\,(0,1]; \\; x_{\\max}=-1\\,(y=-2),\\; x_{\\min}=1\\,(y=2)',
      },
    ],
    code: '',
    expectedOutput: 'x_max = -1, x_min = 1; асимптоты x=0, y=x',
    answerLatex: 'x_{\\max}=-1\\,(y=-2),\\; x_{\\min}=1\\,(y=2); \\quad \\text{асимптоты: } x=0,\\; y=x',
    slides: [
      {lectureId: 'matan_tasks', page: 30, label: 'Комплект №5 · Задача 5.23 (стр. 30)', isAnswerSlide: true},
    ],
  },
  {
    id: 'matan-5-6',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: '5.6 (5 б.)',
    title: 'Монотонность и экстремумы с иррациональными корнями: (x² + 1)/(x − 1)',
    chapter: CH_STUDY,
    problemStatement: 'Найти интервалы монотонности и экстремумы функции f(x) = (x² + 1) / (x − 1)',
    problemTextClean: 'Найти интервалы монотонности и экстремумы функции:',
    problemLatex: 'f(x) = \\frac{x^2 + 1}{x - 1}',
    algorithmSummary:
      'f′(x) = (x² − 2x − 1)/(x − 1)² = 0 ⇒ x = 1 ± √2: максимум в 1 − √2, минимум в 1 + √2.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Производная и стационарные точки',
        detail: 'D(f) = R \\ {1}. Решаем x² − 2x − 1 = 0:',
        latex: "f'(x) = \\frac{2x(x - 1) - (x^2 + 1)}{(x - 1)^2} = \\frac{x^2 - 2x - 1}{(x - 1)^2} = 0 \\implies x_{1,2} = 1 \\pm \\sqrt{2}",
      },
      {
        title: 'Шаг 2 · Знаки производной и экстремумы',
        detail: 'Вне корней парабола x² − 2x − 1 > 0, между корнями < 0 (учитывая выколотую точку x = 1):',
        latex: 'x_{\\max} = 1 - \\sqrt{2},\\; f(x_{\\max}) = 2 - 2\\sqrt{2}; \\qquad x_{\\min} = 1 + \\sqrt{2},\\; f(x_{\\min}) = 2 + 2\\sqrt{2}',
      },
    ],
    code: '',
    expectedOutput: 'x_max = 1 - sqrt(2), x_min = 1 + sqrt(2)',
    answerLatex: 'x_{\\max}=1-\\sqrt{2}\\;(y=2-2\\sqrt{2}), \\qquad x_{\\min}=1+\\sqrt{2}\\;(y=2+2\\sqrt{2})',
    slides: [
      {lectureId: 'matan_tasks', page: 27, label: 'Комплект №5 · Задача 5.6 (стр. 27)', isAnswerSlide: true},
    ],
  },
];
