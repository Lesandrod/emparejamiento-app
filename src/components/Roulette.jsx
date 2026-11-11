'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import BoxingFightAnimation from './BoxingFightAnimation';
import {
  playWhoosh,
  playClickSound,
  playCardFlipSound
} from '@/utils/audio';

export default function Roulette({
  currentUser,
  participants = [],
  onFinishAndReturn,
  onCancel
}) {
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isChocolateando, setIsChocolateando] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedPartner, setRevealedPartner] = useState(null);
  const [revealedPair, setRevealedPair] = useState(null);
  const [showFightAnimation, setShowFightAnimation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const containerRef = useRef(null);
  const cardsRef = useRef([]);
  const handRef = useRef(null);

  // Eligible opponents in red corner
  const candidatePool = participants.filter(
    (p) => !p.revealed && p.id !== currentUser.id
  );

  // Initial Entrance Animation
  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.mystery-card');

    gsap.fromTo(
      cards,
      { y: 30, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.04,
        duration: 0.35,
        ease: 'power2.out',
        clearProps: 'all'
      }
    );
  }, []);

  // Shuffle / Barajar Oponentes
  const handleChocolatear = () => {
    if (isChocolateando || isRevealing || showFightAnimation) return;
    setIsChocolateando(true);
    setSelectedCardId(null);
    playWhoosh();

    const cards = containerRef.current.querySelectorAll('.mystery-card');
    const tl = gsap.timeline({
      onComplete: () => {
        setIsChocolateando(false);
        gsap.set(cards, { clearProps: 'all' });
      }
    });

    tl.to(cards, {
      scale: 0.92,
      duration: 0.15,
      ease: 'power2.inOut'
    })
      .to(cards, {
        x: () => (Math.random() - 0.5) * 26,
        y: () => (Math.random() - 0.5) * 16,
        rotationZ: () => (Math.random() - 0.5) * 8,
        duration: 0.18,
        ease: 'rough'
      })
      .to(cards, {
        x: 0,
        y: 0,
        rotationZ: 0,
        scale: 1,
        stagger: 0.02,
        duration: 0.22,
        ease: 'power2.out'
      });
  };

  const handleSelectCard = (index) => {
    if (isChocolateando || isRevealing || showFightAnimation) return;
    playClickSound();
    setSelectedCardId(index);
  };

  const handleConfirmDestapar = async (targetIndex = selectedCardId) => {
    if (targetIndex === null || isRevealing || showFightAnimation) return;
    setSelectedCardId(targetIndex);
    setIsRevealing(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al emparejar rivales');
      }
      setRevealedPartner(data.partner);
      setRevealedPair(data.pair);

      const targetCard = cardsRef.current[targetIndex];
      const hand = handRef.current;

      if (targetCard && hand) {
        const cardRect = targetCard.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        const targetX = cardRect.left - containerRect.left + cardRect.width / 2;
        const targetY = cardRect.top - containerRect.top + cardRect.height / 2;

        const flipTl = gsap.timeline();

        flipTl.set(hand, {
          display: 'block',
          x: targetX + 160,
          y: targetY - 180,
          scale: 1.15,
          opacity: 0,
          rotation: -25
        });

        flipTl.to(hand, {
          x: targetX + 30,
          y: targetY - 15,
          rotation: -5,
          scale: 1,
          opacity: 1,
          duration: 0.38,
          ease: 'power2.out'
        });

        flipTl.to([hand, targetCard], {
          y: '-=15',
          scale: 1.05,
          duration: 0.18,
          ease: 'power1.inOut',
          onStart: () => playCardFlipSound()
        });

        flipTl.to(
          hand,
          {
            x: targetX + 220,
            y: targetY - 220,
            opacity: 0,
            duration: 0.35,
            ease: 'power2.in'
          },
          '+=0.1'
        );

        flipTl.add(() => {
          setIsRevealing(false);
          setTimeout(() => {
            setShowFightAnimation(true);
          }, 350);
        });
      } else {
        setIsRevealing(false);
        setShowFightAnimation(true);
      }
    } catch (e) {
      setErrorMessage(e.message);
      setIsRevealing(false);
    }
  };

  const probability = candidatePool.length > 0 ? Math.round(100 / candidatePool.length) : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-7xl mx-auto py-2 flex-1 flex flex-col justify-center select-none"
    >
      {/* Hand Asset for Real 3D Flip */}
      <div
        ref={handRef}
        className="absolute pointer-events-none z-50 hidden will-change-transform"
        style={{ width: '220px', height: '220px' }}
      >
        <img
          src="/hand_realistic.png"
          alt="Mano"
          className="w-full h-full object-contain filter drop-shadow-2xl"
        />
      </div>

      {/* Active Fighter Profile Card (Esquina Azul - Google Stitch Design) */}
      <div className="w-full relative overflow-hidden bg-gradient-to-r from-surface-dim via-surface-container-low to-surface-dim border border-blue-500/30 rounded-xl p-6 sm:p-8 mb-8 transition-all shadow-lg">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5 sm:gap-7">
            {/* Fighter Photo */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-surface-container-high border-2 border-blue-500/40 flex-shrink-0 shadow-md">
              {currentUser.photoUrl ? (
                <img
                  alt={currentUser.name}
                  className="w-full h-full object-cover contrast-125 brightness-95 scale-105"
                  src={currentUser.photoUrl}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-950/40 text-blue-400 font-display font-black text-2xl uppercase">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center text-[9px] font-mono uppercase bg-blue-600 text-white font-bold tracking-widest px-1 py-0.5 rounded shadow">
                ESQUINA AZUL
              </span>
            </div>

            {/* Fighter Info */}
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-[10px] font-mono tracking-widest text-blue-400 font-bold uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Peleador Activo Asignado
                </span>
                <span className="text-outline-subtle text-xs">•</span>
                <span className="text-[11px] font-mono text-on-surface-variant font-medium">
                  Gimnasio: Mexbox MMA
                </span>
              </div>

              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
                  {currentUser.name}
                </h1>
                <span className="text-xs sm:text-sm font-mono text-primary uppercase font-bold tracking-wider">
                  “El Destructor”
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-3 text-xs text-on-surface-variant pt-2 border-t border-outline-dim/60">
                <div>
                  <span className="text-[10px] uppercase font-mono block text-outline-subtle font-semibold mb-0.5">
                    Categoría
                  </span>
                  <span className="text-white font-semibold">Wélter (77.1 KG / 170 LBS)</span>
                </div>
                <div className="border-l border-outline-dim pl-4 sm:pl-6">
                  <span className="text-[10px] uppercase font-mono block text-outline-subtle font-semibold mb-0.5">
                    Récord MMA
                  </span>
                  <span className="text-emerald-400 font-bold font-mono">
                    4 - 1 - 0 <span className="text-[11px] text-on-surface-variant font-normal">(3 KO)</span>
                  </span>
                </div>
                <div className="border-l border-outline-dim pl-4 sm:pl-6">
                  <span className="text-[10px] uppercase font-mono block text-outline-subtle font-semibold mb-0.5">
                    Guardia
                  </span>
                  <span className="text-white font-medium">Ortodoxa</span>
                </div>
                <div className="border-l border-outline-dim pl-4 sm:pl-6 hidden sm:block">
                  <span className="text-[10px] uppercase font-mono block text-outline-subtle font-semibold mb-0.5">
                    Alcance
                  </span>
                  <span className="text-white font-medium">74.5 in (189 cm)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 lg:pt-0 self-start lg:self-center">
            <button
              onClick={handleChocolatear}
              disabled={isChocolateando || isRevealing}
              className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container border border-outline-subtle hover:border-primary text-white rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 shadow-sm group cursor-pointer"
              id="shuffleBtn"
              type="button"
            >
              <span className={`material-symbols-outlined text-[18px] text-primary transition-transform duration-300 ${isChocolateando ? 'rotate-180 animate-spin' : 'group-hover:rotate-180'}`}>
                shuffle
              </span>
              <span>{isChocolateando ? 'Barajando...' : 'Barajar Oponentes'}</span>
            </button>
            <button
              onClick={onCancel}
              disabled={isChocolateando || isRevealing}
              className="px-4 py-2.5 border border-outline-dim hover:bg-surface-container text-on-surface-variant hover:text-white rounded-lg text-xs font-medium tracking-wide uppercase transition-colors cursor-pointer"
              type="button"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs font-mono text-center shadow-lg">
          {errorMessage}
        </div>
      )}

      {/* Instruction Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 px-1">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-xs font-mono tracking-widest uppercase font-bold text-white">
            SOBRES SELLADOS UFC • SELECCIONA EL RIVAL EN ESQUINA ROJA
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-on-surface-variant">
          <span className="px-2 py-0.5 rounded bg-surface-container border border-outline-dim text-white font-semibold">
            {candidatePool.length} SOBRES DISPONIBLES
          </span>
          <span className="text-outline-subtle hidden sm:inline">•</span>
          <span className="text-outline-subtle hidden sm:inline">
            PROBABILIDAD EQUITATIVA {probability}%
          </span>
        </div>
      </div>

      {/* Sleek Minimal Mystery Cards Grid (Google Stitch) */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        id="cardsGrid"
      >
        {candidatePool.map((c, idx) => {
          const isSelected = selectedCardId === idx;
          const slotNum = String(idx + 1).padStart(2, '0');

          return (
            <div
              key={c.id || idx}
              ref={(el) => (cardsRef.current[idx] = el)}
              onClick={() => handleSelectCard(idx)}
              className={`mystery-card group relative bg-gradient-to-b from-[#17181d] to-[#0f1013] hover:from-[#1d1f26] hover:to-[#14151a] border rounded-xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[350px] shadow-lg hover:shadow-red-500/10 hover:-translate-y-1 ${
                isSelected
                  ? 'border-primary bg-surface-container-low shadow-[0_0_20px_rgba(254,207,82,0.3)] opacity-100 scale-[1.02]'
                  : selectedCardId !== null
                  ? 'border-outline-dim opacity-50'
                  : 'border-outline-dim hover:border-red-500/60 opacity-100'
              }`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent rounded-t-xl transition-all ${
                  isSelected
                    ? 'via-primary bg-primary'
                    : 'via-red-500/40 group-hover:via-red-500'
                }`}
              ></div>

              <div>
                <div className="flex items-center justify-between pb-4 border-b border-outline-dim/70">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span className="text-[10px] font-mono tracking-widest text-red-400 font-bold uppercase">
                      ESQUINA ROJA
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isSelected
                        ? 'text-primary border-primary bg-primary/10'
                        : 'text-outline-subtle group-hover:text-red-400 bg-surface-container border-outline-dim'
                    } transition-colors`}
                  >
                    #{slotNum}
                  </span>
                </div>

                <div className="py-8 flex flex-col items-center justify-center text-center relative">
                  <div
                    className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center mb-3 transition-all shadow-inner ${
                      isSelected
                        ? 'bg-primary/20 border-2 border-primary'
                        : 'bg-surface-container-high/80 border border-outline-subtle group-hover:border-red-500/60 group-hover:bg-red-500/10'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[26px] transition-colors ${
                        isSelected
                          ? 'text-primary'
                          : 'text-outline-subtle group-hover:text-red-400'
                      }`}
                    >
                      encrypted
                    </span>
                  </div>

                  <span className="text-[10px] font-mono tracking-widest uppercase text-red-400/90 font-bold">
                    SOBRE OFICIAL UFC
                  </span>
                  <span className="text-sm font-display font-bold tracking-wider text-white uppercase mt-0.5">
                    Rival Sellado
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-1.5 font-mono px-2 py-0.5 rounded bg-black/40 border border-outline-dim">
                    CONFIDENCIAL
                  </span>
                </div>
              </div>

              <div className="w-full">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmDestapar(idx);
                  }}
                  disabled={isRevealing}
                  className={`w-full py-2.5 border rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-black border-primary hover:bg-yellow-400'
                      : 'bg-surface-container-high group-hover:bg-red-600 group-hover:text-white border-outline-dim group-hover:border-transparent text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">visibility</span>
                  <span>{isRevealing && isSelected ? 'Destapando...' : 'DESTAPAR OPONENTE'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revealed Fighter Section (Google Stitch Reveal Confirmation Bar) */}
      {selectedCardId !== null && (
        <div
          className="mt-8 bg-surface-dim border border-outline-subtle rounded-xl p-6 transition-all duration-300 shadow-2xl"
          id="revealModal"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-surface-container-high border border-outline-subtle/40 flex-shrink-0">
                <div className="w-full h-full flex items-center justify-center bg-red-950/60 text-red-300">
                  <span className="material-symbols-outlined text-2xl">encrypted</span>
                </div>
                <span className="absolute top-1 left-1 text-[8px] font-mono uppercase bg-red-500/20 text-red-300 border border-red-500/30 px-1 py-0.2 rounded">
                  Roja
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono tracking-widest text-tertiary uppercase">
                    Sobre Seleccionado
                  </span>
                  <span className="text-outline-subtle text-xs">•</span>
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase font-bold" id="revealedSlot">
                    SOBRE #{String(selectedCardId + 1).padStart(2, '0')}
                  </span>
                </div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-on-surface uppercase" id="revealedName">
                  Rival Listo para Destapar
                </h2>
                <div className="flex items-center gap-4 mt-1 text-xs text-on-surface-variant font-mono">
                  <span>Récord: <strong className="text-on-surface font-medium" id="revealedRecord">OFICIAL UFC</strong></span>
                  <span>Categoría: <span className="text-on-surface" id="revealedWeight">WÉLTER 77.1 KG</span></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={() => setSelectedCardId(null)}
                disabled={isRevealing}
                className="px-4 py-2 border border-outline-dim hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-lg text-xs font-medium tracking-wide transition-colors cursor-pointer"
                id="cancelRevealBtn"
                type="button"
              >
                Cambiar
              </button>
              <button
                onClick={() => handleConfirmDestapar(selectedCardId)}
                disabled={isRevealing}
                className="px-5 py-2 bg-primary hover:bg-yellow-400 text-black rounded-lg text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">sports_mma</span>
                <span>{isRevealing ? 'Volteando carta...' : 'Confirmar Combate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fight Animation Overlay */}
      {showFightAnimation && revealedPartner && revealedPair && (
        <BoxingFightAnimation
          fighterBlue={currentUser}
          fighterRed={revealedPartner}
          pairNumber={revealedPair.pairNumber}
          onComplete={onFinishAndReturn}
        />
      )}
    </div>
  );
}
