import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes cleanly with conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency amounts stored in cents/integer units.
 */
export function formatCurrency(amountCents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

/**
 * Format standard readable dates.
 */
export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Calculate difference in days between two dates.
 */
export function getDaysDifference(targetDate: Date | string, fromDate = new Date()): number {
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const diffTime = target.getTime() - fromDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
