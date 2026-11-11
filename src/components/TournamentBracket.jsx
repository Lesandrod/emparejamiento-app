'use client';

import React, { useState } from 'react';
import {
  playPunchImpact,
  playBoxingBell,
  playArenaCheer
} from '@/utils/audio';

export default function TournamentBracket({
  bracket,
  onRefreshBracket,
  onReDraw,
  onResetBracket,
  onBackToRoster,
  onOpenAdmin
}) {
  const [advancingMatchId, setAdvancingMatchId] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  // Mobile modes: 'rounds' (mobile-first stacked rounds) or 'tree' (full panoramic tree)
  const [viewMode, setViewMode] = useState('rounds');
  const [activeRoundNumber, setActiveRoundNumber] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(80); // 70%, 80%, 90%, 100%

  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="bg-surface-dim border border-outline-dim rounded-2xl p-6 sm:p-12 text-center shadow-lg">
        <span className="material-symbols-outlined text-4xl text-primary mb-3">
          account_tree
        </span>
        <h3 className="font-display font-bold text-base sm:text-lg text-white uppercase">
          Aún no se ha sorteado el Torneo del Poder
        </h3>
        <p className="text-xs text-on-surface-variant font-mono mt-1 mb-6 max-w-md mx-auto">
          Presiona "Sortear Torneo del Poder" en la pantalla principal para armar el fixture bilateral convergente.
        </p>
        <button
          onClick={onBackToRoster}
          type="button"
          className="px-5 py-2.5 rounded-lg bg-primary hover:bg-yellow-400 text-black text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md"
        >
          Volver a Peleadores
        </button>
      </div>
    );
  }

  const { rounds, champion, numByes, participantCount } = bracket;
  const totalRounds = rounds.length;
  // Ronda 1 (la de más combates) define la cantidad de "unidades" de la grilla:
  // cada combate de una ronda posterior ocupa 2x el ancho de la ronda anterior.
  const baseMatchCount = rounds[0]?.matches?.length || 1;

  const activeRoundData = rounds.find((r) => r.roundNumber === activeRoundNumber) || rounds[0];

  const handleSelectWinner = async (match, fighter) => {
    if (!fighter || !fighter.id || fighter.isBye) return;
    if (advancingMatchId) return;

    setAdvancingMatchId(match.id);
    const isUnmarking = match.winner && match.winner.id === fighter.id;
    if (!isUnmarking) {
      playPunchImpact();
      playBoxingBell(1);
    }

    try {
      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'advance',
          matchId: match.id,
          winnerId: fighter.id
        })
      });

      if (res.ok) {
        if (!isUnmarking && !match.nextMatchId) {
          // Final match won!
          setTimeout(() => {
            playArenaCheer();
            playBoxingBell(3);
          }, 300);
        }
        if (onRefreshBracket) await onRefreshBracket();
      }
    } catch (e) {
      console.error('Error al avanzar ganador:', e);
    } finally {
      setAdvancingMatchId(null);
    }
  };

  const handleReDraw = () => {
    if (onReDraw) {
      onReDraw();
    }
  };

  const handleReset = () => {
    if (onResetBracket) {
      onResetBracket();
    }
  };

  // Compact Match Card Renderer
  const renderMatchCard = (m, isCenter = false, isMobileCard = false) => {
    if (!m) return null;

    const hasWinner = Boolean(m.winner);
    const isF1Winner = m.winner && m.fighter1 && m.winner.id === m.fighter1.id;
    const isF2Winner = m.winner && m.fighter2 && m.winner.id === m.fighter2.id;

    return (
      <div
        key={m.id}
        className={`rounded-xl border transition-all relative flex flex-col shadow-md w-full ${
          isMobileCard ? 'p-2 sm:p-2.5 gap-1.5' : 'p-2 sm:p-2.5 gap-1 min-w-[165px] sm:min-w-[210px] md:min-w-[230px] max-w-[260px]'
        } ${
          isCenter
            ? 'bg-gradient-to-b from-[#1c1d24] via-[#14151a] to-[#101115] border-primary shadow-[0_0_20px_rgba(254,207,82,0.25)] ring-1 ring-primary/40'
            : hasWinner
            ? 'bg-surface-container border-primary/40'
            : 'bg-surface-container-low border-outline-dim hover:border-outline-subtle'
        }`}
      >
        {/* Match Header Tag */}
        <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono pb-1 border-b border-outline-dim/60 text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isCenter ? 'bg-primary' : m.side === 'left' ? 'bg-blue-400' : 'bg-red-400'}`}></span>
            <span className="font-bold text-primary uppercase">
              {isCenter ? 'GRAN FINAL' : `Bout #${m.matchNumber}`}
            </span>
            {m.side && !isCenter && (
              <span className={`text-[7px] px-1 py-0.2 rounded font-bold uppercase ${m.side === 'left' ? 'bg-blue-950 text-blue-300' : 'bg-red-950 text-red-300'}`}>
                {m.side === 'left' ? 'Izq' : 'Der'}
              </span>
            )}
          </div>

          <span className="text-[8px] uppercase tracking-wider font-semibold">
            {m.isByeMatch ? (
              <span className="text-primary font-bold">⭐ Pase Directo</span>
            ) : hasWinner ? (
              <span className="text-emerald-400 font-bold">✓ Definido</span>
            ) : (
              'En Espera'
            )}
          </span>
        </div>

        {/* Fighter 1 (Blue Corner) */}
        <div
          className={`rounded-lg p-1.5 flex items-center justify-between gap-1.5 border transition-all ${
            isF1Winner
              ? 'bg-blue-950/70 border-blue-500 shadow-sm'
              : m.fighter1?.isBye
              ? 'bg-surface-dim/40 border-dashed border-outline-dim opacity-70'
              : 'bg-surface-dim/90 border-outline-dim'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {m.fighter1?.photoUrl ? (
              <img
                src={m.fighter1.photoUrl}
                alt={m.fighter1.name}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-blue-400 flex-shrink-0"
              />
            ) : (
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-display font-bold text-[9px] sm:text-[10px] uppercase flex-shrink-0 ${
                  m.fighter1?.isBye
                    ? 'bg-amber-950/60 border border-primary/40 text-primary text-[8px]'
                    : 'bg-blue-950 border border-blue-500/40 text-blue-400'
                }`}
              >
                {m.fighter1?.isBye ? 'BYE' : m.fighter1 ? m.fighter1.name.substring(0, 2).toUpperCase() : '?'}
              </div>
            )}

            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-white truncate block uppercase leading-tight">
                {m.fighter1 ? m.fighter1.name : 'Por Definir'}
              </span>
              {m.fighter1?.alias && (
                <span className="text-[8px] font-mono text-primary font-bold block truncate leading-none">
                  "{m.fighter1.alias}"
                </span>
              )}
            </div>
          </div>

          {m.fighter1 && !m.fighter1.isBye && !m.isByeMatch && (
            <button
              onClick={() => handleSelectWinner(m, m.fighter1)}
              disabled={advancingMatchId === m.id}
              type="button"
              title={isF1Winner ? 'Ganador actual (Haz clic para desmarcar)' : 'Declarar ganador a esta esquina'}
              className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                isF1Winner
                  ? 'bg-primary text-black font-extrabold shadow ring-1 ring-primary/60 hover:bg-red-500 hover:text-white'
                  : 'bg-surface-container border border-outline-dim text-on-surface-variant hover:text-white hover:border-primary'
              }`}
            >
              {isF1Winner ? '✓ Ganó' : 'Ganador'}
            </button>
          )}

          {m.isByeMatch && isF1Winner && (
            <span className="text-[8px] font-mono font-bold text-primary uppercase whitespace-nowrap">
              Clasificado
            </span>
          )}
        </div>

        {/* Center VS Indicator */}
        <div className="flex items-center justify-center my-0.2">
          <span className="text-[7px] sm:text-[8px] font-display font-black text-outline-subtle uppercase tracking-widest leading-none">
            VS
          </span>
        </div>

        {/* Fighter 2 (Red Corner) */}
        <div
          className={`rounded-lg p-1.5 flex items-center justify-between gap-1.5 border transition-all ${
            isF2Winner
              ? 'bg-red-950/70 border-red-500 shadow-sm'
              : m.fighter2?.isBye
              ? 'bg-surface-dim/40 border-dashed border-outline-dim opacity-70'
              : 'bg-surface-dim/90 border-outline-dim'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {m.fighter2?.photoUrl ? (
              <img
                src={m.fighter2.photoUrl}
                alt={m.fighter2.name}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-red-400 flex-shrink-0"
              />
            ) : (
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-display font-bold text-[9px] sm:text-[10px] uppercase flex-shrink-0 ${
                  m.fighter2?.isBye
                    ? 'bg-amber-950/60 border border-primary/40 text-primary text-[8px]'
                    : 'bg-red-950 border border-red-500/40 text-red-400'
                }`}
              >
                {m.fighter2?.isBye ? 'BYE' : m.fighter2 ? m.fighter2.name.substring(0, 2).toUpperCase() : '?'}
              </div>
            )}

            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-white truncate block uppercase leading-tight">
                {m.fighter2 ? m.fighter2.name : 'Por Definir'}
              </span>
              {m.fighter2?.alias && (
                <span className="text-[8px] font-mono text-primary font-bold block truncate leading-none">
                  "{m.fighter2.alias}"
                </span>
              )}
            </div>
          </div>

          {m.fighter2 && !m.fighter2.isBye && !m.isByeMatch && (
            <button
              onClick={() => handleSelectWinner(m, m.fighter2)}
              disabled={advancingMatchId === m.id}
              type="button"
              title={isF2Winner ? 'Ganador actual (Haz clic para desmarcar)' : 'Declarar ganador a esta esquina'}
              className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                isF2Winner
                  ? 'bg-primary text-black font-extrabold shadow ring-1 ring-primary/60 hover:bg-red-500 hover:text-white'
                  : 'bg-surface-container border border-outline-dim text-on-surface-variant hover:text-white hover:border-primary'
              }`}
            >
              {isF2Winner ? '✓ Ganó' : 'Ganador'}
            </button>
          )}

          {m.isByeMatch && isF2Winner && (
            <span className="text-[8px] font-mono font-bold text-primary uppercase whitespace-nowrap">
              Clasificado
            </span>
          )}
        </div>
      </div>
    );
  };

  // Fila de conectores entre una ronda (arriba, menos combates) y la ronda anterior
  // (abajo, el doble de combates). Por cada combate de la ronda de arriba dibuja un
  // "tronco" dorado que baja y se bifurca en dos ramas curvas hacia sus dos combates
  // de origen, con un nodo luminoso en el punto de fusión.
  const renderConnectorRow = (pairCount, keyPrefix) => {
    const pairSpan = baseMatchCount / pairCount;
    return (
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${baseMatchCount}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: pairCount }).map((_, i) => (
          <div key={`${keyPrefix}_${i}`} style={{ gridColumn: `span ${pairSpan}` }} className="h-7 sm:h-11">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
              style={{ filter: 'drop-shadow(0 0 2px rgba(254,207,82,0.35))' }}
            >
              <path d="M50,0 Q50,55 25,55 L25,100" fill="none" stroke="#fecf52" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
              <path d="M50,0 Q50,55 75,55 L75,100" fill="none" stroke="#fecf52" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
              <circle cx="50" cy="2" r="7" fill="#fecf52" opacity="0.12" />
              <circle cx="50" cy="2" r="3" fill="#fecf52" opacity="0.9" />
            </svg>
          </div>
        ))}
      </div>
    );
  };

  // Medalla con el número de ronda + línea divisoria, usada como encabezado de cada
  // nivel del árbol vertical.
  const renderTierRail = (round, isFinalRound) => (
    <div className="w-full flex items-center gap-2 sm:gap-3 px-1 py-1.5">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-outline-dim to-outline-dim" />
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border whitespace-nowrap ${
          isFinalRound ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(254,207,82,0.2)]' : 'border-outline-dim bg-surface-container/70'
        }`}
      >
        <span
          className={`flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[8px] sm:text-[9px] font-black font-mono flex-shrink-0 ${
            isFinalRound ? 'bg-primary text-black' : 'bg-surface-container-high text-primary border border-primary/30'
          }`}
        >
          {String(round.roundNumber).padStart(2, '0')}
        </span>
        <span
          className={`text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest ${
            isFinalRound ? 'text-primary' : 'text-on-surface-variant'
          }`}
        >
          {isFinalRound ? 'Gran Final' : round.title}
        </span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-outline-dim to-outline-dim" />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* Top Controls Ribbon */}
      <div className="bg-surface-dim border border-outline-dim rounded-2xl p-3.5 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 shadow-lg">
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-black text-sm sm:text-lg text-white uppercase tracking-tight">
                Fixture • Torneo del Poder
              </h2>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-mono text-[9px] sm:text-[10px] font-bold uppercase whitespace-nowrap">
                {participantCount} Guerreros
              </span>
              {numByes > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-[9px] sm:text-[10px] font-bold uppercase whitespace-nowrap">
                  {numByes} Pase Libre
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
          <button
            onClick={onBackToRoster}
            type="button"
            className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-dim text-xs font-semibold text-on-surface transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            <span>Peleadores</span>
          </button>
          <button
            onClick={handleReDraw}
            disabled={isResetting}
            type="button"
            className="px-3 sm:px-4 py-1.5 rounded-lg bg-primary hover:bg-yellow-400 text-black text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-md flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">shuffle</span>
            <span>{isResetting ? 'Sorteando...' : 'Re-sortear'}</span>
          </button>
          <button
            onClick={handleReset}
            type="button"
            className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 hover:text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            title="Borrar árbol y resetear fixture"
          >
            <span className="material-symbols-outlined text-[14px]">delete_forever</span>
            <span>Borrar</span>
          </button>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              type="button"
              className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-dim text-on-surface-variant hover:text-white transition-colors cursor-pointer ml-auto md:ml-0"
              title="Panel Organizador"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE TOGGLE (OPTIMIZADO PARA MÓVIL Y DESKTOP) */}
      <div className="flex items-center justify-between gap-2 bg-surface-dim border border-outline-dim rounded-xl p-1.5">
        <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
          <button
            type="button"
            onClick={() => setViewMode('rounds')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'rounds'
                ? 'bg-primary text-black font-extrabold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">view_agenda</span>
            <span>Por Rondas (Móvil)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'tree'
                ? 'bg-primary text-black font-extrabold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">account_tree</span>
            <span>Árbol Panorámico ↔</span>
          </button>
        </div>

        {/* Zoom Controls when in Tree Mode */}
        {viewMode === 'tree' && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
            <span className="hidden sm:inline">Zoom:</span>
            {[70, 85, 100].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoomLevel(z)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  zoomLevel === z
                    ? 'bg-surface-container-high text-primary border border-primary/40 font-bold'
                    : 'hover:text-white'
                }`}
              >
                {z}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Champion Victory Banner (when Final is Won) */}
      {champion && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-primary p-4 sm:p-7 text-center shadow-[0_0_35px_rgba(254,207,82,0.25)] animate-fade-in">
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-primary text-black font-display font-black text-[9px] sm:text-xs uppercase tracking-widest shadow">
              🏆 CAMPEÓN INDISCUTIBLE
            </span>

            <div className="relative my-1">
              {champion.photoUrl ? (
                <img
                  src={champion.photoUrl}
                  alt={champion.name}
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-primary shadow-2xl"
                />
              ) : (
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center text-primary font-display font-black text-2xl uppercase">
                  {champion.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <h1 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight">
              {champion.name}
            </h1>
            {champion.alias && (
              <p className="text-xs sm:text-base font-mono text-primary font-bold">
                “{champion.alias}”
              </p>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 1. MODO POR RONDAS (IDEAL PARA MÓVILES - ULTRA LEGIBLE Y COMPACTO) */}
      {/* ================================================================= */}
      {viewMode === 'rounds' && (
        <div className="flex flex-col gap-3 bg-surface-dim border border-outline-dim rounded-2xl p-3 sm:p-5 shadow-xl">
          {/* Step Pill Tabs to navigate rounds smoothly */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-outline-dim scrollbar-none">
            {rounds.map((round) => {
              const isActive = round.roundNumber === activeRoundNumber;
              const isFinal = round.roundNumber === totalRounds;
              return (
                <button
                  key={round.roundNumber}
                  type="button"
                  onClick={() => setActiveRoundNumber(round.roundNumber)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? isFinal
                        ? 'bg-primary text-black shadow-md'
                        : 'bg-surface-container-high border border-primary text-primary shadow'
                      : 'bg-surface-container/60 hover:bg-surface-container text-zinc-400 hover:text-white border border-outline-dim'
                  }`}
                >
                  <span>{isFinal ? '🏆 Gran Final' : `R0${round.roundNumber} • ${round.title}`}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black/30 text-white' : 'bg-black/20 text-zinc-400'}`}>
                    {round.matches.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Round Title Info */}
          <div className="flex items-center justify-between text-xs font-mono px-1">
            <span className="text-primary font-bold uppercase tracking-wider">
              {activeRoundData.title} ({activeRoundData.matches.length} {activeRoundData.matches.length === 1 ? 'Combate' : 'Combates'})
            </span>
            <span className="text-[10px] text-zinc-400">
              Toca "Ganador" para clasificar a la siguiente ronda
            </span>
          </div>

          {/* Matches Grid of the Active Round (Responsive 1-2 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeRoundData.matches.map((m) =>
              renderMatchCard(m, activeRoundData.roundNumber === totalRounds, true)
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. MODO ÁRBOL PANORÁMICO — ESCALERA DEL PODER                      */}
      {/*    Ronda 1 abajo, el ganador sube nivel a nivel hasta el Campeón.  */}
      {/* ================================================================= */}
      {viewMode === 'tree' && (
        <div
          className="relative w-full rounded-2xl p-2.5 sm:p-5 md:p-6 overflow-x-auto overflow-y-hidden shadow-2xl border border-outline-dim"
          style={{
            background:
              'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(254,207,82,0.10), transparent 60%), linear-gradient(to bottom, #121318, #0a0a0c)'
          }}
        >
          {/* Subtle scroll reminder */}
          <div className="flex items-center justify-center gap-1.5 py-1 mb-2 rounded bg-surface-container/80 border border-outline-dim text-[10px] font-mono text-primary">
            <span className="material-symbols-outlined text-[13px]">trending_up</span>
            <span>Ronda 1 abajo • el ganador escala hasta coronarse Campeón</span>
          </div>

          <div
            className="transition-transform origin-top"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              width: zoomLevel < 100 ? `${(100 / zoomLevel) * 100}%` : '100%'
            }}
          >
            <div className="relative flex flex-col items-center gap-0 min-w-[640px] sm:min-w-[760px]">
              {/* Columna vertebral decorativa: traza la escalera del campeón */}
              <div
                className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, rgba(254,207,82,0.35), rgba(254,207,82,0.02))' }}
              />

              {/* CAMPEÓN DEL PODER (arriba de todo) */}
              <div className="relative flex flex-col items-center mb-1 z-10">
                {champion && (
                  <div className="absolute -inset-3 rounded-full bg-primary/25 blur-xl animate-pulse pointer-events-none" />
                )}
                <div
                  className={`relative w-11 h-11 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-xl mb-1 border-2 ${
                    champion
                      ? 'bg-gradient-to-br from-primary/30 via-surface-container to-surface-container border-primary'
                      : 'bg-surface-container border-primary/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl sm:text-2xl text-primary">emoji_events</span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest text-primary">
                  Campeón del Poder
                </span>
                {champion ? (
                  <div className="mt-1 p-1 rounded-xl bg-primary/10 border border-primary/40 flex flex-col items-center gap-0.5">
                    <span className="text-[10px] sm:text-xs font-black text-white uppercase truncate">
                      {champion.name}
                    </span>
                    {champion.alias && (
                      <span className="text-[8px] sm:text-[9px] font-mono text-primary font-bold">
                        “{champion.alias}”
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[8px] sm:text-[9px] font-mono text-on-surface-variant mt-0.5">
                    Esperando desenlace
                  </span>
                )}
                {/* Tallo que conecta la medalla con la Gran Final */}
                <div
                  className="w-px h-3 sm:h-5 mt-1"
                  style={{ background: 'linear-gradient(to bottom, rgba(254,207,82,0.7), rgba(254,207,82,0.1))' }}
                />
              </div>

              {/* NIVELES: de la Gran Final (arriba) a la Ronda 1 (abajo) */}
              {[...rounds].reverse().map((round, displayIdx) => {
                const isFinalRound = round.roundNumber === totalRounds;
                const spanPerMatch = baseMatchCount / round.matches.length;
                const isBottomRound = displayIdx === rounds.length - 1;

                return (
                  <React.Fragment key={round.roundNumber}>
                    {renderTierRail(round, isFinalRound)}

                    <div
                      className="relative grid w-full gap-2 sm:gap-3 z-10"
                      style={{ gridTemplateColumns: `repeat(${baseMatchCount}, minmax(0, 1fr))` }}
                    >
                      {round.matches.map((m) => (
                        <div key={m.id} style={{ gridColumn: `span ${spanPerMatch}` }} className="flex justify-center">
                          {renderMatchCard(m, isFinalRound, false)}
                        </div>
                      ))}
                    </div>

                    {/* Conector dorado hacia el nivel de abajo (más combates) */}
                    {!isBottomRound && renderConnectorRow(round.matches.length, `conn_${round.roundNumber}`)}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
