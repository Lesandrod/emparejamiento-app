'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import BoxingFightAnimation from './BoxingFightAnimation';
import {
  playWhoosh,
  playClickSound,
  playCardFlipSound,
  playBoxingBell
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

  // Eligible opponents for this sparring draw
  const candidatePool = participants.filter(
    (p) => !p.revealed && p.id !== currentUser.id
  );

  // Initial dealing animation with athletic speed
  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.card-item');

    gsap.fromTo(
      cards,
      { y: 35, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.035,
        duration: 0.35,
        ease: 'power2.out',
        clearProps: 'all'
      }
    );
  }, []);

  // Chocolatear (Fast snappy shuffle with boxing whoosh)
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
      duration: 0.16,
      ease: 'power2.inOut'
    })
      .to(cards, {
        x: () => (Math.random() - 0.5) * 25,
        y: () => (Math.random() - 0.5) * 16,
        rotationZ: () => (Math.random() - 0.5) * 15,
        duration: 0.16,
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

  // Select card
  const handleSelectCard = (index) => {
    if (isChocolateando || isRevealing || showFightAnimation) return;
    playClickSound();
    setSelectedCardId(index);
  };

  // Confirm Selection & 3D Flip with Hand, then launch Boxing Fight
  const handleConfirmFlip = async () => {
    if (selectedCardId === null || isRevealing || showFightAnimation) return;
    setIsRevealing(true);
    setErrorMessage('');

    let partnerData = null;
    let pairData = null;

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
      partnerData = data.partner;
      pairData = data.pair;
      setRevealedPartner(data.partner);
      setRevealedPair(data.pair);
    } catch (e) {
      setErrorMessage(e.message);
      setIsRevealing(false);
      return;
    }

    // 3D Flip
    const targetCard = cardsRef.current[selectedCardId];
    const hand = handRef.current;

    if (targetCard && hand) {
      const cardRect = targetCard.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const targetX = cardRect.left - containerRect.left + cardRect.width / 2;
      const targetY = cardRect.top - containerRect.top + cardRect.height / 2;

      const flipTl = gsap.timeline();

      // Hand enters
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

      // Lift card
      flipTl.to([hand, targetCard], {
        y: '-=16',
        scale: 1.05,
        duration: 0.18,
        ease: 'power1.inOut',
        onStart: () => playCardFlipSound()
      });

      // 3D Card Flip
      const innerCard = targetCard.querySelector('.card-inner');
      flipTl.to(
        innerCard,
        {
          rotateY: 180,
          duration: 0.5,
          ease: 'power2.inOut'
        },
        '+=0.04'
      );

      // Hand withdraws
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

      // Trigger Boxing Fight Animation after flip
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
      {/* Photorealistic Hand for card flip */}
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

      {/* Top Header Card (Blue Corner Fighter) */}
      <div className="fight-card-blue p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {currentUser.photoUrl ? (
            <img
              src={currentUser.photoUrl}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.6)] flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-900 border-2 border-blue-400 text-blue-200 flex items-center justify-center font-black text-base uppercase flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold flex items-center gap-1.5">
              <span>🔵 ESQUINA AZUL • PELEADOR EN RING</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase italic">
              {currentUser.name}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleChocolatear}
            disabled={isChocolateando || isRevealing}
            className="fight-btn-blue px-3.5 h-10 text-[11px] font-mono flex items-center gap-1.5"
          >
            <span>🥊</span> {isChocolateando ? 'Mezclando...' : 'Chocolatear cartas'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isChocolateando || isRevealing}
            className="px-3 h-10 text-xs font-mono uppercase text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs font-mono text-center">
          {errorMessage}
        </div>
      )}

      {/* Main Table: The Sparring Ring Canvas */}
      <div className="fight-card p-5 sm:p-8 bg-[#090d18] border border-blue-900/40 space-y-6 relative overflow-hidden boxing-ring-ropes pt-7">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
          <span>
            {selectedCardId !== null
              ? 'Rival seleccionado • Confirma para subir al ring'
              : 'Toca una carta para elegir tu rival a ciegas'}
          </span>
          <span className="text-amber-400 font-bold">
            {candidatePool.length} rivales en mesa
          </span>
        </div>

        {/* Cards Grid: 3 per row on mobile */}
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
                  {/* Back of Card (Red Corner Sparring Card) */}
                  <div
                    className={`card-face-back absolute inset-0 border flex flex-col items-center justify-between p-2 shadow-xl ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#38060c] to-[#160305] border-amber-400'
                        : 'bg-gradient-to-b from-[#180407] to-[#0c0204] border-red-900/60 hover:border-red-500'
                    }`}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="w-full flex justify-between text-[9px] font-mono text-red-400 font-bold">
                      <span>RIVAL</span>
                      <span>#{idx + 1}</span>
                    </div>

                    {/* Boxing Gloves Icon Graphic */}
                    <div className="w-10 h-10 flex items-center justify-center text-xl filter drop-shadow">
                      🥊
                    </div>

                    <span className="text-[9px] font-mono uppercase tracking-widest text-red-300 font-bold">
                      {isSelected ? 'Elegido' : 'Esquina Roja'}
                    </span>
                  </div>

                  {/* Front of Card (Revealed Partner) */}
                  <div
                    className="card-face-front absolute inset-0 bg-[#160305] text-white border-2 border-red-500 flex flex-col items-center justify-center p-2 shadow-2xl"
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
                            className="w-12 h-12 rounded-full object-cover border-2 border-red-400 mb-1"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-red-900 text-white font-bold text-base flex items-center justify-center mb-1 border-2 border-red-400">
                            {revealedPartner.name.charAt(0)}
                          </div>
                        )}
                        <div className="text-[8px] font-mono uppercase text-red-400 font-bold">
                          🔴 Esquina Roja
                        </div>
                        <div className="text-xs font-black uppercase text-center truncate w-full text-white">
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
          className={`fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-[#060911]/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-red-900/60 sm:border-0 z-40 transition-all ${
            selectedCardId !== null ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none sm:hidden'
          }`}
        >
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={handleConfirmFlip}
              disabled={isRevealing}
              className="fight-btn-gold w-full h-12 text-xs font-black uppercase tracking-wider"
            >
              {isRevealing ? '¡Subiendo al ring...!' : '🥊 ¡Confirmar rival y pelear!'}
            </button>
          </div>
        </div>
      </div>

      {/* Epic Boxing Fight Animation Overlay */}
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
