'use client';

import React, { useState, useEffect } from 'react';
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

  // Carousel Index for confirmed bouts ONLY
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Keep carousel index in bounds as pairs change
  useEffect(() => {
    if (pairs.length > 0 && carouselIndex >= pairs.length) {
      setCarouselIndex(pairs.length - 1);
    }
  }, [pairs.length, carouselIndex]);

  // Filtered roster
  const filteredRoster = unpairedList.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrevSlide = () => {
    if (pairs.length === 0) return;
    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : pairs.length - 1));
  };

  const handleNextSlide = () => {
    if (pairs.length === 0) return;
    setCarouselIndex((prev) => (prev < pairs.length - 1 ? prev + 1 : 0));
  };

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

  const currentPair = pairs.length > 0 ? pairs[carouselIndex] : null;

  return (
    <div className="flex flex-col gap-6 select-none">
      {/* ======================================================== */}
      {/* MATCH CAROUSEL: ONLY DISPLAYED IF MATCHES (PAIRS) EXIST */}
      {/* ======================================================== */}
      {pairs.length > 0 && currentPair && (
        <section className="bg-surface-dim border border-outline-dim rounded-xl overflow-hidden shadow-xl transition-all relative">
          {/* Carousel Header & Controls Ribbon */}
          <div className="px-5 sm:px-8 py-3.5 bg-surface-container-low border-b border-outline-dim flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded bg-surface-container border border-outline-dim text-primary font-mono font-bold text-xs tracking-wider uppercase">
                Combate #{currentPair.pairNumber || carouselIndex + 1}
              </span>
              <span className="text-outline-subtle">•</span>
              <span className="text-xs text-on-surface font-medium">
                División Wélter (77.1 kg / 170 lbs)
              </span>
              <span className="text-outline-subtle hidden sm:inline">•</span>
              <span className="text-xs text-on-surface-variant hidden sm:inline">3 Asaltos de 5 Minutos</span>
            </div>

            {/* Carousel Navigation Arrows */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface-variant">
                <span>{carouselIndex + 1}</span>
                <span className="text-outline-subtle">/</span>
                <span>{pairs.length}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-dim text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                  title="Combate Anterior"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-dim text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                  title="Siguiente Combate"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Match Tale of the Tape Slide */}
          <div className="p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-11 gap-8 items-center bg-gradient-to-b from-surface-dim via-surface-container-lowest to-surface-dim">
            {/* BLUE CORNER */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative group">
              <div className="relative shrink-0">
                <div className="w-28 sm:w-32 h-28 sm:h-32 rounded-full bg-surface-container-high border-2 border-blue-500 overflow-hidden flex items-center justify-center shadow-lg relative">
                  {currentPair.member1.photoUrl ? (
                    <img
                      src={currentPair.member1.photoUrl}
                      alt={currentPair.member1.name}
                      className="w-full h-full object-cover relative z-10 contrast-125 rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-950/60 text-blue-400 font-display font-black text-3xl uppercase rounded-full">
                      {currentPair.member1.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-blue-600 text-white text-[8px] font-mono font-bold uppercase tracking-wider z-20 whitespace-nowrap shadow">
                    AZUL
                  </span>
                </div>
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-blue-950 border border-blue-500 text-blue-400 text-[10px] font-mono font-bold rounded-full whitespace-nowrap shadow">
                  74.8 kg / 165 lbs
                </span>
              </div>

              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono font-bold text-[10px] tracking-widest uppercase">
                    Peleador Confirmado
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white tracking-tight uppercase truncate">
                  {currentPair.member1.name}
                </h2>
                {currentPair.member1.alias && (
                  <p className="text-xs text-primary font-mono font-bold mt-0.5">
                    "{currentPair.member1.alias}"
                  </p>
                )}
                <p className="text-xs text-blue-400 font-mono mt-0.5">
                  Esquina Azul Oficial
                </p>

                <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-outline-dim bg-surface-container-low/60 p-2.5 rounded-lg border border-outline-dim font-mono text-[10px]">
                  <div className="text-center sm:text-left">
                    <span className="text-outline-subtle uppercase font-bold tracking-wider block">Récord</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">4-0-0</span>
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
              </div>
            </div>

            {/* CENTER VS BADGE */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center text-center py-4 relative">
              <div className="w-16 h-16 rounded-2xl bg-surface-container border-2 border-primary/50 flex flex-col items-center justify-center shadow-lg relative">
                <span className="font-display font-black text-xl text-primary tracking-wider">VS</span>
                <span className="text-[8px] font-mono font-bold text-outline-subtle uppercase tracking-widest">OFICIAL</span>
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase mt-3 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Combate Confirmado
              </span>
              <span className="text-[11px] font-mono text-on-surface-variant mt-1">
                Bout #{currentPair.pairNumber} en la Cartelera
              </span>
            </div>

            {/* RED CORNER */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row-reverse items-center sm:items-start gap-6 relative group">
              <div className="relative shrink-0">
                <div className="w-28 sm:w-32 h-28 sm:h-32 rounded-full bg-surface-container-high border-2 border-red-500 overflow-hidden flex items-center justify-center shadow-lg relative">
                  {currentPair.member2.photoUrl ? (
                    <img
                      src={currentPair.member2.photoUrl}
                      alt={currentPair.member2.name}
                      className="w-full h-full object-cover relative z-10 contrast-125 rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-red-950/60 text-red-400 font-display font-black text-3xl uppercase rounded-full">
                      {currentPair.member2.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-red-600 text-white text-[8px] font-mono font-bold uppercase tracking-wider z-20 whitespace-nowrap shadow">
                    ROJA
                  </span>
                </div>
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-red-950 border border-red-500 text-red-400 text-[10px] font-mono font-bold rounded-full whitespace-nowrap shadow">
                  75.1 kg / 165 lbs
                </span>
              </div>

              <div className="flex-1 text-center sm:text-right min-w-0">
                <div className="flex items-center justify-center sm:justify-end gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-mono font-bold text-[10px] tracking-widest uppercase">
                    Peleador Confirmado
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white tracking-tight uppercase truncate">
                  {currentPair.member2.name}
                </h2>
                {currentPair.member2.alias && (
                  <p className="text-xs text-primary font-mono font-bold mt-0.5">
                    "{currentPair.member2.alias}"
                  </p>
                )}
                <p className="text-xs text-red-400 font-mono mt-0.5">
                  Esquina Roja Oficial
                </p>

                <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-outline-dim bg-surface-container-low/60 p-2.5 rounded-lg border border-outline-dim font-mono text-[10px]">
                  <div className="text-center sm:text-right">
                    <span className="text-outline-subtle uppercase font-bold tracking-wider block">Récord</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">5-1-0</span>
                  </div>
                  <div className="text-center sm:text-right">
                    <span className="text-outline-subtle uppercase font-bold tracking-wider block">Guardia</span>
                    <span className="text-sm font-bold text-on-surface mt-0.5 block">Surda</span>
                  </div>
                  <div className="text-center sm:text-right">
                    <span className="text-outline-subtle uppercase font-bold tracking-wider block">Alcance</span>
                    <span className="text-sm font-bold text-on-surface mt-0.5 block">180 cm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Info Bar for Confirmed Bout */}
          <div className="px-6 sm:px-10 py-3.5 bg-surface-container-low border-t border-outline-dim flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-on-surface-variant font-mono">
              <span className="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span>
              <span>Combate #{currentPair.pairNumber} registrado y certificado por NSAC</span>
              {currentPair.trioMember && (
                <span className="text-primary font-bold">(+ Tercer Peleador: {currentPair.trioMember.name})</span>
              )}
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-on-surface-variant">
              <span>Desliza para ver los demás combates</span>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* ACTIVE FIGHTER SELECTION BAR                            */}
      {/* ======================================================== */}
      {selectedUser && (
        <div className="bg-surface-dim border border-outline-dim rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container border-2 border-blue-500 flex-shrink-0 shadow-md">
              {selectedUser.photoUrl ? (
                <img
                  src={selectedUser.photoUrl}
                  alt={selectedUser.name}
                  className="w-full h-full object-cover contrast-125 rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display font-black text-blue-400 text-lg uppercase bg-blue-950/40 rounded-full">
                  {selectedUser.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-blue-400 uppercase font-bold tracking-wider">
                  Peleador Seleccionado • Esquina Azul
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-display font-black text-white uppercase truncate">
                  {selectedUser.name}
                </span>
                {selectedUser.alias && (
                  <span className="text-xs sm:text-sm font-mono text-primary font-bold">
                    "{selectedUser.alias}"
                  </span>
                )}
              </div>
              <div className="text-xs text-on-surface-variant font-mono">
                Presiona "Confirmar y Sacar Carta" para descubrir su rival a ciegas en el octágono.
              </div>
            </div>
          </div>

          <button
            onClick={handleStartDraw}
            className="w-full sm:w-auto px-7 py-3 rounded-lg bg-primary hover:bg-yellow-400 text-black text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">sports_mma</span>
            <span>Confirmar y Sacar Carta</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* FULL WIDTH: PELEADORES DISPONIBLES (TARJETAS CUADRADAS)   */}
      {/* ======================================================== */}
      <section className="w-full bg-surface-dim border border-outline-dim rounded-xl p-5 sm:p-6 flex flex-col gap-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-outline-dim pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-4 bg-primary rounded-full"></div>
            <div>
              <h3 className="font-display font-bold text-base text-white tracking-wide uppercase">
                Peleadores Disponibles
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Selecciona tu nombre para asignarte a la Esquina Azul
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-surface-container border border-outline-dim text-primary text-xs font-bold font-mono ml-1">
              {unpairedList.length} en Espera
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar peleador..."
                className="w-full bg-surface-container border border-outline-dim rounded-lg text-xs px-3.5 py-2 text-white placeholder-on-surface-variant focus:outline-none focus:border-primary transition-colors font-sans"
              />
              <span className="material-symbols-outlined absolute right-3 top-2 text-[16px] text-outline-subtle">
                search
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-xs text-primary hover:text-yellow-400 font-semibold flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container border border-outline-dim transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              <span>Nuevo</span>
            </button>
          </div>
        </div>

        {/* FULL WIDTH GRID: SQUARES (ESTILO AMIGO SECRETO) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[520px] overflow-y-auto p-1.5">
          {filteredRoster.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-on-surface-variant font-mono">
              No se encontraron peleadores disponibles en la lista.
            </div>
          ) : (
            filteredRoster.map((p) => {
              const isSelected = p.id === activeSelectedId;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`relative rounded-xl p-3 flex flex-col items-center justify-between text-center transition-all cursor-pointer min-h-[155px] group ${
                    isSelected
                      ? 'bg-surface-container border-2 border-primary shadow-[0_0_15px_rgba(254,207,82,0.18)]'
                      : 'bg-surface-container-low border border-outline-dim hover:border-outline-subtle hover:bg-surface-container'
                  }`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-container shadow-sm" />
                  )}

                  {/* Fighter Avatar & Photo Icon (Round frame) */}
                  <div className="relative my-1">
                    {p.photoUrl ? (
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        className="w-14 h-14 rounded-full object-cover border border-outline-subtle flex-shrink-0 shadow-sm"
                      />
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-display font-black uppercase ${
                          isSelected
                            ? 'bg-primary/10 text-primary border border-primary/30'
                            : 'bg-surface-container-high border border-outline-dim text-on-surface'
                        }`}
                      >
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Camera Upload Button */}
                    <label
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface-container-highest border border-outline-subtle hover:border-primary flex items-center justify-center text-outline-subtle hover:text-white transition-colors cursor-pointer shadow"
                      title="Subir foto de peleador"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="material-symbols-outlined text-[11px]">photo_camera</span>
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
                  </div>

                  {/* Fighter Name & Alias */}
                  <div className="w-full mt-1 min-w-0">
                    <h4
                      className={`text-xs font-bold uppercase truncate w-full ${
                        isSelected ? 'text-white font-extrabold' : 'text-on-surface group-hover:text-primary'
                      } transition-colors`}
                    >
                      {p.name}
                    </h4>
                    {p.alias ? (
                      <span className="text-[10px] font-mono text-primary truncate block font-semibold leading-tight mt-0.5">
                        "{p.alias}"
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-transparent block leading-tight select-none mt-0.5">
                        -
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="mt-2 w-full">
                    <span
                      className={`inline-flex items-center justify-center gap-1 w-full py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-colors ${
                        isSelected
                          ? 'bg-primary text-black shadow-sm'
                          : 'bg-surface-container border border-outline-dim text-on-surface-variant group-hover:border-outline-subtle group-hover:text-white'
                      }`}
                    >
                      {isSelected ? '✓ ELEGIDO' : 'DISPONIBLE'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* CARTELERA OFICIAL DE COMBATES (COLOCADA DEBAJO DE JUGADORES) */}
      {/* ======================================================== */}
      <section className="w-full bg-surface-dim border border-outline-dim rounded-xl p-5 sm:p-6 flex flex-col gap-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-outline-dim pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-4 bg-primary rounded-full"></div>
            <div>
              <h3 className="font-display font-bold text-base text-white tracking-wide uppercase">
                Cartelera Oficial de Combates
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Orden oficial de peleas pactadas en vivo
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-surface-container border border-outline-dim text-primary text-xs font-bold font-mono ml-1">
              {pairs.length} Combates Registrados
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
              <span>Organizador [PIN]</span>
            </button>
          </div>
        </div>

        {/* Bouts Grid */}
        {pairs.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-outline-dim bg-surface-container-low/40 rounded-xl space-y-2">
            <span className="material-symbols-outlined text-3xl text-outline-subtle">sports_mma</span>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
              Aún no hay combates programados en la cartelera
            </p>
            <p className="text-[11px] text-outline-subtle max-w-sm mx-auto font-mono">
              Selecciona a tu peleador en las tarjetas cuadradas y dale a "Confirmar y Sacar Carta" para pactar la primera pelea.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pairs.map((pair, idx) => {
              const isViewingInCarousel = carouselIndex === idx;

              return (
                <article
                  key={pair.id}
                  onClick={() => {
                    setCarouselIndex(idx);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`p-4 rounded-xl transition-all cursor-pointer border ${
                    isViewingInCarousel
                      ? 'bg-surface-container border-primary shadow-sm ring-1 ring-primary/40'
                      : 'bg-surface-container-low border-outline-dim hover:border-outline-subtle hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs pb-2.5 border-b border-outline-dim/60 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold uppercase tracking-wider text-primary">
                        Bout #{String(pair.pairNumber).padStart(2, '0')}
                      </span>
                      <span className="text-outline-subtle">•</span>
                      <span className="text-on-surface-variant text-[11px]">Wélter 77 kg</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-outline-subtle hover:text-primary">
                        {isViewingInCarousel ? 'En Carrusel ▲' : 'Ver en Carrusel'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase border border-emerald-500/20">
                        Listo
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-11 items-center pt-3 gap-2">
                    {/* Blue Corner Box */}
                    <div className="col-span-5 p-2 rounded-lg bg-surface-dim border border-blue-500/20 flex items-center gap-2">
                      {pair.member1.photoUrl ? (
                        <img
                          src={pair.member1.photoUrl}
                          alt={pair.member1.name}
                          className="w-8 h-8 rounded-full object-cover border border-blue-400 flex-shrink-0"
                        />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0 ml-1"></span>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate uppercase">
                          {pair.member1.name}
                        </h4>
                        <span className="text-[9px] text-blue-400 font-mono block truncate">
                          {pair.member1.alias ? `“${pair.member1.alias}”` : 'Esquina Azul'}
                        </span>
                      </div>
                    </div>

                    {/* Center VS */}
                    <div className="col-span-1 text-center">
                      <span className="font-display font-black text-xs text-primary">VS</span>
                    </div>

                    {/* Red Corner Box */}
                    <div className="col-span-5 p-2 rounded-lg bg-surface-dim border border-red-500/20 flex items-center justify-end gap-2 text-right">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate uppercase">
                          {pair.member2.name}
                        </h4>
                        <span className="text-[9px] text-red-400 font-mono block truncate">
                          {pair.member2.alias ? `“${pair.member2.alias}”` : 'Esquina Roja'}
                        </span>
                      </div>
                      {pair.member2.photoUrl ? (
                        <img
                          src={pair.member2.photoUrl}
                          alt={pair.member2.name}
                          className="w-8 h-8 rounded-full object-cover border border-red-400 flex-shrink-0"
                        />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0 mr-1"></span>
                      )}
                    </div>
                  </div>

                  {pair.trioMember && (
                    <div className="mt-2.5 pt-2 border-t border-dashed border-outline-dim flex items-center justify-center gap-2 text-xs">
                      <span className="text-[10px] font-mono text-primary font-bold">+ 3er Peleador:</span>
                      <span className="font-bold text-white uppercase text-[11px]">{pair.trioMember.name}</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

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
