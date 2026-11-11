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

    // Auto-refresh every 8 seconds for live updates between participants on their phones
    const interval = setInterval(() => {
      fetchPairingData();
    }, 8000);

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
    <div className="min-h-screen flex flex-col justify-between bg-[#f7f8fa] text-[#090a0f] antialiased">
      {/* Header */}
      <header className="border-b border-[#e5e7eb] bg-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto h-14 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#090a0f]" />
            <span className="font-bold text-xs uppercase tracking-widest text-[#090a0f]">
              Emparejamiento en Vivo
            </span>
            <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold uppercase tracking-wider border border-emerald-300">
              Público
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAdminOpen(true)}
            className="sharp-outline-btn px-3 py-1.5 text-[10px]"
          >
            Organizador
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {loading ? (
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-400">
            Cargando sorteo...
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
      <footer className="border-t border-[#e5e7eb] py-3.5 px-4 text-center bg-white">
        <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
          Sorteo de Emparejamiento • Resultados públicos y en tiempo real
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
