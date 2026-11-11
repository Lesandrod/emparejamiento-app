'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  playBoxingBell,
  playPunchImpact,
  playWhoosh,
  playArenaCheer
} from '@/utils/audio';

export default function RockyCinematicIntro({ onFinish, onGoHome, hasBracket = true }) {
  const containerRef = useRef(null);
  const letterboxTopRef = useRef(null);
  const letterboxBottomRef = useRef(null);
  const redGloveRef = useRef(null);
  const blueGloveRef = useRef(null);
  const sparksRef = useRef(null);
  const flashOverlayRef = useRef(null);
  const textCard1Ref = useRef(null);
  const textCard2Ref = useRef(null);
  const textCard3Ref = useRef(null);
  const octagonLogoRef = useRef(null);

  const [hasSkipped, setHasSkipped] = useState(false);

  const handleSkip = () => {
    if (hasSkipped) return;
    setHasSkipped(true);
    if (onFinish) onFinish();
  };

  const handleGoHome = () => {
    if (hasSkipped) return;
    setHasSkipped(true);
    if (onGoHome) {
      onGoHome();
    } else if (onFinish) {
      onFinish();
    }
  };

  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const initialOffset = isMobile ? 260 : 450;
    const clashOffset = isMobile ? 12 : 18; // Knuckle-to-knuckle direct collision
    const reboundOffset = isMobile ? 85 : 160;

    const ctx = gsap.context(() => {
      // Starting positions
      gsap.set(letterboxTopRef.current, { y: 0 });
      gsap.set(letterboxBottomRef.current, { y: 0 });
      gsap.set(flashOverlayRef.current, { opacity: 0 });
      gsap.set(sparksRef.current, { opacity: 0, scale: 0.5 });
      gsap.set(blueGloveRef.current, { x: -initialOffset, opacity: 0, rotation: -25 });
      gsap.set(redGloveRef.current, { x: initialOffset, opacity: 0, rotation: 25 });
      gsap.set(octagonLogoRef.current, { scale: 0.3, opacity: 0, rotation: -10 });

      gsap.set(textCard1Ref.current, { opacity: 0, y: 30, scale: 0.95 });
      gsap.set(textCard2Ref.current, { opacity: 0, y: 30, scale: 0.95 });
      gsap.set(textCard3Ref.current, { opacity: 0, y: 40, scale: 0.85 });

      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(() => {
            if (!hasSkipped && onFinish) onFinish();
          }, 800);
        }
      });

      // 1. Dramatic Dark Ambient Intro & Gong (0.0s - 1.2s)
      tl.call(() => {
        playBoxingBell(1);
      })
      .to(textCard1Ref.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: 'power3.out'
      })
      .to(textCard1Ref.current, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: 'power2.in'
      }, '+=0.8')

      // 2. High-Voltage Rocky Intro: Card 2 & Bell Strike (1.8s - 3.0s)
      .call(() => {
        playWhoosh();
      })
      .to(textCard2Ref.current, {
        opacity: 1,
        y: 0,
        scale: 1.05,
        duration: 0.6,
        ease: 'power2.out'
      })
      .to(textCard2Ref.current, {
        opacity: 0,
        scale: 1.15,
        duration: 0.35,
        ease: 'power2.in'
      }, '+=0.7')

      // 3. Gloves Swoop from Corners for Thunderous Clash (3.0s - 4.2s)
      .call(() => {
        playWhoosh();
      })
      .to(
        blueGloveRef.current,
        {
          x: -clashOffset,
          opacity: 1,
          rotation: -10,
          duration: 0.45,
          ease: 'power4.in'
        },
        'clash'
      )
      .to(
        redGloveRef.current,
        {
          x: clashOffset,
          opacity: 1,
          rotation: 10,
          duration: 0.45,
          ease: 'power4.in'
        },
        'clash'
      )

      // 4. THE IMPACT - Heavy Punch, Sparks, Flash, Camera Shake, Arena Roar!
      .call(() => {
        playPunchImpact();
        playBoxingBell(3);
        setTimeout(() => playArenaCheer(), 200);
      })
      .to(flashOverlayRef.current, {
        opacity: 0.9,
        duration: 0.08,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut'
      })
      .to(
        sparksRef.current,
        {
          opacity: 1,
          scale: isMobile ? 1.6 : 2.2,
          duration: 0.25,
          ease: 'power2.out'
        },
        '-=0.05'
      )
      .to(containerRef.current, {
        x: isMobile ? '+=6' : '+=12',
        y: isMobile ? '-=5' : '-=10',
        duration: 0.05,
        repeat: 5,
        yoyo: true,
        ease: 'rough'
      })
      .to(sparksRef.current, {
        opacity: 0,
        scale: isMobile ? 2.0 : 2.8,
        duration: 0.4,
        ease: 'power2.in'
      })
      .to([blueGloveRef.current, redGloveRef.current], {
        x: (i) => (i === 0 ? -reboundOffset : reboundOffset),
        scale: 0.9,
        duration: 0.5,
        ease: 'power2.out'
      })

      // 5. Grand Logo Reveal & Final Charge (4.2s - 5.5s)
      .to(
        octagonLogoRef.current,
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.6,
          ease: 'back.out(1.4)'
        },
        '-=0.2'
      )
      .to(
        textCard3Ref.current,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: 'power3.out'
        },
        '-=0.3'
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#090a0d] overflow-hidden flex flex-col items-center justify-center select-none"
    >
      {/* Cinematic Top Letterbox Bar */}
      <div
        ref={letterboxTopRef}
        className="absolute top-0 left-0 right-0 h-14 sm:h-20 bg-black z-40 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-600 animate-ping"></span>
            <span className="text-white font-bold tracking-widest uppercase font-display text-[11px] sm:text-xs">
              UFC TORNEO DEL PODER
            </span>
          </div>

          <button
            onClick={handleGoHome}
            type="button"
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-sans font-semibold text-[11px] sm:text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-md"
            title="Ir a inicio / lista de peleadores"
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-primary">home</span>
            <span>Inicio</span>
          </button>
        </div>
      </div>

      {/* Cinematic Bottom Letterbox Bar */}
      <div
        ref={letterboxBottomRef}
        className="absolute bottom-0 left-0 right-0 h-14 sm:h-20 bg-black z-40 border-t border-white/5"
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between text-xs font-mono text-zinc-400">
          <button
            onClick={handleGoHome}
            type="button"
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-dim text-zinc-300 hover:text-white font-sans font-bold text-[11px] sm:text-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">arrow_back</span>
            <span>Inicio</span>
          </button>

          <span className="text-zinc-500 tracking-wider hidden md:inline text-[11px]">
            ELIMINACIÓN DIRECTA • SOLO UNO SERÁ EL CAMPEÓN
          </span>

          <button
            onClick={handleSkip}
            type="button"
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary hover:bg-yellow-400 text-black font-bold tracking-wider uppercase text-[11px] sm:text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-lg"
          >
            <span>{hasBracket ? 'Ver Fixture' : 'Continuar'}</span>
            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">fast_forward</span>
          </button>
        </div>
      </div>

      {/* Dark Octagon Arena Background Image with Radial Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src="/fight_arena.jpg"
          alt="Arena de Pelea"
          className="w-full h-full object-cover opacity-35 filter brightness-75 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#090a0d]/70 to-[#090a0d]"></div>
      </div>

      {/* Lightning Flash Overlay */}
      <div
        ref={flashOverlayRef}
        className="absolute inset-0 bg-white pointer-events-none z-30"
      ></div>

      {/* Center Clash Area - Positioned Higher and Fully Responsive */}
      <div className="relative z-20 flex items-center justify-center w-full max-w-4xl h-44 sm:h-64 px-4 -translate-y-20 sm:-translate-y-28 md:-translate-y-32">
        {/* Left: Blue Boxing Glove (Flipped horizontally so knuckles face center) */}
        <div
          ref={blueGloveRef}
          className="w-28 h-28 xs:w-36 xs:h-36 sm:w-52 sm:h-52 md:w-60 md:h-60 flex items-center justify-center pointer-events-none drop-shadow-[0_0_30px_rgba(56,189,248,0.45)]"
        >
          <img
            src="/blue_glove.png"
            alt="Guante Azul"
            className="w-full h-full object-contain -scale-x-100"
          />
        </div>

        {/* Center: Spark Burst on Impact */}
        <div
          ref={sparksRef}
          className="absolute z-30 w-24 h-24 sm:w-32 sm:h-32 rounded-full pointer-events-none flex items-center justify-center"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-red-500 blur-xl opacity-80 animate-pulse"></div>
          <div className="absolute w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white blur-md"></div>
        </div>

        {/* Center: Octagon Gold Emblem */}
        <div
          ref={octagonLogoRef}
          className="absolute z-20 flex flex-col items-center justify-center pointer-events-none"
        >
          <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#111317] border-2 border-primary flex flex-col items-center justify-center shadow-2xl">
            <span className="font-display font-black text-xl xs:text-2xl sm:text-3xl text-primary tracking-widest leading-none">
              VS
            </span>
            <span className="text-[7px] sm:text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-1">
              OCTAGON
            </span>
          </div>
        </div>

        {/* Right: Red Boxing Glove (Flipped horizontally so knuckles face center) */}
        <div
          ref={redGloveRef}
          className="w-28 h-28 xs:w-36 xs:h-36 sm:w-52 sm:h-52 md:w-60 md:h-60 flex items-center justify-center pointer-events-none drop-shadow-[0_0_30px_rgba(248,113,113,0.45)]"
        >
          <img
            src="/red_glove.png"
            alt="Guante Rojo"
            className="w-full h-full object-contain -scale-x-100"
          />
        </div>
      </div>

      {/* Typography Cards (Positioned clearly below the gloves with ZERO overlap) */}
      <div className="absolute z-30 flex flex-col items-center justify-center text-center px-4 max-w-xl pointer-events-none translate-y-20 sm:translate-y-28 md:translate-y-36">
        {/* Card 1 */}
        <div ref={textCard1Ref} className="absolute flex flex-col items-center w-full">
          <span className="text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase text-zinc-400 font-bold block mb-1">
            EL DESTINO ESTÁ ESCRITO
          </span>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-black text-white tracking-tight uppercase">
            LA GLORIA SE GANA EN EL RING
          </h2>
        </div>

        {/* Card 2 */}
        <div ref={textCard2Ref} className="absolute flex flex-col items-center w-full">
          <span className="text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase text-red-400 font-bold block mb-1">
            SIN REGALOS • SIN EXCUSAS
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-black text-primary tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(254,207,82,0.4)]">
            TORNEO DEL PODER
          </h2>
        </div>

        {/* Card 3: Final Call */}
        <div ref={textCard3Ref} className="absolute flex flex-col items-center w-full">
          <div className="px-3 sm:px-4 py-0.5 sm:py-1 rounded-full bg-primary/20 border border-primary/40 text-primary font-mono text-[10px] sm:text-xs font-bold tracking-widest uppercase inline-block mb-2 shadow-sm">
            CUADRO OFICIAL GENERADO
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tight">
            QUE COMIENCE LA GUERRA
          </h1>
          <p className="text-[10px] sm:text-xs text-zinc-400 font-mono mt-1">
            Cargando el árbol oficial de combates...
          </p>
        </div>
      </div>
    </div>
  );
}
