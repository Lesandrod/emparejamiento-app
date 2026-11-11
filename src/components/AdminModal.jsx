'use client';

import React, { useState, useEffect } from 'react';
import ImageCropperModal from './ImageCropperModal';

export default function AdminModal({ isOpen, onClose, onRefreshParticipants }) {
  const [adminPin, setAdminPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  // Admin Data
  const [participants, setParticipants] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [newName, setNewName] = useState('');

  // Photo Cropper
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropParticipant, setCropParticipant] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setAdminPin('');
      setIsAuthenticated(false);
      setAuthError('');
      setNotice('');
    }
  }, [isOpen]);

  const loadAdminStatus = async (pin) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, action: 'status' })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Clave de organizador inválida');
      }
      setParticipants(data.participants || []);
      setPairs(data.pairs || []);
      setPreferences(data.preferences || {});
      setIsAuthenticated(true);
      setAuthError('');
    } catch (err) {
      setAuthError(err.message);
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      await loadAdminStatus(adminPin);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDraw = async () => {
    if (!window.confirm('¿Reiniciar todos los combates de la cartelera?')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, action: 'reset' })
      });
      if (res.ok) {
        setNotice('Cartelera reiniciada.');
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 3000);
    }
  };

  const handleUnpairDuo = async (pairId, pairNumber) => {
    if (!window.confirm(`¿Disolver Bout #${pairNumber}?`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, action: 'unpair', pairId })
      });
      if (res.ok) {
        setNotice(`Bout #${pairNumber} disuelto.`);
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } catch {
      setNotice('Error al disolver combate.');
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 3000);
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, action: 'add', name: newName.trim() })
      });
      if (res.ok) {
        setNewName('');
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParticipant = async (id) => {
    if (!window.confirm('¿Eliminar peleador?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, action: 'delete', participantId: id })
      });
      if (res.ok) {
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetPreference = async (giverId, receiverId) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, action: 'setPreference', giverId, receiverId })
      });
      if (res.ok) {
        setNotice('Matchup predefinido guardado.');
        await loadAdminStatus(adminPin);
      }
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 2500);
    }
  };

  const handleSelectFileForCrop = (participant, file) => {
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
    const participantId = cropParticipant.id;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: adminPin,
          action: 'updatePhoto',
          participantId,
          photoUrl: croppedBase64
        })
      });
      if (res.ok) {
        setNotice(`Foto de ${cropParticipant.name} actualizada.`);
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } finally {
      setCropImageSrc(null);
      setCropParticipant(null);
      setTimeout(() => setNotice(''), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md select-none">
      <div className="w-full max-w-2xl bg-[#090d18] border border-cyan-500/40 rounded-2xl shadow-[0_0_35px_rgba(0,240,255,0.2)] flex flex-col max-h-[90vh] text-white overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-blue-900/40 flex items-center justify-between bg-[#060a16]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            <div>
              <h2 className="text-base font-ufc font-bold text-white tracking-wider">
                PANEL DE ORGANIZADOR <span className="text-cyan-400">UFC MATCHMAKER</span>
              </h2>
              <span className="text-[10px] font-mono-tech text-neutral-400">
                GESTIÓN DE COMBATES Y PREFERENCIAS
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white font-mono-tech text-xs"
          >
            [CERRAR]
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="p-6 space-y-4 max-w-sm mx-auto w-full">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-tech text-neutral-400">
                CLAVE DE ACCESO (PIN)
              </label>
              <input
                type="password"
                placeholder="Ingresa la clave"
                value={adminPin}
                onChange={(e) => {
                  setAdminPin(e.target.value);
                  setAuthError('');
                }}
                className="w-full h-11 px-3.5 bg-[#060912] border border-cyan-500/40 rounded-xl text-white text-xs font-mono-tech outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                autoFocus
              />
            </div>

            {authError && (
              <div className="text-xs text-red-400 font-mono-tech">{authError}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-neo-cyan w-full h-11 text-xs"
            >
              {loading ? 'ACCEDIENDO...' : 'INGRESAR'}
            </button>
          </form>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {notice && (
              <div className="p-2.5 bg-cyan-950/80 border border-cyan-400 text-cyan-200 text-xs font-mono-tech text-center rounded-xl">
                {notice}
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2.5 text-center font-mono-tech">
              <div className="p-3 bg-[#060912] border border-blue-900/40 rounded-xl">
                <div className="text-xl font-bold text-white font-ufc">{participants.length}</div>
                <div className="text-[9px] text-neutral-400">ROSTER</div>
              </div>
              <div className="p-3 bg-[#060912] border border-blue-900/40 rounded-xl">
                <div className="text-xl font-bold text-amber-400 font-ufc">{pairs.length}</div>
                <div className="text-[9px] text-neutral-400">COMBATES</div>
              </div>
              <div className="p-3 bg-[#060912] border border-blue-900/40 rounded-xl">
                <div className="text-xl font-bold text-cyan-400 font-ufc">
                  {participants.filter((p) => !p.revealed).length}
                </div>
                <div className="text-[9px] text-neutral-400">DISPONIBLES</div>
              </div>
            </div>

            {/* Formed Fights */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono-tech text-neutral-400">
                <span>COMBATES EN CARTELERA ({pairs.length})</span>
                {pairs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetDraw}
                    className="text-red-400 hover:underline"
                  >
                    [REINICIAR TODO]
                  </button>
                )}
              </div>

              {pairs.length === 0 ? (
                <div className="p-4 border border-dashed border-blue-900/40 rounded-xl text-center text-xs font-mono-tech text-neutral-500">
                  NO HAY COMBATES REGISTRADOS AÚN.
                </div>
              ) : (
                <div className="border border-blue-900/40 rounded-xl divide-y divide-blue-900/30 bg-[#060912] max-h-48 overflow-y-auto font-mono-tech">
                  {pairs.map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">#{p.pairNumber}</span>
                        <span className="font-bold text-cyan-400">{p.member1.name}</span>
                        <span className="text-neutral-500">VS</span>
                        <span className="font-bold text-red-400">{p.member2.name}</span>
                        {p.trioMember && (
                          <span className="text-neutral-400">(+{p.trioMember.name})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnpairDuo(p.id, p.pairNumber)}
                        className="text-amber-400 hover:text-amber-300 text-[10px] px-2 py-0.5 border border-amber-500/50 rounded-lg hover:bg-amber-950/40"
                      >
                        [DISOLVER]
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Fighter */}
            <form onSubmit={handleAddParticipant} className="space-y-1.5">
              <span className="text-[10px] font-mono-tech text-neutral-400 block">
                INSCRIBIR PELEADOR AL ROSTER
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre de peleador"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 h-10 px-3.5 bg-[#060912] border border-cyan-500/40 rounded-xl text-white text-xs outline-none focus:border-cyan-400"
                  required
                />
                <button type="submit" disabled={loading} className="btn-neo-cyan px-4 h-10 text-xs">
                  INSCRIBIR
                </button>
              </div>
            </form>

            {/* Matchmaker Rigging Preferences */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono-tech text-neutral-400 block">
                COMBATES PREDEFINIDOS (PREFERENCIAS)
              </span>

              <div className="max-h-56 overflow-y-auto border border-blue-900/40 rounded-xl bg-[#060912]">
                <table className="w-full text-xs text-left font-mono-tech">
                  <thead className="bg-[#05070f] text-neutral-400 border-b border-blue-900/40 text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2.5 font-medium">PELEADOR</th>
                      <th className="p-2.5 font-medium">ESTADO</th>
                      <th className="p-2.5 font-medium">RIVAL PREFIJADO</th>
                      <th className="p-2.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-900/20">
                    {participants.map((p) => {
                      const currentPrefId = preferences[p.id] || '';

                      return (
                        <tr key={p.id} className="hover:bg-[#0c1220]">
                          <td className="p-2.5 font-medium text-white">
                            <div className="flex items-center gap-2">
                              {p.photoUrl ? (
                                <img
                                  src={p.photoUrl}
                                  alt={p.name}
                                  className="w-7 h-7 rounded-full object-cover border border-cyan-400 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-blue-950 border border-cyan-400 flex items-center justify-center text-[10px] text-cyan-200 font-bold flex-shrink-0">
                                  {p.name.charAt(0)}
                                </div>
                              )}
                              <span className="truncate font-ufc">{p.name}</span>
                              <label
                                className="cursor-pointer text-[9px] px-1.5 py-0.5 border border-cyan-400/40 hover:border-cyan-400 bg-cyan-950/40 text-cyan-300 rounded ml-1"
                                title="Subir foto"
                              >
                                {p.photoUrl ? 'FOTO' : '+FOTO'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    handleSelectFileForCrop(p, e.target.files?.[0]);
                                    e.target.value = '';
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </td>

                          <td className="p-2.5 text-[10px]">
                            <span className={p.revealed ? 'text-amber-400 font-bold' : 'text-cyan-400'}>
                              {p.revealed ? `BOUT #${p.pairNumber}` : 'LIBRE'}
                            </span>
                          </td>

                          <td className="p-2.5 font-medium">
                            {p.revealed ? (
                              <span className="text-neutral-500 text-[10px]">PACTADO</span>
                            ) : (
                              <select
                                value={currentPrefId}
                                onChange={(e) => handleSetPreference(p.id, e.target.value)}
                                className={`text-[10px] h-7 px-1.5 border outline-none cursor-pointer rounded-lg max-w-[160px] truncate ${
                                  currentPrefId
                                    ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                                    : 'bg-[#080d1a] border-blue-900/60 text-neutral-300'
                                }`}
                              >
                                <option value="">(AL AZAR)</option>
                                {participants
                                  .filter((other) => other.id !== p.id && !other.revealed)
                                  .map((other) => (
                                    <option key={other.id} value={other.id}>
                                      FIJAR: {other.name}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </td>

                          <td className="p-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteParticipant(p.id)}
                              className="text-neutral-500 hover:text-red-400 text-xs px-2 py-0.5"
                            >
                              [X]
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
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
