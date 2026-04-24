import { clampPercent } from '@/lib/ui-state';

type ProgressMeterProps = {
  percent: number;
  label?: string;
  valueLabel?: string;
  ariaLabel?: string;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
};

export function ProgressMeter({
  percent,
  label,
  valueLabel,
  ariaLabel,
  className = '',
  trackClassName = 'bg-gray-100 dark:bg-gray-900/70',
  fillClassName = 'bg-blue-600 dark:bg-blue-400',
}: ProgressMeterProps) {
  const safePercent = clampPercent(percent);

  return (
    <div className={className}>
      {(label || valueLabel) && (
        <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
          {label && (
            <span className="min-w-0 truncate text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
              {label}
            </span>
          )}
          {valueLabel && (
            <span className="shrink-0 text-[11px] font-black text-blue-600 dark:text-blue-400">
              {valueLabel}
            </span>
          )}
        </div>
      )}
      <div
        className={`h-2 overflow-hidden rounded-full ${trackClassName}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safePercent}
        aria-label={ariaLabel ?? label}
      >
        <div
          className={`h-full rounded-full transition-all ${fillClassName}`}
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}
