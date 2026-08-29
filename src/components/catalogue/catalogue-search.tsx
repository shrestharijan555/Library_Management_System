"use client";

import React, { useTransition, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CatalogueSearchProps {
  defaultValue?: string;
  placeholder?: string;
}

export function CatalogueSearch({
  defaultValue = "",
  placeholder = "Search by title, author, or ISBN...",
}: CatalogueSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(defaultValue);

  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  if (prevDefaultValue !== defaultValue) {
    setPrevDefaultValue(defaultValue);
    setQuery(defaultValue);
  }

  // Debounced search param updates
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query === defaultValue) return;

      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("query", query.trim());
      } else {
        params.delete("query");
      }
      params.delete("page"); // Reset to page 1 on new search

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 350);

    return () => clearTimeout(handler);
  }, [query, defaultValue, pathname, router, searchParams]);

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("query");
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 text-sm bg-white"
        aria-label="Search catalogue"
      />
      {isPending ? (
        <Loader2 className="absolute right-2.5 top-2.5 size-4 animate-spin text-zinc-400" />
      ) : query ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
