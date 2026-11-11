'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header({
  participantCount = 0,
  onOpenAdmin
}) {
  const pathname = usePathname();
  const isRosterActive = pathname === '/';
  const isFixtureActive = pathname === '/fixture';

  return (
    <header className="border-b border-outline-dim bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Brand & Event Identity */}
        <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded bg-[#d4af37] text-black font-display font-black text-xl tracking-tighter leading-none shadow-sm">
              UFC
            </span>
            <span className="font-display font-bold text-xs sm:text-sm tracking-widest text-white uppercase">
              TORNEO DEL PODER
            </span>
          </div>
          <div className="h-4 w-px bg-outline-dim hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-surface-container text-[#d4af37] font-mono text-[11px] font-bold tracking-wider uppercase border border-[#d4af37]/30">
              EDICIÓN OFICIAL
            </span>
            <span className="text-xs text-on-surface-variant font-medium hidden md:inline font-mono">
              / FIXTURE STUDIO
            </span>
          </div>
        </Link>

        {/* Navigation Tabs using real Next.js routing */}
        <nav className="hidden md:flex items-center gap-1 text-xs">
          <Link
            href="/"
            className={`px-3.5 py-2 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              isRosterActive
                ? 'text-white border-b-2 border-[#d4af37]'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-[#d4af37]">groups</span>
            <span>Peleadores ({participantCount})</span>
          </Link>

          <Link
            href="/fixture"
            className={`px-3.5 py-2 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              isFixtureActive
                ? 'text-white border-b-2 border-[#d4af37]'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-[#d4af37]">account_tree</span>
            <span>Árbol Fixture</span>
          </Link>

          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-3.5 py-2 text-on-surface-variant hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">tune</span>
              <span>Organizador [PIN]</span>
            </button>
          )}
        </nav>

        {/* Broadcast Status & Quick Actions */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container border border-outline-dim">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-[10px] font-mono font-semibold tracking-wider text-on-surface uppercase">
              TORNEO EN VIVO
            </span>
          </div>

          <div className="h-3 w-px bg-outline-dim hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2 text-on-surface-variant font-mono text-[11px]">
            <span className="text-outline-subtle">Roster:</span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-white font-medium">
              {participantCount} Peleadores
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
