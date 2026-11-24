import {PointerEvent, useCallback, useEffect, useRef, useState} from 'react';
import {
  Eraser,
  Grid,
  PenTool,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react';

interface DrawingScratchpadProps {
  taskKey: string;
  onSendToPhotoCheck?: (dataUrl: string) => void;
}

interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  color: string;
  width: number;
  isEraser: boolean;
  points: StrokePoint[];
}

const PEN_COLORS = [
  {id: 'ink', label: 'Тёмный', value: '#1e293b'},
  {id: 'blue', label: 'Синяя ручка', value: '#0284c7'},
  {id: 'red', label: 'Красный', value: '#dc2626'},
  {id: 'green', label: 'Зелёный', value: '#059669'},
];

export function DrawingScratchpad({
  taskKey,
  onSendToPhotoCheck,
}: DrawingScratchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeColor, setActiveColor] = useState<string>('#0284c7');
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [penSize, setPenSize] = useState<number>(2.5);
  const drawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<Stroke | null>(null);

  // Reset strokes when switching to a different task
  useEffect(() => {
    setStrokes([]);
    currentStrokeRef.current = null;
    drawingRef.current = false;
  }, [taskKey]);

  const redrawCanvas = useCallback(
    (strokeList: Stroke[], draftStroke?: Stroke | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || 680;
      const cssH = canvas.clientHeight || 320;
      if (
        canvas.width !== Math.floor(cssW * dpr) ||
        canvas.height !== Math.floor(cssH * dpr)
      ) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Crisp white notebook paper background (ideal both visually and for multimodal AI OCR)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cssW, cssH);

      if (showGrid) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        const step = 22;
        ctx.beginPath();
        for (let x = step; x < cssW; x += step) {
          ctx.moveTo(x + 0.5, 0);
          ctx.lineTo(x + 0.5, cssH);
        }
        for (let y = step; y < cssH; y += step) {
          ctx.moveTo(0, y + 0.5);
          ctx.lineTo(cssW, y + 0.5);
        }
        ctx.stroke();
      }

      const drawOne = (s: Stroke) => {
        if (s.points.length === 0) return;
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = s.isEraser ? '#ffffff' : s.color;
        ctx.lineWidth = s.isEraser ? 18 : s.width;

        if (s.points.length === 1) {
          ctx.arc(s.points[0].x, s.points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
          return;
        }

        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.stroke();
      };

      for (const s of strokeList) drawOne(s);
      if (draftStroke) drawOne(draftStroke);

      ctx.restore();
    },
    [showGrid],
  );

  useEffect(() => {
    redrawCanvas(strokes);
  }, [strokes, redrawCanvas]);

  useEffect(() => {
    const handleResize = () => redrawCanvas(strokes);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [strokes, redrawCanvas]);

  const getPoint = (e: PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const pt = getPoint(e);
    currentStrokeRef.current = {
      color: activeColor,
      width: penSize,
      isEraser,
      points: [pt],
    };
    redrawCanvas(strokes, currentStrokeRef.current);
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !currentStrokeRef.current) return;
    const pt = getPoint(e);
    currentStrokeRef.current.points.push(pt);
    redrawCanvas(strokes, currentStrokeRef.current);
  };

  const finishStroke = () => {
    if (!drawingRef.current || !currentStrokeRef.current) return;
    const finished = currentStrokeRef.current;
    drawingRef.current = false;
    currentStrokeRef.current = null;
    setStrokes((prev) => [...prev, finished]);
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
  };

  const handleExportToChecker = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSendToPhotoCheck) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSendToPhotoCheck(dataUrl);
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B101B] p-3 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {PEN_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.label}
              onClick={() => {
                setActiveColor(c.value);
                setIsEraser(false);
              }}
              className={`h-6 w-6 rounded-full border-2 transition-transform cursor-pointer ${
                !isEraser && activeColor === c.value
                  ? 'border-sky-500 scale-110'
                  : 'border-white dark:border-white/[0.08]'
              }`}
              style={{backgroundColor: c.value}}
            />
          ))}

          <span className="mx-1 text-slate-300 dark:text-[#404040]">|</span>

          <button
            type="button"
            onClick={() => setIsEraser(false)}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border cursor-pointer ${
              !isEraser
                ? 'border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200'
                : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8]'
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            <span>Ручка</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEraser(true)}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border cursor-pointer ${
              isEraser
                ? 'border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200'
                : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8]'
            }`}
          >
            <Eraser className="h-3.5 w-3.5" />
            <span>Ластик</span>
          </button>

          <select
            value={penSize}
            onChange={(e) => setPenSize(Number(e.target.value))}
            aria-label="Толщина ручки"
            className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131B2B] text-slate-700 dark:text-[#D1D5DB] cursor-pointer"
          >
            <option value={2}>Тонкая</option>
            <option value={2.5}>Обычная</option>
            <option value={4}>Толстая</option>
          </select>

          <button
            type="button"
            onClick={() => setShowGrid((g) => !g)}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border cursor-pointer ${
              showGrid
                ? 'border-slate-400 bg-white text-slate-900 dark:border-[#555] dark:bg-[#222] dark:text-[#F3F4F6]'
                : 'border-slate-200 dark:border-white/[0.08] text-slate-500'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Клетка</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={strokes.length === 0}
            onClick={handleUndo}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#182235] disabled:opacity-40 cursor-pointer"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Отменить</span>
          </button>
          <button
            type="button"
            disabled={strokes.length === 0}
            onClick={handleClear}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-white/[0.08] text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Очистить</span>
          </button>
          {onSendToPhotoCheck && (
            <button
              type="button"
              disabled={strokes.length === 0}
              onClick={handleExportToChecker}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded prism-cta disabled:opacity-40 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Отправить черновик на проверку</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-300 dark:border-[#3A3A3A] overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          className="block w-full h-[280px] sm:h-[320px] touch-none cursor-crosshair"
        />
      </div>
      <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
        Рисуйте мышью, стилусом или пальцем. После решения нажмите «Отправить черновик на проверку» для пошагового аудита.
      </p>
    </div>
  );
}
