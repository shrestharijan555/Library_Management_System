import { requireAuthUser } from "@/lib/auth/session";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Shield,
  CreditCard,
  Mail,
  LogOut,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { siteConfig } from "@/config/site";

export default async function DashboardPage() {
  // Server-side route protection: redirects to /login if unauthenticated or non-active
  const { appUser } = await requireAuthUser();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "librarian":
        return "default";
      case "staff":
        return "info";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-900">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50">
              <BookOpen className="size-4" />
            </div>
            <div>
              <span className="font-semibold text-zinc-900">
                {siteConfig.name}
              </span>
              <span className="ml-2 rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 font-medium">
                Authenticated App Area
              </span>
            </div>
          </div>

          <form action={logoutAction}>
            <Button variant="outline" size="sm" type="submit" className="gap-2">
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </Button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="space-y-8">
          {/* Welcome Banner */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                Welcome back, {appUser.fullName}
              </h1>
              <p className="text-zinc-500">
                Your authenticated session and profile have been resolved from PostgreSQL.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant(appUser.role)} className="px-3 py-1 text-xs font-semibold capitalize">
                <Shield className="mr-1.5 size-3.5 inline" />
                {appUser.role} Account
              </Badge>
              <Badge variant="success" className="px-3 py-1 text-xs font-semibold capitalize">
                <CheckCircle2 className="mr-1.5 size-3.5 inline" />
                {appUser.status}
              </Badge>
            </div>
          </div>

          {/* User Session Profile Card */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="size-5 text-zinc-700" />
                Application User Profile
              </CardTitle>
              <CardDescription>
                Server-side identity verification via Drizzle ORM and Supabase Auth
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Full Name
                </span>
                <p className="text-base font-semibold text-zinc-900">
                  {appUser.fullName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Member Code / ID
                </span>
                <p className="text-base font-semibold text-zinc-900 flex items-center gap-1.5">
                  <CreditCard className="size-4 text-zinc-500" />
                  {appUser.memberCode}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Email Address
                </span>
                <p className="text-base font-semibold text-zinc-900 flex items-center gap-1.5 truncate">
                  <Mail className="size-4 text-zinc-500" />
                  {appUser.email}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Role
                </span>
                <p className="text-base font-semibold text-zinc-900 capitalize">
                  {appUser.role}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Account Status
                </span>
                <p className="text-base font-semibold text-emerald-700 capitalize">
                  {appUser.status}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Department / Class
                </span>
                <p className="text-base font-semibold text-zinc-900">
                  {appUser.department || appUser.gradeClass || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
