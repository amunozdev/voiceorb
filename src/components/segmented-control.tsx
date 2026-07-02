import clsx from 'clsx';

interface SegmentOption {
  label: string;
  value: number;
}

export const SegmentedControl = ({
  label,
  options,
  value,
  onChange,
  format,
}: {
  label: string;
  options: SegmentOption[];
  value: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) => (
  <div
    role="group"
    aria-label={label}
    className="flex w-fit flex-wrap items-center gap-0.5 rounded-md border border-border bg-panel p-0.5"
  >
    {options.map((option) => {
      const active = value === option.value;
      return (
        <button
          key={option.label}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={active}
          title={format ? format(option.value) : undefined}
          className={clsx(
            'rounded px-2 py-1 text-xs font-medium transition-colors',
            active ? 'bg-accent/15 text-accent-foreground' : 'text-muted hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
