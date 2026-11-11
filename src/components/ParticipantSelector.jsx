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
      {/* Boxing Event Billboard Header */}
      <div className="fight-card p-6 sm:p-8 bg-gradient-to-r from-[#030816] via-[#090d18] to-[#160305] border border-neutral-800 space-y-4 boxing-ring-ropes pt-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3 text-[11px] font-mono uppercase tracking-widest text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="text-white font-bold">SPARRING FIGHT NIGHT • TRANSMISIÓN EN VIVO</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-blue-400 font-bold">{unpairedList.length} peleadores libres</span>
            <span className="text-neutral-600">•</span>
            <span className="text-red-400 font-bold">{pairs.length} combates pactados</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase italic text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              Sorteo de Combates y Sparring
            </h1>
            <p className="text-xs text-neutral-400 max-w-xl">
              Selecciona tu nombre, sube al ring y descubre a ciegas a tu rival con animación de combate y guantes de box en tiempo real.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshParticipants}
            className="fight-btn-blue text-[11px] self-start sm:self-auto py-2 px-4 flex items-center gap-2 font-mono font-bold"
            title="Refrescar combates en vivo"
          >
            <span>↻</span> Actualizar cartelera
          </button>
        </div>
      </div>

      {/* Main Fight Night Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sorteador / Peleador en Espera (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="fight-card-blue p-5 sm:p-6 space-y-5">
            <div className="border-b border-blue-900/60 pb-2.5 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-300 font-mono flex items-center gap-1.5">
                <span>🔵</span> 1. ¿Quién sube a sortear rival?
              </h2>
              <span className="text-[10px] font-mono text-blue-400 font-bold">
                {unpairedList.length} disponibles
              </span>
            </div>

            {unpairedList.length === 0 ? (
              <div className="p-6 text-center bg-blue-950/40 border border-blue-800 space-y-2">
                <div className="text-2xl">🏆</div>
                <div className="text-xs font-black uppercase text-white tracking-wide">
                  ¡Cartelera completa!
                </div>
                <p className="text-[11px] text-blue-300">
                  Todos los peleadores ya tienen rival asignado en el ring.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {unpairedList.map((p) => {
                  const isSelected = p.id === selectedId;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={`flex flex-col items-start p-2.5 text-left transition-all border ${
                        isSelected
                          ? 'bg-blue-600/30 border-blue-400 ring-2 ring-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                          : 'bg-[#081226] hover:bg-[#0c1b38] border-blue-900/60 hover:border-blue-500 text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full mb-1">
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.name}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-blue-400"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-900 text-blue-200 flex items-center justify-center text-[10px] font-black flex-shrink-0 border border-blue-500">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-bold uppercase tracking-wide truncate">
                          {p.name}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] font-mono uppercase tracking-wider ${
                          isSelected ? 'text-amber-400 font-bold' : 'text-blue-400/80'
                        }`}
                      >
                        {isSelected ? 'Elegido para pelea' : 'Disponible'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Fighter Banner & Photo Cropper */}
            {selectedUser && (
              <div className="p-3.5 bg-blue-950/70 border border-blue-700 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {selectedUser.photoUrl ? (
                    <img
                      src={selectedUser.photoUrl}
                      alt={selectedUser.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-400 flex-shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-900 border-2 border-blue-400 text-blue-200 font-black text-xs flex items-center justify-center flex-shrink-0">
                      {selectedUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-xs font-black uppercase text-white truncate">
                      {selectedUser.name}
                    </div>
                    <div className="text-[10px] font-mono text-blue-300">
                      {selectedUser.photoUrl ? 'Foto de perfil lista' : 'Sin foto de peleador'}
                    </div>
                  </div>
                </div>

                <label className="cursor-pointer text-[10px] font-mono uppercase tracking-wider px-2.5 py-1.5 border border-blue-400 bg-blue-900 hover:bg-blue-800 text-white font-bold flex-shrink-0 transition-colors shadow">
                  {isUpdatingPhoto ? '...' : selectedUser.photoUrl ? 'Cambiar foto' : '+ Subir foto'}
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

            {/* Enter Ring to Draw Opponent */}
            {unpairedList.length > 0 && (
              <button
                type="button"
                disabled={!selectedId || !selectedUser}
                onClick={handleContinue}
                className="fight-btn-gold w-full h-12 text-xs font-black uppercase tracking-wider"
              >
                {selectedUser ? `🥊 Subir al ring con ${selectedUser.name}` : 'Selecciona tu nombre'}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Cartelera Oficial de Combates (Público) (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="fight-card p-5 sm:p-6 space-y-4 bg-[#090d18] border border-red-900/40">
            <div className="border-b border-neutral-800 pb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-xs font-black font-mono uppercase tracking-wider text-white">
                  Cartelera Oficial de Combates (Público)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-red-400 font-bold">
                {pairs.length} peleas pactadas
              </span>
            </div>

            {pairs.length === 0 ? (
              <div className="py-14 px-4 text-center border border-dashed border-neutral-800 bg-[#060911] space-y-2">
                <div className="text-3xl">🥊</div>
                <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  La campana aún no ha sonado
                </div>
                <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                  En cuanto el primer boxeador suba al ring y elija su carta, el combate pactado aparecerá aquí en vivo con sus guantes y esquinas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[520px] overflow-y-auto pr-1">
                {pairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="p-3.5 bg-gradient-to-r from-[#071329] via-[#090d18] to-[#210609] border border-neutral-700 hover:border-amber-400 transition-all space-y-2 relative shadow-lg"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-400 border-b border-neutral-800 pb-1.5">
                      <span className="font-black text-amber-400 tracking-wider">
                        🥊 COMBATE #{pair.pairNumber}
                      </span>
                      <span className="text-neutral-500">
                        {pair.trioMember ? 'Trío de Sparring' : 'Pelea Pactada 1 vs 1'}
                      </span>
                    </div>

                    {/* Fighter vs Fighter Row */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      {/* Blue Corner */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {pair.member1.photoUrl ? (
                          <img
                            src={pair.member1.photoUrl}
                            alt={pair.member1.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-blue-500 flex-shrink-0 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-900 border-2 border-blue-500 text-blue-200 font-black text-xs flex items-center justify-center flex-shrink-0">
                            {pair.member1.name.charAt(0)}
                          </div>
                        )}
                        <div className="truncate">
                          <div className="text-[9px] font-mono text-blue-400 uppercase font-bold">
                            Azul
                          </div>
                          <div className="text-xs font-black text-white truncate uppercase">
                            {pair.member1.name}
                          </div>
                        </div>
                      </div>

                      {/* VS Emblem in Center */}
                      <div className="px-2 py-0.5 rounded bg-black/80 border border-amber-500/80 text-amber-400 text-xs font-black italic tracking-tighter shadow flex-shrink-0">
                        VS
                      </div>

                      {/* Red Corner */}
                      <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
                        <div className="truncate">
                          <div className="text-[9px] font-mono text-red-400 uppercase font-bold">
                            Roja
                          </div>
                          <div className="text-xs font-black text-white truncate uppercase">
                            {pair.member2.name}
                          </div>
                        </div>
                        {pair.member2.photoUrl ? (
                          <img
                            src={pair.member2.photoUrl}
                            alt={pair.member2.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-red-500 flex-shrink-0 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-red-900 border-2 border-red-500 text-red-200 font-black text-xs flex items-center justify-center flex-shrink-0">
                            {pair.member2.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trio if exists */}
                    {pair.trioMember && (
                      <div className="mt-2 pt-2 border-t border-dashed border-neutral-800 flex items-center justify-center gap-2">
                        <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                          + 3er Integrante de Sparring:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {pair.trioMember.photoUrl ? (
                            <img
                              src={pair.trioMember.photoUrl}
                              alt={pair.trioMember.name}
                              className="w-6 h-6 rounded-full object-cover border border-amber-400"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-amber-900 text-amber-200 text-[10px] font-bold flex items-center justify-center border border-amber-400">
                              {pair.trioMember.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-black uppercase text-white">
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

      {/* Footer Bar with Admin Link */}
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500 border-t border-neutral-800 pt-3">
        <span>Transmisión Oficial de Combates • Resultados en Vivo</span>
        <button
          type="button"
          onClick={onOpenAdmin}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          Organizador de Evento [PIN]
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
