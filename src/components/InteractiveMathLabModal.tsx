import {useState, useMemo} from 'react';
import {
  X,
  FlaskConical,
  TrendingUp,
  Crosshair,
  Grid,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import {MathBlock} from './MathBlock';

export type MathLabTab = 'taylor' | 'cauchy' | 'gauss';

interface InteractiveMathLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: MathLabTab;
}

type TaylorFuncId = 'sin' | 'cos' | 'exp' | 'ln1px' | 'geom' | 'sqrt1px';

interface TaylorFuncConfig {
  id: TaylorFuncId;
  label: string;
  latexName: string;
  convergenceNote: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  exact: (x: number) => number | null;
  poly: (x: number, n: number) => number;
  buildLatex: (n: number) => string;
}

function factorial(k: number): number {
  let res = 1;
  for (let i = 2; i <= k; i++) res *= i;
  return res;
}

const TAYLOR_FUNCTIONS: TaylorFuncConfig[] = [
  {
    id: 'sin',
    label: 'sin(x)',
    latexName: 'f(x) = \\sin x',
    convergenceNote: 'Ряд Маклорена сходится к sin x на всей числовой прямой x ∈ (−∞, +∞)',
    xMin: -Math.PI * 1.4,
    xMax: Math.PI * 1.4,
    yMin: -2.2,
    yMax: 2.2,
    exact: (x) => Math.sin(x),
    poly: (x, n) => {
      let sum = 0;
      for (let k = 1, sign = 1; k <= n; k += 2, sign = -sign) {
        sum += sign * (Math.pow(x, k) / factorial(k));
      }
      return sum;
    },
    buildLatex: (n) => {
      const terms: string[] = [];
      for (let k = 1, idx = 0; k <= n; k += 2, idx++) {
        const sign = idx === 0 ? '' : idx % 2 === 1 ? ' - ' : ' + ';
        if (k === 1) terms.push(`${sign}x`);
        else terms.push(`${sign}\\frac{x^{${k}}}{${k}!}`);
      }
      if (terms.length === 0) terms.push('0');
      return `\\sin x = ${terms.join('')} + o(x^{${n}})`;
    },
  },
  {
    id: 'cos',
    label: 'cos(x)',
    latexName: 'f(x) = \\cos x',
    convergenceNote: 'Чётная функция: только чётные степени x^{2k}/(2k)!, сходится при всех x ∈ ℝ',
    xMin: -Math.PI * 1.4,
    xMax: Math.PI * 1.4,
    yMin: -2.2,
    yMax: 2.2,
    exact: (x) => Math.cos(x),
    poly: (x, n) => {
      let sum = 1;
      for (let k = 2, sign = -1; k <= n; k += 2, sign = -sign) {
        sum += sign * (Math.pow(x, k) / factorial(k));
      }
      return sum;
    },
    buildLatex: (n) => {
      const terms: string[] = ['1'];
      for (let k = 2, idx = 1; k <= n; k += 2, idx++) {
        const sign = idx % 2 === 1 ? ' - ' : ' + ';
        terms.push(`${sign}\\frac{x^{${k}}}{${k}!}`);
      }
      return `\\cos x = ${terms.join('')} + o(x^{${n}})`;
    },
  },
  {
    id: 'exp',
    label: 'e^x',
    latexName: 'f(x) = e^x',
    convergenceNote: 'Все производные в нуле равны 1: идут все степени x^k / k! со знаком плюс, x ∈ ℝ',
    xMin: -2.8,
    xMax: 2.4,
    yMin: -1,
    yMax: 8,
    exact: (x) => Math.exp(x),
    poly: (x, n) => {
      let sum = 1;
      for (let k = 1; k <= n; k++) {
        sum += Math.pow(x, k) / factorial(k);
      }
      return sum;
    },
    buildLatex: (n) => {
      const terms: string[] = ['1', ' + x'];
      for (let k = 2; k <= n; k++) {
        terms.push(` + \\frac{x^{${k}}}{${k}!}`);
      }
      return `e^x = ${terms.slice(0, n + 1).join('')} + o(x^{${n}})`;
    },
  },
  {
    id: 'ln1px',
    label: 'ln(1 + x)',
    latexName: 'f(x) = \\ln(1 + x)',
    convergenceNote: 'Внимание: БЕЗ факториалов! Область сходимости: x ∈ (−1, 1]',
    xMin: -0.95,
    xMax: 1.5,
    yMin: -2.5,
    yMax: 1.5,
    exact: (x) => (x > -1 ? Math.log(1 + x) : null),
    poly: (x, n) => {
      let sum = 0;
      for (let k = 1; k <= n; k++) {
        const sign = k % 2 === 1 ? 1 : -1;
        sum += sign * (Math.pow(x, k) / k);
      }
      return sum;
    },
    buildLatex: (n) => {
      const terms: string[] = [];
      for (let k = 1; k <= n; k++) {
        const sign = k === 1 ? '' : k % 2 === 1 ? ' + ' : ' - ';
        if (k === 1) terms.push(`${sign}x`);
        else terms.push(`${sign}\\frac{x^{${k}}}{${k}}`);
      }
      return `\\ln(1 + x) = ${terms.join('')} + o(x^{${n}})`;
    },
  },
  {
    id: 'geom',
    label: '1 / (1 − x)',
    latexName: 'f(x) = \\frac{1}{1 - x}',
    convergenceNote: 'Геометрическая прогрессия: все коэффициенты равны 1 (без факториалов), сходится при |x| < 1',
    xMin: -1.3,
    xMax: 0.92,
    yMin: -0.5,
    yMax: 5,
    exact: (x) => (Math.abs(x - 1) > 0.03 ? 1 / (1 - x) : null),
    poly: (x, n) => {
      let sum = 1;
      for (let k = 1; k <= n; k++) {
        sum += Math.pow(x, k);
      }
      return sum;
    },
    buildLatex: (n) => {
      const terms: string[] = ['1', ' + x'];
      for (let k = 2; k <= n; k++) {
        terms.push(` + x^{${k}}`);
      }
      return `\\frac{1}{1 - x} = ${terms.slice(0, n + 1).join('')} + o(x^{${n}})`;
    },
  },
  {
    id: 'sqrt1px',
    label: '√(1 + x)',
    latexName: 'f(x) = \\sqrt{1 + x} = (1 + x)^{1/2}',
    convergenceNote: 'Биномиальный ряд при α = 1/2, сходится при |x| ≤ 1',
    xMin: -0.98,
    xMax: 1.5,
    yMin: -0.2,
    yMax: 2.0,
    exact: (x) => (x >= -1 ? Math.sqrt(1 + x) : null),
    poly: (x, n) => {
      let sum = 1;
      let binom = 1;
      const alpha = 0.5;
      for (let k = 1; k <= n; k++) {
        binom = (binom * (alpha - k + 1)) / k;
        sum += binom * Math.pow(x, k);
      }
      return sum;
    },
    buildLatex: (n) => {
      const base = [
        '1',
        ' + \\frac{1}{2}x',
        ' - \\frac{1}{8}x^2',
        ' + \\frac{1}{16}x^3',
        ' - \\frac{5}{128}x^4',
        ' + \\frac{7}{256}x^5',
      ];
      const shown = base.slice(0, Math.min(n + 1, base.length)).join('');
      const extra = n >= 6 ? ' - \\dots' : '';
      return `\\sqrt{1 + x} = ${shown}${extra} + o(x^{${n}})`;
    },
  },
];

// Presets for Gauss Matrix Solver (RK 2 problems)
interface MatrixPreset {
  id: string;
  label: string;
  rows: number;
  cols: number;
  data: number[][];
  note: string;
}

const MATRIX_PRESETS: MatrixPreset[] = [
  {
    id: 'rk2-nondegenerate-3x3',
    label: 'РК 2: Квадратная 3×3 (det A ≠ 0, есть A⁻¹)',
    rows: 3,
    cols: 3,
    data: [
      [1, 2, -1],
      [2, 5, -3],
      [1, 3, -1],
    ],
    note: 'Удобная матрица из РК 2 с определителем det A = 1, на которой отлично видно вычисление обратной матрицы A⁻¹.',
  },
  {
    id: 'rk2-rank-deficient-3x4',
    label: 'РК 2: Прямоугольная 3×4 (зависимая 3-я строка, rang = 2)',
    rows: 3,
    cols: 4,
    data: [
      [1, 2, -1, 3],
      [2, 5, 0, 4],
      [3, 7, -1, 7],
    ],
    note: 'Третья строка равна сумме первой и второй (R₃ = R₁ + R₂) → при прямом ходе Гаусса она полностью обнуляется, rang A = 2, свободных переменных: 4 − 2 = 2.',
  },
  {
    id: 'rk2-cramer-2x2',
    label: 'РК 2: Матрица 2×2 (быстрое обращение)',
    rows: 2,
    cols: 2,
    data: [
      [3, -2],
      [5, -3],
    ],
    note: 'Матрица 2×2: det A = 3·(−3) − (−2)·5 = 1.',
  },
];

function formatNum(val: number): string {
  if (Math.abs(val) < 1e-9) return '0';
  if (Math.abs(val - Math.round(val)) < 1e-7) return String(Math.round(val));
  // Try simple fraction up to denominator 24
  for (let d = 2; d <= 24; d++) {
    const num = val * d;
    if (Math.abs(num - Math.round(num)) < 1e-6) {
      const nInt = Math.round(num);
      const sign = nInt < 0 ? '-' : '';
      return `${sign}\\frac{${Math.abs(nInt)}}{${d}}`;
    }
  }
  return val.toFixed(2);
}

function matrixToLatex(m: number[][]): string {
  const rowsStr = m.map((row) => row.map((v) => formatNum(v)).join(' & ')).join(' \\\\ ');
  return `\\begin{pmatrix} ${rowsStr} \\end{pmatrix}`;
}

export function InteractiveMathLabModal({
  isOpen,
  onClose,
  initialTab = 'taylor',
}: InteractiveMathLabModalProps) {
  const [activeTab, setActiveTab] = useState<MathLabTab>(initialTab);

  // --- TAB 1 STATE: TAYLOR & MACLAURIN ---
  const [taylorFuncId, setTaylorFuncId] = useState<TaylorFuncId>('sin');
  const [taylorDegree, setTaylorDegree] = useState<number>(3);
  const [taylorPointX, setTaylorPointX] = useState<number>(1.0);

  const activeTaylorFunc = useMemo(
    () => TAYLOR_FUNCTIONS.find((f) => f.id === taylorFuncId) || TAYLOR_FUNCTIONS[0],
    [taylorFuncId]
  );

  // --- TAB 2 STATE: CAUCHY EPSILON-DELTA & EPSILON-N ---
  const [cauchyMode, setCauchyMode] = useState<'seq' | 'func'>('seq');
  const [epsilon, setEpsilon] = useState<number>(0.12);

  // --- TAB 3 STATE: GAUSS SOLVER ---
  const [matrixRows, setMatrixRows] = useState<number>(3);
  const [matrixCols, setMatrixCols] = useState<number>(3);
  const [matrixGrid, setMatrixGrid] = useState<number[][]>(MATRIX_PRESETS[0].data);
  const [presetNote, setPresetNote] = useState<string>(MATRIX_PRESETS[0].note);

  // Compute Gaussian Elimination steps, Rank, Det, Inverse
  const gaussAnalysis = useMemo(() => {
    const R = matrixRows;
    const C = matrixCols;
    const work: number[][] = Array.from({length: R}, (_, i) =>
      Array.from({length: C}, (__, j) => Number(matrixGrid[i]?.[j] ?? 0))
    );

    const steps: {description: string; latex: string}[] = [
      {
        description: 'Исходная матрица A:',
        latex: `A = ${matrixToLatex(work)}`,
      },
    ];

    let detSign = 1;
    let pivotRow = 0;
    const pivotCols: number[] = [];

    for (let col = 0; col < C && pivotRow < R; col++) {
      // Find best pivot in column
      let sel = pivotRow;
      for (let i = pivotRow + 1; i < R; i++) {
        if (Math.abs(work[i][col]) > Math.abs(work[sel][col])) {
          sel = i;
        }
      }

      if (Math.abs(work[sel][col]) < 1e-9) {
        continue;
      }

      if (sel !== pivotRow) {
        const tmp = work[sel];
        work[sel] = work[pivotRow];
        work[pivotRow] = tmp;
        detSign *= -1;
        steps.push({
          description: `Меняем местами строки R_${pivotRow + 1} ↔ R_${sel + 1} (знак det меняется):`,
          latex: matrixToLatex(work),
        });
      }

      pivotCols.push(col);
      const pivotVal = work[pivotRow][col];

      const ops: string[] = [];
      for (let i = pivotRow + 1; i < R; i++) {
        const factor = work[i][col] / pivotVal;
        if (Math.abs(factor) > 1e-9) {
          for (let j = col; j < C; j++) {
            work[i][j] -= factor * work[pivotRow][j];
            if (Math.abs(work[i][j]) < 1e-9) work[i][j] = 0;
          }
          ops.push(`R_${i + 1} \\leftarrow R_${i + 1} - (${formatNum(factor)})\\cdot R_${pivotRow + 1}`);
        }
      }

      if (ops.length > 0) {
        steps.push({
          description: `Обнуляем элементы под ведущим элементом в столбце ${col + 1}:`,
          latex: `${ops.join(',\\quad ')} \\;\\Longrightarrow\\; ${matrixToLatex(work)}`,
        });
      }

      pivotRow++;
    }

    const rank = pivotCols.length;
    const freeCols: number[] = [];
    for (let j = 0; j < C; j++) {
      if (!pivotCols.includes(j)) freeCols.push(j);
    }

    let determinant: number | null = null;
    let inverseMatrix: number[][] | null = null;

    if (R === C) {
      let prod = detSign;
      for (let i = 0; i < R; i++) {
        prod *= work[i][i];
      }
      determinant = Math.abs(prod) < 1e-9 ? 0 : prod;

      // Compute A^-1 via Gauss-Jordan if det != 0
      if (Math.abs(determinant) > 1e-7) {
        const aug: number[][] = Array.from({length: R}, (_, i) => [
          ...Array.from({length: C}, (__, j) => Number(matrixGrid[i]?.[j] ?? 0)),
          ...Array.from({length: C}, (__, j) => (i === j ? 1 : 0)),
        ]);

        for (let col = 0; col < R; col++) {
          let sel = col;
          for (let i = col + 1; i < R; i++) {
            if (Math.abs(aug[i][col]) > Math.abs(aug[sel][col])) sel = i;
          }
          const tmp = aug[sel];
          aug[sel] = aug[col];
          aug[col] = tmp;

          const piv = aug[col][col];
          for (let j = 0; j < 2 * R; j++) aug[col][j] /= piv;

          for (let i = 0; i < R; i++) {
            if (i !== col) {
              const f = aug[i][col];
              for (let j = 0; j < 2 * R; j++) {
                aug[i][j] -= f * aug[col][j];
              }
            }
          }
        }
        inverseMatrix = aug.map((row) => row.slice(R));
      }
    }

    return {
      steps,
      rank,
      pivotCols,
      freeCols,
      determinant,
      inverseMatrix,
    };
  }, [matrixRows, matrixCols, matrixGrid]);

  if (!isOpen) return null;

  // --- SVG PLOT HELPERS FOR TAB 1 (TAYLOR) ---
  const svgW = 540;
  const svgH = 270;
  const {xMin, xMax, yMin, yMax} = activeTaylorFunc;
  const toSvgX = (x: number) => ((x - xMin) / (xMax - xMin)) * svgW;
  const toSvgY = (y: number) => svgH - ((y - yMin) / (yMax - yMin)) * svgH;

  const exactPathPoints: string[] = [];
  const polyPathPoints: string[] = [];
  const samples = 140;
  for (let i = 0; i <= samples; i++) {
    const x = xMin + ((xMax - xMin) * i) / samples;
    const yEx = activeTaylorFunc.exact(x);
    if (yEx !== null && Number.isFinite(yEx) && yEx >= yMin - 3 && yEx <= yMax + 3) {
      exactPathPoints.push(`${toSvgX(x).toFixed(1)},${toSvgY(yEx).toFixed(1)}`);
    }
    const yPo = activeTaylorFunc.poly(x, taylorDegree);
    if (Number.isFinite(yPo) && yPo >= yMin - 3 && yPo <= yMax + 3) {
      polyPathPoints.push(`${toSvgX(x).toFixed(1)},${toSvgY(yPo).toFixed(1)}`);
    }
  }

  const clampedX = Math.max(xMin + 0.05, Math.min(xMax - 0.05, taylorPointX));
  const exactAtX = activeTaylorFunc.exact(clampedX);
  const polyAtX = activeTaylorFunc.poly(clampedX, taylorDegree);
  const absError = exactAtX !== null ? Math.abs(exactAtX - polyAtX) : null;

  const handleLoadPreset = (preset: MatrixPreset) => {
    setMatrixRows(preset.rows);
    setMatrixCols(preset.cols);
    setMatrixGrid(preset.data.map((r) => [...r]));
    setPresetNote(preset.note);
  };

  const handleResizeMatrix = (r: number, c: number) => {
    setMatrixRows(r);
    setMatrixCols(c);
    setMatrixGrid((prev) =>
      Array.from({length: r}, (_, i) =>
        Array.from({length: c}, (__, j) => prev[i]?.[j] ?? (i === j ? 1 : 0))
      )
    );
    setPresetNote('Пользовательская матрица — измени любые ячейки для мгновенного пересчёта.');
  };

  const handleCellChange = (rIdx: number, cIdx: number, raw: string) => {
    const parsed = Number(raw);
    const val = Number.isNaN(parsed) ? 0 : parsed;
    setMatrixGrid((prev) => {
      const next = prev.map((row) => [...row]);
      if (!next[rIdx]) next[rIdx] = [];
      next[rIdx][cIdx] = val;
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#0B101B] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Интерактивная «Математическая лаборатория»
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Матан & Ангем РК 2 · Live SVG + KaTeX
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Пощупай формулу Тейлора, кванторы Коши ε–δ / ε–N и метод Гаусса своими руками
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Tabs */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/70 border-b border-white/10 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('taylor')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'taylor'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>1. Многочлены Тейлора и Маклорена вживую</span>
          </button>

          <button
            onClick={() => setActiveTab('cauchy')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'cauchy'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>2. Прицел Коши: ε–δ и ε–N визуализатор</span>
          </button>

          <button
            onClick={() => setActiveTab('gauss')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'gauss'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>3. Пошаговый решатель матриц и ранга (Гаусс для РК 2)</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ============================================================== */}
          {/* TAB 1: TAYLOR & MACLAURIN LIVE                                 */}
          {/* ============================================================== */}
          {activeTab === 'taylor' && (
            <div className="space-y-4">
              {/* Function Picker + Sliders */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                      Выбери эталонную функцию f(x):
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {TAYLOR_FUNCTIONS.map((fn) => (
                        <button
                          key={fn.id}
                          onClick={() => setTaylorFuncId(fn.id)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                            taylorFuncId === fn.id
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                              : 'bg-slate-950/70 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {fn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Degree Slider n = 1..9 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">
                        Степень многочлена Маклорена n:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                        n = {taylorDegree}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={9}
                      step={1}
                      value={taylorDegree}
                      onChange={(e) => setTaylorDegree(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>n=1 (касательная)</span>
                      <span>n=3</span>
                      <span>n=5</span>
                      <span>n=7</span>
                      <span>n=9 (высокая точность)</span>
                    </div>
                  </div>

                  {/* Point x Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">
                        Точка измерения погрешности x:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                        x = {clampedX.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={Number((xMin + 0.1).toFixed(2))}
                      max={Number((xMax - 0.1).toFixed(2))}
                      step={0.05}
                      value={clampedX}
                      onChange={(e) => setTaylorPointX(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Numerical Error Readout */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-white/10 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Точное значение f({clampedX.toFixed(2)}):</span>
                      <span className="text-cyan-300 font-bold">
                        {exactAtX !== null ? exactAtX.toFixed(6) : 'не определено'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Многочлен P_{taylorDegree}({clampedX.toFixed(2)}):
                      </span>
                      <span className="text-amber-300 font-bold">{polyAtX.toFixed(6)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-white/10 flex justify-between">
                      <span className="text-slate-300 font-sans font-semibold">
                        Остаток |R_{taylorDegree}(x)| = |f(x) − P_{taylorDegree}(x)|:
                      </span>
                      <span
                        className={`font-bold ${
                          absError !== null && absError < 0.01
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {absError !== null ? absError.toExponential(3) : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live SVG Graph */}
                <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col justify-between space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 text-cyan-300 font-semibold">
                        <span className="w-3 h-1 rounded bg-cyan-400 inline-block" />
                        Точная функция f(x)
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-amber-300 font-semibold">
                        <span className="w-3 h-1 rounded bg-amber-400 inline-block" />
                        Многочлен Маклорена P_{taylorDegree}(x)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Центр разложения: x₀ = 0</span>
                  </div>

                  <div className="relative w-full overflow-hidden rounded-xl bg-slate-950 border border-white/10">
                    <svg
                      viewBox={`0 0 ${svgW} ${svgH}`}
                      className="w-full h-64 sm:h-72 select-none"
                    >
                      {/* Coordinate Axes */}
                      <line
                        x1={0}
                        y1={toSvgY(0)}
                        x2={svgW}
                        y2={toSvgY(0)}
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth={1}
                      />
                      <line
                        x1={toSvgX(0)}
                        y1={0}
                        x2={toSvgX(0)}
                        y2={svgH}
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth={1}
                      />

                      {/* Convergence region highlight for ln(1+x), 1/(1-x), sqrt(1+x) */}
                      {(taylorFuncId === 'ln1px' ||
                        taylorFuncId === 'geom' ||
                        taylorFuncId === 'sqrt1px') && (
                        <rect
                          x={toSvgX(-1)}
                          y={0}
                          width={toSvgX(1) - toSvgX(-1)}
                          height={svgH}
                          fill="rgba(16, 185, 129, 0.06)"
                        />
                      )}

                      {/* Exact Function Curve */}
                      {exactPathPoints.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth={2.5}
                          points={exactPathPoints.join(' ')}
                        />
                      )}

                      {/* Taylor Polynomial Curve */}
                      {polyPathPoints.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth={2.2}
                          strokeDasharray="6 3"
                          points={polyPathPoints.join(' ')}
                        />
                      )}

                      {/* Error vertical bar at x */}
                      {exactAtX !== null && (
                        <>
                          <line
                            x1={toSvgX(clampedX)}
                            y1={toSvgY(exactAtX)}
                            x2={toSvgX(clampedX)}
                            y2={toSvgY(polyAtX)}
                            stroke="#f43f5e"
                            strokeWidth={2}
                          />
                          <circle
                            cx={toSvgX(clampedX)}
                            cy={toSvgY(exactAtX)}
                            r={4.5}
                            fill="#22d3ee"
                          />
                          <circle
                            cx={toSvgX(clampedX)}
                            cy={toSvgY(polyAtX)}
                            r={4.5}
                            fill="#fbbf24"
                          />
                        </>
                      )}
                    </svg>
                  </div>

                  <p className="text-xs text-slate-300">{activeTaylorFunc.convergenceNote}</p>
                </div>
              </div>

              {/* Live KaTeX Expansion Formula */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-1.5">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Формула Маклорена порядка n = {taylorDegree} с остаточным членом в форме Пеано:
                  </span>
                </div>
                <MathBlock
                  latex={activeTaylorFunc.buildLatex(taylorDegree)}
                  displayMode={true}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CAUCHY EPSILON-DELTA & EPSILON-N SCOPE                  */}
          {/* ============================================================== */}
          {activeTab === 'cauchy' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCauchyMode('seq')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      cauchyMode === 'seq'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Предел последовательности (ε – N(ε))
                  </button>
                  <button
                    onClick={() => setCauchyMode('func')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      cauchyMode === 'func'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Предел функции по Коши (ε – δ(ε))
                  </button>
                </div>

                {/* Epsilon Slider */}
                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <span className="text-xs font-bold text-cyan-300 whitespace-nowrap">
                    Допуск ε = {epsilon.toFixed(2)}
                  </span>
                  <input
                    type="range"
                    min={0.03}
                    max={0.45}
                    step={0.01}
                    value={epsilon}
                    onChange={(e) => setEpsilon(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {cauchyMode === 'seq' ? (
                // Sequence limit: a_n = (2n - 1) / (2n) -> 1, |a_n - 1| = 1/(2n) < eps <=> n > 1/(2*eps)
                (() => {
                  const thresholdReal = 1 / (2 * epsilon);
                  const bigN = Math.floor(thresholdReal) + 1;
                  const maxN = Math.max(20, Math.min(35, bigN + 8));
                  const w = 620;
                  const h = 250;
                  const yTop = 1.45;
                  const yBot = 0.45;
                  const sx = (n: number) => 40 + ((n - 1) / (maxN - 1)) * (w - 65);
                  const sy = (y: number) => h - 25 - ((y - yBot) / (yTop - yBot)) * (h - 45);

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                          Доказательство предела последовательности по определению
                        </div>
                        <MathBlock
                          latex="\lim_{n\to\infty} \frac{2n - 1}{2n} = 1"
                          displayMode={true}
                        />
                        <div className="p-3 rounded-xl bg-slate-950/90 border border-white/10 text-xs space-y-2">
                          <div>
                            Решаем неравенство <MathBlock latex="|a_n - 1| < \varepsilon" displayMode={false} className="inline !py-0" />:
                          </div>
                          <MathBlock
                            latex={`\\left|\\frac{2n-1}{2n} - 1\\right| = \\frac{1}{2n} < ${epsilon.toFixed(
                              2
                            )} \\;\\Longleftrightarrow\\; n > \\frac{1}{2 \\cdot ${epsilon.toFixed(
                              2
                            )}} = ${thresholdReal.toFixed(2)}`}
                            displayMode={true}
                            className="text-xs"
                          />
                          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 font-semibold">
                            Порог номера: N(ε) = [{thresholdReal.toFixed(2)}] = {bigN - 1}.<br />
                            Для всех номеров n &gt; {bigN - 1} (начиная с n = {bigN}) все точки последовательности навсегда попадают внутрь ε-трубки!
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Горизонтальная ε-трубка (1 − ε; 1 + ε)</span>
                          <span className="text-emerald-300 font-bold">
                            Зелёные точки: n ≥ {bigN} внутри трубки
                          </span>
                        </div>
                        <div className="rounded-xl bg-slate-950 border border-white/10 overflow-hidden">
                          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-64">
                            {/* Epsilon tube around A = 1 */}
                            <rect
                              x={35}
                              y={sy(1 + epsilon)}
                              width={w - 50}
                              height={sy(1 - epsilon) - sy(1 + epsilon)}
                              fill="rgba(34, 211, 238, 0.14)"
                              stroke="rgba(34, 211, 238, 0.45)"
                              strokeDasharray="4 4"
                            />
                            {/* Limit line y = 1 */}
                            <line
                              x1={35}
                              y1={sy(1)}
                              x2={w - 15}
                              y2={sy(1)}
                              stroke="#22d3ee"
                              strokeWidth={1.5}
                            />
                            {/* Vertical threshold N(eps) */}
                            {bigN <= maxN && (
                              <line
                                x1={sx(bigN)}
                                y1={15}
                                x2={sx(bigN)}
                                y2={h - 20}
                                stroke="#10b981"
                                strokeWidth={2}
                                strokeDasharray="5 3"
                              />
                            )}
                            {/* Sequence points */}
                            {Array.from({length: maxN}, (_, idx) => {
                              const n = idx + 1;
                              const val = (2 * n - 1) / (2 * n);
                              const inside = Math.abs(val - 1) < epsilon;
                              return (
                                <g key={n}>
                                  <circle
                                    cx={sx(n)}
                                    cy={sy(val)}
                                    r={inside ? 4.5 : 4}
                                    fill={inside ? '#10b981' : '#f43f5e'}
                                  />
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Function limit: f(x) = 0.5*x^2 + 0.5 as x -> 1, limit A = 1
                (() => {
                  const x0 = 1.0;
                  const A = 1.0;
                  // For f(x) = 0.5x^2 + 0.5 near x0 = 1, |f(x) - 1| = 0.5|x^2 - 1| <= 1.25|x - 1| => delta = eps / 1.25
                  const delta = Number((epsilon / 1.25).toFixed(3));
                  const w = 620;
                  const h = 250;
                  const xL = 0.2;
                  const xR = 1.75;
                  const yB = 0.45;
                  const yT = 1.75;
                  const sx = (x: number) => ((x - xL) / (xR - xL)) * w;
                  const sy = (y: number) => h - ((y - yB) / (yT - yB)) * h;

                  const pts: string[] = [];
                  for (let i = 0; i <= 100; i++) {
                    const x = xL + ((xR - xL) * i) / 100;
                    const y = 0.5 * x * x + 0.5;
                    pts.push(`${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
                  }

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                          Язык кванторов Коши (ε – δ)
                        </div>
                        <MathBlock
                          latex="\forall \varepsilon > 0 \;\exists \delta(\varepsilon) > 0 \;\forall x: \; 0 < |x - x_0| < \delta \Rightarrow |f(x) - A| < \varepsilon"
                          displayMode={true}
                          className="text-xs"
                        />
                        <div className="p-3 rounded-xl bg-slate-950/90 border border-white/10 text-xs space-y-2 text-slate-300">
                          <p>
                            1. Экзаменатор задаёт вертикальный коридор допуска{' '}
                            <strong className="text-cyan-300">ε = {epsilon.toFixed(2)}</strong> вокруг предела A = 1.
                          </p>
                          <p>
                            2. Мы в ответ предъявляем горизонтальную проколотую окрестность радиуса{' '}
                            <strong className="text-emerald-300">δ(ε) = {delta}</strong> вокруг x₀ = 1.
                          </p>
                          <p className="text-amber-300">
                            Потяни ползунок ε влево: чем у́же горизонтальная ε-трубка, тем у́же сжимается вертикальный δ-коридор!
                          </p>
                        </div>
                      </div>

                      <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span className="text-cyan-300">Горизонтальная полоса: A ± ε</span>
                          <span className="text-emerald-300 font-bold">
                            Вертикальный коридор: x₀ ± δ(ε) = 1 ± {delta}
                          </span>
                        </div>
                        <div className="rounded-xl bg-slate-950 border border-white/10 overflow-hidden">
                          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-64">
                            {/* Horizontal epsilon band */}
                            <rect
                              x={0}
                              y={sy(A + epsilon)}
                              width={w}
                              height={sy(A - epsilon) - sy(A + epsilon)}
                              fill="rgba(34, 211, 238, 0.12)"
                              stroke="rgba(34, 211, 238, 0.4)"
                              strokeDasharray="4 4"
                            />
                            {/* Vertical delta corridor */}
                            <rect
                              x={sx(x0 - delta)}
                              y={0}
                              width={sx(x0 + delta) - sx(x0 - delta)}
                              height={h}
                              fill="rgba(16, 185, 129, 0.14)"
                              stroke="rgba(16, 185, 129, 0.5)"
                              strokeDasharray="4 4"
                            />
                            {/* Curve */}
                            <polyline
                              fill="none"
                              stroke="#f8fafc"
                              strokeWidth={2.5}
                              points={pts.join(' ')}
                            />
                            {/* Punctured point (x0, A) */}
                            <circle
                              cx={sx(x0)}
                              cy={sy(A)}
                              r={5.5}
                              fill="#0B101B"
                              stroke="#fbbf24"
                              strokeWidth={2.5}
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: STEP-BY-STEP GAUSSIAN MATRIX & RANK SOLVER (RK 2)       */}
          {/* ============================================================== */}
          {activeTab === 'gauss' && (
            <div className="space-y-4">
              {/* Presets & Size Selector */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-indigo-300 mr-1">Размерность:</span>
                    {[
                      {r: 2, c: 2, label: '2 × 2'},
                      {r: 3, c: 3, label: '3 × 3'},
                      {r: 3, c: 4, label: '3 × 4 (СЛАУ / Ранг)'},
                    ].map((sz) => (
                      <button
                        key={sz.label}
                        onClick={() => handleResizeMatrix(sz.r, sz.c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          matrixRows === sz.r && matrixCols === sz.c
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-400">Подставить матрицу из РК 2:</span>
                    {MATRIX_PRESETS.map((pr) => (
                      <button
                        key={pr.id}
                        onClick={() => handleLoadPreset(pr)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-indigo-200 text-xs font-medium transition-colors"
                      >
                        {pr.label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-400">{presetNote}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Editable Matrix Input + Key Metrics */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Введи элементы матрицы A ({matrixRows}×{matrixCols}):
                    </span>
                    <button
                      onClick={() => handleLoadPreset(MATRIX_PRESETS[0])}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Сброс
                    </button>
                  </div>

                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${matrixCols}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({length: matrixRows}, (_, rIdx) =>
                      Array.from({length: matrixCols}, (__, cIdx) => (
                        <input
                          key={`${rIdx}-${cIdx}`}
                          type="number"
                          step="1"
                          value={matrixGrid[rIdx]?.[cIdx] ?? 0}
                          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-white/15 focus:border-indigo-400 text-center font-mono text-sm font-bold text-white outline-none"
                        />
                      ))
                    )}
                  </div>

                  {/* Calculated Invariants */}
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-indigo-500/30 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Ранг матрицы rang(A):</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-sm">
                        r = {gaussAnalysis.rank}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Базисные переменные (ведущие столбцы):</span>
                      <span className="font-mono font-bold text-cyan-300">
                        {gaussAnalysis.pivotCols.length > 0
                          ? gaussAnalysis.pivotCols.map((c) => `x_${c + 1}`).join(', ')
                          : 'нет'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">
                        Свободные переменные (размерность ФСР n − r):
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        {gaussAnalysis.freeCols.length > 0
                          ? `${gaussAnalysis.freeCols.map((c) => `x_${c + 1}`).join(', ')} (k = ${
                              gaussAnalysis.freeCols.length
                            })`
                          : '0 (только тривиальное решение)'}
                      </span>
                    </div>

                    {gaussAnalysis.determinant !== null && (
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">
                          Определитель квадратной матрицы det(A):
                        </span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            gaussAnalysis.determinant === 0 ? 'text-rose-400' : 'text-indigo-300'
                          }`}
                        >
                          {formatNum(gaussAnalysis.determinant)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Inverse Matrix A^-1 if square and non-degenerate */}
                  {gaussAnalysis.inverseMatrix && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                      <div className="text-xs font-bold text-emerald-300">
                        Обратная матрица A⁻¹ существует (det A ≠ 0):
                      </div>
                      <MathBlock
                        latex={`A^{-1} = ${matrixToLatex(gaussAnalysis.inverseMatrix)}`}
                        displayMode={true}
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Step-by-Step Gaussian Elimination Log */}
                <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Пошаговый прямой ход метода Гаусса к ступенчатому виду:
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {gaussAnalysis.steps.map((st, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-950/90 border border-white/10 space-y-1.5"
                      >
                        <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[11px]">
                            Шаг {idx + 1}
                          </span>
                          <span>{st.description}</span>
                        </div>
                        <MathBlock latex={st.latex} displayMode={true} className="text-xs sm:text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
