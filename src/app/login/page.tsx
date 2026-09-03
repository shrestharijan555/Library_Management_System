// src/app/login/page.tsx
"use client";

import { Suspense, useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MailWarning,
  Shield,
  Sparkles,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { loginAction, type AuthActionResult } from "@/app/actions/auth";
import { seedDemoAccountsAction, DEMO_ACCOUNTS } from "@/app/actions/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";

function LoginForm() {
  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(loginAction, null);

  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const [seedNotice, setSeedNotice] = useState<string | null>(null);
  const [isSeeding, startSeeding] = useTransition();

  const handleSelectDemo = (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedRole(account.role);
  };

  const handleSeedAccounts = () => {
    setSeedNotice(null);
    startSeeding(async () => {
      const res = await seedDemoAccountsAction();
      if (res.error) {
        setSeedNotice(`Error: ${res.error}`);
      } else {
        setSeedNotice(res.message || "Demo accounts provisioned successfully!");
      }
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return Shield;
      case "librarian":
        return BookOpen;
      case "staff":
        return Briefcase;
      default:
        return GraduationCap;
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Demo Accounts Pill Selector */}
      <div className="p-3.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-500" />
            Quick Demo Autofill:
          </span>
          <button
            type="button"
            onClick={handleSeedAccounts}
            disabled={isSeeding}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
          >
            {isSeeding ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Provisioning...
              </>
            ) : (
              "Provision/Sync Demo Users"
            )}
          </button>
        </div>

        {seedNotice && (
          <div className="text-[11px] p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
            <span>{seedNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = getRoleIcon(acc.role);
            const isSelected = selectedRole === acc.role;
            return (
              <button
                type="button"
                key={acc.role}
                onClick={() => handleSelectDemo(acc)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 shadow-xs ring-1 ring-indigo-600"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon
                    className={`size-3.5 ${
                      isSelected
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-zinc-400"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold uppercase font-mono ${
                      isSelected
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-zinc-500"
                    }`}
                  >
                    {acc.role}
                  </span>
                </div>
                <div className="truncate text-[11px] font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                  {acc.fullName.split(" ")[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Login Card Form */}
      <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials or click a role above
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-4">
            {/* Password Reset Success Banner */}
            {resetSuccess && !state?.error && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 text-sm text-emerald-900"
              >
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                <span>Your password has been updated successfully. Please sign in with your new password.</span>
              </div>
            )}

            {/* Global Error Banner */}
            {state?.error && !state?.emailUnverified && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/80 p-3 text-sm text-red-800"
              >
                <AlertCircle className="size-5 shrink-0 text-red-600" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Email Unverified Banner */}
            {state?.emailUnverified && (
              <div
                role="alert"
                className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-900 shadow-sm"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <MailWarning className="size-5 shrink-0 text-amber-600" />
                  <span>Email Verification Required</span>
                </div>
                <p className="text-xs leading-relaxed">{state.error}</p>
                <Link
                  href="/verify-email"
                  className="mt-1 inline-flex items-center justify-center rounded-md bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900 transition-colors"
                >
                  Go to Email Verification
                </Link>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@school.edu"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedRole(null);
                  }}
                  required
                  disabled={isPending}
                  className="pl-9"
                  aria-describedby={
                    state?.fieldErrors?.email ? "email-error" : undefined
                  }
                />
              </div>
              {state?.fieldErrors?.email && (
                <p id="email-error" className="text-xs font-medium text-red-600">
                  {state.fieldErrors.email[0]}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedRole(null);
                  }}
                  required
                  disabled={isPending}
                  className="pl-9 pr-10"
                  aria-describedby={
                    state?.fieldErrors?.password ? "password-error" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {state?.fieldErrors?.password && (
                <p id="password-error" className="text-xs font-medium text-red-600">
                  {state.fieldErrors.password[0]}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              disabled={isPending || !email || !password}
              className="w-full font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center text-xs text-zinc-500">
              Need an account?{" "}
              <Link
                href="/register"
                className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4 hover:text-zinc-700"
              >
                Create a student account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header & Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 shadow-md">
            <BookOpen className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {siteConfig.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to access your library console and account
          </p>
        </div>

        <Suspense
          fallback={
            <Card className="border-zinc-200/80 shadow-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Sign In</CardTitle>
                <CardDescription>
                  Enter your organizational credentials below
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-zinc-400" />
              </CardContent>
            </Card>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-400">
          EduLibrary Management System &bull; Secure Supabase Authentication
        </p>
      </div>
    </main>
  );
}
