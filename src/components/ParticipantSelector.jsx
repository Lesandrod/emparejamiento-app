'use client';

import React, { useState } from 'react';
import ImageCropperModal from './ImageCropperModal';

export default function ParticipantSelector({
  participants = [],
  pairs = [],
  onSelectParticipant,
  onOpenAdmin,
  onRefreshParticipants
}) {
  const [selectedId, setSelectedId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropParticipant, setCropParticipant] = useState(null);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

  // Unpaired participants
  const unpairedList = participants.filter((p) => !p.revealed);
  
  // Default selection if none selected yet
  const activeSelectedId = selectedId || (unpairedList.length > 0 ? unpairedList[0].id : '');
  const selectedUser = unpairedList.find((p) => p.id === activeSelectedId);

  // Filtered roster
  const filteredRoster = unpairedList.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartDraw = () => {
    if (selectedUser) {
      onSelectParticipant(selectedUser);
    }
  };

  const handleSelectFile = (participant, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropImageSrc(e.target.result);
      setCropParticipant(participant);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCroppedPhoto = async (croppedBase64) => {
    if (!cropParticipant) return;
    setIsUpdatingPhoto(true);
    try {
      const res = await fetch('/api/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: cropParticipant.id,
          photoUrl: croppedBase64
        })
      });
      if (res.ok && onRefreshParticipants) {
        await onRefreshParticipants();
      }
    } catch (err) {
      console.error('Error al guardar foto:', err);
    } finally {
      setIsUpdatingPhoto(false);
      setCropImageSrc(null);
      setCropParticipant(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* BEGIN: Editorial Tale of the Tape Stage (Google Stitch) */}
      <section className="bg-[#111317] border border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden shadow-2xl transition-all">
        {/* Match Meta Ribbon */}
        <div className="px-6 sm:px-10 py-3.5 bg-[#161920]/80 border-b border-[rgba(255,255,255,0.07)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#d4af37] font-bold text-xs tracking-wider uppercase border border-[#d4af37]/30">
              Combate Estelar #{String(pairs.length + 1).padStart(2, '0')}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-200 tracking-wide font-semibold">
              División Wélter (77.1 kg / 170 lbs)
            </span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-xs text-zinc-400 hidden sm:inline">3 Asaltos de 5 Minutos</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1c1f27] border border-[rgba(255,255,255,0.07)] text-zinc-300 font-mono text-[11px]">
              <span className="material-symbols-outlined text-[13px] text-[#d4af37]">verified</span>
              <span>Comisión Atlética de Nevada (NSAC) Aprobada</span>
            </div>
          </div>
        </div>

        {/* Tale of the Tape Grid */}
        <div className="p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-11 gap-8 items-center bg-gradient-to-b from-[#111317] via-[#111317] to-[#0d0f14]">
          {/* BLUE CORNER */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative group">
            {/* Fighter Photo Avatar */}
            <div className="relative shrink-0">
              <div className="w-32 h-40 rounded-xl bg-gradient-to-b from-blue-500/10 via-[#161920] to-[#111317] border-2 border-blue-400/40 overflow-hidden flex items-end justify-center shadow-lg relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
                {selectedUser?.photoUrl ? (
                  <img
                    src={selectedUser.photoUrl}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover relative z-10"
                  />
                ) : (
                  <svg className="w-24 h-24 text-zinc-600/70 translate-y-2 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                  </svg>
                )}
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-blue-500/20 text-[#38bdf8] text-[9px] font-bold uppercase tracking-wider border border-blue-400/30">
                  #1 Contendiente
                </span>
              </div>
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-blue-500/20 border border-blue-400/40 text-[#38bdf8] text-[11px] font-bold rounded-full whitespace-nowrap shadow">
                74.8 kg / 165 lbs
              </span>
            </div>

            {/* Fighter Details */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[#38bdf8] font-bold text-[10px] tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
                  Esquina Azul
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-display font-black text-white tracking-tight leading-tight uppercase truncate">
                {selectedUser ? selectedUser.name : 'Selecciona Peleador'}
              </h2>
              <p className="text-xs text-[#38bdf8]/90 font-medium tracking-wide mt-1">
                {selectedUser ? 'Peleador Oficial de División' : 'Roster en espera'}
              </p>

              {/* Telemetry Specs Grid */}
              <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-[rgba(255,255,255,0.07)] bg-[#161920]/40 p-2.5 rounded-lg border border-[rgba(255,255,255,0.07)]">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Récord</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">4-0-0 <span className="text-[11px] text-zinc-400 font-normal">(3 KOs)</span></span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Guardia</span>
                  <span className="text-sm font-bold text-zinc-200 mt-0.5 block">Ortodoxa</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Alcance</span>
                  <span className="text-sm font-bold text-zinc-200 mt-0.5 block">178 cm</span>
                </div>
              </div>

              {selectedUser && (
                <label className="mt-4 text-xs text-zinc-400 hover:text-[#38bdf8] transition-colors inline-flex items-center gap-1.5 font-medium cursor-pointer">
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                  <span>{selectedUser.photoUrl ? 'Cambiar foto de peleador' : 'Subir foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleSelectFile(selectedUser, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* CENTER VS BADGE */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center text-center py-4 relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1c1f27] via-[#111317] to-[#090a0d] border-2 border-[#d4af37]/50 flex flex-col items-center justify-center shadow-2xl relative group">
              <div className="absolute -inset-1 rounded-2xl bg-[#d4af37]/10 blur-sm"></div>
              <span className="relative font-display font-black text-xl text-[#d4af37] tracking-wider">VS</span>
              <span className="relative text-[8px] font-bold text-zinc-500 uppercase tracking-widest">OCTAGON</span>
            </div>
            <span className="text-[10px] font-bold tracking-widest text-[#d4af37] uppercase mt-3 px-2 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/20">
              Sorteo a Ciegas
            </span>
            <span className="text-[11px] text-zinc-500 mt-1">
              {unpairedList.length} rivales disponibles
            </span>

            <button
              onClick={handleStartDraw}
              disabled={!selectedUser}
              className="mt-4 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.07)] hover:border-[#d4af37]/50 bg-[#161920] hover:bg-[#1c1f27] text-zinc-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px] text-[#d4af37]">casino</span>
              <span>Sortear Rival en la Mesa</span>
            </button>
          </div>

          {/* RED CORNER */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row-reverse items-center sm:items-start gap-6 relative group">
            {/* Fighter Photo Avatar (Mystery Silhouette / Reveal) */}
            <div className="relative shrink-0">
              <div className="w-32 h-40 rounded-xl bg-gradient-to-b from-red-500/10 via-[#161920] to-[#111317] border-2 border-red-400/40 overflow-hidden flex items-end justify-center shadow-lg relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent"></div>
                <svg className="w-24 h-24 text-zinc-600/70 translate-y-2 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                </svg>
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-500/20 text-[#f87171] text-[9px] font-bold uppercase tracking-wider border border-red-400/30">
                  Rival Oculto
                </span>
              </div>
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-red-500/20 border border-red-400/40 text-[#f87171] text-[11px] font-bold rounded-full whitespace-nowrap shadow">
                En Pesaje
              </span>
            </div>

            {/* Fighter Details */}
            <div className="flex-1 text-center sm:text-right min-w-0">
              <div className="flex items-center justify-center sm:justify-end gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-[#f87171] font-bold text-[10px] tracking-widest uppercase flex items-center gap-1.5">
                  Esquina Roja
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f87171]"></span>
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-display font-black text-white tracking-tight leading-tight uppercase">
                ¿Quién será tu rival?
              </h2>
              <p className="text-xs text-[#f87171]/90 font-medium tracking-wide mt-1">
                Se descubrirá al chocolatear y voltear la carta
              </p>

              {/* Telemetry Specs Grid */}
              <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-[rgba(255,255,255,0.07)] bg-[#161920]/40 p-2.5 rounded-lg border border-[rgba(255,255,255,0.07)]">
                <div className="text-center sm:text-right">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Récord</span>
                  <span className="text-sm font-bold text-zinc-400 mt-0.5 block">? - ? - ?</span>
                </div>
                <div className="text-center sm:text-right">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Guardia</span>
                  <span className="text-sm font-bold text-zinc-400 mt-0.5 block">Aleatoria</span>
                </div>
                <div className="text-center sm:text-right">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Alcance</span>
                  <span className="text-sm font-bold text-zinc-400 mt-0.5 block">Variable</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartDraw}
                disabled={!selectedUser}
                className="mt-4 text-xs text-zinc-400 hover:text-[#f87171] transition-colors inline-flex items-center gap-1.5 font-medium"
              >
                <span className="material-symbols-outlined text-[15px]">shuffle</span>
                <span>Sacar carta de la mesa</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Confirmation Bar */}
        <div className="px-6 sm:px-10 py-4 bg-[#161920]/80 border-t border-[rgba(255,255,255,0.07)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-lg bg-[#1c1f27] border border-[rgba(255,255,255,0.07)] flex items-center justify-center text-[#d4af37] shrink-0">
              <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wide">
                {selectedUser ? `Listo: ${selectedUser.name} en Esquina Azul` : 'Selecciona un peleador disponible'}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Al confirmar, entrarás a la mesa de cartas para descubrir a tu oponente con animación de combate y choque de guantes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleStartDraw}
              disabled={!selectedUser}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-[#d4af37] hover:bg-amber-400 text-black text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-[#d4af37]/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">sports_mma</span>
              <span>Confirmar y Sacar Carta</span>
            </button>
          </div>
        </div>
      </section>
      {/* END: Tale of the Tape Stage */}

      {/* BEGIN: Operational Dual Panels (Google Stitch) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: ROSTER DISPONIBLE */}
        <section className="lg:col-span-5 bg-[#111317] border border-[rgba(255,255,255,0.07)] rounded-xl p-6 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-4 bg-[#d4af37] rounded-full"></div>
              <div>
                <h3 className="font-display font-bold text-base text-white tracking-wide uppercase">
                  Peleadores Disponibles
                </h3>
                <p className="text-[11px] text-zinc-400">Roster oficial para emparejamiento</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1c1f27] border border-[rgba(255,255,255,0.07)] text-[#d4af37] text-xs font-bold font-mono ml-1">
                {unpairedList.length}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-xs text-[#d4af37] hover:text-amber-300 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              <span>Nuevo</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre de peleador..."
              className="w-full bg-[#161920] border border-[rgba(255,255,255,0.07)] rounded-lg text-xs px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] transition-colors"
            />
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-[16px] text-zinc-500">
              search
            </span>
          </div>

          {/* Roster List */}
          <div className="divide-y divide-[rgba(255,255,255,0.07)] max-h-[460px] overflow-y-auto pr-1 space-y-1">
            {filteredRoster.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                No se encontraron peleadores en esta búsqueda.
              </div>
            ) : (
              filteredRoster.map((p) => {
                const isSelected = p.id === activeSelectedId;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`py-3 flex items-center justify-between group px-3 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/10 border border-blue-400/30'
                        : 'hover:bg-[#161920]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-blue-400/40 flex-shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isSelected
                              ? 'bg-blue-500/20 border border-blue-400/40 text-[#38bdf8]'
                              : 'bg-[#1c1f27] border border-[rgba(255,255,255,0.07)] text-zinc-200'
                          }`}
                        >
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs font-bold ${
                              isSelected
                                ? 'text-white'
                                : 'text-zinc-200 group-hover:text-[#d4af37]'
                            } transition-colors`}
                          >
                            {p.name}
                          </h4>
                          {isSelected ? (
                            <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-400/20 uppercase">
                              Listo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                          {isSelected ? 'Asignado a Esquina Azul' : '74.5 kg • Récord 3-0 • Striker'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label
                        className="p-1 rounded text-zinc-500 hover:text-white transition-colors cursor-pointer"
                        title="Subir foto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            handleSelectFile(p, e.target.files?.[0]);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(p.id);
                          onSelectParticipant(p);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-[#38bdf8] border-[#38bdf8] text-black font-bold'
                            : 'border-[rgba(255,255,255,0.07)] hover:border-[#d4af37] hover:text-[#d4af37] text-zinc-300'
                        }`}
                      >
                        {isSelected ? 'Elegido' : 'Seleccionar'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT PANEL: CARTELERA OFICIAL (FIGHT CARD) */}
        <section className="lg:col-span-7 bg-[#111317] border border-[rgba(255,255,255,0.07)] rounded-xl p-6 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[rgba(255,255,255,0.07)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-4 bg-[#d4af37] rounded-full"></div>
              <div>
                <h3 className="font-display font-bold text-base text-white tracking-wide uppercase">
                  Cartelera Oficial de Combates
                </h3>
                <p className="text-[11px] text-zinc-400">Orden de transmisión oficial UFC Fight Night</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1c1f27] border border-[rgba(255,255,255,0.07)] text-[#d4af37] text-xs font-bold font-mono ml-1">
                {pairs.length} Combates Programados
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefreshParticipants}
                className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.07)] hover:bg-[#1c1f27] text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 font-mono"
              >
                <span className="material-symbols-outlined text-[15px]">refresh</span>
                <span>Refrescar</span>
              </button>
              <button
                type="button"
                onClick={onOpenAdmin}
                className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.07)] hover:bg-[#1c1f27] text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">settings</span>
                <span>Organizador</span>
              </button>
            </div>
          </div>

          {/* Bouts List */}
          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
            {pairs.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-[rgba(255,255,255,0.07)] bg-[#161920]/40 rounded-xl space-y-2">
                <span className="material-symbols-outlined text-3xl text-zinc-600">sports_mma</span>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                  Aún no hay combates programados en la cartelera
                </p>
                <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                  Selecciona a un peleador disponible y dale a "Confirmar y Sacar Carta" para registrar el primer combate oficial.
                </p>
              </div>
            ) : (
              pairs.map((pair, idx) => {
                const isMainEvent = idx === pairs.length - 1;

                return (
                  <article
                    key={pair.id}
                    className={`p-4 rounded-xl transition-all shadow-sm relative ${
                      isMainEvent
                        ? 'bg-gradient-to-r from-[#161920]/90 via-[#111317] to-[#161920]/90 border-2 border-[#d4af37]/60 shadow-xl'
                        : 'bg-[#161920]/60 border border-[rgba(255,255,255,0.07)] hover:border-zinc-500/50'
                    }`}
                  >
                    {isMainEvent && (
                      <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded bg-[#d4af37] text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                        <span className="material-symbols-outlined text-[13px]">military_tech</span>
                        <span>Main Event • Estelar</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pb-3 border-b border-[rgba(255,255,255,0.07)]">
                      <div className="flex items-center gap-2.5">
                        <span className={`font-display font-bold uppercase tracking-wider ${isMainEvent ? 'text-[#d4af37]' : 'text-white'}`}>
                          Bout #{String(pair.pairNumber).padStart(2, '0')}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium text-[10px] uppercase">
                          {isMainEvent ? 'Estelar' : 'Preliminar'}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-400 text-[11px]">División Wélter (77 kg)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold text-zinc-400">
                          {pair.trioMember ? 'Trío Oficial' : 'Confirmado'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase">
                          Oficial
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-11 items-center pt-3.5 gap-2">
                      {/* Blue Corner */}
                      <div className="col-span-5 flex items-center gap-3">
                        {pair.member1.photoUrl ? (
                          <img
                            src={pair.member1.photoUrl}
                            alt={pair.member1.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#38bdf8] flex-shrink-0"
                          />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shadow-lg shadow-blue-500/50 flex-shrink-0"></span>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate uppercase">
                            {pair.member1.name}
                          </h4>
                          <span className="text-[11px] text-[#38bdf8] font-mono truncate block">
                            Esquina Azul
                          </span>
                        </div>
                      </div>

                      {/* Center VS */}
                      <div className="col-span-1 text-center">
                        <div className="w-6 h-6 rounded bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center mx-auto">
                          <span className="text-[10px] font-black text-[#d4af37]">VS</span>
                        </div>
                      </div>

                      {/* Red Corner */}
                      <div className="col-span-5 flex items-center justify-end gap-3 text-right">
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate uppercase">
                            {pair.member2.name}
                          </h4>
                          <span className="text-[11px] text-[#f87171] font-mono truncate block">
                            Esquina Roja
                          </span>
                        </div>
                        {pair.member2.photoUrl ? (
                          <img
                            src={pair.member2.photoUrl}
                            alt={pair.member2.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#f87171] flex-shrink-0"
                          />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#f87171] shadow-lg shadow-red-500/50 flex-shrink-0"></span>
                        )}
                      </div>
                    </div>

                    {pair.trioMember && (
                      <div className="mt-2.5 pt-2 border-t border-dashed border-zinc-800 flex items-center justify-center gap-2 text-xs">
                        <span className="text-[10px] font-mono text-[#d4af37] uppercase font-bold">+ 3er Peleador:</span>
                        <span className="font-bold text-white uppercase">{pair.trioMember.name}</span>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* Add Bout Action */}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full py-2.5 rounded-lg border border-dashed border-[rgba(255,255,255,0.07)] hover:border-[#d4af37] hover:text-[#d4af37] text-xs font-semibold text-zinc-300 transition-all flex items-center justify-center gap-2 bg-[#161920]/30 hover:bg-[#161920]"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Añadir nuevo peleador o gestionar cartelera</span>
          </button>
        </section>
      </div>
      {/* END: Operational Dual Panels */}

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={Boolean(cropImageSrc)}
        imageSrc={cropImageSrc}
        participantName={cropParticipant?.name || ''}
        onSave={handleSaveCroppedPhoto}
        onClose={() => {
          setCropImageSrc(null);
          setCropParticipant(null);
        }}
      />
    </div>
  );
}
