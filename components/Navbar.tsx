"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, UploadCloud, Search, LogOut, User as UserIcon, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useRouter } from "next/navigation";

interface NavbarProps {
  counts: Record<string, number>;
  onOpenSearch: () => void;
  onOpenBatchImport: () => void;
  onOpenAddCustom: () => void;
}

interface UserProfile {
  id: string;
  name?: string | null;
  username?: string | null;
  email: string;
  role: string;
}

export function Navbar({ counts, onOpenSearch, onOpenBatchImport, onOpenAddCustom }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    }
    loadUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const userInitial = (user?.name || user?.username || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md safe-top">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3 gap-2 min-w-0">
        {/* Brand */}
        <div className="shrink-0 min-w-0">
          <Logo size={38} showText={true} />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            aria-label="Search TMDB"
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 h-10 px-2.5 sm:px-3 text-sm text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850 hover:text-white active:scale-95 transition shadow-sm cursor-pointer"
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
            className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 h-10 px-2.5 sm:px-3 text-sm font-medium text-zinc-200 hover:border-indigo-500/40 hover:bg-indigo-950/30 hover:text-indigo-300 active:scale-95 transition cursor-pointer"
            title="Import 30+ items at once from notes"
          >
            <UploadCloud className="h-4 w-4 text-indigo-400" />
            <span className="hidden sm:inline">Batch Import</span>
          </button>

          {/* Custom Add Button */}
          <button
            onClick={onOpenAddCustom}
            aria-label="Add Media"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 h-10 px-3 sm:px-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Media</span>
          </button>

          {/* User Profile Avatar & Dropdown */}
          {user && (
            <div className="relative ml-1" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="User Account"
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/60 hover:bg-zinc-800 text-indigo-300 font-bold text-sm shadow-sm transition active:scale-95 cursor-pointer"
              >
                {userInitial}
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl p-2 shadow-2xl shadow-black/80 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2.5 border-b border-zinc-800/80">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-white truncate">{user.name || user.username}</p>
                      {user.role === "ADMIN" && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                          <Shield className="h-2.5 w-2.5" />
                          Admin
                        </span>
                      )}
                    </div>
                    {user.username && (
                      <p className="text-[11px] font-medium text-indigo-400 truncate mt-0.5">
                        @{user.username}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email}</p>
                  </div>

                  <div className="pt-1.5">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
