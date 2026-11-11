'use client';

import React, { useState, useEffect } from 'react';

export default function PinPromptModal({
  isOpen,
  title = 'Autorización Requerida',
  description = 'Ingresa la clave de organizador para autorizar esta acción.',
  actionLabel = 'Confirmar',
  onConfirm,
  onClose
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Debes ingresar la clave.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Validate PIN with backend
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim(), action: 'verify' })
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Clave de organizador incorrecta.');
      }

      // PIN is valid: run callback with validated pin
      await onConfirm(pin.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Clave incorrecta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md select-none animate-fade-in">
      <div className="w-full max-w-sm bg-surface-dim border-2 border-primary/40 rounded-2xl shadow-2xl p-6 text-on-surface relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-outline-dim pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-white font-mono text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-on-surface-variant font-mono mb-5 leading-relaxed">
          {description}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-primary uppercase font-mono font-bold tracking-wider block">
              CLAVE DE ORGANIZADOR (PIN)
            </label>
            <input
              type="password"
              placeholder="Ingresa clave"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              className="w-full h-11 px-4 bg-surface-container border border-outline-dim focus:border-primary rounded-xl text-white text-sm font-mono tracking-widest outline-none transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono text-center">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-dim text-xs font-semibold text-on-surface transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-primary hover:bg-yellow-400 text-black text-xs font-display font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span>Verificando...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">lock_open</span>
                  <span>{actionLabel}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
