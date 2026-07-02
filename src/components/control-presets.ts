export interface SpeedPreset {
  label: string;
  value: number;
}

export const SPEED_PRESETS: SpeedPreset[] = [
  { label: 'Slow', value: 0.5 },
  { label: 'Normal', value: 1 },
  { label: 'Fast', value: 1.5 },
  { label: 'Turbo', value: 2 },
];

export interface SizePreset {
  label: string;
  value: number;
}

const snap = (n: number): number => Math.min(240, Math.max(96, Math.round(n / 4) * 4));

export const sizePresetsForOrb = (defaultSize: number): SizePreset[] => [
  { label: 'SM', value: snap(defaultSize * 0.75) },
  { label: 'MD', value: snap(defaultSize) },
  { label: 'LG', value: snap(defaultSize * 1.25) },
];
