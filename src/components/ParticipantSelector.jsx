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
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropParticipant, setCropParticipant] = useState(null);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

  // Unpaired fighters
  const unpairedList = participants.filter((p) => !p.revealed);
  const selectedUser = unpairedList.find((p) => p.id === selectedId);

  const handleContinue = () => {
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
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Cyber-HUD Billboard */}
      <div className="hud-panel p-6 sm:p-8 space-y-4">
        {/* Telemetry Dots & Header Tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5252] shadow-[0_0_10px_#ff5252]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffd600] shadow-[0_0_10px_#ffd600]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e676] shadow-[0_0_10px_#00e676]" />
            </div>
            <span className="px-2.5 py-0.5 rounded-md border border-cyan-400/50 bg-cyan-950/40 text-[10px] font-mono-tech text-cyan-300 font-bold tracking-widest shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              SISTEMA_01 • MATCHMAKER
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-tech">
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              ROSTER: {unpairedList.length} DISPONIBLES
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-red-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              COMBATES: {pairs.length} PACTADOS
            </span>
          </div>
        </div>

        {/* Hero Title in UFC Aggressive Typography */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <h1 className="text-3xl sm:text-5xl font-ufc font-bold tracking-wider text-white">
              NEO GENESIS <span className="text-[#00f0ff] drop-shadow-[0_0_20px_rgba(0,240,255,0.7)]">FIGHT NIGHT</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-hud mt-1 max-w-xl">
              Protocolo de emparejamiento de sparring en cuadrilátero cibernético. Sube al ring para revelar tu rival a ciegas.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshParticipants}
            className="btn-cyber-outline px-4 h-11 self-start sm:self-auto font-mono-tech"
          >
            [↻ ACTUALIZAR CARTELERA]
          </button>
        </div>
      </div>

      {/* Main Dual Grid: Roster & Live Program */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Fighter Roster (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="hud-panel-blue p-5 sm:p-6 space-y-4">
            <div className="border-b border-cyan-500/30 pb-3 flex items-center justify-between">
              <span className="text-xs font-mono-tech text-cyan-300 font-bold tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
                PELEADORES DISPONIBLES ({unpairedList.length})
              </span>
              <span className="text-[10px] font-mono-tech text-cyan-400/80">
                ESQUINA AZUL
              </span>
            </div>

            {unpairedList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-cyan-500/30 bg-blue-950/30 space-y-2">
                <div className="text-sm font-ufc font-bold text-white tracking-wider">
                  CARTELERA COMPLETA
                </div>
                <p className="text-xs text-neutral-400 font-hud">
                  Todos los peleadores han sido asignados en el cuadrilátero.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {unpairedList.map((p, idx) => {
                  const isSelected = p.id === selectedId;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={`flex flex-col items-start p-3 text-left transition-all rounded-xl border ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-400 text-white shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                          : 'bg-[#081226]/80 hover:bg-[#0c1a38] border-blue-900/60 hover:border-cyan-500/60 text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 w-full mb-1.5">
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.name}
                            className="w-8 h-8 rounded-full object-cover border border-cyan-400 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-900/80 border border-cyan-400 text-cyan-200 flex items-center justify-center text-xs font-ufc font-bold flex-shrink-0">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs sm:text-sm font-ufc font-bold tracking-wide truncate text-white">
                          {p.name}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] font-mono-tech ${
                          isSelected ? 'text-amber-400 font-bold' : 'text-cyan-400/70'
                        }`}
                      >
                        {isSelected ? 'SELECCIONADO' : `ENTRY #${String(idx + 1).padStart(2, '0')}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Fighter Details & Crop Button */}
            {selectedUser && (
              <div className="p-3.5 bg-blue-950/60 border border-cyan-500/40 rounded-xl flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {selectedUser.photoUrl ? (
                    <img
                      src={selectedUser.photoUrl}
                      alt={selectedUser.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-cyan-400 flex-shrink-0 shadow-[0_0_10px_#00f0ff]"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-blue-900 border-2 border-cyan-400 text-cyan-200 font-ufc font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {selectedUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-sm font-ufc font-bold text-white truncate tracking-wider">
                      {selectedUser.name}
                    </div>
                    <div className="text-[10px] font-mono-tech text-cyan-300">
                      {selectedUser.photoUrl ? 'FOTO CONFIRMADA' : 'SIN FOTO DE PELEADOR'}
                    </div>
                  </div>
                </div>

                <label className="cursor-pointer text-[10px] font-mono-tech px-2.5 py-1.5 border border-cyan-400/60 hover:border-cyan-400 bg-cyan-950/50 text-cyan-300 rounded-lg flex-shrink-0 transition-colors">
                  {isUpdatingPhoto ? '...' : selectedUser.photoUrl ? '[EDITAR FOTO]' : '[+ SUBIR FOTO]'}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUpdatingPhoto}
                    onChange={(e) => {
                      handleSelectFile(selectedUser, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Enter Ring Button (Cyan Neo Button) */}
            {unpairedList.length > 0 && (
              <button
                type="button"
                disabled={!selectedId || !selectedUser}
                onClick={handleContinue}
                className="btn-cyber-cyan w-full h-12 text-sm"
              >
                {selectedUser ? `SUBIR AL RING (${selectedUser.name})` : 'SELECCIONA TU NOMBRE'}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Fight Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="hud-panel p-5 sm:p-6 space-y-4">
            <div className="border-b border-blue-900/40 pb-3 flex items-center justify-between">
              <span className="text-xs font-mono-tech text-white font-bold tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ff0055]" />
                CARTELERA OFICIAL EN VIVO ({pairs.length})
              </span>
              <span className="text-[10px] font-mono-tech text-red-400 font-bold">
                PROGRAMA PÚBLICO
              </span>
            </div>

            {pairs.length === 0 ? (
              <div className="py-14 px-4 text-center rounded-2xl border border-dashed border-blue-900/40 bg-[#070b16] space-y-2">
                <div className="text-sm font-mono-tech text-neutral-400 font-bold tracking-wider">
                  NINGÚN COMBATE PACTADO AÚN
                </div>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto font-hud">
                  Los combates pactados se registrarán aquí automáticamente a medida que cada boxeador saque su carta.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {pairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="p-4 rounded-xl bg-gradient-to-r from-[#09142e] via-[#090d1a] to-[#2b0811] border border-[#1e2d4d] hover:border-cyan-400/60 transition-all space-y-2.5 relative shadow-lg"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono-tech text-neutral-400 border-b border-white/10 pb-2">
                      <span className="font-bold text-amber-400 tracking-wider">
                        BOUT #{pair.pairNumber}
                      </span>
                      <span className="text-neutral-400 font-hud">
                        {pair.trioMember ? 'MODALIDAD: TRÍO' : 'SPARRING 1 VS 1'}
                      </span>
                    </div>

                    {/* Matchup Layout */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      {/* Blue Corner */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {pair.member1.photoUrl ? (
                          <img
                            src={pair.member1.photoUrl}
                            alt={pair.member1.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 flex-shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-950 border-2 border-cyan-400 text-cyan-200 font-ufc font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {pair.member1.name.charAt(0)}
                          </div>
                        )}
                        <div className="truncate">
                          <div className="text-[9px] font-mono-tech text-cyan-400 font-bold">
                            ESQUINA AZUL
                          </div>
                          <div className="text-sm font-ufc font-bold text-white truncate">
                            {pair.member1.name}
                          </div>
                        </div>
                      </div>

                      {/* Glowing VS Badge */}
                      <div className="px-2.5 py-1 rounded-lg bg-black/90 border border-amber-400 text-amber-400 text-xs font-ufc font-bold shadow-[0_0_10px_rgba(255,171,0,0.4)] flex-shrink-0">
                        VS
                      </div>

                      {/* Red Corner */}
                      <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 text-right">
                        <div className="truncate">
                          <div className="text-[9px] font-mono-tech text-red-400 font-bold">
                            ESQUINA ROJA
                          </div>
                          <div className="text-sm font-ufc font-bold text-white truncate">
                            {pair.member2.name}
                          </div>
                        </div>
                        {pair.member2.photoUrl ? (
                          <img
                            src={pair.member2.photoUrl}
                            alt={pair.member2.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-red-500 flex-shrink-0 shadow-[0_0_10px_rgba(255,23,68,0.5)]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-950 border-2 border-red-500 text-red-200 font-ufc font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {pair.member2.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trio if exists */}
                    {pair.trioMember && (
                      <div className="mt-2 pt-2 border-t border-dashed border-white/10 flex items-center justify-center gap-2">
                        <span className="text-[10px] font-mono-tech text-amber-400">
                          + 3ER INTEGRANTE:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {pair.trioMember.photoUrl ? (
                            <img
                              src={pair.trioMember.photoUrl}
                              alt={pair.trioMember.name}
                              className="w-6 h-6 rounded-full object-cover border border-amber-400"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-amber-950 text-amber-200 text-[10px] font-mono font-bold flex items-center justify-center border border-amber-400">
                              {pair.trioMember.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-ufc text-white font-bold">
                            {pair.trioMember.name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between text-[11px] font-mono-tech text-neutral-400 border-t border-blue-900/40 pt-3">
        <span>UFC NEO GENESIS • SPARRING PAIRING ENGINE</span>
        <button
          type="button"
          onClick={onOpenAdmin}
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          [PANEL DE ORGANIZADOR]
        </button>
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
