"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { grammarData } from "@/data/grammar";
import SegmentedSentence from "@/components/SegmentedSentence";

export default function GrammarPage() {
  const router = useRouter();
  const { selectedLevel, hanziFont } = useSettings();

  // Filter grammar points based on the selected level
  const filteredGrammar = useMemo(() => {
    return grammarData.filter((point) => {
      if (selectedLevel === "all") return true;
      return point.level === selectedLevel;
    });
  }, [selectedLevel]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2 text-black dark:text-white">
              <BookOpen className="w-5 h-5 text-blue-500" />
              문법 학습
              {selectedLevel !== "all" && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full ml-2">
                  HSK {selectedLevel}
                </span>
              )}
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 py-8">
        {filteredGrammar.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            해당 급수의 문법 데이터가 없습니다.
          </div>
        ) : (
          <div className="space-y-8">
            {filteredGrammar.map((point) => (
              <div
                key={point.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded">
                    HSK {point.level}
                  </span>
                  <h2 className="text-2xl font-bold text-black dark:text-white">
                    {point.title}
                  </h2>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
                  <p className="text-lg font-mono text-blue-800 dark:text-blue-400 font-medium">
                    {point.pattern}
                  </p>
                </div>

                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    설명
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {point.explanation}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                    예문 적용
                  </h3>
                  <div className="space-y-6">
                    {point.examples.map((example, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                      >
                        <div className="mb-3" style={{ fontFamily: `var(--font-${hanziFont.toLowerCase().replace(/ /g, '-')})` }}>
                          <SegmentedSentence sentence={example.chinese} />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {example.translation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
