'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TournamentBracket from '@/components/TournamentBracket';
import RockyCinematicIntro from '@/components/RockyCinematicIntro';
import AdminModal from '@/components/AdminModal';
import PinPromptModal from '@/components/PinPromptModal';
import { playShuffleSound, playBoxingBell } from '@/utils/audio';

export default function FixturePage() {
  const router = useRouter();
  const [bracket, setBracket] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('direct') === '1') {
        window.history.replaceState(null, '', '/fixture');
        return false;
      }
    }
    return true; // Al recargar o ingresar directamente a la URL muestra la animación
  });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // PIN Prompt Modal State
  const [pinModal, setPinModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: '',
    onConfirm: null
  });

  const fetchBracket = async () => {
    try {
      const res = await fetch('/api/tournament');
      const data = await res.json();
      if (data.bracket && data.bracket.rounds?.length > 0) {
        setBracket(data.bracket);
      } else {
        setBracket(null);
      }
    } catch (e) {
      console.error('Error al cargar fixture:', e);
    }
  };

  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      if (data.participants) {
        setParticipants(data.participants);
      }
    } catch (e) {
      console.error('Error al cargar participantes:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchParticipants();
      await fetchBracket();
      setLoading(false);
    };
    init();

    // Auto-refresh every 6 seconds for live bracket updates
    const interval = setInterval(() => {
      fetchParticipants();
      fetchBracket();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Re-sortear Torneo desde /fixture con PIN
  const handleRequestDraw = () => {
    setPinModal({
      isOpen: true,
      title: 'Re-sortear Torneo del Poder',
      description: 'Ingresa la clave de organizador para generar un nuevo cuadro aleatorio y relanzar el fixture.',
      actionLabel: 'Re-sortear',
      onConfirm: async (pin) => {
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
            setBracket(data.bracket);
            // Relanzar la animación cinemática estilo Rocky
            setShowIntro(true);
          } else if (data.error) {
            alert(data.error);
          }
        } catch (e) {
          console.error('Error al re-sortear:', e);
          alert('Error al re-sortear el torneo.');
        }
      }
    });
  };

  // Borrar Árbol desde /fixture con PIN
  const handleRequestResetBracket = () => {
    setPinModal({
      isOpen: true,
      title: 'Borrar Árbol del Torneo',
      description: 'Ingresa la clave de organizador para BORRAR el árbol del fixture y regresar al inicio.',
      actionLabel: 'Borrar Árbol',
      onConfirm: async (pin) => {
        try {
          const res = await fetch('/api/tournament', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset', pin })
          });
          const data = await res.json();
          if (data.success) {
            setBracket(null);
            router.push('/');
          } else if (data.error) {
            alert(data.error);
          }
        } catch (e) {
          console.error('Error al borrar el árbol:', e);
        }
      }
    });
  };

  return (
    <div className="min-h-full bg-surface-container-lowest text-on-surface font-sans flex flex-col antialiased selection:bg-[#d4af37] selection:text-black">
      {/* Shared Header Navigation */}
      <Header
        participantCount={participants.length}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-6 lg:px-12 py-8 flex flex-col gap-8">
        {/* Rocky Cinematic Movie Sequence (se muestra al entrar, recargar o re-sortear) */}
        {showIntro && (
          <RockyCinematicIntro
            hasBracket={Boolean(bracket && bracket.rounds?.length > 0)}
            onFinish={() => setShowIntro(false)}
            onGoHome={() => router.push('/')}
          />
        )}

        {/* Fixture Bilateral Convergente */}
        {!showIntro && (
          <TournamentBracket
            bracket={bracket}
            onRefreshBracket={fetchBracket}
            onReDraw={handleRequestDraw}
            onResetBracket={handleRequestResetBracket}
            onBackToRoster={() => router.push('/')}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
        )}
      </main>

      {/* Shared Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        hasTournamentBracket={Boolean(bracket)}
        onResetTournament={handleRequestResetBracket}
        onRefreshParticipants={async () => {
          await fetchParticipants();
          await fetchBracket();
        }}
      />

      {/* PIN Authorization Modal */}
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
