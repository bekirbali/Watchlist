"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { X, UploadCloud, Check, AlertCircle, Loader2, Film, Tv } from "lucide-react";

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => Promise<void>;
}

interface ResolvedItem {
  inputTitle: string;
  tmdbId: number | null;
  mediaType: "MOVIE" | "TV";
  title: string;
  originalTitle?: string;
  releaseYear?: number;
  posterPath: string | null;
  backdropPath?: string | null;
  overview?: string;
  voteAverage?: number;
  isDuplicate?: boolean;
  existingStatus?: string | null;
  selected?: boolean;
}

export function BatchImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: BatchImportModalProps) {
  const [inputText, setInputText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [resolvedItems, setResolvedItems] = useState<ResolvedItem[]>([]);
  const [step, setStep] = useState<"INPUT" | "PREVIEW">("INPUT");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isBackdropClick = useRef(false);

  if (!isOpen) return null;

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    isBackdropClick.current = e.target === e.currentTarget;
  };

  const handleBackdropMouseUp = (e: React.MouseEvent) => {
    if (isBackdropClick.current && e.target === e.currentTarget) {
      onClose();
    }
    isBackdropClick.current = false;
  };

  const handleScan = async () => {
    const lines = inputText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setErrorMsg("Please paste or type at least one movie or TV show title.");
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/media/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titles: lines, previewOnly: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to resolve titles with TMDB");
      }

      const data = await res.json();
      const resolved = (data.resolved || []).map((item: any) => ({
        ...item,
        // Duplicates are auto-deselected by default to prevent re-adding
        selected: !item.isDuplicate,
      }));

      setResolvedItems(resolved);
      setStep("PREVIEW");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during title scan");
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setResolvedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setResolvedItems((prev) =>
      prev.map((item) => ({
        ...item,
        // If selecting all, don't re-select duplicates unless user manually clicks
        selected: select ? !item.isDuplicate : false,
      }))
    );
  };

  const handleConfirmImport = async () => {
    const selectedToImport = resolvedItems.filter((i) => i.selected);
    if (selectedToImport.length === 0) {
      setErrorMsg("Please select at least one item to import.");
      return;
    }

    setIsImporting(true);
    setErrorMsg(null);

    try {
      // Send the resolved objects directly so matched TMDB IDs and details are preserved perfectly!
      const res = await fetch("/api/media/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedToImport }),
      });

      if (!res.ok) {
        throw new Error("Import failed");
      }

      await onImportComplete();
      onClose();
      // Reset state
      setStep("INPUT");
      setInputText("");
      setResolvedItems([]);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete batch import");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm">Batch Import Backlog</h3>
              <p className="text-xs text-zinc-400">
                {step === "INPUT"
                  ? "Paste your list to import at once"
                  : `Reviewing ${resolvedItems.length} matched titles`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5">
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === "INPUT" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Enter or paste one movie/series per line:</span>
                <span className="text-[11px] text-zinc-500">
                  {inputText.split("\n").filter((l) => l.trim().length > 0).length} titles entered
                </span>
              </div>

              <textarea
                rows={9}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Severance\nBreaking Bad\nInception\nInterstellar\nThe Bear\nSuccession\n...`}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-zinc-500">
                  TMDB will automatically fetch posters and season info
                </span>

                <button
                  onClick={handleScan}
                  disabled={isScanning || !inputText.trim()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Scanning TMDB...</span>
                    </>
                  ) : (
                    <>
                      <span>Scan & Match Titles</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Review Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-zinc-600">·</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                  {resolvedItems.filter((i) => i.isDuplicate).length > 0 && (
                    <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-300 font-medium">
                      {resolvedItems.filter((i) => i.isDuplicate).length} already in library (skipped)
                    </span>
                  )}
                </div>
                <span className="text-zinc-400">
                  {resolvedItems.filter((i) => i.selected).length} of {resolvedItems.length} selected
                </span>
              </div>

              {/* Matched Preview List */}
              <div className="max-h-[50vh] overflow-y-auto divide-y divide-zinc-800/60 pr-1">
                {resolvedItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleToggleSelect(idx)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition cursor-pointer ${
                      item.selected
                        ? "bg-zinc-850/60"
                        : item.isDuplicate
                        ? "opacity-50 hover:opacity-80 bg-zinc-950/40"
                        : "opacity-40 hover:opacity-75"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!item.selected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(idx);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0 cursor-pointer"
                    />

                    <div className="relative h-12 w-9 flex-shrink-0 overflow-hidden rounded bg-zinc-950 border border-zinc-800">
                      {item.posterPath ? (
                        <Image
                          src={item.posterPath}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-600 text-[10px]">
                          {item.mediaType === "TV" ? <Tv className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-xs text-zinc-100 truncate">{item.title}</span>
                        {item.originalTitle && item.originalTitle !== item.title && (
                          <span className="text-[10px] text-zinc-400">({item.originalTitle})</span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono">({item.mediaType})</span>
                        {item.releaseYear && (
                          <span className="text-[10px] text-zinc-500">· {item.releaseYear}</span>
                        )}
                        {item.isDuplicate && (
                          <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-semibold">
                            Already in Watchlist ({item.existingStatus || "Added"})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 truncate block">
                        Original note: "{item.inputTitle}"
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setStep("INPUT")}
                  className="rounded-xl px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
                >
                  ← Back to Text
                </button>

                <button
                  onClick={handleConfirmImport}
                  disabled={isImporting || resolvedItems.filter((i) => i.selected).length === 0}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>
                        Import {resolvedItems.filter((i) => i.selected).length} Items to Watchlist
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

