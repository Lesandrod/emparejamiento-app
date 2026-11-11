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
      {/* Program Ledger Header */}
      <div className="ticket-card p-6 bg-[#0a0d16] border border-[#1b2336] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2336] pb-3 text-[11px] font-mono-tech text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-600 inline-block" />
            <span className="text-white font-bold tracking-widest">
              OFFICIAL SPARRING BOUT SHEET
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-blue-400 font-bold">
              ROSTER: {unpairedList.length} PENDIENTES
            </span>
            <span className="text-neutral-600">/</span>
            <span className="text-red-400 font-bold">
              COMBATES: {pairs.length} CONFIRMADOS
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <h1 className="text-3xl sm:text-4xl font-fighter font-bold text-white tracking-wide">
              EMPAREJAMIENTO DE COMBATES
            </h1>
            <p className="text-xs text-neutral-400 font-mono-tech mt-0.5">
              SELECCIONA PELEADOR PARA ASIGNAR RIVAL A CIEGAS EN EL CUADRILÁTERO.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshParticipants}
            className="btn-press-outline px-3.5 h-9 self-start sm:self-auto font-mono-tech"
          >
            [↻ ACTUALIZAR CARTELERA]
          </button>
        </div>
      </div>

      {/* Main Grid: Roster & Fight Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Fighter Roster (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="ticket-card-blue p-5 space-y-4 bg-[#0a0f1d]">
            <div className="border-b border-[#1b2742] pb-2 flex items-center justify-between">
              <span className="text-xs font-mono-tech text-blue-400 font-bold tracking-wider">
                ROSTER DISPONIBLE ({unpairedList.length})
              </span>
              <span className="text-[10px] font-mono-tech text-neutral-400">
                ESQUINA AZUL
              </span>
            </div>

            {unpairedList.length === 0 ? (
              <div className="p-8 text-center border border-[#1b2742] bg-[#070b14] space-y-2">
                <div className="text-xs font-mono-tech font-bold text-white tracking-wider">
                  CARTELERA COMPLETA
                </div>
                <p className="text-[11px] text-neutral-400 font-mono-tech">
                  TODOS LOS PELEADORES DEL PROGRAMA HAN SIDO ASIGNADOS.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {unpairedList.map((p, idx) => {
                  const isSelected = p.id === selectedId;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={`flex flex-col items-start p-2.5 text-left transition-all border ${
                        isSelected
                          ? 'bg-blue-950/80 border-blue-400 ring-1 ring-blue-400 text-white'
                          : 'bg-[#080d1a] hover:bg-[#0c1428] border-[#18233c] text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full mb-1.5">
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.name}
                            className="w-7 h-7 object-cover border border-blue-500 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 bg-[#101b33] border border-blue-500/60 text-blue-300 flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-fighter tracking-wide truncate text-white">
                          {p.name}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] font-mono-tech ${
                          isSelected ? 'text-amber-400 font-bold' : 'text-neutral-500'
                        }`}
                      >
                        {isSelected ? '[SELECCIONADO]' : `ENTRY #${String(idx + 1).padStart(2, '0')}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Fighter Details & Crop Button */}
            {selectedUser && (
              <div className="p-3 bg-[#070b16] border border-[#1b2742] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {selectedUser.photoUrl ? (
                    <img
                      src={selectedUser.photoUrl}
                      alt={selectedUser.name}
                      className="w-10 h-10 object-cover border border-blue-400 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-[#101b33] border border-blue-400 text-blue-300 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {selectedUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-xs font-fighter text-white truncate tracking-wider">
                      {selectedUser.name}
                    </div>
                    <div className="text-[10px] font-mono-tech text-blue-400">
                      {selectedUser.photoUrl ? 'FOTO CONFIRMADA' : 'SIN FOTO'}
                    </div>
                  </div>
                </div>

                <label className="cursor-pointer text-[10px] font-mono-tech px-2 py-1 border border-neutral-700 hover:border-white bg-[#0e1526] text-neutral-300 hover:text-white flex-shrink-0 transition-colors">
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

            {/* Enter Ring Button */}
            {unpairedList.length > 0 && (
              <button
                type="button"
                disabled={!selectedId || !selectedUser}
                onClick={handleContinue}
                className="btn-press-primary w-full h-11 text-xs"
              >
                {selectedUser ? `SUBIR AL RING (${selectedUser.name})` : 'SELECCIONA PELEADOR'}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Fight Card Schedule (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="ticket-card p-5 space-y-4 bg-[#0a0d16] border border-[#1b2336]">
            <div className="border-b border-[#1b2336] pb-2 flex items-center justify-between">
              <span className="text-xs font-mono-tech text-white font-bold tracking-wider">
                CARTELERA OFICIAL DE COMBATES ({pairs.length})
              </span>
              <span className="text-[10px] font-mono-tech text-red-400 font-bold">
                PROGRAMA EN VIVO
              </span>
            </div>

            {pairs.length === 0 ? (
              <div className="py-14 px-4 text-center border border-dashed border-[#1b2336] bg-[#070910] space-y-1">
                <div className="text-xs font-mono-tech text-neutral-400 font-bold tracking-wider">
                  NINGÚN COMBATE PACTADO AÚN
                </div>
                <p className="text-[11px] text-neutral-500 font-mono-tech max-w-sm mx-auto">
                  LOS COMBATES PACTADOS SE REGISTRARÁN AQUÍ AUTOMÁTICAMENTE A MEDIDA QUE CADA BOXEADOR SAQUE SU CARTA.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {pairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="p-3 bg-[#0d111c] border border-[#1a2233] hover:border-neutral-500 transition-colors space-y-2 relative"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono-tech text-neutral-400 border-b border-[#161d2d] pb-1.5">
                      <span className="font-bold text-amber-500 tracking-wider">
                        BOUT {String(pair.pairNumber).padStart(2, '0')}
                      </span>
                      <span className="text-neutral-500">
                        {pair.trioMember ? 'MODALIDAD: TRÍO' : 'MODALIDAD: 1 VS 1'}
                      </span>
                    </div>

                    {/* Matchup Layout */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      {/* Blue Corner */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 tape-blue pl-2">
                        {pair.member1.photoUrl ? (
                          <img
                            src={pair.member1.photoUrl}
                            alt={pair.member1.name}
                            className="w-8 h-8 object-cover border border-blue-500 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-[#101b33] border border-blue-500 text-blue-300 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {pair.member1.name.charAt(0)}
                          </div>
                        )}
                        <div className="truncate">
                          <div className="text-[9px] font-mono-tech text-blue-400 font-bold">
                            AZUL
                          </div>
                          <div className="text-xs font-fighter text-white truncate">
                            {pair.member1.name}
                          </div>
                        </div>
                      </div>

                      {/* Technical VS Divider */}
                      <div className="px-2 py-0.5 border border-[#2b354c] bg-[#070a12] text-neutral-300 text-[10px] font-mono-tech font-bold flex-shrink-0">
                        VS
                      </div>

                      {/* Red Corner */}
                      <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right tape-red pr-2">
                        <div className="truncate">
                          <div className="text-[9px] font-mono-tech text-red-400 font-bold">
                            ROJA
                          </div>
                          <div className="text-xs font-fighter text-white truncate">
                            {pair.member2.name}
                          </div>
                        </div>
                        {pair.member2.photoUrl ? (
                          <img
                            src={pair.member2.photoUrl}
                            alt={pair.member2.name}
                            className="w-8 h-8 object-cover border border-red-500 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-[#2d0e13] border border-red-500 text-red-300 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {pair.member2.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trio if exists */}
                    {pair.trioMember && (
                      <div className="mt-2 pt-2 border-t border-dashed border-[#1a2233] flex items-center justify-center gap-2">
                        <span className="text-[10px] font-mono-tech text-amber-500">
                          + 3ER INTEGRANTE:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {pair.trioMember.photoUrl ? (
                            <img
                              src={pair.trioMember.photoUrl}
                              alt={pair.trioMember.name}
                              className="w-6 h-6 object-cover border border-amber-500"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-[#2b1807] text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center border border-amber-500">
                              {pair.trioMember.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-fighter text-white">
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
      <div className="flex items-center justify-between text-[11px] font-mono-tech text-neutral-500 border-t border-[#1b2336] pt-3">
        <span>FIGHT NIGHT MATCHMAKER • VERSIÓN OFICIAL</span>
        <button
          type="button"
          onClick={onOpenAdmin}
          className="text-neutral-400 hover:text-white transition-colors"
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
