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
  const [newAlias, setNewAlias] = useState('');

  // Participant Editing
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAlias, setEditAlias] = useState('');

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
        body: JSON.stringify({
          pin: adminPin,
          action: 'add',
          name: newName.trim(),
          alias: newAlias.trim()
        })
      });
      if (res.ok) {
        setNewName('');
        setNewAlias('');
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name || '');
    setEditAlias(p.alias || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditAlias('');
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: adminPin,
          action: 'update',
          participantId: id,
          name: editName.trim(),
          alias: editAlias.trim()
        })
      });
      if (res.ok) {
        setEditingId(null);
        setNotice('Peleador actualizado.');
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 2500);
    }
  };

  const handleDeleteParticipant = async (id) => {
    if (!window.confirm('¿Eliminar peleador del roster oficial?')) return;
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
      <div className="w-full max-w-2xl bg-surface-dim border border-outline-dim rounded-xl shadow-2xl flex flex-col max-h-[90vh] text-on-surface overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-outline-dim flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-[#d4af37] text-black font-display font-black text-xs tracking-tight shadow-sm">
              UFC
            </span>
            <div>
              <h2 className="text-sm font-display font-bold text-white tracking-wider uppercase">
                Panel Matchmaker Apex
              </h2>
              <span className="text-[10px] text-on-surface-variant font-mono">
                Gestión Oficial de Cartelera y Combates
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-white font-mono text-xs transition-colors cursor-pointer"
          >
            [CERRAR]
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="p-6 space-y-4 max-w-sm mx-auto w-full">
            <div className="space-y-1.5">
              <label className="text-[10px] text-on-surface-variant uppercase font-mono font-bold tracking-wider">
                CLAVE DE ORGANIZADOR (PIN)
              </label>
              <input
                type="password"
                placeholder="Ingresa clave"
                value={adminPin}
                onChange={(e) => {
                  setAdminPin(e.target.value);
                  setAuthError('');
                }}
                className="w-full h-10 px-3.5 bg-surface-container border border-outline-dim rounded-lg text-white text-xs font-mono outline-none focus:border-primary"
                autoFocus
              />
            </div>

            {authError && (
              <div className="text-xs text-red-400 font-mono">{authError}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-primary hover:bg-yellow-400 text-black font-display font-bold text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer"
            >
              {loading ? 'Verificando...' : 'Acceder al Panel'}
            </button>
          </form>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {notice && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-mono text-center rounded-lg">
                {notice}
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
              <div className="p-3 bg-surface-container border border-outline-dim rounded-lg">
                <div className="text-xl font-bold text-white font-display">{participants.length}</div>
                <div className="text-[9px] text-on-surface-variant uppercase">Roster Total</div>
              </div>
              <div className="p-3 bg-surface-container border border-outline-dim rounded-lg">
                <div className="text-xl font-bold text-primary font-display">{pairs.length}</div>
                <div className="text-[9px] text-on-surface-variant uppercase">Combates</div>
              </div>
              <div className="p-3 bg-surface-container border border-outline-dim rounded-lg">
                <div className="text-xl font-bold text-emerald-400 font-display">
                  {participants.filter((p) => !p.revealed).length}
                </div>
                <div className="text-[9px] text-on-surface-variant uppercase">En Espera</div>
              </div>
            </div>

            {/* Formed Fights */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold uppercase tracking-wider">Combates en Cartelera ({pairs.length})</span>
                {pairs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetDraw}
                    className="text-red-400 hover:underline text-xs"
                  >
                    [Reiniciar Cartelera]
                  </button>
                )}
              </div>

              {pairs.length === 0 ? (
                <div className="p-4 border border-dashed border-[rgba(255,255,255,0.07)] rounded-lg text-center text-xs font-mono text-zinc-500">
                  No hay combates registrados aún.
                </div>
              ) : (
                <div className="border border-[rgba(255,255,255,0.07)] rounded-lg divide-y divide-[rgba(255,255,255,0.07)] bg-[#161920] max-h-48 overflow-y-auto font-mono text-xs">
                  {pairs.map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#d4af37]">#{p.pairNumber}</span>
                        <span className="font-bold text-[#38bdf8]">{p.member1.name}</span>
                        <span className="text-zinc-500">VS</span>
                        <span className="font-bold text-[#f87171]">{p.member2.name}</span>
                        {p.trioMember && (
                          <span className="text-zinc-400">(+{p.trioMember.name})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnpairDuo(p.id, p.pairNumber)}
                        className="text-amber-400 hover:text-amber-300 text-[10px] px-2 py-0.5 border border-amber-500/50 rounded hover:bg-amber-950/40"
                      >
                        [Disolver]
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Fighter */}
            <form onSubmit={handleAddParticipant} className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                Inscribir Peleador al Roster
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Nombre de peleador *"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="sm:col-span-6 h-9 px-3 bg-[#161920] border border-[rgba(255,255,255,0.07)] rounded-lg text-white text-xs outline-none focus:border-[#d4af37]"
                  required
                />
                <input
                  type="text"
                  placeholder='Alias / Apodo (Ej: El Destructor)'
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  className="sm:col-span-4 h-9 px-3 bg-[#161920] border border-[rgba(255,255,255,0.07)] rounded-lg text-amber-300 text-xs outline-none focus:border-[#d4af37]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="sm:col-span-2 h-9 rounded-lg bg-[#d4af37] text-black text-xs font-black uppercase tracking-wider hover:bg-yellow-400 transition-colors cursor-pointer"
                >
                  Inscribir
                </button>
              </div>
            </form>

            {/* Matchmaker Rigging Preferences */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                Combates Predefinidos y Gestión de Peleadores
              </span>

              <div className="max-h-64 overflow-y-auto border border-[rgba(255,255,255,0.07)] rounded-lg bg-[#161920]">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-[#1c1f27] text-zinc-400 border-b border-[rgba(255,255,255,0.07)] text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2.5 font-medium">PELEADOR Y ALIAS</th>
                      <th className="p-2.5 font-medium">ESTADO</th>
                      <th className="p-2.5 font-medium">RIVAL PREFIJADO</th>
                      <th className="p-2.5 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.07)]">
                    {participants.map((p) => {
                      const currentPrefId = preferences[p.id] || '';
                      const isEditing = editingId === p.id;

                      return (
                        <tr key={p.id} className="hover:bg-[#1c1f27]/50">
                          <td className="p-2.5 font-medium text-white">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Nombre *"
                                  className="h-7 px-2 bg-[#111317] border border-[#d4af37] rounded text-white text-xs w-32 font-sans outline-none"
                                  required
                                />
                                <input
                                  type="text"
                                  value={editAlias}
                                  onChange={(e) => setEditAlias(e.target.value)}
                                  placeholder="Alias / Apodo"
                                  className="h-7 px-2 bg-[#111317] border border-[#d4af37] rounded text-primary text-xs w-28 font-mono outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(p.id)}
                                  className="text-xs px-2 py-1 bg-primary text-black font-bold rounded cursor-pointer"
                                  title="Guardar cambios"
                                >
                                  ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="text-xs px-2 py-1 bg-[#23242a] text-zinc-400 hover:text-white rounded cursor-pointer"
                                  title="Cancelar"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {p.photoUrl ? (
                                  <img
                                    src={p.photoUrl}
                                    alt={p.name}
                                    className="w-8 h-8 rounded-full object-cover border border-[#38bdf8] flex-shrink-0 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#1c1f27] border border-[rgba(255,255,255,0.07)] flex items-center justify-center text-[10px] text-zinc-300 font-bold flex-shrink-0">
                                    {p.name.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="truncate font-display font-bold text-white flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                    {p.alias && (
                                      <span className="text-primary font-mono text-[10px] font-normal truncate">
                                        "{p.alias}"
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <label
                                  className="cursor-pointer text-[9px] px-1.5 py-0.5 border border-[rgba(255,255,255,0.1)] hover:border-[#d4af37] bg-[#1c1f27] text-zinc-400 rounded ml-1"
                                  title="Subir foto"
                                >
                                  {p.photoUrl ? 'Foto' : '+Foto'}
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
                            )}
                          </td>

                          <td className="p-2.5 text-[10px]">
                            <span className={p.revealed ? 'text-[#d4af37] font-bold' : 'text-[#38bdf8]'}>
                              {p.revealed ? `Bout #${p.pairNumber}` : 'Libre'}
                            </span>
                          </td>

                          <td className="p-2.5 font-medium">
                            {p.revealed ? (
                              <span className="text-zinc-500 text-[10px]">Pactado</span>
                            ) : (
                              <select
                                value={currentPrefId}
                                onChange={(e) => handleSetPreference(p.id, e.target.value)}
                                className={`text-[10px] h-7 px-1.5 border outline-none cursor-pointer rounded-lg max-w-[160px] truncate ${
                                  currentPrefId
                                    ? 'bg-amber-950/80 border-[#d4af37] text-amber-200'
                                    : 'bg-[#111317] border-[rgba(255,255,255,0.1)] text-zinc-300'
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
                            <div className="flex items-center justify-end gap-1.5">
                              {!isEditing && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(p)}
                                  className="text-primary hover:text-yellow-400 text-[11px] px-2 py-0.5 border border-primary/30 rounded bg-primary/10 hover:bg-primary/20 cursor-pointer"
                                  title="Editar nombre y alias"
                                >
                                  Editar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteParticipant(p.id)}
                                className="text-zinc-500 hover:text-red-400 text-xs px-2 py-0.5 cursor-pointer"
                                title="Eliminar peleador"
                              >
                                [X]
                              </button>
                            </div>
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
