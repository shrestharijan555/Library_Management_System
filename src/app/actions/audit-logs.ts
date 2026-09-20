// src/app/actions/audit-logs.ts
"use server";

import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    memberCode: string;
    role: string;
  } | null;
}

export interface AuditLogsFilterParams {
  page?: number;
  pageSize?: number;
  action?: string;
  entityType?: string;
  search?: string;
  dateRange?: string; // 'all' | 'today' | '7days' | '30days' | 'this_month'
}

export interface AuditLogsResult {
  logs: AuditLogItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  error?: string;
}

/**
 * Server Action: Fetch paginated, filtered audit logs.
 * Enforces `system:audit_logs` permission (Admin and Librarian only).
 */
export async function getAuditLogsAction(
  params: AuditLogsFilterParams = {}
): Promise<AuditLogsResult> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.VIEW_AUDIT_LOGS)) {
    return {
      logs: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: 25,
      error: "Unauthorized. You do not have permission to view system audit logs.",
    };
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  const conditions = [];

  // Filter by action
  if (params.action && params.action !== "all") {
    conditions.push(eq(auditLogs.action, params.action));
  }

  // Filter by entityType
  if (params.entityType && params.entityType !== "all") {
    conditions.push(eq(auditLogs.entityType, params.entityType));
  }

  // Filter by date range
  const now = new Date();
  if (params.dateRange === "today") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    conditions.push(gte(auditLogs.createdAt, startOfDay));
  } else if (params.dateRange === "7days") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    conditions.push(gte(auditLogs.createdAt, sevenDaysAgo));
  } else if (params.dateRange === "30days") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    conditions.push(gte(auditLogs.createdAt, thirtyDaysAgo));
  } else if (params.dateRange === "this_month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    conditions.push(gte(auditLogs.createdAt, startOfMonth));
  } else if (params.dateRange === "last_month") {
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    conditions.push(
      and(
        gte(auditLogs.createdAt, startOfLastMonth),
        lte(auditLogs.createdAt, endOfLastMonth)
      )
    );
  }

  // Search filter (keyword in action, entityId, details, or user name/member code)
  if (params.search && params.search.trim().length > 0) {
    const term = `%${params.search.trim().toLowerCase()}%`;
    conditions.push(
      sql`(
        LOWER(${auditLogs.action}) LIKE ${term} OR
        LOWER(${auditLogs.entityType}) LIKE ${term} OR
        LOWER(COALESCE(${auditLogs.entityId}, '')) LIKE ${term} OR
        LOWER(COALESCE(${auditLogs.details}, '')) LIKE ${term} OR
        ${auditLogs.userId} IN (
          SELECT id FROM ${users} 
          WHERE LOWER(full_name) LIKE ${term} OR LOWER(member_code) LIKE ${term} OR LOWER(email) LIKE ${term}
        )
      )`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    // 1. Get total count
    const [countRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    const totalCount = Number(countRes?.count ?? 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    // 2. Fetch rows with joined user
    const rows = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
        userId: users.id,
        userName: users.fullName,
        userEmail: users.email,
        userMemberCode: users.memberCode,
        userRole: users.role,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset(offset);

    const logs: AuditLogItem[] = rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      details: r.details,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      createdAt: r.createdAt.toISOString(),
      user: r.userId
        ? {
            id: r.userId,
            fullName: r.userName || "Unknown",
            email: r.userEmail || "",
            memberCode: r.userMemberCode || "",
            role: r.userRole || "student",
          }
        : null,
    }));

    return {
      logs,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
    };
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return {
      logs: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      pageSize,
      error: "Failed to load audit logs due to a server query error.",
    };
  }
}

/**
 * Server Action: Fetch all matching audit records formatted for CSV export.
 */
export async function getExportableAuditLogsAction(
  params: AuditLogsFilterParams = {}
): Promise<Array<Record<string, unknown>>> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.VIEW_AUDIT_LOGS)) {
    return [];
  }

  const conditions = [];

  if (params.action && params.action !== "all") {
    conditions.push(eq(auditLogs.action, params.action));
  }

  if (params.entityType && params.entityType !== "all") {
    conditions.push(eq(auditLogs.entityType, params.entityType));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const rows = await db
      .select({
        LogID: auditLogs.id,
        Timestamp: auditLogs.createdAt,
        Action: auditLogs.action,
        EntityType: auditLogs.entityType,
        EntityID: auditLogs.entityId,
        ActorName: users.fullName,
        ActorMemberCode: users.memberCode,
        ActorRole: users.role,
        Details: auditLogs.details,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(1000);

    return rows.map((r) => ({
      ...r,
      Timestamp: r.Timestamp.toISOString(),
      ActorName: r.ActorName || "System / Anonymous",
      ActorMemberCode: r.ActorMemberCode || "-",
      ActorRole: r.ActorRole || "-",
      Details: r.Details || "-",
    }));
  } catch (err) {
    console.error("Error exporting audit logs:", err);
    return [];
  }
}
