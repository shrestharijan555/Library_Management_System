export const USER_ROLES = {
  ADMIN: "admin",
  LIBRARIAN: "librarian",
  STAFF: "staff",
  STUDENT: "student",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  librarian: 3,
  staff: 2,
  student: 1,
};

export const PERMISSIONS = {
  // Catalogue
  VIEW_CATALOGUE: "catalogue:view",
  CREATE_BOOK: "catalogue:create",
  UPDATE_BOOK: "catalogue:update",
  DELETE_BOOK: "catalogue:delete",

  // Copies & Inventory
  MANAGE_INVENTORY: "inventory:manage",
  SCAN_BARCODE: "inventory:scan",

  // Loans & Circulation
  ISSUE_BOOK: "circulation:issue",
  RETURN_BOOK: "circulation:return",
  RENEW_BOOK: "circulation:renew",
  RESERVE_BOOK: "circulation:reserve",

  // Fines
  VIEW_FINES: "fines:view",
  COLLECT_FINE: "fines:collect",
  WAIVE_FINE: "fines:waive",

  // Members & Users
  VIEW_MEMBERS: "members:view",
  CREATE_MEMBER: "members:create",
  UPDATE_MEMBER: "members:update",
  DELETE_MEMBER: "members:delete",

  // Reports & Analytics
  VIEW_REPORTS: "reports:view",
  EXPORT_DATA: "reports:export",

  // System Administration
  VIEW_AUDIT_LOGS: "system:audit_logs",
  MANAGE_SETTINGS: "system:settings",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: Object.values(PERMISSIONS),
  librarian: [
    PERMISSIONS.VIEW_CATALOGUE,
    PERMISSIONS.CREATE_BOOK,
    PERMISSIONS.UPDATE_BOOK,
    PERMISSIONS.DELETE_BOOK,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.SCAN_BARCODE,
    PERMISSIONS.ISSUE_BOOK,
    PERMISSIONS.RETURN_BOOK,
    PERMISSIONS.RENEW_BOOK,
    PERMISSIONS.RESERVE_BOOK,
    PERMISSIONS.VIEW_FINES,
    PERMISSIONS.COLLECT_FINE,
    PERMISSIONS.WAIVE_FINE,
    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.CREATE_MEMBER,
    PERMISSIONS.UPDATE_MEMBER,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  staff: [
    PERMISSIONS.VIEW_CATALOGUE,
    PERMISSIONS.RESERVE_BOOK,
    PERMISSIONS.RENEW_BOOK,
    PERMISSIONS.VIEW_FINES,
  ],
  student: [
    PERMISSIONS.VIEW_CATALOGUE,
    PERMISSIONS.RESERVE_BOOK,
    PERMISSIONS.RENEW_BOOK,
    PERMISSIONS.VIEW_FINES,
  ],
};

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

export function isAtLeastRole(userRole: UserRole, targetRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[targetRole] ?? 0);
}
