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
  const [mobileTab, setMobileTab] = useState('all'); // 'all', 'left', 'final', 'right'

  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="bg-surface-dim border border-outline-dim rounded-2xl p-8 sm:p-12 text-center shadow-lg">
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
  const finalRound = rounds[totalRounds - 1];
  const finalMatch = finalRound?.matches?.[0];

  // Separate non-final rounds into Left Wing and Right Wing
  const leftWingRounds = rounds.slice(0, totalRounds - 1).map((round) => ({
    ...round,
    matches: round.matches.filter((m) => m.side === 'left')
  }));

  const rightWingRounds = rounds.slice(0, totalRounds - 1).map((round) => ({
    ...round,
    matches: round.matches.filter((m) => m.side === 'right')
  }));

  const handleSelectWinner = async (match, fighter) => {
    if (!fighter || !fighter.id || fighter.isBye) return;
    if (advancingMatchId) return;

    setAdvancingMatchId(match.id);
    playPunchImpact();
    playBoxingBell(1);

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
        if (!match.nextMatchId) {
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

  // Match Card Renderer (compact and responsive)
  const renderMatchCard = (m, isCenter = false) => {
    if (!m) return null;

    const hasWinner = Boolean(m.winner);
    const isF1Winner = m.winner && m.fighter1 && m.winner.id === m.fighter1.id;
    const isF2Winner = m.winner && m.fighter2 && m.winner.id === m.fighter2.id;

    return (
      <div
        key={m.id}
        className={`rounded-xl border transition-all p-2.5 sm:p-3 relative flex flex-col gap-1.5 sm:gap-2 shadow-lg min-w-[195px] sm:min-w-[240px] max-w-full ${
          isCenter
            ? 'bg-gradient-to-b from-[#1c1d24] via-[#14151a] to-[#101115] border-primary shadow-[0_0_25px_rgba(254,207,82,0.25)] ring-1 ring-primary/40'
            : hasWinner
            ? 'bg-surface-container border-primary/40'
            : 'bg-surface-container-low border-outline-dim hover:border-outline-subtle'
        }`}
      >
        {/* Match Header Tag */}
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono pb-1 border-b border-outline-dim/60 text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isCenter ? 'bg-primary' : 'bg-blue-400'}`}></span>
            <span className="font-bold text-primary uppercase">
              {isCenter ? 'GRAN FINAL' : `Bout #${m.matchNumber}`}
            </span>
          </div>

          <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-semibold">
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
          className={`rounded-lg p-1.5 sm:p-2 flex items-center justify-between gap-1.5 sm:gap-2 border transition-all ${
            isF1Winner
              ? 'bg-blue-950/70 border-blue-500 shadow-sm'
              : m.fighter1?.isBye
              ? 'bg-surface-dim/40 border-dashed border-outline-dim opacity-70'
              : 'bg-surface-dim/90 border-outline-dim'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {m.fighter1?.photoUrl ? (
              <img
                src={m.fighter1.photoUrl}
                alt={m.fighter1.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-blue-400 flex-shrink-0"
              />
            ) : (
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-display font-bold text-[10px] sm:text-xs uppercase flex-shrink-0 ${
                  m.fighter1?.isBye
                    ? 'bg-amber-950/60 border border-primary/40 text-primary text-[9px]'
                    : 'bg-blue-950 border border-blue-500/40 text-blue-400'
                }`}
              >
                {m.fighter1?.isBye ? 'BYE' : m.fighter1 ? m.fighter1.name.substring(0, 2).toUpperCase() : '?'}
              </div>
            )}

            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-white truncate block uppercase">
                {m.fighter1 ? m.fighter1.name : 'Por Definir'}
              </span>
              {m.fighter1?.alias && (
                <span className="text-[8px] sm:text-[9px] font-mono text-primary font-bold block truncate">
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
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                isF1Winner
                  ? 'bg-primary text-black font-extrabold shadow'
                  : 'bg-surface-container border border-outline-dim text-on-surface-variant hover:text-white hover:border-primary'
              }`}
            >
              {isF1Winner ? '✓ Ganó' : 'Ganador'}
            </button>
          )}

          {m.isByeMatch && isF1Winner && (
            <span className="text-[8px] sm:text-[9px] font-mono font-bold text-primary uppercase whitespace-nowrap">
              Clasificado
            </span>
          )}
        </div>

        {/* Center VS Indicator */}
        <div className="flex items-center justify-center my-0.2">
          <span className="text-[8px] sm:text-[9px] font-display font-black text-outline-subtle uppercase tracking-widest">
            VS
          </span>
        </div>

        {/* Fighter 2 (Red Corner) */}
        <div
          className={`rounded-lg p-1.5 sm:p-2 flex items-center justify-between gap-1.5 sm:gap-2 border transition-all ${
            isF2Winner
              ? 'bg-red-950/70 border-red-500 shadow-sm'
              : m.fighter2?.isBye
              ? 'bg-surface-dim/40 border-dashed border-outline-dim opacity-70'
              : 'bg-surface-dim/90 border-outline-dim'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {m.fighter2?.photoUrl ? (
              <img
                src={m.fighter2.photoUrl}
                alt={m.fighter2.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-red-400 flex-shrink-0"
              />
            ) : (
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-display font-bold text-[10px] sm:text-xs uppercase flex-shrink-0 ${
                  m.fighter2?.isBye
                    ? 'bg-amber-950/60 border border-primary/40 text-primary text-[9px]'
                    : 'bg-red-950 border border-red-500/40 text-red-400'
                }`}
              >
                {m.fighter2?.isBye ? 'BYE' : m.fighter2 ? m.fighter2.name.substring(0, 2).toUpperCase() : '?'}
              </div>
            )}

            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-white truncate block uppercase">
                {m.fighter2 ? m.fighter2.name : 'Por Definir'}
              </span>
              {m.fighter2?.alias && (
                <span className="text-[8px] sm:text-[9px] font-mono text-primary font-bold block truncate">
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
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                isF2Winner
                  ? 'bg-primary text-black font-extrabold shadow'
                  : 'bg-surface-container border border-outline-dim text-on-surface-variant hover:text-white hover:border-primary'
              }`}
            >
              {isF2Winner ? '✓ Ganó' : 'Ganador'}
            </button>
          )}

          {m.isByeMatch && isF2Winner && (
            <span className="text-[8px] sm:text-[9px] font-mono font-bold text-primary uppercase whitespace-nowrap">
              Clasificado
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 select-none">
      {/* Top Controls Ribbon */}
      <div className="bg-surface-dim border border-outline-dim rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-black text-base sm:text-xl text-white uppercase tracking-tight">
                Fixture Bilateral • Torneo del Poder
              </h2>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-mono text-[10px] font-bold uppercase whitespace-nowrap">
                {participantCount} Guerreros
              </span>
              {numByes > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold uppercase whitespace-nowrap">
                  {numByes} Pase Libre
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-on-surface-variant font-mono mt-0.5 hidden sm:block">
              Estructura simétrica: los combates de ambos lados avanzan hacia el centro para disputar la Gran Final.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
          <button
            onClick={onBackToRoster}
            type="button"
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-dim text-xs font-semibold text-on-surface transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <span>Peleadores</span>
          </button>
          <button
            onClick={handleReDraw}
            disabled={isResetting}
            type="button"
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary hover:bg-yellow-400 text-black text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px]">shuffle</span>
            <span>{isResetting ? 'Sorteando...' : 'Re-sortear'}</span>
          </button>
          <button
            onClick={handleReset}
            type="button"
            className="px-3 py-1.5 sm:py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 hover:text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            title="Borrar árbol y resetear fixture"
          >
            <span className="material-symbols-outlined text-[15px]">delete_forever</span>
            <span>Borrar</span>
          </button>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              type="button"
              className="p-1.5 sm:p-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-dim text-on-surface-variant hover:text-white transition-colors cursor-pointer ml-auto md:ml-0"
              title="Panel Organizador"
            >
              <span className="material-symbols-outlined text-[17px]">tune</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Wing Switcher Navigation (visible on mobile / small screens) */}
      <div className="flex md:hidden items-center justify-between gap-1 p-1 bg-surface-dim border border-outline-dim rounded-xl overflow-x-auto text-[11px] font-mono font-bold">
        <button
          type="button"
          onClick={() => setMobileTab('all')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
            mobileTab === 'all'
              ? 'bg-primary text-black shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Todo el Árbol ↔
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('left')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
            mobileTab === 'left'
              ? 'bg-blue-500 text-white shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Ala Izquierda
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('final')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
            mobileTab === 'final'
              ? 'bg-amber-400 text-black shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Gran Final
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('right')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
            mobileTab === 'right'
              ? 'bg-red-500 text-white shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Ala Derecha
        </button>
      </div>

      {/* Champion Victory Banner (when Final is Won) */}
      {champion && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-primary p-5 sm:p-8 text-center shadow-[0_0_40px_rgba(254,207,82,0.25)] animate-fade-in">
          <div className="flex flex-col items-center justify-center gap-2 sm:gap-3">
            <span className="px-3 py-1 rounded-full bg-primary text-black font-display font-black text-[10px] sm:text-xs uppercase tracking-widest shadow">
              🏆 CAMPEÓN INDISCUTIBLE DEL TORNEO DEL PODER
            </span>

            <div className="relative my-1">
              {champion.photoUrl ? (
                <img
                  src={champion.photoUrl}
                  alt={champion.name}
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-primary shadow-2xl"
                />
              ) : (
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center text-primary font-display font-black text-2xl sm:text-3xl uppercase">
                  {champion.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black text-primary font-mono text-[9px] sm:text-[10px] font-bold border border-primary uppercase whitespace-nowrap shadow">
                CINTURÓN ORO
              </span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight drop-shadow-md">
              {champion.name}
            </h1>
            {champion.alias && (
              <p className="text-sm sm:text-lg font-mono text-primary font-bold">
                “{champion.alias}”
              </p>
            )}
            <p className="text-[11px] sm:text-xs font-mono text-zinc-300 max-w-md">
              Ha derrotado a todos sus oponentes y se alza con la gloria suprema en el octágono.
            </p>
          </div>
        </div>
      )}

      {/* MOBILE STACKED VIEW: ALA IZQUIERDA ONLY */}
      {mobileTab === 'left' && (
        <div className="flex md:hidden flex-col gap-5 bg-surface-dim border border-outline-dim rounded-2xl p-4 shadow-xl">
          <div className="border-b border-blue-500/30 pb-2 text-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400">
              CUADRO DE CLASIFICACIÓN
            </span>
            <h3 className="font-display font-black text-base text-white uppercase">
              ALA IZQUIERDA
            </h3>
          </div>
          {leftWingRounds.filter((r) => r.matches.length > 0).map((round) => (
            <div key={`m_left_${round.roundNumber}`} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span className="text-xs font-mono font-bold uppercase text-blue-400">
                  Ronda {round.roundNumber} • {round.title}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {round.matches.map((m) => renderMatchCard(m, false))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MOBILE STACKED VIEW: GRAN FINAL ONLY */}
      {mobileTab === 'final' && (
        <div className="flex md:hidden flex-col items-center gap-4 bg-surface-dim border border-primary/50 rounded-2xl p-5 shadow-xl">
          <div className="border-b border-primary/40 pb-2 text-center w-full">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
              EL CORAZÓN DEL OCTÁGONO
            </span>
            <h3 className="font-display font-black text-lg text-primary uppercase">
              GRAN FINAL DEL TORNEO
            </h3>
          </div>

          <div className="w-full py-2">
            {renderMatchCard(finalMatch, true)}
          </div>

          <div className="w-full pt-3 border-t border-dashed border-outline-dim flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-container border-2 border-primary flex items-center justify-center text-primary shadow-xl mb-1.5">
              <span className="material-symbols-outlined text-2xl">emoji_events</span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
              CAMPEÓN DEL PODER
            </span>
            {champion ? (
              <div className="mt-2 p-2 rounded-xl bg-primary/10 border border-primary/40 flex flex-col items-center gap-0.5 w-full">
                <span className="text-xs font-black text-white uppercase truncate w-full">
                  {champion.name}
                </span>
                {champion.alias && (
                  <span className="text-[10px] font-mono text-primary font-bold">
                    “{champion.alias}”
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[10px] font-mono text-on-surface-variant mt-1">
                Esperando el combate final
              </span>
            )}
          </div>
        </div>
      )}

      {/* MOBILE STACKED VIEW: ALA DERECHA ONLY */}
      {mobileTab === 'right' && (
        <div className="flex md:hidden flex-col gap-5 bg-surface-dim border border-outline-dim rounded-2xl p-4 shadow-xl">
          <div className="border-b border-red-500/30 pb-2 text-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400">
              CUADRO DE CLASIFICACIÓN
            </span>
            <h3 className="font-display font-black text-base text-white uppercase">
              ALA DERECHA
            </h3>
          </div>
          {[...rightWingRounds].filter((r) => r.matches.length > 0).reverse().map((round) => (
            <div key={`m_right_${round.roundNumber}`} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span className="text-xs font-mono font-bold uppercase text-red-400">
                  Ronda {round.roundNumber} • {round.title}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {round.matches.map((m) => renderMatchCard(m, false))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* THE BILATERAL CONVERGING BRACKET STAGE (VISIBLE ON DESKTOP & MOBILE WHEN TAB === 'all') */}
      <div
        className={`w-full bg-surface-dim border border-outline-dim rounded-2xl p-3 sm:p-6 md:p-8 overflow-x-auto shadow-2xl ${
          mobileTab !== 'all' ? 'hidden md:block' : 'block'
        }`}
      >
        {/* Horizontal scroll indicator banner for mobile */}
        <div className="flex md:hidden items-center justify-center gap-1.5 py-1.5 mb-3 rounded-lg bg-surface-container border border-outline-dim text-[10px] font-mono text-primary">
          <span className="material-symbols-outlined text-[14px]">swipe</span>
          <span>Desliza horizontalmente para ver todo el fixture</span>
        </div>

        <div className="flex items-stretch justify-between gap-4 sm:gap-8 md:gap-10 min-w-[860px] sm:min-w-[980px]">
          {/* ======================================================== */}
          {/* LEFT WING: FLOWS FROM LEFT TO RIGHT TOWARD CENTER        */}
          {/* ======================================================== */}
          <div className="flex-1 flex items-stretch gap-4 sm:gap-6 md:gap-8 justify-start">
            {leftWingRounds.filter((r) => r.matches.length > 0).map((round) => (
              <div
                key={`left_round_${round.roundNumber}`}
                className="flex-1 flex flex-col justify-around min-w-[195px] sm:min-w-[230px] max-w-[270px]"
              >
                {/* Round Header */}
                <div className="pb-2 sm:pb-3 mb-2 sm:mb-3 border-b border-outline-dim text-center">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400 block">
                    Ala Izquierda • R0{round.roundNumber}
                  </span>
                  <h3 className="font-display font-bold text-xs sm:text-sm text-white uppercase">
                    {round.title}
                  </h3>
                </div>

                {/* Matches */}
                <div className="flex flex-col justify-around gap-4 sm:gap-6 h-full py-1 sm:py-2">
                  {round.matches.map((m) => renderMatchCard(m, false))}
                </div>
              </div>
            ))}
          </div>

          {/* ======================================================== */}
          {/* CENTER STAGE: THE OCTAGON & GRAND FINAL BATTLE           */}
          {/* ======================================================== */}
          <div className="flex flex-col items-center justify-around min-w-[230px] sm:min-w-[280px] max-w-[330px] px-2 sm:px-4 border-x border-dashed border-outline-dim/70 relative">
            {/* Center Header */}
            <div className="pb-2 sm:pb-3 mb-2 sm:mb-3 border-b border-primary/50 text-center w-full">
              <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-primary block">
                EL CORAZÓN DEL OCTÁGONO
              </span>
              <h3 className="font-display font-black text-xs sm:text-base text-primary uppercase tracking-wide">
                GRAN FINAL DEL TORNEO
              </h3>
            </div>

            {/* Final Match Card */}
            <div className="w-full my-auto py-2 sm:py-4">
              {renderMatchCard(finalMatch, true)}
            </div>

            {/* Central Champion Trophy Pillar */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-dashed border-outline-dim/70 flex flex-col items-center text-center w-full">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-surface-container border-2 border-primary flex items-center justify-center text-primary shadow-xl mb-1 sm:mb-2">
                <span className="material-symbols-outlined text-2xl sm:text-3xl">emoji_events</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
                CAMPEÓN DEL PODER
              </span>
              {champion ? (
                <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 rounded-xl bg-primary/10 border border-primary/40 flex flex-col items-center gap-0.5 w-full">
                  <span className="text-[11px] sm:text-xs font-black text-white uppercase truncate w-full">
                    {champion.name}
                  </span>
                  {champion.alias && (
                    <span className="text-[9px] sm:text-[10px] font-mono text-primary font-bold">
                      “{champion.alias}”
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[9px] sm:text-[10px] font-mono text-on-surface-variant mt-1">
                  Esperando el desenlace final
                </span>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT WING: FLOWS FROM RIGHT TO LEFT TOWARD CENTER       */}
          {/* ======================================================== */}
          <div className="flex-1 flex items-stretch gap-4 sm:gap-6 md:gap-8 justify-end">
            {[...rightWingRounds].filter((r) => r.matches.length > 0).reverse().map((round) => (
              <div
                key={`right_round_${round.roundNumber}`}
                className="flex-1 flex flex-col justify-around min-w-[195px] sm:min-w-[230px] max-w-[270px]"
              >
                {/* Round Header */}
                <div className="pb-2 sm:pb-3 mb-2 sm:mb-3 border-b border-outline-dim text-center">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-red-400 block">
                    Ala Derecha • R0{round.roundNumber}
                  </span>
                  <h3 className="font-display font-bold text-xs sm:text-sm text-white uppercase">
                    {round.title}
                  </h3>
                </div>

                {/* Matches */}
                <div className="flex flex-col justify-around gap-4 sm:gap-6 h-full py-1 sm:py-2">
                  {round.matches.map((m) => renderMatchCard(m, false))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
