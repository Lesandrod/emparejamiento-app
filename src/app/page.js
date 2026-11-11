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
    <div className="min-h-screen flex flex-col justify-between bg-[#050711] text-[#f1f5f9] antialiased">
      {/* Neo UFC Header */}
      <header className="border-b border-blue-900/40 bg-[#070b18]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />
            <span className="font-ufc font-bold text-base sm:text-lg uppercase tracking-wider text-white">
              FIGHT NIGHT <span className="text-[#00f0ff]">UFC</span> MATCHMAKER
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAdminOpen(true)}
            className="btn-neo-outline px-3.5 py-1.5 text-[11px]"
          >
            [ORGANIZADOR]
          </button>
        </div>
      </header>

      {/* Main Arena */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {loading ? (
          <div className="text-sm font-mono-tech text-cyan-400 font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            CARGANDO PROGRAMA EN VIVO...
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
      <footer className="border-t border-blue-900/40 py-4 px-4 text-center bg-[#050814]">
        <p className="text-[11px] font-mono-tech text-neutral-400">
          SPARRING MATCHMAKER • ESQUINA AZUL VS ESQUINA ROJA • RESULTADOS EN TIEMPO REAL
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
