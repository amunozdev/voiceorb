'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

export const GlassOrbTw = ({
  state = 'idle',
  size = 160,
  speed = 1,
  colorFrom = '#a78bfa',
  colorTo = '#38bdf8',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useOrbLevel(ref, state, levelRef);
  const showCounter = state === 'connecting' || state === 'thinking';

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className={clsx('relative grid place-items-center isolate', className)}
      style={{ ...orbVars({ size, speed, colorFrom, colorTo }), width: size, height: size }}
    >
      <span
        className="absolute h-full w-full rounded-full animate-orb-spin"
        style={{
          background: `conic-gradient(from 0deg, ${colorFrom}, ${colorTo}, color-mix(in oklab, ${colorFrom}, #fff 20%), ${colorFrom})`,
          filter: 'blur(calc(10px + 10px * var(--orb-level)))',
          opacity: 'calc(0.7 + 0.3 * var(--orb-level))',
          animationDuration: 'calc(8s / var(--orb-speed))',
        }}
      />
      {showCounter && (
        <span
          className="absolute h-[78%] w-[78%] rounded-full animate-orb-spin [animation-direction:reverse]"
          style={{
            background: `conic-gradient(from 180deg, transparent, color-mix(in oklab, ${colorTo}, transparent 30%), transparent)`,
            filter: 'blur(6px)',
            animationDuration: 'calc(5s / var(--orb-speed))',
          }}
        />
      )}
      <span
        className="absolute h-[80%] w-[80%] rounded-full border border-white/25 backdrop-blur-[6px] transition-transform duration-100"
        style={{
          background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), transparent 42%), radial-gradient(circle at 70% 75%, color-mix(in oklab, ${colorTo}, transparent 35%), transparent 55%), rgba(255,255,255,0.04)`,
          boxShadow: `inset 0 2px 12px rgba(255,255,255,0.35), inset 0 -10px 24px color-mix(in oklab, ${colorFrom}, transparent 60%), 0 8px 30px color-mix(in oklab, ${colorFrom}, transparent 55%)`,
          transform: 'scale(calc(1 + 0.05 * var(--orb-level)))',
        }}
      />
      <span
        className="absolute top-[22%] left-[26%] h-[18%] w-[26%] rounded-full blur-[2px]"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9), transparent 70%)' }}
      />
    </div>
  );
};
