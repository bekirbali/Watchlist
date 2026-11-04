"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { FilterBar } from "@/components/FilterBar";
import { MediaCard, MediaItemType } from "@/components/MediaCard";
import { InstantSearchModal } from "@/components/InstantSearchModal";
import { BatchImportModal } from "@/components/BatchImportModal";
import { MediaDetailModal } from "@/components/MediaDetailModal";
import { CustomAddModal } from "@/components/CustomAddModal";
import { LogoIcon } from "@/components/Logo";
import { Plus, UploadCloud, Loader2 } from "lucide-react";

export default function HomePage() {
  const [items, setItems] = useState<MediaItemType[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    ALL: 0,
    WATCHING: 0,
    PLAN_TO_WATCH: 0,
    COMPLETED: 0,
    DROPPED: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [isCustomAddOpen, setIsCustomAddOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItemType | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (mediaTypeFilter !== "ALL") params.set("mediaType", mediaTypeFilter);
      if (sortBy) params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (searchText.trim()) params.set("search", searchText.trim());

      const res = await fetch(`/api/media?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to load media items:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, mediaTypeFilter, sortBy, sortOrder, searchText]);

  const handleSortByChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    // When changing sort criteria, set intuitive default direction
    if (newSortBy === "title") {
      setSortOrder("asc");
    } else {
      setSortOrder("desc");
    }
  };

  const handleToggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Global Ctrl+K shortcut to open Instant Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleIncrementEpisode = async (id: string) => {
    try {
      const res = await fetch(`/api/media/${id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: 1 }),
      });

      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...data.item } : item))
        );
        // Refresh counts if status transitioned to COMPLETED
        if (data.item?.status && data.item.status !== "WATCHING") {
          fetchItems();
        }
      }
    } catch (err) {
      console.error("Failed to increment episode:", err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      console.error("Failed to change status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/media?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        fetchItems();
      }
    } catch (err) {
      console.error("Failed to delete media:", err);
    }
  };

  const handleUpdateItem = async (data: {
    id: string;
    status: string;
    rating: number | null;
    notes: string | null;
    currentSeason: number;
    currentEpisode: number;
  }) => {
    try {
      const res = await fetch("/api/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setItems((prev) =>
          prev.map((item) => (item.id === data.id ? { ...item, ...result.item } : item))
        );
        fetchItems();
      }
    } catch (err) {
      console.error("Failed to update media item:", err);
    }
  };

  const handleAddMedia = async (itemData: any) => {
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });
      if (res.ok) {
        fetchItems();
      } else if (res.status === 409) {
        const errorData = await res.json();
        alert(errorData.error || "This item is already in your watchlist!");
      }
    } catch (err) {
      console.error("Failed to add media:", err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <Navbar
        counts={counts}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenBatchImport={() => setIsBatchImportOpen(true)}
        onOpenAddCustom={() => setIsCustomAddOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3.5 py-4 sm:px-6 sm:py-6 safe-bottom">
        {/* Filter & Search Bar */}
        <div className="mb-4 sm:mb-6">
          <FilterBar
            status={statusFilter}
            onStatusChange={setStatusFilter}
            mediaType={mediaTypeFilter}
            onMediaTypeChange={setMediaTypeFilter}
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
            sortOrder={sortOrder}
            onToggleSortOrder={handleToggleSortOrder}
            search={searchText}
            onSearchChange={setSearchText}
            counts={counts}
          />
        </div>

        {/* Media Grid or Empty State */}
        {isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="mt-3 text-xs">Loading collection...</p>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {items.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onSelect={(selected) => setSelectedItem(selected)}
                onIncrementEpisode={handleIncrementEpisode}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 py-20 px-4 text-center">
            <div className="mb-3 transition-transform duration-300 hover:scale-105">
              <LogoIcon size={56} />
            </div>
            <h3 className="font-semibold text-zinc-200 text-base">No media items in this view</h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm">
              {searchText
                ? `No results matching "${searchText}". Try another query.`
                : "Your watchlist is empty here. Search for any movie or TV series, or paste your 30-item notes list."}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => setIsBatchImportOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition shadow-sm"
              >
                <UploadCloud className="h-3.5 w-3.5 text-indigo-400" />
                <span>Batch Import Backlog</span>
              </button>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Search TMDB</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <InstantSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        existingItems={items}
        onAddMedia={handleAddMedia}
        onOpenCustomAdd={() => setIsCustomAddOpen(true)}
      />

      <BatchImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        onImportComplete={fetchItems}
      />

      <CustomAddModal
        isOpen={isCustomAddOpen}
        onClose={() => setIsCustomAddOpen(false)}
        onAddMedia={handleAddMedia}
      />

      <MediaDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdate={handleUpdateItem}
        onDelete={handleDelete}
      />
    </div>
  );
}
