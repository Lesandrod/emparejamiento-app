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
    <div className="min-h-full bg-[#07080d] text-[#e2e8f0] font-sans flex flex-col antialiased selection:bg-[#00f2fe] selection:text-black">
      {/* Sleek Neon Top Bar matching the user's reference screenshot */}
      <header className="border-b border-white/10 bg-[#07080d]/85 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-[1720px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          {/* Brand & Event Identity (MODO: NEON style) */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="font-orbitron font-extrabold text-base sm:text-lg tracking-[0.2em] text-white">
                MODO: <span className="text-[#00f2fe] drop-shadow-[0_0_10px_rgba(0,242,254,0.8)]">NEON</span>
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-amber-600 text-white font-orbitron font-bold text-[10px] tracking-wider uppercase shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                UFC FIGHT NIGHT
              </span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden md:block"></div>
            <div className="hidden md:flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950/40 text-[#00f2fe] font-orbitron text-[11px] font-bold tracking-wider uppercase border border-cyan-500/40">
                OCTÁGONO 305
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                / EMPAREJAMIENTO PÚBLICO
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-2 text-xs font-orbitron">
            <button
              type="button"
              onClick={() => setActiveUser(null)}
              className="px-4 py-2 text-white font-semibold rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[#00f2fe] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,254,0.2)]"
            >
              <span className="material-symbols-outlined text-[16px] text-[#00f2fe]">sports_mma</span>
              <span>Matchmaker</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const available = participants.filter((p) => !p.revealed);
                if (available.length > 0) setActiveUser(available[0]);
              }}
              className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">casino</span>
              <span>Sorteo a Ciegas</span>
            </button>
          </nav>

          {/* Right Action Button & Status */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.3)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff2a5f]"></span>
              </span>
              <span className="text-[11px] font-orbitron font-bold tracking-wider text-[#ff2a5f] uppercase">
                EN VIVO
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="px-3.5 py-1.5 rounded-lg border border-white/20 hover:border-[#00f2fe] text-zinc-300 hover:text-[#00f2fe] font-orbitron text-[11px] tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,242,254,0.1)] hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
              <span className="hidden sm:inline">GESTIONAR</span> COMBATES
            </button>
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
            <span className="font-display font-bold text-white tracking-wider text-sm">UFC</span>
            <span>•</span>
            <span>Matchmaker Studio</span>
            <span>•</span>
            <span className="text-zinc-600">Reglamento Unificado MMA</span>
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
