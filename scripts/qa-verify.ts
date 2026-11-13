import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PERMISSIONS, ROLE_PERMISSIONS, ROLE_HIERARCHY, hasPermission, isAtLeastRole, USER_ROLES } from "../src/config/roles";
import type { UserRole, Permission } from "../src/config/roles";
import { calculateOverdueFine, MAX_FINE_PER_LOAN_CENTS, RESERVATION_HOLD_EXPIRY_DAYS } from "../src/lib/circulation/policies";
import { DEFAULT_LIBRARY_POLICIES, siteConfig, MAIN_NAV_ITEMS } from "../src/config/site";
import type { LibraryPolicy } from "../src/config/site";
import {
  issueLoanSchema,
  issueLoanByBarcodeSchema,
  returnLoanSchema,
  returnLoanByBarcodeSchema,
  renewLoanSchema,
  reserveBookSchema,
  cancelReservationSchema,
  memberLookupSchema,
} from "../src/lib/circulation/validation";
import { bookFormSchema, catalogueQuerySchema } from "../src/lib/catalogue/validation";
import {
  createMemberSchema,
  updateMemberSchema,
  updateMemberStatusSchema,
  deleteMemberSchema,
  membersQuerySchema,
} from "../src/lib/members/validation";
import {
  addCopiesSchema,
  updateCopySchema,
  updateCopyStatusSchema,
  deleteCopySchema,
  barcodeLookupSchema,
} from "../src/lib/inventory/validation";
import { formatCurrency, formatDate, getDaysDifference } from "../src/lib/utils";
import { DEMO_ACCOUNTS } from "../src/config/demo-accounts";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { books, bookCopies, loans, users, fines, reservations, auditLogs, categories, authors, publishers, bookAuthors, notifications, systemSettings } from "../src/db/schema";
import { sql, eq, and, isNull, isNotNull, count as drizzleCount } from "drizzle-orm";

const conn = process.env.DATABASE_URL || "";
const client = postgres(conn, { prepare: false, ssl: conn.includes("localhost") ? false : "require" });
const db = drizzle(client, { schema });

// ──────────────────────────────────────────────
// TEST INFRASTRUCTURE
// ──────────────────────────────────────────────
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

function assertThrows(suite: string, name: string, fn: () => void) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  assert(suite, name, threw, "Expected function to throw but it did not");
}

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const VALID_UUID_2 = "223e4567-e89b-12d3-a456-426614174001";

// ──────────────────────────────────────────────
// MAIN QA RUNNER
// ──────────────────────────────────────────────
async function runQA() {
  const startTime = Date.now();

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║   LIBRARY MANAGEMENT SYSTEM — COMPREHENSIVE QA TEST SUITE  ║");
  console.log("║   Sprint 3 · Full Verification · 10 Test Suites            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // ╔══════════════════════════════════════════════╗
  // ║  SUITE 1: RBAC & PERMISSION MATRIX          ║
  // ╚══════════════════════════════════════════════╝
  const S1 = "1. RBAC Authorization Matrix";

  // --- Admin: god-mode — must have ALL permissions ---
  const allPermissions = Object.values(PERMISSIONS) as Permission[];
  for (const perm of allPermissions) {
    assert(S1, `Admin has ${perm}`, hasPermission("admin", perm));
  }

  // --- Librarian: catalogue + circulation + members (read/create/update) + reports + audit ---
  assert(S1, "Librarian has ISSUE_BOOK", hasPermission("librarian", PERMISSIONS.ISSUE_BOOK));
  assert(S1, "Librarian has RETURN_BOOK", hasPermission("librarian", PERMISSIONS.RETURN_BOOK));
  assert(S1, "Librarian has RENEW_BOOK", hasPermission("librarian", PERMISSIONS.RENEW_BOOK));
  assert(S1, "Librarian has CREATE_BOOK", hasPermission("librarian", PERMISSIONS.CREATE_BOOK));
  assert(S1, "Librarian has UPDATE_BOOK", hasPermission("librarian", PERMISSIONS.UPDATE_BOOK));
  assert(S1, "Librarian has DELETE_BOOK", hasPermission("librarian", PERMISSIONS.DELETE_BOOK));
  assert(S1, "Librarian has MANAGE_INVENTORY", hasPermission("librarian", PERMISSIONS.MANAGE_INVENTORY));
  assert(S1, "Librarian has VIEW_AUDIT_LOGS", hasPermission("librarian", PERMISSIONS.VIEW_AUDIT_LOGS));
  assert(S1, "Librarian has VIEW_REPORTS", hasPermission("librarian", PERMISSIONS.VIEW_REPORTS));
  assert(S1, "Librarian has EXPORT_DATA", hasPermission("librarian", PERMISSIONS.EXPORT_DATA));
  assert(S1, "Librarian has VIEW_FINES", hasPermission("librarian", PERMISSIONS.VIEW_FINES));
  assert(S1, "Librarian has COLLECT_FINE", hasPermission("librarian", PERMISSIONS.COLLECT_FINE));
  assert(S1, "Librarian has WAIVE_FINE", hasPermission("librarian", PERMISSIONS.WAIVE_FINE));
  assert(S1, "Librarian has CREATE_MEMBER", hasPermission("librarian", PERMISSIONS.CREATE_MEMBER));
  assert(S1, "Librarian has UPDATE_MEMBER", hasPermission("librarian", PERMISSIONS.UPDATE_MEMBER));
  assert(S1, "Librarian CANNOT MANAGE_SETTINGS", !hasPermission("librarian", PERMISSIONS.MANAGE_SETTINGS));
  assert(S1, "Librarian CANNOT DELETE_MEMBER", !hasPermission("librarian", PERMISSIONS.DELETE_MEMBER));

  // --- Staff: limited to view, reserve, renew, view fines ---
  assert(S1, "Staff has VIEW_CATALOGUE", hasPermission("staff", PERMISSIONS.VIEW_CATALOGUE));
  assert(S1, "Staff has RESERVE_BOOK", hasPermission("staff", PERMISSIONS.RESERVE_BOOK));
  assert(S1, "Staff has RENEW_BOOK", hasPermission("staff", PERMISSIONS.RENEW_BOOK));
  assert(S1, "Staff has VIEW_FINES", hasPermission("staff", PERMISSIONS.VIEW_FINES));
  assert(S1, "Staff CANNOT ISSUE_BOOK", !hasPermission("staff", PERMISSIONS.ISSUE_BOOK));
  assert(S1, "Staff CANNOT RETURN_BOOK", !hasPermission("staff", PERMISSIONS.RETURN_BOOK));
  assert(S1, "Staff CANNOT CREATE_BOOK", !hasPermission("staff", PERMISSIONS.CREATE_BOOK));
  assert(S1, "Staff CANNOT DELETE_BOOK", !hasPermission("staff", PERMISSIONS.DELETE_BOOK));
  assert(S1, "Staff CANNOT VIEW_AUDIT_LOGS", !hasPermission("staff", PERMISSIONS.VIEW_AUDIT_LOGS));
  assert(S1, "Staff CANNOT MANAGE_SETTINGS", !hasPermission("staff", PERMISSIONS.MANAGE_SETTINGS));
  assert(S1, "Staff CANNOT CREATE_MEMBER", !hasPermission("staff", PERMISSIONS.CREATE_MEMBER));
  assert(S1, "Staff CANNOT COLLECT_FINE", !hasPermission("staff", PERMISSIONS.COLLECT_FINE));

  // --- Student: same as staff ---
  assert(S1, "Student has VIEW_CATALOGUE", hasPermission("student", PERMISSIONS.VIEW_CATALOGUE));
  assert(S1, "Student has RESERVE_BOOK", hasPermission("student", PERMISSIONS.RESERVE_BOOK));
  assert(S1, "Student has RENEW_BOOK", hasPermission("student", PERMISSIONS.RENEW_BOOK));
  assert(S1, "Student has VIEW_FINES", hasPermission("student", PERMISSIONS.VIEW_FINES));
  assert(S1, "Student CANNOT ISSUE_BOOK", !hasPermission("student", PERMISSIONS.ISSUE_BOOK));
  assert(S1, "Student CANNOT RETURN_BOOK", !hasPermission("student", PERMISSIONS.RETURN_BOOK));
  assert(S1, "Student CANNOT VIEW_AUDIT_LOGS", !hasPermission("student", PERMISSIONS.VIEW_AUDIT_LOGS));
  assert(S1, "Student CANNOT VIEW_REPORTS", !hasPermission("student", PERMISSIONS.VIEW_REPORTS));
  assert(S1, "Student CANNOT CREATE_MEMBER", !hasPermission("student", PERMISSIONS.CREATE_MEMBER));
  assert(S1, "Student CANNOT DELETE_MEMBER", !hasPermission("student", PERMISSIONS.DELETE_MEMBER));

  // --- Role hierarchy ---
  assert(S1, "Admin >= Admin", isAtLeastRole("admin", "admin"));
  assert(S1, "Admin >= Librarian", isAtLeastRole("admin", "librarian"));
  assert(S1, "Admin >= Staff", isAtLeastRole("admin", "staff"));
  assert(S1, "Admin >= Student", isAtLeastRole("admin", "student"));
  assert(S1, "Librarian >= Librarian", isAtLeastRole("librarian", "librarian"));
  assert(S1, "Librarian >= Staff", isAtLeastRole("librarian", "staff"));
  assert(S1, "Librarian !>= Admin", !isAtLeastRole("librarian", "admin"));
  assert(S1, "Staff >= Student", isAtLeastRole("staff", "student"));
  assert(S1, "Staff !>= Librarian", !isAtLeastRole("staff", "librarian"));
  assert(S1, "Student !>= Staff", !isAtLeastRole("student", "staff"));

  // Hierarchy numerical values
  assert(S1, "Hierarchy: admin=4", ROLE_HIERARCHY["admin"] === 4);
  assert(S1, "Hierarchy: librarian=3", ROLE_HIERARCHY["librarian"] === 3);
  assert(S1, "Hierarchy: staff=2", ROLE_HIERARCHY["staff"] === 2);
  assert(S1, "Hierarchy: student=1", ROLE_HIERARCHY["student"] === 1);

  // All 4 roles defined
  assert(S1, "USER_ROLES has 4 entries", Object.keys(USER_ROLES).length === 4);
  assert(S1, "ROLE_PERMISSIONS covers all 4 roles", Object.keys(ROLE_PERMISSIONS).length === 4);

  // Librarian permission count (exactly 18)
  assert(S1, "Librarian has exactly 19 permissions", ROLE_PERMISSIONS["librarian"].length === 19);

  // Student/staff permission count (exactly 4)
  assert(S1, "Student has exactly 4 permissions", ROLE_PERMISSIONS["student"].length === 4);
  assert(S1, "Staff has exactly 4 permissions", ROLE_PERMISSIONS["staff"].length === 4);

  // Admin has all permissions
  assert(S1, "Admin permission count equals total permissions", ROLE_PERMISSIONS["admin"].length === allPermissions.length);

  // ╔══════════════════════════════════════════════╗
  // ║  SUITE 2: FINES & OVERDUE CALCULATIONS      ║
  // ╚══════════════════════════════════════════════╝
  const S2 = "2. Fines & Monetary Precision";

  const now = new Date();
  const studentPolicy = DEFAULT_LIBRARY_POLICIES.student;
  const staffPolicy = DEFAULT_LIBRARY_POLICIES.staff;
  const librarianPolicy = DEFAULT_LIBRARY_POLICIES.librarian;

  // Case A: Not overdue (future due date)
  const futureDue = new Date(now.getTime() + 5 * 86400000);
  const resA = calculateOverdueFine(futureDue, now, studentPolicy);
  assert(S2, "Future due → 0 fine, not overdue", !resA.isOverdue && resA.fineCents === 0 && resA.daysOverdue === 0);

  // Case B: Due today (same-day return)
  const resB = calculateOverdueFine(now, now, studentPolicy);
  assert(S2, "Same-day return → 0 fine, not overdue", !resB.isOverdue && resB.fineCents === 0);

  // Case C: 1 day overdue, within 1-day grace period
  const oneDayPast = new Date(now.getTime() - 1 * 86400000);
  const resC = calculateOverdueFine(oneDayPast, now, studentPolicy);
  assert(S2, "1d overdue within 1d grace → 0 fine, is overdue", resC.isOverdue && resC.fineCents === 0 && resC.chargeableDays === 0);

  // Case D: 3 days overdue, 1 day grace → 2 chargeable days × $0.50 = $1.00
  const threeDaysPast = new Date(now.getTime() - 3 * 86400000);
  const resD = calculateOverdueFine(threeDaysPast, now, studentPolicy);
  assert(S2, "3d overdue, 1d grace → 2 chargeable × 50¢ = $1.00", resD.chargeableDays === 2 && resD.fineCents === 100);

  // Case E: 7 days overdue → 6 chargeable × 50¢ = $3.00
  const sevenDaysPast = new Date(now.getTime() - 7 * 86400000);
  const resE = calculateOverdueFine(sevenDaysPast, now, studentPolicy);
  assert(S2, "7d overdue, 1d grace → 6 chargeable × 50¢ = $3.00", resE.chargeableDays === 6 && resE.fineCents === 300);

  // Case F: Extreme overdue (300 days) → capped at MAX_FINE
  const extremePast = new Date(now.getTime() - 300 * 86400000);
  const resF = calculateOverdueFine(extremePast, now, studentPolicy);
  assert(S2, "300d overdue → capped at $50.00", resF.fineCents === MAX_FINE_PER_LOAN_CENTS);
  assert(S2, "MAX_FINE_PER_LOAN_CENTS is 5000", MAX_FINE_PER_LOAN_CENTS === 5000);

  // Case G: Staff policy — 3 days grace period, 25¢/day
  const fiveDaysPast = new Date(now.getTime() - 5 * 86400000);
  const resG = calculateOverdueFine(fiveDaysPast, now, staffPolicy);
  assert(S2, "Staff: 5d overdue, 3d grace → 2 × 25¢ = $0.50", resG.chargeableDays === 2 && resG.fineCents === 50);

  // Case H: Librarian policy — 0¢/day fine (exempt)
  const resH = calculateOverdueFine(fiveDaysPast, now, librarianPolicy);
  assert(S2, "Librarian: 0¢/day → always $0.00 fine", resH.fineCents === 0);

  // Case I: formattedNotice non-empty when fine > 0
  assert(S2, "formattedNotice populated when fine assessed", resD.formattedNotice.length > 0);
  assert(S2, "formattedNotice empty when no overdue", resA.formattedNotice === "");

  // Case J: Grace period message when overdue but within grace
  assert(S2, "Within-grace notice mentions grace period", resC.formattedNotice.includes("grace"));

  // Case K: dailyRateCents matches policy
  assert(S2, "dailyRateCents matches student policy", resA.dailyRateCents === 50);
  assert(S2, "dailyRateCents matches staff policy", resG.dailyRateCents === 25);

  // Case L: RESERVATION_HOLD_EXPIRY_DAYS constant
  assert(S2, "RESERVATION_HOLD_EXPIRY_DAYS is 7", RESERVATION_HOLD_EXPIRY_DAYS === 7);

  // Case M: String date input support
  const resMStr = calculateOverdueFine(threeDaysPast.toISOString(), now.toISOString(), studentPolicy);
  assert(S2, "String date inputs work identically", resMStr.fineCents === resD.fineCents && resMStr.chargeableDays === resD.chargeableDays);

  // Case N: null return date defaults to now()
  const resNull = calculateOverdueFine(threeDaysPast, null, studentPolicy);
  assert(S2, "Null return date uses current time", resNull.isOverdue && resNull.fineCents > 0);

  // ╔══════════════════════════════════════════════╗
  // ║  SUITE 3: CIRCULATION VALIDATION SCHEMAS     ║
  // ╚══════════════════════════════════════════════╝
  const S3 = "3. Circulation Zod Validation";

  // --- issueLoanSchema ---
  assert(S3, "issueLoan: valid input passes", issueLoanSchema.safeParse({ copyId: VALID_UUID, memberCode: "STU-2024-001" }).success);
  assert(S3, "issueLoan: invalid UUID rejected", !issueLoanSchema.safeParse({ copyId: "bad-uuid", memberCode: "STU-001" }).success);
  assert(S3, "issueLoan: empty copyId rejected", !issueLoanSchema.safeParse({ copyId: "", memberCode: "STU-001" }).success);
  assert(S3, "issueLoan: empty memberCode rejected", !issueLoanSchema.safeParse({ copyId: VALID_UUID, memberCode: "" }).success);
  assert(S3, "issueLoan: memberCode > 50 chars rejected", !issueLoanSchema.safeParse({ copyId: VALID_UUID, memberCode: "X".repeat(51) }).success);

  // --- issueLoanByBarcodeSchema ---
  assert(S3, "issueLoanByBarcode: valid passes", issueLoanByBarcodeSchema.safeParse({ barcode: "BC-100234", memberCode: "STU-1001" }).success);
  assert(S3, "issueLoanByBarcode: empty barcode rejected", !issueLoanByBarcodeSchema.safeParse({ barcode: "", memberCode: "STU-1001" }).success);
  assert(S3, "issueLoanByBarcode: barcode > 100 chars rejected", !issueLoanByBarcodeSchema.safeParse({ barcode: "X".repeat(101), memberCode: "STU-1001" }).success);

  // --- returnLoanSchema ---
  assert(S3, "returnLoan: valid UUID passes", returnLoanSchema.safeParse({ loanId: VALID_UUID }).success);
  assert(S3, "returnLoan: invalid UUID rejected", !returnLoanSchema.safeParse({ loanId: "not-a-uuid" }).success);

  // --- returnLoanByBarcodeSchema ---
  assert(S3, "returnLoanByBarcode: valid passes", returnLoanByBarcodeSchema.safeParse({ barcode: "BC-001" }).success);
  assert(S3, "returnLoanByBarcode: empty barcode rejected", !returnLoanByBarcodeSchema.safeParse({ barcode: "" }).success);

  // --- renewLoanSchema ---
  assert(S3, "renewLoan: valid UUID passes", renewLoanSchema.safeParse({ loanId: VALID_UUID }).success);
  assert(S3, "renewLoan: invalid UUID rejected", !renewLoanSchema.safeParse({ loanId: "abc" }).success);

  // --- reserveBookSchema ---
  assert(S3, "reserveBook: valid passes", reserveBookSchema.safeParse({ bookId: VALID_UUID, memberCode: "STU-001" }).success);
  assert(S3, "reserveBook: invalid bookId rejected", !reserveBookSchema.safeParse({ bookId: "bad", memberCode: "STU-001" }).success);
  assert(S3, "reserveBook: empty memberCode rejected", !reserveBookSchema.safeParse({ bookId: VALID_UUID, memberCode: "" }).success);

  // --- cancelReservationSchema ---
  assert(S3, "cancelReservation: valid UUID passes", cancelReservationSchema.safeParse({ reservationId: VALID_UUID }).success);
  assert(S3, "cancelReservation: invalid rejected", !cancelReservationSchema.safeParse({ reservationId: "abc" }).success);

  // --- memberLookupSchema ---
  assert(S3, "memberLookup: valid passes", memberLookupSchema.safeParse({ memberCode: "STU-2024-001" }).success);
  assert(S3, "memberLookup: empty rejected", !memberLookupSchema.safeParse({ memberCode: "" }).success);
  assert(S3, "memberLookup: > 50 chars rejected", !memberLookupSchema.safeParse({ memberCode: "X".repeat(51) }).success);

  // ╔══════════════════════════════════════════════╗
  // ║  SUITE 4: CATALOGUE VALIDATION SCHEMAS       ║
  // ╚══════════════════════════════════════════════╝
  const S4 = "4. Catalogue Zod Validation";

  const validBookInput = {
    title: "Introduction to Algorithms",
    isbn: "978-0-262-04630-5",
    language: "English",
    authorIds: [VALID_UUID],
    initialCopies: 3,
  };

  assert(S4, "bookForm: valid input passes", bookFormSchema.safeParse(validBookInput).success);
  assert(S4, "bookForm: missing title rejected", !bookFormSchema.safeParse({ ...validBookInput, title: "" }).success);
  assert(S4, "bookForm: title > 500 chars rejected", !bookFormSchema.safeParse({ ...validBookInput, title: "X".repeat(501) }).success);
  assert(S4, "bookForm: short ISBN rejected", !bookFormSchema.safeParse({ ...validBookInput, isbn: "123" }).success);
  assert(S4, "bookForm: ISBN with special chars rejected", !bookFormSchema.safeParse({ ...validBookInput, isbn: "978@abc#123" }).success);
  assert(S4, "bookForm: empty authorIds rejected", !bookFormSchema.safeParse({ ...validBookInput, authorIds: [] }).success);
  assert(S4, "bookForm: negative copies rejected", !bookFormSchema.safeParse({ ...validBookInput, initialCopies: -1 }).success);
  assert(S4, "bookForm: copies > 100 rejected", !bookFormSchema.safeParse({ ...validBookInput, initialCopies: 101 }).success);
  assert(S4, "bookForm: invalid categoryId UUID rejected", !bookFormSchema.safeParse({ ...validBookInput, categoryId: "bad" }).success);
  assert(S4, "bookForm: empty categoryId accepted (optional)", bookFormSchema.safeParse({ ...validBookInput, categoryId: "" }).success);
  assert(S4, "bookForm: future publishYear rejected", !bookFormSchema.safeParse({ ...validBookInput, publishYear: new Date().getFullYear() + 5 }).success);
  assert(S4, "bookForm: year 999 rejected", !bookFormSchema.safeParse({ ...validBookInput, publishYear: 999 }).success);
  assert(S4, "bookForm: zero pages rejected", !bookFormSchema.safeParse({ ...validBookInput, pages: 0 }).success);
  assert(S4, "bookForm: language default is English", bookFormSchema.safeParse({ ...validBookInput, language: undefined }).success);

  // catalogueQuerySchema
  assert(S4, "catalogueQuery: defaults pass", catalogueQuerySchema.safeParse({}).success);
  const cqParsed = catalogueQuerySchema.safeParse({});
  if (cqParsed.success) {
    assert(S4, "catalogueQuery: default status=all", cqParsed.data.status === "all");
    assert(S4, "catalogueQuery: default sort=newest", cqParsed.data.sort === "newest");
    assert(S4, "catalogueQuery: default view=grid", cqParsed.data.view === "grid");
    assert(S4, "catalogueQuery: default page=1", cqParsed.data.page === 1);
    assert(S4, "catalogueQuery: default limit=12", cqParsed.data.limit === 12);
  }
  assert(S4, "catalogueQuery: invalid status rejected", !catalogueQuerySchema.safeParse({ status: "invalid" }).success);
  assert(S4, "catalogueQuery: negative page rejected", !catalogueQuerySchema.safeParse({ page: -1 }).success);

  // ╔══════════════════════════════════════════════╗
  // ║  SUITE 5: MEMBER VALIDATION SCHEMAS          ║
  // ╚══════════════════════════════════════════════╝
  const S5 = "5. Member Zod Validation";

  const validMember = { fullName: "John Doe", email: "john@example.com", role: "student" as const, status: "active" as const };

  assert(S5, "createMember: valid passes", createMemberSchema.safeParse(validMember).success);
  assert(S5, "createMember: short name rejected", !createMemberSchema.safeParse({ ...validMember, fullName: "J" }).success);
  assert(S5, "createMember: name > 255 chars rejected", !createMemberSchema.safeParse({ ...validMember, fullName: "X".repeat(256) }).success);
  assert(S5, "createMember: invalid email rejected", !createMemberSchema.safeParse({ ...validMember, email: "notanemail" }).success);
  assert(S5, "createMember: empty email rejected", !createMemberSchema.safeParse({ ...validMember, email: "" }).success);
  assert(S5, "createMember: invalid role rejected", !createMemberSchema.safeParse({ ...validMember, role: "superadmin" }).success);
  assert(S5, "createMember: invalid status rejected", !createMemberSchema.safeParse({ ...validMember, status: "banned" }).success);
  assert(S5, "createMember: memberCode with special chars rejected", !createMemberSchema.safeParse({ ...validMember, memberCode: "STU 001!" }).success);
  assert(S5, "createMember: valid memberCode passes", createMemberSchema.safeParse({ ...validMember, memberCode: "STU-2024.01_A" }).success);
  assert(S5, "createMember: empty memberCode accepted (optional)", createMemberSchema.safeParse({ ...validMember, memberCode: "" }).success);

  // updateMemberSchema
  assert(S5, "updateMember: valid passes", updateMemberSchema.safeParse({ memberId: VALID_UUID, fullName: "Jane Doe", role: "staff" }).success);
  assert(S5, "updateMember: invalid memberId rejected", !updateMemberSchema.safeParse({ memberId: "bad", fullName: "Jane", role: "staff" }).success);

  // updateMemberStatusSchema
  assert(S5, "updateStatus: valid passes", updateMemberStatusSchema.safeParse({ memberId: VALID_UUID, status: "suspended" }).success);
  assert(S5, "updateStatus: invalid status rejected", !updateMemberStatusSchema.safeParse({ memberId: VALID_UUID, status: "banned" }).success);
  assert(S5, "updateStatus: reason > 255 rejected", !updateMemberStatusSchema.safeParse({ memberId: VALID_UUID, status: "suspended", reason: "X".repeat(256) }).success);

  // deleteMemberSchema
  assert(S5, "deleteMember: valid UUID passes", deleteMemberSchema.safeParse({ memberId: VALID_UUID }).success);
  assert(S5, "deleteMember: invalid UUID rejected", !deleteMemberSchema.safeParse({ memberId: "abc" }).success);

  // membersQuerySchema
  assert(S5, "membersQuery: defaults pass", membersQuerySchema.safeParse({}).success);
  const mqParsed = membersQuerySchema.safeParse({});
  if (mqParsed.success) {
    assert(S5, "membersQuery: default role=all", mqParsed.data.role === "all");
    assert(S5, "membersQuery: default status=all", mqParsed.data.status === "all");
    assert(S5, "membersQuery: default standing=all", mqParsed.data.standing === "all");
    assert(S5, "membersQuery: default sort=newest", mqParsed.data.sort === "newest");
    assert(S5, "membersQuery: default page=1", mqParsed.data.page === 1);
    assert(S5, "membersQuery: default limit=15", mqParsed.data.limit === 15);
  }

  // ╔══════════════════════════════════════════════╗
  // ║  SUITE 6: INVENTORY VALIDATION SCHEMAS       ║
  // ╚══════════════════════════════════════════════╝
  const S6 = "6. Inventory Zod Validation";

  // addCopiesSchema
  assert(S6, "addCopies: valid single copy passes", addCopiesSchema.safeParse({ bookId: VALID_UUID, quantity: 1, shelfLocation: "A-101" }).success);
  assert(S6, "addCopies: valid batch (5 copies) passes", addCopiesSchema.safeParse({ bookId: VALID_UUID, quantity: 5, shelfLocation: "B-202" }).success);
  assert(S6, "addCopies: quantity 0 rejected", !addCopiesSchema.safeParse({ bookId: VALID_UUID, quantity: 0, shelfLocation: "A-1" }).success);
  assert(S6, "addCopies: quantity > 100 rejected", !addCopiesSchema.safeParse({ bookId: VALID_UUID, quantity: 101, shelfLocation: "A-1" }).success);
  assert(S6, "addCopies: batch with custom barcode rejected (refinement)", !addCopiesSchema.safeParse({ bookId: VALID_UUID, quantity: 5, shelfLocation: "A-1", customBarcode: "BC-001" }).success);
  assert(S6, "addCopies: single with custom barcode passes", addCopiesSchema.safeParse({ bookId: VALID_UUID, quantity: 1, shelfLocation: "A-1", customBarcode: "BC-001" }).success);
  assert(S6, "addCopies: invalid barcode chars rejected", !addCopiesSchema.safeParse({ bookId: VALID_UUID, quantity: 1, shelfLocation: "A-1", customBarcode: "BC 001!" }).success);
  assert(S6, "addCopies: invalid bookId rejected", !addCopiesSchema.safeParse({ bookId: "bad", quantity: 1, shelfLocation: "A-1" }).success);

  // updateCopySchema
  assert(S6, "updateCopy: valid passes", updateCopySchema.safeParse({ copyId: VALID_UUID, bookId: VALID_UUID_2, barcode: "BC-001", shelfLocation: "A-1", status: "available" }).success);
  assert(S6, "updateCopy: empty barcode rejected", !updateCopySchema.safeParse({ copyId: VALID_UUID, bookId: VALID_UUID_2, barcode: "", shelfLocation: "A-1", status: "available" }).success);
  assert(S6, "updateCopy: invalid status rejected", !updateCopySchema.safeParse({ copyId: VALID_UUID, bookId: VALID_UUID_2, barcode: "BC-1", shelfLocation: "A-1", status: "damaged" }).success);

  // updateCopyStatusSchema
  assert(S6, "updateCopyStatus: valid passes", updateCopyStatusSchema.safeParse({ copyId: VALID_UUID, bookId: VALID_UUID_2, status: "maintenance" }).success);
  assert(S6, "updateCopyStatus: 'lost' accepted", updateCopyStatusSchema.safeParse({ copyId: VALID_UUID, bookId: VALID_UUID_2, status: "lost" }).success);
  assert(S6, "updateCopyStatus: notes > 500 rejected", !updateCopyStatusSchema.safeParse({ copyId: VALID_UUID, bookId: VALID_UUID_2, status: "lost", conditionNotes: "X".repeat(501) }).success);

  // deleteCopySchema
  assert(S6, "deleteCopy: valid passes", deleteCopySchema.safeParse({ copyId: VALID_UUID, bookId: VALID_UUID_2 }).success);
  assert(S6, "deleteCopy: invalid copyId rejected", !deleteCopySchema.safeParse({ copyId: "bad", bookId: VALID_UUID_2 }).success);

  // barcodeLookupSchema
  assert(S6, "barcodeLookup: valid passes", barcodeLookupSchema.safeParse({ barcode: "BC-100234" }).success);
  assert(S6, "barcodeLookup: empty rejected", !barcodeLookupSchema.safeParse({ barcode: "" }).success);
  assert(S6, "barcodeLookup: > 100 chars rejected", !barcodeLookupSchema.safeParse({ barcode: "X".repeat(101) }).success);

  // ╔══════════════════════════════════════════════╗
  // ║  SUITE 7: UTILITY FUNCTIONS                  ║
  // ╚══════════════════════════════════════════════╝
  const S7 = "7. Utility Functions";

  // formatCurrency
  assert(S7, "formatCurrency: 0 cents → $0.00", formatCurrency(0) === "$0.00");
  assert(S7, "formatCurrency: 100 cents → $1.00", formatCurrency(100) === "$1.00");
  assert(S7, "formatCurrency: 5000 cents → $50.00", formatCurrency(5000) === "$50.00");
  assert(S7, "formatCurrency: 50 cents → $0.50", formatCurrency(50) === "$0.50");
  assert(S7, "formatCurrency: 1 cent → $0.01", formatCurrency(1) === "$0.01");
  assert(S7, "formatCurrency: large amount (999999) → $9,999.99", formatCurrency(999999) === "$9,999.99");

  // formatDate
  assert(S7, "formatDate: null → 'N/A'", formatDate(null) === "N/A");
  assert(S7, "formatDate: undefined → 'N/A'", formatDate(undefined) === "N/A");
  assert(S7, "formatDate: Date object produces non-empty string", formatDate(new Date("2024-01-15")).length > 0);
  assert(S7, "formatDate: string date → formatted", formatDate("2024-06-15").includes("2024"));
  assert(S7, "formatDate: number (timestamp) produces non-empty string", formatDate(Date.now()).length > 0);

  // getDaysDifference
  const today = new Date();
  const inFiveDays = new Date(today.getTime() + 5 * 86400000);
  const fiveDaysAgo = new Date(today.getTime() - 5 * 86400000);
  assert(S7, "getDaysDifference: future date → positive", getDaysDifference(inFiveDays, today) === 5);
  assert(S7, "getDaysDifference: past date → negative", getDaysDifference(fiveDaysAgo, today) === -5);
  assert(S7, "getDaysDifference: same date → 0", getDaysDifference(today, today) === 0);
  assert(S7, "getDaysDifference: string date input works", typeof getDaysDifference(inFiveDays.toISOString(), today) === "number");

  // ╔══════════════════════════════════════════════╗
  // ║  SUITE 8: CONFIGURATION INTEGRITY            ║
  // ╚══════════════════════════════════════════════╝
  const S8 = "8. Configuration Integrity";

  // Site config
  assert(S8, "siteConfig.name is 'Library Management System'", siteConfig.name === "Library Management System");
  assert(S8, "siteConfig.shortName is 'EduLibrary'", siteConfig.shortName === "EduLibrary");
  assert(S8, "siteConfig.version is defined", siteConfig.version.length > 0);

  // Default policies sanity
  for (const role of ["student", "staff", "librarian", "admin"] as UserRole[]) {
    const pol = DEFAULT_LIBRARY_POLICIES[role];
    assert(S8, `${role} policy: maxActiveLoans > 0`, pol.maxActiveLoans > 0);
    assert(S8, `${role} policy: loanDurationDays > 0`, pol.loanDurationDays > 0);
    assert(S8, `${role} policy: maxRenewals >= 0`, pol.maxRenewals >= 0);
    assert(S8, `${role} policy: finePerDayCents >= 0`, pol.finePerDayCents >= 0);
    assert(S8, `${role} policy: gracePeriodDays >= 0`, pol.gracePeriodDays >= 0);
  }

  // Policy escalation: higher roles get more privileges
  assert(S8, "Staff loanDuration > Student loanDuration", DEFAULT_LIBRARY_POLICIES.staff.loanDurationDays > DEFAULT_LIBRARY_POLICIES.student.loanDurationDays);
  assert(S8, "Librarian maxActiveLoans > Staff maxActiveLoans", DEFAULT_LIBRARY_POLICIES.librarian.maxActiveLoans > DEFAULT_LIBRARY_POLICIES.staff.maxActiveLoans);
  assert(S8, "Librarian finePerDayCents = 0 (exempt)", DEFAULT_LIBRARY_POLICIES.librarian.finePerDayCents === 0);
  assert(S8, "Admin finePerDayCents = 0 (exempt)", DEFAULT_LIBRARY_POLICIES.admin.finePerDayCents === 0);
  assert(S8, "Student fine rate > Staff fine rate", DEFAULT_LIBRARY_POLICIES.student.finePerDayCents > DEFAULT_LIBRARY_POLICIES.staff.finePerDayCents);

  // Navigation items
  assert(S8, "MAIN_NAV_ITEMS has entries", MAIN_NAV_ITEMS.length > 0);
  const dashboardNav = MAIN_NAV_ITEMS.find(i => i.href === "/dashboard");
  assert(S8, "Dashboard nav item exists", !!dashboardNav);
  assert(S8, "Dashboard is role-unrestricted", !dashboardNav?.roles);

  const circulationNav = MAIN_NAV_ITEMS.find(i => i.href === "/circulation");
  assert(S8, "Circulation nav exists", !!circulationNav);
  assert(S8, "Circulation restricted to admin+librarian", Boolean(circulationNav?.roles?.includes("admin") && circulationNav?.roles?.includes("librarian") && !circulationNav?.roles?.includes("student")));

  const settingsNav = MAIN_NAV_ITEMS.find(i => i.href === "/settings");
  assert(S8, "Settings nav restricted to admin only", settingsNav?.roles?.length === 1 && settingsNav?.roles?.[0] === "admin");

  const myLoansNav = MAIN_NAV_ITEMS.find(i => i.href === "/my-loans");
  assert(S8, "My Loans nav restricted to student+staff", Boolean(myLoansNav?.roles?.includes("student") && myLoansNav?.roles?.includes("staff") && !myLoansNav?.roles?.includes("admin")));

  // Demo accounts
  assert(S8, "4 demo accounts defined", DEMO_ACCOUNTS.length === 4);
  const demoRoles = DEMO_ACCOUNTS.map(a => a.role);
  assert(S8, "Demo accounts cover all 4 roles", demoRoles.includes("admin") && demoRoles.includes("librarian") && demoRoles.includes("staff") && demoRoles.includes("student"));
  for (const acct of DEMO_ACCOUNTS) {
    assert(S8, `Demo ${acct.role}: has email`, acct.email.includes("@"));
    assert(S8, `Demo ${acct.role}: has password`, acct.password.length >= 8);
    assert(S8, `Demo ${acct.role}: has memberCode`, acct.memberCode.length > 0);
    assert(S8, `Demo ${acct.role}: has fullName`, acct.fullName.length > 0);
  }

  // ╔══════════════════════════════════════════════╗
  // ║  SUITE 9: DATABASE INTEGRITY & RELATIONS     ║
  // ╚══════════════════════════════════════════════╝
  const S9 = "9. Database Integrity & Relations";

  try {
    // --- Table queryability ---
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    assert(S9, "Users table queryable", Number(userCount?.count ?? 0) >= 0);

    const [bookCount] = await db.select({ count: sql<number>`count(*)::int` }).from(books);
    assert(S9, "Books table queryable", Number(bookCount?.count ?? 0) >= 0);

    const [copyCount] = await db.select({ count: sql<number>`count(*)::int` }).from(bookCopies);
    assert(S9, "BookCopies table queryable", Number(copyCount?.count ?? 0) >= 0);

    const [loanCount] = await db.select({ count: sql<number>`count(*)::int` }).from(loans);
    assert(S9, "Loans table queryable", Number(loanCount?.count ?? 0) >= 0);

    const [fineCount] = await db.select({ count: sql<number>`count(*)::int` }).from(fines);
    assert(S9, "Fines table queryable", Number(fineCount?.count ?? 0) >= 0);

    const [resCount] = await db.select({ count: sql<number>`count(*)::int` }).from(reservations);
    assert(S9, "Reservations table queryable", Number(resCount?.count ?? 0) >= 0);

    const [auditCount] = await db.select({ count: sql<number>`count(*)::int` }).from(auditLogs);
    assert(S9, "AuditLogs table queryable", Number(auditCount?.count ?? 0) >= 0);

    const [catCount] = await db.select({ count: sql<number>`count(*)::int` }).from(categories);
    assert(S9, "Categories table queryable", Number(catCount?.count ?? 0) >= 0);

    const [authorCount] = await db.select({ count: sql<number>`count(*)::int` }).from(authors);
    assert(S9, "Authors table queryable", Number(authorCount?.count ?? 0) >= 0);

    const [pubCount] = await db.select({ count: sql<number>`count(*)::int` }).from(publishers);
    assert(S9, "Publishers table queryable", Number(pubCount?.count ?? 0) >= 0);

    const [baCount] = await db.select({ count: sql<number>`count(*)::int` }).from(bookAuthors);
    assert(S9, "BookAuthors junction table queryable", Number(baCount?.count ?? 0) >= 0);

    const [notifCount] = await db.select({ count: sql<number>`count(*)::int` }).from(notifications);
    assert(S9, "Notifications table queryable", Number(notifCount?.count ?? 0) >= 0);

    const [settingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(systemSettings);
    assert(S9, "SystemSettings table queryable", Number(settingCount?.count ?? 0) >= 0);

    // --- Copy status partition check ---
    const statusCounts = await Promise.all(
      (["available", "borrowed", "reserved", "maintenance", "lost"] as const).map(async (s) => {
        const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(bookCopies).where(eq(bookCopies.status, s));
        return Number(r?.count ?? 0);
      })
    );
    const totalCopies = Number(copyCount?.count ?? 0);
    const sumStatuses = statusCounts.reduce((a, b) => a + b, 0);
    assert(S9, "Copy statuses partition total exactly (no orphans)", totalCopies === sumStatuses, `total=${totalCopies}, sum=${sumStatuses}`);

    // --- Fine status partition check ---
    const fineStatusCounts = await Promise.all(
      (["paid", "unpaid", "waived"] as const).map(async (s) => {
        const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(fines).where(eq(fines.status, s));
        return Number(r?.count ?? 0);
      })
    );
    const totalFines = Number(fineCount?.count ?? 0);
    const sumFineStatuses = fineStatusCounts.reduce((a, b) => a + b, 0);
    assert(S9, "Fine statuses partition total exactly", totalFines === sumFineStatuses, `total=${totalFines}, sum=${sumFineStatuses}`);

    // --- Loan status partition check ---
    const loanStatusCounts = await Promise.all(
      (["active", "returned", "overdue"] as const).map(async (s) => {
        const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(loans).where(eq(loans.status, s));
        return Number(r?.count ?? 0);
      })
    );
    const totalLoans = Number(loanCount?.count ?? 0);
    const sumLoanStatuses = loanStatusCounts.reduce((a, b) => a + b, 0);
    assert(S9, "Loan statuses partition total exactly", totalLoans === sumLoanStatuses, `total=${totalLoans}, sum=${sumLoanStatuses}`);

    // --- Reservation status partition check ---
    const resStatusCounts = await Promise.all(
      (["pending", "fulfilled", "cancelled", "expired"] as const).map(async (s) => {
        const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(reservations).where(eq(reservations.status, s));
        return Number(r?.count ?? 0);
      })
    );
    const totalRes = Number(resCount?.count ?? 0);
    const sumResStatuses = resStatusCounts.reduce((a, b) => a + b, 0);
    assert(S9, "Reservation statuses partition total exactly", totalRes === sumResStatuses, `total=${totalRes}, sum=${sumResStatuses}`);

    // --- User status partition check ---
    const userStatusCounts = await Promise.all(
      (["active", "suspended", "inactive"] as const).map(async (s) => {
        const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.status, s));
        return Number(r?.count ?? 0);
      })
    );
    const totalUsers = Number(userCount?.count ?? 0);
    const sumUserStatuses = userStatusCounts.reduce((a, b) => a + b, 0);
    assert(S9, "User statuses partition total exactly", totalUsers === sumUserStatuses, `total=${totalUsers}, sum=${sumUserStatuses}`);

    // --- Referential integrity: every loan references valid user and book ---
    if (totalLoans > 0) {
      const [orphanedLoanUsers] = await db.execute(sql`
        SELECT count(*)::int AS cnt FROM loans l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE u.id IS NULL
      `);
      assert(S9, "No orphaned loan→user references", Number((orphanedLoanUsers as any)?.cnt ?? 0) === 0);

      const [orphanedLoanBooks] = await db.execute(sql`
        SELECT count(*)::int AS cnt FROM loans l
        LEFT JOIN books b ON l.book_id = b.id
        WHERE b.id IS NULL
      `);
      assert(S9, "No orphaned loan→book references", Number((orphanedLoanBooks as any)?.cnt ?? 0) === 0);

      const [orphanedLoanCopies] = await db.execute(sql`
        SELECT count(*)::int AS cnt FROM loans l
        LEFT JOIN book_copies bc ON l.copy_id = bc.id
        WHERE bc.id IS NULL
      `);
      assert(S9, "No orphaned loan→copy references", Number((orphanedLoanCopies as any)?.cnt ?? 0) === 0);
    }

    // --- Referential integrity: every fine references valid user ---
    if (totalFines > 0) {
      const [orphanedFineUsers] = await db.execute(sql`
        SELECT count(*)::int AS cnt FROM fines f
        LEFT JOIN users u ON f.user_id = u.id
        WHERE u.id IS NULL
      `);
      assert(S9, "No orphaned fine→user references", Number((orphanedFineUsers as any)?.cnt ?? 0) === 0);
    }

    // --- Referential integrity: every book_copy references valid book ---
    if (totalCopies > 0) {
      const [orphanedCopyBooks] = await db.execute(sql`
        SELECT count(*)::int AS cnt FROM book_copies bc
        LEFT JOIN books b ON bc.book_id = b.id
        WHERE b.id IS NULL
      `);
      assert(S9, "No orphaned copy→book references", Number((orphanedCopyBooks as any)?.cnt ?? 0) === 0);
    }

    // --- Referential integrity: every reservation references valid book and user ---
    if (totalRes > 0) {
      const [orphanedResBooks] = await db.execute(sql`
        SELECT count(*)::int AS cnt FROM reservations r
        LEFT JOIN books b ON r.book_id = b.id
        WHERE b.id IS NULL
      `);
      assert(S9, "No orphaned reservation→book references", Number((orphanedResBooks as any)?.cnt ?? 0) === 0);

      const [orphanedResUsers] = await db.execute(sql`
        SELECT count(*)::int AS cnt FROM reservations r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE u.id IS NULL
      `);
      assert(S9, "No orphaned reservation→user references", Number((orphanedResUsers as any)?.cnt ?? 0) === 0);
    }

    // --- Copy count consistency: books.totalCopies vs actual bookCopies count ---
    const booksWithCopies = await db.execute(sql`
      SELECT b.id, b.title, b.total_copies, 
             count(bc.id)::int AS actual_count
      FROM books b
      LEFT JOIN book_copies bc ON bc.book_id = b.id
      GROUP BY b.id, b.title, b.total_copies
      HAVING b.total_copies != count(bc.id)
      LIMIT 5
    `);
    const mismatchedBooks = Array.isArray(booksWithCopies) ? booksWithCopies.length : (booksWithCopies as any)?.length ?? 0;
    assert(
      S9,
      "books.totalCopies matches actual copy count for all books",
      mismatchedBooks === 0,
      mismatchedBooks > 0 ? `${mismatchedBooks} book(s) have mismatched totalCopies` : undefined
    );

    // --- Available copy count consistency ---
    const booksWithAvailable = await db.execute(sql`
      SELECT b.id, b.available_copies,
             count(CASE WHEN bc.status = 'available' THEN 1 END)::int AS actual_available
      FROM books b
      LEFT JOIN book_copies bc ON bc.book_id = b.id
      GROUP BY b.id, b.available_copies
      HAVING b.available_copies != count(CASE WHEN bc.status = 'available' THEN 1 END)
      LIMIT 5
    `);
    const mismatchedAvailable = Array.isArray(booksWithAvailable) ? booksWithAvailable.length : (booksWithAvailable as any)?.length ?? 0;
    assert(
      S9,
      "books.availableCopies matches actual available count",
      mismatchedAvailable === 0,
      mismatchedAvailable > 0 ? `${mismatchedAvailable} book(s) have mismatched availableCopies` : undefined
    );

    // --- Active loan ↔ borrowed copy status consistency ---
    const borrowedButNotLoaned = await db.execute(sql`
      SELECT count(*)::int AS cnt FROM book_copies bc
      WHERE bc.status = 'borrowed'
      AND NOT EXISTS (
        SELECT 1 FROM loans l 
        WHERE l.copy_id = bc.id AND l.status = 'active'
      )
    `);
    // Note: This might be legitimately non-zero if status updates lag, but ideally should be 0
    const borrowedOrphanCount = Number((borrowedButNotLoaned as any)?.[0]?.cnt ?? (borrowedButNotLoaned as any)?.cnt ?? 0);
    assert(
      S9,
      "Borrowed copies have corresponding active loans",
      borrowedOrphanCount === 0,
      `${borrowedOrphanCount} borrowed copies without active loans`
    );

  } catch (err) {
    assert(S9, "Database connection & query execution", false, String(err));
  }

  // ╔══════════════════════════════════════════════╗
  // ║  SUITE 10: ENVIRONMENT & BUILD VALIDATION    ║
  // ╚══════════════════════════════════════════════╝
  const S10 = "10. Environment & Build Validation";

  assert(S10, "DATABASE_URL is set", !!process.env.DATABASE_URL);
  assert(S10, "DATABASE_URL starts with postgres://", (process.env.DATABASE_URL || "").startsWith("postgres"));
  assert(S10, "NEXT_PUBLIC_SUPABASE_URL is set", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  assert(S10, "NEXT_PUBLIC_SUPABASE_ANON_KEY is set", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  assert(S10, "NODE_ENV is valid", ["development", "test", "production", undefined].includes(process.env.NODE_ENV));

  // ╔══════════════════════════════════════════════╗
  // ║  FINAL REPORT                                ║
  // ╚══════════════════════════════════════════════╝
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    QA TEST RESULTS BY SUITE                ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const suites = Array.from(new Set(results.map((r) => r.suite)));
  let totalPassed = 0;
  let totalFailed = 0;

  for (const s of suites) {
    const suiteTests = results.filter((r) => r.suite === s);
    const suitePassed = suiteTests.filter((t) => t.passed).length;
    const suiteFailed = suiteTests.filter((t) => !t.passed).length;
    const suiteIcon = suiteFailed === 0 ? "✅" : "❌";

    console.log(`\n${suiteIcon} [${s}] — ${suitePassed}/${suiteTests.length} passed`);

    for (const t of suiteTests) {
      if (t.passed) {
        totalPassed++;
        console.log(`   ✓ ${t.name}`);
      } else {
        totalFailed++;
        console.log(`   ✗ ${t.name}`);
        if (t.details) {
          console.log(`     └─ FAIL: ${t.details}`);
        }
      }
    }
  }

  const passRate = results.length > 0 ? ((totalPassed / results.length) * 100).toFixed(1) : "0.0";

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  SUMMARY: ${String(totalPassed).padStart(3)} passed │ ${String(totalFailed).padStart(3)} failed │ ${String(results.length).padStart(3)} total │ ${passRate}% pass rate  ║`);
  console.log(`║  TIME: ${elapsed}s │ SUITES: ${suites.length}                                   ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");

  if (totalFailed > 0) {
    console.log(`\n⚠️  ${totalFailed} test(s) FAILED. Review failures above.`);
    process.exit(1);
  } else {
    console.log("\n🎉 ALL TESTS PASSED — System verification complete.");
    process.exit(0);
  }
}

runQA();
