import {StudyCategory, TaskCard} from '../types/study';
import {TaskAnswerCheckResult} from './taskAnswerChecker';

export interface GeneratedPracticeTask extends TaskCard {
  isGenerated: true;
  generatorTopic: string;
  formatHint: string;
  placeholder: string;
  checkAnswer: (rawInput: string) => TaskAnswerCheckResult;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickNonZero(min: number, max: number): number {
  let n = 0;
  while (n === 0) n = randInt(min, max);
  return n;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

function formatFracLatex(num: number, den: number): string {
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  if (d === 1) return `${n}`;
  return n < 0 ? `-\\frac{${Math.abs(n)}}{${d}}` : `\\frac{${n}}{${d}}`;
}

function formatFracText(num: number, den: number): string {
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  return d === 1 ? `${n}` : `${n}/${d}`;
}

function parseUserNumber(raw: string): number | null {
  const clean = raw
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/−/g, '-')
    .replace(/^[a-zA-Zа-яА-Я]+=/i, '');
  if (!clean) return null;
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length !== 2) return null;
    const n = Number(parts[0]);
    const d = Number(parts[1]);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
    return n / d;
  }
  const v = Number(clean);
  return Number.isFinite(v) ? v : null;
}

function makeNumericChecker(
  target: number,
  displayAnswer: string,
): (rawInput: string) => TaskAnswerCheckResult {
  return (rawInput: string) => {
    const val = parseUserNumber(rawInput);
    if (val === null) {
      return {
        isCorrect: false,
        feedback: `Введите число или дробь (например: ${displayAnswer}).`,
      };
    }
    if (Math.abs(val - target) <= 0.015) {
      return {
        isCorrect: true,
        feedback: `Верно! Точный ответ: ${displayAnswer}.`,
      };
    }
    return {
      isCorrect: false,
      feedback: `Пока не сходится (получено ${val.toFixed(3).replace(/\.?0+$/, '')}). Проверьте знак и сокращение коэффициентов.`,
    };
  };
}

function generateMatanLimit1(seedId: string): GeneratedPracticeTask {
  // lim_{x->0} (1 - cos(kx)) / (m x^2) = k^2 / (2m)
  const k = randInt(2, 7);
  const m = randInt(1, 5);
  const num = k * k;
  const den = 2 * m;
  const val = num / den;
  const ansText = formatFracText(num, den);
  const ansLatex = formatFracLatex(num, den);

  return {
    id: seedId,
    isGenerated: true,
    generatorTopic: 'Комплект 1 · Предел через эквивалентность',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Тренажёр · 1',
    title: 'Вычисление предела с косинусом (новые числа)',
    chapter: 'Матан · Пределы и б.м.ф. (вопр. 1–15)',
    problemStatement: `Вычислить предел: lim_{x->0} (1 - cos(${k}x)) / (${m}x^2)`,
    problemTextClean: 'Вычислить предел при x → 0:',
    problemLatex: `\\lim_{x \\to 0} \\frac{1 - \\cos(${k}x)}{${m === 1 ? '' : m}x^2}`,
    algorithmSummary: `При x → 0 используем эквивалентность 1 − cos(u) ~ u²/2 при u = ${k}x.`,
    explanationSteps: [
      {
        title: 'Шаг 1 · Применить эквивалентность для 1 − cos(u)',
        detail: `Так как ${k}x → 0, заменяем числитель эквивалентной бесконечно малой:`,
        latex: `1 - \\cos(${k}x) \\sim \\frac{(${k}x)^2}{2} = \\frac{${num}}{2}x^2`,
      },
      {
        title: 'Шаг 2 · Сократить x² и упростить дробь',
        detail: 'Сокращаем общий множитель x² и делим коэффициенты:',
        latex: `\\lim_{x \\to 0} \\frac{\\frac{${num}}{2}x^2}{${m === 1 ? '' : m}x^2} = \\frac{${num}}{${den}} = ${ansLatex}`,
      },
    ],
    code: '',
    expectedOutput: ansText,
    answerLatex: ansLatex,
    slides: [],
    formatHint: 'Число или дробь (например: 9/4)',
    placeholder: 'Например: 9/2',
    checkAnswer: makeNumericChecker(val, ansText),
  };
}

function generateMatanLimit2(seedId: string): GeneratedPracticeTask {
  // lim_{x->a} (x^2 - a^2) / (x^2 + (b - a)x - ab) = 2a / (a + b)
  const a = randInt(1, 5);
  let b = randInt(1, 6);
  if (a + b === 0) b = 2;
  const p = b - a;
  const q = -a * b;
  const num = 2 * a;
  const den = a + b;
  const ansText = formatFracText(num, den);
  const ansLatex = formatFracLatex(num, den);
  const pTerm = p === 0 ? '' : p > 0 ? `+ ${p === 1 ? '' : p}x` : `- ${Math.abs(p) === 1 ? '' : Math.abs(p)}x`;

  return {
    id: seedId,
    isGenerated: true,
    generatorTopic: 'Комплект 1 · Неопределённость 0/0',
    category: 'matan',
    kind: 'matan-1',
    badgeNumber: 'Тренажёр · 1',
    title: 'Раскрытие неопределённости 0/0 разложением на множители',
    chapter: 'Матан · Пределы и б.м.ф. (вопр. 1–15)',
    problemStatement: `Вычислить предел lim_{x->${a}} (x^2 - ${a * a}) / (x^2 ${pTerm} ${q})`,
    problemTextClean: `Вычислить предел при x → ${a}:`,
    problemLatex: `\\lim_{x \\to ${a}} \\frac{x^2 - ${a * a}}{x^2 ${pTerm} - ${Math.abs(q)}}`,
    algorithmSummary: `Разложить числитель и знаменатель на множители и сократить общий корень (x − ${a}).`,
    explanationSteps: [
      {
        title: 'Шаг 1 · Разложить числитель и знаменатель',
        detail: `Подстановка x = ${a} даёт 0/0, значит (x − ${a}) — общий множитель:`,
        latex: `\\frac{(x - ${a})(x + ${a})}{(x - ${a})(x + ${b})} = \\frac{x + ${a}}{x + ${b}}`,
      },
      {
        title: 'Шаг 2 · Подставить предельное значение',
        detail: `Подставляем x = ${a} в сокращённую дробь:`,
        latex: `\\lim_{x \\to ${a}} \\frac{x + ${a}}{x + ${b}} = \\frac{${a} + ${a}}{${a} + ${b}} = ${ansLatex}`,
      },
    ],
    code: '',
    expectedOutput: ansText,
    answerLatex: ansLatex,
    slides: [],
    formatHint: 'Число или дробь (например: 4/5)',
    placeholder: 'Введите ответ...',
    checkAnswer: makeNumericChecker(num / den, ansText),
  };
}

function generateMatanContinuity3(seedId: string): GeneratedPracticeTask {
  // f(x) = sin(kx)/x for x!=0, f(0) = a  OR  (e^(kx)-1)/(mx) -> k/m
  const k = randInt(2, 9);
  const m = randInt(1, 4);
  const ansText = formatFracText(k, m);
  const ansLatex = formatFracLatex(k, m);

  return {
    id: seedId,
    isGenerated: true,
    generatorTopic: 'Комплект 3 · Подбор параметра для непрерывности',
    category: 'matan',
    kind: 'matan-3',
    badgeNumber: 'Тренажёр · 3',
    title: 'Подбор параметра a для непрерывности в x = 0',
    chapter: 'Матан · Непрерывность и разрывы (вопр. 16–22)',
    problemStatement: `Подобрать параметр a так, чтобы f(x) = (e^(${k}x) - 1)/(${m}x) при x != 0 и f(0) = a была непрерывна в x = 0`,
    problemTextClean: 'Подобрать значение параметра a, при котором функция непрерывна в точке x = 0:',
    problemLatex: `f(x) = \\begin{cases} \\dfrac{e^{${k}x} - 1}{${m === 1 ? '' : m}x}, & x \\neq 0, \\\\[6pt] a, & x = 0. \\end{cases}`,
    algorithmSummary: `По определению непрерывности нужно a = lim_{x→0} (e^(${k}x) − 1)/(${m}x).`,
    explanationSteps: [
      {
        title: 'Шаг 1 · Применить эквивалентность e^u − 1 ~ u',
        detail: `При x → 0 имеем e^(${k}x) − 1 ~ ${k}x:`,
        latex: `\\lim_{x \\to 0} \\frac{e^{${k}x} - 1}{${m === 1 ? '' : m}x} = \\lim_{x \\to 0} \\frac{${k}x}{${m === 1 ? '' : m}x} = ${ansLatex}`,
      },
      {
        title: 'Шаг 2 · Приравнять значение функции к пределу',
        detail: 'Для устранения разрыва полагаем f(0) = lim f(x):',
        latex: `a = ${ansLatex}`,
      },
    ],
    code: '',
    expectedOutput: ansText,
    answerLatex: `a = ${ansLatex}`,
    slides: [],
    formatHint: 'Значение параметра a (число или дробь)',
    placeholder: 'Например: 5/2',
    checkAnswer: makeNumericChecker(k / m, ansText),
  };
}

function generateMatanTaylor4(seedId: string): GeneratedPracticeTask {
  // lim_{x->0} (sin(kx) - kx) / x^3 = -k^3 / 6
  const k = randInt(2, 5);
  const num = -(k * k * k);
  const den = 6;
  const ansText = formatFracText(num, den);
  const ansLatex = formatFracLatex(num, den);

  return {
    id: seedId,
    isGenerated: true,
    generatorTopic: 'Комплект 4 · Предел по формуле Маклорена',
    category: 'matan',
    kind: 'matan-4',
    badgeNumber: 'Тренажёр · 4',
    title: 'Предел 3-го порядка через разложение sin(kx)',
    chapter: 'Матан · Теоремы о среднем, Лопиталь и Тейлор (вопр. 30–42)',
    problemStatement: `Вычислить предел по формуле Маклорена: lim_{x->0} (sin(${k}x) - ${k}x) / x^3`,
    problemTextClean: 'Вычислить предел с помощью формулы Маклорена:',
    problemLatex: `\\lim_{x \\to 0} \\frac{\\sin(${k}x) - ${k}x}{x^3}`,
    algorithmSummary: `Разложить sin(${k}x) до x³: ${k}x − (${k}x)³/6 + o(x³), после чего линейный член сократится.`,
    explanationSteps: [
      {
        title: 'Шаг 1 · Разложить sin(kx) по Маклорену до x³',
        detail: `Подставляем u = ${k}x в sin u = u − u³/6 + o(u³):`,
        latex: `\\sin(${k}x) = ${k}x - \\frac{${k * k * k}}{6}x^3 + o(x^3)`,
      },
      {
        title: 'Шаг 2 · Вычесть kx и разделить на x³',
        detail: 'Делим главный член на x³:',
        latex: `\\lim_{x \\to 0} \\frac{-\\frac{${k * k * k}}{6}x^3 + o(x^3)}{x^3} = ${ansLatex}`,
      },
    ],
    code: '',
    expectedOutput: ansText,
    answerLatex: ansLatex,
    slides: [],
    formatHint: 'Число или дробь со знаком минус (например: -4/3)',
    placeholder: 'Например: -4/3',
    checkAnswer: makeNumericChecker(num / den, ansText),
  };
}

function generateMatanExtrema5(seedId: string): GeneratedPracticeTask {
  // f(x) = x^3 - 3*a*x^2 + c -> f'(x) = 3x(x - 2a), x_max = 0, x_min = 2a, inflection = a
  const a = randInt(1, 5);
  const c = randInt(-4, 6);
  const xMin = 2 * a;
  const fMin = xMin * xMin * xMin - 3 * a * xMin * xMin + c;
  const cStr = c === 0 ? '' : c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;

  return {
    id: seedId,
    isGenerated: true,
    generatorTopic: 'Комплект 5 · Точка минимума и перегиба',
    category: 'matan',
    kind: 'matan-5',
    badgeNumber: 'Тренажёр · 5',
    title: 'Найти точку локального минимума кубической функции',
    chapter: 'Матан · Монотонность, экстремумы и выпуклость (вопр. 43–49)',
    problemStatement: `Найти точку локального минимума x_min функции f(x) = x^3 - ${3 * a}x^2 ${cStr}`,
    problemTextClean: 'Найти точку локального минимума x_min функции:',
    problemLatex: `f(x) = x^3 - ${3 * a}x^2 ${cStr}`,
    algorithmSummary: `Найти f′(x) = 3x(x − ${xMin}), проверить знаки f′ и f″(${xMin}) > 0.`,
    explanationSteps: [
      {
        title: 'Шаг 1 · Найти производную и стационарные точки',
        detail: 'Приравниваем первую производную к нулю:',
        latex: `f'(x) = 3x^2 - ${6 * a}x = 3x(x - ${xMin}) = 0 \\implies x_1 = 0,\\; x_2 = ${xMin}`,
      },
      {
        title: 'Шаг 2 · Проверить тип экстремума через f″(x)',
        detail: `f″(x) = 6x − ${6 * a}. В точке x = ${xMin} имеем f″(${xMin}) = ${6 * a} > 0 ⇒ это минимум:`,
        latex: `x_{\\min} = ${xMin}, \\qquad f(x_{\\min}) = ${fMin}, \\qquad x_{\\text{перег}} = ${a}`,
      },
    ],
    code: '',
    expectedOutput: `${xMin}`,
    answerLatex: `x_{\\min} = ${xMin} \\quad (y_{\\min} = ${fMin})`,
    slides: [],
    formatHint: 'Введите абсциссу точки минимума x_min (одно число)',
    placeholder: `Например: ${xMin}`,
    checkAnswer: makeNumericChecker(xMin, `${xMin}`),
  };
}

function generateRkDet2x2(seedId: string): GeneratedPracticeTask {
  const a = pickNonZero(-6, 6);
  const b = pickNonZero(-6, 6);
  const c = pickNonZero(-6, 6);
  const d = pickNonZero(-6, 6);
  const det = a * d - b * c;

  return {
    id: seedId,
    isGenerated: true,
    generatorTopic: 'РК 2 · Определитель 2×2',
    category: 'rk',
    kind: 'rk-basic',
    badgeNumber: 'Тренажёр · РК2',
    title: 'Вычислить определитель матрицы 2×2 (новые числа)',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement: `Вычислить определитель матрицы [[${a}, ${b}], [${c}, ${d}]]`,
    problemTextClean: 'Вычислить определитель матрицы A:',
    problemLatex: `A = \\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}`,
    algorithmSummary: 'Использовать формулу det(A) = a₁₁a₂₂ − a₁₂a₂₁.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Раскрыть определитель 2-го порядка',
        detail: 'Перемножаем элементы главной и побочной диагоналей:',
        latex: `\\det A = (${a})\\cdot(${d}) - (${b})\\cdot(${c}) = ${a * d} - (${b * c}) = ${det}`,
      },
    ],
    code: '',
    expectedOutput: `${det}`,
    answerLatex: `\\det A = ${det}`,
    slides: [],
    formatHint: 'Одно целое число',
    placeholder: 'Введите det A...',
    checkAnswer: makeNumericChecker(det, `${det}`),
  };
}

function generateRkDet3x3(seedId: string): GeneratedPracticeTask {
  // Triangular-plus-one row op so arithmetic stays clean and exam-realistic
  const a = pickNonZero(-3, 3);
  const b = randInt(-3, 3);
  const c = randInt(-3, 3);
  const d = randInt(-2, 3);
  const e = pickNonZero(-3, 3);
  const f = randInt(-3, 3);
  const g = randInt(-2, 2);
  const h = randInt(-2, 2);
  const k = pickNonZero(-3, 3);
  const det =
    a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g);

  return {
    id: seedId,
    isGenerated: true,
    generatorTopic: 'РК 2 · Определитель 3×3',
    category: 'rk',
    kind: 'rk-basic',
    badgeNumber: 'Тренажёр · РК2',
    title: 'Вычислить определитель 3×3 (новые числа)',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement: `Вычислить определитель 3×3`,
    problemTextClean: 'Вычислить определитель 3-го порядка:',
    problemLatex: `\\Delta = \\begin{vmatrix} ${a} & ${b} & ${c} \\\\ ${d} & ${e} & ${f} \\\\ ${g} & ${h} & ${k} \\end{vmatrix}`,
    algorithmSummary: 'Разложить по 1-й строке (или применить правило Саррюса / треугольников).',
    explanationSteps: [
      {
        title: 'Шаг 1 · Разложение по первой строке',
        detail: 'Записываем сумму произведений элементов 1-й строки на их алгебраические дополнения:',
        latex: `\\Delta = (${a})(${e * k - f * h}) - (${b})(${d * k - f * g}) + (${c})(${d * h - e * g}) = ${det}`,
      },
    ],
    code: '',
    expectedOutput: `${det}`,
    answerLatex: `\\Delta = ${det}`,
    slides: [],
    formatHint: 'Целое число',
    placeholder: 'Введите значение определителя...',
    checkAnswer: makeNumericChecker(det, `${det}`),
  };
}

function generateRkCramer(seedId: string): GeneratedPracticeTask {
  // Choose integer solution (x0, y0) and invertible 2x2 matrix A
  const x0 = randInt(-4, 5);
  const y0 = randInt(-4, 5);
  let a = pickNonZero(-3, 4);
  let b = pickNonZero(-3, 4);
  let c = pickNonZero(-3, 4);
  let d = pickNonZero(-3, 4);
  while (a * d - b * c === 0) {
    d = pickNonZero(-4, 4);
  }
  const det = a * d - b * c;
  const rhs1 = a * x0 + b * y0;
  const rhs2 = c * x0 + d * y0;
  const detX = rhs1 * d - b * rhs2;
  const detY = a * rhs2 - rhs1 * c;

  return {
    id: seedId,
    isGenerated: true,
    generatorTopic: 'РК 2 · СЛАУ методом Крамера',
    category: 'rk',
    kind: 'rk-ticket',
    badgeNumber: 'Тренажёр · РК2',
    title: 'Решить СЛАУ 2×2 по формулам Крамера (найти x)',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement: `Решить систему ${a}x + ${b}y = ${rhs1}, ${c}x + ${d}y = ${rhs2} и найти x`,
    problemTextClean: 'Решить систему методом Крамера и указать значение x:',
    problemLatex: `\\begin{cases} ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}y = ${rhs1}, \\\\ ${c}x ${d >= 0 ? '+' : '-'} ${Math.abs(d)}y = ${rhs2}. \\end{cases}`,
    algorithmSummary: 'Вычислить Δ, Δₓ и Δᵧ; тогда x = Δₓ / Δ, y = Δᵧ / Δ.',
    explanationSteps: [
      {
        title: 'Шаг 1 · Главный определитель Δ',
        detail: 'Проверяем невырожденность системы (Δ ≠ 0):',
        latex: `\\Delta = ${a}\\cdot(${d}) - (${b})\\cdot(${c}) = ${det} \\neq 0`,
      },
      {
        title: 'Шаг 2 · Вспомогательные определители и ответ',
        detail: 'Заменяем 1-й и 2-й столбцы на столбец свободных членов:',
        latex: `\\Delta_x = ${detX},\\; \\Delta_y = ${detY} \\implies x = \\frac{${detX}}{${det}} = ${x0}, \\quad y = \\frac{${detY}}{${det}} = ${y0}`,
      },
    ],
    code: '',
    expectedOutput: `${x0}`,
    answerLatex: `x = ${x0}, \\qquad y = ${y0}`,
    slides: [],
    formatHint: 'Введите найденное значение x (целое число)',
    placeholder: `Например: ${x0}`,
    checkAnswer: makeNumericChecker(x0, `${x0} (полное решение: x = ${x0}, y = ${y0})`),
  };
}

export function generateInfinitePracticeTask(
  category: StudyCategory,
  preferredKind?: string,
): GeneratedPracticeTask {
  const uid = `gen-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  if (category === 'rk') {
    const rkGens = [generateRkDet2x2, generateRkDet3x3, generateRkCramer];
    const picked = rkGens[randInt(0, rkGens.length - 1)];
    return picked(uid);
  }

  // Matan (or custom math fallback)
  if (preferredKind === 'matan-1') {
    return Math.random() < 0.5
      ? generateMatanLimit1(uid)
      : generateMatanLimit2(uid);
  }
  if (preferredKind === 'matan-3') {
    return generateMatanContinuity3(uid);
  }
  if (preferredKind === 'matan-4') {
    return generateMatanTaylor4(uid);
  }
  if (preferredKind === 'matan-5') {
    return generateMatanExtrema5(uid);
  }

  const allMatan = [
    generateMatanLimit1,
    generateMatanLimit2,
    generateMatanContinuity3,
    generateMatanTaylor4,
    generateMatanExtrema5,
  ];
  return allMatan[randInt(0, allMatan.length - 1)](uid);
}
