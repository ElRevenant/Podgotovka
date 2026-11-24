import {MATAN_EXAM_TICKET_TASKS} from '../data/matanExamTickets';

export interface TaskAnswerCheckResult {
  isCorrect: boolean;
  feedback: string;
}

export interface TaskAnswerHint {
  placeholder: string;
  formatHint: string;
}

function normalizeMathString(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/ё/g, 'е')
    .replace(/λ/g, 'lambda')
    .replace(/≠/g, '!=')
    .replace(/θ/g, '0')
    .replace(/,/g, '.')
    .trim();
}

/**
 * Extracts ordered numeric values (integers, decimals, and fractions like -1/2 or 2/3)
 * from a free-form student answer string.
 */
function extractNumbers(raw: string): number[] {
  const normalized = raw
    .replace(/[−–—]/g, '-')
    .replace(/(\d),(\d)/g, '$1.$2');
  // Strip variable subscripts like x1, x_2, c1, e_1 so they aren't parsed as answer numbers
  const withoutSubscripts = normalized.replace(
    /\b([xceam]|ранг|rang|det|λ|lambda)_?\d+\b/gi,
    ' ',
  );
  const tokens = withoutSubscripts.match(/-?\d+(?:\.\d+)?(?:\s*\/\s*-?\d+(?:\.\d+)?)?/g);
  if (!tokens) return [];

  const nums: number[] = [];
  for (const tok of tokens) {
    if (tok.includes('/')) {
      const [aStr, bStr] = tok.split('/').map((s) => s.trim());
      const a = Number(aStr);
      const b = Number(bStr);
      if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) {
        nums.push(a / b);
      }
    } else {
      const v = Number(tok);
      if (Number.isFinite(v)) nums.push(v);
    }
  }
  return nums;
}

function approxEq(a: number, b: number, eps = 1e-3): boolean {
  return Math.abs(a - b) <= eps;
}

function arraysMatch(actual: number[], expected: number[], eps = 1e-3): boolean {
  if (actual.length !== expected.length) return false;
  return expected.every((val, idx) => approxEq(actual[idx], val, eps));
}

function isNonZeroVector(v: number[]): boolean {
  return v.some((x) => Math.abs(x) > 1e-4);
}

function satisfiesHomogeneousSystem(matrixA: number[][], v: number[]): boolean {
  for (const row of matrixA) {
    let dot = 0;
    for (let j = 0; j < row.length; j++) {
      dot += row[j] * (v[j] ?? 0);
    }
    if (Math.abs(dot) > 1e-2) return false;
  }
  return true;
}

function areTwoVectorsIndependent(u: number[], v: number[]): boolean {
  if (!isNonZeroVector(u) || !isNonZeroVector(v)) return false;
  for (let i = 0; i < u.length; i++) {
    for (let j = i + 1; j < u.length; j++) {
      if (Math.abs(u[i] * v[j] - u[j] * v[i]) > 1e-3) {
        return true;
      }
    }
  }
  return false;
}

function matrixRank2D(rows: number[][]): number {
  const m = rows.map((r) => [...r]);
  const rowCount = m.length;
  const colCount = m[0]?.length ?? 0;
  let r = 0;
  for (let c = 0; c < colCount && r < rowCount; c++) {
    let pivot = r;
    for (let i = r + 1; i < rowCount; i++) {
      if (Math.abs(m[i][c]) > Math.abs(m[pivot][c])) pivot = i;
    }
    if (Math.abs(m[pivot][c]) < 1e-4) continue;
    [m[r], m[pivot]] = [m[pivot], m[r]];
    const pv = m[r][c];
    for (let j = c; j < colCount; j++) m[r][j] /= pv;
    for (let i = 0; i < rowCount; i++) {
      if (i !== r && Math.abs(m[i][c]) > 1e-4) {
        const factor = m[i][c];
        for (let j = c; j < colCount; j++) m[i][j] -= factor * m[r][j];
      }
    }
    r++;
  }
  return r;
}

const TASK_HINTS: Record<string, TaskAnswerHint> = {
  'rk-base-1': {
    placeholder: 'Например: 0 0; 0 0 или нулевая матрица',
    formatHint: 'Введите 4 элемента матрицы 2×2 построчно через пробел или напишите «0» / «нулевая».',
  },
  'rk-base-2': {
    placeholder: 'Например: 2',
    formatHint: 'Введите ранг матрицы (число).',
  },
  'rk-base-3': {
    placeholder: 'Например: 2',
    formatHint: 'Введите ранг матрицы (число).',
  },
  'rk-base-4': {
    placeholder: 'Например: -7 4; -25 14',
    formatHint: 'Введите 4 элемента матрицы X (2×2) построчно через пробел.',
  },
  'rk-base-5': {
    placeholder: 'Например: 3 4; 4 6',
    formatHint: 'Введите 4 элемента матрицы X (2×2) построчно через пробел.',
  },
  'rk-base-6': {
    placeholder: 'Например: 1/18 * (7 -5 1; 1 7 -5; -5 1 7) или 7/18 -5/18 1/18 ...',
    formatHint: 'Введите множитель 1/18 и 9 элементов A* построчно (или все 9 дробей A⁻¹).',
  },
  'rk-base-7': {
    placeholder: 'Например: (-9, 7, 1, 0); (-1, 0, 0, 2)',
    formatHint: 'Введите координаты двух векторов ФСР (8 чисел подряд — проверяется любой верный базис!).',
  },
  'rk-base-8': {
    placeholder: 'Например: 1 1 1',
    formatHint: 'Введите значения x₁, x₂, x₃ через пробел.',
  },
  'rk-adv-1': {
    placeholder: 'Например: 5e1 - 3e2 или c1 = 5, c2 = -3',
    formatHint: 'Введите коэффициенты разложения x⁰ = c₁e₁ + c₂e₂ (два числа: c₁ и c₂).',
  },
  'rk-adv-2': {
    placeholder: 'Например: (1, 3, 0, 7, 0); (2, 0, 3, 23, 0); (-5, 0, 0, -32, 3)',
    formatHint: 'Введите координаты 3 векторов ФСР (15 чисел — принимается любой верный базис!).',
  },
  'rk-adv-3': {
    placeholder: 'Например: 2',
    formatHint: 'Введите наименьшее возможное число уравнений m_min.',
  },
  'rk-ticket-1': {
    placeholder: 'Например: E или 1 0 0; 0 1 0; 0 0 1',
    formatHint: 'Введите 9 элементов матрицы A² построчно или напишите «E» / «единичная».',
  },
  'rk-ticket-2': {
    placeholder: 'Например: 25 36; 7 10',
    formatHint: 'Введите 4 элемента матрицы X (2×2) построчно через пробел.',
  },
  'rk-ticket-3': {
    placeholder: 'Например: (-1, 0, 1, 0); (0, -1, 0, 1)',
    formatHint: 'Введите координаты двух векторов ФСР (8 чисел — проверяется любой верный базис!).',
  },
  'rk-ticket-4': {
    placeholder: 'Например: (2/3, 0, -2) + c(1, 1, -5)',
    formatHint: 'Введите частное решение (3 числа) и направляющий вектор ФСР (3 числа) — всего 6 чисел.',
  },
  'rk-ticket-5': {
    placeholder: 'Например: (5, 5, 0, 0) + c1(-2, 0, 1, 0) + c2(0, -2, 0, 1)',
    formatHint: 'Введите частное решение (4 числа) и два вектора ФСР (8 чисел) — всего 12 чисел.',
  },
  'rk-ticket-6': {
    placeholder: 'Например: при lambda = -3 ранг 2, иначе 3',
    formatHint: 'Укажите критическое значение λ и оба значения ранга (например: «λ = -3 -> 2, иначе 3»).',
  },
  // Математический анализ — Комплект №1 (Пределы)
  'matan-1-1': {
    placeholder: 'Например: 4',
    formatHint: 'Введите числовое значение предела.',
  },
  'matan-1-2': {
    placeholder: 'Например: -3',
    formatHint: 'Введите числовое значение предела (внимательно со знаком при x → −∞!).',
  },
  'matan-1-3': {
    placeholder: 'Например: 1/2 или 0.5',
    formatHint: 'Введите число или дробь (например: 1/2).',
  },
  'matan-1-4': {
    placeholder: 'Например: e^(2/pi)',
    formatHint: 'Введите выражение вида e^(2/pi) или десятичное приближение (~1.89).',
  },
  'matan-1-5': {
    placeholder: 'Например: 8',
    formatHint: 'Введите числовое значение предела.',
  },
  'matan-1-6': {
    placeholder: 'Например: e^(-2/9)',
    formatHint: 'Введите выражение вида e^(-2/9) или показатель степени -2/9.',
  },
  'matan-1-7': {
    placeholder: 'Например: -5/2 или -2.5',
    formatHint: 'Введите число или дробь (внимательно со знаком при x → −∞!).',
  },
  'matan-1-8': {
    placeholder: 'Например: 18/pi^2',
    formatHint: 'Введите выражение вида 18/pi^2 или десятичное приближение (~1.82).',
  },
  'matan-1-9': {
    placeholder: 'Например: e^(4/3)',
    formatHint: 'Введите выражение вида e^(4/3) или показатель степени 4/3.',
  },
  // Комплект №2 (Сравнение б.м. и б.б.)
  'matan-2-1': {
    placeholder: 'Например: одного порядка, 3/4',
    formatHint: 'Укажите предел отношения (3/4) и/или вывод («одного порядка»).',
  },
  'matan-2-2': {
    placeholder: 'Например: 4 или порядок 4, x^4',
    formatHint: 'Введите порядок роста k (число).',
  },
  'matan-2-3': {
    placeholder: 'Например: 1/8',
    formatHint: 'Введите порядок малости k (дробь или десятичное число).',
  },
  'matan-2-4': {
    placeholder: 'Например: одного порядка, ln(2/3)',
    formatHint: 'Укажите «одного порядка» или предел отношения ln(2/3).',
  },
  'matan-2-5': {
    placeholder: 'Например: 2 (или 1/2 x^2)',
    formatHint: 'Введите порядок малости k (число).',
  },
  'matan-2-6': {
    placeholder: 'Например: 3 (или 1/2 x^3)',
    formatHint: 'Введите порядок малости k (число).',
  },
  'matan-2-7': {
    placeholder: 'Например: -1/3 (x-1)^2, k = 2',
    formatHint: 'Введите порядок малости k = 2 и/или коэффициент −1/3.',
  },
  'matan-2-8': {
    placeholder: 'Например: -2x^2, k = 2',
    formatHint: 'Введите главную часть −2x² или порядок роста k = 2.',
  },
  'matan-2-9': {
    placeholder: 'Например: -2x^2, k = 2',
    formatHint: 'Введите главную часть −2x² или порядок малости k = 2.',
  },
  // Комплект №3 (Непрерывность и разрывы)
  'matan-3-1': {
    placeholder: 'Например: -1 II род, 0 I род, 1 I род',
    formatHint: 'Перечислите точки разрыва (−1, 0, 1) — желательно с указанием рода.',
  },
  'matan-3-2': {
    placeholder: 'Например: 2 устранимый (4/5), -3 II род',
    formatHint: 'Укажите обе точки разрыва (2 и −3) и их род.',
  },
  'matan-3-3': {
    placeholder: 'Например: -1 и 1, оба II рода',
    formatHint: 'Укажите обе точки разрыва (−1 и 1) и род разрыва (II род).',
  },
  'matan-3-4': {
    placeholder: 'Например: 0 (I род), pi непрерывна',
    formatHint: 'Укажите точку разрыва x = 0 (I род) и непрерывность в x = π.',
  },
  'matan-3-5': {
    placeholder: 'Например: x = 3, I род',
    formatHint: 'Укажите точку разрыва (3) и её род (I род).',
  },
  'matan-3-6': {
    placeholder: 'Например: 3',
    formatHint: 'Введите числовое значение параметра a.',
  },
  'matan-3-7': {
    placeholder: 'Например: 0 (I род), 1 (II род), 2 непрерывна',
    formatHint: 'Укажите точки разрыва 0 и 1 (в x = 2 функция непрерывна!).',
  },
  'matan-3-8': {
    placeholder: 'Например: x = 4, I род, скачок pi',
    formatHint: 'Укажите точку разрыва x = 4 и её род (I род, скачок π).',
  },
  'matan-3-9': {
    placeholder: 'Например: x = 5, устранимый, f(5) = 10',
    formatHint: 'Укажите точку разрыва (5) и доопределение (10).',
  },
  // Комплект №4 (Касательная и Тейлор)
  'matan-4-1': {
    placeholder: 'Например: (-1, 1) и (1, 1), y = 2x+3, y = -2x+3',
    formatHint: 'Укажите абсциссы точек пересечения (−1 и 1) или коэффициенты касательных.',
  },
  'matan-4-2': {
    placeholder: 'Например: (1, 0), y = x - 1',
    formatHint: 'Укажите точку касания (1, 0) и/или уравнение y = x − 1.',
  },
  'matan-4-3': {
    placeholder: 'Например: 2',
    formatHint: 'Введите числовое значение предела.',
  },
  'matan-4-4': {
    placeholder: 'Например: 1/3',
    formatHint: 'Введите числовое значение предела (дробь 1/3).',
  },
  'matan-4-5': {
    placeholder: 'Например: 1 - (x-1) + (x-1)^2 - (x-1)^3',
    formatHint: 'Укажите коэффициенты разложения (1, −1, 1, −1) или сам многочлен по (x−1).',
  },
  'matan-4-6': {
    placeholder: 'Например: -1/12',
    formatHint: 'Введите числовое значение предела (дробь −1/12).',
  },
  // Комплект №5 (Монотонность и выпуклость)
  'matan-5-1': {
    placeholder: 'Например: x_max = 0, x_min = 4^(1/3) (или 1.59)',
    formatHint: 'Укажите точки экстремума: x_max = 0 и x_min = ∛4.',
  },
  'matan-5-2': {
    placeholder: 'Например: x_min = 0, f = 0',
    formatHint: 'Укажите точку минимума (0).',
  },
  'matan-5-3': {
    placeholder: 'Например: -1 и 1',
    formatHint: 'Укажите абсциссы точек перегиба (−1 и 1).',
  },
  'matan-5-4': {
    placeholder: 'Например: x_max = 0, x_min = 2',
    formatHint: 'Укажите точки экстремума (0 и 2).',
  },
  'matan-5-5': {
    placeholder: 'Например: x_max = -1, x_min = 1',
    formatHint: 'Укажите точки экстремума (−1 и 1).',
  },
  'matan-5-6': {
    placeholder: 'Например: 1 - sqrt(2) и 1 + sqrt(2)',
    formatHint: 'Укажите точки экстремума 1 ± √2 (или приближённо −0.41 и 2.41).',
  },
};

export function getTaskAnswerHint(taskId: string): TaskAnswerHint | null {
  if (TASK_HINTS[taskId]) return TASK_HINTS[taskId];
  const ticketTask = MATAN_EXAM_TICKET_TASKS.find((t) => t.id === taskId);
  if (ticketTask) {
    const kindHint =
      ticketTask.kind === 'matan-1'
        ? 'Введите числовое или символьное значение предела (например: -1, 1/2, e^2).'
        : ticketTask.kind === 'matan-2'
          ? 'Укажите порядок малости/роста k или вывод («одного порядка», «выше порядок»).'
          : ticketTask.kind === 'matan-3'
            ? 'Перечислите точки разрыва (и при желании их род: I род, II род, устранимый).'
            : ticketTask.kind === 'matan-4'
              ? 'Укажите найденный предел, уравнение касательной или коэффициенты разложения.'
              : 'Укажите точки экстремума / перегиба или уравнения асимптот.';
    return {
      placeholder: 'Введите ваш ответ (числа, дроби или выражение)...',
      formatHint: kindHint,
    };
  }
  return null;
}

export function checkRkTaskAnswer(
  taskId: string,
  rawInput: string,
): TaskAnswerCheckResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isCorrect: false,
      feedback: 'Сначала введите ваш ответ в поле выше.',
    };
  }

  const norm = normalizeMathString(trimmed);
  const nums = extractNumbers(trimmed);

  switch (taskId) {
    case 'rk-base-1': {
      const isZeroMatrix =
        arraysMatch(nums, [0, 0, 0, 0]) ||
        arraysMatch(nums, [0]) ||
        norm.includes('нулев') ||
        norm === 'o' ||
        norm === '0';
      return isZeroMatrix
        ? {
            isCorrect: true,
            feedback: 'Верно! AB = BA = 2E, поэтому AB − BA = Θ (нулевая матрица 2×2).',
          }
        : {
            isCorrect: false,
            feedback:
              'Не совпало. Проверьте произведения AB и BA — оба равны 2E, значит их разность нулевая.',
          };
    }

    case 'rk-base-2':
    case 'rk-base-3': {
      const hasTwo = nums.length > 0 && approxEq(nums[0], 2);
      return hasTwo
        ? {
            isCorrect: true,
            feedback: 'Верно! rang A = 2. Не забудьте на РК явно выписать один ненулевой минор 2-го порядка.',
          }
        : {
            isCorrect: false,
            feedback:
              'Ранг другой. После приведения к ступенчатому виду остаётся ровно две ненулевые строки.',
          };
    }

    case 'rk-base-4': {
      const ok = arraysMatch(nums, [-7, 4, -25, 14]);
      return ok
        ? {
            isCorrect: true,
            feedback: 'Точно в цель! X = B · A⁻¹ = ((−7, 4), (−25, 14)).',
          }
        : {
            isCorrect: false,
            feedback:
              'Не совпало. Убедитесь, что умножали на A⁻¹ СПРАВА (X = B · A⁻¹), а не слева, и разделили на det A = 2.',
          };
    }

    case 'rk-base-5': {
      const ok = arraysMatch(nums, [3, 4, 4, 6]);
      return ok
        ? {
            isCorrect: true,
            feedback: 'Верно! X = A⁻¹ · B = ((3, 4), (4, 6)).',
          }
        : {
            isCorrect: false,
            feedback:
              'Не совпало. Проверьте знак det A = −1 и порядок умножения (A⁻¹ стоит СЛЕВА от B).',
          };
    }

    case 'rk-base-6': {
      const expected = [7 / 18, -5 / 18, 1 / 18, 1 / 18, 7 / 18, -5 / 18, -5 / 18, 1 / 18, 7 / 18];
      const expectedAdj = [7, -5, 1, 1, 7, -5, -5, 1, 7];
      const directMatch = arraysMatch(nums, expected, 0.01);
      const factoredMatch =
        nums.length === 10 &&
        approxEq(nums[0], 1 / 18, 0.01) &&
        arraysMatch(nums.slice(1), expectedAdj, 0.01);
      const detAndAdjMatch =
        nums.length === 10 &&
        approxEq(nums[0], 18, 0.01) &&
        arraysMatch(nums.slice(1), expectedAdj, 0.01);

      if (directMatch || factoredMatch || detAndAdjMatch) {
        return {
          isCorrect: true,
          feedback: 'Отлично! Обратная матрица A⁻¹ = (1/18)·A* вычислена верно (и транспонирование не забыто!).',
        };
      }
      // Detect forgotten transpose
      const untransposedAdj = [7, 1, -5, -5, 7, 1, 1, -5, 7];
      if (
        (nums.length === 10 && arraysMatch(nums.slice(1), untransposedAdj, 0.01)) ||
        arraysMatch(
          nums,
          untransposedAdj.map((v) => v / 18),
          0.01,
        )
      ) {
        return {
          isCorrect: false,
          feedback:
            'Классическая ловушка! Алгебраические дополнения найдены верно, но вы забыли ТРАНСПОНИРОВАТЬ матрицу A*!',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Не совпало. Проверьте det A = 18 и знаки алгебраических дополнений (−1)^(i+j) с последующим транспонированием.',
      };
    }

    case 'rk-base-7': {
      if (nums.length !== 8) {
        return {
          isCorrect: false,
          feedback:
            'Нужно ввести 8 чисел — координаты двух векторов ФСР из ℝ⁴ (например: (-9, 7, 1, 0); (-1, 0, 0, 2)).',
        };
      }
      const v1 = nums.slice(0, 4);
      const v2 = nums.slice(4, 8);
      const A = [
        [2, 3, -3, 1],
        [4, 5, 1, 2],
      ];
      if (
        satisfiesHomogeneousSystem(A, v1) &&
        satisfiesHomogeneousSystem(A, v2) &&
        areTwoVectorsIndependent(v1, v2)
      ) {
        return {
          isCorrect: true,
          feedback:
            'Блестяще! Оба вектора удовлетворяют однородной системе и линейно независимы — это корректная ФСР.',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Проверка подстановкой Ae = 0 (или линейная независимость) не прошла. Перепроверьте выражение x₁ и x₂ через свободные переменные.',
      };
    }

    case 'rk-base-8': {
      const ok = arraysMatch(nums, [1, 1, 1]);
      return ok
        ? {
            isCorrect: true,
            feedback: 'Верно! Единственное решение: x₁ = 1, x₂ = 1, x₃ = 1.',
          }
        : {
            isCorrect: false,
            feedback:
              'Не совпало. Сложите 2-е и 3-е уравнения: −x₁ = −1 ⇒ x₁ = 1, затем подставьте обратно.',
          };
    }

    case 'rk-adv-1': {
      const ok = arraysMatch(nums, [5, -3]);
      return ok
        ? {
            isCorrect: true,
            feedback: 'Верно! x⁰ = 5e₁ − 3e₂ (c₁ = 5, c₂ = −3).',
          }
        : {
            isCorrect: false,
            feedback:
              'Не совпало. Проверьте систему по первым двум координатам: c₁ + 2c₂ = −1 и −c₁ + c₂ = −8.',
          };
    }

    case 'rk-adv-2': {
      if (nums.length !== 15) {
        return {
          isCorrect: false,
          feedback:
            'Размерность ФСР равна n − r = 5 − 2 = 3, поэтому введите 15 чисел (3 вектора по 5 координат).',
        };
      }
      const v1 = nums.slice(0, 5);
      const v2 = nums.slice(5, 10);
      const v3 = nums.slice(10, 15);
      const A = [
        [1, 2, 7, -1, -9],
        [4, 1, 5, -1, -4],
        [7, 0, 3, -1, 1],
        [-3, 1, 2, 0, -5],
      ];
      if (
        satisfiesHomogeneousSystem(A, v1) &&
        satisfiesHomogeneousSystem(A, v2) &&
        satisfiesHomogeneousSystem(A, v3) &&
        matrixRank2D([v1, v2, v3]) === 3
      ) {
        return {
          isCorrect: true,
          feedback:
            'Великолепно! Все 3 вектора удовлетворяют системе и линейно независимы — это полноценная ФСР.',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Как минимум один вектор не удовлетворяет СЛАУ или векторы линейно зависимы. Подставьте ваши векторы в первые два уравнения для самопроверки.',
      };
    }

    case 'rk-adv-3': {
      const ok = nums.length > 0 && approxEq(nums[0], 2);
      return ok
        ? {
            isCorrect: true,
            feedback:
              'Верно! Наименьшее число уравнений m_min = rang A = n − k = 4 − 2 = 2.',
          }
        : {
            isCorrect: false,
            feedback:
              'Подсказка: в векторе n = 4 неизвестных и k = 2 независимых параметра c₁, c₂. По формуле r = n − k найдите минимальное число уравнений.',
          };
    }

    case 'rk-ticket-1': {
      const isIdentity =
        arraysMatch(nums, [1, 0, 0, 0, 1, 0, 0, 0, 1]) ||
        norm === 'e' ||
        norm === 'i' ||
        norm === 'a^2=e' ||
        norm.includes('единич');
      return isIdentity
        ? {
            isCorrect: true,
            feedback: 'Верно! A² = E (единичная матрица 3×3).',
          }
        : {
            isCorrect: false,
            feedback:
              'Не совпало. Проверьте умножение «строка на столбец» — матрица A инволютивна, должно получиться E.',
          };
    }

    case 'rk-ticket-2': {
      const ok = arraysMatch(nums, [25, 36, 7, 10]);
      return ok
        ? {
            isCorrect: true,
            feedback: 'Верно! X = A⁻¹ · B = ((25, 36), (7, 10)).',
          }
        : {
            isCorrect: false,
            feedback:
              'Не совпало. Проверьте A⁻¹ = ((4, 7), (1, 2)) (так как det A = 1) и умножение A⁻¹ слева на B.',
          };
    }

    case 'rk-ticket-3': {
      if (nums.length !== 8) {
        return {
          isCorrect: false,
          feedback:
            'Введите 8 чисел — два вектора ФСР по 4 координаты (например: (-1, 0, 1, 0); (0, -1, 0, 1)).',
        };
      }
      const v1 = nums.slice(0, 4);
      const v2 = nums.slice(4, 8);
      const A = [
        [2, -1, 2, -1],
        [-1, 1, -1, 1],
      ];
      if (
        satisfiesHomogeneousSystem(A, v1) &&
        satisfiesHomogeneousSystem(A, v2) &&
        areTwoVectorsIndependent(v1, v2)
      ) {
        return {
          isCorrect: true,
          feedback: 'Верно! Оба вектора образуют линейно независимую ФСР данной однородной СЛАУ.',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Не прошла проверка Ae = 0 или линейная независимость. Сложите оба уравнения: сразу получится x₁ + x₃ = 0.',
      };
    }

    case 'rk-ticket-4': {
      if (nums.length !== 6) {
        return {
          isCorrect: false,
          feedback:
            'Введите 6 чисел: 3 координаты частного решения x⁰ и 3 координаты вектора ФСР e₁ (например: (2/3, 0, -2) + c(1, 1, -5)).',
        };
      }
      const x0 = nums.slice(0, 3);
      const e1 = nums.slice(3, 6);
      const eq1 = 3 * x0[0] + 2 * x0[1] + x0[2];
      const eq2 = 3 * x0[0] + 7 * x0[1] + 2 * x0[2];
      const A = [
        [3, 2, 1],
        [3, 7, 2],
      ];
      if (
        approxEq(eq1, 0, 0.02) &&
        approxEq(eq2, -2, 0.02) &&
        isNonZeroVector(e1) &&
        satisfiesHomogeneousSystem(A, e1)
      ) {
        return {
          isCorrect: true,
          feedback:
            'Точно! Ваше частное решение удовлетворяет СЛАУ, а направляющий вектор принадлежит ФСР однородной системы.',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Проверка подстановкой не прошла. Убедитесь, что x⁰ даёт правую часть (0, −2), а вектор e₁ обнуляет левую часть.',
      };
    }

    case 'rk-ticket-5': {
      if (nums.length !== 12) {
        return {
          isCorrect: false,
          feedback:
            'Введите 12 чисел: частное решение x⁰ (4 числа) и два вектора ФСР e₁, e₂ (8 чисел).',
        };
      }
      const x0 = nums.slice(0, 4);
      const e1 = nums.slice(4, 8);
      const e2 = nums.slice(8, 12);
      const A = [
        [1, 1, 2, 2],
        [1, 3, 2, 6],
        [1, -1, 2, -2],
        [1, -3, 2, -6],
      ];
      const b = [10, 20, 0, -10];
      const x0Valid = A.every((row, i) => {
        const val = row.reduce((acc, c, j) => acc + c * x0[j], 0);
        return approxEq(val, b[i], 0.02);
      });
      if (
        x0Valid &&
        satisfiesHomogeneousSystem(A, e1) &&
        satisfiesHomogeneousSystem(A, e2) &&
        areTwoVectorsIndependent(e1, e2)
      ) {
        return {
          isCorrect: true,
          feedback:
            'Отлично! Частное решение и оба вектора ФСР полностью верны (принят любой эквивалентный выбор свободных переменных).',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Проверка подстановкой не прошла. Проверьте уравнения x₂ + 2x₄ = 5 и x₁ + 2x₃ = 5.',
      };
    }

    case 'rk-ticket-6': {
      const hasMinusThree = nums.some((n) => approxEq(n, -3));
      const hasTwo = nums.some((n) => approxEq(n, 2));
      const hasThree = nums.some((n) => approxEq(n, 3));
      if (hasMinusThree && hasTwo && hasThree) {
        return {
          isCorrect: true,
          feedback: 'Верно! При λ = −3 ранг равен 2, а при λ ≠ −3 ранг равен 3.',
        };
      }
      if (hasMinusThree && nums.length === 1) {
        return {
          isCorrect: true,
          feedback:
            'Критическое значение λ = −3 найдено верно! На РК обязательно допишите оба случая: при λ = −3 rang A = 2, при λ ≠ −3 rang A = 3.',
        };
      }
      return {
        isCorrect: false,
        feedback:
          'Перепроверьте элементарные преобразования строк: в 3-й строке после обнуления должно получиться λ + 3.',
      };
    }

    // ======================== МАТАН · КОМПЛЕКТ №1 (ПРЕДЕЛЫ) ========================
    case 'matan-1-1': {
      const ok = nums.some((n) => approxEq(n, 4));
      return ok
        ? {isCorrect: true, feedback: 'Верно! Предел равен 1 + 3 = 4.'}
        : {
            isCorrect: false,
            feedback: 'Не совпало. Проверьте вынесение x из-под корней: ∛(x²·x) = x, поэтому x/x + 3x/x = 1 + 3 = 4.',
          };
    }

    case 'matan-1-2': {
      const ok = nums.some((n) => approxEq(n, -3));
      if (nums.some((n) => approxEq(n, 3)) && !ok) {
        return {
          isCorrect: false,
          feedback: 'Поймались на классической ловушке! При x → −∞ имеем √(x²) = |x| = −x, поэтому ответ со знаком МИНУС: −3.',
        };
      }
      return ok
        ? {isCorrect: true, feedback: 'Точно! Вы учли |x| = −x при x → −∞ и получили −3.'}
        : {isCorrect: false, feedback: 'Не совпало. Домножьте на сопряжённую сумму корней и учтите √(x²) = −x при x → −∞.'};
    }

    case 'matan-1-3': {
      const ok = nums.some((n) => approxEq(n, 0.5));
      return ok
        ? {isCorrect: true, feedback: 'Верно! tg x − sin x ~ x³/2, знаменатель ln(1+x³) ~ x³, предел равен 1/2.'}
        : {
            isCorrect: false,
            feedback: 'Не совпало. Разложите tg x − sin x = sin x·(1 − cos x)/cos x ~ x³/2.',
          };
    }

    case 'matan-1-4': {
      const hasSymbolic =
        (norm.includes('e') && (norm.includes('2/pi') || norm.includes('2/π'))) ||
        nums.some((n) => approxEq(n, Math.exp(2 / Math.PI), 0.03));
      return hasSymbolic
        ? {isCorrect: true, feedback: 'Блестяще! После замены t = x − 1 получается e^(2/π).'}
        : {
            isCorrect: false,
            feedback: 'Не совпало. Используйте замену t = x − 1 → 0 и формулу приведения tg(π/2 + πt/2) = −ctg(πt/2).',
          };
    }

    case 'matan-1-5': {
      const ok = nums.some((n) => approxEq(n, 8));
      return ok
        ? {isCorrect: true, feedback: 'Верно! Отношение старших коэффициентов 2⁶ / 2³ = 8.'}
        : {isCorrect: false, feedback: 'Не совпало. Вынесите x¹⁸: отношение старших коэффициентов равно 2⁶ / 2³.'};
    }

    case 'matan-1-6': {
      const hasSymbolic =
        (norm.includes('e') && (norm.includes('-2/9') || norm.includes('-0.22'))) ||
        nums.some((n) => approxEq(n, Math.exp(-2 / 9), 0.02)) ||
        nums.some((n) => approxEq(n, -2 / 9, 0.01));
      return hasSymbolic
        ? {isCorrect: true, feedback: 'Верно! Основание 1 − 4(1 − cos x)/cos x ~ 1 − 2x², показатель 1/(9x²) ⇒ e^(−2/9).'}
        : {
            isCorrect: false,
            feedback: 'Не совпало. Выделите 1 в основании: 5 − 4/cos x = 1 − 4(1 − cos x)/cos x, затем 1 − cos x ~ x²/2.',
          };
    }

    case 'matan-1-7': {
      const ok = nums.some((n) => approxEq(n, -2.5));
      if (nums.some((n) => approxEq(n, 2.5)) && !ok) {
        return {
          isCorrect: false,
          feedback: 'Ловушка Методички Ч.1! При x → −∞ имеем √(x²) = |x| = −x, поэтому ответ отрицательный: −5/2.',
        };
      }
      return ok
        ? {isCorrect: true, feedback: 'Точно! 10 / (−(2 + 2)) = −5/2 — знак модуля учтён верно.'}
        : {isCorrect: false, feedback: 'Не совпало. Домножьте на сопряжённую сумму корней и вынесите |x| = −x из знаменателя.'};
    }

    case 'matan-1-8': {
      const piSq = Math.PI * Math.PI;
      const hasSymbolic =
        (norm.includes('18') && (norm.includes('pi') || norm.includes('π'))) ||
        nums.some((n) => approxEq(n, 18 / piSq, 0.03));
      return hasSymbolic
        ? {isCorrect: true, feedback: 'Верно! После замены t = x − 1 получаем (3t)² / ((πt)²/2) = 18/π².'}
        : {isCorrect: false, feedback: 'Сделайте замену t = x − 1: arcsin²(3t) ~ 9t², а 1 + cos(π + πt) = 1 − cos(πt) ~ π²t²/2.'};
    }

    case 'matan-1-9': {
      const hasSymbolic =
        (norm.includes('e') && (norm.includes('4/3') || norm.includes('1.33'))) ||
        nums.some((n) => approxEq(n, Math.exp(4 / 3), 0.04)) ||
        nums.some((n) => approxEq(n, 4 / 3, 0.01));
      return hasSymbolic
        ? {isCorrect: true, feedback: 'Блестяще! После разложения x − 8 по разности кубов показатель стремится к 12/9 = 4/3 ⇒ e^(4/3).'}
        : {isCorrect: false, feedback: 'Выделите 1 в основании ((x−8)/(x+1)) и разложите x − 8 = (∛x − 2)(∛(x²) + 2∛x + 4).'};
    }

    // ======================== МАТАН · КОМПЛЕКТ №2 (СРАВНЕНИЕ Б.М./Б.Б.) ========================
    case 'matan-2-1': {
      const ok =
        nums.some((n) => approxEq(n, 0.75)) ||
        norm.includes('одного порядка') ||
        norm.includes('одинакового');
      return ok
        ? {isCorrect: true, feedback: 'Верно! Предел отношения равен (1/4)/(1/3) = 3/4 ⇒ б.м.ф. одного порядка.'}
        : {isCorrect: false, feedback: 'Не совпало. Замена t = x − 1 даёт (1/4)t и (1/3)t, их отношение равно 3/4.'};
    }

    case 'matan-2-2': {
      const ok = nums.some((n) => approxEq(n, 4));
      return ok
        ? {isCorrect: true, feedback: 'Верно! Старшая степень x⁵ / x = x⁴ ⇒ порядок роста k = 4.'}
        : {isCorrect: false, feedback: 'Не совпало. Сравните старшие степени числителя (x⁵) и знаменателя (√(x²) = x).'};
    }

    case 'matan-2-3': {
      const ok = nums.some((n) => approxEq(n, 0.125));
      return ok
        ? {isCorrect: true, feedback: 'Отлично! При x → +0 главная часть равна √(√(√x)) = x^(1/8), порядок k = 1/8.'}
        : {isCorrect: false, feedback: 'Не совпало. При x → +0 наименьшая степень главнее: √x → x^(1/4) → x^(1/8).'};
    }

    case 'matan-2-4': {
      const ok =
        norm.includes('одного порядка') ||
        norm.includes('ln(2/3)') ||
        norm.includes('ln2-ln3') ||
        norm.includes('ln 2 - ln 3') ||
        nums.some((n) => approxEq(n, Math.log(2 / 3), 0.02));
      return ok
        ? {isCorrect: true, feedback: 'Верно! Предел отношения равен ln(2/3) ≠ 0 ⇒ б.м.ф. одного порядка.'}
        : {isCorrect: false, feedback: 'Не совпало. Используйте aˣ − 1 ~ x ln a: 2ˣ − 3ˣ ~ x ln(2/3).'};
    }

    case 'matan-2-5': {
      const ok = nums.some((n) => approxEq(n, 2));
      return ok
        ? {isCorrect: true, feedback: 'Верно! sin(1 − cos x) ~ 1 − cos x ~ (1/2)x² ⇒ порядок малости k = 2.'}
        : {isCorrect: false, feedback: 'Не совпало. 1 − cos x ~ x²/2, а синус от б.м.ф. эквивалентен самому аргументу.'};
    }

    case 'matan-2-6': {
      const ok = nums.some((n) => approxEq(n, 3));
      return ok
        ? {isCorrect: true, feedback: 'Верно! tg x − sin x ~ (1/2)x³ ⇒ порядок малости k = 3.'}
        : {isCorrect: false, feedback: 'Не совпало. Вынесите sin x: sin x · (1 − cos x)/cos x ~ x · x²/2 = (1/2)x³.'};
    }

    case 'matan-2-7': {
      const hasOrder = nums.some((n) => approxEq(n, 2));
      const hasCoeff = nums.some((n) => approxEq(n, -1 / 3, 0.01));
      return hasOrder || hasCoeff
        ? {isCorrect: true, feedback: 'Верно! Числитель −(x − 1)², знаменатель → 3, значит главная часть −(1/3)(x − 1)², порядок k = 2.'}
        : {isCorrect: false, feedback: 'Сверните числитель 2x − 1 − x² = −(x − 1)² и подставьте x = 1 в знаменатель x² + 2.'};
    }

    case 'matan-2-8': {
      const hasOrder = nums.some((n) => approxEq(n, 2));
      const hasCoeff = nums.some((n) => approxEq(n, -2));
      return hasOrder || hasCoeff
        ? {isCorrect: true, feedback: 'Верно! (2x⁵)/(−x³) = −2x² ⇒ главная часть −2x², порядок роста б.б.ф. k = 2.'}
        : {isCorrect: false, feedback: 'При x → ∞ знаменатель 1 − x³ ~ −x³, откуда главная часть дроби равна −2x² (k = 2).'};
    }

    case 'matan-2-9': {
      const hasOrder = nums.some((n) => approxEq(n, 2));
      const hasCoeff = nums.some((n) => approxEq(n, -2));
      return hasOrder || hasCoeff
        ? {isCorrect: true, feedback: 'Отлично! ln(1 + 2x) − 2x = −2x² + o(x²) ⇒ главная часть −2x², порядок малости k = 2.'}
        : {isCorrect: false, feedback: 'Разложите ln(1 + 2x) = 2x − (2x)²/2 + o(x²): после вычитания 2x остаётся −2x² (k = 2).'};
    }

    // ======================== МАТАН · КОМПЛЕКТ №3 (РАЗРЫВЫ) ========================
    case 'matan-3-1': {
      const hasAll =
        nums.some((n) => approxEq(n, -1)) &&
        nums.some((n) => approxEq(n, 0)) &&
        nums.some((n) => approxEq(n, 1));
      return hasAll
        ? {
            isCorrect: true,
            feedback:
              'Верно! Все 3 точки найдены: x = −1 (II род), x = 0 (I род, скачок), x = 1 (I род, скачок π у arctg).',
          }
        : {
            isCorrect: false,
            feedback: 'Проверьте все три подозрительные точки: x = −1, x = 0 (стык) и x = 1 (знаменатель под arctg).',
          };
    }

    case 'matan-3-2': {
      const hasBoth = nums.some((n) => approxEq(n, 2)) && nums.some((n) => approxEq(n, -3));
      return hasBoth
        ? {isCorrect: true, feedback: 'Верно! x = 2 — устранимый разрыв I рода (предел 4/5), x = −3 — разрыв II рода.'}
        : {isCorrect: false, feedback: 'Найдите оба корня знаменателя x² + x − 6 = (x − 2)(x + 3).'};
    }

    case 'matan-3-3': {
      const hasBoth =
        (nums.some((n) => approxEq(n, 1)) && nums.some((n) => approxEq(n, -1))) ||
        norm.includes('+-1') ||
        norm.includes('±1');
      return hasBoth
        ? {isCorrect: true, feedback: 'Верно! В обеих точках x = ±1 один из односторонних пределов равен −∞ (II род).'}
        : {isCorrect: false, feedback: 'Проверьте оба нуля знаменателя показателя: x² − 1 = 0 ⇒ x = −1 и x = 1.'};
    }

    case 'matan-3-4': {
      const hasZero = nums.some((n) => approxEq(n, 0));
      return hasZero
        ? {isCorrect: true, feedback: 'Верно! В x = 0 — разрыв I рода (скачок π/2), а в x = π функция непрерывна.'}
        : {isCorrect: false, feedback: 'Проверьте оба стыка: в x = 0 пределы −π/2 и 0 (разрыв I рода), в x = π оба равны π/4.'};
    }

    case 'matan-3-5': {
      const hasThree = nums.some((n) => approxEq(n, 3));
      return hasThree
        ? {isCorrect: true, feedback: 'Верно! В точке x = 3 левый предел 1, правый 0 ⇒ разрыв I рода (скачок −1).'}
        : {isCorrect: false, feedback: 'Проверьте точку x = 3: при x → 3±0 показатель 1/(x−3) → ±∞.'};
    }

    case 'matan-3-6': {
      const ok = nums.some((n) => approxEq(n, 3));
      return ok
        ? {isCorrect: true, feedback: 'Верно! lim_{x→0} (sin 3x)/x = 3, значит a = 3.'}
        : {isCorrect: false, feedback: 'Вычислите lim_{x→0} (sin 3x)/x по первому замечательному пределу.'};
    }

    case 'matan-3-7': {
      const hasZero = nums.some((n) => approxEq(n, 0));
      const hasOne = nums.some((n) => approxEq(n, 1));
      return hasZero && hasOne
        ? {isCorrect: true, feedback: 'Верно! x = 0 — разрыв I рода (скачок −2), x = 1 — II род, а в x = 2 функция непрерывна!'}
        : {isCorrect: false, feedback: 'Проверьте x = 0 (стык: 1 и −1 ⇒ I род), x = 1 (1/(x−1) ⇒ II род) и x = 2 (1 = 1 ⇒ непрерывна).'};
    }

    case 'matan-3-8': {
      const hasFour = nums.some((n) => approxEq(n, 4));
      const mentionsSecondKind = norm.includes('ii') || norm.includes('2 род') || norm.includes('2-го') || norm.includes('второго');
      if (hasFour && mentionsSecondKind) {
        return {
          isCorrect: false,
          feedback: 'Ловушка! Хотя 1/(x−4) → ±∞, сам arctg имеет КОНЕЧНЫЕ пределы −π/2 и +π/2 — это разрыв I рода со скачком π!',
        };
      }
      return hasFour
        ? {isCorrect: true, feedback: 'Верно! В точке x = 4 оба предела arctg конечны (−π/2 и +π/2) ⇒ разрыв I рода со скачком π.'}
        : {isCorrect: false, feedback: 'Точка разрыва x = 4: вычислите arctg(−∞) = −π/2 и arctg(+∞) = +π/2.'};
    }

    case 'matan-3-9': {
      const hasFive = nums.some((n) => approxEq(n, 5));
      const hasTen = nums.some((n) => approxEq(n, 10));
      return hasFive || hasTen
        ? {isCorrect: true, feedback: 'Верно! x = 5 — устранимый разрыв, доопределение по непрерывности: f(5) = 10.'}
        : {isCorrect: false, feedback: 'Сократите (x−5)(x+5)/(x−5) = x + 5: при x → 5 предел равен 10 (устранимый разрыв).'};
    }

    // ======================== МАТАН · КОМПЛЕКТ №4 (КАСАТЕЛЬНАЯ И ТЕЙЛОР) ========================
    case 'matan-4-1': {
      const ok =
        (nums.some((n) => approxEq(n, -1)) && nums.some((n) => approxEq(n, 1))) ||
        (norm.includes('2x+3') && norm.includes('-2x+3'));
      return ok
        ? {isCorrect: true, feedback: 'Верно! Точки M₁(−1, 1) и M₂(1, 1); касательные y = 2x + 3 и y = −2x + 3.'}
        : {isCorrect: false, feedback: 'Решите e^(1−x²) = 1 ⇒ x = ±1, затем найдите y′ = −2x e^(1−x²).'};
    }

    case 'matan-4-2': {
      const ok =
        (nums.some((n) => approxEq(n, 1)) && nums.some((n) => approxEq(n, 0))) ||
        norm.replace(/\s+/g, '').includes('y=x-1');
      return ok
        ? {isCorrect: true, feedback: 'Верно! Точка касания (1, 0), уравнение касательной y = x − 1.'}
        : {isCorrect: false, feedback: 'Приравняйте производную 1/x к угловому коэффициенту прямой k = 1.'};
    }

    case 'matan-4-3': {
      const ok = nums.some((n) => approxEq(n, 2));
      return ok
        ? {isCorrect: true, feedback: 'Верно! (x³/3) / (x³/6) = 2.'}
        : {isCorrect: false, feedback: 'Разложите eˣ, e^(−x) и sin x до x³: (x³/3) / (x³/6) = 2.'};
    }

    case 'matan-4-4': {
      const ok = nums.some((n) => approxEq(n, 1 / 3, 0.01));
      return ok
        ? {isCorrect: true, feedback: 'Верно! Коэффициент при x³ равен 1/2 − 1/6 = 1/3.'}
        : {isCorrect: false, feedback: 'Перемножьте (1 + x + x²/2) и (x − x³/6), собрав все слагаемые при x³.'};
    }

    case 'matan-4-5': {
      const compact = norm.replace(/\s+/g, '');
      const ok =
        arraysMatch(nums, [1, -1, 1, -1]) ||
        (compact.includes('1-(x-1)+(x-1)^2-(x-1)^3') || compact.includes('1-t+t^2-t^3'));
      return ok
        ? {isCorrect: true, feedback: 'Верно! 1/x = 1 − (x − 1) + (x − 1)² − (x − 1)³ + o((x − 1)³).'}
        : {isCorrect: false, feedback: 'Сделайте замену t = x − 1 и разложите 1/(1 + t) = 1 − t + t² − t³ + o(t³).'};
    }

    case 'matan-4-6': {
      const ok = nums.some((n) => approxEq(n, -1 / 12, 0.005));
      return ok
        ? {isCorrect: true, feedback: 'Точно! (1/24 − 1/8) = −2/24 = −1/12.'}
        : {isCorrect: false, feedback: 'Разложите обе функции до x⁴: cos x имеет +x⁴/24, а e^(−x²/2) имеет +x⁴/8.'};
    }

    // ======================== МАТАН · КОМПЛЕКТ №5 (ИССЛЕДОВАНИЕ ФУНКЦИЙ) ========================
    case 'matan-5-1': {
      const hasZero = nums.some((n) => approxEq(n, 0));
      const hasCubeRoot4 =
        nums.some((n) => approxEq(n, Math.cbrt(4), 0.05)) ||
        norm.includes('4^(1/3)') ||
        norm.includes('cbrt(4)') ||
        norm.includes('∛4');
      return hasZero && hasCubeRoot4
        ? {isCorrect: true, feedback: 'Верно! x_max = 0 и x_min = ∛4 (точка x = 1 — разрыв, не экстремум!).'}
        : {isCorrect: false, feedback: 'Решите f′(x) = x³(x³ − 4)/(x³ − 1)² = 0 ⇒ x = 0 и x = ∛4.'};
    }

    case 'matan-5-2': {
      const ok = nums.some((n) => approxEq(n, 0));
      return ok
        ? {isCorrect: true, feedback: 'Верно! Единственная точка минимума x_min = 0, f(0) = 0.'}
        : {isCorrect: false, feedback: 'Приравняйте f′(x) = 2x/(1 + x²) к нулю.'};
    }

    case 'matan-5-3': {
      const ok =
        (nums.some((n) => approxEq(n, -1)) && nums.some((n) => approxEq(n, 1))) ||
        norm.includes('+-1') ||
        norm.includes('±1');
      return ok
        ? {isCorrect: true, feedback: 'Верно! Точки перегиба x = ±1, ординаты f(±1) = ln 2.'}
        : {isCorrect: false, feedback: 'Решите f″(x) = 2(1 − x²)/(1 + x²)² = 0 ⇒ x = ±1.'};
    }

    case 'matan-5-4': {
      const ok = nums.some((n) => approxEq(n, 0)) && nums.some((n) => approxEq(n, 2));
      return ok
        ? {isCorrect: true, feedback: 'Верно! x_max = 0 (y = 0), x_min = 2 (y = 2); асимптоты x = 1 и y = (1/2)x + 1/2.'}
        : {isCorrect: false, feedback: 'Найдите нули числителя f′(x) = x(x − 2)/(2(x − 1)²).'};
    }

    case 'matan-5-5': {
      const ok =
        (nums.some((n) => approxEq(n, -1)) && nums.some((n) => approxEq(n, 1))) ||
        norm.includes('+-1') ||
        norm.includes('±1');
      return ok
        ? {isCorrect: true, feedback: 'Верно! x_max = −1 (y = −2), x_min = 1 (y = 2); асимптоты x = 0 и y = x.'}
        : {isCorrect: false, feedback: 'Запишите f(x) = x + 1/x и решите f′(x) = 1 − 1/x² = 0.'};
    }

    case 'matan-5-6': {
      const hasSymbolic = norm.includes('sqrt(2)') || norm.includes('√2');
      const hasNumeric =
        nums.some((n) => approxEq(n, 1 - Math.SQRT2, 0.05)) &&
        nums.some((n) => approxEq(n, 1 + Math.SQRT2, 0.05));
      return hasSymbolic || hasNumeric
        ? {isCorrect: true, feedback: 'Верно! x_max = 1 − √2, x_min = 1 + √2.'}
        : {isCorrect: false, feedback: 'Решите числитель производной x² − 2x − 1 = 0 ⇒ x = 1 ± √2.'};
    }

    default: {
      const ticketTask = MATAN_EXAM_TICKET_TASKS.find((t) => t.id === taskId);
      if (ticketTask && ticketTask.expectedOutput) {
        const expectedNorm = normalizeMathString(ticketTask.expectedOutput);
        const expectedNums = extractNumbers(ticketTask.expectedOutput);
        const compactInput = norm.replace(/\s+/g, '');
        const compactExpected = expectedNorm.replace(/\s+/g, '');

        const symbolicHit =
          (compactExpected.includes('одногопорядка') && norm.includes('одного')) ||
          (compactExpected.includes('бесконечности') &&
            (norm.includes('не существ') || norm.includes('нет') || norm.includes('расход'))) ||
          (compactExpected.includes('касательныхнет') &&
            (norm.includes('нет') || norm.includes('не существ'))) ||
          (compactExpected.includes('асимптотнет') &&
            (norm.includes('нет') || expectedNums.every((en) => nums.some((un) => approxEq(un, en, 0.05))))) ||
          (compactInput.length >= 2 && compactExpected.includes(compactInput));

        const numericHit =
          expectedNums.length > 0 &&
          nums.length > 0 &&
          (expectedNums.every((en) => nums.some((un) => approxEq(un, en, 0.05))) ||
            (nums.length >= 1 &&
              expectedNums.filter((en) => nums.some((un) => approxEq(un, en, 0.05))).length >=
                Math.min(2, expectedNums.length)));

        if (symbolicHit || numericHit) {
          return {
            isCorrect: true,
            feedback: `Верно! Эталонный ответ билета ФН-12: ${ticketTask.expectedOutput}`,
          };
        }
        return {
          isCorrect: false,
          feedback: `Ответ пока не совпал с эталоном. Подсказка по методу: ${ticketTask.algorithmSummary}`,
        };
      }

      return {
        isCorrect: false,
        feedback: 'Для этой задачи автопроверка пока не подключена — сверьтесь с пошаговым решением.',
      };
    }
  }
}
