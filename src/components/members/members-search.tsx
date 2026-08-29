"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MembersSearchProps {
  defaultValue?: string;
}

export function MembersSearch({ defaultValue = "" }: MembersSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const params = new URLSearchParams(searchParams.toString());

    if (term.trim()) {
      params.set("query", term.trim());
    } else {
      params.delete("query");
    }

    params.set("page", "1");

    startTransition(() => {
      router.push(`/members?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setSearchTerm("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("query");
    params.set("page", "1");

    startTransition(() => {
      router.push(`/members?${params.toString()}`);
    });
  };

  return (
    <div className="relative flex-1">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {isPending ? (
          <Loader2 className="size-4 animate-spin text-zinc-400" />
        ) : (
          <Search className="size-4 text-zinc-400" />
        )}
      </div>

      <Input
        type="search"
        placeholder="Search members by name, email, member code, or department..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9 pr-8 text-xs sm:text-sm bg-white"
        aria-label="Search members"
      />

      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
