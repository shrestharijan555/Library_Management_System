// src/lib/circulation/policies.ts
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { DEFAULT_LIBRARY_POLICIES, type LibraryPolicy } from "@/config/site";
import type { UserRole } from "@/config/roles";

/** Maximum overdue fine cap per single loan checkout in cents ($50.00) */
export const MAX_FINE_PER_LOAN_CENTS = 5000;

/** Default reservation hold shelf expiry duration in days */
export const RESERVATION_HOLD_EXPIRY_DAYS = 7;

/**
 * Retrieve current active library policies for all roles.
 * Fetches from `system_settings` table if configured, otherwise falls back to `DEFAULT_LIBRARY_POLICIES`.
 */
export async function getActiveLibraryPolicies(): Promise<Record<UserRole, LibraryPolicy>> {
  try {
    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, "library_policies"),
    });

    if (setting && setting.value) {
      const parsed = JSON.parse(setting.value) as Partial<Record<UserRole, LibraryPolicy>>;
      return {
        student: parsed.student ?? DEFAULT_LIBRARY_POLICIES.student,
        staff: parsed.staff ?? DEFAULT_LIBRARY_POLICIES.staff,
        librarian: parsed.librarian ?? DEFAULT_LIBRARY_POLICIES.librarian,
        admin: parsed.admin ?? DEFAULT_LIBRARY_POLICIES.admin,
      };
    }
  } catch (err) {
    console.warn("Failed to fetch system policies from DB, using defaults:", err);
  }

  return DEFAULT_LIBRARY_POLICIES;
}

/**
 * Get active policy for a specific user role.
 */
export async function getPolicyForRole(role: UserRole | string): Promise<LibraryPolicy> {
  const policies = await getActiveLibraryPolicies();
  const validRole = (role in policies ? role : "student") as UserRole;
  return policies[validRole] ?? DEFAULT_LIBRARY_POLICIES.student;
}

export interface OverdueFineCalculation {
  isOverdue: boolean;
  daysOverdue: number;
  chargeableDays: number;
  fineCents: number;
  dailyRateCents: number;
  gracePeriodDays: number;
  formattedNotice: string;
}

/**
 * Pure calculation function for loan overdue fines based on policy rules.
 */
export function calculateOverdueFine(
  dueDate: Date | string,
  returnDate: Date | string | null = null,
  policy: LibraryPolicy = DEFAULT_LIBRARY_POLICIES.student
): OverdueFineCalculation {
  const due = new Date(dueDate);
  const end = returnDate ? new Date(returnDate) : new Date();

  // If not yet overdue
  if (end <= due) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      chargeableDays: 0,
      fineCents: 0,
      dailyRateCents: policy.finePerDayCents,
      gracePeriodDays: policy.gracePeriodDays,
      formattedNotice: "",
    };
  }

  const diffMs = end.getTime() - due.getTime();
  const daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const gracePeriodDays = policy.gracePeriodDays ?? 0;
  const chargeableDays = Math.max(0, daysOverdue - gracePeriodDays);
  
  // Calculate uncapped fine, then apply maximum cap
  const rawFineCents = chargeableDays * (policy.finePerDayCents ?? 0);
  const fineCents = Math.min(rawFineCents, MAX_FINE_PER_LOAN_CENTS);

  let formattedNotice = "";
  if (fineCents > 0) {
    formattedNotice = `Overdue by ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} (${gracePeriodDays}d grace period applied). Fine assessed: $${(fineCents / 100).toFixed(2)}.`;
  } else if (daysOverdue > 0 && daysOverdue <= gracePeriodDays) {
    formattedNotice = `Overdue by ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} (Within ${gracePeriodDays}-day grace period, no fine charged).`;
  }

  return {
    isOverdue: true,
    daysOverdue,
    chargeableDays,
    fineCents,
    dailyRateCents: policy.finePerDayCents,
    gracePeriodDays,
    formattedNotice,
  };
}
