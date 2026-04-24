'use client';
import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';
import { ArrowLeft, Zap, Shield, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

export default function QuizDifficultyPage() {
  const router = useRouter();
  const [quizMode, setQuizMode] = useState<'chapter' | 'topic'>('chapter');

  const difficulties = [
    {
      id: 'easy',
      title: '하 (Easy)',
      description: '한자, 병음, 뜻, TTS, 획순 애니메이션이 제공됩니다. (4지선다)',
      icon: <Zap className="text-green-500" size={32} />,
      color: 'border-green-100 bg-green-50 dark:bg-green-900/10 dark:border-green-900/30',
      hoverColor: 'hover:border-green-300 dark:hover:border-green-700'
    },
    {
      id: 'medium',
      title: '중 (Medium)',
      description: '한자, TTS, 획순 애니메이션이 제공됩니다. 병음과 뜻은 숨겨집니다. (4지선다)',
      icon: <Shield className="text-orange-500" size={32} />,
      color: 'border-orange-100 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-900/30',
      hoverColor: 'hover:border-orange-300 dark:hover:border-orange-700'
    },
    {
      id: 'hard',
      title: '상 (Hard)',
      description: '오직 한자만 표시됩니다. TTS와 힌트 없이 도전하세요! (4지선다)',
      icon: <Trophy className="text-red-500" size={32} />,
      color: 'border-red-100 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30',
      hoverColor: 'hover:border-red-300 dark:hover:border-red-700'
    }
  ];

  return (
    <div className="px-6 min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <header className="pt-8 mb-10">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => startTransition(() => router.push('/'))}
            className="p-3 -ml-3 text-black dark:text-white bg-gray-100 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setQuizMode('chapter')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${quizMode === 'chapter' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Chapter
            </button>
            <button
              onClick={() => setQuizMode('topic')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${quizMode === 'topic' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Topic
            </button>
          </div>
        </div>
        <h1 className="text-4xl font-black text-black dark:text-white">Quiz<br/>Difficulty</h1>
      </header>

      <div className="space-y-6 max-w-md mx-auto pb-12">
        {difficulties.map((diff, idx) => (
          <motion.button
            key={diff.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => startTransition(() => router.push(`/quiz/${diff.id}?mode=${quizMode}`))}
            className={`w-full p-6 text-left rounded-3xl border-2 transition-all active:scale-95 group relative overflow-hidden ${diff.color} ${diff.hoverColor}`}
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              {diff.icon}
            </div>
            
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  {diff.icon}
                </div>
                <h2 className="text-xl font-bold text-black dark:text-white">{diff.title}</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed font-medium">
                {diff.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
