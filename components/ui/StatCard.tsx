type StatTone = 'blue' | 'green' | 'red' | 'gray';

type StatCardProps = {
  label: string;
  value: string | number;
  tone?: StatTone;
  className?: string;
};

const toneClass: Record<StatTone, string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-500',
  red: 'text-red-500',
  gray: 'text-gray-900 dark:text-white',
};

export function StatCard({ label, value, tone = 'gray', className = '' }: StatCardProps) {
  return (
    <div className={`min-w-0 rounded-xl bg-white p-3 dark:bg-gray-900/60 ${className}`}>
      <span className="block truncate text-[10px] font-black uppercase text-gray-400">
        {label}
      </span>
      <span className={`block min-w-0 break-keep leading-none text-[clamp(0.95rem,4.8vw,1.125rem)] font-black ${toneClass[tone]}`}>
        {value}
      </span>
    </div>
  );
}
