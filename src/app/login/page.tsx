"use client";

import { Suspense, useActionState, useState } from "react";
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
} from "lucide-react";
import { loginAction, type AuthActionResult } from "@/app/actions/auth";
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

  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {/* Login Card Form */}
      <Card className="border-zinc-200/80 shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Sign In</CardTitle>
          <CardDescription>
            Enter your organizational credentials below
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
                className="text-sm font-medium leading-none text-zinc-900"
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
                  className="text-sm font-medium leading-none text-zinc-900"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-700"
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
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
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
              disabled={isPending}
              className="w-full font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
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
                className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700"
              >
                Create a student account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 via-white to-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header & Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50 shadow-md">
            <BookOpen className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {siteConfig.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sign in to access your library account
          </p>
        </div>

        <Suspense fallback={
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
        }>
          <LoginForm />
        </Suspense>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-400">
          EduLibrary Management System &bull; Secure Authentication
        </p>
      </div>
    </main>
  );
}
