import {MouseEvent, useMemo, useState} from 'react';
import {Activity} from 'lucide-react';
import {MathBlock} from './MathBlock';

interface FunctionGraphCardProps {
  taskId: string;
}

interface MarkedPoint {
  x: number;
  y: number;
  label: string;
  kind: 'extremum' | 'inflection';
}

interface MatanGraphSpec {
  title: string;
  latex: string;
  fn: (x: number) => number;
  xRange: [number, number];
  yRange: [number, number];
  verticalAsymptotes: number[];
  obliqueAsymptote?: {k: number; b: number; label: string};
  points: MarkedPoint[];
  summary: string;
}

const SQRT2 = Math.SQRT2;
const CBRT4 = Math.cbrt(4);

const MATAN_GRAPH_SPECS: Record<string, MatanGraphSpec> = {
  'matan-5-1': {
    title: 'График исследования f(x) = x⁴ / (x³ − 1)',
    latex: 'f(x) = \\dfrac{x^4}{x^3 - 1}',
    fn: (x) => (Math.abs(x - 1) < 0.025 ? Number.NaN : x ** 4 / (x ** 3 - 1)),
    xRange: [-4.5, 5.5],
    yRange: [-5, 7],
    verticalAsymptotes: [1],
    obliqueAsymptote: {k: 1, b: 0, label: 'y = x'},
    points: [
      {x: 0, y: 0, label: 'max (0; 0)', kind: 'extremum'},
      {
        x: CBRT4,
        y: (4 * CBRT4) / 3,
        label: 'min (∛4; 4∛4/3)',
        kind: 'extremum',
      },
    ],
    summary:
      'Вертикальная асимптота x = 1, наклонная y = x. Локальный max в (0; 0), локальный min в (∛4 ≈ 1.59; 2.12).',
  },
  'matan-5-2': {
    title: 'График f(x) = ln(1 + x²) — экстремумы и выпуклость',
    latex: 'f(x) = \\ln(1 + x^2)',
    fn: (x) => Math.log(1 + x * x),
    xRange: [-4.5, 4.5],
    yRange: [-0.8, 3.6],
    verticalAsymptotes: [],
    points: [
      {x: 0, y: 0, label: 'min (0; 0)', kind: 'extremum'},
      {x: -1, y: Math.LN2, label: 'перегиб (−1; ln 2)', kind: 'inflection'},
      {x: 1, y: Math.LN2, label: 'перегиб (1; ln 2)', kind: 'inflection'},
    ],
    summary:
      'Чётная функция без асимптот. Минимум в (0; 0); выпукла вниз на (−1; 1), выпукла вверх при |x| > 1; точки перегиба (±1; ln 2).',
  },
  'matan-5-3': {
    title: 'График f(x) = ln(1 + x²) — интервалы выпуклости и перегибы',
    latex: 'f(x) = \\ln(1 + x^2)',
    fn: (x) => Math.log(1 + x * x),
    xRange: [-4.5, 4.5],
    yRange: [-0.8, 3.6],
    verticalAsymptotes: [],
    points: [
      {x: 0, y: 0, label: 'min (0; 0)', kind: 'extremum'},
      {x: -1, y: Math.LN2, label: 'перегиб (−1; ln 2)', kind: 'inflection'},
      {x: 1, y: Math.LN2, label: 'перегиб (1; ln 2)', kind: 'inflection'},
    ],
    summary:
      'Вторая производная f\'\'(x) = 2(1 − x²)/(1 + x²)² меняет знак в точках x = −1 и x = 1.',
  },
  'matan-5-4': {
    title: 'График f(x) = x² / (2(x − 1))',
    latex: 'f(x) = \\dfrac{x^2}{2(x - 1)}',
    fn: (x) =>
      Math.abs(x - 1) < 0.025 ? Number.NaN : (x * x) / (2 * (x - 1)),
    xRange: [-4, 6],
    yRange: [-4.5, 6.5],
    verticalAsymptotes: [1],
    obliqueAsymptote: {k: 0.5, b: 0.5, label: 'y = 0.5x + 0.5'},
    points: [
      {x: 0, y: 0, label: 'max (0; 0)', kind: 'extremum'},
      {x: 2, y: 2, label: 'min (2; 2)', kind: 'extremum'},
    ],
    summary:
      'Вертикальная асимптота x = 1, наклонная y = x/2 + 1/2. Локальный max (0; 0), локальный min (2; 2).',
  },
  'matan-5-5': {
    title: 'График f(x) = (x² + 1) / x',
    latex: 'f(x) = \\dfrac{x^2 + 1}{x} = x + \\dfrac{1}{x}',
    fn: (x) => (Math.abs(x) < 0.025 ? Number.NaN : (x * x + 1) / x),
    xRange: [-5, 5],
    yRange: [-6, 6],
    verticalAsymptotes: [0],
    obliqueAsymptote: {k: 1, b: 0, label: 'y = x'},
    points: [
      {x: -1, y: -2, label: 'max (−1; −2)', kind: 'extremum'},
      {x: 1, y: 2, label: 'min (1; 2)', kind: 'extremum'},
    ],
    summary:
      'Нечётная функция: вертикальная асимптота x = 0, наклонная y = x. Локальный max (−1; −2), локальный min (1; 2).',
  },
  'matan-5-6': {
    title: 'График f(x) = (x² + 1) / (x − 1)',
    latex: 'f(x) = \\dfrac{x^2 + 1}{x - 1}',
    fn: (x) => (Math.abs(x - 1) < 0.025 ? Number.NaN : (x * x + 1) / (x - 1)),
    xRange: [-4, 6],
    yRange: [-5.5, 8.5],
    verticalAsymptotes: [1],
    obliqueAsymptote: {k: 1, b: 1, label: 'y = x + 1'},
    points: [
      {
        x: 1 - SQRT2,
        y: 2 - 2 * SQRT2,
        label: 'max (1−√2; 2−2√2)',
        kind: 'extremum',
      },
      {
        x: 1 + SQRT2,
        y: 2 + 2 * SQRT2,
        label: 'min (1+√2; 2+2√2)',
        kind: 'extremum',
      },
    ],
    summary:
      'Вертикальная асимптота x = 1, наклонная y = x + 1. Локальный max ≈ (−0.41; −0.83), локальный min ≈ (2.41; 4.83).',
  },
};

export function hasMatanGraph(taskId: string): boolean {
  return Boolean(MATAN_GRAPH_SPECS[taskId]);
}

const SVG_W = 640;
const SVG_H = 340;
const PAD = 36;

export function FunctionGraphCard({taskId}: FunctionGraphCardProps) {
  const spec = MATAN_GRAPH_SPECS[taskId];
  const [showAsymptotes, setShowAsymptotes] = useState(true);
  const [showExtrema, setShowExtrema] = useState(true);
  const [showInflections, setShowInflections] = useState(true);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const [xMin, xMax] = spec ? spec.xRange : [-5, 5];
  const [yMin, yMax] = spec ? spec.yRange : [-5, 5];

  const toSvgX = (x: number) =>
    PAD + ((x - xMin) / (xMax - xMin)) * (SVG_W - PAD * 2);
  const toSvgY = (y: number) =>
    SVG_H - PAD - ((y - yMin) / (yMax - yMin)) * (SVG_H - PAD * 2);

  const curvePaths = useMemo(() => {
    if (!spec) return [];
    const paths: string[] = [];
    const samples = 520;
    let currentD = '';
    let prevY: number | null = null;

    for (let i = 0; i <= samples; i++) {
      const x = xMin + (i / samples) * (xMax - xMin);
      const y = spec.fn(x);
      const isJump =
        prevY !== null &&
        Math.abs(y - prevY) > (yMax - yMin) * 0.45;

      if (
        !Number.isFinite(y) ||
        y < yMin - 1.2 ||
        y > yMax + 1.2 ||
        isJump
      ) {
        if (currentD) {
          paths.push(currentD);
          currentD = '';
        }
        prevY = null;
        continue;
      }

      const sx = toSvgX(x).toFixed(1);
      const sy = toSvgY(y).toFixed(1);
      currentD += currentD ? ` L ${sx} ${sy}` : `M ${sx} ${sy}`;
      prevY = y;
    }
    if (currentD) paths.push(currentD);
    return paths;
  }, [spec, xMin, xMax, yMin, yMax]);

  if (!spec) return null;

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    if (relX < PAD || relX > SVG_W - PAD) {
      setHoverX(null);
      return;
    }
    const mathX = xMin + ((relX - PAD) / (SVG_W - PAD * 2)) * (xMax - xMin);
    setHoverX(mathX);
  };

  const hoverY = hoverX !== null ? spec.fn(hoverX) : Number.NaN;
  const hoverValid =
    hoverX !== null &&
    Number.isFinite(hoverY) &&
    hoverY >= yMin &&
    hoverY <= yMax;

  const xTicks: number[] = [];
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    if (x !== 0) xTicks.push(x);
  }
  const yTicks: number[] = [];
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    if (y !== 0) yTicks.push(y);
  }

  return (
    <div className="rounded-lg border border-sky-200 dark:border-sky-800/60 bg-white dark:bg-[#0B101B] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-semibold text-slate-900 dark:text-[#F3F4F6]">
            {spec.title}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-[#D1D5DB]">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showAsymptotes}
              onChange={(e) => setShowAsymptotes(e.target.checked)}
              className="accent-rose-500"
            />
            <span>Асимптоты</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showExtrema}
              onChange={(e) => setShowExtrema(e.target.checked)}
              className="accent-emerald-500"
            />
            <span>Экстремумы</span>
          </label>
          {spec.points.some((p) => p.kind === 'inflection') && (
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showInflections}
                onChange={(e) => setShowInflections(e.target.checked)}
                className="accent-amber-500"
              />
              <span>Перегибы</span>
            </label>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <MathBlock latex={spec.latex} displayMode={false} />
        <span className="text-xs font-mono tabular-nums text-sky-700 dark:text-sky-400">
          {hoverValid && hoverX !== null
            ? `x = ${hoverX.toFixed(2)},  f(x) = ${hoverY.toFixed(2)}`
            : 'Наведите на график для координат (x, f(x))'}
        </span>
      </div>

      <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#101010]">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-auto block select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverX(null)}
        >
          <defs>
            <clipPath id={`plot-clip-${taskId}`}>
              <rect
                x={PAD}
                y={PAD}
                width={SVG_W - PAD * 2}
                height={SVG_H - PAD * 2}
              />
            </clipPath>
          </defs>

          {/* Grid lines */}
          {xTicks.map((x) => (
            <line
              key={`gx-${x}`}
              x1={toSvgX(x)}
              y1={PAD}
              x2={toSvgX(x)}
              y2={SVG_H - PAD}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth={1}
            />
          ))}
          {yTicks.map((y) => (
            <line
              key={`gy-${y}`}
              x1={PAD}
              y1={toSvgY(y)}
              x2={SVG_W - PAD}
              y2={toSvgY(y)}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth={1}
            />
          ))}

          {/* Axes */}
          {yMin <= 0 && yMax >= 0 && (
            <line
              x1={PAD}
              y1={toSvgY(0)}
              x2={SVG_W - PAD}
              y2={toSvgY(0)}
              stroke="currentColor"
              className="text-slate-500 dark:text-slate-400"
              strokeWidth={1.5}
            />
          )}
          {xMin <= 0 && xMax >= 0 && (
            <line
              x1={toSvgX(0)}
              y1={PAD}
              x2={toSvgX(0)}
              y2={SVG_H - PAD}
              stroke="currentColor"
              className="text-slate-500 dark:text-slate-400"
              strokeWidth={1.5}
            />
          )}

          {/* Tick labels */}
          {xTicks.map((x) => (
            <text
              key={`tx-${x}`}
              x={toSvgX(x)}
              y={Math.min(SVG_H - PAD + 14, toSvgY(0) + 14)}
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
            >
              {x}
            </text>
          ))}
          {yTicks.map((y) => (
            <text
              key={`ty-${y}`}
              x={Math.max(PAD - 6, toSvgX(0) - 6)}
              y={toSvgY(y) + 3}
              textAnchor="end"
              className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
            >
              {y}
            </text>
          ))}

          <g clipPath={`url(#plot-clip-${taskId})`}>
            {/* Asymptotes */}
            {showAsymptotes &&
              spec.verticalAsymptotes.map((ax) => (
                <g key={`va-${ax}`}>
                  <line
                    x1={toSvgX(ax)}
                    y1={PAD}
                    x2={toSvgX(ax)}
                    y2={SVG_H - PAD}
                    stroke="#e11d48"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                  />
                  <text
                    x={toSvgX(ax) + 5}
                    y={PAD + 14}
                    className="fill-rose-600 dark:fill-rose-400 text-[10px] font-mono font-semibold"
                  >
                    x = {ax}
                  </text>
                </g>
              ))}

            {showAsymptotes && spec.obliqueAsymptote && (
              <g>
                <line
                  x1={toSvgX(xMin)}
                  y1={toSvgY(
                    spec.obliqueAsymptote.k * xMin + spec.obliqueAsymptote.b,
                  )}
                  x2={toSvgX(xMax)}
                  y2={toSvgY(
                    spec.obliqueAsymptote.k * xMax + spec.obliqueAsymptote.b,
                  )}
                  stroke="#f97316"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                />
                <text
                  x={SVG_W - PAD - 72}
                  y={PAD + 14}
                  className="fill-orange-600 dark:fill-orange-400 text-[10px] font-mono font-semibold"
                >
                  {spec.obliqueAsymptote.label}
                </text>
              </g>
            )}

            {/* Function curves */}
            {curvePaths.map((d, idx) => (
              <path
                key={idx}
                d={d}
                fill="none"
                stroke="#0284c7"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Marked extrema & inflection points */}
            {spec.points.map((pt) => {
              if (pt.kind === 'extremum' && !showExtrema) return null;
              if (pt.kind === 'inflection' && !showInflections) return null;
              const cx = toSvgX(pt.x);
              const cy = toSvgY(pt.y);
              const fill = pt.kind === 'extremum' ? '#10b981' : '#f59e0b';
              return (
                <g key={pt.label}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4.5}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                  <text
                    x={cx + 7}
                    y={cy - 7}
                    className="fill-slate-900 dark:fill-slate-100 text-[10px] font-mono font-semibold"
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}

            {/* Hover crosshair */}
            {hoverValid && hoverX !== null && (
              <g>
                <line
                  x1={toSvgX(hoverX)}
                  y1={PAD}
                  x2={toSvgX(hoverX)}
                  y2={SVG_H - PAD}
                  stroke="#38bdf8"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={toSvgX(hoverX)}
                  cy={toSvgY(hoverY)}
                  r={4.5}
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              </g>
            )}
          </g>
        </svg>
      </div>

      <p className="text-xs text-slate-600 dark:text-[#D1D5DB]">
        {spec.summary}
      </p>
    </div>
  );
}
