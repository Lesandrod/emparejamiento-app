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
          size: 2 + Math.random() * 3,
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
        ctx.shadowBlur = 8;
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

    // 1. Initial Bell Strike
    timeline.add(() => {
      playBoxingBell(2);
    }, 0.1);

    // 2. Gloves Charge in for the Big Clash
    timeline.to(
      blueGloveRef.current,
      {
        x: '34vw',
        rotation: 10,
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
        rotation: -10,
        duration: 0.42,
        ease: 'power3.in'
      },
      0.25
    );

    // 3. THE CLASH MOMENT
    timeline.add(() => {
      setScreenShake(true);
      setFlash(true);
      playPunchImpact();
      createImpactSparks(canvas.width / 2, canvas.height * 0.42);
      setTimeout(() => setFlash(false), 150);
      setTimeout(() => setScreenShake(false), 450);
    }, 0.67);

    // 4. Sparring Combination Flurry
    const flurry = gsap.timeline();
    // Blue Jab
    flurry.to(blueGloveRef.current, {
      x: '37vw',
      scale: 1.12,
      duration: 0.09,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        playWhoosh();
        createImpactSparks(canvas.width / 2 + 25, canvas.height * 0.42);
      }
    });
    // Red Counter Hook
    flurry.to(redGloveRef.current, {
      x: '-37vw',
      scale: 1.12,
      duration: 0.09,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        playPunchImpact();
        createImpactSparks(canvas.width / 2 - 25, canvas.height * 0.42);
      }
    });
    // Double Impact
    flurry.to([blueGloveRef.current, redGloveRef.current], {
      scale: 1.2,
      duration: 0.11,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        playPunchImpact();
        createImpactSparks(canvas.width / 2, canvas.height * 0.42);
      }
    });

    timeline.add(flurry, 0.77);

    // 5. Final Separation & VS Badge Entrance
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

    // 6. Fighters Banner Entrance & Confetti
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
            particleCount: 50,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#1d4ed8', '#b91c1c', '#f59e0b', '#ffffff']
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#070a12]/95 backdrop-blur-md select-none ${
        screenShake ? 'animate-screen-shake' : ''
      }`}
    >
      {/* Flash impact overlay */}
      {flash && (
        <div className="absolute inset-0 bg-white z-40 pointer-events-none opacity-80" />
      )}

      {/* Atmospheric Arena Background */}
      <div
        className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none filter contrast-125 brightness-75"
        style={{ backgroundImage: `url('/fight_arena.jpg')` }}
      />

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30"
      />

      {/* Top Ledger Header */}
      <div className="w-full relative z-20 pt-6 px-4 text-center">
        <div className="inline-block bg-[#05070c] border border-[#1f293d] px-3.5 py-1 text-[10px] font-mono-tech text-amber-500 font-bold tracking-widest mb-1">
          BOUT {String(pairNumber || '1').padStart(2, '0')} • SPARRING PAIRING
        </div>
        <h1 className="text-3xl sm:text-5xl font-fighter font-bold text-white tracking-wider">
          COMBATE CONFIRMADO
        </h1>
      </div>

      {/* Central Fighting Stage with Gloves */}
      <div className="relative w-full flex-1 flex items-center justify-center my-2 z-20">
        {/* Left: Blue Boxing Glove */}
        <div
          ref={blueGloveRef}
          className="absolute -left-32 sm:-left-40 top-1/2 -translate-y-1/2 w-48 sm:w-60 h-48 sm:h-60 pointer-events-none filter drop-shadow-[0_0_25px_rgba(29,78,216,0.6)] will-change-transform"
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
          className="absolute -right-32 sm:-right-40 top-1/2 -translate-y-1/2 w-48 sm:w-60 h-48 sm:h-60 pointer-events-none filter drop-shadow-[0_0_25px_rgba(185,28,28,0.6)] will-change-transform"
        >
          <img
            src="/red_glove.png"
            alt="Guante Rojo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Center: Industrial VS Badge */}
        <div
          ref={vsBadgeRef}
          className="z-30 flex flex-col items-center justify-center opacity-0 pointer-events-none"
        >
          <div className="w-20 sm:w-24 h-20 sm:h-24 bg-[#0d121f] border-2 border-amber-500 flex items-center justify-center shadow-2xl">
            <span className="text-3xl sm:text-4xl font-fighter font-bold text-amber-500 tracking-wider">
              VS
            </span>
          </div>
          <div className="bg-[#05070c] px-3 py-0.5 border border-[#1f293d] text-[9px] font-mono-tech text-neutral-400 mt-2">
            MATCHMAKER VERIFIED
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
          <div className="ticket-card-blue p-4 sm:p-5 flex flex-col items-center text-center space-y-2 bg-[#090f1e]">
            <span className="text-[10px] font-mono-tech font-bold text-blue-400 tracking-wider">
              [ESQUINA AZUL]
            </span>

            {fighterBlue.photoUrl ? (
              <img
                src={fighterBlue.photoUrl}
                alt={fighterBlue.name}
                className="w-16 sm:w-20 h-16 sm:h-20 object-cover border-2 border-blue-500"
              />
            ) : (
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#0e182e] border-2 border-blue-500 text-blue-300 font-mono font-bold text-2xl flex items-center justify-center">
                {fighterBlue.name.charAt(0)}
              </div>
            )}

            <div className="text-lg sm:text-2xl font-fighter font-bold text-white truncate w-full">
              {fighterBlue.name}
            </div>

            <div className="text-[9px] font-mono-tech text-blue-300 tracking-wider">
              PELEADOR 01
            </div>
          </div>

          {/* Red Corner Fighter */}
          <div className="ticket-card-red p-4 sm:p-5 flex flex-col items-center text-center space-y-2 bg-[#1b080b]">
            <span className="text-[10px] font-mono-tech font-bold text-red-400 tracking-wider">
              [ESQUINA ROJA]
            </span>

            {fighterRed.photoUrl ? (
              <img
                src={fighterRed.photoUrl}
                alt={fighterRed.name}
                className="w-16 sm:w-20 h-16 sm:h-20 object-cover border-2 border-red-500"
              />
            ) : (
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#2b0c11] border-2 border-red-500 text-red-300 font-mono font-bold text-2xl flex items-center justify-center">
                {fighterRed.name.charAt(0)}
              </div>
            )}

            <div className="text-lg sm:text-2xl font-fighter font-bold text-white truncate w-full">
              {fighterRed.name}
            </div>

            <div className="text-[9px] font-mono-tech text-red-300 tracking-wider">
              PELEADOR 02 (RIVAL)
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 max-w-sm mx-auto">
          <button
            type="button"
            onClick={onComplete}
            className="btn-press-primary w-full h-11 text-xs"
          >
            VOLVER AL PROGRAMA OFICIAL
          </button>
        </div>
      </div>
    </div>
  );
}
