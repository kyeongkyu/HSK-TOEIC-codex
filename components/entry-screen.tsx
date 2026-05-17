'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Briefcase, ChevronRight, Languages } from 'lucide-react';

type AppStartTarget = 'hsk' | 'toeic' | 'jlpt';

type EntryOption = {
  id: AppStartTarget;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  accentClass: string;
};

const options: EntryOption[] = [
  {
    id: 'hsk',
    title: 'HSK',
    subtitle: 'Chinese Vocabulary',
    description: 'HSK 1~6 단어, 문장, 듣기, 문법을 단계적으로 학습하세요.',
    icon: <BookOpen size={24} />,
    accentClass: 'bg-blue-500 text-white shadow-blue-500/25',
  },
  {
    id: 'toeic',
    title: 'TOEIC',
    subtitle: 'English Practice',
    description: 'TOEIC 단어와 Part 2, Part 5 문제를 실전 흐름으로 연습하세요.',
    icon: <Briefcase size={24} />,
    accentClass: 'bg-slate-950 text-white shadow-slate-950/25',
  },
  {
    id: 'jlpt',
    title: 'JLPT',
    subtitle: 'Japanese N5',
    description: 'JLPT N5 단어부터 일본어 기초를 단단하게 시작하세요.',
    icon: <Languages size={24} />,
    accentClass: 'bg-indigo-600 text-white shadow-indigo-600/25',
  },
];

function drawEntryBackground(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let width = 0;
  let height = 0;
  let frameId = 0;
  let time = 0;

  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };

  const animate = () => {
    time += 0.008;
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    const gradients = [
      { x: 0.18 + Math.sin(time) * 0.05, y: 0.2, color: 'rgba(79, 70, 229, 0.34)' },
      { x: 0.84, y: 0.48 + Math.cos(time * 0.8) * 0.06, color: 'rgba(220, 38, 38, 0.2)' },
      { x: 0.5 + Math.sin(time * 0.6) * 0.04, y: 0.92, color: 'rgba(245, 158, 11, 0.18)' },
    ];

    gradients.forEach((spot) => {
      const radius = Math.max(width, height) * 0.45;
      const gradient = ctx.createRadialGradient(width * spot.x, height * spot.y, 0, width * spot.x, height * spot.y, radius);
      gradient.addColorStop(0, spot.color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 24; i += 1) {
      const y = (height / 24) * i + Math.sin(time + i) * 8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + Math.cos(time * 0.8 + i) * 18);
      ctx.stroke();
    }

    frameId = requestAnimationFrame(animate);
  };

  window.addEventListener('resize', resize);
  resize();
  animate();

  return () => {
    window.removeEventListener('resize', resize);
    cancelAnimationFrame(frameId);
  };
}

export function EntryScreen({ onStart }: { onStart: (target: AppStartTarget) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return drawEntryBackground(canvas);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex h-full w-full flex-col overflow-hidden bg-black text-white">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 block h-full w-full pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.25),rgba(0,0,0,0.72))]" />

      <main className="relative z-10 flex min-h-full flex-col justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mx-auto w-full max-w-sm"
        >
          <div className="mb-7 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-white/45">Choose Course</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Study Hub</h1>
            <p className="mx-auto mt-3 max-w-[280px] break-keep text-sm font-bold leading-relaxed text-white/62">
              학습할 시험을 선택하고 이어서 공부를 시작하세요.
            </p>
          </div>

          <div className="grid gap-3">
            {options.map((option, index) => (
              <motion.button
                key={option.id}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, delay: 0.08 + index * 0.06, ease: 'easeOut' }}
                onClick={() => onStart(option.id)}
                className="group flex w-full items-center gap-4 rounded-[1.5rem] border border-white/12 bg-white/[0.08] p-4 text-left shadow-2xl shadow-black/20 backdrop-blur-md transition-all hover:bg-white/[0.13] active:scale-[0.98]"
              >
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-xl ${option.accentClass}`}>
                  {option.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-white/45">{option.subtitle}</span>
                  <span className="mt-1 block text-2xl font-black tracking-tight text-white">{option.title}</span>
                  <span className="mt-1.5 block break-keep text-xs font-bold leading-relaxed text-white/58">
                    {option.description}
                  </span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-transform group-hover:translate-x-0.5">
                  <ChevronRight size={18} />
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
