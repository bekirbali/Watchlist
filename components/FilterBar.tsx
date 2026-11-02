"use client";

import React from "react";
import {
  Film,
  Tv,
  LayoutGrid,
  CheckCircle2,
  PlayCircle,
  Bookmark,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface FilterBarProps {
  status: string;
  onStatusChange: (status: string) => void;
  mediaType: string;
  onMediaTypeChange: (type: string) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSortOrder: () => void;
  search: string;
  onSearchChange: (search: string) => void;
  counts: Record<string, number>;
}

export function FilterBar({
  status,
  onStatusChange,
  mediaType,
  onMediaTypeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
  search,
  onSearchChange,
  counts,
}: FilterBarProps) {
  const tabs = [
    { id: "ALL", label: "All Items", icon: LayoutGrid, count: counts.ALL || 0 },
    { id: "WATCHING", label: "Watching", icon: PlayCircle, count: counts.WATCHING || 0 },
    { id: "PLAN_TO_WATCH", label: "Plan to Watch", icon: Bookmark, count: counts.PLAN_TO_WATCH || 0 },
    { id: "COMPLETED", label: "Completed", icon: CheckCircle2, count: counts.COMPLETED || 0 },
    { id: "DROPPED", label: "Dropped", icon: XCircle, count: counts.DROPPED || 0 },
  ];

  const getOrderBadge = () => {
    if (sortBy === "title") {
      return sortOrder === "asc" ? "A → Z" : "Z → A";
    }
    if (sortBy === "imdbRating" || sortBy === "rating") {
      return sortOrder === "desc" ? "High → Low" : "Low → High";
    }
    if (sortBy === "releaseYear") {
      return sortOrder === "desc" ? "New → Old" : "Old → New";
    }
    if (sortBy === "runtime") {
      return sortOrder === "desc" ? "Long → Short" : "Short → Long";
    }
    // updatedAt / default
    return sortOrder === "desc" ? "Latest" : "Oldest";
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Status Navigation Tabs with Edge-to-Edge Touch Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 touch-scroll no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = status === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium transition whitespace-nowrap active:scale-95 shrink-0 ${
                isActive
                  ? "bg-zinc-100 text-zinc-950 font-semibold shadow-sm"
                  : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 border border-zinc-800/60"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-zinc-950" : "text-zinc-400"}`} />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[11px] font-semibold ${
                  isActive ? "bg-zinc-300 text-zinc-900" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Controls Bar: Type Segmented Control + Search & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-0.5">
        {/* Type Toggle (Full-width 3-segment on mobile, compact inline on desktop) */}
        <div className="grid grid-cols-3 sm:flex items-center rounded-xl bg-zinc-900 p-1 border border-zinc-800 w-full sm:w-auto">
          <button
            onClick={() => onMediaTypeChange("ALL")}
            className={`flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              mediaType === "ALL" ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => onMediaTypeChange("TV")}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              mediaType === "TV" ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            <span>TV Series</span>
          </button>
          <button
            onClick={() => onMediaTypeChange("MOVIE")}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              mediaType === "MOVIE" ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            <span>Movies</span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Quick Filter Input */}
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter list..."
            className="flex-1 sm:w-48 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm sm:text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition"
          />

          {/* Sort Selector & Direction Toggle */}
          <div className="flex items-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 p-0.5 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-300">
              <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer pr-1 font-medium"
              >
                <option value="updatedAt" className="bg-zinc-900 text-zinc-200">Recently Active</option>
                <option value="imdbRating" className="bg-zinc-900 text-zinc-200">IMDb Rating</option>
                <option value="title" className="bg-zinc-900 text-zinc-200">Title</option>
                <option value="releaseYear" className="bg-zinc-900 text-zinc-200">Release Year</option>
                <option value="runtime" className="bg-zinc-900 text-zinc-200">Runtime</option>
                <option value="rating" className="bg-zinc-900 text-zinc-200">My Rating</option>
              </select>
            </div>

            {/* Direction Toggle Button */}
            <button
              type="button"
              onClick={onToggleSortOrder}
              title={`Switch order (current: ${sortOrder === "asc" ? "Ascending" : "Descending"})`}
              className="flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:text-white active:scale-95 transition border border-zinc-700/60 shadow-xs"
            >
              {sortOrder === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              )}
              <span className="text-[11px] font-medium text-zinc-300">{getOrderBadge()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

