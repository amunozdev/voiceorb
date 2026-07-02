'use client';

import { useEffect, useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

const TWO_PI = Math.PI * 2;
const STAR_COUNT = 150;
const NEBULA_COUNT = 4;
const FRINGE_COUNT = 22;

interface Star {
  a: number;
  r: number;
  size: number;
  phase: number;
  twinkle: number;
  bright: number;
}

interface Nebula {
  orbit: number;
  base: number;
  drift: number;
  radius: number;
  tone: number;
  alpha: number;
}

interface Fringe {
  a: number;
  drift: number;
  spread: number;
}

const hexToRgb = (hex: string): [number, number, number] => {
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

const mix = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export const GalaxyOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#c084fc',
  colorTo = '#38bdf8',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);
  const colorRef = useRef({ from: colorFrom, to: colorTo });

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = speed;
    colorRef.current = { from: colorFrom, to: colorTo };
  });

  useOrbLevel(ref, state, levelRef);

  useEffect(() => {
    const host = ref.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const rand = (seed: number) => {
      const x = Math.sin(seed * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    const stars: Star[] = Array.from({ length: STAR_COUNT }, (_, i) => ({
      a: rand(i + 1) * TWO_PI,
      r: Math.sqrt(rand(i + 7.3)) * 0.92,
      size: 0.35 + rand(i + 2.1) * 1.15,
      phase: rand(i + 3.7) * TWO_PI,
      twinkle: 0.4 + rand(i + 4.9) * 3,
      bright: 0.3 + rand(i + 5.5) * 0.7,
    }));

    const nebulas: Nebula[] = Array.from({ length: NEBULA_COUNT }, (_, i) => ({
      orbit: (0.12 + rand(i + 11) * 0.3) * 1,
      base: rand(i + 13) * TWO_PI,
      drift: (0.04 + rand(i + 17) * 0.08) * (rand(i + 19) > 0.5 ? 1 : -1),
      radius: 0.52 + rand(i + 23) * 0.36,
      tone: rand(i + 29) * 0.72,
      alpha: 0.46 + rand(i + 31) * 0.34,
    }));

    const fringes: Fringe[] = Array.from({ length: FRINGE_COUNT }, (_, i) => ({
      a: rand(i + 41) * TWO_PI,
      drift: (0.02 + rand(i + 43) * 0.05) * (rand(i + 47) > 0.5 ? 1 : -1),
      spread: 0.012 + rand(i + 53) * 0.02,
    }));

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.46;
    let raf = 0;
    let start: number | null = null;

    const traceShell = (t: number, wobble: number) => {
      ctx.beginPath();
      for (let a = 0; a <= TWO_PI + 0.001; a += 0.12) {
        const w = 1 + wobble * (Math.sin(a * 3 + t * 0.6) + Math.sin(a * 2 - t * 0.45)) * 0.5;
        const rr = R * w;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const render = (t: number) => {
      const state = stateRef.current;
      const spd = speedRef.current;
      const level = Number.parseFloat(getComputedStyle(host).getPropertyValue('--orb-level')) || 0;
      const isError = state === 'error';
      const from = hexToRgb(isError ? '#fb7185' : colorRef.current.from);
      const to = hexToRgb(isError ? '#f43f5e' : colorRef.current.to);
      const spin =
        state === 'connecting' || state === 'thinking' ? 1.9 : 1;
      const wobble = 0.012 + level * 0.05 + (state === 'speaking' ? 0.02 : 0);

      ctx.clearRect(0, 0, size, size);

      // ---- galaxy interior (clipped to the wobbly glass shell) ----
      ctx.save();
      traceShell(t * spd, reduce ? 0 : wobble);
      ctx.clip();

      // deep-space base
      const space = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.05);
      space.addColorStop(0, '#0b0a18');
      space.addColorStop(0.6, '#070610');
      space.addColorStop(1, '#020208');
      ctx.fillStyle = space;
      ctx.fillRect(0, 0, size, size);

      // nebula clouds
      ctx.globalCompositeOperation = 'lighter';
      for (const n of nebulas) {
        const ang = n.base + t * n.drift * spd * spin;
        const nx = cx + Math.cos(ang) * n.orbit * R;
        const ny = cy + Math.sin(ang) * n.orbit * R;
        const nr = n.radius * R * (1 + level * 0.18);
        const [cr, cg, cb] = mix(from, to, n.tone);
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        const alpha = n.alpha * (0.85 + level * 0.5);
        g.addColorStop(0, `rgba(${cr | 0}, ${cg | 0}, ${cb | 0}, ${alpha.toFixed(3)})`);
        g.addColorStop(0.5, `rgba(${cr | 0}, ${cg | 0}, ${cb | 0}, ${(alpha * 0.35).toFixed(3)})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
      }

      // stars
      for (const s of stars) {
        const sx = cx + Math.cos(s.a) * s.r * R;
        const sy = cy + Math.sin(s.a) * s.r * R;
        const tw = 0.55 + 0.45 * Math.sin(t * s.twinkle * spd + s.phase);
        const alpha = Math.min(1, s.bright * tw * (0.7 + level * 0.6));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, s.size * (1 + level * 0.3), 0, TWO_PI);
        ctx.fill();
      }

      // ---- glass shell (still clipped) ----
      // fresnel rim
      const fres = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
      fres.addColorStop(0, 'rgba(255,255,255,0)');
      fres.addColorStop(0.82, 'rgba(190,205,255,0.10)');
      fres.addColorStop(0.97, 'rgba(220,230,255,0.28)');
      fres.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = fres;
      ctx.fillRect(0, 0, size, size);

      // broad top-left highlight
      const hx = cx - R * 0.34;
      const hy = cy - R * 0.4;
      const hi = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.55);
      hi.addColorStop(0, 'rgba(255,255,255,0.22)');
      hi.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hi;
      ctx.fillRect(0, 0, size, size);

      // soft bottom-right bounce light
      const bx = cx + R * 0.32;
      const by = cy + R * 0.36;
      const bo = ctx.createRadialGradient(bx, by, 0, bx, by, R * 0.4);
      bo.addColorStop(0, 'rgba(180,200,255,0.10)');
      bo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bo;
      ctx.fillRect(0, 0, size, size);

      // chromatic-aberration fringe dots on the rim
      for (const f of fringes) {
        const ang = f.a + t * f.drift * spd;
        const rr = R * (0.9 + 0.07 * Math.sin(t * 0.5 + f.a));
        for (const [dx, col] of [
          [-f.spread, 'rgba(255,40,80,0.55)'],
          [0, 'rgba(60,255,120,0.5)'],
          [f.spread, 'rgba(60,120,255,0.55)'],
        ] as const) {
          const x = cx + Math.cos(ang + dx) * rr;
          const y = cy + Math.sin(ang + dx) * rr;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(x, y, 0.9, 0, TWO_PI);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();

      // sharp specular hotspot (over everything, unclipped but inside the shell)
      const shx = cx - R * 0.3;
      const shy = cy - R * 0.42;
      const spec = ctx.createRadialGradient(shx, shy, 0, shx, shy, R * 0.16);
      spec.addColorStop(0, 'rgba(255,255,255,0.9)');
      spec.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.arc(shx, shy, R * 0.16, 0, TWO_PI);
      ctx.fill();
    };

    if (reduce) {
      render(0);
      return;
    }

    const frame = (now: number) => {
      if (start === null) start = now;
      render((now - start) / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size]);

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
      }}
    >
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
};
