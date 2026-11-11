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
  participants,
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

  // Eligible opponents
  const candidatePool = participants.filter(
    (p) => !p.revealed && p.id !== currentUser.id
  );

  // Entrance
  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.card-item');

    gsap.fromTo(
      cards,
      { y: 30, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.03,
        duration: 0.35,
        ease: 'power2.out',
        clearProps: 'all'
      }
    );
  }, []);

  // Shuffle
  const handleChocolatear = () => {
    if (isChocolateando || isRevealing || showFightAnimation) return;
    setIsChocolateando(true);
    setSelectedCardId(null);
    playWhoosh();

    const cards = containerRef.current.querySelectorAll('.card-item');
    const tl = gsap.timeline({
      onComplete: () => {
        setIsChocolateando(false);
        gsap.set(cards, { clearProps: 'all' });
      }
    });

    tl.to(cards, {
      x: 0,
      y: 0,
      scale: 0.88,
      duration: 0.15,
      ease: 'power2.inOut'
    })
      .to(cards, {
        x: () => (Math.random() - 0.5) * 22,
        y: () => (Math.random() - 0.5) * 14,
        rotationZ: () => (Math.random() - 0.5) * 14,
        duration: 0.15,
        ease: 'rough'
      })
      .to(cards, {
        x: 0,
        y: 0,
        rotationZ: 0,
        scale: 1,
        stagger: 0.018,
        duration: 0.2,
        ease: 'power2.out'
      });
  };

  const handleSelectCard = (index) => {
    if (isChocolateando || isRevealing || showFightAnimation) return;
    playClickSound();
    setSelectedCardId(index);
  };

  const handleConfirmFlip = async () => {
    if (selectedCardId === null || isRevealing || showFightAnimation) return;
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
        throw new Error(data.error || 'Error en el emparejamiento');
      }
      setRevealedPartner(data.partner);
      setRevealedPair(data.pair);
    } catch (e) {
      setErrorMessage(e.message);
      setIsRevealing(false);
      return;
    }

    const targetCard = cardsRef.current[selectedCardId];
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

      const innerCard = targetCard.querySelector('.card-inner');
      flipTl.to(
        innerCard,
        {
          rotateY: 180,
          duration: 0.48,
          ease: 'power2.inOut'
        },
        '+=0.04'
      );

      flipTl.to(
        hand,
        {
          x: targetX + 220,
          y: targetY - 220,
          opacity: 0,
          duration: 0.35,
          ease: 'power2.in'
        },
        '-=0.25'
      );

      flipTl.add(() => {
        setIsRevealing(false);
        setTimeout(() => {
          setShowFightAnimation(true);
        }, 300);
      });
    } else {
      setIsRevealing(false);
      setShowFightAnimation(true);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto space-y-5 select-none"
    >
      {/* Hand Asset */}
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

      {/* Top Banner (Blue Corner Fighter - Neo Style) */}
      <div className="neo-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(0,242,254,0.2)]">
        <div className="flex items-center gap-3.5">
          {currentUser.photoUrl ? (
            <img
              src={currentUser.photoUrl}
              alt={currentUser.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-[#00f2fe] shadow-[0_0_12px_#00f2fe] flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border-2 border-[#00f2fe] text-[#00f2fe] flex items-center justify-center font-orbitron font-black text-lg uppercase flex-shrink-0 shadow-[0_0_12px_rgba(0,242,254,0.4)]">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-[10px] font-orbitron text-[#00f2fe] font-bold tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] shadow-[0_0_6px_#00f2fe]"></span>
              Esquina Azul • Peleador en Cuadrilátero
            </div>
            <h1 className="text-2xl sm:text-3xl font-orbitron font-black text-white tracking-tight uppercase drop-shadow-[0_0_12px_rgba(0,242,254,0.4)]">
              {currentUser.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleChocolatear}
            disabled={isChocolateando || isRevealing}
            className="px-4 py-2 rounded-xl bg-[#121929] hover:bg-[#18233a] border border-cyan-500/40 hover:border-[#00f2fe] text-cyan-200 text-xs font-orbitron uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,242,254,0.15)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#00f2fe]">casino</span>
            <span>{isChocolateando ? 'Chocolateando...' : 'Chocolatear Cartas'}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isChocolateando || isRevealing}
            className="px-3.5 py-2 rounded-xl text-xs font-orbitron uppercase tracking-wider text-zinc-400 hover:text-white border border-white/10 hover:border-white/30 transition-all cursor-pointer"
          >
            Volver
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs font-orbitron text-center shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          {errorMessage}
        </div>
      )}

      {/* Table Arena */}
      <div className="neo-card p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 text-xs text-zinc-300">
          <span className="flex items-center gap-2 font-orbitron text-[11px] uppercase tracking-wider text-cyan-300">
            <span className="material-symbols-outlined text-[16px] text-[#00f2fe]">touch_app</span>
            {selectedCardId !== null
              ? 'Carta seleccionada • Confirma para voltear'
              : 'Selecciona una carta a ciegas de la mesa'}
          </span>
          <span className="text-[#00f2fe] font-bold font-orbitron text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
            {candidatePool.length} Opciones en Mesa
          </span>
        </div>

        {/* 3 cards per row on mobile */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 justify-items-center py-2 pb-20 sm:pb-2">
          {candidatePool.map((c, idx) => {
            const isSelected = selectedCardId === idx;

            return (
              <div
                key={c.id || idx}
                ref={(el) => (cardsRef.current[idx] = el)}
                onClick={() => handleSelectCard(idx)}
                className={`card-item relative w-24 sm:w-28 h-36 sm:h-40 cursor-pointer rounded-2xl transition-all ${
                  isSelected ? 'card-selected-glow' : ''
                }`}
                style={{ perspective: '1000px' }}
              >
                <div
                  className="card-inner w-full h-full relative rounded-2xl"
                  style={{
                    transformStyle: 'preserve-3d',
                    transition: isRevealing ? 'none' : 'transform 0.15s ease-out'
                  }}
                >
                  {/* Back of Card: Cyber / Red Corner Neo Look */}
                  <div
                    className={`card-face-back absolute inset-0 rounded-2xl border flex flex-col items-center justify-between p-2.5 shadow-xl ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#18233a] to-[#0c1424] border-2 border-[#00f2fe] shadow-[0_0_25px_rgba(0,242,254,0.7)]'
                        : 'bg-gradient-to-b from-[#18111e] to-[#0c0812] border border-[#ff2a5f]/40 hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(0,242,254,0.2)]'
                    }`}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="w-full flex justify-between text-[9px] font-orbitron text-[#ff2a5f] font-bold">
                      <span>RIVAL</span>
                      <span>#{String(idx + 1).padStart(2, '0')}</span>
                    </div>

                    {/* Octagon Logo Mark */}
                    <div className="w-10 h-10 rounded-xl border border-cyan-400/40 flex items-center justify-center bg-cyan-950/40 shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                      <span className="font-orbitron font-black text-xs text-[#00f2fe]">UFC</span>
                    </div>

                    <span className="text-[9px] font-orbitron uppercase tracking-widest text-zinc-300 font-bold">
                      {isSelected ? 'Elegida' : 'Esquina Roja'}
                    </span>
                  </div>

                  {/* Front of Card: Revealed Partner */}
                  <div
                    className="card-face-front absolute inset-0 rounded-2xl bg-gradient-to-b from-[#240e18] to-[#0e070c] text-white border-2 border-[#ff2a5f] flex flex-col items-center justify-center p-2 shadow-[0_0_25px_rgba(255,42,95,0.4)]"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    {revealedPartner && (
                      <>
                        {revealedPartner.photoUrl ? (
                          <img
                            src={revealedPartner.photoUrl}
                            alt={revealedPartner.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#ff2a5f] mb-1 shadow-[0_0_10px_#ff2a5f]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-red-950 border-2 border-[#ff2a5f] text-red-200 font-orbitron font-bold text-base flex items-center justify-center mb-1">
                            {revealedPartner.name.charAt(0)}
                          </div>
                        )}
                        <div className="text-[9px] font-orbitron text-[#ff2a5f] font-bold uppercase">
                          Esquina Roja
                        </div>
                        <div className="text-xs font-orbitron font-bold uppercase text-center truncate w-full text-white mt-0.5">
                          {revealedPartner.name}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Bottom Bar for Mobile Confirmation */}
        <div
          className={`fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-[#07080d]/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-cyan-500/20 sm:border-0 z-40 transition-all ${
            selectedCardId !== null ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none sm:hidden'
          }`}
        >
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={handleConfirmFlip}
              disabled={isRevealing}
              className="neo-button-cyan w-full h-12 rounded-xl font-orbitron font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">sports_mma</span>
              <span>{isRevealing ? 'Volteando carta...' : 'CONFIRMAR COMBATE Y DESATAR PELEA'}</span>
            </button>
          </div>
        </div>
      </div>

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
