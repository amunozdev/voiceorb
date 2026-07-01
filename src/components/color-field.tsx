'use client';

import { useEffect, useRef, useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorField = ({ label, value, onChange }: ColorFieldProps) => {
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
        onClick={() => setOpen((prev) => !prev)}
        aria-label={label}
        className="h-7 w-9 shrink-0 rounded border border-border"
        style={{ backgroundColor: value }}
      />
      <span>{label}</span>
      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-2 flex flex-col gap-2 rounded-lg border border-border bg-panel p-2 shadow-lg">
          <HexColorPicker color={value} onChange={onChange} />
          <HexColorInput
            color={value}
            onChange={onChange}
            prefixed
            className="w-full rounded border border-border bg-transparent px-2 py-1 text-center text-xs uppercase text-foreground"
          />
        </div>
      )}
    </div>
  );
};
