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
      {/* TALE OF THE TAPE STAGE (CLEAN GOOGLE STITCH UFC AESTHETIC) */}
      {/* ======================================================== */}
      <section className="bg-surface-dim border border-outline-dim rounded-xl overflow-hidden shadow-xl transition-all">
        {/* Match Meta Ribbon */}
        <div className="px-6 sm:px-10 py-3.5 bg-surface-container-low border-b border-outline-dim flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-bold text-xs tracking-wider uppercase border border-primary/20">
              Combate Estelar #{String(pairs.length + 1).padStart(2, '0')}
            </span>
            <span className="text-outline-subtle">•</span>
            <span className="text-xs text-on-surface tracking-wide font-medium">
              División Wélter (77.1 kg / 170 lbs)
            </span>
            <span className="text-outline-subtle hidden sm:inline">•</span>
            <span className="text-xs text-on-surface-variant hidden sm:inline">3 Asaltos de 5 Minutos</span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container border border-outline-dim text-on-surface-variant font-mono text-[11px]">
            <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
            <span>Comisión Atlética NSAC Aprobada</span>
          </div>
        </div>

        {/* Tale of the Tape Grid */}
        <div className="p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-11 gap-8 items-center bg-gradient-to-b from-surface-dim via-surface-container-lowest to-surface-dim">
          {/* BLUE CORNER */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative group">
            {/* Fighter Photo Avatar */}
            <div className="relative shrink-0">
              <div className="w-32 h-40 rounded-xl bg-surface-container-high border-2 border-blue-500/40 overflow-hidden flex items-end justify-center shadow-md relative">
                {selectedUser?.photoUrl ? (
                  <img
                    src={selectedUser.photoUrl}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover relative z-10 contrast-125"
                  />
                ) : (
                  <svg className="w-24 h-24 text-zinc-600/70 translate-y-2 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                  </svg>
                )}
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-mono font-bold uppercase tracking-wider border border-blue-400/30">
                  #1 Contendiente
                </span>
              </div>
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-blue-950 border border-blue-500/40 text-blue-400 text-[10px] font-mono font-bold rounded-full whitespace-nowrap shadow">
                74.8 kg / 165 lbs
              </span>
            </div>

            {/* Fighter Details */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono font-bold text-[10px] tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Esquina Azul
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-display font-black text-white tracking-tight uppercase truncate">
                {selectedUser ? selectedUser.name : 'Selecciona Peleador'}
              </h2>
              <p className="text-xs text-on-surface-variant font-mono mt-1">
                {selectedUser ? 'Peleador Oficial de División' : 'Roster en espera'}
              </p>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-outline-dim bg-surface-container-low/60 p-2.5 rounded-lg border border-outline-dim font-mono text-[10px]">
                <div className="text-center sm:text-left">
                  <span className="text-outline-subtle uppercase font-bold tracking-wider block">Récord</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">4-0-0 <span className="text-[11px] text-on-surface-variant font-normal">(3 KOs)</span></span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-outline-subtle uppercase font-bold tracking-wider block">Guardia</span>
                  <span className="text-sm font-bold text-on-surface mt-0.5 block">Ortodoxa</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-outline-subtle uppercase font-bold tracking-wider block">Alcance</span>
                  <span className="text-sm font-bold text-on-surface mt-0.5 block">178 cm</span>
                </div>
              </div>

              {selectedUser && (
                <label className="mt-3.5 text-xs text-on-surface-variant hover:text-blue-400 transition-colors inline-flex items-center gap-1.5 font-medium cursor-pointer">
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
            <div className="w-16 h-16 rounded-2xl bg-surface-container border border-outline-subtle flex flex-col items-center justify-center shadow-lg relative group">
              <span className="font-display font-black text-xl text-primary tracking-wider">VS</span>
              <span className="text-[8px] font-mono font-bold text-outline-subtle uppercase tracking-widest">OCTAGON</span>
            </div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase mt-3 px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              Sorteo a Ciegas
            </span>
            <span className="text-[11px] font-mono text-on-surface-variant mt-1">
              {unpairedList.length} rivales disponibles
            </span>

            <button
              onClick={handleStartDraw}
              disabled={!selectedUser}
              className="mt-4 px-4 py-2 rounded-lg border border-outline-dim hover:border-primary/50 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-40"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">casino</span>
              <span>Sortear Rival en la Mesa</span>
            </button>
          </div>

          {/* RED CORNER */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row-reverse items-center sm:items-start gap-6 relative group">
            {/* Fighter Photo Avatar (Mystery Silhouette) */}
            <div className="relative shrink-0">
              <div className="w-32 h-40 rounded-xl bg-surface-container-high border-2 border-red-500/40 overflow-hidden flex items-end justify-center shadow-md relative">
                <svg className="w-24 h-24 text-zinc-600/70 translate-y-2 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                </svg>
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-mono font-bold uppercase tracking-wider border border-red-400/30">
                  Rival Oculto
                </span>
              </div>
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-red-950 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold rounded-full whitespace-nowrap shadow">
                En Pesaje
              </span>
            </div>

            {/* Fighter Details */}
            <div className="flex-1 text-center sm:text-right min-w-0">
              <div className="flex items-center justify-center sm:justify-end gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-mono font-bold text-[10px] tracking-widest uppercase flex items-center gap-1.5">
                  Esquina Roja
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-display font-black text-white tracking-tight uppercase">
                ¿Quién será tu rival?
              </h2>
              <p className="text-xs text-on-surface-variant font-mono mt-1">
                Se descubrirá al destapar la carta oficial
              </p>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-outline-dim bg-surface-container-low/60 p-2.5 rounded-lg border border-outline-dim font-mono text-[10px]">
                <div className="text-center sm:text-right">
                  <span className="text-outline-subtle uppercase font-bold tracking-wider block">Récord</span>
                  <span className="text-sm font-bold text-on-surface-variant mt-0.5 block">? - ? - ?</span>
                </div>
                <div className="text-center sm:text-right">
                  <span className="text-outline-subtle uppercase font-bold tracking-wider block">Guardia</span>
                  <span className="text-sm font-bold text-on-surface-variant mt-0.5 block">Aleatoria</span>
                </div>
                <div className="text-center sm:text-right">
                  <span className="text-outline-subtle uppercase font-bold tracking-wider block">Alcance</span>
                  <span className="text-sm font-bold text-on-surface-variant mt-0.5 block">Variable</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartDraw}
                disabled={!selectedUser}
                className="mt-3.5 text-xs text-on-surface-variant hover:text-red-400 transition-colors inline-flex items-center gap-1.5 font-medium cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">shuffle</span>
                <span>Sacar carta de la mesa</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Confirmation Bar */}
        <div className="px-6 sm:px-10 py-4 bg-surface-container-low border-t border-outline-dim flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-lg bg-surface-container border border-outline-dim flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wide">
                {selectedUser ? `Listo: ${selectedUser.name} en Esquina Azul` : 'Selecciona un peleador disponible'}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Al confirmar, entrarás a la mesa de cartas para descubrir a tu oponente con animación de combate y choque de guantes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleStartDraw}
              disabled={!selectedUser}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-primary hover:bg-yellow-400 text-black text-xs font-bold tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">sports_mma</span>
              <span>Confirmar y Sacar Carta</span>
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* OPERATIONAL DUAL PANELS (CLEAN GOOGLE STITCH UFC DESIGN) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: ROSTER DISPONIBLE */}
        <section className="lg:col-span-5 bg-surface-dim border border-outline-dim rounded-xl p-6 flex flex-col gap-5 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline-dim pb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 bg-primary rounded-full"></div>
              <div>
                <h3 className="font-display font-bold text-base text-white tracking-wide uppercase">
                  Peleadores Disponibles
                </h3>
                <p className="text-[11px] text-on-surface-variant">Roster oficial para emparejamiento</p>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-surface-container border border-outline-dim text-primary text-xs font-bold font-mono ml-1">
                {unpairedList.length}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-xs text-primary hover:text-yellow-400 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-dim transition-all cursor-pointer"
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
              className="w-full bg-surface-container border border-outline-dim rounded-lg text-xs px-3.5 py-2.5 text-white placeholder-on-surface-variant focus:outline-none focus:border-primary transition-colors font-sans"
            />
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-[16px] text-outline-subtle">
              search
            </span>
          </div>

          {/* Roster List */}
          <div className="divide-y divide-outline-dim/60 max-h-[460px] overflow-y-auto pr-1 space-y-1">
            {filteredRoster.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant font-mono">
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
                        ? 'bg-surface-container border border-blue-500/40 shadow-sm'
                        : 'hover:bg-surface-container-low border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-outline-subtle flex-shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-display font-bold ${
                            isSelected
                              ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                              : 'bg-surface-container-high border border-outline-dim text-on-surface'
                          }`}
                        >
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs font-bold uppercase ${
                              isSelected
                                ? 'text-white'
                                : 'text-on-surface group-hover:text-primary'
                            } transition-colors`}
                          >
                            {p.name}
                          </h4>
                          {isSelected ? (
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-400/20 uppercase">
                              Listo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 font-mono">
                          {isSelected ? '✓ Asignado a Esquina Azul' : '74.5 kg • Récord 3-0 • Striker'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label
                        className="p-1 rounded text-outline-subtle hover:text-on-surface transition-colors cursor-pointer"
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
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wider uppercase transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-outline-dim hover:border-primary text-on-surface-variant hover:text-white'
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
        <section className="lg:col-span-7 bg-surface-dim border border-outline-dim rounded-xl p-6 flex flex-col gap-5 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-outline-dim pb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 bg-primary rounded-full"></div>
              <div>
                <h3 className="font-display font-bold text-base text-white tracking-wide uppercase">
                  Cartelera Oficial de Combates
                </h3>
                <p className="text-[11px] text-on-surface-variant">Orden de transmisión oficial UFC Fight Night</p>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-surface-container border border-outline-dim text-primary text-xs font-bold font-mono ml-1">
                {pairs.length} Combates Programados
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefreshParticipants}
                className="px-3 py-1.5 rounded-lg border border-outline-dim hover:bg-surface-container text-xs text-on-surface-variant hover:text-white transition-colors flex items-center gap-1.5 font-mono cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">refresh</span>
                <span>Refrescar</span>
              </button>
              <button
                type="button"
                onClick={onOpenAdmin}
                className="px-3 py-1.5 rounded-lg border border-outline-dim hover:bg-surface-container text-xs text-on-surface-variant hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">tune</span>
                <span>Organizador</span>
              </button>
            </div>
          </div>

          {/* Bouts List */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {pairs.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-outline-dim bg-surface-container-low/40 rounded-xl space-y-2">
                <span className="material-symbols-outlined text-3xl text-outline-subtle">sports_mma</span>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  Aún no hay combates programados en la cartelera
                </p>
                <p className="text-[11px] text-outline-subtle max-w-sm mx-auto font-mono">
                  Selecciona a un peleador disponible y dale a "Confirmar y Sacar Carta" para registrar el primer combate oficial.
                </p>
              </div>
            ) : (
              pairs.map((pair, idx) => {
                const isMainEvent = idx === pairs.length - 1;

                return (
                  <article
                    key={pair.id}
                    className={`p-4 rounded-xl transition-all relative ${
                      isMainEvent
                        ? 'bg-surface-container border border-primary/50 shadow-md'
                        : 'bg-surface-container-low border border-outline-dim hover:border-outline-subtle'
                    }`}
                  >
                    {isMainEvent && (
                      <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded bg-primary text-black text-[10px] font-display font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-[13px]">military_tech</span>
                        <span>Main Event • Estelar</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pb-3 border-b border-outline-dim font-mono">
                      <div className="flex items-center gap-2.5">
                        <span className={`font-display font-bold uppercase tracking-wider ${isMainEvent ? 'text-primary' : 'text-white'}`}>
                          Bout #{String(pair.pairNumber).padStart(2, '0')}
                        </span>
                        <span className="text-outline-subtle">•</span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium text-[10px] uppercase">
                          {isMainEvent ? 'Estelar' : 'Preliminar'}
                        </span>
                        <span className="text-outline-subtle hidden sm:inline">•</span>
                        <span className="text-on-surface-variant text-[11px] hidden sm:inline">División Wélter (77 kg)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase border border-emerald-500/20">
                          Confirmado
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-11 items-center pt-3.5 gap-2">
                      {/* Blue Corner Box */}
                      <div className="col-span-5 p-2 rounded-lg bg-surface-dim border border-blue-500/20 flex items-center gap-3">
                        {pair.member1.photoUrl ? (
                          <img
                            src={pair.member1.photoUrl}
                            alt={pair.member1.name}
                            className="w-8 h-8 rounded-full object-cover border border-blue-400 flex-shrink-0"
                          />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate uppercase">
                            {pair.member1.name}
                          </h4>
                          <span className="text-[10px] text-blue-400 font-mono truncate block">
                            Esquina Azul
                          </span>
                        </div>
                      </div>

                      {/* Center VS */}
                      <div className="col-span-1 text-center">
                        <span className="font-display font-black text-xs text-primary">VS</span>
                      </div>

                      {/* Red Corner Box */}
                      <div className="col-span-5 p-2 rounded-lg bg-surface-dim border border-red-500/20 flex items-center justify-end gap-3 text-right">
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate uppercase">
                            {pair.member2.name}
                          </h4>
                          <span className="text-[10px] text-red-400 font-mono truncate block">
                            Esquina Roja
                          </span>
                        </div>
                        {pair.member2.photoUrl ? (
                          <img
                            src={pair.member2.photoUrl}
                            alt={pair.member2.name}
                            className="w-8 h-8 rounded-full object-cover border border-red-400 flex-shrink-0"
                          />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0"></span>
                        )}
                      </div>
                    </div>

                    {pair.trioMember && (
                      <div className="mt-2.5 pt-2 border-t border-dashed border-outline-dim flex items-center justify-center gap-2 text-xs">
                        <span className="text-[10px] font-mono text-primary uppercase font-bold">+ 3er Peleador:</span>
                        <span className="font-bold text-white uppercase">{pair.trioMember.name}</span>
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
            className="w-full py-2.5 rounded-lg border border-dashed border-outline-dim hover:border-primary text-xs font-semibold text-on-surface-variant hover:text-white transition-all flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Añadir nuevo peleador o gestionar cartelera</span>
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
