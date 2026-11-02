"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Plus, Star, Clock, Tv, Film, FileText, ChevronDown, Check } from "lucide-react";

export interface MediaItemType {
  id: string;
  userId: string;
  tmdbId: number | null;
  imdbId?: string | null;
  mediaType: string;
  title: string;
  originalTitle?: string | null;
  posterPath: string | null;
  backdropPath?: string | null;
  overview?: string | null;
  releaseYear?: number | null;
  genres?: string | null;
  status: string;
  rating?: number | null;
  tmdbRating?: number | null;
  imdbRating?: number | null;
  rottenTomatoes?: string | null;
  voteCount?: number | null;
  runtime?: number | null;
  tagline?: string | null;
  network?: string | null;
  country?: string | null;
  director?: string | null;
  cast?: string | null;
  trailerKey?: string | null;
  watchProviders?: string | null;
  nextEpisodeDate?: string | null;
  showStatus?: string | null;
  notes?: string | null;
  seasonsData?: string | null;
  totalSeasons: number;
  totalEpisodes: number;
  currentSeason: number;
  currentEpisode: number;
  lastWatchedAt?: string | null;
}

function formatRuntime(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${m}m`;
}

interface MediaCardProps {
  item: MediaItemType;
  onSelect: (item: MediaItemType) => void;
  onIncrementEpisode: (id: string) => Promise<void>;
  onStatusChange: (id: string, newStatus: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MediaCard({
  item,
  onSelect,
  onIncrementEpisode,
  onStatusChange,
  onDelete,
}: MediaCardProps) {
  const [isIncrementing, setIsIncrementing] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const isTv = item.mediaType === "TV";
  const progressPct =
    item.totalEpisodes > 0 ? Math.min(100, Math.round((item.currentEpisode / item.totalEpisodes) * 100)) : 0;

  useEffect(() => {
    if (!isStatusMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isStatusMenuOpen]);

  const handleQuickNextEp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isIncrementing) return;
    setIsIncrementing(true);
    try {
      await onIncrementEpisode(item.id);
    } finally {
      setIsIncrementing(false);
    }
  };

  const STATUS_OPTIONS = [
    { id: "PLAN_TO_WATCH", label: "Plan to Watch", dot: "bg-amber-400" },
    { id: "WATCHING", label: "Watching", dot: "bg-emerald-400" },
    { id: "COMPLETED", label: "Completed", dot: "bg-indigo-400" },
    { id: "DROPPED", label: "Dropped", dot: "bg-rose-400" },
  ];

  const getStatusColor = (st: string) => {
    switch (st) {
      case "WATCHING":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "PLAN_TO_WATCH":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "COMPLETED":
        return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
      case "DROPPED":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getStatusLabel = (st: string) => {
    switch (st) {
      case "WATCHING":
        return "Watching";
      case "PLAN_TO_WATCH":
        return "Plan to Watch";
      case "COMPLETED":
        return "Completed";
      case "DROPPED":
        return "Dropped";
      default:
        return st;
    }
  };

  const renderStatusDropdown = () => (
    <div className="relative" ref={statusMenuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsStatusMenuOpen((prev) => !prev);
        }}
        className={`group/status flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border transition cursor-pointer ${getStatusColor(
          item.status
        )} hover:brightness-110 active:scale-95`}
        title="Click to change watch status"
      >
        <span>{getStatusLabel(item.status)}</span>
        <ChevronDown
          className={`h-2.5 w-2.5 opacity-60 transition-transform ${isStatusMenuOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Upward Dropdown Menu - opens into the card */}
      {isStatusMenuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full mb-1.5 left-0 z-30 w-36 rounded-xl bg-zinc-900 border border-zinc-700/80 shadow-2xl backdrop-blur-md p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsStatusMenuOpen(false);
                if (opt.id !== item.status) {
                  onStatusChange(item.id, opt.id);
                }
              }}
              className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition ${
                item.status === opt.id
                  ? "bg-zinc-800 text-white font-medium"
                  : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                <span>{opt.label}</span>
              </div>
              {item.status === opt.id && <Check className="h-3 w-3 text-indigo-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700/80 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {/* Poster Media Box */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        {item.posterPath ? (
          <Image
            src={item.posterPath}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 text-center">
            {isTv ? <Tv className="h-10 w-10 text-zinc-700" /> : <Film className="h-10 w-10 text-zinc-700" />}
            <span className="mt-2 text-xs font-medium text-zinc-500 line-clamp-2">{item.title}</span>
          </div>
        )}

        {/* Top Left: Runtime */}
        {item.runtime && (
          <div className="absolute top-2.5 left-2.5 pointer-events-none">
            <div className="flex items-center gap-1 rounded-md bg-zinc-950/75 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-800/80 shadow-sm">
              <Clock className="h-2.5 w-2.5 text-zinc-400" />
              <span>{formatRuntime(item.runtime)}</span>
            </div>
          </div>
        )}

        {/* Top Right: Ratings */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 pointer-events-none">
          {/* Personal Rating */}
          {item.rating ? (
            <div className="flex items-center gap-1 rounded-md bg-amber-500/20 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/30">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{item.rating}</span>
            </div>
          ) : item.imdbRating ? (
            <div className="flex items-center gap-1 rounded-md bg-amber-600/20 backdrop-blur-md px-1 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
              <span className="bg-amber-400 text-zinc-950 text-[9px] px-1 rounded font-black tracking-tight">
                IMDb
              </span>
              <span>{item.imdbRating}</span>
            </div>
          ) : item.tmdbRating ? (
            <div className="flex items-center gap-1 rounded-md bg-zinc-950/80 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 border border-zinc-700/40">
              <Star className="h-3 w-3 fill-zinc-400 text-zinc-400" />
              <span>{item.tmdbRating}</span>
            </div>
          ) : null}
        </div>

        {/* Hover Quick Action Buttons */}
        {isTv && item.status !== "COMPLETED" && (
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
            <div className="flex items-center justify-start pointer-events-auto">
              {/* Quick Next Episode for TV */}
              <button
                onClick={handleQuickNextEp}
                disabled={isIncrementing || item.currentEpisode >= item.totalEpisodes}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-semibold shadow-lg shadow-indigo-600/30 transition transform hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Mark next episode as watched"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Next Ep</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Info Content */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-3.5">
        <div>
          <h3 className="font-semibold text-sm text-zinc-100 line-clamp-1 group-hover:text-indigo-400 transition">
            {item.title}
          </h3>
          {item.genres && (
            <p className="mt-0.5 text-[11px] text-zinc-500 line-clamp-1">{item.genres}</p>
          )}
        </div>

        {/* TV Series Episode Progress Section */}
        {isTv && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 rounded px-1.5 py-0.5 text-[11px]">
                  {`S${String(item.currentSeason || 1).padStart(2, "0")} E${String(item.currentEpisode || 0).padStart(2, "0")}`}
                </span>
                <span className="text-zinc-500 text-[10px]">
                  / {item.totalEpisodes} eps
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.notes && (
                  <span
                    className="flex items-center gap-1 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400 border border-zinc-700/50"
                    title={item.notes}
                  >
                    <FileText className="h-2.5 w-2.5 text-indigo-400 shrink-0" />
                    <span>Note</span>
                  </span>
                )}
                <span className="text-[11px] font-semibold text-zinc-400">{progressPct}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progressPct === 100
                    ? "bg-emerald-500"
                    : progressPct > 50
                    ? "bg-indigo-500"
                    : "bg-indigo-600/70"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* TV Series Quick Status Control & Fast +1 Ep Button */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
              {renderStatusDropdown()}
              <div className="flex items-center">
                {item.status !== "COMPLETED" && item.currentEpisode < item.totalEpisodes && (
                  <button
                    type="button"
                    onClick={handleQuickNextEp}
                    disabled={isIncrementing}
                    className="flex sm:hidden items-center rounded-md bg-indigo-600/90 hover:bg-indigo-500 active:scale-95 text-white px-2 py-0.5 text-[10px] font-bold shadow-xs transition disabled:opacity-50"
                    title="Mark next episode watched (+1)"
                  >
                    +1 Ep
                  </button>
                )}
                {item.totalSeasons > 1 && (
                  <span
                    className={`text-[10px] text-zinc-500 font-medium ${
                      item.status !== "COMPLETED" && item.currentEpisode < item.totalEpisodes
                        ? "hidden sm:inline"
                        : ""
                    }`}
                  >
                    {item.totalSeasons} Seasons
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Movie Watch Status or Notes Indicator */}
        {!isTv && (
          <div className="mt-3 flex items-center justify-between pt-1 border-t border-zinc-800/60">
            {renderStatusDropdown()}
            {item.notes && (
              <span
                className="flex items-center gap-1 rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-700/50 hover:text-zinc-200 transition"
                title={item.notes}
              >
                <FileText className="h-3 w-3 text-indigo-400 shrink-0" />
                <span>Note</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

