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
        throw new Error(data.error || 'Error de autenticación');
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
    if (!window.confirm('¿Estás seguro de reiniciar todas las parejas? Todos volverán a quedar libres.')) {
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
        setNotice('Todas las parejas han sido reiniciadas.');
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 3000);
    }
  };

  const handleUnpairDuo = async (pairId, pairNumber) => {
    if (!window.confirm(`¿Deseas romper la Pareja #${pairNumber}? Ambos participantes podrán volver a sacar papelito.`)) {
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
        setNotice(`Pareja #${pairNumber} disuelta correctamente.`);
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } catch {
      setNotice('Error al romper la pareja.');
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
    if (!window.confirm('¿Eliminar participante del sorteo?')) return;
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
        setNotice('Preferencia de pareja guardada.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-[#090a0f] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e5e7eb] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#090a0f]">
              Panel de Organizador
            </h2>
            <span className="text-[10px] font-mono text-neutral-400">
              Control de Sorteo y Parejas
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-black font-mono text-sm px-2 py-1"
          >
            [Cerrar]
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="p-6 space-y-4 max-w-sm mx-auto w-full">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                PIN de Acceso
              </label>
              <input
                type="password"
                placeholder="Ingresa la clave"
                value={adminPin}
                onChange={(e) => {
                  setAdminPin(e.target.value);
                  setAuthError('');
                }}
                className="w-full h-10 px-3 bg-[#f9fafb] border border-[#d1d5db] text-[#090a0f] text-xs font-mono outline-none focus:border-black"
                autoFocus
              />
            </div>

            {authError && (
              <div className="text-xs text-red-600 font-mono">{authError}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="sharp-primary-btn w-full h-10"
            >
              {loading ? 'Verificando...' : 'Acceder al panel'}
            </button>
          </form>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {notice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono text-center">
                {notice}
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-3 bg-[#f9fafb] border border-[#e5e7eb]">
                <div className="text-lg font-bold text-[#090a0f]">{participants.length}</div>
                <div className="text-[9px] uppercase text-neutral-500">Participantes</div>
              </div>
              <div className="p-3 bg-[#f9fafb] border border-[#e5e7eb]">
                <div className="text-lg font-bold text-emerald-700">{pairs.length}</div>
                <div className="text-[9px] uppercase text-neutral-500">Parejas Formadas</div>
              </div>
              <div className="p-3 bg-[#f9fafb] border border-[#e5e7eb]">
                <div className="text-lg font-bold text-neutral-500">
                  {participants.filter((p) => !p.revealed).length}
                </div>
                <div className="text-[9px] uppercase text-neutral-500">Pendientes</div>
              </div>
            </div>

            {/* Formed Pairs Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                <span>Parejas Oficiales Formadas ({pairs.length})</span>
                {pairs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetDraw}
                    className="text-red-600 hover:underline"
                  >
                    [Reiniciar todas las parejas]
                  </button>
                )}
              </div>

              {pairs.length === 0 ? (
                <div className="p-4 border border-dashed border-neutral-200 text-center text-xs font-mono text-neutral-400">
                  No hay parejas formadas todavía.
                </div>
              ) : (
                <div className="border border-[#e5e7eb] divide-y divide-[#f1f2f4] bg-white max-h-48 overflow-y-auto">
                  {pairs.map((p) => (
                    <div key={p.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-400">#{p.pairNumber}</span>
                        <span className="font-semibold">{p.member1.name}</span>
                        <span className="text-neutral-400">⇄</span>
                        <span className="font-semibold">{p.member2.name}</span>
                        {p.trioMember && (
                          <span className="text-neutral-600 font-semibold">(+ {p.trioMember.name})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnpairDuo(p.id, p.pairNumber)}
                        className="text-amber-700 hover:text-amber-900 font-mono text-[10px] font-bold px-2 py-0.5 border border-amber-300 hover:bg-amber-50"
                      >
                        Romper pareja
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Participant */}
            <form onSubmit={handleAddParticipant} className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                Agregar nuevo participante
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre y apellido"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 h-9 px-3 bg-[#f9fafb] border border-[#d1d5db] text-[#090a0f] text-xs outline-none focus:border-black"
                  required
                />
                <button type="submit" disabled={loading} className="sharp-outline-btn px-4 h-9">
                  Agregar
                </button>
              </div>
            </form>

            {/* Participants Table & Rigged Preferences */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                Participantes y Preferencias Secretas
              </span>

              <div className="max-h-56 overflow-y-auto border border-[#e5e7eb] bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#f9fafb] text-neutral-500 border-b border-[#e5e7eb] text-[10px] font-mono uppercase sticky top-0">
                    <tr>
                      <th className="p-2.5 font-medium">Participante</th>
                      <th className="p-2.5 font-medium">Estado</th>
                      <th className="p-2.5 font-medium">Preferencia secreta</th>
                      <th className="p-2.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f2f4]">
                    {participants.map((p) => {
                      const currentPrefId = preferences[p.id] || '';

                      return (
                        <tr key={p.id} className="hover:bg-[#f9fafb]">
                          <td className="p-2.5 font-medium text-neutral-900">
                            <div className="flex items-center gap-2">
                              {p.photoUrl ? (
                                <img
                                  src={p.photoUrl}
                                  alt={p.name}
                                  className="w-7 h-7 rounded-full object-cover border border-neutral-300 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-[10px] text-neutral-600 font-bold flex-shrink-0">
                                  {p.name.charAt(0)}
                                </div>
                              )}
                              <span className="truncate">{p.name}</span>
                              <label
                                className="cursor-pointer text-[9px] font-mono uppercase px-1.5 py-0.5 border border-neutral-300 hover:border-black bg-neutral-50 text-neutral-600 ml-1"
                                title="Subir y recortar foto"
                              >
                                {p.photoUrl ? 'Editar' : '+ Foto'}
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

                          <td className="p-2.5 font-mono text-[10px] uppercase">
                            <span className={p.revealed ? 'text-emerald-700 font-semibold' : 'text-neutral-400'}>
                              {p.revealed ? `Pareja #${p.pairNumber}` : 'Libre'}
                            </span>
                          </td>

                          <td className="p-2.5 font-medium">
                            {p.revealed ? (
                              <span className="text-neutral-400 text-[10px] font-mono">Emparejado</span>
                            ) : (
                              <select
                                value={currentPrefId}
                                onChange={(e) => handleSetPreference(p.id, e.target.value)}
                                className={`text-[10px] font-mono h-7 px-1.5 border outline-none cursor-pointer max-w-[160px] truncate ${
                                  currentPrefId
                                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                                    : 'bg-[#f9fafb] border-[#d1d5db] text-neutral-500'
                                }`}
                              >
                                <option value="">(Al azar - Sin fijar)</option>
                                {participants
                                  .filter((other) => other.id !== p.id && !other.revealed)
                                  .map((other) => (
                                    <option key={other.id} value={other.id}>
                                      Fijar con: {other.name}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </td>

                          <td className="p-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteParticipant(p.id)}
                              className="text-neutral-400 hover:text-red-600 font-mono text-xs px-2 py-0.5"
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
