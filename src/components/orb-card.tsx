'use client';

import { useEffect, useRef, useState } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import clsx from 'clsx';
import { ORB_STATES, type OrbState } from '@/registry/lib/orb-state';
import { useAudioLevel } from '@/registry/lib/use-audio-level';
import type { FileWithCode } from '@/registry/prompt';
import { OrbPreview } from './orb-preview';
import { CodeBlock } from './code-block';
import { CopyButton } from './copy-button';

export interface OrbCardData {
  id: string;
  name: string;
  tagline: string;
  tech: string;
  dependencies: string[];
  defaultColorFrom: string;
  defaultColorTo: string;
  defaultSize: number;
  files: FileWithCode[];
  aiPrompt: string;
}

const STATE_LABEL: Record<OrbState, string> = {
  idle: 'idle',
  connecting: 'connecting',
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'speaking',
  error: 'error',
  disabled: 'disabled',
};

interface ColorFieldProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

const ColorField = ({ label, color, onChange }: ColorFieldProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${label} color`}
        className="h-7 w-9 rounded border border-border"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
      {open && (
        <div className="absolute bottom-full left-0 z-10 mb-2 flex w-44 flex-col gap-2 rounded-lg border border-border bg-panel p-2 shadow-lg">
          <HexColorPicker color={color} onChange={onChange} />
          <HexColorInput
            color={color}
            onChange={onChange}
            prefixed
            className="w-full rounded border border-border bg-transparent px-2 py-1 text-center font-mono text-xs text-foreground uppercase"
          />
        </div>
      )}
    </div>
  );
};

export const OrbCard = ({ orb }: { orb: OrbCardData }) => {
  const [state, setState] = useState<OrbState>('idle');
  const [mic, setMic] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [size, setSize] = useState(orb.defaultSize);
  const [colorFrom, setColorFrom] = useState(orb.defaultColorFrom);
  const [colorTo, setColorTo] = useState(orb.defaultColorTo);
  const [showCode, setShowCode] = useState(false);
  const levelRef = useAudioLevel(mic);

  const reactive = state === 'listening' || state === 'speaking';

  const toggleMic = () => {
    setMic((prev) => {
      const next = !prev;
      if (next && (state === 'idle' || state === 'connecting')) setState('listening');
      return next;
    });
  };

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-border bg-panel/60 p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{orb.name}</h2>
          <p className="mt-1 text-sm text-muted">{orb.tagline}</p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted">
          {orb.tech}
        </span>
      </header>

      <div className="grid min-h-64 place-items-center rounded-xl border border-border bg-[radial-gradient(circle_at_50%_30%,#11131f,#06070d)]">
        <OrbPreview
          id={orb.id}
          state={state}
          size={size}
          speed={speed}
          colorFrom={colorFrom}
          colorTo={colorTo}
          levelRef={reactive ? levelRef : undefined}
          label={orb.name}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {ORB_STATES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState(s)}
            className={clsx(
              'rounded-md px-2.5 py-1 text-xs transition-colors',
              state === s
                ? 'bg-accent/15 text-accent-foreground'
                : 'text-muted hover:text-foreground',
            )}
          >
            {STATE_LABEL[s]}
          </button>
        ))}
        <button
          type="button"
          onClick={toggleMic}
          title="React to your microphone in listening/speaking states"
          className={clsx(
            'ml-auto rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            mic ? 'bg-accent/15 text-accent-foreground' : 'text-muted hover:text-foreground',
          )}
        >
          {mic ? '● Mic on' : 'Mic off'}
        </button>
      </div>

      <div className="grid grid-cols-2 items-center gap-x-5 gap-y-4 text-xs text-muted">
        <label className="flex flex-col gap-1.5">
          <span>Speed · {speed.toFixed(2)}×</span>
          <input
            type="range"
            min={0.25}
            max={3}
            step={0.05}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="accent-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span>Size · {size}px</span>
          <input
            type="range"
            min={96}
            max={240}
            step={4}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="accent-accent"
          />
        </label>
        <ColorField label="From" color={colorFrom} onChange={setColorFrom} />
        <ColorField label="To" color={colorTo} onChange={setColorTo} />
      </div>

      <footer className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={orb.aiPrompt} label="Copy AI prompt" />
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent-foreground"
          >
            {showCode ? 'Hide code' : 'View code'}
          </button>
          {orb.dependencies.length > 0 && (
            <p className="ml-auto truncate font-mono text-[11px] text-muted">npm i {orb.dependencies.join(' ')}</p>
          )}
        </div>
        {showCode && <CodeBlock files={orb.files} />}
      </footer>
    </article>
  );
};
