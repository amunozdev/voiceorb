'use client';

import { useEffect, useId, useRef } from 'react';
import { orbVars, stateEnergy, type OrbProps } from '../../lib/orb-state';

export const GooeyOrb = ({
  state = 'idle',
  size = 160,
  speed = 1,
  colorFrom = '#f472b6',
  colorTo = '#8b5cf6',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const rawId = useId().replace(/:/g, '');
  const filterId = `gooey-${rawId}`;
  const gradId = `gooey-grad-${rawId}`;
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const blobRef = useRef<SVGCircleElement>(null);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = speed;
  });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dispRef.current?.setAttribute('scale', '5');
      return;
    }

    let raf = 0;
    let start: number | null = null;
    let smoothed = 0;

    const frame = (now: number) => {
      if (start === null) start = now;
      const t = ((now - start) / 1000) * speedRef.current;
      const live = levelRef?.current;
      const hasLive = typeof live === 'number' && live >= 0;
      const target = hasLive ? live : stateEnergy(stateRef.current, t);
      smoothed += (target - smoothed) * 0.1;

      const agitated = stateRef.current === 'thinking' || stateRef.current === 'connecting';
      const freq = 0.008 + 0.02 * smoothed + (agitated ? 0.012 : 0);
      const scale = 8 + 34 * smoothed;

      turbRef.current?.setAttribute('baseFrequency', `${freq.toFixed(4)} ${(freq * 1.3).toFixed(4)}`);
      turbRef.current?.setAttribute('seed', String(Math.floor(t * 4) % 100));
      dispRef.current?.setAttribute('scale', scale.toFixed(1));
      blobRef.current?.setAttribute('r', (34 + 6 * smoothed).toFixed(1));

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [levelRef]);

  const from = state === 'error' ? '#fb7185' : colorFrom;
  const to = state === 'error' ? '#f43f5e' : colorTo;

  return (
    <div
      role="img"
      aria-label={label}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : undefined,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <radialGradient id={gradId} cx="38%" cy="32%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="35%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </radialGradient>
          <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.01 0.013"
              numOctaves="2"
              seed="2"
              result="noise"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="noise"
              scale="14"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`}>
          <circle ref={blobRef} cx="50" cy="50" r="34" fill={`url(#${gradId})`} />
        </g>
      </svg>
    </div>
  );
};
