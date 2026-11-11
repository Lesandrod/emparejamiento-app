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
          color: Math.random() > 0.5 ? '#d4af37' : Math.random() > 0.5 ? '#38bdf8' : '#f87171'
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
        ctx.shadowBlur = 12;
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

    timeline.add(() => {
      setScreenShake(true);
      setFlash(true);
      playPunchImpact();
      createImpactSparks(canvas.width / 2, canvas.height * 0.42);
      setTimeout(() => setFlash(false), 160);
      setTimeout(() => setScreenShake(false), 450);
    }, 0.67);

    // Sparring Combination Flurry
    const flurry = gsap.timeline();
    flurry.to(blueGloveRef.current, {
      x: '37vw',
      scale: 1.14,
      duration: 0.09,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        playWhoosh();
        createImpactSparks(canvas.width / 2 + 25, canvas.height * 0.42);
      }
    });
    flurry.to(redGloveRef.current, {
      x: '-37vw',
      scale: 1.14,
      duration: 0.09,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        playPunchImpact();
        createImpactSparks(canvas.width / 2 - 25, canvas.height * 0.42);
      }
    });
    flurry.to([blueGloveRef.current, redGloveRef.current], {
      scale: 1.25,
      duration: 0.11,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        playPunchImpact();
        createImpactSparks(canvas.width / 2, canvas.height * 0.42);
      }
    });

    timeline.add(flurry, 0.77);

    // Separation & VS Badge Entrance
    timeline.to(
      [blueGloveRef.current, redGloveRef.current],
      {
        scale: 0.88,
        duration: 0.3,
        ease: 'power2.out'
      },
      1.4
    );

    timeline.fromTo(
      vsBadgeRef.current,
      { scale: 2.5, opacity: 0, rotationZ: -15 },
      {
        scale: 1,
        opacity: 1,
        rotationZ: 0,
        duration: 0.35,
        ease: 'back.out(2)',
        onStart: () => {
          setScreenShake(true);
          playPunchImpact();
          playBoxingBell(3);
          createImpactSparks(canvas.width / 2, canvas.height * 0.45);
          setTimeout(() => setScreenShake(false), 350);
        }
      },
      1.55
    );

    timeline.fromTo(
      fightersBannerRef.current,
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out',
        onStart: () => {
          playArenaCheer();
          confetti({
            particleCount: 65,
            spread: 85,
            origin: { y: 0.6 },
            colors: ['#38bdf8', '#f87171', '#d4af37', '#ffffff']
          });
        }
      },
      1.9
    );

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#090a0d]/95 backdrop-blur-md select-none ${
        screenShake ? 'animate-screen-shake' : ''
      }`}
    >
      {/* Flash impact overlay */}
      {flash && (
        <div className="absolute inset-0 bg-white z-40 pointer-events-none opacity-85" />
      )}

      {/* Atmospheric Arena Background with Gradient Glow */}
      <div
        className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none filter contrast-125 brightness-90"
        style={{ backgroundImage: `url('/fight_arena.jpg')` }}
      />
      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-[#38bdf8]/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-[#f87171]/15 via-transparent to-transparent pointer-events-none" />

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30"
      />

      {/* Top Header */}
      <div className="w-full relative z-20 pt-6 px-4 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full border border-cyan-400/50 bg-cyan-950/60 text-xs font-orbitron text-[#00f2fe] font-bold tracking-widest mb-2 shadow-[0_0_15px_rgba(0,242,254,0.4)] uppercase">
          COMBATE ESTELAR #{String(pairNumber || '1').padStart(2, '0')} • DUELO PACTADO
        </div>
        <h1 className="text-3xl sm:text-5xl font-orbitron font-black text-white tracking-tight uppercase drop-shadow-[0_0_25px_rgba(0,242,254,0.6)]">
          ¡COMBATE <span className="text-[#00f2fe]">OFICIAL</span> CONFIRMADO!
        </h1>
      </div>

      {/* Central Fighting Stage with Gloves */}
      <div className="relative w-full flex-1 flex items-center justify-center my-2 z-20">
        {/* Left: Blue Boxing Glove */}
        <div
          ref={blueGloveRef}
          className="absolute -left-32 sm:-left-40 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 pointer-events-none filter drop-shadow-[0_0_40px_rgba(0,242,254,0.8)] will-change-transform"
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
          className="absolute -right-32 sm:-right-40 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 pointer-events-none filter drop-shadow-[0_0_40px_rgba(255,42,95,0.8)] will-change-transform"
        >
          <img
            src="/red_glove.png"
            alt="Guante Rojo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Center: Gold VS Badge (Stitch Design) */}
        <div
          ref={vsBadgeRef}
          className="z-30 flex flex-col items-center justify-center opacity-0 pointer-events-none"
        >
          <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-2xl bg-gradient-to-br from-[#18233a] via-[#0d1422] to-[#060a12] border-2 border-[#00f2fe] flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,242,254,0.8)]">
            <span className="font-orbitron font-black text-2xl sm:text-3xl text-[#00f2fe] tracking-wider">
              VS
            </span>
            <span className="text-[8px] font-orbitron font-bold text-cyan-300 uppercase tracking-widest">
              OCTAGON
            </span>
          </div>
          <div className="bg-[#0b101c] px-3.5 py-1 rounded-full border border-cyan-400/40 text-[10px] font-orbitron font-bold text-[#00f2fe] mt-2 shadow-[0_0_10px_rgba(0,242,254,0.3)]">
            UFC 305 MATCHMAKER
          </div>
        </div>
      </div>

      {/* Bottom: Fighter Comparison Cards */}
      <div
        ref={fightersBannerRef}
        className="w-full max-w-4xl px-4 pb-8 z-30 opacity-0"
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-6 items-stretch">
          {/* Blue Corner Fighter */}
          <div className="bg-gradient-to-br from-[#0e1628]/95 to-[#070b16]/95 border-2 border-cyan-400 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center space-y-2 shadow-[0_0_25px_rgba(0,242,254,0.35)]">
            <span className="text-[10px] font-orbitron font-bold text-[#00f2fe] tracking-wider uppercase">
              Esquina Azul
            </span>

            {fighterBlue.photoUrl ? (
              <img
                src={fighterBlue.photoUrl}
                alt={fighterBlue.name}
                className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl object-cover border-2 border-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.6)]"
              />
            ) : (
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-cyan-950 border-2 border-[#00f2fe] text-[#00f2fe] font-orbitron font-black text-2xl flex items-center justify-center">
                {fighterBlue.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            <div className="text-base sm:text-2xl font-orbitron font-black text-white truncate w-full uppercase">
              {fighterBlue.name}
            </div>

            <div className="text-[10px] font-mono text-cyan-300 tracking-wider">
              74.8 kg • Contendiente
            </div>
          </div>

          {/* Red Corner Fighter */}
          <div className="bg-gradient-to-bl from-[#240e18]/95 to-[#0e070c]/95 border-2 border-[#ff2a5f] rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center space-y-2 shadow-[0_0_25px_rgba(255,42,95,0.35)]">
            <span className="text-[10px] font-orbitron font-bold text-[#ff2a5f] tracking-wider uppercase">
              Esquina Roja
            </span>

            {fighterRed.photoUrl ? (
              <img
                src={fighterRed.photoUrl}
                alt={fighterRed.name}
                className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl object-cover border-2 border-[#ff2a5f] shadow-[0_0_15px_rgba(255,42,95,0.6)]"
              />
            ) : (
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-red-950 border-2 border-[#ff2a5f] text-[#ff2a5f] font-orbitron font-black text-2xl flex items-center justify-center">
                {fighterRed.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            <div className="text-base sm:text-2xl font-orbitron font-black text-white truncate w-full uppercase">
              {fighterRed.name}
            </div>

            <div className="text-[10px] font-mono text-red-300 tracking-wider">
              75.1 kg • Contendiente
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 max-w-sm mx-auto">
          <button
            type="button"
            onClick={onComplete}
            className="neo-button-cyan w-full h-12 rounded-xl font-orbitron font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
            <span>VER EN CARTELERA OFICIAL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
