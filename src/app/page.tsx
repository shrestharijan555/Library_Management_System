import {
  BookOpen,
  Database,
  ShieldCheck,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export default function Home() {
  const architecturalPillars = [
    {
      icon: Database,
      title: "Database & Drizzle ORM",
      description:
        "Complete schema with PostgreSQL enums, users, catalogue, inventory copies, loans, reservations, fines, and audit logs.",
      badge: "Configured",
      badgeVariant: "success" as const,
    },
    {
      icon: ShieldCheck,
      title: "Supabase Auth & RBAC",
      description:
        "Structured multi-role access control supporting Admin, Librarian, Staff, and Student roles with permission hierarchy.",
      badge: "Ready",
      badgeVariant: "info" as const,
    },
    {
      icon: Layers,
      title: "UI Design System",
      description:
        "Tailwind CSS v4 design tokens, Radix UI accessibility foundations, and modular UI primitives.",
      badge: "Active",
      badgeVariant: "default" as const,
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        {/* Header Section */}
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 px-3 py-1 font-medium">
              <Sparkles className="size-3.5 text-amber-600" />
              Phase 2: Database & Core Architecture
            </Badge>
            <Badge variant="secondary">v{siteConfig.version}</Badge>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            {siteConfig.name}
          </h1>

          <p className="max-w-2xl text-lg text-zinc-600">
            A production-oriented full-stack library management system for schools
            and educational institutions. Database schemas, domain models, role-based
            access control, and UI primitives are fully established.
          </p>
        </div>

        {/* Architectural Pillars Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {architecturalPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title} className="transition-all hover:shadow-md">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
                      <Icon className="size-5" />
                    </div>
                    <Badge variant={pillar.badgeVariant}>{pillar.badge}</Badge>
                  </div>
                  <CardTitle>{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {pillar.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Database Entities Summary */}
        <div className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50">
              <BookOpen className="size-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">
                Core Domain Entities
              </h2>
              <p className="text-sm text-zinc-500">
                PostgreSQL schema definitions and relations mapped in Drizzle ORM
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {[
              "Users & Roles",
              "Books & ISBN",
              "Authors",
              "Categories",
              "Publishers",
              "Book Copies",
              "Circulation Loans",
              "Reservations",
              "Fines & Dues",
              "Audit Logs",
              "System Settings",
              "Policies Matrix",
            ].map((entity) => (
              <div
                key={entity}
                className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-xs font-medium text-zinc-700"
              >
                <ArrowRight className="size-3 text-zinc-400" />
                <span>{entity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
