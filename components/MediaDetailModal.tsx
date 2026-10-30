"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import {
  X,
  Star,
  Tv,
  Film,
  Calendar,
  Layers,
  Plus,
  Minus,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  ExternalLink,
  Clapperboard,
  Video,
  Check,
} from "lucide-react";
import { MediaItemType } from "./MediaCard";

interface MediaDetailModalProps {
  item: MediaItemType | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: {
    id: string;
    status: string;
    rating: number | null;
    notes: string | null;
    currentSeason: number;
    currentEpisode: number;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatRuntime(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

export function MediaDetailModal({
  item,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: MediaDetailModalProps) {
  const [status, setStatus] = useState<string>("PLAN_TO_WATCH");
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(0);
  const [activeSeasonTab, setActiveSeasonTab] = useState<number>(1);
  const [showTrailer, setShowTrailer] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isBackdropClick = useRef(false);

  const parsedSeasons = useMemo(() => {
    if (!item || item.mediaType !== "TV") return [];
    if (item.seasonsData) {
      try {
        const parsed = JSON.parse(item.seasonsData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => ({
            seasonNumber: s.seasonNumber || 1,
            name: s.name || `Season ${s.seasonNumber || 1}`,
            episodeCount: s.episodeCount || 10,
          }));
        }
      } catch (e) {
        console.warn("Failed to parse seasonsData:", e);
      }
    }
    const count = Math.max(1, item?.totalSeasons || 1);
    const perSeason = Math.max(1, Math.ceil((item?.totalEpisodes || 10) / count));
    const list = [];
    for (let s = 1; s <= count; s++) {
      list.push({ seasonNumber: s, name: `Season ${s}`, episodeCount: perSeason });
    }
    return list;
  }, [item]);

  const activeSeasonObj = useMemo(() => {
    return (
      parsedSeasons.find((s) => s.seasonNumber === activeSeasonTab) ||
      parsedSeasons[0] || { seasonNumber: 1, name: "Season 1", episodeCount: 10 }
    );
  }, [parsedSeasons, activeSeasonTab]);

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    isBackdropClick.current = e.target === e.currentTarget;
  };

  const handleBackdropMouseUp = (e: React.MouseEvent) => {
    if (isBackdropClick.current && e.target === e.currentTarget) {
      onClose();
    }
    isBackdropClick.current = false;
  };

  useEffect(() => {
    if (item) {
      setStatus(item.status);
      setRating(item.rating ?? null);
      setNotes(item.notes || "");
      setCurrentSeason(item.currentSeason || 1);
      setCurrentEpisode(item.currentEpisode || 0);
      setActiveSeasonTab(item.currentSeason || 1);
      setShowTrailer(false);
      setShowDeleteConfirm(false);
    }
  }, [item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const isTv = item.mediaType === "TV";
  const progressPct =
    item.totalEpisodes > 0 ? Math.min(100, Math.round((currentEpisode / item.totalEpisodes) * 100)) : 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        id: item.id,
        status,
        rating,
        notes: notes.trim() ? notes.trim() : null,
        currentSeason,
        currentEpisode,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStepEpisode = (delta: number) => {
    const nextVal = Math.max(0, Math.min(item.totalEpisodes, currentEpisode + delta));
    setCurrentEpisode(nextVal);
    if (nextVal > 0 && status === "PLAN_TO_WATCH") {
      setStatus("WATCHING");
    }
    if (nextVal >= item.totalEpisodes && item.totalEpisodes > 1) {
      setStatus("COMPLETED");
    }
  };

  return (
    <div
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Backdrop Header */}
        <div className="relative h-48 sm:h-60 w-full overflow-hidden bg-zinc-950">
          {item.backdropPath ? (
            <Image
              src={item.backdropPath}
              alt={item.title}
              fill
              className="object-cover opacity-35"
              priority
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-zinc-950" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />

          {/* Close & Trailer Buttons */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            {item.trailerKey && (
              <button
                type="button"
                onClick={() => setShowTrailer(!showTrailer)}
                className="flex items-center gap-1.5 rounded-full bg-red-600/90 hover:bg-red-500 text-white px-3 py-1 text-xs font-semibold shadow-lg transition backdrop-blur-md"
              >
                <Play className="h-3 w-3 fill-white" />
                <span>{showTrailer ? "Close Trailer" : "Trailer"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full bg-zinc-950/70 p-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition backdrop-blur-md border border-zinc-700/50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Header Info Overlay */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3.5">
            {/* Small Poster thumbnail */}
            <div className="relative h-24 w-16 sm:h-28 sm:w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-950 border border-zinc-700/80 shadow-xl">
              {item.posterPath ? (
                <Image src={item.posterPath} alt={item.title} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-600">
                  {isTv ? <Tv className="h-8 w-8" /> : <Film className="h-8 w-8" />}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30 uppercase">
                  {isTv ? "TV Series" : "Movie"}
                </span>
                {item.releaseYear && (
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <Calendar className="h-3 w-3" />
                    <span>{item.releaseYear}</span>
                  </span>
                )}
                {item.runtime && (
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatRuntime(item.runtime)}</span>
                  </span>
                )}
                {item.network && (
                  <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-300">
                    {item.network}
                  </span>
                )}
              </div>

              <h2 className="mt-1 font-bold text-lg sm:text-xl text-white truncate">{item.title}</h2>
              {item.tagline && (
                <p className="text-xs text-indigo-300/80 italic truncate">"{item.tagline}"</p>
              )}
              {item.genres && (
                <p className="text-xs text-zinc-400 truncate">{item.genres}</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Embedded YouTube Trailer Player */}
          {showTrailer && item.trailerKey && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-zinc-800 shadow-2xl animate-in fade-in duration-200">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${item.trailerKey}?autoplay=1`}
                title={`${item.title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          )}

          {/* Scores & Ratings Multi-Pill Bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs">
            {/* IMDb Rating */}
            {item.imdbRating ? (
              <a
                href={item.imdbId ? `https://www.imdb.com/title/${item.imdbId}/` : "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-amber-300 font-semibold hover:bg-amber-500/25 transition group"
                title="View on IMDb"
              >
                <span className="bg-amber-400 text-zinc-950 text-[10px] px-1 rounded font-black tracking-tight">
                  IMDb
                </span>
                <span>{item.imdbRating}</span>
                <ExternalLink className="h-2.5 w-2.5 text-amber-400/70 group-hover:text-amber-300" />
              </a>
            ) : item.imdbId ? (
              <a
                href={`https://www.imdb.com/title/${item.imdbId}/`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-zinc-300 hover:text-white transition"
              >
                <span className="bg-amber-400 text-zinc-950 text-[10px] px-1 rounded font-black">IMDb</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ) : null}


            {/* TMDB Rating */}
            {item.tmdbRating && (
              <div className="flex items-center gap-1 rounded-lg bg-zinc-900 border border-zinc-700/60 px-2.5 py-1 text-zinc-300">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-zinc-200">{item.tmdbRating}</span>
                <span className="text-[10px] text-zinc-500">TMDB</span>
              </div>
            )}

            {/* Show Status & Next Episode */}
            {isTv && item.showStatus && (
              <span
                className={`rounded-lg px-2.5 py-1 font-semibold border ${
                  item.showStatus === "Ended"
                    ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                }`}
              >
                {item.showStatus === "Ended" ? "Series Ended" : "Returning Series"}
              </span>
            )}

            {item.nextEpisodeDate && (
              <span className="rounded-lg bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 text-indigo-300 font-medium">
                Next: {item.nextEpisodeDate}
              </span>
            )}

            {/* Director */}
            {item.director && (
              <span className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-400">
                Dir: <strong className="text-zinc-200">{item.director}</strong>
              </span>
            )}
          </div>

          {/* Where to Watch in Turkey (Streaming Providers) */}
          {item.watchProviders && (
            <div className="rounded-xl bg-zinc-950/70 border border-indigo-500/20 p-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 mb-1.5">
                Stream in Turkey
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {item.watchProviders.split(",").map((prov, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-indigo-950/40 border border-indigo-500/30 px-2.5 py-1 text-xs font-medium text-indigo-200"
                  >
                    {prov.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Synopsis */}
          {item.overview && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Overview
              </h4>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                {item.overview}
              </p>
            </div>
          )}

          {/* Cast */}
          {item.cast && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Top Cast
              </h4>
              <p className="text-xs text-zinc-300 font-medium">{item.cast}</p>
            </div>
          )}

          {/* Status & Rating Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-zinc-950/60 border border-zinc-800 p-3.5">
            {/* Watch Status Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Watch Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="PLAN_TO_WATCH">Plan to Watch</option>
                <option value="WATCHING">Watching</option>
                <option value="COMPLETED">Completed</option>
                <option value="DROPPED">Dropped</option>
              </select>
            </div>

            {/* Rating Selector (1-10) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-400">My Personal Rating</label>
                {rating && (
                  <button
                    onClick={() => setRating(null)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                      rating !== null && rating >= num
                        ? "bg-amber-500 text-zinc-950 shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TV Shows: Interactive Season & Episode Progress Manager */}
          {isTv && (
            <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-4 space-y-3.5">
              {/* Header: Title & Current Watching Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Tv className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-zinc-100">Season & Episode Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded-lg px-2 py-0.5">
                    {currentEpisode > 0
                      ? `S${String(currentSeason).padStart(2, "0")} E${String(currentEpisode).padStart(2, "0")}`
                      : "Not Started"}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    ({progressPct}% Total)
                  </span>
                </div>
              </div>

              {/* Season Selection Tabs */}
              {parsedSeasons.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {parsedSeasons.map((s) => {
                    const isTabActive = activeSeasonTab === s.seasonNumber;
                    const isSeasonCompleted =
                      currentSeason > s.seasonNumber ||
                      (currentSeason === s.seasonNumber && currentEpisode >= s.episodeCount);

                    return (
                      <button
                        key={s.seasonNumber}
                        type="button"
                        onClick={() => setActiveSeasonTab(s.seasonNumber)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition border ${
                          isTabActive
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                            : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:bg-zinc-850"
                        }`}
                      >
                        {isSeasonCompleted && (
                          <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                        )}
                        <span>{s.name}</span>
                        <span className="text-[10px] opacity-70">({s.episodeCount} eps)</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Active Season Episodes Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">
                    {activeSeasonObj.name} Episodes ({activeSeasonObj.episodeCount} total)
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Click an episode to set progress
                  </span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 max-h-48 overflow-y-auto p-1 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                  {Array.from({ length: activeSeasonObj.episodeCount }, (_, i) => i + 1).map((ep) => {
                    const isWatched =
                      currentSeason > activeSeasonTab ||
                      (currentSeason === activeSeasonTab && currentEpisode >= ep);
                    const isCurrentActive =
                      currentSeason === activeSeasonTab && currentEpisode === ep;

                    return (
                      <button
                        key={ep}
                        type="button"
                        onClick={() => {
                          setCurrentSeason(activeSeasonTab);
                          setCurrentEpisode(ep);
                          if (status === "PLAN_TO_WATCH") setStatus("WATCHING");
                          if (
                            activeSeasonTab >= parsedSeasons.length &&
                            ep >= activeSeasonObj.episodeCount
                          ) {
                            setStatus("COMPLETED");
                          }
                        }}
                        className={`flex flex-col items-center justify-center rounded-lg py-2 px-1 text-xs font-mono transition transform active:scale-95 border ${
                          isCurrentActive
                            ? "bg-indigo-600 text-white font-black border-indigo-400 ring-2 ring-indigo-400/50 shadow-md shadow-indigo-600/30"
                            : isWatched
                            ? "bg-indigo-950/70 text-indigo-200 font-bold border-indigo-800/60 hover:bg-indigo-900/70"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-850"
                        }`}
                        title={`Season ${activeSeasonTab}, Episode ${ep}`}
                      >
                        <span className="text-[10px] text-zinc-500 font-sans">E</span>
                        <span>{ep}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80 text-xs">
                <div className="flex items-center gap-1.5">
                  {/* Mark This Season Watched */}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentSeason(activeSeasonTab);
                      setCurrentEpisode(activeSeasonObj.episodeCount);
                      if (status === "PLAN_TO_WATCH") setStatus("WATCHING");
                      if (activeSeasonTab < parsedSeasons.length) {
                        setActiveSeasonTab(activeSeasonTab + 1);
                      } else {
                        setStatus("COMPLETED");
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-indigo-500/40 px-2.5 py-1.5 text-zinc-300 hover:text-white transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Complete {activeSeasonObj.name}</span>
                  </button>

                  {/* Reset Current Season */}
                  <button
                    type="button"
                    onClick={() => {
                      if (currentSeason === activeSeasonTab) {
                        setCurrentEpisode(0);
                      }
                    }}
                    className="rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 px-2 py-1.5 text-zinc-400 hover:text-zinc-200 transition text-[11px]"
                  >
                    Reset Season
                  </button>
                </div>

                {/* Mark All Series Watched */}
                <button
                  type="button"
                  onClick={() => {
                    const lastSeason = parsedSeasons[parsedSeasons.length - 1] || activeSeasonObj;
                    setCurrentSeason(lastSeason.seasonNumber);
                    setCurrentEpisode(lastSeason.episodeCount);
                    setStatus("COMPLETED");
                  }}
                  className="rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2.5 py-1.5 text-xs font-medium transition"
                >
                  Mark Entire Series Complete
                </button>
              </div>
            </div>
          )}

          {/* Personal Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Personal Notes & Thoughts
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why did you save this? Favorite episode, quotes, or personal review..."
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/90 px-5 py-3.5">
          {/* Delete Action */}
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-400 font-medium">Are you sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg bg-rose-600 hover:bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white transition"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-400 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
