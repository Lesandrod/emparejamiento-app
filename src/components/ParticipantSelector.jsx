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

  // Unpaired participants
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="sharp-card p-6 sm:p-8 space-y-3 bg-white">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-neutral-500 border-b border-[#e5e7eb] pb-3">
          <span>Emparejamiento Público en Vivo</span>
          <span>
            {pairs.length} {pairs.length === 1 ? 'pareja' : 'parejas'} • {unpairedList.length} pendientes
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#090a0f] uppercase">
              Sorteo de Parejas
            </h1>
            <p className="text-xs text-neutral-500">
              Escoge tu nombre, saca tu papelito al azar y tu pareja quedará publicada al instante para todos.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshParticipants}
            className="sharp-outline-btn text-[10px] self-start sm:self-auto py-1.5 px-3 flex items-center gap-1.5 font-mono"
            title="Actualizar resultados en tiempo real"
          >
            <span>↻</span> Actualizar tablero
          </button>
        </div>
      </div>

      {/* Main Grid: Parejas Formadas (Público) & Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sorteador (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sharp-card p-5 sm:p-6 space-y-5 bg-white">
            <div className="border-b border-[#e5e7eb] pb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#090a0f]">
                1. ¿Quién va a sacar papelito?
              </h2>
              <span className="text-[10px] font-mono text-neutral-500">
                {unpairedList.length} disponibles
              </span>
            </div>

            {unpairedList.length === 0 ? (
              <div className="p-6 text-center bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="text-xl">🎉</div>
                <div className="text-xs font-bold uppercase text-[#090a0f]">
                  ¡Todos han sido emparejados!
                </div>
                <p className="text-[11px] text-neutral-500">
                  Todas las parejas han sido formadas y publicadas en el tablero.
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
                          ? 'bg-[#f8fafc] border-[#090a0f] ring-1 ring-[#090a0f] text-[#090a0f]'
                          : 'bg-white hover:bg-[#fafafa] border-[#e5e7eb] hover:border-[#a3a3a3] text-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full mb-1">
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.name}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-neutral-300"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-semibold uppercase tracking-wide truncate">
                          {p.name}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] font-mono uppercase tracking-wider ${
                          isSelected ? 'text-[#090a0f] font-semibold' : 'text-neutral-400'
                        }`}
                      >
                        {isSelected ? 'Seleccionado' : 'Disponible'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected User Info & Photo Upload */}
            {selectedUser && (
              <div className="p-3 bg-[#f9fafb] border border-[#e5e7eb] flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {selectedUser.photoUrl ? (
                    <img
                      src={selectedUser.photoUrl}
                      alt={selectedUser.name}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-300 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {selectedUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-xs font-bold uppercase text-[#090a0f] truncate">
                      {selectedUser.name}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500">
                      {selectedUser.photoUrl ? 'Foto lista' : 'Sin foto'}
                    </div>
                  </div>
                </div>

                <label className="cursor-pointer text-[10px] font-mono uppercase tracking-wider px-2 py-1 border border-neutral-300 hover:border-black bg-white text-[#090a0f] font-semibold flex-shrink-0 transition-colors shadow-sm">
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

            {/* Continue to Roulette Button */}
            {unpairedList.length > 0 && (
              <button
                type="button"
                disabled={!selectedId || !selectedUser}
                onClick={handleContinue}
                className="sharp-primary-btn w-full h-12 text-xs"
              >
                {selectedUser ? `Sacar pareja para ${selectedUser.name}` : 'Selecciona tu nombre'}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Tablero Público de Parejas Formadas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="sharp-card p-5 sm:p-6 space-y-4 bg-white">
            <div className="border-b border-[#e5e7eb] pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#090a0f]">
                  Tablero de Parejas en Vivo (Público)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">
                {pairs.length} parejas formadas
              </span>
            </div>

            {pairs.length === 0 ? (
              <div className="py-12 px-4 text-center border border-dashed border-neutral-200 bg-[#fbfbfb] space-y-2">
                <div className="text-2xl text-neutral-400">🤝</div>
                <div className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                  Aún no se ha formado ninguna pareja
                </div>
                <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
                  El primer participante que saque su papelito aparecerá aquí automáticamente con su pareja para que todos lo vean.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {pairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="p-3.5 bg-[#f9fafb] border border-[#e5e7eb] hover:border-black transition-colors space-y-2 relative"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-500 border-b border-[#ebecef] pb-1.5">
                      <span className="font-bold text-[#090a0f]">
                        Pareja #{pair.pairNumber}
                      </span>
                      <span>
                        {pair.trioMember ? 'Trío oficial' : 'Dúo oficial'}
                      </span>
                    </div>

                    {/* Member 1 & Member 2 */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* Member 1 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {pair.member1.photoUrl ? (
                          <img
                            src={pair.member1.photoUrl}
                            alt={pair.member1.name}
                            className="w-8 h-8 rounded-full object-cover border border-neutral-300 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {pair.member1.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-bold text-[#090a0f] truncate uppercase">
                          {pair.member1.name}
                        </span>
                      </div>

                      {/* Link icon */}
                      <div className="font-mono text-xs font-bold text-neutral-400 flex-shrink-0 px-1">
                        ⇄
                      </div>

                      {/* Member 2 */}
                      <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
                        <span className="text-xs font-bold text-[#090a0f] truncate uppercase">
                          {pair.member2.name}
                        </span>
                        {pair.member2.photoUrl ? (
                          <img
                            src={pair.member2.photoUrl}
                            alt={pair.member2.name}
                            className="w-8 h-8 rounded-full object-cover border border-neutral-300 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {pair.member2.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trio Member if exists */}
                    {pair.trioMember && (
                      <div className="mt-2 pt-2 border-t border-dashed border-[#e5e7eb] flex items-center justify-center gap-2">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">+ Integrante:</span>
                        <div className="flex items-center gap-1.5">
                          {pair.trioMember.photoUrl ? (
                            <img
                              src={pair.trioMember.photoUrl}
                              alt={pair.trioMember.name}
                              className="w-6 h-6 rounded-full object-cover border border-neutral-300"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold flex items-center justify-center">
                              {pair.trioMember.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-bold uppercase text-[#090a0f]">
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
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-400 border-t border-[#e5e7eb] pt-3">
        <span>Emparejamientos certificados y públicos</span>
        <button
          type="button"
          onClick={onOpenAdmin}
          className="text-neutral-600 hover:text-black transition-colors"
        >
          Organizador [PIN]
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
