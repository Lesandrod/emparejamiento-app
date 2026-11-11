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
      {/* ======================================================== */}
      {/* HERO BANNER CARD - EXACT "NEO GENESIS" STYLE FROM SCREENSHOT */}
      {/* ======================================================== */}
      <section className="relative rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden border-2 border-[#00f2fe]/80 bg-gradient-to-b from-[#0c1222] via-[#090d18] to-[#060810] shadow-[0_0_35px_rgba(0,242,254,0.3),inset_0_0_25px_rgba(0,242,254,0.08)]">
        {/* Glow corner ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/20 via-purple-600/10 to-transparent blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-600/15 via-transparent to-transparent blur-2xl pointer-events-none" />

        {/* Top HUD Row: [ SISTEMA_01 ] + Neon Pulse Dot */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[#00f2fe]/60 bg-[#00f2fe]/10 text-[#00f2fe] font-orbitron text-xs sm:text-sm font-semibold tracking-widest shadow-[0_0_12px_rgba(0,242,254,0.4)]">
            <span>[ SISTEMA_01: OCTAGON_MATCH ]</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2fe] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00f2fe] shadow-[0_0_10px_#00f2fe]"></span>
            </span>
            <span className="hidden sm:inline font-orbitron text-[11px] text-[#00f2fe] tracking-wider uppercase">
              CONEXIÓN ACTIVA
            </span>
          </div>
        </div>

        {/* Title & Subtitle ("NEO GENESIS" Typography) */}
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-orbitron font-black text-white tracking-tight uppercase drop-shadow-[0_0_20px_rgba(0,242,254,0.45)] leading-tight">
            NEO <span className="text-[#00f2fe]">MATCHMAKER</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 font-sans max-w-2xl leading-relaxed">
            El futuro del combate no se espera, se compila. Selecciona tu esquina, confirma tu peleador y desata el duelo oficial con choque de guantes en el octágono.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              onClick={handleStartDraw}
              disabled={!selectedUser}
              className="neo-button-cyan px-7 py-3 rounded-lg font-orbitron font-extrabold text-xs sm:text-sm tracking-wider flex items-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">sports_mma</span>
              <span>INICIAR ENLACE DE PELEA</span>
            </button>

            {selectedUser && (
              <span className="font-orbitron text-xs text-cyan-300/80 px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-950/30">
                Peleador listo: <strong className="text-white uppercase">{selectedUser.name}</strong>
              </span>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* TALE OF THE TAPE: BLUE CORNER vs RED CORNER */}
        {/* ======================================================== */}
        <div className="mt-10 pt-8 border-t border-cyan-500/20 grid grid-cols-1 lg:grid-cols-11 gap-8 items-center relative z-10">
          {/* BLUE CORNER */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-gradient-to-br from-[#0e1628]/90 to-[#070b16]/90 border border-cyan-400/50 shadow-[0_0_20px_rgba(0,242,254,0.15)]">
            {/* Fighter Photo Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-36 rounded-xl bg-gradient-to-b from-cyan-500/20 via-[#10192e] to-[#070b14] border-2 border-cyan-400 overflow-hidden flex items-end justify-center shadow-[0_0_15px_rgba(0,242,254,0.3)] relative">
                {selectedUser?.photoUrl ? (
                  <img
                    src={selectedUser.photoUrl}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover relative z-10"
                  />
                ) : (
                  <svg className="w-20 h-20 text-cyan-400/40 translate-y-2 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                  </svg>
                )}
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-cyan-500/30 text-[#00f2fe] text-[9px] font-orbitron font-bold uppercase tracking-wider border border-cyan-400/40">
                  #1 BLUE
                </span>
              </div>
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-cyan-950 border border-cyan-400/60 text-[#00f2fe] text-[10px] font-orbitron font-bold rounded-full whitespace-nowrap shadow">
                74.8 KG • 165 LBS
              </span>
            </div>

            {/* Fighter Details */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[#00f2fe] font-orbitron font-bold text-[10px] tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe]"></span>
                  Esquina Azul
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-orbitron font-black text-white tracking-tight uppercase truncate">
                {selectedUser ? selectedUser.name : 'SELECCIONA'}
              </h2>
              <p className="text-xs text-cyan-300/80 font-mono mt-0.5">
                {selectedUser ? 'Peleador Oficial de División' : 'Roster en espera'}
              </p>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-cyan-500/20 bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/20 text-center font-mono text-[10px]">
                <div>
                  <span className="text-zinc-500 uppercase block">RÉCORD</span>
                  <span className="text-xs font-bold text-white">4-0-0</span>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase block">GUARDIA</span>
                  <span className="text-xs font-bold text-cyan-200">ORTO</span>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase block">ALCANCE</span>
                  <span className="text-xs font-bold text-cyan-200">178 CM</span>
                </div>
              </div>

              {selectedUser && (
                <label className="mt-3 text-xs text-cyan-400 hover:text-white transition-colors inline-flex items-center gap-1 font-mono cursor-pointer">
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                  <span>{selectedUser.photoUrl ? 'Cambiar foto' : 'Subir foto'}</span>
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
          <div className="lg:col-span-3 flex flex-col items-center justify-center text-center py-2 relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#182030] via-[#0d121e] to-[#070a10] border-2 border-cyan-400/80 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(0,242,254,0.4)] relative group">
              <span className="font-orbitron font-black text-xl text-[#00f2fe] tracking-wider">VS</span>
              <span className="text-[8px] font-orbitron font-bold text-zinc-400 uppercase tracking-widest">NEON</span>
            </div>
            <span className="text-[10px] font-orbitron font-bold tracking-widest text-cyan-300 uppercase mt-3 px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-400/30">
              SORTEO A CIEGAS
            </span>
            <span className="text-xs font-mono text-zinc-400 mt-1">
              {unpairedList.length} rivales en la mesa
            </span>
          </div>

          {/* RED CORNER */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row-reverse items-center sm:items-start gap-5 p-4 rounded-2xl bg-gradient-to-bl from-[#240e18]/90 to-[#0e070c]/90 border border-[#ff2a5f]/50 shadow-[0_0_20px_rgba(255,42,95,0.15)]">
            {/* Fighter Photo Avatar (Mystery Silhouette) */}
            <div className="relative shrink-0">
              <div className="w-28 h-36 rounded-xl bg-gradient-to-b from-red-500/20 via-[#260f18] to-[#12070c] border-2 border-[#ff2a5f] overflow-hidden flex items-end justify-center shadow-[0_0_15px_rgba(255,42,95,0.3)] relative">
                <svg className="w-20 h-20 text-[#ff2a5f]/40 translate-y-2 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                </svg>
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-500/30 text-[#ff2a5f] text-[9px] font-orbitron font-bold uppercase tracking-wider border border-red-400/40">
                  #2 RED
                </span>
              </div>
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-red-950 border border-red-400/60 text-[#ff2a5f] text-[10px] font-orbitron font-bold rounded-full whitespace-nowrap shadow">
                EN PESAJE
              </span>
            </div>

            {/* Fighter Details */}
            <div className="flex-1 text-center sm:text-right min-w-0">
              <div className="flex items-center justify-center sm:justify-end gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/40 text-[#ff2a5f] font-orbitron font-bold text-[10px] tracking-widest uppercase flex items-center gap-1.5">
                  Esquina Roja
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff2a5f]"></span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-orbitron font-black text-white tracking-tight uppercase">
                ¿RIVAL OCULTO?
              </h2>
              <p className="text-xs text-red-300/80 font-mono mt-0.5">
                Voltea la carta para desatar la pelea
              </p>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-red-500/20 bg-red-950/20 p-2 rounded-lg border border-red-500/20 text-center font-mono text-[10px]">
                <div>
                  <span className="text-zinc-500 uppercase block">RÉCORD</span>
                  <span className="text-xs font-bold text-zinc-300">? - ? - ?</span>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase block">GUARDIA</span>
                  <span className="text-xs font-bold text-red-200">ALEAT</span>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase block">ALCANCE</span>
                  <span className="text-xs font-bold text-red-200">VAR</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartDraw}
                disabled={!selectedUser}
                className="mt-3 text-xs text-red-400 hover:text-white transition-colors inline-flex items-center gap-1 font-mono cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">shuffle</span>
                <span>Sacar carta de la mesa</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* OPERATIONAL DUAL PANELS: SCREENSHOT LOWER CARDS STYLE */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: "ESENCIA / ROSTER" WITH 3 MAC WINDOW DOTS */}
        <section className="lg:col-span-5 rounded-2xl p-6 flex flex-col gap-5 border border-cyan-500/50 bg-gradient-to-b from-[#0d1322] to-[#070a12] shadow-[0_0_25px_rgba(0,242,254,0.18)]">
          {/* Top Window Dots (Exact match to screenshot bottom-left) */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_6px_#ff5f56]"></span>
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_6px_#ffbd2e]"></span>
              <span className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_6px_#27c93f]"></span>
              <span className="font-orbitron font-bold text-sm text-white ml-2 tracking-wide uppercase">
                Peleadores en Espera
              </span>
            </div>

            <span className="px-2.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-400/40 text-[#00f2fe] text-xs font-orbitron font-bold">
              {unpairedList.length} DISPONIBLES
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar peleador..."
              className="w-full bg-[#121929] border border-cyan-500/30 rounded-lg text-xs px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00f2fe] focus:shadow-[0_0_12px_rgba(0,242,254,0.3)] transition-all font-mono"
            />
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-[16px] text-cyan-400">
              search
            </span>
          </div>

          {/* Roster List */}
          <div className="divide-y divide-white/5 max-h-[460px] overflow-y-auto pr-1 space-y-1">
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
                    className={`py-3 flex items-center justify-between group px-3 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 border border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.2)]'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-cyan-400/60 flex-shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-orbitron font-bold ${
                            isSelected
                              ? 'bg-cyan-500/20 border border-cyan-400 text-[#00f2fe]'
                              : 'bg-[#182030] border border-white/10 text-zinc-200'
                          }`}
                        >
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs font-orbitron font-bold uppercase ${
                              isSelected
                                ? 'text-white drop-shadow-[0_0_8px_rgba(0,242,254,0.6)]'
                                : 'text-zinc-200 group-hover:text-cyan-300'
                            } transition-colors`}
                          >
                            {p.name}
                          </h4>
                          {isSelected ? (
                            <span className="w-2 h-2 rounded-full bg-[#00f2fe] shadow-[0_0_6px_#00f2fe]" />
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-400/30 uppercase">
                              Listo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                          {isSelected ? '✓ Asignado a Esquina Azul' : '74.5 kg • Récord 3-0 • Striker'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label
                        className="p-1 rounded text-zinc-500 hover:text-cyan-300 transition-colors cursor-pointer"
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
                        className={`px-3 py-1.5 rounded-lg border text-xs font-orbitron uppercase tracking-wider transition-all ${
                          isSelected
                            ? 'bg-[#00f2fe] border-[#00f2fe] text-black font-extrabold shadow-[0_0_12px_rgba(0,242,254,0.6)]'
                            : 'border-white/10 hover:border-cyan-400 hover:text-cyan-300 text-zinc-300'
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

        {/* RIGHT PANEL: "GALERÍA / CARTELERA NEON" (EXACT MATCH TO SCREENSHOT BOTTOM-RIGHT) */}
        <section className="lg:col-span-7 rounded-2xl p-6 flex flex-col gap-5 border border-purple-500/50 bg-gradient-to-b from-[#140e24] to-[#0a0714] shadow-[0_0_25px_rgba(168,85,247,0.18)]">
          {/* Header Row: Title with Cyan Underline + "HI-SCORE: 9999" style badge */}
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="font-orbitron font-bold text-base text-white tracking-widest uppercase">
                GALERÍA DE COMBATES
              </h3>
              <div className="h-0.5 w-24 bg-[#00f2fe] shadow-[0_0_8px_#00f2fe] mt-1"></div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-orbitron text-xs font-bold text-[#ec4899] drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] tracking-wider">
                HI-SCORE: {String(pairs.length * 1000 + 999).padStart(4, '0')}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-purple-950/60 border border-purple-400/40 text-purple-300 text-xs font-orbitron font-bold">
                {pairs.length} BOUTS
              </span>
            </div>
          </div>

          {/* Bouts List styled with Neo Box Buttons (like ART_01.PNG in the screenshot) */}
          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
            {pairs.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-purple-500/30 bg-purple-950/20 rounded-2xl space-y-2">
                <span className="material-symbols-outlined text-4xl text-purple-400/60">sports_mma</span>
                <p className="text-xs font-orbitron font-bold text-purple-200 uppercase tracking-wide">
                  AÚN NO HAY COMBATES PROGRAMADOS
                </p>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto font-mono">
                  Selecciona a un peleador disponible y dale a "INICIAR ENLACE" para registrar el primer combate oficial en el octágono.
                </p>
              </div>
            ) : (
              pairs.map((pair, idx) => {
                const isMainEvent = idx === pairs.length - 1;

                return (
                  <article
                    key={pair.id}
                    className={`p-4 rounded-xl transition-all shadow-md relative ${
                      isMainEvent
                        ? 'bg-gradient-to-r from-purple-950/40 via-[#110e20] to-purple-950/40 border-2 border-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                        : 'bg-[#100d1c]/90 border border-purple-500/40 hover:border-cyan-400/60 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                    }`}
                  >
                    {isMainEvent && (
                      <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded bg-[#ffd700] text-black text-[10px] font-orbitron font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(255,215,0,0.6)]">
                        <span className="material-symbols-outlined text-[13px]">military_tech</span>
                        <span>MAIN EVENT • ESTELAR</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10 font-mono">
                      <div className="flex items-center gap-2.5">
                        <span className={`font-orbitron font-bold uppercase tracking-wider ${isMainEvent ? 'text-[#ffd700]' : 'text-purple-300'}`}>
                          BOUT_#{String(pair.pairNumber).padStart(2, '0')}.FIGHT
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300 font-medium text-[10px] uppercase">
                          {isMainEvent ? 'Estelar' : 'Prelim'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-orbitron font-bold uppercase border border-emerald-400/30">
                          CONFIRMADO
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-11 items-center pt-3.5 gap-2">
                      {/* Blue Corner Box (ART_01.PNG Neo Style) */}
                      <div className="col-span-5 p-2 rounded-lg bg-blue-950/40 border border-cyan-400/60 shadow-[0_0_12px_rgba(0,242,254,0.2)] flex items-center gap-3">
                        {pair.member1.photoUrl ? (
                          <img
                            src={pair.member1.photoUrl}
                            alt={pair.member1.name}
                            className="w-8 h-8 rounded-full object-cover border border-cyan-400 flex-shrink-0"
                          />
                        ) : (
                          <span className="w-3 h-3 rounded-full bg-[#00f2fe] shadow-[0_0_6px_#00f2fe] flex-shrink-0"></span>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-orbitron font-bold text-white truncate uppercase">
                            {pair.member1.name}
                          </h4>
                          <span className="text-[10px] text-cyan-300 font-mono truncate block">
                            ESQUINA AZUL
                          </span>
                        </div>
                      </div>

                      {/* Center VS */}
                      <div className="col-span-1 text-center">
                        <span className="font-orbitron font-black text-xs text-[#ffd700] drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]">VS</span>
                      </div>

                      {/* Red Corner Box (ART_02.PNG Neo Style) */}
                      <div className="col-span-5 p-2 rounded-lg bg-red-950/40 border border-[#ff2a5f]/60 shadow-[0_0_12px_rgba(255,42,95,0.2)] flex items-center justify-end gap-3 text-right">
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-orbitron font-bold text-white truncate uppercase">
                            {pair.member2.name}
                          </h4>
                          <span className="text-[10px] text-red-400 font-mono truncate block">
                            ESQUINA ROJA
                          </span>
                        </div>
                        {pair.member2.photoUrl ? (
                          <img
                            src={pair.member2.photoUrl}
                            alt={pair.member2.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#ff2a5f] flex-shrink-0"
                          />
                        ) : (
                          <span className="w-3 h-3 rounded-full bg-[#ff2a5f] shadow-[0_0_6px_#ff2a5f] flex-shrink-0"></span>
                        )}
                      </div>
                    </div>

                    {pair.trioMember && (
                      <div className="mt-2.5 pt-2 border-t border-dashed border-white/10 flex items-center justify-center gap-2 text-xs">
                        <span className="text-[10px] font-orbitron text-[#ffd700] uppercase font-bold">+ 3ER PELEADOR:</span>
                        <span className="font-orbitron font-bold text-white uppercase">{pair.trioMember.name}</span>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* Add Bout Action Button */}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full py-2.5 rounded-xl border border-dashed border-purple-400/40 hover:border-[#00f2fe] text-xs font-orbitron uppercase tracking-wider text-purple-200 hover:text-[#00f2fe] transition-all flex items-center justify-center gap-2 bg-purple-950/30 hover:bg-purple-950/60 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(0,242,254,0.3)]"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>AÑADIR NUEVO PELEADOR O CONFIGURAR</span>
          </button>
        </section>
      </div>

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
