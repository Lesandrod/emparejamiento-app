'use client';

import React, { useState, useEffect } from 'react';
import ImageCropperModal from './ImageCropperModal';

export default function AdminModal({
  isOpen,
  onClose,
  hasTournamentBracket = false,
  onResetTournament,
  onRefreshParticipants
}) {
  const [adminPin, setAdminPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  // Admin Data
  const [participants, setParticipants] = useState([]);
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
        setNotice('Peleador actualizado correctamente.');
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 2500);
    }
  };

  const handleDeleteParticipant = async (id) => {
    if (!window.confirm('¿Eliminar este peleador del roster oficial del torneo?')) return;
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

  const handleResetTournamentTree = async () => {
    if (!window.confirm('¿Estás seguro de que deseas BORRAR el árbol del Torneo del Poder? Se eliminarán todas las llaves y rondas avanzadas.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      if (res.ok) {
        setNotice('Árbol del torneo borrado exitosamente.');
        if (onResetTournament) await onResetTournament();
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } catch {
      setNotice('Error al borrar el árbol.');
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 3000);
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
                Panel Matchmaker • Torneo del Poder
              </h2>
              <span className="text-[10px] text-on-surface-variant font-mono">
                Gestión Oficial de Roster y Fixture
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

            {/* Metrics & Actions Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
              <div className="p-3.5 bg-surface-container border border-outline-dim rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white font-display">{participants.length}</div>
                  <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    Peleadores Registrados
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary text-3xl">sports_mma</span>
              </div>

              <div className="p-3.5 bg-surface-container border border-outline-dim rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white uppercase flex items-center gap-1.5 font-sans">
                    <span className={`w-2 h-2 rounded-full ${hasTournamentBracket ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                    <span>{hasTournamentBracket ? 'Árbol Fixture Activo' : 'Sin Árbol Generado'}</span>
                  </div>
                  <div className="text-[10px] text-on-surface-variant mt-0.5">
                    {hasTournamentBracket ? 'Llaves de combate en curso' : 'Listo para sortear'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetTournamentTree}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 hover:text-white text-[11px] font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Borrar árbol y reiniciar torneo"
                >
                  <span className="material-symbols-outlined text-[14px]">delete_forever</span>
                  <span>Borrar Árbol</span>
                </button>
              </div>
            </div>

            {/* Add Fighter to Roster */}
            <form onSubmit={handleAddParticipant} className="space-y-1.5 bg-surface-container-low p-4 rounded-xl border border-outline-dim">
              <span className="text-[10px] text-primary uppercase font-bold tracking-wider block font-mono">
                + Inscribir Peleador al Roster Oficial
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Nombre de peleador *"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="sm:col-span-6 h-9 px-3 bg-surface-container border border-outline-dim rounded-lg text-white text-xs outline-none focus:border-primary font-sans"
                  required
                />
                <input
                  type="text"
                  placeholder='Alias / Apodo (Ej: El Destructor)'
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  className="sm:col-span-4 h-9 px-3 bg-surface-container border border-outline-dim rounded-lg text-primary text-xs outline-none focus:border-primary font-mono"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="sm:col-span-2 h-9 rounded-lg bg-primary text-black text-xs font-black uppercase tracking-wider hover:bg-yellow-400 transition-colors cursor-pointer"
                >
                  Inscribir
                </button>
              </div>
            </form>

            {/* Fighter Roster Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold uppercase tracking-wider font-mono text-[11px]">
                  Roster Oficial de Contendientes ({participants.length})
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Edita nombres, apodos y fotos
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto border border-outline-dim rounded-xl bg-surface-container-low">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-surface-container text-zinc-400 border-b border-outline-dim text-[10px] sticky top-0 z-10">
                    <tr>
                      <th className="p-3 font-semibold uppercase">Peleador y Foto</th>
                      <th className="p-3 font-semibold uppercase">Alias / Apodo</th>
                      <th className="p-3 text-right font-semibold uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-dim">
                    {participants.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-zinc-500 text-xs">
                          No hay peleadores registrados aún.
                        </td>
                      </tr>
                    ) : (
                      participants.map((p) => {
                        const isEditing = editingId === p.id;

                        return (
                          <tr key={p.id} className="hover:bg-surface-container/50 transition-colors">
                            <td className="p-3 font-medium text-white">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Nombre *"
                                    className="h-7 px-2.5 bg-surface-container border border-primary rounded text-white text-xs w-36 font-sans outline-none"
                                    required
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2.5">
                                  {p.photoUrl ? (
                                    <img
                                      src={p.photoUrl}
                                      alt={p.name}
                                      className="w-9 h-9 rounded-full object-cover border border-primary/50 flex-shrink-0 shadow-sm"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-surface-container-high border border-outline-dim flex items-center justify-center text-xs text-primary font-bold flex-shrink-0">
                                      {p.name.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <span className="font-display font-bold text-white block uppercase truncate">
                                      {p.name}
                                    </span>
                                  </div>

                                  <label
                                    className="cursor-pointer text-[9px] px-2 py-0.5 border border-outline-dim hover:border-primary bg-surface-container text-zinc-400 hover:text-white rounded-md transition-colors ml-1 shadow-sm"
                                    title="Subir o recortar foto"
                                  >
                                    {p.photoUrl ? 'Cambiar Foto' : '+Foto'}
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

                            <td className="p-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editAlias}
                                  onChange={(e) => setEditAlias(e.target.value)}
                                  placeholder="Alias / Apodo"
                                  className="h-7 px-2.5 bg-surface-container border border-primary rounded text-primary text-xs w-32 font-mono outline-none"
                                />
                              ) : p.alias ? (
                                <span className="text-primary font-mono text-xs font-bold">
                                  "{p.alias}"
                                </span>
                              ) : (
                                <span className="text-zinc-600 text-xs italic">
                                  Sin apodo
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEdit(p.id)}
                                      className="text-xs px-2.5 py-1 bg-primary text-black font-bold rounded-md hover:bg-yellow-400 transition-colors cursor-pointer"
                                      title="Guardar cambios"
                                    >
                                      ✓ Guardar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEdit}
                                      className="text-xs px-2 py-1 bg-surface-container-high text-zinc-400 hover:text-white rounded-md transition-colors cursor-pointer"
                                      title="Cancelar"
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(p)}
                                      className="text-primary hover:text-yellow-400 text-[11px] px-2.5 py-1 border border-primary/30 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer font-bold"
                                      title="Editar nombre y alias"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteParticipant(p.id)}
                                      className="text-zinc-500 hover:text-red-400 text-xs px-2 py-1 rounded-md hover:bg-red-950/30 transition-colors cursor-pointer"
                                      title="Eliminar peleador"
                                    >
                                      [Eliminar]
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
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
