// src/config/demo-accounts.ts
export const DEMO_ACCOUNTS = [
  {
    role: "admin" as const,
    email: "admin@edulibrary.edu",
    password: "Admin@12345",
    fullName: "System Administrator",
    memberCode: "ADM-0001",
    department: "Library IT & Operations",
  },
  {
    role: "librarian" as const,
    email: "librarian@edulibrary.edu",
    password: "Librarian@12345",
    fullName: "Sarah Jenkins (Head Librarian)",
    memberCode: "LIB-0001",
    department: "Circulation & Catalogue",
  },
  {
    role: "staff" as const,
    email: "staff@edulibrary.edu",
    password: "Staff@12345",
    fullName: "Prof. David Miller",
    memberCode: "STF-0001",
    department: "Faculty of Science",
  },
  {
    role: "student" as const,
    email: "student@edulibrary.edu",
    password: "Student@12345",
    fullName: "Alex Rivera",
    memberCode: "STU-0001",
    gradeLevel: "Grade 11",
  },
];

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number];
