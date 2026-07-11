'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { StaticRadialGradient } from '@paper-design/shaders-react';
import {
  approach,
  ERROR_COLOR_FROM,
  ERROR_COLOR_TO,
  hexToRgb,
  orbVars,
  stateEnergy,
  type OrbProps,
  type OrbState,
} from '../../lib/orb-state';
import { observeActivity } from '../../lib/use-in-view';
import { useWebGLSupport } from '../../lib/use-webgl-support';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const subscribeReducedMotion = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );

const mixHex = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const channel = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(ar, br)}${channel(ag, bg)}${channel(ab, bb)}`;
};

const shade = (hex: string, t: number) => mixHex(hex, '#000000', t);
const tint = (hex: string, t: number) => mixHex(hex, '#ffffff', t);

const withAlpha = (hex: string, alpha: number) =>
  `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`;

const brandPalette = (from: string, to: string): string[] => [
  shade(to, 0.28),
  shade(to, 0.08),
  to,
  mixHex(to, from, 0.55),
  from,
  tint(from, 0.55),
  tint(from, 0.94),
];

const BLOOM_ALPHA = [0, 0.45, 0.92, 1, 1, 1, 1];
const TRANSPARENT = '#00000000';
const BLOOM_SCALE = 1.5;
const BLOOM_MASK =
  'radial-gradient(circle closest-side, #000 50%, rgba(0,0,0,0.72) 68%, rgba(0,0,0,0.26) 85%, transparent 100%)';

const ERROR_PALETTE = brandPalette(ERROR_COLOR_FROM, ERROR_COLOR_TO);

const GL_ATTRIBUTES: WebGLContextAttributes = {
  antialias: true,
  powerPreference: 'low-power',
};

const PUSH_INTERVAL_MS = 66;
const MAX_DT = 0.1;
const ENERGY_RATE = 7.5;
const SHAPE_RATE = 6;
const GRAIN_RATE = 6;
const ERROR_RATE = 6;
const ANGLE_RATE = 4;
const STATIC_PHASE = 0.9;
const STATIC_ANGLE = 215;

interface RadianceShape {
  radius: number;
  focalDistance: number;
  falloff: number;
  distortion: number;
}

const shapeFor = (s: OrbState, energy: number): RadianceShape => {
  switch (s) {
    case 'listening':
      return {
        radius: 1 + energy * 0.08,
        focalDistance: 0.22 + energy * 0.3,
        falloff: 0.08 + energy * 0.5,
        distortion: 0.05 + energy * 0.16,
      };
    case 'speaking':
      return {
        radius: 1.02 + energy * 0.1,
        focalDistance: 0.26 + energy * 0.34,
        falloff: 0.12 + energy * 0.55,
        distortion: 0.07 + energy * 0.2,
      };
    case 'thinking':
      return { radius: 1, focalDistance: 0.48, falloff: 0.22, distortion: 0.14 };
    case 'connecting':
      return {
        radius: 0.98,
        focalDistance: 0.12 + energy * 0.2,
        falloff: -0.12 + energy * 0.35,
        distortion: 0.04,
      };
    case 'error':
      return { radius: 1.06, focalDistance: 0.5, falloff: 0.5, distortion: 0.34 };
    case 'disabled':
      return { radius: 0.96, focalDistance: 0.1, falloff: -0.3, distortion: 0 };
    default:
      return { radius: 1, focalDistance: 0.2, falloff: 0.16, distortion: 0.03 };
  }
};

const grainFor = (s: OrbState) =>
  s === 'error'
    ? 0.14
    : s === 'speaking'
      ? 0.1
      : s === 'listening'
        ? 0.08
        : s === 'thinking'
          ? 0.06
          : s === 'connecting'
            ? 0.05
            : 0.03;

const angularVelFor = (s: OrbState, energy: number) =>
  s === 'thinking'
    ? 55
    : s === 'error'
      ? 90
      : s === 'listening' || s === 'speaking'
        ? 10 + energy * 22
        : s === 'connecting'
          ? 18
          : s === 'disabled'
            ? 0
            : 6;

interface RadianceMotion {
  energy: number;
  radius: number;
  focalDistance: number;
  focalAngle: number;
  falloff: number;
  distortion: number;
  grain: number;
  errorMix: number;
}

const motionSeed = (s: OrbState): RadianceMotion => ({
  energy: 0,
  ...shapeFor(s, 0),
  focalAngle: STATIC_ANGLE,
  grain: grainFor(s),
  errorMix: s === 'error' ? 1 : 0,
});

const quantize = (value: number, steps: number) => Math.round(value * steps) / steps;

const sameMotion = (a: RadianceMotion, b: RadianceMotion) =>
  a.energy === b.energy &&
  a.radius === b.radius &&
  a.focalDistance === b.focalDistance &&
  a.focalAngle === b.focalAngle &&
  a.falloff === b.falloff &&
  a.distortion === b.distortion &&
  a.grain === b.grain &&
  a.errorMix === b.errorMix;

export const RadianceOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#fb7185',
  colorTo = '#7c3aed',
  levelRef,
  label = 'Assistant orb',
  className,
  ref,
}: OrbProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);
  const angularVelRef = useRef(0);
  const reduced = useReducedMotion();
  const webgl = useWebGLSupport();
  const showShader = webgl === true;
  const [motion, setMotion] = useState<RadianceMotion>(() => motionSeed(state));
  const accRef = useRef<RadianceMotion | null>(null);

  const setRootRef = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = speed;
  });

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;
    if (accRef.current === null) {
      accRef.current = motionSeed(stateRef.current);
    }
    const acc = accRef.current;
    let raf = 0;
    let prev: number | null = null;
    let clock = 0;
    let lastPush = 0;
    let active = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(MAX_DT, prev === null ? 1 / 60 : (now - prev) / 1000);
      prev = now;
      const current = stateRef.current;
      const multiplier = speedRef.current;
      clock += dt * multiplier;
      const live = levelRef?.current;
      const hasLive = typeof live === 'number' && live >= 0;
      acc.energy = approach(
        acc.energy,
        hasLive ? live : stateEnergy(current, clock),
        ENERGY_RATE,
        dt,
      );
      const target = shapeFor(current, acc.energy);
      acc.radius = approach(acc.radius, target.radius, SHAPE_RATE, dt);
      acc.focalDistance = approach(acc.focalDistance, target.focalDistance, SHAPE_RATE, dt);
      acc.falloff = approach(acc.falloff, target.falloff, SHAPE_RATE, dt);
      acc.distortion = approach(acc.distortion, target.distortion, SHAPE_RATE, dt);
      angularVelRef.current = approach(
        angularVelRef.current,
        angularVelFor(current, acc.energy) * multiplier,
        ANGLE_RATE,
        dt,
      );
      acc.focalAngle = (acc.focalAngle + angularVelRef.current * dt + 360) % 360;
      acc.grain = approach(acc.grain, grainFor(current), GRAIN_RATE, dt);
      acc.errorMix = approach(acc.errorMix, current === 'error' ? 1 : 0, ERROR_RATE, dt);
      root.style.setProperty('--orb-level', acc.energy.toFixed(3));
      if (showShader && now - lastPush > PUSH_INTERVAL_MS) {
        lastPush = now;
        const next: RadianceMotion = {
          energy: quantize(acc.energy, 50),
          radius: quantize(acc.radius, 200),
          focalDistance: quantize(acc.focalDistance, 200),
          focalAngle: quantize(acc.focalAngle, 4),
          falloff: quantize(acc.falloff, 200),
          distortion: quantize(acc.distortion, 200),
          grain: quantize(acc.grain, 200),
          errorMix: quantize(acc.errorMix, 100),
        };
        setMotion((prevMotion) => (sameMotion(prevMotion, next) ? prevMotion : next));
      }
      if (active) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (raf === 0) {
        prev = null;
        raf = requestAnimationFrame(frame);
      }
    };
    const halt = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      prev = null;
    };
    const unobserve = observeActivity(root, (next) => {
      active = next;
      if (next) wake();
      else halt();
    });
    wake();
    return () => {
      halt();
      unobserve();
    };
  }, [levelRef, reduced, showShader]);

  useEffect(() => {
    if (state !== 'error' || reduced) return;
    const el = sphereRef.current;
    if (!el) return;
    const shake = el.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-1.5px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(-2px)' },
        { transform: 'translateX(1px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 340, easing: 'ease-out' },
    );
    return () => shake.cancel();
  }, [state, reduced]);

  const staticLevel = stateEnergy(state, STATIC_PHASE);
  const view: RadianceMotion = reduced
    ? {
        energy: staticLevel,
        ...shapeFor(state, staticLevel),
        focalAngle: STATIC_ANGLE,
        grain: grainFor(state),
        errorMix: state === 'error' ? 1 : 0,
      }
    : motion;
  const errorMix = showShader ? view.errorMix : state === 'error' ? 1 : 0;
  const from =
    errorMix >= 1
      ? ERROR_COLOR_FROM
      : errorMix <= 0
        ? colorFrom
        : mixHex(colorFrom, ERROR_COLOR_FROM, errorMix);
  const to =
    errorMix >= 1
      ? ERROR_COLOR_TO
      : errorMix <= 0
        ? colorTo
        : mixHex(colorTo, ERROR_COLOR_TO, errorMix);
  const brandColors = brandPalette(colorFrom, colorTo);
  const baseColors =
    errorMix >= 1
      ? ERROR_PALETTE
      : errorMix <= 0
        ? brandColors
        : brandColors.map((stop, index) => mixHex(stop, ERROR_PALETTE[index], errorMix));
  const colors = baseColors.map((stop, index) => withAlpha(stop, BLOOM_ALPHA[index]));
  const bloom = Math.round(size * BLOOM_SCALE);
  const pad = (bloom - size) / 2;
  const fallbackLayers = [
    { key: 'brand', from: colorFrom, to: colorTo, visible: state !== 'error' },
    { key: 'error', from: ERROR_COLOR_FROM, to: ERROR_COLOR_TO, visible: state === 'error' },
  ].map(({ key, from: f, to: t, visible }) => ({
    key,
    visible,
    base: `radial-gradient(circle at 50% 46%, ${tint(f, 0.94)}, ${tint(f, 0.55)} 12%, ${f} 26%, ${mixHex(t, f, 0.55)} 42%, ${t} 58%, ${withAlpha(t, 0.4)} 76%, ${withAlpha(shade(t, 0.28), 0)} 100%)`,
    glow: `radial-gradient(circle at 50% 46%, ${tint(f, 0.9)}, ${withAlpha(tint(f, 0.4), 0.65)} 20%, transparent 52%)`,
  }));

  return (
    <div
      ref={setRootRef}
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        ...(reduced ? ({ '--orb-level': staticLevel.toFixed(3) } as CSSProperties) : null),
        width: size,
        height: size,
        position: 'relative',
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : 'grayscale(0)',
        transform: showShader ? `scale(${(1 + view.energy * 0.06).toFixed(4)})` : undefined,
        scale: showShader ? undefined : 'calc(1 + var(--orb-level, 0) * 0.06)',
        transition: 'transform 0.2s ease-out, opacity 0.3s ease-out, filter 0.3s ease-out',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: -pad,
          backgroundImage: `radial-gradient(circle, ${withAlpha(from, 0.5)}, ${withAlpha(to, 0.26)} 42%, ${withAlpha(to, 0)} 72%)`,
          filter: `blur(${Math.round(size * 0.08)}px)`,
          opacity: showShader
            ? Math.min(1, 0.25 + view.energy * 0.6)
            : 'calc(0.25 + var(--orb-level, 0) * 0.6)',
          transform: showShader ? `scale(${(1 + view.energy * 0.08).toFixed(4)})` : undefined,
          scale: showShader ? undefined : 'calc(1 + var(--orb-level, 0) * 0.08)',
          transition: showShader ? 'opacity 0.2s ease-out, transform 0.2s ease-out' : undefined,
        }}
      />
      <div
        ref={sphereRef}
        style={{
          position: 'absolute',
          inset: -pad,
          maskImage: BLOOM_MASK,
          WebkitMaskImage: BLOOM_MASK,
        }}
      >
        {showShader ? (
          <StaticRadialGradient
            width={bloom}
            height={bloom}
            colorBack={TRANSPARENT}
            colors={colors}
            radius={view.radius}
            focalDistance={view.focalDistance}
            focalAngle={view.focalAngle}
            falloff={view.falloff}
            mixing={0.95}
            distortion={view.distortion}
            distortionShift={0.2}
            distortionFreq={9}
            grainMixer={view.grain}
            grainOverlay={0.04}
            speed={0}
            frame={0}
            fit="cover"
            scale={1}
            minPixelRatio={2}
            webGlContextAttributes={GL_ATTRIBUTES}
          />
        ) : (
          <div aria-hidden style={{ position: 'absolute', inset: 0 }}>
            {fallbackLayers.map((layer) => (
              <div
                key={layer.key}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: layer.base,
                  opacity: layer.visible ? 1 : 0,
                  transition: 'opacity 0.35s ease',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: layer.glow,
                    opacity: 'calc(0.25 + var(--orb-level, 0) * 0.75)',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
