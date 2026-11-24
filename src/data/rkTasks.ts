import {TaskCard, TheoryCard} from '../types/study';

export const RK_TASKS: TaskCard[] = [
  // ======================== БАЗОВЫЙ УРОВЕНЬ (8 задач, стр. 2) ========================
  {
    id: 'rk-base-1',
    category: 'rk',
    kind: 'rk-basic',
    badgeNumber: 'База №1 (7 баллов)',
    title: 'Коммутатор матриц AB − BA',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement: '1. Вычислить AB − BA, если заданы квадратные матрицы A и B второго порядка (7 баллов).',
    problemTextClean: '1. Вычислить AB − BA, если (7 баллов)',
    problemLatex: String.raw`A = \begin{pmatrix} 11 & 15 \\ -6 & -8 \end{pmatrix}, \qquad B = \begin{pmatrix} -8 & -15 \\ 6 & 11 \end{pmatrix}.`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 2,
      topRatio: 0.228,
      bottomRatio: 0.328,
    },
    algorithmSummary:
      'Умножаем матрицы 2×2 по правилу «строка на столбец»: замечаем, что B является присоединённой матрицей A*, а det A = −88 + 90 = 2, поэтому AB = BA = 2E, откуда AB − BA = Θ.',
    explanationSteps: [
      {
        title: 'Шаг 1. Вычисление произведения матриц A · B',
        detail:
          'Перемножаем строки матрицы A на столбцы матрицы B по правилу «строка на столбец»:',
        latex: String.raw`A \cdot B = \begin{pmatrix} 11 & 15 \\ -6 & -8 \end{pmatrix} \begin{pmatrix} -8 & -15 \\ 6 & 11 \end{pmatrix} = \begin{pmatrix} 11\cdot(-8)+15\cdot 6 & 11\cdot(-15)+15\cdot 11 \\ (-6)\cdot(-8)+(-8)\cdot 6 & (-6)\cdot(-15)+(-8)\cdot 11 \end{pmatrix} = \begin{pmatrix} 2 & 0 \\ 0 & 2 \end{pmatrix} = 2E`,
      },
      {
        title: 'Шаг 2. Вычисление произведения матриц B · A',
        detail:
          'Аналогично перемножаем матрицу B на матрицу A:',
        latex: String.raw`B \cdot A = \begin{pmatrix} -8 & -15 \\ 6 & 11 \end{pmatrix} \begin{pmatrix} 11 & 15 \\ -6 & -8 \end{pmatrix} = \begin{pmatrix} -88+90 & -120+120 \\ 66-66 & 90-88 \end{pmatrix} = \begin{pmatrix} 2 & 0 \\ 0 & 2 \end{pmatrix} = 2E`,
      },
      {
        title: 'Шаг 3. Вычисление разности AB − BA',
        detail:
          'Вычитаем полученные матрицы поэлементно:',
        latex: String.raw`AB - BA = \begin{pmatrix} 2 & 0 \\ 0 & 2 \end{pmatrix} - \begin{pmatrix} 2 & 0 \\ 0 & 2 \end{pmatrix} = \begin{pmatrix} 0 & 0 \\ 0 & 0 \end{pmatrix}`,
      },
    ],
    code: `AB = 2E, BA = 2E  =>  AB - BA = 0`,
    expectedOutput: 'Нулевая матрица размера 2×2',
    answerLatex: String.raw`AB - BA = \begin{pmatrix} 0 & 0 \\ 0 & 0 \end{pmatrix}`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 2,
        label: 'РК 2 · Задачи базового уровня: Задача №1 (стр. 2)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-base-2',
    category: 'rk',
    kind: 'rk-basic',
    badgeNumber: 'База №2 (7 баллов)',
    title: 'Ранг и базисный минор матрицы 3×4',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement:
      '2. Найти ранг и указать базисный минор матрицы размера 3×4 (7 баллов).',
    problemTextClean: '2. Найти ранг и указать базисный минор матрицы (7 баллов)',
    problemLatex: String.raw`A = \begin{pmatrix} 1 & -1 & 3 & -2 \\ 4 & -4 & 4 & 0 \\ 5 & -5 & -1 & 6 \end{pmatrix}.`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 2,
      topRatio: 0.325,
      bottomRatio: 0.435,
    },
    algorithmSummary:
      'Приводим матрицу к ступенчатому виду элементарными преобразованиями строк. Третья строка после обнуления первого столбца оказывается удвоенной второй, откуда rang A = 2, а базисный минор второго порядка стоит на пересечении строк 1, 2 и столбцов 1, 3.',
    explanationSteps: [
      {
        title: 'Шаг 1. Элементарные преобразования строк (метод Гаусса)',
        detail:
          'Вычтем из 2-й строки учетверённую 1-ю строку, а из 3-й строки — упятерённую 1-ю строку, затем обнулим 3-ю строку:',
        latex: String.raw`\begin{pmatrix} 1 & -1 & 3 & -2 \\ 4 & -4 & 4 & 0 \\ 5 & -5 & -1 & 6 \end{pmatrix} \xrightarrow[\text{III} - 5\cdot\text{I}]{\text{II} - 4\cdot\text{I}} \begin{pmatrix} 1 & -1 & 3 & -2 \\ 0 & 0 & -8 & 8 \\ 0 & 0 & -16 & 16 \end{pmatrix} \xrightarrow{\text{III} - 2\cdot\text{II}} \begin{pmatrix} 1 & -1 & 3 & -2 \\ 0 & 0 & -8 & 8 \\ 0 & 0 & 0 & 0 \end{pmatrix}`,
      },
      {
        title: 'Шаг 2. Определение ранга матрицы',
        detail:
          'В полученной ступенчатой матрице ровно две ненулевые строки, а элементарные преобразования сохраняют ранг матрицы:',
        latex: String.raw`\operatorname{rang} A = 2`,
      },
      {
        title: 'Шаг 3. Указание базисного минора в исходной матрице',
        detail:
          'Ведущие элементы ступеней находятся в строках 1, 2 и столбцах 1, 3 (столбцы 1 и 2 пропорциональны). Проверим соответствующий минор 2-го порядка в исходной матрице A:',
        latex: String.raw`M_{1,3}^{1,2} = \begin{vmatrix} 1 & 3 \\ 4 & 4 \end{vmatrix} = 1\cdot 4 - 3\cdot 4 = -8 \neq 0`,
      },
    ],
    code: `rang A = 2, базисный минор M^{1,2}_{1,3} = -8 != 0`,
    expectedOutput:
      'rang A = 2; базисный минор на строках 1, 2 и столбцах 1, 3 равен −8 ≠ 0',
    answerLatex: String.raw`\operatorname{rang} A = 2; \qquad \text{базисный минор } M_{1,3}^{1,2} = \begin{vmatrix} 1 & 3 \\ 4 & 4 \end{vmatrix} = -8 \neq 0 \;\; (\text{строки } 1,2;\; \text{столбцы } 1,3)`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 2,
        label: 'РК 2 · Задачи базового уровня: Задача №2 (стр. 2)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-base-3',
    category: 'rk',
    kind: 'rk-basic',
    badgeNumber: 'База №3 (7 баллов)',
    title: 'Ранг и базисный минор матрицы 4×4',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement:
      '3. Найти ранг и указать базисный минор квадратной матрицы 4×4 (7 баллов).',
    problemTextClean: '3. Найти ранг и указать базисный минор матрицы (7 баллов)',
    problemLatex: String.raw`A = \begin{pmatrix} 1 & 2 & 3 & 4 \\ 2 & 3 & 4 & 5 \\ 3 & 4 & 5 & 6 \\ 4 & 5 & 6 & 7 \end{pmatrix}.`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 2,
      topRatio: 0.432,
      bottomRatio: 0.556,
    },
    algorithmSummary:
      'Вычитаем из каждой строки предыдущую: все разности равны одной и той же строке (1, 1, 1, 1). После вычёркивания повторяющихся строк остаётся 2 линейно независимые строки, откуда rang A = 2.',
    explanationSteps: [
      {
        title: 'Шаг 1. Попарное вычитание соседних строк',
        detail:
          'Из 4-й строки вычтем 3-ю, из 3-й — 2-ю, из 2-й — 1-ю:',
        latex: String.raw`\begin{pmatrix} 1 & 2 & 3 & 4 \\ 2 & 3 & 4 & 5 \\ 3 & 4 & 5 & 6 \\ 4 & 5 & 6 & 7 \end{pmatrix} \xrightarrow[\text{II}-\text{I}]{\text{IV}-\text{III},\; \text{III}-\text{II}} \begin{pmatrix} 1 & 2 & 3 & 4 \\ 1 & 1 & 1 & 1 \\ 1 & 1 & 1 & 1 \\ 1 & 1 & 1 & 1 \end{pmatrix} \sim \begin{pmatrix} 1 & 2 & 3 & 4 \\ 0 & -1 & -2 & -3 \\ 0 & 0 & 0 & 0 \\ 0 & 0 & 0 & 0 \end{pmatrix}`,
      },
      {
        title: 'Шаг 2. Вычисление ранга и выбор базисного минора',
        detail:
          'В ступенчатом виде ровно 2 ненулевые строки, значит ранг равен 2. В качестве базисного минора возьмём левый верхний минор 2-го порядка (строки 1, 2; столбцы 1, 2):',
        latex: String.raw`\operatorname{rang} A = 2, \qquad M_{1,2}^{1,2} = \begin{vmatrix} 1 & 2 \\ 2 & 3 \end{vmatrix} = 1\cdot 3 - 2\cdot 2 = -1 \neq 0`,
      },
    ],
    code: `rang A = 2, базисный минор M^{1,2}_{1,2} = -1 != 0`,
    expectedOutput:
      'rang A = 2; базисный минор на строках 1, 2 и столбцах 1, 2 равен −1 ≠ 0',
    answerLatex: String.raw`\operatorname{rang} A = 2; \qquad \text{базисный минор } M_{1,2}^{1,2} = \begin{vmatrix} 1 & 2 \\ 2 & 3 \end{vmatrix} = -1 \neq 0 \;\; (\text{строки } 1,2;\; \text{столбцы } 1,2)`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 2,
        label: 'РК 2 · Задачи базового уровня: Задача №3 (стр. 2)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-base-4',
    category: 'rk',
    kind: 'rk-basic',
    badgeNumber: 'База №4 (7 баллов)',
    title: 'Матричное уравнение X · A = B',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement: '4. Решить матричное уравнение вида X · A = B (7 баллов).',
    problemTextClean: '4. Решить матричное уравнение (7 баллов)',
    problemLatex: String.raw`X \begin{pmatrix} 3 & 2 \\ 5 & 4 \end{pmatrix} = \begin{pmatrix} -1 & 2 \\ -5 & 6 \end{pmatrix}.`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 2,
      topRatio: 0.554,
      bottomRatio: 0.642,
    },
    algorithmSummary:
      'Так как матрица A стоит справа от неизвестной матрицы X (уравнение X·A = B), умножаем обе части уравнения на обратную матрицу A⁻¹ строго СПРАВА: X = B · A⁻¹.',
    explanationSteps: [
      {
        title: 'Шаг 1. Нахождение определителя и обратной матрицы A⁻¹',
        detail:
          'Обозначим матрицу при X через A. Найдём её определитель и обратную матрицу:',
        latex: String.raw`A = \begin{pmatrix} 3 & 2 \\ 5 & 4 \end{pmatrix}, \quad \det A = 3\cdot 4 - 2\cdot 5 = 2 \neq 0 \implies A^{-1} = \frac{1}{2}\begin{pmatrix} 4 & -2 \\ -5 & 3 \end{pmatrix}`,
      },
      {
        title: 'Шаг 2. Вычисление X = B · A⁻¹ (умножение справа)',
        detail:
          'Умножаем правую часть B на A⁻¹ справа:',
        latex: String.raw`X = B \cdot A^{-1} = \frac{1}{2}\begin{pmatrix} -1 & 2 \\ -5 & 6 \end{pmatrix} \begin{pmatrix} 4 & -2 \\ -5 & 3 \end{pmatrix} = \frac{1}{2}\begin{pmatrix} -4-10 & 2+6 \\ -20-30 & 10+18 \end{pmatrix} = \frac{1}{2}\begin{pmatrix} -14 & 8 \\ -50 & 28 \end{pmatrix} = \begin{pmatrix} -7 & 4 \\ -25 & 14 \end{pmatrix}`,
      },
    ],
    code: `X = B * A^{-1}`,
    expectedOutput: 'Матрица X с элементами (−7, 4) в первой строке и (−25, 14) во второй',
    answerLatex: String.raw`X = \begin{pmatrix} -7 & 4 \\ -25 & 14 \end{pmatrix}`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 2,
        label: 'РК 2 · Задачи базового уровня: Задача №4 (стр. 2)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-base-5',
    category: 'rk',
    kind: 'rk-basic',
    badgeNumber: 'База №5 (7 баллов)',
    title: 'Матричное уравнение A · X = B',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement: '5. Решить матричное уравнение вида A · X = B (7 баллов).',
    problemTextClean: '5. Решить матричное уравнение (7 баллов)',
    problemLatex: String.raw`\begin{pmatrix} 3 & -1 \\ 5 & -2 \end{pmatrix} X = \begin{pmatrix} 5 & 6 \\ 7 & 8 \end{pmatrix}.`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 2,
      topRatio: 0.640,
      bottomRatio: 0.728,
    },
    algorithmSummary:
      'Так как матрица A стоит слева от неизвестной матрицы X (уравнение A·X = B), умножаем обе части на обратную матрицу A⁻¹ строго СЛЕВА: X = A⁻¹ · B.',
    explanationSteps: [
      {
        title: 'Шаг 1. Вычисление определителя и обратной матрицы A⁻¹',
        detail:
          'Найдём определитель матрицы A и составим обратную матрицу:',
        latex: String.raw`A = \begin{pmatrix} 3 & -1 \\ 5 & -2 \end{pmatrix}, \quad \det A = 3\cdot(-2) - (-1)\cdot 5 = -6 + 5 = -1 \neq 0`,
      },
      {
        title: 'Шаг 2. Запись A⁻¹ и умножение X = A⁻¹ · B слева',
        detail:
          'По формуле обратной матрицы 2×2 меняем местами элементы главной диагонали, меняем знаки побочной и делим на det A = −1:',
        latex: String.raw`A^{-1} = \frac{1}{-1}\begin{pmatrix} -2 & 1 \\ -5 & 3 \end{pmatrix} = \begin{pmatrix} 2 & -1 \\ 5 & -3 \end{pmatrix}`,
      },
      {
        title: 'Шаг 3. Перемножение A⁻¹ · B',
        detail:
          'Умножаем A⁻¹ на матрицу правой части B слева:',
        latex: String.raw`X = A^{-1} B = \begin{pmatrix} 2 & -1 \\ 5 & -3 \end{pmatrix} \begin{pmatrix} 5 & 6 \\ 7 & 8 \end{pmatrix} = \begin{pmatrix} 10-7 & 12-8 \\ 25-21 & 30-24 \end{pmatrix} = \begin{pmatrix} 3 & 4 \\ 4 & 6 \end{pmatrix}`,
      },
    ],
    code: `X = A^{-1} * B`,
    expectedOutput: 'Матрица X с элементами (3, 4) в первой строке и (4, 6) во второй',
    answerLatex: String.raw`X = \begin{pmatrix} 3 & 4 \\ 4 & 6 \end{pmatrix}`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 2,
        label: 'РК 2 · Задачи базового уровня: Задача №5 (стр. 2)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-base-6',
    category: 'rk',
    kind: 'rk-basic',
    badgeNumber: 'База №6 (7 баллов)',
    title: 'Обратная матрица 3×3',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement: '6. Найти матрицу, обратную данной матрице 3×3 (7 баллов).',
    problemTextClean: '6. Найти матрицу, обратную матрице (7 баллов)',
    problemLatex: String.raw`A = \begin{pmatrix} 3 & 2 & 1 \\ 1 & 3 & 2 \\ 2 & 1 & 3 \end{pmatrix}.`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 2,
      topRatio: 0.725,
      bottomRatio: 0.822,
    },
    algorithmSummary:
      'Вычисляем определитель det A = 18 ≠ 0, находим все 9 алгебраических дополнений A_ij, транспонируем их для получения присоединённой матрицы A* и делим на det A = 18.',
    explanationSteps: [
      {
        title: 'Шаг 1. Вычисление определителя матрицы A',
        detail:
          'Разложим определитель по первой строке (или вычислим по правилу треугольников):',
        latex: String.raw`\det A = \begin{vmatrix} 3 & 2 & 1 \\ 1 & 3 & 2 \\ 2 & 1 & 3 \end{vmatrix} = 3(9-2) - 2(3-4) + 1(1-6) = 21 + 2 - 5 = 18 \neq 0`,
      },
      {
        title: 'Шаг 2. Вычисление алгебраических дополнений A_ij',
        detail:
          'Находим алгебраические дополнения для каждой строки:',
        latex: String.raw`\begin{aligned}
A_{11} &= +\begin{vmatrix} 3 & 2 \\ 1 & 3 \end{vmatrix} = 7, & A_{12} &= -\begin{vmatrix} 1 & 2 \\ 2 & 3 \end{vmatrix} = 1, & A_{13} &= +\begin{vmatrix} 1 & 3 \\ 2 & 1 \end{vmatrix} = -5, \\[4pt]
A_{21} &= -\begin{vmatrix} 2 & 1 \\ 1 & 3 \end{vmatrix} = -5, & A_{22} &= +\begin{vmatrix} 3 & 1 \\ 2 & 3 \end{vmatrix} = 7, & A_{23} &= -\begin{vmatrix} 3 & 2 \\ 2 & 1 \end{vmatrix} = 1, \\[4pt]
A_{31} &= +\begin{vmatrix} 2 & 1 \\ 3 & 2 \end{vmatrix} = 1, & A_{32} &= -\begin{vmatrix} 3 & 1 \\ 1 & 2 \end{vmatrix} = -5, & A_{33} &= +\begin{vmatrix} 3 & 2 \\ 1 & 3 \end{vmatrix} = 7.
\end{aligned}`,
      },
      {
        title: 'Шаг 3. Составление присоединённой матрицы A* (с транспонированием!) и запись A⁻¹',
        detail:
          'Записываем алгебраические дополнения строк в столбцы присоединённой матрицы A* и делим на det A = 18:',
        latex: String.raw`A^* = \begin{pmatrix} 7 & -5 & 1 \\ 1 & 7 & -5 \\ -5 & 1 & 7 \end{pmatrix} \implies A^{-1} = \frac{1}{\det A} A^* = \frac{1}{18}\begin{pmatrix} 7 & -5 & 1 \\ 1 & 7 & -5 \\ -5 & 1 & 7 \end{pmatrix}`,
      },
    ],
    code: `det A = 18; A^{-1} = (1/18) * A^*`,
    expectedOutput: '1/18 · ((7, −5, 1), (1, 7, −5), (−5, 1, 7))',
    answerLatex: String.raw`A^{-1} = \frac{1}{18}\begin{pmatrix} 7 & -5 & 1 \\ 1 & 7 & -5 \\ -5 & 1 & 7 \end{pmatrix}`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 2,
        label: 'РК 2 · Задачи базового уровня: Задача №6 (стр. 2)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-base-7',
    category: 'rk',
    kind: 'rk-basic',
    badgeNumber: 'База №7 (7 баллов)',
    title: 'ФСР однородной СЛАУ (2 уравнения, 4 неизвестных)',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement:
      '7. Найти фундаментальную систему решений (ФСР) однородной СЛАУ (7 баллов).',
    problemTextClean:
      '7. Найти фундаментальную систему решений (ФСР) однородной СЛАУ (7 баллов)',
    problemLatex: String.raw`\begin{cases} 2x_1 + 3x_2 - 3x_3 + x_4 = 0, \\ 4x_1 + 5x_2 + x_3 + 2x_4 = 0. \end{cases}`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 2,
      topRatio: 0.820,
      bottomRatio: 0.896,
    },
    algorithmSummary:
      'Приводим матрицу системы к ступенчатому виду (rang A = 2, число неизвестных n = 4). Размерность ФСР равна n − r = 4 − 2 = 2. Выбираем свободные переменные x₃ и x₄ и подставляем два набора (1, 0) и (0, 1).',
    explanationSteps: [
      {
        title: 'Шаг 1. Прямой ход метода Гаусса',
        detail:
          'Выпишем матрицу коэффициентов и вычтем из 2-й строки удвоенную 1-ю строку:',
        latex: String.raw`A = \begin{pmatrix} 2 & 3 & -3 & 1 \\ 4 & 5 & 1 & 2 \end{pmatrix} \xrightarrow{\text{II} - 2\cdot\text{I}} \begin{pmatrix} 2 & 3 & -3 & 1 \\ 0 & -1 & 7 & 0 \end{pmatrix}`,
      },
      {
        title: 'Шаг 2. Выражение базисных переменных через свободные',
        detail:
          'Ранг матрицы r = 2, число неизвестных n = 4, поэтому ФСР состоит из n − r = 2 векторов. Базисные переменные: x₁, x₂; свободные переменные: x₃, x₄. Из второй и первой строк получаем:',
        latex: String.raw`\begin{cases} x_2 = 7x_3, \\ 2x_1 = -3x_2 + 3x_3 - x_4 = -21x_3 + 3x_3 - x_4 = -18x_3 - x_4 \end{cases} \implies \begin{cases} x_1 = -9x_3 - \frac{1}{2}x_4, \\ x_2 = 7x_3. \end{cases}`,
      },
      {
        title: 'Шаг 3. Построение двух векторов ФСР',
        detail:
          'Положим сначала (x₃ = 1, x₄ = 0), а затем (x₃ = 0, x₄ = 2) (чтобы избавиться от дробей):',
        latex: String.raw`e_1 = \begin{pmatrix} -9 \\ 7 \\ 1 \\ 0 \end{pmatrix}, \qquad e_2 = \begin{pmatrix} -1 \\ 0 \\ 0 \\ 2 \end{pmatrix}`,
      },
    ],
    code: `ФСР: e_1 = (-9, 7, 1, 0)^T, e_2 = (-1, 0, 0, 2)^T`,
    expectedOutput: 'e₁ = (−9, 7, 1, 0)ᵀ, e₂ = (−1, 0, 0, 2)ᵀ',
    answerLatex: String.raw`e_1 = \begin{pmatrix} -9 \\ 7 \\ 1 \\ 0 \end{pmatrix}, \qquad e_2 = \begin{pmatrix} -1 \\ 0 \\ 0 \\ 2 \end{pmatrix}`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 2,
        label: 'РК 2 · Задачи базового уровня: Задача №7 (стр. 2)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-base-8',
    category: 'rk',
    kind: 'rk-basic',
    badgeNumber: 'База №8 (7 баллов)',
    title: 'Решение неоднородной СЛАУ 3×3',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement: '8. Решить систему линейных алгебраических уравнений (7 баллов).',
    problemTextClean: '8. Решить СЛАУ (7 баллов)',
    problemLatex: String.raw`\begin{cases} 2x_2 - x_3 = 1, \\ -2x_1 + 3x_3 = 1, \\ x_1 - 3x_3 = -2. \end{cases}`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 2,
      topRatio: 0.894,
      bottomRatio: 0.968,
    },
    algorithmSummary:
      'Складываем второе и третье уравнения для мгновенного нахождения x₁ = 1, после чего последовательно находим x₃ = 1 и x₂ = 1.',
    explanationSteps: [
      {
        title: 'Шаг 1. Преобразование расширенной матрицы (или сложение 2-го и 3-го уравнений)',
        detail:
          'Запишем расширенную матрицу системы (переставив 3-е уравнение на первое место) и приведём к треугольному виду:',
        latex: String.raw`\left(\begin{array}{ccc|c} 1 & 0 & -3 & -2 \\ 0 & 2 & -1 & 1 \\ -2 & 0 & 3 & 1 \end{array}\right) \xrightarrow{\text{III} + 2\cdot\text{I}} \left(\begin{array}{ccc|c} 1 & 0 & -3 & -2 \\ 0 & 2 & -1 & 1 \\ 0 & 0 & -3 & -3 \end{array}\right)`,
      },
      {
        title: 'Шаг 2. Обратный ход метода Гаусса',
        detail:
          'Из третьей строки находим x₃, затем из второй x₂ и из первой x₁:',
        latex: String.raw`\begin{cases} -3x_3 = -3 \implies x_3 = 1, \\ 2x_2 = 1 + x_3 = 2 \implies x_2 = 1, \\ x_1 = -2 + 3x_3 = -2 + 3 = 1. \end{cases}`,
      },
    ],
    code: `x_1 = 1, x_2 = 1, x_3 = 1`,
    expectedOutput: 'Единственное решение: x₁ = 1, x₂ = 1, x₃ = 1',
    answerLatex: String.raw`x = \begin{pmatrix} 1 \\ 1 \\ 1 \end{pmatrix} \quad (x_1 = 1,\; x_2 = 1,\; x_3 = 1)`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 2,
        label: 'РК 2 · Задачи базового уровня: Задача №8 (стр. 2)',
        isAnswerSlide: true,
      },
    ],
  },

  // ======================== ПОВЫШЕННАЯ СЛОЖНОСТЬ (3 задачи, стр. 3) ========================
  {
    id: 'rk-adv-1',
    category: 'rk',
    kind: 'rk-advanced',
    badgeNumber: 'Повыш. №1',
    title: 'Проверка ФСР и разложение частного решения x⁰ по векторам ФСР',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement:
      '1. Показать, что столбцы e₁ = (1, −1, 2, −2)ᵀ и e₂ = (2, 1, −2, −1)ᵀ образуют ФСР однородной СЛАУ, и выразить через эту ФСР частное решение x⁰ = (−1, −8, 16, −7)ᵀ.',
    problemTextClean:
      '1. Показать, что столбцы e₁ = (1, −1, 2, −2)ᵀ и e₂ = (2, 1, −2, −1)ᵀ образуют ФСР однородной СЛАУ:',
    problemLatex: String.raw`\begin{cases} 2x_1 + x_3 + 2x_4 = 0, \\ x_1 + x_2 + x_3 + x_4 = 0, \\ x_1 - 3x_2 - x_3 + x_4 = 0, \\ x_1 - x_2 + x_4 = 0. \end{cases}`,
    problemTextAfter:
      'Выразить через эту ФСР частное решение x⁰ = (−1, −8, 16, −7)ᵀ.',
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 3,
      topRatio: 0.120,
      bottomRatio: 0.285,
    },
    algorithmSummary:
      'По определению ФСР проверяем 3 условия: 1) подстановкой убеждаемся, что Ae₁ = 0 и Ae₂ = 0; 2) столбцы e₁ и e₂ не пропорциональны (линейно независимы); 3) находим ранг матрицы системы r = 2, откуда размерность ФСР равна n − r = 4 − 2 = 2. Затем находим коэффициенты x⁰ = 3e₁ − 2e₂.',
    explanationSteps: [
      {
        title: 'Шаг 1. Проверка того, что e₁ и e₂ являются решениями и линейно независимы',
        detail:
          'Подставим координаты e₁ = (1, −1, 2, −2)ᵀ и e₂ = (2, 1, −2, −1)ᵀ во все 4 уравнения системы:',
        latex: String.raw`\begin{aligned}
\text{Для } e_1:\quad & 2(1)+2+2(-2)=0,\;\; 1-1+2-2=0,\;\; 1+3-2-2=0,\;\; 1+1-2=0 \implies A e_1 = 0, \\
\text{Для } e_2:\quad & 2(2)-2+2(-1)=0,\;\; 2+1-2-1=0,\;\; 2-3+2-1=0,\;\; 2-1-1=0 \implies A e_2 = 0.
\end{aligned}`,
      },
      {
        title: 'Шаг 2. Вычисление ранга матрицы системы и проверка размерности ФСР (n − r)',
        detail:
          'Приведём матрицу коэффициентов A к ступенчатому виду:',
        latex: String.raw`A = \begin{pmatrix} 2 & 0 & 1 & 2 \\ 1 & 1 & 1 & 1 \\ 1 & -3 & -1 & 1 \\ 1 & -1 & 0 & 1 \end{pmatrix} \sim \begin{pmatrix} 1 & -1 & 0 & 1 \\ 0 & 2 & 1 & 0 \\ 0 & -2 & -1 & 0 \\ 0 & 2 & 1 & 0 \end{pmatrix} \sim \begin{pmatrix} 1 & -1 & 0 & 1 \\ 0 & 2 & 1 & 0 \\ 0 & 0 & 0 & 0 \\ 0 & 0 & 0 & 0 \end{pmatrix} \implies r = \operatorname{rang} A = 2`,
      },
      {
        title: 'Шаг 3. Разложение решения x⁰ = (−1, −8, 16, −7)ᵀ по векторам ФСР',
        detail:
          'Так как n − r = 4 − 2 = 2 и столбцы e₁, e₂ непропорциональны, они образуют ФСР. Найдём коэффициенты c₁, c₂ в разложении x⁰ = c₁e₁ + c₂e₂ по первым двум координатам:',
        latex: String.raw`\begin{cases} c_1 + 2c_2 = -1, \\ -c_1 + c_2 = -8 \end{cases} \implies 3c_2 = -9 \implies c_2 = -3,\;\; c_1 = 5`,
      },
      {
        title: 'Шаг 4. Проверка остальных координат',
        detail:
          'Проверим 3-ю и 4-ю координаты при c₁ = 5, c₂ = −3:',
        latex: String.raw`5 e_1 - 3 e_2 = 5\begin{pmatrix} 1 \\ -1 \\ 2 \\ -2 \end{pmatrix} - 3\begin{pmatrix} 2 \\ 1 \\ -2 \\ -1 \end{pmatrix} = \begin{pmatrix} 5-6 \\ -5-3 \\ 10+6 \\ -10+3 \end{pmatrix} = \begin{pmatrix} -1 \\ -8 \\ 16 \\ -7 \end{pmatrix} = x^0`,
      },
    ],
    code: `rang A = 2, n - r = 2; x^0 = 5 e_1 - 3 e_2`,
    expectedOutput: 'e₁, e₂ образуют ФСР (rang A = 2, n − r = 2); x⁰ = 5e₁ − 3e₂',
    answerLatex: String.raw`\operatorname{rang} A = 2,\;\; n - r = 2 \implies \{e_1, e_2\} \text{ — ФСР}; \qquad x^0 = 5e_1 - 3e_2`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 3,
        label: 'РК 2 · Задачи повышенной сложности: Задача №1 (стр. 3)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-adv-2',
    category: 'rk',
    kind: 'rk-advanced',
    badgeNumber: 'Повыш. №2 (9 баллов)',
    title: 'ФСР и общее решение однородной СЛАУ (4 уравнения, 5 неизвестных)',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement:
      '2. Найти ФСР и общее решение однородной СЛАУ с 5 неизвестными (9 баллов).',
    problemTextClean: '2. Найти ФСР и общее решение однородной СЛАУ (9 баллов)',
    problemLatex: String.raw`\begin{cases} x_1 + 2x_2 + 7x_3 - x_4 - 9x_5 = 0, \\ 4x_1 + x_2 + 5x_3 - x_4 - 4x_5 = 0, \\ 7x_1 + 3x_3 - x_4 + x_5 = 0, \\ -3x_1 + x_2 + 2x_3 - 5x_5 = 0. \end{cases}`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 3,
      topRatio: 0.282,
      bottomRatio: 0.410,
    },
    algorithmSummary:
      'Приводим матрицу 4×5 к ступенчатому виду: строки 3 и 4 оказываются линейными комбинациями первых двух строк, откуда rang A = 2. Свободных переменных n − r = 5 − 2 = 3 (x₃, x₄, x₅), поэтому ФСР состоит из 3 векторов.',
    explanationSteps: [
      {
        title: 'Шаг 1. Приведение матрицы системы к ступенчатому виду',
        detail:
          'Заметим, что 4-е уравнение есть разность 1-го и 2-го, а 3-е равно (2·II − I). Выполним элементарные преобразования строк:',
        latex: String.raw`\begin{pmatrix} 1 & 2 & 7 & -1 & -9 \\ 4 & 1 & 5 & -1 & -4 \\ 7 & 0 & 3 & -1 & 1 \\ -3 & 1 & 2 & 0 & -5 \end{pmatrix} \xrightarrow[\text{III}-7\cdot\text{I},\;\text{IV}+3\cdot\text{I}]{\text{II}-4\cdot\text{I}} \begin{pmatrix} 1 & 2 & 7 & -1 & -9 \\ 0 & -7 & -23 & 3 & 32 \\ 0 & -14 & -46 & 6 & 64 \\ 0 & 7 & 23 & -3 & -32 \end{pmatrix} \sim \begin{pmatrix} 1 & 2 & 7 & -1 & -9 \\ 0 & 7 & 23 & -3 & -32 \end{pmatrix}`,
      },
      {
        title: 'Шаг 2. Выбор базисных и свободных неизвестных',
        detail:
          'Ранг матрицы r = 2, число неизвестных n = 5 ⇒ в ФСР ровно n − r = 3 вектора. Чтобы избежать дробей, выберем в качестве базисных переменных x₁ и x₄ (так как минор на столбцах 1 и 4 равен |1 −1; 4 −1| = 3 ≠ 0), а свободными объявим x₂, x₃, x₅. Вычтем из 2-го уравнения 1-е (чтобы исключить x₄):',
        latex: String.raw`\begin{cases} (\text{II} - \text{I}):\;\; 3x_1 - x_2 - 2x_3 + 5x_5 = 0 \implies 3x_1 = x_2 + 2x_3 - 5x_5, \\ x_4 = x_1 + 2x_2 + 7x_3 - 9x_5. \end{cases}`,
      },
      {
        title: 'Шаг 3. Построение трёх векторов ФСР и запись общего решения',
        detail:
          'Подставим три линейно независимых набора свободных переменных (x₂, x₃, x₅): 1) (3, 0, 0); 2) (0, 3, 0); 3) (0, 0, 3):',
        latex: String.raw`e_1 = \begin{pmatrix} 1 \\ 3 \\ 0 \\ 7 \\ 0 \end{pmatrix}, \quad e_2 = \begin{pmatrix} 2 \\ 0 \\ 3 \\ 23 \\ 0 \end{pmatrix}, \quad e_3 = \begin{pmatrix} -5 \\ 0 \\ 0 \\ -32 \\ 3 \end{pmatrix}; \qquad x_{\text{общ}} = c_1 e_1 + c_2 e_2 + c_3 e_3 \;\; (c_1, c_2, c_3 \in \mathbb{R})`,
      },
    ],
    code: `rang A = 2, n - r = 3; x = c_1 e_1 + c_2 e_2 + c_3 e_3`,
    expectedOutput:
      'ФСР из 3 векторов: e₁ = (1, 3, 0, 7, 0)ᵀ, e₂ = (2, 0, 3, 23, 0)ᵀ, e₃ = (−5, 0, 0, −32, 3)ᵀ; x = c₁e₁ + c₂e₂ + c₃e₃',
    answerLatex: String.raw`e_1 = \begin{pmatrix} 1 \\ 3 \\ 0 \\ 7 \\ 0 \end{pmatrix},\;\; e_2 = \begin{pmatrix} 2 \\ 0 \\ 3 \\ 23 \\ 0 \end{pmatrix},\;\; e_3 = \begin{pmatrix} -5 \\ 0 \\ 0 \\ -32 \\ 3 \end{pmatrix}; \qquad x_{\text{общ}} = c_1 e_1 + c_2 e_2 + c_3 e_3`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 3,
        label: 'РК 2 · Задачи повышенной сложности: Задача №2 (стр. 3)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-adv-3',
    category: 'rk',
    kind: 'rk-advanced',
    badgeNumber: 'Повыш. №3',
    title: 'Восстановление СЛАУ минимального размера по её общему решению',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement:
      '3. По заданному общему решению СЛАУ определить наименьшее возможное число уравнений и привести пример такой СЛАУ.',
    problemTextClean: '3. Общее решение некоторой СЛАУ имеет вид',
    problemLatex: String.raw`x = \begin{pmatrix} -1 + c_1 + 2c_2 \\ -3 + c_1 + 2c_2 \\ c_1 + c_2 \\ c_1 - 2c_2 \end{pmatrix}.`,
    problemTextAfter:
      'Какое наименьшее число уравнений может иметь такая СЛАУ? Привести пример системы с таким решением.',
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 3,
      topRatio: 0.408,
      bottomRatio: 0.560,
    },
    algorithmSummary:
      'Вектор решения имеет 4 координаты (n = 4 неизвестных) и зависит от 2 свободных параметров c₁, c₂ (размерность ФСР k = n − r = 2). Значит ранг матрицы системы r = 4 − 2 = 2, а наименьшее число уравнений равно рангу: m_min = 2.',
    explanationSteps: [
      {
        title: 'Шаг 1. Выделение частного решения x⁰ и векторов ФСР e₁, e₂',
        detail:
          'Разложим столбец общего решения на частное решение неоднородной системы и линейную комбинацию по параметрам c₁, c₂:',
        latex: String.raw`x = x^0 + c_1 e_1 + c_2 e_2 = \begin{pmatrix} -1 \\ -3 \\ 0 \\ 0 \end{pmatrix} + c_1 \begin{pmatrix} 1 \\ 1 \\ 1 \\ 1 \end{pmatrix} + c_2 \begin{pmatrix} 2 \\ 2 \\ 1 \\ -2 \end{pmatrix}`,
      },
      {
        title: 'Шаг 2. Определение наименьшего числа уравнений',
        detail:
          'Число неизвестных n = 4. Так как векторы e₁ и e₂ не коллинеарны, размерность ФСР равна n − r = 2, откуда ранг матрицы системы r = 4 − 2 = 2. Поскольку число уравнений m не может быть меньше ранга матрицы (m ≥ r), наименьшее число уравнений равно 2:',
        latex: String.raw`n = 4,\quad n - r = 2 \implies r = \operatorname{rang} A = 2 \implies m_{\min} = 2`,
      },
      {
        title: 'Шаг 3. Построение примера СЛАУ из 2 уравнений',
        detail:
          'Из первых двух координат видно, что для всех c₁, c₂ разность x₁ − x₂ = (−1 + c₁ + 2c₂) − (−3 + c₁ + 2c₂) = 2 (это сразу даёт первое уравнение!). А выразив c₁ и c₂ через x₃ и x₄: x₃ − x₄ = 3c₂ и 2x₃ + x₄ = 3c₁, получаем c₁ + 2c₂ = (2x₃ + x₄)/3 + 2(x₃ − x₄)/3 = (4x₃ − x₄)/3, откуда 3x₁ − 4x₃ + x₄ = −3:',
        latex: String.raw`\begin{cases} x_1 - x_2 = 2, \\ 3x_1 - 4x_3 + x_4 = -3. \end{cases}`,
      },
    ],
    code: `m_min = 2; { x_1 - x_2 = 2; 3x_1 - 4x_3 + x_4 = -3 }`,
    expectedOutput:
      'Наименьшее число уравнений: 2. Пример системы: { x₁ − x₂ = 2; 3x₁ − 4x₃ + x₄ = −3 }',
    answerLatex: String.raw`m_{\min} = 2; \qquad \text{Пример СЛАУ: } \begin{cases} x_1 - x_2 = 2, \\ 3x_1 - 4x_3 + x_4 = -3. \end{cases}`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 3,
        label: 'РК 2 · Задачи повышенной сложности: Задача №3 (стр. 3)',
        isAnswerSlide: true,
      },
    ],
  },

  // ======================== ТИПОВОЙ ВАРИАНТ БИЛЕТА ПО ЗАДАЧАМ (6 задач, стр. 4) ========================
  {
    id: 'rk-ticket-1',
    category: 'rk',
    kind: 'rk-ticket',
    badgeNumber: 'Билет №1 (7 баллов)',
    title: 'Вычисление квадрата матрицы A² (3×3)',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement:
      '1. (7 баллов) Вычислить квадрат матрицы A² = A · A для заданной матрицы 3×3.',
    problemTextClean: '1. (7 баллов) Вычислить A², если',
    problemLatex: String.raw`A = \begin{pmatrix} 1 & 6 & 12 \\ -4 & -13 & -24 \\ 2 & 6 & 11 \end{pmatrix}.`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 4,
      topRatio: 0.360,
      bottomRatio: 0.460,
    },
    algorithmSummary:
      'Умножаем матрицу A саму на себя (A² = A · A) по правилу «строка на столбец». В результате получается диагональная (единичная!) матрица E, т.е. матрица A является инволютивной (A² = E).',
    explanationSteps: [
      {
        title: 'Шаг 1. Вычисление первой строки матрицы A² = A · A',
        detail:
          'Умножаем 1-ю строку (1, 6, 12) на каждый из трёх столбцов матрицы A:',
        latex: String.raw`\begin{aligned}
(A^2)_{11} &= 1\cdot 1 + 6\cdot(-4) + 12\cdot 2 = 1 - 24 + 24 = 1, \\
(A^2)_{12} &= 1\cdot 6 + 6\cdot(-13) + 12\cdot 6 = 6 - 78 + 72 = 0, \\
(A^2)_{13} &= 1\cdot 12 + 6\cdot(-24) + 12\cdot 11 = 12 - 144 + 132 = 0.
\end{aligned}`,
      },
      {
        title: 'Шаг 2. Вычисление второй и третьей строк матрицы A²',
        detail:
          'Аналогично умножаем 2-ю и 3-ю строки на столбцы матрицы A:',
        latex: String.raw`A^2 = \begin{pmatrix} 1 & 6 & 12 \\ -4 & -13 & -24 \\ 2 & 6 & 11 \end{pmatrix} \begin{pmatrix} 1 & 6 & 12 \\ -4 & -13 & -24 \\ 2 & 6 & 11 \end{pmatrix} = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix} = E`,
      },
    ],
    code: `A^2 = E`,
    expectedOutput: 'Единичная матрица E порядка 3',
    answerLatex: String.raw`A^2 = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix} = E`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 4,
        label: 'РК 2 · Типовой билет по задачам: Задача №1 (стр. 4)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-ticket-2',
    category: 'rk',
    kind: 'rk-ticket',
    badgeNumber: 'Билет №2 (7 баллов)',
    title: 'Матричное уравнение A · X = B (типовой билет)',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement:
      '2. (7 баллов) Решить матричное уравнение A · X = B из типового варианта билета.',
    problemTextClean: '2. (7 баллов) Решить матричное уравнение',
    problemLatex: String.raw`\begin{pmatrix} 2 & -7 \\ -1 & 4 \end{pmatrix} X = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}.`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 4,
      topRatio: 0.460,
      bottomRatio: 0.542,
    },
    algorithmSummary:
      'Уравнение имеет вид A·X = B, где матрица A стоит слева от X. Находим det A = 8 − 7 = 1 и умножаем матрицу B на обратную матрицу A⁻¹ слева: X = A⁻¹ · B.',
    explanationSteps: [
      {
        title: 'Шаг 1. Вычисление определителя и обратной матрицы A⁻¹',
        detail:
          'Найдём определитель матрицы коэффициентов слева:',
        latex: String.raw`A = \begin{pmatrix} 2 & -7 \\ -1 & 4 \end{pmatrix}, \quad \det A = 2\cdot 4 - (-7)\cdot(-1) = 8 - 7 = 1 \neq 0 \implies A^{-1} = \begin{pmatrix} 4 & 7 \\ 1 & 2 \end{pmatrix}`,
      },
      {
        title: 'Шаг 2. Вычисление X = A⁻¹ · B (умножение слева)',
        detail:
          'Умножаем найденную обратную матрицу A⁻¹ на правую часть B слева:',
        latex: String.raw`X = A^{-1} B = \begin{pmatrix} 4 & 7 \\ 1 & 2 \end{pmatrix} \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} = \begin{pmatrix} 4+21 & 8+28 \\ 1+6 & 2+8 \end{pmatrix} = \begin{pmatrix} 25 & 36 \\ 7 & 10 \end{pmatrix}`,
      },
    ],
    code: `X = A^{-1} B = ((25, 36), (7, 10))`,
    expectedOutput: 'Матрица X с первой строкой (25, 36) и второй строкой (7, 10)',
    answerLatex: String.raw`X = \begin{pmatrix} 25 & 36 \\ 7 & 10 \end{pmatrix}`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 4,
        label: 'РК 2 · Типовой билет по задачам: Задача №2 (стр. 4)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-ticket-3',
    category: 'rk',
    kind: 'rk-ticket',
    badgeNumber: 'Билет №3 (7 баллов)',
    title: 'ФСР однородной СЛАУ (типовой билет)',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement:
      '3. (7 баллов) Найти фундаментальную систему решений (ФСР) однородной СЛАУ из типового билета.',
    problemTextClean:
      '3. (7 баллов) Найти фундаментальную систему решений (ФСР) однородной СЛАУ',
    problemLatex: String.raw`\begin{cases} 2x_1 - x_2 + 2x_3 - x_4 = 0, \\ -x_1 + x_2 - x_3 + x_4 = 0. \end{cases}`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 4,
      topRatio: 0.540,
      bottomRatio: 0.620,
    },
    algorithmSummary:
      'Складываем оба уравнения и сразу получаем x₁ + x₃ = 0 ⇒ x₁ = −x₃, а из второго уравнения x₂ = −x₄. Задаём свободным переменным (x₃, x₄) наборы (1, 0) и (0, 1).',
    explanationSteps: [
      {
        title: 'Шаг 1. Приведение матрицы системы к каноническому виду',
        detail:
          'Прибавим ко первой строке вторую строку, а затем ко второй — первую:',
        latex: String.raw`\begin{pmatrix} 2 & -1 & 2 & -1 \\ -1 & 1 & -1 & 1 \end{pmatrix} \xrightarrow{\text{I} + \text{II}} \begin{pmatrix} 1 & 0 & 1 & 0 \\ -1 & 1 & -1 & 1 \end{pmatrix} \xrightarrow{\text{II} + \text{I}} \begin{pmatrix} 1 & 0 & 1 & 0 \\ 0 & 1 & 0 & 1 \end{pmatrix}`,
      },
      {
        title: 'Шаг 2. Выражение базисных переменных и построение ФСР',
        detail:
          'Ранг матрицы r = 2, число неизвестных n = 4 ⇒ в ФСР n − r = 2 вектора. Базисные переменные: x₁ = −x₃ и x₂ = −x₄. Полагая (x₃ = 1, x₄ = 0) и (x₃ = 0, x₄ = 1), получаем:',
        latex: String.raw`\begin{cases} x_1 = -x_3, \\ x_2 = -x_4 \end{cases} \implies e_1 = \begin{pmatrix} -1 \\ 0 \\ 1 \\ 0 \end{pmatrix}, \qquad e_2 = \begin{pmatrix} 0 \\ -1 \\ 0 \\ 1 \end{pmatrix}`,
      },
    ],
    code: `e_1 = (-1, 0, 1, 0)^T, e_2 = (0, -1, 0, 1)^T`,
    expectedOutput: 'e₁ = (−1, 0, 1, 0)ᵀ, e₂ = (0, −1, 0, 1)ᵀ',
    answerLatex: String.raw`e_1 = \begin{pmatrix} -1 \\ 0 \\ 1 \\ 0 \end{pmatrix}, \qquad e_2 = \begin{pmatrix} 0 \\ -1 \\ 0 \\ 1 \end{pmatrix}`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 4,
        label: 'РК 2 · Типовой билет по задачам: Задача №3 (стр. 4)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-ticket-4',
    category: 'rk',
    kind: 'rk-ticket',
    badgeNumber: 'Билет №4 (7 баллов)',
    title: 'Решение неоднородной СЛАУ (2 уравнения, 3 неизвестных)',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement:
      '4. (7 баллов) Решить неоднородную СЛАУ из двух уравнений с тремя неизвестными.',
    problemTextClean: '4. (7 баллов) Решить СЛАУ',
    problemLatex: String.raw`\begin{cases} 3x_1 + 2x_2 + x_3 = 0, \\ 3x_1 + 7x_2 + 2x_3 = -2. \end{cases}`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 4,
      topRatio: 0.618,
      bottomRatio: 0.698,
    },
    algorithmSummary:
      'Вычитаем из второго уравнения первое: 5x₂ + x₃ = −2 ⇒ x₃ = −2 − 5x₂. Подставляем x₃ в первое уравнение и выражаем все переменные через свободный параметр x₂ = c.',
    explanationSteps: [
      {
        title: 'Шаг 1. Исключение x₁ вычитанием первого уравнения из второго',
        detail:
          'Выполним преобразование II − I над расширенной матрицей системы:',
        latex: String.raw`\left(\begin{array}{ccc|c} 3 & 2 & 1 & 0 \\ 3 & 7 & 2 & -2 \end{array}\right) \xrightarrow{\text{II} - \text{I}} \left(\begin{array}{ccc|c} 3 & 2 & 1 & 0 \\ 0 & 5 & 1 & -2 \end{array}\right)`,
      },
      {
        title: 'Шаг 2. Выражение x₃ и x₁ через свободную переменную x₂',
        detail:
          'Из второго уравнения выразим x₃ через x₂, а затем из первого уравнения найдём x₁:',
        latex: String.raw`\begin{cases} x_3 = -2 - 5x_2, \\ 3x_1 = -2x_2 - x_3 = -2x_2 - (-2 - 5x_2) = 2 + 3x_2 \implies x_1 = \frac{2}{3} + x_2. \end{cases}`,
      },
      {
        title: 'Шаг 3. Запись общего решения в векторной форме (x = x⁰ + c·e₁)',
        detail:
          'Обозначим свободную переменную x₂ = c ∈ ℝ:',
        latex: String.raw`x = \begin{pmatrix} 2/3 \\ 0 \\ -2 \end{pmatrix} + c \begin{pmatrix} 1 \\ 1 \\ -5 \end{pmatrix}, \quad c \in \mathbb{R}`,
      },
    ],
    code: `x = (2/3, 0, -2)^T + c * (1, 1, -5)^T`,
    expectedOutput: 'x = (2/3, 0, −2)ᵀ + c · (1, 1, −5)ᵀ, где c ∈ ℝ',
    answerLatex: String.raw`x = \begin{pmatrix} 2/3 \\ 0 \\ -2 \end{pmatrix} + c \begin{pmatrix} 1 \\ 1 \\ -5 \end{pmatrix}, \quad c \in \mathbb{R}`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 4,
        label: 'РК 2 · Типовой билет по задачам: Задача №4 (стр. 4)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-ticket-5',
    category: 'rk',
    kind: 'rk-ticket',
    badgeNumber: 'Билет №5 (9 баллов)',
    title: 'Решение СЛАУ 4×4 методом Гаусса',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement:
      '5. (9 баллов) Решить систему из четырёх линейных уравнений с четырьмя неизвестными.',
    problemTextClean: '5. (9 баллов) Решить СЛАУ',
    problemLatex: String.raw`\begin{cases} x_1 + x_2 + 2x_3 + 2x_4 = 10, \\ x_1 + 3x_2 + 2x_3 + 6x_4 = 20, \\ x_1 - x_2 + 2x_3 - 2x_4 = 0, \\ x_1 - 3x_2 + 2x_3 - 6x_4 = -10. \end{cases}`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 4,
      topRatio: 0.696,
      bottomRatio: 0.808,
    },
    algorithmSummary:
      'Вычитаем первое уравнение из остальных трёх: все три полученных уравнения оказываются пропорциональны уравнению x₂ + 2x₄ = 5. Следовательно, rang A = rang(A|b) = 2, система совместна и имеет две свободные переменные x₃ = c₁, x₄ = c₂.',
    explanationSteps: [
      {
        title: 'Шаг 1. Прямой ход метода Гаусса для расширенной матрицы',
        detail:
          'Вычтем 1-ю строку из 2-й, 3-й и 4-й строк:',
        latex: String.raw`\left(\begin{array}{cccc|c} 1 & 1 & 2 & 2 & 10 \\ 1 & 3 & 2 & 6 & 20 \\ 1 & -1 & 2 & -2 & 0 \\ 1 & -3 & 2 & -6 & -10 \end{array}\right) \xrightarrow{\text{II}-\text{I},\;\text{III}-\text{I},\;\text{IV}-\text{I}} \left(\begin{array}{cccc|c} 1 & 1 & 2 & 2 & 10 \\ 0 & 2 & 0 & 4 & 10 \\ 0 & -2 & 0 & -4 & -10 \\ 0 & -4 & 0 & -8 & -20 \end{array}\right) \sim \left(\begin{array}{cccc|c} 1 & 1 & 2 & 2 & 10 \\ 0 & 1 & 0 & 2 & 5 \end{array}\right)`,
      },
      {
        title: 'Шаг 2. Проверка совместности и выражение базисных переменных',
        detail:
          'По теореме Кронекера — Капелли rang A = rang(A|b) = 2 < 4, система совместна и неопределённа. Базисные переменные: x₁, x₂; свободные переменные: x₃ = c₁, x₄ = c₂:',
        latex: String.raw`\begin{cases} x_2 = 5 - 2x_4, \\ x_1 = 10 - x_2 - 2x_3 - 2x_4 = 10 - (5 - 2x_4) - 2x_3 - 2x_4 = 5 - 2x_3. \end{cases}`,
      },
      {
        title: 'Шаг 3. Запись общего решения в векторной форме',
        detail:
          'Полагая x₃ = c₁ ∈ ℝ и x₄ = c₂ ∈ ℝ, записываем сумму частного решения и общего решения однородной системы:',
        latex: String.raw`x = \begin{pmatrix} 5 \\ 5 \\ 0 \\ 0 \end{pmatrix} + c_1 \begin{pmatrix} -2 \\ 0 \\ 1 \\ 0 \end{pmatrix} + c_2 \begin{pmatrix} 0 \\ -2 \\ 0 \\ 1 \end{pmatrix}, \quad c_1, c_2 \in \mathbb{R}`,
      },
    ],
    code: `x = (5, 5, 0, 0)^T + c_1 (-2, 0, 1, 0)^T + c_2 (0, -2, 0, 1)^T`,
    expectedOutput:
      'x = (5, 5, 0, 0)ᵀ + c₁(−2, 0, 1, 0)ᵀ + c₂(0, −2, 0, 1)ᵀ, где c₁, c₂ ∈ ℝ',
    answerLatex: String.raw`x = \begin{pmatrix} 5 \\ 5 \\ 0 \\ 0 \end{pmatrix} + c_1 \begin{pmatrix} -2 \\ 0 \\ 1 \\ 0 \end{pmatrix} + c_2 \begin{pmatrix} 0 \\ -2 \\ 0 \\ 1 \end{pmatrix}, \quad c_1, c_2 \in \mathbb{R}`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 4,
        label: 'РК 2 · Типовой билет по задачам: Задача №5 (стр. 4)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'rk-ticket-6',
    category: 'rk',
    kind: 'rk-ticket',
    badgeNumber: 'Билет №6 (9 баллов)',
    title: 'Ранг матрицы 3×5 в зависимости от параметра λ',
    chapter: 'РК 2 · Задачи и типовой билет',
    problemStatement:
      '6. (9 баллов) Найти ранг матрицы A размера 3×5 в зависимости от параметра λ.',
    problemTextClean:
      '6. (9 баллов) Найти ранг матрицы A в зависимости от параметра λ, если',
    problemLatex: String.raw`A = \begin{pmatrix} 1 & 2 & 1 & 2 & 3 \\ -3 & 2 & \lambda & 2 & 7 \\ 3 & 2 & 3 & 2 & 1 \end{pmatrix}.`,
    pdfCrop: {
      lectureId: 'rk2_angeom',
      page: 4,
      topRatio: 0.806,
      bottomRatio: 0.916,
    },
    algorithmSummary:
      'Приводим матрицу к ступенчатому виду элементарными преобразованиями строк. После исключения первых двух элементов третьей строки в ней остаётся единственный потенциально ненулевой элемент (λ + 1), откуда при λ = −1 ранг равен 2, а при λ ≠ −1 ранг равен 3.',
    explanationSteps: [
      {
        title: 'Шаг 1. Обнуление первого столбца под верхним элементом',
        detail:
          'Прибавим ко 2-й строке утроенную 1-ю строку (II + 3·I), а из 3-й строки вычтем утроенную 1-ю строку (III − 3·I):',
        latex: String.raw`\begin{pmatrix} 1 & 2 & 1 & 2 & 3 \\ -3 & 2 & \lambda & 2 & 7 \\ 3 & 2 & 3 & 2 & 1 \end{pmatrix} \xrightarrow[\text{III} - 3\cdot\text{I}]{\text{II} + 3\cdot\text{I}} \begin{pmatrix} 1 & 2 & 1 & 2 & 3 \\ 0 & 8 & \lambda + 3 & 8 & 16 \\ 0 & -4 & 0 & -4 & -8 \end{pmatrix}`,
      },
      {
        title: 'Шаг 2. Приведение к ступенчатому виду',
        detail:
          'Поменяем местами 2-ю и 3-ю строки (разделив новую 2-ю строку на −4), а затем вычтем из 3-й строки восьмикратную 2-ю строку:',
        latex: String.raw`\sim \begin{pmatrix} 1 & 2 & 1 & 2 & 3 \\ 0 & 1 & 0 & 1 & 2 \\ 0 & 8 & \lambda + 3 & 8 & 16 \end{pmatrix} \xrightarrow{\text{III} - 8\cdot\text{II}} \begin{pmatrix} 1 & 2 & 1 & 2 & 3 \\ 0 & 1 & 0 & 1 & 2 \\ 0 & 0 & \lambda + 3 & 0 & 0 \end{pmatrix}`,
      },
      {
        title: 'Шаг 3. Исследование ранга в зависимости от параметра λ',
        detail:
          'Первые две строки ступенчатой матрицы линейно независимы при любом λ (ранг ≥ 2). Третья строка состоит из нулей тогда и только тогда, когда λ + 3 = 0, то есть при λ = −3:',
        latex: String.raw`\operatorname{rang} A = \begin{cases} 2, & \text{если } \lambda = -3, \\ 3, & \text{если } \lambda \neq -3. \end{cases}`,
      },
    ],
    code: `rang A = 2 при lambda = -3; rang A = 3 при lambda != -3`,
    expectedOutput: 'При λ = −3: rang A = 2; при λ ≠ −3: rang A = 3',
    answerLatex: String.raw`\operatorname{rang} A = \begin{cases} 2, & \text{при } \lambda = -3, \\ 3, & \text{при } \lambda \neq -3. \end{cases}`,
    slides: [
      {
        lectureId: 'rk2_angeom',
        page: 4,
        label: 'РК 2 · Типовой билет по задачам: Задача №6 (стр. 4)',
        isAnswerSlide: true,
      },
    ],
  },
];

export const RK_TASK_FLASHCARDS: TheoryCard[] = [];
