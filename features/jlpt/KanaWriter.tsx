'use client';

type KanaWriterProps = {
  kana: string;
  romaji: string;
};

export function KanaWriter({ kana, romaji }: KanaWriterProps) {
  return (
    <div className="rounded-[1.75rem] border border-indigo-100 bg-indigo-50/70 p-4 shadow-inner dark:border-indigo-900/50 dark:bg-indigo-950/30">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-700 dark:text-indigo-300">Kana Writer</span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-indigo-700 shadow-sm dark:bg-gray-950 dark:text-indigo-300">{romaji}</span>
      </div>
      <div className="relative mx-auto flex aspect-square max-w-[15rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-indigo-200 bg-white dark:border-indigo-900 dark:bg-black">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <span className="border-r border-b border-indigo-100 dark:border-indigo-950" />
          <span className="border-b border-indigo-100 dark:border-indigo-950" />
          <span className="border-r border-indigo-100 dark:border-indigo-950" />
          <span />
        </div>
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-indigo-100 dark:bg-indigo-950" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-indigo-100 dark:bg-indigo-950" />
        <span className="relative select-none text-[8rem] font-black leading-none text-black dark:text-white">{kana}</span>
      </div>
      <p className="mt-3 text-center text-xs font-bold leading-relaxed text-gray-500 dark:text-gray-400">
        글자의 균형과 위치를 격자에 맞춰 확인하세요.
      </p>
    </div>
  );
}
