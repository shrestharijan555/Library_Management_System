import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Library,
  ArrowRightLeft,
  BookMarked,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const coreFeatures = [
    {
      icon: Library,
      title: "Comprehensive Catalogue",
      description:
        "Instant title search, detailed bibliographic records, ISBN indexing, and real-time physical copy availability tracking.",
    },
    {
      icon: ArrowRightLeft,
      title: "Fast Circulation Desk",
      description:
        "High-efficiency book checkouts, returns, renewal workflows, and barcode-driven counter processing.",
    },
    {
      icon: BookMarked,
      title: "Patron Borrowing Portal",
      description:
        "Personal self-service dashboard to manage active loans, track hold queues, receive pickup notifications, and review dues.",
    },
    {
      icon: ShieldCheck,
      title: "Role-Based Governance",
      description:
        "Fine-grained permissions and policy limits customized for students, faculty staff, librarians, and administrative managers.",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-150 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900">
              <BookOpen className="size-5" />
            </div>
            <span className="text-base text-zinc-900 dark:text-zinc-50">{siteConfig.name}</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/catalogue">
              <Button variant="ghost" size="sm">
                Browse Catalogue
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="flex flex-col items-start gap-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <Sparkles className="size-3.5 text-zinc-900 dark:text-zinc-100" />
            Institutional Library Operations System
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl dark:text-zinc-50">
            Intelligent library management for education.
          </h1>

          <p className="max-w-2xl text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
            A comprehensive, modern management platform designed for educational institutions.
            Search holdings, manage circulation queues, track patron loans, and streamline collections with precision.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                <span>Access Console</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/catalogue">
              <Button variant="outline" size="lg" className="gap-2">
                <Library className="size-4" />
                <span>Search Books</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Core Features Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {coreFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <Card
                key={feat.title}
                className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-md"
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{feat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed">
                    {feat.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Roles & Workflow Banner */}
        <div className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-6 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Tailored Access for Every User
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Role-specific workspaces designed for each stakeholder in the institutional library.
              </p>
            </div>
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto">
                <span>Try Demo Accounts</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default" className="text-[10px]">Student</Badge>
              </div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Patron Self-Service</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Browse catalogue, place hold requests, renew active loans, and check due dates and fines.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-[10px]">Staff</Badge>
              </div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Faculty & Personnel</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Extended borrowing quotas, longer loan durations, hold prioritization, and quick catalogue access.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-[10px]">Librarian</Badge>
              </div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Circulation Desk</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Barcode scan checkout and return, reservation fulfillment, member lookup, and collection curation.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default" className="text-[10px]">Admin</Badge>
              </div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">System Governance</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Member account administration, policy limit configuration, fines collection, audit logs, and reports.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
