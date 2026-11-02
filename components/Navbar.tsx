"use client";

import React from "react";
import { Plus, UploadCloud, Search } from "lucide-react";
import { Logo } from "@/components/Logo";

interface NavbarProps {
  counts: Record<string, number>;
  onOpenSearch: () => void;
  onOpenBatchImport: () => void;
  onOpenAddCustom: () => void;
}

export function Navbar({ counts, onOpenSearch, onOpenBatchImport, onOpenAddCustom }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md safe-top">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3">
        {/* Brand */}
        <Logo size={38} showText={true} />

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            aria-label="Search TMDB"
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 h-10 px-2.5 sm:px-3 text-sm text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850 hover:text-white active:scale-95 transition shadow-sm"
          >
            <Search className="h-4 w-4 text-zinc-400" />
            <span className="hidden md:inline text-xs text-zinc-400">Search TMDB...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
              Ctrl+K
            </kbd>
          </button>

          {/* Batch Import Button */}
          <button
            onClick={onOpenBatchImport}
            aria-label="Batch Import"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 h-10 px-2.5 sm:px-3 text-sm font-medium text-zinc-200 hover:border-indigo-500/40 hover:bg-indigo-950/30 hover:text-indigo-300 active:scale-95 transition"
            title="Import 30+ items at once from notes"
          >
            <UploadCloud className="h-4 w-4 text-indigo-400" />
            <span className="hidden sm:inline">Batch Import</span>
          </button>

          {/* Custom Add Button */}
          <button
            onClick={onOpenAddCustom}
            aria-label="Add Media"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 h-10 px-3 sm:px-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Media</span>
          </button>
        </div>
      </div>
    </header>
  );
}

