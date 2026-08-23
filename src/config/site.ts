import { UserRole } from "./roles";

export const siteConfig = {
  name: "Library Management System",
  shortName: "EduLibrary",
  description:
    "Production-oriented library management system for schools and educational institutions.",
  version: "0.2.0",
};

export interface LibraryPolicy {
  maxActiveLoans: number;
  loanDurationDays: number;
  maxRenewals: number;
  finePerDayCents: number; // in cents or currency units
  gracePeriodDays: number;
}

export const DEFAULT_LIBRARY_POLICIES: Record<UserRole, LibraryPolicy> = {
  student: {
    maxActiveLoans: 3,
    loanDurationDays: 14,
    maxRenewals: 2,
    finePerDayCents: 50, // $0.50 / day
    gracePeriodDays: 1,
  },
  staff: {
    maxActiveLoans: 10,
    loanDurationDays: 30,
    maxRenewals: 3,
    finePerDayCents: 25,
    gracePeriodDays: 3,
  },
  librarian: {
    maxActiveLoans: 20,
    loanDurationDays: 60,
    maxRenewals: 5,
    finePerDayCents: 0,
    gracePeriodDays: 7,
  },
  admin: {
    maxActiveLoans: 20,
    loanDurationDays: 60,
    maxRenewals: 5,
    finePerDayCents: 0,
    gracePeriodDays: 7,
  },
};

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  roles?: UserRole[];
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Catalogue",
    href: "/catalogue",
  },
  {
    title: "Circulation",
    href: "/circulation",
    roles: ["admin", "librarian"],
  },
  {
    title: "Members",
    href: "/members",
    roles: ["admin", "librarian"],
  },
  {
    title: "My Loans",
    href: "/my-loans",
    roles: ["student", "staff"],
  },
  {
    title: "Fines & Dues",
    href: "/fines",
  },
  {
    title: "Reports",
    href: "/reports",
    roles: ["admin", "librarian"],
  },
  {
    title: "Settings",
    href: "/settings",
    roles: ["admin"],
  },
];
