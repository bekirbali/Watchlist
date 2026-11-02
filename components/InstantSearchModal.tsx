"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search, X, Tv, Film, Star, Plus, Check, Loader2 } from "lucide-react";

interface SearchResultItem {
  tmdbId: number;
  mediaType: "MOVIE" | "TV";
  title: string;
  originalTitle?: string;
  releaseYear?: number;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  voteAverage: number;
}

interface InstantSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingItems?: Array<{
    tmdbId?: number | null;
    mediaType?: string;
    title: string;
    status: string;
  }>;
  onAddMedia: (item: {
    tmdbId?: number;
    mediaType: string;
    title: string;
    status: string;
    posterPath?: string | null;
    backdropPath?: string | null;
    overview?: string;
    releaseYear?: number;
  }) => Promise<void>;
  onOpenCustomAdd: () => void;
}

export function InstantSearchModal({
  isOpen,
  onClose,
  existingItems = [],
  onAddMedia,
  onOpenCustomAdd,
}: InstantSearchModalProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "tv" | "movie">("all");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<number, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const isBackdropClick = useRef(false);

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
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setAddedIds({});
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}&type=${typeFilter}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, typeFilter]);

  const handleAdd = async (item: SearchResultItem, status: "PLAN_TO_WATCH" | "WATCHING") => {
    try {
      setAddedIds((prev) => ({ ...prev, [item.tmdbId]: status }));
      await onAddMedia({
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        title: item.title,
        status,
        posterPath: item.posterPath,
        backdropPath: item.backdropPath,
        overview: item.overview,
        releaseYear: item.releaseYear,
      });
    } catch (err) {
      console.error("Failed to add media:", err);
      setAddedIds((prev) => {
        const copy = { ...prev };
        delete copy[item.tmdbId];
        return copy;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-zinc-950/80 backdrop-blur-md p-2 sm:p-6 overflow-y-auto safe-top"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden mt-2 sm:mt-0 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header Search Input */}
        <div className="flex items-center gap-2.5 sm:gap-3 border-b border-zinc-800 px-3.5 py-3 sm:px-4 sm:py-3.5 bg-zinc-900/90">
          <Search className="h-5 w-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movie or TV series title..."
            className="flex-1 bg-transparent text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
          {query && !isLoading && (
            <button
              onClick={() => setQuery("")}
              className="text-zinc-500 hover:text-zinc-300 p-1 transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Badges & Helper */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 bg-zinc-950/40 px-3.5 sm:px-4 py-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTypeFilter("all")}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                typeFilter === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter("tv")}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                typeFilter === "tv" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              TV Series
            </button>
            <button
              onClick={() => setTypeFilter("movie")}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                typeFilter === "movie" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Movies
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenCustomAdd();
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition py-0.5"
          >
            Can't find it? Add manually →
          </button>
        </div>

        {/* Search Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-zinc-800/50 p-2">
          {results.length > 0 ? (
            results.map((item) => {
              const isAdded = !!addedIds[item.tmdbId];
              const addedStatus = addedIds[item.tmdbId];

              return (
                <div
                  key={`${item.mediaType}-${item.tmdbId}`}
                  className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-zinc-850/60 transition group"
                >
                  {/* Poster Thumbnail */}
                  <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-950 border border-zinc-800">
                    {item.posterPath ? (
                      <Image
                        src={item.posterPath}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        {item.mediaType === "TV" ? <Tv className="h-6 w-6" /> : <Film className="h-6 w-6" />}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-zinc-100 truncate">{item.title}</h4>
                      {item.originalTitle && item.originalTitle !== item.title && (
                        <span className="text-xs text-zinc-400 font-normal">
                          ({item.originalTitle})
                        </span>
                      )}
                      <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] font-medium text-zinc-400 border border-zinc-700/50">
                        {item.mediaType === "TV" ? "TV" : "Movie"}
                      </span>
                      {item.releaseYear && (
                        <span className="text-xs text-zinc-500">{item.releaseYear}</span>
                      )}
                    </div>

                    {item.voteAverage > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-amber-400">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span className="font-semibold">{item.voteAverage}</span>
                      </div>
                    )}

                    <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.overview || "No description available."}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0 self-center">
                    {(() => {
                      const existingInLibrary =
                        existingItems.find(
                          (ex) => ex.tmdbId === item.tmdbId && ex.mediaType === item.mediaType
                        ) ||
                        existingItems.find(
                          (ex) => ex.title.toLowerCase() === item.title.toLowerCase()
                        );

                      if (existingInLibrary) {
                        return (
                          <span
                            className="flex items-center gap-1 rounded-xl bg-zinc-800/90 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 shadow-sm"
                            title="Already present in your library"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>
                              {existingInLibrary.status === "WATCHING"
                                ? "Watching"
                                : existingInLibrary.status === "COMPLETED"
                                ? "Completed"
                                : existingInLibrary.status === "DROPPED"
                                ? "Dropped"
                                : "In Watchlist"}
                            </span>
                          </span>
                        );
                      }

                      if (isAdded) {
                        return (
                          <span className="flex items-center gap-1 rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                            <Check className="h-3.5 w-3.5" />
                            <span>Added</span>
                          </span>
                        );
                      }

                      return (
                        <>
                          <button
                            onClick={() => handleAdd(item, "PLAN_TO_WATCH")}
                            className="flex items-center gap-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Watchlist</span>
                          </button>
                          <button
                            onClick={() => handleAdd(item, "WATCHING")}
                            className="flex items-center gap-1 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Watching</span>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })
          ) : query.trim() && !isLoading ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No results found for "{query}". Try checking the title or add it manually.
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 text-sm">
              Type any movie or TV series name to search live via TMDB.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

