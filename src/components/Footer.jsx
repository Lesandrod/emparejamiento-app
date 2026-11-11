'use client';

import React from 'react';

export default function Footer({ onOpenAdmin }) {
  return (
    <footer className="mt-auto border-t border-[rgba(255,255,255,0.07)] bg-[#090a0d] py-5 text-xs text-zinc-500 select-none">
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-display font-bold text-white tracking-wider text-sm">TORNEO DEL PODER</span>
          <span>•</span>
          <span>Fixture & Matchmaker Studio</span>
          <span>•</span>
          <span className="text-zinc-600">Reglamento Oficial MMA</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Panel Organizador [PIN]
            </button>
          )}
          <span>•</span>
          <span className="text-zinc-600">v3.5.0</span>
        </div>
      </div>
    </footer>
  );
}
