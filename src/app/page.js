'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ParticipantSelector from '@/components/ParticipantSelector';
import AdminModal from '@/components/AdminModal';
import PinPromptModal from '@/components/PinPromptModal';
import { playShuffleSound, playBoxingBell } from '@/utils/audio';

export default function Home() {
  const router = useRouter();
  const [participants, setParticipants] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [tournamentBracket, setTournamentBracket] = useState(null);
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

  const fetchTournamentData = async () => {
    try {
      const res = await fetch('/api/tournament');
      const data = await res.json();
      if (data.bracket && data.bracket.rounds?.length > 0) {
        setTournamentBracket(data.bracket);
      } else {
        setTournamentBracket(null);
      }
    } catch (e) {
      console.error('Error al cargar fixture:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchPairingData();
      await fetchTournamentData();
      setLoading(false);
    };
    init();

    // Auto-refresh every 6 seconds for live scoreboard
    const interval = setInterval(() => {
      fetchPairingData();
      fetchTournamentData();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Navegar directamente a la ruta /fixture sin reproducir animación
  const handleViewTree = () => {
    router.push('/fixture?direct=1');
  };

  // Trigger PIN Prompt to Sortear / Re-sortear y luego navegar a /fixture
  const handleRequestDraw = () => {
    if (participants.length < 2) {
      alert('Se necesitan al menos 2 peleadores registrados para sortear el torneo.');
      return;
    }

    setPinModal({
      isOpen: true,
      title: tournamentBracket ? 'Re-sortear Torneo' : 'Sortear Torneo del Poder',
      description: 'Ingresa la clave de organizador para generar un nuevo cuadro aleatorio y abrir el fixture.',
      actionLabel: 'Sortear',
      onConfirm: async (pin) => {
        await executeTournamentDraw(pin);
      }
    });
  };

  // Main Action: Instant Random Draw + Redirect to /fixture (PIN-Protected)
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
        // Redirigir de inmediato a la ruta del fixture donde corre la cinemática
        router.push('/fixture');
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
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error('Error al borrar el árbol:', e);
    }
  };

  return (
    <div className="min-h-full bg-surface-container-lowest text-on-surface font-sans flex flex-col antialiased selection:bg-[#d4af37] selection:text-black">
      {/* Shared Header Navigation */}
      <Header
        participantCount={participants.length}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content: Roster & Direct Tournament Draw Launchpad */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-6 lg:px-12 py-8 flex flex-col gap-8">
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
              Gestiona el roster de peleadores, genera el cuadro oficial de eliminación bilateral y abre la ruta del fixture con animación cinematográfica estilo Rocky.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* BOTÓN VER FIXTURE (PROMINENTE AMARILLO) */}
            <button
              onClick={handleViewTree}
              type="button"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-primary hover:bg-yellow-400 text-black font-display font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(254,207,82,0.4)] hover:shadow-[0_0_35px_rgba(254,207,82,0.6)] cursor-pointer flex items-center justify-center gap-2 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">account_tree</span>
              <span>Ver Fixture del Torneo</span>
            </button>

            {/* BOTÓN SORTEAR / RE-SORTEAR (MÁS PEQUEÑO Y DISCRETO) */}
            <button
              onClick={handleRequestDraw}
              disabled={isDrawingTournament || participants.length < 2}
              type="button"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-dim hover:border-primary/50 text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0 shadow-sm"
              title="Generar o reorganizar cruces aleatorios (requiere PIN)"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">shuffle</span>
              <span>
                {isDrawingTournament
                  ? 'Sorteando...'
                  : tournamentBracket
                  ? 'Re-sortear'
                  : 'Sortear Torneo'}
              </span>
            </button>

            {/* BOTÓN BORRAR ÁRBOL (DISCRETO / PELIGRO) */}
            {tournamentBracket && (
              <button
                onClick={handleRequestResetBracket}
                type="button"
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                title="Borrar árbol del torneo (requiere PIN)"
              >
                <span className="material-symbols-outlined text-[15px]">delete_forever</span>
                <span>Borrar Árbol</span>
              </button>
            )}
          </div>
        </div>

        {/* Fighter Roster Grid with Circular Photos & Aliases */}
        <ParticipantSelector
          participants={participants}
          pairs={pairs}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onRefreshParticipants={fetchPairingData}
        />
      </main>

      {/* Shared Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Admin Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        hasTournamentBracket={Boolean(tournamentBracket)}
        onResetTournament={handleRequestResetBracket}
        onRefreshParticipants={async () => {
          await fetchPairingData();
          await fetchTournamentData();
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
