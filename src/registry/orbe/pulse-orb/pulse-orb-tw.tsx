'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

export const PulseOrbTw = ({
  state = 'idle',
  size = 160,
  speed = 1,
  colorFrom = '#818cf8',
  colorTo = '#22d3ee',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useOrbLevel(ref, state, levelRef);
  const showArc = state === 'connecting' || state === 'thinking';
  const showRings = state !== 'connecting' && state !== 'disabled';

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className={clsx('relative grid place-items-center isolate', className)}
      style={{ ...orbVars({ size, speed, colorFrom, colorTo }), width: size, height: size }}
    >
      <span
        className="absolute h-[70%] w-[70%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${colorFrom}, transparent 65%)`,
          opacity: 'calc(0.35 + 0.5 * var(--orb-level))',
          filter: 'blur(calc(8px + 22px * var(--orb-level)))',
        }}
      />
      {showRings &&
        [0, -1, -2].map((delay) => (
          <span
            key={delay}
            className="absolute h-[42%] w-[42%] rounded-full border-2 opacity-0 animate-orb-ring"
            style={{
              borderColor: `color-mix(in oklab, ${colorTo}, transparent 25%)`,
              animationDelay: `calc(${delay}s / var(--orb-speed))`,
            }}
          />
        ))}
      {showArc && (
        <span
          className="absolute h-[54%] w-[54%] rounded-full border-2 border-transparent animate-orb-spin"
          style={{ borderTopColor: colorTo, borderRightColor: `color-mix(in oklab, ${colorFrom}, transparent 40%)` }}
        />
      )}
      <span
        className="absolute h-[38%] w-[38%] rounded-full transition-transform duration-75"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${colorFrom}, ${colorTo})`,
          boxShadow: `0 0 calc(16px + 40px * var(--orb-level)) color-mix(in oklab, ${colorFrom}, transparent 45%)`,
          transform: 'scale(calc(1 + 0.2 * var(--orb-level)))',
        }}
      />
    </div>
  );
};
