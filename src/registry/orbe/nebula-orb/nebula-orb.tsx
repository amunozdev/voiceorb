'use client';

import dynamic from 'next/dynamic';
import { type OrbProps } from '../../lib/orb-state';

const NebulaScene = dynamic(() => import('./nebula-scene').then((m) => m.NebulaScene), {
  ssr: false,
});

export const NebulaOrb = ({
  state = 'idle',
  size = 180,
  speed = 1,
  colorFrom = '#8b5cf6',
  colorTo = '#22d3ee',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => (
  <div
    role="img"
    aria-label={label}
    className={className}
    style={{
      width: size,
      height: size,
      opacity: state === 'disabled' ? 0.5 : 1,
      filter: state === 'disabled' ? 'grayscale(0.85)' : undefined,
    }}
  >
    <NebulaScene state={state} speed={speed} colorFrom={colorFrom} colorTo={colorTo} levelRef={levelRef} />
  </div>
);
