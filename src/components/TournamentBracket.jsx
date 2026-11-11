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
  onBackToRoster,
  onOpenAdmin
}) {
  const [advancingMatchId, setAdvancingMatchId] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="bg-surface-dim border border-outline-dim rounded-xl p-12 text-center shadow-lg">
        <span className="material-symbols-outlined text-4xl text-primary mb-3">
          account_tree
        </span>
        <h3 className="font-display font-bold text-lg text-white uppercase">
          Aún no se ha sorteado el Torneo del Poder
        </h3>
        <p className="text-xs text-on-surface-variant font-mono mt-1 mb-6">
          Presiona "Iniciar Sorteo del Torneo" en la pantalla principal para armar el fixture de eliminación directa.
        </p>
        <button
          onClick={onBackToRoster}
          type="button"
          className="px-6 py-2.5 rounded-lg bg-primary hover:bg-yellow-400 text-black text-xs font-bold uppercase tracking-wider"
        >
          Volver a Peleadores
        </button>
      </div>
    );
  }

  const { rounds, champion } = bracket;

  const handleSelectWinner = async (match, fighter) => {
    if (!fighter || !fighter.id) return;
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
          // Final bout won! Arena roar
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

  const handleReDraw = async () => {
    if (!window.confirm('¿Deseas re-sortear el Torneo del Poder? Esto generará un nuevo fixture aleatorio.')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draw' })
      });
      if (res.ok && onRefreshBracket) {
        await onRefreshBracket();
      }
    } catch (e) {
      console.error('Error al re-sortear:', e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none">
      {/* Top Controls Ribbon */}
      <div className="bg-surface-dim border border-outline-dim rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-tight">
                Árbol Oficial del Torneo del Poder
              </h2>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-mono text-[10px] font-bold uppercase">
                {bracket.bracketSize} Peleadores
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono">
              Haz clic en "Ganador" en cada combate para avanzar al peleador a la siguiente ronda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
          <button
            onClick={onBackToRoster}
            type="button"
            className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-dim text-xs font-semibold text-on-surface transition-colors cursor-pointer"
          >
            ← Peleadores
          </button>
          <button
            onClick={handleReDraw}
            disabled={isResetting}
            type="button"
            className="px-4 py-2 rounded-lg bg-primary hover:bg-yellow-400 text-black text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-md"
          >
            {isResetting ? 'Sorteando...' : 'Re-sortear Torneo'}
          </button>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              type="button"
              className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-dim text-on-surface-variant hover:text-white transition-colors cursor-pointer"
              title="Panel Organizador"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </button>
          )}
        </div>
      </div>

      {/* Champion Victory Banner (if tournament completed) */}
      {champion && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-primary p-6 sm:p-8 text-center shadow-[0_0_40px_rgba(254,207,82,0.25)] animate-fade-in">
          <div className="flex flex-col items-center justify-center gap-3">
            <span className="px-3 py-1 rounded-full bg-primary text-black font-display font-black text-xs uppercase tracking-widest shadow">
              🏆 CAMPEÓN INDISCUTIBLE
            </span>

            <div className="relative my-1">
              {champion.photoUrl ? (
                <img
                  src={champion.photoUrl}
                  alt={champion.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-primary shadow-2xl"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center text-primary font-display font-black text-3xl uppercase">
                  {champion.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black text-primary font-mono text-[10px] font-bold border border-primary uppercase whitespace-nowrap shadow">
                ORO TORNEO
              </span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl text-white uppercase tracking-tight drop-shadow-md">
              {champion.name}
            </h1>
            {champion.alias && (
              <p className="text-base sm:text-lg font-mono text-primary font-bold">
                “{champion.alias}”
              </p>
            )}
            <p className="text-xs font-mono text-zinc-300 max-w-md">
              Ganador invicto del Torneo del Poder. Se corona como el máximo contendiente de la división.
            </p>
          </div>
        </div>
      )}

      {/* THE BRACKET TREE: HORIZONTAL STAGE */}
      <div className="w-full bg-surface-dim border border-outline-dim rounded-2xl p-4 sm:p-8 overflow-x-auto shadow-2xl">
        <div className="flex items-stretch gap-8 sm:gap-12 min-w-[780px] justify-between">
          {rounds.map((round, rIdx) => {
            const isFinal = rIdx === rounds.length - 1;

            return (
              <div
                key={round.roundNumber}
                className="flex-1 flex flex-col justify-around min-w-[240px] max-w-[320px] relative"
              >
                {/* Round Header */}
                <div className="pb-4 mb-4 border-b border-outline-dim text-center">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary block">
                    Ronda 0{round.roundNumber}
                  </span>
                  <h3 className="font-display font-bold text-sm sm:text-base text-white uppercase tracking-wide">
                    {round.title}
                  </h3>
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    {round.matches.length} {round.matches.length === 1 ? 'Combate' : 'Combates'}
                  </span>
                </div>

                {/* Matches in this Round */}
                <div className="flex flex-col justify-around gap-6 h-full py-2">
                  {round.matches.map((m) => {
                    const hasWinner = Boolean(m.winner);
                    const isF1Winner = m.winner && m.fighter1 && m.winner.id === m.fighter1.id;
                    const isF2Winner = m.winner && m.fighter2 && m.winner.id === m.fighter2.id;

                    return (
                      <div
                        key={m.id}
                        className={`rounded-xl border transition-all p-3 relative flex flex-col gap-2 shadow-md ${
                          hasWinner
                            ? 'bg-surface-container border-primary/50 ring-1 ring-primary/20'
                            : 'bg-surface-container-low border-outline-dim'
                        }`}
                      >
                        {/* Bout Tag */}
                        <div className="flex items-center justify-between text-[10px] font-mono pb-1 border-b border-outline-dim/60 text-on-surface-variant">
                          <span className="font-bold text-primary">
                            Bout #{m.matchNumber}
                          </span>
                          <span>
                            {hasWinner ? '✓ Finalizado' : 'En Espera'}
                          </span>
                        </div>

                        {/* Blue Fighter */}
                        <div
                          className={`rounded-lg p-2 flex items-center justify-between gap-2 border transition-colors ${
                            isF1Winner
                              ? 'bg-blue-950/60 border-blue-500 shadow-sm'
                              : 'bg-surface-dim/80 border-outline-dim'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {m.fighter1?.photoUrl ? (
                              <img
                                src={m.fighter1.photoUrl}
                                alt={m.fighter1.name}
                                className="w-8 h-8 rounded-full object-cover border border-blue-400 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-500/40 text-blue-400 flex items-center justify-center font-display font-bold text-xs uppercase flex-shrink-0">
                                {m.fighter1 ? m.fighter1.name.substring(0, 2).toUpperCase() : '?'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white truncate block uppercase">
                                {m.fighter1 ? m.fighter1.name : 'Por Definir'}
                              </span>
                              {m.fighter1?.alias && (
                                <span className="text-[9px] font-mono text-primary font-bold block truncate">
                                  "{m.fighter1.alias}"
                                </span>
                              )}
                            </div>
                          </div>

                          {m.fighter1 && (
                            <button
                              onClick={() => handleSelectWinner(m, m.fighter1)}
                              disabled={advancingMatchId === m.id}
                              type="button"
                              className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                                isF1Winner
                                  ? 'bg-primary text-black font-extrabold shadow'
                                  : 'bg-surface-container border border-outline-dim text-on-surface-variant hover:text-white hover:border-primary'
                              }`}
                              title="Declarar Ganador"
                            >
                              {isF1Winner ? '✓ Ganador' : 'Ganador'}
                            </button>
                          )}
                        </div>

                        {/* Matchup Center VS */}
                        <div className="flex items-center justify-center my-0.5">
                          <span className="text-[9px] font-display font-black text-outline-subtle uppercase tracking-widest">
                            VS
                          </span>
                        </div>

                        {/* Red Fighter */}
                        <div
                          className={`rounded-lg p-2 flex items-center justify-between gap-2 border transition-colors ${
                            isF2Winner
                              ? 'bg-red-950/60 border-red-500 shadow-sm'
                              : 'bg-surface-dim/80 border-outline-dim'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {m.fighter2?.photoUrl ? (
                              <img
                                src={m.fighter2.photoUrl}
                                alt={m.fighter2.name}
                                className="w-8 h-8 rounded-full object-cover border border-red-400 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-red-950 border border-red-500/40 text-red-400 flex items-center justify-center font-display font-bold text-xs uppercase flex-shrink-0">
                                {m.fighter2 ? m.fighter2.name.substring(0, 2).toUpperCase() : '?'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white truncate block uppercase">
                                {m.fighter2 ? m.fighter2.name : 'Por Definir'}
                              </span>
                              {m.fighter2?.alias && (
                                <span className="text-[9px] font-mono text-primary font-bold block truncate">
                                  "{m.fighter2.alias}"
                                </span>
                              )}
                            </div>
                          </div>

                          {m.fighter2 && (
                            <button
                              onClick={() => handleSelectWinner(m, m.fighter2)}
                              disabled={advancingMatchId === m.id}
                              type="button"
                              className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                                isF2Winner
                                  ? 'bg-primary text-black font-extrabold shadow'
                                  : 'bg-surface-container border border-outline-dim text-on-surface-variant hover:text-white hover:border-primary'
                              }`}
                              title="Declarar Ganador"
                            >
                              {isF2Winner ? '✓ Ganador' : 'Ganador'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Final Trophy Pillar */}
          <div className="flex flex-col items-center justify-center min-w-[200px] border-l border-dashed border-outline-dim pl-6 py-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container border-2 border-primary flex items-center justify-center text-primary shadow-xl mb-3">
              <span className="material-symbols-outlined text-3xl">emoji_events</span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
              CINTURÓN OFICIAL
            </span>
            <h4 className="font-display font-black text-sm text-white uppercase mt-0.5">
              Campeón del Poder
            </h4>
            {champion ? (
              <div className="mt-3 p-2 rounded-xl bg-surface-container border border-primary/40 flex flex-col items-center gap-1 w-full">
                <span className="text-xs font-bold text-white uppercase truncate w-full">
                  {champion.name}
                </span>
                {champion.alias && (
                  <span className="text-[10px] font-mono text-primary font-bold">
                    “{champion.alias}”
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[10px] font-mono text-on-surface-variant mt-2">
                Esperando la Gran Final
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
