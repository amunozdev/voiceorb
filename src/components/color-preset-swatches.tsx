'use client';

import clsx from 'clsx';
import { isSamePreset, type GradientPreset } from './color-presets';

interface ColorPresetSwatchesProps {
  presets: GradientPreset[];
  colorFrom: string;
  colorTo: string;
  onSelect: (from: string, to: string) => void;
}

export const ColorPresetSwatches = ({
  presets,
  colorFrom,
  colorTo,
  onSelect,
}: ColorPresetSwatchesProps) => (
  <div className="flex flex-col gap-1.5 sm:col-span-2">
    <span>Presets</span>
    <div role="group" aria-label="Color presets" className="flex flex-wrap items-center gap-1.5">
      {presets.map((preset) => {
        const active = isSamePreset(preset, colorFrom, colorTo);
        return (
          <button
            key={preset.name}
            type="button"
            onClick={() => onSelect(preset.from, preset.to)}
            aria-pressed={active}
            title={`${preset.name} · ${preset.from} → ${preset.to}`}
            className={clsx(
              'h-7 w-7 shrink-0 rounded-full border transition-transform hover:scale-110 focus-visible:scale-110',
              active ? 'border-accent ring-2 ring-accent/50' : 'border-border',
            )}
            style={{
              background: `linear-gradient(135deg in oklch, ${preset.from}, ${preset.to})`,
            }}
          >
            <span className="sr-only">{preset.name}</span>
          </button>
        );
      })}
    </div>
  </div>
);
