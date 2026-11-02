"use client";

import React, { useState, useRef } from "react";
import { X, Plus, Film, Tv, Loader2 } from "lucide-react";

interface CustomAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedia: (item: any) => Promise<void>;
}

export function CustomAddModal({ isOpen, onClose, onAddMedia }: CustomAddModalProps) {
  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState<"TV" | "MOVIE">("TV");
  const [status, setStatus] = useState("PLAN_TO_WATCH");
  const [releaseYear, setReleaseYear] = useState<string>(new Date().getFullYear().toString());
  const [totalEpisodes, setTotalEpisodes] = useState<string>("10");
  const [runtime, setRuntime] = useState<string>("");
  const [genres, setGenres] = useState("");
  const [posterPath, setPosterPath] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddMedia({
        title: title.trim(),
        mediaType,
        status,
        releaseYear: releaseYear ? parseInt(releaseYear, 10) : undefined,
        runtime: runtime ? parseInt(runtime, 10) : undefined,
        totalEpisodes: mediaType === "TV" ? parseInt(totalEpisodes, 10) || 10 : 1,
        genres: genres.trim() || undefined,
        posterPath: posterPath.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
      // Reset
      setTitle("");
      setRuntime("");
      setNotes("");
      setPosterPath("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto safe-top"
    >
      <div
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-zinc-900 border-t sm:border border-zinc-800 shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="mx-auto mt-2.5 mb-1 h-1.5 w-12 rounded-full bg-zinc-700/80 sm:hidden shrink-0" />

        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3.5 sm:px-5 sm:py-4 bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-indigo-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">Add Custom Media</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Severance"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm sm:text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Type</label>
              <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setMediaType("TV")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${
                    mediaType === "TV" ? "bg-zinc-800 text-white" : "text-zinc-500"
                  }`}
                >
                  TV Series
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType("MOVIE")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${
                    mediaType === "MOVIE" ? "bg-zinc-800 text-white" : "text-zinc-500"
                  }`}
                >
                  Movie
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm sm:text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="PLAN_TO_WATCH">Plan to Watch</option>
                <option value="WATCHING">Watching</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Release Year</label>
              <input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm sm:text-xs text-zinc-200 focus:outline-none"
              />
            </div>

            {mediaType === "TV" ? (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Total Episodes</label>
                <input
                  type="number"
                  value={totalEpisodes}
                  onChange={(e) => setTotalEpisodes(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm sm:text-xs text-zinc-200 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Runtime (mins)</label>
                <input
                  type="number"
                  value={runtime}
                  placeholder="e.g. 105"
                  onChange={(e) => setRuntime(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm sm:text-xs text-zinc-200 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Genres</label>
            <input
              type="text"
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              placeholder="Drama, Sci-Fi, Thriller"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm sm:text-xs text-zinc-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Poster Image URL (optional)</label>
            <input
              type="url"
              value={posterPath}
              onChange={(e) => setPosterPath(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm sm:text-xs text-zinc-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Personal Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes..."
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 text-sm sm:text-xs text-zinc-200 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800 safe-bottom">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 px-4 py-2 text-xs font-semibold text-white shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              <span>Save Media</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

