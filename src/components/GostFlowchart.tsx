import {useState} from 'react';

interface GostFlowchartProps {
  taskId: 'exam-task-1' | 'exam-task-2';
}

export function GostFlowchart({taskId}: GostFlowchartProps) {
  const [activeDiagram, setActiveDiagram] = useState<'main' | 'sub'>('sub');

  const isTask1 = taskId === 'exam-task-1';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Схемы алгоритмов по ГОСТ 19.701-90
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Обязательная графическая часть экзаменационного ответа: основная программа и подпрограмма
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveDiagram('main')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeDiagram === 'main'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Основная программа (main)
          </button>
          <button
            type="button"
            onClick={() => setActiveDiagram('sub')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeDiagram === 'sub'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {isTask1 ? 'Подпрограмма sortRowsBySum' : 'Подпрограмма findSameEnds'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] p-4 flex justify-center">
        {activeDiagram === 'main' ? (
          isTask1 ? <Task1MainSvg /> : <Task2MainSvg />
        ) : isTask1 ? (
          <Task1SubSvg />
        ) : (
          <Task2SubSvg />
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span>Овал — Терминатор (Начало / Конец)</span>
        <span aria-hidden="true">·</span>
        <span>Параллелограмм — Ввод / Вывод (только в main)</span>
        <span aria-hidden="true">·</span>
        <span>Двойные боковые грани — Предопределённый процесс (вызов)</span>
        <span aria-hidden="true">·</span>
        <span>Шестиугольник — Модификатор цикла</span>
        <span aria-hidden="true">·</span>
        <span>Ромб — Решение</span>
      </div>
    </div>
  );
}

/* Shared SVG helper shapes conforming to GOST 19.701-90 */
function SvgDefs() {
  return (
    <defs>
      <marker
        id="gost-arrow"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-slate-600 dark:fill-slate-400" />
      </marker>
    </defs>
  );
}

function Terminator({x, y, text}: {x: number; y: number; text: string}) {
  return (
    <g>
      <rect
        x={x - 95}
        y={y}
        width="190"
        height="36"
        rx="18"
        className="fill-white dark:fill-slate-900 stroke-slate-700 dark:stroke-slate-300"
        strokeWidth="1.5"
      />
      <text
        x={x}
        y={y + 22}
        textAnchor="middle"
        className="fill-slate-900 dark:fill-slate-100 text-[12px] font-medium"
      >
        {text}
      </text>
    </g>
  );
}

function IoBox({x, y, lines}: {x: number; y: number; lines: string[]}) {
  const h = lines.length > 1 ? 46 : 38;
  const pts = `${x - 105},${y} ${x + 120},${y} ${x + 105},${y + h} ${x - 120},${y + h}`;
  return (
    <g>
      <polygon
        points={pts}
        className="fill-white dark:fill-slate-900 stroke-slate-700 dark:stroke-slate-300"
        strokeWidth="1.5"
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={y + (lines.length > 1 ? 18 + i * 16 : 23)}
          textAnchor="middle"
          className="fill-slate-900 dark:fill-slate-100 text-[12px]"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function PredefinedBox({x, y, lines}: {x: number; y: number; lines: string[]}) {
  const h = lines.length > 1 ? 46 : 38;
  return (
    <g>
      <rect
        x={x - 115}
        y={y}
        width="230"
        height={h}
        className="fill-sky-50 dark:fill-sky-950/50 stroke-sky-700 dark:stroke-sky-400"
        strokeWidth="1.5"
      />
      <line
        x1={x - 103}
        y1={y}
        x2={x - 103}
        y2={y + h}
        className="stroke-sky-700 dark:stroke-sky-400"
        strokeWidth="1.5"
      />
      <line
        x1={x + 103}
        y1={y}
        x2={x + 103}
        y2={y + h}
        className="stroke-sky-700 dark:stroke-sky-400"
        strokeWidth="1.5"
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={y + (lines.length > 1 ? 19 + i * 15 : 23)}
          textAnchor="middle"
          className="fill-slate-900 dark:fill-sky-100 text-[12px] font-medium"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function ProcessBox({x, y, lines, w = 220}: {x: number; y: number; lines: string[]; w?: number}) {
  const h = lines.length > 1 ? 46 : 36;
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y}
        width={w}
        height={h}
        className="fill-white dark:fill-slate-900 stroke-slate-700 dark:stroke-slate-300"
        strokeWidth="1.5"
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={y + (lines.length > 1 ? 18 + i * 16 : 22)}
          textAnchor="middle"
          className="fill-slate-900 dark:fill-slate-100 text-[12px]"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function LoopModBox({x, y, text, w = 210}: {x: number; y: number; text: string; w?: number}) {
  const hw = w / 2;
  const pts = `${x - hw + 14},${y} ${x + hw - 14},${y} ${x + hw},${y + 18} ${x + hw - 14},${y + 36} ${x - hw + 14},${y + 36} ${x - hw},${y + 18}`;
  return (
    <g>
      <polygon
        points={pts}
        className="fill-white dark:fill-slate-900 stroke-slate-700 dark:stroke-slate-300"
        strokeWidth="1.5"
      />
      <text
        x={x}
        y={y + 22}
        textAnchor="middle"
        className="fill-slate-900 dark:fill-slate-100 text-[12px] font-mono"
      >
        {text}
      </text>
    </g>
  );
}

function DecisionDiamond({x, y, text, w = 210, h = 52}: {x: number; y: number; text: string; w?: number; h?: number}) {
  const pts = `${x},${y} ${x + w / 2},${y + h / 2} ${x},${y + h} ${x - w / 2},${y + h / 2}`;
  return (
    <g>
      <polygon
        points={pts}
        className="fill-amber-50 dark:fill-amber-950/40 stroke-amber-700 dark:stroke-amber-400"
        strokeWidth="1.5"
      />
      <text
        x={x}
        y={y + h / 2 + 4}
        textAnchor="middle"
        className="fill-slate-900 dark:fill-amber-100 text-[12px] font-medium"
      >
        {text}
      </text>
    </g>
  );
}

function FlowLine({d, arrow = false}: {d: string; arrow?: boolean}) {
  return (
    <path
      d={d}
      fill="none"
      className="stroke-slate-600 dark:stroke-slate-400"
      strokeWidth="1.5"
      markerEnd={arrow ? 'url(#gost-arrow)' : undefined}
    />
  );
}

function Task1MainSvg() {
  const cx = 210;
  return (
    <svg viewBox="0 0 420 350" className="w-full max-w-[440px] h-auto">
      <SvgDefs />
      <Terminator x={cx} y={12} text="Начало main()" />
      <FlowLine d={`M ${cx} 48 L ${cx} 70`} />
      <IoBox x={cx} y={70} lines={['Ввод размеров n, m', 'и матрицы a[n][m]']} />
      <FlowLine d={`M ${cx} 116 L ${cx} 142`} />
      <PredefinedBox x={cx} y={142} lines={['sortRowsBySum(a, n, m)']} />
      <FlowLine d={`M ${cx} 180 L ${cx} 206`} />
      <IoBox x={cx} y={206} lines={['Вывод отсортированной', 'матрицы a[n][m]']} />
      <FlowLine d={`M ${cx} 252 L ${cx} 280`} />
      <Terminator x={cx} y={280} text="Конец" />
    </svg>
  );
}

function Task1SubSvg() {
  const cx = 240;
  return (
    <svg viewBox="0 0 480 610" className="w-full max-w-[500px] h-auto">
      <SvgDefs />
      <Terminator x={cx} y={10} text="sortRowsBySum(a, n, m)" />
      <FlowLine d={`M ${cx} 46 L ${cx} 66`} />
      <LoopModBox x={cx} y={66} text="i = 0 .. n - 1" />
      <FlowLine d={`M ${cx} 102 L ${cx} 120`} />
      <ProcessBox x={cx} y={120} lines={['sums[i] = сумма строки a[i][0..m-1]']} w={245} />
      <FlowLine d={`M ${cx} 156 L ${cx} 182`} />
      <LoopModBox x={cx} y={182} text="pass = 0 .. n - 2" />
      <FlowLine d={`M ${cx} 218 L ${cx} 238`} />
      <LoopModBox x={cx} y={238} text="i = 0 .. n - 2 - pass" />
      <FlowLine d={`M ${cx} 274 L ${cx} 296`} />
      <DecisionDiamond x={cx} y={296} text="sums[i] > sums[i+1] ?" w={210} h={56} />
      {/* Да branch */}
      <text x={cx + 114} y={318} className="fill-emerald-700 dark:fill-emerald-400 text-[11px] font-semibold">
        Да
      </text>
      <text x={cx - 128} y={318} className="fill-rose-700 dark:fill-rose-400 text-[11px] font-semibold">
        Нет
      </text>
      <FlowLine d={`M ${cx + 105} 324 L ${cx + 155} 324 L ${cx + 155} 364`} />
      <ProcessBox
        x={cx + 95}
        y={364}
        lines={['Обмен sums[i] ↔ sums[i+1]', 'Обмен строк a[i] ↔ a[i+1] (k=0..m-1)']}
        w={250}
      />
      <FlowLine d={`M ${cx - 105} 324 L ${cx - 155} 324 L ${cx - 155} 430 L ${cx} 430`} />
      <FlowLine d={`M ${cx + 155} 410 L ${cx + 155} 430 L ${cx} 430`} />
      <FlowLine d={`M ${cx} 430 L ${cx} 458`} arrow />
      <ProcessBox x={cx} y={458} lines={['Следующая итерация i, затем pass']} w={240} />
      <FlowLine d={`M ${cx} 494 L ${cx} 522`} />
      <Terminator x={cx} y={522} text="Возврат (Конец)" />
    </svg>
  );
}

function Task2MainSvg() {
  const cx = 220;
  return (
    <svg viewBox="0 0 440 420" className="w-full max-w-[460px] h-auto">
      <SvgDefs />
      <Terminator x={cx} y={12} text="Начало main()" />
      <FlowLine d={`M ${cx} 48 L ${cx} 68`} />
      <IoBox x={cx} y={68} lines={['Ввод числа строк k']} />
      <FlowLine d={`M ${cx} 106 L ${cx} 130`} />
      <LoopModBox x={cx} y={130} text="s = 0 .. k - 1" />
      <FlowLine d={`M ${cx} 166 L ${cx} 188`} />
      <IoBox x={cx} y={188} lines={['Ввод строки line (fgets)']} />
      <FlowLine d={`M ${cx} 226 L ${cx} 250`} />
      <PredefinedBox x={cx} y={250} lines={['cnt = findSameEnds(line, res)']} />
      <FlowLine d={`M ${cx} 288 L ${cx} 312`} />
      <IoBox x={cx} y={312} lines={['Вывод cnt и строки слов res']} />
      <FlowLine d={`M ${cx} 350 L ${cx} 374`} />
      <Terminator x={cx} y={374} text="Конец" />
    </svg>
  );
}

function Task2SubSvg() {
  const cx = 240;
  return (
    <svg viewBox="0 0 480 570" className="w-full max-w-[500px] h-auto">
      <SvgDefs />
      <Terminator x={cx} y={10} text="findSameEnds(src, out)" />
      <FlowLine d={`M ${cx} 46 L ${cx} 68`} />
      <ProcessBox x={cx} y={68} lines={['i = 0; outPos = 0; count = 0']} w={220} />
      <FlowLine d={`M ${cx} 104 L ${cx} 126`} />
      <DecisionDiamond x={cx} y={126} text="src[i] != '\\0' ?" w={200} h={52} />
      <text x={cx + 108} y={146} className="fill-rose-700 dark:fill-rose-400 text-[11px] font-semibold">
        Нет
      </text>
      <text x={cx + 10} y={194} className="fill-emerald-700 dark:fill-emerald-400 text-[11px] font-semibold">
        Да
      </text>
      {/* Выход Нет */}
      <FlowLine d={`M ${cx + 100} 152 L ${cx + 185} 152 L ${cx + 185} 480 L ${cx} 480`} />
      <FlowLine d={`M ${cx} 178 L ${cx} 202`} />
      <ProcessBox
        x={cx}
        y={202}
        lines={['Пропуск пробелов; старт слова start = i', 'Идём до пробела / \\0 → end = i - 1']}
        w={270}
      />
      <FlowLine d={`M ${cx} 248 L ${cx} 274`} />
      <DecisionDiamond x={cx} y={274} text="src[start] == src[end] ?" w={220} h={54} />
      <text x={cx + 116} y={294} className="fill-emerald-700 dark:fill-emerald-400 text-[11px] font-semibold">
        Да
      </text>
      <text x={cx - 125} y={294} className="fill-rose-700 dark:fill-rose-400 text-[11px] font-semibold">
        Нет
      </text>
      <FlowLine d={`M ${cx + 110} 301 L ${cx + 150} 301 L ${cx + 150} 342`} />
      <ProcessBox
        x={cx + 65}
        y={342}
        lines={['Копируем src[start..end] в out', 'count++']}
        w={230}
      />
      <FlowLine d={`M ${cx - 110} 301 L ${cx - 165} 301 L ${cx - 165} 415 L ${cx} 415`} />
      <FlowLine d={`M ${cx + 150} 388 L ${cx + 150} 415 L ${cx} 415`} />
      {/* Loop back */}
      <FlowLine d={`M ${cx} 415 L ${cx - 190} 415 L ${cx - 190} 116 L ${cx} 116`} arrow />
      <FlowLine d={`M ${cx} 480 L ${cx} 500`} />
      <ProcessBox x={cx} y={500} lines={["out[outPos] = '\\0'; возврат count"]} w={230} />
    </svg>
  );
}
