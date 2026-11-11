'use client';

import React, { useState, useEffect } from 'react';
import ParticipantSelector from '@/components/ParticipantSelector';
import Roulette from '@/components/Roulette';
import AdminModal from '@/components/AdminModal';

export default function Home() {
  const [participants, setParticipants] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPairingData();

    // Auto-refresh every 6 seconds for live scoreboard
    const interval = setInterval(() => {
      fetchPairingData();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectParticipant = (user) => {
    setActiveUser(user);
  };

  const handleFinishAndReturn = async () => {
    setActiveUser(null);
    await fetchPairingData();
  };

  return (
    <div className="min-h-full bg-surface-container-lowest text-on-surface font-sans flex flex-col antialiased selection:bg-[#d4af37] selection:text-black">
      {/* Sleek Minimalist Top Bar (Google Stitch UFC Design) */}
      <header className="border-b border-outline-dim bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-50">
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
                / MATCHMAKER STUDIO
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveUser(null)}
              className="px-3.5 py-2 text-white font-semibold border-b-2 border-[#d4af37] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px] text-[#d4af37]">sports_mma</span>
              <span>Matchmaker</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const available = participants.filter((p) => !p.revealed);
                if (available.length > 0) setActiveUser(available[0]);
              }}
              className="px-3.5 py-2 text-on-surface-variant hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">casino</span>
              <span>Sorteo a Ciegas</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="px-3.5 py-2 text-on-surface-variant hover:text-white transition-colors flex items-center gap-1.5"
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
                MATCHMAKING EN VIVO
              </span>
            </div>

            <div className="h-3 w-px bg-outline-dim hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 text-on-surface-variant font-mono text-[11px]">
              <span className="text-outline-subtle">Cartelera:</span>
              <span className="px-2 py-0.5 rounded bg-surface-container text-white font-medium">
                {pairs.length} Combates
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-6 lg:px-12 py-8 flex flex-col gap-8">
        {loading ? (
          <div className="py-24 text-center text-xs font-mono text-zinc-500 flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-ping" />
            CARGANDO TRANSMISIÓN OFICIAL UFC...
          </div>
        ) : !activeUser ? (
          <ParticipantSelector
            participants={participants}
            pairs={pairs}
            onSelectParticipant={handleSelectParticipant}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onRefreshParticipants={fetchPairingData}
          />
        ) : (
          <Roulette
            currentUser={activeUser}
            participants={participants}
            onFinishAndReturn={handleFinishAndReturn}
            onCancel={() => setActiveUser(null)}
          />
        )}
      </main>

      {/* Minimalist Footer (Google Stitch) */}
      <footer className="mt-auto border-t border-[rgba(255,255,255,0.07)] bg-[#090a0d] py-5 text-xs text-zinc-500">
        <div className="max-w-[1720px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-display font-bold text-white tracking-wider text-sm">TORNEO DEL PODER</span>
            <span>•</span>
            <span>Matchmaker Studio</span>
            <span>•</span>
            <span className="text-zinc-600">Reglamento Oficial MMA</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Panel Organizador [PIN]
            </button>
            <span>•</span>
            <span className="text-zinc-600">v3.0.5</span>
          </div>
        </div>
      </footer>

      {/* Admin Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshParticipants={fetchPairingData}
      />
    </div>
  );
}
