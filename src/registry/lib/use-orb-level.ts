'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { stateEnergy, type OrbState } from './orb-state';

export const useOrbLevel = (
  ref: RefObject<HTMLElement | null>,
  state: OrbState,
  levelRef?: RefObject<number>,
) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--orb-level', '0');
      return;
    }

    let raf = 0;
    let start: number | null = null;
    let smoothed = 0;

    const frame = (now: number) => {
      if (start === null) start = now;
      const t = (now - start) / 1000;
      const live = levelRef?.current;
      const hasLive = typeof live === 'number' && live >= 0;
      const target = hasLive ? live : stateEnergy(state, t);
      smoothed += (target - smoothed) * 0.12;
      el.style.setProperty('--orb-level', smoothed.toFixed(3));
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [ref, state, levelRef]);
};
