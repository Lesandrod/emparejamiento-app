'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import {
  playBoxingBell,
  playPunchImpact,
  playWhoosh,
  playArenaCheer
} from '@/utils/audio';

export default function BoxingFightAnimation({
  fighterBlue,
  fighterRed,
  pairNumber,
  onComplete
}) {
  const [screenShake, setScreenShake] = useState(false);
  const [flash, setFlash] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const blueGloveRef = useRef(null);
  const redGloveRef = useRef(null);
  const vsBadgeRef = useRef(null);
  const fightersBannerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];

    const createImpactSparks = (x, y) => {
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 14;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 4,
          alpha: 1,
          color: Math.random() > 0.5 ? '#fecf52' : Math.random() > 0.5 ? '#38bdf8' : '#f87171'
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.alpha -= 0.025;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Trigger Sequence
    const timeline = gsap.timeline();

    timeline.add(() => {
      playBoxingBell(2);
    }, 0.1);

    timeline.to(
      blueGloveRef.current,
      {
        x: '34vw',
        rotation: 12,
        duration: 0.42,
        ease: 'power3.in',
        onStart: () => playWhoosh()
      },
      0.25
    );

    timeline.to(
      redGloveRef.current,
      {
        x: '-34vw',
        rotation: -12,
        duration: 0.42,
        ease: 'power3.in'
      },
      0.25
    );

    // FIRST CLASH
    timeline.add(() => {
      setScreenShake(true);
      setFlash(true);
      playPunchImpact(1.0);
      playArenaCheer();

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2 - 20;
      createImpactSparks(centerX, centerY);

      setTimeout(() => setFlash(false), 90);
      setTimeout(() => setScreenShake(false), 400);
    }, 0.67);

    // RECOIL
    timeline.to(
      blueGloveRef.current,
      {
        x: '18vw',
        rotation: -8,
        duration: 0.16,
        ease: 'power1.out'
      },
      0.7
    );

    timeline.to(
      redGloveRef.current,
      {
        x: '-18vw',
        rotation: 8,
        duration: 0.16,
        ease: 'power1.out'
      },
      0.7
    );

    // FLURRY EXCHANGE 1
    timeline.to(
      blueGloveRef.current,
      {
        x: '36vw',
        y: '-=30',
        rotation: 16,
        duration: 0.16,
        ease: 'power2.in',
        onStart: () => {
          playPunchImpact(0.8);
          createImpactSparks(window.innerWidth / 2 + 20, window.innerHeight / 2 - 40);
        }
      },
      0.9
    );

    // FLURRY EXCHANGE 2
    timeline.to(
      redGloveRef.current,
      {
        x: '-36vw',
        y: '+=25',
        rotation: -16,
        duration: 0.16,
        ease: 'power2.in',
        onStart: () => {
          playPunchImpact(0.85);
          createImpactSparks(window.innerWidth / 2 - 20, window.innerHeight / 2 + 10);
        }
      },
      1.1
    );

    // FINAL SIMULTANEOUS KNOCKDOWN CLASH
    timeline.to(
      [blueGloveRef.current, redGloveRef.current],
      {
        x: (i) => (i === 0 ? '35vw' : '-35vw'),
        y: 0,
        rotation: (i) => (i === 0 ? 10 : -10),
        duration: 0.18,
        ease: 'power3.in',
        onComplete: () => {
          setScreenShake(true);
          playPunchImpact(1.2);
          playBoxingBell(1);

          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2 - 20;
          createImpactSparks(centerX, centerY);

          confetti({
            particleCount: 60,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#fecf52', '#38bdf8', '#f87171', '#ffffff']
          });

          setTimeout(() => setScreenShake(false), 400);
        }
      },
      1.32
    );

    // GLOVES RETRACT
    timeline.to(
      blueGloveRef.current,
      {
        x: '-10vw',
        opacity: 0.25,
        scale: 0.8,
        duration: 0.45,
        ease: 'power2.out'
      },
      1.6
    );

    timeline.to(
      redGloveRef.current,
      {
        x: '10vw',
        opacity: 0.25,
        scale: 0.8,
        duration: 0.45,
        ease: 'power2.out'
      },
      1.6
    );

    // REVEAL VS BADGE & FIGHTERS
    timeline.to(
      vsBadgeRef.current,
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'back.out(1.8)'
      },
      1.7
    );

    timeline.to(
      fightersBannerRef.current,
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'power2.out'
      },
      1.85
    );

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-surface-container-lowest/95 backdrop-blur-md select-none ${
        screenShake ? 'animate-screen-shake' : ''
      }`}
    >
      {/* Flash impact overlay */}
      {flash && (
        <div className="absolute inset-0 bg-white z-40 pointer-events-none opacity-85" />
      )}

      {/* Atmospheric Arena Background with Vignette */}
      <div
        className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none filter contrast-125 brightness-75"
        style={{ backgroundImage: `url('/fight_arena.jpg')` }}
      />
      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-blue-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-red-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30"
      />

      {/* Top Header (Google Stitch Style) */}
      <div className="w-full relative z-20 pt-6 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-outline-subtle bg-surface-container text-xs font-mono text-primary font-bold tracking-widest mb-2 shadow-sm uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>COMBATE ESTELAR #{String(pairNumber || '1').padStart(2, '0')} • DUELO CONFIRMADO</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight uppercase">
          ¡Combate <span className="text-primary">Oficial</span> Pactado!
        </h1>
      </div>

      {/* Central Fighting Stage with Boxing Gloves */}
      <div className="relative w-full flex-1 flex items-center justify-center my-2 z-20">
        {/* Left: Blue Boxing Glove */}
        <div
          ref={blueGloveRef}
          className="absolute -left-32 sm:-left-40 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 pointer-events-none filter drop-shadow-[0_10px_25px_rgba(56,189,248,0.4)] will-change-transform"
        >
          <img
            src="/blue_glove.png"
            alt="Guante Azul"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Right: Red Boxing Glove */}
        <div
          ref={redGloveRef}
          className="absolute -right-32 sm:-right-40 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 pointer-events-none filter drop-shadow-[0_10px_25px_rgba(248,113,113,0.4)] will-change-transform"
        >
          <img
            src="/red_glove.png"
            alt="Guante Rojo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Center: Gold VS Octagon Badge (Google Stitch Style) */}
        <div
          ref={vsBadgeRef}
          className="z-30 flex flex-col items-center justify-center opacity-0 pointer-events-none"
        >
          <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-2xl bg-surface-container border border-outline-subtle flex flex-col items-center justify-center shadow-2xl">
            <span className="font-display font-black text-2xl sm:text-3xl text-primary tracking-wider">
              VS
            </span>
            <span className="text-[8px] font-mono font-bold text-outline-subtle uppercase tracking-widest">
              OCTAGON
            </span>
          </div>
          <div className="bg-surface-dim px-3.5 py-1 rounded-full border border-outline-dim text-[10px] font-mono font-bold text-on-surface-variant mt-2 shadow-sm">
            TORNEO DEL PODER • MATCHMAKER
          </div>
        </div>
      </div>

      {/* Bottom: Fighter Comparison Cards (Matching Google Stitch Active Cards) */}
      <div
        ref={fightersBannerRef}
        className="w-full max-w-4xl px-4 pb-8 z-30 opacity-0"
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-6 items-stretch">
          {/* Blue Corner Fighter */}
          <div className="bg-surface-dim border border-blue-500/40 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center space-y-2 shadow-lg">
            <span className="text-[10px] font-mono font-bold text-blue-400 tracking-wider uppercase">
              Esquina Azul
            </span>

            {fighterBlue.photoUrl ? (
              <img
                src={fighterBlue.photoUrl}
                alt={fighterBlue.name}
                className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl object-cover border-2 border-blue-500 shadow-md"
              />
            ) : (
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-blue-950/60 border-2 border-blue-500 text-blue-400 font-display font-black text-2xl flex items-center justify-center">
                {fighterBlue.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            <div className="text-base sm:text-2xl font-display font-extrabold text-white truncate w-full uppercase">
              {fighterBlue.name}
            </div>

            <div className="text-[10px] font-mono text-on-surface-variant tracking-wider">
              74.8 kg • Contendiente Oficial
            </div>
          </div>

          {/* Red Corner Fighter */}
          <div className="bg-surface-dim border border-red-500/40 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center space-y-2 shadow-lg">
            <span className="text-[10px] font-mono font-bold text-red-400 tracking-wider uppercase">
              Esquina Roja
            </span>

            {fighterRed.photoUrl ? (
              <img
                src={fighterRed.photoUrl}
                alt={fighterRed.name}
                className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl object-cover border-2 border-red-500 shadow-md"
              />
            ) : (
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-red-950/60 border-2 border-red-500 text-red-400 font-display font-black text-2xl flex items-center justify-center">
                {fighterRed.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            <div className="text-base sm:text-2xl font-display font-extrabold text-white truncate w-full uppercase">
              {fighterRed.name}
            </div>

            <div className="text-[10px] font-mono text-on-surface-variant tracking-wider">
              75.1 kg • Contendiente Oficial
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 max-w-sm mx-auto">
          <button
            type="button"
            onClick={onComplete}
            className="w-full h-12 rounded-lg bg-primary hover:bg-yellow-400 text-black font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
            <span>REGISTRAR EN CARTELERA OFICIAL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
