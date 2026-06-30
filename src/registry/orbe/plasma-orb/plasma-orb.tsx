'use client';

import { useEffect, useState } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';
import { type OrbProps, type OrbState } from '../../lib/orb-state';

const speedFor = (s: OrbState) =>
  s === 'listening' ? 1.6 : s === 'speaking' ? 1.1 : s === 'thinking' ? 0.95 : s === 'connecting' ? 0.5 : 0.3;

export const PlasmaOrb = ({
  state = 'idle',
  size = 160,
  speed = 1,
  colorFrom = '#7c3aed',
  colorTo = '#06b6d4',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!levelRef) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let last = 0;
    let smoothed = 0;
    const frame = (now: number) => {
      const live = levelRef.current;
      smoothed += ((typeof live === 'number' && live >= 0 ? live : 0) - smoothed) * 0.12;
      if (now - last > 60) {
        last = now;
        setLevel(smoothed);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [levelRef]);

  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from = state === 'error' ? '#fb7185' : colorFrom;
  const to = state === 'error' ? '#f43f5e' : colorTo;
  const baseSpeed = state === 'disabled' || reduced ? 0 : speedFor(state) * speed;
  const distortion = Math.min(1, 0.45 + level * 0.5 + (state === 'thinking' ? 0.15 : 0));
  const swirl = Math.min(1, 0.3 + level * 0.4);

  return (
    <div
      role="img"
      aria-label={label}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `inset 0 0 ${size * 0.3}px rgba(0,0,0,0.55), 0 8px 32px color-mix(in oklab, ${from}, transparent 60%)`,
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : undefined,
        transform: `scale(${1 + level * 0.05})`,
        transition: 'transform 0.12s linear',
      }}
    >
      <MeshGradient
        width={size}
        height={size}
        colors={[from, to, '#0b0e17', '#e9d5ff']}
        distortion={distortion}
        swirl={swirl}
        speed={baseSpeed}
        grainMixer={0.15}
      />
    </div>
  );
};
