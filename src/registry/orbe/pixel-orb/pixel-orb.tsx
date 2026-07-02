'use client';

import { useEffect, useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

const GRID = 23;
const TAU = Math.PI * 2;
const LIGHT_LEN = Math.hypot(-0.5, -0.65, 0.6);
const LX = -0.5 / LIGHT_LEN;
const LY = -0.65 / LIGHT_LEN;
const LZ = 0.6 / LIGHT_LEN;

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const fract = (v: number) => v - Math.floor(v);

const hash2 = (a: number, b: number) =>
  fract(Math.sin(a * 127.1 + b * 311.7) * 43758.5453);

const HASH = (() => {
  const table = new Float32Array(GRID * GRID);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) table[y * GRID + x] = hash2(x, y);
  }
  return table;
})();

type Rgb = [number, number, number];

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

const hexToRgb = (hex: string): Rgb => {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const parseColor = (ctx: CanvasRenderingContext2D, input: string): Rgb => {
  ctx.fillStyle = input;
  const parsed = String(ctx.fillStyle);
  if (parsed.startsWith('#')) return hexToRgb(parsed);
  const parts = parsed.match(/[\d.]+/g);
  return parts && parts.length >= 3
    ? [Number(parts[0]), Number(parts[1]), Number(parts[2])]
    : [127, 127, 127];
};

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const css = (c: Rgb, k: number) =>
  `rgb(${Math.round(c[0] * k)}, ${Math.round(c[1] * k)}, ${Math.round(c[2] * k)})`;

export const PixelOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#34d399',
  colorTo = '#22d3ee',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);
  const colorRef = useRef({ from: colorFrom, to: colorTo });
  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = speed;
    colorRef.current = { from: colorFrom, to: colorTo };
    wakeRef.current?.();
  });

  useOrbLevel(ref, state, levelRef);

  useEffect(() => {
    const host = ref.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ink = parseColor(ctx, getComputedStyle(host).color);
    const darkTheme = 0.299 * ink[0] + 0.587 * ink[1] + 0.114 * ink[2] > 128;

    let raf = 0;
    let start: number | null = null;
    let inView = true;
    let pageVisible = !document.hidden;
    let rampKey = '';
    let ramp: string[] = [];
    let scanRamp: string[] = [];
    const rowOff = new Int8Array(GRID);

    const ensureRamp = (from: string, to: string) => {
      const key = `${from}|${to}`;
      if (key === rampKey) return;
      rampKey = key;
      const a = parseColor(ctx, from);
      const b = parseColor(ctx, to);
      const base = mix(a, b, 0.4);
      const steps: Rgb[] = [
        mix(base, BLACK, darkTheme ? 0.45 : 0.6),
        mix(base, BLACK, 0.35),
        darkTheme ? base : mix(base, BLACK, 0.08),
        mix(a, b, 0.7),
        mix(b, WHITE, 0.55),
      ];
      ramp = steps.map((step) => css(step, 1));
      scanRamp = steps.map((step) => css(step, 0.94));
    };

    const render = (elapsed: number) => {
      const st = stateRef.current;
      const spd = st === 'disabled' || reduce ? 0 : speedRef.current;
      const t = elapsed * spd;
      const raw =
        st === 'disabled'
          ? 0
          : Math.min(
              1,
              Math.max(
                0,
                Number.parseFloat(host.style.getPropertyValue('--orb-level')) || 0,
              ),
            );
      const lvl = raw ** 1.4;
      const err = st === 'error';
      ensureRamp(
        err ? '#fb7185' : colorRef.current.from,
        err ? '#f43f5e' : colorRef.current.to,
      );

      let amp = 0.1;
      let flow = -1;
      let twist = 0;
      let wave = 2.4;
      let breathe = 1;
      switch (st) {
        case 'idle':
          breathe = 1 + 0.03 * Math.sin(t * 1.3);
          wave = 1.6;
          break;
        case 'listening':
          flow = 1;
          amp = 0.12 + 0.22 * lvl;
          wave = 3.2;
          break;
        case 'thinking':
          twist = 2;
          amp = 0.16;
          wave = 2.2;
          break;
        case 'connecting':
          amp = 0.05;
          wave = 1.8;
          break;
        case 'speaking':
          amp = 0.12 + 0.28 * lvl;
          wave = 3.6;
          break;
        case 'error':
          amp = 0.07;
          wave = 1.2;
          break;
        case 'disabled':
          amp = 0;
          break;
      }

      if (err) {
        const seed = Math.floor(elapsed * Math.min(2.8, 2.2 * spd));
        for (let y = 0; y < GRID; y++) {
          const h = hash2(y, seed);
          rowOff[y] = h > 0.82 ? 1 : h < 0.18 ? -1 : 0;
        }
      }

      const c = (GRID - 1) / 2;
      const baseR = GRID * 0.32 * breathe;
      const swell = 1 + 0.2 * lvl;
      const hx = Math.round(c - 0.35 * baseR * swell);
      const hy = Math.round(c - 0.4 * baseR * swell);
      const arcAng = t * 2;

      ctx.clearRect(0, 0, GRID, GRID);

      for (let y = 0; y < GRID; y++) {
        const off = err ? rowOff[y] : 0;
        const row = y & 1 ? scanRamp : ramp;
        for (let x = 0; x < GRID; x++) {
          const dx = x - off - c;
          const dy = y - c;
          const dist = Math.hypot(dx, dy);
          const ang = Math.atan2(dy, dx);
          const radius =
            baseR *
            (swell +
              0.12 * lvl * Math.sin(3 * ang + 2.1 * t) +
              0.05 * Math.sin(5 * ang - 1.3 * t));
          if (dist > radius) continue;
          const q = dist / radius;
          const nx = dx / radius;
          const ny = dy / radius;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          const lam = Math.max(0, nx * LX + ny * LY + nz * LZ);
          const s =
            0.14 +
            0.78 * lam +
            amp * Math.sin(dist * 0.95 + flow * t * wave + ang * twist) +
            (BAYER[y & 3][x & 3] / 16 - 0.5) / 5;
          let idx = Math.floor(s * 5);
          if (idx < 0) idx = 0;
          if (idx > 4) idx = 4;
          if (q > 0.82 && idx > 1) idx = 1;
          if (st === 'connecting' && q > 0.6) {
            const rel = fract((arcAng - ang) / TAU) * TAU;
            if (rel < 1.7) idx = Math.min(4, idx + (rel < 0.5 ? 2 : 1));
          }
          if (x >= hx && x < hx + 2 && y >= hy && y < hy + 2) idx = 4;
          if (idx < 4 && fract(HASH[y * GRID + x] + 0.2 * t) > 0.97) idx += 1;
          ctx.fillStyle = row[idx];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    };

    const active = () =>
      inView && pageVisible && !reduce && stateRef.current !== 'disabled';

    const step = (now: number) => {
      raf = 0;
      if (start === null) start = now;
      render((now - start) / 1000);
      if (active()) raf = requestAnimationFrame(step);
    };

    const wake = () => {
      if (raf === 0) raf = requestAnimationFrame(step);
    };
    wakeRef.current = wake;

    const halt = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) inView = entry.isIntersecting;
      if (inView) wake();
      else halt();
    });
    io.observe(host);

    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) wake();
      else halt();
    };
    document.addEventListener('visibilitychange', onVisibility);

    wake();

    return () => {
      halt();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      wakeRef.current = null;
    };
  }, []);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : undefined,
        transition: 'opacity 0.3s ease, filter 0.3s ease',
      }}
    >
      <canvas
        ref={canvasRef}
        width={GRID}
        height={GRID}
        style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
      />
    </div>
  );
};
