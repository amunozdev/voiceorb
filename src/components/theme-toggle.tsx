'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';

const THEMES = ['system', 'light', 'dark'] as const;
type ThemeOption = (typeof THEMES)[number];

const LABEL: Record<ThemeOption, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

const GLYPH: Record<ThemeOption, string> = {
  system: '◐',
  light: '☀',
  dark: '☾',
};

const BASE_CLASS =
  'inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-panel text-sm text-foreground transition-colors hover:border-accent hover:text-accent-foreground';

const emptySubscribe = () => () => {};

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <button type="button" aria-label="Toggle theme" className={BASE_CLASS}>
        <span aria-hidden>◐</span>
      </button>
    );
  }

  const current = (THEMES.includes(theme as ThemeOption) ? theme : 'system') as ThemeOption;

  const cycle = () => setTheme(THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]);

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABEL[current]}. Click to switch theme`}
      title={`Theme: ${LABEL[current]}`}
      className={BASE_CLASS}
    >
      <span aria-hidden>{GLYPH[current]}</span>
    </button>
  );
};
