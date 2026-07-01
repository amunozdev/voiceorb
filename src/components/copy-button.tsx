'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export const CopyButton = ({ value, label = 'Copy', className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={clsx(
        'rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent-foreground',
        className,
      )}
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
};
