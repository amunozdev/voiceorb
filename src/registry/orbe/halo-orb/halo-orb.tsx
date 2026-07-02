'use client';

import { useEffect, useRef } from 'react';
import { approach, orbVars, stateEnergy, type OrbProps } from '../../lib/orb-state';
import styles from './halo-orb.module.css';

export const HaloOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#818cf8',
  colorTo = '#f472b6',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const liveRef = useRef(levelRef);

  useEffect(() => {
    stateRef.current = state;
    liveRef.current = levelRef;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--orb-level', '0');
      return;
    }

    let raf = 0;
    let last: number | null = null;
    let level = 0;

    const frame = (now: number) => {
      if (last === null) last = now;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const live = liveRef.current?.current;
      const target =
        typeof live === 'number' && live >= 0 ? live : stateEnergy(stateRef.current, now / 1000);
      level = approach(level, target, 7.5, dt);
      el.style.setProperty('--orb-level', level.toFixed(3));
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-state={state}
      className={[styles.orb, className].filter(Boolean).join(' ')}
      style={orbVars({ size, speed, colorFrom, colorTo })}
    >
      <span className={styles.glow} />
      <span className={`${styles.halo} ${styles.haloB}`} />
      <span className={`${styles.halo} ${styles.haloA}`} />
      <span className={styles.disc} />
      <span className={styles.core} />
      <span className={`${styles.orbit} ${styles.orbitA}`} />
      <span className={`${styles.orbit} ${styles.orbitB}`} />
      <span className={styles.sparks} />
    </div>
  );
};
