"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  List,
  RotateCcw,
} from "lucide-react";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";

interface CatalogueFiltersProps {
  categories: Category[];
}

export function CatalogueFilters({ categories }: CatalogueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") || "";
  const currentStatus = searchParams.get("status") || "all";
  const currentSort = searchParams.get("sort") || "newest";
  const currentView = searchParams.get("view") || "grid";

  const hasActiveFilters =
    Boolean(currentCategory) ||
    currentStatus !== "all" ||
    currentSort !== "newest" ||
    Boolean(searchParams.get("query"));

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && !(key === "sort" && value === "newest") && !(key === "view" && value === "grid")) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset pagination

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const resetAllFilters = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Left Area: Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category Filter */}
        <div className="relative">
          <select
            value={currentCategory}
            onChange={(e) => updateParam("category", e.target.value)}
            aria-label="Filter by category"
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 pr-8 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus:border-zinc-950 focus:outline-none cursor-pointer"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Availability / Status Filter */}
        <div className="relative">
          <select
            value={currentStatus}
            onChange={(e) => updateParam("status", e.target.value)}
            aria-label="Filter by availability status"
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 pr-8 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus:border-zinc-950 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available Now</option>
            <option value="borrowed">All Copies Checked Out</option>
            <option value="low_stock">Low Stock (≤ 1 Copy)</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => updateParam("sort", e.target.value)}
            aria-label="Sort books"
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 pr-8 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus:border-zinc-950 focus:outline-none cursor-pointer"
          >
            <option value="newest">Recently Added</option>
            <option value="title_asc">Title (A → Z)</option>
            <option value="title_desc">Title (Z → A)</option>
            <option value="year_desc">Year (Newest First)</option>
            <option value="year_asc">Year (Oldest First)</option>
            <option value="copies_desc">Available Copies (High → Low)</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetAllFilters}
            className="h-9 gap-1.5 px-2.5 text-xs text-zinc-600 hover:text-zinc-900"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Right Area: View Switcher (Grid vs Table) */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => updateParam("view", "grid")}
          aria-label="Grid view"
          className={`flex size-7 items-center justify-center rounded-md text-xs transition-colors cursor-pointer ${
            currentView === "grid"
              ? "bg-zinc-900 text-zinc-50 shadow-xs"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          <LayoutGrid className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => updateParam("view", "table")}
          aria-label="Table view"
          className={`flex size-7 items-center justify-center rounded-md text-xs transition-colors cursor-pointer ${
            currentView === "table"
              ? "bg-zinc-900 text-zinc-50 shadow-xs"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          <List className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
