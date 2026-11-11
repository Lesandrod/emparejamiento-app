'use client';

import React, { useState, useEffect } from 'react';
import ParticipantSelector from '@/components/ParticipantSelector';
import TournamentBracket from '@/components/TournamentBracket';
import RockyCinematicIntro from '@/components/RockyCinematicIntro';
import AdminModal from '@/components/AdminModal';
import PinPromptModal from '@/components/PinPromptModal';
import { playShuffleSound, playBoxingBell } from '@/utils/audio';

export default function Home() {
  const [participants, setParticipants] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [tournamentBracket, setTournamentBracket] = useState(null);
  const [viewMode, setViewMode] = useState('roster'); // 'roster', 'cinematic', 'bracket'
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDrawingTournament, setIsDrawingTournament] = useState(false);

  // PIN Prompt Modal State
  const [pinModal, setPinModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: '',
    onConfirm: null
  });

  const fetchPairingData = async () => {
    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      if (data.participants) {
        setParticipants(data.participants);
        setPairs(data.pairs || []);
      }
    } catch (e) {
      console.error('Error al cargar datos:', e);
    }
  };

  const fetchTournamentDataSilently = async () => {
    try {
      const res = await fetch('/api/tournament');
      const data = await res.json();
      if (data.bracket && data.bracket.rounds?.length > 0) {
        setTournamentBracket(data.bracket);
      } else {
        setTournamentBracket(null);
      }
    } catch (e) {
      console.error('Error al actualizar fixture:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchPairingData();
      try {
        const res = await fetch('/api/tournament');
        const data = await res.json();
        if (data.bracket && data.bracket.rounds?.length > 0) {
          setTournamentBracket(data.bracket);
          // Si ya hay árbol y entran/recargan, mostrar la animación cinemática primero
          setViewMode('cinematic');
        } else {
          setTournamentBracket(null);
          setViewMode('roster');
        }
      } catch (e) {
        console.error('Error al cargar fixture:', e);
        setViewMode('roster');
      } finally {
        setLoading(false);
      }
    };
    init();

    // Auto-refresh every 6 seconds for live scoreboard without changing viewMode
    const interval = setInterval(() => {
      fetchPairingData();
      fetchTournamentDataSilently();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Action: Launch Cinematic then View Tree
  const handleViewTree = () => {
    setViewMode('cinematic');
  };

  // Trigger PIN Prompt to Sortear / Re-sortear
  const handleRequestDraw = () => {
    if (participants.length < 2) {
      alert('Se necesitan al menos 2 peleadores registrados para sortear el torneo.');
      return;
    }

    setPinModal({
      isOpen: true,
      title: tournamentBracket ? 'Re-sortear Torneo' : 'Sortear Torneo del Poder',
      description: 'Ingresa la clave de organizador para generar un nuevo cruce de combates y actualizar el fixture.',
      actionLabel: 'Sortear',
      onConfirm: async (pin) => {
        await executeTournamentDraw(pin);
      }
    });
  };

  // Main Action: Instant Random Draw + Rocky Cinematic + Fixture Tree (PIN-Protected)
  const executeTournamentDraw = async (pin) => {
    setIsDrawingTournament(true);
    playShuffleSound();
    playBoxingBell(1);

    try {
      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draw', pin })
      });
      const data = await res.json();
      if (data.bracket) {
        setTournamentBracket(data.bracket);
        // Launch Rocky Movie Cinematic Sequence!
        setViewMode('cinematic');
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error('Error al sortear torneo:', e);
      alert('Error al generar el sorteo del torneo.');
    } finally {
      setIsDrawingTournament(false);
    }
  };

  // Trigger PIN Prompt to Reset Tree
  const handleRequestResetBracket = () => {
    setPinModal({
      isOpen: true,
      title: 'Borrar Árbol del Torneo',
      description: 'Ingresa la clave de organizador para BORRAR definitivamente el fixture actual.',
      actionLabel: 'Borrar Árbol',
      onConfirm: async (pin) => {
        await executeResetTournamentBracket(pin);
      }
    });
  };

  const executeResetTournamentBracket = async (pin) => {
    try {
      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', pin })
      });
      const data = await res.json();
      if (data.success) {
        setTournamentBracket(null);
        setViewMode('roster');
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error('Error al borrar el árbol:', e);
    }
  };

  return (
    <div className="min-h-full bg-surface-container-lowest text-on-surface font-sans flex flex-col antialiased selection:bg-[#d4af37] selection:text-black">
      {/* Sleek Minimalist Top Bar (Google Stitch UFC Design) */}
      <header className="border-b border-outline-dim bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1720px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          {/* Brand & Event Identity */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded bg-[#d4af37] text-black font-display font-black text-xl tracking-tighter leading-none shadow-sm">
                UFC
              </span>
              <span className="font-display font-bold text-xs sm:text-sm tracking-widest text-white uppercase">
                TORNEO DEL PODER
              </span>
            </div>
            <div className="h-4 w-px bg-outline-dim hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-surface-container text-[#d4af37] font-mono text-[11px] font-bold tracking-wider uppercase border border-[#d4af37]/30">
                EDICIÓN OFICIAL
              </span>
              <span className="text-xs text-on-surface-variant font-medium hidden md:inline">
                / FIXTURE STUDIO
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('roster')}
              className={`px-3.5 py-2 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'roster'
                  ? 'text-white border-b-2 border-[#d4af37]'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px] text-[#d4af37]">groups</span>
              <span>Peleadores ({participants.length})</span>
            </button>

            {tournamentBracket && (
              <button
                type="button"
                onClick={handleViewTree}
                className={`px-3.5 py-2 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'bracket'
                    ? 'text-white border-b-2 border-[#d4af37]'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[15px] text-[#d4af37]">account_tree</span>
                <span>Árbol Fixture</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="px-3.5 py-2 text-on-surface-variant hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">tune</span>
              <span>Organizador [PIN]</span>
            </button>
          </nav>

          {/* Broadcast Status & Quick Actions */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container border border-outline-dim">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-[10px] font-mono font-semibold tracking-wider text-on-surface uppercase">
                TORNEO EN VIVO
              </span>
            </div>

            <div className="h-3 w-px bg-outline-dim hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 text-on-surface-variant font-mono text-[11px]">
              <span className="text-outline-subtle">Roster:</span>
              <span className="px-2 py-0.5 rounded bg-surface-container text-white font-medium">
                {participants.length} Peleadores
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-6 lg:px-12 py-8 flex flex-col gap-8">
        {/* Rocky Cinematic Movie Sequence */}
        {viewMode === 'cinematic' && (
          <RockyCinematicIntro onFinish={() => setViewMode('bracket')} />
        )}

        {/* View Mode: Tournament Bracket Tree */}
        {viewMode === 'bracket' && (
          <TournamentBracket
            bracket={tournamentBracket}
            onRefreshBracket={fetchTournamentDataSilently}
            onReDraw={handleRequestDraw}
            onResetBracket={handleRequestResetBracket}
            onBackToRoster={() => setViewMode('roster')}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
        )}

        {/* View Mode: Roster & Direct Tournament Draw Launchpad */}
        {viewMode === 'roster' && (
          <>
            {/* HERO TOURNAMENT DRAW BANNER */}
            <div className="bg-gradient-to-r from-surface-dim via-surface-container to-surface-dim border-2 border-primary/40 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-widest">
                    UFC • SORTEO DIRECTO DE ELIMINACIÓN
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-display font-black text-white uppercase tracking-tight">
                  Torneo del Poder
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant font-mono mt-1.5 max-w-xl">
                  Presiona el botón para sortear automáticamente todas las parejas del torneo, iniciar la secuencia cinemática estilo Rocky y revelar el fixture oficial de eliminación directa.
                </p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                {tournamentBracket && (
                  <>
                    <button
                      onClick={handleViewTree}
                      type="button"
                      className="w-full sm:w-auto px-6 py-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-primary/60 text-primary hover:text-white font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">account_tree</span>
                      <span>Ver Árbol Fixture</span>
                    </button>
                    <button
                      onClick={handleRequestResetBracket}
                      type="button"
                      className="w-full sm:w-auto px-5 py-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 hover:text-white font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                      title="Borrar árbol del torneo"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                      <span>Borrar Árbol</span>
                    </button>
                  </>
                )}

                <button
                  onClick={handleRequestDraw}
                  disabled={isDrawingTournament || participants.length < 2}
                  type="button"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-yellow-400 text-black font-display font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(254,207,82,0.4)] hover:shadow-[0_0_35px_rgba(254,207,82,0.6)] cursor-pointer flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">sports_mma</span>
                  <span>
                    {isDrawingTournament
                      ? 'Sorteando...'
                      : tournamentBracket
                      ? 'Re-sortear Torneo'
                      : 'Sortear Torneo del Poder'}
                  </span>
                </button>
              </div>
            </div>

            {/* Fighter Roster Grid with Circular Photos & Aliases */}
            <ParticipantSelector
              participants={participants}
              pairs={pairs}
              onOpenAdmin={() => setIsAdminOpen(true)}
              onRefreshParticipants={fetchPairingData}
            />
          </>
        )}
      </main>

      {/* Minimalist Footer */}
      <footer className="mt-auto border-t border-[rgba(255,255,255,0.07)] bg-[#090a0d] py-5 text-xs text-zinc-500">
        <div className="max-w-[1720px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-display font-bold text-white tracking-wider text-sm">TORNEO DEL PODER</span>
            <span>•</span>
            <span>Fixture & Matchmaker Studio</span>
            <span>•</span>
            <span className="text-zinc-600">Reglamento Oficial MMA</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Panel Organizador [PIN]
            </button>
            <span>•</span>
            <span className="text-zinc-600">v3.5.0</span>
          </div>
        </div>
      </footer>

      {/* Admin Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        hasTournamentBracket={Boolean(tournamentBracket)}
        onResetTournament={handleRequestResetBracket}
        onRefreshParticipants={async () => {
          await fetchPairingData();
          await fetchTournamentDataSilently();
        }}
      />

      {/* PIN Authorization Modal for Draw, Re-draw, and Reset */}
      <PinPromptModal
        isOpen={pinModal.isOpen}
        title={pinModal.title}
        description={pinModal.description}
        actionLabel={pinModal.actionLabel}
        onConfirm={pinModal.onConfirm}
        onClose={() => setPinModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
