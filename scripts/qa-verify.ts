import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PERMISSIONS, hasPermission } from "../src/config/roles";
import { calculateOverdueFine, MAX_FINE_PER_LOAN_CENTS } from "../src/lib/circulation/policies";
import {
  issueLoanSchema,
  issueLoanByBarcodeSchema,
} from "../src/lib/circulation/validation";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { books, bookCopies, loans, users, fines, reservations, auditLogs } from "../src/db/schema";
import { sql, eq } from "drizzle-orm";

const conn = process.env.DATABASE_URL || "";
const client = postgres(conn, { prepare: false, ssl: conn.includes("localhost") ? false : "require" });
const db = drizzle(client, { schema });

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(suite: string, name: string, condition: boolean, details?: string) {
  results.push({
    suite,
    name,
    passed: Boolean(condition),
    details: condition ? undefined : details || "Assertion failed",
  });
}

async function runQA() {
  console.log("==================================================");
  console.log("STARTING LMS SPRINT 3 COMPREHENSIVE QA TEST SUITE");
  console.log("==================================================\n");

  // ----------------------------------------------------
  // 1. RBAC & PERMISSION MATRIX TESTS
  // ----------------------------------------------------
  const suite1 = "RBAC Authorization Matrix";
  
  // Admin permissions
  assert(suite1, "Admin has MANAGE_SETTINGS", hasPermission("admin", PERMISSIONS.MANAGE_SETTINGS));
  assert(suite1, "Admin has VIEW_AUDIT_LOGS", hasPermission("admin", PERMISSIONS.VIEW_AUDIT_LOGS));
  assert(suite1, "Admin has VIEW_REPORTS", hasPermission("admin", PERMISSIONS.VIEW_REPORTS));
  assert(suite1, "Admin has CREATE_MEMBER", hasPermission("admin", PERMISSIONS.CREATE_MEMBER));
  assert(suite1, "Admin has DELETE_MEMBER", hasPermission("admin", PERMISSIONS.DELETE_MEMBER));

  // Librarian permissions
  assert(suite1, "Librarian has ISSUE_BOOK", hasPermission("librarian", PERMISSIONS.ISSUE_BOOK));
  assert(suite1, "Librarian has RETURN_BOOK", hasPermission("librarian", PERMISSIONS.RETURN_BOOK));
  assert(suite1, "Librarian has VIEW_AUDIT_LOGS", hasPermission("librarian", PERMISSIONS.VIEW_AUDIT_LOGS));
  assert(suite1, "Librarian has VIEW_REPORTS", hasPermission("librarian", PERMISSIONS.VIEW_REPORTS));
  assert(suite1, "Librarian CANNOT MANAGE_SETTINGS", !hasPermission("librarian", PERMISSIONS.MANAGE_SETTINGS));

  // Staff permissions
  assert(suite1, "Staff has RESERVE_BOOK", hasPermission("staff", PERMISSIONS.RESERVE_BOOK));
  assert(suite1, "Staff has RENEW_BOOK", hasPermission("staff", PERMISSIONS.RENEW_BOOK));
  assert(suite1, "Staff CANNOT ISSUE_BOOK", !hasPermission("staff", PERMISSIONS.ISSUE_BOOK));
  assert(suite1, "Staff CANNOT VIEW_AUDIT_LOGS", !hasPermission("staff", PERMISSIONS.VIEW_AUDIT_LOGS));
  assert(suite1, "Staff CANNOT MANAGE_SETTINGS", !hasPermission("staff", PERMISSIONS.MANAGE_SETTINGS));

  // Student permissions
  assert(suite1, "Student CANNOT ISSUE_BOOK", !hasPermission("student", PERMISSIONS.ISSUE_BOOK));
  assert(suite1, "Student CANNOT RETURN_BOOK", !hasPermission("student", PERMISSIONS.RETURN_BOOK));
  assert(suite1, "Student CANNOT VIEW_AUDIT_LOGS", !hasPermission("student", PERMISSIONS.VIEW_AUDIT_LOGS));
  assert(suite1, "Student CANNOT VIEW_REPORTS", !hasPermission("student", PERMISSIONS.VIEW_REPORTS));
  assert(suite1, "Student CANNOT CREATE_MEMBER", !hasPermission("student", PERMISSIONS.CREATE_MEMBER));

  // ----------------------------------------------------
  // 2. FINE & OVERDUE CALCULATION TESTS
  // ----------------------------------------------------
  const suite2 = "Fines & Monetary Precision";
  
  const now = new Date();
  const policyStudent = {
    maxActiveLoans: 3,
    loanDurationDays: 14,
    maxRenewals: 2,
    finePerDayCents: 50,
    gracePeriodDays: 1,
  };

  // Case A: Not overdue (due in future)
  const futureDue = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const resA = calculateOverdueFine(futureDue, now, policyStudent);
  assert(suite2, "Future due date produces 0 fine", !resA.isOverdue && resA.fineCents === 0);

  // Case B: Exactly due today
  const resB = calculateOverdueFine(now, now, policyStudent);
  assert(suite2, "Same-day return produces 0 fine", !resB.isOverdue && resB.fineCents === 0);

  // Case C: 1 day overdue with 1 day grace period -> 0 fine
  const oneDayPast = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const resC = calculateOverdueFine(oneDayPast, now, policyStudent);
  assert(suite2, "1-day overdue within 1-day grace period produces 0 fine", resC.isOverdue && resC.fineCents === 0 && resC.chargeableDays === 0);

  // Case D: 3 days overdue with 1 day grace period -> 2 chargeable days * 50 cents = 100 cents ($1.00)
  const threeDaysPast = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const resD = calculateOverdueFine(threeDaysPast, now, policyStudent);
  assert(suite2, "3-day overdue with 1-day grace produces 100 cents ($1.00)", resD.chargeableDays === 2 && resD.fineCents === 100);

  // Case E: Extreme overdue (300 days) -> capped at MAX_FINE_PER_LOAN_CENTS (5000 cents)
  const extremePast = new Date(now.getTime() - 300 * 24 * 60 * 60 * 1000);
  const resE = calculateOverdueFine(extremePast, now, policyStudent);
  assert(suite2, "Extreme overdue is capped at $50.00 (5000 cents)", resE.fineCents === MAX_FINE_PER_LOAN_CENTS);

  // ----------------------------------------------------
  // 3. ZOD VALIDATION SCHEMAS TESTS
  // ----------------------------------------------------
  const suite3 = "Input Validation & Zod Boundaries";

  // Issue loan validation
  const validIssue = issueLoanSchema.safeParse({
    copyId: "123e4567-e89b-12d3-a456-426614174000",
    memberCode: "STU-2024-001",
  });
  assert(suite3, "Valid issueLoan input passes", validIssue.success);

  const invalidIssueUuid = issueLoanSchema.safeParse({
    copyId: "invalid-uuid-string",
    memberCode: "STU-2024-001",
  });
  assert(suite3, "Invalid copy UUID is rejected", !invalidIssueUuid.success);

  const emptyIssue = issueLoanSchema.safeParse({
    copyId: "",
    memberCode: "",
  });
  assert(suite3, "Empty issue fields are rejected", !emptyIssue.success);

  // Barcode issue validation
  const validBarcode = issueLoanByBarcodeSchema.safeParse({
    barcode: "BC-100234",
    memberCode: "STU-1001",
  });
  assert(suite3, "Valid barcode input passes", validBarcode.success);

  const emptyBarcode = issueLoanByBarcodeSchema.safeParse({
    barcode: "",
    memberCode: "STU-1001",
  });
  assert(suite3, "Empty barcode is rejected", !emptyBarcode.success);

  // ----------------------------------------------------
  // 4. DATABASE INTEGRITY & SCHEMA TESTS
  // ----------------------------------------------------
  const suite4 = "Database Integrity & Relations";

  try {
    const [userCountRes] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    assert(suite4, "Users table queryable", Number(userCountRes?.count ?? 0) >= 0);

    const [bookCountRes] = await db.select({ count: sql<number>`count(*)::int` }).from(books);
    assert(suite4, "Books table queryable", Number(bookCountRes?.count ?? 0) >= 0);

    const [copyCountRes] = await db.select({ count: sql<number>`count(*)::int` }).from(bookCopies);
    assert(suite4, "BookCopies table queryable", Number(copyCountRes?.count ?? 0) >= 0);

    const [loanCountRes] = await db.select({ count: sql<number>`count(*)::int` }).from(loans);
    assert(suite4, "Loans table queryable", Number(loanCountRes?.count ?? 0) >= 0);

    const [fineCountRes] = await db.select({ count: sql<number>`count(*)::int` }).from(fines);
    assert(suite4, "Fines table queryable", Number(fineCountRes?.count ?? 0) >= 0);

    const [resCountRes] = await db.select({ count: sql<number>`count(*)::int` }).from(reservations);
    assert(suite4, "Reservations table queryable", Number(resCountRes?.count ?? 0) >= 0);

    const [auditCountRes] = await db.select({ count: sql<number>`count(*)::int` }).from(auditLogs);
    assert(suite4, "AuditLogs table queryable", Number(auditCountRes?.count ?? 0) >= 0);

    // Physical copy counter consistency check:
    // Total physical copies in bookCopies matching sum of copy status counts
    const [availableRes] = await db.select({ count: sql<number>`count(*)::int` }).from(bookCopies).where(eq(bookCopies.status, "available"));
    const [borrowedRes] = await db.select({ count: sql<number>`count(*)::int` }).from(bookCopies).where(eq(bookCopies.status, "borrowed"));
    const [reservedRes] = await db.select({ count: sql<number>`count(*)::int` }).from(bookCopies).where(eq(bookCopies.status, "reserved"));
    const [maintenanceRes] = await db.select({ count: sql<number>`count(*)::int` }).from(bookCopies).where(eq(bookCopies.status, "maintenance"));
    const [lostRes] = await db.select({ count: sql<number>`count(*)::int` }).from(bookCopies).where(eq(bookCopies.status, "lost"));

    const totalCopies = Number(copyCountRes?.count ?? 0);
    const sumStatuses =
      Number(availableRes?.count ?? 0) +
      Number(borrowedRes?.count ?? 0) +
      Number(reservedRes?.count ?? 0) +
      Number(maintenanceRes?.count ?? 0) +
      Number(lostRes?.count ?? 0);

    assert(
      suite4,
      "Copy status counts partition total copies exactly without orphans",
      totalCopies === sumStatuses,
      `totalCopies (${totalCopies}) !== sum of statuses (${sumStatuses})`
    );

    // Fine status integrity check
    const [paidFines] = await db.select({ count: sql<number>`count(*)::int` }).from(fines).where(eq(fines.status, "paid"));
    const [unpaidFines] = await db.select({ count: sql<number>`count(*)::int` }).from(fines).where(eq(fines.status, "unpaid"));
    const [waivedFines] = await db.select({ count: sql<number>`count(*)::int` }).from(fines).where(eq(fines.status, "waived"));
    const totalFines = Number(fineCountRes?.count ?? 0);
    const sumFines =
      Number(paidFines?.count ?? 0) +
      Number(unpaidFines?.count ?? 0) +
      Number(waivedFines?.count ?? 0);

    assert(
      suite4,
      "Fine statuses partition total fines exactly",
      totalFines === sumFines,
      `totalFines (${totalFines}) !== sum of fine statuses (${sumFines})`
    );

  } catch (err) {
    assert(suite4, "Database connection & query execution", false, String(err));
  }

  // ----------------------------------------------------
  // REPORT RESULTS
  // ----------------------------------------------------
  console.log("QA TEST RESULTS BY SUITE:");
  const suites = Array.from(new Set(results.map((r) => r.suite)));
  let totalPassed = 0;
  let totalFailed = 0;

  for (const s of suites) {
    console.log(`\n▶ [SUITE] ${s}`);
    const suiteTests = results.filter((r) => r.suite === s);
    for (const t of suiteTests) {
      if (t.passed) {
        totalPassed++;
        console.log(`  ✓ ${t.name}`);
      } else {
        totalFailed++;
        console.log(`  ✗ ${t.name} -> FAIL: ${t.details}`);
      }
    }
  }

  console.log("\n==================================================");
  console.log(`SUMMARY: ${totalPassed} passed, ${totalFailed} failed (Total: ${results.length})`);
  console.log("==================================================");

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runQA();
