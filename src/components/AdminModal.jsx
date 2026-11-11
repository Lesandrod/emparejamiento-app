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
    if (!window.confirm('¿Reiniciar todos los combates pactados? Todos los boxeadores volverán a estar libres en el ring.')) {
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
        setNotice('Todos los combates han sido reiniciados.');
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 3000);
    }
  };

  const handleUnpairDuo = async (pairId, pairNumber) => {
    if (!window.confirm(`¿Disolver el Combate #${pairNumber}? Ambos peleadores podrán volver a sortear rival.`)) {
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
        setNotice(`Combate #${pairNumber} disuelto correctamente.`);
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
    if (!window.confirm('¿Eliminar peleador de la cartelera?')) return;
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
        setNotice('Combate predefinido guardado.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#090d18] border border-neutral-700 shadow-2xl flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-[#040813]">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 font-mono">
              🥊 Panel de Organizador de Sparring
            </h2>
            <span className="text-[10px] font-mono text-neutral-400">
              Control de Cartelera, Peleas y Esquinas
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white font-mono text-sm px-2 py-1"
          >
            [Cerrar]
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="p-6 space-y-4 max-w-sm mx-auto w-full">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Clave de Acceso
              </label>
              <input
                type="password"
                placeholder="Ingresa la clave (ej. admin123)"
                value={adminPin}
                onChange={(e) => {
                  setAdminPin(e.target.value);
                  setAuthError('');
                }}
                className="w-full h-10 px-3 bg-[#060a14] border border-neutral-700 text-white text-xs font-mono outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            {authError && (
              <div className="text-xs text-red-400 font-mono">{authError}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="fight-btn-blue w-full h-10 text-xs"
            >
              {loading ? 'Verificando...' : 'Acceder al panel'}
            </button>
          </form>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {notice && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-mono text-center">
                {notice}
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-3 bg-[#060a14] border border-neutral-800">
                <div className="text-lg font-bold text-white">{participants.length}</div>
                <div className="text-[9px] uppercase text-neutral-400">Boxeadores</div>
              </div>
              <div className="p-3 bg-[#060a14] border border-neutral-800">
                <div className="text-lg font-bold text-amber-400">{pairs.length}</div>
                <div className="text-[9px] uppercase text-neutral-400">Combates</div>
              </div>
              <div className="p-3 bg-[#060a14] border border-neutral-800">
                <div className="text-lg font-bold text-blue-400">
                  {participants.filter((p) => !p.revealed).length}
                </div>
                <div className="text-[9px] uppercase text-neutral-400">Sin rival</div>
              </div>
            </div>

            {/* Formed Fights Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                <span>Combates Oficiales en Cartelera ({pairs.length})</span>
                {pairs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetDraw}
                    className="text-red-400 hover:underline"
                  >
                    [Reiniciar todos los combates]
                  </button>
                )}
              </div>

              {pairs.length === 0 ? (
                <div className="p-4 border border-dashed border-neutral-800 text-center text-xs font-mono text-neutral-500">
                  No hay combates pactados aún.
                </div>
              ) : (
                <div className="border border-neutral-800 divide-y divide-neutral-800 bg-[#060a14] max-h-48 overflow-y-auto">
                  {pairs.map((p) => (
                    <div key={p.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">#{p.pairNumber}</span>
                        <span className="font-bold text-blue-400">{p.member1.name}</span>
                        <span className="text-neutral-500">VS</span>
                        <span className="font-bold text-red-400">{p.member2.name}</span>
                        {p.trioMember && (
                          <span className="text-amber-300 font-semibold">(+ {p.trioMember.name})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnpairDuo(p.id, p.pairNumber)}
                        className="text-amber-400 hover:text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 border border-amber-600/60 hover:bg-amber-950/40"
                      >
                        Disolver pelea
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Fighter */}
            <form onSubmit={handleAddParticipant} className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                Inscribir nuevo boxeador
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre del boxeador"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 h-9 px-3 bg-[#060a14] border border-neutral-700 text-white text-xs outline-none focus:border-amber-400"
                  required
                />
                <button type="submit" disabled={loading} className="fight-btn-blue px-4 h-9 text-xs">
                  Inscribir
                </button>
              </div>
            </form>

            {/* Fighters Table & Rigged Matchups */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                Boxeadores y Combates Predefinidos (Truco de Organizador)
              </span>

              <div className="max-h-56 overflow-y-auto border border-neutral-800 bg-[#060a14]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#040813] text-neutral-400 border-b border-neutral-800 text-[10px] font-mono uppercase sticky top-0">
                    <tr>
                      <th className="p-2.5 font-medium">Boxeador</th>
                      <th className="p-2.5 font-medium">Estado</th>
                      <th className="p-2.5 font-medium">Pelea fijada</th>
                      <th className="p-2.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {participants.map((p) => {
                      const currentPrefId = preferences[p.id] || '';

                      return (
                        <tr key={p.id} className="hover:bg-[#090f1e]">
                          <td className="p-2.5 font-medium text-white">
                            <div className="flex items-center gap-2">
                              {p.photoUrl ? (
                                <img
                                  src={p.photoUrl}
                                  alt={p.name}
                                  className="w-7 h-7 rounded-full object-cover border border-neutral-600 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-600 flex items-center justify-center text-[10px] text-neutral-200 font-bold flex-shrink-0">
                                  {p.name.charAt(0)}
                                </div>
                              )}
                              <span className="truncate">{p.name}</span>
                              <label
                                className="cursor-pointer text-[9px] font-mono uppercase px-1.5 py-0.5 border border-neutral-700 hover:border-amber-400 bg-neutral-900 text-neutral-300 ml-1"
                                title="Subir y recortar foto de boxeador"
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
                            <span className={p.revealed ? 'text-amber-400 font-bold' : 'text-blue-400'}>
                              {p.revealed ? `Combate #${p.pairNumber}` : 'Sin rival'}
                            </span>
                          </td>

                          <td className="p-2.5 font-medium">
                            {p.revealed ? (
                              <span className="text-neutral-500 text-[10px] font-mono">Pactado</span>
                            ) : (
                              <select
                                value={currentPrefId}
                                onChange={(e) => handleSetPreference(p.id, e.target.value)}
                                className={`text-[10px] font-mono h-7 px-1.5 border outline-none cursor-pointer max-w-[160px] truncate ${
                                  currentPrefId
                                    ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold'
                                    : 'bg-[#090e1b] border-neutral-700 text-neutral-300'
                                }`}
                              >
                                <option value="">(Al azar - Sin fijar)</option>
                                {participants
                                  .filter((other) => other.id !== p.id && !other.revealed)
                                  .map((other) => (
                                    <option key={other.id} value={other.id}>
                                      Pelear con: {other.name}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </td>

                          <td className="p-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteParticipant(p.id)}
                              className="text-neutral-500 hover:text-red-400 font-mono text-xs px-2 py-0.5"
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
