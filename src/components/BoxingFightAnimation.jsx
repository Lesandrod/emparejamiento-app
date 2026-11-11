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
          color: Math.random() > 0.5 ? '#00f0ff' : Math.random() > 0.5 ? '#ff1744' : '#ffd600'
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
            colors: ['#00f0ff', '#ff1744', '#ffd600', '#ffffff']
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#050711]/95 backdrop-blur-md select-none ${
        screenShake ? 'animate-screen-shake' : ''
      }`}
    >
      {/* Flash impact overlay */}
      {flash && (
        <div className="absolute inset-0 bg-white z-40 pointer-events-none opacity-85" />
      )}

      {/* Atmospheric Arena Background with Gradient Glow */}
      <div
        className="absolute inset-0 opacity-25 bg-cover bg-center pointer-events-none filter contrast-125 brightness-90"
        style={{ backgroundImage: `url('/fight_arena.jpg')` }}
      />
      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-[#00f0ff]/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-[#ff1744]/15 via-transparent to-transparent pointer-events-none" />

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30"
      />

      {/* Top Header */}
      <div className="w-full relative z-20 pt-6 px-4 text-center">
        <div className="inline-block px-3.5 py-1 rounded-full border border-cyan-400/50 bg-cyan-950/60 text-[11px] font-mono-tech text-cyan-300 font-bold tracking-widest mb-1 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
          BOUT #{String(pairNumber || '1').padStart(2, '0')} • SPARRING OFICIAL
        </div>
        <h1 className="text-3xl sm:text-5xl font-ufc font-bold text-white tracking-wider">
          COMBATE <span className="text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.7)]">CONFIRMADO</span>
        </h1>
      </div>

      {/* Central Fighting Stage with Gloves */}
      <div className="relative w-full flex-1 flex items-center justify-center my-2 z-20">
        {/* Left: Blue Boxing Glove */}
        <div
          ref={blueGloveRef}
          className="absolute -left-32 sm:-left-40 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 pointer-events-none filter drop-shadow-[0_0_35px_rgba(0,240,255,0.7)] will-change-transform"
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
          className="absolute -right-32 sm:-right-40 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 pointer-events-none filter drop-shadow-[0_0_35px_rgba(255,23,68,0.7)] will-change-transform"
        >
          <img
            src="/red_glove.png"
            alt="Guante Rojo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Center: Neo VS Badge */}
        <div
          ref={vsBadgeRef}
          className="z-30 flex flex-col items-center justify-center opacity-0 pointer-events-none"
        >
          <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-2xl bg-gradient-to-b from-[#1f1506] to-[#0e0a02] border-2 border-amber-400 flex items-center justify-center shadow-[0_0_35px_rgba(255,171,0,0.6)]">
            <span className="text-3xl sm:text-4xl font-ufc font-bold text-amber-400 tracking-wider">
              VS
            </span>
          </div>
          <div className="bg-black/90 px-3 py-0.5 rounded-full border border-amber-400/50 text-[9px] font-mono-tech text-amber-300 mt-2">
            UFC MATCHMAKER
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
          <div className="neo-card-blue p-4 sm:p-5 flex flex-col items-center text-center space-y-2">
            <span className="text-[10px] font-mono-tech font-bold text-cyan-400 tracking-wider">
              ESQUINA AZUL
            </span>

            {fighterBlue.photoUrl ? (
              <img
                src={fighterBlue.photoUrl}
                alt={fighterBlue.name}
                className="w-16 sm:w-20 h-16 sm:h-20 rounded-full object-cover border-2 border-cyan-400 shadow-[0_0_15px_#00f0ff]"
              />
            ) : (
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-blue-950 border-2 border-cyan-400 text-cyan-200 font-ufc font-bold text-2xl flex items-center justify-center shadow-[0_0_15px_#00f0ff]">
                {fighterBlue.name.charAt(0)}
              </div>
            )}

            <div className="text-base sm:text-2xl font-ufc font-bold text-white truncate w-full">
              {fighterBlue.name}
            </div>

            <div className="text-[9px] font-mono-tech text-cyan-300 tracking-wider">
              PELEADOR 01
            </div>
          </div>

          {/* Red Corner Fighter */}
          <div className="neo-card-red p-4 sm:p-5 flex flex-col items-center text-center space-y-2">
            <span className="text-[10px] font-mono-tech font-bold text-red-400 tracking-wider">
              ESQUINA ROJA
            </span>

            {fighterRed.photoUrl ? (
              <img
                src={fighterRed.photoUrl}
                alt={fighterRed.name}
                className="w-16 sm:w-20 h-16 sm:h-20 rounded-full object-cover border-2 border-red-500 shadow-[0_0_15px_#ff1744]"
              />
            ) : (
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-red-950 border-2 border-red-500 text-red-200 font-ufc font-bold text-2xl flex items-center justify-center shadow-[0_0_15px_#ff1744]">
                {fighterRed.name.charAt(0)}
              </div>
            )}

            <div className="text-base sm:text-2xl font-ufc font-bold text-white truncate w-full">
              {fighterRed.name}
            </div>

            <div className="text-[9px] font-mono-tech text-red-300 tracking-wider">
              PELEADOR 02 (RIVAL)
            </div>
          </div>
        </div>

        {/* Action Button (Neo Cyan) */}
        <div className="pt-4 max-w-sm mx-auto">
          <button
            type="button"
            onClick={onComplete}
            className="btn-neo-cyan w-full h-12 text-sm"
          >
            VOLVER AL PROGRAMA OFICIAL
          </button>
        </div>
      </div>
    </div>
  );
}
