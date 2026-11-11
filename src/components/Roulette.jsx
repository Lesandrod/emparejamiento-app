'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { playShuffleSound, playClickSound, playCardFlipSound, playWinSound } from '@/utils/audio';

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
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [readyForInteraction, setReadyForInteraction] = useState(false);

  const containerRef = useRef(null);
  const cardsRef = useRef([]);
  const handRef = useRef(null);

  // Eligible candidate cards for this spin: unpaired participants excluding currentUser
  const candidatePool = participants.filter(
    (p) => !p.revealed && p.id !== currentUser.id
  );

  // 1. Initial dealing animation: cards fly in crisp and fast
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
        stagger: 0.04,
        duration: 0.35,
        ease: 'power2.out',
        clearProps: 'all',
        onComplete: () => {
          setReadyForInteraction(true);
        }
      }
    );
  }, []);

  // 2. Chocolatear (Fast snappy shuffle)
  const handleChocolatear = () => {
    if (isChocolateando || isRevealing || isDone) return;
    setIsChocolateando(true);
    setSelectedCardId(null);
    playShuffleSound();

    const cards = containerRef.current.querySelectorAll('.card-item');
    const tl = gsap.timeline({
      onComplete: () => {
        setIsChocolateando(false);
        gsap.set(cards, { clearProps: 'all' });
      }
    });

    // Fast gather to center
    tl.to(cards, {
      x: 0,
      y: 0,
      scale: 0.88,
      duration: 0.18,
      ease: 'power2.inOut'
    })
      // Riffle vibration
      .to(cards, {
        x: () => (Math.random() - 0.5) * 20,
        y: () => (Math.random() - 0.5) * 12,
        rotationZ: () => (Math.random() - 0.5) * 14,
        duration: 0.16,
        ease: 'rough'
      })
      // Return cleanly to places
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

  // 3. Card click handler
  const handleSelectCard = (index) => {
    if (isChocolateando || isRevealing || isDone) return;
    playClickSound();
    setSelectedCardId(index);
  };

  // 4. Confirm Card Pick & 3D Realistic Hand Flip
  const handleConfirmFlip = async () => {
    if (selectedCardId === null || isRevealing || isDone) return;
    setIsRevealing(true);
    setErrorMessage('');

    let partnerResult = null;
    let pairResult = null;

    try {
      const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error en el sorteo');
      }
      partnerResult = data.partner;
      pairResult = data.pair;
      setRevealedPartner(data.partner);
      setRevealedPair(data.pair);
    } catch (e) {
      setErrorMessage(e.message);
      setIsRevealing(false);
      return;
    }

    // Realistic Hand Animation & 3D Flip
    const targetCard = cardsRef.current[selectedCardId];
    const hand = handRef.current;

    if (targetCard && hand) {
      const cardRect = targetCard.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const targetX = cardRect.left - containerRect.left + cardRect.width / 2;
      const targetY = cardRect.top - containerRect.top + cardRect.height / 2;

      const flipTl = gsap.timeline();

      // Hand enters from top right and grabs card
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
        duration: 0.42,
        ease: 'power2.out'
      });

      // Hand lifts card slightly
      flipTl.to([hand, targetCard], {
        y: '-=18',
        scale: 1.05,
        duration: 0.2,
        ease: 'power1.inOut',
        onStart: () => playCardFlipSound()
      });

      // 3D Flip Execution
      const innerCard = targetCard.querySelector('.card-inner');
      flipTl.to(
        innerCard,
        {
          rotateY: 180,
          duration: 0.55,
          ease: 'power2.inOut'
        },
        '+=0.05'
      );

      // Hand withdraws smoothly
      flipTl.to(
        hand,
        {
          x: targetX + 220,
          y: targetY - 220,
          opacity: 0,
          duration: 0.45,
          ease: 'power2.in'
        },
        '-=0.3'
      );

      flipTl.add(() => {
        playWinSound();
        setIsDone(true);
        setIsRevealing(false);
      });
    } else {
      setIsDone(true);
      setIsRevealing(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto space-y-5 select-none"
    >
      {/* Photorealistic Grab Hand */}
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

      {/* Top Header Bar */}
      <div className="sharp-card p-5 sm:p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {currentUser.photoUrl ? (
            <img
              src={currentUser.photoUrl}
              alt={currentUser.name}
              className="w-11 h-11 rounded-full object-cover border border-neutral-300 flex-shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[#090a0f] text-white flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              Turno de sorteo
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#090a0f] uppercase">
              {currentUser.name}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isDone && (
            <>
              <button
                type="button"
                onClick={handleChocolatear}
                disabled={isChocolateando || isRevealing}
                className="sharp-outline-btn px-4 h-10 text-xs font-mono uppercase flex items-center gap-1.5"
              >
                <span>🔀</span> {isChocolateando ? 'Mezclando...' : 'Chocolatear'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isChocolateando || isRevealing}
                className="sharp-outline-btn px-3 h-10 text-xs font-mono text-neutral-400 hover:text-black"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status or Error Notice */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs font-mono text-center">
          {errorMessage}
        </div>
      )}

      {/* Main Table Arena */}
      {!isDone ? (
        <div className="sharp-card p-5 sm:p-8 bg-[#090a0f] text-white space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            <span>
              {selectedCardId !== null
                ? 'Carta elegida • Confirma para voltear'
                : 'Toca una carta de la mesa'}
            </span>
            <span>{candidatePool.length} opciones en mesa</span>
          </div>

          {/* Cards Grid: 3 per row on mobile, 4-5 on desktop */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 justify-items-center py-2 pb-24 sm:pb-2">
            {candidatePool.map((c, idx) => {
              const isSelected = selectedCardId === idx;

              return (
                <div
                  key={c.id || idx}
                  ref={(el) => (cardsRef.current[idx] = el)}
                  onClick={() => handleSelectCard(idx)}
                  className={`card-item relative w-24 sm:w-28 h-36 sm:h-40 cursor-pointer ${
                    isSelected ? 'card-selected-glow' : ''
                  }`}
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className="card-inner w-full h-full relative"
                    style={{
                      transformStyle: 'preserve-3d',
                      transition: isRevealing ? 'none' : 'transform 0.15s ease-out'
                    }}
                  >
                    {/* Back of Card (Face Down on Table) */}
                    <div
                      className={`card-face-back absolute inset-0 border flex flex-col items-center justify-between p-2 shadow-md ${
                        isSelected
                          ? 'bg-neutral-900 border-amber-400'
                          : 'bg-[#18181b] border-neutral-700 hover:border-neutral-400'
                      }`}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="w-full flex justify-between text-[9px] font-mono text-neutral-500">
                        <span>#</span>
                        <span>{idx + 1}</span>
                      </div>

                      {/* Geometric diamond pattern */}
                      <div className="w-10 h-10 border border-neutral-600 rotate-45 flex items-center justify-center">
                        <div className="w-4 h-4 bg-neutral-600 rotate-45" />
                      </div>

                      <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                        {isSelected ? 'Elegida' : 'Papelito'}
                      </span>
                    </div>

                    {/* Front of Card (Revealed Partner) */}
                    <div
                      className="card-face-front absolute inset-0 bg-white text-[#090a0f] border-2 border-[#090a0f] flex flex-col items-center justify-center p-2 shadow-2xl"
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
                              className="w-12 h-12 rounded-full object-cover border border-neutral-300 mb-1"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-neutral-200 text-[#090a0f] font-bold text-base flex items-center justify-center mb-1">
                              {revealedPartner.name.charAt(0)}
                            </div>
                          )}
                          <div className="text-[9px] font-mono uppercase text-neutral-500">
                            Tu Pareja
                          </div>
                          <div className="text-xs font-bold uppercase text-center truncate w-full">
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

          {/* Fixed bottom bar for Mobile & Sticky confirmation */}
          <div
            className={`fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-black/90 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-neutral-800 sm:border-0 z-40 transition-all ${
              selectedCardId !== null ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none sm:hidden'
            }`}
          >
            <div className="max-w-md mx-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmFlip}
                disabled={isRevealing}
                className="sharp-primary-btn w-full h-12 text-xs font-bold uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black border-0 shadow-lg"
              >
                {isRevealing ? 'Volteando papelito...' : 'Sí, dar vuelta a esta carta'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Sorteo Result Banner (100% Public Pairing) */
        <div className="sharp-card p-6 sm:p-10 bg-white border border-[#090a0f] shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="inline-block bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest">
            🎉 ¡Pareja #{revealedPair?.pairNumber || ''} Formada Oficialmente!
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#090a0f] uppercase tracking-tight">
            ¡Tu pareja asignada es {revealedPartner?.name}!
          </h2>

          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Esta unión es pública y ya ha sido publicada en el tablero general en tiempo real.
          </p>

          {/* Duo Visual Cards */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 pt-2">
            {/* Member 1: Current User */}
            <div className="flex flex-col items-center space-y-2 p-4 bg-neutral-50 border border-neutral-200 w-36 sm:w-44">
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-neutral-400"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-neutral-200 text-neutral-800 font-bold text-xl flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="text-[10px] font-mono text-neutral-400 uppercase">
                Integrante 1
              </div>
              <div className="text-sm font-bold uppercase text-[#090a0f] truncate w-full text-center">
                {currentUser.name}
              </div>
            </div>

            {/* Central Linking Icon */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#090a0f] text-white flex items-center justify-center font-bold text-lg shadow-md">
                ⇄
              </div>
              <span className="text-[9px] font-mono uppercase text-neutral-500 mt-1 font-semibold">
                Dúo
              </span>
            </div>

            {/* Member 2: Revealed Partner */}
            <div className="flex flex-col items-center space-y-2 p-4 bg-neutral-50 border border-neutral-200 w-36 sm:w-44">
              {revealedPartner?.photoUrl ? (
                <img
                  src={revealedPartner.photoUrl}
                  alt={revealedPartner.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-400"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-900 font-bold text-xl flex items-center justify-center border-2 border-amber-400">
                  {revealedPartner?.name.charAt(0)}
                </div>
              )}
              <div className="text-[10px] font-mono text-neutral-400 uppercase">
                Integrante 2
              </div>
              <div className="text-sm font-bold uppercase text-[#090a0f] truncate w-full text-center">
                {revealedPartner?.name}
              </div>
            </div>
          </div>

          {/* Return Button */}
          <div className="pt-4 max-w-sm mx-auto">
            <button
              type="button"
              onClick={onFinishAndReturn}
              className="sharp-primary-btn w-full h-12 text-xs font-bold uppercase"
            >
              Volver al tablero de parejas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
