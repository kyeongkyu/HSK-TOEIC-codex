'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const SimplexNoise = (function() {
    const grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    const p = new Uint8Array(256);
    for (let i=0; i<256; i++) p[i] = i;
    for (let i=255; i>0; i--) {
        const r = Math.floor(Math.random() * (i + 1));
        const temp = p[i];
        p[i] = p[r];
        p[r] = temp;
    }
    const perm = new Uint8Array(512);
    const gradP = new Int8Array(512 * 3);
    for (let i=0; i<512; i++) {
        perm[i] = p[i & 255];
        gradP[i*3] = grad3[perm[i] % 12][0];
        gradP[i*3+1] = grad3[perm[i] % 12][1];
        gradP[i*3+2] = grad3[perm[i] % 12][2];
    }
    const F3 = 1 / 3;
    const G3 = 1 / 6;
    return {
        noise3D: function(xin: number, yin: number, zin: number) {
            let n0, n1, n2, n3;
            const s = (xin + yin + zin) * F3;
            let i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
            const t = (i + j + k) * G3;
            const x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);
            let i1, j1, k1, i2, j2, k2;
            if (x0 >= y0) {
                if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
                else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
                else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
            } else {
                if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
                else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
                else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
            }
            const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
            const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
            const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
            const ii = i & 255, jj = j & 255, kk = k & 255;
            let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
            if (t0 < 0) n0 = 0; else {
                t0 *= t0;
                const gi = (perm[ii + perm[jj + perm[kk]]] % 12) * 3;
                n0 = t0 * t0 * (gradP[gi]*x0 + gradP[gi+1]*y0 + gradP[gi+2]*z0);
            }
            let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
            if (t1 < 0) n1 = 0; else {
                t1 *= t1;
                const gi = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12) * 3;
                n1 = t1 * t1 * (gradP[gi]*x1 + gradP[gi+1]*y1 + gradP[gi+2]*z1);
            }
            let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
            if (t2 < 0) n2 = 0; else {
                t2 *= t2;
                const gi = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12) * 3;
                n2 = t2 * t2 * (gradP[gi]*x2 + gradP[gi+1]*y2 + gradP[gi+2]*z2);
            }
            let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
            if (t3 < 0) n3 = 0; else {
                t3 *= t3;
                const gi = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12) * 3;
                n3 = t3 * t3 * (gradP[gi]*x3 + gradP[gi+1]*y3 + gradP[gi+2]*z3);
            }
            return 32 * (n0 + n1 + n2 + n3);
        }
    };
})();

export function EntryScreen({ onStart }: { onStart: (target: 'hsk' | 'toeic') => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tab, setTab] = useState<'hsk' | 'toeic'>('hsk');
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width: number, height: number;
        let animationFrameId: number;
        let time = 0;

        const config = {
            lineCount: 80, 
            noiseScaleX: 0.002,
            noiseScaleY: 0.004,
            noiseSpeed: 0.0005,
            amplitude: 100,
            colors: [
                { r: 147, g: 51, b: 234 },
                { r: 59, g: 130, b: 246 },
                { r: 34, g: 211, b: 238 }
            ]
        };

        function resize() {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        function interpolateColor(factor: number) {
            const colors = config.colors;
            if (factor <= 0) return `rgb(${colors[0].r}, ${colors[0].g}, ${colors[0].b})`;
            if (factor >= 1) return `rgb(${colors[2].r}, ${colors[2].g}, ${colors[2].b})`;
            let c1, c2, localFactor;
            if (factor < 0.5) { c1 = colors[0]; c2 = colors[1]; localFactor = factor * 2; }
            else { c1 = colors[1]; c2 = colors[2]; localFactor = (factor - 0.5) * 2; }
            const r = Math.round(c1.r + (c2.r - c1.r) * localFactor);
            const g = Math.round(c1.g + (c2.g - c1.g) * localFactor);
            const b = Math.round(c1.b + (c2.b - c1.b) * localFactor);
            return `rgb(${r}, ${g}, ${b})`;
        }

        function animate() {
            if (!ctx) return;
            time += config.noiseSpeed;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
            const spacing = height / (config.lineCount + 1);
            const xStep = 15;
            const autoShiftX = Math.sin(time * 0.4) * 1.5;
            const autoShiftY = Math.cos(time * 0.3) * 1.5;

            for (let i = 1; i <= config.lineCount; i++) {
                const baseY = i * spacing;
                const progress = i / config.lineCount;
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.strokeStyle = interpolateColor(progress);
                ctx.globalAlpha = 0.4 + Math.sin(progress * Math.PI) * 0.3;
                for (let x = 0; x <= width + xStep; x += xStep) {
                    const noiseVal = SimplexNoise.noise3D(
                        x * config.noiseScaleX + autoShiftX, 
                        baseY * config.noiseScaleY + autoShiftY, 
                        time + (i * 0.015)
                    );
                    const yOffset = noiseVal * config.amplitude;
                    if (x === 0) ctx.moveTo(x, baseY + yOffset);
                    else ctx.lineTo(x, baseY + yOffset);
                }
                ctx.stroke();
            }
            animationFrameId = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize);
        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const handleTabSwitch = (newTab: 'hsk' | 'toeic') => {
        setTab(newTab);
        setAnimationKey(prev => prev + 1);
    };

    const handleStart = () => {
        if (tab === 'hsk') {
            onStart('hsk');
        } else {
            onStart('toeic');
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-black text-white font-sans overflow-hidden z-[100] flex flex-col justify-between">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 block pointer-events-none" />

            <div className="relative z-10 w-full h-full flex flex-col" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.6) 100%)' }}>
                <header className="pt-[60px] px-5 pb-5 text-center">
                    <div className="flex bg-white/10 backdrop-blur-md border border-white/20 rounded-[30px] p-[5px] mx-auto max-w-[300px] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                        <button 
                            className={`flex-1 py-3 border-none bg-transparent text-[16px] font-semibold cursor-pointer rounded-[25px] transition-all duration-300 ${tab === 'hsk' ? 'bg-white text-black shadow-[0_4px_12px_rgba(0,0,0,0.2)]' : 'text-white/60 hover:text-white/80'}`}
                            onClick={() => handleTabSwitch('hsk')}
                        >
                            HSK
                        </button>
                        <button 
                            className={`flex-1 py-3 border-none bg-transparent text-[16px] font-semibold cursor-pointer rounded-[25px] transition-all duration-300 ${tab === 'toeic' ? 'bg-white text-black shadow-[0_4px_12px_rgba(0,0,0,0.2)]' : 'text-white/60 hover:text-white/80'}`}
                            onClick={() => handleTabSwitch('toeic')}
                        >
                            TOEIC
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-5 flex flex-col items-center justify-start">
                    <div key={animationKey} style={{ animation: 'slideUp 0.6s ease-out' }} className="w-full max-w-[340px] bg-white/10 backdrop-blur-[15px] border border-white/20 rounded-[24px] p-[30px] mb-5">
                        {tab === 'hsk' ? (
                            <>
                                <h1 className="text-[32px] font-extrabold m-0 mb-3 text-center">HSK 2.0</h1>
                                <p className="text-[14px] opacity-80 text-center leading-relaxed break-keep">
                                    기존 HSK 1~6급 체계의 핵심 단어들을<br />
                                    SRS 암기 알고리즘으로 완벽하게 마스터하세요.
                                </p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center">
                                <h1 className="text-[32px] font-extrabold m-0 mb-3 text-center">TOEIC</h1>
                                <p className="text-[14px] opacity-80 text-center leading-relaxed break-keep">
                                    비즈니스 영어의 기초부터 실전까지,<br />
                                    곧 찾아올 토익 전용 학습 서비스입니다.
                                </p>
                            </div>
                        )}

                        <button 
                            onClick={handleStart}
                            className="mt-[30px] w-full p-[18px] rounded-[18px] border-none bg-white text-black text-[18px] font-bold cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            학습 시작하기
                        </button>
                    </div>
                </main>

                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}} />
            </div>
        </div>
    );
}
