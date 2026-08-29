"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MembersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentRole = searchParams.get("role") || "all";
  const currentStatus = searchParams.get("status") || "all";
  const currentStanding = searchParams.get("standing") || "all";
  const currentSort = searchParams.get("sort") || "newest";

  const hasActiveFilters =
    currentRole !== "all" ||
    currentStatus !== "all" ||
    currentStanding !== "all" ||
    currentSort !== "newest" ||
    searchParams.has("query");

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "newest") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/members?${params.toString()}`);
    });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push("/members");
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-zinc-100">
      {/* Role Filter */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="roleFilter" className="text-xs font-semibold text-zinc-500 whitespace-nowrap">
          Role:
        </label>
        <select
          id="roleFilter"
          value={currentRole}
          disabled={isPending}
          onChange={(e) => updateParam("role", e.target.value)}
          className="h-8 rounded-md border border-zinc-300 bg-white px-2.5 text-xs text-zinc-700 shadow-xs focus:border-zinc-950 focus:outline-none cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="staff">Staff / Faculty</option>
          <option value="librarian">Librarians</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="statusFilter" className="text-xs font-semibold text-zinc-500 whitespace-nowrap">
          Status:
        </label>
        <select
          id="statusFilter"
          value={currentStatus}
          disabled={isPending}
          onChange={(e) => updateParam("status", e.target.value)}
          className="h-8 rounded-md border border-zinc-300 bg-white px-2.5 text-xs text-zinc-700 shadow-xs focus:border-zinc-950 focus:outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Standing Filter */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="standingFilter" className="text-xs font-semibold text-zinc-500 whitespace-nowrap">
          Standing:
        </label>
        <select
          id="standingFilter"
          value={currentStanding}
          disabled={isPending}
          onChange={(e) => updateParam("standing", e.target.value)}
          className="h-8 rounded-md border border-zinc-300 bg-white px-2.5 text-xs text-zinc-700 shadow-xs focus:border-zinc-950 focus:outline-none cursor-pointer"
        >
          <option value="all">All Members</option>
          <option value="active_borrowers">Active Borrowers</option>
          <option value="with_overdue">With Overdue Loans</option>
          <option value="with_fines">With Outstanding Fines</option>
        </select>
      </div>

      {/* Sort Filter */}
      <div className="flex items-center gap-1.5 ml-auto">
        <label htmlFor="sortFilter" className="text-xs font-semibold text-zinc-500 whitespace-nowrap">
          Sort by:
        </label>
        <select
          id="sortFilter"
          value={currentSort}
          disabled={isPending}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="h-8 rounded-md border border-zinc-300 bg-white px-2.5 text-xs text-zinc-700 shadow-xs focus:border-zinc-950 focus:outline-none cursor-pointer"
        >
          <option value="newest">Newest Joined</option>
          <option value="oldest">Oldest Joined</option>
          <option value="name_asc">Name (A → Z)</option>
          <option value="name_desc">Name (Z → A)</option>
          <option value="code_asc">Member Code (A → Z)</option>
          <option value="loans_desc">Most Active Loans</option>
        </select>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={isPending}
          className="h-8 gap-1 px-2 text-xs text-zinc-500 hover:text-zinc-900"
        >
          <RotateCcw className="size-3" />
          <span>Reset</span>
        </Button>
      )}
    </div>
  );
}
