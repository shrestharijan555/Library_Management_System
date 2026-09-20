// src/lib/audit/logger.ts
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db } from "@/db";
import { auditLogs, type NewAuditLog } from "@/db/schema";
import * as schema from "@/db/schema";

export type DbExecutor =
  | PostgresJsDatabase<typeof schema>
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface AuditLogParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Universal audit log writer.
 * Accepts either a standalone DB client or an active database transaction executor (tx)
 * to guarantee transactional consistency.
 */
export async function logAudit(
  executor: DbExecutor,
  params: AuditLogParams
): Promise<void> {
  try {
    const detailsString =
      params.details === null || params.details === undefined
        ? null
        : typeof params.details === "string"
        ? params.details
        : JSON.stringify(params.details);

    const record: NewAuditLog = {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      details: detailsString,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    };

    await executor.insert(auditLogs).values(record);
  } catch (err) {
    // Log error to server console, avoid crashing transaction unless strictly required
    console.error("Failed to write audit log entry:", err, { action: params.action });
  }
}
