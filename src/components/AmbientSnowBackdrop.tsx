import {useMemo} from 'react';

interface SnowFlakeSpec {
  id: number;
  leftPct: number;
  sizePx: number;
  blurPx: number;
  opacityDark: number;
  opacityLight: number;
  durationSec: number;
  delaySec: number;
  driftPx: number;
  warmTint: boolean;
}

// Deterministic pseudo-random helper so SSR/re-renders never cause jitter
function seededUnit(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface AmbientSnowBackdropProps {
  snowEnabled: boolean;
  warmGlowEnabled: boolean;
}

export function AmbientSnowBackdrop({
  snowEnabled,
  warmGlowEnabled,
}: AmbientSnowBackdropProps) {
  const flakes = useMemo<SnowFlakeSpec[]>(() => {
    const items: SnowFlakeSpec[] = [];
    const total = 46;
    for (let i = 0; i < total; i++) {
      const r1 = seededUnit(i + 1);
      const r2 = seededUnit(i + 101);
      const r3 = seededUnit(i + 211);
      const r4 = seededUnit(i + 307);
      const r5 = seededUnit(i + 409);

      // 3 optical depth planes: far tiny, mid soft, foreground bokeh
      const layer = i % 3;
      const sizePx =
        layer === 0
          ? 2.5 + r2 * 2
          : layer === 1
            ? 4.5 + r2 * 3
            : 8 + r2 * 5.5;
      const blurPx =
        layer === 0
          ? 1 + r3 * 0.8
          : layer === 1
            ? 2.2 + r3 * 1.4
            : 4.5 + r3 * 2.5;
      const durationSec =
        layer === 0
          ? 22 + r4 * 14
          : layer === 1
            ? 16 + r4 * 10
            : 12 + r4 * 8;

      items.push({
        id: i,
        leftPct: Math.round(r1 * 1000) / 10,
        sizePx: Math.round(sizePx * 10) / 10,
        blurPx: Math.round(blurPx * 10) / 10,
        opacityDark:
          layer === 0
            ? Math.round((0.11 + r5 * 0.07) * 100) / 100
            : layer === 1
              ? Math.round((0.09 + r5 * 0.07) * 100) / 100
              : Math.round((0.07 + r5 * 0.05) * 100) / 100,
        opacityLight:
          layer === 0
            ? Math.round((0.18 + r5 * 0.09) * 100) / 100
            : layer === 1
              ? Math.round((0.14 + r5 * 0.08) * 100) / 100
              : Math.round((0.1 + r5 * 0.06) * 100) / 100,
        durationSec: Math.round(durationSec * 10) / 10,
        delaySec: -Math.round(r5 * durationSec * 10) / 10,
        driftPx: Math.round((r3 - 0.5) * 68),
        // ~28% of foreground bokeh flakes pick up a warm candle-amber glint
        warmTint: layer === 2 && r4 > 0.45,
      });
    }
    return items;
  }, []);

  if (!snowEnabled && !warmGlowEnabled) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="no-print fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
    >
      {/* Organic Warm New Year Light Pools & Subtle Festive Silhouettes (Ёлки и Свечи) */}
      {warmGlowEnabled && (
        <>
          <div className="ambient-warm-orb ambient-warm-orb-1" />
          <div className="ambient-warm-orb ambient-warm-orb-2" />
          <div className="ambient-warm-orb ambient-warm-orb-3" />
          <div className="ambient-warm-orb ambient-warm-orb-4" />

          {/* Soft Top Garland Bokeh Dots (Ultra-low contrast peripheral fairy lights) */}
          <div className="hidden md:flex items-center justify-between px-12 pt-1.5 opacity-30 dark:opacity-45">
            <span className="ambient-garland-dot ambient-garland-gold" />
            <span className="ambient-garland-dot ambient-garland-emerald" style={{animationDelay: '-1.4s'}} />
            <span className="ambient-garland-dot ambient-garland-amber" style={{animationDelay: '-2.8s'}} />
            <span className="ambient-garland-dot ambient-garland-cyan" style={{animationDelay: '-0.9s'}} />
            <span className="ambient-garland-dot ambient-garland-gold" style={{animationDelay: '-3.6s'}} />
            <span className="ambient-garland-dot ambient-garland-emerald" style={{animationDelay: '-2.1s'}} />
            <span className="ambient-garland-dot ambient-garland-amber" style={{animationDelay: '-4.2s'}} />
          </div>

          {/* Left Peripheral Margin: Subtle Snow-Dusted New Year Pine Trees (Ёлочки с мягкими огоньками) */}
          <div className="hidden lg:block fixed bottom-0 left-3 xl:left-6 pointer-events-none opacity-[0.10] dark:opacity-[0.15] transition-opacity duration-700">
            <div className="relative">
              {/* Soft warm radial aura behind the tree */}
              <div className="absolute -inset-6 rounded-full bg-amber-400/15 dark:bg-amber-400/20 blur-2xl" />
              <svg
                width="156"
                height="220"
                viewBox="0 0 156 220"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative"
              >
                {/* Top warm star glow */}
                <circle cx="66" cy="18" r="10" fill="url(#treeStarHalo)" className="ambient-tree-light" />
                <path
                  d="M66 9L68.2 15.2L74.5 16L69.5 20L71 26.2L66 22.6L61 26.2L62.5 20L57.5 16L63.8 15.2L66 9Z"
                  fill="#FBBF24"
                  fillOpacity="0.88"
                />

                {/* Main Pine Tree Tiers */}
                <path
                  d="M66 24L38 68H52L30 112H46L20 162H112L86 112H102L80 68H94L66 24Z"
                  fill="url(#pineGradient)"
                  stroke="rgba(52, 211, 153, 0.35)"
                  strokeWidth="1"
                />
                {/* Snow caps on branches */}
                <path
                  d="M38 68C48 65 56 67 66 64C76 67 84 65 94 68"
                  stroke="rgba(226, 232, 240, 0.45)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M30 112C44 108 55 111 66 107C77 111 88 108 102 112"
                  stroke="rgba(226, 232, 240, 0.4)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M20 162C38 157 52 160 66 156C80 160 94 157 112 162"
                  stroke="rgba(226, 232, 240, 0.38)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Tree trunk */}
                <rect x="59" y="162" width="14" height="24" rx="2" fill="#78350F" fillOpacity="0.65" />

                {/* Companion smaller pine tree on the right */}
                <path
                  d="M122 86L104 118H113L98 148H108L92 180H150L135 148H145L131 118H140L122 86Z"
                  fill="url(#pineGradientSmall)"
                  stroke="rgba(52, 211, 153, 0.25)"
                  strokeWidth="0.8"
                />
                <rect x="118" y="180" width="8" height="14" rx="1.5" fill="#78350F" fillOpacity="0.5" />

                {/* Soft Garland String Curves */}
                <path
                  d="M46 62C58 70 74 68 85 58"
                  stroke="rgba(251, 191, 36, 0.32)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <path
                  d="M37 104C55 116 77 114 94 100"
                  stroke="rgba(251, 191, 36, 0.3)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <path
                  d="M28 150C52 164 80 161 103 144"
                  stroke="rgba(251, 191, 36, 0.28)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />

                {/* Warm Twinkling Fairy Lights on the Pine Tree */}
                <circle cx="54" cy="54" r="3" fill="#FBBF24" className="ambient-tree-light" />
                <circle cx="76" cy="61" r="2.8" fill="#34D399" className="ambient-tree-light" style={{animationDelay: '-1.3s'}} />
                <circle cx="48" cy="94" r="3.2" fill="#F59E0B" className="ambient-tree-light" style={{animationDelay: '-2.5s'}} />
                <circle cx="67" cy="88" r="2.8" fill="#38BDF8" className="ambient-tree-light" style={{animationDelay: '-0.8s'}} />
                <circle cx="83" cy="102" r="3.2" fill="#FBBF24" className="ambient-tree-light" style={{animationDelay: '-3.1s'}} />
                <circle cx="38" cy="142" r="3.4" fill="#FBBF24" className="ambient-tree-light" style={{animationDelay: '-1.9s'}} />
                <circle cx="62" cy="136" r="3" fill="#34D399" className="ambient-tree-light" style={{animationDelay: '-3.8s'}} />
                <circle cx="88" cy="146" r="3.4" fill="#FB923C" className="ambient-tree-light" style={{animationDelay: '-0.5s'}} />
                <circle cx="122" cy="128" r="2.5" fill="#FBBF24" className="ambient-tree-light" style={{animationDelay: '-2.2s'}} />
                <circle cx="114" cy="160" r="2.6" fill="#34D399" className="ambient-tree-light" style={{animationDelay: '-1.1s'}} />

                <defs>
                  <radialGradient id="treeStarHalo" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(66 18) scale(10)">
                    <stop stopColor="#FBBF24" stopOpacity="0.65" />
                    <stop offset="1" stopColor="#FBBF24" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="pineGradient" x1="66" y1="24" x2="66" y2="162" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#065F46" stopOpacity="0.72" />
                    <stop offset="1" stopColor="#022C22" stopOpacity="0.88" />
                  </linearGradient>
                  <linearGradient id="pineGradientSmall" x1="122" y1="86" x2="122" y2="180" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#047857" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#022C22" stopOpacity="0.72" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Right Peripheral Margin: Cozy Study Desk Candles & Pine Sprig (Свечи с мягким живым пламенем) */}
          <div className="hidden lg:block fixed bottom-0 right-4 xl:right-7 pointer-events-none opacity-[0.11] dark:opacity-[0.16] transition-opacity duration-700">
            <div className="relative">
              {/* Warm Candlelight Pool */}
              <div className="absolute -top-6 -inset-x-6 bottom-0 rounded-full bg-amber-500/20 dark:bg-amber-400/25 blur-2xl" />
              <svg
                width="136"
                height="176"
                viewBox="0 0 136 176"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative"
              >
                {/* Tall Candle Halo & Flame */}
                <circle cx="52" cy="46" r="24" fill="url(#candleHalo1)" className="ambient-candle-halo" />
                <path
                  d="M52 30C52 30 45 41 45 47C45 51.5 48.1 55 52 55C55.9 55 59 51.5 59 47C59 41 52 30 52 30Z"
                  fill="url(#flameGrad1)"
                  className="ambient-candle-flame"
                />
                <path
                  d="M52 38C52 38 48.5 44 48.5 47.5C48.5 49.8 50 51.5 52 51.5C54 51.5 55.5 49.8 55.5 47.5C55.5 44 52 38 52 38Z"
                  fill="#FEF3C7"
                  className="ambient-candle-flame"
                />
                {/* Wick */}
                <line x1="52" y1="54" x2="52" y2="59" stroke="#451A03" strokeWidth="1.6" strokeLinecap="round" />

                {/* Tall Candle Body with subtle wax drips */}
                <rect
                  x="36"
                  y="59"
                  width="32"
                  height="95"
                  rx="5"
                  fill="url(#waxBodyGrad)"
                  stroke="rgba(251, 191, 36, 0.34)"
                  strokeWidth="1"
                />
                <path
                  d="M37 62C41 62 42 74 44 74C46 74 46 65 51 65C55 65 56 79 58 79C60 79 61 63 67 63"
                  stroke="rgba(254, 243, 199, 0.45)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Shorter Companion Candle Halo & Flame */}
                <circle cx="92" cy="74" r="20" fill="url(#candleHalo2)" className="ambient-candle-halo" style={{animationDelay: '-1.7s'}} />
                <path
                  d="M92 60C92 60 86 69.5 86 74.5C86 78.2 88.7 81 92 81C95.3 81 98 78.2 98 74.5C98 69.5 92 60 92 60Z"
                  fill="url(#flameGrad2)"
                  className="ambient-candle-flame"
                  style={{animationDelay: '-1.1s'}}
                />
                <path
                  d="M92 67C92 67 89.2 72 89.2 74.8C89.2 76.7 90.4 78 92 78C93.6 78 94.8 76.7 94.8 74.8C94.8 72 92 67 92 67Z"
                  fill="#FEF3C7"
                  className="ambient-candle-flame"
                  style={{animationDelay: '-1.1s'}}
                />
                <line x1="92" y1="80" x2="92" y2="85" stroke="#451A03" strokeWidth="1.5" strokeLinecap="round" />

                {/* Shorter Candle Body */}
                <rect
                  x="78"
                  y="85"
                  width="28"
                  height="69"
                  rx="4.5"
                  fill="url(#waxBodyGrad)"
                  stroke="rgba(251, 191, 36, 0.3)"
                  strokeWidth="1"
                />

                {/* Brass Holder Saucer & Evergreen Sprig */}
                <path
                  d="M20 154H116C119 154 121 157 118 160H18C15 157 17 154 20 154Z"
                  fill="#B45309"
                  fillOpacity="0.65"
                />
                {/* Fir sprig at candle base */}
                <path
                  d="M24 153C34 145 48 147 62 153C74 146 92 146 110 153"
                  stroke="#10B981"
                  strokeOpacity="0.65"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="48" cy="151" r="2.6" fill="#F59E0B" />
                <circle cx="66" cy="150" r="2.6" fill="#EF4444" fillOpacity="0.8" />
                <circle cx="82" cy="151" r="2.4" fill="#F59E0B" />

                <defs>
                  <radialGradient id="candleHalo1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(52 46) scale(24)">
                    <stop stopColor="#FBBF24" stopOpacity="0.58" />
                    <stop offset="0.55" stopColor="#F97316" stopOpacity="0.22" />
                    <stop offset="1" stopColor="#F97316" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="candleHalo2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(92 74) scale(20)">
                    <stop stopColor="#FBBF24" stopOpacity="0.52" />
                    <stop offset="0.55" stopColor="#F97316" stopOpacity="0.18" />
                    <stop offset="1" stopColor="#F97316" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="flameGrad1" x1="52" y1="30" x2="52" y2="55" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FEF08A" />
                    <stop offset="0.6" stopColor="#F59E0B" />
                    <stop offset="1" stopColor="#EA580C" />
                  </linearGradient>
                  <linearGradient id="flameGrad2" x1="92" y1="60" x2="92" y2="81" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FEF08A" />
                    <stop offset="0.6" stopColor="#F59E0B" />
                    <stop offset="1" stopColor="#EA580C" />
                  </linearGradient>
                  <linearGradient id="waxBodyGrad" x1="52" y1="59" x2="52" y2="154" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FEF3C7" stopOpacity="0.78" />
                    <stop offset="0.4" stopColor="#FDE68A" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#92400E" stopOpacity="0.48" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </>
      )}

      {/* Softly Blurred Depth-Layered Snowflakes */}
      {snowEnabled && (
        <div className="ambient-snow-layer">
          {flakes.map((flake) => (
            <span
              key={flake.id}
              className={`ambient-snowflake ${
                flake.warmTint && warmGlowEnabled ? 'ambient-snowflake-warm' : ''
              }`}
              style={
                {
                  left: `${flake.leftPct}%`,
                  width: `${flake.sizePx}px`,
                  height: `${flake.sizePx}px`,
                  filter: `blur(${flake.blurPx}px)`,
                  animationDuration: `${flake.durationSec}s`,
                  animationDelay: `${flake.delaySec}s`,
                  '--snow-drift': `${flake.driftPx}px`,
                  '--snow-opacity-dark': flake.opacityDark,
                  '--snow-opacity-light': flake.opacityLight,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
