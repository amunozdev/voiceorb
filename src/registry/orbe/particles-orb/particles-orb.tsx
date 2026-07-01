'use client';

import { useEffect, useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

const PARTICLE_COUNT = 720;
const TWO_PI = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

interface SpherePoint {
  x: number;
  y: number;
  z: number;
  ringFrac: number;
  seed: number;
  tone: number;
}

const buildSphere = (count: number): SpherePoint[] => {
  const points: SpherePoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = GOLDEN_ANGLE * i;
    points.push({
      x: Math.cos(theta) * radiusAtY,
      y,
      z: Math.sin(theta) * radiusAtY,
      ringFrac: (i * 0.61803398875) % 1,
      seed: ((i * 0.7548776662) % 1) * TWO_PI,
      tone: (i * 0.5436890126) % 1,
    });
  }
  return points;
};

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

export const ParticlesOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#f0abfc',
  colorTo = '#818cf8',
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

    const points = buildSphere(PARTICLE_COUNT);
    const center = size / 2;
    const baseRadius = center * 0.62;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let morph = 0;
    let angleY = 0;
    let connectingPhase = 0;
    const angleX = 0.32;
    let raf = 0;
    let start: number | null = null;

    const render = (t: number) => {
      const state = stateRef.current;
      const spd = speedRef.current;
      const level =
        Number.parseFloat(getComputedStyle(host).getPropertyValue('--orb-level')) || 0;

      const isError = state === 'error';
      const from = hexToRgb(isError ? '#fb7185' : colorRef.current.from);
      const to = hexToRgb(isError ? '#f43f5e' : colorRef.current.to);

      morph += ((state === 'connecting' ? 1 : 0) - morph) * 0.06;
      connectingPhase = (connectingPhase + (reduce ? 0.004 : 0.018) * spd) % TWO_PI;

      const breathe = 0.045 * Math.sin(t * 1.1);
      const radius = baseRadius * (1 + level * 0.4 + breathe);
      angleY += (0.0024 + level * 0.013) * spd;
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      ctx.clearRect(0, 0, size, size);
      const active = state === 'listening' || state === 'speaking' || state === 'thinking';
      ctx.globalCompositeOperation = active && !reduce ? 'lighter' : 'source-over';

      const droplet = state === 'listening';
      const asymmetryScale = reduce ? 0 : 1;

      for (let i = 0; i < points.length; i += 1) {
        const p = points[i];

        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const depth = (z2 + 1) / 2;
        const perspective = 0.65 + depth * 0.45;

        let pointRadius = radius;
        if (droplet) {
          const expand =
            z2 > 0
              ? 1 + level * 0.65 * 0.5 * asymmetryScale
              : 1 - level * 0.65 * 0.3 * asymmetryScale;
          pointRadius = radius * expand;
        }

        const sphereX = center + x1 * pointRadius * perspective;
        const sphereY = center + y1 * pointRadius * perspective;
        const sphereAlpha = 0.12 + depth * depth * 0.78;
        const sphereDot = 0.6 + depth * 1.5;

        let screenX = sphereX;
        let screenY = sphereY;
        let alpha = sphereAlpha;
        let dot = sphereDot;

        if (morph > 0.001) {
          const base = (i / points.length) * TWO_PI;
          const jitter = 0.05 * Math.sin(t * 1.3 + p.seed);
          const ringAngle = base + connectingPhase + jitter;
          const ringR =
            center * (0.58 + 0.13 * p.ringFrac) * (1 + 0.05 * Math.sin(t + p.seed * 1.7));
          const circleX = center + Math.cos(ringAngle) * ringR;
          const circleY = center + Math.sin(ringAngle) * ringR;
          const ringAlpha = 0.35 + p.tone * 0.5;
          const ringDot = 0.75 + p.tone * 0.9;

          screenX = sphereX + (circleX - sphereX) * morph;
          screenY = sphereY + (circleY - sphereY) * morph;
          alpha = sphereAlpha + (ringAlpha - sphereAlpha) * morph;
          dot = sphereDot + (ringDot - sphereDot) * morph;
        }

        const cr = from[0] + (to[0] - from[0]) * p.tone;
        const cg = from[1] + (to[1] - from[1]) * p.tone;
        const cb = from[2] + (to[2] - from[2]) * p.tone;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${cr | 0}, ${cg | 0}, ${cb | 0}, ${alpha.toFixed(3)})`;
        ctx.arc(screenX, screenY, dot, 0, TWO_PI);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
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
