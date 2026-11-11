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
    <div className="min-h-screen flex flex-col justify-between bg-[#080b12] text-[#e2e8f0] antialiased">
      {/* Official Ledger Header */}
      <header className="border-b border-[#1b2336] bg-[#090d16] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto h-14 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-600" />
            <span className="font-fighter font-bold text-sm uppercase tracking-wider text-white">
              FIGHT NIGHT • SPARRING MATCHMAKER
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 border border-[#2b354c] bg-[#0d121f] text-neutral-400 text-[9px] font-mono-tech">
              OFFICIAL PROGRAM
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAdminOpen(true)}
            className="btn-press-outline px-3 py-1.5 text-[10px]"
          >
            [ORGANIZADOR]
          </button>
        </div>
      </header>

      {/* Main Arena */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {loading ? (
          <div className="text-xs font-mono-tech text-neutral-400 font-bold">
            CARGANDO PROGRAMA OFICIAL...
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

      {/* Footer */}
      <footer className="border-t border-[#1b2336] py-3.5 px-4 text-center bg-[#070910]">
        <p className="text-[10px] font-mono-tech text-neutral-500">
          SPARRING MATCHMAKER • BLUE CORNER VS RED CORNER • RESULTADOS PÚBLICOS EN TIEMPO REAL
        </p>
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
