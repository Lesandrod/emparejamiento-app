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
  const [phase, setPhase] = useState('intro'); // 'intro', 'clash', 'sparring', 'versus'
  const [screenShake, setScreenShake] = useState(false);
  const [flash, setFlash] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const blueGloveRef = useRef(null);
  const redGloveRef = useRef(null);
  const vsBadgeRef = useRef(null);
  const fightersBannerRef = useRef(null);

  // Spark Particle System on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];

    const createImpactSparks = (x, y) => {
      for (let i = 0; i < 45; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 12;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 4,
          alpha: 1,
          color: Math.random() > 0.5 ? '#f59e0b' : Math.random() > 0.5 ? '#38bdf8' : '#ef4444'
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravity
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

    // Trigger Timeline Sequence
    const timeline = gsap.timeline();

    // 1. Initial Bell Strike
    timeline.add(() => {
      playBoxingBell(2);
    }, 0.1);

    // 2. Gloves Charge in for the Big Clash
    timeline.to(
      blueGloveRef.current,
      {
        x: '35vw',
        rotation: 12,
        duration: 0.45,
        ease: 'power3.in',
        onStart: () => playWhoosh()
      },
      0.3
    );

    timeline.to(
      redGloveRef.current,
      {
        x: '-35vw',
        rotation: -12,
        duration: 0.45,
        ease: 'power3.in'
      },
      0.3
    );

    // 3. THE CLASH MOMENT!
    timeline.add(() => {
      setScreenShake(true);
      setFlash(true);
      playPunchImpact();
      createImpactSparks(canvas.width / 2, canvas.height * 0.42);
      setTimeout(() => setFlash(false), 200);
      setTimeout(() => setScreenShake(false), 500);
      setPhase('sparring');
    }, 0.75);

    // 4. Sparring Combination Flurry (Glove Exchanges)
    const flurry = gsap.timeline();
    // Blue Jab
    flurry.to(blueGloveRef.current, {
      x: '38vw',
      scale: 1.15,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        playWhoosh();
        createImpactSparks(canvas.width / 2 + 30, canvas.height * 0.42);
      }
    });
    // Red Counter Hook
    flurry.to(redGloveRef.current, {
      x: '-38vw',
      scale: 1.15,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        playPunchImpact();
        createImpactSparks(canvas.width / 2 - 30, canvas.height * 0.42);
      }
    });
    // Double Impact
    flurry.to([blueGloveRef.current, redGloveRef.current], {
      scale: 1.25,
      duration: 0.12,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        playPunchImpact();
        createImpactSparks(canvas.width / 2, canvas.height * 0.42);
      }
    });

    timeline.add(flurry, 0.85);

    // 5. Final Separation & VS Badge Entrance
    timeline.to(
      [blueGloveRef.current, redGloveRef.current],
      {
        scale: 0.9,
        duration: 0.35,
        ease: 'power2.out'
      },
      1.5
    );

    timeline.fromTo(
      vsBadgeRef.current,
      { scale: 3, opacity: 0, rotationZ: -20 },
      {
        scale: 1,
        opacity: 1,
        rotationZ: 0,
        duration: 0.4,
        ease: 'back.out(2)',
        onStart: () => {
          setScreenShake(true);
          playPunchImpact();
          playBoxingBell(3);
          createImpactSparks(canvas.width / 2, canvas.height * 0.45);
          setTimeout(() => setScreenShake(false), 400);
        }
      },
      1.7
    );

    // 6. Fighters Banner Entrance & Confetti
    timeline.fromTo(
      fightersBannerRef.current,
      { y: 80, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
        onStart: () => {
          setPhase('versus');
          playArenaCheer();
          confetti({
            particleCount: 70,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#2563eb', '#dc2626', '#f59e0b', '#ffffff']
          });
        }
      },
      2.1
    );

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#050811]/95 backdrop-blur-lg select-none ${
        screenShake ? 'animate-screen-shake' : ''
      }`}
    >
      {/* Flash impact overlay */}
      {flash && (
        <div className="absolute inset-0 bg-white z-40 pointer-events-none animate-impact-flash" />
      )}

      {/* Atmospheric Arena Background */}
      <div
        className="absolute inset-0 opacity-25 bg-cover bg-center pointer-events-none filter contrast-125 brightness-75"
        style={{ backgroundImage: `url('/fight_arena.jpg')` }}
      />

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30"
      />

      {/* Arena Lighting Beams */}
      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-blue-600/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-red-600/15 via-transparent to-transparent pointer-events-none" />

      {/* Top Ropes & Header */}
      <div className="w-full relative z-20 pt-6 px-4 text-center boxing-ring-ropes">
        <div className="inline-block bg-black/80 border border-neutral-700 px-4 py-1 text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold mb-1 shadow-lg">
          🥊 FIGHT NIGHT • COMBATE #{pairNumber || '1'} 🥊
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white italic drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          ¡SPARRING MATCH CONFIRMADO!
        </h1>
      </div>

      {/* Central Fighting Stage with Gloves */}
      <div className="relative w-full flex-1 flex items-center justify-center my-2 z-20">
        {/* Left: Blue Boxing Glove */}
        <div
          ref={blueGloveRef}
          className="absolute -left-32 sm:-left-40 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 pointer-events-none filter drop-shadow-[0_0_30px_rgba(37,99,235,0.8)] will-change-transform"
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
          className="absolute -right-32 sm:-right-40 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 pointer-events-none filter drop-shadow-[0_0_30px_rgba(220,38,38,0.8)] will-change-transform"
        >
          <img
            src="/red_glove.png"
            alt="Guante Rojo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Center: Metallic 3D VERSUS Badge */}
        <div
          ref={vsBadgeRef}
          className="z-30 flex flex-col items-center justify-center opacity-0 pointer-events-none"
        >
          <div className="relative">
            <div className="w-24 sm:w-28 h-24 sm:h-28 rounded-full bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900 border-4 border-amber-300 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.9)]">
              <span className="text-3xl sm:text-4xl font-black italic tracking-tighter text-black drop-shadow">
                VS
              </span>
            </div>
          </div>
          <div className="bg-black/80 px-3 py-0.5 border border-amber-400/60 text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold mt-2">
            DUELO EN EL RING
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
          <div className="fight-card-blue p-4 sm:p-5 flex flex-col items-center text-center space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
            <span className="text-[10px] font-mono uppercase font-bold text-blue-400 tracking-wider">
              🔵 ESQUINA AZUL
            </span>

            {fighterBlue.photoUrl ? (
              <img
                src={fighterBlue.photoUrl}
                alt={fighterBlue.name}
                className="w-16 sm:w-20 h-16 sm:h-20 rounded-full object-cover border-2 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.6)]"
              />
            ) : (
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-blue-900 border-2 border-blue-400 text-blue-200 font-bold text-2xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.6)]">
                {fighterBlue.name.charAt(0)}
              </div>
            )}

            <div className="text-base sm:text-xl font-black uppercase tracking-tight text-white truncate w-full">
              {fighterBlue.name}
            </div>

            <div className="text-[10px] font-mono text-blue-300 uppercase tracking-widest bg-blue-950/80 px-2 py-0.5 border border-blue-800">
              Peleador 1
            </div>
          </div>

          {/* Red Corner Fighter */}
          <div className="fight-card-red p-4 sm:p-5 flex flex-col items-center text-center space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 shadow-[0_0_10px_#ef4444]" />
            <span className="text-[10px] font-mono uppercase font-bold text-red-400 tracking-wider">
              🔴 ESQUINA ROJA
            </span>

            {fighterRed.photoUrl ? (
              <img
                src={fighterRed.photoUrl}
                alt={fighterRed.name}
                className="w-16 sm:w-20 h-16 sm:h-20 rounded-full object-cover border-2 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.6)]"
              />
            ) : (
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-red-900 border-2 border-red-400 text-red-200 font-bold text-2xl flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.6)]">
                {fighterRed.name.charAt(0)}
              </div>
            )}

            <div className="text-base sm:text-xl font-black uppercase tracking-tight text-white truncate w-full">
              {fighterRed.name}
            </div>

            <div className="text-[10px] font-mono text-red-300 uppercase tracking-widest bg-red-950/80 px-2 py-0.5 border border-red-800">
              Peleador 2 (Rival)
            </div>
          </div>
        </div>

        {/* Action Button: Confirm & Return to Public Fight Card */}
        <div className="pt-4 max-w-sm mx-auto">
          <button
            type="button"
            onClick={onComplete}
            className="fight-btn-gold w-full h-12 text-xs font-black uppercase tracking-wider"
          >
            Ver en la Cartelera Oficial
          </button>
        </div>
      </div>
    </div>
  );
}
