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

    // Auto-refresh every 7 seconds for live updates between phones
    const interval = setInterval(() => {
      fetchPairingData();
    }, 7000);

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
    <div className="min-h-screen flex flex-col justify-between bg-[#040711] text-[#f1f5f9] antialiased">
      {/* Boxing Event Header */}
      <header className="border-b border-neutral-800 bg-[#060a17]/90 backdrop-blur-md sticky top-0 z-40 boxing-ring-ropes pt-3">
        <div className="max-w-5xl mx-auto h-14 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🥊</span>
            <span className="font-black text-xs sm:text-sm uppercase tracking-widest text-white italic">
              SPARRING FIGHT NIGHT
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 bg-gradient-to-r from-blue-600 to-red-600 text-white text-[9px] font-mono font-bold uppercase tracking-wider border border-white/20">
              RING OFICIAL
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAdminOpen(true)}
            className="fight-btn-blue px-3 py-1.5 text-[10px]"
          >
            Organizador [PIN]
          </button>
        </div>
      </header>

      {/* Main Fight Arena */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {loading ? (
          <div className="text-xs font-mono uppercase tracking-widest text-blue-400 font-bold flex items-center gap-2">
            <span className="animate-spin">🥊</span> Cargando cartelera de combates...
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

      {/* Boxing Ring Footer */}
      <footer className="border-t border-neutral-800 py-3.5 px-4 text-center bg-[#060a17]">
        <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
          Boxing Sparring Matchmaker • Esquina Azul vs Esquina Roja • Resultados Oficiales en Vivo
        </p>
      </footer>

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshParticipants={fetchPairingData}
      />
    </div>
  );
}
